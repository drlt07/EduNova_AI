/**
 * Kiểm thử từng tổ hợp chức năng (năng lực số, AI, tiếng Anh, LHĐN) trên ba giáo án mẫu, soạn bằng adapter giả lập.
 * Nguyên tắc: KHBD gốc là nguồn chuẩn; chỉ phần thuộc chức năng đã chọn được thay đổi.
 */
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { docFile } from "@khbd/lib/pipeline/1-tai-len";
import { phanTichGiaoAn } from "@khbd/lib/pipeline/3-ke-hoach/tach-doan";
import { lapKeHoach } from "@khbd/lib/pipeline/3-ke-hoach";
import { LUA_CHON_TRONG, chonTiengAnhTheoGoiY, type LuaChon } from "@khbd/lib/pipeline/2-lua-chon/lua-chon";
import { lapDanhSachLuot } from "@khbd/lib/pipeline/4-sinh-noi-dung/luot";
import { nguCanhTu, type NoiDungSoan } from "@khbd/lib/pipeline/4-sinh-noi-dung/dinh-nghia";
import { soanMotLuot } from "@khbd/lib/pipeline/4-sinh-noi-dung/soan";
import { adapterGiaLap, type AdapterLlm } from "@khbd/lib/llm";
import { taoMauGiaLap } from "@khbd/lib/llm/mau-gia-lap";
import { locChiBao, TRINH_DO_THPT } from "@khbd/lib/data/nls";
import { xuatWord } from "@khbd/lib/pipeline/6-xuat-file/xuat";
import { doanCanGiu } from "@khbd/lib/pipeline/6-xuat-file/ghep";
import { docFileDaXuat, kiemTraGiuNguyen } from "@khbd/lib/pipeline/5-kiem-tra/kiem-tra-file";
import { TEN_HD } from "@khbd/lib/pipeline/6-xuat-file/cau-co-dinh";
import type { PhanTichGiaoAn } from "@khbd/lib/pipeline/kieu";

const mau = fs.readFileSync(path.join(process.cwd(), "templates/mau.docx"));
const chiBao = locChiBao({ trinhDo: TRINH_DO_THPT }).map((c) => ({ ma: c.ma, noiDung: c.noiDung }));
const FILE = ["toan10_bat_phuong_trinh_bac_hai.docx", "lich_su11_chien_tranh_bao_ve_to_quoc.docx", "hoa12_ester.docx", "tin10_bien_va_lenh_gan.docx"];
const chuan = (s: string) => s.replace(/\s+/g, " ").trim();

const phanTich = new Map<string, PhanTichGiaoAn>();
async function docMau(file: string) {
  if (!phanTich.has(file)) {
    const kq = await docFile(file, fs.readFileSync(path.join(process.cwd(), "samples/input", file)));
    phanTich.set(file, phanTichGiaoAn(kq.html, file));
  }
  return phanTich.get(file)!;
}

