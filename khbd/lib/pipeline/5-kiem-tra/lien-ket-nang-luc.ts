import { boDauThuong } from "@khbd/lib/data/nls";
import { nangLucAi } from "@khbd/lib/data/nang-luc-ai";
import { nangLucDacThu } from "@khbd/lib/data/nang-luc-dac-thu";
import type { LuaChon } from "@khbd/lib/pipeline/2-lua-chon/lua-chon";
import type { NoiDungSoan } from "@khbd/lib/pipeline/4-sinh-noi-dung/dinh-nghia";
import { coHanhViSo } from "./kha-thi";

/**
 * Chuỗi liên kết của mỗi năng lực trong KHBD:
 * Mục tiêu năng lực → Hoạt động học → Hành vi HS → Sản phẩm → Tiêu chí đánh giá.
 * Năng lực thiếu mắt xích không được đưa vào KHBD (tránh gắn nhãn hình thức); bước kiểm tra cảnh báo cho GV.
 */
export type MatXich = "muc_tieu" | "hoat_dong" | "hanh_vi" | "san_pham" | "tieu_chi";
export const TEN_MAT_XICH: Record<MatXich, string> = {
  muc_tieu: "mục tiêu năng lực", hoat_dong: "hoạt động học", hanh_vi: "hành vi HS", san_pham: "sản phẩm", tieu_chi: "tiêu chí đánh giá",
};

export type LienKet = { loai: "dac_thu" | "nls" | "ai"; ma: string; ten: string; thieu: MatXich[]; ghiChu?: string };

/**
 * Từ chỉ hành vi của từng năng lực thành phần năng lực số (Thông tư 02/2025), để kiểm tra nhiệm vụ HS làm
 * đúng với hành vi của mã. Bảng dùng cho kiểm tra, không phải dữ liệu chuẩn.
 */
const HANH_VI_NLS: Record<string, string[]> = {
  "1.1": ["tìm kiếm", "tra cứu", "truy cập", "lọc", "khai thác"],
  "1.2": ["đánh giá", "đối chiếu", "kiểm chứng", "so sánh", "độ tin cậy", "xác minh"],
  "1.3": ["lưu", "sắp xếp", "quản lí", "quản lý", "tổ chức", "truy xuất", "thư mục"],
  "2.1": ["tương tác", "trao đổi", "giao tiếp", "nhắn", "thảo luận trực tuyến"],
  "2.2": ["chia sẻ", "trích dẫn", "ghi nguồn", "đăng tải", "nộp"],
  "2.3": ["dịch vụ số", "dịch vụ công", "công dân"],
  "2.4": ["hợp tác", "cộng tác", "cùng soạn", "cùng xây dựng", "dùng chung", "đồng sáng tạo"],
  "2.5": ["ứng xử", "góp ý", "bình luận", "phản hồi", "quy tắc"],
  "2.6": ["danh tính", "tài khoản", "danh tiếng"],
  "3.1": ["tạo", "thiết kế", "soạn", "chỉnh sửa", "trình bày", "biên tập", "dựng"],
  "3.2": ["chỉnh sửa", "tích hợp", "kết hợp", "tinh chỉnh", "cải thiện"],
  "3.3": ["bản quyền", "giấy phép", "ghi nguồn", "trích dẫn"],
  "3.4": ["lập trình", "chương trình", "câu lệnh", "lệnh", "thuật toán", "code"],
  "4.1": ["bảo vệ thiết bị", "an toàn", "bảo mật", "mật khẩu", "virus"],
  "4.2": ["dữ liệu cá nhân", "quyền riêng tư", "thông tin cá nhân", "định danh"],
  "4.3": ["sức khỏe", "an sinh", "bắt nạt", "thời gian sử dụng"],
  "4.4": ["môi trường"],
  "5.1": ["sự cố", "lỗi", "khắc phục", "xử lí", "xử lý"],
  "5.2": ["công cụ", "phần mềm", "giải pháp", "tùy chỉnh", "ứng dụng", "máy tính cầm tay"],
  "5.3": ["sáng tạo", "mô phỏng", "khám phá", "tạo ra", "mô hình", "đồ thị"],
  "5.4": ["tự đánh giá", "cải thiện", "cập nhật", "năng lực số"],
  "6.1": ["AI", "trí tuệ nhân tạo"],
  "6.2": ["AI", "trí tuệ nhân tạo"],
  "6.3": ["AI", "trí tuệ nhân tạo", "đánh giá", "kiểm chứng", "xác minh"],
};

const chuan = (s: string) => ` ${boDauThuong(s).replace(/[^a-z0-9]+/g, " ").trim()} `;

