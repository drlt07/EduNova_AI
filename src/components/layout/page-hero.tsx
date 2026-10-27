import { cn } from "@/lib/utils";

export interface HeroStat {
  value: React.ReactNode;
  label: string;
}

/**
 * Phần mở đầu của trang: nhãn, tiêu đề (có phần nhấn), mô tả, nút, chỉ số thật và một hình ảnh sống bên phải
 * (mô phỏng nhỏ, thẻ khối lớp…). "public": dải rộng có lưới và quầng sáng; "app": thẻ bo góc trong không gian học.
 */
export function PageHero({
  eyebrow,
  icon: Icon,
  title,
  accent,
  description,
  actions,
  stats,
  visual,
  variant = "public",
  id = "page-title",
}: {
  eyebrow: string;
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  /** Phần tiêu đề tô màu nhấn, đặt sau title */
  accent?: string;
  description: React.ReactNode;
  actions?: React.ReactNode;
  stats?: HeroStat[];
  visual?: React.ReactNode;
  variant?: "public" | "app";
  id?: string;
}) {
  const body = (
    <div className={cn("relative grid items-center gap-8", visual && "lg:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)]")}>
      <div className="min-w-0">
        <p className="inline-flex items-center gap-2 rounded-full border border-cyan/30 bg-cyan/10 px-3 py-1 text-xs font-semibold text-cyan-fg">
          {Icon && <Icon className="size-3.5" aria-hidden />} {eyebrow}
        </p>
        <h1 id={id} className={cn("mt-4 text-balance font-extrabold leading-[1.1] tracking-tight text-fg", variant === "public" ? "text-4xl sm:text-5xl" : "text-3xl sm:text-4xl")}>
          {title}
          {accent && <> <span className="text-gradient">{accent}</span></>}
        </h1>
        <div className="mt-4 max-w-xl text-muted sm:text-lg">{description}</div>
        {actions && <div className="mt-6 flex flex-wrap gap-3">{actions}</div>}
        {stats && stats.length > 0 && (
          <dl className="mt-7 grid max-w-xl grid-cols-2 gap-3 sm:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="rounded-2xl border border-line/80 bg-surface/70 px-3 py-2.5 backdrop-blur">
                <dd className="text-xl font-bold text-fg tabular-nums">{s.value}</dd>
                <dt className="text-xs leading-snug text-muted">{s.label}</dt>
              </div>
            ))}
          </dl>
        )}
      </div>
      {visual && <div className="min-w-0">{visual}</div>}
    </div>
  );

  if (variant === "app") {
    return (
      <section aria-labelledby={id} className="relative mb-8 overflow-hidden rounded-3xl border border-line bg-gradient-to-br from-cyan/15 via-surface to-violet/15 p-6 sm:p-8">
        <span aria-hidden className="pointer-events-none absolute -right-10 -top-16 size-56 rounded-full bg-cyan/25 blur-3xl" />
        <span aria-hidden className="pointer-events-none absolute -bottom-20 right-1/3 size-56 rounded-full bg-violet/20 blur-3xl" />
        {body}
      </section>
    );
  }
  return (
    <section aria-labelledby={id} className="relative overflow-hidden border-b border-line bg-grid">
      <div aria-hidden className="pointer-events-none absolute -top-40 left-1/2 h-[480px] w-[860px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(79,127,255,0.26),transparent)]" />
      <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:py-16">{body}</div>
    </section>
  );
}
