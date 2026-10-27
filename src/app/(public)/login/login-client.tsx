"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { GraduationCap, Lock, LogIn, Shield, UserRound } from "lucide-react";
import { useApp } from "@/lib/store/app-store";
import { useHydrated } from "@/lib/store/hooks";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/misc";
import { ROLE_HOME, ROLE_LABEL } from "@/components/layout/nav-config";
import { isGatedPath } from "@/components/layout/login-gate";
import type { Role } from "@/lib/domain/types";

const ACCOUNTS = [
  { id: "t1", desc: "Dạy Tin lớp 10A1, 11A2, 12A3", icon: GraduationCap },
  { id: "s1", desc: "Học sinh lớp 10A1", icon: UserRound },
  { id: "a1", desc: "Quản trị nội dung & tài khoản", icon: Shield },
  { id: "t2", desc: "Giáo viên lớp 10A2", icon: GraduationCap },
  { id: "s16", desc: "Học sinh lớp 10A2", icon: UserRound },
];

export function LoginClient() {
  const params = useSearchParams();
  const preferred = params.get("role");
  const router = useRouter();
  const users = useApp((s) => s.users);
  const login = useApp((s) => s.login);
  const hydrated = useHydrated();
  const next = params.get("next");

  /** Chỉ quay lại đường dẫn nội bộ: trang chức năng công khai, hoặc khu vực đúng vai trò. */
  function safeNext(role: Role) {
    if (!next || !next.startsWith("/") || next.startsWith("//")) return null;
    const path = next.split("?")[0];
    return isGatedPath(path) || path.startsWith(`/${role}`) ? next : null;
  }

  function enter(id: string) {
    const u = users.find((x) => x.id === id);
    if (!u) return;
    login(id);
    router.push(safeNext(u.role) ?? ROLE_HOME[u.role]);
  }

  return (
    <div className="max-w-2xl">
      {next && (
        <p role="status" className="mb-6 flex items-center gap-2 rounded-xl border border-cyan/30 bg-cyan/5 px-4 py-3 text-sm text-fg">
          <Lock className="size-4 shrink-0 text-cyan-fg" aria-hidden />
          Bạn cần đăng nhập để sử dụng chức năng này. Sau khi đăng nhập, bạn sẽ được đưa trở lại trang vừa chọn.
        </p>
      )}
      <section aria-labelledby="demo-h">
        <div className="flex items-center gap-2">
          <h2 id="demo-h" className="text-lg font-semibold text-fg">Chọn tài khoản dùng thử</h2>
        </div>
        <p className="mt-1 text-sm text-muted">Không cần mật khẩu. Dữ liệu chỉ lưu trên trình duyệt này.</p>
        <ul className="mt-4 grid gap-3">
          {ACCOUNTS.map((a) => {
            const u = users.find((x) => x.id === a.id);
            if (!u) return null;
            const highlight = preferred === u.role && (a.id === "t1" || a.id === "s1" || a.id === "a1");
            return (
              <li key={a.id}>
                <button
                  type="button"
                  disabled={!hydrated}
                  onClick={() => enter(a.id)}
                  data-testid={`login-${a.id}`}
                  className={cn("flex w-full items-center gap-4 rounded-2xl border bg-surface p-4 text-left transition-colors hover:border-cyan/50 disabled:opacity-60", highlight ? "border-cyan/60 ring-1 ring-cyan/30" : "border-line")}
                >
                  <Avatar user={u} size={44} />
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-fg">{u.name}</span>
                    <span className="block text-sm text-muted">{ROLE_LABEL[u.role]} · {a.desc}</span>
                  </span>
                  <LogIn className="size-5 text-cyan-fg" aria-hidden />
                </button>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
