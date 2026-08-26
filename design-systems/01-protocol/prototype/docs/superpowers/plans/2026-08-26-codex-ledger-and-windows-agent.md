# Codex 跨设备账本与 Windows 静默上报 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 Codex 主排行改为与官方一致的含缓存总 token，并按唯一轮次跨设备、跨账号去重累加，同时提供不含缓存和当前官方价格的费用排行，彻底消除 Windows 每 30 分钟的控制台弹窗。

**Architecture:** 客户端从原生 Codex JSONL 抽取匿名轮次账本，用 `session_id + turn_id` 的哈希作为稳定键，并把累计计数先差分再按轮次合并。服务端在 Redis 中维护用户级 canonical turn ledger，以设备 manifest 做幂等增删，然后从账本重建 lifetime、daily、model 和 cost 汇总；旧设备数据按设备逐步退出。排行榜只消费这套 canonical aggregation，定价集中在单一模块；Windows 计划任务通过 `wscript.exe` 隐藏启动 PowerShell。

**Tech Stack:** Astro 7、TypeScript 5.9、Node.js ESM/`node:test`、ioredis、PowerShell Task Scheduler、VBScript launcher。

**Spec:** `docs/superpowers/specs/2026-08-26-codex-ledger-and-windows-agent-design.md`

## Global Constraints

- Codex `total = input_tokens + output_tokens`，缓存读取/写入是 input 的组成部分，不能重复加，也不能从主值中扣除。
- `norm = max(0, input_total - cache_read - cache_write) + output`。
- 同一 T Salon 用户的不同设备、不同历史 Codex 账号的唯一轮次累加；相同 `turn_key` 只计一次。
- 不上传代码、对话文本、提示词、文件路径、项目名、邮箱或 Codex 登录凭据。
- GPT-5.6 Sol 当前快照为 input `$4/MTok`、cached input `$0.40/MTok`、output `$20/MTok`、cache write `$5/MTok`；Terra 为 `$2/$0.20/$12/$2.50`；Luna 为 `$0.20/$0.02/$1.20/$0.25`。
- Claude Fable 5 为 input `$10/MTok`、cache hit `$1/MTok`、5m cache write `$12.50/MTok`、output `$50/MTok`；Claude 3.5 Sonnet 为 `$3/$0.30/$3.75/$15`。
- GPT-5.6 单次模型调用 input 超过 `272,000` 时，input/cached/cache-write 使用 `2x`，output 使用 `1.5x`；Claude Fable 5 的 1M context 按标准价，不套用 GPT 倍率。
- 价格快照日期固定为 `2026-08-26` 并在 API/UI 中展示；费用标注为等效 API 成本，不代表订阅扣费。
- Windows 保留 AtLogOn、每 30 分钟、`IgnoreNew`、15 分钟超时和失败重试，但计划任务 Action 必须是 `wscript.exe`。
- Mac LaunchAgent、自更新安装命令及 Claude、WorkBuddy 等非 Codex 工具继续工作。
- 不新增运行时依赖；测试使用仓库现有 Node.js 与 `node:test`。
- 不提交或改写仓库根目录现有 `.workbuddy/memory/*` 用户改动。

---

### Task 1: 原生 Codex 匿名轮次解析器

**Files:**
- Create: `public/scripts/codex-ledger.mjs`
- Create: `scripts/codex-ledger.test.mjs`
- Create: `scripts/helpers/codex-fixtures.mjs`
- Modify: `public/scripts/agent.mjs:172-257,329-506,685-784`
- Modify: `scripts/token-agent.test.mjs:1-100`
- Modify: `package.json:6-19`

**Interfaces:**
- Produces: `scanCodexLedger(home: string, options?: { onProgress?: Function }): Promise<CodexLedgerScan>`。
- Produces: `normalizeCodexUsage(raw: object): UsageCounters`，字段为 `input_total, net_new_input, output, cache_read, cache_write, total, norm`。
- Produces: `CodexTurnRecord = { turn_key, session_key, model, input_total, net_new_input, output, cache_read, cache_write, total, norm, pricing_tiers, daily }`。
- Produces for tests: `tempHome(t), writeSession(home, fileName, events), sessionMeta(id), turnContext(id, model), tokenCount(timestamp, usage), writeTurn(...), emptyTier(), turnRecord(...)` from `scripts/helpers/codex-fixtures.mjs`。
- Consumes later: `CodexLedgerScan.records` 由 Task 3 的服务端账本接收；`CodexLedgerScan.summary` 继续供命令行显示和旧服务端兼容。

- [ ] **Step 1: 写出失败的缓存语义、累计差分和跨账号测试**

```js
import { scanCodexLedger } from '../public/scripts/codex-ledger.mjs';
import { sessionMeta, tempHome, tokenCount, turnContext, writeSession, writeTurn } from './helpers/codex-fixtures.mjs';

test('cached input remains inside total and only norm excludes it', async (t) => {
  const home = tempHome(t);
  writeSession(home, 'account-a.jsonl', [
    sessionMeta('session-a'),
    turnContext('turn-a', 'gpt-5.6-sol'),
    tokenCount('2026-08-18T02:00:00Z', {
      total_tokens: 110, input_tokens: 100, output_tokens: 10,
      cached_input_tokens: 60, cache_write_input_tokens: 0,
    }),
    tokenCount('2026-08-18T02:00:01Z', {
      total_tokens: 250, input_tokens: 225, output_tokens: 25,
      cached_input_tokens: 180, cache_write_input_tokens: 0,
    }),
    tokenCount('2026-08-18T02:00:01Z', {
      total_tokens: 250, input_tokens: 225, output_tokens: 25,
      cached_input_tokens: 180, cache_write_input_tokens: 0,
    }),
  ]);

  const scan = await scanCodexLedger(home);
  assert.equal(scan.records.length, 1);
  assert.equal(scan.summary.total, 250);
  assert.equal(scan.summary.norm, 70);
  assert.equal(scan.summary.cache_read, 180);
});

test('different historical accounts add while replayed turns dedupe', async (t) => {
  const home = tempHome(t);
  writeTurn(home, 'one.jsonl', 'session-a', 'turn-a', 110);
  writeTurn(home, 'fork-replay.jsonl', 'session-a', 'turn-a', 110);
  writeTurn(home, 'account-b.jsonl', 'session-b', 'turn-b', 220);
  const scan = await scanCodexLedger(home);
  assert.equal(scan.records.length, 2);
  assert.equal(scan.summary.total, 330);
});
```

