import os
import sqlite3
import json
import urllib.request
import argparse
import sys
from pathlib import Path
import glob

def get_file_size(path):
    try:
        return os.path.getsize(path)
    except:
        return 0

def estimate_tokens_from_files(file_patterns):
    total_bytes = 0
    for pattern in file_patterns:
        for filepath in glob.glob(pattern, recursive=True):
            if os.path.isfile(filepath):
                total_bytes += get_file_size(filepath)
    # Estimate 1 token = 3 bytes of raw log/json data
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
                conn = sqlite3.connect(p)
                cursor = conn.cursor()
                cursor.execute("SELECT value FROM ItemTable WHERE key LIKE '%chat%' OR key LIKE '%history%'")
                rows = cursor.fetchall()
                for row in rows:
                    if row[0]:
                        tokens += len(str(row[0])) // 3
                conn.close()
            except:
                pass
    return tokens

def get_codex_tokens(home):
    db_path = os.path.join(home, '.codex', 'sqlite', 'codex-dev.db')
    tokens = 0
    if os.path.exists(db_path):
        try:
            conn = sqlite3.connect(db_path)
            cursor = conn.cursor()
            cursor.execute("SELECT payload_json FROM thread_timeline_ledger")
            rows = cursor.fetchall()
            for row in rows:
                if row[0]:
                    tokens += len(str(row[0])) // 3
            conn.close()
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
    patterns = []
    for kw in keywords:
        # VSCode Extensions
        patterns.append(os.path.join(home, '.vscode', 'extensions', f'*{kw}*', '**', '*.json'))
        patterns.append(os.path.join(home, '.vscode', 'extensions', f'*{kw}*', '**', '*.log'))
        # VSCode Global Storage
        patterns.append(os.path.join(home, 'Library', 'Application Support', 'Code', 'User', 'globalStorage', f'*{kw}*', '**', '*'))
        patterns.append(os.path.join(home, '.config', 'Code', 'User', 'globalStorage', f'*{kw}*', '**', '*'))
    return estimate_tokens_from_files(patterns)

def scan_agent_logs(home, folder_name):
    patterns = [
        os.path.join(home, folder_name, '**', '*.jsonl'),
        os.path.join(home, folder_name, '**', '*.json'),
        os.path.join(home, folder_name, '**', '*.log')
    ]
    return estimate_tokens_from_files(patterns)

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
    
    payload = {
        'token': args.token,
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
