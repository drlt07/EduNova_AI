import { DOMParser, XMLSerializer } from "@xmldom/xmldom";
import type { DoanGoc, HoatDongCu, LoaiDoan, LoaiHoatDongCu, PhanTichGiaoAn } from "../kieu";
import { dongChu, trichThongTin } from "../2-lua-chon/thong-tin";

type Khoi = { html: string; vanBan: string; laTieuDe: boolean; laBang: boolean };

function vanBanCua(n: Node): string {
  return (n.textContent ?? "").replace(/\s+/g, " ").trim();
}

function laIn(n: Element): boolean {
  // Đoạn toàn chữ đậm (mammoth: <p><strong>…</strong></p>) hoặc thẻ h1–h6.
  if (/^h[1-6]$/i.test(n.nodeName)) return true;
  const chu = vanBanCua(n);
  if (!chu) return false;
  let dam = "";
  const strongs = n.getElementsByTagName("strong");
  for (let i = 0; i < strongs.length; i++) dam += strongs[i].textContent ?? "";
  return dam.replace(/\s+/g, " ").trim() === chu;
}

/** Tách HTML của mammoth thành khối: đoạn văn, mục danh sách, bảng. */
export function tachKhoi(html: string): Khoi[] {
  const doc = new DOMParser().parseFromString(`<div>${html}</div>`, "text/html");
  const goc = doc.getElementsByTagName("div")[0];
  const ser = new XMLSerializer();
  const kq: Khoi[] = [];
  const them = (n: Element, laBang = false) => {
    const vanBan = vanBanCua(n);
    const coAnh = n.getElementsByTagName("img").length > 0;
    if (!vanBan && !coAnh) return;
    const html = ser.serializeToString(n).replace(/ xmlns="http:\/\/www\.w3\.org\/1999\/xhtml"/g, "");
    kq.push({ html, vanBan, laTieuDe: !laBang && laIn(n), laBang });
  };
  const duyetDanhSach = (ds: Element) => {
    for (let li = ds.firstChild; li; li = li.nextSibling) {
      if (li.nodeType !== 1) continue;
      const el = li as Element;
      const lonCon: Element[] = [];
      for (let c = el.firstChild; c; c = c.nextSibling) {
        if (c.nodeType === 1 && /^(ul|ol)$/i.test(c.nodeName)) lonCon.push(c as Element);
      }
      lonCon.forEach((c) => el.removeChild(c));
      them(el);
      lonCon.forEach(duyetDanhSach);
    }
  };
  for (let c = goc.firstChild; c; c = c.nextSibling) {
    if (c.nodeType !== 1) continue;
    const el = c as Element;
    const ten = el.nodeName.toLowerCase();
    if (ten === "ul" || ten === "ol") duyetDanhSach(el);
    else if (ten === "table") them(el, true);
    else them(el);
  }
  return kq;
}

const MUC_LON = [
  { muc: "muc_tieu", re: /^(I|1)\s*[.\-–:]\s*mục tiêu/i },
  { muc: "thiet_bi", re: /^(II|2)\s*[.\-–:]\s*(thiết bị|chuẩn bị|đồ dùng)/i },
  // "III. Tiến trình dạy học", "IV. TỔ CHỨC CÁC HOẠT ĐỘNG", "C. Tiến trình", "TIẾN TRÌNH DẠY HỌC" (không số).
  // "Tiến trình dạy học 1: …", "Tiến trình 2." là tiêu đề hoạt động, không phải mục III.
  { muc: "tien_trinh", re: /^((III|IV|3|4|C|D)\s*[.\-–:]\s*)?(tiến trình(?!(?:\s+dạy\s+học)?\s*\d)|các hoạt động dạy học|tổ chức (các )?hoạt động|hoạt động dạy học)/i },
] as const;

function nhomMucTieu(chu: string): { nhom: "I.1" | "I.2" | "I.3"; ten: string } | null {
  const t = chu.replace(/^\s*(\d+|[a-d])\s*[.)\-–:]\s*/i, "").replace(/[:.]\s*$/, "").trim();
  if (/^(về\s+)?(kiến thức|kĩ năng|kỹ năng)/i.test(t)) return { nhom: "I.1", ten: t };
  if (/^(về\s+)?năng lực/i.test(t)) return { nhom: "I.2", ten: t };
  if (/^(về\s+)?(phẩm chất|thái độ)/i.test(t)) return { nhom: "I.3", ten: t };
  return null;
}

