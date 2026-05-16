#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/common.sh"

ensure_project_root
confirm_action "该操作会用当前本地仓库内容覆盖远端 master，并执行 force push。是否继续？"
stop_server_if_running
trap 'restart_server_if_needed' EXIT

echo "[*] 暂存当前所有变更..."
git add -A

timestamp="$(date "+%Y-%m-%d %H:%M:%S")"
if git diff --cached --quiet; then
  echo "[i] 没有新的已跟踪变更，直接推送当前 HEAD"
else
  echo "[*] 提交当前变更..."
  git commit -m "Force upload: $timestamp"
fi

echo "[*] 覆盖推送到 origin/master..."
git push --force origin HEAD:master
echo "[✓] 远端已被本地内容覆盖"
