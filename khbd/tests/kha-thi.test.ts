/**
 * Thiết kế hoạt động và kiểm tra tính khả thi trước khi xuất KHBD: bước cụ thể, đủ thời gian,
 * thiết bị có sẵn, có sản phẩm và cách đánh giá, năng lực số có hành vi số thật.
 */
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { docFile } from "@khbd/lib/pipeline/1-tai-len";
import { phanTichGiaoAn } from "@khbd/lib/pipeline/3-ke-hoach/tach-doan";
import { lapKeHoach } from "@khbd/lib/pipeline/3-ke-hoach";
import { LUA_CHON_TRONG, chonTiengAnhTheoGoiY, type LuaChon } from "@khbd/lib/pipeline/2-lua-chon/lua-chon";
import { lapDanhSachLuot } from "@khbd/lib/pipeline/4-sinh-noi-dung/luot";
import { nguCanhTu, taoYeuCau, type NoiDungSoan } from "@khbd/lib/pipeline/4-sinh-noi-dung/dinh-nghia";
import { soanMotLuot } from "@khbd/lib/pipeline/4-sinh-noi-dung/soan";
import { adapterGiaLap, type AdapterLlm } from "@khbd/lib/llm";
import { taoMauGiaLap } from "@khbd/lib/llm/mau-gia-lap";
import { locChiBao, TRINH_DO_THPT } from "@khbd/lib/data/nls";
import { xuatWord } from "@khbd/lib/pipeline/6-xuat-file/xuat";
import { docFileDaXuat } from "@khbd/lib/pipeline/5-kiem-tra/kiem-tra-file";
import { kiemTraHoatDong, kiemTraNls, kiemTraNoiDungSoan } from "@khbd/lib/pipeline/5-kiem-tra/kiem-tra-noi-dung";
import { coHanhViSo, kiemTraBuoc, kiemTraLapPhuongPhap, laCauChung, phutHoatDong, thietBiCoSan, thietBiThieu } from "@khbd/lib/pipeline/5-kiem-tra/kha-thi";
import { TEN_HD } from "@khbd/lib/pipeline/6-xuat-file/cau-co-dinh";

const mau = fs.readFileSync(path.join(process.cwd(), "templates/mau.docx"));
const chiBao = locChiBao({ trinhDo: TRINH_DO_THPT }).map((c) => ({ ma: c.ma, noiDung: c.noiDung }));
const TIN = "tin10_bien_va_lenh_gan.docx", TOAN = "toan10_bat_phuong_trinh_bac_hai.docx", SU = "lich_su11_chien_tranh_bao_ve_to_quoc.docx", HOA = "hoa12_ester.docx";

async function chuanBi(file: string, chon: Partial<LuaChon>) {
  const kq = await docFile(file, fs.readFileSync(path.join(process.cwd(), "samples/input", file)));
  const pt = phanTichGiaoAn(kq.html, file);
  const lc = chonTiengAnhTheoGoiY({ ...LUA_CHON_TRONG, ...chon, ...(chon.lhdn && (pt.thongTin.soTiet ?? 1) >= 3 ? { phuongAn: "A" as const } : {}) }, pt);
  const kh = lapKeHoach(pt, pt.thongTin, lc);
  return { pt, lc, kh, ctx: nguCanhTu(pt, pt.thongTin, lc, kh, chiBao) };
}

async function chay(file: string, chon: Partial<LuaChon>) {
  const b = await chuanBi(file, chon);
  const adapter = adapterGiaLap(taoMauGiaLap(b.ctx), { min: 0, max: 0 });
  const nd: NoiDungSoan = {};
  for (const l of lapDanhSachLuot(b.kh, b.lc)) {
    const r = await soanMotLuot(l.ma, b.ctx, nd, adapter);
    if (r) (nd as Record<string, unknown>)[l.ma] = r.duLieu;
  }
  const chu = docFileDaXuat(xuatWord(mau, b.pt, b.pt.thongTin, b.lc, b.kh, false, nd)).doanChu.map((s) => s.replace(/\s+/g, " ").trim());
  return { ...b, nd, chu };
}

