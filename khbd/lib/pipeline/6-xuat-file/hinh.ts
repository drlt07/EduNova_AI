/**
 * Hình trong file Word xuất ra:
 * - KhoAnh: nhúng ảnh (ảnh gốc của GV, đồ thị app vẽ) vào docx: word/media, quan hệ, kiểu nội dung, <w:drawing>.
 * - Bảng biến thiên dựng thành bảng Word thật (sửa được), nhãn là công thức Word.
 */
import type PizZip from "pizzip";
import type { Bbt, BbtDoc } from "@khbd/lib/toan/bang-bien-thien";
import { nhanChu, nhanSo } from "@khbd/lib/toan/do-thi";

// ───────────── Mã ảnh, bản thay ─────────────

/** Mã ổn định của một ảnh (băm FNV-1a của src): dùng làm khóa khi thay ảnh và hỏi AI. */
export function maHinh(src: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < src.length; i++) { h ^= src.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return "HINH-" + (h >>> 0).toString(36).toUpperCase();
}

/** Bản app tạo lại cho một ảnh của giáo án gốc (chỉ dùng khi đã đối chiếu khớp). */
export type HinhThay =
  | { loai: "bbt"; ht: BbtHienThi }
  | { loai: "anh"; mime: string; bytes: Uint8Array; rong: number; cao: number }
  | { loai: "cong_thuc"; latex: string }
  | { loai: "bang"; hang: string[][] };

/** Tiền tố ghi kích thước ảnh (EMU) trong mô tả ảnh: "khbd-kt:<cx>x<cy>|<mô tả gốc>". */
export const KT_ANH = "khbd-kt:";

/** Kích thước hiển thị (px) của ảnh gốc đọc từ mô tả ảnh; không có thì null. */
export function kichThuocHienThi(alt: string | null | undefined): { rong: number; cao: number } | null {
  const m = /^khbd-kt:(\d+)x(\d+)/.exec(alt ?? "");
  return m ? { rong: Math.round(Number(m[1]) / 9525), cao: Math.round(Number(m[2]) / 9525) } : null;
}

// ───────────── Kích thước ảnh ─────────────

/** Kích thước (px, 96 dpi) đọc từ đầu tệp ảnh; không đọc được thì null. */
export function kichThuocAnh(b: Uint8Array): { rong: number; cao: number } | null {
  const dv = new DataView(b.buffer, b.byteOffset, b.byteLength);
  if (b.length > 24 && b[0] === 0x89 && b[1] === 0x50) return { rong: dv.getUint32(16), cao: dv.getUint32(20) }; // PNG
  if (b.length > 10 && b[0] === 0x47 && b[1] === 0x49) return { rong: dv.getUint16(6, true), cao: dv.getUint16(8, true) }; // GIF
  if (b.length > 26 && b[0] === 0x42 && b[1] === 0x4d) return { rong: dv.getInt32(18, true), cao: Math.abs(dv.getInt32(22, true)) }; // BMP
  if (b[0] === 0xff && b[1] === 0xd8) { // JPEG: tìm khung SOF
    let i = 2;
    while (i + 9 < b.length) {
      if (b[i] !== 0xff) { i++; continue; }
      const m = b[i + 1], dai = dv.getUint16(i + 2);
      if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) return { rong: dv.getUint16(i + 7), cao: dv.getUint16(i + 5) };
      i += 2 + dai;
    }
    return null;
  }
  if (b.length > 40 && dv.getUint32(0, true) === 1 && dv.getUint32(40, true) === 0x464d4520) { // EMF: rclFrame (0,01 mm)
    const r = dv.getInt32(32, true) - dv.getInt32(24, true), c = dv.getInt32(36, true) - dv.getInt32(28, true);
    return { rong: Math.round((r / 2540) * 96), cao: Math.round((c / 2540) * 96) };
  }
  if (b.length > 16 && dv.getUint32(0, true) === 0x9ac6cdd7) { // WMF có đầu placeable
    const r = dv.getInt16(10, true) - dv.getInt16(6, true), c = dv.getInt16(12, true) - dv.getInt16(8, true), inch = dv.getUint16(14, true) || 1440;
    return { rong: Math.round((Math.abs(r) / inch) * 96), cao: Math.round((Math.abs(c) / inch) * 96) };
  }
  return null;
}

const DUOI: Record<string, string> = { "image/png": "png", "image/jpeg": "jpeg", "image/gif": "gif", "image/bmp": "bmp", "image/x-emf": "emf", "image/x-wmf": "wmf", "image/tiff": "tiff" };
const EMU_PX = 9525;
const RONG_TOI_DA = 5_900_000; // ~16,4 cm: vừa khổ A4 trừ lề

