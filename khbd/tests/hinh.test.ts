import fs from "node:fs";
import path from "node:path";
import PizZip from "pizzip";
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { docBieuThuc, giaTriNhan, hamSo, LoiBieuThuc } from "@khbd/lib/toan/bieu-thuc";
import { doiChieuBbt, phanTichHam, type BbtDoc } from "@khbd/lib/toan/bang-bien-thien";
import { diemTuBbt, nhanSo, veDoThi } from "@khbd/lib/toan/do-thi";
import { docFile } from "@khbd/lib/pipeline/1-tai-len";
import { phanTichGiaoAn } from "@khbd/lib/pipeline/3-ke-hoach/tach-doan";
import { lapKeHoach } from "@khbd/lib/pipeline/3-ke-hoach";
import { LUA_CHON_TRONG } from "@khbd/lib/pipeline/2-lua-chon/lua-chon";
import { xuatWord } from "@khbd/lib/pipeline/6-xuat-file/xuat";
import { bbtXml, hienThiBbt, KhoAnh, kichThuocAnh, maHinh } from "@khbd/lib/pipeline/6-xuat-file/hinh";
import { docCacHinh, docMotHinh, layHinh, moTaHinhDaDoc, taoYeuCauDocHinh, type DocHinh } from "@khbd/lib/pipeline/4-sinh-noi-dung/doc-hinh";
import { bbtTuDoc, chuanBiThayHinh, doiChieuCacHinh, doiChieuHinh, type HamRaster } from "@khbd/lib/pipeline/5-kiem-tra/doi-chieu-hinh";
import { lapDanhSachLuot } from "@khbd/lib/pipeline/4-sinh-noi-dung/luot";
import { kiemTraFileXuat } from "@khbd/lib/pipeline/5-kiem-tra/kiem-tra-file";
import { doanCanGiu } from "@khbd/lib/pipeline/6-xuat-file/ghep";
import { adapterGiaLap, type AdapterLlm } from "@khbd/lib/llm";
import { docHinhGiaLap } from "@khbd/lib/llm/mau-gia-lap";

const MAU = fs.readFileSync(path.join(process.cwd(), "templates/mau.docx"));
const FILE = "toan12_don_dieu_cuc_tri.docx";
const pt = phanTichGiaoAn((await docFile(FILE, fs.readFileSync(path.join(process.cwd(), "samples/input", FILE)))).html, FILE);
const hinh = layHinh(pt);
const lc = { ...LUA_CHON_TRONG, nls: true, maNls: ["5.2.5.2"] };
const kh = lapKeHoach(pt, pt.thongTin, lc);
const adapterMock = adapterGiaLap((_l, yc) => docHinhGiaLap(yc.noiDung), { min: 0, max: 0 });
const docMock = await docCacHinh(hinh, (h, s) => docMotHinh(h, pt.thongTin, adapterMock, s), new AbortController().signal);
const raster: HamRaster = async (svg, _r, _c, t) => new Uint8Array(await sharp(Buffer.from(svg), { density: 72 * t }).png().toBuffer());

const RONG: DocHinh = {
  loai: "khac", moTa: "", ham: "", chacChan: "cao", congThuc: "", bang: [],
  bangBienThien: { x: [], daoHamMoc: [], daoHam: [], y: [] }, doThi: { diem: [], tiemCanDung: [], tiemCanNgang: [] },
};
const docBbt = (ham: string, bbt: DocHinh["bangBienThien"], chacChan: DocHinh["chacChan"] = "cao"): DocHinh => ({ ...RONG, loai: "bang_bien_thien", ham, bangBienThien: bbt, chacChan });

