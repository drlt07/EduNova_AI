import { describe, expect, it } from "vitest";
import { Document, Packer, Paragraph, TextRun } from "docx";
import { docFile } from "@khbd/lib/pipeline/1-tai-len";
import { doanCuaHoatDong, nhanDienHoatDong, phanTichGiaoAn } from "@khbd/lib/pipeline/3-ke-hoach/tach-doan";
import { lapKeHoach } from "@khbd/lib/pipeline/3-ke-hoach";
import { LUA_CHON_TRONG, hoatDongTiengAnhMacDinh, type LuaChon } from "@khbd/lib/pipeline/2-lua-chon/lua-chon";
import { nguCanhTu, taoYeuCau } from "@khbd/lib/pipeline/4-sinh-noi-dung/dinh-nghia";

/** Giáo án giả: dòng bắt đầu bằng "**" là dòng in đậm. */
async function giaoAn(dong: string[]) {
  const doc = new Document({ sections: [{ children: dong.map((d) => new Paragraph({ children: [new TextRun({ text: d.replace(/^\*\*/, ""), bold: d.startsWith("**") })] })) }] });
  const kq = await docFile("thu.docx", await Packer.toBuffer(doc));
  return phanTichGiaoAn(kq.html, "thu.docx");
}

const DAU = ["**KẾ HOẠCH BÀI DẠY", "Môn: Hóa học. Lớp: 11", "**BÀI 5. AMMONIA", "**I. MỤC TIÊU", "**1. Kiến thức", "Nêu được cấu tạo phân tử ammonia.", "**II. THIẾT BỊ DẠY HỌC VÀ HỌC LIỆU", "Phiếu học tập."];

describe("nhận diện tiêu đề hoạt động", () => {
  it.each([
    ["Hoạt động 1: Mở đầu", "khoi_dong", "1"], ["HOẠT ĐỘNG 2. HÌNH THÀNH KIẾN THỨC MỚI", "hinh_thanh", "2"],
    ["1. Hoạt động 1: Xác định vấn đề (10 phút)", "khoi_dong", "1"], ["HĐ1. Khởi động", "khoi_dong", "1"],
    ["HĐ 2.1: Tìm hiểu khái niệm", "hinh_thanh", "2.1"], ["Hoạt động thứ 3: Luyện tập", "luyen_tap", "3"],
    ["HĐ II. Luyện tập phân hóa", "luyen_tap", "II"], ["HĐ IV. Exit ticket", "cung_co", "IV"],
    ["A. KHỞI ĐỘNG", "khoi_dong", undefined], ["C. LUYỆN TẬP", "luyen_tap", undefined], ["E. TÌM TÒI, MỞ RỘNG", "van_dung", undefined],
    ["4. Vận dụng (5 phút)", "van_dung", undefined], ["Hoạt động khởi động", "khoi_dong", undefined], ["Củng cố, dặn dò", "cung_co", undefined],
    ["Giai đoạn 1: Tự học ở nhà", "hinh_thanh", "GĐ1"],
  ])("%s", (chu, loai, so) => expect(nhanDienHoatDong(chu)).toEqual(so ? { loai, so } : { loai }));

  it.each([
    "Hoạt động nhóm: HS thảo luận", "Hoạt động cá nhân", "a) Mục tiêu: HS nêu được", "3. Tổ chức thực hiện:", "b) Luyện tập: HS làm bài",
    "Vận dụng công thức để tính diện tích. Sau đó báo cáo.", "Nhận định 1: Mọi ester đều thơm", "Luyện tập",
  ])("không nhầm: %s", (chu) => expect(nhanDienHoatDong(chu)).toBeNull());
  it("dòng in đậm chỉ có tên giai đoạn là tiêu đề", () => expect(nhanDienHoatDong("Luyện tập", true)).toEqual({ loai: "luyen_tap" }));
});