/** Tách data URI ảnh thành kiểu và byte. */
export function docDataUri(src: string): { mime: string; bytes: Uint8Array } | null {
  const m = /^data:([^;,]+);base64,(.*)$/s.exec(src);
  if (!m) return null;
  const s = atob(m[2].replace(/\s+/g, ""));
  return { mime: m[1].toLowerCase(), bytes: Uint8Array.from(s, (c) => c.charCodeAt(0)) };
}

/** Kho ảnh của một lần xuất file: mỗi ảnh một phần word/media/…, một quan hệ, một <w:drawing>. */
export class KhoAnh {
  ds: { rId: string; ten: string; mime: string; bytes: Uint8Array }[] = [];
  private theoKhoa = new Map<string, string>();

  /** Thêm ảnh, trả XML một run chứa ảnh (inline). Kiểu ảnh Word không hỗ trợ thì null. rong/cao: px mong muốn. */
  them(mime: string, bytes: Uint8Array, khoa: string, kt?: { rong: number; cao: number }): string | null {
    const duoi = DUOI[mime];
    if (!duoi) return null;
    let rId = this.theoKhoa.get(khoa);
    if (!rId) {
      rId = `rIdKhbdHinh${this.ds.length + 1}`;
      this.ds.push({ rId, ten: `khbd_hinh${this.ds.length + 1}.${duoi}`, mime, bytes });
      this.theoKhoa.set(khoa, rId);
    }
    const goc = kt ?? kichThuocAnh(bytes) ?? { rong: 320, cao: 200 };
    let cx = goc.rong * EMU_PX, cy = goc.cao * EMU_PX;
    if (cx > RONG_TOI_DA) { cy = Math.round((cy * RONG_TOI_DA) / cx); cx = RONG_TOI_DA; }
    const so = this.ds.findIndex((a) => a.rId === rId) + 1000;
    return `<w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="${cx}" cy="${cy}"/><wp:docPr id="${so}" name="Hình ${so - 999}"/>`
      + `<wp:cNvGraphicFramePr><a:graphicFrameLocks noChangeAspect="1"/></wp:cNvGraphicFramePr>`
      + `<a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic>`
      + `<pic:nvPicPr><pic:cNvPr id="${so}" name="Hình ${so - 999}"/><pic:cNvPicPr/></pic:nvPicPr>`
      + `<pic:blipFill><a:blip r:embed="${rId}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>`
      + `<pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr>`
      + `</pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r>`;
  }
}

/** Ghi ảnh của kho vào docx (sau khi docxtemplater dựng xong document.xml). */
export function ganAnhVaoZip(zip: PizZip, kho: KhoAnh): void {
  if (!kho.ds.length) return;
  for (const a of kho.ds) zip.file(`word/media/${a.ten}`, a.bytes);
  const relPath = "word/_rels/document.xml.rels";
  const rels = zip.file(relPath)!.asText();
  zip.file(relPath, rels.replace("</Relationships>", kho.ds.map((a) => `<Relationship Id="${a.rId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/${a.ten}"/>`).join("") + "</Relationships>"));
  const ctPath = "[Content_Types].xml";
  let ct = zip.file(ctPath)!.asText();
  for (const a of kho.ds) {
    const duoi = a.ten.split(".").pop()!;
    if (!new RegExp(`Extension="${duoi}"`, "i").test(ct)) ct = ct.replace("<Types ", "<Types ").replace(/(<Types[^>]*>)/, `$1<Default Extension="${duoi}" ContentType="${a.mime}"/>`);
  }
  zip.file(ctPath, ct);
  // Khai báo không gian tên cho <w:drawing> ở gốc document.xml (mẫu Word có thể chưa khai báo).
  const docPath = "word/document.xml";
  let doc = zip.file(docPath)!.asText();
  const ns: Record<string, string> = {
    wp: "http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing",
    a: "http://schemas.openxmlformats.org/drawingml/2006/main",
    pic: "http://schemas.openxmlformats.org/drawingml/2006/picture",
    r: "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
  };
  doc = doc.replace(/<w:document\b([^>]*)>/, (m, thuocTinh: string) => {
    const them = Object.entries(ns).filter(([k]) => !new RegExp(`xmlns:${k}=`).test(thuocTinh)).map(([k, v]) => ` xmlns:${k}="${v}"`).join("");
    return `<w:document${thuocTinh}${them}>`;
  });
  zip.file(docPath, doc);
}

// ───────────── Bảng biến thiên ─────────────

type CotHT = { x: string; dau: string; tren: string; duoi: string; tc?: { trai: string; phai: string; traiTren: boolean; phaiTren: boolean } };
export type BbtHienThi = { cot: CotHT[]; khoang: { dau: "+" | "-"; len: boolean }[] };

