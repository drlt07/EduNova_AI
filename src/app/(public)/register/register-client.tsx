"use client";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input, Select } from "@/components/ui/form";
import { Notice } from "@/components/ui/feedback";

const schema = z
  .object({
    name: z.string().trim().min(2, "Nhập họ tên (ít nhất 2 ký tự)").max(80),
    email: z.string().trim().email("Email không hợp lệ"),
    role: z.enum(["teacher", "student"], { message: "Chọn vai trò" }),
    school: z.string().trim().min(2, "Nhập tên trường").max(120),
    password: z.string().min(8, "Mật khẩu tối thiểu 8 ký tự").regex(/[0-9]/, "Cần ít nhất 1 chữ số"),
    confirm: z.string(),
    agree: z.boolean().refine((v) => v, "Cần đồng ý điều khoản"),
  })
  .refine((v) => v.password === v.confirm, { path: ["confirm"], message: "Mật khẩu nhập lại không khớp" });

type Values = z.infer<typeof schema>;

export function RegisterClient() {
  const [done, setDone] = useState<Values | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { role: "teacher", agree: false } });

  if (done)
    return (
      <div className="rounded-2xl border border-line bg-surface p-8 text-center">
        <CheckCircle2 className="mx-auto size-10 text-success-fg" aria-hidden />
        <h2 className="mt-3 text-xl font-semibold text-fg">Thông tin hợp lệ</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted">
          Bản dùng thử <strong className="text-fg">chưa tạo tài khoản thật</strong> và không lưu thông tin bạn vừa nhập. Hãy dùng tài khoản dùng thử để trải nghiệm.
        </p>
        <Button asChild className="mt-5"><Link href={`/login?role=${done.role}`}>Dùng tài khoản dùng thử {done.role === "teacher" ? "Giáo viên" : "Học sinh"}</Link></Button>
      </div>
    );

  const err = (k: keyof Values) => (errors[k] ? { "aria-invalid": true, "aria-describedby": `${k}-error` } : {});
  return (
    <form noValidate onSubmit={handleSubmit((v) => setDone(v))} className="space-y-4 rounded-2xl border border-line bg-surface p-6">
      <p className="text-sm text-muted">Đăng ký tài khoản thật sẽ mở ở phiên bản chính thức. Hiện tại bạn có thể dùng tài khoản dùng thử.</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Họ và tên" htmlFor="name" error={errors.name?.message}><Input id="name" autoComplete="name" {...register("name")} {...err("name")} /></Field>
        <Field label="Email" htmlFor="email" error={errors.email?.message}><Input id="email" type="email" autoComplete="email" {...register("email")} {...err("email")} /></Field>
        <Field label="Vai trò" htmlFor="role" error={errors.role?.message}>
          <Select id="role" {...register("role")} {...err("role")}><option value="teacher">Giáo viên</option><option value="student">Học sinh</option></Select>
        </Field>
        <Field label="Trường" htmlFor="school" error={errors.school?.message}><Input id="school" {...register("school")} {...err("school")} /></Field>
        <Field label="Mật khẩu" htmlFor="password" error={errors.password?.message} hint="≥ 8 ký tự, có chữ số"><Input id="password" type="password" autoComplete="new-password" {...register("password")} {...err("password")} /></Field>
        <Field label="Nhập lại mật khẩu" htmlFor="confirm" error={errors.confirm?.message}><Input id="confirm" type="password" autoComplete="new-password" {...register("confirm")} {...err("confirm")} /></Field>
      </div>
      <div>
        <Checkbox label="Tôi đồng ý với điều khoản sử dụng và chính sách bảo vệ dữ liệu học sinh" {...register("agree")} />
        {errors.agree && <p className="mt-1 text-xs font-medium text-danger-fg" role="alert">{errors.agree.message}</p>}
      </div>
      <Notice tone="info" className="text-xs">Tài khoản học sinh dưới 16 tuổi sẽ cần xác nhận của nhà trường khi tích hợp thật.</Notice>
      <Button type="submit" disabled={isSubmitting} className="w-full">Kiểm tra & đăng ký</Button>
    </form>
  );
}
