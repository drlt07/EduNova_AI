import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { LUA_CHON_TRONG, type LuaChon } from "@khbd/lib/pipeline/2-lua-chon/lua-chon";
import { lapKeHoach } from "@khbd/lib/pipeline/3-ke-hoach";
import { doanCanGiu } from "@khbd/lib/pipeline/6-xuat-file/ghep";
import { lapDanhSachLuot } from "@khbd/lib/pipeline/4-sinh-noi-dung/luot";
import { chaySoan } from "@khbd/lib/pipeline/4-sinh-noi-dung/chay";
import { nguCanhTu, schemaNls, taoYeuCau, taoYeuCauGoiYNls, type NoiDungSoan } from "@khbd/lib/pipeline/4-sinh-noi-dung/dinh-nghia";
import { goiYMaNls, soanMotLuot } from "@khbd/lib/pipeline/4-sinh-noi-dung/soan";
import { adapterGiaLap, kiemTraKhuon, LoiLlm, type AdapterLlm } from "@khbd/lib/llm";
import { layAdapterMayChu } from "@khbd/lib/llm/may-chu";
import { taoMauGiaLap } from "@khbd/lib/llm/mau-gia-lap";
import { docDuLieuNls } from "@khbd/lib/data/nls-csv";
import { docFile } from "@khbd/lib/pipeline/1-tai-len";
import { phanTichGiaoAn } from "@khbd/lib/pipeline/3-ke-hoach/tach-doan";
import { xuatWord } from "@khbd/lib/pipeline/6-xuat-file/xuat";
import { docFileDaXuat, kiemTraFileXuat, NEN_TANG_HAY_GAP } from "@khbd/lib/pipeline/5-kiem-tra/kiem-tra-file";
import { kiemTraNoiDungSoan } from "@khbd/lib/pipeline/5-kiem-tra/kiem-tra-noi-dung";
import type { PhanTichGiaoAn } from "@khbd/lib/pipeline/kieu";

const lc = (x: Partial<LuaChon>): LuaChon => ({ ...LUA_CHON_TRONG, ...x });
const ptGia: PhanTichGiaoAn = { thongTin: { mon: "TOAN", lop: 10, tenBai: "Bài 1", soTiet: 2 }, doan: [], canhBao: [], hoatDong: [] };
const luot = (x: Partial<LuaChon>) => lapDanhSachLuot(lapKeHoach(ptGia, ptGia.thongTin, lc(x)), lc(x)).map((l) => l.ma);

// Dữ liệu năng lực số GIẢ chỉ dùng trong test (data/ chưa có nguyên văn).
const nlsGia = docDuLieuNls({ thanhPhan: "ma\n", trinhDo: "ma\n", chiBao: fs.readFileSync(path.join(process.cwd(), "tests/fixtures/nls_gia.csv"), "utf8") });
const chiBao = nlsGia.chiBao.filter((c) => c.trinhDo === "5").map((c) => ({ ma: c.ma, noiDung: c.noiDung }));

async function chuanBi(file: string, chon: Partial<LuaChon>) {
  const kq = await docFile(file, fs.readFileSync(path.join(process.cwd(), "samples/input", file)));
  const pt = phanTichGiaoAn(kq.html, file);
  const l = lc(chon);
  const kh = lapKeHoach(pt, pt.thongTin, l);
  return { pt, l, kh, ctx: nguCanhTu(pt, pt.thongTin, l, kh, chiBao) };
}

describe("danh sách lượt soạn", () => {
  it("chỉ tích hợp năng lực số: một lượt", () => {
    expect(luot({ nls: true, maNls: ["1.1.5.1"] })).toEqual(["nls"]);
  });
  it("chuyển khung + NLS + AI + tiếng Anh: đủ lượt, dịch sau cùng", () => {
    expect(luot({ chuyenKhung: true, nls: true, maNls: ["1.1.5.1"], ai: true, tiengAnh: true, cachTiengAnh: "dich", hoatDongTiengAnh: "HD3" }))
      .toEqual(["gd1", "hd1", "hd2", "cau_hoi", "hd3", "hd4", "dac_thu", "gd3", "nls", "ai", "kiem_dinh", "tieng_anh"]);
  });
  it("tạo lại hoạt động với phiên tòa giả định: không có bộ câu hỏi, không có AI", () => {
    expect(luot({ taoLaiHoatDong: true, hinhThucHD2: ["Phiên tòa giả định"], hinhThucHD3: ["Đóng vai"] })).toEqual(["hd2", "hd3", "hd4", "dac_thu"]);
  });
});

