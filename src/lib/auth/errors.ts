/** Đổi thông báo lỗi của Supabase Auth sang tiếng Việt; không lộ chi tiết kỹ thuật. */
export function authErrorVi(message: string | undefined | null): string {
  const m = (message ?? "").toLowerCase();
  if (m.includes("invalid login credentials")) return "Email hoặc mật khẩu không đúng.";
  if (m.includes("email not confirmed")) return "Bạn cần xác nhận email trước. Hãy mở thư xác nhận trong hộp thư (kể cả mục Spam).";
  if (m.includes("already registered") || m.includes("already been registered")) return "Email này đã có tài khoản. Hãy đăng nhập hoặc dùng Quên mật khẩu.";
  if (m.includes("password should be") || m.includes("weak password")) return "Mật khẩu chưa đủ mạnh (tối thiểu 8 ký tự, có chữ số).";
  if (m.includes("same password") || m.includes("different from the old")) return "Mật khẩu mới phải khác mật khẩu cũ.";
  if (m.includes("rate limit") || m.includes("too many")) return "Bạn thao tác quá nhanh. Vui lòng thử lại sau ít phút.";
  if (m.includes("expired") || (m.includes("invalid") && m.includes("token"))) return "Liên kết đã hết hạn hoặc không hợp lệ. Hãy yêu cầu gửi lại.";
  if (m.includes("fetch") || m.includes("network")) return "Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.";
  return "Có lỗi xảy ra. Vui lòng thử lại.";
}
