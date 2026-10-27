/**
 * Mục tiêu năng lực: phân nhóm (chung, đặc thù, số, AI, CLIL), năng lực đặc thù đúng môn, năng lực số đúng dữ liệu và
 * hành vi, chuỗi liên kết mục tiêu → hoạt động → hành vi → sản phẩm → tiêu chí. Chạy với Tin học 10 và Toán 10.
 */
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { docFile } from "@khbd/lib/pipeline/1-tai-len";
import { phanTichGiaoAn } from "@khbd/lib/pipeline/3-ke-hoach/tach-doan";
import { lapKeHoach } from "@khbd/lib/pipeline/3-ke-hoach";
import { LUA_CHON_TRONG, chonTiengAnhTheoGoiY, type LuaChon } from "@khbd/lib/pipeline/2-lua-chon/lua-chon";
import { lapDanhSachLuot } from "@khbd/lib/pipeline/4-sinh-noi-dung/luot";
import { nguCanhTu, schemaDacThu, taoYeuCau, type NoiDungSoan } from "@khbd/lib/pipeline/4-sinh-noi-dung/dinh-nghia";
import { soanMotLuot } from "@khbd/lib/pipeline/4-sinh-noi-dung/soan";
import { adapterGiaLap, kiemTraKhuon, LoiLlm } from "@khbd/lib/llm";
import { taoMauGiaLap } from "@khbd/lib/llm/mau-gia-lap";
import { locChiBao, TRINH_DO_THPT } from "@khbd/lib/data/nls";
import { nangLucDacThu } from "@khbd/lib/data/nang-luc-dac-thu";
import { xuatWord } from "@khbd/lib/pipeline/6-xuat-file/xuat";
import { docFileDaXuat } from "@khbd/lib/pipeline/5-kiem-tra/kiem-tra-file";
import { kiemTraDacThu, kiemTraNls, kiemTraNoiDungSoan } from "@khbd/lib/pipeline/5-kiem-tra/kiem-tra-noi-dung";
import { dungHanhViNls, lienKetNangLuc } from "@khbd/lib/pipeline/5-kiem-tra/lien-ket-nang-luc";

const mau = fs.readFileSync(path.join(process.cwd(), "templates/mau.docx"));
const chiBao = locChiBao({ trinhDo: TRINH_DO_THPT }).map((c) => ({ ma: c.ma, noiDung: c.noiDung }));
const chuan = (s: string) => s.replace(/\s+/g, " ").trim();
const TIN = "tin10_bien_va_lenh_gan.docx";
const TOAN = "toan10_bat_phuong_trinh_bac_hai.docx";

async function chay(file: string, chon: Partial<LuaChon>, sua?: (nd: NoiDungSoan) => void) {
  const kq = await docFile(file, fs.readFileSync(path.join(process.cwd(), "samples/input", file)));
  const pt = phanTichGiaoAn(kq.html, file);
  const lc = chonTiengAnhTheoGoiY({ ...LUA_CHON_TRONG, ...chon }, pt);
  const kh = lapKeHoach(pt, pt.thongTin, lc);
  const ctx = nguCanhTu(pt, pt.thongTin, lc, kh, chiBao);
  const adapter = adapterGiaLap(taoMauGiaLap(ctx), { min: 0, max: 0 });
  const nd: NoiDungSoan = {};
  for (const l of lapDanhSachLuot(kh, lc)) {
    const r = await soanMotLuot(l.ma, ctx, nd, adapter);
    if (r) (nd as Record<string, unknown>)[l.ma] = r.duLieu;
  }
  sua?.(nd);
  const chu = docFileDaXuat(xuatWord(mau, pt, pt.thongTin, lc, kh, false, nd)).doanChu.map(chuan);
  const i2 = chu.slice(chu.indexOf("2. Năng lực"), chu.indexOf("3. Phẩm chất"));
  return { pt, lc, kh, ctx, nd, chu, i2, tat: chu.join("\n") };
}

