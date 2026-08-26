#!/bin/bash
# T Salon Token Agent bootstrap for macOS/Linux.
# Installs a login/background scheduler and runs one upload immediately.

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
exec /bin/bash -c "\$(/usr/bin/curl -fsSL '$HOST/scripts/token-agent.sh')" -- --token='$TOKEN' --host='$HOST' --scheduled-run
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
  <key>StartInterval</key><integer>1800</integer>
  <key>ProcessType</key><string>Background</string>
  <key>StandardOutPath</key><string>$TSALON_DIR/agent.log</string>
  <key>StandardErrorPath</key><string>$TSALON_DIR/agent.log</string>
</dict>
</plist>
EOF
  chmod 600 "$plist"

  launchctl bootout "gui/$uid" "$plist" >/dev/null 2>&1 || true
  if launchctl bootstrap "gui/$uid" "$plist" >/dev/null 2>&1 || launchctl load "$plist" >/dev/null 2>&1; then
    echo "✓ macOS login agent installed (at login + every 30 minutes)."
    # Remove only our legacy cron entry after launchd is confirmed working.
    if command -v crontab >/dev/null 2>&1; then
      local old filtered
      old="$(crontab -l 2>/dev/null || true)"
      filtered="$(printf '%s\n' "$old" | grep -v 'tsalon.tech/scripts/token-agent.sh' || true)"
      if [ "$old" != "$filtered" ]; then printf '%s\n' "$filtered" | crontab -; fi
    fi
  else
    echo "⚠️ Could not load the macOS login agent; the immediate upload will still run."
  fi
}

install_linux_cron() {
  local line
  line="*/30 * * * * /bin/bash -c \"\$(curl -fsSL '$HOST/scripts/token-agent.sh')\" -- --token='$TOKEN' --host='$HOST' --scheduled-run >> '$TSALON_DIR/agent.log' 2>&1"
  (crontab -l 2>/dev/null | grep -v 'tsalon.tech/scripts/token-agent.sh'; printf '%s\n' "$line") | crontab -
  echo "✓ Linux background upload installed (every 30 minutes)."
}

OS_NAME="$(uname -s 2>/dev/null || true)"
if [ "$SCHEDULED_RUN" -eq 0 ]; then
  # Existing Mac cron installations automatically migrate the next time they
  # fetch this script, even if the user does not revisit the connect page.
  if [ "$OS_NAME" = "Darwin" ]; then
    install_macos_launch_agent
  elif [ "$INSTALL" -eq 1 ] && command -v crontab >/dev/null 2>&1; then
    install_linux_cron
  fi
fi

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
