import type { Metadata } from "next";
import { ResetPasswordClient } from "./reset-client";

export const metadata: Metadata = { title: "Đặt lại mật khẩu" };

export default function ResetPasswordPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight text-fg">Đặt mật khẩu mới</h1>
      <div className="mt-8"><ResetPasswordClient /></div>
    </div>
  );
}
