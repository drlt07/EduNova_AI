/**
 * Đối chiếu hình AI đọc được với kết quả app tự tính, quyết định thay ảnh gốc bằng bản tạo lại hay giữ ảnh gốc.
 * - Bảng biến thiên: có hàm số thì tính lại bảng và so từng mốc, dấu, giá trị; không có hàm số thì kiểm tra tính
 *   nhất quán (mũi tên khớp dấu y', giá trị tăng/giảm đúng chiều) và AI phải đọc chắc chắn.
 * - Đồ thị: cần hàm số; mọi điểm, tiệm cận đọc được phải khớp hàm số; app tự vẽ lại từ hàm số.
 * - Công thức, bảng: AI phải đọc chắc chắn và dữ liệu hợp lệ (LaTeX dựng được, bảng có nội dung).
 * Không khớp hoặc không chắc → giữ ảnh gốc, ghi lí do để giáo viên biết.
 */
import { giaTriNhan, hamSo, LoiBieuThuc } from "@khbd/lib/toan/bieu-thuc";
import { doiChieuBbt, fmt, locTheoDoc, phanTichHam, type Bbt, type BbtDoc, type MocBbt } from "@khbd/lib/toan/bang-bien-thien";
import { diemTuBbt, nhanSo, veDoThi, type DiemDacBiet } from "@khbd/lib/toan/do-thi";
import { bbtHtml, hienThiBbt, kichThuocAnh, type BbtHienThi, type HinhThay } from "../6-xuat-file/hinh";
import { latexSangOmml, loiLatex } from "../6-xuat-file/cong-thuc";
import type { DocHinh, DocHinhSoan, HinhGoc, KetQuaDocHinh } from "../4-sinh-noi-dung/doc-hinh";

export type BanTaoLai =
  | { loai: "bbt"; ht: BbtHienThi; html: string }
  | { loai: "do_thi"; svg: string; rong: number; cao: number }
  | { loai: "cong_thuc"; latex: string }
  | { loai: "bang"; hang: string[][] };

export type DoiChieuHinh = {
  ma: string;
  loai: DocHinh["loai"] | "chua_doc";
  moTa: string;
  /** thay: khớp, xuất bản tạo lại; giu: giữ ảnh gốc. */
  ketQua: "thay" | "giu";
  canCu: string;
  ban?: BanTaoLai;
};

const TEN_LOAI: Record<DocHinh["loai"], string> = {
  bang_bien_thien: "Bảng biến thiên", do_thi: "Đồ thị hàm số", cong_thuc: "Công thức", bang: "Bảng", khac: "Hình minh họa",
};
export const tenLoaiHinh = (l: DoiChieuHinh["loai"]) => (l === "chua_doc" ? "Hình" : TEN_LOAI[l]);

const giu = (ma: string, doc: DocHinh | undefined, canCu: string): DoiChieuHinh =>
  ({ ma, loai: doc?.loai ?? "chua_doc", moTa: doc?.moTa ?? "", ketQua: "giu", canCu });
const hamHienThi = (ham: string) => `$y = ${ham.replace(/^\s*(y|f\s*\(\s*x\s*\))\s*=\s*/i, "")}$`;

/** Đọc hàm số; không đọc được thì null (không đoán). */
function docHam(ham: string): string | null {
  if (!ham.trim()) return null;
  try { hamSo(ham); return ham; } catch (e) { if (e instanceof LoiBieuThuc) return null; throw e; }
}

// ───────────── Bảng biến thiên ─────────────

