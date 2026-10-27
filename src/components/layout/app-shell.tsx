"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, ShieldAlert, X } from "lucide-react";
import { useState } from "react";
import type { Role } from "@/lib/domain/types";
import { useCurrentUser, useHydrated } from "@/lib/store/hooks";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { PageSkeleton } from "@/components/ui/feedback";
import { Logo } from "./logo";
import { NAV, ROLE_HOME, ROLE_LABEL } from "./nav-config";
import { RoleSwitcher } from "./role-switcher";
import { NotificationBell, PrefsApplier, SearchPalette } from "@/components/student/top-bar";
import { TutorProvider } from "@/components/tutor/tutor-provider";
import { motion } from "motion/react";
import { ThemeToggle } from "./theme-toggle";

function SidebarNav({ role, onNavigate }: { role: Role; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav aria-label={`Điều hướng ${ROLE_LABEL[role]}`} className="flex flex-col gap-0.5">
      {NAV[role].map((item) => {
        const active = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href + "/"));
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted transition-colors hover:bg-surface-2 hover:text-fg",
              active && "bg-gradient-to-r from-cyan/15 to-blue/5 text-fg ring-1 ring-cyan/25",
            )}
          >
            <item.icon className={cn("size-[18px] shrink-0", active ? "text-cyan-fg" : "text-muted group-hover:text-fg")} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({ role, children }: { role: Role; children: React.ReactNode }) {
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
          {user ? `Bạn đang đăng nhập với vai trò ${ROLE_LABEL[user.role]}. Khu vực này chỉ dành cho ${ROLE_LABEL[role]}.` : "Bạn chưa đăng nhập."} Hãy chọn tài khoản dùng thử phù hợp.
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

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-line bg-bg/80 px-4 backdrop-blur-xl sm:px-6">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Mở menu" onClick={() => setOpen(true)}>
              <Menu />
            </Button>
            {isStudent ? <SearchPalette studentId={user!.id} /> : <span className="hidden text-sm text-muted sm:inline">Không gian {ROLE_LABEL[role].toLowerCase()}</span>}
          </div>
          <div className="flex items-center gap-2">
            {isStudent && <NotificationBell studentId={user!.id} />}
            <ThemeToggle />
            {hydrated && <RoleSwitcher />}
          </div>
        </header>
        <main id="main" className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 pb-24 sm:px-6 lg:px-8">
          <motion.div key={pathname} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22, ease: "easeOut" }}>
            {isStudent ? <TutorProvider userId={user!.id}>{body}</TutorProvider> : body}
          </motion.div>
        </main>
        {hydrated && user && <PrefsApplier userId={user.id} />}
      </div>
    </div>
  );
}
