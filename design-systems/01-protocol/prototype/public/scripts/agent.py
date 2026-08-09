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

def get_file_size(path):
    try:
        return os.path.getsize(path)
    except:
        return 0

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
    return tokens

def get_codex_tokens(home):
    db_path = os.path.join(home, '.codex', 'sqlite', 'codex-dev.db')
    tokens = 0
    if os.path.exists(db_path):
        try:
            rows = query_locked_sqlite(db_path, "SELECT payload_json FROM thread_timeline_ledger")
            for row in rows:
                if row[0]:
                    tokens += len(str(row[0])) // 3
        except:
            pass
    return tokens

def get_claude_tokens(home):
    claude_path = os.path.join(home, '.claude.json')
    if os.path.exists(claude_path):
        try:
            with open(claude_path, 'r') as f:
                data = json.load(f)
                return data.get('total_tokens', 0)
        except:
            pass
    return 0

def scan_generic_extension(home, keywords):
    dirs_to_scan = []
    # VSCode Extensions
    ext_dir = os.path.join(home, '.vscode', 'extensions')
    if os.path.exists(ext_dir):
        for d in os.listdir(ext_dir):
            if any(kw.lower() in d.lower() for kw in keywords):
                dirs_to_scan.append(os.path.join(ext_dir, d))
                
    # VSCode Global Storage
    for base in [os.path.join(home, 'Library', 'Application Support', 'Code', 'User', 'globalStorage'),
                 os.path.join(home, '.config', 'Code', 'User', 'globalStorage')]:
        if os.path.exists(base):
            for d in os.listdir(base):
                if any(kw.lower() in d.lower() for kw in keywords):
                    dirs_to_scan.append(os.path.join(base, d))
                    
    exts = ['.json', '.log', '.txt', '.db', '.sqlite', '.vscdb', '.jsonl']
    return estimate_tokens_from_dirs(dirs_to_scan, exts)

def scan_agent_logs(home, folder_name):
    dirs = [os.path.join(home, folder_name)]
    exts = ['.jsonl', '.json', '.log', '.txt']
    return estimate_tokens_from_dirs(dirs, exts)

def main():
    parser = argparse.ArgumentParser(description='T Salon Token Agent')
    parser.add_argument('--token', required=True, help='Your personal T Salon access token')
    parser.add_argument('--host', default='https://www.tsalon.tech', help='API Host')
    args = parser.parse_args()

    print("🚀 [T Salon Token Agent] Starting extraction...")
    home = str(Path.home())
    
    # Plugin Registry
    results = {}
    
    print("Scanning Cursor...")
    results['cursor'] = get_cursor_tokens(home)
    
    print("Scanning Claude Code...")
    results['claude'] = get_claude_tokens(home)
    
    print("Scanning Codex...")
    results['codex'] = get_codex_tokens(home)
    
    print("Scanning Antigravity...")
    results['antigravity'] = scan_agent_logs(home, '.gemini/antigravity')
    
    print("Scanning OpenClaw...")
    results['openclaw'] = scan_agent_logs(home, '.openclaw')
    
    print("Scanning Hermes...")
    results['hermes'] = scan_agent_logs(home, '.hermes')
    
    print("Scanning Kimi Code...")
    results['kimi'] = scan_generic_extension(home, ['kimi', 'moonshot'])
    
    print("Scanning Qorder...")
    results['qorder'] = scan_generic_extension(home, ['qorder', 'lingma', 'tongyi'])
    
    print("Scanning Workbuddy...")
    results['workbuddy'] = scan_generic_extension(home, ['workbuddy'])
    
    # Filter out empty ones to keep the payload clean
    final_tokens = {k: v for k, v in results.items() if v > 0}
    total = sum(final_tokens.values())
    final_tokens['total'] = total
    
    print(f"📊 Extracted Data:")
    for k, v in final_tokens.items():
        if k != 'total':
            print(f"  - {k.capitalize()}: {v:,} tokens")
    print(f"  => Total: {total:,} tokens")
    
    device_id = get_or_create_device_id(home)
    
    payload = {
        'token': args.token,
        'device_id': device_id,
        'data': final_tokens
    }
    
    # Send data
    try:
        # Note: Added trailing slash to match Vercel's trailingSlash: true configuration
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
