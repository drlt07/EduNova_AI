"use client";
import Link from "next/link";
import { useCurrentUser, useHydrated } from "@/lib/store/hooks";
import { ROLE_HOME } from "@/lib/auth/paths";
import { Button } from "@/components/ui/button";

/** Nút cuối trang chủ: khách thì mời đăng nhập, đã đăng nhập thì vào thẳng khu vực của mình. */
export function AccountCta() {
  const hydrated = useHydrated();
  const user = useCurrentUser();
  const inside = hydrated && user;
  return (
    <Button asChild size="lg" variant="secondary">
      <Link href={inside ? ROLE_HOME[user.role] : "/login"}>{inside ? (user.role === "teacher" ? "Mở Tổng quan lớp học" : user.role === "student" ? "Tiếp tục khóa học của tôi" : "Mở trang Quản trị") : "Đăng nhập hệ thống"}</Link>
    </Button>
  );
}

/** Chỉ hiện cho khách chưa đăng nhập (vd lời nhắc đăng nhập trên trang chủ). */
export function GuestOnly({ children }: { children: React.ReactNode }) {
  const hydrated = useHydrated();
  const user = useCurrentUser();
  return hydrated && !user ? <>{children}</> : null;
}
