#!/bin/bash
set -euo pipefail

COMMANDS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$COMMANDS_DIR/../.." && pwd)"

project_root() {
  printf "%s\n" "$PROJECT_ROOT"
}

ensure_project_root() {
  cd "$PROJECT_ROOT"
}

confirm_action() {
  local prompt="$1"
  read -r -p "$prompt [y/N]: " answer
  case "$answer" in
    y|Y|yes|YES)
      ;;
    *)
      echo "[i] 已取消"
      exit 0
      ;;
  esac
}

server_is_running() {
  [ -f "$PROJECT_ROOT/.server.pid" ] && kill -0 "$(cat "$PROJECT_ROOT/.server.pid")" 2>/dev/null
}

stop_server_if_running() {
  SERVER_WAS_RUNNING=0
  if server_is_running; then
    SERVER_WAS_RUNNING=1
    echo "[*] 停止当前服务..."
    kill "$(cat "$PROJECT_ROOT/.server.pid")"
    rm -f "$PROJECT_ROOT/.server.pid"
    sleep 1
    echo "[✓] 服务已停止"
  else
    echo "[i] 当前没有运行中的服务"
  fi
}

restart_server_if_needed() {
  if [ "${SERVER_WAS_RUNNING:-0}" -eq 1 ]; then
    echo "[*] 恢复服务..."
    chmod +x "$PROJECT_ROOT/start_server.sh"
    (
      cd "$PROJECT_ROOT"
      ./start_server.sh start
    )
  fi
}
