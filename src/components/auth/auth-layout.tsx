"use client";
import Link from "next/link";
import { Logo } from "@/components/layout/logo";

/**
 * Khung trang Đăng nhập / Đăng ký / Quên mật khẩu của EduNova: bên trái là cảnh "vòng lặp đang chạy"
 * (minh họa riêng của EduNova), bên phải là form. Không thanh menu, chân trang nằm giữa (góc dưới phải để trống).
 */
export function AuthLayout({ eyebrow, title, subtitle, foot, children }: { eyebrow?: React.ReactNode; title: React.ReactNode; subtitle?: string; foot?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-surface">
      <aside aria-label="Minh họa vòng lặp" className="hidden w-[48%] max-w-[760px] shrink-0 p-4 lg:block">
        <LoopScene />
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

// Một vòng: 5 lần lặp × 1,2 giây, rồi nghỉ và xóa để chạy lại.
const CYCLE = 7.5, STEP = 1.2, N = 5;
const at = (k: number) => +(((k * STEP + 0.25) / CYCLE) * 100).toFixed(2);
const SLOT_X = (k: number) => 90 + k * 105;

/** Keyframes sinh theo từng lần lặp: hộp rơi, dòng in ra, giá trị i hiện đúng lúc, cánh tay chạy tới ô i. */
function loopCss() {
  let css = "";
  for (let k = 0; k < N; k++) {
    const a = at(k), b = Math.min(at(k) + 4, 99);
    css += `@keyframes nv-box${k}{0%,${a}%{opacity:0;transform:translateY(-46px)}${b}%,84%{opacity:1;transform:none}92%,100%{opacity:0;transform:none}}`;
    css += `@keyframes nv-out${k}{0%,${a}%{opacity:0;transform:translateX(-8px)}${b}%,84%{opacity:1;transform:none}92%,100%{opacity:0}}`;
    const end = k < N - 1 ? at(k + 1) : 84;
    css += `@keyframes nv-i${k}{0%,${a - 0.01}%{opacity:0}${a}%,${end - 0.01}%{opacity:1}${end}%,100%{opacity:0}}`;
  }
  const frames = Array.from({ length: N }, (_, k) => `${Math.max(0, at(k) - 3)}%,${at(k)}%{transform:translateX(${SLOT_X(k)}px)}`).join("");
  css += `@keyframes nv-arm{0%{transform:translateX(${SLOT_X(0)}px)}${frames}88%{transform:translateX(${SLOT_X(N - 1)}px)}100%{transform:translateX(${SLOT_X(0)}px)}}`;
  css += `@keyframes nv-line{0%,2%{opacity:0}4%,84%{opacity:1}92%,100%{opacity:0}}`;
  css += `.nv{animation-duration:${CYCLE}s;animation-iteration-count:infinite;animation-timing-function:cubic-bezier(.3,1.25,.5,1);transform-box:fill-box}`;
  css += `@media (prefers-reduced-motion:reduce){.nv{animation:none!important;opacity:1!important;transform:none!important}.nv-i{display:none}.nv-arm{transform:translateX(${SLOT_X(N - 1)}px)!important}}`;
  return css;
}

/** Cảnh minh họa: đoạn mã for, giá trị i, băng chuyền có cánh tay đặt hộp, màn hình in kết quả — lặp lại mãi. */
function LoopScene() {
  return (
    <div className="relative flex h-full flex-col overflow-hidden rounded-[28px] bg-[#0a1020] text-white">
      <style>{loopCss()}</style>
      <div aria-hidden className="absolute -left-24 -top-24 size-96 rounded-full bg-blue-600/30 blur-3xl" />
      <div aria-hidden className="absolute -bottom-32 -right-20 size-[420px] rounded-full bg-cyan-500/20 blur-3xl" />
      <div aria-hidden className="absolute inset-0 opacity-[0.07] [background-image:radial-gradient(#fff_1px,transparent_1px)] [background-size:22px_22px]" />

      <div className="relative px-10 pt-10">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">Tin học 10 · Câu lệnh lặp</p>
        <p className="mt-3 text-[28px] font-bold leading-tight">Một dòng lệnh,<br />năm lần lặp.</p>
        <p className="mt-2 max-w-sm text-sm text-slate-300">Ở EduNova, mỗi khái niệm đều chạy được: em nhìn thấy vòng lặp làm việc trước khi tự viết.</p>
      </div>

      <svg viewBox="0 0 600 470" className="relative mt-auto h-auto w-full" role="img" aria-label="Vòng lặp for i in range(5): cánh tay robot lần lượt đặt hộp vào ô 0 đến 4 và in kết quả">
        {/* đoạn mã */}
        <g transform="translate(40 10)">
          <rect width="330" height="92" rx="14" fill="#ffffff" fillOpacity="0.06" stroke="#ffffff" strokeOpacity="0.1" />
          <text x="20" y="38" fontSize="17" fontFamily="ui-monospace,monospace" fill="#e2e8f0"><tspan fill="#7dd3fc">for</tspan> i <tspan fill="#7dd3fc">in</tspan> <tspan fill="#fcd34d">range</tspan>(5):</text>
          <rect x="12" y="52" width="306" height="28" rx="6" fill="#fbbf24" fillOpacity="0.16" className="nv" style={{ animationName: "nv-line" }} />
          <text x="20" y="72" fontSize="17" fontFamily="ui-monospace,monospace" fill="#e2e8f0">    dat_hop(i)</text>
        </g>
        {/* giá trị i */}
        <g transform="translate(400 10)">
          <rect width="160" height="92" rx="14" fill="#22d3ee" fillOpacity="0.12" stroke="#22d3ee" strokeOpacity="0.4" />
          <text x="24" y="36" fontSize="13" fill="#a5f3fc" letterSpacing="2">BIẾN i</text>
          {Array.from({ length: N }, (_, k) => <text key={k} x="24" y="78" fontSize="38" fontWeight="800" fontFamily="ui-monospace,monospace" fill="#fff" className="nv nv-i" style={{ animationName: `nv-i${k}`, animationTimingFunction: "linear" }}>{k}</text>)}
        </g>
        {/* cánh tay robot */}
        <rect x="40" y="126" width="520" height="8" rx="4" fill="#334155" />
        <g className="nv nv-arm" style={{ animationName: "nv-arm", animationTimingFunction: "cubic-bezier(.45,0,.2,1)" }}>
          <rect x="-22" y="118" width="44" height="22" rx="6" fill="#3b82f6" />
          <rect x="-4" y="140" width="8" height="58" fill="#94a3b8" />
          <rect x="-24" y="196" width="48" height="10" rx="3" fill="#2563eb" />
          <path d="M-19 206 l-5 16 M19 206 l5 16" stroke="#2563eb" strokeWidth="5" strokeLinecap="round" />
        </g>
        {/* băng chuyền + hộp */}
        <path d="M30 278 H570 l-14 26 H44Z" fill="#1e293b" />
        <rect x="44" y="304" width="512" height="14" rx="4" fill="#0f172a" />
        {Array.from({ length: 11 }, (_, k) => <circle key={k} cx={52 + k * 50} cy="311" r="4" fill="#475569" />)}
        {Array.from({ length: N }, (_, k) => (
          <g key={k}>
            <text x={SLOT_X(k)} y="340" textAnchor="middle" fontSize="13" fontFamily="ui-monospace,monospace" fill="#64748b">ô {k}</text>
            <g className="nv" style={{ animationName: `nv-box${k}` }}>
              <path d={`M${SLOT_X(k) - 22} 238 l8 -8 h44 l-8 8z`} fill="#fde68a" />
              <path d={`M${SLOT_X(k) + 22} 238 l8 -8 v40 l-8 8z`} fill="#b45309" />
              <rect x={SLOT_X(k) - 22} y="238" width="44" height="40" rx="3" fill="#f59e0b" />
              <text x={SLOT_X(k)} y="265" textAnchor="middle" fontSize="16" fontWeight="800" fill="#451a03">{k}</text>
            </g>
          </g>
        ))}
        {/* màn hình kết quả */}
        <g transform="translate(40 362)">
          <rect width="520" height="96" rx="12" fill="#020617" stroke="#ffffff" strokeOpacity="0.08" />
          <text x="16" y="22" fontSize="11" fill="#64748b" letterSpacing="2">KẾT QUẢ</text>
          {Array.from({ length: N }, (_, k) => (
            <text key={k} x={16 + (k % 3) * 168} y={k < 3 ? 50 : 78} fontSize="14" fontFamily="ui-monospace,monospace" fill="#86efac" className="nv" style={{ animationName: `nv-out${k}` }}>✓ đặt hộp ô {k}</text>
          ))}
        </g>
      </svg>
    </div>
  );
}
