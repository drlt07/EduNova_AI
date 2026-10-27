"use client";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { ArrowRight, BookOpen, Bot, Bug, CheckCircle2, Dumbbell, Eye, Footprints, Lock, Send, User as UserIcon, XCircle } from "lucide-react";
import { detectTopic, type Topic } from "@/lib/ai/tutor";
import { CAPABILITY_LABEL, HINTS_BEFORE_SOLUTION, LEVEL_LABEL, lockedReply, solutionPolicy, type TutorCapability, type TutorQuiz, type TutorReply, type TutorRequest, type TutorState } from "@/lib/ai/tutor-core";
import { askTutor } from "@/lib/ai/tutor-llm";
import { tutorLlm, TUTOR_SOURCE_NOTE } from "@/lib/ai/tutor-runtime";
import { useApp } from "@/lib/store/app-store";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form";
import type { TutorActivity } from "./tutor-provider";

const CAPS: { id: TutorCapability; icon: typeof BookOpen; desc: string }[] = [
  { id: "explain", icon: BookOpen, desc: "Giải thích bài theo trình độ của em, có ví dụ dễ hiểu" },
  { id: "guide", icon: Footprints, desc: "Đặt câu hỏi gợi mở để em tự tìm cách giải" },
  { id: "debug", icon: Bug, desc: "Đọc mã nguồn, kết quả kiểm thử hoặc trạng thái mô phỏng để chỉ ra vấn đề" },
  { id: "practice", icon: Dumbbell, desc: "Đề xuất bài tương tự cho phần em chưa vững" },
];

interface Msg {
  role: "me" | "ai";
  text: string;
  reply?: TutorReply;
}

