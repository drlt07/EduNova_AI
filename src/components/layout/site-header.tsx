"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Gamepad2, Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useCurrentUser, useHydrated } from "@/lib/store/hooks";
import { cn } from "@/lib/utils";
import { Logo } from "./logo";
import { ROLE_HOME } from "./nav-config";
import { ThemeToggle } from "./theme-toggle";

/** `featured`: mục đặc trưng của EduNova, luôn nổi bật hơn các mục còn lại. */
const NAV = [
  { href: "/", label: "Trang chủ" },
  { href: "/curriculum", label: "Chương trình học", also: ["/explore", "/bai-hoc"] },
  { href: "/kho", label: "Kho mô phỏng", featured: true },
  { href: "/about", label: "Giới thiệu" },
  { href: "/huong-dan", label: "Hướng dẫn" },
];

function isActive(pathname: string, n: (typeof NAV)[number]) {
  if (n.href === "/") return pathname === "/";
  return [n.href, ...(n.also ?? [])].some((p) => pathname.startsWith(p));
}

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const user = useCurrentUser();
  const hydrated = useHydrated();
  // Đã đăng nhập → vào thẳng không gian theo vai trò; chưa → trang đăng nhập.
  const account = hydrated && user ? { href: ROLE_HOME[user.role], label: "Vào không gian của tôi" } : { href: "/login", label: "Đăng nhập" };

  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-bg/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Logo />
        <nav aria-label="Điều hướng chính" className="hidden items-center gap-1 lg:flex">
          {NAV.map((n) => {
            const active = isActive(pathname, n);
            return n.featured ? (
              <Link key={n.href} href={n.href} aria-current={active ? "page" : undefined} className={cn("mx-1 inline-flex items-center gap-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 px-3.5 py-1.5 text-sm font-semibold text-blue-fg transition-colors hover:bg-blue-500/15", active && "bg-blue-500/15 ring-1 ring-blue-500/40")}>
                <Gamepad2 className="size-4" aria-hidden /> {n.label}
              </Link>
            ) : (
              <Link key={n.href} href={n.href} aria-current={active ? "page" : undefined} className={cn("rounded-lg px-3 py-2 text-sm font-medium text-muted hover:text-fg", active && "text-fg")}>
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <Button asChild className="hidden sm:inline-flex">
            <Link href={account.href}>{account.label}</Link>
          </Button>
          <Button variant="ghost" size="icon" className="lg:hidden" aria-expanded={open} aria-controls="mobile-nav" aria-label={open ? "Đóng menu" : "Mở menu"} onClick={() => setOpen((v) => !v)}>
            {open ? <X /> : <Menu />}
          </Button>
        </div>
      </div>
      {open && (
        <nav id="mobile-nav" aria-label="Điều hướng di động" className="border-t border-line px-4 pb-4 lg:hidden">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} onClick={() => setOpen(false)} aria-current={isActive(pathname, n) ? "page" : undefined} className={cn("flex items-center gap-2 rounded-lg px-3 py-3 text-sm font-medium hover:bg-surface-2", n.featured ? "text-blue-fg" : "text-fg")}>
              {n.featured && <Gamepad2 className="size-4" aria-hidden />} {n.label}
            </Link>
          ))}
          <Button asChild className="mt-2 w-full">
            <Link href={account.href} onClick={() => setOpen(false)}>{account.label}</Link>
          </Button>
        </nav>
      )}
    </header>
  );
}