/** Từ chỉ giai đoạn đứng đầu tiêu đề hoạt động (khung 5512, khung 5 bước cũ). */
const GIAI_DOAN = String.raw`khởi động|mở đầu|xác định vấn đề|tạo tình huống|đặt vấn đề|hình thành kiến thức|kiến thức mới|luyện tập|vận dụng|tìm tòi|mở rộng|củng cố|dặn dò|hướng dẫn (?:về nhà|học ở nhà|tự học)`;
/** Sau chữ "hoạt động" nhận thêm các từ này ("Hoạt động tìm hiểu…"); đứng một mình thì thường là mục con. */
const GIAI_DOAN_SAU_HD = String.raw`${GIAI_DOAN}|tìm hiểu|khám phá|trải nghiệm|thực hành|đánh giá|tổng kết`;
// Đầu dòng đánh số: "1.", "2)", "A.", "IV –" (chữ thường "a)", "b)" là mục con trong hoạt động, xét riêng).
const DAU_SO = String.raw`(?:(?:\d+|[a-eđ]|[ivx]+)\s*[.):\-–]\s*)?`;
/** "Hoạt động 2", "HĐ 2.1", "HOẠT ĐỘNG II", "Hoạt động thứ 3", "Tiến trình dạy học 1": có số thứ tự. */
const HD_CO_SO = new RegExp(String.raw`^${DAU_SO}(?:hoạt động|hđ|tiến trình(?: dạy học)?)\s*(?:thứ\s*)?(\d+(?:\.\d+)*|[ivx]+)(?![\p{L}\d])`, "iu");
/** "Hoạt động khởi động", "A. KHỞI ĐỘNG", "4. Vận dụng (5 phút)", "Củng cố, dặn dò". */
const HD_GIAI_DOAN = new RegExp(String.raw`^((?:\d+|[a-eđ]|[ivx]+)\s*[.):\-–]\s*)?(?:(?:hoạt động|hđ)\s+(?:${GIAI_DOAN_SAU_HD})|(?:${GIAI_DOAN}))(?!\p{L})`, "iu");
const LA_MA: Record<string, number> = { i: 1, ii: 2, iii: 3, iv: 4, v: 5, vi: 6, vii: 7, viii: 8 };

function phanLoai(t: string): LoaiHoatDongCu {
  if (/khởi động|mở đầu|xác định vấn đề|tạo tình huống|đặt vấn đề/.test(t)) return "khoi_dong";
  if (/hình thành|kiến thức mới|tìm hiểu|khám phá|trải nghiệm/.test(t)) return "hinh_thanh";
  if (/luyện tập|thực hành/.test(t)) return "luyen_tap";
  if (/vận dụng|mở rộng|tìm tòi/.test(t)) return "van_dung";
  if (/củng cố|dặn dò|hướng dẫn|tổng kết|đánh giá|phản tư|exit ticket/.test(t)) return "cung_co";
  return "khac";
}

/**
 * Nhận diện dòng tiêu đề hoạt động trong tiến trình dạy học, dưới mọi cách viết thường gặp:
 * "Hoạt động 1: Mở đầu", "1. HOẠT ĐỘNG 1 – KHỞI ĐỘNG (5 phút)", "HĐ 2.1. Tìm hiểu…", "A. KHỞI ĐỘNG",
 * "HĐ I. Tình huống mở đầu" (khung LHĐN), "Giai đoạn 1/3" (khung 3 giai đoạn), "Củng cố, dặn dò".
 * Không nhận "Hoạt động nhóm:", "a) Mục tiêu", "3. Tổ chức thực hiện" hay câu nội dung dài.
 * `so`: số thứ tự đọc được ("2", "2.1", "II"); `laCon`: hoạt động con dạng 2.1.
 */
