#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

PID_FILE="$SCRIPT_DIR/.server.pid"
LOG_DIR="$SCRIPT_DIR/logs"
LOG_FILE="$LOG_DIR/server.log"
REQ_HASH_FILE="$SCRIPT_DIR/.venv/.requirements.sha256"

file_sha256() {
  sha256sum "$1" | awk '{print $1}'
}

ensure_venv() {
  if [ ! -d ".venv" ]; then
    echo "[*] Creating virtual environment..."
    python3 -m venv .venv
  fi
}

ensure_python_deps() {
  local requirements_file="${1:-$SCRIPT_DIR/requirements.txt}"

  ensure_venv
  source .venv/bin/activate

  local target_hash
  target_hash="$(file_sha256 "$requirements_file")"
  local current_hash=""
  if [ -f "$REQ_HASH_FILE" ]; then
    current_hash="$(cat "$REQ_HASH_FILE")"
  fi

  if [ "$target_hash" = "$current_hash" ]; then
    echo "[i] Python dependencies unchanged"
    return 0
  fi

  echo "[*] Installing Python dependencies..."
  pip install -q -r "$requirements_file"
  printf "%s" "$target_hash" > "$REQ_HASH_FILE"
  echo "[✓] Python dependencies updated"
}

start_server() {
  if [ -f "$PID_FILE" ] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
    echo "[!] Server is already running (PID: $(cat "$PID_FILE"))"
    echo "    Access: http://127.0.0.1:4173"
    return 0
  fi

  ensure_python_deps "$SCRIPT_DIR/requirements.txt"
  mkdir -p "$LOG_DIR"

  nohup python3 -m uvicorn server:app --host 0.0.0.0 --port 4173 \
    > "$LOG_FILE" 2>&1 &
  echo $! > "$PID_FILE"

  sleep 1
  if kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
    echo ""
    echo "========================================="
    echo "  Lion Hub - 醒狮战队协作中枢"
    echo "  http://127.0.0.1:4173"
    echo "========================================="
    echo ""
    echo "[✓] Server started in background (PID: $(cat "$PID_FILE"))"
    echo "[i] Logs: $LOG_FILE"
    echo "[i] Stop: $0 stop"
  else
    echo "[✗] Server failed to start. Check $LOG_FILE"
    return 1
  fi
}

stop_server() {
  if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if kill -0 "$PID" 2>/dev/null; then
      kill "$PID"
      rm -f "$PID_FILE"
      echo "[✓] Server stopped (PID: $PID)"
    else
      rm -f "$PID_FILE"
      echo "[!] Server was not running (stale PID file cleaned)"
    fi
  else
    echo "[!] Server is not running"
  fi
}

show_status() {
  if [ -f "$PID_FILE" ] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
    echo "[✓] Server is running (PID: $(cat "$PID_FILE"))"
    echo "    Access: http://127.0.0.1:4173"
  else
    echo "[✗] Server is not running"
  fi
}

show_logs() {
  if [ -f "$LOG_FILE" ]; then
    tail -n 50 "$LOG_FILE"
  else
    echo "[!] No log file found"
  fi
}

case "${1:-start}" in
  start)   start_server ;;
  ensure-deps) ensure_python_deps "${2:-$SCRIPT_DIR/requirements.txt}" ;;
  stop)    stop_server ;;
  restart) stop_server; sleep 1; start_server ;;
  status)  show_status ;;
  logs)    show_logs ;;
  *)
    echo "Usage: $0 {start|stop|restart|status|logs}"
    exit 1
    ;;
esac
