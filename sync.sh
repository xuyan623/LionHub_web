#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

BACKUP_DIR="/tmp/lion_hub_data_backup"

echo "[*] Syncing Lion Hub from GitHub..."

ensure_frontend_build_deps() {
  if ! command -v node >/dev/null 2>&1; then
    echo "[✗] Node.js is not installed."
    echo "    Please install nodejs before running sync.sh."
    echo "    Example: sudo apt update && sudo apt install -y nodejs npm"
    exit 1
  fi

  if ! command -v npm >/dev/null 2>&1; then
    echo "[✗] npm is not installed."
    echo "    Please install npm before running sync.sh."
    echo "    Example: sudo apt update && sudo apt install -y nodejs npm"
    exit 1
  fi
}

build_frontend() {
  ensure_frontend_build_deps

  echo "[*] Installing frontend dependencies..."
  if [ -f "package-lock.json" ]; then
    npm ci --no-audit --no-fund
  else
    npm install --no-audit --no-fund
  fi

  echo "[*] Building frontend assets..."
  npm run build:web
  echo "[✓] Frontend assets rebuilt"
}

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

# 5. Rebuild frontend for the pulled source tree
build_frontend

# 6. Restart server in background
echo "[*] Starting server..."
chmod +x start_server.sh sync.sh
./start_server.sh start

echo ""
echo "[✓] Sync complete! Server restarted."
echo "    Access: http://127.0.0.1:4173"
