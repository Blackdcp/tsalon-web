import assert from 'node:assert/strict';
import test from 'node:test';
import { renderTokenRankBadgeSvg } from '../src/lib/badge-svg.mjs';

test('renders valid dark card SVG with formatted metrics', () => {
  const svg = renderTokenRankBadgeSvg({
    name: 'Alice',
    rank: 12,
    tokens: 48_500_000,
    estimatedUsd: 184.2,
    cacheHitRate: 79,
    topTool: 'Claude Code',
    theme: 'dark',
    style: 'card',
  });

  assert.match(svg, /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
  assert.match(svg, /<\/svg>$/);
  assert.match(svg, /#12/);
  assert.match(svg, /48\.5M/);
  assert.match(svg, /\$184/);
  assert.match(svg, /79% · Claude Code/);
  assert.match(svg, /#0d1117/);
});

test('renders light compact, receipt, and terminal SVG badge styles', () => {
  const compact = renderTokenRankBadgeSvg({
    name: 'Bob',
    rank: 3,
    tokens: 2_350_000_000,
    theme: 'light',
    style: 'compact',
  });
  assert.match(compact, /height="24"/);
  assert.match(compact, /#3 · 2\.35B tokens/);
  assert.match(compact, /#ffffff/);

  const receipt = renderTokenRankBadgeSvg({
    name: 'Carol',
    rank: 5,
    tokens: 120_000_000,
    estimatedUsd: 310,
    cacheHitRate: 88,
    topTool: 'Codex',
    style: 'receipt',
  });
  assert.match(receipt, /TOKEN RECEIPT/);
  assert.match(receipt, /PROMPT CACHE HIT/);
  assert.match(receipt, /88%/);

  const terminal = renderTokenRankBadgeSvg({
    name: 'Dave',
    rank: 9,
    tokens: 64_000_000,
    estimatedUsd: 95,
    cacheHitRate: 82,
    topTool: 'Claude Code',
    style: 'terminal',
  });
  assert.match(terminal, /npx tsalon-rank/);
  assert.match(terminal, /cache_hit: 82%/);
});

test('escapes XML special characters to prevent SVG XSS', () => {
  const svg = renderTokenRankBadgeSvg({
    name: '<script>alert("x")</script>',
    rank: 1,
    tokens: 1200,
    topTool: 'Tool&<1>',
  });

  assert.equal(svg.includes('<script>'), false);
  assert.match(svg, /&lt;script&gt;alert\(&quot;x&quot;\)&lt;\/script&gt;/);
  assert.match(svg, /Tool&amp;&lt;1&gt;/);
});
