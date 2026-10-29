import type { Metadata } from "next";
import { AuthLayout } from "@/components/auth/auth-layout";
import { ForgotPasswordClient } from "./forgot-client";

export const metadata: Metadata = { title: "Quên mật khẩu" };

export default function ForgotPasswordPage() {
  return (
    <AuthLayout title="Quên mật khẩu" subtitle="Nhập email đã đăng ký, chúng tôi sẽ gửi liên kết đặt lại mật khẩu." switchTo={{ href: "/login", label: "Đăng nhập" }}>
      <ForgotPasswordClient />
    </AuthLayout>
  );
}