describe("biểu thức hàm số (app tự tính, không dùng AI)", () => {
  it("đọc cách viết tay và LaTeX, nhân ngầm, giá trị tuyệt đối", () => {
    expect(hamSo("x^3 - 3x + 1")(2)).toBe(3);
    expect(hamSo("\\frac{2x+1}{x-1}")(2)).toBe(5);
    expect(hamSo("y = 2x(x-1)")(3)).toBe(12);
    expect(hamSo("|x-2|")(0)).toBe(2);
    expect(hamSo("\\sqrt{4-x^2}")(0)).toBe(2);
    expect(hamSo("x e^{-x}")(1)).toBeCloseTo(Math.exp(-1));
    expect(Number.isNaN(hamSo("ln x")(-1))).toBe(true);
  });
  it("biểu thức không đọc được thì báo lỗi, không đoán", () => {
    expect(() => docBieuThuc("x^3 -")).toThrow(LoiBieuThuc);
    expect(() => docBieuThuc("sin^2 x")).toThrow(LoiBieuThuc);
  });
  it("giá trị nhãn: vô cực, phân số, căn", () => {
    expect(giaTriNhan("+\\infty")).toBe(Infinity);
    expect(giaTriNhan("-\\infty")).toBe(-Infinity);
    expect(giaTriNhan("-\\frac{1}{2}")).toBe(-0.5);
    expect(giaTriNhan("1-\\sqrt{2}")).toBeCloseTo(1 - Math.SQRT2);
  });
});

describe("bảng biến thiên tính từ hàm số", () => {
  const tom = (ham: string) => {
    const b = phanTichHam(ham);
    return { moc: b.moc.map((m) => (m.loai === "vo_cuc" ? `${m.x < 0 ? "-" : "+"}inf:${nhanSo(m.y)}` : m.loai === "tiem_can" ? `TC${m.x}:${nhanSo(m.yTrai)}|${nhanSo(m.yPhai)}` : `${nhanSo(m.x)}:${nhanSo(m.y)}`)), dau: b.dau.join("") };
  };
  it("bậc ba hai cực trị", () => expect(tom("x^3-3x^2+2")).toEqual({ moc: ["-inf:-\\infty", "0:2", "2:-2", "+inf:+\\infty"], dau: "+-+" }));
  it("bậc ba không cực trị: điểm y' = 0 không đổi dấu", () => expect(tom("x^3")).toEqual({ moc: ["-inf:-\\infty", "0:0", "+inf:+\\infty"], dau: "++" }));
  it("trùng phương", () => expect(tom("x^4-2x^2+1")).toEqual({ moc: ["-inf:+\\infty", "-1:0", "0:1", "1:0", "+inf:+\\infty"], dau: "-+-+" }));
  it("phân thức bậc nhất / bậc nhất: tiệm cận đứng và ngang", () => expect(tom("(2x+1)/(x-1)")).toEqual({ moc: ["-inf:2", "TC1:-\\infty|+\\infty", "+inf:2"], dau: "--" }));
  it("phân thức bậc hai / bậc nhất", () => expect(tom("(x^2-x+1)/(x-1)").moc).toEqual(["-inf:-\\infty", "0:-1", "TC1:-\\infty|+\\infty", "2:3", "+inf:+\\infty"]));
  it("tập xác định là đoạn", () => expect(tom("\\sqrt{4-x^2}").moc).toEqual(["-2:0", "0:2", "2:0"]));
});

