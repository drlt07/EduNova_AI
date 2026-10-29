"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock } from "lucide-react";
import { useApp } from "@/lib/store/app-store";
import { ROLE_HOME } from "@/components/layout/nav-config";
import { safeNext as safeNextFor } from "@/lib/auth/paths";
import { AUTH_MODE } from "@/lib/supabase/config";
import { PasswordLogin } from "@/components/auth/password-login";
import { LocalLogin } from "@/components/auth/local-login";
import type { Role } from "@/lib/domain/types";


export function LoginClient() {
  const params = useSearchParams();
  const router = useRouter();
  const users = useApp((s) => s.users);
  const login = useApp((s) => s.login);
  const next = params.get("next");

  /** Chỉ quay lại đường dẫn nội bộ: trang chức năng công khai, hoặc khu vực đúng vai trò. */
  const safeNext = (role: Role) => safeNextFor(next, role);

  function enter(id: string) {
    const u = users.find((x) => x.id === id);
    if (!u) return;
    login(id);
    router.push(safeNext(u.role) ?? ROLE_HOME[u.role]);
  }

  return (
    <div>
      {next && (
        <p role="status" className="mb-6 flex items-center gap-2 rounded-xl border border-cyan/30 bg-cyan/5 px-4 py-3 text-sm text-fg">
          <Lock className="size-4 shrink-0 text-cyan-fg" aria-hidden />
          Bạn cần đăng nhập để sử dụng chức năng này. Sau khi đăng nhập, bạn sẽ được đưa trở lại trang vừa chọn.
        </p>
      )}
      {AUTH_MODE === "supabase" && params.get("link") === "expired" && (
        <p role="alert" className="mb-6 rounded-xl border border-warning/30 bg-warning/5 px-4 py-3 text-sm text-fg">Liên kết trong thư đã hết hạn hoặc đã dùng. Hãy đăng nhập, hoặc dùng Quên mật khẩu để nhận liên kết mới.</p>
      )}
      {AUTH_MODE === "supabase" ? <PasswordLogin next={next} /> : <LocalLogin onEnter={(u) => enter(u.id)} />}
    </div>
  );
}