describe("tách hoạt động theo nhiều kiểu KHBD", () => {
  it("mẫu 5512: mục con a) b) c) d), \"1. Mục tiêu\", \"3. Tổ chức thực hiện\", \"Hoạt động nhóm\" không cắt hoạt động; hoạt động con 2.1, 2.2", async () => {
    const pt = await giaoAn([...DAU,
      "**III. TIẾN TRÌNH DẠY HỌC",
      "**1. Hoạt động 1: Mở đầu (5 phút)", "**1. Mục tiêu:", "Gợi nhu cầu tìm hiểu ammonia.", "**3. Tổ chức thực hiện:", "Hoạt động nhóm: HS ngửi mẫu, nêu nhận xét.",
      "**2. Hoạt động 2: Hình thành kiến thức mới", "GV nêu nhiệm vụ chung của hoạt động 2.",
      "**Hoạt động 2.1: Tìm hiểu cấu tạo phân tử", "a) Mục tiêu: Mô tả cấu tạo phân tử NH3.", "d) Tổ chức thực hiện: HS lắp mô hình phân tử.",
      "**Hoạt động 2.2: Tìm hiểu tính chất hóa học", "HS làm thí nghiệm NH3 với HCl.",
      "**3. Hoạt động 3: Luyện tập", "Câu 1. Ammonia có tính base vì sao?",
      "**4. Hoạt động 4: Vận dụng", "HS giải thích vì sao bón phân đạm không trộn vôi.",
      "**IV. PHỤ LỤC", "Phiếu học tập số 1: Bảng so sánh tính chất.",
    ]);
    expect(pt.hoatDong.map((h) => [h.so, h.loai, h.cha ?? ""])).toEqual([
      ["1", "khoi_dong", ""], ["2", "hinh_thanh", ""], ["2.1", "hinh_thanh", "HDC-2"], ["2.2", "hinh_thanh", "HDC-2"], ["3", "luyen_tap", ""], ["4", "van_dung", ""],
    ]);
    const chu = (ma: string) => doanCuaHoatDong(pt, ma).map((d) => d.vanBan);
    expect(chu("HDC-1")).toEqual(["1. Mục tiêu:", "Gợi nhu cầu tìm hiểu ammonia.", "3. Tổ chức thực hiện:", "Hoạt động nhóm: HS ngửi mẫu, nêu nhận xét."]);
    // Hoạt động 2 gồm cả 2.1, 2.2 (có tiêu đề), không lấy sang hoạt động 3.
    expect(chu("HDC-2")).toEqual([
      "GV nêu nhiệm vụ chung của hoạt động 2.", "Hoạt động 2.1: Tìm hiểu cấu tạo phân tử", "a) Mục tiêu: Mô tả cấu tạo phân tử NH3.",
      "d) Tổ chức thực hiện: HS lắp mô hình phân tử.", "Hoạt động 2.2: Tìm hiểu tính chất hóa học", "HS làm thí nghiệm NH3 với HCl.",
    ]);
    // Phụ lục sau tiến trình không thuộc nội dung hoạt động 4 (đi kèm để không mất khi chuyển khung).
    expect(chu("HDC-6")).toEqual(["HS giải thích vì sao bón phân đạm không trộn vôi."]);
    expect(pt.hoatDong[5].kem).toHaveLength(2);
    expect(pt.doan.filter((d) => d.muc === "muc_tieu").length).toBeGreaterThan(0);
    expect(hoatDongTiengAnhMacDinh(pt, { ...LUA_CHON_TRONG })).toBe("HDC-6");
  });

  it("khung 5 bước cũ A–E, không đánh số mục III", async () => {
    const pt = await giaoAn([...DAU, "**TIẾN TRÌNH DẠY HỌC", "**A. KHỞI ĐỘNG", "HS xem video.", "**B. HÌNH THÀNH KIẾN THỨC", "GV giảng.", "**C. LUYỆN TẬP", "Bài 1.", "**D. VẬN DỤNG", "Bài thực tế.", "**E. TÌM TÒI, MỞ RỘNG", "Đọc thêm."]);
    expect(pt.hoatDong.map((h) => h.loai)).toEqual(["khoi_dong", "hinh_thanh", "luyen_tap", "van_dung", "van_dung"]);
    expect(pt.canhBao.some((c) => c.includes("Không nhận ra"))).toBe(false);
  });

  it("thiếu tiêu đề mục III: gặp \"Hoạt động 1\" thì sang tiến trình", async () => {
    const pt = await giaoAn([...DAU, "**Hoạt động 1. Khởi động", "HS trả lời câu hỏi.", "**Hoạt động 2. Luyện tập", "Bài 1."]);
    expect(pt.hoatDong).toHaveLength(2);
    expect(pt.doan.find((d) => d.vanBan === "HS trả lời câu hỏi.")?.muc).toBe("tien_trinh");
  });

  it("KHBD đã theo khung LHĐN: Giai đoạn 1–3, HĐ I–IV", async () => {
    const pt = await giaoAn([...DAU, "**III. TIẾN TRÌNH DẠY HỌC", "**Giai đoạn 1: Tự học trước giờ học", "HS đọc SGK.", "**Giai đoạn 2: Hoạt động trên lớp",
      "**HĐ I. Tình huống mở đầu, nhận định chỉnh lỗi", "Nhận định 1: NH3 là acid.", "**HĐ II. Luyện tập phân hóa", "Nhóm Nắm tốt làm bài 3.",
      "**HĐ III. Vận dụng thực tế", "Giải tình huống mở đầu.", "**HĐ IV. Exit ticket, chốt kiến thức", "3 câu hỏi nhanh.", "**Giai đoạn 3: Sau giờ học", "Làm bài trên hệ thống."]);
    expect(pt.hoatDong.map((h) => `${h.so}:${h.loai}`)).toEqual(["GĐ1:hinh_thanh", "I:khoi_dong", "II:luyen_tap", "III:van_dung", "IV:cung_co", "GĐ3:cung_co"]);
    expect(doanCuaHoatDong(pt, pt.hoatDong[3].ma).map((d) => d.vanBan)).toEqual(["Giải tình huống mở đầu."]);
  });
});

