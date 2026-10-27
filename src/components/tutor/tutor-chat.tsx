"use client";
import { useRef, useState } from "react";
import { Bot, CheckCircle2, Send, Sparkles, User as UserIcon, XCircle } from "lucide-react";
import type { Topic, TutorMode, TutorAction, TutorOutput } from "@/lib/ai/tutor";
import { callAgent } from "@/lib/ai/client";
import { useApp } from "@/lib/store/app-store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form";

export interface TutorContextData {
  title?: string;
  topic?: Topic;
  error?: { type: string; explain: string; line: number };
  failing?: string[];
  weakObjective?: string;
  locked?: boolean;
  ref?: string;
}

const MODES: { id: TutorMode; label: string; desc: string }[] = [
  { id: "explain", label: "Giải thích", desc: "Giải thích dễ hiểu, có ví dụ" },
  { id: "hint", label: "Gợi ý", desc: "Gợi ý từng bước, không cho đáp án" },
  { id: "debug", label: "Sửa lỗi", desc: "Đọc lỗi và kết quả kiểm thử" },
  { id: "socratic", label: "Hỏi gợi mở", desc: "Đặt câu hỏi để em tự suy luận" },
  { id: "review", label: "Ôn tập", desc: "Câu hỏi theo mục tiêu chưa vững" },
];
const QUICK: { action: Exclude<TutorAction, undefined>; label: string }[] = [
  { action: "simpler", label: "Giải thích đơn giản hơn" },
  { action: "hint", label: "Cho em một gợi ý" },
  { action: "example", label: "Minh họa bằng ví dụ" },
  { action: "check", label: "Kiểm tra em đã hiểu chưa" },
];

interface Msg {
  role: "me" | "ai";
  text: string;
  code?: string;
  quiz?: TutorOutput["quiz"];
}

