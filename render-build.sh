#!/usr/bin/env bash
# Render build script — builds frontend + installs backend deps
set -e

echo "=== Installing Node.js dependencies ==="
npm install

echo "=== Building React frontend ==="
npm run build:frontend

echo "=== Installing Python dependencies ==="
pip install -r requirements.txt

echo "=== Build complete ==="
