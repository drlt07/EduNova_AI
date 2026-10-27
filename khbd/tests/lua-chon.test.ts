import { describe, expect, it } from "vitest";
import { LUA_CHON_TRONG, doiViec, dungClil, kiemTraLuaChon, type LuaChon } from "@khbd/lib/pipeline/2-lua-chon/lua-chon";
import { lapKeHoach, tinhPhamVi } from "@khbd/lib/pipeline/3-ke-hoach";
import type { PhanTichGiaoAn } from "@khbd/lib/pipeline/kieu";

const lc = (x: Partial<LuaChon>): LuaChon => ({ ...LUA_CHON_TRONG, ...x });

describe("kiểm tra lựa chọn ở bước 2", () => {
  it("phải chọn ít nhất một việc", () => {
    expect(kiemTraLuaChon(lc({}), 2, [])).toEqual(["Chọn ít nhất một chức năng: năng lực số, năng lực AI, tiếng Anh hoặc LHĐN."]);
    expect(kiemTraLuaChon(lc({ nls: true }), 2, [])).toEqual([]);
  });

  it("tạo lại hoạt động cần hình thức HĐ II, HĐ III; không có mặc định", () => {
    expect(kiemTraLuaChon(lc({ taoLaiHoatDong: true }), 2, [])).toHaveLength(2);
    expect(kiemTraLuaChon(lc({ taoLaiHoatDong: true, hinhThucHD2: ["Phiên tòa giả định"], hinhThucHD3: ["Đóng vai"] }), 2, [])).toEqual([]);
  });

  it("phương án C: mỗi yêu cầu cần đạt thuộc đúng một mục", () => {
    const co = lc({
      chuyenKhung: true, phuongAn: "C",
      mach: [{ ten: "Mục 1", yeuCau: ["MT-01", "MT-02"] }, { ten: "Mục 2", yeuCau: ["MT-02"] }, { ten: "Mục 3", yeuCau: [] }],
    });
    const loi = kiemTraLuaChon(co, 4, ["MT-01", "MT-02", "MT-03"]);
    expect(loi.some((l) => l.includes("chưa gán") && l.includes("MT-03"))).toBe(true);
    expect(loi.some((l) => l.includes("chỉ thuộc một") && l.includes("MT-02"))).toBe(true);
  });

  it("bật LHĐN: mặc định tự học trước giờ trên EduNext, không ghi đè nền tảng GV đã nhập", () => {
    expect(doiViec(lc({}), "lhdn", true).tuHoc).toEqual({ bat: true, nenTang: "EduNext" });
    expect(doiViec(lc({ tuHoc: { bat: true, nenTang: "LMS trường" } }), "lhdn", true).tuHoc.nenTang).toBe("LMS trường");
    expect(doiViec(lc({}), "nls", true).tuHoc.bat).toBe(false);
  });

  it("năng lực số chọn tối đa 3 mã", () => {
    expect(kiemTraLuaChon(lc({ nls: true, maNls: ["1.1.5.1", "1.2.5.1", "2.1.5.1", "3.1.5.1"] }), 1, [])).toEqual(["Năng lực số: chọn 1–3 mã (theo khung)."]);
  });

  it("môn Ngoại ngữ không dùng CLIL", () => {
    expect(dungClil(lc({ tiengAnh: true }), "NGOAI_NGU")).toBe(false);
    expect(dungClil(lc({ tiengAnh: true }), "TOAN")).toBe(true);
  });
});