/** Nhiệm vụ (biểu hiện) có đúng hành vi của năng lực thành phần của mã không. Mã không có trong bảng: không kết luận. */
export function dungHanhViNls(ma: string, bieuHien: string): boolean {
  const ds = HANH_VI_NLS[ma.split(".").slice(0, 2).join(".")];
  if (!ds) return true;
  const vb = chuan(bieuHien);
  return ds.some((t) => (/^[A-Z]{2,}$/.test(t) ? new RegExp(`(^|[^\\p{L}])${t}([^\\p{L}]|$)`, "u").test(bieuHien) : vb.includes(chuan(t))));
}

const coChu = (s?: string) => !!s && s.trim().length > 0;

/**
 * Lập chuỗi liên kết cho các năng lực sẽ ghi vào KHBD.
 * oViTri: các vị trí (hoạt động) có trong bài; traChiBao: tra nguyên văn chỉ báo năng lực số trong dữ liệu.
 */
export function lienKetNangLuc(
  nd: NoiDungSoan, lc: LuaChon, mon: string | null, oViTri: string[], traChiBao: (ma: string) => string | undefined, coHoatDong: boolean,
): LienKet[] {
  const kq: LienKet[] = [];
  const thanhPhan = new Map((nangLucDacThu.mon.find((m) => m.ma_mon === mon)?.nang_luc ?? []).flatMap((nl) => [[nl.ma, nl.ten] as const, ...nl.thanh_phan.map((tp) => [tp.ma, tp.ten] as const)]));
  const daCo = new Set<string>();
  for (const t of nd.dac_thu?.thanhPhan ?? []) {
    if (daCo.has(t.ma)) continue;
    daCo.add(t.ma);
    const thieu: MatXich[] = [];
    if (!thanhPhan.has(t.ma)) thieu.push("muc_tieu");
    if (!oViTri.includes(t.viTri)) thieu.push("hoat_dong");
    if (!coChu(t.bieuHien)) thieu.push("hanh_vi");
    if (!coChu(t.sanPham)) thieu.push("san_pham");
    if (!coChu(t.tieuChi)) thieu.push("tieu_chi");
    kq.push({ loai: "dac_thu", ma: t.ma, ten: thanhPhan.get(t.ma) ?? t.ma, thieu });
  }
  if (lc.nls) {
    for (const ma of [...new Set(lc.maNls)]) {
      const noiDung = traChiBao(ma);
      const s = nd.nls?.nls.find((n) => n.ma === ma);
      const thieu: MatXich[] = [];
      if (!noiDung) thieu.push("muc_tieu");
      if (!s || !oViTri.includes(s.viTri)) thieu.push("hoat_dong");
      if (!s || !coChu(s.bieuHien) || !dungHanhViNls(ma, s.bieuHien) || !coHanhViSo(s.bieuHien, s.congCu ?? "")) thieu.push("hanh_vi");
      if (!s || !coChu(s.minhChung)) thieu.push("san_pham");
      if (!s || !coChu(s.tieuChi)) thieu.push("tieu_chi");
      const boQua = nd.nls?.boQua?.find((b) => b.ma === ma)?.lyDo;
      kq.push({ loai: "nls", ma, ten: noiDung ?? ma, thieu, ghiChu: boQua ?? (s && coChu(s.bieuHien) && !dungHanhViNls(ma, s.bieuHien) ? "nhiệm vụ chưa đúng hành vi của mã" : s && !coHanhViSo(s.bieuHien, s.congCu ?? "") ? "chưa có hành vi số thực tế" : undefined) });
    }
  }
  if (lc.ai) {
    // Năng lực AI: mô tả, minh chứng, tiêu chí lấy nguyên văn từ khung; hành vi là quy trình dùng AI có kiểm chứng đặt trong một hoạt động.
    for (const n of nangLucAi.nang_luc.filter((x) => !lc.maAi.length || lc.maAi.includes(x.ma))) {
      const thieu: MatXich[] = [];
      if (!coHoatDong) thieu.push("hoat_dong");
      if (!coChu(n.minh_chung)) thieu.push("san_pham");
      if (!coChu(n.tieu_chi)) thieu.push("tieu_chi");
      kq.push({ loai: "ai", ma: n.ma, ten: n.mo_ta, thieu });
    }
  }
  return kq;
}

export const duLienKet = (l: LienKet) => l.thieu.length === 0;

const TEN_LOAI = { dac_thu: "Năng lực đặc thù", nls: "Năng lực số", ai: "Năng lực AI" } as const;

/** Cảnh báo cho GV: năng lực thiếu mắt xích đã được bỏ khỏi KHBD. */
export function canhBaoLienKet(ds: LienKet[]): string[] {
  return ds.filter((l) => !duLienKet(l)).map((l) =>
    `${TEN_LOAI[l.loai]} ${l.ma}: thiếu ${l.thieu.map((m) => TEN_MAT_XICH[m]).join(", ")}${l.ghiChu ? ` (${l.ghiChu})` : ""}; đã bỏ khỏi KHBD để không gắn năng lực hình thức.`);
}