describe("tiến trình đánh số 1… 2… 3…", () => {
  it("\"Tiến trình dạy học 1/2/3\" là tên hoạt động, không phải mục III", async () => {
    const pt = await giaoAn([...DAU, "**III. TIẾN TRÌNH DẠY HỌC", "**Tiến trình dạy học 1: Mở đầu", "HS xem video.",
      "**Tiến trình dạy học 2: Tìm hiểu tính chất", "HS làm thí nghiệm.", "**Tiến trình dạy học 3: Vận dụng", "HS giải thích hiện tượng."]);
    expect(pt.hoatDong.map((h) => `${h.so}:${h.loai}`)).toEqual(["1:khoi_dong", "2:hinh_thanh", "3:van_dung"]);
    expect(doanCuaHoatDong(pt, "HDC-2").map((d) => d.vanBan)).toEqual(["HS làm thí nghiệm."]);
  });

  it("chỉ đánh số \"1. …, 2. …, 3. …\" không có chữ \"Hoạt động\": lấy dãy in đậm làm hoạt động, mục con không cắt", async () => {
    const pt = await giaoAn([...DAU, "**III. TIẾN TRÌNH DẠY HỌC",
      "**1. Tình huống ngửi mùi khai", "1. Mục tiêu: HS nêu vấn đề.", "2. Tổ chức thực hiện: GV cho HS ngửi mẫu.",
      "**2. Cấu tạo và tính chất của ammonia", "1. Cấu tạo phân tử", "2. Tính chất hóa học", "HS làm thí nghiệm.",
      "**3. Giải bài tập", "Câu 1. NH3 có tính base?",
      "**4. Ứng dụng trong sản xuất phân bón", "HS giải thích vì sao không trộn đạm với vôi.",
      "**IV. PHỤ LỤC", "Phiếu học tập số 1."]);
    expect(pt.hoatDong.map((h) => `${h.so}:${h.loai}`)).toEqual(["1:khoi_dong", "2:hinh_thanh", "3:luyen_tap", "4:van_dung"]);
    expect(doanCuaHoatDong(pt, "HDC-1").map((d) => d.vanBan)).toEqual(["1. Mục tiêu: HS nêu vấn đề.", "2. Tổ chức thực hiện: GV cho HS ngửi mẫu."]);
    expect(doanCuaHoatDong(pt, "HDC-2").map((d) => d.vanBan)).toEqual(["1. Cấu tạo phân tử", "2. Tính chất hóa học", "HS làm thí nghiệm."]);
    expect(doanCuaHoatDong(pt, "HDC-4").map((d) => d.vanBan)).toEqual(["HS giải thích vì sao không trộn đạm với vôi."]);
    expect(pt.hoatDong[3].kem).toHaveLength(2);
    expect(pt.canhBao.some((c) => c.includes("Không nhận ra"))).toBe(false);
  });

  it("đánh số La Mã hoặc chữ cái, tên có từ giai đoạn thì loại theo tên", async () => {
    const pt = await giaoAn([...DAU, "**III. TIẾN TRÌNH DẠY HỌC", "**I. Ôn bài cũ", "HS trả lời.", "**II. Luyện tập", "Bài 1.", "**III. Mở rộng kiến thức", "Đọc thêm."]);
    expect(pt.hoatDong.map((h) => h.loai)).toEqual(["khoi_dong", "luyen_tap", "van_dung"]);
  });
});

