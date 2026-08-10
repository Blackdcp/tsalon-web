#!/bin/bash
# T Salon Token Agent
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

# Determine python command
if command -v python3 &>/dev/null; then
    PYTHON_CMD="python3"
elif command -v python &>/dev/null; then
    PYTHON_CMD="python"
else
    echo "❌ Error: Python 3 is required but not installed."
    exit 1
fi

echo "⬇️ Downloading Token Agent script..."
curl -sL "${HOST}/scripts/agent.py" -o /tmp/tsalon-agent.py

if [ $? -ne 0 ]; then
    echo "❌ Error: Failed to download the agent script."
    exit 1
fi

$PYTHON_CMD /tmp/tsalon-agent.py --token="$TOKEN" --host="$HOST"

rm /tmp/tsalon-agent.py