describe("đối chiếu hình AI đọc với kết quả app tính", () => {
  const dung = { x: ["-\\infty", "0", "2", "+\\infty"], daoHamMoc: ["", "0", "0", ""], daoHam: ["+", "-", "+"], y: ["-\\infty", "2", "-2", "+\\infty"] };
  it("bảng biến thiên khớp hàm số → tạo lại", () => {
    const d = doiChieuHinh("H1", { doc: docBbt("x^3-3x^2+2", dung) });
    expect(d.ketQua).toBe("thay");
    expect(d.ban?.loai).toBe("bbt");
  });
  it("đọc sai một giá trị → giữ ảnh gốc, nêu lí do", () => {
    const d = doiChieuHinh("H1", { doc: docBbt("x^3-3x^2+2", { ...dung, y: ["-\\infty", "2", "-3", "+\\infty"] }) });
    expect(d.ketQua).toBe("giu");
    expect(d.canCu).toContain("mốc thứ 3");
  });
  it("đọc sai dấu y' → giữ ảnh gốc", () => {
    expect(doiChieuHinh("H1", { doc: docBbt("x^3-3x^2+2", { ...dung, daoHam: ["+", "+", "+"] }) }).ketQua).toBe("giu");
  });
  it("tiệm cận đứng ghi trái||phải", () => {
    const d = doiChieuHinh("H2", { doc: docBbt("(2x+1)/(x-1)", { x: ["-\\infty", "1", "+\\infty"], daoHamMoc: ["", "||", ""], daoHam: ["-", "-"], y: ["2", "-\\infty||+\\infty", "2"] }) });
    expect(d.ketQua).toBe("thay");
  });
  it("không có hàm số: chỉ tạo lại khi nhất quán và đọc chắc chắn", () => {
    expect(doiChieuHinh("H3", { doc: docBbt("", dung) }).ketQua).toBe("thay");
    expect(doiChieuHinh("H3", { doc: docBbt("", dung, "vua") }).ketQua).toBe("giu");
    const sai = doiChieuHinh("H3", { doc: docBbt("", { ...dung, y: ["-\\infty", "-2", "2", "+\\infty"] }) });
    expect(sai.ketQua).toBe("giu");
    expect(sai.canCu).toContain("Mũi tên");
  });
  it("kiểm tra nhất quán bảng không có hàm số", () => {
    expect(typeof bbtTuDoc({ x: ["0", "1"], daoHam: ["+"], y: ["1", "0"] })).toBe("string");
    expect(typeof bbtTuDoc({ x: ["1", "0"], daoHam: ["+"], y: ["0", "1"] })).toBe("string");
    expect(typeof bbtTuDoc({ x: ["0", "1"], daoHam: ["+"], y: ["0", "1"] })).toBe("object");
  });
  it("đồ thị: điểm trên ảnh phải thuộc đồ thị", () => {
    const doThi = (diem: { x: number; y: number }[]): DocHinh => ({ ...RONG, loai: "do_thi", ham: "x^3-3x^2+2", doThi: { diem, tiemCanDung: [], tiemCanNgang: [] } });
    expect(doiChieuHinh("H4", { doc: doThi([{ x: 0, y: 2 }, { x: 2, y: -2 }]) }).ketQua).toBe("thay");
    const sai = doiChieuHinh("H4", { doc: doThi([{ x: 0, y: 2 }, { x: 2, y: -1 }]) });
    expect(sai.ketQua).toBe("giu");
    expect(sai.canCu).toContain("không thuộc đồ thị");
    expect(doiChieuHinh("H4", { doc: { ...doThi([{ x: 0, y: 2 }]), ham: "" } }).ketQua).toBe("giu");
  });
  it("công thức, bảng: cần đọc chắc chắn và hợp lệ", () => {
    expect(doiChieuHinh("H5", { doc: { ...RONG, loai: "cong_thuc", congThuc: "y'=3x^{2}-6x" } }).ketQua).toBe("thay");
    expect(doiChieuHinh("H5", { doc: { ...RONG, loai: "cong_thuc", congThuc: "\\frac{1}{" } }).ketQua).toBe("giu");
    expect(doiChieuHinh("H5", { doc: { ...RONG, loai: "cong_thuc", congThuc: "x^2", chacChan: "thap" } }).ketQua).toBe("giu");
    const bang = doiChieuHinh("H6", { doc: { ...RONG, loai: "bang", bang: [["$x$", "1", "2"], ["$y$", "3"]] } });
    expect(bang.ketQua).toBe("thay");
    expect(bang.ban?.loai === "bang" && bang.ban.hang[1]).toEqual(["$y$", "3", ""]);
  });
  it("hình minh họa, ảnh chưa đọc, lỗi đọc → giữ ảnh gốc", () => {
    expect(doiChieuHinh("H7", { doc: RONG }).ketQua).toBe("giu");
    expect(doiChieuHinh("H7", undefined).ketQua).toBe("giu");
    expect(doiChieuHinh("H7", { loi: "Lỗi mạng" }).canCu).toBe("Lỗi mạng");
  });
  it("đối chiếu bảng tính được với nhãn đọc từ ảnh (bỏ điểm y' = 0 ảnh không ghi)", () => {
    const doc: BbtDoc = { x: ["-\\infty", "+\\infty"], daoHam: ["+"], y: ["-\\infty", "+\\infty"] };
    expect(doiChieuBbt(phanTichHam("x^3"), doc)).toBeNull();
  });
});

