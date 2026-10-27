import { AlertTriangle, Inbox } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-xl bg-surface-2", className)} aria-hidden />;
}

export function PageSkeleton() {
  return (
    <div className="space-y-4" role="status" aria-live="polite">
      <span className="sr-only">Đang tải dữ liệu…</span>
      <Skeleton className="h-8 w-64" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
      <Skeleton className="h-64" />
    </div>
  );
}

export function EmptyState({ title, description, action, icon: Icon = Inbox, className }: { title: string; description?: string; action?: React.ReactNode; icon?: React.ComponentType<{ className?: string }>; className?: string }) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-line p-10 text-center", className)}>
      <div className="grid size-12 place-items-center rounded-2xl bg-surface-2 text-muted">
        <Icon className="size-6" aria-hidden />
      </div>
      <div>
        <p className="font-semibold text-fg">{title}</p>
        {description && <p className="mt-1 max-w-md text-sm text-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function ErrorState({ title = "Đã xảy ra lỗi", description, action, page }: { title?: string; description?: string; action?: React.ReactNode; /** true khi là nội dung chính của trang → dùng h1 */ page?: boolean }) {
  const Heading = page ? "h1" : "p";
  return (
    <div role="alert" className="flex flex-col items-center gap-3 rounded-2xl border border-danger/30 bg-danger/5 p-8 text-center">
      <AlertTriangle className="size-8 text-danger-fg" aria-hidden />
      <Heading className="text-lg font-semibold text-fg">{title}</Heading>
      {description && <p className="max-w-md text-sm text-muted">{description}</p>}
      {action}
    </div>
  );
}

export function Progress({ value, className, tone = "cyan", label }: { value: number; className?: string; tone?: "cyan" | "violet" | "success" | "warning"; label?: string }) {
  const v = Math.max(0, Math.min(100, value));
  const color = { cyan: "from-cyan to-blue", violet: "from-violet to-blue", success: "from-success to-cyan", warning: "from-warning to-danger" }[tone];
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-surface-2", className)} role="progressbar" aria-valuenow={v} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
      <div className={cn("h-full rounded-full bg-gradient-to-r transition-[width]", color)} style={{ width: `${v}%` }} />
    </div>
  );
}

export function Notice({ tone = "warning", children, className }: { tone?: "warning" | "info" | "danger"; children: React.ReactNode; className?: string }) {
  const c = { warning: "border-warning/30 bg-warning/5", info: "border-cyan/30 bg-cyan/5", danger: "border-danger/30 bg-danger/5" }[tone];
  return <div className={cn("rounded-xl border px-4 py-3 text-sm text-fg", c, className)}>{children}</div>;
}
