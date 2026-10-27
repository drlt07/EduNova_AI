"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { GraduationCap, LogIn, Shield, UserRound } from "lucide-react";
import { useApp } from "@/lib/store/app-store";
import { useHydrated } from "@/lib/store/hooks";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/misc";
import { ROLE_HOME, ROLE_LABEL } from "@/components/layout/nav-config";

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

  function enter(id: string) {
    const u = users.find((x) => x.id === id);
    if (!u) return;
    login(id);
    router.push(next && next.startsWith(`/${u.role}`) ? next : ROLE_HOME[u.role]);
  }

  return (
    <div className="max-w-2xl">
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