describe("dịch tiếng Anh chỉ đúng hoạt động đã chọn", () => {
  it("yêu cầu dịch chỉ chứa nội dung hoạt động đó (kể cả hoạt động con), không lấy hoạt động khác, phụ lục", async () => {
    const pt = await giaoAn([...DAU, "**III. TIẾN TRÌNH DẠY HỌC",
      "**Hoạt động 1: Mở đầu", "Nội dung mở đầu.",
      "**Hoạt động 2: Hình thành kiến thức", "**Hoạt động 2.1: Cấu tạo", "Nội dung cấu tạo.", "**Hoạt động 2.2: Tính chất", "Nội dung tính chất.",
      "**Hoạt động 3: Luyện tập", "Nội dung luyện tập.", "**IV. PHỤ LỤC", "Phiếu học tập."]);
    const lc: LuaChon = { ...LUA_CHON_TRONG, tiengAnh: true, cachTiengAnh: "dich", hoatDongTiengAnh: "HDC-2" };
    const ctx = nguCanhTu(pt, pt.thongTin, lc, lapKeHoach(pt, pt.thongTin, lc), []);
    const yc = taoYeuCau("tieng_anh", ctx, {})!;
    const canDich = yc.noiDung.split("NHIỆM VỤ:")[1];
    expect(canDich).toContain("Nội dung cấu tạo.");
    expect(canDich).toContain("Hoạt động 2.2: Tính chất");
    expect(canDich).toContain("Nội dung tính chất.");
    expect(canDich).not.toContain("Nội dung mở đầu.");
    expect(canDich).not.toContain("Nội dung luyện tập.");
    expect(canDich).not.toContain("Phiếu học tập.");
  });
});