/**
 * Bảng biến thiên để hiển thị: vị trí giá trị (trên/dưới) theo chiều mũi tên; nhãn lấy từ ảnh (doc, đã đối chiếu khớp)
 * hoặc nhãn số do app tạo. bbt phải là bảng đã lọc theo doc (cùng số mốc) khi có doc.
 */
export function hienThiBbt(bbt: Bbt, doc?: BbtDoc): BbtHienThi {
  const n = bbt.moc.length;
  // Mũi tên đi lên khi y' > 0.
  const khoang = bbt.dau.map((d) => ({ dau: d, len: d === "+" }));
  const cot = bbt.moc.map((m, i): CotHT => {
    const nhanX = doc?.x[i] ?? (m.loai === "vo_cuc" ? (m.x < 0 ? "-\\infty" : "+\\infty") : nhanSo(m.x));
    const vaoLen = i > 0 && khoang[i - 1].len, raXuong = i < n - 1 && !khoang[i].len;
    if (m.loai === "tiem_can") {
      const [t, p] = (doc?.y[i] ?? "").split(/\|\||‖/);
      const coHai = (doc?.y[i] ?? "").match(/\|\||‖/);
      return {
        x: nhanX, dau: "‖", tren: "", duoi: "",
        tc: {
          trai: doc ? (coHai ? t : Number.isNaN(m.yTrai) ? "" : t) : nhanSo(m.yTrai),
          phai: doc ? (coHai ? p : Number.isNaN(m.yTrai) ? t : "") : nhanSo(m.yPhai),
          traiTren: vaoLen, phaiTren: raXuong,
        },
      };
    }
    const y = doc?.y[i] ?? nhanSo(m.y);
    const tren = vaoLen || raXuong;
    return { x: nhanX, dau: m.loai === "diem" && m.daoHam0 ? "0" : "", tren: tren ? y : "", duoi: tren ? "" : y };
  });
  return { cot, khoang };
}

const RONG_BANG = 9354;

