"use client";
import { CheckCircle2, RotateCcw, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface MissionStage {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const starsFor = (mistakes: number): 1 | 2 | 3 => (mistakes <= 1 ? 3 : mistakes <= 4 ? 2 : 1);

/** Thanh tiến trình các nhiệm vụ của một mô phỏng. */
export function MissionStepper({ stages, current }: { stages: MissionStage[]; current: string }) {
  const idx = stages.findIndex((s) => s.id === current);
  return (
    <ol className={cn("grid gap-1.5", stages.length === 4 ? "grid-cols-4" : "grid-cols-3")} aria-label="Tiến trình">
      {stages.map((s, i) => {
        const done = idx === -1 || i < idx;
        return (
          <li key={s.id} aria-current={s.id === current ? "step" : undefined} className={cn("flex flex-col items-center gap-1 rounded-xl border px-2 py-2 text-center text-[11px] font-semibold", s.id === current ? "border-cyan bg-cyan/10 text-cyan-fg" : done ? "border-success/40 bg-success/10 text-success-fg" : "border-line text-muted")}>
            {done ? <CheckCircle2 className="size-4" aria-hidden /> : <s.icon className="size-4" aria-hidden />}
            {i + 1}. {s.label}
          </li>
        );
      })}
    </ol>
  );
}

export interface Feedback {
  ok: boolean;
  text: string;
}

export function MissionFeedback({ feedback, mistakes }: { feedback: Feedback | null; mistakes: number }) {
  return (
    <>
      {feedback && <p role="status" className={cn("rounded-xl border px-3 py-2 text-sm", feedback.ok ? "border-success/30 bg-success/10 text-fg" : "border-danger/30 bg-danger/10 text-fg")}>{feedback.text}</p>}
      <p className="text-xs text-muted">Số lần chọn sai: {mistakes}</p>
    </>
  );
}

/** Màn hình hoàn thành: sao theo số lần sai và các ý cần nhớ. */
export function MissionDone({ mistakes, title, points, onRestart }: { mistakes: number; title: string; points: React.ReactNode[]; onRestart: () => void }) {
  const s = starsFor(mistakes);
  return (
    <div className="text-center">
      <div className="flex justify-center gap-1" aria-label={`${s} trên 3 sao`}>
        {[1, 2, 3].map((i) => <Star key={i} className={cn("size-8", i <= s ? "fill-warning text-warning" : "text-line")} aria-hidden />)}
      </div>
      <h3 className="mt-2 font-semibold text-fg">{title}</h3>
      <p className="mt-1 text-sm text-muted">Số lần chọn sai: <b className="text-fg">{mistakes}</b></p>
      <ul className="mt-3 space-y-1 text-left text-xs text-fg">{points.map((p, i) => <li key={i}>• {p}</li>)}</ul>
      <Button size="sm" variant="secondary" className="mt-3" onClick={onRestart}><RotateCcw /> Làm lại</Button>
    </div>
  );
}

/** Bố cục chung: cảnh mô phỏng bên trái, bảng nhiệm vụ bên phải. */
export function MissionLayout({ scene, stages, current, feedback, mistakes, children }: { scene: React.ReactNode; stages: MissionStage[]; current: string; feedback: Feedback | null; mistakes: number; children: React.ReactNode }) {
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
      <div className="min-w-0 self-start">{scene}</div>
      <aside className="flex flex-col gap-3" aria-label="Nhiệm vụ">
        <MissionStepper stages={stages} current={current} />
        <section className="rounded-2xl border border-line bg-surface p-4">{children}</section>
        <MissionFeedback feedback={feedback} mistakes={mistakes} />
      </aside>
    </div>
  );
}