export function nhanDienHoatDong(chu: string, laTieuDe = false): { loai: LoaiHoatDongCu; so?: string } | null {
  const t = chu.trim().toLowerCase().replace(/\s+/g, " ");
  if (t.length > 160) return null;
  // KHBD đã theo khung 3 giai đoạn: Giai đoạn 1 (tự học) ~ hình thành kiến thức; Giai đoạn 3 ~ củng cố, sau giờ học.
  if (/^giai đoạn 1(?!\d)/.test(t)) return { loai: "hinh_thanh", so: "GĐ1" };
  if (/^giai đoạn 3(?!\d)/.test(t)) return { loai: "cung_co", so: "GĐ3" };
  const coSo = HD_CO_SO.exec(t);
  if (coSo) {
    // Tiêu đề hoạt động là dòng ngắn; dòng dài bắt đầu bằng "Hoạt động 2 …" thường là câu nội dung.
    if (t.length > 120 && !laTieuDe) return null;
    let loai = phanLoai(t);
    const so = coSo[1].toUpperCase();
    // Khung LHĐN: HĐ I–IV có tên không chứa từ giai đoạn quen thuộc.
    if (loai === "khac" && LA_MA[coSo[1].toLowerCase()]) loai = (["khoi_dong", "luyen_tap", "van_dung", "cung_co"] as const)[LA_MA[coSo[1].toLowerCase()] - 1] ?? "khac";
    return { loai, so };
  }
  const gd = HD_GIAI_DOAN.exec(t);
  if (gd) {
    const coHd = /^(?:\S+\s*)?(hoạt động|hđ)\s/.test(t.slice((gd[1] ?? "").length));
    // "a) Luyện tập …" (chữ thường) là mục con trong hoạt động, trừ khi ghi rõ "hoạt động".
    if (gd[1] && /^[a-eđ]\s*[.):\-–]/.test(chu.trim()) && !coHd) return null;
    const coDau = !!gd[1] || coHd;
    if (t.length > (coDau ? 100 : 60)) return null;
    // Không đánh số, không có chữ "hoạt động": chỉ nhận dòng tiêu đề (in đậm) hoặc "Củng cố, dặn dò".
    if (!coDau && !laTieuDe && !/^(củng cố|dặn dò|hướng dẫn)/.test(t)) return null;
    // Câu nội dung ("Vận dụng công thức để tính …. Sau đó …") không phải tiêu đề.
    const than = t.slice((gd[1] ?? "").length).replace(/\(.*?\)/g, "");
    if (!laTieuDe && /[.?!]\s*\S/.test(than)) return null;
    return { loai: phanLoai(t) };
  }
  return null;
}

/** Phân loại dòng tiêu đề hoạt động; không phải tiêu đề thì null. */
export function loaiHoatDong(chu: string): LoaiHoatDongCu | null {
  return nhanDienHoatDong(chu)?.loai ?? null;
}

/** Hết phần hoạt động: phụ lục, phiếu học tập, rút kinh nghiệm… đặt sau tiến trình. */
const HET_TIEN_TRINH = /^((IV|V|VI|VII|4|5|6|7)\s*[.\-–:]\s*)?(phụ lục|rút kinh nghiệm|điều chỉnh sau (bài|tiết) dạy|nhận xét sau (bài|tiết) dạy|hồ sơ dạy học|bổ sung, điều chỉnh)(?!\p{L})/iu;

/**
 * Các đoạn thuộc một hoạt động, kể cả hoạt động con (vd Hoạt động 2 gồm 2.1, 2.2) và tiêu đề của chúng.
 * Không gồm đoạn đi kèm sau tiến trình (phụ lục, phiếu…). Dùng khi dịch hoặc tích hợp vào đúng một hoạt động.
 */
export function doanCuaHoatDong<T extends { ma: string; loai: string; hoatDongCu?: string }>(
  pt: { doan: T[]; hoatDong: HoatDongCu[] }, ma: string,
): T[] {
  const ho = new Set([ma]);
  for (let doi = true; doi;) {
    doi = false;
    for (const h of pt.hoatDong) if (h.cha && ho.has(h.cha) && !ho.has(h.ma)) { ho.add(h.ma); doi = true; }
  }
  const trong = new Set(pt.hoatDong.filter((h) => ho.has(h.ma)).flatMap((h) => h.doan));
  // Tiêu đề hoạt động con nằm giữa nội dung hoạt động cha; tiêu đề của chính hoạt động không lấy (đã có tên).
  return pt.doan.filter((d) => trong.has(d.ma) || (d.loai === "TD" && d.hoatDongCu !== ma && !!d.hoatDongCu && ho.has(d.hoatDongCu)));
}

const LA_CAU_HOI = /^(câu|bài)\s*\d+\s*[.:)]/i;

