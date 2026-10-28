"use client";
import Link from "next/link";
import { useState } from "react";
import { ArrowDown, ArrowUp, GripVertical } from "lucide-react";
import type { PracticeQuestion } from "@/lib/data/practice";
import { shuffled, type Answer } from "@/lib/practice/grade";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/form";
import { BlankQuestion, MatchQuestion, MultiQuestion, WidgetQuestion } from "./interactive-questions";

function Code({ code, numbered }: { code: string; numbered?: boolean }) {
  return (
    <pre tabIndex={0} className="overflow-x-auto rounded-xl bg-[#0B1220] p-3 font-mono text-[13px] leading-6 text-slate-200 [font-variant-ligatures:none]">
      {numbered ? code.split("\n").map((l, i) => <div key={i}><span className="mr-3 inline-block w-5 select-none text-right text-slate-500">{i + 1}</span>{l}</div>) : code}
    </pre>
  );
}

/** Hiển thị một câu hỏi và nhận câu trả lời. disabled = đã chấm, không sửa được. */
export function QuestionView({ q, answer, onAnswer, disabled }: { q: PracticeQuestion; answer: Answer; onAnswer: (a: Answer) => void; disabled?: boolean }) {
  const id = `q-${q.id}`;
  switch (q.kind) {
    case "mcq":
      return (
        <fieldset disabled={disabled} className="space-y-2">
          <legend className="sr-only">{q.prompt}</legend>
          {q.code && <Code code={q.code} />}
          <div className="grid gap-2 sm:grid-cols-2">
            {q.options.map((o, k) => (
              <label key={o} className={cn("flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2.5 text-sm text-fg transition-colors", answer === k ? "border-cyan/60 bg-cyan/10" : "border-line hover:border-cyan/30")}>
                <input type="radio" name={id} checked={answer === k} onChange={() => onAnswer(k)} className="accent-[var(--cyan)]" />
                <span className="font-mono">{o}</span>
              </label>
            ))}
          </div>
        </fieldset>
      );
    case "truefalse":
      return (
        <div role="radiogroup" aria-label="Đúng hay sai" className="flex gap-2">
          {[true, false].map((v) => (
            <button key={String(v)} type="button" role="radio" aria-checked={answer === v} disabled={disabled} onClick={() => onAnswer(v)} className={cn("rounded-xl border px-6 py-2.5 font-semibold", answer === v ? "border-cyan/60 bg-cyan/10 text-fg" : "border-line text-muted hover:text-fg")}>
              {v ? "Đúng" : "Sai"}
            </button>
          ))}
        </div>
      );
    case "order":
      return <OrderQuestion q={q} answer={answer} onAnswer={onAnswer} disabled={disabled} />;
    case "fillcode":
      return (
        <div className="space-y-2">
          <Code code={q.template} />
          <Label htmlFor={id}>Điền vào chỗ ___</Label>
          <Input id={id} disabled={disabled} className="font-mono" value={typeof answer === "string" ? answer : ""} onChange={(e) => onAnswer(e.target.value)} placeholder="Viết phần còn thiếu" autoComplete="off" spellCheck={false} />
          <p className="text-xs text-muted">Câu trả lời được kiểm tra bằng cách chạy chương trình với nhiều bộ dữ liệu, nên cách viết khác nhưng đúng vẫn được chấm đúng.</p>
        </div>
      );
    case "predict":
      return (
        <div className="space-y-2">
          <Code code={q.code} />
          <Label htmlFor={id}>Em dự đoán chương trình in ra:</Label>
          <Textarea id={id} disabled={disabled} className="min-h-[60px] font-mono" value={typeof answer === "string" ? answer : ""} onChange={(e) => onAnswer(e.target.value)} />
        </div>
      );
    case "finderror":
      return (
        <div role="radiogroup" aria-label="Chọn dòng sai" className="overflow-hidden rounded-xl bg-[#0B1220] py-2 font-mono text-[13px]">
          {q.code.split("\n").map((l, i) => (
            <button key={i} type="button" role="radio" aria-checked={answer === i + 1} disabled={disabled} onClick={() => onAnswer(i + 1)} className={cn("flex w-full gap-3 px-3 py-1 text-left text-slate-200 hover:bg-white/5", answer === i + 1 && "bg-rose-500/25")}>
              <span className="w-5 text-right text-slate-500">{i + 1}</span>
              <span className="whitespace-pre">{l || " "}</span>
            </button>
          ))}
        </div>
      );
    case "short":
      return (
        <div className="space-y-2">
          <Label htmlFor={id}>Câu trả lời của em</Label>
          <Textarea id={id} disabled={disabled} value={typeof answer === "string" ? answer : ""} onChange={(e) => onAnswer(e.target.value)} />
          <p className="text-xs text-muted">Câu tự luận được em tự đối chiếu với gợi ý đáp án, không tính vào mức đạt.</p>
        </div>
      );
    case "multi":
      return <MultiQuestion q={q} answer={answer} onAnswer={onAnswer} disabled={disabled} />;
    case "match":
      return <MatchQuestion q={q} answer={answer} onAnswer={onAnswer} disabled={disabled} />;
    case "blank":
      return <BlankQuestion q={q} answer={answer} onAnswer={onAnswer} disabled={disabled} />;
    case "interactive":
      return <WidgetQuestion q={q} answer={answer} onAnswer={onAnswer} disabled={disabled} />;
    case "sim":
      return (
        <div className="space-y-2 rounded-xl border border-line bg-surface-2 p-4">
          <p className="text-sm text-fg">Câu này được chấm theo kết quả trong trò chơi.</p>
          <Button asChild size="sm"><Link href={`/student/games/${q.gameSlug}?level=${q.level}`}>Mở trò chơi — cấp {q.level}</Link></Button>
        </div>
      );
  }
}

