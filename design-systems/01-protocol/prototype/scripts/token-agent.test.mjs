import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
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
  assert.equal(result.codex.total, 250);
  assert.deepEqual(result.history['2026-08-18'].codex, {
    total: 100, in: 90, out: 10, cache_read: 60, cache_write: 0,
  });
  assert.deepEqual(result.history['2026-08-19'].codex, {
    total: 150, in: 135, out: 15, cache_read: 120, cache_write: 0,
  });
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
    total: 100, in: 80, out: 20, cache_read: 60, cache_write: 0,
  });
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