describe("đọc hình trong giáo án mẫu", () => {
  it("lấy đủ 6 ảnh, mỗi ảnh có mã ổn định, đoạn văn quanh ảnh và cỡ hiển thị gốc", () => {
    expect(hinh).toHaveLength(6);
    expect(new Set(hinh.map((h) => h.ma)).size).toBe(6);
    expect(hinh.every((h) => h.mime === "image/png" && h.kichThuoc && h.kichThuoc.rong > 0)).toBe(true);
    expect(hinh[3].nguCanh).toContain("Bảng biến thiên của hàm số");
    expect(maHinh("data:image/png;base64,AAA")).toBe(maHinh("data:image/png;base64,AAA"));
  });
  it("yêu cầu gửi kèm ảnh và đoạn văn quanh ảnh; luật đọc hình nằm trong rules/", () => {
    const yc = taoYeuCauDocHinh(hinh[3], pt.thongTin);
    expect(yc.anh).toHaveLength(1);
    expect(yc.noiDung).toContain("Bảng biến thiên của hàm số y = x^3 - 3x^2 + 2");
    expect(yc.heThong).toContain("Không suy đoán");
  });
  it("adapter không gửi được ảnh: giữ ảnh gốc, không gọi AI", async () => {
    let goi = 0;
    const khong: AdapterLlm = { ten: "x", giaLap: false, goi: async () => { goi++; return {}; } };
    expect((await docMotHinh(hinh[0], pt.thongTin, khong)).boQua).toBeTruthy();
    expect(goi).toBe(0);
  });
  it("lỗi đọc ở mọi ảnh thì báo lỗi lượt (để soạn lại); lỗi một ảnh thì không chặn ảnh khác", async () => {
    const loi = adapterGiaLap(() => { throw new Error("Hết lượt"); }, { min: 0, max: 0 });
    await expect(docCacHinh(hinh, (h, s) => docMotHinh(h, pt.thongTin, loi, s), new AbortController().signal)).rejects.toThrow("Hết lượt");
    let i = 0;
    const motLoi = adapterGiaLap((_l, yc) => { if (i++ === 0) throw new Error("Hết lượt"); return docHinhGiaLap(yc.noiDung); }, { min: 0, max: 0 });
    const kq = await docCacHinh(hinh, (h, s) => docMotHinh(h, pt.thongTin, motLoi, s), new AbortController().signal);
    expect(Object.values(kq).filter((k) => k.loi)).toHaveLength(1);
  });
  it("giả lập: tạo lại 5 hình (công thức, bảng, 2 bảng biến thiên, đồ thị), giữ hình minh họa", () => {
    const dc = doiChieuCacHinh(hinh, docMock);
    expect(dc.map((d) => `${d.loai}:${d.ketQua}`)).toEqual(["khac:giu", "cong_thuc:thay", "bang:thay", "bang_bien_thien:thay", "do_thi:thay", "bang_bien_thien:thay"]);
  });
  it("lượt đọc hình đứng đầu khi giáo án có ảnh; mô tả hình vào ngữ cảnh lượt sau", () => {
    expect(lapDanhSachLuot(kh, lc, 6)[0].ma).toBe("doc_hinh");
    expect(lapDanhSachLuot(kh, lc).some((l) => l.ma === "doc_hinh")).toBe(false);
    expect(moTaHinhDaDoc(docMock)).toContain("Bảng biến thiên của hàm số");
  });
});