/** Dựng bảng biến thiên từ nhãn AI đọc (khi không có hàm số), kèm kiểm tra nhất quán. Lỗi thì trả chuỗi lí do. */
export function bbtTuDoc(doc: BbtDoc & { daoHamMoc?: string[] }): Bbt | string {
  const n = doc.x.length;
  if (n < 2) return "Bảng có ít hơn hai mốc x.";
  if (doc.y.length !== n) return "Số giá trị y không bằng số mốc x.";
  if (doc.daoHam.length !== n - 1) return "Số dấu y' không khớp số khoảng.";
  const xs = doc.x.map(giaTriNhan);
  if (xs.some(Number.isNaN)) return `Không đọc được mốc x “${doc.x[xs.findIndex(Number.isNaN)]}”.`;
  for (let i = 1; i < n; i++) if (!(xs[i] > xs[i - 1])) return "Các mốc x không tăng dần.";
  const dau = doc.daoHam.map((d) => (/[-−–]/.test(d) ? "-" : /\+/.test(d) ? "+" : "?"));
  if (dau.includes("?")) return "Có khoảng không đọc được dấu y'.";
  const moc: MocBbt[] = xs.map((x, i) => {
    const nhan = doc.y[i] ?? "";
    if (/\|\||‖/.test(nhan)) {
      const [t, p] = nhan.split(/\|\||‖/).map((s) => (s.trim() ? giaTriNhan(s) : NaN));
      return { loai: "tiem_can", x, yTrai: t, yPhai: p };
    }
    if (!Number.isFinite(x)) return { loai: "vo_cuc", x: x < 0 ? -1 : 1, y: giaTriNhan(nhan) };
    return { loai: "diem", x, y: giaTriNhan(nhan), daoHam0: (doc.daoHamMoc?.[i] ?? "").trim() === "0" };
  });
  // Mũi tên phải khớp dấu: khoảng "+" đi từ giá trị nhỏ lên giá trị lớn và ngược lại.
  const benPhai = (m: MocBbt) => (m.loai === "tiem_can" ? m.yPhai : m.y);
  const benTrai = (m: MocBbt) => (m.loai === "tiem_can" ? m.yTrai : m.y);
  for (let i = 0; i < n - 1; i++) {
    const a = benPhai(moc[i]), b = benTrai(moc[i + 1]);
    if (Number.isNaN(a) || Number.isNaN(b)) {
      if (Number.isNaN(a) && moc[i].loai !== "tiem_can") return `Không đọc được giá trị y tại mốc ${doc.x[i]}.`;
      if (Number.isNaN(b) && moc[i + 1].loai !== "tiem_can") return `Không đọc được giá trị y tại mốc ${doc.x[i + 1]}.`;
      continue;
    }
    const tang = b > a;
    if (a === b || tang !== (dau[i] === "+")) return `Mũi tên trên khoảng (${doc.x[i]}; ${doc.x[i + 1]}) không khớp dấu y' “${dau[i]}”: từ ${fmt(a)} đến ${fmt(b)}.`;
  }
  return { moc, dau: dau as ("+" | "-")[] };
}

function doiChieuBbtHinh(ma: string, doc: DocHinh): DoiChieuHinh {
  const d = doc.bangBienThien;
  const bbtDoc: BbtDoc = { x: d.x, daoHam: d.daoHam, y: d.y };
  if (!d.x.length) return giu(ma, doc, "Chưa đọc được bảng biến thiên.");
  const ham = docHam(doc.ham);
  if (ham) {
    const xs = d.x.map(giaTriNhan);
    const lo = xs[0], hi = xs[xs.length - 1];
    let tinh: Bbt;
    try {
      tinh = phanTichHam(ham, Number.isFinite(lo) || Number.isFinite(hi) ? { lo, hi } : undefined, xs.filter(Number.isFinite));
    } catch {
      return giu(ma, doc, `Không tính được bảng biến thiên của ${hamHienThi(ham)}.`);
    }
    const lech = doiChieuBbt(tinh, bbtDoc);
    if (lech) return giu(ma, doc, `Đối chiếu với ${hamHienThi(ham)}: ${lech}`);
    const ht = hienThiBbt(locTheoDoc(tinh, bbtDoc), bbtDoc);
    return { ma, loai: doc.loai, moTa: doc.moTa, ketQua: "thay", canCu: `Đã tính lại từ ${hamHienThi(ham)}: khớp từng mốc, dấu y' và giá trị.`, ban: { loai: "bbt", ht, html: bbtHtml(ht) } };
  }
  if (doc.chacChan !== "cao") return giu(ma, doc, "Ảnh không rõ và không có công thức hàm số để đối chiếu.");
  const bbt = bbtTuDoc({ ...bbtDoc, daoHamMoc: d.daoHamMoc });
  if (typeof bbt === "string") return giu(ma, doc, bbt);
  const ht = hienThiBbt(bbt, bbtDoc);
  return { ma, loai: doc.loai, moTa: doc.moTa, ketQua: "thay", canCu: "Không có công thức hàm số; đã kiểm tra chiều mũi tên khớp dấu y' và các giá trị.", ban: { loai: "bbt", ht, html: bbtHtml(ht) } };
}

