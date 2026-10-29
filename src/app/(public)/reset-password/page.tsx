import type { Metadata } from "next";
import Link from "next/link";
import { AuthLayout } from "@/components/auth/auth-layout";
import { ResetPasswordClient } from "./reset-client";

export const metadata: Metadata = { title: "Đặt lại mật khẩu" };

export default function ResetPasswordPage() {
  return (
    <AuthLayout title="Đặt mật khẩu mới" foot={<>Quay lại <Link href="/login" className="font-semibold text-blue-fg hover:underline">Đăng nhập</Link></>}>
      <ResetPasswordClient />
    </AuthLayout>
  );
}
