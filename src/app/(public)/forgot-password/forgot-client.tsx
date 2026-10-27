"use client";
import Link from "next/link";
import { useState } from "react";
import { MailCheck } from "lucide-react";
import { AUTH_MODE } from "@/lib/supabase/config";
import { supabaseBrowser } from "@/lib/supabase/client";
import { authErrorVi } from "@/lib/auth/errors";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import { Notice } from "@/components/ui/feedback";

export function ForgotPasswordClient() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (AUTH_MODE === "demo") return <Notice tone="info">Bản dùng thử không dùng mật khẩu. <Link href="/login" className="font-medium text-cyan-fg hover:underline">Chọn tài khoản dùng thử</Link>.</Notice>;
  if (sent)
    return (
      <div className="max-w-md rounded-2xl border border-line bg-surface p-6 text-center">
        <MailCheck className="mx-auto size-10 text-success-fg" aria-hidden />
        <p className="mt-3 text-sm text-fg">Nếu <strong>{email}</strong> có tài khoản, thư đặt lại mật khẩu đã được gửi. Liên kết có hiệu lực trong thời gian ngắn.</p>
        <Button asChild variant="secondary" className="mt-4"><Link href="/login">Quay lại đăng nhập</Link></Button>
      </div>
    );
  return (
    <form
      noValidate
      className="max-w-md space-y-4 rounded-2xl border border-line bg-surface p-6"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError("Email không hợp lệ");
        setBusy(true);
        setError("");
        const { error: err } = await supabaseBrowser()!.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/auth/callback?next=/reset-password` });
        setBusy(false);
        // Không tiết lộ email có tồn tại hay không; chỉ báo lỗi kỹ thuật (mạng, giới hạn tần suất).
        if (err && !/not found|user/i.test(err.message)) return setError(authErrorVi(err.message));
        setSent(true);
      }}
    >
      <Field label="Email" htmlFor="fp-email">
        <Input id="fp-email" type="email" autoComplete="email" autoFocus value={email} onChange={(e) => setEmail(e.target.value)} />
      </Field>
      {error && <div role="alert"><Notice tone="danger">{error}</Notice></div>}
      <Button type="submit" className="w-full" disabled={busy}>{busy ? "Đang gửi…" : "Gửi liên kết đặt lại"}</Button>
    </form>
  );
}