// ───────────── Đồ thị ─────────────

const ganDiem = (a: number, b: number) => Math.abs(a - b) <= 0.02 * Math.max(1, Math.abs(a), Math.abs(b));

function doiChieuDoThi(ma: string, doc: DocHinh): DoiChieuHinh {
  const ham = docHam(doc.ham);
  if (!ham) return giu(ma, doc, "Không có công thức hàm số để vẽ lại đồ thị.");
  const f = hamSo(ham);
  const { diem, tiemCanDung, tiemCanNgang } = doc.doThi;
  for (const p of diem) {
    if (!ganDiem(f(p.x), p.y)) return giu(ma, doc, `Điểm (${fmt(p.x)}; ${fmt(p.y)}) trên ảnh không thuộc đồ thị ${hamHienThi(ham)}.`);
  }
  let bbt: Bbt;
  try { bbt = phanTichHam(ham, undefined, diem.map((p) => p.x)); } catch { return giu(ma, doc, `Không tính được đồ thị ${hamHienThi(ham)}.`); }
  const tc = diemTuBbt(bbt, ham);
  for (const a of tiemCanDung) if (!tc.tiemCanDung!.some((b) => ganDiem(a, b))) return giu(ma, doc, `Tiệm cận đứng x = ${fmt(a)} trên ảnh không khớp ${hamHienThi(ham)}.`);
  for (const a of tiemCanNgang) if (!tc.tiemCanNgang!.some((b) => ganDiem(a, b))) return giu(ma, doc, `Tiệm cận ngang y = ${fmt(a)} trên ảnh không khớp ${hamHienThi(ham)}.`);
  if (diem.length + tiemCanDung.length + tiemCanNgang.length < 2) return giu(ma, doc, "Ảnh có quá ít điểm ghi tọa độ để đối chiếu với hàm số.");
  // Điểm có ghi tọa độ trên ảnh gốc mà bảng biến thiên không có (vd giao điểm với trục) cũng được vẽ lại.
  const ds: DiemDacBiet[] = [...(tc.diem ?? [])];
  for (const p of diem) if (!ds.some((q) => ganDiem(q.x, p.x) && ganDiem(q.y, p.y))) ds.push({ x: p.x, y: p.y, nhanX: nhanSo(p.x), nhanY: nhanSo(p.y) });
  const ve = veDoThi(ham, { ...tc, diem: ds });
  return { ma, loai: doc.loai, moTa: doc.moTa, ketQua: "thay", canCu: `Các điểm và tiệm cận trên ảnh khớp ${hamHienThi(ham)}; app vẽ lại từ hàm số.`, ban: { loai: "do_thi", ...ve } };
}

// ───────────── Công thức, bảng ─────────────

function doiChieuCongThuc(ma: string, doc: DocHinh): DoiChieuHinh {
  const latex = doc.congThuc.trim().replace(/^\$+|\$+$/g, "");
  if (!latex) return giu(ma, doc, "Chưa đọc được công thức.");
  if (doc.chacChan !== "cao") return giu(ma, doc, "Ảnh công thức không rõ.");
  const loi = loiLatex(latex);
  if (loi) return giu(ma, doc, "Công thức đọc được chưa đúng cú pháp.");
  try { latexSangOmml(latex); } catch { return giu(ma, doc, "Công thức đọc được chưa dựng được trong Word."); }
  return { ma, loai: doc.loai, moTa: doc.moTa, ketQua: "thay", canCu: "Đọc rõ; chuyển thành công thức Word sửa được.", ban: { loai: "cong_thuc", latex } };
}