测试夹具使用以下确定性实现；fixture 只构造匿名 JSONL，不写提示词或项目内容：

```js
export function tempHome(t) {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'tsalon-ledger-test-'));
  t.after(() => fs.rmSync(home, { recursive: true, force: true }));
  return home;
}
export const sessionMeta = (id) => ({ type: 'session_meta', timestamp: '2026-08-18T00:00:00Z', payload: { id } });
export const turnContext = (turn_id, model) => ({ type: 'turn_context', timestamp: '2026-08-18T00:00:01Z', payload: { turn_id, model } });
export const tokenCount = (timestamp, total_token_usage) => ({ type: 'event_msg', timestamp, payload: { type: 'token_count', info: { total_token_usage } } });
export function writeSession(home, fileName, events) {
  const dir = path.join(home, '.codex', 'sessions', '2026', '08', '18');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, fileName), events.map(JSON.stringify).join('\n'));
}
export function writeTurn(home, fileName, sessionId, turnId, total) {
  writeSession(home, fileName, [
    sessionMeta(sessionId), turnContext(turnId, 'gpt-5.6-sol'),
    tokenCount('2026-08-18T02:00:00Z', { total_tokens: total, input_tokens: total, output_tokens: 0, cached_input_tokens: 0 }),
  ]);
}
export const emptyTier = () => ({ net_new_input: 0, cache_read: 0, cache_write: 0, output: 0 });
export function turnRecord(turn_key, total, overrides = {}) {
  const stableKey = createHash('sha256').update(turn_key).digest('hex');
  const base = { turn_key: stableKey, session_key: 'a'.repeat(64), model: 'gpt-5.6-sol',
    input_total: total, net_new_input: total, output: 0, cache_read: 0, cache_write: 0,
    total, norm: total, pricing_tiers: { base: { ...emptyTier(), net_new_input: total }, long: emptyTier() } };
  return { ...base, daily: { '2026-08-18': { ...base, turn_key: undefined, session_key: undefined, model: undefined, daily: undefined } }, ...overrides };
}
export const ledgerPayload = (records) => ({
  version: 5,
  full_sync: true,
  manifest_hash: createHash('sha256').update(records.map((r) => r.turn_key).sort().join('\n')).digest('hex'),
  records,
});
```

- [ ] **Step 2: 运行新测试并确认模块尚不存在**

Run: `node --test scripts/codex-ledger.test.mjs`

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `public/scripts/codex-ledger.mjs`。

- [ ] **Step 3: 实现稳定键、相邻差分、日桶和 v5 文件缓存**

```js
const COUNTERS = ['input_total', 'net_new_input', 'output', 'cache_read', 'cache_write', 'total', 'norm'];

export function normalizeCodexUsage(raw = {}) {
  const inputTotal = positiveInt(raw.input_tokens);
  const output = positiveInt(raw.output_tokens);
  const cacheRead = positiveInt(raw.cached_input_tokens ?? raw.cache_read_input_tokens);
  const cacheWrite = positiveInt(raw.cache_write_input_tokens);
  const total = positiveInt(raw.total_tokens) || inputTotal + output;
  const netNewInput = Math.max(0, inputTotal - cacheRead - cacheWrite);
  return { input_total: inputTotal, net_new_input: netNewInput, output,
    cache_read: cacheRead, cache_write: cacheWrite, total, norm: netNewInput + output };
}

function turnKey(sessionId, turnId) {
  return createHash('sha256').update(`${sessionId}|${turnId}`).digest('hex');
}

function usageDelta(current, previous) {
  if (!previous || current.total < previous.total) return current;
  return Object.fromEntries(COUNTERS.map((key) => [key, Math.max(0, current[key] - previous[key])]));
}
```

解析器必须：在每个嵌入的 `session_meta` 处切换 session 并重置累计基线；在 `turn_context` 处记录 `turn_id/model`；对重复累计事件产生零增量；累计字段缺失时只使用一次稳定指纹去重后的 `last_token_usage`；按事件时间写入北京时间 `daily`；按单次调用 input 是否超过 272K 写入 `pricing_tiers.base/long`；同一 `turn_key` 在多个文件出现时保留字段更完整、`total` 更大的版本。缓存写入 `~/.tsalon/codex-session-cache-v5.json`，只保存相对路径、size、mtime 和匿名 records。

- [ ] **Step 4: 增加跨日、模型前缀和缓存命中测试并跑绿**

