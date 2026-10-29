"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Settings, ShieldAlert, UserRound, X } from "lucide-react";
import { useState } from "react";
import type { Role } from "@/lib/domain/types";
import { useCurrentUser, useHydrated } from "@/lib/store/hooks";
import { useApp } from "@/lib/store/app-store";
import { teacherClasses } from "@/lib/store/scoped";
import { todos } from "@/lib/teacher/today";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { PageSkeleton } from "@/components/ui/feedback";
import { Logo } from "./logo";
import { NAV, ROLE_HOME, ROLE_LABEL, type NavItem } from "./nav-config";
import { RoleSwitcher } from "./role-switcher";
import { NotificationBell, PrefsApplier, SearchPalette } from "@/components/student/top-bar";
import { TutorProvider } from "@/components/tutor/tutor-provider";
import { motion } from "motion/react";
import { ThemeToggle } from "./theme-toggle";

function SidebarNav({ role, onNavigate }: { role: Role; onNavigate?: () => void }) {
  const pathname = usePathname();
  const d = useApp();
  const user = useCurrentUser();
  const count = (k: NonNullable<NavItem["badge"]>) => {
    if (!user || user.role !== "teacher") return 0;
    return k === "classes" ? teacherClasses(d, user.id).length : todos(d, user.id, new Date()).length;
  };
  const groups = [...new Set(NAV[role].map((i) => i.group ?? ""))];
  return (
    <nav aria-label={`Điều hướng ${ROLE_LABEL[role]}`} className="flex flex-col gap-0.5">
      {groups.map((g) => (
        <div key={g} className={cn("flex flex-col gap-0.5", g && "mt-4 border-t border-line pt-3")}>
          {(g || role === "teacher") && <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted">{g || "Công việc chính"}</p>}
          {NAV[role].filter((i) => (i.group ?? "") === g).map((item) => {
            const under = (h: string) => pathname === h || pathname.startsWith(h + "/");
            const active = item.href === "/" ? pathname === "/" : pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href + "/")) || (item.match?.some(under) ?? false);
            const n = item.badge ? count(item.badge) : 0;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted transition-colors hover:bg-surface-2 hover:text-fg",
                  active && "bg-brand font-semibold text-brand-ink shadow-md shadow-brand/25 hover:bg-brand hover:text-brand-ink",
                )}
              >
                <item.icon className={cn("size-[18px] shrink-0", active ? "text-brand-ink" : "text-muted group-hover:text-fg")} />
                <span className="min-w-0 flex-1 truncate">{item.label}</span>
                {n > 0 && <span className={cn("rounded-full px-1.5 text-xs font-semibold tabular-nums", active ? "bg-white/20 text-brand-ink" : item.badge === "todos" ? "bg-danger text-white" : "bg-surface-2 text-muted")} aria-label={item.badge === "todos" ? `${n} việc cần làm` : `${n} lớp`}>{n}</span>}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

/** bleed: trang công khai (trang chủ, kho mô phỏng…) tự lo bề rộng và lề, nên vùng nội dung không giới hạn bề rộng. */
export function AppShell({ role, children, bleed = false }: { role: Role; children: React.ReactNode; bleed?: boolean }) {
  const hydrated = useHydrated();
  const user = useCurrentUser();
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const isStudent = role === "student" && hydrated && user?.role === "student";

  let body: React.ReactNode = children;
  if (!hydrated) body = <PageSkeleton />;
  else if (!user || user.role !== role)
    body = (
      <div className="mx-auto mt-10 max-w-lg rounded-2xl border border-line bg-surface p-8 text-center">
        <ShieldAlert className="mx-auto size-10 text-warning-fg" aria-hidden />
        <h1 className="mt-3 text-xl font-semibold text-fg">Cần đăng nhập vai trò {ROLE_LABEL[role]}</h1>
        <p className="mt-2 text-sm text-muted">
          {user ? `Bạn đang đăng nhập với vai trò ${ROLE_LABEL[user.role]}. Khu vực này chỉ dành cho ${ROLE_LABEL[role]}.` : "Bạn chưa đăng nhập."} Hãy đăng nhập bằng tài khoản có quyền phù hợp.
        </p>
        <div className="mt-5 flex justify-center gap-2">
          <Button asChild>
            <Link href={`/login?role=${role}`}>Đăng nhập {ROLE_LABEL[role]}</Link>
          </Button>
          {user && (
            <Button asChild variant="outline">
              <Link href={ROLE_HOME[user.role]}>Về khu vực của tôi</Link>
            </Button>
          )}
        </div>
      </div>
    );

  return (
    <div className="flex min-h-screen bg-bg">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-line bg-sidebar px-3 py-4 lg:flex">
        <div className="px-2 pb-5">
          <Logo href={ROLE_HOME[role]} />
        </div>
        <SidebarNav role={role} />
        <div className="mt-auto rounded-xl border border-line bg-surface-2/60 p-3 text-xs text-muted">
          <p className="font-medium text-fg">Bản dùng thử</p>
          Dữ liệu lưu trên trình duyệt này.
        </div>
      </aside>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu điều hướng">
          <button className="absolute inset-0 bg-black/60" aria-label="Đóng menu" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 overflow-y-auto border-r border-line bg-sidebar p-4">
            <div className="mb-4 flex items-center justify-between">
              <Logo href={ROLE_HOME[role]} />
              <Button variant="ghost" size="icon" aria-label="Đóng menu" onClick={() => setOpen(false)}>
                <X />
              </Button>
            </div>
            <SidebarNav role={role} onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}

      <div className="relative flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-line bg-surface/90 px-4 backdrop-blur-xl sm:px-6">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Mở menu" onClick={() => setOpen(true)}>
              <Menu />
            </Button>
            {isStudent ? <SearchPalette studentId={user!.id} /> : <span className="hidden text-sm text-muted sm:inline">Không gian {ROLE_LABEL[role].toLowerCase()}</span>}
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            {isStudent && <NotificationBell studentId={user!.id} />}
            {hydrated && user?.role === "teacher" && role === "teacher" && (
              <Link href="/teacher/settings" aria-label="Cài đặt" aria-current={pathname.startsWith("/teacher/settings") ? "page" : undefined} className="grid size-9 place-items-center rounded-xl text-muted hover:bg-surface-2 hover:text-fg">
                <Settings className="size-[18px]" />
              </Link>
            )}
            {isStudent && (
              <Link href="/student/profile" aria-current={pathname.startsWith("/student/profile") ? "page" : undefined} className="flex items-center gap-2 rounded-xl px-2 py-1.5 text-sm font-medium text-fg hover:bg-surface-2">
                <UserRound className="size-[18px] text-cyan-fg" aria-hidden />
                <span className="hidden md:inline">Trang cá nhân</span>
              </Link>
            )}
            <ThemeToggle />
            {hydrated && <RoleSwitcher />}
          </div>
        </header>
        <main id="main" className={cn("relative w-full flex-1", bleed ? "pb-16" : "mx-auto max-w-[1400px] px-4 py-6 pb-24 sm:px-6 lg:px-8")}>
          <motion.div key={pathname} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22, ease: "easeOut" }}>
            {isStudent ? <TutorProvider userId={user!.id}>{body}</TutorProvider> : body}
          </motion.div>
        </main>
        {hydrated && user && <PrefsApplier userId={user.id} />}
      </div>
    </div>
  );
}
