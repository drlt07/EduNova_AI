"use client";
import Link from "next/link";
import { Logo } from "@/components/layout/logo";

/**
 * Khung trang Đăng nhập / Đăng ký / Quên mật khẩu: bên trái là khối minh họa, bên phải là form.
 * Không có thanh menu trang công khai — chỉ logo, nút chuyển Đăng nhập ↔ Đăng ký, và form.
 */
export function AuthLayout({ title, subtitle, switchTo, children }: { title: string; subtitle?: string; switchTo?: { href: string; label: string }; children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-surface">
      <aside className="relative hidden w-[46%] max-w-[760px] shrink-0 p-6 lg:block">
        <div className="flex h-full flex-col overflow-hidden rounded-[32px] bg-gradient-to-br from-[#4b3bdc] via-[#5a45e6] to-[#3b5bf0]">
          <div className="p-10 pb-0 text-white">
            <p className="text-2xl font-bold leading-snug">Học Tin học bằng cách làm,<br />không chỉ bằng cách đọc.</p>
            <p className="mt-2 max-w-md text-sm text-white/80">Tin học 10, 11, 12 với mô phỏng tương tác, luyện tập tự chấm và trợ lý AI cho giáo viên.</p>
          </div>
          <div className="relative min-h-0 flex-1"><AuthArt /></div>
        </div>
      </aside>
      <main id="main" className="flex min-w-0 flex-1 flex-col px-5 py-8 sm:px-10 lg:px-16">
        <div className="mx-auto flex w-full max-w-[560px] flex-1 flex-col">
          <div className="flex items-center justify-between gap-4">
            <Logo href="/" />
            {switchTo && <Link href={switchTo.href} className="rounded-full border-2 border-[#4b3bdc] px-6 py-2 text-sm font-bold text-[#4b3bdc] transition-colors hover:bg-[#4b3bdc] hover:text-white dark:border-violet-300 dark:text-violet-200 dark:hover:bg-violet-300 dark:hover:text-slate-900">{switchTo.label}</Link>}
          </div>
          <div className="flex flex-1 flex-col justify-center py-10">
            <h1 className="text-4xl font-bold tracking-tight text-fg">{title}</h1>
            {subtitle && <p className="mt-4 text-sm text-muted">{subtitle}</p>}
            <div className="mt-6">{children}</div>
          </div>
          <p className="text-center text-xs text-muted"><Link href="/chinh-sach" className="hover:underline">Chính sách bảo mật</Link> · <Link href="/huong-dan" className="hover:underline">Hướng dẫn</Link> · <Link href="/" className="hover:underline">Về trang chủ</Link></p>
        </div>
      </main>
    </div>
  );
}