```js
test('one turn crossing Beijing midnight keeps two exact daily buckets', async (t) => {
  const home = tempHome(t);
  writeSession(home, 'cross-midnight.jsonl', [
    sessionMeta('session-midnight'), turnContext('turn-midnight', 'gpt-5.6-sol'),
    tokenCount('2026-08-18T15:59:59Z', { total_tokens: 110, input_tokens: 100, output_tokens: 10, cached_input_tokens: 60 }),
    tokenCount('2026-08-18T16:00:01Z', { total_tokens: 220, input_tokens: 200, output_tokens: 20, cached_input_tokens: 120 }),
  ]);
  const first = await scanCodexLedger(home);
  assert.deepEqual(Object.keys(first.records[0].daily).sort(), ['2026-08-18', '2026-08-19']);
  assert.equal(Object.values(first.records[0].daily).reduce((sum, day) => sum + day.total, 0), first.records[0].total);
  const second = await scanCodexLedger(home);
  assert.deepEqual(second, first);
  assert.equal(second.files.cached, second.files.total);
});
```

Run: `node --test scripts/codex-ledger.test.mjs scripts/token-agent.test.mjs`

Expected: PASS；旧测试期望值更新为 `codex.total = input + output`、`codex.norm = total - cache_read - cache_write`。

- [ ] **Step 5: 将 agent 切换到原生 ledger，原生 session 存在时屏蔽 CodexManager `openai_account` 镜像**

```js
const ledger = await scanCodexLedger(home, { onProgress });
tokens.codex = ledger.summary;
tokens.ledger = { version: 5, full_sync: true, records: ledger.records };

if (!ledger.hasNativeSessions && source === 'openai_account') {
  // explicit compatibility fallback only
  addManagerFallback(tokens.codex, row);
}
```

`main()` 的上传 payload 增加 `codex_ledger = { version: 5, full_sync: true, manifest_hash, records }`，其中 `manifest_hash` 是排序后 `turn_key` 列表的 SHA-256；日志改为 `Total / No-cache / Cache`，不再把主值称为 effective。`.opencodex/usage.jsonl` 和非 `openai_account` 的第三方记录仍归 `codex_proxy`。单个损坏 JSONL 只输出路径哈希和错误类型，其余文件继续；上传失败时 records 仍在本地 v5 cache 中，下一次 full sync 自动重试。

- [ ] **Step 6: 运行采集器完整测试并提交**

Run: `npm run test:token-agent`

Expected: PASS，且测试确认 payload 不含 session 路径、标题和文本。

```bash
git add public/scripts/codex-ledger.mjs public/scripts/agent.mjs scripts/codex-ledger.test.mjs scripts/helpers/codex-fixtures.mjs scripts/token-agent.test.mjs package.json
git commit -m "Fix Codex turn-level token extraction"
```

---

### Task 2: 官方价格快照与纯账本聚合域

**Files:**
- Create: `src/lib/token-pricing.mjs`
- Create: `src/lib/tokenrank-domain.mjs`
- Create: `scripts/tokenrank-domain.test.mjs`
- Modify: `package.json:6-19`

**Interfaces:**
- Produces: `PRICING_SNAPSHOT_DATE = '2026-08-26'`。
- Produces: `normalizeModelId(model: string): { id: string, estimated: boolean }`。
- Produces: `priceUsage(model: string, pricingTiers: PricingTiers): { usd: number, estimated: boolean }`。
- Produces: `validateTurnRecord(raw): CodexTurnRecord | null`。
- Produces: `reconcileDeviceTurns(existing, deviceId, incoming): CanonicalTurnMap`；每个 value 为 `{ record, device_versions, source_devices }`，聚合只读取 `record`。
- Produces: `aggregateCanonicalTurns(turns): { lifetime, daily, models }`。
- Produces: `metricValue(aggregate, metric: 'total'|'norm'|'cost'): number`。
- Produces: `sortRankRows(rows, metric)` used by Task 5；sort is descending and uses `userId` ascending as the deterministic tie-breaker。

- [ ] **Step 1: 写出价格、别名和跨设备去重失败测试**

```js
test('GPT-5.6 Sol prices cache as a subset of input', () => {
  const result = priceUsage('CodexManager/gpt-5.6-sol', {
    base: { net_new_input: 40, cache_read: 60, cache_write: 0, output: 10 },
    long: emptyTier(),
  });
  assert.equal(result.usd, 0.000384);
  assert.equal(result.estimated, false);
});

test('long context applies 2x input and 1.5x output', () => {
  const result = priceUsage('gpt-5.6-sol', {
    base: emptyTier(),
    long: { net_new_input: 50_000, cache_read: 250_000, cache_write: 0, output: 10_000 },
  });
  assert.equal(result.usd, 0.9);
});

test('same turn on two devices counts once', () => {
  const shared = turnRecord('same', 110);
  const windowsOnly = turnRecord('windows-only', 220);
  let turns = reconcileDeviceTurns({}, 'mac', [shared]);
  turns = reconcileDeviceTurns(turns, 'windows', [shared, windowsOnly]);
  const sum = aggregateCanonicalTurns(turns);
  assert.equal(sum.lifetime.total, 330);
  assert.deepEqual(turns[shared.turn_key].source_devices.sort(), ['mac', 'windows']);
});
```

- [ ] **Step 2: 运行测试并确认模块尚不存在**

Run: `node --test scripts/tokenrank-domain.test.mjs`

Expected: FAIL with `ERR_MODULE_NOT_FOUND`。

- [ ] **Step 3: 实现唯一价格表和模型别名**

