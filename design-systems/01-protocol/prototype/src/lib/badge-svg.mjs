/**
 * Pure zero-dependency SVG badge generator for TokenRank GitHub README embeds.
 * Supports styles: 'card' | 'compact' | 'receipt' | 'terminal'
 * Supports themes: 'dark' | 'light'
 */

function escapeXml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function formatBadgeTokens(tokens) {
  const num = Number(tokens) || 0;
  if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(2)}B`;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return String(Math.round(num));
}

export function formatBadgeUsd(usd) {
  const num = Number(usd) || 0;
  if (num >= 1000) return `$${Math.round(num).toLocaleString('en-US')}`;
  if (num >= 100) return `$${num.toFixed(0)}`;
  return `$${num.toFixed(2)}`;
}

/**
 * Render a TokenRank SVG badge.
 * @param {object} input
 * @param {string} input.name - Display name / handle
 * @param {number|null|undefined} input.rank - Leaderboard rank (1-based) or null
 * @param {number} input.tokens - Total tokens
 * @param {number} [input.estimatedUsd] - Estimated API cost in USD
 * @param {number} [input.cacheHitRate] - Cache hit rate percentage (0-100)
 * @param {string} [input.topTool] - Primary AI coding tool
 * @param {'dark'|'light'} [input.theme='dark']
 * @param {'compact'|'card'|'receipt'|'terminal'} [input.style='card']
 * @returns {string}
 */
export function renderTokenRankBadgeSvg(input) {
  const theme = input?.theme === 'light' ? 'light' : 'dark';
  const validStyles = new Set(['compact', 'card', 'receipt', 'terminal']);
  const style = validStyles.has(input?.style) ? input.style : 'card';

  const name = escapeXml((input?.name || 'Developer').slice(0, 28));
  const rankText =
    typeof input?.rank === 'number' && Number.isFinite(input.rank) && input.rank > 0
      ? `#${Math.round(input.rank)}`
      : 'Ranked';
  const tokensNum = Number(input?.tokens) || 0;
  const tokensText = escapeXml(formatBadgeTokens(tokensNum));
  const usdNum = Number(input?.estimatedUsd) || 0;
  const usdText = escapeXml(formatBadgeUsd(usdNum));
  const cacheRate = Math.max(0, Math.min(100, Math.round(Number(input?.cacheHitRate) || 0)));
  const cacheSavedUsd = escapeXml(formatBadgeUsd((tokensNum * (cacheRate / 100) / 1_000_000) * 2.7));
  const topTool = escapeXml((input?.topTool || 'Claude Code').slice(0, 20));

  const palette =
    theme === 'light'
      ? {
          bg: '#ffffff',
          bgAlt: '#f6f8fa',
          border: '#d0d7de',
          text: '#1f2328',
          muted: '#656d76',
          accent: '#c2410c',
          accentBg: '#fff7ed',
          green: '#15803d',
        }
      : {
          bg: '#0d1117',
          bgAlt: '#161b22',
          border: '#30363d',
          text: '#f0f6fc',
          muted: '#8b949e',
          accent: '#fb923c',
          accentBg: '#27170d',
          green: '#4ade80',
        };

  if (style === 'compact') {
    const labelText = 'TokenRank';
    const valueText = `${rankText} · ${tokensText} tokens`;
    const leftWidth = 84;
    const rightWidth = Math.max(136, valueText.length * 7.2 + 24);
    const totalWidth = Math.round(leftWidth + rightWidth);

    return [
      `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="24" viewBox="0 0 ${totalWidth} 24" role="img" aria-label="${escapeXml(`${labelText}: ${valueText}`)}">`,
      `  <title>${escapeXml(`${labelText}: ${valueText}`)}</title>`,
      `  <rect x="0.5" y="0.5" width="${totalWidth - 1}" height="23" rx="6" fill="${palette.bg}" stroke="${palette.border}"/>`,
      `  <rect x="1" y="1" width="${leftWidth - 1}" height="22" rx="5" fill="${palette.bgAlt}"/>`,
      `  <circle cx="14" cy="12" r="4" fill="${palette.accent}"/>`,
      `  <text x="24" y="16" font-family="ui-sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" font-size="11" font-weight="600" fill="${palette.text}">${labelText}</text>`,
      `  <text x="${leftWidth + rightWidth / 2}" y="16" text-anchor="middle" font-family="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" font-size="11" font-weight="700" fill="${palette.accent}">${escapeXml(valueText)}</text>`,
      `</svg>`,
    ].join('\n');
  }

  if (style === 'receipt') {
    const receiptBg = theme === 'light' ? '#fffdf8' : '#14171c';
    const dashColor = theme === 'light' ? '#cbd5e1' : '#30363d';
    return [
      `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="210" viewBox="0 0 320 210" role="img" aria-label="TokenRank receipt for ${name}">`,
      `  <title>TokenRank Receipt · ${name} (${escapeXml(rankText)})</title>`,
      `  <rect x="0.5" y="0.5" width="319" height="209" rx="10" fill="${receiptBg}" stroke="${palette.border}"/>`,
      `  <text x="160" y="26" text-anchor="middle" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="12" font-weight="700" letter-spacing="1.2" fill="${palette.text}">T SALON · TOKEN RECEIPT</text>`,
      `  <text x="160" y="42" text-anchor="middle" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="10" fill="${palette.muted}">DEV: ${name} (${escapeXml(rankText)})</text>`,
      `  <line x1="18" y1="52" x2="302" y2="52" stroke="${dashColor}" stroke-dasharray="4 3"/>`,
      `  <text x="22" y="74" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="11" fill="${palette.muted}">PRIMARY AGENT</text>`,
      `  <text x="298" y="74" text-anchor="end" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="11" font-weight="700" fill="${palette.text}">${topTool}</text>`,
      `  <text x="22" y="96" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="11" fill="${palette.muted}">TOTAL TOKENS</text>`,
      `  <text x="298" y="96" text-anchor="end" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="11" font-weight="700" fill="${palette.text}">${tokensText}</text>`,
      `  <text x="22" y="118" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="11" fill="${palette.muted}">PROMPT CACHE HIT</text>`,
      `  <text x="298" y="118" text-anchor="end" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="11" font-weight="700" fill="${palette.green}">${cacheRate}% (saved ~${cacheSavedUsd})</text>`,
      `  <line x1="18" y1="134" x2="302" y2="134" stroke="${dashColor}" stroke-dasharray="4 3"/>`,
      `  <text x="22" y="158" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="12" font-weight="700" fill="${palette.text}">API EQUIV. VALUE</text>`,
      `  <text x="298" y="158" text-anchor="end" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="14" font-weight="700" fill="${palette.accent}">${usdText}</text>`,
      `  <line x1="18" y1="172" x2="302" y2="172" stroke="${dashColor}" stroke-dasharray="4 3"/>`,
      `  <text x="160" y="194" text-anchor="middle" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="9.5" fill="${palette.muted}">VERIFIED BY TSALON.TECH/TOKENRANK</text>`,
      `</svg>`,
    ].join('\n');
  }

  if (style === 'terminal') {
    return [
      `<svg xmlns="http://www.w3.org/2000/svg" width="420" height="136" viewBox="0 0 420 136" role="img" aria-label="TokenRank terminal badge for ${name}">`,
      `  <title>TokenRank Terminal · ${name} (${escapeXml(rankText)})</title>`,
      `  <rect x="0.5" y="0.5" width="419" height="135" rx="10" fill="${palette.bg}" stroke="${palette.border}"/>`,
      `  <rect x="1" y="1" width="418" height="28" rx="9" fill="${palette.bgAlt}"/>`,
      `  <circle cx="18" cy="15" r="5" fill="#ef4444"/>`,
      `  <circle cx="34" cy="15" r="5" fill="#f59e0b"/>`,
      `  <circle cx="50" cy="15" r="5" fill="#22c55e"/>`,
      `  <text x="210" y="19" text-anchor="middle" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="10.5" fill="${palette.muted}">tsalon-rank — ${name}</text>`,
      `  <text x="18" y="52" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="11.5" fill="${palette.green}">$ npx tsalon-rank --user "${name}"</text>`,
      `  <text x="18" y="76" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="11.5" fill="${palette.text}">&gt; rank: ${escapeXml(rankText)}  |  tokens: ${tokensText}  |  cost: ${usdText}</text>`,
      `  <text x="18" y="98" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="11.5" fill="${palette.muted}">&gt; cache_hit: ${cacheRate}% (saved ~${cacheSavedUsd})  |  agent: ${topTool}</text>`,
      `  <text x="18" y="120" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="10.5" fill="${palette.accent}">&gt; https://www.tsalon.tech/tokenrank</text>`,
      `</svg>`,
    ].join('\n');
  }

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="420" height="128" viewBox="0 0 420 128" role="img" aria-label="TokenRank card for ${name}">`,
    `  <title>TokenRank · ${name} (${escapeXml(rankText)})</title>`,
    `  <rect x="0.5" y="0.5" width="419" height="127" rx="12" fill="${palette.bg}" stroke="${palette.border}"/>`,
    `  <rect x="16" y="16" width="8" height="8" rx="2" fill="${palette.accent}"/>`,
    `  <text x="32" y="24" font-family="ui-sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" font-size="12" font-weight="700" letter-spacing="0.4" fill="${palette.muted}">TOKENRANK · TSALON.TECH</text>`,
    `  <rect x="336" y="12" width="68" height="22" rx="11" fill="${palette.accentBg}" stroke="${palette.accent}" stroke-opacity="0.45"/>`,
    `  <text x="370" y="27" text-anchor="middle" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="11" font-weight="700" fill="${palette.accent}">${escapeXml(rankText)}</text>`,
    `  <text x="16" y="54" font-family="ui-sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" font-size="18" font-weight="700" fill="${palette.text}">${name}</text>`,
    `  <rect x="16" y="70" width="124" height="42" rx="8" fill="${palette.bgAlt}" stroke="${palette.border}"/>`,
    `  <text x="26" y="86" font-family="ui-sans-serif, -apple-system, sans-serif" font-size="10" fill="${palette.muted}">TOTAL TOKENS</text>`,
    `  <text x="26" y="103" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="14" font-weight="700" fill="${palette.text}">${tokensText}</text>`,
    `  <rect x="148" y="70" width="124" height="42" rx="8" fill="${palette.bgAlt}" stroke="${palette.border}"/>`,
    `  <text x="158" y="86" font-family="ui-sans-serif, -apple-system, sans-serif" font-size="10" fill="${palette.muted}">API VALUE</text>`,
    `  <text x="158" y="103" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="14" font-weight="700" fill="${palette.accent}">${usdText}</text>`,
    `  <rect x="280" y="70" width="124" height="42" rx="8" fill="${palette.bgAlt}" stroke="${palette.border}"/>`,
    `  <text x="290" y="86" font-family="ui-sans-serif, -apple-system, sans-serif" font-size="10" fill="${palette.muted}">CACHE · TOOL</text>`,
    `  <text x="290" y="103" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="13" font-weight="700" fill="${palette.text}">${cacheRate}% · ${topTool}</text>`,
    `</svg>`,
  ].join('\n');
}
