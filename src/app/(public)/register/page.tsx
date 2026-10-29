import type { Metadata } from "next";
import Link from "next/link";
import { AuthLayout } from "@/components/auth/auth-layout";
import { RegisterClient } from "./register-client";
import { SocialAuth } from "@/components/auth/social-auth";

export const metadata: Metadata = { title: "Đăng ký" };

export default function RegisterPage() {
  return (
    <AuthLayout eyebrow="Bắt đầu với EduNova" title="Tạo tài khoản" subtitle="Dành cho giáo viên và học sinh. Học sinh có mã lớp thì vào lớp luôn." foot={<>Đã có tài khoản? <Link href="/login" className="font-semibold text-blue-fg hover:underline">Đăng nhập</Link></>}>
      <SocialAuth mode="register" />
      <RegisterClient />
    </AuthLayout>
  );
}