```js
export const PRICING_SNAPSHOT_DATE = '2026-08-26';
export const MODEL_PRICING = Object.freeze({
  'gpt-5.6-sol':   { input: 4, cacheRead: 0.4, cacheWrite: 5, output: 20 },
  'gpt-5.6-terra': { input: 2, cacheRead: 0.2, cacheWrite: 2.5, output: 12 },
  'gpt-5.6-luna':  { input: 0.2, cacheRead: 0.02, cacheWrite: 0.25, output: 1.2 },
  'claude-fable-5': { input: 10, cacheRead: 1, cacheWrite: 12.5, output: 50 },
  'claude-3-5-sonnet': { input: 3, cacheRead: 0.3, cacheWrite: 3.75, output: 15 },
});

export function normalizeModelId(raw = '') {
  const id = raw.toLowerCase().split('/').at(-1);
  if (MODEL_PRICING[id]) return { id, estimated: false };
  if (id.startsWith('claude-3-5-sonnet')) return { id: 'claude-3-5-sonnet', estimated: false };
  if (id === 'gpt-5.6' || id.startsWith('gpt-5.6-sol')) return { id: 'gpt-5.6-sol', estimated: id !== 'gpt-5.6' };
  return { id: 'gpt-5.6-sol', estimated: true };
}
```

`priceUsage` 分别对 base 和 long 桶计价；未知模型必须返回 `estimated: true`。定价来源 URL 写入导出常量，UI 不再自带另一份 PRICING。

- [ ] **Step 4: 实现 record 校验、设备 manifest 对账和 lifetime/daily/model 聚合**

```js
export function reconcileDeviceTurns(existing, deviceId, incoming) {
  const next = structuredClone(existing);
  const incomingKeys = new Set(incoming.map((record) => record.turn_key));
  for (const [key, envelope] of Object.entries(next)) {
    if (!envelope.device_versions[deviceId] || incomingKeys.has(key)) continue;
    delete envelope.device_versions[deviceId];
    if (Object.keys(envelope.device_versions).length === 0) delete next[key];
    else next[key] = materializeEnvelope(envelope.device_versions);
  }
  for (const record of incoming) {
    const versions = { ...(next[record.turn_key]?.device_versions || {}), [deviceId]: record };
    next[record.turn_key] = materializeEnvelope(versions);
  }
  return next;
}
```

`materializeEnvelope` 从各设备版本中按字段完整度、`total`、稳定 device id 顺序选择当前 `record`，并生成排序后的 `source_devices`。校验拒绝非 64 位十六进制键、非法日期、负数/非有限数、字段和不一致、单轮 `total > 1e12`、超过 50,000 条 records 的 payload。`aggregateCanonicalTurns` 的 lifetime 顶层值必须等于 daily 之和，cost 只调用 `priceUsage`。

- [ ] **Step 5: 跑绿域测试并提交**

Run: `node --test scripts/tokenrank-domain.test.mjs`

Expected: PASS，包括“较大设备版本删除后降级到另一设备较小版本”、“设备删除本地 turn 时仅移除该设备 source，另一设备仍保留”、“重复 full sync 幂等”和“未知模型标记估算”。

```bash
git add src/lib/token-pricing.mjs src/lib/tokenrank-domain.mjs scripts/tokenrank-domain.test.mjs package.json
git commit -m "Add canonical Codex ledger domain"
```

---

### Task 3: Redis canonical ledger 同步与 daily 重建

**Files:**
- Create: `src/lib/codex-ledger.ts`
- Create: `scripts/codex-ledger-store.test.mjs`
- Create: `scripts/helpers/fake-redis.mjs`
- Modify: `src/lib/kv.ts:64-529`
- Modify: `package.json:6-19`

**Interfaces:**
- Consumes: Task 1 `CodexLedgerPayload` 与 Task 2 的校验/聚合函数。
- Produces: `syncCodexLedger(redis, userId, deviceId, payload): Promise<CodexLedgerSummary>`。
- Produces for tests: `FakeRedis` implementing `get/set/del/hgetall/hset/hdel/lrange/rpush/scan/pipeline` with the same return shapes used by `syncCodexLedger`。
- Produces: Redis hash `user:{userId}:codex:turns`，field 为 `turn_key`，value 为 canonical record JSON。
- Produces: Redis key `user:{userId}:device:{deviceId}:codex-ledger-version = 5`。
- Produces: Redis key `user:{userId}:device:{deviceId}:codex-manifest` containing only sorted turn hashes and `manifest_hash`。
- Produces: `TimeseriesEvent` 新字段 `normTokens`, `costUsd`, `pricingEstimated`, `pricingSnapshotDate`。

- [ ] **Step 1: 写出 fake Redis 集成失败测试**

```js
import { FakeRedis } from './helpers/fake-redis.mjs';
import { ledgerPayload, turnRecord } from './helpers/codex-fixtures.mjs';

test('full sync is idempotent and rebuilds one canonical daily event', async () => {
  const redis = new FakeRedis();
  await syncCodexLedger(redis, 'u1', 'mac', ledgerPayload([turnRecord('same', 110)]));
  await syncCodexLedger(redis, 'u1', 'windows', ledgerPayload([turnRecord('same', 110)]));
  const summary = await syncCodexLedger(redis, 'u1', 'windows', ledgerPayload([turnRecord('same', 110)]));
  assert.equal(summary.lifetime.total, 110);
  const events = await redis.lrange('user:u1:timeseries:2026-08-18', 0, -1);
  assert.equal(events.filter((raw) => JSON.parse(raw).source === 'codex-ledger-v5').length, 1);
});
```

- [ ] **Step 2: 运行测试并确认存储模块尚不存在**

Run: `node --test scripts/codex-ledger-store.test.mjs`

Expected: FAIL with `ERR_MODULE_NOT_FOUND` 或 missing export。

- [ ] **Step 3: 实现 Redis 同步、设备 source 维护和账本事件重建**