function doiChieuBang(ma: string, doc: DocHinh): DoiChieuHinh {
  const hang = doc.bang.filter((h) => h.some((o) => o.trim()));
  if (!hang.length) return giu(ma, doc, "Chưa đọc được bảng.");
  if (doc.chacChan !== "cao") return giu(ma, doc, "Ảnh bảng không rõ.");
  const soCot = Math.max(...hang.map((h) => h.length));
  if (hang.flat().filter((o) => o.trim()).length < 2) return giu(ma, doc, "Bảng có quá ít nội dung.");
  const cacO = hang.flat().flatMap((o) => [...o.matchAll(/\$([^$]+)\$/g)].map((m) => m[1]));
  if (cacO.some((l) => loiLatex(l))) return giu(ma, doc, "Có công thức trong bảng chưa đúng cú pháp.");
  const du = hang.map((h) => [...h, ...Array.from({ length: soCot - h.length }, () => "")]);
  return { ma, loai: doc.loai, moTa: doc.moTa, ketQua: "thay", canCu: "Đọc rõ; dựng lại thành bảng Word sửa được.", ban: { loai: "bang", hang: du } };
}

/** Đối chiếu một ảnh theo kết quả AI đọc. */
export function doiChieuHinh(ma: string, kq: KetQuaDocHinh | undefined): DoiChieuHinh {
  if (!kq || (!kq.doc && !kq.loi && !kq.boQua)) return giu(ma, undefined, "Chưa đọc ảnh này.");
  if (!kq.doc) return giu(ma, undefined, kq.boQua ?? kq.loi ?? "Chưa đọc ảnh này.");
  const doc = kq.doc;
  switch (doc.loai) {
    case "bang_bien_thien": return doiChieuBbtHinh(ma, doc);
    case "do_thi": return doiChieuDoThi(ma, doc);
    case "cong_thuc": return doiChieuCongThuc(ma, doc);
    case "bang": return doiChieuBang(ma, doc);
    default: return giu(ma, doc, "Hình minh họa: giữ ảnh gốc.");
  }
}

export function doiChieuCacHinh(hinh: HinhGoc[], doc: DocHinhSoan | undefined): DoiChieuHinh[] {
  return hinh.map((h) => doiChieuHinh(h.ma, doc?.[h.ma]));
}

/** SVG → PNG (trình duyệt: canvas; Node: sharp). `tiLe`: độ phân giải so với kích thước SVG. */
export type HamRaster = (svg: string, rong: number, cao: number, tiLe: number) => Promise<Uint8Array>;

/**
 * Bản thay dùng khi xuất Word: các ảnh khớp mà giáo viên không chọn giữ ảnh gốc. Đồ thị chuyển thành PNG,
 * hiển thị bằng chiều rộng của ảnh gốc (tối đa 12 cm) để bố cục trang không đổi.
 */
export async function chuanBiThayHinh(ds: DoiChieuHinh[], giuGoc: Set<string>, hinh: HinhGoc[], raster: HamRaster): Promise<Map<string, HinhThay>> {
  const kq = new Map<string, HinhThay>();
  for (const d of ds) {
    if (d.ketQua !== "thay" || !d.ban || giuGoc.has(d.ma)) continue;
    const b = d.ban;
    if (b.loai === "bbt") kq.set(d.ma, { loai: "bbt", ht: b.ht });
    else if (b.loai === "cong_thuc") kq.set(d.ma, { loai: "cong_thuc", latex: b.latex });
    else if (b.loai === "bang") kq.set(d.ma, { loai: "bang", hang: b.hang });
    else {
      const goc = hinh.find((h) => h.ma === d.ma);
      const ktGoc = goc?.kichThuoc ?? (goc ? kichThuocAnh(Uint8Array.from(atob(goc.base64.slice(0, 80000)), (c) => c.charCodeAt(0))) : null);
      const rong = Math.min(ktGoc?.rong ?? 360, 454);
      kq.set(d.ma, { loai: "anh", mime: "image/png", bytes: await raster(b.svg, b.rong, b.cao, 3), rong, cao: Math.round((rong * b.cao) / b.rong) });
    }
  }
  return kq;
}
