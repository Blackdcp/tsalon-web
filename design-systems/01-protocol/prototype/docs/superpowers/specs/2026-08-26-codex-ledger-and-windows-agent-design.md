# Codex 跨设备账本、费用口径与 Windows 静默上报设计

日期：2026-08-26

## 背景与已验证事实

当前实现把 Codex 的 `cached_input_tokens` 从主 token 中扣除，导致排行榜展示的是“非缓存 token”，而不是 Codex Desktop Profile 展示的总 token。生产环境 2026-08-26 的一个实际样本为：

- `input_tokens = 184,486,751`
- `output_tokens = 566,602`
- `cached_input_tokens = 178,963,456`
- Codex 官方总量：`input_tokens + output_tokens = 185,053,353`
- 当前错误主值：`185,053,353 - 178,963,456 = 6,089,897`

通过本机 Codex 官方 app-server 的只读 `account/usage/read` 方法取得的数据与用户截图完全一致：

- `lifetimeTokens = 14,096,012,943`
- `peakDailyTokens = 1,715,126,863`
- 2026-08-22：`1,715,126,863`

参考站 scys.com 的公开 Codex 分榜数据为：

- 含缓存：`14,349,346,887`
- 不含缓存：`718,184,135`
- 预估费用：`$11,336.566043902001`
- 设备数：2

参考站的 Codex 含缓存量与官方当前账号 lifetime 相差约 1.8%，差额与当天本地活动和官方刷新延迟量级一致。其统计规则为“同一设备以最近一次上报为准，多设备累加”，并将含缓存、不含缓存和费用作为三个独立口径。

当前 lifetime 的另一个问题是同时累加原生 Codex sessions、CodexManager 镜像数据和设备累计快照，造成同一用量重复进入总榜。

Windows 计划任务目前以 Interactive principal 直接启动 `PowerShell.exe`。`-WindowStyle Hidden` 只能在 PowerShell 进程启动后隐藏窗口，因此任务每 30 分钟可能闪出控制台。

## 目标

1. 同一个 T Salon 用户的所有设备、所有历史 Codex 账号产生的唯一真实用量全部累计。
2. 同一轮次重复上报、同一会话跨设备继续、CodexManager 镜像同一请求时不重复累计。
3. 主排行榜和每日消耗使用“含缓存总 token”，与 Codex Desktop Profile 的 token activity 口径一致。
4. 同时提供“不含缓存 token”和“预估 API 费用”两个独立视图。
5. 费用按模型、token 类型和价格快照计算，不能用一个全局模型或平均价格估算。
6. Windows 在登录时及每 30 分钟后台上报，定时运行不得弹出任何窗口。
7. 现有 Mac LaunchAgent、自更新安装命令和非 Codex 工具统计继续工作。

## 非目标与限制

- 不上传代码、对话文本、提示词、文件路径、项目名、邮箱或 Codex 登录凭据。
- 本地没有日志的云端任务无法由本地账本复原；官方 `account/usage/read` 仅作为当前账号的校验数据，不与本地账本相加。
- 已从所有设备删除、且从未被新版客户端上报的旧账号会话无法恢复。
- 费用是等效 API 成本，不代表订阅实际扣费；包月、赠送额度、地区折扣不纳入。

## 方案选择

### 方案 A：设备累计快照直接相加

实现简单，接近参考站公开描述，但无法识别同一会话在两台设备上的重复历史，也无法可靠排除 CodexManager 镜像。现有实现已经证明该方案容易膨胀。

### 方案 B：Codex 官方账号快照

直接读取 `account/usage/read`，单个当前账号可与官方 Profile 完全一致，也天然跨该账号的设备去重。但它只能读取当前登录账号，不含已切换走的账号；每日 bucket 也没有完整的模型、缓存和输出明细，无法准确计算费用。

### 方案 C：本地轮次账本 + 官方账号校验（采用）

