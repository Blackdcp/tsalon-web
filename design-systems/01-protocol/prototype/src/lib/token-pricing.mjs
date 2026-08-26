export const PRICING_SNAPSHOT_DATE = '2026-08-26';
export const PRICING_SOURCE_URL = 'https://openai.com/api/pricing/';

export const MODEL_PRICING = Object.freeze(Object.assign(Object.create(null), {
  'gpt-5.6-sol': { input: 4, cacheRead: 0.4, cacheWrite: 5, output: 20 },
  'gpt-5.6-terra': { input: 2, cacheRead: 0.2, cacheWrite: 2.5, output: 12 },
  'gpt-5.6-luna': { input: 0.2, cacheRead: 0.02, cacheWrite: 0.25, output: 1.2 },
  'claude-fable-5': { input: 10, cacheRead: 1, cacheWrite: 12.5, output: 50 },
  'claude-3-5-sonnet': { input: 3, cacheRead: 0.3, cacheWrite: 3.75, output: 15 },
  // Legacy families remain available for historical TokenRank data. Their
  // estimates deliberately never inherit the verified Codex price guarantee.
  'gemini-2.5-pro': { input: 1.25, cacheRead: 0.3, cacheWrite: 1.25, output: 5 },
  default: { input: 1, cacheRead: 0.2, cacheWrite: 1, output: 4 },
}));

const LEGACY_ALIASES = Object.freeze(Object.assign(Object.create(null), {
  antigravity: 'gemini-2.5-pro',
  claude: 'claude-3-5-sonnet',
  codex: 'gpt-5.6-sol',
  codex_proxy: 'gpt-5.6-sol',
  cursor: 'gpt-5.6-sol',
}));

export function normalizeModelId(raw = '') {
  const id = String(raw || '').trim().toLowerCase().split('/').at(-1) || '';
  if (id === 'gpt-5.6' || Object.hasOwn(MODEL_PRICING, id) && !['gemini-2.5-pro', 'default'].includes(id)) {
    return { id: id === 'gpt-5.6' ? 'gpt-5.6-sol' : id, estimated: false };
  }
  if (id.startsWith('claude-3-5-sonnet')) return { id: 'claude-3-5-sonnet', estimated: false };
  if (id.startsWith('gpt-5.6-sol')) return { id: 'gpt-5.6-sol', estimated: true };
  if (Object.hasOwn(LEGACY_ALIASES, id)) return { id: LEGACY_ALIASES[id], estimated: true };
  if (Object.hasOwn(MODEL_PRICING, id)) return { id, estimated: true };
  return { id: 'gpt-5.6-sol', estimated: true };
}

function usageValue(tier, key) {
  const value = Number(tier?.[key]);
  return Number.isFinite(value) && value > 0 ? value : 0;
}

function tierCost(tier, prices, multiplier = 1) {
  return (
    usageValue(tier, 'net_new_input') * prices.input * multiplier
    + usageValue(tier, 'cache_read') * prices.cacheRead * multiplier
    + usageValue(tier, 'cache_write') * prices.cacheWrite * multiplier
    + usageValue(tier, 'output') * prices.output * (multiplier === 1 ? 1 : 1.5)
  ) / 1_000_000;
}

export function priceUsage(model, pricingTiers = {}) {
  const normalized = normalizeModelId(model);
  const prices = Object.hasOwn(MODEL_PRICING, normalized.id)
    ? MODEL_PRICING[normalized.id]
    : MODEL_PRICING['gpt-5.6-sol'];
  const longMultiplier = normalized.id.startsWith('gpt-5.6-') ? 2 : 1;
  const usd = tierCost(pricingTiers.base, prices) + tierCost(pricingTiers.long, prices, longMultiplier);
  return { usd, estimated: normalized.estimated };
}
