import test from 'node:test';
import assert from 'node:assert/strict';

const reset = {
  id: 'codex-reset-sep12', provider: 'codex', type: 'reset', scope: 'all',
  reason: 'service recovery', landedAt: '2026-09-11T18:10:00Z',
  reasonNote: { 'zh-CN': '服务恢复', en: 'Service recovery' },
  sources: [{ role: 'landed', account: '@example', url: 'https://example.com/reset' }],
};
const card = {
  id: 'codex-card-sep23', provider: 'codex', type: 'card', scope: 'paid',
  reason: 'bonus cards', landedAt: '2026-09-22T18:23:00Z',
  reasonNote: { 'zh-CN': '发放重置卡', en: 'Bonus cards' },
  sources: [{ role: 'landed', account: '@example', url: 'https://example.com/card' }],
};

async function loadRadar(t, payload) {
  // The network is the only replaced boundary; mapping and caching remain real.
  t.mock.method(globalThis, 'fetch', async () => new Response(JSON.stringify(payload)));
  const { getResetRadarData } = await import(`../src/lib/reset-radar.ts?case=${Math.random()}`);
  return getResetRadarData();
}

test('a newer reset card cannot supply the date of an older usage reset', async (t) => {
  const data = await loadRadar(t, {
    events: [reset, card],
    stats: { codex: { lastResetAt: card.landedAt, medianGapHours: 79.2 } },
    watch: {},
  });
  assert.equal(data.codex.lastReset.dateBeijing, '2026-09-12');
  assert.equal(data.codex.lastReset.timeBeijing, '02:10');
  assert.equal(data.codex.lastReset.postUrl, 'https://example.com/reset');
  const latest = data.codex.latestEvent;
  assert.equal(latest.id, 'codex-card-sep23');
  assert.equal(latest.typeLabelZh, '重置卡');
  assert.equal(latest.typeLabelEn, 'Reset card');
  assert.equal(latest.landedAtBeijing, '2026-09-23 02:23');
  assert.equal(latest.reasonEn, 'Bonus cards');
  assert.equal(latest.postUrl, 'https://example.com/card');
});

test('remote aggregate timestamps cannot invent an event, scope, or cadence', async (t) => {
  const data = await loadRadar(t, {
    events: [],
    stats: { codex: { lastResetAt: card.landedAt, estimatedNextAt: '2026-09-27T00:00:00Z', medianGapHours: 79.2 } },
    watch: {},
  });
  assert.equal(data.codex.lastReset.dateBeijing, '--');
  assert.equal(data.codex.latestEvent, null);
  assert.equal(data.codex.lastReset.scopeEn, 'Not specified');
  assert.equal(data.codex.typicalGapDays, null);
  assert.equal(data.codex.nextEstimated.dateBeijing, '--');
});

test('card-only data and unknown scope never become a global reset', async (t) => {
  const data = await loadRadar(t, {events: [{...card, scope: 'new-plan', reason: 'unstated', reasonNote: undefined}], stats:{}, watch:{}});
  assert.equal(data.codex.lastReset.dateBeijing, '--');
  assert.equal(data.codex.latestEvent.scopeZh, '未说明');
  assert.equal(data.codex.latestEvent.scopeEn, 'Not specified');
  assert.equal(data.codex.latestEvent.reasonEn, 'Not specified in this record');
  assert.equal(data.codex.typicalGapDays, null);
});

test('a reset with no known scope does not invent a targeted or global audience', async (t) => {
  const data = await loadRadar(t, {events:[{...reset, scope:'unknown'}], stats:{}, watch:{}});
  assert.equal(data.codex.latestEvent.typeLabelEn, 'Reset (scope unspecified)');
  assert.equal(data.codex.latestEvent.scopeEn, 'Not specified');
  assert.equal(data.codex.typicalGapDays, null);
});

