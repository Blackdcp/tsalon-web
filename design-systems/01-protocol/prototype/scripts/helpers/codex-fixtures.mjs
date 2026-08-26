import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

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
