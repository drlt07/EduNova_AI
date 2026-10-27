"""Tạo data/nang_luc_dac_thu.json từ bảng mục VII của docs/khung_khbd.docx.

Tên năng lực, thành phần là chuỗi chép nguyên văn từ khung; gợi ý cách ghi viết theo cấu trúc
biểu hiện năng lực (GOI_Y, có ghi nguồn: GV cung cấp hoặc bản nháp chờ duyệt);
tests/nang-luc-dac-thu.test.ts kiểm tra lại từng chuỗi có trong khung.
Mã (ma_mon, ma) là mã nội bộ do code đặt; riêng Tin học giữ NLa–NLe của khung.
Chạy: python3 scripts/tao_nang_luc_dac_thu.py
"""
import json, pathlib

# (mã môn, tên môn, [(tên năng lực, [thành phần])], gợi ý cách ghi)
MON = [
    ("NGU_VAN", "Ngữ văn", [
        ("Năng lực ngôn ngữ", ["đọc", "viết", "nói và nghe"]),
        ("năng lực văn học", []),
    ], "NL ngôn ngữ – Viết: viết được đoạn văn nghị luận khoảng 200 chữ về [vấn đề] (HĐ III)"),
    ("TOAN", "Toán", [
        ("Năng lực toán học", ["tư duy và lập luận toán học", "mô hình hóa toán học",
            "giải quyết vấn đề toán học", "giao tiếp toán học",
            "sử dụng công cụ, phương tiện học toán"]),
    ], "Mô hình hóa toán học: chuyển tình huống [......] thành [hàm số/phương trình] và giải (HĐ III)"),
    ("NGOAI_NGU", "Ngoại ngữ", [
        ("Năng lực giao tiếp bằng ngoại ngữ", ["nghe", "nói", "đọc", "viết"]),
    ], "Nói: thực hiện được hội thoại 6–8 lượt về [chủ đề], dùng đúng [cấu trúc] (HĐ III)"),
    ("VAT_LI", "Vật lí", [
        ("Năng lực vật lí", ["nhận thức vật lí", "tìm hiểu thế giới tự nhiên dưới góc độ vật lí",
            "vận dụng kiến thức, kĩ năng đã học"]),
    ], "Vận dụng: giải thích được [hiện tượng] dựa trên [định luật] (HĐ III)"),
    ("HOA_HOC", "Hóa học", [
        ("Năng lực hóa học", ["nhận thức hóa học", "tìm hiểu thế giới tự nhiên dưới góc độ hóa học",
            "vận dụng kiến thức, kĩ năng đã học"]),
    ], "Tìm hiểu: tiến hành thí nghiệm [......], mô tả hiện tượng và viết phương trình hóa học (HĐ III)"),
    ("SINH_HOC", "Sinh học", [
        ("Năng lực sinh học", ["nhận thức sinh học", "tìm hiểu thế giới sống",
            "vận dụng kiến thức, kĩ năng đã học"]),
    ], "Nhận thức sinh học: trình bày được [quá trình] bằng sơ đồ (HĐ II)"),
    ("LICH_SU", "Lịch sử", [
        ("Năng lực lịch sử", ["tìm hiểu lịch sử", "nhận thức và tư duy lịch sử",
            "vận dụng kiến thức, kĩ năng đã học"]),
    ], "Tìm hiểu lịch sử: khai thác được thông tin từ [tư liệu] để rút ra [nhận xét] (HĐ III)"),
    ("DIA_LI", "Địa lí", [
        ("Năng lực địa lí", ["nhận thức khoa học địa lí", "tìm hiểu địa lí",
            "vận dụng kiến thức, kĩ năng đã học"]),
    ], "Tìm hiểu địa lí: vẽ và nhận xét được biểu đồ [......] từ bảng số liệu (HĐ III)"),
    ("GDKT_PL", "GDKT&PL", [
        ("Năng lực điều chỉnh hành vi", []),
        ("năng lực phát triển bản thân", []),
        ("năng lực tìm hiểu và tham gia hoạt động kinh tế – xã hội", []),
    ], "Điều chỉnh hành vi: đánh giá được hành vi trong tình huống [......] và đề xuất cách ứng xử phù hợp (HĐ III)"),
    ("CONG_NGHE", "Công nghệ", [
        ("Năng lực công nghệ", ["nhận thức công nghệ", "giao tiếp công nghệ", "sử dụng công nghệ",
            "đánh giá công nghệ", "thiết kế kĩ thuật"]),
    ], "Thiết kế kĩ thuật: phác thảo được [sản phẩm] đáp ứng yêu cầu cho trước (HĐ III)"),
    ("TIN_HOC", "Tin học", [
        ("Năng lực tin học", [
            ("NLa", "sử dụng và quản lí các phương tiện CNTT-TT"),
            ("NLb", "ứng xử phù hợp trong môi trường số"),
            ("NLc", "giải quyết vấn đề với sự hỗ trợ của CNTT-TT"),
            ("NLd", "ứng dụng CNTT-TT trong học và tự học"),
            ("NLe", "hợp tác trong môi trường số"),
        ]),
    ], "NL tin học – NLc: viết được chương trình [......] để giải quyết [......] (HĐ III)"),
    ("GDTC", "Giáo dục thể chất", [
        ("Năng lực thể chất", ["chăm sóc sức khỏe", "vận động cơ bản", "hoạt động thể dục thể thao"]),
    ], "Vận động cơ bản: thực hiện được [động tác/kĩ thuật] đúng nhịp, đúng phương hướng (HĐ III)"),
    ("AM_NHAC", "Âm nhạc", [
        ("Năng lực âm nhạc", ["thể hiện âm nhạc", "cảm thụ và hiểu biết âm nhạc",
            "ứng dụng và sáng tạo âm nhạc"]),
    ], "Thể hiện âm nhạc: hát đúng cao độ, trường độ bài [......] (HĐ III)"),
    ("MI_THUAT", "Mĩ thuật", [
        ("Năng lực mĩ thuật", ["quan sát và nhận thức thẩm mĩ", "sáng tạo và ứng dụng thẩm mĩ",
            "phân tích và đánh giá thẩm mĩ"]),
    ], "Sáng tạo và ứng dụng thẩm mĩ: tạo được sản phẩm [......] có vận dụng [nguyên lí tạo hình] (HĐ III)"),
    ("HDTN_HN", "HĐTN, HN", [
        ("Năng lực thích ứng với cuộc sống", []),
        ("năng lực thiết kế và tổ chức hoạt động", []),
        ("năng lực định hướng nghề nghiệp", []),
    ], "Thiết kế và tổ chức hoạt động: lập được kế hoạch [......] cho nhóm (HĐ III)"),
]


