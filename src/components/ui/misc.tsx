import * as React from "react";
import { cn } from "@/lib/utils";
import type { User } from "@/lib/domain/types";

export function Avatar({ user, size = 32, className }: { user: Pick<User, "name" | "hue">; size?: number; className?: string }) {
  const initials = user.name.split(" ").slice(-2).map((p) => p[0]).join("").toUpperCase();
  return (
    <span
      aria-hidden
      className={cn("inline-grid shrink-0 place-items-center rounded-full font-semibold text-white", className)}
      style={{ width: size, height: size, fontSize: size * 0.38, background: `linear-gradient(135deg, hsl(${user.hue} 70% 45%), hsl(${(user.hue + 40) % 360} 70% 35%))` }}
    >
      {initials}
    </span>
  );
}

export function PageHeader({ title, description, actions, badge }: { title: string; description?: string; actions?: React.ReactNode; badge?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-fg sm:text-[28px]">{title}</h1>
          {badge}
        </div>
        {description && <p className="mt-1 max-w-3xl text-sm text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function StatCard({ label, value, hint, icon: Icon, tone = "cyan" }: { label: string; value: React.ReactNode; hint?: string; icon: React.ComponentType<{ className?: string }>; tone?: "cyan" | "blue" | "violet" | "success" }) {
  const c = { cyan: "text-cyan-fg bg-cyan/10", blue: "text-blue-fg bg-blue/10", violet: "text-violet-fg bg-violet/10", success: "text-success-fg bg-success/10" }[tone];
  return (
    <div className="rounded-2xl border border-line bg-surface p-5">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm text-muted">{label}</p>
        <span className={cn("grid size-9 place-items-center rounded-xl", c)}>
          <Icon className="size-[18px]" />
        </span>
      </div>
      <p className="mt-2 text-3xl font-bold tracking-tight text-fg tabular-nums">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}

export function Kbd({ children }: { children: React.ReactNode }) {
  return <kbd className="rounded-md border border-line bg-surface-2 px-1.5 py-0.5 font-mono text-[11px] text-muted">{children}</kbd>;
}