/** Khối dòng của một nhóm trong mục I.2: từ tiêu đề nhóm đến tiêu đề nhóm kế tiếp. */
function khoi(i2: string[], dau: RegExp) {
  const tieuDe = i2.map((c, i) => (/^(Năng lực chung|Năng lực đặc thù|Năng lực số|Năng lực AI|Tích hợp CLIL)/.test(c) ? i : -1)).filter((i) => i >= 0);
  const i = i2.findIndex((c) => dau.test(c));
  if (i < 0) return [];
  const sau = tieuDe.find((x) => x > i) ?? i2.length;
  return i2.slice(i, sau);
}

describe.each([
  { file: TIN, mon: "TIN_HOC", maNls: "3.4.5.1", laTin: true },
  { file: TOAN, mon: "TOAN", maNls: "5.2.5.2", laTin: false },
])("mục tiêu năng lực – $mon", ({ file, mon, maNls, laTin }) => {
  const chon = { lhdn: true, nls: true, maNls: [maNls], ai: true, maAi: ["NLa", "NLc", "NLd"], tiengAnh: true, cachTiengAnh: "clil" as const };

  it("phân nhóm đúng thứ tự: chung → đặc thù → số → AI → CLIL; mỗi mã một lần, không lặp biểu hiện", async () => {
    const r = await chay(file, chon);
    const vt = ["Năng lực chung:", "Năng lực đặc thù môn", "Năng lực số:", "Năng lực AI:", "Tích hợp CLIL:"].map((s) => r.i2.findIndex((c) => c.startsWith(s)));
    expect(vt.every((v) => v > 0), vt.join(",")).toBe(true);
    expect([...vt].sort((a, b) => a - b)).toEqual(vt);
    expect(r.i2.filter((c) => c.startsWith(`${maNls}:`)).length).toBe(1);
    for (const ma of ["NLa", "NLc", "NLd"]) expect(r.i2.filter((c) => c.startsWith(laTin ? `NL AI – ${ma}:` : `${ma}:`)).length, ma).toBe(1);
    expect(r.i2.join("\n")).not.toMatch(/\.\./);
    const dong = r.i2.filter((c) => c.length > 30);
    expect(new Set(dong).size).toBe(dong.length);
  });

  it("năng lực đặc thù chỉ dùng mã của đúng môn; biểu hiện là hành động, có tiêu chí đặt ở hoạt động thể hiện", async () => {
    const r = await chay(file, chon);
    const maMon = nangLucDacThu.mon.find((m) => m.ma_mon === mon)!.nang_luc.flatMap((nl) => [nl.ma, ...nl.thanh_phan.map((t) => t.ma)]);
    const khac = nangLucDacThu.mon.find((m) => m.ma_mon !== mon)!.nang_luc[0];
    const maKhac = khac.thanh_phan[0]?.ma ?? khac.ma;
    const dong = { yeuCau: [r.pt.doan.find((d) => d.nhomMucTieu === "I.1")!.ma], bieuHien: "x", viTri: r.kh.oViTri[0].ma, sanPham: "s", tieuChi: "t" };
    expect(() => kiemTraKhuon(schemaDacThu(r.ctx), { thanhPhan: [{ ma: maKhac, ...dong }] })).toThrow(LoiLlm);
    expect(kiemTraKhuon(schemaDacThu(r.ctx), { thanhPhan: [{ ma: maMon[1] ?? maMon[0], ...dong }] })).toBeTruthy();
    for (const t of r.nd.dac_thu!.thanhPhan) {
      expect(maMon).toContain(t.ma);
      expect(r.tat).toMatch(new RegExp(`Tiêu chí [^:]*${laTin ? `\\(NL tin học – ${t.ma.split(".").pop()}\\)` : ""}: Đạt khi`));
    }
    if (laTin) expect(r.i2.some((c) => /\(NL tin học – NL[a-e]\): Học sinh/.test(c))).toBe(true);
    else expect(r.tat).not.toContain("NL tin học");
    expect(taoYeuCau("dac_thu", r.ctx, {})!.noiDung).toContain("không dùng mã của khung năng lực khác");
  });

  it("năng lực số: một hoạt động, công cụ, minh chứng, tiêu chí; mã ngoài dữ liệu không được suy đoán", async () => {
    const r = await chay(file, chon);
    expect(r.tat.split(`làm minh chứng cho mã ${maNls}`).length - 1).toBe(1);
    expect(r.tat).toContain(`Tiêu chí ${maNls}:`);
    const la = await chay(file, { ...chon, maNls: ["9.9.5.9"] });
    expect(taoYeuCau("nls", la.ctx, {})).toBeNull();
    expect(la.tat).not.toContain("9.9.5.9");
    expect(la.i2.some((c) => c.startsWith("Năng lực số:"))).toBe(false);
  });

  it("thiếu mắt xích thì bỏ năng lực khỏi KHBD và cảnh báo, không gắn nhãn hình thức", async () => {
    const r = await chay(file, chon, (nd) => {
      nd.dac_thu!.thanhPhan[0] = { ...nd.dac_thu!.thanhPhan[0], tieuChi: "" };
      nd.nls!.nls[0] = { ...nd.nls!.nls[0], minhChung: "" };
    });
    const bo = r.nd.dac_thu!.thanhPhan[0];
    const ten = nangLucDacThu.mon.find((m) => m.ma_mon === mon)!.nang_luc.flatMap((nl) => nl.thanh_phan).find((t) => t.ma === bo.ma)!.ten;
    expect(r.i2.some((c) => c.toLowerCase().includes(ten.toLowerCase()) && c.includes(bo.bieuHien.slice(0, 20)))).toBe(false);
    expect(r.tat).not.toContain(`${maNls}:`);
    const canhBao = kiemTraNoiDungSoan(r.nd, r.ctx).filter((l) => l.loai === "lien_ket" && /đã bỏ khỏi KHBD/.test(l.noiDung)).map((l) => l.noiDung);
    expect(canhBao).toEqual(expect.arrayContaining([expect.stringContaining(`Năng lực đặc thù ${bo.ma}: thiếu tiêu chí đánh giá`), expect.stringContaining(`Năng lực số ${maNls}: thiếu sản phẩm`)]));
    const lk = lienKetNangLuc(r.nd, r.lc, r.pt.thongTin.mon, r.kh.oViTri.map((o) => o.ma), (m) => chiBao.find((c) => c.ma === m)?.noiDung, true);
    expect(lk.filter((l) => l.thieu.length).map((l) => l.ma).sort()).toEqual([bo.ma, maNls].sort());
  });
});

