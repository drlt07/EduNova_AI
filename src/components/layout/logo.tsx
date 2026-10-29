import Link from "next/link";
import { useId } from "react";

/** Biểu tượng EduNova: ngôi sao "nova" bốn cánh lấp lánh, chấm xanh ngọc (AI), nền cam san hô → vàng nắng. */
export function LogoMark({ size = 32 }: { size?: number }) {
  // id gradient phải duy nhất: trang có thể render 2 logo (sidebar + drawer)
  const gid = useId();
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FF5F6D" />
          <stop offset="1" stopColor="#FFB33F" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="30" height="30" rx="10" fill={`url(#${gid})`} />
      <path d="M14.5 6c1 5.6 3.9 8.5 9.5 9.5-5.6 1-8.5 3.9-9.5 9.5-1-5.6-3.9-8.5-9.5-9.5 5.6-1 8.5-3.9 9.5-9.5z" fill="#fff" />
      <path d="M24.2 4.8c.4 2 1.4 3 3.4 3.4-2 .4-3 1.4-3.4 3.4-.4-2-1.4-3-3.4-3.4 2-.4 3-1.4 3.4-3.4z" fill="#fff" fillOpacity="0.9" />
      <circle cx="24.5" cy="24" r="2.2" fill="#0EA5A4" stroke="#fff" strokeWidth="1.2" />
    </svg>
  );
}

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2.5 rounded-lg font-bold tracking-tight text-fg" aria-label="EduNova AI — trang chủ">
      <LogoMark />
      <span className="flex items-center gap-1.5 text-[18px] leading-none">
        <span>Edu<span className="bg-gradient-to-r from-[#f43f5e] to-[#f59e0b] bg-clip-text text-transparent">Nova</span></span>
        <span className="rounded-md bg-teal-500/15 px-1.5 py-0.5 text-[11px] font-bold tracking-wide text-teal-700 dark:text-teal-300">AI</span>
      </span>
    </Link>
  );
}