/** Các dòng của một HĐ trong bản xuất. */
function khoiHd(chu: string[], ma: "HD1" | "HD2" | "HD3" | "HD4") {
  const ds = ["HD1", "HD2", "HD3", "HD4"] as const;
  const dau = chu.findIndex((c) => c.startsWith(TEN_HD[ma]));
  const sau = ds.slice(ds.indexOf(ma) + 1).map((m) => chu.findIndex((c, i) => i > dau && c.startsWith(TEN_HD[m]))).find((i) => i > 0)
    ?? chu.findIndex((c, i) => i > dau && c.startsWith("GIAI ĐOẠN 3"));
  return chu.slice(dau, sau);
}
const phutCacBuoc = (dong: string[]) => dong.map((c) => c.match(/^Bước \d+ – .*? \((\d+) phút\):/)?.[1]).filter(Boolean).reduce((s, x) => s + Number(x), 0);

describe("nhận diện câu chung chung", () => {
  it("câu kiểu “GV giao nhiệm vụ, HS thảo luận, đại diện trình bày, GV nhận xét” là chung chung; câu có dữ kiện, vai cụ thể thì không", () => {
    for (const s of ["GV giao nhiệm vụ, HS thảo luận, đại diện trình bày, GV nhận xét.", "HS thảo luận nhóm và báo cáo.", "GV đặt câu hỏi, HS trả lời", "GV nhận xét, chốt kiến thức."]) expect(laCauChung(s), s).toBe(true);
    expect(laCauChung("Ba HS đóng vai nhóm trưởng, người phụ trách ảnh và người tư vấn công nghệ tranh luận cách lưu 600 ảnh kỉ yếu vào USB 2 GB")).toBe(false);
    expect(laCauChung("từng cặp tính dung lượng 600 ảnh, so với 2 GB và chọn phương án nén hay chia thư mục")).toBe(false);
  });
});

describe("kiểm tra các bước của hoạt động", () => {
  const b = (ten: string, phut: number, gv = "phát thẻ vai và dữ kiện tình huống lưu 600 ảnh kỉ yếu", hs = "từng cặp tính dung lượng cần dùng và ghi phương án") => ({ ten, phut, gv, hs });
  it("tổng phút phải đúng thời lượng; không quá nhiều bước; việc GV/HS phải cụ thể", () => {
    expect(kiemTraBuoc([b("Diễn tình huống", 3), b("Tính toán", 4)], 7, "HĐ I")).toEqual([]);
    expect(kiemTraBuoc([b("Diễn tình huống", 3), b("Tính toán", 6)], 7, "HĐ I")[0].noiDung).toContain("tổng thời gian các bước là 9 phút");
    expect(kiemTraBuoc([1, 2, 3, 4].map((i) => b(`B${i}`, 2)), 8, "HĐ I").map((l) => l.noiDung).join(" ")).toContain("quá nhiều");
    expect(kiemTraBuoc([b("A", 4, "GV giao nhiệm vụ"), b("B", 3)], 7, "HĐ I").map((l) => l.noiDung).join(" ")).toContain("chung chung");
  });
});

describe("thiết bị phải có trong giáo án", () => {
  it("phát hiện thiết bị thiếu theo từng giáo án; máy tính cầm tay khác máy tính", async () => {
    const su = await chuanBi(SU, { lhdn: true });
    const tin = await chuanBi(TIN, { lhdn: true });
    expect(thietBiThieu("HS dùng điện thoại tra cứu tư liệu", thietBiCoSan(su.ctx))).toEqual(["điện thoại"]);
    expect(thietBiThieu("HS chạy chương trình trên máy tính", thietBiCoSan(tin.ctx))).toEqual([]);
    expect(thietBiThieu("HS bấm máy tính cầm tay", thietBiCoSan(tin.ctx))).toEqual(["máy tính cầm tay"]);
    expect(thietBiThieu("HS ghi vào phiếu học tập, giấy A0", thietBiCoSan(su.ctx))).toEqual([]);
  });

  it("hoạt động cần thiết bị không có thì bị trả lại để soạn lại", async () => {
    const { ctx } = await chuanBi(SU, { lhdn: true });
    const p = phutHoatDong(ctx.keHoach, "HD1");
    const hd1 = {
      maDoanTinhHuong: "", tinhHuong: "", cauHoi: "?", nhanDinh: [], cachToChuc: "Xem video về trận Bạch Đằng", thietBi: ["máy chiếu"],
      buoc: [{ ten: "Xem video", phut: p - 2, gv: "chiếu video 3 phút về trận Bạch Đằng năm 1288", hs: "ghi 3 chi tiết về cách đóng cọc" }, { ten: "Trả lời", phut: 2, gv: "hỏi vì sao quân Nguyên thua trận Bạch Đằng", hs: "nêu 2 nguyên nhân, dẫn chi tiết từ video" }],
    };
    expect(kiemTraHoatDong("hd1", hd1, ctx).filter((l) => l.nghiem).map((l) => l.noiDung).join(" ")).toMatch(/cần (máy chiếu|video)/);
  });
});