describe("Tin học 10 – không cộng dồn năng lực của KHBD gốc với mục tiêu theo cấu trúc mới", () => {
  it("LHĐN: mục I.2 lấy theo cấu trúc mới (chung theo khung, đặc thù app soạn); dòng năng lực gốc không ghép thêm", async () => {
    const r = await chay(TIN, { lhdn: true });
    const tatI2 = r.i2.join("\n");
    for (const goc of ["Tự chủ và tự học: tự đọc tài liệu, thử lệnh gán trên máy.", "Giải quyết vấn đề với sự hỗ trợ của CNTT-TT: viết được chương trình Python", "Dùng đúng thuật ngữ tiếng Anh variable"]) expect(tatI2).not.toContain(goc);
    expect(khoi(r.i2, /^Năng lực chung:/).join("\n")).toContain("Tự chủ và tự học trong tìm tòi, khám phá tại nhà;");
    expect(khoi(r.i2, /^Năng lực đặc thù môn Tin học/).some((c) => /\(NL tin học – NL[a-e]\)/.test(c))).toBe(true);
    // Mỗi thành phần đặc thù chỉ một dòng.
    const ten = r.i2.map((c) => c.split(":")[0]).filter((c) => /\(NL tin học – NL[a-e]\)$/.test(c));
    expect(new Set(ten).size).toBe(ten.length);
    expect(r.i2.some((c) => /^Tích hợp CLIL:/.test(c))).toBe(false); // không chọn tiếng Anh
  });

  it("giữ bố cục gốc (chỉ năng lực số): nhóm năng lực số của app thay dòng năng lực số gốc, các dòng khác giữ nguyên", async () => {
    const r = await chay(TIN, { nls: true, maNls: ["3.4.5.1"] });
    const tatI2 = r.i2.join("\n");
    expect(tatI2).toContain("Tự chủ và tự học: tự đọc tài liệu, thử lệnh gán trên máy.");
    expect(tatI2).toContain("Dùng đúng thuật ngữ tiếng Anh variable, assignment, expression khi trình bày.");
    expect(tatI2).toContain("3.4.5.1:");
  });
});