/** Chạy trọn luồng: chuẩn hóa lựa chọn → kế hoạch → soạn từng lượt (giả lập) → xuất bản sạch và bản đánh dấu. */
async function chay(file: string, chon: Partial<LuaChon>, adapterRieng?: (ctx: ReturnType<typeof nguCanhTu>) => AdapterLlm) {
  const pt = await docMau(file);
  const lc = chonTiengAnhTheoGoiY({ ...LUA_CHON_TRONG, ...chon, ...(chon.lhdn && (pt.thongTin.soTiet ?? 1) >= 3 ? { phuongAn: "A" as const } : {}) }, pt);
  const kh = lapKeHoach(pt, pt.thongTin, lc);
  const ctx = nguCanhTu(pt, pt.thongTin, lc, kh, chiBao);
  const adapter = adapterRieng?.(ctx) ?? adapterGiaLap(taoMauGiaLap(ctx), { min: 0, max: 0 });
  const dsLuot = lapDanhSachLuot(kh, lc);
  const nd: NoiDungSoan = {};
  for (const l of dsLuot) {
    const kq = await soanMotLuot(l.ma, ctx, nd, adapter);
    if (kq) (nd as Record<string, unknown>)[l.ma] = kq.duLieu;
  }
  const sach = docFileDaXuat(xuatWord(mau, pt, pt.thongTin, lc, kh, false, nd));
  const danhDau = docFileDaXuat(xuatWord(mau, pt, pt.thongTin, lc, kh, true, nd));
  // Đoạn bổ sung (tô nền) theo thứ tự trong bản đánh dấu.
  const doanXml = danhDau.xml.match(/<w:p[ >][\s\S]*?<\/w:p>/g) ?? [];
  const doan = doanXml.map((p) => ({ chu: chuan((p.match(/<w:t[^>]*>([^<]*)<\/w:t>/g) ?? []).map((t) => t.replace(/<[^>]+>/g, "")).join("")), boSung: p.includes('w:fill="DEEAF6"') }));
  // Đoạn gốc phải còn nguyên văn: trừ dòng năng lực gốc đã được thay (không cộng dồn với mục tiêu mới).
  const giu = doanCanGiu(pt, pt.thongTin, lc, kh, nd);
  return { pt, lc, kh, nd, dsLuot, giu, chu: sach.doanChu.map(chuan), tat: chuan(sach.doanChu.join("\n")), doan };
}

/** Mọi đoạn của GV có mặt và đúng thứ tự gốc. */
function giuDungThuTu(pt: PhanTichGiaoAn, chu: string[]) {
  // So theo chữ, bỏ qua chỗ xuống dòng (phương án, đáp án, bước được tách đoạn khi trình bày).
  const tat = chuan(chu.join(" "));
  let tu = 0;
  // Đoạn có công thức (thành công thức Word) và bảng (kiểm từng ô ở kiemTraGiuNguyen) không so theo chữ thô.
  for (const d of pt.doan.filter((x) => x.loai !== "TD" && chuan(x.vanBan).length > 12 && !x.vanBan.includes("$") && !/^\s*<table/i.test(x.html))) {
    const cau = chuan(x(d.vanBan)).slice(0, 40);
    const vt = tat.indexOf(cau, tu);
    expect(vt, `đoạn ${d.ma} “${cau}” mất hoặc sai thứ tự`).toBeGreaterThanOrEqual(0);
    tu = vt;
  }
  function x(s: string) { return s.replace(/^\s*[-+•–]\s+/, ""); }
}

/** Vị trí (chỉ số đoạn) của hoạt động GV trong bản xuất: từ đoạn đầu của hoạt động đến trước hoạt động kế tiếp. */
function khoangHoatDong(pt: PhanTichGiaoAn, doan: { chu: string }[], ma: string): [number, number] {
  const dau = (m: string) => {
    const h = pt.hoatDong.find((x) => x.ma === m)!;
    const d = pt.doan.find((x) => x.ma === h.doan[0])!;
    return doan.findIndex((p) => p.chu.startsWith(chuan(d.vanBan).slice(0, 30)));
  };
  const i = pt.hoatDong.findIndex((h) => h.ma === ma);
  const sau = pt.hoatDong[i + 1];
  return [dau(ma), sau ? dau(sau.ma) : doan.findIndex((p, k) => k > dau(ma) && /PHỤ LỤC|MA TRẬN/.test(p.chu))];
}

const dem = (tat: string, s: string) => tat.split(s).length - 1;