/** Minh họa: mây trắng, màn hình bài học, thẻ mô phỏng, huy hiệu lớp 10·11·12, tên lửa và sao. */
function AuthArt() {
  const stars: [number, number, number][] = [[70, 90, 3], [520, 70, 4], [610, 220, 3], [110, 420, 3], [560, 470, 5], [300, 60, 2], [650, 360, 2], [40, 260, 2]];
  return (
    <svg viewBox="0 40 700 660" preserveAspectRatio="xMidYMid meet" className="absolute inset-0 h-full w-full" aria-hidden>
      {stars.map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} fill="#fff" opacity="0.7" className={i % 2 ? "sim-blink" : undefined} />)}
      <path d="M530 150 l6 16 16 6 -16 6 -6 16 -6 -16 -16 -6 16 -6z" fill="#fde047" />
      <path d="M150 560 l4 11 11 4 -11 4 -4 11 -4 -11 -11 -4 11 -4z" fill="#fde047" />
      {/* mây */}
      <path d="M90 540 C40 520 40 440 110 430 C110 330 230 300 290 360 C320 250 500 250 520 360 C620 340 660 450 600 500 C660 540 630 620 560 610 L140 620 C70 625 50 560 90 540Z" fill="#fff" />
      {/* màn hình bài học */}
      <g transform="translate(150 410)">
        <rect width="400" height="250" rx="14" fill="#e2e8f0" />
        <rect x="10" y="10" width="380" height="230" rx="8" fill="#fff" />
        <rect x="10" y="10" width="380" height="50" rx="8" fill="url(#aa-top)" />
        <circle cx="28" cy="26" r="4" fill="#fff" opacity=".7" /><circle cx="42" cy="26" r="4" fill="#fff" opacity=".7" /><circle cx="56" cy="26" r="4" fill="#fff" opacity=".7" />
        <text x="28" y="50" fontSize="13" fontWeight="700" fill="#fff">Bài 20 · Câu lệnh lặp for</text>
        {["Kiến thức", "Mô phỏng", "Luyện tập"].map((t, i) => <g key={t} transform={`translate(${28 + i * 96} 76)`}><rect width="86" height="24" rx="12" fill={i === 1 ? "#4b3bdc" : "#eef2ff"} /><text x="43" y="16" textAnchor="middle" fontSize="11" fontWeight="600" fill={i === 1 ? "#fff" : "#4338ca"}>{t}</text></g>)}
        <rect x="28" y="116" width="344" height="100" rx="10" fill="#0f172a" />
        <rect x="44" y="190" width="312" height="10" rx="5" fill="#334155" />
        {[0, 1, 2, 3, 4].map((i) => <g key={i} transform={`translate(${70 + i * 60} 160)`}><rect width="26" height="26" rx="4" fill="#fbbf24" /><rect y="0" width="26" height="8" rx="3" fill="#fde68a" /></g>)}
        <rect x="150" y="124" width="22" height="16" rx="4" fill="#3b82f6" /><rect x="158" y="140" width="6" height="16" fill="#94a3b8" />
      </g>
      {/* thẻ mô phỏng nổi */}
      {[["#ec4899", 120, 330], ["#3b82f6", 210, 300], ["#10b981", 300, 330]].map(([c, x, y], i) => (
        <g key={i} transform={`translate(${x} ${y})`}>
          <g className="sim-drive" style={{ animationDuration: `${7 + i}s` }}>
            <rect width="70" height="86" rx="12" fill="#fff" />
            <rect width="70" height="24" rx="12" fill={c as string} /><rect y="12" width="70" height="12" fill={c as string} />
            <circle cx="35" cy="55" r="16" fill="none" stroke="#cbd5e1" strokeWidth="4" />
          </g>
        </g>
      ))}
      {/* huy hiệu lục giác */}
      <g transform="translate(470 250)">
        <path d="M60 0 L112 30 L112 90 L60 120 L8 90 L8 30Z" fill="#fff" stroke="#a78bfa" strokeWidth="8" strokeLinejoin="round" />
        <text x="60" y="44" textAnchor="middle" fontSize="11" letterSpacing="3" fill="#475569">TIN HỌC</text>
        <text x="60" y="78" textAnchor="middle" fontSize="26" fontWeight="800" fill="#1e1b4b">10·11·12</text>
        <line x1="34" y1="88" x2="86" y2="88" stroke="#cbd5e1" />
      </g>
      {/* tên lửa */}
      <g transform="translate(330 150) rotate(-28)">
        <path d="M0 30 C20 0 90 0 120 30 C90 60 20 60 0 30Z" fill="#c4b5fd" />
        <circle cx="80" cy="30" r="11" fill="#fff" stroke="#7c3aed" strokeWidth="4" />
        <path d="M20 12 L0 -6 L36 8Z M20 48 L0 66 L36 52Z" fill="#a78bfa" />
        <path d="M0 22 C-26 26 -26 34 0 38Z" fill="#fbbf24" className="sim-blink" />
      </g>
      <defs><linearGradient id="aa-top" x1="0" x2="1"><stop offset="0" stopColor="#7c3aed" /><stop offset="1" stopColor="#3b82f6" /></linearGradient></defs>
    </svg>
  );
}