describe("năng lực số phải có hành vi số thực tế và khả thi về thời gian", () => {
  it("đóng kịch đơn thuần không đủ làm minh chứng; có công cụ và thao tác số thì đạt", () => {
    expect(coHanhViSo("đóng vai nhóm trưởng thuyết phục cả nhóm cách lưu ảnh", "")).toBe(false);
    expect(coHanhViSo("đóng vai tranh luận cách lưu ảnh kỉ yếu", "giấy nháp")).toBe(false);
    expect(coHanhViSo("tính dung lượng 600 ảnh bằng bảng tính và lưu tệp kết quả", "máy tính")).toBe(true);
  });

  it("thiết bị không có thì phải giao làm ở nhà; có số phút hợp lí và nêu lấy thời gian từ bước nào", async () => {
    const { ctx } = await chuanBi(SU, { lhdn: true, nls: true, maNls: ["1.1.5.2"] });
    const hd3 = ctx.keHoach.oViTri.find((o) => o.ma.startsWith("HD3"))!.ma;
    const n = { ma: "1.1.5.2", viTri: hd3, bieuHien: "tìm kiếm được tư liệu về trận Bạch Đằng năm 1288 bằng từ khóa phù hợp, ghi lại nguồn", congCu: "điện thoại", phut: 5, dieuChinh: "rút bước giải theo nhóm còn 10 phút", minhChung: "tệp ghi chú nguồn", tieuChi: "Đạt khi có 2 nguồn" };
    const loi = (x: Partial<typeof n>) => kiemTraNls({ nls: [{ ...n, ...x }], boQua: [] }, ctx, {}).filter((l) => l.nghiem && l.loai === "kha_thi").map((l) => l.noiDung).join(" ");
    expect(loi({})).toContain("cần điện thoại");
    expect(loi({ congCu: "điện thoại của HS ở nhà" })).toBe("");
    expect(loi({ congCu: "điện thoại của HS ở nhà", phut: 0 })).toContain("không hợp lí");
    expect(loi({ congCu: "điện thoại của HS ở nhà", dieuChinh: "" })).toContain("lấy thời gian");
    expect(loi({ congCu: "điện thoại của HS ở nhà", phut: phutHoatDong(ctx.keHoach, "HD3") })).toMatch(/không hợp lí|chiếm hết/);
  });
});

