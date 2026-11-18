import { MODEL_PRICING } from './token-pricing.mjs';

const DEEPSEEK_PRICING = MODEL_PRICING['deepseek-chat'] || {
  input: 0.27,
  cacheRead: 0.07,
  cacheWrite: 0.27,
  output: 1.1,
};

export const CALCULATOR_MODELS = [
  { id: 'claude-3-5-sonnet', label: 'Claude 3.5 / Sonnet', subTier: '$20 Pro / $100 Max', pricing: MODEL_PRICING['claude-3-5-sonnet'] },
  { id: 'claude-fable-5', label: 'Claude Opus / Fable 5', subTier: '$100 / $200 Max', pricing: MODEL_PRICING['claude-fable-5'] },
  { id: 'gpt-5.6-sol', label: 'OpenAI Codex / GPT-5.6 Sol', subTier: '$20 Plus / $200 Pro', pricing: MODEL_PRICING['gpt-5.6-sol'] },
  { id: 'cursor-sonnet', label: 'Cursor Pro / Ultra (Sonnet)', subTier: '$20 Pro (500 Fast) / $200 Ultra', pricing: MODEL_PRICING['claude-3-5-sonnet'] },
  { id: 'deepseek-v3', label: 'DeepSeek V3 / R1', subTier: 'API Pay-as-you-go', pricing: DEEPSEEK_PRICING },
  { id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro', subTier: '$19.99 Google AI Pro', pricing: MODEL_PRICING['gemini-2.5-pro'] },
  { id: 'gpt-5.6-terra', label: 'GPT-5.6 Terra', subTier: 'API / Standard', pricing: MODEL_PRICING['gpt-5.6-terra'] },
  { id: 'gpt-5.6-luna', label: 'GPT-5.6 Luna (Mini)', subTier: 'API / High-volume', pricing: MODEL_PRICING['gpt-5.6-luna'] },
];

export function clampCalculatorInput({ dailyMillions, cacheRatePct, outputRatePct, activeDays }) {
  const daily = Math.max(0.1, Math.min(2000, Number(dailyMillions) || 1));
  const cachePct = Math.max(0, Math.min(98, Number(cacheRatePct) || 0));
  const rawOutPct = Math.max(0.5, Math.min(50, Number(outputRatePct) || 1));
  const outPct = Math.min(rawOutPct, Math.max(0.5, 100 - cachePct));
  const inPct = Math.max(0, 100 - cachePct - outPct);
  const days = Math.max(1, Math.min(31, Math.round(Number(activeDays) || 1)));
  return { daily, cachePct, outPct, inPct, days };
}

export function computeMonthlyBreakdown(rawInput) {
  const { daily, cachePct, outPct, inPct, days } = clampCalculatorInput(rawInput);
  const monthlyRawM = daily * days;
  const monthlyNetM = monthlyRawM * ((100 - cachePct) / 100);
  const inM = monthlyRawM * (inPct / 100);
  const cacheM = monthlyRawM * (cachePct / 100);
  const outM = monthlyRawM * (outPct / 100);

  const models = CALCULATOR_MODELS.map((m) => {
    const inputCost = inM * m.pricing.input;
    const cacheCost = cacheM * m.pricing.cacheRead;
    const outputCost = outM * m.pricing.output;
    const totalCost = inputCost + cacheCost + outputCost;
    return {
      ...m,
      inputCost,
      cacheCost,
      outputCost,
      totalCost,
    };
  });

  const sonnet = models.find((m) => m.id === 'claude-3-5-sonnet');
  const codex = models.find((m) => m.id === 'gpt-5.6-sol');
  const deepseek = models.find((m) => m.id === 'deepseek-v3');
  return {
    daily,
    cachePct,
    outPct,
    inPct,
    days,
    monthlyRawM,
    monthlyNetM,
    models,
    sonnetCost: sonnet ? sonnet.totalCost : 0,
    codexCost: codex ? codex.totalCost : 0,
    deepseekCost: deepseek ? deepseek.totalCost : 0,
  };
}
