"use client";
import Link from "next/link";
import type { Role } from "@/lib/domain/types";
import { useCurrentUser, useHydrated } from "@/lib/store/hooks";
import { ROLE_HOME } from "@/components/layout/nav-config";

/** Đã đăng nhập đúng vai trò → vào thẳng trang tổng quan; chưa đăng nhập → trang đăng nhập chọn sẵn vai trò. */
export function RoleLink({ role, className, children }: { role: Role; className?: string; children: React.ReactNode }) {
  const user = useCurrentUser();
  const hydrated = useHydrated();
  const href = hydrated && user?.role === role ? ROLE_HOME[role] : `/login?role=${role}`;
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}
