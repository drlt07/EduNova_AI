/**
 * Kiểm tra tự động file Word đã xuất (bước 5). Mỗi loại lỗi một hàm để test riêng.
 */
import PizZip from "pizzip";
import { DOMParser } from "@xmldom/xmldom";
import type { DoanGoc } from "../kieu";
import { loiLatex } from "../6-xuat-file/cong-thuc";
import { dongChu } from "../2-lua-chon/thong-tin";

/** Các cụm chữ cần còn nguyên: bảng so theo từng ô, đoạn thường so phần chữ giữa các công thức. */
function cumCanGiu(d: DoanGoc): string[] {
  const chuan = (s: string) => s.replace(/^\s*[-+•–]\s+/, "").replace(/\s+/g, " ").trim();
  const nguon = /^\s*<table/i.test(d.html) ? dongChu(d.html) : [d.vanBan];
  return nguon.flatMap((s) => s.split(/\$[^$]*\$/)).map(chuan).filter((c) => c.length > 3);
}

export type LoiKiemTra = { loai: string; noiDung: string; nghiem: boolean };

const W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";

export type FileDaXuat = { xml: string; styles: string; doanChu: string[] };

/** Đọc document.xml và lấy chữ theo từng đoạn (bỏ phần công thức). */
export function docFileDaXuat(duLieu: Uint8Array): FileDaXuat {
  const zip = new PizZip(duLieu);
  const xml = zip.file("word/document.xml")!.asText();
  const styles = zip.file("word/styles.xml")?.asText() ?? "";
  const doc = new DOMParser().parseFromString(xml, "text/xml");
  const ps = Array.from(doc.getElementsByTagNameNS(W, "p"));
  const doanChu = ps.map((p) => Array.from(p.getElementsByTagNameNS(W, "t")).map((t) => t.textContent ?? "").join(""));
  return { xml, styles, doanChu };
}

export function kiemTraXmlHopLe(xml: string): LoiKiemTra[] {
  const loi: string[] = [];
  new DOMParser({ onError: (_l: string, m: string) => loi.push(m) } as never).parseFromString(xml, "text/xml");
  return loi.length ? [{ loai: "xml", noiDung: `File Word không hợp lệ: ${loi[0]}`, nghiem: true }] : [];
}

/** Còn ngoặc [ ] (trừ "[Chèn hình: …]") hoặc "......". */
export function kiemTraChoTrong(doanChu: string[]): LoiKiemTra[] {
  const kq: LoiKiemTra[] = [];
  for (const d of doanChu) {
    const boHinh = d.replace(/\[Chèn hình:[^\]]*\]/g, "");
    if (/\[[^\]]*\]/.test(boHinh) && !/\[\s*-?\d|\d\s*\]/.test(boHinh)) kq.push({ loai: "cho_trong", noiDung: `Còn chỗ trống [ ]: “${d.slice(0, 80)}”`, nghiem: true });
    if (/\.{4,}|…{2,}/.test(d)) kq.push({ loai: "cho_trong", noiDung: `Còn dấu chấm chờ điền: “${d.slice(0, 80)}”`, nghiem: true });
  }
  return kq;
}

/** Không chọn AI thì không được có chữ AI, câu lệnh, phiếu kiểm chứng. */
export function kiemTraTuKhoaAi(doanChu: string[], coAi: boolean): LoiKiemTra[] {
  if (coAi) return [];
  return doanChu
    // "AI" phân biệt hoa thường để không nhầm với từ "ai" (đại từ).
    .filter((d) => /\bAI\b/.test(d) || /trí tuệ nhân tạo|câu lệnh|phiếu kiểm chứng|chatbot/i.test(d))
    .map((d) => ({ loai: "ai", noiDung: `Có nhắc AI dù không chọn tích hợp AI: “${d.slice(0, 80)}”`, nghiem: true }));
}

/** Kí hiệu đầu dòng gõ tay còn sót (mẫu đã tự thêm "-" và "+"). */
export function kiemTraKiHieuDauDong(doanChu: string[]): LoiKiemTra[] {
  return doanChu
    .filter((d) => /^\s*[•●▪■◦]/.test(d))
    .map((d) => ({ loai: "dau_dong", noiDung: `Kí hiệu đầu dòng thừa: “${d.slice(0, 60)}”`, nghiem: false }));
}

/** Nền tảng, hình thức không được chọn mà vẫn xuất hiện. */
export function kiemTraTenKhongChon(doanChu: string[], daChon: string[], tatCaGoiY: string[]): LoiKiemTra[] {
  const chu = doanChu.join("\n");
  return tatCaGoiY
    .filter((t) => !daChon.some((c) => c.toLowerCase() === t.toLowerCase()) && new RegExp(`\\b${t}\\b`, "i").test(chu))
    .map((t) => ({ loai: "khong_chon", noiDung: `Có tên “${t}” dù thầy/cô không chọn.`, nghiem: true }));
}

