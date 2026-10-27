"""Tạo data/nang_luc_ai.json từ docs/khung_khbd.docx (mục I.2, HĐ III, ma trận mục V).

Mọi chuỗi chép nguyên văn từ khung; tests/nang-luc-ai.test.ts đối chiếu lại.
Mã miền 6 (6.1–6.3, NC1) theo Thông tư 02/2025 bổ sung khi có dữ liệu nls_chi_bao.csv.
Chạy: python3 scripts/tao_nang_luc_ai.py
"""
import json, pathlib

NANG_LUC = [
    {
        "ma": "NLa",
        "mo_ta": "HS nhận biết AI có thể hỗ trợ tìm kiếm, xử lí và khai thác thông tin.",
        "tieu_chi": "chỉ ra được AI đã hỗ trợ phần nào, không coi phản hồi AI là đáp án mặc nhiên đúng.",
        "minh_chung": "Phiếu kiểm chứng phản hồi AI; dòng “Có sử dụng AI hỗ trợ”",
        "tieu_chi_en": "Students identify which parts AI supported and do not treat AI output as automatically correct.",
    },
    {
        "ma": "NLc",
        "mo_ta": "HS biết sử dụng AI để hỗ trợ tìm kiếm, tóm tắt hoặc giải thích thông tin.",
        "tieu_chi": "có sản phẩm tự làm trước, câu lệnh phù hợp, gợi ý AI và bản HS diễn đạt lại.",
        "minh_chung": "Sản phẩm tự làm trước, câu lệnh, gợi ý AI, bản diễn đạt lại",
        "tieu_chi_en": "There is a self-made draft, an appropriate prompt, the AI suggestions and the student’s own rephrased version.",
    },
    {
        "ma": "NLd",
        "mo_ta": "HS biết kiểm tra, đánh giá thông tin do AI cung cấp trước khi sử dụng.",
        "tieu_chi": "có ít nhất một nhận định giữ, sửa hoặc loại bỏ kèm căn cứ.",
        "minh_chung": "Nhận định giữ/sửa/loại bỏ kèm căn cứ",
        "tieu_chi_en": "There is at least one decision to keep, revise or reject an AI suggestion, with justification.",
    },
]

if __name__ == "__main__":
    goc = pathlib.Path(__file__).resolve().parent.parent
    du_lieu = {
        "nguon": "docs/khung_khbd.docx: mục I.2, HĐ III (Sản phẩm – đánh giá), mục V (ma trận)",
        "vi_tri_goi_y": "HD3",
        "ghi_chu": "Khung đặt năng lực AI ở HĐ III. Mã miền 6 của Thông tư 02/2025 bổ sung khi có dữ liệu.",
        "nang_luc": NANG_LUC,
    }
    (goc / "data" / "nang_luc_ai.json").write_text(json.dumps(du_lieu, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("Đã ghi data/nang_luc_ai.json")
