// T Salon Token Agent — Node.js rewrite of agent.py
// Detects local AI-tool token usage and uploads to the leaderboard.
// Self-contained except for sql.js (sql-wasm.js + sql-wasm.wasm), which are
// expected to live next to this file (downloaded by token-agent.sh/.ps1).

import fs from 'fs';
import os from 'os';
import path from 'path';
import { randomUUID } from 'crypto';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { parseArgs } from 'util';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---------------------------------------------------------------------------
// SQLite via sql.js (WASM). Lazily initialized, wasm located next to this file.
// ---------------------------------------------------------------------------
let _SQL = null;
async function getSQL() {
  if (_SQL) return _SQL;
  const require = createRequire(import.meta.url);
  const initSqlJs = require('./sql-wasm.cjs');
  _SQL = await initSqlJs({
    locateFile: (f) => path.join(__dirname, f),
  });
  return _SQL;
}

// Node's built-in sqlite (Node >= 22.5) handles WAL-mode databases natively,
// so it reads workbuddy.db / Cursor / CodexManager correctly without any wasm
// download. We use it as the primary engine and fall back to sql.js (WASM)
// only when node:sqlite is unavailable (older Node).
let _nodeSqlite = null;
let _triedNodeSqlite = false;
async function getNodeSqlite() {
  if (_triedNodeSqlite) return _nodeSqlite;
  _triedNodeSqlite = true;
  try {
    _nodeSqlite = await import('node:sqlite');
  } catch {
    _nodeSqlite = null;
  }
  return _nodeSqlite;
}

// Normalize a node:sqlite row (object) or sql.js row (array) to an array,
// preserving column order so the rest of the code can use row[0], row[1]...
function toRowArray(r) {
  return Array.isArray(r) ? r : Object.values(r);
}

// Run a query against a SQLite file.
async function queryRows(dbPath, query) {
  if (!fileExists(dbPath)) return [];

  // Primary: Node built-in sqlite (WAL-safe, no wasm).
  const ns = await getNodeSqlite();
  if (ns && ns.DatabaseSync) {
    try {
      const db = new ns.DatabaseSync(dbPath, { readOnly: true });
      try {
        const stmt = db.prepare(query);
        const out = stmt.all().map(toRowArray);
        db.close();
        return out;
      } catch (e) {
        try { db.close(); } catch {}
        throw e;
      }
    } catch (e) {
      // fall through to sql.js
    }
  }

  // Fallback: sql.js (WASM). Reads a copy of the main db file; for WAL-mode
  // databases this may miss data held in the -wal file.
  const tmp = path.join(os.tmpdir(), `tsalon-${Date.now()}-${Math.random().toString(36).slice(2)}.db`);
  try {
    fs.copyFileSync(dbPath, tmp);
  } catch (e) {
    return [];
  }
  let rows = [];
  try {
    const SQL = await getSQL();
    const db = new SQL.Database(fs.readFileSync(tmp));
    const res = db.exec(query);
    if (res && res[0] && res[0].values) rows = res[0].values;
    db.close();
  } catch (e) {
    // ignore — tool not present / not a valid db
  } finally {
    try { fs.unlinkSync(tmp); } catch (e) {}
  }
  return rows;
}

// ---------------------------------------------------------------------------
// fs helpers
// ---------------------------------------------------------------------------
function fileExists(p) {
  try { return fs.statSync(p).isFile(); } catch { return false; }
}
function dirExists(p) {
  try { return fs.statSync(p).isDirectory(); } catch { return false; }
}
function walk(dir, cb) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const e of entries) {
    const full = path.join(dir, e.name);
    try {
      if (e.isDirectory()) walk(full, cb);
      else if (e.isFile()) cb(full);
    } catch { /* symlink loop etc. */ }
  }
}

// ---------------------------------------------------------------------------
// device id
// ---------------------------------------------------------------------------
function getOrCreateDeviceId(home) {
  const configDir = path.join(home, '.tsalon');
  try { fs.mkdirSync(configDir, { recursive: true }); } catch {}
  const deviceIdPath = path.join(configDir, 'device_id');
  if (fileExists(deviceIdPath)) {
    try {
      const did = fs.readFileSync(deviceIdPath, 'utf8').trim();
      if (did) return did;
    } catch {}
  }
  const newId = `dev_${randomUUID().replace(/-/g, '').slice(0, 16)}`;
  try { fs.writeFileSync(deviceIdPath, newId); } catch {}
  return newId;
}

