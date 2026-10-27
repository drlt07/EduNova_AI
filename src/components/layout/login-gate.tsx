"use client";
import { Suspense, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { PageSkeleton } from "@/components/ui/feedback";
import { useCurrentUser, useHydrated } from "@/lib/store/hooks";
import { isGatedPath } from "@/lib/auth/paths";

export { GATED_PREFIXES, isGatedPath } from "@/lib/auth/paths";

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
