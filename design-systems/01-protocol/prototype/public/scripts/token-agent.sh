#!/bin/bash
# T Salon Token Agent (Node.js)
# Usage: curl -sL https://www.tsalon.tech/scripts/token-agent.sh | bash -s -- --token="YOUR_TOKEN"

# Parse arguments
for i in "$@"; do
  case $i in
    --token=*)
      TOKEN="${i#*=}"
      shift
      ;;
    --host=*)
      HOST="${i#*=}"
      shift
      ;;
    *)
      # unknown option
      ;;
  esac
done

if [ -z "$TOKEN" ]; then
    echo "❌ Error: --token is required."
    echo "Usage: bash token-agent.sh --token=\"YOUR_TOKEN\""
    exit 1
fi

if [ -z "$HOST" ]; then
    HOST="https://www.tsalon.tech"
fi

# Determine node command
if command -v node >/dev/null 2>&1; then
    NODE_CMD="node"
elif command -v nodejs >/dev/null 2>&1; then
    NODE_CMD="nodejs"
else
    echo "❌ Error: Node.js is required but not installed. Install Node.js (https://nodejs.org) and retry."
    exit 1
fi

TSALON_DIR="$HOME/.tsalon"
mkdir -p "$TSALON_DIR"

echo "⬇️ Downloading Token Agent (Node.js)..."
curl -fsSL "${HOST}/scripts/agent.mjs" -o "$TSALON_DIR/agent.mjs"

# sql.js assets: download once and cache (avoid re-fetching the wasm every run)
if [ ! -s "$TSALON_DIR/sql-wasm.cjs" ]; then
    curl -fsSL "${HOST}/scripts/sql-wasm.cjs" -o "$TSALON_DIR/sql-wasm.cjs"
fi
if [ ! -s "$TSALON_DIR/sql-wasm.wasm" ]; then
    curl -fsSL "${HOST}/scripts/sql-wasm.wasm" -o "$TSALON_DIR/sql-wasm.wasm"
fi

"$NODE_CMD" "$TSALON_DIR/agent.mjs" --token="$TOKEN" --host="$HOST"