// ---------------------------------------------------------------------------
// token formatting
// ---------------------------------------------------------------------------
function formatTokens(total, inp = 0, out = 0, cacheRead = 0, cacheWrite = 0) {
  if (inp === 0 && out === 0 && total > 0) {
    inp = Math.floor(total * 0.9);
    out = Math.floor(total * 0.1);
  }
  return {
    total: Math.floor(total),
    in: Math.floor(inp),
    out: Math.floor(out),
    cache_read: Math.floor(cacheRead),
    cache_write: Math.floor(cacheWrite),
  };
}

// Bucket an ISO timestamp into a Beijing (UTC+8) calendar date string.
// Claude Code session jsonl timestamps are ISO with an offset; converting to
// UTC+8 keeps daily buckets consistent with the server's beijingDateString.
function beijingDateStr(iso) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  const beijing = new Date(d.getTime() + 8 * 3600 * 1000);
  return beijing.toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------------
// directory-size estimate (cherry / kimi / generic extensions / agent logs)
// ---------------------------------------------------------------------------
function estimateTokensFromDirs(dirs, exts) {
  let totalBytes = 0;
  for (const d of dirs) {
    if (!dirExists(d)) continue;
    walk(d, (f) => {
      if (exts.some((ext) => f.toLowerCase().endsWith(ext))) {
        try { totalBytes += fs.statSync(f).size; } catch {}
      }
    });
  }
  return Math.floor(totalBytes / 3);
}

// ---------------------------------------------------------------------------
// Cursor (SQLite state.vscdb)
// ---------------------------------------------------------------------------
async function getCursorTokens(home) {
  const dbPaths = [
    path.join(home, 'Library', 'Application Support', 'Cursor', 'User', 'globalStorage', 'state.vscdb'),
    path.join(home, '.config', 'Cursor', 'User', 'globalStorage', 'state.vscdb'),
    path.join(process.env.APPDATA || '', 'Cursor', 'User', 'globalStorage', 'state.vscdb'),
  ];
  let tokens = 0;
  for (const p of dbPaths) {
    if (!p || !fileExists(p)) continue;
    try {
      const rows = await queryRows(p, "SELECT value FROM ItemTable WHERE key LIKE '%chat%' OR key LIKE '%history%'");
      for (const row of rows) {
        if (row[0]) tokens += Math.floor(String(row[0]).length / 3);
      }
    } catch {}
  }
  return formatTokens(tokens);
}