function QuickAnswer({ quiz }: { quiz: TutorQuiz }) {
  const [pick, setPick] = useState<number | null>(null);
  return (
    <div className="mt-2 space-y-2">
      <div className="flex flex-wrap gap-1.5" role="group" aria-label={quiz.question}>
        {quiz.options.map((o, k) => (
          <button key={o} type="button" disabled={pick !== null} onClick={() => setPick(k)} className={cn("rounded-lg border px-3 py-1.5 text-sm font-medium text-fg", pick === null ? "border-line bg-surface hover:border-cyan/50" : k === quiz.correctIndex ? "border-success/50 bg-success/10" : pick === k ? "border-danger/50 bg-danger/10" : "border-line opacity-60")}>
            {o}
          </button>
        ))}
      </div>
      {pick !== null && (
        <p className="flex items-start gap-1.5 text-sm text-fg" aria-live="polite">
          {pick === quiz.correctIndex ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success-fg" aria-hidden /> : <XCircle className="mt-0.5 size-4 shrink-0 text-danger-fg" aria-hidden />}
          <span>{pick === quiz.correctIndex ? "Đúng rồi! " : "Chưa đúng. "}{quiz.explanation}</span>
        </p>
      )}
    </div>
  );
}

/** Loại lỗi đọc từ trạng thái thật, chỉ để thống kê cho giáo viên. */
function errorTypeOf(s?: TutorState): string | undefined {
  if (s?.kind === "code") return s.runError?.type ?? (s.tests?.some((t) => !t.pass) ? "Sai kiểm thử" : undefined);
  if (s?.kind === "simulation") return s.problems[0] ? String(s.facts.errorType ?? s.problems[0]).slice(0, 60) : undefined;
  if (s?.kind === "quiz" && s.correct === false) return "Trả lời sai";
  return undefined;
}

export function TutorChat({ activity, userId, compact, initialCapability }: { activity: TutorActivity; userId: string; compact?: boolean; initialCapability?: TutorCapability }) {
  const logTutorEvent = useApp((s) => s.logTutorEvent);
  const codeWorks = useApp((s) => s.codeWorks);
  const passed = useMemo(() => codeWorks.filter((w) => w.studentId === userId && w.lastRun && w.lastRun.total > 0 && w.lastRun.passed === w.lastRun.total).map((w) => w.exerciseId), [codeWorks, userId]);
  const locked = activity.level === "exam";
  const [cap, setCap] = useState<TutorCapability>(initialCapability ?? (activity.kind === "free" ? "explain" : "guide"));
  const [msgs, setMsgs] = useState<Msg[]>([{ role: "ai", text: locked ? lockedReply().reply : `Chào em! Cô đang cùng em ở “${activity.title}”. Em cần cô giải thích, hướng dẫn từng bước, xem lỗi hay gợi ý bài luyện?` }]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [hintCount, setHintCount] = useState(0);
  const endRef = useRef<HTMLLIElement>(null);

  const state = activity.read?.();
  const policy = solutionPolicy({ level: activity.level, hintCount } as TutorRequest);
  const canSolve = state?.kind === "code" && Boolean(state.exerciseId) && activity.level === "free";

  async function ask(message: string, opts: { capability?: TutorCapability; askSolution?: boolean } = {}) {
    if (busy || locked) return;
    const capability = opts.capability ?? (/lỗi|sai|không chạy|bug/i.test(message) ? "debug" : cap);
    const label = opts.askSolution ? "Cho em xem lời giải" : message.trim() || CAPABILITY_LABEL[capability];
    const live = activity.read?.();
    const topic: Topic = activity.topic === "general" ? detectTopic(message, "if") : activity.topic;
    const history = msgs.filter((m, i) => i > 0).map((m) => ({ role: m.role, text: m.text }));
    setMsgs((m) => [...m, { role: "me", text: label }]);
    setText("");
    setBusy(true);
    try {
      const req: TutorRequest = { capability, message: message.slice(0, 1000), level: activity.level, topic, title: activity.title, state: live, hintCount, askSolution: opts.askSolution, passedExercises: passed, history };
      const reply = await askTutor(req, tutorLlm);
      setMsgs((m) => [...m, { role: "ai", text: reply.reply, reply }]);
      setHintCount((h) => Math.max(h, reply.hintStep));
      logTutorEvent({ studentId: userId, capability, topic, activity: activity.kind, level: activity.level, errorType: errorTypeOf(live), objectiveId: activity.objectiveId, source: reply.source });
    } catch {
      setMsgs((m) => [...m, { role: "ai", text: "Cô chưa trả lời được. Em thử lại nhé." }]);
    } finally {
      setBusy(false);
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 30);
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="rounded-xl bg-surface-2 px-3 py-2 text-xs">
        <p className="text-muted">Đang hỗ trợ • <span className="font-medium text-fg">{activity.title}</span></p>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <Badge tone={locked ? "danger" : activity.level === "free" ? "success" : "cyan"}>{locked && <Lock className="size-3" aria-hidden />} {LEVEL_LABEL[activity.level]}</Badge>
          {state && <span className="text-muted">Cô đọc được bài làm hiện tại của em</span>}
        </div>
      </div>

      {!locked && (
        <div role="group" aria-label="Em cần gì" className={cn("grid gap-1.5", compact ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-4")}>
          {CAPS.map((c) => (
            <button key={c.id} type="button" title={c.desc} aria-pressed={cap === c.id} disabled={busy} onClick={() => { setCap(c.id); void ask("", { capability: c.id }); }} className={cn("flex items-center gap-1.5 rounded-xl border px-2.5 py-2 text-left text-xs font-medium transition-colors", cap === c.id ? "border-violet/60 bg-violet/10 text-violet-fg" : "border-line text-fg hover:border-violet/40")}>
              <c.icon className="size-3.5 shrink-0" aria-hidden /> {CAPABILITY_LABEL[c.id]}
            </button>
          ))}
        </div>
      )}

      <ol tabIndex={0} aria-live="polite" aria-label="Trò chuyện với AI Gia sư" className={cn("flex-1 space-y-3 overflow-y-auto pr-1", compact ? "min-h-[200px]" : "min-h-[320px]")}>
        {msgs.map((m, i) => (
          <li key={i} className={cn("flex gap-2", m.role === "me" && "flex-row-reverse")}>
            <span className={cn("grid size-7 shrink-0 place-items-center rounded-full", m.role === "ai" ? "bg-violet/15 text-violet-fg" : "bg-cyan/15 text-cyan-fg")} aria-hidden>{m.role === "ai" ? <Bot className="size-4" /> : <UserIcon className="size-4" />}</span>
            <div className={cn("min-w-0 max-w-[88%] rounded-2xl px-3.5 py-2 text-sm", m.role === "ai" ? "bg-surface-2 text-fg" : "bg-cyan/15 text-fg")}>
              <span className="sr-only">{m.role === "ai" ? "AI Gia sư:" : "Em:"}</span>
              <p className="whitespace-pre-wrap">{m.text}</p>
              {m.reply?.code && <pre className="mt-2 overflow-x-auto rounded-lg bg-[#0B1220] p-2 font-mono text-xs text-slate-200">{m.reply.code}</pre>}
              {m.reply?.quiz && <QuickAnswer quiz={m.reply.quiz} />}
              {m.reply?.suggestions && m.reply.suggestions.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {m.reply.suggestions.map((sug) => (
                    <li key={sug.href}><Link href={sug.href} className="inline-flex items-center gap-1 text-sm font-medium text-cyan-fg hover:underline">{sug.label} <ArrowRight className="size-3.5" aria-hidden /></Link></li>
                  ))}
                </ul>
              )}
              {m.reply && (
                <p className="mt-1.5 text-[11px] text-muted">
                  {m.reply.usedState.length ? `Đã đọc: ${m.reply.usedState.join(" · ")} · ` : ""}{m.reply.source === "ai" ? "Trả lời bằng AI" : "Trả lời theo bộ luật"}
                </p>
              )}
            </div>
          </li>
        ))}
        {busy && <li className="text-sm text-muted">Cô đang xem bài của em…</li>}
        <li ref={endRef} aria-hidden className="h-0" />
      </ol>

      {!locked && (
        <>
          {canSolve && (
            <Button size="sm" variant="ghost" className="self-start" disabled={busy || policy !== "allow"} onClick={() => ask("", { askSolution: true })} title={policy === "allow" ? undefined : `Nhận thêm ${HINTS_BEFORE_SOLUTION - hintCount} gợi ý trước khi xem lời giải`}>
              <Eye className="size-3.5" /> Xem lời giải{policy !== "allow" ? ` (sau ${HINTS_BEFORE_SOLUTION - hintCount} gợi ý)` : ""}
            </Button>
          )}
          <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); void ask(text); }}>
            <label htmlFor={`tutor-input-${compact ? "d" : "p"}`} className="sr-only">Câu hỏi cho AI Gia sư</label>
            <Input id={`tutor-input-${compact ? "d" : "p"}`} value={text} onChange={(e) => setText(e.target.value)} placeholder="Ví dụ: Em không hiểu tại sao chương trình cho kết quả sai" maxLength={1000} />
            <Button type="submit" disabled={busy || !text.trim()} aria-label="Gửi"><Send /></Button>
          </form>
          <p className="text-[11px] text-muted">{TUTOR_SOURCE_NOTE} Thầy cô chỉ xem thống kê chung (chủ đề hay hỏi, lỗi phổ biến), không đọc nội dung trò chuyện.</p>
        </>
      )}
    </div>
  );
}
