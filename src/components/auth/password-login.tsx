"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabaseBrowser } from "@/lib/supabase/client";
import { authErrorVi } from "@/lib/auth/errors";
import { ROLE_HOME, safeNext } from "@/lib/auth/paths";
import type { Role } from "@/lib/domain/types";
import { Notice } from "@/components/ui/feedback";
import { AuthField, AuthSubmit, authInput } from "./auth-form";
import { PasswordInput } from "./password-input";

const schema = z.object({
  email: z.string().trim().email("Email không hợp lệ"),
  password: z.string().min(1, "Nhập mật khẩu"),
});
type Values = z.infer<typeof schema>;

/** Đăng nhập thật bằng email + mật khẩu (Supabase Auth). Vai trò lấy từ hồ sơ trong cơ sở dữ liệu. */
export function PasswordLogin({ next }: { next: string | null }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Values>({ resolver: zodResolver(schema) });

  async function onSubmit(v: Values) {
    setError("");
    const sb = supabaseBrowser();
    if (!sb) return;
    const { data, error: e } = await sb.auth.signInWithPassword({ email: v.email, password: v.password });
    if (e || !data.user) return setError(authErrorVi(e?.message));
    const { data: profile } = await sb.from("profiles").select("role").eq("id", data.user.id).single<{ role: Role }>();
    const role = profile?.role ?? "student";
    router.replace(safeNext(next, role) ?? ROLE_HOME[role]);
    router.refresh();
  }

  const err = (k: keyof Values) => (errors[k] ? { "aria-invalid": true, "aria-describedby": `${k}-error` } : {});
  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-5" aria-label="Đăng nhập">
      <AuthField label="Email" htmlFor="email" error={errors.email?.message}>
        <input id="email" type="email" autoComplete="email" autoFocus className={authInput} {...register("email")} {...err("email")} />
      </AuthField>
      <AuthField label="Mật khẩu" htmlFor="password" error={errors.password?.message}>
        <PasswordInput id="password" autoComplete="current-password" className={authInput} {...register("password")} {...err("password")} />
      </AuthField>
      <div className="-mt-2 flex justify-end text-sm"><Link href="/forgot-password" className="text-muted underline underline-offset-2 hover:text-fg">Quên mật khẩu?</Link></div>
      {error && <div role="alert"><Notice tone="danger">{error}</Notice></div>}
      <AuthSubmit disabled={isSubmitting}>{isSubmitting ? "Đang đăng nhập…" : "Đăng nhập"}</AuthSubmit>
    </form>
  );
}
