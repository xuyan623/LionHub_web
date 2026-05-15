#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

# Create virtual environment if not exists
if [ ! -d ".venv" ]; then
  echo "[*] Creating virtual environment..."
  python3 -m venv .venv
fi

# Activate virtual environment
source .venv/bin/activate

# Install dependencies
echo "[*] Installing dependencies..."
pip install -q -r requirements.txt

echo ""
echo "========================================="
echo "  Lion Hub - 醒狮战队协作中枢"
echo "  http://127.0.0.1:4173"
echo "========================================="
echo ""

# Start server
python3 -m uvicorn server:app --host 0.0.0.0 --port 4173
