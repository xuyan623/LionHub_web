#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

TARGET_REF="origin/master"
CURRENT_REV="$(git rev-parse HEAD)"
BUILD_DIR="$(mktemp -d /tmp/lion_hub_release_build.XXXXXX)"
BACKUP_ROOT="$(mktemp -d /tmp/lion_hub_release_backup.XXXXXX)"
BACKUP_DIR="$BACKUP_ROOT/data"
FRONTEND_HASH_FILE="$SCRIPT_DIR/node_modules/.package-lock.sha256"
ROLLBACK_REQUIRED=0
SERVER_WAS_RUNNING=0
TARGET_NODE_MODULES_UPDATED=0
DATA_UPLOAD_FAILED=0

echo "[*] Syncing Lion Hub from GitHub..."

cleanup() {
  rm -rf "$BUILD_DIR" "$BACKUP_ROOT"
}

rollback() {
  if [ "$ROLLBACK_REQUIRED" -ne 1 ]; then
    return
  fi

  echo "[!] Sync failed after service stop. Rolling back to $CURRENT_REV..."
  git reset --hard "$CURRENT_REV"

  if [ -d "$BACKUP_DIR" ]; then
    rm -rf data
    cp -r "$BACKUP_DIR" data
  fi

  chmod +x start_server.sh sync.sh
  if [ "$SERVER_WAS_RUNNING" -eq 1 ]; then
    ./start_server.sh start || true
  fi
}

trap 'status=$?; if [ $status -ne 0 ]; then rollback; fi; cleanup; exit $status' EXIT

file_sha256() {
  sha256sum "$1" | awk '{print $1}'
}

upload_live_data_to_git() {
  echo "[*] Uploading local /data directory to GitHub..."
  git add data/

  local timestamp
  timestamp="$(date "+%Y-%m-%d %H:%M:%S")"
  if git diff --cached --quiet; then
    echo "[i] /data directory has no new changes to upload"
    return 0
  fi

  git commit -m "Sync data directory: $timestamp"
  git push origin master
  echo "[✓] Local /data directory pushed to GitHub"
}

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

prepare_release_tree() {
  echo "[*] Fetching latest code..."
  git fetch origin
  git archive "$TARGET_REF" | tar -x -C "$BUILD_DIR"
  echo "[✓] Release candidate exported to $BUILD_DIR"
}

preflight_python_deps() {
  echo "[*] Validating Python dependencies against release candidate..."
  chmod +x "$SCRIPT_DIR/start_server.sh"
  "$SCRIPT_DIR/start_server.sh" ensure-deps "$BUILD_DIR/requirements.txt"
}

prepare_frontend_deps() {
  ensure_frontend_build_deps

  local build_lock_file="$BUILD_DIR/package-lock.json"
  if [ -f "$build_lock_file" ] && [ -d "$SCRIPT_DIR/node_modules" ] && [ -f "$FRONTEND_HASH_FILE" ]; then
    local current_hash
    current_hash="$(cat "$FRONTEND_HASH_FILE")"
    local target_hash
    target_hash="$(file_sha256 "$build_lock_file")"
    if [ "$current_hash" = "$target_hash" ]; then
      echo "[i] Frontend dependencies unchanged, reusing node_modules cache"
      ln -s "$SCRIPT_DIR/node_modules" "$BUILD_DIR/node_modules"
      return 0
    fi
  fi

  echo "[*] Installing frontend dependencies for release candidate..."
  if [ -f "$build_lock_file" ]; then
    (
      cd "$BUILD_DIR"
      npm ci --no-audit --no-fund
    )
    printf "%s" "$(file_sha256 "$build_lock_file")" > "$BUILD_DIR/node_modules/.package-lock.sha256"
  else
    (
      cd "$BUILD_DIR"
      npm install --no-audit --no-fund
    )
  fi
  TARGET_NODE_MODULES_UPDATED=1
}

build_frontend() {
  prepare_frontend_deps
  echo "[*] Building frontend assets..."
  (
    cd "$BUILD_DIR"
    npm run build:web
  )
  echo "[✓] Frontend assets rebuilt"
}

stop_server_if_running() {
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
}

backup_live_data() {
  if [ -d "data" ]; then
    cp -r data "$BACKUP_DIR"
    echo "[✓] Live data directory backed up"
  fi
}

deploy_release_tree() {
  git reset --hard "$TARGET_REF"
  echo "[✓] Code synced from GitHub"

  if [ -d "$BACKUP_DIR" ]; then
    rm -rf data
    cp -r "$BACKUP_DIR" data
    echo "[✓] Live data directory restored"
  fi

  rm -rf dist
  cp -r "$BUILD_DIR/dist" dist
  echo "[✓] Fresh dist artifacts deployed"

  if [ "$TARGET_NODE_MODULES_UPDATED" -eq 1 ] && [ -d "$BUILD_DIR/node_modules" ] && [ ! -L "$BUILD_DIR/node_modules" ]; then
    rm -rf node_modules
    cp -a "$BUILD_DIR/node_modules" node_modules
    echo "[✓] node_modules cache updated"
  fi
}

prepare_release_tree
build_frontend
preflight_python_deps

stop_server_if_running
backup_live_data
ROLLBACK_REQUIRED=1
deploy_release_tree
ROLLBACK_REQUIRED=0

if ! upload_live_data_to_git; then
  DATA_UPLOAD_FAILED=1
  echo "[!] Code sync succeeded, but uploading /data to GitHub failed."
  echo "    Local /data changes are still preserved in the current repository."
  echo "    Please fix Git authentication/network and run the /data upload command again."
fi

echo "[*] Starting server..."
chmod +x start_server.sh sync.sh
./start_server.sh start

echo ""
if [ "$DATA_UPLOAD_FAILED" -eq 1 ]; then
  echo "[!] Sync complete with warning: code updated, but /data was not pushed to GitHub."
else
  echo "[✓] Sync complete! Code updated and /data uploaded."
fi
echo "    Access: http://127.0.0.1:4173"
