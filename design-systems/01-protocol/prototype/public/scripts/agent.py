import os
import sqlite3
import json
import urllib.request
import argparse
import sys
from pathlib import Path
import glob
import shutil
import tempfile
import uuid

def get_or_create_device_id(home):
    config_dir = os.path.join(home, '.tsalon')
    os.makedirs(config_dir, exist_ok=True)
    device_id_path = os.path.join(config_dir, 'device_id')
    
    if os.path.exists(device_id_path):
        try:
            with open(device_id_path, 'r') as f:
                did = f.read().strip()
                if did: return did
        except:
            pass
            
    new_id = f"dev_{uuid.uuid4().hex[:16]}"
    try:
        with open(device_id_path, 'w') as f:
            f.write(new_id)
    except:
        pass
    return new_id

def query_locked_sqlite(db_path, query):
    tmp_path = None
    try:
        tmp_fd, tmp_path = tempfile.mkstemp(suffix=".db")
        os.close(tmp_fd)
        shutil.copy2(db_path, tmp_path)
        
        conn = sqlite3.connect(tmp_path)
        cursor = conn.cursor()
        cursor.execute(query)
        rows = cursor.fetchall()
        conn.close()
        
        os.remove(tmp_path)
        return rows
    except Exception as e:
        if tmp_path and os.path.exists(tmp_path):
            os.remove(tmp_path)
        raise e

def estimate_tokens_from_dirs(dirs, exts):
    total_bytes = 0
    for d in dirs:
        if not os.path.exists(d):
            continue
        for root, _, files in os.walk(d):
            for f in files:
                if any(f.lower().endswith(ext) for ext in exts):
                    try:
                        total_bytes += os.path.getsize(os.path.join(root, f))
                    except:
                        pass
    return total_bytes // 3

def format_tokens(total, inp=0, out=0, cache_read=0, cache_write=0):
    if inp == 0 and out == 0 and total > 0:
        inp = int(total * 0.9)
        out = int(total * 0.1)
    return {
        "total": int(total),
        "in": int(inp),
        "out": int(out),
        "cache_read": int(cache_read),
        "cache_write": int(cache_write)
    }

def get_cursor_tokens(home):
    db_paths = [
        os.path.join(home, 'Library', 'Application Support', 'Cursor', 'User', 'globalStorage', 'state.vscdb'),
        os.path.join(home, '.config', 'Cursor', 'User', 'globalStorage', 'state.vscdb'),
        os.path.join(os.environ.get('APPDATA', ''), 'Cursor', 'User', 'globalStorage', 'state.vscdb')
    ]
    tokens = 0
    for p in db_paths:
        if os.path.exists(p):
            try:
                rows = query_locked_sqlite(p, "SELECT value FROM ItemTable WHERE key LIKE '%chat%' OR key LIKE '%history%'")
                for row in rows:
                    if row[0]:
                        tokens += len(str(row[0])) // 3
            except:
                pass
    return format_tokens(tokens)