describe.each([TIN, TOAN, SU, HOA])("hoạt động soạn ra khả thi – %s", (file) => {
  it("không có lỗi khả thi; mỗi HĐ có mục tiêu, cách tổ chức, các bước có phút (tổng đúng thời lượng), sản phẩm, đánh giá; thời lượng tiết không đổi", async () => {
    const r = await chay(file, { lhdn: true, nls: true, maNls: ["1.1.5.2"] });
    const loi = kiemTraNoiDungSoan(r.nd, r.ctx).filter((l) => l.loai === "kha_thi");
    expect(loi.map((l) => l.noiDung)).toEqual([]);
    for (const t of r.kh.thoiLuong!) expect(t.muc.reduce((s, m) => s + m.phut, 0)).toBe(45);
    for (const ma of ["HD1", "HD3"] as const) {
      const k = khoiHd(r.chu, ma);
      expect(k.join("\n"), ma).toMatch(/Mục tiêu:/);
      // "Tổ chức:" và "Cách tổ chức:" là một mục: bước biên tập gộp thành "Tổ chức: <cách tổ chức>".
      expect(k.some((c) => /^Tổ chức: \S/.test(c)), ma).toBe(true);
      expect(k.some((c) => c.startsWith("Cách tổ chức:")), ma).toBe(false);
      expect(phutCacBuoc(k), ma).toBe(phutHoatDong(r.kh, ma));
      expect(k.join("\n"), ma).toContain("Sản phẩm – đánh giá:");
    }
    expect(khoiHd(r.chu, "HD3").some((c) => c.startsWith("Cách đánh giá:"))).toBe(true);
    // Tên bước một dòng, việc của bước xuống dòng riêng.
    expect(khoiHd(r.chu, "HD2").join("\n")).toMatch(/Giao nhiệm vụ \(\d+ phút[^)]*\):\s*\nGV chia lớp theo 3 nhóm mức đạt/);
    expect(r.chu.join("\n")).toMatch(/làm minh chứng cho mã 1\.1\.5\.2 \(khoảng 5 phút; /);
  });
});

describe("yêu cầu gửi AI có đủ bối cảnh để thiết kế hoạt động", () => {
  it("đối tượng, thời lượng, thiết bị có sẵn, luật thiết kế và ví dụ của giáo viên", async () => {
    const { ctx } = await chuanBi(TIN, { lhdn: true });
    const yc = taoYeuCau("hd1", ctx, {})!;
    expect(yc.noiDung).toContain(`Thời lượng: ${phutHoatDong(ctx.keHoach, "HD1")} phút`);
    expect(yc.noiDung).toContain("học sinh lớp 10 (khoảng 15–16 tuổi)");
    expect(yc.noiDung).toContain("Thiết bị, học liệu có sẵn (chỉ dùng những thứ này): Máy tính đã cài Python, máy chiếu.");
    expect(yc.heThong).toContain("Không áp dụng máy móc; không phải hoạt động nào cũng cần trò chơi hoặc công nghệ.");
    expect(yc.heThong).toContain("600 ảnh kỉ yếu vào USB 2 GB");
    expect(taoYeuCau("hd3", ctx, {})!.noiDung).toContain(`Thời lượng: ${phutHoatDong(ctx.keHoach, "HD3")} phút`);
    const nls = await chuanBi(TIN, { lhdn: true, nls: true, maNls: ["3.4.5.1"] });
    expect(taoYeuCau("nls", nls.ctx, {})!.noiDung).toContain("Nhiệm vụ số chen vào hoạt động có sẵn: ghi số phút");
  });

  it("cảnh báo khi mọi hoạt động đều dùng cùng một cách (trò chơi)", () => {
    const nd = { hd1: { cachToChuc: "Trò chơi ô chữ" }, hd2: { giaoNhiemVu: "tổ chức trò chơi rung chuông vàng" }, hd3: { phuongPhap: "Trò chơi ai nhanh hơn" } } as unknown as NoiDungSoan;
    expect(kiemTraLapPhuongPhap(nd).map((l) => l.noiDung)).toEqual([expect.stringContaining("đều dùng trò chơi")]);
  });

  it("hoạt động chung chung thì soạn lại", async () => {
    const { ctx } = await chuanBi(TOAN, { lhdn: true });
    const goc = taoMauGiaLap(ctx);
    let lan = 0;
    const adapter: AdapterLlm = { ten: "thu", giaLap: true, async goi(yc) {
      const d = goc(yc.luot) as { buoc: { gv: string; hs: string }[] };
      return lan++ === 0 ? { ...d, buoc: d.buoc.map((b) => ({ ...b, gv: "GV giao nhiệm vụ", hs: "HS thảo luận, đại diện trình bày" })) } : d;
    } };
    expect((await soanMotLuot("hd3", ctx, {}, adapter))!.soLanSoanLai).toBe(1);
  });
});