/** Bảng biến thiên → bảng Word (4 hàng: x, y', y trên, y dưới; mũi tên là công thức Word). */
export function bbtXml(ht: BbtHienThi, cong: (latex: string) => string): string {
  // Cột: nhãn | mốc (tiệm cận: 2 cột) | khoảng | mốc …
  type O = { loai: "moc" | "khoang"; i: number; phan?: "trai" | "phai" };
  const ot: O[] = [];
  ht.cot.forEach((c, i) => {
    if (c.tc) ot.push({ loai: "moc", i, phan: "trai" }, { loai: "moc", i, phan: "phai" });
    else ot.push({ loai: "moc", i });
    if (i < ht.khoang.length) ot.push({ loai: "khoang", i });
  });
  const rongNhan = 900, rong = Math.floor((RONG_BANG - rongNhan) / ot.length);
  const vien = (canh: Record<string, string>) => `<w:tcBorders>${Object.entries(canh).map(([k, v]) => `<w:${k} w:val="${v}" w:sz="${v === "double" ? 4 : 6}" w:space="0" w:color="000000"/>`).join("")}</w:tcBorders>`;
  const doan = (noi: string) => `<w:p><w:pPr><w:pStyle w:val="BangChu"/><w:jc w:val="center"/></w:pPr>${noi}</w:p>`;
  const o = (noi: string, opt: { span?: number; vMerge?: "restart" | "continue"; canh?: Record<string, string>; rongO?: number } = {}) =>
    `<w:tc><w:tcPr><w:tcW w:w="${opt.rongO ?? rong * (opt.span ?? 1)}" w:type="dxa"/>${opt.span && opt.span > 1 ? `<w:gridSpan w:val="${opt.span}"/>` : ""}${opt.vMerge ? `<w:vMerge${opt.vMerge === "restart" ? ' w:val="restart"' : ""}/>` : ""}${opt.canh ? vien(opt.canh) : ""}<w:vAlign w:val="center"/></w:tcPr>${doan(noi)}</w:tc>`;
  const chu = (latex: string) => (latex ? cong(`$${latex}$`) : "");
  // Nhãn hàng, dấu y', mũi tên: chữ thường (công thức chỉ một dấu "+" hiển thị lỗi ở một số trình soạn thảo).
  // Mũi tên kèm U+FE0E để không bị đổi thành biểu tượng màu.
  const tho = (t: string, nghieng = false) => `<w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/>${nghieng ? "<w:i/>" : ""}</w:rPr><w:t xml:space="preserve">${t}</w:t></w:r>`;
  const muiTen = (len: boolean) => `<w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:sz w:val="32"/></w:rPr><w:t>${len ? "\u2197" : "\u2198"}\uFE0E</w:t></w:r>`;
  const nhanCot = (noi: string, hang: number, vMerge?: "restart" | "continue") => o(noi, { rongO: rongNhan, vMerge, canh: { right: "single", ...(hang <= 1 ? { bottom: "single" } : {}) } });
  const duoiHang = (hang: number): Record<string, string> => (hang <= 1 ? { bottom: "single" } : {});
  const hangs: string[] = [];
  for (let hang = 0; hang < 4; hang++) {
    const cells: string[] = [];
    cells.push(hang === 0 ? nhanCot(tho("x", true), 0) : hang === 1 ? nhanCot(tho("y′", true), 1) : nhanCot(hang === 2 ? tho("y", true) : "", hang, hang === 2 ? "restart" : "continue"));
    for (let k = 0; k < ot.length; k++) {
      const c = ot[k];
      if (c.loai === "khoang") {
        const kh = ht.khoang[c.i];
        if (hang === 0) cells.push(o("", { canh: duoiHang(0) }));
        else if (hang === 1) cells.push(o(tho(kh.dau === "+" ? "+" : "\u2212"), { canh: duoiHang(1) }));
        else cells.push(o(hang === 2 ? muiTen(kh.len) : "", { vMerge: hang === 2 ? "restart" : "continue" }));
        continue;
      }
      const cot = ht.cot[c.i];
      if (cot.tc) {
        // Tiệm cận: hàng x gộp hai cột; hàng y', y có nét đôi ở giữa.
        if (hang === 0) { if (c.phan === "trai") cells.push(o(chu(cot.x), { span: 2, canh: duoiHang(0) })); continue; }
        const canh = { ...(c.phan === "trai" ? { right: "double" } : { left: "double" }), ...duoiHang(hang) };
        const noi = hang === 1 ? "" : c.phan === "trai" ? (cot.tc.traiTren === (hang === 2) ? chu(cot.tc.trai) : "") : (cot.tc.phaiTren === (hang === 2) ? chu(cot.tc.phai) : "");
        cells.push(o(noi, { canh }));
        continue;
      }
      cells.push(o(hang === 0 ? chu(cot.x) : hang === 1 ? tho(cot.dau) : chu(hang === 2 ? cot.tren : cot.duoi), { canh: duoiHang(hang) }));
    }
    hangs.push(`<w:tr>${cells.join("")}</w:tr>`);
  }
  const luoi = [rongNhan, ...ot.map(() => rong)].map((w) => `<w:gridCol w:w="${w}"/>`).join("");
  const vienBang = ["top", "left", "bottom", "right"].map((k) => `<w:${k} w:val="single" w:sz="6" w:space="0" w:color="000000"/>`).join("");
  return `<w:tbl><w:tblPr><w:tblW w:w="${RONG_BANG}" w:type="dxa"/><w:jc w:val="center"/><w:tblBorders>${vienBang}<w:insideH w:val="nil"/><w:insideV w:val="nil"/></w:tblBorders><w:tblLayout w:type="fixed"/></w:tblPr><w:tblGrid>${luoi}</w:tblGrid>${hangs.join("")}</w:tbl>`;
}

/** Bảng biến thiên → HTML (xem trước ở bước duyệt): mũi tên chiếm cả hai hàng y. */
export function bbtHtml(ht: BbtHienThi): string {
  const td = (s: string, cls = "", rs = 1) => `<td class="${cls}"${rs > 1 ? ` rowspan="${rs}"` : ""}>${nhanChu(s)}</td>`;
  const hang = (ten: string, f: (c: CotHT) => string, k: (i: number) => string, cls = "") =>
    `<tr class="${cls}"><th>${ten}</th>${ht.cot.map((c, i) => f(c) + (i < ht.khoang.length ? k(i) : "")).join("")}</tr>`;
  const giaTri = (c: CotHT, tren: boolean) => (c.tc
    ? td(`${(c.tc.traiTren === tren) ? c.tc.trai : ""} ‖ ${(c.tc.phaiTren === tren) ? c.tc.phai : ""}`)
    : td(tren ? c.tren : c.duoi));
  return `<table class="bbt">${[
    hang("x", (c) => td(c.x), () => td("")),
    hang("y′", (c) => td(c.dau), (i) => td(ht.khoang[i].dau === "+" ? "+" : "−")),
    `<tr><th rowspan="2">y</th>${ht.cot.map((c, i) => giaTri(c, true) + (i < ht.khoang.length ? td(ht.khoang[i].len ? "↗" : "↘", "mui-ten", 2) : "")).join("")}</tr>`,
    `<tr>${ht.cot.map((c) => giaTri(c, false)).join("")}</tr>`,
  ].join("")}</table>`;
}