describe("nội dung gửi cho LLM", () => {
  it("không có khung ngoặc [ ]; có yêu cầu cần đạt, nền tảng đã chọn; không chọn AI thì kèm luật không nhắc AI", async () => {
    const { ctx } = await chuanBi("hoa12_ester.docx", { chuyenKhung: true, nenTang: ["Quizizz"] });
    for (const ma of ["gd1", "hd1", "hd2", "cau_hoi", "hd3", "hd4", "dac_thu"]) {
      const yc = taoYeuCau(ma, ctx, {})!;
      const boGv = yc.noiDung.split("\n").filter((d) => !/^\s+[A-Z]{2}-\d+:/.test(d)).join("\n");
      expect(yc.heThong + boGv, ma).not.toMatch(/\[[^\]]*\]|\.{4,}/);
      expect(yc.noiDung).toContain("MT-01: Nêu được khái niệm, công thức chung của ester.");
      expect(yc.noiDung).toContain("Nền tảng số giáo viên chọn: Quizizz.");
      expect(yc.heThong).toContain("Khi giáo viên KHÔNG chọn tích hợp năng lực AI");
      expect(yc.heThong).not.toContain("# Năng lực AI");
    }
    expect(taoYeuCau("cau_hoi", ctx, {})!.noiDung).toContain("Trắc nghiệm nhiều phương án lựa chọn: 6 câu");
  });

  it("mã năng lực số chỉ chọn trong danh sách; vị trí chỉ chọn trong ô vị trí của bài", async () => {
    const { ctx } = await chuanBi("toan10_bat_phuong_trinh_bac_hai.docx", { chuyenKhung: true, nls: true, maNls: ["1.1.5.1"] });
    const s = schemaNls(ctx, ["1.1.5.1"]);
    expect(() => kiemTraKhuon(s, { nls: [{ ma: "9.9.5.9", viTri: "HD3_T2", bieuHien: "x", congCu: "c", phut: 5, dieuChinh: "d", minhChung: "y", tieuChi: "z" }], boQua: [] })).toThrow(LoiLlm);
    expect(() => kiemTraKhuon(s, { nls: [{ ma: "1.1.5.1", viTri: "HD9_T9", bieuHien: "x", congCu: "c", phut: 5, dieuChinh: "d", minhChung: "y", tieuChi: "z" }], boQua: [] })).toThrow(LoiLlm);
    expect(kiemTraKhuon(s, { nls: [{ ma: "1.1.5.1", viTri: "HD3_T2", bieuHien: "x", congCu: "c", phut: 5, dieuChinh: "d", minhChung: "y", tieuChi: "z" }], boQua: [] })).toBeTruthy();
    expect(taoYeuCau("nls", ctx, {})!.noiDung).toContain("1.1.5.1: DỮ LIỆU GIẢ ĐỂ KIỂM THỬ");
  });

  it("gợi ý mã năng lực số theo bài: chọn trong danh sách NC1", async () => {
    const { ctx } = await chuanBi("lich_su11_chien_tranh_bao_ve_to_quoc.docx", { chuyenKhung: true, nls: true, phuongAn: "A" });
    expect(taoYeuCauGoiYNls(ctx)!.noiDung).toContain("4.2.5.1");
    const g = await goiYMaNls(ctx, adapterGiaLap(taoMauGiaLap(ctx), { min: 0, max: 0 }));
    expect(g!.goiY.every((x) => chiBao.some((c) => c.ma === x.ma))).toBe(true);
    expect(taoYeuCauGoiYNls({ ...ctx, nlsChiBao: [] })).toBeNull();
  });
});

