#!/bin/bash
# T Salon Token Agent bootstrap for macOS/Linux.
# Installs login/startup and daily schedulers, then runs one upload immediately.

set -u

TOKEN=""
HOST="https://www.tsalon.tech"
INSTALL=0
SCHEDULED_RUN=0

for arg in "$@"; do
  case "$arg" in
    --token=*) TOKEN="${arg#*=}" ;;
    --host=*) HOST="${arg#*=}" ;;
    --install) INSTALL=1 ;;
    --scheduled-run) SCHEDULED_RUN=1 ;;
  esac
done

if [ -z "$TOKEN" ]; then
  echo "❌ Error: --token is required."
  exit 1
fi

# Values are embedded into a user-owned scheduler file. Restrict their syntax
# so a copied/modified install command cannot inject shell or XML fragments.
if ! printf '%s' "$TOKEN" | grep -Eq '^[A-Za-z0-9._-]+$'; then
  echo "❌ Error: invalid upload token format."
  exit 1
fi
if ! printf '%s' "$HOST" | grep -Eq '^https?://[A-Za-z0-9./:_-]+$'; then
  echo "❌ Error: invalid host URL."
  exit 1
fi

TSALON_DIR="$HOME/.tsalon"
mkdir -p "$TSALON_DIR"
chmod 700 "$TSALON_DIR" 2>/dev/null || true