def get_codex_tokens(home):
    tokens = {
        'codex': {'total':0, 'in':0, 'out':0, 'cache_read':0, 'cache_write':0},
        'codex_proxy': {'total':0, 'in':0, 'out':0, 'cache_read':0, 'cache_write':0},
        'history': {}
    }
    
    def add_history(date_str, tool_key, stats):
        if date_str not in tokens['history']:
            tokens['history'][date_str] = {}
        if tool_key not in tokens['history'][date_str]:
            tokens['history'][date_str][tool_key] = {'total':0, 'in':0, 'out':0, 'cache_read':0, 'cache_write':0}
        for k, v in stats.items():
            tokens['history'][date_str][tool_key][k] += v

    # 1. Parse ~/.codex/sessions/*/*/*/*.jsonl (Direct Codex Agent Sessions)
    session_files = glob.glob(os.path.join(home, '.codex', 'sessions', '*', '*', '*', '*.jsonl'))
    for sf in session_files:
        parts = sf.split(os.sep)
        try:
            idx = parts.index('sessions')
            dt_str = f"{parts[idx+1]}-{parts[idx+2]}-{parts[idx+3]}"
        except:
            dt_str = None

        last_usage = None
        try:
            with open(sf, 'r', encoding='utf-8', errors='ignore') as fp:
                for line in fp:
                    if 'token_count' in line:
                        try:
                            d = json.loads(line)
                            p = d.get('payload', {})
                            if p.get('type') == 'token_count':
                                info = p.get('info', {})
                                if 'total_token_usage' in info:
                                    last_usage = info['total_token_usage']
                        except:
                            pass
            if last_usage:
                inp = int(last_usage.get('input_tokens') or 0)
                out = int(last_usage.get('output_tokens') or 0)
                cr = int(last_usage.get('cached_input_tokens') or last_usage.get('cache_read_input_tokens') or 0)
                cw = int(last_usage.get('cache_write_input_tokens') or 0)
                tot = int(last_usage.get('total_tokens') or (inp + out))  # kept for reference; not used as score
                # Leaderboard token score = output (generation), NOT total_tokens.
                # total_tokens sums the re-sent conversation context every turn,
                # which inflates a single session to billions (fake). in/out/cache
                # breakdown stays real so cost is still billed accurately.
                stats_obj = {'total': out, 'in': inp, 'out': out, 'cache_read': cr, 'cache_write': cw}
                for k in stats_obj:
                    tokens['codex'][k] += stats_obj[k]
                if dt_str:
                    add_history(dt_str, 'codex', stats_obj)
        except Exception:
            pass

    # 2. Parse ~/.opencodex/usage.jsonl (OpenCodex Proxy Gateway)
    oc_usage_paths = [
        os.path.join(home, '.opencodex', 'usage.jsonl'),
        os.path.join(home, '.config', 'opencodex', 'usage.jsonl')
    ]
    for ocp in oc_usage_paths:
        if os.path.exists(ocp):
            try:
                with open(ocp, 'r', encoding='utf-8', errors='ignore') as fp:
                    for line in fp:
                        if not line.strip(): continue
                        try:
                            d = json.loads(line)
                            ts = d.get('timestamp')
                            if ts:
                                if ts > 1e11: ts /= 1000
                                import datetime
                                dt_str = datetime.datetime.fromtimestamp(ts).strftime('%Y-%m-%d')
                            else:
                                dt_str = None
                            
                            u = d.get('usage') or {}
                            inp = int(u.get('inputTokens') or 0)
                            out = int((u.get('outputTokens') or 0) + (u.get('reasoningOutputTokens') or 0))
                            cr = int(u.get('cachedInputTokens') or u.get('cacheReadInputTokens') or 0)
                            cw = int(u.get('cacheCreationInputTokens') or 0)
                            tot = int(u.get('totalTokens') or (inp + out))
                            if tot > 0:
                                stats_obj = {'total': out, 'in': inp, 'out': out, 'cache_read': cr, 'cache_write': cw}
                                for k in stats_obj:
                                    tokens['codex_proxy'][k] += stats_obj[k]
                                if dt_str:
                                    add_history(dt_str, 'codex_proxy', stats_obj)
                        except:
                            pass
            except Exception:
                pass

    # 3. Parse SQLite databases (CodexManager / state.sqlite) if no session files were found
    if tokens['codex']['total'] == 0:
        db_paths = [
            os.path.join(home, 'Library', 'Application Support', 'com.codexmanager.desktop', 'codexmanager.db'),
            os.path.join(home, '.config', 'codexmanager', 'codexmanager.db'),
            os.path.join(os.environ.get('APPDATA', ''), 'CodexManager', 'codexmanager.db'),
            os.path.join(os.environ.get('LOCALAPPDATA', ''), 'CodexManager', 'codexmanager.db')
        ]
        for d in ['.codex', '.opencodex']:
            dp = os.path.join(home, d)
            if os.path.exists(dp):
                for f in os.listdir(dp):
                    if f.endswith('.sqlite'):
                        db_paths.append(os.path.join(dp, f))

        for p in db_paths:
            if not p or not os.path.exists(p):
                continue
            try:
                rows = query_locked_sqlite(p, "SELECT actual_source_kind, created_at, SUM(input_tokens), SUM(output_tokens), SUM(cached_input_tokens), SUM(reasoning_output_tokens) FROM request_token_stats GROUP BY 1, 2")
                if rows:
                    for row in rows:
                        source = row[0]
                        raw_dt = row[1]
                        if isinstance(raw_dt, (int, float)):
                            if raw_dt > 1e11: raw_dt /= 1000
                            import datetime
                            dt = datetime.datetime.utcfromtimestamp(raw_dt).strftime('%Y-%m-%d')
                        elif raw_dt:
                            dt = str(raw_dt)[:10]
                        else:
                            dt = None
                        
                        inp = int(row[2]) if row[2] else 0
                        out = int(row[3]) if row[3] else 0
                        reasoning = int(row[5]) if len(row) > 5 and row[5] else 0
                        out += reasoning
                        cache = int(row[4]) if len(row) > 4 and row[4] else 0
                        tot = inp + out + cache  # kept for reference; not used as score
                        stats_obj = {'total': out, 'in': inp, 'out': out, 'cache_read': cache, 'cache_write': 0}
                        
                        target_tool = 'codex_proxy' if (not source or 'proxy' in source.lower() or source != 'openai_account') else 'codex'
                        for k in stats_obj: tokens[target_tool][k] += stats_obj[k]
                        if dt: add_history(dt, target_tool, stats_obj)
            except Exception:
                pass

    return tokens