# Gợi ý cách ghi biểu hiện theo cấu trúc: hành động quan sát được + nội dung kiến thức/kĩ năng
# + kết quả cần đạt (có thể thêm bối cảnh, công cụ, điều kiện). Không còn chỗ trống [ ].
# (thành phần minh họa, câu gợi ý, nguồn)
DA_DUYET = "Ví dụ do giáo viên cung cấp"
CHO_DUYET = "Bản nháp theo cấu trúc biểu hiện năng lực, chờ giáo viên duyệt"
GOI_Y = {
    "NGU_VAN": ("viết", "Học sinh xác định được vấn đề cần nghị luận và hệ thống luận điểm; viết được đoạn văn nghị luận khoảng 200 chữ có lí lẽ, bằng chứng thuyết phục, diễn đạt mạch lạc, đúng chính tả và ngữ pháp.", CHO_DUYET),
    "TOAN": ("mô hình hóa toán học", "Học sinh nhận diện được các đại lượng và mối quan hệ trong tình huống thực tiễn; biểu diễn được mối quan hệ đó bằng mô hình toán học phù hợp và sử dụng mô hình để giải quyết vấn đề.", DA_DUYET),
    "NGOAI_NGU": ("nói", "Học sinh sử dụng được từ vựng và cấu trúc ngữ pháp của bài để thực hiện hội thoại 6–8 lượt về chủ đề cho trước; trao đổi thông tin rõ ràng, phát âm dễ hiểu và đáp lời phù hợp với tình huống giao tiếp.", CHO_DUYET),
    "VAT_LI": ("vận dụng kiến thức, kĩ năng đã học", "Học sinh vận dụng được định luật, mô hình vật lí đã học để giải thích hiện tượng trong thực tiễn; chỉ ra được nguyên nhân và điều kiện xảy ra hiện tượng bằng lập luận có căn cứ.", CHO_DUYET),
    "HOA_HOC": ("tìm hiểu thế giới tự nhiên dưới góc độ hóa học", "Học sinh tiến hành được thí nghiệm theo đúng quy trình và quy tắc an toàn; quan sát, mô tả được hiện tượng, giải thích được hiện tượng bằng kiến thức hóa học và viết được phương trình hóa học minh họa.", CHO_DUYET),
    "SINH_HOC": ("nhận thức sinh học", "Học sinh trình bày được các giai đoạn và mối quan hệ giữa các thành phần của quá trình sinh học; biểu diễn được quá trình đó bằng sơ đồ đúng và giải thích được vai trò của từng giai đoạn.", CHO_DUYET),
    "LICH_SU": ("tìm hiểu lịch sử", "Học sinh khai thác được thông tin từ tư liệu lịch sử (văn bản, hình ảnh, số liệu); xác định được nội dung chính và giá trị của tư liệu, từ đó rút ra được nhận xét có căn cứ về sự kiện, nhân vật lịch sử.", CHO_DUYET),
    "DIA_LI": ("tìm hiểu địa lí", "Học sinh xử lí được bảng số liệu để lựa chọn và vẽ đúng dạng biểu đồ thích hợp; nhận xét, giải thích được đặc điểm và xu hướng của đối tượng địa lí thể hiện trên biểu đồ.", CHO_DUYET),
    "GDKT_PL": ("Năng lực điều chỉnh hành vi", "Học sinh nhận diện được hành vi đúng, sai trong tình huống cụ thể dựa trên chuẩn mực đạo đức và quy định pháp luật; đánh giá được hậu quả của hành vi và đề xuất được cách ứng xử phù hợp.", CHO_DUYET),
    "CONG_NGHE": ("thiết kế kĩ thuật", "Học sinh xác định được yêu cầu, tiêu chí của sản phẩm; phác thảo được phương án thiết kế đáp ứng yêu cầu cho trước và lựa chọn được vật liệu, giải pháp kĩ thuật phù hợp.", CHO_DUYET),
    "TIN_HOC": ("giải quyết vấn đề với sự hỗ trợ của CNTT-TT", "Học sinh phân tích được bài toán, xác định được dữ liệu vào và kết quả ra; viết và chạy được chương trình đúng cú pháp để giải quyết bài toán, kiểm thử và sửa lỗi để chương trình cho kết quả đúng.", CHO_DUYET),
    "GDTC": ("vận động cơ bản", "Học sinh thực hiện được động tác, kĩ thuật của bài đúng nhịp, đúng phương hướng và biên độ; phối hợp được các cử động nhịp nhàng và tự sửa được lỗi động tác khi được nhắc.", CHO_DUYET),
    "AM_NHAC": ("thể hiện âm nhạc", "Học sinh hát được bài hát đúng cao độ, trường độ và sắc thái; thể hiện được tính chất âm nhạc của bài hát và phối hợp được với bạn khi hát theo nhóm.", CHO_DUYET),
    "MI_THUAT": ("sáng tạo và ứng dụng thẩm mĩ", "Học sinh vận dụng được yếu tố và nguyên lí tạo hình để thực hiện sản phẩm mĩ thuật theo chủ đề; tạo được sản phẩm có bố cục hợp lí, thể hiện được ý tưởng cá nhân và giới thiệu được sản phẩm.", CHO_DUYET),
    "HDTN_HN": ("năng lực thiết kế và tổ chức hoạt động", "Học sinh xác định được mục tiêu, nội dung và nguồn lực của hoạt động; lập được kế hoạch có phân công nhiệm vụ, thời gian cụ thể cho nhóm và tổ chức thực hiện được theo kế hoạch.", CHO_DUYET),
}