```ts
export async function syncCodexLedger(redis, userId, deviceId, payload) {
  const key = `user:${userId}:codex:turns`;
  const raw = await redis.hgetall(key);
  const existing = Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, JSON.parse(v)]));
  const incoming = payload.records.map(validateTurnRecord);
  if (incoming.some((record) => !record)) throw new Error('Invalid Codex ledger record');
  const canonical = reconcileDeviceTurns(existing, deviceId, incoming);
  await replaceHash(redis, key, canonical);
  await redis.set(`user:${userId}:device:${deviceId}:codex-ledger-version`, '5');
  const summary = aggregateCanonicalTurns(canonical);
  await rebuildCodexLedgerTimeseries(redis, userId, summary.daily);
  await redis.set(`user:${userId}:codex:summary`, JSON.stringify(summary));
  return summary;
}
```

`rebuildCodexLedgerTimeseries` 只删除 `source === 'codex-ledger-v5'` 的旧事件，保留其他工具；按 date+model 写一条 canonical 事件。当前设备首次 v5 同步时，删除该设备旧 `codex/codex_proxy` timeseries，防止已迁移设备同时贡献 legacy 和 ledger。

- [ ] **Step 4: 让 `updateTokenUsage` 在现有用户锁内调用 ledger，同步异常时 finally 释放锁**

```ts
export interface TokenUpdateOptions {
  historyData?: Record<string, Record<string, any>> | null;
  historyCompleteTools?: string[];
  codexLedger?: CodexLedgerPayload | null;
  accountAudit?: CodexAccountAudit | null;
}

export async function updateTokenUsage(userId, name, image, tokens, deviceId = 'default_device', options: TokenUpdateOptions = {}) {
  // acquire lock
  try {
    const codexSummary = options.codexLedger
      ? await syncCodexLedger(kv, userId, deviceId, options.codexLedger)
      : null;
    // existing non-Codex update path
  } finally {
    await releaseUserLock(lockKey, lockId);
  }
}
```

- [ ] **Step 5: 跑绿存储与旧工具回归测试并提交**

Run: `node --test scripts/codex-ledger-store.test.mjs scripts/tokenrank-domain.test.mjs`

Expected: PASS；fake Redis 断言 ledger 重建不删除 Claude 事件。

```bash
git add src/lib/codex-ledger.ts src/lib/kv.ts scripts/codex-ledger-store.test.mjs scripts/helpers/fake-redis.mjs package.json
git commit -m "Store canonical Codex turns in Redis"
```

---

### Task 4: 上传协议 v5 与逐设备 legacy 迁移

**Files:**
- Modify: `src/pages/api/rank/upload.ts:8-75`
- Modify: `src/lib/kv.ts:92-529`
- Modify: `src/lib/tokenrank-domain.mjs`
- Modify: `public/scripts/agent.mjs:685-784`
- Create: `scripts/tokenrank-upload.test.mjs`

**Interfaces:**
- Consumes: request fields `codex_ledger` 与可选 `account_audit`。
- Produces: upload response `{ success, message, schema_version: 5, codex: { total, norm, cost, turns }, pricing_snapshot_date }`。
- Produces: pure `normalizeToolTokens(tool, raw)` and `normalizeDeviceUpload(tokens, { hasCodexLedger })` in `src/lib/tokenrank-domain.mjs` so compatibility behavior is unit-testable without Redis。
- Compatibility: v4 `raw_total` 立即规范为 Codex 主 `total`，并推导 `norm`，不会继续展示 600 万。

- [ ] **Step 1: 写出 v4 兼容与 v5 迁移失败测试**

```js
test('legacy Codex raw_total becomes main total instead of cache-subtracted total', () => {
  const normalized = normalizeToolTokens('codex', {
    total: 6_089_897, raw_total: 185_053_353, in: 184_486_751,
    out: 566_602, cache_read: 178_963_456, cache_write: 0,
  });
  assert.equal(normalized.total, 185_053_353);
  assert.equal(normalized.norm, 6_089_897);
});

test('v5 device data removes legacy Codex snapshot but preserves Claude', () => {
  const normalized = normalizeDeviceUpload(input, { hasCodexLedger: true });
  assert.equal(normalized.codex, undefined);
  assert.equal(normalized.codex_proxy, undefined);
  assert.ok(normalized.claude);
});
```

- [ ] **Step 2: 运行测试并看到旧减缓存逻辑导致失败**

Run: `node --test scripts/tokenrank-upload.test.mjs`

Expected: FAIL，actual Codex total 为 `6,089,897` 而不是 `185,053,353`。

- [ ] **Step 3: 在 API 边界校验 v5 payload 并切换 `updateTokenUsage` options**

```ts
const codexLedger = body.codex_ledger?.version === 5 ? body.codex_ledger : null;
await updateTokenUsage(userId, name, image, dynamicTokens, actualDeviceId, {
  historyData,
  historyCompleteTools,
  codexLedger,
  accountAudit: body.account_audit ?? null,
});
```

`codex_ledger` 存在时，从该设备 snapshot 和历史事件中移除 `codex/codex_proxy`；最终用户 profile 的 Codex 部分注入 canonical ledger summary。未升级设备继续贡献 legacy snapshot，升级后自动退出，重复迁移不得再次相减。

- [ ] **Step 4: 修复全部 legacy Codex 规范化路径**

```ts
export function normalizeToolTokens(tool, raw) {
  const value = typeof raw === 'number' ? numericFallback(raw) : { ...raw };
  if (tool === 'codex' || tool === 'codex_proxy') {
    const total = Number(value.raw_total ?? value.total) || 0;
    value.total = total;
    value.raw_total = total;
    value.norm = Number.isFinite(Number(value.norm))
      ? Number(value.norm)
      : Math.max(0, total - (Number(value.cache_read) || 0) - (Number(value.cache_write) || 0));
  }
  return value;
}
```

`getLeaderboard` 和 `getUserAnalytics` 对旧 `agent-history-v2` 事件使用 `rawTokens` 作为 total、原 `tokens` 作为 norm；不得再出现 `rawTotal - cacheRead` 被命名为主 total 的分支。

