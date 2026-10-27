"""Sinh data/nls_*.csv từ bảng năng lực số (Thông tư 02/2025/TT-BGDĐT) do giáo viên cung cấp.

Nguồn: docs/nguon/nls_thong_tu_02_2025_bac5.tsv (chỉ giữ cột Bậc 5 – trình độ THPT).
Chạy: python3 scripts/tao_nls.py rồi npx tsx scripts/kiem-tra-du-lieu.ts
"""
import csv
import re
from pathlib import Path

GOC = Path(__file__).resolve().parent.parent
NGUON = GOC / "docs" / "nguon" / "nls_thong_tu_02_2025_bac5.tsv"
DATA = GOC / "data"
BAC = "5"

with NGUON.open(encoding="utf-8", newline="") as f:
    hang = list(csv.reader(f, delimiter="\t"))[1:]

thanh_phan, chi_bao = [], []
for mien, ma, ten, mo_ta, o_bac in hang:
    thanh_phan.append([mien, "", ma, ten, mo_ta])
    for dong in o_bac.splitlines():
        m = re.match(rf"^({re.escape(ma)}\.{BAC}\.\d+) (.+)$", dong.strip())
        if not m:
            raise SystemExit(f"Dòng chỉ báo sai mã ở {ma}: {dong!r}")
        chi_bao.append([m.group(1), m.group(2)])


def ghi(ten_tep, dau, ds):
    with (DATA / ten_tep).open("w", encoding="utf-8", newline="") as f:
        w = csv.writer(f, lineterminator="\n")
        w.writerow(dau)
        w.writerows(ds)


ghi("nls_thanh_phan.csv", ["ma_mien", "ten_mien", "ma", "ten", "mo_ta"], thanh_phan)
ghi("nls_trinh_do.csv", ["ma", "ten", "lop"], [[BAC, "Bậc 5", "Lớp 10 – 12"]])
ghi("nls_chi_bao.csv", ["ma", "noi_dung"], chi_bao)
print(f"{len(thanh_phan)} thành phần, {len(chi_bao)} chỉ báo bậc {BAC}.")
