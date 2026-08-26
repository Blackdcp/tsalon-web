import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { DatabaseSync } from 'node:sqlite';

import { getCodexTokens, mergeHistory } from '../public/scripts/agent.mjs';

function tempHome() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'tsalon-agent-test-'));
}

test('Codex history attributes cumulative deltas to each event day', async (t) => {
  const home = tempHome();
  t.after(() => fs.rmSync(home, { recursive: true, force: true }));
  const dir = path.join(home, '.codex', 'sessions', '2026', '08', '18');
  fs.mkdirSync(dir, { recursive: true });
  const rows = [
    { type: 'session_meta', timestamp: '2026-08-18T00:00:00.000Z', payload: { id: 'session-history' } },
    { type: 'turn_context', timestamp: '2026-08-18T00:00:00.500Z', payload: { turn_id: 'turn-history', model: 'gpt-5.6-sol' } },
    {
      timestamp: '2026-08-18T02:00:00.000Z',
      payload: { type: 'token_count', info: { total_token_usage: {
        total_tokens: 100, input_tokens: 90, output_tokens: 10, cached_input_tokens: 60,
      } } },
    },
    {
      // 17:00 UTC is the next calendar day in Beijing.
      timestamp: '2026-08-18T17:00:00.000Z',
      payload: { type: 'token_count', info: { total_token_usage: {
        total_tokens: 250, input_tokens: 225, output_tokens: 25, cached_input_tokens: 180,
      } } },
    },
  ];
  fs.writeFileSync(path.join(dir, 'rollout.jsonl'), rows.map(JSON.stringify).join('\n'));

  const result = await getCodexTokens(home);
  assert.deepEqual(result.codex, {
    input_total: 225, net_new_input: 45, output: 25,
    cache_read: 180, cache_write: 0, total: 250, norm: 70,
  });
  assert.deepEqual(result.history['2026-08-18'].codex, {
    total: 100, raw_total: 100, in: 90, out: 10, cache_read: 60, cache_write: 0,
  });
  assert.deepEqual(result.history['2026-08-19'].codex, {
    total: 150, raw_total: 150, in: 135, out: 15, cache_read: 120, cache_write: 0,
  });
  assert.ok(fs.existsSync(path.join(home, '.tsalon', 'codex-session-cache-v5.json')));
  assert.deepEqual(await getCodexTokens(home), result);
});

test('CodexManager trusts total_tokens and does not add detail fields twice', async (t) => {
  const home = tempHome();
  t.after(() => fs.rmSync(home, { recursive: true, force: true }));
  const dir = path.join(home, 'Library', 'Application Support', 'com.codexmanager.desktop');
  fs.mkdirSync(dir, { recursive: true });
  const dbPath = path.join(dir, 'codexmanager.db');
  const db = new DatabaseSync(dbPath);
  db.exec(`
    CREATE TABLE request_token_stats (
      actual_source_kind TEXT,
      created_at INTEGER,
      total_tokens INTEGER,
      input_tokens INTEGER,
      output_tokens INTEGER,
      cached_input_tokens INTEGER,
      reasoning_output_tokens INTEGER
    );
  `);
  db.prepare('INSERT INTO request_token_stats VALUES (?, ?, ?, ?, ?, ?, ?)').run(
    'openai_account',
    Math.floor(Date.parse('2026-08-18T02:00:00.000Z') / 1000),
    100,
    80,
    20,
    60,
    5,
  );
  db.close();

  const result = await getCodexTokens(home);
  assert.deepEqual(result.codex, {
    input_total: 80, net_new_input: 20, output: 20,
    cache_read: 60, cache_write: 0, total: 100, norm: 40,
  });
});

test('native Codex sessions suppress CodexManager openai_account mirrors', async (t) => {
  const home = tempHome();
  t.after(() => fs.rmSync(home, { recursive: true, force: true }));
  const sessionDir = path.join(home, '.codex', 'sessions', '2026', '08', '18');
  fs.mkdirSync(sessionDir, { recursive: true });
  fs.writeFileSync(path.join(sessionDir, 'native.jsonl'), [
    JSON.stringify({ type: 'session_meta', timestamp: '2026-08-18T00:00:00Z', payload: { id: 'native' } }),
    JSON.stringify({ type: 'turn_context', timestamp: '2026-08-18T00:00:01Z', payload: { turn_id: 'native-turn', model: 'gpt-5.6-sol' } }),
    JSON.stringify({ type: 'event_msg', timestamp: '2026-08-18T02:00:00Z', payload: { type: 'token_count', info: { total_token_usage: { total_tokens: 100, input_tokens: 80, output_tokens: 20 } } } }),
  ].join('\n'));
  const managerDir = path.join(home, 'Library', 'Application Support', 'com.codexmanager.desktop');
  fs.mkdirSync(managerDir, { recursive: true });
  const db = new DatabaseSync(path.join(managerDir, 'codexmanager.db'));
  db.exec('CREATE TABLE request_token_stats (actual_source_kind TEXT, created_at INTEGER, total_tokens INTEGER, input_tokens INTEGER, output_tokens INTEGER, cached_input_tokens INTEGER, reasoning_output_tokens INTEGER)');
  db.prepare('INSERT INTO request_token_stats VALUES (?, ?, ?, ?, ?, ?, ?)').run('openai_account', 0, 999, 999, 0, 0, 0);
  db.close();

  const result = await getCodexTokens(home);
  assert.equal(result.codex.total, 100);
  assert.equal(result.codex_proxy.total, 0);
});

