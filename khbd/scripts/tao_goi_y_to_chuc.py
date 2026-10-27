"""Tạo data/goi_y_to_chuc.json từ hai bảng của docs/khung_khbd.docx:
"Gợi ý hình thức tổ chức HĐ II" và "Gợi ý nhiệm vụ HĐ III theo môn". Chép nguyên văn từng ô.
Chạy: python3 scripts/tao_goi_y_to_chuc.py
"""
import json
import pathlib
import zipfile
import xml.etree.ElementTree as ET

GOC = pathlib.Path(__file__).resolve().parent.parent
W = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"

xml = zipfile.ZipFile(GOC / "docs" / "khung_khbd.docx").read("word/document.xml")
than = ET.fromstring(xml).find(f"{W}body")


def chu_o(o):
    return "\n".join("".join(t.text or "" for t in p.iter(f"{W}t")) for p in o.iter(f"{W}p")).strip()


def bang_co_dau(dau):
    for bang in than.iter(f"{W}tbl"):
        hang = [[chu_o(o) for o in tr.findall(f"{W}tc")] for tr in bang.findall(f"{W}tr")]
        if hang and hang[0] == dau:
            return hang[1:]
    raise SystemExit(f"Không thấy bảng có tiêu đề {dau}")


hd2 = [dict(zip(["hinh_thuc", "phu_hop", "dien_bien", "san_pham"], h)) for h in bang_co_dau(["Hình thức", "Phù hợp", "Diễn biến chính", "Sản phẩm"])]
hd3 = [dict(zip(["mon", "dang_nhiem_vu", "san_pham"], h)) for h in bang_co_dau(["Môn", "Dạng nhiệm vụ", "Sản phẩm"])]
du_lieu = {
    "nguon": "docs/khung_khbd.docx – Gợi ý hình thức tổ chức HĐ II; Gợi ý nhiệm vụ HĐ III theo môn",
    "hd2": hd2,
    "hd3": hd3,
}
(GOC / "data" / "goi_y_to_chuc.json").write_text(json.dumps(du_lieu, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(f"HĐ II: {len(hd2)} hình thức; HĐ III: {len(hd3)} nhóm môn.")
