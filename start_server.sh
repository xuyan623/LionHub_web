#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

PID_FILE="$SCRIPT_DIR/.server.pid"
LOG_FILE="$SCRIPT_DIR/server.log"

ensure_deps() {
  if [ ! -d ".venv" ]; then
    echo "[*] Creating virtual environment..."
    python3 -m venv .venv
  fi
  source .venv/bin/activate
  echo "[*] Installing dependencies..."
  pip install -q -r requirements.txt
}

start_server() {
  if [ -f "$PID_FILE" ] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
    echo "[!] Server is already running (PID: $(cat "$PID_FILE"))"
    echo "    Access: http://127.0.0.1:4173"
    return 0
  fi

  ensure_deps

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
  stop)    stop_server ;;
  restart) stop_server; sleep 1; start_server ;;
  status)  show_status ;;
  logs)    show_logs ;;
  *)
    echo "Usage: $0 {start|stop|restart|status|logs}"
    exit 1
    ;;
esac
