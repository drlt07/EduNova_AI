"use client";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useApp } from "@/lib/store/app-store";
import { useHydrated } from "@/lib/store/hooks";
import { LOCK_MS, MAX_FAILS, verifyLogin } from "@/lib/auth/local-auth";
import type { User } from "@/lib/domain/types";
import { Notice } from "@/components/ui/feedback";
import { AuthField, AuthSubmit, authInput } from "./auth-form";
import { PasswordInput } from "./password-input";

const schema = z.object({
  email: z.string().trim().email("Email không hợp lệ"),
  password: z.string().min(1, "Nhập mật khẩu"),
});
type Values = z.infer<typeof schema>;

const clock = () => Date.now();

/** Đăng nhập email + mật khẩu khi chưa nối máy chủ: kiểm tra với tài khoản lưu trên trình duyệt (mật khẩu đã băm). */
export function LocalLogin({ onEnter }: { onEnter: (u: User) => void }) {
  const users = useApp((s) => s.users);
  const creds = useApp((s) => s.credentials);
  const hydrated = useHydrated();
  const [error, setError] = useState("");
  const [fails, setFails] = useState(0);
  const [lockedUntil, setLockedUntil] = useState(0);
  const { register, handleSubmit, setValue, setFocus, formState: { errors, isSubmitting } } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { email: "", password: "" } });

  async function onSubmit(v: Values) {
    setError("");
    const t = clock();
    if (t < lockedUntil) return setError(`Sai quá ${MAX_FAILS} lần. Thử lại sau ${Math.ceil((lockedUntil - t) / 1000)} giây.`);
    const r = await verifyLogin(v.email, v.password, users, creds ?? {});
    if (!r.ok) {
      const n = fails + 1;
      setFails(n);
      if (n >= MAX_FAILS) { setLockedUntil(t + LOCK_MS); setFails(0); }
      setValue("password", "");
      setFocus("password");
      return setError(r.error);
    }
    onEnter(r.user);
  }

  const err = (k: keyof Values) => (errors[k] ? { "aria-invalid": true, "aria-describedby": `${k}-error` } : {});
  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-5" aria-label="Đăng nhập">
      <AuthField label="Email" htmlFor="email" error={errors.email?.message}>
        <input id="email" type="email" autoComplete="username" autoFocus className={authInput} {...register("email")} {...err("email")} />
      </AuthField>
      <AuthField label="Mật khẩu" htmlFor="password" error={errors.password?.message}>
        <PasswordInput id="password" autoComplete="current-password" className={authInput} {...register("password")} {...err("password")} />
      </AuthField>
      <div className="-mt-2 flex justify-end text-sm"><Link href="/forgot-password" className="text-muted underline underline-offset-2 hover:text-fg">Quên mật khẩu?</Link></div>
      {error && <div role="alert"><Notice tone="danger">{error}</Notice></div>}
      <AuthSubmit disabled={!hydrated || isSubmitting}>{isSubmitting ? "Đang đăng nhập…" : "Đăng nhập"}</AuthSubmit>
    </form>
  );
}
