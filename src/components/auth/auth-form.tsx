/** Ô nhập, nhãn và nút dùng chung cho các trang Đăng nhập / Đăng ký / Quên mật khẩu. */
import { cn } from "@/lib/utils";

export const authInput = "h-12 w-full rounded-lg border border-slate-300 bg-[#f1f4ff] px-4 text-[15px] text-fg outline-none transition-colors placeholder:text-slate-400 focus:border-[#4b3bdc] focus:bg-surface focus:ring-2 focus:ring-[#4b3bdc]/25 aria-[invalid=true]:border-danger dark:border-slate-600 dark:bg-slate-800";

export function AuthField({ label, htmlFor, error, hint, children }: { label: string; htmlFor: string; error?: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-2 block text-[15px] font-bold text-fg">{label}</label>
      {children}
      {hint && !error && <p className="mt-1.5 text-xs text-muted">{hint}</p>}
      {error && <p id={`${htmlFor}-error`} role="alert" className="mt-1.5 text-xs font-medium text-danger-fg">{error}</p>}
    </div>
  );
}

export function AuthSubmit({ children, disabled, className }: { children: React.ReactNode; disabled?: boolean; className?: string }) {
  return (
    <button type="submit" disabled={disabled} className={cn("h-12 w-full rounded-full bg-[#4b3bdc] text-[15px] font-bold text-white shadow-sm transition-colors hover:bg-[#3d2fc4] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#4b3bdc]/30 disabled:opacity-60", className)}>
      {children}
    </button>
  );
}
