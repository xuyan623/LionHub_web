#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
COMMANDS_DIR="$SCRIPT_DIR/scripts/commands"

run_command() {
  local script_name="$1"
  bash "$COMMANDS_DIR/$script_name"
}

echo ""
echo "========================================="
echo "  Lion Hub - 指令菜单"
echo "========================================="
echo ""
echo "[1] 覆盖式上传到git"
echo "[2] 覆盖式拉取到本地"
echo "[3] 仅上传 /data 目录"
echo "[4] 同步（拉代码后回传 /data）"
echo "[5] 开启内网"
echo "[6] 开启穿透"
echo "[0] 退出"
echo ""
read -r -p "请选择操作 [0-6]: " choice

case "$choice" in
  1) run_command "force_push_git.sh" ;;
  2) run_command "force_pull_local.sh" ;;
  3) run_command "upload_database_only.sh" ;;
  4) run_command "sync_release.sh" ;;
  5) run_command "start_lan.sh" ;;
  6) run_command "start_tunnel.sh" ;;
  0)
    echo "[i] 已退出"
    ;;
  *)
    echo "[!] 无效选择: $choice"
    exit 1
    ;;
esac