/** Mục con trong một hoạt động (mẫu 5512 và cách viết thường gặp), không phải tên hoạt động. */
const MUC_CON = /^(mục tiêu|nội dung|sản phẩm|tổ chức|chuẩn bị|yêu cầu|đánh giá|(câu|bài|ví dụ|phiếu|bước)\s*\d|nhiệm vụ|gv|hs|giáo viên|học sinh|kết luận|lưu ý|ghi chú)(?!\p{L})/iu;
const DANH_SO = /^\s*(\d+|[IVX]+|[A-E])\s*[.):\-–]\s*(\S.*)$/;
const SO_LA_MA = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];

/**
 * Tiến trình không ghi chữ "Hoạt động" mà chỉ đánh số "1. …", "2. …", "3. …" (hoặc I, II…; A, B…): lấy dãy đánh số
 * liên tiếp từ 1 dài nhất (ít nhất 2 mục, dòng ngắn, không phải mục con như "1. Mục tiêu") làm tên hoạt động.
 * Loại hoạt động theo tên; không rõ thì theo vị trí (đầu: khởi động, cuối: vận dụng, giữa: hình thành/luyện tập).
 */
function suyRaHoatDongDanhSo(doan: DoanGoc[], hoatDong: HoatDongCu[]): void {
  // Ứng viên: đoạn tiến trình thường, hoặc tiêu đề hoạt động đã nhận (không lấy tiêu đề mục lớn).
  const tieuDeHd = new Set(hoatDong.map((h) => doan.find((d) => d.loai === "TD" && d.hoatDongCu === h.ma)?.ma));
  const ung = doan.filter((d) => d.muc === "tien_trinh" && (d.loai !== "TD" || tieuDeHd.has(d.ma)) && !d.html.startsWith("<table") && d.vanBan.length <= 100)
    .map((d) => ({ d, m: DANH_SO.exec(d.vanBan) }))
    .filter((x): x is { d: DoanGoc; m: RegExpExecArray } => !!x.m && !MUC_CON.test(x.m[2]) && !/[.?!]\s*\S/.test(x.m[2].replace(/\(.*?\)/g, "")));
  const thuTu = (k: string) => (/^\d+$/.test(k) ? Number(k) : SO_LA_MA.includes(k) ? SO_LA_MA.indexOf(k) + 1 : k.length === 1 ? k.charCodeAt(0) - 64 : NaN);
  const kieu = (k: string) => (/^\d+$/.test(k) ? "so" : SO_LA_MA.includes(k) && k !== "C" ? "la_ma" : "chu");
  // Ưu tiên dòng in đậm cả dòng (tên hoạt động), để "1., 2." của mục con bên trong không bị lấy nhầm.
  const inDam = (d: DoanGoc) => /^<(p|h\d)[^>]*>\s*<strong>.*<\/strong>\s*<\/(p|h\d)>$/s.test(d.html);
  const chonDay = (nguon: typeof ung) => {
    let tot: typeof ung = [];
    for (const k of ["so", "la_ma", "chu"]) {
      const ds = nguon.filter((x) => kieu(x.m[1]) === k);
    // Dãy 1, 2, 3… liên tiếp theo thứ tự xuất hiện.
    const day: typeof ung = [];
      for (const x of ds) if (thuTu(x.m[1]) === day.length + 1) day.push(x);
      if (day.length > tot.length) tot = day;
    }
    return tot;
  };
  const dam = chonDay(ung.filter((x) => inDam(x.d)));
  const tot = dam.length >= 2 ? dam : chonDay(ung);
  // Đã nhận đủ hoạt động theo tiêu đề thì giữ; chỉ dựng lại khi dãy đánh số dài hơn và chứa mọi tiêu đề đã nhận
  // (vd "I. Ôn bài cũ / II. Luyện tập / III. Mở rộng": hai mục sau có từ giai đoạn, mục đầu thì không).
  if (tot.length < 2 || tot.length <= hoatDong.length || [...tieuDeHd].some((m) => !tot.some((x) => x.d.ma === m))) return;
  hoatDong.length = 0;
  for (const d of doan) if (d.muc === "tien_trinh") delete d.hoatDongCu;
  const n = tot.length;
  tot.forEach((x, i) => {
    let loai = phanLoai(x.d.vanBan.toLowerCase());
    if (loai === "khac") loai = i === 0 ? "khoi_dong" : i === n - 1 && n >= 3 ? "van_dung" : i === n - 2 && n >= 4 ? "luyen_tap" : "hinh_thanh";
    x.d.loai = "TD";
    hoatDong.push({ ma: `HDC-${i + 1}`, ten: x.d.vanBan, loai, doan: [], so: x.m[1] });
  });
  // Gán đoạn tiến trình cho hoạt động gần nhất phía trên; đoạn trước hoạt động đầu thuộc hoạt động đầu.
  // Sau "Phụ lục", "Rút kinh nghiệm": đoạn đi kèm hoạt động cuối (kem), không thuộc nội dung hoạt động.
  let hd = -1, sau = false;
  for (const d of doan) {
    if (d.muc !== "tien_trinh") continue;
    const k = tot.findIndex((x) => x.d === d);
    if (k >= 0) { hd = k; sau = false; d.hoatDongCu = hoatDong[k].ma; continue; }
    if (d.loai === "TD" && hd < 0) continue;
    if (hd >= 0 && d.vanBan.length <= 70 && HET_TIEN_TRINH.test(d.vanBan.trim())) sau = true;
    const h = hoatDong[Math.max(hd, 0)];
    d.hoatDongCu = h.ma;
    if (sau) (h.kem ??= []).push(d.ma); else h.doan.push(d.ma);
  }
}

