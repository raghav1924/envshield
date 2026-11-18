#!/usr/bin/env bash
set -euo pipefail

echo "⚡ Running EnvShield CI validation pipeline..."
node dist/bin.js --version
echo "✔ EnvShield executable verified."
