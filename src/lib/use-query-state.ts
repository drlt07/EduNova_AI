"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

/**
 * Thay đổi gần nhất chưa kịp phản ánh lên URL (router.replace chạy bất đồng bộ).
 * Dùng chung cho mọi bộ lọc trên trang để hai thay đổi liên tiếp không ghi đè nhau.
 */
let pending: { path: string; basis: string; qs: string } | null = null;

/** Đồng bộ bộ lọc với URL để có thể chia sẻ link và dùng nút Back. Cần bọc trong <Suspense>. */
export function useQueryState(key: string, fallback = ""): [string, (v: string) => void] {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const current = params.toString();
  const value = params.get(key) ?? fallback;
  const set = useCallback(
    (v: string) => {
      const base = pending && pending.path === pathname && pending.basis === current ? pending.qs : current;
      const next = new URLSearchParams(base);
      if (v && v !== fallback) next.set(key, v);
      else next.delete(key);
      const qs = next.toString();
      pending = { path: pathname, basis: current, qs };
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [key, fallback, pathname, router, current],
  );
  return [value, set];
}
