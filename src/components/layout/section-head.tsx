import { cn } from "@/lib/utils";

const TONE = {
  cyan: { icon: "from-[#22d3ee] to-[#4f7fff]", text: "from-[#0891b2] to-[#4f7fff]" },
  violet: { icon: "from-[#a855f7] to-[#4f7fff]", text: "from-[#9333ea] to-[#4f7fff]" },
  emerald: { icon: "from-[#34d399] to-[#0d9488]", text: "from-[#059669] to-[#0d9488]" },
} as const;

/** Đầu trang gọn: biểu tượng tròn, tiêu đề màu và một dòng mô tả; thao tác chính bên phải. */
export function SectionHead({ icon: Icon, title, subtitle, tone = "cyan", actions }: { icon: React.ComponentType<{ className?: string }>; title: string; subtitle: string; tone?: keyof typeof TONE; actions?: React.ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-center gap-4">
      <span className={cn("grid size-14 shrink-0 place-items-center rounded-full bg-gradient-to-br text-white shadow-[0_10px_30px_-10px_rgba(79,127,255,0.6)] sm:size-16", TONE[tone].icon)}>
        <Icon className="size-7" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <h1 className={cn("bg-gradient-to-r bg-clip-text text-2xl font-extrabold tracking-tight text-transparent sm:text-3xl", TONE[tone].text)}>{title}</h1>
        <p className="text-sm text-muted sm:text-base">{subtitle}</p>
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
