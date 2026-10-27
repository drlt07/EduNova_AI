"use client";
import { useState } from "react";
import { CheckCircle2, RotateCcw, XCircle } from "lucide-react";
import type { QuizQuestion } from "@/lib/domain/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function Quiz({ questions, onComplete }: { questions: QuizQuestion[]; onComplete?: (correct: number, total: number) => void }) {
  const [picked, setPicked] = useState<Record<string, number>>({});
  const [checked, setChecked] = useState(false);
  const score = questions.filter((q) => picked[q.id] === q.correctIndex).length;
  return (
    <div className="space-y-3">
      {questions.map((q, i) => (
        <fieldset key={q.id} className="rounded-xl border border-line bg-surface p-4">
          <legend className="sr-only">Câu {i + 1}</legend>
          <p className="whitespace-pre-wrap text-sm font-medium text-fg">
            <span className="mr-1 text-cyan-fg">Câu {i + 1}.</span>
            {q.prompt.includes("\n") ? q.prompt.split("\n")[0] : q.prompt}
          </p>
          {q.prompt.includes("\n") && <pre className="mt-2 overflow-x-auto rounded-lg bg-[#0B1220] p-3 font-mono text-[13px] text-slate-200">{q.prompt.split("\n").slice(1).join("\n")}</pre>}
          <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
            {q.options.map((o, k) => {
              const state = checked ? (k === q.correctIndex ? "right" : picked[q.id] === k ? "wrong" : "") : "";
              return (
                <label key={o} className={cn("flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm text-fg", state === "right" ? "border-success/50 bg-success/10" : state === "wrong" ? "border-danger/50 bg-danger/10" : picked[q.id] === k ? "border-cyan/60 bg-cyan/5" : "border-line")}>
                  <input type="radio" name={q.id} checked={picked[q.id] === k} onChange={() => { setPicked({ ...picked, [q.id]: k }); setChecked(false); }} className="accent-[var(--cyan)]" /> {o}
                  {state === "right" && <CheckCircle2 className="ml-auto size-4 text-success-fg" aria-label="đáp án đúng" />}
                  {state === "wrong" && <XCircle className="ml-auto size-4 text-danger-fg" aria-label="sai" />}
                </label>
              );
            })}
          </div>
          {checked && <p className="mt-2 text-sm text-muted">{q.explanation}</p>}
        </fieldset>
      ))}
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={() => { setChecked(true); onComplete?.(score, questions.length); }} disabled={Object.keys(picked).length < questions.length}>Kiểm tra đáp án</Button>
        {checked && (
          <>
            <p className="text-sm font-semibold text-fg" aria-live="polite">Đúng {score}/{questions.length} câu</p>
            <Button variant="ghost" size="sm" onClick={() => { setPicked({}); setChecked(false); }}><RotateCcw /> Làm lại</Button>
          </>
        )}
        {Object.keys(picked).length < questions.length && <p className="text-xs text-muted">Chọn đáp án cho tất cả các câu để kiểm tra.</p>}
      </div>
    </div>
  );
}