// ---------------------------------------------------------------------------
// Codex / CodexManager / OpenCodex (jsonl + SQLite)
// ---------------------------------------------------------------------------
async function getCodexTokens(home) {
  const tokens = {
    codex: { total: 0, in: 0, out: 0, cache_read: 0, cache_write: 0 },
    codex_proxy: { total: 0, in: 0, out: 0, cache_read: 0, cache_write: 0 },
    history: {},
  };

  function addHistory(dateStr, toolKey, stats) {
    if (!dateStr) return;
    if (!tokens.history[dateStr]) tokens.history[dateStr] = {};
    if (!tokens.history[dateStr][toolKey]) {
      tokens.history[dateStr][toolKey] = { total: 0, in: 0, out: 0, cache_read: 0, cache_write: 0 };
    }
    const t = tokens.history[dateStr][toolKey];
    for (const k of Object.keys(stats)) t[k] += stats[k];
  }

  // 1. ~/.codex/sessions/<year>/<month>/<day>/<session>.jsonl
  const sessionsDir = path.join(home, '.codex', 'sessions');
  if (dirExists(sessionsDir)) {
    const files = [];
    walk(sessionsDir, (f) => { if (f.endsWith('.jsonl')) files.push(f); });
    for (const sf of files) {
      const parts = sf.split(path.sep);
      let dtStr = null;
      const idx = parts.indexOf('sessions');
      if (idx >= 0 && parts.length >= idx + 4) {
        dtStr = `${parts[idx + 1]}-${parts[idx + 2]}-${parts[idx + 3]}`;
      }
      let lastUsage = null;
      try {
        const content = fs.readFileSync(sf, 'utf8');
        for (const line of content.split('\n')) {
          if (!line.trim()) continue;
          if (line.includes('token_count')) {
            try {
              const d = JSON.parse(line);
              const p = d.payload || {};
              if (p.type === 'token_count') {
                const info = p.info || {};
                if ('total_token_usage' in info) lastUsage = info.total_token_usage;
              }
            } catch {}
          }
        }
      } catch {}
      if (lastUsage) {
        const inp = parseInt(lastUsage.input_tokens) || 0;
        const out = parseInt(lastUsage.output_tokens) || 0;
        const cr = parseInt(lastUsage.cached_input_tokens || lastUsage.cache_read_input_tokens) || 0;
        const cw = parseInt(lastUsage.cache_write_input_tokens) || 0;
        const tot = parseInt(lastUsage.total_tokens) || (inp + out);
        const s = { total: tot, in: inp, out, cache_read: cr, cache_write: cw };
        for (const k of Object.keys(s)) tokens.codex[k] += s[k];
        addHistory(dtStr, 'codex', s);
      }
    }
  }

  // 2. ~/.opencodex/usage.jsonl
  const ocPaths = [
    path.join(home, '.opencodex', 'usage.jsonl'),
    path.join(home, '.config', 'opencodex', 'usage.jsonl'),
  ];
  for (const ocp of ocPaths) {
    if (!fileExists(ocp)) continue;
    try {
      const content = fs.readFileSync(ocp, 'utf8');
      for (const line of content.split('\n')) {
        if (!line.trim()) continue;
        try {
          const d = JSON.parse(line);
          const ts = d.timestamp;
          let dtStr = null;
          if (ts) {
            let t = ts;
            if (t > 1e11) t /= 1000;
            dtStr = new Date(t * 1000).toISOString().slice(0, 10);
          }
          const u = d.usage || {};
          const inp = parseInt(u.inputTokens) || 0;
          const out = parseInt((u.outputTokens || 0) + (u.reasoningOutputTokens || 0)) || 0;
          const cr = parseInt(u.cachedInputTokens || u.cacheReadInputTokens) || 0;
          const cw = parseInt(u.cacheCreationInputTokens) || 0;
          const tot = parseInt(u.totalTokens) || (inp + out);
          if (tot > 0) {
            const s = { total: tot, in: inp, out, cache_read: cr, cache_write: cw };
            for (const k of Object.keys(s)) tokens.codex_proxy[k] += s[k];
            addHistory(dtStr, 'codex_proxy', s);
          }
        } catch {}
      }
    } catch {}
  }

  // 3. CodexManager / state.sqlite (run always so dual users get both sources)
  const dbPaths = [
    path.join(home, 'Library', 'Application Support', 'com.codexmanager.desktop', 'codexmanager.db'),
    path.join(home, '.config', 'codexmanager', 'codexmanager.db'),
    path.join(process.env.APPDATA || '', 'CodexManager', 'codexmanager.db'),
    path.join(process.env.LOCALAPPDATA || '', 'CodexManager', 'codexmanager.db'),
  ];
  for (const d of ['.codex', '.opencodex']) {
    const dp = path.join(home, d);
    if (dirExists(dp)) {
      for (const f of fs.readdirSync(dp)) {
        if (f.endsWith('.sqlite')) dbPaths.push(path.join(dp, f));
      }
    }
  }
  for (const p of dbPaths) {
    if (!p || !fileExists(p)) continue;
    try {
      const rows = await queryRows(
        p,
        'SELECT actual_source_kind, created_at, SUM(input_tokens), SUM(output_tokens), SUM(cached_input_tokens), SUM(reasoning_output_tokens) FROM request_token_stats GROUP BY 1, 2'
      );
      for (const row of rows) {
        const source = row[0];
        let dt = null;
        const rawDt = row[1];
        if (typeof rawDt === 'number') {
          let t = rawDt;
          if (t > 1e11) t /= 1000;
          dt = new Date(t * 1000).toISOString().slice(0, 10);
        } else if (rawDt) {
          dt = String(rawDt).slice(0, 10);
        }
        const inp = parseInt(row[2]) || 0;
        const out = parseInt(row[3]) || 0;
        const reasoning = parseInt(row[5]) || 0;
        const out2 = out + reasoning;
        const cache = parseInt(row[4]) || 0;
        const tot = inp + out2 + cache;
        const s = { total: tot, in: inp, out: out2, cache_read: cache, cache_write: 0 };
        const target = (!source || /proxy/i.test(String(source)) || source !== 'openai_account') ? 'codex_proxy' : 'codex';
        for (const k of Object.keys(s)) tokens[target][k] += s[k];
        addHistory(dt, target, s);
      }
    } catch {}
  }

  return tokens;
}