export function phanTichGiaoAn(html: string, tenFile = ""): PhanTichGiaoAn {
  const khoi = tachKhoi(html);
  const dem: Record<LoaiDoan, number> = { MT: 0, TB: 0, HD: 0, CH: 0, TD: 0, KH: 0 };
  const ma = (loai: LoaiDoan) => `${loai}-${String(++dem[loai]).padStart(2, "0")}`;

  const doan: DoanGoc[] = [];
  const hoatDong: HoatDongCu[] = [];
  const canhBao: string[] = [];
  let muc: DoanGoc["muc"] = "dau_bai";
  let nhom: { nhom: "I.1" | "I.2" | "I.3"; ten: string } | null = null;
  let hdHienTai: HoatDongCu | null = null;

  // Sau tiêu đề phụ lục / rút kinh nghiệm: đoạn đi kèm hoạt động cuối (không thuộc nội dung hoạt động).
  let sauTienTrinh = false;
  for (const k of khoi) {
    // Tiêu đề có thể in đậm bằng kiểu đoạn (style) của Word thay vì in đậm từng chữ: nhận theo mẫu chữ khi dòng ngắn.
    const ngan = !k.laBang && k.vanBan.length <= 70;
    let mucMoi = k.laTieuDe || ngan ? MUC_LON.find((m) => m.re.test(k.vanBan)) : undefined;
    // Trong tiến trình: "1. Mục tiêu", "2. Chuẩn bị", "3. Tổ chức thực hiện" là mục con của hoạt động.
    if (mucMoi && muc === "tien_trinh" && !/^(I|II|III|IV|V)\s*[.\-–:]/.test(k.vanBan.trim())) mucMoi = undefined;
    if (mucMoi && muc === "tien_trinh" && mucMoi.muc === "tien_trinh") mucMoi = undefined;
    if (mucMoi) {
      muc = mucMoi.muc;
      nhom = null;
      hdHienTai = null;
      doan.push({ ma: ma("TD"), loai: "TD", html: k.html, vanBan: k.vanBan, muc });
      continue;
    }
    if (muc === "muc_tieu" && (k.laTieuDe || (!k.laBang && k.vanBan.length <= 50 && /^\s*\d+\s*[.)]/.test(k.vanBan)))) {
      const n = nhomMucTieu(k.vanBan);
      if (n) {
        nhom = n;
        doan.push({ ma: ma("TD"), loai: "TD", html: k.html, vanBan: k.vanBan, muc });
        continue;
      }
    }
    if (muc === "tien_trinh" && !k.laBang && /^giai đoạn 2\b/i.test(k.vanBan) && k.vanBan.length <= 160) {
      // Tiêu đề "Giai đoạn 2: Hoạt động trên lớp" chỉ là tiêu đề nhóm, không phải nội dung.
      hdHienTai = null;
      doan.push({ ma: ma("TD"), loai: "TD", html: k.html, vanBan: k.vanBan, muc });
      continue;
    }
    const nhan = k.laBang ? null : nhanDienHoatDong(k.vanBan, k.laTieuDe);
    // Không nhận ra mục III nhưng gặp "Hoạt động 1…" sau phần mục tiêu, thiết bị: đã sang tiến trình.
    if (nhan?.so && /^\d+$|^I$/.test(nhan.so) && muc !== "tien_trinh" && muc !== "dau_bai") muc = "tien_trinh";
    if (muc === "tien_trinh" && hoatDong.length && !k.laBang && (k.laTieuDe || ngan) && HET_TIEN_TRINH.test(k.vanBan.trim())) sauTienTrinh = true;
    if (muc === "tien_trinh" && nhan && !(sauTienTrinh && !nhan.so)) {
      sauTienTrinh = false;
      // Hoạt động con "2.1" thuộc hoạt động "2" gần nhất; loại "khac" lấy theo hoạt động cha.
      const soCha = nhan.so?.includes(".") ? nhan.so.split(".").slice(0, -1).join(".") : undefined;
      const cha = soCha ? [...hoatDong].reverse().find((h) => h.so === soCha) : undefined;
      hdHienTai = {
        ma: `HDC-${hoatDong.length + 1}`, ten: k.vanBan, loai: nhan.loai === "khac" && cha ? cha.loai : nhan.loai, doan: [],
        ...(nhan.so ? { so: nhan.so } : {}), ...(cha ? { cha: cha.ma } : {}),
      };
      hoatDong.push(hdHienTai);
      const d: DoanGoc = { ma: ma("TD"), loai: "TD", html: k.html, vanBan: k.vanBan, muc, hoatDongCu: hdHienTai.ma };
      doan.push(d);
      continue;
    }

    let loai: LoaiDoan;
    if (muc === "dau_bai") loai = "KH";
    else if (muc === "muc_tieu") loai = k.laTieuDe ? "TD" : "MT";
    else if (muc === "thiet_bi") loai = k.laTieuDe ? "TD" : "TB";
    else loai = LA_CAU_HOI.test(k.vanBan) ? "CH" : "HD";

    const d: DoanGoc = { ma: ma(loai), loai, html: k.html, vanBan: k.vanBan, muc };
    if (loai === "MT") {
      if (nhom) {
        d.nhomMucTieu = nhom.nhom;
        d.tenNhomCu = nhom.ten;
      } else {
        d.nhomMucTieu = "I.1";
      }
    }
    if (muc === "tien_trinh" && hdHienTai) {
      d.hoatDongCu = hdHienTai.ma;
      if (sauTienTrinh) (hdHienTai.kem ??= []).push(d.ma);
      else hdHienTai.doan.push(d.ma);
    }
    doan.push(d);
  }

  // Đoạn tiến trình chưa thuộc hoạt động nào: gắn vào hoạt động liền sau (hoặc liền trước) để không rơi mất khi chuyển khung.
  for (let i = 0; i < doan.length; i++) {
    const d = doan[i];
    if (d.muc !== "tien_trinh" || d.loai === "TD" || d.hoatDongCu) continue;
    const ke = doan.slice(i + 1).find((x) => x.hoatDongCu) ?? [...doan.slice(0, i)].reverse().find((x) => x.hoatDongCu);
    const h = ke && hoatDong.find((x) => x.ma === ke.hoatDongCu);
    if (!h) continue;
    d.hoatDongCu = h.ma;
    const viTri = h.doan.findIndex((m) => doan.findIndex((x) => x.ma === m) > i);
    h.doan.splice(viTri < 0 ? h.doan.length : viTri, 0, d.ma);
  }

  suyRaHoatDongDanhSo(doan, hoatDong);

  const tenCu = new Set(doan.filter((d) => d.tenNhomCu).map((d) => d.tenNhomCu!));
  for (const t of tenCu) {
    if (/kĩ năng|kỹ năng/i.test(t)) canhBao.push(`Mục tiêu "${t}" được xếp vào I.1 Kiến thức, kĩ năng; giữ nguyên chữ của thầy/cô.`);
    if (/thái độ/i.test(t)) canhBao.push(`Mục tiêu "${t}" được xếp vào I.3 Phẩm chất; Chương trình GDPT 2018 dùng thuật ngữ "phẩm chất".`);
  }
  if (!doan.some((d) => d.loai === "MT")) canhBao.push("Không tìm thấy mục I. Mục tiêu. Thầy/cô kiểm tra lại cách đánh số mục.");
  if (hoatDong.length === 0) canhBao.push("Không nhận ra các hoạt động dạy học. Thầy/cô kiểm tra tiêu đề các hoạt động (vd: Hoạt động 1: Khởi động).");

  return { thongTin: trichThongTin(dongChu(html), tenFile), doan, hoatDong, canhBao };
}
