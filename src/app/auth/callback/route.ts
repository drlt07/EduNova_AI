import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { supabaseServer } from "@/lib/supabase/server";
import { AUTH_MODE } from "@/lib/supabase/config";
import { safeInternal } from "@/lib/auth/paths";

/**
 * Đích của liên kết trong thư (xác nhận email, đặt lại mật khẩu): đổi mã thành phiên đăng nhập rồi chuyển tiếp.
 * Hỗ trợ cả luồng PKCE (?code=) và mẫu thư dùng token_hash (?token_hash=&type=).
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const next = safeInternal(url.searchParams.get("next"), "/");
  if (AUTH_MODE !== "supabase") return NextResponse.redirect(new URL("/login", url));

  const supabase = await supabaseServer();
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  const { error } = code
    ? await supabase.auth.exchangeCodeForSession(code)
    : tokenHash && type
      ? await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
      : { error: new Error("missing code") };

  if (error) return NextResponse.redirect(new URL("/login?link=expired", url));
  return NextResponse.redirect(new URL(next, url));
}