// ---------------------------------------------------------------------------
// Claude Code — per-day history from session jsonl
// Modern Claude Code stores cumulative usage per session in
//   ~/.claude/projects/<encoded-path>/<session>.jsonl
// Each assistant/result entry carries a cumulative `usage` for that session.
// We take the FINAL cumulative usage of each session (overwriting as we scan,
// so we never double-count mid-session increments) and bucket it by the
// session's Beijing date. This yields both a true lifetime total AND a proper
// per-day history (like codex), instead of the old single-lump snapshot.
// We still read the per-project lastTotal*Tokens snapshot as a fallback for
// machines where the projects dir is absent or empty.
// ---------------------------------------------------------------------------
function getClaudeTokens(home) {
  // --- snapshot fallback (per-project lastTotal*Tokens / legacy usage) ---
  const claudePaths = [
    path.join(home, '.claude.json'),
    path.join(home, '.claude', 'usage.json'),
    path.join(process.env.APPDATA || '', 'Claude', 'usage.json'),
    path.join(process.env.LOCALAPPDATA || '', 'Claude', 'usage.json'),
  ];
  let snapIn = 0, snapOut = 0, snapCr = 0, snapCw = 0;
  for (const cp of claudePaths) {
    if (!cp || !fileExists(cp)) continue;
    try {
      const data = JSON.parse(fs.readFileSync(cp, 'utf8'));
      const projects = data.projects;
      if (projects && typeof projects === 'object') {
        for (const pv of Object.values(projects)) {
          if (!pv || typeof pv !== 'object') continue;
          snapIn += Number(pv.lastTotalInputTokens) || 0;
          snapOut += Number(pv.lastTotalOutputTokens) || 0;
          snapCr += Number(pv.lastTotalCacheReadInputTokens) || 0;
          snapCw += Number(pv.lastTotalCacheCreationInputTokens) || 0;
        }
      }
      const u = data.usage;
      if (u && typeof u === 'object') {
        snapIn += Number(u.input_tokens) || 0;
        snapOut += Number(u.output_tokens) || 0;
        snapCr += Number(u.cache_read_input_tokens) || 0;
        snapCw += Number(u.cache_creation_input_tokens) || 0;
      }
    } catch {}
  }
  const snapTotal = snapIn + snapOut + snapCr + snapCw;

  // --- true lifetime + per-day history from session jsonl ---
  const dayMap = {}; // dateStr -> {total,in,out,cache_read,cache_write}
  let jsonlTotal = 0;
  const projectsDir = path.join(home, '.claude', 'projects');
  if (dirExists(projectsDir)) {
    const files = [];
    walk(projectsDir, (f) => { if (f.endsWith('.jsonl')) files.push(f); });
    for (const sf of files) {
      let lastUsage = null;
      let sessDate = null;
      try {
        const content = fs.readFileSync(sf, 'utf8');
        for (const line of content.split('\n')) {
          if (!line.trim()) continue;
          let d;
          try { d = JSON.parse(line); } catch { continue; }
          if (!d || typeof d !== 'object') continue;
          if (!sessDate) {
            const bd = beijingDateStr(d.timestamp);
            if (bd) sessDate = bd;
          }
          const u = d.usage;
          if (u && typeof u === 'object') {
            const inT = Number(u.input_tokens) || 0;
            const outT = Number(u.output_tokens) || 0;
            const cwT = Number(u.cache_creation_input_tokens) || 0;
            const crT = Number(u.cache_read_input_tokens) || 0;
            if (inT || outT || cwT || crT) {
              lastUsage = { in: inT, out: outT, cache_read: crT, cache_write: cwT };
            }
          }
        }
      } catch {}
      if (lastUsage && sessDate) {
        const tot = lastUsage.in + lastUsage.out + lastUsage.cache_read + lastUsage.cache_write;
        if (!dayMap[sessDate]) dayMap[sessDate] = { total: 0, in: 0, out: 0, cache_read: 0, cache_write: 0 };
        const m = dayMap[sessDate];
        m.total += tot; m.in += lastUsage.in; m.out += lastUsage.out;
        m.cache_read += lastUsage.cache_read; m.cache_write += lastUsage.cache_write;
        jsonlTotal += tot;
      }
    }
  }

  // Prefer the true jsonl lifetime; fall back to snapshot only if no jsonl data.
  const useJsonl = jsonlTotal > 0;
  const total = useJsonl ? Math.max(jsonlTotal, snapTotal) : snapTotal;
  const inT = useJsonl ? Object.values(dayMap).reduce((a, m) => a + m.in, 0) : snapIn;
  const outT = useJsonl ? Object.values(dayMap).reduce((a, m) => a + m.out, 0) : snapOut;
  const crT = useJsonl ? Object.values(dayMap).reduce((a, m) => a + m.cache_read, 0) : snapCr;
  const cwT = useJsonl ? Object.values(dayMap).reduce((a, m) => a + m.cache_write, 0) : snapCw;

  // history[date][tool] matches the codex shape the server already consumes.
  const history = {};
  for (const [dateStr, m] of Object.entries(dayMap)) {
    history[dateStr] = {
      claude: { total: m.total, in: m.in, out: m.out, cache_read: m.cache_read, cache_write: m.cache_write },
    };
  }
  return { claude: formatTokens(total, inT, outT, crT, cwT), history };
}