/** Đoạn của GV phải còn nguyên văn trong file (so phần chữ, bỏ công thức). */
export function kiemTraGiuNguyen(doanGoc: DoanGoc[], doanChu: string[]): LoiKiemTra[] {
  const tat = doanChu.join("\n").replace(/\s+/g, " ");
  return doanGoc
    .filter((d) => d.loai !== "TD" && d.loai !== "KH" && cumCanGiu(d).some((c) => !tat.includes(c)))
    .map((d) => ({ loai: "mat_noi_dung", noiDung: `Thiếu hoặc sai đoạn ${d.ma} của thầy/cô: “${d.vanBan.slice(0, 60)}”`, nghiem: true }));
}

/** Mọi đoạn dùng style có trong mẫu; mọi run chữ dùng Times New Roman. */
export function kiemTraDinhDang(f: FileDaXuat): LoiKiemTra[] {
  const kq: LoiKiemTra[] = [];
  const coStyle = new Set([...f.styles.matchAll(/w:styleId="([^"]+)"/g)].map((m) => m[1]));
  for (const m of new Set([...f.xml.matchAll(/<w:pStyle w:val="([^"]+)"/g)].map((x) => x[1]))) {
    if (!coStyle.has(m)) kq.push({ loai: "dinh_dang", noiDung: `Style “${m}” không có trong mẫu.`, nghiem: true });
  }
  const phong = [...f.xml.matchAll(/w:ascii="([^"]+)"/g)].map((m) => m[1]).filter((p) => p !== "Times New Roman");
  if (phong.length) kq.push({ loai: "dinh_dang", noiDung: `Có phông khác Times New Roman: ${[...new Set(phong)].join(", ")}.`, nghiem: true });
  return kq;
}

/** Công thức $...$ trong đoạn bổ sung phải là LaTeX hợp lệ. */
export function kiemTraLatex(chuoi: string[]): LoiKiemTra[] {
  const kq: LoiKiemTra[] = [];
  for (const s of chuoi) {
    for (const m of s.matchAll(/\$([^$]+)\$/g)) {
      const l = loiLatex(m[1]);
      if (l) kq.push({ loai: "latex", noiDung: `Công thức lỗi “${m[1]}”: ${l}`, nghiem: true });
    }
    if (/[²³√∑∫]/.test(s.replace(/\$[^$]*\$/g, ""))) kq.push({ loai: "latex", noiDung: `Có kí tự công thức ngoài $...$: “${s.slice(0, 60)}”`, nghiem: false });
  }
  return kq;
}

/** Tỉ lệ nội dung của GV được giữ nguyên trong bài soạn mới (theo số chữ). */
export function tiLeGiuNguyen(doanGoc: DoanGoc[], doanChu: string[]): number {
  const cua = doanGoc.filter((d) => d.loai !== "TD" && d.loai !== "KH");
  const tong = cua.reduce((s, d) => s + d.vanBan.length, 0);
  if (!tong) return 0;
  const tat = doanChu.join("\n").replace(/\s+/g, " ");
  const con = cua.filter((d) => cumCanGiu(d).every((c) => tat.includes(c))).reduce((s, d) => s + d.vanBan.length, 0);
  return Math.round((con / tong) * 100);
}

export type KetQuaKiemTra = { loi: LoiKiemTra[]; tiLeGiuNguyen: number };

export function kiemTraFileXuat(duLieu: Uint8Array, doanGoc: DoanGoc[], tuyChon: { coAi: boolean; nenTangChon: string[]; nenTangGoiY: string[] }): KetQuaKiemTra {
  const f = docFileDaXuat(duLieu);
  const loi = [
    ...kiemTraXmlHopLe(f.xml),
    ...kiemTraChoTrong(f.doanChu),
    ...kiemTraTuKhoaAi(f.doanChu, tuyChon.coAi),
    ...kiemTraKiHieuDauDong(f.doanChu),
    ...kiemTraTenKhongChon(f.doanChu, tuyChon.nenTangChon, tuyChon.nenTangGoiY),
    ...kiemTraGiuNguyen(doanGoc, f.doanChu),
    ...kiemTraDinhDang(f),
  ];
  return { loi, tiLeGiuNguyen: tiLeGiuNguyen(doanGoc, f.doanChu) };
}

/** Tên nền tảng hay gặp để phát hiện tên không được chọn (chỉ dùng để kiểm tra). */
export const NEN_TANG_HAY_GAP = ["EduNext", "Quizizz", "Azota", "Kahoot", "Google Forms", "Padlet", "Canva", "Shub", "OLM", "K12Online", "Mentimeter"];
