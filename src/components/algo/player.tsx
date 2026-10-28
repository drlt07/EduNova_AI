"use client";
import { useEffect, useState, type ReactNode } from "react";
import { ChevronFirst, ChevronLast, ChevronLeft, ChevronRight, Pause, Play, Target } from "lucide-react";
import type { Counters, FrameBase } from "@/lib/algo/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useTutorActivity } from "@/components/tutor/tutor-provider";

const SPEEDS = [0.5, 1, 2, 4];

/** Khung code Python, tô dòng đang chạy. */
export function CodePane({ code, line }: { code: string[]; line: number }) {
  return (
    <pre className="overflow-x-auto rounded-xl bg-[#0b1220] py-2 font-mono text-[12px] leading-6 text-slate-200 [font-variant-ligatures:none]" aria-label="Mã giả Python">
      {code.map((l, k) => (
        <div key={k} className={cn("flex gap-3 whitespace-pre px-3", k === line && "bg-cyan/25 text-white")} aria-current={k === line ? "step" : undefined}>
          <span className="w-4 shrink-0 select-none text-right text-slate-500">{k + 1}</span>
          <span>{l.replace(/(#.*)$/, "\u0000$1").split("\u0000").map((part, i) => (i ? <span key={i} className="text-slate-400">{part}</span> : part))}</span>
        </div>
      ))}
    </pre>
  );
}

/**
 * Phát lại danh sách khung của một thuật toán: chạy/tạm dừng, từng bước, tốc độ, kéo thanh thời gian.
 * Chế độ dự đoán dừng lại ở các khung có câu hỏi để học sinh đoán bước tiếp theo trước khi xem.
 */
export function AlgoPlayer<F extends FrameBase>({ frames, code, title, view, counters }: { frames: F[]; code: string[]; title: string; view: (f: F, i: number) => ReactNode; counters?: (f: F) => Counters }) {
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [predict, setPredict] = useState(false);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const f = frames[Math.min(i, frames.length - 1)];
  const last = i >= frames.length - 1;
  const waiting = predict && !!f.ask && answers[i] === undefined;
  const running = playing && !last && !waiting;
  const asked = Object.entries(answers);
  const right = asked.filter(([k, v]) => frames[Number(k)]?.ask?.answer === v).length;

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setI((x) => Math.min(x + 1, frames.length - 1)), 900 / speed);
    return () => clearInterval(t);
  }, [running, speed, frames.length]);

  const touch = useTutorActivity("simulation", () => ({
    kind: "simulation",
    sim: `mô phỏng thuật toán ${title}`,
    summary: `Bước ${i + 1}/${frames.length}, dòng code ${f.line + 1} (“${code[f.line].trim()}”). ${f.note}`,
    problems: [],
    facts: { buoc: i + 1, tong: frames.length, ...(counters?.(f) ?? {}), ...(asked.length ? { du_doan_dung: `${right}/${asked.length}` } : {}) },
  }), { title: `${title} · Chuyên đề HSG`, topic: "general", level: "free" });

  const go = (k: number) => { setI(Math.max(0, Math.min(frames.length - 1, k))); touch(); };
  const cnt = counters?.(f);

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)]">
      <div className="min-w-0 space-y-3">
        <div className="min-w-0 rounded-2xl border border-line bg-surface p-3 sm:p-4">{view(f, i)}</div>
        <div className="rounded-2xl border border-line bg-surface p-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <Button size="icon" variant="ghost" aria-label="Về đầu" onClick={() => go(0)} disabled={i === 0}><ChevronFirst /></Button>
            <Button size="icon" variant="ghost" aria-label="Lùi một bước" onClick={() => go(i - 1)} disabled={i === 0}><ChevronLeft /></Button>
            <Button size="sm" onClick={() => { if (last) { setI(0); setPlaying(true); } else setPlaying(!playing); touch(); }} disabled={waiting} className="min-w-[96px]">{running ? <><Pause /> Tạm dừng</> : <><Play /> {last ? "Chạy lại" : "Chạy"}</>}</Button>
            <Button size="icon" variant="ghost" aria-label="Bước tiếp" onClick={() => go(i + 1)} disabled={last || waiting}><ChevronRight /></Button>
            <Button size="icon" variant="ghost" aria-label="Đến cuối" onClick={() => go(frames.length - 1)} disabled={last || predict}><ChevronLast /></Button>
            <span className="ml-auto flex items-center gap-1 text-xs text-muted" role="group" aria-label="Tốc độ">
              {SPEEDS.map((s) => (
                <button key={s} type="button" aria-pressed={speed === s} onClick={() => setSpeed(s)} className={cn("rounded-md px-1.5 py-0.5 font-semibold", speed === s ? "bg-fg text-bg" : "hover:bg-surface-2")}>{s}×</button>
              ))}
            </span>
          </div>
          <input type="range" min={0} max={frames.length - 1} value={i} onChange={(e) => go(Number(e.target.value))} disabled={predict} aria-label="Bước" className="mt-2 w-full accent-[var(--cyan)]" />
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
            <span className="tabular-nums">Bước {i + 1}/{frames.length}</span>
            <label className="flex items-center gap-1.5 font-medium text-fg">
              <input type="checkbox" checked={predict} onChange={(e) => { setPredict(e.target.checked); setAnswers({}); }} /> <Target className="size-3.5 text-violet-fg" aria-hidden /> Chế độ dự đoán
              {predict && asked.length > 0 && <span className="rounded-full bg-violet/15 px-2 text-violet-fg">đúng {right}/{asked.length}</span>}
            </label>
          </div>
        </div>
      </div>

      <div className="min-w-0 space-y-3">
        <div className={cn("rounded-2xl border p-3 text-sm", waiting ? "border-violet/50 bg-violet/5" : "border-line bg-surface")} aria-live="polite">
          {waiting && f.ask ? (
            <>
              <p className="font-semibold text-fg">{f.ask.q}</p>
              <div className="mt-2 grid gap-1.5">
                {f.ask.options.map((o, k) => (
                  <Button key={k} variant="secondary" size="sm" className="justify-start" onClick={() => { setAnswers({ ...answers, [i]: k }); touch(); }}>{o}</Button>
                ))}
              </div>
            </>
          ) : (
            <>
              {predict && f.ask && answers[i] !== undefined && (
                <p className={cn("mb-1.5 text-xs font-semibold", answers[i] === f.ask.answer ? "text-success-fg" : "text-danger-fg")}>
                  {answers[i] === f.ask.answer ? "Đoán đúng!" : `Chưa đúng: đáp án là “${f.ask.options[f.ask.answer]}”.`}
                </p>
              )}
              <p className="text-fg">{f.note}</p>
            </>
          )}
        </div>
        <CodePane code={code} line={f.line} />
        {cnt && (
          <dl className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {Object.entries(cnt).map(([k, v]) => (
              <div key={k} className="rounded-xl border border-line bg-surface px-3 py-2">
                <dt className="text-[11px] text-muted">{k}</dt>
                <dd className="text-lg font-bold tabular-nums text-fg">{v}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </div>
  );
}