describe("lập kế hoạch", () => {
  const pt: PhanTichGiaoAn = {
    thongTin: { mon: "TOAN", lop: 10, tenBai: "Bài 1", soTiet: 2 },
    doan: [], canhBao: [],
    hoatDong: [
      { ma: "HDC-1", ten: "Hoạt động 1: Khởi động", loai: "khoi_dong", doan: [] },
      { ma: "HDC-2", ten: "Hoạt động 2: Hình thành kiến thức", loai: "hinh_thanh", doan: [] },
      { ma: "HDC-3", ten: "Củng cố, dặn dò", loai: "cung_co", doan: [] },
    ],
  };

  it("chỉ tích hợp: giữ thời lượng cũ, vị trí là hoạt động của GV", () => {
    const kh = lapKeHoach(pt, pt.thongTin, lc({ nls: true }));
    expect(kh.phamVi.giuNguyenToanBo).toBe(true);
    expect(kh.thoiLuong).toBeNull();
    expect(kh.oViTri.map((o) => o.ma)).toEqual(["HDC-1", "HDC-2", "HDC-3"]);
  });

  it("chuyển khung: ánh xạ mặc định và ô vị trí theo tiết", () => {
    const kh = lapKeHoach(pt, pt.thongTin, lc({ chuyenKhung: true }));
    expect(kh.anhXa!.map((d) => d.dich)).toEqual([["HD1"], ["GD1", "HD1"], ["HD4", "GD3"]]);
    expect(kh.oViTri.map((o) => o.ma)).toEqual(["GD1", "HD1_T1", "HD2_T1", "HD3_T2", "HD4_T2"]);
  });

  it("không chọn AI thì phạm vi không có phần AI", () => {
    expect(tinhPhamVi(lc({ nls: true }), "TOAN").mucDuocViet.some((m) => m.startsWith("ai"))).toBe(false);
  });
});

describe("chọn chức năng nào thì tích hợp chức năng đó", async () => {
  const { chuanHoaLuaChon, chuanHoaTheoBai, LUA_CHON_BAT_DAU } = await import("@khbd/lib/pipeline/2-lua-chon/lua-chon");
  const pt = { hoatDong: [{ ma: "HDC-1", loai: "khoi_dong" }, { ma: "HDC-2", loai: "hinh_thanh" }, { ma: "HDC-3", loai: "luyen_tap" }, { ma: "HDC-4", loai: "van_dung" }] };
  it("chưa chọn gì: không chuyển khung, phải chọn ít nhất một chức năng", () => {
    expect(LUA_CHON_BAT_DAU).toMatchObject({ chuyenKhung: false, taoLaiHoatDong: false });
    expect(kiemTraLuaChon(LUA_CHON_BAT_DAU, 2, [])).toHaveLength(1);
  });
  it("chỉ tiếng Anh, năng lực số, AI: giữ bố cục gốc", () => {
    for (const x of [{ tiengAnh: true }, { nls: true }, { ai: true }, { nls: true, ai: true, tiengAnh: true }]) {
      expect(chuanHoaLuaChon(lc(x))).toMatchObject({ chuyenKhung: false, taoLaiHoatDong: false });
    }
  });
  it("LHĐN: chuyển khung 3 giai đoạn; chọn hình thức thì soạn lại HĐ II, HĐ III", () => {
    expect(chuanHoaLuaChon(lc({ lhdn: true }))).toMatchObject({ chuyenKhung: true, taoLaiHoatDong: false });
    const l = chuanHoaLuaChon(lc({ lhdn: true, hinhThucHD2: ["Trạm luyện tập"] }));
    expect(l).toMatchObject({ chuyenKhung: true, taoLaiHoatDong: true });
    expect(kiemTraLuaChon(l, 2, [])).toEqual(["Chọn hoặc nhập hình thức tổ chức HĐ III."]);
    expect(chuanHoaLuaChon(lc({ hinhThucHD2: ["Trạm luyện tập"] })).taoLaiHoatDong).toBe(false);
  });
  it("tiếng Anh: GV tự chọn cách và hoạt động (không chọn sẵn); đổi bố cục làm hoạt động không hợp lệ thì bỏ chọn", () => {
    const bat = chuanHoaTheoBai(lc({ tiengAnh: true }), pt);
    expect(bat.hoatDongTiengAnh).toBeNull();
    expect(bat.cachTiengAnh).toBeNull();
    expect(kiemTraLuaChon(bat, 2, [])).toEqual(["Tiếng Anh: chọn cách tích hợp (dịch, CLIL hoặc cả hai).", "Tiếng Anh: chọn hoạt động tích hợp."]);
    const chon = chuanHoaTheoBai({ ...bat, cachTiengAnh: "clil", hoatDongTiengAnh: "HDC-2" }, pt);
    expect(chon.hoatDongTiengAnh).toBe("HDC-2");
    expect(kiemTraLuaChon(chon, 2, [])).toEqual([]);
    expect(chuanHoaTheoBai({ ...chon, lhdn: true }, pt).hoatDongTiengAnh).toBeNull();
    expect(chuanHoaTheoBai({ ...chon, lhdn: true, hoatDongTiengAnh: "HD2" }, pt).hoatDongTiengAnh).toBe("HD2");
  });
});
