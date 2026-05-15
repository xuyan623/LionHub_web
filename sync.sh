#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

BACKUP_DIR="/tmp/lion_hub_data_backup"

echo "[*] Syncing Lion Hub from GitHub..."

# 1. Stop server if running
if [ -f ".server.pid" ] && kill -0 "$(cat ".server.pid")" 2>/dev/null; then
  echo "[*] Stopping server..."
  kill "$(cat ".server.pid")"
  rm -f ".server.pid"
  sleep 1
  echo "[✓] Server stopped"
else
  echo "[i] Server is not running"
fi

# 2. Backup entire data directory
if [ -d "data" ]; then
  rm -rf "$BACKUP_DIR"
  cp -r data "$BACKUP_DIR"
  echo "[✓] Data directory backed up"
fi

# 3. Fetch and force overwrite to match GitHub
git fetch origin
git reset --hard origin/master
echo "[✓] Code synced from GitHub"

# 4. Restore data directory (preserve phone-side live data)
if [ -d "$BACKUP_DIR" ]; then
  rm -rf data
  cp -r "$BACKUP_DIR" data
  rm -rf "$BACKUP_DIR"
  echo "[✓] Data directory restored"
fi

# 5. Restart server in background
echo "[*] Starting server..."
chmod +x start_server.sh sync.sh
./start_server.sh start

echo ""
echo "[✓] Sync complete! Server restarted."
echo "    Access: http://127.0.0.1:4173"
