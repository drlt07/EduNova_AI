"use client";
import Link from "next/link";
import { Logo } from "@/components/layout/logo";
import { HeroTraffic } from "@/components/landing/hero-traffic";

/**
 * Khung trang Đăng nhập / Đăng ký / Quên mật khẩu của EduNova: bên trái là cảnh "vòng lặp đang chạy"
 * (minh họa riêng của EduNova), bên phải là form. Không thanh menu, chân trang nằm giữa (góc dưới phải để trống).
 */
export function AuthLayout({ eyebrow, title, subtitle, foot, children }: { eyebrow?: React.ReactNode; title: React.ReactNode; subtitle?: string; foot?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-surface">
      <aside aria-label="Mô phỏng giao lộ 3D" className="sticky top-0 hidden h-screen w-[48%] max-w-[760px] shrink-0 self-start p-4 lg:block">
        <TrafficScene />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col px-6 pb-[var(--corner-safe)] pt-8 sm:px-12">
        <div className="mx-auto flex w-full max-w-[440px] flex-1 flex-col">
          <Logo href="/" />
          <main id="main" className="flex flex-1 flex-col justify-center py-10">
            {eyebrow && <div className="mb-2 text-sm font-semibold text-blue-fg">{eyebrow}</div>}
            <h1 className="text-[32px] font-bold leading-tight tracking-tight text-fg">{title}</h1>
            {subtitle && <p className="mt-2 text-[15px] text-muted">{subtitle}</p>}
            <div className="mt-8">{children}</div>
            {foot && <p className="mt-8 text-center text-sm text-muted">{foot}</p>}
          </main>
          <nav aria-label="Liên kết phụ" className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
            <Link href="/" className="hover:text-fg">Trang chủ</Link>
            <Link href="/huong-dan" className="hover:text-fg">Hướng dẫn</Link>
            <Link href="/chinh-sach" className="hover:text-fg">Chính sách bảo mật</Link>
          </nav>
        </div>
      </div>
    </div>
  );
}

/** Mô phỏng 3D "Giao lộ thông minh" chạy thật (xe dừng đèn đỏ, đèn tự chuyển), khung tông cam của EduNova. */
function TrafficScene() {
  return (
    <div className="relative h-full overflow-hidden rounded-[28px] bg-gradient-to-br from-[#ffedd5] via-[#fff7ed] to-[#fde68a]/60">
      <HeroTraffic className="absolute inset-0 h-full w-full bg-[#ffe8cc]" />
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-gradient-to-b from-[#fff7ed] via-[#fff7ed]/80 to-transparent" />
      <div className="pointer-events-none absolute left-0 right-0 top-0 p-10">
        <p className="inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-[#c2410c] shadow-sm">Tin học 10 · Câu lệnh rẽ nhánh if</p>
        <p className="mt-4 text-[30px] font-bold leading-tight text-slate-900">Đèn đỏ thì dừng,<br /><span className="text-gradient">đèn xanh thì đi.</span></p>
        <p className="mt-2 max-w-sm text-sm text-slate-700">Giao lộ 3D này chạy bằng chính câu lệnh <code className="rounded bg-white/80 px-1 font-mono text-[13px] text-[#c2410c]">if</code> em học: mỗi xe tự kiểm tra đèn trước vạch dừng.</p>
      </div>
    </div>
  );
}
