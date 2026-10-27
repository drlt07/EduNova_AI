import Link from "next/link";
import { useId } from "react";

export function Logo({ href = "/" }: { href?: string }) {
  // id gradient phải duy nhất: trang có thể render 2 logo (sidebar + drawer)
  const gid = useId();
  return (
    <Link href={href} className="flex items-center gap-2.5 rounded-lg font-bold tracking-tight text-fg" aria-label="EduNova AI — trang chủ">
      <svg width="30" height="30" viewBox="0 0 32 32" aria-hidden>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#22D3EE" />
            <stop offset="0.55" stopColor="#4F7FFF" />
            <stop offset="1" stopColor="#8B5CF6" />
          </linearGradient>
        </defs>
        <rect x="1" y="1" width="30" height="30" rx="9" fill={`url(#${gid})`} />
        <path d="M11 8h7l-2 6h5l-9 11 2-8h-5z" fill="#06121f" />
      </svg>
      <span className="text-[17px]">
        EduNova <span className="text-gradient">AI</span>
      </span>
    </Link>
  );
}