// ---------------------------------------------------------------------------
// generic app / extension / agent-log scanners (byte estimates)
// ---------------------------------------------------------------------------
function scanGenericApp(home, folderNames) {
  const dirs = [];
  for (const fn of folderNames) dirs.push(path.join(home, 'Library', 'Application Support', fn));
  const appdata = process.env.APPDATA || '';
  const localappdata = process.env.LOCALAPPDATA || '';
  for (const fn of folderNames) {
    if (appdata) dirs.push(path.join(appdata, fn));
    if (localappdata) dirs.push(path.join(localappdata, fn));
  }
  for (const fn of folderNames) dirs.push(path.join(home, '.config', fn));
  const exts = ['.json', '.log', '.txt', '.db', '.sqlite', '.vscdb', '.jsonl'];
  return formatTokens(estimateTokensFromDirs(dirs, exts));
}

function scanGenericExtension(home, keywords) {
  const dirs = [];
  const extDir = path.join(home, '.vscode', 'extensions');
  if (dirExists(extDir)) {
    for (const d of fs.readdirSync(extDir)) {
      if (keywords.some((kw) => d.toLowerCase().includes(kw.toLowerCase()))) {
        dirs.push(path.join(extDir, d));
      }
    }
  }
  for (const base of [
    path.join(home, 'Library', 'Application Support', 'Code', 'User', 'globalStorage'),
    path.join(home, '.config', 'Code', 'User', 'globalStorage'),
  ]) {
    if (!dirExists(base)) continue;
    for (const d of fs.readdirSync(base)) {
      if (keywords.some((kw) => d.toLowerCase().includes(kw.toLowerCase()))) {
        dirs.push(path.join(base, d));
      }
    }
  }
  const exts = ['.json', '.log', '.txt', '.db', '.sqlite', '.vscdb', '.jsonl'];
  return formatTokens(estimateTokensFromDirs(dirs, exts));
}

function scanAgentLogs(home, folderName) {
  return formatTokens(estimateTokensFromDirs([path.join(home, folderName)], ['.jsonl', '.json', '.log', '.txt']));
}

