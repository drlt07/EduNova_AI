"use client";
import { Fragment, useState, type ReactNode } from "react";
import { AlertTriangle, CheckCircle2, ChevronDown, KeyRound, Lightbulb, Play, Send, Star, XCircle } from "lucide-react";
import type { BookBlock } from "@/lib/sgk/types";
import { getLabBySlug } from "@/lib/data/labs";
import { ALGOS } from "@/lib/data/hsg";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LabArt } from "@/components/labs/lab-art";
import { LabPreview } from "@/components/labs/lab-preview";
import { AlgoVisualizer } from "@/components/algo/algo-visualizer";
import { AlgoThumb } from "@/components/algo/hsg-catalog";
import { Figure } from "./figures";

/** **đậm** và `code` trong đoạn văn. */
export function Rich({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return <>{parts.map((p, i) => (p.startsWith("**") ? <strong key={i} className="font-semibold text-fg">{p.slice(2, -2)}</strong> : p.startsWith("`") ? <code key={i} className="rounded bg-surface-2 px-1 py-0.5 font-mono text-[0.9em] text-fg [font-variant-ligatures:none]">{p.slice(1, -1)}</code> : <Fragment key={i}>{p}</Fragment>))}</>;
}

const NOTE = {
  key: { icon: KeyRound, cls: "border-cyan/40 bg-cyan/5", label: "Ghi nhớ" },
  tip: { icon: Lightbulb, cls: "border-success/40 bg-success/5", label: "Mẹo" },
  warn: { icon: AlertTriangle, cls: "border-warning/50 bg-warning/5", label: "Chú ý" },
};

export interface BlockCtx {
  /** Giáo viên: hiện đáp án, nút chọn để dạy, giao nhiệm vụ. */
  teacher: boolean;
  /** Cỡ chữ lớn cho chế độ trình chiếu. */
  present?: boolean;
  picked?: (key: string) => boolean;
  onPick?: (key: string) => void;
  onAssign?: (slug: string) => void;
}

/** Câu hỏi củng cố ngay trong bài: chọn đáp án, xem giải thích. Giáo viên thấy đáp án ngay. */
function Check({ b, ctx }: { b: Extract<BookBlock, { t: "check" }>; ctx: BlockCtx }) {
  const [pick, setPick] = useState<number | null>(null);
  const show = pick !== null;
  return (
    <div className={cn("my-4 rounded-2xl border border-violet/30 bg-violet/5 p-4", ctx.present && "p-6")}>
      <p className={cn("text-xs font-semibold uppercase tracking-wide text-violet-fg", ctx.present && "text-sm")}>Câu hỏi củng cố</p>
      <p className={cn("mt-1 font-medium text-fg", ctx.present && "text-2xl")}><Rich text={b.q} /></p>
      <div className="mt-3 grid gap-2">
        {b.options.map((o, i) => {
          const right = i === b.answer;
          return (
            <button key={i} type="button" disabled={show} onClick={() => setPick(i)} className={cn("flex items-start gap-2 rounded-xl border px-3 py-2 text-left text-sm transition-colors", ctx.present && "text-xl", show && right ? "border-success bg-success/10" : show && pick === i ? "border-danger bg-danger/10" : "border-line bg-surface hover:border-violet/50", ctx.teacher && !show && right && "border-dashed border-success/60")}>
              <span className="font-semibold text-muted">{"ABCD"[i]}.</span>
              <span className="min-w-0 flex-1 whitespace-pre-line font-[inherit]">{o}</span>
              {show && right && <CheckCircle2 className="size-4 shrink-0 text-success-fg" aria-hidden />}
              {show && pick === i && !right && <XCircle className="size-4 shrink-0 text-danger-fg" aria-hidden />}
            </button>
          );
        })}
      </div>
      {show && <p className={cn("mt-2 text-sm text-fg", ctx.present && "text-lg")} role="status">{pick === b.answer ? "Đúng rồi! " : "Chưa đúng. "}{b.why}</p>}
      {ctx.teacher && !show && <p className="mt-2 text-xs text-muted">Đáp án (chỉ thầy cô thấy): {"ABCD"[b.answer]}. {b.why}</p>}
    </div>
  );
}

/** Mô phỏng đặt ngay trong mục kiến thức: mở ra làm tại chỗ, giáo viên chọn để dạy hoặc giao cho lớp. */
function Sim({ slug, task, ctx, itemKey }: { slug: string; task: string; ctx: BlockCtx; itemKey?: string }) {
  const lab = getLabBySlug(slug);
  const [open, setOpen] = useState(!!ctx.present);
  if (!lab) return null;
  const picked = itemKey && ctx.picked?.(itemKey);
  return (
    <div className="my-4 overflow-hidden rounded-2xl border border-cyan/40 bg-cyan/5">
      <div className="flex flex-wrap items-center gap-3 p-3">
        <LabArt slug={slug} className="h-14 w-24 shrink-0 rounded-lg" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-cyan-fg">Mô phỏng</p>
          <p className="font-semibold text-fg">{lab.title}</p>
          <p className="text-sm text-muted">Nhiệm vụ: {task}</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {ctx.teacher && itemKey && ctx.onPick && <Button size="sm" variant="ghost" aria-pressed={!!picked} onClick={() => ctx.onPick!(itemKey)}><Star className={cn(picked && "fill-warning text-warning")} /> {picked ? "Đã chọn" : "Chọn để dạy"}</Button>}
          {ctx.teacher && ctx.onAssign && <Button size="sm" variant="ghost" onClick={() => ctx.onAssign!(slug)}><Send /> Giao</Button>}
          <Button size="sm" variant={open ? "secondary" : "primary"} onClick={() => setOpen(!open)} aria-expanded={open}>{open ? <><ChevronDown className="rotate-180" /> Thu gọn</> : <><Play /> Mở mô phỏng</>}</Button>
        </div>
      </div>
      {open && <div className="border-t border-cyan/30 bg-surface p-3"><LabPreview slug={slug} /></div>}
    </div>
  );
}

function Algo({ id, task }: { id: keyof typeof ALGOS; task: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="my-4 overflow-hidden rounded-2xl border border-warning/40 bg-warning/5">
      <div className="flex flex-wrap items-center gap-3 p-3">
        <AlgoThumb id={id} className="h-12 w-20" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-warning-fg">Mô phỏng thuật toán</p>
          <p className="font-semibold text-fg">{ALGOS[id].title}</p>
          <p className="text-sm text-muted">{task}</p>
        </div>
        <Button size="sm" variant={open ? "secondary" : "primary"} onClick={() => setOpen(!open)}>{open ? "Thu gọn" : <><Play /> Chạy từng bước</>}</Button>
      </div>
      {open && <div className="border-t border-warning/30 bg-surface p-3"><AlgoVisualizer id={id} /></div>}
    </div>
  );
}

export function Block({ b, ctx, simKey }: { b: BookBlock; ctx: BlockCtx; simKey?: (slug: string) => string }): ReactNode {
  const big = ctx.present;
  switch (b.t) {
    case "p":
      return <p className={cn("my-3 leading-7 text-fg/90", big && "text-2xl leading-relaxed")}><Rich text={b.text} /></p>;
    case "list": {
      const L = b.ordered ? "ol" : "ul";
      return <L className={cn("my-3 space-y-1.5 pl-6 leading-7 text-fg/90", b.ordered ? "list-decimal" : "list-disc", big && "text-2xl leading-relaxed")}>{b.items.map((x) => <li key={x}><Rich text={x} /></li>)}</L>;
    }
    case "code":
      return (
        <figure className="my-4">
          <pre tabIndex={0} className={cn("overflow-x-auto rounded-xl bg-[#0b1220] p-4 font-mono text-[13px] leading-6 text-slate-200 [font-variant-ligatures:none]", big && "text-xl leading-9")}>{b.code}</pre>
          {b.output && <pre className={cn("-mt-1 overflow-x-auto rounded-b-xl border border-t-0 border-line bg-surface-2 px-4 py-2 font-mono text-xs leading-5 text-fg [font-variant-ligatures:none]", big && "text-lg")}><span className="mb-1 block font-sans text-[11px] font-semibold uppercase tracking-wide text-muted">Kết quả chạy</span>{b.output}</pre>}
          {b.caption && <figcaption className="mt-1 text-xs text-muted">{b.caption}</figcaption>}
        </figure>
      );
    case "table":
      return (
        <figure className="my-4 overflow-x-auto">
          <table className={cn("w-full border-collapse text-left text-sm", big && "text-xl")}>
            <thead><tr>{b.head.map((h) => <th key={h} className="border-b-2 border-line bg-surface-2 px-3 py-2 font-semibold text-fg">{h}</th>)}</tr></thead>
            <tbody>{b.rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j} className="border-b border-line px-3 py-2 text-fg/90">{c}</td>)}</tr>)}</tbody>
          </table>
          {b.caption && <figcaption className="mt-1 text-xs text-muted">{b.caption}</figcaption>}
        </figure>
      );
    case "note": {
      const n = NOTE[b.tone];
      return <aside className={cn("my-4 flex gap-3 rounded-xl border-l-4 p-3", n.cls, big && "p-5")}><n.icon className="mt-0.5 size-5 shrink-0 text-fg/70" aria-hidden /><p className={cn("text-sm leading-6 text-fg", big && "text-xl leading-relaxed")}><span className="sr-only">{n.label}: </span><Rich text={b.text} /></p></aside>;
    }
    case "figure":
      return <Figure id={b.fig} caption={b.caption} />;
    case "sim":
      return <Sim slug={b.slug} task={b.task} ctx={ctx} itemKey={simKey?.(b.slug)} />;
    case "algo":
      return <Algo id={b.id} task={b.task} />;
    case "check":
      return <Check b={b} ctx={ctx} />;
  }
}
