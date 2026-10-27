import * as React from "react";
import { cn } from "@/lib/utils";

const field = "w-full rounded-xl border border-line bg-surface-2 px-3 text-sm text-fg placeholder:text-muted/70 focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-60 aria-[invalid=true]:border-danger";

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(field, "h-10", className)} {...props} />;
}
export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(field, "min-h-[88px] py-2 leading-relaxed", className)} {...props} />;
}
export function Select({ className, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(field, "h-10 cursor-pointer pr-8", className)} {...props}>
      {children}
    </select>
  );
}
export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("text-sm font-medium text-fg", className)} {...props} />;
}

export function Field({ label, htmlFor, error, hint, children, className }: { label: string; htmlFor: string; error?: string; hint?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint && !error && <p className="text-xs text-muted">{hint}</p>}
      {error && (
        <p className="text-xs font-medium text-danger-fg" role="alert" id={`${htmlFor}-error`}>
          {error}
        </p>
      )}
    </div>
  );
}

export function Checkbox({ label, className, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: React.ReactNode }) {
  return (
    <label className={cn("flex cursor-pointer items-start gap-2 text-sm text-fg", className)}>
      <input type="checkbox" className="mt-0.5 size-4 shrink-0 cursor-pointer accent-[var(--cyan)]" {...props} />
      <span>{label}</span>
    </label>
  );
}
