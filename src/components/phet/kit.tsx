"use client";
/**
 * Bộ khung mô phỏng theo cách làm của PhET: một vùng thao tác lớn, bảng điều khiển gọn bên phải,
 * nút "Đặt lại tất cả", và thanh chọn màn ở đáy (Khám phá tự do / Thử thách có chấm điểm).
 * Nguyên tắc: thao tác trực tiếp, phản hồi tức thì, nhiều cách biểu diễn liên kết với nhau, ít chữ.
 */
import { useState, type ReactNode } from "react";
import { Compass, Frown, RotateCcw, Smile, Star, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LabScore } from "@/components/sim/lab-result";

export interface SimScreen { id: string; label: string; icon?: React.ComponentType<{ className?: string }>; render: () => ReactNode }

/** Khung một mô phỏng: tên, các màn, thanh chọn màn ở đáy kiểu PhET. */
export function SimShell({ title, screens }: { title: string; screens: SimScreen[] }) {
  const [cur, setCur] = useState(screens[0].id);
  const s = screens.find((x) => x.id === cur) ?? screens[0];
  return (
    <div className="overflow-hidden rounded-3xl border border-line bg-surface shadow-sm">
      <div key={s.id} className="p-3 sm:p-4">{s.render()}</div>
      <nav aria-label={`Các màn của ${title}`} className="flex items-center gap-2 border-t border-slate-800 bg-[#0f172a] px-3 py-2">
        <span className="mr-auto truncate text-sm font-semibold text-white">{title}</span>
        {screens.map((x) => {
          const I = x.icon ?? (x.id === "thu-thach" ? Trophy : Compass);
          return (
            <button key={x.id} type="button" aria-current={x.id === cur ? "page" : undefined} onClick={() => setCur(x.id)} className={cn("flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors", x.id === cur ? "bg-white text-slate-900" : "text-slate-300 hover:bg-white/10 hover:text-white")}>
              <I className="size-4" aria-hidden /> {x.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

/** Bố cục màn: vùng thao tác (trái) + bảng điều khiển (phải). */
export function SimLayout({ stage, controls }: { stage: ReactNode; controls: ReactNode }) {
  return (
    <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="min-w-0">{stage}</div>
      <aside className="flex flex-col gap-3">{controls}</aside>
    </div>
  );
}

/** Vùng thao tác nền sáng, viền mềm. */
export function Stage({ children, className, dark }: { children: ReactNode; className?: string; dark?: boolean }) {
  return <div className={cn("relative overflow-hidden rounded-2xl border", dark ? "border-slate-800 bg-[#0f172a] text-white" : "border-sky-100 bg-gradient-to-b from-sky-50 to-white dark:border-slate-800 dark:from-slate-900 dark:to-slate-950", className)}>{children}</div>;
}

/** Hộp điều khiển kiểu PhET. */
export function Panel({ title, children, className }: { title?: string; children: ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-2xl border border-line bg-surface-2/70 p-3", className)}>
      {title && <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">{title}</h3>}
      <div className="space-y-2.5 text-sm text-fg">{children}</div>
    </section>
  );
}

export function SimSlider({ label, value, min, max, step = 1, onChange, unit = "", format }: { label: string; value: number; min: number; max: number; step?: number; onChange: (v: number) => void; unit?: string; format?: (v: number) => string }) {
  const id = `sl-${label.replace(/\W+/g, "-")}`;
  return (
    <div>
      <label htmlFor={id} className="flex items-baseline justify-between gap-2 text-sm"><span className="text-fg">{label}</span><b className="font-mono tabular-nums text-blue-fg">{format ? format(value) : `${value}${unit}`}</b></label>
      <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="mt-1 w-full accent-[var(--brand)]" />
    </div>
  );
}

export function SimToggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-2">
      <span>{label}</span>
      <button type="button" role="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)} className={cn("relative h-6 w-11 shrink-0 rounded-full transition-colors", checked ? "bg-brand" : "bg-slate-300 dark:bg-slate-600")}>
        <span className={cn("absolute top-0.5 size-5 rounded-full bg-white shadow transition-all", checked ? "left-[22px]" : "left-0.5")} />
      </button>
    </label>
  );
}

export function Segmented<T extends string | number>({ label, value, options, onChange }: { label: string; value: T; options: { value: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div>
      <p className="mb-1 text-sm text-fg">{label}</p>
      <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-1 rounded-xl bg-surface p-1">
        {options.map((o) => (
          <button key={String(o.value)} type="button" role="radio" aria-checked={o.value === value} onClick={() => onChange(o.value)} className={cn("flex-1 rounded-lg px-2 py-1 text-xs font-semibold transition-colors", o.value === value ? "bg-brand text-brand-ink" : "text-muted hover:text-fg")}>{o.label}</button>
        ))}
      </div>
    </div>
  );
}

/** Nút "Đặt lại tất cả" tròn màu cam, như PhET. */
export function ResetAll({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} aria-label="Đặt lại tất cả" title="Đặt lại tất cả" className="ml-auto grid size-11 place-items-center rounded-full bg-gradient-to-b from-orange-400 to-orange-600 text-white shadow-md ring-2 ring-orange-200 transition-transform hover:scale-105 active:scale-95 dark:ring-orange-900">
      <RotateCcw className="size-5" aria-hidden />
    </button>
  );
}

/** Thử thách: các câu nối tiếp, đếm lần sai, cuối cùng chấm điểm (và lưu cho học sinh). */
export function useChallenge(total: number) {
  const [idx, setIdx] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const [run, setRun] = useState(0);
  return {
    idx, mistakes, feedback, run, done: idx >= total, total,
    /** Ghi kết quả câu hiện tại. Đúng thì sang câu sau khi bấm "Tiếp". */
    check: (ok: boolean, text: string) => { setFeedback({ ok, text }); if (!ok) setMistakes((m) => m + 1); },
    next: () => { setFeedback(null); setIdx((i) => i + 1); },
    restart: () => { setIdx(0); setMistakes(0); setFeedback(null); setRun((r) => r + 1); },
  };
}
export type Challenge = ReturnType<typeof useChallenge>;

/** Khung màn Thử thách: tiến độ bằng sao, đề bài, phản hồi mặt cười, kết quả cuối có điểm. */
export function ChallengeFrame({ c, prompt, children, onCheck, summary }: { c: Challenge; prompt: ReactNode; children: ReactNode; onCheck: () => void; summary: string[] }) {
  if (c.done) {
    return (
      <div className="mx-auto max-w-lg py-6 text-center">
        <div className="flex justify-center gap-1" aria-label={`${Math.max(1, 3 - Math.floor(c.mistakes / 2))} trên 3 sao`}>
          {[1, 2, 3].map((i) => <Star key={i} className={cn("size-9", i <= Math.max(1, 3 - Math.floor(c.mistakes / 2)) ? "fill-amber-400 text-amber-400" : "text-line")} aria-hidden />)}
        </div>
        <h3 className="mt-2 text-lg font-bold text-fg">Hoàn thành {c.total} thử thách</h3>
        <p className="text-sm text-muted">Số lần trả lời sai: <b className="text-fg">{c.mistakes}</b></p>
        <LabScore mistakes={c.mistakes} />
        <ul className="mt-3 space-y-1 text-left text-sm text-fg">{summary.map((s) => <li key={s}>• {s}</li>)}</ul>
        <Button variant="secondary" size="sm" className="mt-4" onClick={c.restart}><RotateCcw /> Làm lại từ đầu</Button>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <ol className="flex gap-1" aria-label="Tiến độ thử thách">
          {Array.from({ length: c.total }, (_, i) => <li key={i} aria-current={i === c.idx ? "step" : undefined}><Star className={cn("size-5", i < c.idx ? "fill-amber-400 text-amber-400" : i === c.idx ? "text-amber-500" : "text-line")} aria-hidden /></li>)}
        </ol>
        <span className="text-sm text-muted">Thử thách {c.idx + 1}/{c.total} · sai {c.mistakes} lần</span>
      </div>
      <p className="rounded-2xl bg-brand/10 px-4 py-3 font-semibold text-fg">{prompt}</p>
      {children}
      <div className="flex flex-wrap items-center gap-3">
        {c.feedback?.ok ? <Button onClick={c.next}>Thử thách tiếp</Button> : <Button onClick={onCheck}>Kiểm tra</Button>}
        {c.feedback && (
          <p role="status" className={cn("flex items-center gap-2 text-sm", c.feedback.ok ? "text-success-fg" : "text-danger-fg")}>
            {c.feedback.ok ? <Smile className="size-6" aria-hidden /> : <Frown className="size-6" aria-hidden />} {c.feedback.text}
          </p>
        )}
      </div>
    </div>
  );
}

/** Ô đọc số liệu kiểu đồng hồ đo. */
export function Readout({ label, value, tone = "blue" }: { label: string; value: ReactNode; tone?: "blue" | "green" | "amber" | "rose" }) {
  const t = { blue: "text-blue-fg", green: "text-success-fg", amber: "text-warning-fg", rose: "text-danger-fg" }[tone];
  return (
    <div className="rounded-xl border border-line bg-surface px-3 py-2">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className={cn("font-mono text-lg font-bold tabular-nums", t)}>{value}</p>
    </div>
  );
}
