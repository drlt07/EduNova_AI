import type { Role, User } from "@/lib/domain/types";

export interface ProfileRow {
  id: string;
  role: Role;
  full_name: string;
  email: string;
}

/** Hồ sơ trong bảng profiles → người dùng của giao diện (màu avatar suy ra ổn định từ id). */
export function profileToUser(p: ProfileRow): User {
  let h = 0;
  for (const ch of p.id) h = (h * 31 + ch.charCodeAt(0)) % 360;
  return { id: p.id, role: p.role, name: p.full_name, email: p.email, hue: h };
}
