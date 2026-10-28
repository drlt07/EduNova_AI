import { Slot } from "radix-ui";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-colors active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        /** Hành động chính của trang: một nút mỗi vùng, màu thương hiệu đặc. */
        primary: "bg-brand text-brand-ink hover:bg-brand-hover",
        /** Hành động phụ. */
        secondary: "bg-surface text-fg border border-line hover:bg-surface-2",
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
  /** Đang xử lí: khóa nút, hiện vòng quay, đọc được bằng trình đọc màn hình. */
  loading?: boolean;
}

export function Button({ className, variant, size, asChild, type, loading, disabled, children, ...props }: ButtonProps) {
  const Comp = asChild ? Slot.Root : "button";
  return (
    <Comp className={cn(buttonVariants({ variant, size }), className)} type={asChild ? undefined : (type ?? "button")} disabled={asChild ? undefined : disabled || loading} aria-busy={loading || undefined} {...props}>
      {loading && !asChild ? <><span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden />{children}</> : children}
    </Comp>
  );
}