- [ ] **Step 5: 跑绿上传/迁移回归并提交**

Run: `node --test scripts/tokenrank-upload.test.mjs scripts/codex-ledger-store.test.mjs scripts/token-agent.test.mjs`

Expected: PASS。

```bash
git add src/pages/api/rank/upload.ts src/lib/kv.ts src/lib/tokenrank-domain.mjs public/scripts/agent.mjs scripts/tokenrank-upload.test.mjs
git commit -m "Migrate Codex uploads to canonical totals"
```

---

### Task 5: total / norm / cost 排行与中英文页面统一

**Files:**
- Modify: `src/lib/kv.ts:531-718`
- Modify: `src/pages/api/rank/list.ts:5-35`
- Modify: `src/pages/tokenrank/index.astro:9-330`
- Modify: `src/pages/en/tokenrank/index.astro:9-336`
- Modify: `src/pages/tokenrank/user/[id].astro:8-330,380-590`
- Modify: `src/pages/en/tokenrank/user/[id].astro:8-325,376-586`
- Modify: `src/components/ShareModal.astro`
- Create: `scripts/tokenrank-metrics.test.mjs`

**Interfaces:**
- Changes: `getLeaderboard(limit = 100, time = 'all', metric: RankMetric = 'total')`。
- Changes: `getGlobalStats(leaderboardData = null, metric: RankMetric = 'total')`。
- Produces: every row has `metrics: { total, norm, cost }` while `tokens.total` remains total token。
- Produces: list API top-level `metric` and `pricing_snapshot_date`。

- [ ] **Step 1: 写出 metric 排序和 API 参数失败测试**

```js
test('metric selector ranks the same rows by the selected value', () => {
  const rows = [
    { userId: 'cache-heavy', metrics: { total: 1_000, norm: 100, cost: 1 } },
    { userId: 'fresh-heavy', metrics: { total: 500, norm: 400, cost: 2 } },
  ];
  assert.deepEqual(sortRankRows(rows, 'total').map((r) => r.userId), ['cache-heavy', 'fresh-heavy']);
  assert.deepEqual(sortRankRows(rows, 'norm').map((r) => r.userId), ['fresh-heavy', 'cache-heavy']);
  assert.deepEqual(sortRankRows(rows, 'cost').map((r) => r.userId), ['fresh-heavy', 'cache-heavy']);
});
```

- [ ] **Step 2: 运行测试确认当前只按 `tokens.total` 排序**

Run: `node --test scripts/tokenrank-metrics.test.mjs`

Expected: FAIL with missing `sortRankRows`/metric support。

- [ ] **Step 3: 实现 lifetime ZSET 和时间窗 metric 聚合**

```ts
export type RankMetric = 'total' | 'norm' | 'cost';

const metricOf = (row: UserRankData, metric: RankMetric) => Number(row.metrics?.[metric]) || 0;

// update profile
await kv.zadd('leaderboard:total', metrics.total, userId);
await kv.zadd('leaderboard:norm', metrics.norm, userId);
await kv.zadd('leaderboard:cost', metrics.cost, userId);

// period event
tokens[ev.tool].total += Number(ev.rawTokens ?? ev.tokens) || 0;
tokens[ev.tool].norm += Number(ev.normTokens ?? ev.tokens) || 0;
tokens[ev.tool].cost += Number(ev.costUsd) || 0;
```

all 模式按对应 ZSET 取候选；today/7d/90d 从 events 汇总三个指标后按所选 metric 排序。`mode=cost` 继续映射为 `metric=cost`；无参数固定为 `time=today&metric=total`。

- [ ] **Step 4: 删除页面内重复价格表，添加三段 metric 切换并保留 time 参数**

```astro
---
const rawMetric = Astro.url.searchParams.get('metric') || (Astro.url.searchParams.get('mode') === 'cost' ? 'cost' : 'total');
const metricFilter = ['total', 'norm', 'cost'].includes(rawMetric) ? rawMetric : 'total';
leaderboard = await getLeaderboard(100, timeFilter, metricFilter);
const rankValue = (user) => user.metrics?.[metricFilter] || 0;
---
<a href={`?time=${timeFilter}&metric=total`} class:list={{ active: metricFilter === 'total' }}>含缓存</a>
<a href={`?time=${timeFilter}&metric=norm`} class:list={{ active: metricFilter === 'norm' }}>不含缓存</a>
<a href={`?time=${timeFilter}&metric=cost`} class:list={{ active: metricFilter === 'cost' }}>预估费用</a>
```

英文分别显示 `With cache / No cache / Estimated cost`。时间 pills 也必须保留 `metric`。个人页 headline、每日表、趋势、峰值和平均值均从 canonical event 的同一口径取值；缓存率固定为 `cache_read / total`。页面显示 `Pricing snapshot: 2026-08-26` 和等效成本说明。

- [ ] **Step 5: 跑 metric 测试、Astro 检查并提交**

Run: `node --test scripts/tokenrank-metrics.test.mjs scripts/tokenrank-domain.test.mjs`

Expected: PASS。

Run: `npx astro check`

Expected: 0 errors。

```bash
git add src/lib/kv.ts src/pages/api/rank/list.ts src/pages/tokenrank src/pages/en/tokenrank src/components/ShareModal.astro scripts/tokenrank-metrics.test.mjs
git commit -m "Add total norm and cost rankings"
```

---

### Task 6: 官方账号只读对账（不计入排行）

**Files:**
- Modify: `public/scripts/codex-ledger.mjs`
- Modify: `public/scripts/agent.mjs:685-784`
- Modify: `src/pages/api/rank/upload.ts:8-75`
- Modify: `src/lib/codex-ledger.ts`
- Modify: `scripts/codex-ledger.test.mjs`
- Modify: `scripts/codex-ledger-store.test.mjs`

