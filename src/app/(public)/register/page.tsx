import type { Metadata } from "next";
import { RegisterClient } from "./register-client";

export const metadata: Metadata = { title: "Đăng ký" };

export default function RegisterPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight text-fg">Đăng ký</h1>
      <p className="mt-2 text-muted">Tạo tài khoản giáo viên hoặc học sinh.</p>
      <div className="mt-8"><RegisterClient /></div>
    </div>
  );
}