describe("LHĐN + tiếng Anh khác chỉ chọn tiếng Anh", async () => {
  const { lapDanhSachLuot } = await import("@khbd/lib/pipeline/4-sinh-noi-dung/luot");
  const { soanMotLuot } = await import("@khbd/lib/pipeline/4-sinh-noi-dung/soan");
  const { adapterGiaLap } = await import("@khbd/lib/llm");
  const { taoMauGiaLap } = await import("@khbd/lib/llm/mau-gia-lap");
  const { doiViec } = await import("@khbd/lib/pipeline/2-lua-chon/lua-chon");
  const pt = await giaoAn([...DAU, "**III. TIẾN TRÌNH DẠY HỌC",
    "**Hoạt động 1: Mở đầu", "Nội dung mở đầu của GV.", "**Hoạt động 2: Hình thành kiến thức", "Nội dung hình thành của GV.",
    "**Hoạt động 3: Luyện tập", "Câu 1. NH3 có tính chất gì?", "**Hoạt động 4: Vận dụng", "Nội dung vận dụng của GV.", "**IV. PHỤ LỤC", "Phiếu học tập."]);

  /** Soạn các lượt trước lượt dịch bằng giả lập, rồi lấy phần nội dung cần dịch. */
  async function canDich(lc: LuaChon) {
    const kh = lapKeHoach(pt, pt.thongTin, lc);
    const ctx = nguCanhTu(pt, pt.thongTin, lc, kh, []);
    const ad = adapterGiaLap(taoMauGiaLap(ctx), { min: 0, max: 0 });
    const nd: Record<string, unknown> = {};
    for (const l of lapDanhSachLuot(kh, lc)) {
      if (l.ma === "tieng_anh") break;
      const kq = await soanMotLuot(l.ma, ctx, nd as never, ad);
      if (kq) nd[l.ma] = kq.duLieu;
    }
    return taoYeuCau("tieng_anh", ctx, nd as never)!.noiDung.split("NHIỆM VỤ:")[1];
  }

  it("chỉ tiếng Anh: dịch hoạt động trong KHBD gốc, giữ nguyên bố cục", async () => {
    const s = await canDich({ ...LUA_CHON_TRONG, tiengAnh: true, cachTiengAnh: "dich", hoatDongTiengAnh: "HDC-4" });
    expect(s).toContain("Hoạt động 4: Vận dụng");
    expect(s).toContain("Nội dung vận dụng của GV.");
    expect(s).not.toContain("giả lập");
    expect(s).not.toContain("Nội dung mở đầu của GV.");
  });

  it("LHĐN + tiếng Anh: dịch HĐ III đã chuyển khung (phần app soạn + phần GV xếp vào), không dịch hoạt động gốc khác", async () => {
    const { chuanHoaTheoBai } = await import("@khbd/lib/pipeline/2-lua-chon/lua-chon");
    const lc = chuanHoaTheoBai({ ...doiViec({ ...LUA_CHON_TRONG }, "lhdn", true), tiengAnh: true, cachTiengAnh: "dich" as const, hoatDongTiengAnh: "HD3" }, pt);
    expect(lc.chuyenKhung).toBe(true);
    const s = await canDich(lc);
    expect(s).toContain("HĐ III");
    expect(s).toContain("Mục tiêu:");
    expect(s).toContain("giả lập"); // phần app soạn cho HĐ III
    expect(s).toContain("Nội dung vận dụng của GV."); // phần GV được xếp vào HĐ III
    expect(s).not.toContain("Hoạt động 4: Vận dụng"); // tên hoạt động gốc không còn
    expect(s).not.toContain("Nội dung mở đầu của GV.");
    expect(s).not.toContain("Phiếu học tập.");
    expect(s).not.toMatch(/Exit ticket|Nhóm Nắm tốt/);
  });

  it("đổi qua lại LHĐN: hoạt động đã chọn không hợp với bố cục mới thì bỏ chọn", async () => {
    const { chuanHoaTheoBai } = await import("@khbd/lib/pipeline/2-lua-chon/lua-chon");
    const lc = { ...doiViec({ ...LUA_CHON_TRONG }, "lhdn", true), tiengAnh: true, cachTiengAnh: "dich" as const, hoatDongTiengAnh: "HDC-4" };
    expect(chuanHoaTheoBai(lc, pt).hoatDongTiengAnh).toBeNull();
    expect(chuanHoaTheoBai({ ...LUA_CHON_TRONG, tiengAnh: true, hoatDongTiengAnh: "HD3" }, pt).hoatDongTiengAnh).toBeNull();
  });
});
