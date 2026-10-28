import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock, Box, Binary, Code2, Database, Globe, Network, ShieldCheck, Sprout, Brain, Search, Cpu, Users } from "lucide-react";
import type { LabTemplate } from "@/lib/domain/types";
import { cn } from "@/lib/utils";
import { LAB_LEVELS, labMeta, topicLabel, type LabLevel } from "@/lib/data/lab-catalog";
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

export type LabProgress = { label: string; done: boolean } | undefined;

const LEVEL_TONE: Record<LabLevel, string> = { "co-ban": "bg-[#10b981] text-white", "trung-binh": "bg-[#f59e0b] text-[#1f1300]", "nang-cao": "bg-[#e11d48] text-white" };

export interface SimCardProps {
  href?: string;
  art: string;
  grades: number[];
  level: LabLevel;
  minutes: number;
  missions: number;
  topic: string;
  title: string;
  description: string;
  footer: string;
  cta?: string;
  pill?: LabProgress;
  dim?: boolean;
}

/** Thẻ một tình huống mô phỏng: ảnh cảnh chính phủ tối, nhãn lớp – mức độ – trạng thái, thời lượng, số nhiệm vụ. */
export function SimCard({ href, art, grades, level, minutes, missions, topic, title, description, footer, cta = "Khám phá", pill, dim }: SimCardProps) {
  const body = (
    <>
      <div className="relative aspect-[16/9] overflow-hidden bg-slate-900">
        <LabArt slug={art} className={cn("size-full brightness-[.85] transition-transform duration-500 group-hover:scale-105", dim && "saturate-[0.5]")} />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/25 to-slate-950/45" />
        <div className="absolute inset-x-4 top-4 flex items-start gap-1.5">
          {grades.map((g) => <span key={g} className="rounded-lg bg-[#2563eb] px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-white">Lớp {g}</span>)}
          <span className={cn("rounded-lg px-2.5 py-1 text-xs font-semibold", LEVEL_TONE[level])}>{LAB_LEVELS[level]}</span>
          {pill && <span className={cn("ml-auto rounded-lg px-2.5 py-1 text-xs font-medium backdrop-blur", pill.done ? "bg-[#10b981]/90 text-white" : "bg-slate-950/60 text-white")}>{pill.done && <CheckCircle2 className="mr-1 inline size-3.5 align-[-2px]" aria-hidden />}{pill.label}</span>}
        </div>
        <p className="absolute bottom-3.5 left-4 flex items-center gap-2 text-sm font-medium text-white">
          <Clock className="size-4 text-[#7dd3fc]" aria-hidden /> {minutes} phút <span aria-hidden className="text-white/60">•</span> {missions} nhiệm vụ
        </p>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="text-sm font-semibold text-blue-fg">{topic}</p>
        <h3 className="mt-1 text-lg font-bold leading-snug text-fg">{title}</h3>
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted">{description}</p>
        <div className="mt-auto flex items-center justify-between gap-3 border-t border-line pt-4">
          <span className="min-w-0 truncate text-sm text-muted">{footer}</span>
          <span className={cn("inline-flex shrink-0 items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold transition-colors", href ? "bg-brand/10 text-blue-fg group-hover:bg-brand group-hover:text-brand-ink" : "bg-surface-2 text-muted")}>
            {cta} {href && <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />}
          </span>
        </div>
      </div>
    </>
  );
  const cls = "group flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-sm transition-all";
  return href ? <Link href={href} className={cn(cls, "hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-900/10")}>{body}</Link> : <div className={cn(cls, "opacity-80")}>{body}</div>;
}

export function LabCard({ lab, href, progress }: { lab: LabTemplate; href: string; progress?: LabProgress }) {
  const m = labMeta(lab.slug);
  const planned = lab.status === "planned";
  const pill = progress ?? (planned ? { label: "Sắp có", done: false } : lab.status === "preview" ? { label: "Bản xem thử", done: false } : undefined);
  return <SimCard href={href} art={lab.slug} grades={lab.grades} level={m.level} minutes={m.minutes} missions={m.missions} topic={topicLabel(m.topic)} title={lab.title} description={lab.tagline} footer={`${lab.sampleTasks.length} thử thách`} cta={planned ? "Xem trước" : "Khám phá"} pill={pill} dim={planned} />;
}
