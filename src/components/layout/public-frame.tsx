"use client";
import { usePathname } from "next/navigation";
import { useCurrentUser, useHydrated } from "@/lib/store/hooks";
import { AppShell } from "./app-shell";
import { LoginGate } from "./login-gate";
import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";

/** Các trang đăng nhập/đăng ký luôn giữ giao diện công khai. */
const AUTH_PAGES = ["/login", "/register", "/forgot-password", "/reset-password"];

/**
 * Khung cho trang công khai (trang chủ, kho mô phỏng, chương trình…). Khách: thanh menu trên + chân trang.
 * Đã đăng nhập: hiển thị ngay trong không gian làm việc (menu bên trái theo vai trò), để Trang chủ là một mục như mọi mục khác.
 */
export function PublicFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hydrated = useHydrated();
  const user = useCurrentUser();
  if (hydrated && user && !AUTH_PAGES.some((p) => pathname.startsWith(p))) {
    return <AppShell role={user.role} bleed>{children}</AppShell>;
  }
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main id="main" className="flex-1">
        <LoginGate>{children}</LoginGate>
      </main>
      <SiteFooter />
    </div>
  );
}