function MiniQuiz({ quiz }: { quiz: NonNullable<TutorOutput["quiz"]> }) {
  const [pick, setPick] = useState<number | null>(null);
  return (
    <div className="mt-2 space-y-2 rounded-xl border border-line bg-surface p-3">
      <p className="text-sm font-medium text-fg">{quiz.question}</p>
      {quiz.code && <pre className="overflow-x-auto rounded-lg bg-[#0B1220] p-2 font-mono text-xs text-slate-200">{quiz.code}</pre>}
      <div className="grid gap-1.5 sm:grid-cols-2">
        {quiz.options.map((o, k) => (
          <button key={o} type="button" disabled={pick !== null} onClick={() => setPick(k)} className={cn("rounded-lg border px-3 py-1.5 text-left text-sm text-fg", pick === null ? "border-line hover:border-cyan/50" : k === quiz.correctIndex ? "border-success/50 bg-success/10" : pick === k ? "border-danger/50 bg-danger/10" : "border-line opacity-60")}>
            {o}
          </button>
        ))}
      </div>
      {pick !== null && (
        <p className="flex items-start gap-1.5 text-sm text-fg" aria-live="polite">
          {pick === quiz.correctIndex ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success-fg" /> : <XCircle className="mt-0.5 size-4 shrink-0 text-danger-fg" />}
          {pick === quiz.correctIndex ? "Chính xác! " : "Chưa đúng. "}
          {quiz.explanation}
        </p>
      )}
    </div>
  );
}

export function TutorChat({ context, userId, compact }: { context: TutorContextData; userId: string; compact?: boolean }) {
  const logAI = useApp((s) => s.logAI);
  const [mode, setMode] = useState<TutorMode>(context.error || context.failing?.length ? "debug" : "hint");
  const [msgs, setMsgs] = useState<Msg[]>([{ role: "ai", text: context.locked ? "Em đang làm bài kiểm tra chính thức nên gia sư tạm khóa gợi ý." : `Chào em! ${context.title ? `Mình thấy em đang ở “${context.title}”. ` : ""}Em cần giải thích, gợi ý hay hỗ trợ sửa lỗi?` }]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const turns = useRef<Record<string, number>>({});
  const endRef = useRef<HTMLLIElement>(null);

  async function ask(message: string, action?: TutorAction) {
    if (busy) return;
    const label = action ? QUICK.find((q) => q.action === action)!.label : message.trim();
    if (!label) return;
    setMsgs((m) => [...m, { role: "me", text: label }]);
    setText("");
    setBusy(true);
    const key = `${mode}-${action ?? ""}`;
    const turn = turns.current[key] ?? 0;
    turns.current[key] = turn + 1;
    try {
      const out = await callAgent<TutorOutput & { flags: string[] }>("learning-tutor", {
        mode,
        action,
        message: message.slice(0, 1000),
        topic: context.topic ?? "general",
        turn,
        locked: !!context.locked,
        context: { title: context.title, error: context.error, failing: context.failing, weakObjective: context.weakObjective },
      });
      setMsgs((m) => [...m, { role: "ai", text: out.reply, code: out.code, quiz: out.quiz }]);
      logAI({ agent: "learning-tutor", userId, contextRef: context.ref ?? context.title ?? "general", inputSummary: `${mode}: ${label.slice(0, 100)}`, output: out, flags: out.flags });
    } catch {
      setMsgs((m) => [...m, { role: "ai", text: "Gia sư tạm thời chưa trả lời được. Em thử lại nhé." }]);
    } finally {
      setBusy(false);
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 30);
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div role="group" aria-label="Chế độ gia sư" className="flex flex-wrap gap-1">
        {MODES.map((m) => (
          <button key={m.id} type="button" title={m.desc} aria-pressed={mode === m.id} onClick={() => setMode(m.id)} className={cn("rounded-full border px-3 py-1 text-xs font-medium transition-colors", mode === m.id ? "border-violet/60 bg-violet/15 text-violet-fg" : "border-line text-muted hover:text-fg")}>
            {m.label}
          </button>
        ))}
      </div>
      <ol tabIndex={0} aria-live="polite" aria-label="Hội thoại với gia sư" className={cn("flex-1 space-y-3 overflow-y-auto pr-1", compact ? "min-h-[240px]" : "min-h-[320px]")}>
        {msgs.map((m, i) => (
          <li key={i} className={cn("flex gap-2", m.role === "me" && "flex-row-reverse")}>
            <span className={cn("grid size-7 shrink-0 place-items-center rounded-full", m.role === "ai" ? "bg-violet/15 text-violet-fg" : "bg-cyan/15 text-cyan-fg")} aria-hidden>{m.role === "ai" ? <Bot className="size-4" /> : <UserIcon className="size-4" />}</span>
            <div className={cn("max-w-[85%] rounded-2xl px-3.5 py-2 text-sm", m.role === "ai" ? "bg-surface-2 text-fg" : "bg-cyan/15 text-fg")}>
              <span className="sr-only">{m.role === "ai" ? "Gia sư:" : "Em:"}</span>
              <p className="whitespace-pre-wrap">{m.text}</p>
              {m.code && <pre className="mt-2 overflow-x-auto rounded-lg bg-[#0B1220] p-2 font-mono text-xs text-slate-200">{m.code}</pre>}
              {m.quiz && <MiniQuiz quiz={m.quiz} />}
              {m.role === "ai" && i > 0 && <p className="mt-1 flex items-center gap-1 text-[11px] text-muted"><Sparkles className="size-3" aria-hidden /> Gợi ý do AI tạo (bản mẫu)</p>}
            </div>
          </li>
        ))}
        {busy && <li className="text-sm text-muted">Gia sư đang suy nghĩ…</li>}
        <li ref={endRef} aria-hidden className="h-0" />
      </ol>
      {!context.locked && (
        <>
          <div className="flex flex-wrap gap-1.5">
            {QUICK.map((q) => <Button key={q.action} size="sm" variant="secondary" disabled={busy} onClick={() => ask("", q.action)}>{q.label}</Button>)}
          </div>
          <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); void ask(text); }}>
            <label htmlFor={`tutor-input-${compact ? "d" : "p"}`} className="sr-only">Câu hỏi cho gia sư</label>
            <Input id={`tutor-input-${compact ? "d" : "p"}`} value={text} onChange={(e) => setText(e.target.value)} placeholder="Ví dụ: Tại sao code của em sai?" maxLength={1000} />
            <Button type="submit" disabled={busy || !text.trim()} aria-label="Gửi"><Send /></Button>
          </form>
        </>
      )}
    </div>
  );
}
