import { describe, expect, it } from "vitest";
import { dongChu, trichThongTin } from "@khbd/lib/pipeline/2-lua-chon/thong-tin";

const tt = (s: string, tenFile = "") => trichThongTin(s.trim().split("\n").map((d) => d.trim()), tenFile);

describe("nhận diện thông tin bài từ các cách ghi thường gặp", () => {
  it("mẫu Công văn 5512", () => {
    expect(tt(`
      Trường: THPT Lê Lợi
      Tổ: Toán – Tin
      Họ và tên giáo viên: Nguyễn Văn A
      TÊN BÀI DẠY: BẤT PHƯƠNG TRÌNH BẬC HAI MỘT ẨN
      Môn học/Hoạt động giáo dục: Toán; lớp: 10A1
      Thời gian thực hiện: (02 tiết)
    `)).toEqual({ mon: "TOAN", lop: 10, tenBai: "BẤT PHƯƠNG TRÌNH BẬC HAI MỘT ẨN", soTiet: 2 });
  });

  it("tiêu đề có môn và lớp, tiết theo phân phối chương trình", () => {
    expect(tt(`
      KẾ HOẠCH BÀI DẠY NGỮ VĂN 11
      Bài 2: Cấu tứ và hình ảnh trong thơ trữ tình
      Tiết 15, 16, 17
    `)).toEqual({ mon: "NGU_VAN", lop: 11, tenBai: "Bài 2: Cấu tứ và hình ảnh trong thơ trữ tình", soTiet: 3 });
  });

  it("chủ đề và bài, số tiết dạng khoảng", () => {
    expect(tt(`
      GIÁO ÁN HÓA HỌC 12
      CHỦ ĐỀ 1: ESTER – LIPID
      BÀI 2: XÀ PHÒNG VÀ CHẤT GIẶT RỬA (Tiết 3 – 4)
      Tiết: 3 – 4
    `)).toEqual({ mon: "HOA_HOC", lop: 12, tenBai: "BÀI 2: XÀ PHÒNG VÀ CHẤT GIẶT RỬA", soTiet: 2 });
  });

  it("Tiếng Anh: Unit, khối, số tiết", () => {
    expect(tt(`
      Môn: Tiếng Anh – Khối 10
      UNIT 3: MUSIC
      Số tiết: 8
    `)).toEqual({ mon: "NGOAI_NGU", lop: 10, tenBai: "UNIT 3: MUSIC", soTiet: 8 });
  });

  it("thông tin nằm trong bảng đầu trang", () => {
    const html = "<table><tr><td><p>Môn học: Lịch sử</p></td><td><p>Lớp: 11</p></td></tr><tr><td><p>Tên bài: Cách mạng tư sản Anh</p></td><td><p>Thời lượng: 3 tiết</p></td></tr></table>";
    expect(trichThongTin(dongChu(html))).toEqual({ mon: "LICH_SU", lop: 11, tenBai: "Cách mạng tư sản Anh", soTiet: 3 });
  });

  it("thiếu trong nội dung thì lấy môn, lớp từ tên file", () => {
    expect(tt("BÀI 5. DAO ĐỘNG TẮT DẦN", "KHBD_vat_li_11_bai5.docx")).toMatchObject({ mon: "VAT_LI", lop: 11 });
    expect(tt("Bài 1", "toan10_bai1.docx")).toMatchObject({ mon: "TOAN", lop: 10 });
  });

  it("không nhầm tiết thứ mấy với số tiết, không nhầm lớp 10A1", () => {
    expect(tt("Bài 3. Hàm số (Tiết 1)\nLớp 10A1").soTiet).toBeNull();
    expect(tt("Bài 3. Hàm số (Tiết 1)\nLớp 10A1").lop).toBe(10);
  });
});
