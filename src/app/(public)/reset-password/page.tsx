import type { Metadata } from "next";
import { AuthLayout } from "@/components/auth/auth-layout";
import { ResetPasswordClient } from "./reset-client";

export const metadata: Metadata = { title: "Đặt lại mật khẩu" };

export default function ResetPasswordPage() {
  return (
    <AuthLayout title="Đặt mật khẩu mới" switchTo={{ href: "/login", label: "Đăng nhập" }}>
      <ResetPasswordClient />
    </AuthLayout>
  );
}