function OrderQuestion({ q, answer, onAnswer, disabled }: { q: Extract<PracticeQuestion, { kind: "order" }>; answer: Answer; onAnswer: (a: Answer) => void; disabled?: boolean }) {
  const lines = Array.isArray(answer) ? (answer as string[]) : shuffled(q.lines, q.id);
  const [drag, setDrag] = useState<number | null>(null);
  const move = (from: number, to: number) => {
    if (to < 0 || to >= lines.length || from === to) return;
    const next = [...lines];
    const [x] = next.splice(from, 1);
    next.splice(to, 0, x);
    onAnswer(next);
  };
  return (
    <ol className="space-y-1.5" aria-label="Kéo thả hoặc dùng nút mũi tên để sắp xếp">
      {lines.map((l, i) => (
        <li
          key={l + i}
          draggable={!disabled}
          onDragStart={() => setDrag(i)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => { if (drag !== null) move(drag, i); setDrag(null); }}
          className={cn("flex items-center gap-2 rounded-xl border border-line bg-[#0B1220] px-2 py-1.5 font-mono text-[13px] text-slate-200", drag === i && "opacity-50", !disabled && "cursor-grab")}
        >
          <GripVertical className="size-4 shrink-0 text-slate-500" aria-hidden />
          <span className="flex-1 whitespace-pre">{l}</span>
          <button type="button" disabled={disabled || i === 0} onClick={() => move(i, i - 1)} aria-label={`Đưa dòng "${l.trim()}" lên`} className="rounded p-1 text-slate-300 hover:bg-white/10 disabled:opacity-30"><ArrowUp className="size-4" /></button>
          <button type="button" disabled={disabled || i === lines.length - 1} onClick={() => move(i, i + 1)} aria-label={`Đưa dòng "${l.trim()}" xuống`} className="rounded p-1 text-slate-300 hover:bg-white/10 disabled:opacity-30"><ArrowDown className="size-4" /></button>
        </li>
      ))}
    </ol>
  );
}
