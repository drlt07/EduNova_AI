/**
 * Dựng XML Word cho các đoạn nội dung (chèn vào mẫu bằng thẻ {@...}).
 * Mỗi đoạn gắn <w:pStyle> của mẫu và phông Times New Roman; định dạng còn lại do Styles của mẫu.
 */
import { DOMParser } from "@xmldom/xmldom";
import { latexSangOmml, tachCongThuc } from "./cong-thuc";
import { bbtXml, docDataUri, kichThuocHienThi, maHinh, type HinhThay, type KhoAnh } from "./hinh";

export type Nguon = "giu_nguyen" | "bo_sung";

/** Một đoạn kết quả. `html` (từ giáo án gốc) giữ in đậm, nghiêng, chỉ số; `chu` cho phần bổ sung. */
export type Doan = {
  nguon: Nguon;
  chu?: string;
  html?: string;
  cap?: 0 | 1 | 2; // 0: đoạn thường, 1: dòng "-", 2: dòng "+"
  nhan?: string; // nhãn in đậm đầu đoạn, vd "Mục tiêu:"
  kieu?: string; // style riêng, vd "TenHoatDong"
  // Thông tin cấu trúc cho bước biên tập (không in ra file).
  vai?: VaiDoan; // vai trò của đoạn trong hoạt động
  hd?: string; // hoạt động chứa đoạn (HD1…, GD1, mã hoạt động cũ)
  chucNang?: ChucNang; // đoạn thuộc chức năng tích hợp nào
  maGoc?: string; // mã đoạn của KHBD gốc (đoạn giữ nguyên)
};

export type ChucNang = "nls" | "ai" | "clil" | "tieng_anh" | "lhdn";
/** Vai trò cấu trúc của đoạn: mục bắt buộc của một hoạt động (CV 5512) và các đoạn chi tiết của bước tổ chức. */
export type VaiDoan =
  | "muc_tieu" | "to_chuc" | "cach_to_chuc" | "buoc" | "buoc_viec" | "san_pham" | "tieu_chi" | "danh_gia"
  | "tinh_huong" | "cau_hoi_mo_dau" | "nhan_dinh_dau" | "nhan_dinh" | "nhiem_vu_so" | "tieu_de";

/**
 * anh: kho ảnh của lần xuất (không có thì ảnh gốc in thành dòng nhắc chèn hình).
 * thayHinh: ảnh gốc (theo maHinh) được thay bằng bản app tạo lại đã đối chiếu khớp.
 */
export type TuyChonXuat = { danhDau: boolean; anh?: KhoAnh; thayHinh?: Map<string, HinhThay> };
/** Ngữ cảnh khi duyệt HTML: `sau` nhận bảng (bảng biến thiên, bảng tạo lại) đặt ngay sau đoạn chứa ảnh. */
type NguCanhHtml = { tc?: TuyChonXuat; sau: string[] };

const PHONG = '<w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/>';
const NEN_BO_SUNG = '<w:shd w:val="clear" w:color="auto" w:fill="DEEAF6"/>';
const STYLE_CAP = ["Normal", "ListBullet", "ListBullet2"];

