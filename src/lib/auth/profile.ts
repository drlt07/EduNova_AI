import type { Role, User } from "@/lib/domain/types";

export interface ProfileRow {
  id: string;
  role: Role;
  full_name: string;
  email: string;
  /** Đã xác nhận vai trò (cột có từ migration role_choice; thiếu cột thì coi như đã chọn). */
  role_chosen?: boolean;
}

/** Tài khoản mới chưa xác nhận Giáo viên hay Học sinh: phải qua trang chọn vai trò trước khi vào khu vực. */
export const needsRoleChoice = (p: Pick<ProfileRow, "role" | "role_chosen"> | null | undefined) => !!p && p.role === "student" && p.role_chosen === false;

/** Hồ sơ trong bảng profiles → người dùng của giao diện (màu avatar suy ra ổn định từ id). */
export function profileToUser(p: ProfileRow): User {
  let h = 0;
  for (const ch of p.id) h = (h * 31 + ch.charCodeAt(0)) % 360;
  return { id: p.id, role: p.role, name: p.full_name, email: p.email, hue: h };
}
