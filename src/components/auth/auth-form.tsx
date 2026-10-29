/** Ô nhập, nhãn và nút dùng chung cho các trang Đăng nhập / Đăng ký / Quên mật khẩu (màu thương hiệu EduNova). */
import Link from "next/link";
import { cn } from "@/lib/utils";

export const authInput = "h-12 w-full rounded-xl border border-line bg-surface px-4 text-[15px] text-fg shadow-sm shadow-slate-900/[0.03] outline-none transition placeholder:text-muted/60 hover:border-slate-300 focus:border-brand focus:ring-4 focus:ring-brand/15 aria-[invalid=true]:border-danger dark:hover:border-slate-600";

export function AuthField({ label, htmlFor, error, hint, icon: Icon, children }: { label: string; htmlFor: string; error?: string; hint?: string; icon?: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-semibold text-fg">{label}</label>
      <div className="relative">
        {Icon && <Icon className="pointer-events-none absolute left-3.5 top-1/2 z-10 size-[18px] -translate-y-1/2 text-muted" aria-hidden />}
        {children}
      </div>
      {hint && !error && <p className="mt-1.5 text-xs text-muted">{hint}</p>}
      {error && <p id={`${htmlFor}-error`} role="alert" className="mt-1.5 text-xs font-medium text-danger-fg">{error}</p>}
    </div>
  );
}

export function AuthSubmit({ children, disabled, className }: { children: React.ReactNode; disabled?: boolean; className?: string }) {
  return (
    <button type="submit" disabled={disabled} className={cn("inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand text-[15px] font-bold text-brand-ink shadow-lg shadow-brand/25 transition hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/30 disabled:opacity-60", className)}>
      {children}
    </button>
  );
}

/** Lối vào kho mô phỏng không cần tài khoản. */
export function AuthAlt() {
  return <p className="mt-5 text-center text-sm text-muted">Chỉ muốn xem thử? <Link href="/kho" className="font-semibold text-blue-fg hover:underline">Khám phá kho mô phỏng</Link></p>;
}
