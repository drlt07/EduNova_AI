#!/usr/bin/env bash
# Build lại bản demo một file (spa/artifact/edunova-ai.html) từ mã nguồn src/.
set -e
cd "$(dirname "$0")"
npx vite build --config spa/vite.config.ts --logLevel warn
python3 spa/package-artifact.py