test('global cadence excludes cards and targeted resets and counts actual intervals', async (t) => {
  const data = await loadRadar(t, { events: [
    {...reset, id:'global-1', landedAt:'2026-09-01T00:00:00Z'},
    {...reset, id:'global-2', landedAt:'2026-09-05T00:00:00Z'},
    {...reset, id:'global-3', landedAt:'2026-09-11T00:00:00Z'},
    {...reset, id:'targeted', scope:'affected', landedAt:'2026-09-20T00:00:00Z'},
    card,
  ], stats:{codex:{medianGapHours:3, lastResetAt:card.landedAt}}, watch:{} });
  assert.equal(data.codex.typicalGapDays, 5);
  assert.equal(data.codex.cadenceIntervalCount, 2);
  assert.equal(data.codex.nextEstimated.dateBeijing, '2026-09-16');
  assert.equal(data.codex.nextEstimated.timeBeijing, '08:00');
  assert.equal(data.codex.events.find(event => event.id === 'targeted').typeLabelEn, 'Scoped reset');
});

test('invalid and future event dates do not crash or appear as completed resets', async (t) => {
  const data = await loadRadar(t, {events:[{...reset, landedAt:'not-a-date'}, {...card, landedAt:'2099-01-01T00:00:00Z'}], stats:{}, watch:{}});
  assert.deepEqual(data.codex.events, []);
  assert.equal(data.codex.latestEvent, null);
});

test('an unavailable source cannot claim a fresh data update', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => new Response('Unavailable', {status:503}));
  const { getResetRadarData } = await import(`../src/lib/reset-radar.ts?case=${Math.random()}`);
  const data = await getResetRadarData();
  assert.equal(data.status, 'unavailable');
  assert.equal(data.updatedAtIso, null);
  assert.equal(data.updatedAtBeijing, null);
  assert.equal(data.codex.latestEvent, null);
});

test('a successful empty response is distinct from a failed source request', async (t) => {
  const data = await loadRadar(t, {events:[], stats:{}, watch:{}});
  assert.equal(data.status, 'empty');
  assert.ok(data.updatedAtIso);
});

test('malformed optional fields remain unknown instead of taking down the page', async (t) => {
  const data = await loadRadar(t, {events:[
    {...reset, id:'bad-fields', reason:42, reasonNote:{en:42, 'zh-CN':{}}, scope:{toString:42}, scopeNote:{en:{}, 'zh-CN':42}, sources:{}},
    {...card, id:'bad-sources', sources:[null, 42, {role:'landed', url:{}}, {role:'landed', url:'https://example.com/card'}]},
  ], stats:{}, watch:{}});
  const bad = data.codex.events.find(event => event.id === 'bad-fields');
  assert.equal(bad.reasonEn, 'Not specified in this record');
  assert.equal(bad.reasonZh, '该记录未说明');
  assert.equal(bad.scopeEn, 'Not specified');
  assert.equal(bad.typeLabelEn, 'Reset (scope unspecified)');
  assert.equal(bad.postUrl, undefined);
  assert.equal(data.codex.latestEvent.postUrl, 'https://example.com/card');
});

test('events on the same month and day in different years remain distinguishable', async (t) => {
  const data = await loadRadar(t, {events:[
    {...reset, id:'old-year', landedAt:'2025-09-11T18:10:00Z'},
    {...reset, id:'new-year', landedAt:'2026-09-11T18:10:00Z'},
  ], stats:{}, watch:{}});
  assert.deepEqual(data.codex.events.map(event => event.landedAtBeijing), ['2026-09-12 02:10', '2025-09-12 02:10']);
  assert.equal(data.codex.latestEvent.id, 'new-year');
  assert.match(data.updatedAtBeijing, /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/);
});

test('grok provider events and stats are parsed correctly', async (t) => {
  const grokEvent = {
    id: 'grok-reset-1', provider: 'grok', type: 'reset', scope: 'all',
    reason: 'service restore', landedAt: '2026-09-20T10:00:00Z',
    sources: [{ role: 'landed', url: 'https://x.com/grok/status/1' }],
  };
  const data = await loadRadar(t, {
    events: [grokEvent],
    stats: {},
    watch: { grok: { open: true, text: 'Grok reset incoming', scheduledAt: '2026-10-02T15:00:00Z' } },
  });
  assert.equal(data.grok.name, 'xAI Grok');
  assert.equal(data.grok.events.length, 1);
  assert.equal(data.grok.latestEvent.id, 'grok-reset-1');
  assert.equal(data.grok.latestEvent.typeLabelZh, '全局重置');
  assert.equal(data.grok.watchNotice.isOpen, true);
  assert.equal(data.grok.watchNotice.text, 'Grok reset incoming');
});