def tao():
    ds = []
    for ma_mon, ten_mon, nang_luc, _vi_du_khung in MON:
        tp_goi_y, goi_y, nguon_goi_y = GOI_Y[ma_mon]
        nl_out = []
        for i, (ten_nl, thanh_phan) in enumerate(nang_luc, 1):
            ma_nl = f"{ma_mon}.{i}"
            tp_out = []
            for j, tp in enumerate(thanh_phan, 1):
                ma_tp, ten_tp = tp if isinstance(tp, tuple) else (str(j), tp)
                tp_out.append({"ma": f"{ma_nl}.{ma_tp}", "ten": ten_tp,
                               "bieu_hien": [], "da_duyet": False})
            nl_out.append({"ma": ma_nl, "ten": ten_nl, "thanh_phan": tp_out})
        ds.append({"ma_mon": ma_mon, "ten_mon": ten_mon, "nang_luc": nl_out,
                   "goi_y": goi_y, "goi_y_thanh_phan": tp_goi_y, "goi_y_nguon": nguon_goi_y})
    return {
        "nguon": "docs/khung_khbd.docx, mục VII (theo Chương trình GDPT 2018)",
        "ghi_chu": "Năng lực không ghi thành phần trong khung thì thanh_phan rỗng; chọn trực tiếp năng lực.",
        "mon": ds,
    }


if __name__ == "__main__":
    goc = pathlib.Path(__file__).resolve().parent.parent
    (goc / "data" / "nang_luc_dac_thu.json").write_text(
        json.dumps(tao(), ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("Đã ghi data/nang_luc_dac_thu.json")
