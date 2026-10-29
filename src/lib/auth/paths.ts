import type { Role } from "@/lib/domain/types";

export const ROLE_HOME: Record<Role, string> = { teacher: "/teacher/dashboard", student: "/student/courses", admin: "/admin" };

/**
 * Trang công khai nhưng là chức năng (mở mô phỏng, chương trình, bài học): phải đăng nhập mới dùng được.
 * Riêng danh sách Kho mô phỏng (/labs) khách vẫn xem được.
 * Trang chủ, Giới thiệu, Hướng dẫn, Chính sách, Đăng nhập/Đăng ký vẫn mở cho khách.
 */
export const GATED_PREFIXES = ["/labs", "/curriculum", "/explore", "/bai-hoc"];
/** Trang danh sách khách xem được (kho mô phỏng); mở một mô phỏng cụ thể vẫn cần đăng nhập. */
const OPEN_INDEX = new Set(["/labs"]);

export function isGatedPath(pathname: string) {
  if (OPEN_INDEX.has(pathname)) return false;
  return GATED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/** Khu vực theo vai trò của đường dẫn (/teacher/..., /student/..., /admin/...). */
export function roleArea(pathname: string): Role | null {
  const m = /^\/(teacher|student|admin)(?:\/|$)/.exec(pathname);
  return m ? (m[1] as Role) : null;
}

/** Đường dẫn quay lại sau đăng nhập: chỉ nhận đường nội bộ, thuộc chức năng công khai hoặc đúng khu vực vai trò. */
export function safeNext(next: string | null | undefined, role: Role): string | null {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.includes("\\")) return null;
  const path = next.split(/[?#]/)[0];
  return isGatedPath(path) || roleArea(path) === role ? next : null;
}

/** Đường dẫn nội bộ an toàn cho redirect sau xác nhận email / đặt lại mật khẩu. */
export function safeInternal(next: string | null | undefined, fallback = "/"): string {
  return next && next.startsWith("/") && !next.startsWith("//") && !next.includes("\\") ? next : fallback;
}
