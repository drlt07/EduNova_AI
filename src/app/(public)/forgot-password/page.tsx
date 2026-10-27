import type { Metadata } from "next";
import { ForgotPasswordClient } from "./forgot-client";

export const metadata: Metadata = { title: "Quên mật khẩu" };

export default function ForgotPasswordPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight text-fg">Quên mật khẩu</h1>
      <p className="mt-2 text-muted">Nhập email đã đăng ký, chúng tôi sẽ gửi liên kết đặt lại mật khẩu.</p>
      <div className="mt-8"><ForgotPasswordClient /></div>
    </div>
  );
}
