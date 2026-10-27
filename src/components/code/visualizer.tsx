"use client";
/** Trực quan hóa quá trình chạy: dữ liệu lấy từ trace của lần thực thi thật. */
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Pause, Play, RotateCcw } from "lucide-react";
import type { RunResult } from "@/lib/py/interpreter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function CodeVisualizer({ code, result }: { code: string; result: RunResult }) {
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(false);
  const steps = result.trace;
  const total = steps.length;
  const step = steps[Math.min(i, total - 1)];
  useEffect(() => {
    if (!playing) return;
    if (i >= total - 1) {
      const t = setTimeout(() => setPlaying(false), 0);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setI((x) => x + 1), 900);
    return () => clearTimeout(t);
  }, [playing, i, total]);
  if (!total) return <p className="text-sm text-muted">Không có bước nào để hiển thị{result.error ? " — chương trình lỗi trước khi chạy." : "."}</p>;
  const lines = code.replace(/\r/g, "").split("\n");
  const errorAtEnd = !result.ok && i >= total - 1 ? result.error : undefined;
  return (
    <div className="space-y-3" aria-label="Trực quan hóa quá trình chạy">
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <ol className="overflow-x-auto rounded-xl bg-[#0B1220] py-2 font-mono text-[13px] leading-7" tabIndex={0} aria-label="Mã nguồn, dòng đang chạy được tô sáng">
          {lines.map((l, k) => {
            const cur = step.line === k + 1;
            return (
              <li key={k} aria-current={cur ? "step" : undefined} className={cn("flex gap-3 px-3 transition-colors", cur && (step.branch === "skipped" ? "bg-amber-400/15" : "bg-cyan-400/20"))}>
                <span className="w-6 shrink-0 select-none text-right text-slate-500">{k + 1}</span>
                <span className={cn("whitespace-pre text-slate-200", cur && "font-semibold text-white")}>{l || " "}</span>
                {cur && <span className="ml-auto text-xs text-cyan-300" aria-hidden>◀</span>}
              </li>
            );
          })}
        </ol>
        <div className="space-y-3">
          <div className="rounded-xl border border-line bg-surface-2 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Biến{step.scope !== "global" ? ` (trong hàm ${step.scope})` : ""}</p>
            {step.vars.length === 0 ? <p className="mt-1 text-sm text-muted">Chưa có biến nào.</p> : (
              <table className="mt-1 w-full text-sm">
                <tbody>
                  {step.vars.map((v) => (
                    <tr key={`${v.name}-${v.changed ? i : "s"}`} className={cn("border-t border-line first:border-0", v.changed && "flash")}>
                      <td className="py-1 pr-2 font-mono font-semibold text-fg">{v.name}</td>
                      <td className="py-1 pr-2 font-mono text-cyan-fg">{v.value}</td>
                      <td className="py-1 text-right text-xs text-muted">{v.type}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <div className="rounded-xl border border-line bg-surface-2 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Đầu ra</p>
            <pre className="mt-1 min-h-[2rem] whitespace-pre-wrap font-mono text-sm text-fg">{step.output || "…"}</pre>
          </div>
        </div>
      </div>
      <p className={cn("rounded-xl px-4 py-3 text-sm font-medium", step.branch === "skipped" ? "bg-warning/10 text-fg" : "bg-cyan/10 text-fg")} aria-live="polite">
        <span className="mr-2 text-xs text-muted">Bước {i + 1}/{total} · dòng {step.line}</span>
        {step.note}
      </p>
      {errorAtEnd && <p className="rounded-xl bg-danger/10 px-4 py-3 text-sm text-fg">Sau bước này chương trình dừng vì lỗi <strong>{errorAtEnd.type}</strong> ở dòng {errorAtEnd.line}: {errorAtEnd.explain}</p>}
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant="secondary" onClick={() => { setPlaying(false); setI((x) => Math.max(0, x - 1)); }} disabled={i === 0}><ChevronLeft /> Trước</Button>
        <Button size="sm" onClick={() => { if (i >= total - 1) setI(0); setPlaying((p) => !p); }}>{playing ? <><Pause /> Dừng</> : <><Play /> Tự chạy</>}</Button>
        <Button size="sm" variant="secondary" onClick={() => { setPlaying(false); setI((x) => Math.min(total - 1, x + 1)); }} disabled={i >= total - 1}>Tiếp <ChevronRight /></Button>
        <Button size="sm" variant="ghost" onClick={() => { setPlaying(false); setI(0); }}><RotateCcw /> Về đầu</Button>
        <label className="flex flex-1 items-center gap-2 text-xs text-muted" htmlFor="vis-step">
          <span className="sr-only">Chọn bước</span>
          <input id="vis-step" type="range" min={0} max={total - 1} value={i} onChange={(e) => { setPlaying(false); setI(Number(e.target.value)); }} className="w-full min-w-[120px] accent-[var(--cyan)]" />
        </label>
      </div>
      {result.traceTruncated && <p className="text-xs text-muted">Chỉ hiển thị {total} bước đầu tiên.</p>}
    </div>
  );
}
