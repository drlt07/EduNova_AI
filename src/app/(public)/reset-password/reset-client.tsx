"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AUTH_MODE } from "@/lib/supabase/config";
import { supabaseBrowser } from "@/lib/supabase/client";
import { authErrorVi } from "@/lib/auth/errors";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/form";
import { Notice } from "@/components/ui/feedback";
import { PasswordInput } from "@/components/auth/password-input";

/** Mở từ liên kết trong thư (đã có phiên khôi phục qua /auth/callback): đặt mật khẩu mới. */
export function ResetPasswordClient() {
  const router = useRouter();
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (AUTH_MODE === "demo") return <Notice tone="info">Bản dùng thử chưa gửi được email đặt lại mật khẩu. Tài khoản mẫu dùng mật khẩu chung ghi ở trang <Link href="/login" className="font-medium text-cyan-fg hover:underline">Đăng nhập</Link>; tài khoản em tự tạo thì đăng ký lại bằng email khác.</Notice>;
  return (
    <form
      noValidate
      className="max-w-md space-y-4 rounded-2xl border border-line bg-surface p-6"
      onSubmit={async (e) => {
        e.preventDefault();
        if (pw.length < 8 || !/[0-9]/.test(pw)) return setError("Mật khẩu tối thiểu 8 ký tự, có ít nhất 1 chữ số.");
        if (pw !== confirm) return setError("Mật khẩu nhập lại không khớp.");
        setBusy(true);
        setError("");
        const sb = supabaseBrowser()!;
        const { data: { user } } = await sb.auth.getUser();
        if (!user) {
          setBusy(false);
          return setError("Liên kết đã hết hạn hoặc không hợp lệ. Hãy yêu cầu gửi lại.");
        }
        const { error: err } = await sb.auth.updateUser({ password: pw });
        setBusy(false);
        if (err) return setError(authErrorVi(err.message));
        toast.success("Đã đổi mật khẩu");
        router.replace("/login");
        router.refresh();
      }}
    >
      <Field label="Mật khẩu mới" htmlFor="rp-pw" hint="≥ 8 ký tự, có chữ số"><PasswordInput id="rp-pw" autoComplete="new-password" autoFocus value={pw} onChange={(e) => setPw(e.target.value)} /></Field>
      <Field label="Nhập lại mật khẩu" htmlFor="rp-confirm"><PasswordInput id="rp-confirm" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} /></Field>
      {error && <div role="alert"><Notice tone="danger">{error}</Notice></div>}
      <Button type="submit" className="w-full" disabled={busy}>{busy ? "Đang lưu…" : "Lưu mật khẩu mới"}</Button>
      <p className="text-center text-sm"><Link href="/forgot-password" className="text-cyan-fg hover:underline">Gửi lại liên kết</Link></p>
    </form>
  );
}