以本地原生 session 日志的唯一轮次为记账单元，在服务端按轮次键去重；官方账号快照只做诊断校验。该方案能累计本地保留的所有账号和设备历史，同时保留模型与缓存明细用于费用计算。

## 统一 token 语义

每条轮次记录先规范化为以下字段：

```text
input_total       原始 input_tokens，包含缓存读取/写入
cache_read        cached_input_tokens
cache_write       cache_write_input_tokens
net_new_input     max(0, input_total - cache_read - cache_write)
output            output_tokens

total             net_new_input + cache_read + cache_write + output
norm              net_new_input + output
```

在通常没有 cache write 的 Codex 轮次中，`total = input_tokens + output_tokens`，与官方 `total_tokens` 一致。

`cached_input_tokens` 是 input 的组成部分：不能再加到已经包含缓存的 `input_tokens` 上，也不能从排行榜主数据中扣除后冒充总 token。

## 客户端账本

### 数据源优先级

1. 原生 `~/.codex/sessions/**/*.jsonl` 是 Codex 官方账号用量的主数据源。
2. 每个 session 以相邻 `total_token_usage` 的非负增量为主，将同一 `turn_id` 下的多次模型调用汇总为一个轮次；`last_token_usage` 仅在累计计数缺失或异常时补全。
3. CodexManager 的 `openai_account` 记录在原生 session 可用时不得再加入 Codex 总量。
4. 只有原生 session 完全不可用时，CodexManager 才作为明确标记的 fallback。
5. 代理/第三方 provider 使用独立工具键，不能混入官方 Codex，也不能与其镜像重复。

### 隐私安全的唯一键

客户端为每个完成轮次计算：

```text
turn_key = SHA-256(session_id + "|" + turn_id)
```

只上传哈希，不上传 session 标题、路径或内容。若旧日志没有 `turn_id`，使用 session ID、事件序号和完成时间生成稳定 fallback 键。

每条记录包含：

```text
turn_key
session_key        session_id 的哈希，仅用于诊断和合并
model              日志中的实际模型；缺失时使用可追踪的 family fallback
input_total
net_new_input
output
cache_read
cache_write
total
norm
pricing_tiers      按单次模型调用是否越过长上下文门槛汇总的 base/long 计费桶
daily              按 Asia/Shanghai 日期保存同样计数与计费桶
```

轮次跨越北京时间零点时，`daily` 保留各次模型调用实际发生日期的拆分，因此日榜不因整轮归入开始日或结束日而偏移；顶层计数必须等于所有 `daily` 桶之和。

同一设备切换账号不会清空历史 session，因此所有仍在本机的账号用量自然进入轮次账本，不需要上传账号身份。

### 增量与完整性

- 客户端使用本地 v5 cache 保存文件大小、mtime 和解析后的轮次，未变化文件不重扫。
- 上传包含该设备的完整 turn manifest 或带版本游标的增量；服务端操作必须幂等。
- 第一次 v5 迁移允许全量上传，后续仅上传新增或变化轮次并定期发送 manifest 校验摘要。
- 扫描输出继续显示文件数、缓存命中数和解析进度。

### 官方校验

客户端在 Codex app-server 可用时调用只读 `account/read` 和 `account/usage/read`，取得当前账号标识、lifetime 与 daily buckets。ChatGPT 登录账号按以下方式生成跨设备一致、不可直接还原邮箱的诊断键：

```text
account_audit_key = HMAC-SHA256(T Salon upload token, lowercase(trim(account email)))
```

客户端只上传 `account_audit_key`、官方汇总、daily buckets 和观测时间，不上传邮箱、登录 token 或其他账号资料。服务端对同一 `account_audit_key` 只保留最新官方快照，并仅用于对账诊断；绝不与本地轮次账本相加。若账号类型不提供邮箱等稳定标识，则官方差异只写入本地日志，不上传账号校验数据。

官方校验用于发现：

