import type { Metadata } from "next";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/ui/feedback";
import { AuthLayout } from "@/components/auth/auth-layout";
import { LoginClient } from "./login-client";

export const metadata: Metadata = { title: "Đăng nhập" };

export default function LoginPage() {
  return (
    <AuthLayout title="Đăng nhập" subtitle="Tất cả các trường đều bắt buộc." switchTo={{ href: "/register", label: "Đăng ký" }}>
      <Suspense fallback={<PageSkeleton />}>
        <LoginClient />
      </Suspense>
    </AuthLayout>
  );
}
