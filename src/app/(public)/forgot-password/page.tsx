import type { Metadata } from "next";
import Link from "next/link";
import { AuthLayout } from "@/components/auth/auth-layout";
import { ForgotPasswordClient } from "./forgot-client";

export const metadata: Metadata = { title: "Quên mật khẩu" };

export default function ForgotPasswordPage() {
  return (
    <AuthLayout title="Quên mật khẩu" subtitle="Nhập email đã đăng ký, chúng tôi sẽ gửi liên kết đặt lại mật khẩu." foot={<>Nhớ ra mật khẩu? <Link href="/login" className="font-semibold text-blue-fg hover:underline">Đăng nhập</Link></>}>
      <ForgotPasswordClient />
    </AuthLayout>
  );
}
