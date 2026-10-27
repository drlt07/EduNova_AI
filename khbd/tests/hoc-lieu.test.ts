/**
 * Học liệu số / mô phỏng EduNova gắn vào hoạt động: chèn đúng hoạt động, có dòng ở Thiết bị dạy học,
 * đoạn là "bo_sung", không làm mất chữ của GV. Chạy với Tin học 10 ở hai chế độ: LHĐN (khung mới) và giữ bố cục.
 */
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { docFile } from "@khbd/lib/pipeline/1-tai-len";
import { phanTichGiaoAn } from "@khbd/lib/pipeline/3-ke-hoach/tach-doan";
import { lapKeHoach } from "@khbd/lib/pipeline/3-ke-hoach";
import { LUA_CHON_TRONG, chuanHoaLuaChon, doiViec, type LuaChon } from "@khbd/lib/pipeline/2-lua-chon/lua-chon";
import { lapDanhSachLuot } from "@khbd/lib/pipeline/4-sinh-noi-dung/luot";
import { nguCanhTu, type NoiDungSoan } from "@khbd/lib/pipeline/4-sinh-noi-dung/dinh-nghia";
import { soanMotLuot } from "@khbd/lib/pipeline/4-sinh-noi-dung/soan";
import { adapterGiaLap } from "@khbd/lib/llm";
import { taoMauGiaLap } from "@khbd/lib/llm/mau-gia-lap";
import { locChiBao, TRINH_DO_THPT } from "@khbd/lib/data/nls";
import { xuatWord } from "@khbd/lib/pipeline/6-xuat-file/xuat";
import { docFileDaXuat } from "@khbd/lib/pipeline/5-kiem-tra/kiem-tra-file";
import { doanCanGiu, hoatDongDeGanHocLieu } from "@khbd/lib/pipeline/6-xuat-file/ghep";
import { chenHocLieu, type HocLieuGan } from "@khbd/lib/pipeline/6-xuat-file/hoc-lieu";
import type { BanSoan } from "@khbd/lib/pipeline/6-xuat-file/ban-soan";

const mau = fs.readFileSync(path.join(process.cwd(), "templates/mau.docx"));
const chiBao = locChiBao({ trinhDo: TRINH_DO_THPT }).map((c) => ({ ma: c.ma, noiDung: c.noiDung }));
const chuan = (s: string) => s.replace(/\s+/g, " ").trim();
const FILE = "tin10_bien_va_lenh_gan.docx";

async function soan(viec: "lhdn" | "nls") {
  const kq = await docFile(FILE, fs.readFileSync(path.join(process.cwd(), "samples/input", FILE)));
  const pt = phanTichGiaoAn(kq.html, FILE);
  const lc: LuaChon = chuanHoaLuaChon(doiViec(LUA_CHON_TRONG, viec, true));
  const kh = lapKeHoach(pt, pt.thongTin, lc);
  const ctx = nguCanhTu(pt, pt.thongTin, lc, kh, chiBao);
  const adapter = adapterGiaLap(taoMauGiaLap(ctx), { min: 0, max: 0 });
  const nd: NoiDungSoan = {};
  for (const l of lapDanhSachLuot(kh, lc)) {
    const r = await soanMotLuot(l.ma, ctx, nd, adapter);
    if (r) (nd as Record<string, unknown>)[l.ma] = r.duLieu;
  }
  return { pt, lc, kh, nd };
}

const moPhong = (hd: string): HocLieuGan => ({ hd, loai: "mo_phong", ten: "Thành phố giao thông thông minh (EduNova)", nhiemVu: "HS viết điều kiện if/elif/else cho đèn tín hiệu, chạy thử đủ ba trạng thái đèn." });

