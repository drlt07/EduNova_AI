import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { docFile } from "@khbd/lib/pipeline/1-tai-len";
import { phanTichGiaoAn } from "@khbd/lib/pipeline/3-ke-hoach/tach-doan";
import { lapKeHoach } from "@khbd/lib/pipeline/3-ke-hoach";
import { LUA_CHON_TRONG, chuanHoaTheoBai, doiViec, type LuaChon } from "@khbd/lib/pipeline/2-lua-chon/lua-chon";
import { nguCanhTu, taoYeuCau, type NoiDungSoan } from "@khbd/lib/pipeline/4-sinh-noi-dung/dinh-nghia";
import { lapDanhSachLuot } from "@khbd/lib/pipeline/4-sinh-noi-dung/luot";
import { soanMotLuot } from "@khbd/lib/pipeline/4-sinh-noi-dung/soan";
import { kiemTraLuot } from "@khbd/lib/pipeline/5-kiem-tra/kiem-tra-noi-dung";
import { docFileDaXuat, kiemTraFileXuat } from "@khbd/lib/pipeline/5-kiem-tra/kiem-tra-file";
import { doanCanGiu } from "@khbd/lib/pipeline/6-xuat-file/ghep";
import { xuatWord } from "@khbd/lib/pipeline/6-xuat-file/xuat";
import { adapterGiaLap } from "@khbd/lib/llm";
import { taoMauGiaLap } from "@khbd/lib/llm/mau-gia-lap";

const MAU = fs.readFileSync(path.join(process.cwd(), "templates/mau.docx"));
const FILE = "toan10_bat_phuong_trinh_bac_hai.docx";
const pt = phanTichGiaoAn((await docFile(FILE, fs.readFileSync(path.join(process.cwd(), "samples/input", FILE)))).html, FILE);
const CACH = "Đóng vai tình huống: 3 HS đóng vai chủ cửa hàng, kế toán, khách hàng tranh luận về số sản phẩm cần bán.";

/** Chạy các lượt bằng giả lập rồi xuất Word (bản sạch). */
async function chay(lc: LuaChon) {
  const kh = lapKeHoach(pt, pt.thongTin, lc);
  const ctx = nguCanhTu(pt, pt.thongTin, lc, kh, []);
  const ad = adapterGiaLap(taoMauGiaLap(ctx), { min: 0, max: 0 });
  const ds = lapDanhSachLuot(kh, lc, 0, pt.hoatDong);
  const nd: NoiDungSoan = {};
  for (const l of ds) {
    const kq = await soanMotLuot(l.ma, ctx, nd, ad);
    if (kq) (nd as Record<string, unknown>)[l.ma] = kq.duLieu;
  }
  const file = xuatWord(MAU, pt, pt.thongTin, lc, kh, false, nd);
  return { ds, nd, ctx, kh, file, chu: docFileDaXuat(file).doanChu };
}

