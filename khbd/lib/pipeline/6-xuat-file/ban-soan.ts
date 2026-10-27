/**
 * Bản soạn có cấu trúc: KHBD sau khi ghép, trước khi dựng XML Word.
 * Bước biên tập (5-kiem-tra/bien-tap.ts) làm việc trên mô hình này, không trên chuỗi văn bản của file.
 */
import { bangTuDuLieu, khoiXml, type Doan, type Nguon, type TuyChonXuat } from "./xml";

/** Bảng dựng từ dữ liệu; `vai` cho biết bảng dùng vào việc gì (để kiểm tra phụ lục có được dùng không). */
export type Bang = { loai: "bang"; hang: string[][]; nguon: Nguon; rong?: number[]; vai?: "thoi_luong" | "dap_an" | "danh_gia" | "phieu_ai" | "ma_tran" };
export type Khoi = Doan | Bang;
export const laBang = (k: Khoi): k is Bang => (k as Bang).loai === "bang";

/** Trường của mẫu Word nhận phần này. */
export type TruongMau = "phuongAn" | "kienThuc" | "nangLuc" | "phamChat" | "thietBi" | "gd1" | "tienTrinh" | "gd3" | "noiDungCu" | "phuLuc" | "maTran" | "tiengAnh";
/** Vùng của KHBD dùng khi so lặp giữa các phần. */
export type VungBan = "muc_tieu" | "thiet_bi" | "tien_trinh" | "phu_luc" | "ma_tran" | "tieng_anh" | "khac";

export const VUNG_CUA_TRUONG: Record<TruongMau, VungBan> = {
  phuongAn: "khac", kienThuc: "muc_tieu", nangLuc: "muc_tieu", phamChat: "muc_tieu", thietBi: "thiet_bi",
  gd1: "tien_trinh", tienTrinh: "tien_trinh", gd3: "tien_trinh", noiDungCu: "tien_trinh",
  phuLuc: "phu_luc", maTran: "ma_tran", tiengAnh: "tieng_anh",
};

export type Phan = { truong: TruongMau; khoi: Khoi[] };

export type BanSoan = {
  cheDo: "moi" | "cu";
  monHoa: string; lop: number | string; tenBai: string; soTiet: number;
  coGd1: boolean; coGd3: boolean;
  tenMaTran: string; coAi: boolean;
  phan: Phan[];
  /** Mã đoạn của KHBD gốc không đưa vào bản soạn vì đã được thay (vd dòng năng lực gốc khi app soạn mục tiêu theo cấu trúc mới). */
  doanKhongDung?: string[];
};

export type DuLieuMau = Record<string, string | number | boolean>;

const LA_MA = ["I", "II", "III", "IV", "V", "VI", "VII"];

function khoiSangXml(ds: Khoi[], tc: TuyChonXuat): string {
  let xml = "";
  let cho: Doan[] = [];
  const day = () => { if (cho.length) xml += khoiXml(cho, tc); cho = []; };
  for (const k of ds) {
    if (laBang(k)) { day(); xml += bangTuDuLieu(k.hang, k.nguon, tc, k.rong); }
    else cho.push(k);
  }
  day();
  return xml;
}

/** Bản soạn → dữ liệu điền vào templates/mau.docx. Số mục IV, V, VI tính theo phần còn lại sau biên tập. */
export function dungDuLieuMau(ban: BanSoan, tc: TuyChonXuat): DuLieuMau {
  const truong = (t: TruongMau) => khoiSangXml(ban.phan.filter((p) => p.truong === t).flatMap((p) => p.khoi), tc);
  const co = (t: TruongMau) => ban.phan.some((p) => p.truong === t && p.khoi.length > 0);
  const so: string[] = [];
  const soMuc = (c: boolean) => { if (c) so.push(LA_MA[3 + so.length]); return c ? so[so.length - 1] : ""; };
  const coPhuLuc = co("phuLuc"), coMaTran = co("maTran"), coTiengAnh = co("tiengAnh");
  const moi = ban.cheDo === "moi";
  return {
    monHoa: ban.monHoa, lop: ban.lop, tenBai: ban.tenBai, soTiet: ban.soTiet,
    coPhuLuc, soPhuLuc: soMuc(coPhuLuc), phuLuc: truong("phuLuc"),
    coMaTran, soMaTran: soMuc(coMaTran), coAi: ban.coAi, tenMaTran: ban.tenMaTran, maTran: truong("maTran"),
    coTiengAnh, soTiengAnh: soMuc(coTiengAnh), tiengAnh: truong("tiengAnh"),
    cheDoMoi: moi, cheDoCu: !moi, noiDungCu: moi ? "" : truong("noiDungCu"),
    phuongAn: truong("phuongAn"), kienThuc: truong("kienThuc"), nangLuc: truong("nangLuc"), phamChat: truong("phamChat"), thietBi: truong("thietBi"),
    coGd1: moi && ban.coGd1, gd1: truong("gd1"), coGd2: moi, tienTrinh: truong("tienTrinh"), coGd3: moi && ban.coGd3, gd3: truong("gd3"),
  };
}

/** Chữ thuần của một đoạn (nhãn + nội dung), dùng cho kiểm tra. */
export function chuDoan(d: Doan): string {
  const noi = d.html !== undefined ? d.html.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">") : d.chu ?? "";
  return `${d.nhan ? `${d.nhan} ` : ""}${noi}`.replace(/\s+/g, " ").trim();
}

/** Mọi đoạn (không gồm bảng) của bản soạn kèm vùng, theo thứ tự trong KHBD. */
export function cacDoan(ban: BanSoan): { doan: Doan; vung: VungBan; truong: TruongMau }[] {
  return ban.phan.flatMap((p) => p.khoi.filter((k): k is Doan => !laBang(k)).map((doan) => ({ doan, vung: VUNG_CUA_TRUONG[p.truong], truong: p.truong })));
}
