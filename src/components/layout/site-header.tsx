"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Logo } from "./logo";
import { ThemeToggle } from "./theme-toggle";

const NAV = [
  { href: "/explore", label: "Bài học" },
  { href: "/curriculum", label: "Chương trình" },
  { href: "/labs", label: "Mô phỏng" },
  { href: "/about", label: "Giới thiệu" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-bg/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Logo />
        <nav aria-label="Điều hướng chính" className="hidden items-center gap-1 md:flex">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} aria-current={pathname.startsWith(n.href) || (n.href === "/explore" && pathname.startsWith("/bai-hoc")) ? "page" : undefined} className={cn("rounded-lg px-3 py-2 text-sm font-medium text-muted hover:text-fg", (pathname.startsWith(n.href) || (n.href === "/explore" && pathname.startsWith("/bai-hoc"))) && "text-fg")}>
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <Button asChild variant="ghost" className="hidden sm:inline-flex">
            <Link href="/login">Đăng nhập</Link>
          </Button>
          <Button asChild className="hidden sm:inline-flex">
            <Link href="/login?role=teacher">Dùng thử</Link>
          </Button>
          <Button variant="ghost" size="icon" className="md:hidden" aria-expanded={open} aria-controls="mobile-nav" aria-label={open ? "Đóng menu" : "Mở menu"} onClick={() => setOpen((v) => !v)}>
            {open ? <X /> : <Menu />}
          </Button>
        </div>
      </div>
      {open && (
        <nav id="mobile-nav" aria-label="Điều hướng di động" className="border-t border-line px-4 pb-4 md:hidden">
          {[...NAV, { href: "/login", label: "Đăng nhập" }].map((n) => (
            <Link key={n.href} href={n.href} onClick={() => setOpen(false)} className="block rounded-lg px-3 py-3 text-sm font-medium text-fg hover:bg-surface-2">
              {n.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