def get_claude_tokens(home):
    claude_paths = [
        os.path.join(home, '.claude.json'),
        os.path.join(home, '.claude', 'usage.json'),
        os.path.join(os.environ.get('APPDATA', ''), 'Claude', 'usage.json'),
        os.path.join(os.environ.get('LOCALAPPDATA', ''), 'Claude', 'usage.json')
    ]
    tot, inp, out, cr, cw = 0, 0, 0, 0, 0
    for cp in claude_paths:
        if cp and os.path.exists(cp):
            try:
                with open(cp, 'r') as f:
                    data = json.load(f)
                    u = data.get('usage', data)
                    
                    if 'input_tokens' in u: inp += u['input_tokens']
                    if 'output_tokens' in u: out += u['output_tokens']
                    if 'cache_read_input_tokens' in u: cr += u['cache_read_input_tokens']
                    if 'cache_creation_input_tokens' in u: cw += u['cache_creation_input_tokens']
                    
                    if 'total_tokens' in u:
                        tot += u['total_tokens']
                    else:
                        tot += inp + out + cr + cw
            except:
                pass
    return format_tokens(tot, inp, out, cr, cw)

def scan_generic_app(home, folder_names):
    dirs_to_scan = []
    for fn in folder_names:
        dirs_to_scan.append(os.path.join(home, 'Library', 'Application Support', fn))
    appdata = os.environ.get('APPDATA', '')
    localappdata = os.environ.get('LOCALAPPDATA', '')
    for fn in folder_names:
        if appdata: dirs_to_scan.append(os.path.join(appdata, fn))
        if localappdata: dirs_to_scan.append(os.path.join(localappdata, fn))
    for fn in folder_names:
        dirs_to_scan.append(os.path.join(home, '.config', fn))
    exts = ['.json', '.log', '.txt', '.db', '.sqlite', '.vscdb', '.jsonl']
    return format_tokens(estimate_tokens_from_dirs(dirs_to_scan, exts))