describe("kiểm tra năng lực đặc thù và năng lực số (không phụ thuộc một môn)", () => {
  it.each([TIN, TOAN])("năng lực đặc thù %s: tối đa 3, không lặp, không chép tên, đủ tiêu chí, gắn yêu cầu cần đạt", async (file) => {
    const r = await chay(file, { lhdn: true });
    const tp = nangLucDacThu.mon.find((m) => m.ma_mon === r.pt.thongTin.mon)!.nang_luc.flatMap((nl) => nl.thanh_phan);
    const yc = r.pt.doan.find((d) => d.nhomMucTieu === "I.1")!.ma;
    const tot = (i: number) => ({ ma: tp[i].ma, yeuCau: [yc], bieuHien: `Học sinh thực hiện được nhiệm vụ ${i} của bài với kết quả đúng và giải thích được cách làm của mình trước lớp`, viTri: r.kh.oViTri[1].ma, sanPham: "Phiếu học tập", tieuChi: "Đạt khi làm đúng" });
    const nghiem = (ds: ReturnType<typeof tot>[]) => kiemTraDacThu({ thanhPhan: ds }, r.ctx).filter((l) => l.nghiem).map((l) => l.noiDung);
    expect(nghiem([tot(0), tot(1)])).toEqual([]);
    expect(nghiem([tot(0), tot(1), tot(2), tot(3)]).join(" ")).toContain("chỉ chọn 1–3");
    expect(nghiem([tot(0), tot(0)]).join(" ")).toContain("bị lặp");
    expect(nghiem([{ ...tot(0), tieuChi: "" }]).join(" ")).toContain("thiếu tiêu chí");
    expect(nghiem([{ ...tot(0), yeuCau: [] }]).join(" ")).toContain("yêu cầu cần đạt");
    expect(nghiem([{ ...tot(0), bieuHien: `Học sinh ${tp[0].ten}` }]).join(" ")).toMatch(/chép tên|quá ngắn/);
    expect(nghiem([{ ...tot(0), ma: "MA.LA.1" }]).join(" ")).toContain("không thuộc năng lực đặc thù");
  });

  it("năng lực số: nhiệm vụ phải đúng hành vi của mã; không trùng biểu hiện đặc thù", async () => {
    expect(dungHanhViNls("3.4.5.1", "viết và chạy được chương trình Python tính điểm trung bình ba môn")).toBe(true);
    expect(dungHanhViNls("3.4.5.1", "tìm kiếm thông tin về biến trên Internet và ghi lại nguồn")).toBe(false);
    expect(dungHanhViNls("1.2.5.1", "đối chiếu hai nguồn tư liệu về cuộc kháng chiến, đánh giá độ tin cậy")).toBe(true);
    expect(dungHanhViNls("6.3.5.2", "kiểm chứng câu trả lời của AI bằng SGK")).toBe(true);
    const r = await chay(TIN, { lhdn: true, nls: true, maNls: ["3.4.5.1"] });
    const n = { ma: "3.4.5.1", viTri: r.kh.oViTri[1].ma, congCu: "máy tính đã cài Python", phut: 5, dieuChinh: "rút bước giải theo nhóm còn 10 phút", minhChung: "tệp chương trình", tieuChi: "Đạt khi chạy đúng" };
    const loi = (bieuHien: string, truoc: NoiDungSoan = {}) => kiemTraNls({ nls: [{ ...n, bieuHien }], boQua: [] }, r.ctx, truoc).filter((l) => l.nghiem).map((l) => l.noiDung).join(" ");
    expect(loi("viết và chạy được chương trình Python tính điểm trung bình ba môn")).toBe("");
    expect(loi("tìm kiếm thông tin về khái niệm biến trên Internet và ghi lại nguồn")).toContain("chưa đúng hành vi của mã");
    const trung = "viết và chạy được chương trình Python tính điểm trung bình ba môn của lớp";
    expect(loi(trung, { dac_thu: { thanhPhan: [{ ma: "TIN_HOC.1.NLc", yeuCau: [], bieuHien: `Học sinh ${trung}`, viTri: "", sanPham: "", tieuChi: "" }] } })).toContain("trùng biểu hiện");
  });
});
