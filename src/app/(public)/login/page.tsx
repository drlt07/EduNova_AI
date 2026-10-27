import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/ui/feedback";
import { LoginClient } from "./login-client";

export const metadata: Metadata = { title: "Đăng nhập" };

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight text-fg">Đăng nhập</h1>
      <p className="mt-2 text-muted">
        Chưa có tài khoản? <Link href="/register" className="font-medium text-cyan-fg hover:underline">Đăng ký</Link>
      </p>
      <div className="mt-8">
        <Suspense fallback={<PageSkeleton />}>
          <LoginClient />
        </Suspense>
      </div>
    </div>
  );
}