- 本机日志缺失或被清理；
- 日期切分错误；
- parser 因 Codex 格式更新而漏记；
- 官方后台尚未刷新。

## 服务端账本与跨设备去重

### 存储

为每个 T Salon 用户维护 Codex 轮次哈希账本：

```text
user:{userId}:codex:turns
  field = turn_key
  value = 各 source device 的匿名 record version + 当前选中的 normalized record + updatedAt
```

另存设备 manifest/version，用于迁移、删除损坏快照和诊断。

### 合并规则

1. 同一 `turn_key` 重复上报只更新记录，不增加总量。
2. 同一轮次在多个设备出现时，保留各设备的匿名 record version，并选择字段完整度更高且 `total` 更大的合法版本作为当前值；相同版本在聚合中只计一份。
3. 不同 `turn_key` 无论来自哪个设备或账号均累加。
4. 同一设备重新安装并保留相同会话日志不会重复累计。
5. 某设备 manifest 删除轮次时只删除该设备版本；若仍有其他设备版本则重新选择最佳值，所有版本都消失时才删除该 `turn_key`。
6. 每次账本变化后，从 canonical turn ledger 重建 Codex 的 daily/lifetime/model/cost 汇总。

因此：

```text
用户 Codex 总量 = 所有设备、所有账号的唯一 turn_key 记录之和
```

### 旧数据迁移

- v5 设备首次上传后，删除该设备旧版 Codex timeseries 与累计快照的排行贡献。
- 尚未升级的设备暂时保留 legacy contribution，并标记为待迁移。
- 所有已知设备完成 v5 上传后，Codex 仅由 canonical turn ledger 计算。
- 不改动 Claude、WorkBuddy 等其他工具的数据。
- 迁移操作必须可重复执行，不得因为重复上传再次缩放或相减。

## 费用模型

每条轮次按实际模型计算：

```text
cost_usd =
  net_new_input / 1_000_000 * input_price
  + cache_read / 1_000_000 * cache_read_price
  + cache_write / 1_000_000 * cache_write_price
  + output / 1_000_000 * output_price
```

价格表集中在单一模块，包含：

- 模型 ID 与别名；
- input、cached input、cache write、output 单价；
- 生效/快照日期；
- 来源 URL；
- 长上下文倍率等可选规则。

默认使用当前官方价，而不是参考站 2026-08-06 的旧快照。2026-08-26 的 GPT-5.6 Sol 官方促销基价为：

- Input：$4 / MTok
- Cached input：$0.40 / MTok
- Output：$20 / MTok
- Cache write：未单列时按 input 的 1.25 倍，即 $5 / MTok

当轮次明细足以判断官方长上下文门槛时应用对应倍率；只有聚合数据时使用基价并标注估算。

未知模型必须落入有名称的 family fallback，UI 显示“估算”，不能静默假装为 GPT-5.6 Sol。

## 排行榜与个人页面

支持三个明确 metric：

```text
total   含缓存总 token（默认，主排名）
norm    不含缓存 token
cost    等效 API 费用 USD
```

规则：

- 进入排行榜默认 `time=today&metric=total`。
- 切换 metric 时，列表排序、Top 100 总计、个人排名和个人卡片必须使用同一口径。
- total 视图副信息显示 cost；norm 视图副信息显示 total；cost 视图副信息显示 total。
- 个人页面按天表格、趋势图、峰值、平均值与顶部卡片必须共用同一 canonical daily aggregation。
- 缓存命中率使用 `cache_read / total`，不得用 norm 作分母。
- 页面展示定价快照日期和“等效 API 成本，不代表实际订阅扣费”。
- 保留旧 `mode=cost` 查询参数兼容，并规范化为 `metric=cost`。

## Windows 静默计划任务

安装脚本继续在用户主动执行时显示首次扫描进度。计划任务必须改为：

