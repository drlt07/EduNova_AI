"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { LogIn } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { authErrorVi } from "@/lib/auth/errors";
import { ROLE_HOME, safeNext } from "@/lib/auth/paths";
import type { Role } from "@/lib/domain/types";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import { Notice } from "@/components/ui/feedback";
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
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="max-w-md space-y-4 rounded-2xl border border-line bg-surface p-6">
      <Field label="Email" htmlFor="email" error={errors.email?.message}>
        <Input id="email" type="email" autoComplete="email" autoFocus {...register("email")} {...err("email")} />
      </Field>
      <Field label="Mật khẩu" htmlFor="password" error={errors.password?.message}>
        <PasswordInput id="password" autoComplete="current-password" {...register("password")} {...err("password")} />
      </Field>
      <div className="flex justify-end text-sm">
        <Link href="/forgot-password" className="font-medium text-cyan-fg hover:underline">Quên mật khẩu?</Link>
      </div>
      {error && <div role="alert"><Notice tone="danger">{error}</Notice></div>}
      <Button type="submit" className="w-full" disabled={isSubmitting}><LogIn /> {isSubmitting ? "Đang đăng nhập…" : "Đăng nhập"}</Button>
    </form>
  );
}
