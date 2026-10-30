"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input, Select } from "@/components/ui/form";
import { Notice } from "@/components/ui/feedback";
import { PasswordInput } from "@/components/auth/password-input";
import { AuthSubmit } from "@/components/auth/auth-form";
import { AUTH_MODE } from "@/lib/supabase/config";
import { supabaseBrowser } from "@/lib/supabase/client";
import { authErrorVi } from "@/lib/auth/errors";
import { hashPassword, normalizeEmail } from "@/lib/auth/local-auth";
import { remember } from "@/lib/auth/remembered";
import { ROLE_HOME } from "@/lib/auth/paths";
import { useApp } from "@/lib/store/app-store";

const schema = z
  .object({
    name: z.string().trim().min(2, "Nhập họ tên (ít nhất 2 ký tự)").max(80),
    email: z.string().trim().email("Email không hợp lệ"),
    role: z.enum(["teacher", "student"], { message: "Chọn vai trò" }),
    school: z.string().trim().min(2, "Nhập tên trường").max(120),
    password: z.string().min(8, "Mật khẩu tối thiểu 8 ký tự").regex(/[0-9]/, "Cần ít nhất 1 chữ số"),
    confirm: z.string(),
    agree: z.boolean().refine((v) => v, "Cần đồng ý điều khoản"),
    inviteCode: z.string().trim().max(40).optional(),
  })
  .refine((v) => v.password === v.confirm, { path: ["confirm"], message: "Mật khẩu nhập lại không khớp" });

type Values = z.infer<typeof schema>;

export function RegisterClient() {
  const [sent, setSent] = useState<string | null>(null);
  const [error, setError] = useState("");
  const real = AUTH_MODE === "supabase";
  const router = useRouter();
  const registerLocal = useApp((s) => s.registerLocal);
  const login = useApp((s) => s.login);
  const classes = useApp((s) => s.classes);

  /** Bản dùng thử: tạo tài khoản trên trình duyệt này (mật khẩu băm PBKDF2), đăng nhập luôn. */
  async function submitLocal(v: Values) {
    setError("");
    const code = v.inviteCode?.trim();
    if (v.role === "student" && code && !classes.some((c) => c.inviteCode.toUpperCase() === code.toUpperCase())) return setError("Mã lớp không đúng. Hỏi thầy cô mã mời của lớp, hoặc để trống để vào lớp sau.");
    const credential = await hashPassword(v.password);
    const r = registerLocal({ name: v.name, email: v.email, role: v.role, credential, inviteCode: code });
    if (!r) return setError("Email này đã có tài khoản. Hãy đăng nhập, hoặc dùng email khác.");
    remember({ email: normalizeEmail(v.email), name: v.name.trim(), hue: useApp.getState().users.find((u) => u.id === r.id)?.hue ?? 200 });
    login(r.id);
    toast.success(r.classId ? `Đã tạo tài khoản và vào lớp ${classes.find((c) => c.id === r.classId)?.name}` : "Đã tạo tài khoản");
    router.push(ROLE_HOME[v.role]);
  }

  /** Bản thật: tạo tài khoản Supabase. Vai trò KHÔNG gửi lên — cơ sở dữ liệu tự xác định theo email trường. */
  async function submit(v: Values) {
    if (!real) return submitLocal(v);
    setError("");
    const sb = supabaseBrowser();
    if (!sb) return;
    const { error: e } = await sb.auth.signUp({
      email: v.email,
      password: v.password,
      options: { data: { full_name: v.name, school: v.school, ...(v.role === "student" && v.inviteCode?.trim() ? { invite_code: v.inviteCode.trim() } : {}) }, emailRedirectTo: `${window.location.origin}/auth/callback?next=/login` },
    });
    if (e) return setError(authErrorVi(e.message));
    setSent(v.email);
  }
  const { register, handleSubmit, control, formState: { errors, isSubmitting } } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { role: "student", agree: false } });
  const role = useWatch({ control, name: "role" });

  if (sent)
    return (
      <div className="rounded-2xl border border-line bg-surface p-8 text-center">
        <CheckCircle2 className="mx-auto size-10 text-success-fg" aria-hidden />
        <h2 className="mt-3 text-xl font-semibold text-fg">Kiểm tra hộp thư của bạn</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted">
          Chúng tôi đã gửi thư xác nhận tới <strong className="text-fg">{sent}</strong>. Bấm liên kết trong thư để kích hoạt tài khoản rồi đăng nhập. Không thấy thư? Xem mục Spam.
        </p>
        <Button asChild className="mt-5"><Link href="/login">Đến trang đăng nhập</Link></Button>
      </div>
    );

  const err = (k: keyof Values) => (errors[k] ? { "aria-invalid": true, "aria-describedby": `${k}-error` } : {});
  return (
    <form noValidate onSubmit={handleSubmit(submit)} className="space-y-4">
      {real ? (
        <Notice tone="info">Giáo viên: đăng ký bằng <strong>email của trường</strong> để tự nhận quyền giáo viên sau khi xác nhận email. Email cá nhân sẽ là tài khoản học sinh.</Notice>
      ) : (
        <p className="text-sm text-muted">Bản dùng thử: tài khoản được lưu trên trình duyệt này, mật khẩu mã hóa một chiều. Đăng ký xong em vào học ngay.</p>
      )}
      <div className="grid gap-4">
        <Field label="Họ và tên" htmlFor="name" error={errors.name?.message}><Input id="name" autoComplete="name" {...register("name")} {...err("name")} /></Field>
        <Field label="Email" htmlFor="email" error={errors.email?.message}><Input id="email" type="email" autoComplete="email" {...register("email")} {...err("email")} /></Field>
        {!real && (
          <Field label="Vai trò" htmlFor="role" error={errors.role?.message}>
            <Select id="role" {...register("role")} {...err("role")}><option value="teacher">Giáo viên</option><option value="student">Học sinh</option></Select>
          </Field>
        )}
        <Field label="Trường" htmlFor="school" error={errors.school?.message}><Input id="school" {...register("school")} {...err("school")} /></Field>
        {role === "student" && (
          <Field label="Mã lớp (không bắt buộc)" htmlFor="inviteCode" hint="Thầy cô gửi mã mời, ví dụ TIN10A1-7KQ"><Input id="inviteCode" autoComplete="off" className="font-mono uppercase" {...register("inviteCode")} /></Field>
        )}
        <Field label="Mật khẩu" htmlFor="password" error={errors.password?.message} hint="≥ 8 ký tự, có chữ số"><PasswordInput id="password" autoComplete="new-password" {...register("password")} {...err("password")} /></Field>
        <Field label="Nhập lại mật khẩu" htmlFor="confirm" error={errors.confirm?.message}><PasswordInput id="confirm" autoComplete="new-password" {...register("confirm")} {...err("confirm")} /></Field>
      </div>
      <div>
        <Checkbox label="Tôi đồng ý với điều khoản sử dụng và chính sách bảo vệ dữ liệu học sinh" {...register("agree")} />
        {errors.agree && <p className="mt-1 text-xs font-medium text-danger-fg" role="alert">{errors.agree.message}</p>}
      </div>
      <Notice tone="info" className="text-xs">Tài khoản học sinh dưới 16 tuổi sẽ cần xác nhận của nhà trường khi tích hợp thật.</Notice>
      {error && <div role="alert"><Notice tone="danger">{error}</Notice></div>}
      <AuthSubmit disabled={isSubmitting}>{isSubmitting ? "Đang tạo tài khoản…" : "Tạo tài khoản"}</AuthSubmit>
    </form>
  );
}
