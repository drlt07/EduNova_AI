"use client";
import { Tabs as T } from "radix-ui";
import * as React from "react";
import { cn } from "@/lib/utils";

export const Tabs = T.Root;
export function TabsList({ className, ...props }: React.ComponentProps<typeof T.List>) {
  return <T.List className={cn("inline-flex flex-wrap gap-1 rounded-xl border border-line bg-surface-2 p-1", className)} {...props} />;
}
export function TabsTrigger({ className, ...props }: React.ComponentProps<typeof T.Trigger>) {
  return (
    <T.Trigger
      className={cn(
        "rounded-lg px-3 py-1.5 text-sm font-medium text-muted transition-colors hover:text-fg focus-visible:outline-2 focus-visible:outline-ring data-[state=active]:bg-surface data-[state=active]:text-fg data-[state=active]:shadow-sm",
        className,
      )}
      {...props}
    />
  );
}
export function TabsContent({ className, ...props }: React.ComponentProps<typeof T.Content>) {
  return <T.Content className={cn("mt-4 focus-visible:outline-none", className)} {...props} />;
}

/** Nhóm nút lọc (không có panel tương ứng) — dùng aria-pressed thay vì role=tab. */
export function FilterGroup({ value, onChange, options, label }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; label: string }) {
  return (
    <div role="group" aria-label={label} className="inline-flex flex-wrap gap-1 rounded-xl border border-line bg-surface-2 p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn("rounded-lg px-3 py-1.5 text-sm font-medium text-muted transition-colors hover:text-fg", value === o.value && "bg-surface text-fg shadow-sm")}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
