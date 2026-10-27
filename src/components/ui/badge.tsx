import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

const badgeVariants = cva("inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap", {
  variants: {
    tone: {
      neutral: "border-line bg-surface-2 text-muted",
      cyan: "border-cyan/30 bg-cyan/10 text-cyan-fg",
      blue: "border-blue/30 bg-blue/10 text-blue-fg",
      violet: "border-violet/30 bg-violet/10 text-violet-fg",
      success: "border-success/30 bg-success/10 text-success-fg",
      warning: "border-warning/30 bg-warning/10 text-warning-fg",
      danger: "border-danger/30 bg-danger/10 text-danger-fg",
    },
  },
  defaultVariants: { tone: "neutral" },
});

export function Badge({ className, tone, ...props }: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}
