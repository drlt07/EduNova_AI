import Link from "next/link";

/** Biểu tượng EduNova: quyển sách mở (trang trái < , trang phải >) trên nền chàm, ngôi sao vàng phía trên. */
export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden>
      <rect width="64" height="64" rx="16" fill="#4338CA" />
      <circle cx="13" cy="17" r="2" fill="#8B8CF6" />
      <circle cx="52" cy="14" r="3" fill="#8B8CF6" />
      <path d="M32 6.5c1 6.2 4.1 9.3 10.3 10.3-6.2 1-9.3 4.1-10.3 10.3-1-6.2-4.1-9.3-10.3-10.3 6.2-1 9.3-4.1 10.3-10.3z" fill="#FBBF24" />
      <path d="M11 26.5c8-1.6 15-.6 21 3.2V51c-6-3.4-13-4.4-21-2.8z" fill="#fff" />
      <path d="M53 26.5c-8-1.6-15-.6-21 3.2V51c6-3.4 13-4.4 21-2.8z" fill="#67E8F9" />
      <path d="M22.5 34.5 18.5 38.5l4 4" fill="none" stroke="#4338CA" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M41.5 34.5l4 4-4 4" fill="none" stroke="#155E75" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2.5 rounded-lg font-bold tracking-tight text-fg" aria-label="EduNova AI — trang chủ">
      <LogoMark />
      <span className="text-[18px] leading-none">
        Edu<span className="text-[#4338CA] dark:text-[#A5B4FC]">Nova</span> <span className="text-[#0891B2] dark:text-[#67E8F9]">AI</span>
      </span>
    </Link>
  );
}
