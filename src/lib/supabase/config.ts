/**
 * Cấu hình Supabase lấy từ biến môi trường (không ghi khóa vào code).
 * Có đủ URL + anon key thì dùng đăng nhập thật; thiếu thì chạy bản dùng thử (chọn tài khoản mẫu, dữ liệu trên trình duyệt).
 */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
export const AUTH_MODE: "supabase" | "demo" = SUPABASE_URL && SUPABASE_ANON_KEY ? "supabase" : "demo";