**Interfaces:**
- Produces: `readOfficialCodexAudit({ token, timeoutMs = 5000, rpc? }): Promise<CodexAccountAudit | null>`；`rpc` is dependency injection used only by tests。
- Produces: `{ account_audit_key, lifetime_tokens, daily_buckets, observed_at }`，不返回邮箱。
- Stores: `user:{userId}:codex:audit:{account_audit_key}` latest snapshot，TTL 120 天。
- Produces: `storeAccountAudit(redis, userId, audit)`；only accepts the sanitized audit shape and never reads ranking keys。

- [ ] **Step 1: 写出 HMAC 隐私和官方快照不进入排行的失败测试**

```js
test('official audit hashes email locally and never returns it', async () => {
  const audit = await readOfficialCodexAudit({
    token: 'upload-secret',
    rpc: {
      readAccount: async () => ({ type: 'chatgpt', email: 'Black@Example.com ' }),
      readUsage: async () => ({ summary: { lifetimeTokens: 14_096_012_943 }, dailyUsageBuckets: [] }),
      close: async () => {},
    },
  });
  assert.match(audit.account_audit_key, /^[a-f0-9]{64}$/);
  assert.equal(JSON.stringify(audit).includes('example.com'), false);
});

test('audit storage does not change canonical summary', async () => {
  const summaryKey = 'user:u1:codex:summary';
  await redis.set(summaryKey, JSON.stringify({ lifetime: { total: 110 } }));
  const before = await redis.get(summaryKey);
  await storeAccountAudit(redis, 'u1', {
    account_audit_key: 'a'.repeat(64), lifetime_tokens: 14_096_012_943,
    daily_buckets: [], observed_at: '2026-08-26T00:00:00.000Z',
  });
  assert.equal(await redis.get(summaryKey), before);
});
```

- [ ] **Step 2: 运行测试确认官方 RPC helper 不存在**

Run: `node --test scripts/codex-ledger.test.mjs scripts/codex-ledger-store.test.mjs`

Expected: FAIL with missing `readOfficialCodexAudit`/`storeAccountAudit`。

- [ ] **Step 3: 实现 5 秒超时的 Codex app-server JSON-RPC 客户端**

```js
const normalizedEmail = String(account.email || '').trim().toLowerCase();
const accountAuditKey = createHmac('sha256', token).update(normalizedEmail).digest('hex');
return {
  account_audit_key: accountAuditKey,
  lifetime_tokens: positiveInt(usage.summary?.lifetimeTokens),
  daily_buckets: sanitizeDailyBuckets(usage.dailyUsageBuckets),
  observed_at: new Date().toISOString(),
};
```

可执行文件候选顺序为 `CODEX_BINARY`、PATH 中的 `codex`、macOS ChatGPT app 内置 codex、Windows ChatGPT 常见安装目录。依次发送 `initialize`、`account/read`、`account/usage/read`；任何缺失、超时、非 ChatGPT 账号或无稳定 email 均返回 null，只写本地匿名差异日志，不阻止上传。

- [ ] **Step 4: API 校验并仅保存 latest audit**

`account_audit_key` 必须为 64 位 hex；daily 日期和值必须合法；Redis value 不得含 email/token/account 对象。上传成功 response 返回 `official_delta` 供 agent 日志输出，但排行榜、timeseries、ZSET 不读取 audit key。

- [ ] **Step 5: 跑绿隐私测试并提交**

Run: `node --test scripts/codex-ledger.test.mjs scripts/codex-ledger-store.test.mjs`

Expected: PASS，测试序列化 Redis values 并断言无 `@`、无上传 token。

```bash
git add public/scripts/codex-ledger.mjs public/scripts/agent.mjs src/pages/api/rank/upload.ts src/lib/codex-ledger.ts scripts/codex-ledger.test.mjs scripts/codex-ledger-store.test.mjs
git commit -m "Add private Codex account reconciliation"
```

---

### Task 7: Mac/Windows v5 分发与 Windows 无窗口任务

**Files:**
- Modify: `public/scripts/token-agent.ps1:62-134`
- Modify: `public/scripts/token-agent.sh:148-157`
- Create: `scripts/token-agent-installers.test.mjs`
- Modify: `package.json:6-19`

**Interfaces:**
- Downloads: `~/.tsalon/codex-ledger.mjs` 与现有 `agent.mjs/sql-wasm.*`。
- Creates on Windows: `~/.tsalon/run-agent-hidden.vbs`。
- Scheduled task Action: `wscript.exe "<absolute path>\run-agent-hidden.vbs"`。

- [ ] **Step 1: 写出安装器静态失败测试**

```js
test('Windows scheduled task launches wscript and never PowerShell directly', () => {
  const source = fs.readFileSync('public/scripts/token-agent.ps1', 'utf8');
  assert.match(source, /New-ScheduledTaskAction -Execute "wscript\.exe"/i);
  assert.match(source, /run-agent-hidden\.vbs/i);
  assert.doesNotMatch(source, /New-ScheduledTaskAction -Execute "PowerShell\.exe"/i);
  assert.match(source, /\.Run\([^,]+,\s*0,\s*True\)/i);
});

test('both installers download codex-ledger.mjs before agent execution', () => {
  for (const file of ['public/scripts/token-agent.ps1', 'public/scripts/token-agent.sh']) {
    const source = fs.readFileSync(file, 'utf8');
    assert.ok(source.indexOf('codex-ledger.mjs') < source.lastIndexOf('agent.mjs'));
  }
});
```