find_node() {
  if command -v node >/dev/null 2>&1; then
    command -v node
    return 0
  fi
  if command -v nodejs >/dev/null 2>&1; then
    command -v nodejs
    return 0
  fi

  # launchd/cron do not load interactive shell setup, so NVM/FNM/Homebrew Node
  # must be found by absolute path.
  local found=""
  for candidate in \
    /opt/homebrew/bin/node \
    /usr/local/bin/node \
    "$HOME"/.nvm/versions/node/*/bin/node \
    "$HOME"/.fnm/node-versions/*/installation/bin/node \
    "$HOME"/.local/share/fnm/node-versions/*/installation/bin/node; do
    if [ -x "$candidate" ]; then found="$candidate"; fi
  done
  if [ -n "$found" ]; then
    printf '%s\n' "$found"
    return 0
  fi
  return 1
}

CURL_BIN="$(command -v curl 2>/dev/null || true)"
if [ -z "$CURL_BIN" ] && [ -x /usr/bin/curl ]; then CURL_BIN=/usr/bin/curl; fi
if [ -z "$CURL_BIN" ]; then
  echo "❌ Error: curl is required."
  exit 1
fi

install_macos_launch_agent() {
  local label="tech.tsalon.token-agent"
  local launch_dir="$HOME/Library/LaunchAgents"
  local plist="$launch_dir/$label.plist"
  local runner="$TSALON_DIR/run-agent.sh"
  local uid
  uid="$(id -u)"

  mkdir -p "$launch_dir"
  cat > "$runner" <<EOF
#!/bin/bash
exec /bin/bash -c "\$(/usr/bin/curl -fsSL -H 'Cache-Control: no-cache' '$HOST/scripts/token-agent.sh?v=8')" -- --token='$TOKEN' --host='$HOST' --scheduled-run
EOF
  chmod 700 "$runner"

  cat > "$plist" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>$label</string>
  <key>ProgramArguments</key>
  <array><string>/bin/bash</string><string>$runner</string></array>
  <key>RunAtLoad</key><true/>
  <key>StartCalendarInterval</key>
  <dict>
    <key>Hour</key><integer>9</integer>
    <key>Minute</key><integer>17</integer>
  </dict>
  <key>ProcessType</key><string>Background</string>
  <key>StandardOutPath</key><string>$TSALON_DIR/agent.log</string>
  <key>StandardErrorPath</key><string>$TSALON_DIR/agent.log</string>
</dict>
</plist>
EOF
  chmod 600 "$plist"

  launchctl bootout "gui/$uid" "$plist" >/dev/null 2>&1 || true
  if launchctl bootstrap "gui/$uid" "$plist" >/dev/null 2>&1 || launchctl load "$plist" >/dev/null 2>&1; then
    echo "✓ macOS login agent installed (at login + daily at 09:17)."
    # Remove only our legacy cron entry after launchd is confirmed working.
    if command -v crontab >/dev/null 2>&1; then
      local old filtered
      old="$(crontab -l 2>/dev/null || true)"
      filtered="$(printf '%s\n' "$old" | grep -v 'tsalon.tech/scripts/token-agent.sh' || true)"
      if [ "$old" != "$filtered" ]; then printf '%s\n' "$filtered" | crontab -; fi
    fi
    return 0
  else
    echo "⚠️ Could not load the macOS login agent; the immediate upload will still run."
    return 1
  fi
}

install_linux_cron() {
  local reboot_line line
  reboot_line="@reboot /bin/bash -c \"\$(curl -fsSL -H 'Cache-Control: no-cache' '$HOST/scripts/token-agent.sh?v=8')\" -- --token='$TOKEN' --host='$HOST' --scheduled-run >> '$TSALON_DIR/agent.log' 2>&1"
  line="17 9 * * * /bin/bash -c \"\$(curl -fsSL -H 'Cache-Control: no-cache' '$HOST/scripts/token-agent.sh?v=8')\" -- --token='$TOKEN' --host='$HOST' --scheduled-run >> '$TSALON_DIR/agent.log' 2>&1"
  (crontab -l 2>/dev/null | grep -v 'tsalon.tech/scripts/token-agent.sh'; printf '%s\n' "$reboot_line" "$line") | crontab -
  echo "✓ Linux background upload installed (at startup + daily at 09:17)."
}

OS_NAME="$(uname -s 2>/dev/null || true)"
if [ "$SCHEDULED_RUN" -eq 0 ]; then
  # Existing Mac cron installations automatically migrate the next time they
  # fetch this script, even if the user does not revisit the connect page.
  if [ "$OS_NAME" = "Darwin" ]; then
    # RunAtLoad starts the first upload. Do not also continue into the manual
    # path, or a single install command submits two concurrent full ledgers.
    if install_macos_launch_agent; then exit 0; fi
  elif [ "$INSTALL" -eq 1 ] && command -v crontab >/dev/null 2>&1; then
    install_linux_cron
  fi
fi

RUN_LOCK_DIR="$TSALON_DIR/agent-run.lock"
RUN_LOCK_PID="$RUN_LOCK_DIR/pid"

release_run_lock() {
  rm -f "$RUN_LOCK_PID" 2>/dev/null || true
  rmdir "$RUN_LOCK_DIR" 2>/dev/null || true
}

acquire_run_lock() {
  if mkdir "$RUN_LOCK_DIR" 2>/dev/null; then
    printf '%s\n' "$$" > "$RUN_LOCK_PID"
    return 0
  fi

  local owner=""
  if [ -f "$RUN_LOCK_PID" ]; then owner="$(sed -n '1p' "$RUN_LOCK_PID" 2>/dev/null || true)"; fi
  if printf '%s' "$owner" | grep -Eq '^[0-9]+$' && kill -0 "$owner" 2>/dev/null; then
    return 1
  fi

  # mkdir is atomic, but publishing the PID is a second filesystem operation.
  # During that tiny window an empty/missing marker still belongs to a live run.
  if ! printf '%s' "$owner" | grep -Eq '^[0-9]+$'; then
    local now lock_mtime
    now="$(date +%s)"
    lock_mtime="$(stat -f '%m' "$RUN_LOCK_DIR" 2>/dev/null || stat -c '%Y' "$RUN_LOCK_DIR" 2>/dev/null || true)"
    if ! printf '%s' "$lock_mtime" | grep -Eq '^[0-9]+$' || [ $((now - lock_mtime)) -lt 900 ]; then
      return 1
    fi
  fi

  # The previous process died without running its trap. Reclaim only this
  # fixed, user-private lock directory, then race once to acquire it.
  rm -f "$RUN_LOCK_PID" 2>/dev/null || true
  rmdir "$RUN_LOCK_DIR" 2>/dev/null || true
  if mkdir "$RUN_LOCK_DIR" 2>/dev/null; then
    printf '%s\n' "$$" > "$RUN_LOCK_PID"
    return 0
  fi
  return 1
}

if ! acquire_run_lock; then
  echo "⏭️ Token Agent is already running; skipping this overlapping run."
  exit 0
fi
trap release_run_lock EXIT
trap 'exit 129' HUP
trap 'exit 130' INT
trap 'exit 143' TERM

NODE_CMD="$(find_node || true)"
if [ -z "$NODE_CMD" ]; then
  echo "❌ Error: Node.js was not found in PATH, Homebrew, NVM, or FNM."
  exit 1
fi

echo "⬇️ Downloading the latest Token Agent..."
if ! "$CURL_BIN" -fsSL "$HOST/scripts/codex-ledger.mjs" -o "$TSALON_DIR/codex-ledger.mjs"; then
  echo "❌ Error: could not download codex-ledger.mjs."
  exit 1
fi
if ! "$CURL_BIN" -fsSL "$HOST/scripts/agent.mjs" -o "$TSALON_DIR/agent.mjs"; then
  echo "❌ Error: could not download agent.mjs."
  exit 1
fi
if [ ! -s "$TSALON_DIR/sql-wasm.cjs" ]; then
  if ! "$CURL_BIN" -fsSL "$HOST/scripts/sql-wasm.cjs" -o "$TSALON_DIR/sql-wasm.cjs"; then
    echo "❌ Error: could not download sql-wasm.cjs."
    exit 1
  fi
fi
if [ ! -s "$TSALON_DIR/sql-wasm.wasm" ]; then
  if ! "$CURL_BIN" -fsSL "$HOST/scripts/sql-wasm.wasm" -o "$TSALON_DIR/sql-wasm.wasm"; then
    echo "❌ Error: could not download sql-wasm.wasm."
    exit 1
  fi
fi

"$NODE_CMD" "$TSALON_DIR/agent.mjs" --token="$TOKEN" --host="$HOST"
