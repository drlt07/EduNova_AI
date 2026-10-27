"use client";
import { Suspense, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { PageSkeleton } from "@/components/ui/feedback";
import { useCurrentUser, useHydrated } from "@/lib/store/hooks";

/**
 * Trang công khai nhưng là chức năng (kho mô phỏng, chương trình, bài học): phải đăng nhập mới dùng được.
 * Trang chủ, Giới thiệu, Hướng dẫn, Chính sách, Đăng nhập/Đăng ký vẫn mở cho khách.
 */
export const GATED_PREFIXES = ["/labs", "/curriculum", "/explore", "/bai-hoc"];

export function isGatedPath(pathname: string) {
  return GATED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function Gate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const qs = useSearchParams().toString();
  const router = useRouter();
  const hydrated = useHydrated();
  const user = useCurrentUser();
  const gated = isGatedPath(pathname);
  const blocked = gated && (!hydrated || !user);

  useEffect(() => {
    if (gated && hydrated && !user) {
      const next = qs ? `${pathname}?${qs}` : pathname;
      router.replace(`/login?next=${encodeURIComponent(next)}`);
    }
  }, [gated, hydrated, user, pathname, qs, router]);

  return blocked ? <PageSkeleton /> : children;
}

export function LoginGate({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Gate>{children}</Gate>
    </Suspense>
  );
}
