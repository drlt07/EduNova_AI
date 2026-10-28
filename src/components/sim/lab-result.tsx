"use client";
import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ArrowRight, CheckCircle2, PencilLine, Send, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { EXPLAIN_MAX, gradeLab, LAB_RUBRICS, PRACTICE_MAX, practiceScore, type LabGrade } from "@/lib/ai/lab-grader";
import { labGradeLlm } from "@/lib/ai/lab-grade-runtime";
import { getLabBySlug } from "@/lib/data/labs";
import { fmtScore, labScore, type LabResult } from "@/lib/sim/lab-score";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/form";
import { useApp } from "@/lib/store/app-store";
import { useCurrentUser } from "@/lib/store/hooks";

interface Scope { slug: string; /** Số giây từ lúc mở (hoặc lần lưu trước) đến giờ, rồi bắt đầu đếm lại. */ lap: () => number }
const Ctx = createContext<Scope | null>(null);

/** Bọc một mô phỏng: khi học sinh đăng nhập làm xong, kết quả được chấm và lưu cho thầy cô xem. */
export function LabResultScope({ slug, children }: { slug: string; children: ReactNode }) {
  const startedAt = useRef(0);
  useEffect(() => { startedAt.current = Date.now(); }, [slug]);
  const value = useMemo<Scope>(() => ({
    slug,
    lap: () => {
      const s = startedAt.current ? Math.round((Date.now() - startedAt.current) / 1000) : 0;
      startedAt.current = Date.now();
      return s;
    },
  }), [slug]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

const MAX_TRIES = 2;

/**
 * Đặt ở màn hình hoàn thành của mô phỏng. Phần thực hành được chấm ngay từ số lần sai và (với học sinh) lưu một lần mỗi lượt;
 * sau đó em viết vài câu giải thích để AI chấm nốt phần còn lại và nhận xét. Lượt mới bắt đầu khi bấm "Làm lại".
 */
export function LabScore({ mistakes }: { mistakes: number }) {
  const scope = useContext(Ctx);
  const user = useCurrentUser();
  const record = useApp((s) => s.recordLabResult);
  const saveGrade = useApp((s) => s.gradeLabResult);
  const rubric = scope ? LAB_RUBRICS[scope.slug] : undefined;
  const score = rubric ? practiceScore(mistakes) : labScore(mistakes);
  const student = user?.role === "student" ? user.id : undefined;
  const saved = useRef<{ id: string; seconds: number } | null>(null);
  const [answer, setAnswer] = useState("");
  const [grade, setGrade] = useState<LabGrade | null>(null);
  const [tries, setTries] = useState(0);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!scope || !student || saved.current) return;
    const seconds = scope.lap();
    saved.current = { id: record({ studentId: student, labSlug: scope.slug, score, mistakes, seconds }), seconds };
    toast.success(rubric ? `Đã lưu phần thực hành: ${fmtScore(score)}/${PRACTICE_MAX} điểm` : `Đã lưu kết quả: ${fmtScore(score)} điểm`);
  }, [scope, student, record, score, mistakes, rubric]);

  const submit = async () => {
    if (!scope || !rubric || answer.trim().length < 10) return toast.error("Em viết ít nhất một câu nhé.");
    setBusy(true);
    try {
      const g = await gradeLab({ slug: scope.slug, labTitle: getLabBySlug(scope.slug)?.title ?? scope.slug, mistakes, seconds: saved.current?.seconds ?? 0, answer: answer.trim() }, labGradeLlm);
      setGrade(g);
      setTries((t) => t + 1);
      if (student && saved.current) saveGrade(saved.current.id, student, answer.trim(), g);
    } catch {
      toast.error("Chưa chấm được, em thử lại sau.");
    } finally {
      setBusy(false);
    }
  };

  if (!rubric) {
    return (
      <p className="mt-1 text-sm text-fg">
        Điểm: <b className="text-lg">{fmtScore(score)}</b>/10
        <span className="block text-xs text-muted">Hoàn thành được 10 điểm, mỗi lần chọn sai trừ 0,5.{student ? "" : " Đăng nhập tài khoản học sinh để lưu kết quả."}</span>
      </p>
    );
  }
  return (
    <div className="mt-2 space-y-3 text-left">
      {!grade && (
        <>
          <p className="text-center text-sm text-fg">Phần thực hành: <b className="text-lg">{fmtScore(score)}</b>/{PRACTICE_MAX}<span className="block text-xs text-muted">Còn {EXPLAIN_MAX} điểm cho phần giải thích bên dưới.</span></p>
          <div className="rounded-xl border border-line bg-surface-2/50 p-3">
            <label htmlFor="lab-explain" className="flex items-start gap-1.5 text-sm font-semibold text-fg"><Sparkles className="mt-0.5 size-4 shrink-0 text-cyan-fg" aria-hidden /> {rubric.prompt}</label>
            <Textarea id="lab-explain" className="mt-2 min-h-[96px]" placeholder="Viết bằng lời của em, 2–4 câu." value={answer} onChange={(e) => setAnswer(e.target.value)} maxLength={1500} />
            <div className="mt-2 flex items-center justify-between gap-2">
              <span className="text-xs text-muted">AI chấm theo các ý chính của bài và nhận xét cho em.</span>
              <Button size="sm" loading={busy} onClick={submit}><Send /> Nộp để AI chấm</Button>
            </div>
          </div>
        </>
      )}
      {grade && (
        <>
          <LabGradeCard grade={grade} answer={answer} />
          {tries < MAX_TRIES ? (
            <Button size="sm" variant="ghost" onClick={() => setGrade(null)}><PencilLine /> Viết lại câu giải thích (còn {MAX_TRIES - tries} lần)</Button>
          ) : <p className="text-xs text-muted">Em đã dùng hết {MAX_TRIES} lần nộp cho lượt này.</p>}
        </>
      )}
      {!student && <p className="text-center text-xs text-muted">Đăng nhập tài khoản học sinh để lưu kết quả.</p>}
    </div>
  );
}

