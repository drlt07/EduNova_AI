"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock } from "lucide-react";
import { useApp } from "@/lib/store/app-store";
import { useHydrated } from "@/lib/store/hooks";
import { ROLE_HOME } from "@/components/layout/nav-config";
import { safeNext as safeNextFor } from "@/lib/auth/paths";
import { forget, greeting, readRemembered, remember } from "@/lib/auth/remembered";
import { AUTH_MODE } from "@/lib/supabase/config";
import { AuthLayout } from "@/components/auth/auth-layout";
import { PasswordLogin } from "@/components/auth/password-login";
import { LocalLogin } from "@/components/auth/local-login";
import type { Role, User } from "@/lib/domain/types";

const hourNow = () => new Date().getHours();

export function LoginClient() {
  const params = useSearchParams();
  const router = useRouter();
  const login = useApp((s) => s.login);
  const hydrated = useHydrated();
  const [forgotten, setForgotten] = useState(false);
  const next = params.get("next");
  // Người đăng nhập gần nhất trên máy này (chỉ đọc sau khi đã chạy trên trình duyệt)
  const rem = hydrated && !forgotten ? readRemembered() : null;
  const hello = hydrated ? greeting(hourNow()) : "Xin chào";

  /** Chỉ quay lại đường dẫn nội bộ: trang chức năng công khai, hoặc khu vực đúng vai trò. */
  const safeNext = (role: Role) => safeNextFor(next, role);

  function enter(u: User, keep: boolean) {
    if (keep) remember({ email: u.email, name: u.name, hue: u.hue });
    else forget();
    login(u.id);
    router.push(safeNext(u.role) ?? ROLE_HOME[u.role]);
  }
  const switchAccount = () => { forget(); setForgotten(true); };

  const first = rem?.name.trim().split(/\s+/).at(-1);
  return (
    <AuthLayout
      eyebrow={`${hello}${first ? `, ${first}` : ""} 👋`}
      title={rem ? "Chào mừng trở lại" : "Đăng nhập vào EduNova"}
      subtitle={rem ? "Nhập mật khẩu để tiếp tục học và dạy." : "Dùng email và mật khẩu của tài khoản giáo viên hoặc học sinh."}
      foot={<>Chưa có tài khoản? <Link href="/register" className="font-semibold text-blue-fg hover:underline">Đăng ký miễn phí</Link></>}
    >
      {next && (
        <p role="status" className="mb-5 flex items-center gap-2 rounded-xl border border-cyan/30 bg-cyan/5 px-4 py-3 text-sm text-fg">
          <Lock className="size-4 shrink-0 text-cyan-fg" aria-hidden />
          Đăng nhập để dùng chức năng này. Xong em sẽ được đưa trở lại trang vừa chọn.
        </p>
      )}
      {AUTH_MODE === "supabase" && params.get("link") === "expired" && (
        <p role="alert" className="mb-5 rounded-xl border border-warning/30 bg-warning/5 px-4 py-3 text-sm text-fg">Liên kết trong thư đã hết hạn hoặc đã dùng. Hãy đăng nhập, hoặc dùng Quên mật khẩu để nhận liên kết mới.</p>
      )}
      {AUTH_MODE === "supabase"
        ? <PasswordLogin key={rem?.email ?? "new"} next={next} remembered={rem} onSwitch={switchAccount} />
        : <LocalLogin key={rem?.email ?? "new"} remembered={rem} onSwitch={switchAccount} onEnter={enter} />}
    </AuthLayout>
  );
}