describe.each(FILE)("chỉ tiếng Anh – %s", (file) => {
  it("dịch: giữ nguyên toàn bộ KHBD gốc, chỉ có bản dịch đúng một hoạt động ở phụ lục", async () => {
    const r = await chay(file, { tiengAnh: true, cachTiengAnh: "dich" });
    expect(r.lc.chuyenKhung).toBe(false);
    expect(r.lc.hoatDongTiengAnh).toBe(r.pt.hoatDong.find((h) => h.loai === "van_dung")?.ma ?? r.pt.hoatDong[r.pt.hoatDong.length - 1].ma);
    expect(r.dsLuot.map((l) => l.ma)).toEqual(["tieng_anh"]);
    giuDungThuTu(r.pt, r.chu);
    expect(kiemTraGiuNguyen(r.giu, r.chu)).toEqual([]);
    const phuLuc = r.doan.findIndex((p) => p.chu.includes("PHỤ LỤC TIẾNG ANH"));
    expect(phuLuc).toBeGreaterThan(0);
    // Trước phụ lục không có đoạn bổ sung nào: mục tiêu, nội dung, các hoạt động giữ nguyên.
    expect(r.doan.slice(0, phuLuc).filter((p) => p.boSung).map((p) => p.chu)).toEqual([]);
    for (const bo of ["GIAI ĐOẠN", "Tích hợp CLIL", "Tiếng Anh (CLIL)", TEN_HD.HD1]) expect(r.tat).not.toContain(bo);
    expect(dem(r.tat, "PHỤ LỤC TIẾNG ANH")).toBe(1);
  });

  it("CLIL: chỉ hoạt động được chọn có thêm key words, nhiệm vụ tiếng Anh; không dịch, không sửa mục tiêu", async () => {
    const r = await chay(file, { tiengAnh: true, cachTiengAnh: "clil" });
    expect(r.dsLuot.map((l) => l.ma)).toEqual(["clil"]);
    giuDungThuTu(r.pt, r.chu);
    expect(kiemTraGiuNguyen(r.giu, r.chu)).toEqual([]);
    expect(dem(r.tat, "Tiếng Anh (CLIL):")).toBe(1);
    expect(r.tat).not.toContain("PHỤ LỤC TIẾNG ANH");
    expect(r.tat).not.toContain("Tích hợp CLIL:");
    const [tu, den] = khoangHoatDong(r.pt, r.doan, r.lc.hoatDongTiengAnh!);
    const boSung = r.doan.map((p, i) => ({ ...p, i })).filter((p) => p.boSung);
    expect(boSung.length).toBeGreaterThan(0);
    for (const p of boSung) expect(p.i > tu && (den < 0 || p.i < den), `đoạn bổ sung “${p.chu}” nằm ngoài hoạt động được chọn`).toBe(true);
  });
});

