#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

echo "[*] Backing up database to GitHub..."

# 1. Stop server to ensure DB is not being written
if [ -f ".server.pid" ] && kill -0 "$(cat ".server.pid")" 2>/dev/null; then
  echo "[*] Stopping server..."
  kill "$(cat ".server.pid")"
  rm -f ".server.pid"
  sleep 1
  echo "[✓] Server stopped"
else
  echo "[i] Server is not running"
fi

# 2. Stage database and backups
git add data/lion_hub.db data/backups/

# 3. Commit
TIMESTAMP=$(date "+%Y-%m-%d %H:%M:%S")
git commit -m "Backup database: $TIMESTAMP" || { echo "[i] No changes to backup"; }

# 4. Push
git push origin master
echo "[✓] Database pushed to GitHub"

# 5. Restart server
if [ -f "start_server.sh" ]; then
  chmod +x start_server.sh
  ./start_server.sh start
fi

echo ""
echo "[✓] Backup complete!"