describe("Gắn học liệu, mô phỏng vào hoạt động", () => {
  it("khung mới (LHĐN): có danh sách hoạt động, chèn đúng sau hoạt động đã chọn và thêm vào Thiết bị", async () => {
    const { pt, lc, kh, nd } = await soan("lhdn");
    const ds = hoatDongDeGanHocLieu(pt, pt.thongTin, lc, kh, nd);
    expect(ds.map((h) => h.hd)).toEqual(expect.arrayContaining(["HD1", "HD2", "HD3"]));
    const truoc = docFileDaXuat(xuatWord(mau, pt, pt.thongTin, lc, kh, false, nd)).doanChu.map(chuan);
    const sau = docFileDaXuat(xuatWord(mau, pt, pt.thongTin, lc, kh, false, { ...nd, hoc_lieu: [moPhong("HD3")] })).doanChu.map(chuan);
    const iMp = sau.findIndex((c) => c.startsWith("Mô phỏng: Thành phố giao thông"));
    const iHd3 = sau.findIndex((c) => c.startsWith(ds.find((h) => h.hd === "HD3")!.ten.slice(0, 12)));
    const iHd4 = sau.findIndex((c, i) => i > iHd3 && /^HĐ IV|^HOẠT ĐỘNG IV|Hoạt động IV/i.test(c));
    expect(iMp).toBeGreaterThan(iHd3);
    if (iHd4 > 0) expect(iMp).toBeLessThan(iHd4);
    expect(sau).toContain("HS viết điều kiện if/elif/else cho đèn tín hiệu, chạy thử đủ ba trạng thái đèn.");
    expect(sau.some((c) => c.startsWith("Học liệu số, mô phỏng: Thành phố giao thông"))).toBe(true);
    // Mọi đoạn của bản không gắn học liệu vẫn còn (chỉ thêm, không bớt)
    for (const c of truoc) expect(sau).toContain(c);
  });

  it("giữ bố cục: gắn được vào hoạt động của GV, chữ GV còn nguyên", async () => {
    const { pt, lc, kh, nd } = await soan("nls");
    const ds = hoatDongDeGanHocLieu(pt, pt.thongTin, lc, kh, nd);
    expect(ds.length).toBeGreaterThan(1);
    const cuoi = ds[ds.length - 1].hd;
    const sau = docFileDaXuat(xuatWord(mau, pt, pt.thongTin, lc, kh, false, { ...nd, hoc_lieu: [moPhong(cuoi)] })).doanChu.map(chuan).join("\n");
    expect(sau).toContain("Mô phỏng: Thành phố giao thông");
    for (const d of doanCanGiu(pt, pt.thongTin, lc, kh, nd)) if (d.vanBan.trim().length > 20) expect(sau).toContain(chuan(d.vanBan).slice(0, 40));
  });

  it("bỏ qua hoạt động không có trong bản soạn và học liệu không có tên", () => {
    const ban: BanSoan = { cheDo: "moi", monHoa: "Tin học", lop: 10, tenBai: "x", soTiet: 1, coGd1: false, coGd3: false, tenMaTran: "", coAi: false,
      phan: [{ truong: "tienTrinh", khoi: [{ nguon: "bo_sung", chu: "HĐ I", kieu: "TenHoatDong", hd: "HD1" }, { nguon: "giu_nguyen", chu: "GV hỏi", hd: "HD1" }] }] };
    expect(chenHocLieu(ban, [moPhong("HD9"), { ...moPhong("HD1"), ten: " " }])).toBe(ban);
    const kq = chenHocLieu(ban, [moPhong("HD1")]);
    expect(kq.phan[0].khoi.map((k) => ("chu" in k ? k.chu : ""))).toEqual(["HĐ I", "GV hỏi", "Thành phố giao thông thông minh (EduNova).", moPhong("HD1").nhiemVu]);
    expect(kq.phan.find((p) => p.truong === "thietBi")).toBeTruthy();
    expect(kq.phan[0].khoi.slice(2).every((k) => "nguon" in k && k.nguon === "bo_sung")).toBe(true);
  });
});