describe.each(FILE)("chỉ năng lực số – %s", (file) => {
  it("giữ bố cục gốc; mỗi mã một lần ở mục tiêu và một lần trong hoạt động có sẵn, có công cụ và minh chứng", async () => {
    const r = await chay(file, { nls: true, maNls: ["1.1.5.2", "3.1.5.1"] });
    expect(r.lc.chuyenKhung).toBe(false);
    giuDungThuTu(r.pt, r.chu);
    expect(kiemTraGiuNguyen(r.giu, r.chu)).toEqual([]);
    for (const ma of ["1.1.5.2", "3.1.5.1"]) {
      // Một lần ở mục tiêu (ma trận ở phụ lục nhắc lại mã là đúng khung).
      const truocMaTran = r.tat.split("MA TRẬN TÍCH HỢP")[0];
      expect(dem(truocMaTran, `${ma}: ${chiBao.find((c) => c.ma === ma)!.noiDung}`), ma).toBe(1);
      expect(dem(r.tat, `làm minh chứng cho mã ${ma}`), ma).toBe(1);
    }
    expect(r.tat).toMatch(/Mỗi HS dùng .+ để .+ làm minh chứng cho mã 1\.1\.5\.2 \(khoảng 5 phút; /);
    // Không tạo hoạt động mới, không chuyển khung.
    for (const bo of ["GIAI ĐOẠN", TEN_HD.HD1, TEN_HD.HD3]) expect(r.tat).not.toContain(bo);
  });

  it("mã không có hoạt động thực tế tương ứng thì không đưa vào KHBD", async () => {
    const r = await chay(file, { nls: true, maNls: ["1.1.5.2", "3.4.5.1"] }, (ctx) => {
      const goc = taoMauGiaLap(ctx);
      return adapterGiaLap((luot) => {
        const d = goc(luot) as { nls: { ma: string }[] };
        return luot === "nls" ? { nls: d.nls.filter((n) => n.ma !== "3.4.5.1"), boQua: [{ ma: "3.4.5.1", lyDo: "Bài không có nhiệm vụ lập trình." }] } : d;
      }, { min: 0, max: 0 });
    });
    expect(r.tat).toContain("1.1.5.2:");
    expect(r.tat).not.toContain("3.4.5.1");
  });
});

describe.each(FILE)("chỉ năng lực AI – %s", (file) => {
  it("giữ bố cục gốc; quy trình dùng AI có kiểm chứng đặt một lần trong hoạt động vận dụng", async () => {
    const r = await chay(file, { ai: true, maAi: ["NLa", "NLc", "NLd"] });
    giuDungThuTu(r.pt, r.chu);
    expect(kiemTraGiuNguyen(r.giu, r.chu)).toEqual([]);
    expect(dem(r.tat, "Quy trình sử dụng AI có kiểm chứng")).toBe(1);
    const hd = r.pt.hoatDong.find((h) => h.loai === "van_dung") ?? r.pt.hoatDong[r.pt.hoatDong.length - 1];
    const [tu, den] = khoangHoatDong(r.pt, r.doan, hd.ma);
    const i = r.doan.findIndex((p) => p.chu === "Quy trình sử dụng AI có kiểm chứng");
    expect(i > tu && (den < 0 || i < den)).toBe(true);
  });
});

describe.each(FILE)("LHĐN – %s", (file) => {
  it("chuyển 3 giai đoạn; giữ yêu cầu cần đạt; mỗi hoạt động có mục tiêu, tổ chức/nội dung, sản phẩm; tổng thời lượng không đổi", async () => {
    const r = await chay(file, { lhdn: true });
    expect(r.lc.chuyenKhung).toBe(true);
    for (const gd of ["GIAI ĐOẠN 1: TỰ HỌC Ở NHÀ TRƯỚC TIẾT HỌC", "GIAI ĐOẠN 2: HOẠT ĐỘNG TRÊN LỚP", "GIAI ĐOẠN 3: KIỂM SOÁT, ĐÁNH GIÁ VÀ ĐIỀU CHỈNH SAU GIỜ HỌC"]) {
      expect(dem(r.tat, gd), gd).toBe(1);
    }
    for (const d of r.pt.doan.filter((x) => x.loai === "MT" && x.nhomMucTieu === "I.1" && !x.vanBan.includes("$"))) expect(r.tat).toContain(chuan(d.vanBan.replace(/^\s*[-+•–]\s+/, "")));
    expect(kiemTraGiuNguyen(r.giu, r.chu)).toEqual([]);
    const soTiet = r.pt.thongTin.soTiet ?? 1;
    expect(r.kh.thoiLuong!.length).toBe(soTiet);
    for (const t of r.kh.thoiLuong!) expect(t.muc.reduce((s, m) => s + m.phut, 0), `tiết ${t.tiet}`).toBe(45);
    // Mỗi hoạt động trên lớp: mục tiêu + tổ chức (hoặc exit ticket) + sản phẩm.
    const viTri = Object.values(TEN_HD).map((ten) => r.chu.findIndex((c) => c.startsWith(ten)));
    expect(viTri.every((v) => v > 0)).toBe(true);
    viTri.forEach((v, i) => {
      const khoi = r.chu.slice(v, viTri[i + 1] ?? r.chu.findIndex((c) => c.startsWith("GIAI ĐOẠN 3"))).join("\n");
      expect(khoi, Object.values(TEN_HD)[i]).toContain("Mục tiêu:");
      expect(khoi, Object.values(TEN_HD)[i]).toMatch(/Tổ chức:|Exit ticket:/);
      expect(khoi, Object.values(TEN_HD)[i]).toContain("Sản phẩm – đánh giá:");
    });
    const gd1 = r.chu.slice(r.chu.findIndex((c) => c.startsWith("GIAI ĐOẠN 1")), r.chu.findIndex((c) => c.startsWith("GIAI ĐOẠN 2"))).join("\n");
    for (const s of ["Mục tiêu:", "Nhiệm vụ của học sinh:", "Sản phẩm – đánh giá:"]) expect(gd1).toContain(s);
  });
});

describe.each(FILE)("nhiều chức năng – %s", (file) => {
  it("LHĐN + năng lực số + AI + tiếng Anh: chuyển khung trước, tích hợp sau; không lặp; thời lượng giữ nguyên", async () => {
    const r = await chay(file, { lhdn: true, nls: true, maNls: ["1.1.5.2"], ai: true, maAi: ["NLa", "NLc", "NLd"], tiengAnh: true, cachTiengAnh: "ca_hai" });
    const thuTu = r.dsLuot.map((l) => l.ma);
    const sauCung = (a: string, b: string) => expect(thuTu.indexOf(a), `${a} trước ${b}`).toBeLessThan(thuTu.indexOf(b));
    for (const cauTruc of ["gd1", "hd1", "hd2", "hd3", "hd4"]) for (const tichHop of ["nls", "ai", "clil", "tieng_anh"]) sauCung(cauTruc, tichHop);
    sauCung("clil", "tieng_anh");
    expect(new Set(thuTu).size).toBe(thuTu.length);
    expect(kiemTraGiuNguyen(r.giu, r.chu)).toEqual([]);
    expect(dem(r.tat, "Quy trình sử dụng AI có kiểm chứng")).toBe(1);
    expect(dem(r.tat, "Tiếng Anh (CLIL):")).toBe(1);
    expect(dem(r.tat, "PHỤ LỤC TIẾNG ANH")).toBe(1);
    expect(dem(r.tat, "làm minh chứng cho mã 1.1.5.2")).toBe(1);
    for (const ten of Object.values(TEN_HD)) expect(r.chu.filter((c) => c.startsWith(ten)).length, ten).toBeGreaterThanOrEqual(1);
    for (const t of r.kh.thoiLuong!) expect(t.muc.reduce((s, m) => s + m.phut, 0)).toBe(45);
    // CLIL nằm trong HĐ III (hoạt động được chọn).
    const i3 = r.chu.findIndex((c) => c.startsWith(TEN_HD.HD3));
    const i4 = r.chu.findIndex((c) => c.startsWith(TEN_HD.HD4));
    const iClil = r.chu.findIndex((c) => c === "Tiếng Anh (CLIL):");
    expect(iClil > i3 && iClil < i4).toBe(true);
  });

  it("năng lực số + AI + tiếng Anh (không LHĐN): giữ bố cục gốc, mỗi phần tích hợp đúng một lần", async () => {
    const r = await chay(file, { nls: true, maNls: ["1.1.5.2"], ai: true, maAi: ["NLa"], tiengAnh: true, cachTiengAnh: "ca_hai" });
    expect(r.lc.chuyenKhung).toBe(false);
    giuDungThuTu(r.pt, r.chu);
    expect(kiemTraGiuNguyen(r.giu, r.chu)).toEqual([]);
    expect(r.tat).not.toContain("GIAI ĐOẠN");
    expect(dem(r.tat, "Quy trình sử dụng AI có kiểm chứng")).toBe(1);
    expect(dem(r.tat, "Tiếng Anh (CLIL):")).toBe(1);
    expect(dem(r.tat, "làm minh chứng cho mã 1.1.5.2")).toBe(1);
    expect(r.kh.thoiLuong).toBeNull();
  });
});