def scan_generic_extension(home, keywords):
    dirs_to_scan = []
    ext_dir = os.path.join(home, '.vscode', 'extensions')
    if os.path.exists(ext_dir):
        for d in os.listdir(ext_dir):
            if any(kw.lower() in d.lower() for kw in keywords):
                dirs_to_scan.append(os.path.join(ext_dir, d))
    for base in [os.path.join(home, 'Library', 'Application Support', 'Code', 'User', 'globalStorage'),
                 os.path.join(home, '.config', 'Code', 'User', 'globalStorage')]:
        if os.path.exists(base):
            for d in os.listdir(base):
                if any(kw.lower() in d.lower() for kw in keywords):
                    dirs_to_scan.append(os.path.join(base, d))
    exts = ['.json', '.log', '.txt', '.db', '.sqlite', '.vscdb', '.jsonl']
    return format_tokens(estimate_tokens_from_dirs(dirs_to_scan, exts))

def scan_agent_logs(home, folder_name):
    return format_tokens(estimate_tokens_from_dirs([os.path.join(home, folder_name)], ['.jsonl', '.json', '.log', '.txt']))

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--token', required=True)
    parser.add_argument('--host', default='https://www.tsalon.tech')
    args = parser.parse_args()

    print("🚀 [T Salon Token Agent] Starting extraction...")
    home = str(Path.home())
    
    results = {}
    history = {}
    
    print("Scanning Cursor...")
    results['cursor'] = get_cursor_tokens(home)
    
    print("Scanning CodexManager...")
    codex_data = get_codex_tokens(home)
    results['codex'] = codex_data.get('codex')
    results['codex_proxy'] = codex_data.get('codex_proxy')
    if 'history' in codex_data:
        history = codex_data['history']
    
    print("Scanning Claude Code...")
    results['claude'] = get_claude_tokens(home)
    
    print("Scanning generic tools...")
    results['cherry'] = scan_generic_app(home, ['cherry-studio', 'CherryStudio'])
    results['kimi'] = scan_generic_extension(home, ['kimi', 'moonshot'])
    results['antigravity'] = scan_agent_logs(home, '.gemini/antigravity')
    results['openclaw'] = scan_agent_logs(home, '.openclaw')
    results['hermes'] = scan_agent_logs(home, '.hermes')
    results['qorder'] = scan_generic_extension(home, ['qorder', 'lingma', 'tongyi'])
    results['workbuddy'] = scan_generic_extension(home, ['workbuddy'])
    
    final_tokens = {}
    for k, v in results.items():
        if v and isinstance(v, dict) and v.get('total', 0) > 0:
            final_tokens[k] = v
            
    total_all = sum(v.get('total', 0) for v in final_tokens.values())
    final_tokens['total'] = total_all
    if history:
        final_tokens['history'] = history
    
    print(f"📊 Extracted Data:")
    for k, v in final_tokens.items():
        if k == 'history' or k == 'total':
            continue
        print(f"  - {k.capitalize()}: {v['total']:,} tokens (In: {v.get('in', 0):,}, Out: {v.get('out', 0):,}, Cache: {v.get('cache_read', 0):,})")
    print(f"  => Grand Total: {total_all:,} tokens")
    
    device_id = get_or_create_device_id(home)
    
    payload = {
        'token': args.token,
        'device_id': device_id,
        'data': final_tokens
    }
    
    try:
        req = urllib.request.Request(f"{args.host}/api/rank/upload/", data=json.dumps(payload).encode('utf-8'), headers={'Content-Type': 'application/json'})
        with urllib.request.urlopen(req, timeout=10) as response:
            result = json.loads(response.read().decode('utf-8'))
        if result.get('success'):
            print("✅ Successfully uploaded token data to T Salon Leaderboard!")
        else:
            print(f"❌ Upload failed: {result.get('message')}")
    except Exception as e:
        print(f"❌ Failed to connect to server: {e}")

if __name__ == '__main__':
    main()
