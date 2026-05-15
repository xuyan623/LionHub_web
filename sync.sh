#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

DB_FILE="data/lion_hub.db"
BACKUP_FILE="/tmp/lion_hub_runtime.db"

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

# 2. Backup runtime database (contains live data from phone usage)
if [ -f "$DB_FILE" ]; then
  cp "$DB_FILE" "$BACKUP_FILE"
  echo "[✓] Runtime database backed up"
fi

# 3. Fetch and force overwrite to match GitHub
git fetch origin
git reset --hard origin/master
echo "[✓] Code synced from GitHub"

# 4. Restore runtime database (preserve phone-side live data)
if [ -f "$BACKUP_FILE" ]; then
  cp "$BACKUP_FILE" "$DB_FILE"
  rm -f "$BACKUP_FILE"
  echo "[✓] Runtime database restored"
fi

# 5. Restart server in background
echo "[*] Starting server..."
chmod +x start_server.sh
./start_server.sh start

echo ""
echo "[✓] Sync complete! Server restarted."
echo "    Access: http://127.0.0.1:4173"
