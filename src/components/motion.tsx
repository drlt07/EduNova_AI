"use client";
/** Hiệu ứng chuyển động dùng chung. MotionConfig reducedMotion="user" ở Providers tự tắt khi người dùng bật giảm chuyển động. */
import { animate, motion, useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export function FadeIn({ children, delay = 0, className }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div className={className} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28, delay, ease: "easeOut" }}>
      {children}
    </motion.div>
  );
}

export function Stagger({ children, className, as = "div" }: { children: React.ReactNode; className?: string; as?: "div" | "ul" }) {
  const Comp = as === "ul" ? motion.ul : motion.div;
  return (
    <Comp className={className} initial="hidden" animate="show" variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05 } } }}>
      {children}
    </Comp>
  );
}

export function StaggerItem({ children, className, as = "div" }: { children: React.ReactNode; className?: string; as?: "div" | "li" }) {
  const Comp = as === "li" ? motion.li : motion.div;
  return (
    <Comp className={className} variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.26, ease: "easeOut" } } }}>
      {children}
    </Comp>
  );
}

/** Số đếm tăng dần khi xuất hiện. */
export function CountUp({ value, suffix = "" }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(value);
  useEffect(() => {
    if (!inView || reduce) return;
    const c = animate(0, value, { duration: 0.8, ease: "easeOut", onUpdate: (v) => setShown(Math.round(v)) });
    return () => c.stop();
  }, [inView, value, reduce]);
  return (
    <span ref={ref} className="tabular-nums">
      {reduce ? value : shown}
      {suffix}
    </span>
  );
}

/** Thanh tiến độ chạy từ 0 khi xuất hiện. value = null → chưa có dữ liệu. */
export function AnimatedBar({ value, tone = "cyan", label, className }: { value: number | null; tone?: "cyan" | "violet" | "success" | "warning"; label: string; className?: string }) {
  const color = { cyan: "from-cyan to-blue", violet: "from-violet to-blue", success: "from-success to-cyan", warning: "from-warning to-danger" }[tone];
  const v = value === null ? 0 : Math.max(0, Math.min(100, value));
  return (
    <div className={cn("h-2.5 w-full overflow-hidden rounded-full bg-surface-2", className)} role="progressbar" aria-label={label} aria-valuenow={value ?? undefined} aria-valuemin={0} aria-valuemax={100} aria-valuetext={value === null ? "chưa có dữ liệu" : `${v}%`}>
      {value !== null && <motion.div className={cn("h-full rounded-full bg-gradient-to-r", color)} initial={{ width: 0 }} whileInView={{ width: `${v}%` }} viewport={{ once: true }} transition={{ duration: 0.7, ease: "easeOut" }} />}
    </div>
  );
}

/** Pháo giấy nhỏ khi hoàn thành cấp độ / nhận huy hiệu. */
export function Celebrate({ show }: { show: boolean }) {
  const reduce = useReducedMotion();
  if (!show || reduce) return null;
  const pieces = Array.from({ length: 18 }, (_, i) => i);
  const colors = ["#22d3ee", "#4f7fff", "#8b5cf6", "#34d399", "#fbbf24", "#fb7185"];
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {pieces.map((i) => (
        <motion.span
          key={i}
          className="absolute left-1/2 top-1/2 size-2 rounded-sm"
          style={{ background: colors[i % colors.length] }}
          initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
          animate={{ x: Math.cos((i / pieces.length) * Math.PI * 2) * (90 + (i % 3) * 40), y: Math.sin((i / pieces.length) * Math.PI * 2) * (70 + (i % 4) * 25) + 40, opacity: 0, rotate: 270 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
      ))}
    </div>
  );
}
