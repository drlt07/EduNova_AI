import duLieu from "@khbd/data/nls.json";
import type { ChiBaoNls, DuLieuNls } from "./nls-csv";

/** Sinh từ data/nls_*.csv bằng scripts/kiem-tra-du-lieu.ts. */
export const nls = duLieu as DuLieuNls;

/** Bậc 5 (Thông tư 02/2025) là trình độ dành cho THPT. */
export const TRINH_DO_THPT = "5";

export function coDuLieuNls(d: DuLieuNls = nls): boolean {
  return d.chiBao.length > 0;
}

export function chiBaoTheoMa(ma: string, d: DuLieuNls = nls): ChiBaoNls | undefined {
  return d.chiBao.find((c) => c.ma === ma);
}

/** Lọc chỉ báo theo trình độ, miền, thành phần, từ khóa hoặc mã. */
export function locChiBao(
  loc: { trinhDo?: string | null; mien?: string | null; thanhPhan?: string | null; tuKhoa?: string },
  d: DuLieuNls = nls,
): ChiBaoNls[] {
  const tk = boDauThuong(loc.tuKhoa ?? "").trim();
  return d.chiBao.filter((c) => {
    if (loc.trinhDo && c.trinhDo !== loc.trinhDo) return false;
    if (loc.thanhPhan && c.maThanhPhan !== loc.thanhPhan) return false;
    if (loc.mien && c.maThanhPhan.split(".")[0] !== loc.mien) return false;
    if (tk && !boDauThuong(`${c.ma} ${c.noiDung}`).includes(tk)) return false;
    return true;
  });
}

export function boDauThuong(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase();
}
