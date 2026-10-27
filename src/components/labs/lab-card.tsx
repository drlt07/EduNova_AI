import Link from "next/link";
import { ArrowRight, Play, Box, Binary, Code2, Database, Globe, Network, ShieldCheck, Sprout, Brain, Search, Cpu, Users } from "lucide-react";
import type { LabTemplate } from "@/lib/domain/types";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { LabArt } from "./lab-art";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "smart-garden": Sprout,
  "binary-logic": Binary,
  "smart-coding-city": Code2,
  "debug-detective": Search,
  "digital-safety": ShieldCheck,
  "inside-computer-3d": Cpu,
  "os-explorer": Box,
  "database-city": Database,
  "sql-detective": Database,
  "ai-discovery": Brain,
  "network-journey": Network,
  "web-creator": Globe,
  "digital-citizen": Users,
};

export const ACCENT: Record<LabTemplate["accent"], string> = {
  cyan: "from-cyan/25 to-cyan/0 text-cyan-fg",
  blue: "from-blue/25 to-blue/0 text-blue-fg",
  violet: "from-violet/25 to-violet/0 text-violet-fg",
  emerald: "from-success/25 to-success/0 text-success-fg",
  amber: "from-warning/25 to-warning/0 text-warning-fg",
  rose: "from-danger/25 to-danger/0 text-danger-fg",
};

export const STATUS_LABEL: Record<LabTemplate["status"], string> = { available: "Dùng được", preview: "Dùng được (rút gọn)", planned: "Sắp có" };

export function LabIcon({ slug, className }: { slug: string; className?: string }) {
  const Icon = ICONS[slug] ?? Box;
  return <Icon className={className} />;
}

export function LabCard({ lab, href }: { lab: LabTemplate; href: string }) {
  return (
    <Link href={href} className="group flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-surface transition-all hover:-translate-y-0.5 hover:border-cyan/40 hover:shadow-[0_8px_40px_-16px_var(--cyan)]">
      <div className="relative aspect-[16/9] overflow-hidden border-b border-line bg-surface-2">
        <LabArt slug={lab.slug} className={cn("size-full transition-transform duration-500 group-hover:scale-105", lab.featureStatus === "PLANNED" && "opacity-75 saturate-[0.6]")} />
        <span className="absolute right-3 top-3 rounded-full bg-surface/90 shadow-sm backdrop-blur">
          {lab.featureStatus === "PLANNED" ? (
            <StatusBadge status={lab.featureStatus} />
          ) : (
            <span className="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold text-success-fg"><Play className="size-3" aria-hidden /> Chơi được</span>
          )}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-5 pt-4">
        <h3 className="flex items-center gap-2 font-semibold text-fg">
          <span className={cn("grid size-7 shrink-0 place-items-center rounded-lg bg-gradient-to-br", ACCENT[lab.accent])}>
            <LabIcon slug={lab.slug} className="size-4" />
          </span>
          {lab.title}
        </h3>
        <p className="mt-1 text-sm text-muted">{lab.tagline}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {lab.grades.map((g) => (
            <Badge key={g} tone="blue">Tin {g}</Badge>
          ))}
          {lab.tags.slice(0, 3).map((t) => (
            <Badge key={t}>{t}</Badge>
          ))}
        </div>
        <div className="mt-auto flex items-center justify-end pt-4 text-sm">
          <span className="flex items-center gap-1 font-medium text-cyan-fg">
            Chi tiết <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}
