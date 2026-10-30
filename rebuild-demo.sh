#!/usr/bin/env bash
# Build lại bản demo một file (spa/artifact/edunova-ai.html) từ mã nguồn src/.
set -e
cd "$(dirname "$0")"
npx vite build --config spa/vite.config.ts --logLevel warn
python3 spa/package-artifact.py
# Trò chơi Phiêu lưu Nova: một tệp tự chạy, xuất bản cạnh trang demo (files: nova/index.html)
node tools/nova/build.mjs
mkdir -p spa/artifact/nova && cp public/nova/index.html spa/artifact/nova/index.html