/** Bản chấm chi tiết: điểm từng tiêu chí, điều làm tốt, điều cần bổ sung, bước tiếp theo. Dùng cho cả học sinh và giáo viên. */
export function LabGradeCard({ grade, answer, review, compact = false }: { grade: LabGrade; answer?: string; review?: LabResult["review"]; compact?: boolean }) {
  const total = review?.score ?? grade.score;
  return (
    <div className="rounded-xl border border-line bg-surface p-3 text-sm">
      <div className="flex items-center gap-2">
        <span className="text-2xl font-bold tabular-nums text-fg">{fmtScore(total)}</span><span className="text-muted">/10</span>
        <span className={cn("ml-auto rounded-full px-2 py-0.5 text-[11px] font-semibold", grade.source === "ai" ? "bg-violet/15 text-violet-fg" : "bg-surface-2 text-muted")}>{grade.source === "ai" ? "AI chấm" : "Chấm theo tiêu chí"}</span>
      </div>
      {review && <p className="mt-1 rounded-lg bg-success/10 px-2 py-1 text-xs text-fg"><b>Thầy cô đã duyệt</b>{review.score !== grade.score ? ` (sửa từ ${fmtScore(grade.score)})` : ""}{review.note ? `: ${review.note}` : ""}</p>}
      <ul className="mt-2 space-y-1.5">
        {grade.criteria.map((c) => (
          <li key={c.id}>
            <div className="flex items-baseline justify-between gap-2"><span className="font-medium text-fg">{c.label}</span><span className={cn("tabular-nums", c.score < 0 ? "text-danger-fg" : "text-fg")}>{c.score < 0 ? fmtScore(c.score) : `${fmtScore(c.score)}/${c.max}`}</span></div>
            {c.max > 0 && <div className="mt-0.5 h-1 rounded-full bg-surface-2"><div className="h-full rounded-full bg-cyan" style={{ width: `${(c.score / c.max) * 100}%` }} /></div>}
            {!compact && <p className="mt-0.5 text-xs text-muted">{c.comment}</p>}
          </li>
        ))}
      </ul>
      {answer && <blockquote className="mt-2 border-l-2 border-line pl-2 text-xs italic text-fg/80">“{answer}”</blockquote>}
      {grade.strengths.map((x) => <p key={x} className="mt-2 flex gap-1.5 text-xs text-fg"><CheckCircle2 className="size-3.5 shrink-0 text-success-fg" aria-hidden />{x}</p>)}
      {grade.improve.map((x) => <p key={x} className="mt-1 flex gap-1.5 text-xs text-fg"><ArrowRight className="size-3.5 shrink-0 text-warning-fg" aria-hidden />{x}</p>)}
      {grade.misconception && !grade.criteria.some((c) => c.id === "misconception") && <p className="mt-1 text-xs text-danger-fg">{grade.misconception}</p>}
      {!compact && <p className="mt-2 rounded-lg bg-cyan/5 px-2 py-1.5 text-xs text-fg"><b>Bước tiếp theo:</b> {grade.nextStep}</p>}
      {grade.needsReview && !review && <p className="mt-2 text-xs text-warning-fg">Thầy cô sẽ xem lại bài này ({grade.reviewReason}).</p>}
    </div>
  );
}
