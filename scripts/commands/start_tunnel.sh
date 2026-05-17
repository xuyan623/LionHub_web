#!/bin/bash
set -euo pipefail

echo "[*] 启动穿透服务..."
nohup zeronews start > ~/zeronews.log 2>&1 &
echo "[✓] 穿透已在后台启动"
echo "[i] 日志文件: ~/zeronews.log"