describe("biểu hiện năng lực theo cấu trúc hành động + nội dung + kết quả", () => {
  it("bắt biểu hiện còn chỗ trống, quá ngắn, thiếu kết quả; nhận câu đúng cấu trúc", async () => {
    const { kiemTraBieuHien } = await import("@khbd/lib/pipeline/5-kiem-tra/kiem-tra-noi-dung");
    const dung = "Học sinh nhận diện được các đại lượng và mối quan hệ trong tình huống thực tiễn; biểu diễn được mối quan hệ đó bằng mô hình toán học phù hợp và sử dụng mô hình để giải quyết vấn đề.";
    expect(kiemTraBieuHien(dung, "dac_thu", "TOAN.1.2")).toEqual([]);
    expect(kiemTraBieuHien("Mô hình hóa toán học: chuyển tình huống [...] thành [hàm số/phương trình] và giải (HĐ III).", "dac_thu", "x").length).toBeGreaterThan(0);
    expect(kiemTraBieuHien("Học sinh giải bài toán.", "dac_thu", "x").map((l) => l.noiDung)).toEqual(expect.arrayContaining([expect.stringContaining("quá ngắn")]));
    expect(kiemTraBieuHien("HS tìm kiếm được thông tin về sự kiện trên Internet", "nls", "1.1.5.1").map((l) => l.noiDung)).toEqual([expect.stringContaining("bỏ chữ")]);
  });

  it("lượt năng lực đặc thù gửi kèm luật biểu hiện và ví dụ cách ghi của môn", async () => {
    const { ctx } = await chuanBi("toan10_bat_phuong_trinh_bac_hai.docx", { chuyenKhung: true });
    const yc = taoYeuCau("dac_thu", ctx, {})!;
    expect(yc.heThong).toContain("Hành động quan sát được + Nội dung kiến thức/kĩ năng + Kết quả cần đạt.");
    expect(yc.noiDung).toContain("Ví dụ cách ghi của môn (thành phần mô hình hóa toán học): Học sinh nhận diện được các đại lượng");
  });

  it("biểu hiện sai cấu trúc thì soạn lại", async () => {
    const { ctx } = await chuanBi("toan10_bat_phuong_trinh_bac_hai.docx", { chuyenKhung: true });
    const mau = taoMauGiaLap(ctx);
    let lan = 0;
    const adapter: AdapterLlm = { ten: "thu", giaLap: true, async goi(yc) {
      const d = mau(yc.luot) as { thanhPhan: { bieuHien: string }[] };
      return lan++ === 0 ? { thanhPhan: d.thanhPhan.map((t) => ({ ...t, bieuHien: "Chuyển tình huống thành phương trình" })) } : d;
    } };
    expect((await soanMotLuot("dac_thu", ctx, {}, adapter))!.soLanSoanLai).toBe(1);
  });
});

describe("soạn lại khi có lỗi", () => {
  it("lượt câu hỏi sai ma trận được soạn lại kèm danh sách lỗi, tối đa 2 lần", async () => {
    const { ctx } = await chuanBi("hoa12_ester.docx", { chuyenKhung: true });
    const mau = taoMauGiaLap(ctx);
    const nhan: string[] = [];
    let lan = 0;
    const adapter: AdapterLlm = {
      ten: "thu", giaLap: true,
      async goi(yc) {
        nhan.push(yc.noiDung);
        const d = mau(yc.luot) as { nhieuLuaChon: unknown[] };
        return lan++ === 0 ? { ...d, nhieuLuaChon: d.nhieuLuaChon.slice(0, 2) } : d;
      },
    };
    const kq = await soanMotLuot("cau_hoi", ctx, {}, adapter);
    expect(kq!.soLanSoanLai).toBe(1);
    expect(nhan[1]).toContain("LẦN SOẠN TRƯỚC CÒN LỖI");
    expect(nhan[1]).toContain("có 2 câu, ma trận cần 6 câu");
  });
});

describe("chạy soạn từng lượt", () => {
  it("báo trạng thái từng lượt; lượt lỗi không chặn lượt sau", async () => {
    const nhat: string[] = [];
    const ds = [{ ma: "a", ten: "A", moTa: "" }, { ma: "b", ten: "B", moTa: "" }, { ma: "c", ten: "C", moTa: "" }];
    await chaySoan(ds, async (l) => { if (l.ma === "b") throw new Error("hỏng"); return {}; }, (ma, tt, loi) => nhat.push(`${ma}:${tt}${loi ? `:${loi}` : ""}`), new AbortController().signal);
    expect(nhat).toEqual(["a:dang", "a:xong", "b:dang", "b:loi:hỏng", "c:dang", "c:xong"]);
  });
  it("máy chủ mặc định giả lập; anthropic cần khóa", async () => {
    const { ctx } = await chuanBi("hoa12_ester.docx", { chuyenKhung: true });
    expect(layAdapterMayChu(ctx, {}).giaLap).toBe(true);
    expect(() => layAdapterMayChu(ctx, { LLM_PROVIDER: "anthropic" })).toThrow(/LLM_API_KEY/);
    expect(layAdapterMayChu(ctx, { LLM_PROVIDER: "anthropic", LLM_API_KEY: "khoa-gia" }).giaLap).toBe(false);
  });
});

