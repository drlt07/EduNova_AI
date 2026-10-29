/**
 * Đăng nhập email + mật khẩu cho bản dùng thử (không có máy chủ): tài khoản lưu trên trình duyệt này.
 * Mật khẩu không bao giờ lưu dạng chữ thường — chỉ lưu muối + băm PBKDF2-SHA256.
 * Tài khoản mẫu (…@demo.edunova.vn) dùng chung mật khẩu DEMO_PASSWORD, hiển thị công khai trên trang đăng nhập.
 */
import type { User } from "@/lib/domain/types";

export const DEMO_PASSWORD = "edunova2026";
export const DEMO_DOMAIN = "@demo.edunova.vn";
const ITERATIONS = 100_000;

export interface LocalCredential { salt: string; hash: string }

const toHex = (buf: ArrayBuffer | Uint8Array) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
const fromHex = (hex: string) => new Uint8Array(hex.match(/../g)!.map((h) => parseInt(h, 16)));

export const normalizeEmail = (e: string) => e.trim().toLowerCase();

export async function hashPassword(password: string, saltHex?: string): Promise<LocalCredential> {
  const salt = saltHex ? fromHex(saltHex) : crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations: ITERATIONS }, key, 256);
  return { salt: toHex(salt), hash: toHex(bits) };
}

/** So sánh không dừng sớm, tránh lộ độ dài khớp qua thời gian. */
function sameHex(a: string, b: string) {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

export type LoginResult = { ok: true; user: User } | { ok: false; error: string };

/** Thông báo lỗi chung cho sai email hoặc sai mật khẩu: không tiết lộ email nào đã có tài khoản. */
export const WRONG = "Email hoặc mật khẩu không đúng.";

export async function verifyLogin(email: string, password: string, users: User[], creds: Record<string, LocalCredential>): Promise<LoginResult> {
  const e = normalizeEmail(email);
  const user = users.find((u) => normalizeEmail(u.email) === e);
  if (!user) { await hashPassword(password); return { ok: false, error: WRONG }; } // tốn thời gian như khi có tài khoản
  const cred = creds[user.id];
  if (cred) {
    const h = await hashPassword(password, cred.salt);
    return sameHex(h.hash, cred.hash) ? { ok: true, user } : { ok: false, error: WRONG };
  }
  // Tài khoản mẫu chưa đổi mật khẩu
  if (e.endsWith(DEMO_DOMAIN) && password === DEMO_PASSWORD) return { ok: true, user };
  return { ok: false, error: WRONG };
}

/** Khóa tạm sau nhiều lần sai liên tiếp (chống dò mật khẩu ngay trên máy). */
export const MAX_FAILS = 5;
export const LOCK_MS = 30_000;