test('fallback-only CodexManager data stays on the legacy upload protocol', (t) => {
  const home = tempHome();
  t.after(() => fs.rmSync(home, { recursive: true, force: true }));
  const managerDir = path.join(home, 'Library', 'Application Support', 'com.codexmanager.desktop');
  fs.mkdirSync(managerDir, { recursive: true });
  const db = new DatabaseSync(path.join(managerDir, 'codexmanager.db'));
  db.exec('CREATE TABLE request_token_stats (actual_source_kind TEXT, created_at INTEGER, total_tokens INTEGER, input_tokens INTEGER, output_tokens INTEGER, cached_input_tokens INTEGER, reasoning_output_tokens INTEGER)');
  db.prepare('INSERT INTO request_token_stats VALUES (?, ?, ?, ?, ?, ?, ?)').run('openai_account', 0, 100, 80, 20, 60, 0);
  db.close();

  const result = spawnSync(process.execPath, ['public/scripts/agent.mjs', '--token', 'test-token', '--dry-run'], {
    cwd: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'),
    env: { ...process.env, HOME: home, CODEX_BINARY: path.join(home, 'missing-codex') },
    encoding: 'utf8',
  });
  assert.equal(result.status, 0, result.stderr);
  const payload = JSON.parse(result.stdout.slice(result.stdout.indexOf('{')));
  assert.equal(payload.data.codex.total, 100);
  assert.equal(payload.codex_ledger, undefined);
});