describe("ghép nội dung đã soạn vào file Word", async () => {
  const { pt, l, kh, ctx } = await chuanBi("toan10_bat_phuong_trinh_bac_hai.docx", {
    chuyenKhung: true, nls: true, maNls: ["1.1.5.1"], ai: true, maAi: ["NLa", "NLc", "NLd"], tiengAnh: true, hoatDongTiengAnh: "HD3", cachTiengAnh: "ca_hai", nenTang: ["Quizizz"],
  });
  const adapter = adapterGiaLap(taoMauGiaLap(ctx), { min: 0, max: 0 });
  const nd: NoiDungSoan = {};
  for (const ma of lapDanhSachLuot(kh, l).map((x) => x.ma)) {
    const kq = await soanMotLuot(ma, ctx, nd, adapter);
    if (kq) (nd as Record<string, unknown>)[ma] = kq.duLieu;
  }
  const mau = fs.readFileSync(path.join(process.cwd(), "templates/mau.docx"));
  const tra = (ma: string) => chiBao.find((c) => c.ma === ma)?.noiDung;
  const sach = xuatWord(mau, pt, pt.thongTin, l, kh, false, nd, tra);
  const chu = docFileDaXuat(sach).doanChu;
  const tat = chu.join("\n");

  it("mục I.2 đúng thứ tự khung: chung → đặc thù → số → AI → CLIL; tiêu đề cấp 1, từng dòng cấp 2", () => {
    const i2 = chu.slice(chu.indexOf("2. Năng lực"), chu.indexOf("3. Phẩm chất"));
    const vt = (s: string) => i2.findIndex((d) => d.startsWith(s));
    const thuTu = ["Năng lực chung:", "Năng lực đặc thù môn Toán", "Năng lực số:", "Năng lực AI:", "Tích hợp CLIL:"].map(vt);
    expect(thuTu.every((v) => v > 0)).toBe(true);
    expect([...thuTu].sort((a, b) => a - b)).toEqual(thuTu);
    expect(i2[vt("Năng lực chung:") + 1]).toBe("Tự chủ và tự học trong tìm tòi, khám phá tại nhà;");
    expect(sach).toBeTruthy();
  });

  it("năng lực số khớp ở mục I.2, hoạt động tương ứng và ma trận mục V", () => {
    // Mục tiêu: mã, nguyên văn, biểu hiện, vị trí. Minh chứng chỉ ở hoạt động và ma trận (không lặp ở mục tiêu).
    expect(tat).toContain("1.1.5.1: DỮ LIỆU GIẢ ĐỂ KIỂM THỬ: tìm kiếm thông tin trên môi trường số bằng từ khóa phù hợp. Biểu hiện trong bài: HS tìm kiếm và đối chiếu được thông tin của bài trên môi trường số (giả lập) (HĐ III – tiết 2).");
    expect(tat).toContain("làm minh chứng cho mã 1.1.5.1");
    expect(tat).toContain("Tiêu chí 1.1.5.1:");
    expect(chu.filter((d) => d === "HĐ III – tiết 2").length).toBeGreaterThanOrEqual(1);
  });

  it("có năng lực đặc thù chép tên từ dữ liệu, câu hỏi kèm đáp án, exit ticket, bản tiếng Anh", () => {
    expect(tat).toContain("Năng lực đặc thù môn Toán – Năng lực toán học:");
    // Cấu trúc mới là chuẩn: dòng đặc thù do app soạn; dòng năng lực của KHBD gốc không cộng dồn vào.
    expect(tat).toContain("Tư duy và lập luận toán học: Học sinh nhận diện được");
    expect(tat).not.toContain("Tư duy và lập luận toán học: xét dấu tam thức bậc hai để tìm tập nghiệm.");
    expect(tat).toContain("CÂU HỎI LUYỆN TẬP");
    expect(tat).toContain("Đáp án và mức độ:");
    expect(tat).toContain("Câu exit ticket 1 (giả lập)?");
    const vi = chu.indexOf("VI. PHỤ LỤC TIẾNG ANH (ENGLISH APPENDIX)");
    expect(chu[vi + 1]).toBe("Activity III. Real-world application (simulated)");
    for (const bo of ["Bảng thuật ngữ dùng thống nhất", "Bản tiếng Anh của hoạt động được chọn:", "Hoạt động được chọn:", "Lesson plan"]) expect(tat).not.toContain(bo);
    expect(tat).toContain("câu lệnh mẫu: “Hãy gợi ý các điểm cần kiểm tra (giả lập), không viết câu trả lời hoàn chỉnh.”");
  });

  it("qua bộ kiểm tra file và kiểm tra nội dung, vẫn giữ 100% nội dung của thầy/cô", () => {
    const k = kiemTraFileXuat(sach, doanCanGiu(pt, pt.thongTin, l, kh, nd, tra), { coAi: true, nenTangChon: ["Quizizz"], nenTangGoiY: NEN_TANG_HAY_GAP });
    expect(k.loi.filter((x) => x.nghiem)).toEqual([]);
    expect(k.tiLeGiuNguyen).toBe(100);
    expect(kiemTraNoiDungSoan(nd, ctx).filter((x) => x.nghiem)).toEqual([]);
  });
});
