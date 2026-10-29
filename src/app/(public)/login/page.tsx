import type { Metadata } from "next";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/ui/feedback";
import { LoginClient } from "./login-client";

export const metadata: Metadata = { title: "Đăng nhập" };

export default function LoginPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <LoginClient />
    </Suspense>
  );
}
