import type { APIRoute } from 'astro';
import { getResetRadarData } from '../../../lib/reset-radar';
import { calculateResetWindow } from '../../../lib/reset-window';

export const prerender = false;

const CORS_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Accept, MCP-Protocol-Version',
  'Cache-Control': 'public, max-age=300, s-maxage=600, stale-while-revalidate=3600',
};

const TOOLS = [
  {
    name: 'get_reset_forecast',
    description:
      'Get latest verified quota reset events, bonus reset cards, historical cadence reference points, and 30-day statistics for OpenAI Codex, Anthropic Claude, and xAI Grok from T Salon WhenReset Radar.',
    inputSchema: {
      type: 'object',
      properties: {
        provider: {
          type: 'string',
          enum: ['all', 'codex', 'claude', 'grok', 'google'],
          description: 'Filter by AI coding provider (default: all)',
        },
      },
    },
  },
  {
    name: 'calculate_5h_window',
    description:
      'Calculate the assumed 5-hour rolling window recovery timestamp in Beijing time (UTC+8) from a known first-message timestamp (YYYY-MM-DDTHH:mm).',
    inputSchema: {
      type: 'object',
      properties: {
        knownStartBeijing: {
          type: 'string',
          description: 'Known window start in Beijing time, formatted as YYYY-MM-DDTHH:mm',
        },
      },
      required: ['knownStartBeijing'],
    },
  },
];

export const OPTIONS: APIRoute = async () => {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
};

export const GET: APIRoute = async () => {
  return new Response(
    JSON.stringify(
      {
        name: 'tsalon-whenreset-mcp',
        version: '1.1.0',
        protocol: 'mcp-streamable-http',
        endpoint: 'https://www.tsalon.tech/api/reset/mcp',
        documentation: 'https://www.tsalon.tech/whenreset/',
        attribution: 'Data: T Salon WhenReset Radar (https://www.tsalon.tech/whenreset/) & WhenReset.dev',
        tools: TOOLS,
        claudeCodeConfig: {
          mcpServers: {
            'tsalon-whenreset': {
              type: 'http',
              url: 'https://www.tsalon.tech/api/reset/mcp',
            },
          },
        },
      },
      null,
      2
    ),
    { status: 200, headers: CORS_HEADERS }
  );
};

export const POST: APIRoute = async ({ request }) => {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } }),
      { status: 400, headers: CORS_HEADERS }
    );
  }

  const id = body?.id ?? null;
  const method = body?.method;

  if (method === 'initialize') {
    return new Response(
      JSON.stringify({
        jsonrpc: '2.0',
        id,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: { tools: {} },
          serverInfo: { name: 'tsalon-whenreset-mcp', version: '1.1.0' },
        },
      }),
      { status: 200, headers: CORS_HEADERS }
    );
  }

  if (method === 'notifications/initialized') {
    return new Response(null, { status: 202, headers: CORS_HEADERS });
  }

  if (method === 'tools/list') {
    return new Response(
      JSON.stringify({ jsonrpc: '2.0', id, result: { tools: TOOLS } }),
      { status: 200, headers: CORS_HEADERS }
    );
  }

  if (method === 'tools/call') {
    const toolName = body?.params?.name;
    const args = body?.params?.arguments || {};

    if (toolName === 'calculate_5h_window') {
      const calc = calculateResetWindow(String(args.knownStartBeijing || ''), true);
      return new Response(
        JSON.stringify({
          jsonrpc: '2.0',
          id,
          result: {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  calc
                    ? {
                        valid: true,
                        knownStartBeijing: args.knownStartBeijing,
                        assumedEndBeijing: calc.endBeijing,
                        assumedEndIso: calc.endIso,
                        note: 'Assumes an exact 5-hour rolling window from the first request in the cycle.',
                        source: 'https://www.tsalon.tech/whenreset/claude-5-hour-calculator/',
                      }
                    : {
                        valid: false,
                        error: 'Invalid knownStartBeijing format. Expected YYYY-MM-DDTHH:mm in UTC+8.',
                      },
                  null,
                  2
                ),
              },
            ],
          },
        }),
        { status: 200, headers: CORS_HEADERS }
      );
    }

    if (toolName === 'get_reset_forecast') {
      const radar = await getResetRadarData();
      const providerArg = String(args.provider || 'all').toLowerCase();
      const summaryFor = (p: any) => ({
        provider: p.provider,
        name: p.name,
        lastGlobalResetBeijing: `${p.lastReset.dateBeijing} ${p.lastReset.timeBeijing}`.trim(),
        sinceLastReset: p.sinceLastReset.textEn,
        resetsPast30d: p.resets30d,
        cardsPast30d: p.cards30d,
        medianGlobalGapDays: p.typicalGapDays,
        historicalReferenceNextBeijing: `${p.nextEstimated.dateBeijing} ${p.nextEstimated.timeBeijing}`.trim(),
        historicalReferenceStatus: p.nextEstimated.relativeTextEn,
        latestEvent: p.latestEvent,
      });

      const payload =
        providerArg === 'codex' || providerArg === 'claude' || providerArg === 'grok' || providerArg === 'google'
          ? {
              status: radar.status,
              updatedAtBeijing: radar.updatedAtBeijing,
              provider: summaryFor((radar as any)[providerArg]),
              source: `https://www.tsalon.tech/whenreset/${providerArg}/`,
            }
          : {
              status: radar.status,
              updatedAtBeijing: radar.updatedAtBeijing,
              providers: {
                codex: summaryFor(radar.codex),
                claude: summaryFor(radar.claude),
                grok: summaryFor(radar.grok),
                google: {
                  ...summaryFor(radar.google),
                  dailySchedule: radar.google.dailySchedule,
                },
              },
              source: 'https://www.tsalon.tech/whenreset/',
            };

      return new Response(
        JSON.stringify({
          jsonrpc: '2.0',
          id,
          result: {
            content: [{ type: 'text', text: JSON.stringify(payload, null, 2) }],
          },
        }),
        { status: 200, headers: CORS_HEADERS }
      );
    }

    return new Response(
      JSON.stringify({ jsonrpc: '2.0', id, error: { code: -32601, message: `Unknown tool: ${toolName}` } }),
      { status: 400, headers: CORS_HEADERS }
    );
  }

  return new Response(
    JSON.stringify({ jsonrpc: '2.0', id, error: { code: -32601, message: `Unsupported method: ${method}` } }),
    { status: 400, headers: CORS_HEADERS }
  );
};
