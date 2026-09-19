import type { APIRoute } from 'astro';

const AI_CRAWLERS = [
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'ClaudeBot',
  'Claude-User',
  'Claude-SearchBot',
  'PerplexityBot',
  'Google-Extended',
  'Applebot-Extended',
  'DuckAssistBot',
  'Meta-ExternalAgent',
  'CCBot',
  'Amazonbot',
  'Bytespider',
];

export const GET: APIRoute = ({ site }) => {
  const origin = site?.origin ?? 'https://www.tsalon.tech';
  const lines = [
    '# T Salon — robots.txt',
    '# AI crawlers are explicitly welcome. Full-text mirrors for retrieval are listed below.',
    '',
    'User-agent: *',
    'Allow: /',
    'Disallow: /api/',
    '',
    ...AI_CRAWLERS.map((bot) => `User-agent: ${bot}\nAllow: /\nDisallow: /api/\n`),
    'Sitemap: ' + origin + '/sitemap.xml',
    'Sitemap: ' + origin + '/sitemap-index.xml',
    '',
    '# Machine-readable content for AI retrieval',
    '# ' + origin + '/llms.txt',
    '# ' + origin + '/llms-full.txt',
    '# ' + origin + '/en/llms.txt',
    '# ' + origin + '/en/llms-full.txt',
    '',
  ];
  return new Response(lines.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
