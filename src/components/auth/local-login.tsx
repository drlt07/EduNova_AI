"use client";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ChevronDown, LogIn } from "lucide-react";
import { useApp } from "@/lib/store/app-store";
import { useHydrated } from "@/lib/store/hooks";
import { DEMO_PASSWORD, LOCK_MS, MAX_FAILS, verifyLogin } from "@/lib/auth/local-auth";
import type { User } from "@/lib/domain/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import { Notice } from "@/components/ui/feedback";
import { Avatar } from "@/components/ui/misc";
import { ROLE_LABEL } from "@/components/layout/nav-config";
import { PasswordInput } from "./password-input";

const schema = z.object({
  email: z.string().trim().email("Email không hợp lệ"),
  password: z.string().min(1, "Nhập mật khẩu"),
});
type Values = z.infer<typeof schema>;

export interface DemoAccount { id: string; desc: string }

const clock = () => Date.now();

/**
 * Đăng nhập email + mật khẩu ở bản dùng thử: kiểm tra với tài khoản lưu trên trình duyệt (đã băm), tài khoản mẫu dùng mật khẩu chung.
 * Bên dưới là danh sách tài khoản mẫu: bấm để điền sẵn email và mật khẩu vào form.
 */
export function LocalLogin({ accounts, preferredRole, onEnter }: { accounts: DemoAccount[]; preferredRole: string | null; onEnter: (u: User) => void }) {
  const users = useApp((s) => s.users);
  const creds = useApp((s) => s.credentials);
  const hydrated = useHydrated();
  const [error, setError] = useState("");
  const [fails, setFails] = useState(0);
  const [lockedUntil, setLockedUntil] = useState(0);
  const [showDemo, setShowDemo] = useState(true);
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

  const fill = (u: User) => {
    setValue("email", u.email, { shouldValidate: true });
    setValue("password", DEMO_PASSWORD, { shouldValidate: true });
    setError("");
    setFocus("password");
  };

  const err = (k: keyof Values) => (errors[k] ? { "aria-invalid": true, "aria-describedby": `${k}-error` } : {});
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] lg:items-start">
      <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-4 rounded-2xl border border-line bg-surface p-6 shadow-sm" aria-label="Đăng nhập">
        <Field label="Email" htmlFor="email" error={errors.email?.message}>
          <Input id="email" type="email" autoComplete="username" placeholder="ten@truong.edu.vn" autoFocus {...register("email")} {...err("email")} />
        </Field>
        <Field label="Mật khẩu" htmlFor="password" error={errors.password?.message}>
          <PasswordInput id="password" autoComplete="current-password" {...register("password")} {...err("password")} />
        </Field>
        <div className="flex justify-end text-sm">
          <Link href="/forgot-password" className="font-medium text-cyan-fg hover:underline">Quên mật khẩu?</Link>
        </div>
        {error && <div role="alert"><Notice tone="danger">{error}</Notice></div>}
        <Button type="submit" className="w-full" disabled={!hydrated || isSubmitting}><LogIn /> {isSubmitting ? "Đang đăng nhập…" : "Đăng nhập"}</Button>
      </form>

      <section aria-labelledby="demo-h" className="rounded-2xl border border-dashed border-line p-4">
        <button type="button" onClick={() => setShowDemo(!showDemo)} aria-expanded={showDemo} className="flex w-full items-center justify-between gap-2 text-left">
          <span>
            <span id="demo-h" className="block font-semibold text-fg">Tài khoản dùng thử</span>
            <span className="block text-sm text-muted">Mật khẩu chung: <code className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-fg">{DEMO_PASSWORD}</code> · bấm một tài khoản để điền sẵn</span>
          </span>
          <ChevronDown className={cn("size-5 shrink-0 text-muted transition-transform", showDemo && "rotate-180")} aria-hidden />
        </button>
        {showDemo && (
          <ul className="mt-3 grid grid-cols-1 gap-2">
            {accounts.map((a) => {
              const u = users.find((x) => x.id === a.id);
              if (!u) return null;
              return (
                <li key={a.id} className={cn("flex items-center gap-3 rounded-xl border bg-surface p-2.5", preferredRole === u.role ? "border-cyan/60 ring-1 ring-cyan/30" : "border-line")}>
                  <button type="button" onClick={() => fill(u)} className="flex min-w-0 flex-1 items-center gap-3 text-left" aria-label={`Điền tài khoản ${u.name}`}>
                    <Avatar user={u} size={36} />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-fg">{u.name} <span className="font-normal text-muted">· {ROLE_LABEL[u.role]}</span></span>
                      <span className="block truncate font-mono text-xs text-muted">{u.email}</span>
                    </span>
                  </button>
                  <Button type="button" size="sm" variant="ghost" disabled={!hydrated} onClick={() => onEnter(u)} data-testid={`login-${a.id}`} title={a.desc}>Vào nhanh</Button>
                </li>
              );
            })}
          </ul>
        )}
        <p className="mt-3 text-xs text-muted">Bản dùng thử lưu tài khoản và dữ liệu trên trình duyệt này; mật khẩu được mã hóa một chiều trước khi lưu.</p>
      </section>
    </div>
  );
}
