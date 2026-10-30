#!/usr/bin/env bash
# Build lại bản demo một file (spa/artifact/edunova-ai.html) từ mã nguồn src/.
set -e
cd "$(dirname "$0")"
npx vite build --config spa/vite.config.ts --logLevel warn
python3 spa/package-artifact.py
# Trò chơi Phiêu lưu Nova: một tệp tự chạy, xuất bản cạnh trang demo (files: nova/index.html, nova/ngoi-nha-hong/index.html, nova/dem-truoc-ky-thi/index.html, nova/tram-nova-7/index.html)
node tools/nova/build.mjs
for d in ngoi-nha-hong dem-truoc-ky-thi tram-nova-7; do mkdir -p spa/artifact/nova/$d && cp public/nova/$d/index.html spa/artifact/nova/$d/index.html; done
cp public/nova/index.html spa/artifact/nova/index.html
