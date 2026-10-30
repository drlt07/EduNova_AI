#!/usr/bin/env bash
# Gộp mọi migration + tài khoản thử + lớp mẫu thành một file để dán một lần vào SQL Editor của dự án Supabase MỚI (trống).
# Chạy: bash supabase/bundle-new-project.sh  →  supabase/setup-new-project.sql
set -euo pipefail
cd "$(dirname "$0")"
{
  echo "-- EduNova: cài đặt toàn bộ cơ sở dữ liệu cho một dự án Supabase MỚI (trống). Sinh bởi bundle-new-project.sh, đừng sửa tay."
  echo "-- Dán cả file vào Supabase → SQL Editor → Run. Gồm mọi migration + tài khoản thử + lớp mẫu 30 học sinh."
  echo "-- Mật khẩu tài khoản thử: EduNova@2026 (đổi trước khi dùng thật). Dự án đã có bảng thì chỉ chạy migration mới."
  for f in migrations/*.sql seed-test-accounts.sql seed-sample-class.sql; do
    echo; echo "-- ================= $f ================="; cat "$f"
  done
} > setup-new-project.sql
echo "ok supabase/setup-new-project.sql"
