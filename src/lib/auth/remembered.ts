/**
 * Nhớ người đăng nhập gần nhất trên thiết bị này (chỉ tên, email, màu avatar — không bao giờ lưu mật khẩu),
 * để trang đăng nhập chào "Chào mừng trở lại" và điền sẵn email. Bộ nhớ trình duyệt có thể bị chặn: mọi truy cập đều bọc try/catch.
 */
export interface Remembered { email: string; name: string; hue: number }
const KEY = "edunova-last-login";

export function readRemembered(): Remembered | null {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? "null");
    return v && typeof v.email === "string" && typeof v.name === "string" ? { email: v.email, name: v.name, hue: Number(v.hue) || 200 } : null;
  } catch { return null; }
}
export function remember(u: Remembered) {
  try { localStorage.setItem(KEY, JSON.stringify({ email: u.email, name: u.name, hue: u.hue })); } catch { /* bộ nhớ bị chặn: bỏ qua */ }
}
export function forget() {
  try { localStorage.removeItem(KEY); } catch { /* bỏ qua */ }
}

/** Lời chào theo giờ trong ngày. */
export function greeting(hour: number) {
  if (hour < 5) return "Khuya rồi, học vừa sức nhé";
  if (hour < 11) return "Chào buổi sáng";
  if (hour < 13) return "Chào buổi trưa";
  if (hour < 18) return "Chào buổi chiều";
  return "Chào buổi tối";
}