export function thoat(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

type DinhDang = { dam?: boolean; nghieng?: boolean; gach?: boolean; tren?: boolean; duoi?: boolean };

function run(chu: string, dd: DinhDang, nen: boolean): string {
  if (!chu) return "";
  const rPr = [
    PHONG,
    dd.dam ? "<w:b/>" : "",
    dd.nghieng ? "<w:i/>" : "",
    dd.gach ? '<w:u w:val="single"/>' : "",
    dd.tren ? '<w:vertAlign w:val="superscript"/>' : dd.duoi ? '<w:vertAlign w:val="subscript"/>' : "",
    nen ? NEN_BO_SUNG : "",
  ].join("");
  return `<w:r><w:rPr>${rPr}</w:rPr><w:t xml:space="preserve">${thoat(chu)}</w:t></w:r>`;
}

/** Chữ có thể chứa $LaTeX$ → các run chữ và công thức Word. */
function runCoCongThuc(chu: string, dd: DinhDang, nen: boolean): string {
  return tachCongThuc(chu)
    .map((p) => {
      if (p.loai === "chu") return run(p.noiDung, dd, nen);
      try {
        return latexSangOmml(p.noiDung);
      } catch {
        return run(`$${p.noiDung}$`, dd, nen);
      }
    })
    .join("");
}

/** Duyệt HTML nội dòng (strong, em, sub, sup, u, br) thành run. */
function runTuHtml(html: string, nen: boolean, ng: NguCanhHtml = { sau: [] }): string {
  const doc = new DOMParser().parseFromString(`<div>${html}</div>`, "text/html");
  const goc = doc.getElementsByTagName("div")[0];
  const kq: string[] = [];
  const duyet = (n: Node, dd: DinhDang) => {
    for (let c = n.firstChild; c; c = c.nextSibling) {
      if (c.nodeType === 3) kq.push(runCoCongThuc((c.nodeValue ?? "").replace(/\s+/g, " "), dd, nen));
      else if (c.nodeType === 1) {
        const ten = (c as Element).nodeName.toLowerCase();
        if (ten === "br") { kq.push("<w:r><w:br/></w:r>"); continue; }
        if (ten === "img") { kq.push(anhXml((c as Element).getAttribute("src") ?? "", (c as Element).getAttribute("alt"), nen, ng)); continue; }
        duyet(c, {
          ...dd,
          dam: dd.dam || ten === "strong" || ten === "b",
          nghieng: dd.nghieng || ten === "em" || ten === "i",
          gach: dd.gach || ten === "u",
          tren: dd.tren || ten === "sup",
          duoi: dd.duoi || ten === "sub",
        });
      }
    }
  };
  duyet(goc, {});
  return kq.join("");
}

/** Ảnh của giáo án gốc: bản tạo lại (nếu có) hoặc nhúng nguyên ảnh gốc. */
function anhXml(src: string, alt: string | null, nen: boolean, ng: NguCanhHtml): string {
  const ma = maHinh(src);
  const thay = ng.tc?.thayHinh?.get(ma);
  if (thay?.loai === "cong_thuc") return runCoCongThuc(`$${thay.latex}$`, {}, nen);
  if (thay?.loai === "bbt") { ng.sau.push(bbtXml(thay.ht, (s) => runCoCongThuc(s, {}, nen))); return ""; }
  if (thay?.loai === "bang") { ng.sau.push(bangTuDuLieu(thay.hang, nen ? "bo_sung" : "giu_nguyen", ng.tc ?? { danhDau: false })); return ""; }
  if (thay?.loai === "anh" && ng.tc?.anh) {
    const x = ng.tc.anh.them(thay.mime, thay.bytes, `thay:${ma}`, { rong: thay.rong, cao: thay.cao });
    if (x) return x;
  }
  const goc = docDataUri(src);
  const x = goc && ng.tc?.anh?.them(goc.mime, goc.bytes, ma, kichThuocHienThi(alt) ?? undefined);
  return x || run("[Chèn hình: hình trong giáo án gốc]", { dam: true }, nen);
}

function doanXml(style: string, noiDung: string): string {
  return `<w:p><w:pPr><w:pStyle w:val="${style}"/></w:pPr>${noiDung}</w:p>`;
}

/** Bỏ kí hiệu đầu dòng GV đã gõ tay ("- ", "+ ", "• ") vì mẫu tự thêm theo style. */
function boKiHieuDauDong(chu: string): string {
  return chu.replace(/^\s*[-+•–]\s+/, "");
}

/** Bảng HTML (của giáo án gốc) → bảng Word kẻ khung, chữ cỡ 12. */
function bangXml(html: string, nen: boolean, tc: TuyChonXuat): string {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const hang = Array.from(doc.getElementsByTagName("tr"));
  const soCot = Math.max(...hang.map((h) => h.getElementsByTagName("td").length + h.getElementsByTagName("th").length), 1);
  const rong = Math.floor(9354 / soCot);
  const xmlHang = hang.map((h, i) => {
    const o = Array.from(h.childNodes).filter((c) => c.nodeType === 1) as Element[];
    const xmlO = o.map((td) => {
      const doanTrong = Array.from(td.getElementsByTagName("p"));
      const noi = (doanTrong.length ? doanTrong.map((p) => p.toString()) : [td.toString()])
        .map((ph) => {
          const ng: NguCanhHtml = { tc, sau: [] };
          const x = doanXml(i === 0 ? "BangTieuDe" : "BangChu", runTuHtml(ph.replace(/^<(p|td|th)[^>]*>|<\/(p|td|th)>$/g, ""), nen, ng));
          // Ô bảng phải kết thúc bằng một đoạn.
          return ng.sau.length ? x + ng.sau.join("") + "<w:p/>" : x;
        })
        .join("");
      return `<w:tc><w:tcPr><w:tcW w:w="${rong}" w:type="dxa"/></w:tcPr>${noi}</w:tc>`;
    });
    return `<w:tr>${i === 0 ? "<w:trPr><w:tblHeader/></w:trPr>" : ""}${xmlO.join("")}</w:tr>`;
  });
  const luoi = Array.from({ length: soCot }, () => `<w:gridCol w:w="${rong}"/>`).join("");
  return `<w:tbl><w:tblPr><w:tblStyle w:val="BangKeKhung"/><w:tblW w:w="5000" w:type="pct"/></w:tblPr><w:tblGrid>${luoi}</w:tblGrid>${xmlHang.join("")}</w:tbl>`;
}

/** Danh sách đoạn → XML. Đoạn giữ nguyên chép từ html gốc; đoạn bổ sung tô nền khi bản đánh dấu. */
export function khoiXml(ds: Doan[], tc: TuyChonXuat): string {
  return ds
    .map((d) => {
      const nen = tc.danhDau && d.nguon === "bo_sung";
      if (d.html && /^\s*<table/i.test(d.html)) return bangXml(d.html, nen, tc);
      const style = d.kieu ?? STYLE_CAP[d.cap ?? 0];
      const nhan = d.nhan ? run(d.nhan + " ", { dam: true }, nen) : "";
      const ng: NguCanhHtml = { tc, sau: [] };
      const noiDung = d.html !== undefined
        ? runTuHtml(d.html.replace(/^\s*<(p|li|h\d)[^>]*>|<\/(p|li|h\d)>\s*$/g, "").replace(/^(\s*(<strong>)?)\s*[-+•–]\s+/, "$1"), nen, ng)
        : runCoCongThuc(boKiHieuDauDong(d.chu ?? ""), {}, nen);
      // Đoạn chỉ có ảnh được thay bằng bảng: bỏ đoạn rỗng, chỉ giữ bảng.
      const doan = !nhan && !noiDung && ng.sau.length ? "" : doanXml(style, nhan + noiDung);
      return doan + ng.sau.join("");
    })
    .join("");
}

/** Bảng dựng từ dữ liệu (thời lượng, ma trận, thuật ngữ…): hàng đầu là tiêu đề. */
export function bangTuDuLieu(hang: string[][], nguon: Nguon, tc: TuyChonXuat, rongCot?: number[]): string {
  const nen = tc.danhDau && nguon === "bo_sung";
  const soCot = hang[0].length;
  const rong = rongCot ?? Array.from({ length: soCot }, () => Math.floor(9354 / soCot));
  const luoi = rong.map((w) => `<w:gridCol w:w="${w}"/>`).join("");
  const xmlHang = hang.map((h, i) =>
    `<w:tr>${i === 0 ? "<w:trPr><w:tblHeader/></w:trPr>" : ""}${h
      .map((o, j) => `<w:tc><w:tcPr><w:tcW w:w="${rong[j]}" w:type="dxa"/></w:tcPr>${doanXml(i === 0 ? "BangTieuDe" : "BangChu", runCoCongThuc(o, {}, nen && i > 0))}</w:tc>`)
      .join("")}</w:tr>`,
  );
  return `<w:tbl><w:tblPr><w:tblStyle w:val="BangKeKhung"/><w:tblW w:w="5000" w:type="pct"/></w:tblPr><w:tblGrid>${luoi}</w:tblGrid>${xmlHang.join("")}</w:tbl>`;
}