1. 先写入本地隐藏启动器，例如 `~/.tsalon/run-agent-hidden.vbs`。
2. Task Scheduler 的 Action 直接执行无控制台宿主 `wscript.exe`，而不是 `PowerShell.exe`、`cmd.exe` 或 `node.exe`。
3. VBS 以 window style `0` 启动 PowerShell 自更新命令，并等待子进程结束，使 `MultipleInstances IgnoreNew` 有效。
4. 保持 AtLogOn 与每 30 分钟触发、StartWhenAvailable、15 分钟超时和失败重试。
5. 重新执行现有安装命令时，以 `-Force` 覆盖同名旧任务，完成无窗口迁移。
6. 任务注册必须发生在首次历史扫描之前，避免用户关闭慢扫描窗口后未安装自动上报。

## 错误处理与可观测性

- 官方 usage 校验不可用不阻止本地账本上传。
- 单个损坏 session 只记录其文件哈希和错误类型，不输出路径/内容，其余 session 继续。
- 上传失败保留本地增量，下一次定时任务重试。
- 服务端拒绝非法负数、非有限数、异常大单轮次，并记录匿名诊断。
- 客户端日志明确输出 total、norm、cache、cost、解析/缓存数量和上传结果。
- 生产 API 返回数据版本和价格快照日期，便于判断旧客户端污染。
- 官方账号对账记录只保存 HMAC 诊断键与 token 汇总，不保存原始邮箱、凭据或账号资料。

## 测试与验收

### 采集器单元测试

1. Codex `input=100, cache_read=60, output=10`：`total=110`、`norm=50`，缓存不重复加也不从主值扣除。
2. 同一轮次内多次增长的累计 `token_count` 先做相邻差分再汇总；完全重复的累计事件增量为零。
3. 两个不同账号遗留的 session 文件均计入。
4. 原生 session 与 CodexManager 镜像相同时只计原生数据。
5. 模型切换后分别按模型定价。
6. 第二次扫描全部命中 cache，结果与首次一致。
7. 同一轮次跨越北京时间零点时，顶层总量不变且两个 daily 桶分别正确。

### 服务端测试

1. 同一 `turn_key` 来自两个设备只计一次。
2. 不同设备、不同 turn keys 正确相加。
3. 重复上传幂等。
4. v4 → v5 迁移不会同时保留旧 Codex contribution。
5. today、7d、90d 和 all 的 total/norm/cost 与 canonical ledger 聚合一致。
6. 缓存率、费用和排名使用正确分母/metric。

### Windows 验收

1. 安装任务后，Task Scheduler Action 为 `wscript.exe`。
2. 手动 Run 任务及等待一次 30 分钟触发，桌面无控制台闪现。
3. 日志出现成功上传，任务 Last Run Result 为 0。
4. 登录 Windows 后自动执行且无窗口。
5. 连续触发时 `IgnoreNew` 防止重叠。

### 生产对账

1. 当前账号官方 `account/usage/read`：lifetime `14,096,012,943`，8 月 22 日 `1,715,126,863`，本地 canonical ledger 在官方刷新延迟允许范围内对应。
2. T Salon 跨账号总量允许高于当前账号官方 lifetime，但必须能分解为唯一轮次，不得来自重复设备快照或 CodexManager 镜像。
3. 参考站 Codex-only 的 `total=14,349,346,887`、`norm=718,184,135` 用作旧价格快照下的交叉样本；新实现费用使用当前官方价格，因此不要求复制其 `$11,336.57`。
4. 中文排行榜无参数打开默认今天、含缓存。

## 发布顺序

1. 先发布兼容新旧 payload 的服务端与 metric UI。
2. 发布 Mac/Windows v5 agent 和 Windows 无窗口任务定义。
3. 立即触发 Mac 上传；Windows 用户重新执行一次安装命令以迁移任务并上传 v5 ledger。
4. 观察所有已知设备升级状态；完成后移除其 legacy Codex contribution。
5. 对账 today、8 月 22 日、90d、all 和 cost，再宣布迁移完成。