test('an authoritative empty native scan sends an empty v5 manifest and suppresses fallback', (t) => {
  const home = tempHome();
  t.after(() => fs.rmSync(home, { recursive: true, force: true }));
  const sessionDir = path.join(home, '.codex', 'sessions', '2026', '08', '18');
  fs.mkdirSync(sessionDir, { recursive: true });
  fs.writeFileSync(path.join(sessionDir, 'zero-only.jsonl'), [
    JSON.stringify({ type: 'session_meta', timestamp: '2026-08-18T00:00:00Z', payload: { id: 'zero-session' } }),
    JSON.stringify({ type: 'turn_context', timestamp: '2026-08-18T00:00:01Z', payload: { turn_id: 'zero-turn', model: 'gpt-5.6-sol' } }),
    JSON.stringify({ type: 'event_msg', timestamp: '2026-08-18T00:00:02Z', payload: { type: 'token_count', info: { total_token_usage: { input_tokens: 0, output_tokens: 0 } } } }),
  ].join('\n'));
  const managerDir = path.join(home, 'Library', 'Application Support', 'com.codexmanager.desktop');
  fs.mkdirSync(managerDir, { recursive: true });
  const db = new DatabaseSync(path.join(managerDir, 'codexmanager.db'));
  db.exec('CREATE TABLE request_token_stats (actual_source_kind TEXT, created_at INTEGER, total_tokens INTEGER, input_tokens INTEGER, output_tokens INTEGER, cached_input_tokens INTEGER, reasoning_output_tokens INTEGER)');
  db.prepare('INSERT INTO request_token_stats VALUES (?, ?, ?, ?, ?, ?, ?)').run('openai_account', 0, 100, 80, 20, 60, 0);
  db.close();

  const result = spawnSync(process.execPath, ['public/scripts/agent.mjs', '--token', 'test-token', '--dry-run'], {
    cwd: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'),
    env: { ...process.env, HOME: home, CODEX_BINARY: path.join(home, 'missing-codex') },
    encoding: 'utf8',
  });
  assert.equal(result.status, 0, result.stderr);
  const payload = JSON.parse(result.stdout.slice(result.stdout.indexOf('{')));
  assert.equal(payload.data.codex, undefined);
  assert.deepEqual(payload.codex_ledger.records, []);
  assert.equal(payload.codex_ledger.manifest_hash, 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
});

test('a truncated native JSONL is non-authoritative and cannot publish a partial full sync', (t) => {
  const home = tempHome();
  t.after(() => fs.rmSync(home, { recursive: true, force: true }));
  const sessionDir = path.join(home, '.codex', 'sessions', '2026', '08', '18');
  fs.mkdirSync(sessionDir, { recursive: true });
  fs.writeFileSync(path.join(sessionDir, 'concurrently-written.jsonl'), [
    JSON.stringify({ type: 'session_meta', timestamp: '2026-08-18T00:00:00Z', payload: { id: 'partial-session' } }),
    JSON.stringify({ type: 'turn_context', timestamp: '2026-08-18T00:00:01Z', payload: { turn_id: 'partial-turn', model: 'gpt-5.6-sol' } }),
    JSON.stringify({ type: 'event_msg', timestamp: '2026-08-18T00:00:02Z', payload: { type: 'token_count', info: { total_token_usage: { input_tokens: 10, output_tokens: 0 } } } }),
    '{"type":"event_msg","payload":',
  ].join('\n'));
  const managerDir = path.join(home, 'Library', 'Application Support', 'com.codexmanager.desktop');
  fs.mkdirSync(managerDir, { recursive: true });
  const db = new DatabaseSync(path.join(managerDir, 'codexmanager.db'));
  db.exec('CREATE TABLE request_token_stats (actual_source_kind TEXT, created_at INTEGER, total_tokens INTEGER, input_tokens INTEGER, output_tokens INTEGER, cached_input_tokens INTEGER, reasoning_output_tokens INTEGER)');
  db.prepare('INSERT INTO request_token_stats VALUES (?, ?, ?, ?, ?, ?, ?)').run('openai_account', 0, 100, 80, 20, 60, 0);
  db.close();

  const result = spawnSync(process.execPath, ['public/scripts/agent.mjs', '--token', 'test-token', '--dry-run'], {
    cwd: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'),
    env: { ...process.env, HOME: home, CODEX_BINARY: path.join(home, 'missing-codex') },
    encoding: 'utf8',
  });
  assert.equal(result.status, 0, result.stderr);
  const payload = JSON.parse(result.stdout.slice(result.stdout.indexOf('{')));
  assert.equal(payload.codex_ledger, undefined);
  assert.equal(payload.data.codex.total, 100);
});

test('dry-run sends the v5 ledger at top level without session paths or text', (t) => {
  const home = tempHome();
  t.after(() => fs.rmSync(home, { recursive: true, force: true }));
  const sessionDir = path.join(home, '.codex', 'sessions', '2026', '08', '18');
  fs.mkdirSync(sessionDir, { recursive: true });
  fs.writeFileSync(path.join(sessionDir, 'private-session.jsonl'), [
    JSON.stringify({ type: 'session_meta', timestamp: '2026-08-18T00:00:00Z', payload: { id: 'session-private', title: 'Private title' } }),
    JSON.stringify({ type: 'turn_context', timestamp: '2026-08-18T00:00:01Z', payload: { turn_id: 'turn-private', model: 'gpt-5.6-sol', prompt: 'Sensitive prompt text' } }),
    JSON.stringify({ type: 'event_msg', timestamp: '2026-08-18T02:00:00Z', payload: { type: 'token_count', info: { total_token_usage: { total_tokens: 100, input_tokens: 90, output_tokens: 10 } } } }),
  ].join('\n'));
  const result = spawnSync(process.execPath, ['public/scripts/agent.mjs', '--token', 'test-token', '--dry-run'], {
    cwd: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'),
    env: { ...process.env, HOME: home },
    encoding: 'utf8',
  });
  assert.equal(result.status, 0, result.stderr);
  const payload = JSON.parse(result.stdout.slice(result.stdout.indexOf('{')));
  assert.equal(payload.codex_ledger.version, 5);
  assert.equal(payload.data.ledger, undefined);
  const serialized = JSON.stringify(payload);
  assert.equal(serialized.includes('private-session.jsonl'), false);
  assert.equal(serialized.includes('Private title'), false);
  assert.equal(serialized.includes('Sensitive prompt text'), false);
});

test('history merge keeps multiple tools on the same date', () => {
  const target = {
    '2026-08-19': {
      codex: { total: 10, in: 8, out: 2, cache_read: 5, cache_write: 0 },
    },
  };
  mergeHistory(target, {
    '2026-08-19': {
      claude: { total: 20, in: 10, out: 2, cache_read: 7, cache_write: 1 },
    },
  });
  assert.equal(target['2026-08-19'].codex.total, 10);
  assert.equal(target['2026-08-19'].claude.total, 20);
});
