#!/bin/bash
set -euo pipefail

echo "[*] 正在关闭穿透进程..."
pkill -f zeronews
echo "[✓] 穿透进程已关闭"
