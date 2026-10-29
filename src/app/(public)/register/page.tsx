import type { Metadata } from "next";
import { AuthLayout } from "@/components/auth/auth-layout";
import { RegisterClient } from "./register-client";

export const metadata: Metadata = { title: "Đăng ký" };

export default function RegisterPage() {
  return (
    <AuthLayout title="Đăng ký" subtitle="Tạo tài khoản giáo viên hoặc học sinh. Tất cả các trường đều bắt buộc, trừ mã lớp." switchTo={{ href: "/login", label: "Đăng nhập" }}>
      <RegisterClient />
    </AuthLayout>
  );
}
