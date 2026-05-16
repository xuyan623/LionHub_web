#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/common.sh"

ensure_project_root
confirm_action "该操作会丢弃本地已跟踪修改，并删除未跟踪文件。是否继续？"
stop_server_if_running
trap 'restart_server_if_needed' EXIT

echo "[*] 拉取远端最新代码..."
git fetch origin

echo "[*] 用 origin/master 覆盖本地工作区..."
git reset --hard origin/master
git clean -fd

echo "[✓] 本地工作区已覆盖为 origin/master"
