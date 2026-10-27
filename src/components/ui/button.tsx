import { Slot } from "radix-ui";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-gradient-to-r from-[#22d3ee] to-[#4f7fff] text-[#04111f] shadow-[0_0_24px_-6px_var(--cyan)] hover:brightness-110",
        secondary: "bg-surface-2 text-fg border border-line hover:border-cyan/60",
        outline: "border border-line bg-transparent text-fg hover:bg-surface-2",
        ghost: "text-muted hover:text-fg hover:bg-surface-2",
        danger: "bg-danger/15 text-danger-fg border border-danger/30 hover:bg-danger/25",
        violet: "bg-[#6d28d9] text-white hover:bg-[#7c3aed]",
        /** Nút chính kiểu tối giản cho trang công khai: nền chữ đậm, không gradient, không phát sáng */
        ink: "bg-fg text-bg hover:bg-fg/85",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-4",
        lg: "h-12 px-6 text-base",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export function Button({ className, variant, size, asChild, type, ...props }: ButtonProps) {
  const Comp = asChild ? Slot.Root : "button";
  return <Comp className={cn(buttonVariants({ variant, size }), className)} type={asChild ? undefined : (type ?? "button")} {...props} />;
}