describe("chọn gợi ý triển khai thì hoạt động được soạn lại (giữ bố cục)", () => {
  const lc: LuaChon = { ...LUA_CHON_TRONG, nls: true, maNls: ["5.2.5.2"], trienKhai: { "HDC-1": CACH } };

  it("có lượt soạn lại đúng hoạt động đã chọn, đứng đầu", async () => {
    const { ds } = await chay(lc);
    expect(ds[0].ma).toBe("tk_HDC-1");
    expect(ds.filter((l) => l.ma.startsWith("tk_"))).toHaveLength(1);
  });

  it("file Word: hoạt động có các bước mới; đoạn tổ chức cũ được thay; câu hỏi, công thức của GV giữ nguyên văn trong bước", async () => {
    const { chu, file, nd, kh } = await chay(lc);
    const tu = chu.findIndex((c) => c.startsWith("Hoạt động 1"));
    const den = chu.findIndex((c) => c.startsWith("Hoạt động 2"));
    const hd1 = chu.slice(tu, den).join("\n");
    expect(hd1).toMatch(/Tổ chức: Đóng vai tình huống/);
    expect(hd1).toMatch(/Bước 1 – Giao nhiệm vụ theo cách đã chọn/);
    expect(hd1).toContain("Sản phẩm – đánh giá:");
    // Đoạn chỉ mô tả cách tổ chức cũ không còn; đoạn có bài toán (công thức) của GV vẫn còn.
    expect(hd1).not.toContain("HS thảo luận cặp đôi, nêu dự đoán.");
    expect(hd1).toContain("Bán bao nhiêu sản phẩm thì cửa hàng có lãi?");
    // Các hoạt động khác giữ nguyên.
    expect(chu.join("\n")).toContain("HS làm theo nhóm 4, trình bày trên bảng phụ.");
    // Kiểm tra giữ nguyên: đoạn đã thay có chủ đích không tính là mất nội dung.
    const k = kiemTraFileXuat(file, doanCanGiu(pt, pt.thongTin, lc, kh, nd), { coAi: false, nenTangChon: [], nenTangGoiY: [] });
    expect(k.loi.filter((l) => l.nghiem)).toEqual([]);
    expect(k.tiLeGiuNguyen).toBe(100);
  });

  it("câu hỏi của GV không bao giờ bị thay dù AI ghi vào doanThay", async () => {
    const { nd, kh } = await chay(lc);
    const tk = nd["tk_HDC-1"]!;
    const cauHoi = pt.doan.find((d) => d.vanBan.includes("Bán bao nhiêu sản phẩm"))!;
    const ndSai: NoiDungSoan = { ...nd, "tk_HDC-1": { ...tk, doanThay: [...tk.doanThay, cauHoi.ma], buoc: tk.buoc.map((b) => ({ ...b, maDoan: b.maDoan.filter((m) => m !== cauHoi.ma) })) } };
    const chu = docFileDaXuat(xuatWord(MAU, pt, pt.thongTin, lc, kh, false, ndSai)).doanChu.join("\n");
    expect(chu).toContain("Bán bao nhiêu sản phẩm thì cửa hàng có lãi?");
  });

  it("không chọn gợi ý: không soạn lại, hoạt động giữ nguyên", async () => {
    const { ds, chu } = await chay({ ...lc, trienKhai: {} });
    expect(ds.some((l) => l.ma.startsWith("tk_"))).toBe(false);
    expect(chu.join("\n")).toContain("HS thảo luận cặp đôi, nêu dự đoán.");
  });

  it("LHĐN: không có lượt soạn lại hoạt động gốc (đã chuyển khung)", () => {
    const l = chuanHoaTheoBai({ ...doiViec({ ...LUA_CHON_TRONG }, "lhdn", true), trienKhai: { "HDC-1": CACH } }, pt);
    expect(lapDanhSachLuot(lapKeHoach(pt, pt.thongTin, l), l, 0, pt.hoatDong).some((x) => x.ma.startsWith("tk_"))).toBe(false);
  });

  it("dịch tiếng Anh hoạt động đã soạn lại: dịch bản mới", async () => {
    const lcTa: LuaChon = { ...lc, tiengAnh: true, cachTiengAnh: "dich", hoatDongTiengAnh: "HDC-1" };
    const { nd, ctx } = await chay(lcTa);
    const s = taoYeuCau("tieng_anh", ctx, nd)!.noiDung.split("NHIỆM VỤ:")[1];
    expect(s).toContain("Bước 1 – Giao nhiệm vụ theo cách đã chọn");
    expect(s).toContain("Bán bao nhiêu sản phẩm thì cửa hàng có lãi?");
    expect(s).not.toContain("HS thảo luận cặp đôi, nêu dự đoán.");
  });

  it("kiểm tra lượt soạn lại: thiếu cách tổ chức, ít bước, thiếu sản phẩm là lỗi cần soạn lại", async () => {
    const { ctx } = await chay(lc);
    const loi = kiemTraLuot("tk_HDC-1", { mucTieu: "x", cachToChuc: "", buoc: [{ ten: "a", phut: 5, gv: "GV hướng dẫn", hs: "HS làm", maDoan: [] }], thietBi: [], sanPham: "", tieuChi: [], doanThay: [] }, ctx, {});
    expect(loi.filter((l) => l.nghiem).length).toBeGreaterThanOrEqual(3);
  });
});
