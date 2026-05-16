#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

SERVER_WAS_RUNNING=0

restart_server_if_needed() {
  if [ "$SERVER_WAS_RUNNING" -ne 1 ]; then
    return
  fi
  if [ -f "start_server.sh" ]; then
    chmod +x start_server.sh
    ./start_server.sh start || true
  fi
}

trap 'status=$?; restart_server_if_needed; exit $status' EXIT

echo "[*] Backing up /data directory to GitHub..."

# 1. Stop server to ensure DB is not being written
if [ -f ".server.pid" ] && kill -0 "$(cat ".server.pid")" 2>/dev/null; then
  SERVER_WAS_RUNNING=1
  echo "[*] Stopping server..."
  kill "$(cat ".server.pid")"
  rm -f ".server.pid"
  sleep 1
  echo "[✓] Server stopped"
else
  echo "[i] Server is not running"
fi

# 2. Stage entire /data directory
git add data/

# 3. Commit
TIMESTAMP=$(date "+%Y-%m-%d %H:%M:%S")
git commit -m "Backup data directory: $TIMESTAMP" || { echo "[i] No changes to backup"; }

# 4. Push
git push origin master
echo "[✓] /data directory pushed to GitHub"

echo ""
echo "[✓] /data backup complete!"
