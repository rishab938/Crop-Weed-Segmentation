#!/usr/bin/env bash
# Render build script — builds frontend + installs backend deps
set -e

echo "=== Installing Node.js dependencies ==="
npm install --include=optional

# Explicitly ensure the Linux x64 binding for rolldown is installed
npm install --no-save @rolldown/binding-linux-x64-gnu@1.2.11

echo "=== Building React frontend ==="
npm run build:frontend

echo "=== Installing Python dependencies ==="
pip install -r requirements.txt

echo "=== Build complete ==="
