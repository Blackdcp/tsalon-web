import assert from 'node:assert/strict';
import test from 'node:test';

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

test('embedded session replays reset the baseline and last usage is fingerprint-deduped', async (t) => {
  const home = tempHome(t);
  const lastUsage = { input_tokens: 100, output_tokens: 0, cached_input_tokens: 0 };
  writeSession(home, 'parent-replay.jsonl', [
    sessionMeta('parent'), turnContext('parent-turn', 'gpt-5.6-sol'),
    { type: 'event_msg', timestamp: '2026-08-18T02:00:00Z', payload: { type: 'token_count', info: { last_token_usage: lastUsage } } },
    { type: 'event_msg', timestamp: '2026-08-18T02:00:01Z', payload: { type: 'token_count', info: { last_token_usage: lastUsage } } },
    sessionMeta('child'), turnContext('child-turn', 'gpt-5.6-sol'),
    { type: 'event_msg', timestamp: '2026-08-18T02:00:02Z', payload: { type: 'token_count', info: { last_token_usage: { input_tokens: 20, output_tokens: 0, cached_input_tokens: 0 } } } },
  ]);
  const scan = await scanCodexLedger(home);
  assert.equal(scan.records.length, 2);
  assert.equal(scan.summary.total, 120);
});

test('long-context calls retain their model and use the long pricing tier', async (t) => {
  const home = tempHome(t);
  writeSession(home, 'long-context.jsonl', [
    sessionMeta('long-session'), turnContext('long-turn', 'gpt-5.6-sol'),
    tokenCount('2026-08-18T02:00:00Z', { total_tokens: 300005, input_tokens: 300000, output_tokens: 5 }),
  ]);
  const scan = await scanCodexLedger(home);
  assert.equal(scan.records[0].model, 'gpt-5.6-sol');
  assert.deepEqual(scan.records[0].pricing_tiers, {
    base: { net_new_input: 0, cache_read: 0, cache_write: 0, output: 0 },
    long: { net_new_input: 300000, cache_read: 0, cache_write: 0, output: 5 },
  });
});