describe("xuất Word có hình", () => {
  const demTheo = (file: Uint8Array) => {
    const zip = new PizZip(file);
    const doc = zip.file("word/document.xml")!.asText();
    return {
      zip, doc,
      anh: (doc.match(/<w:drawing>/g) ?? []).length,
      media: Object.keys(zip.files).filter((f) => f.startsWith("word/media/khbd_")).length,
      bang: (doc.match(/<w:tbl>/g) ?? []).length,
    };
  };
  it("không đọc hình: nhúng lại đủ ảnh gốc đúng cỡ, không còn dòng nhắc chèn hình", () => {
    const k = demTheo(xuatWord(MAU, pt, pt.thongTin, lc, kh, false, {}));
    expect(k.anh).toBe(6);
    expect(k.media).toBe(6);
    expect(k.doc).not.toContain("Chèn hình");
    expect(k.zip.file("word/_rels/document.xml.rels")!.asText()).toContain('Id="rIdKhbdHinh6"');
    expect(k.zip.file("[Content_Types].xml")!.asText()).toMatch(/Extension="png"/i);
    expect(k.doc).toMatch(/<w:document[^>]*xmlns:wp=/);
    // Hình minh họa giữ cỡ hiển thị 200 px của giáo án gốc.
    expect(k.doc).toContain(`cx="${200 * 9525}"`);
  });
  it("thay hình khớp: 3 bảng Word (bảng số liệu, 2 bảng biến thiên), công thức Word, đồ thị vẽ lại; giữ nguyên chữ của GV", async () => {
    const dc = doiChieuCacHinh(hinh, docMock);
    const thay = await chuanBiThayHinh(dc, new Set(), hinh, raster);
    expect(thay.size).toBe(5);
    const nd = { doc_hinh: docMock };
    const file = xuatWord(MAU, pt, pt.thongTin, lc, kh, false, nd, undefined, thay);
    const k = demTheo(file);
    expect(k.anh).toBe(2); // hình minh họa (gốc) + đồ thị app vẽ
    expect(k.bang).toBe(3);
    expect(k.doc).toContain("<m:oMath>");
    expect(k.doc).toContain("↗︎");
    const anhDoThi = k.zip.file(/word\/media\/khbd_hinh\d\.png/).map((f) => kichThuocAnh(f.asUint8Array())!);
    expect(anhDoThi.some((a) => a.rong === 480 * 3)).toBe(true);
    const kt = kiemTraFileXuat(file, doanCanGiu(pt, pt.thongTin, lc, kh, nd), { coAi: false, nenTangChon: [], nenTangGoiY: [] });
    expect(kt.loi.filter((l) => l.nghiem)).toEqual([]);
    expect(kt.tiLeGiuNguyen).toBe(100);
  });
  it("giáo viên chọn giữ ảnh gốc cho một hình", async () => {
    const dc = doiChieuCacHinh(hinh, docMock);
    const bbt = dc.find((d) => d.loai === "bang_bien_thien")!;
    const thay = await chuanBiThayHinh(dc, new Set([bbt.ma]), hinh, raster);
    const k = demTheo(xuatWord(MAU, pt, pt.thongTin, lc, kh, false, {}, undefined, thay));
    expect(k.bang).toBe(2);
    expect(k.anh).toBe(3);
  });
  it("bảng biến thiên Word: 4 hàng, nét đôi ở tiệm cận đứng", () => {
    const ht = hienThiBbt(phanTichHam("(2x+1)/(x-1)"));
    const x = bbtXml(ht, (s) => s);
    expect((x.match(/<w:tr>/g) ?? []).length).toBe(4);
    expect(x).toContain('w:val="double"');
  });
  it("kho ảnh: cùng ảnh dùng lại một tệp; ảnh rộng thu về vừa trang", () => {
    const kho = new KhoAnh();
    const png = Uint8Array.from(Buffer.from("89504E470D0A1A0A0000000D49484452000007D0000003E808060000", "hex"));
    const a = kho.them("image/png", png, "a")!;
    kho.them("image/png", png, "a");
    expect(kho.ds).toHaveLength(1);
    expect(a).toContain('cx="5900000"');
    expect(kho.them("image/svg+xml", png, "b")).toBeNull();
  });
  it("vẽ đồ thị: SVG có trục, đường cong, điểm đặc biệt", () => {
    const { svg } = veDoThi("x^3-3x^2+2", diemTuBbt(phanTichHam("x^3-3x^2+2"), "x^3-3x^2+2"));
    expect(svg).toMatch(/^<svg/);
    expect((svg.match(/<circle/g) ?? []).length).toBeGreaterThanOrEqual(2);
  });
});
