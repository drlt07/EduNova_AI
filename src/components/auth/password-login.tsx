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
import { ArrowRight, LockKeyhole, Mail } from "lucide-react";
import { AuthAlt, AuthField, AuthSubmit, authInput } from "./auth-form";
import { PasswordInput } from "./password-input";
import { RememberedChip } from "./remembered-chip";
import { remember, type Remembered } from "@/lib/auth/remembered";

const schema = z.object({
  email: z.string().trim().email("Email không hợp lệ"),
  password: z.string().min(1, "Nhập mật khẩu"),
});
type Values = z.infer<typeof schema>;

/** Đăng nhập thật bằng email + mật khẩu (Supabase Auth). Vai trò lấy từ hồ sơ trong cơ sở dữ liệu. */
export function PasswordLogin({ next, remembered, onSwitch }: { next: string | null; remembered?: Remembered | null; onSwitch?: () => void }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { email: remembered?.email ?? "", password: "" } });

  async function onSubmit(v: Values) {
    setError("");
    const sb = supabaseBrowser();
    if (!sb) return;
    const { data, error: e } = await sb.auth.signInWithPassword({ email: v.email, password: v.password });
    if (e || !data.user) return setError(authErrorVi(e?.message));
    const { data: profile } = await sb.from("profiles").select("role").eq("id", data.user.id).single<{ role: Role }>();
    const role = profile?.role ?? "student";
    remember({ email: data.user.email ?? v.email, name: (data.user.user_metadata?.full_name as string | undefined) ?? v.email.split("@")[0], hue: 210 });
    router.replace(safeNext(next, role) ?? ROLE_HOME[role]);
    router.refresh();
  }

  const err = (k: keyof Values) => (errors[k] ? { "aria-invalid": true, "aria-describedby": `${k}-error` } : {});
  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-5" aria-label="Đăng nhập">
      {remembered && onSwitch ? (
        <>
          <RememberedChip who={remembered} onSwitch={onSwitch} />
          <input type="hidden" autoComplete="username" {...register("email")} />
        </>
      ) : (
        <AuthField label="Email" htmlFor="email" icon={Mail} error={errors.email?.message}>
          <input id="email" type="email" autoComplete="email" placeholder="ten@truong.edu.vn" autoFocus className={`${authInput} pl-11`} {...register("email")} {...err("email")} />
        </AuthField>
      )}
      <AuthField label="Mật khẩu" htmlFor="password" icon={LockKeyhole} error={errors.password?.message}>
        <PasswordInput id="password" autoComplete="current-password" className={`${authInput} pl-11`} {...register("password")} {...err("password")} />
      </AuthField>
      <div className="-mt-1 flex justify-end text-sm"><Link href="/forgot-password" className="font-medium text-blue-fg hover:underline">Quên mật khẩu?</Link></div>
      {error && <div role="alert"><Notice tone="danger">{error}</Notice></div>}
      <AuthSubmit disabled={isSubmitting}>{isSubmitting ? "Đang đăng nhập…" : <>Đăng nhập <ArrowRight className="size-4" aria-hidden /></>}</AuthSubmit>
      <AuthAlt />
    </form>
  );
}