// ---------------------------------------------------------------------------
// WorkBuddy (SQLite session_usage, WorkBuddy's own billing metric)
// ---------------------------------------------------------------------------
async function scanWorkbuddy(home) {
  const dbPaths = [path.join(home, '.workbuddy', 'workbuddy.db')];
  const appdata = process.env.APPDATA || '';
  if (appdata) dbPaths.push(path.join(appdata, 'workbuddy', 'workbuddy.db'));
  let total = 0;
  for (const dbPath of dbPaths) {
    if (!fileExists(dbPath)) continue;
    try {
      const rows = await queryRows(dbPath, 'SELECT SUM(used) FROM session_usage');
      if (rows && rows[0] && rows[0][0]) total += parseInt(rows[0][0]) || 0;
    } catch {}
  }
  return formatTokens(total);
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------
async function main() {
  const { values } = parseArgs({
    args: process.argv.slice(2),
    options: {
      token: { type: 'string' },
      host: { type: 'string', default: 'https://www.tsalon.tech' },
      'dry-run': { type: 'boolean', default: false },
    },
  });
  const token = values.token;
  const host = values.host;
  const dryRun = values['dry-run'];

  if (!token) {
    console.error('❌ Error: --token is required.');
    process.exit(1);
  }

  console.log('🚀 [T Salon Token Agent] Starting extraction...');
  const home = os.homedir();

  const results = {};
  const history = {};

  console.log('Scanning Cursor...');
  results.cursor = await getCursorTokens(home);

  console.log('Scanning CodexManager...');
  const codexData = await getCodexTokens(home);
  results.codex = codexData.codex;
  results.codex_proxy = codexData.codex_proxy;
  if (codexData.history) Object.assign(history, codexData.history);

  console.log('Scanning Claude Code...');
  const claudeData = getClaudeTokens(home);
  results.claude = claudeData.claude;
  if (claudeData.history) Object.assign(history, claudeData.history);

  console.log('Scanning generic tools...');
  results.cherry = scanGenericApp(home, ['cherry-studio', 'CherryStudio']);
  results.kimi = scanGenericExtension(home, ['kimi', 'moonshot']);
  results.antigravity = scanAgentLogs(home, '.gemini/antigravity');
  results.openclaw = scanAgentLogs(home, '.openclaw');
  results.hermes = scanAgentLogs(home, '.hermes');
  results.qorder = scanGenericExtension(home, ['qorder', 'lingma', 'tongyi']);
  results.workbuddy = await scanWorkbuddy(home);

  const finalTokens = {};
  for (const [k, v] of Object.entries(results)) {
    if (v && typeof v === 'object' && (v.total || 0) > 0) finalTokens[k] = v;
  }
  const totalAll = Object.values(finalTokens).reduce((a, v) => a + (v.total || 0), 0);
  finalTokens.total = totalAll;
  if (Object.keys(history).length) finalTokens.history = history;

  console.log('📊 Extracted Data:');
  for (const [k, v] of Object.entries(finalTokens)) {
    if (k === 'history' || k === 'total') continue;
    console.log(`  - ${k.charAt(0).toUpperCase() + k.slice(1)}: ${v.total.toLocaleString()} tokens (In: ${v.in.toLocaleString()}, Out: ${v.out.toLocaleString()}, Cache: ${v.cache_read.toLocaleString()})`);
  }
  console.log(`  => Grand Total: ${totalAll.toLocaleString()} tokens`);

  const deviceId = getOrCreateDeviceId(home);
  const payload = { token, device_id: deviceId, data: finalTokens };

  if (dryRun) {
    console.log('🧪 DRY-RUN: not uploading. Payload:');
    console.log(JSON.stringify(payload, null, 2));
    return;
  }

  try {
    const resp = await fetch(`${host}/api/rank/upload/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const result = await resp.json();
    if (result && result.success) {
      console.log('✅ Successfully uploaded token data to T Salon Leaderboard!');
    } else {
      console.log(`❌ Upload failed: ${result && result.message ? result.message : 'unknown error'}`);
    }
  } catch (e) {
    console.log(`❌ Failed to connect to server: ${e}`);
  }
}

main().catch((e) => {
  console.error('Fatal error:', e);
  process.exit(1);
});