- [ ] **Step 2: 运行测试并确认当前 PowerShell Action 导致失败**

Run: `node --test scripts/token-agent-installers.test.mjs`

Expected: FAIL because Action is `PowerShell.exe`。

- [ ] **Step 3: 写入隐藏 VBS runner 并让 Task Scheduler 执行 `wscript.exe`**

```powershell
$runnerPath = Join-Path $tsalonDir 'run-agent-hidden.vbs'
$vbsCommand = 'powershell.exe -NoProfile -NonInteractive -EncodedCommand ' + $encodedCommand
$vbs = @"
Set shell = CreateObject("WScript.Shell")
exitCode = shell.Run("$($vbsCommand.Replace('"', '""'))", 0, True)
WScript.Quit exitCode
"@
[System.IO.File]::WriteAllText($runnerPath, $vbs, [Text.Encoding]::ASCII)
$action = New-ScheduledTaskAction -Execute 'wscript.exe' -Argument ('"' + $runnerPath + '"')
```

计划任务继续使用 Interactive/Limited principal，但无控制台宿主；VBS 等待 PowerShell 退出，从而保持 `IgnoreNew`。注册仍发生在首次历史扫描之前，`-Force` 覆盖旧任务。

- [ ] **Step 4: 两个平台安装器先下载新模块，再启动 agent**

PowerShell 使用 `Invoke-WebRequest "$host_url/scripts/codex-ledger.mjs"`；shell 使用 `curl -fsSL "$HOST/scripts/codex-ledger.mjs"`。任一下载失败必须退出非零，不能运行半套 v4/v5 文件。

- [ ] **Step 5: 跑绿安装器测试并提交**

Run: `node --test scripts/token-agent-installers.test.mjs`

Expected: PASS。

```bash
git add public/scripts/token-agent.ps1 public/scripts/token-agent.sh scripts/token-agent-installers.test.mjs package.json
git commit -m "Make Windows token uploads fully silent"
```

---

### Task 8: 全量验证、上线和两设备迁移对账

**Files:**
- Modify if verification exposes defects: only files already listed in Tasks 1-7
- Verify: `docs/superpowers/specs/2026-08-26-codex-ledger-and-windows-agent-design.md`
- Verify: `docs/superpowers/plans/2026-08-26-codex-ledger-and-windows-agent.md`

**Interfaces:**
- Production API: `/api/rank/list/?time=today&metric=total`。
- Production scripts: `/scripts/agent.mjs`, `/scripts/codex-ledger.mjs`, `/scripts/token-agent.ps1`, `/scripts/token-agent.sh`。

- [ ] **Step 1: 运行所有 TokenRank 测试**

Run: `npm run test:token-agent`

Expected: all parser、domain、store、upload、metrics、installer tests PASS。

- [ ] **Step 2: 运行格式、类型和生产构建验证**

Run: `git diff --check`

Expected: no output。

Run: `npm run build`

Expected: content checks、`astro check`、Astro build 全部 exit 0。

- [ ] **Step 3: 在本机 dry-run 对账隐私和口径**

Run: `node public/scripts/agent.mjs --token=local-verification --host=https://www.tsalon.tech --dry-run`

Expected: Mac 本地 canonical Codex 总量约 `1.326B`（会随当天活动增长）、`total = input + output`、`total > norm`、records 不含路径/文本/email；该值仅代表这台 Mac，不能冒充官方跨设备 `14.096B`。

- [ ] **Step 4: 检查变更范围并提交任何验证修正**

Run: `git status --short`

Expected: 只包含本计划文件；根目录 `.workbuddy/memory/*` 仍保持用户原状且未暂存。

```bash
git add public/scripts src/lib src/pages/api/rank src/pages/tokenrank src/pages/en/tokenrank src/components/ShareModal.astro scripts package.json package-lock.json docs/superpowers
git commit -m "Complete Codex ledger migration"  # only when verification produced uncommitted plan-owned fixes
```

- [ ] **Step 5: 推送 main 触发 GitHub 自动部署**

Run: `PATH="/Users/black/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/git/libexec/git-core:$PATH" git -c credential.helper=manager push origin main`

Expected: `main -> main`，GitHub/Vercel 自动部署开始。

- [ ] **Step 6: 验证生产资源和默认排行口径**

Run: `curl -fsSL 'https://www.tsalon.tech/api/rank/list/?time=today&metric=total'`

Expected: response `success=true`、`metric=total`、`pricing_snapshot_date=2026-08-26`；Black 的 Codex today 主值使用含缓存 total，不再是约 600 万。

Run: `curl -fsSL 'https://www.tsalon.tech/scripts/token-agent.ps1'`

Expected: deployed script 的 Task Action 为 `wscript.exe` 且包含 `run-agent-hidden.vbs`。

- [ ] **Step 7: 立即触发 Mac v5 上传并等待 Windows 重装命令迁移**

Run: `~/.tsalon/run-agent.sh`

Expected: upload response schema 5，日志打印 canonical total/norm/cost；Mac LaunchAgent 后续每日开机及每 30 分钟自动上报。

Windows 端重新执行排行榜连接页原安装命令后，Task Scheduler Action 必须显示 `wscript.exe`，手动 Run 和等待一次 30 分钟触发均无弹窗，Last Run Result 为 `0`。

- [ ] **Step 8: 两设备完成 v5 后做最终数据对账**

检查 today、2026-08-22、90d、all 和 cost：当前账号官方 lifetime `14,096,012,943` 与两台设备 canonical ledger 应在官方刷新延迟/本地日志可用范围内对应；T Salon 跨历史账号总量允许更高，但每一部分必须来自唯一 turn，不得保留 CodexManager 镜像或重复设备快照。
