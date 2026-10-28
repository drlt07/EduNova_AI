"use client";
import Link from "next/link";
import { Suspense, useEffect, useRef, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, ArrowRight, BookOpen, Bot, CheckCircle2, Clock, Lock, RotateCcw, Target, XCircle } from "lucide-react";
import { toast } from "sonner";
import { setKey } from "@/lib/access/unlocks";
import { useAccess } from "@/lib/access/use-access";
import { KIND_LABEL, PRACTICE_SETS, getQuestion, getSet, type PracticeQuestion } from "@/lib/data/practice";
import { LESSONS, getObjective } from "@/lib/data/curriculum";
import { findSgk } from "@/lib/data/sgk-kntt";
import { gradeQuestion, pickNext, type Answer, type GradeResult } from "@/lib/practice/grade";
import { studentBook } from "@/lib/store/student-insights";
import { useSessionData } from "@/lib/store/use-role";
import { studentClassIds } from "@/lib/store/scoped";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ErrorState, PageSkeleton } from "@/components/ui/feedback";
import { PageHeader } from "@/components/ui/misc";
import { AnimatedBar, Celebrate } from "@/components/motion";
import { QuestionView } from "@/components/student/question-view";
import { useTutor, useTutorActivity, useTutorLock } from "@/components/tutor/tutor-provider";
import { LockStart, LockWarning, MAX_LEAVES, useExamLock } from "@/components/student/exam-lock";

type Mode = "practice" | "adaptive" | "exam";
const MODE_NAME: Record<Mode, string> = { practice: "Luyện tập", adaptive: "Thích ứng", exam: "Kiểm tra" };
const ADAPTIVE_LEN = 6;
const toText = (a: Answer) => (a === null ? "" : typeof a === "string" ? a : JSON.stringify(a));

function Runner({ setId }: { setId: string }) {
  const { d, user } = useSessionData();
  const params = useSearchParams();
  const raw = params.get("che-do");
  const mode: Mode = raw === "adaptive" || raw === "exam" ? raw : "practice";
  // Bộ có sẵn trong ngân hàng, hoặc bộ câu hỏi thầy cô giao cho lớp của em
  const tq = d.teacherQuizzes.find((q) => q.id === setId && q.status === "published" && q.classIds.some((c) => studentClassIds(d, user.id).includes(c)));
  const set = getSet(setId) ?? (tq ? { id: tq.id, title: tq.title, grade: tq.grade, lessonKey: "", description: "", questionIds: tq.questions.map((q) => q.id) } : undefined);
  const [run, setRun] = useState(0);
  const access = useAccess();
  if (set && !tq && !access.can(setKey(set.id))) return <ErrorState page title="Bộ luyện tập chưa được mở" description="Thầy cô sẽ mở bộ này khi lớp học tới bài. Em làm các bộ đã mở trong trang Luyện tập nhé." action={<Button asChild variant="secondary"><Link href="/student/practice">Về danh sách</Link></Button>} />;
  if (!set) return <ErrorState page title="Không tìm thấy bộ câu hỏi" action={<Button asChild variant="secondary"><Link href="/student/practice">Về danh sách</Link></Button>} />;
  // Bộ thích ứng lấy câu từ mọi bộ cùng bài học
  const pool = tq ? tq.questions : mode === "adaptive"
    ? (set.lessonKey ? PRACTICE_SETS.filter((s) => s.lessonKey === set.lessonKey && access.can(setKey(s.id))) : [set]).flatMap((s) => s.questionIds).map(getQuestion).filter((q): q is PracticeQuestion => !!q)
    : set.questionIds.map(getQuestion).filter((q): q is PracticeQuestion => !!q);
  const passedLevels = d.gameProgress.find((g) => g.studentId === user.id && g.gameSlug === "smart-farm")?.passed ?? [];
  return (
    <>
      <PageHeader
        title={set.title}
        description={`Chế độ: ${MODE_NAME[mode]}`}
        actions={<Button asChild variant="ghost" size="sm"><Link href="/student/practice"><ArrowLeft className="size-4" /> Bộ câu hỏi</Link></Button>}
      />
      <Session key={`${mode}-${run}`} setId={set.id} mode={mode} pool={pool} passedLevels={passedLevels} onRestart={() => setRun((r) => r + 1)} />
    </>
  );
}

function Session({ setId, mode, pool, passedLevels, onRestart }: { setId: string; mode: Mode; pool: PracticeQuestion[]; passedLevels: number[]; onRestart: () => void }) {
  const { d, user } = useSessionData();
  const tutor = useTutor();
  useTutorLock(mode === "exam");
  const [startedAt] = useState(() => new Date().toISOString());
  const [order, setOrder] = useState<PracticeQuestion[]>(() => (mode === "adaptive" ? [pickNext(pool, [])!] : pool));
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [graded, setGraded] = useState<Record<string, GradeResult>>({});
  const [finished, setFinished] = useState(false);
  const limit = pool.length * 60 + 120;
  const [left, setLeft] = useState(limit);

  const [started, setStarted] = useState(false);
  const finish = (force = false, auto = false) => {
    if (finished) return;
    const unanswered = order.filter((q) => answers[q.id] === undefined).length;
    if (!force && mode === "exam" && unanswered && !window.confirm(`Còn ${unanswered} câu chưa trả lời. Em vẫn nộp bài?`)) return;
    const all: Record<string, GradeResult> = { ...graded };
    for (const q of order) all[q.id] ??= gradeQuestion(q, answers[q.id] ?? null, { passedLevels });
    setGraded(all);
    setFinished(true);
    d.savePracticeAttempt({
      studentId: user.id,
      setId,
      mode,
      startedAt,
      finishedAt: new Date().toISOString(),
      items: order.map((q) => ({ questionId: q.id, objectiveId: q.objectiveId, status: all[q.id].status, answer: toText(answers[q.id] ?? null) })),
      violations: Math.max(lock.leaves, auto ? MAX_LEAVES : 0),
      autoSubmitted: auto || undefined,
    });
    if (auto) toast.warning(`Em đã rời bài ${MAX_LEAVES} lần — bài được nộp tự động`);
    else toast.success("Đã lưu kết quả vào tiến độ học tập");
  };

  const finishRef = useRef(finish);
  useEffect(() => {
    finishRef.current = finish;
  });
  const lock = useExamLock(started && !finished, () => finishRef.current(true, true));
  useEffect(() => {
    if (mode !== "exam" || finished || !started) return;
    let remaining = limit;
    const t = window.setInterval(() => {
      remaining -= 1;
      setLeft(Math.max(0, remaining));
      if (remaining <= 0) {
        window.clearInterval(t);
        toast.warning("Hết giờ — bài được nộp tự động");
        finishRef.current(true);
      }
    }, 1000);
    return () => window.clearInterval(t);
  }, [mode, finished, limit, started]);

  // AI Gia sư đọc câu đang làm và câu trả lời của em; bài kiểm tra → gia sư tắt
  const cur = order[idx];
  const touchTutor = useTutorActivity(
    "quiz",
    () => (cur ? { kind: "quiz", question: cur.prompt, answer: answers[cur.id] !== undefined ? toText(answers[cur.id]) : undefined, correct: graded[cur.id] ? graded[cur.id].status === "correct" : undefined } : undefined),
    { title: `Luyện tập – ${getSet(setId)?.title ?? ""}`, topic: cur ? (cur.objectiveId.endsWith("05") ? "loop" : cur.objectiveId.startsWith("O10-A") ? "binary" : "if") : "if", level: mode === "exam" ? "exam" : "guided", objectiveId: cur?.objectiveId },
  );

  const warn = lock.warning && <LockWarning leaves={lock.leaves} onResume={lock.resume} />;
  if (finished) return <>{warn}<Result setId={setId} order={order} answers={answers} graded={graded} onRestart={onRestart} /></>;
  if (!started) return <LockStart title={getSet(setId)?.title ?? "Bộ câu hỏi"} count={mode === "adaptive" ? Math.min(ADAPTIVE_LEN, pool.length) : pool.length} onStart={() => setStarted(true)} />;

  const q = order[idx];
  const g = graded[q.id];
  const check = () => { touchTutor(); setGraded((s) => ({ ...s, [q.id]: gradeQuestion(q, answers[q.id] ?? null, { passedLevels }) })); };
  const total = mode === "adaptive" ? Math.min(ADAPTIVE_LEN, pool.length) : order.length;
  const next = () => {
    if (mode === "adaptive") {
      if (order.length >= total) return finish();
      const history = order.map((x) => ({ questionId: x.id, status: graded[x.id]?.status ?? "wrong" }));
      const n = pickNext(pool, history);
      if (!n) return finish();
      setOrder((o) => [...o, n]);
    }
    setIdx((i) => i + 1);
  };
  const isLast = mode === "adaptive" ? order.length >= total : idx === order.length - 1;

  return (
    // Đang làm bài: phủ toàn màn hình, che menu và thanh trên để không rời trang trong ứng dụng
    <div className="fixed inset-0 z-[45] overflow-y-auto bg-bg px-4 py-6 sm:px-8">
    <p className="mx-auto mb-4 flex max-w-6xl items-center gap-2 text-sm font-semibold text-fg"><Lock className="size-4 text-blue-fg" aria-hidden /> {getSet(setId)?.title ?? "Bộ câu hỏi"}</p>
    <div className="mx-auto grid max-w-6xl gap-5 lg:grid-cols-[minmax(0,1fr)_240px]">
      {warn}
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-1.5">
            <Badge tone="cyan">Câu {idx + 1}/{total}</Badge>
            <Badge>{KIND_LABEL[q.kind]}</Badge>
          </div>
          {mode === "exam" && (
            <span role="timer" aria-live="off" className={cn("flex items-center gap-1 rounded-lg px-2 py-1 font-mono text-sm", left < 60 ? "bg-danger/15 text-danger-fg" : "bg-surface-2 text-fg")}>
              <Clock className="size-4" aria-hidden /> {String(Math.floor(left / 60)).padStart(2, "0")}:{String(left % 60).padStart(2, "0")}
            </span>
          )}
        </CardHeader>
        <CardContent>
          <AnimatePresence mode="wait">
            <motion.div key={q.id} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.22 }} className="space-y-4">
              <h2 className="text-lg font-semibold text-fg">{q.prompt}</h2>
              <QuestionView q={q} answer={answers[q.id] ?? null} onAnswer={(a) => setAnswers((s) => ({ ...s, [q.id]: a }))} disabled={!!g && mode !== "exam"} />
              {g && mode !== "exam" && <Feedback q={q} g={g} />}
            </motion.div>
          </AnimatePresence>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            {mode === "exam" ? (
              <>
                <Button variant="secondary" disabled={idx === 0} onClick={() => setIdx((i) => i - 1)}><ArrowLeft className="size-4" /> Câu trước</Button>
                {isLast ? <Button onClick={() => finish()} data-testid="practice-submit">Nộp bài</Button> : <Button onClick={() => setIdx((i) => i + 1)}>Câu sau <ArrowRight className="size-4" /></Button>}
              </>
            ) : !g ? (
              <Button onClick={check} disabled={answers[q.id] === undefined && q.kind !== "sim" && q.kind !== "interactive"} data-testid="practice-check">{q.kind === "short" ? "Xem gợi ý đáp án" : "Kiểm tra"}</Button>
            ) : isLast ? (
              <Button onClick={() => finish()} data-testid="practice-finish">Xem kết quả</Button>
            ) : (
              <Button onClick={next} data-testid="practice-next">Câu tiếp theo <ArrowRight className="size-4" /></Button>
            )}
            {mode === "exam" ? (
              <span className="flex items-center gap-1 text-xs text-muted"><Lock className="size-3.5" aria-hidden /> Gia sư AI tạm khóa trong bài kiểm tra</span>
            ) : (
              <Button variant="ghost" size="sm" onClick={() => { touchTutor(); tutor.open({ capability: g && g.status !== "correct" ? "debug" : "guide" }); }}><Bot className="size-4" /> Hỏi AI Gia sư</Button>
            )}
          </div>
        </CardContent>
      </Card>
      <aside aria-label="Danh sách câu" className="space-y-3">
        <p className="flex items-center gap-1.5 rounded-2xl border border-line bg-surface px-3 py-2 text-xs text-muted"><Lock className="size-3.5" aria-hidden /> Khóa tab · rời bài {lock.leaves}/{MAX_LEAVES}</p>
        <div className="flex flex-wrap gap-1.5 rounded-2xl border border-line bg-surface p-3">
          {Array.from({ length: total }, (_, i) => {
            const x = order[i];
            const st = x && graded[x.id]?.status;
            return (
              <button
                key={i}
                type="button"
                disabled={!x || mode === "adaptive"}
                onClick={() => setIdx(i)}
                aria-label={`Câu ${i + 1}${x && answers[x.id] !== undefined ? ", đã trả lời" : ""}`}
                aria-current={i === idx ? "step" : undefined}
                className={cn("size-9 rounded-lg border text-sm font-medium", i === idx ? "border-cyan bg-cyan/15 text-fg" : "border-line text-muted", st === "correct" && mode !== "exam" && "border-success/60 bg-success/10", st === "wrong" && mode !== "exam" && "border-danger/60 bg-danger/10", mode === "exam" && x && answers[x.id] !== undefined && i !== idx && "bg-surface-2 text-fg")}
              >{i + 1}</button>
            );
          })}
        </div>
        {mode === "adaptive" && <p className="rounded-xl bg-surface-2 p-3 text-xs text-muted">Câu tiếp theo được chọn theo luật: ưu tiên mục tiêu em đang trả lời sai nhiều nhất và câu em chưa làm. Đây không phải mô hình AI.</p>}
        {mode === "exam" && <Button variant="secondary" className="w-full" onClick={() => finish()}>Nộp bài sớm</Button>}
        {mode !== "exam" && <Button variant="ghost" className="w-full" onClick={() => finish()}>Kết thúc và nộp bài</Button>}
      </aside>
    </div>
    </div>
  );
}

function Feedback({ q, g }: { q: PracticeQuestion; g: GradeResult }) {
  const ok = g.status === "correct";
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} role="status" className={cn("rounded-xl border p-3 text-sm", g.status === "self" ? "border-line bg-surface-2" : ok ? "border-success/40 bg-success/10" : "border-danger/40 bg-danger/10")}>
      <p className="flex items-center gap-1.5 font-semibold text-fg">
        {g.status === "self" ? "Em hãy tự so sánh với gợi ý đáp án" : ok ? <><CheckCircle2 className="size-4 text-success-fg" /> Chính xác!</> : <><XCircle className="size-4 text-danger-fg" /> Chưa đúng</>}
      </p>
      {g.detail && <p className="mt-1 text-fg">{g.detail}</p>}
      {!ok && g.expected && (q.kind === "predict" || q.kind === "order" || q.kind === "fillcode" || q.kind === "short" || q.kind === "match" ? <pre className="mt-2 whitespace-pre-wrap rounded-lg bg-surface p-2 font-mono text-xs text-fg">{g.expected}</pre> : <p className="mt-1 text-fg">Đáp án: <b>{g.expected}</b></p>)}
      <p className="mt-1 text-muted">{q.explanation}</p>
    </motion.div>
  );
}

/** Câu trả lời của em, viết lại cho dễ đọc (phương án thay vì số thứ tự). */
function answerText(q: PracticeQuestion, a: Answer): string {
  if (a === null || a === undefined || a === "") return "(bỏ trống)";
  if (q.kind === "mcq" && typeof a === "number") return q.options[a] ?? String(a);
  if (q.kind === "truefalse") return a === true || a === "true" ? "Đúng" : "Sai";
  if (q.kind === "multi" && Array.isArray(a)) return (a as number[]).map((k) => q.options[k]).join("; ") || "(bỏ trống)";
  if (q.kind === "finderror" && typeof a === "number") return `Dòng ${a}`;
  if (q.kind === "interactive" && typeof a === "string" && a.startsWith("xong")) return `Hoàn thành thao tác${a.split(":")[1] && a.split(":")[1] !== "0" ? ` (bấm nhầm ${a.split(":")[1]} lần)` : " không bấm nhầm"}`;
  if (q.kind === "interactive" && typeof a === "string" && a.startsWith("buoc")) return `Dừng ở bước ${Number(a.split(":")[1]) + 1}`;
  return toText(a);
}

const VERDICT = [
  { min: 80, label: "Xuất sắc!", text: "Em nắm chắc bài này.", ring: "#10b981", bg: "from-emerald-500/15 via-teal-500/10", chip: "bg-emerald-500 text-white" },
  { min: 50, label: "Khá tốt", text: "Còn vài chỗ cần xem lại.", ring: "#f59e0b", bg: "from-amber-500/15 via-orange-500/10", chip: "bg-amber-500 text-white" },
  { min: 0, label: "Cần ôn thêm", text: "Đọc lại bài rồi làm lại nhé, em sẽ tiến bộ nhanh.", ring: "#f43f5e", bg: "from-rose-500/15 via-pink-500/10", chip: "bg-rose-500 text-white" },
];
type Filter = "all" | "wrong" | "correct";

function ScoreRing({ pct, color }: { pct: number; color: string }) {
  const r = 52, c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 128 128" className="size-32 shrink-0" data-testid="practice-score" role="img" aria-label={`Điểm ${pct}%`}>
      <circle cx="64" cy="64" r={r} fill="none" stroke="currentColor" strokeWidth="12" className="text-surface-2" />
      <motion.circle cx="64" cy="64" r={r} fill="none" stroke={color} strokeWidth="12" strokeLinecap="round" transform="rotate(-90 64 64)" strokeDasharray={c} initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: c * (1 - pct / 100) }} transition={{ duration: 0.9, ease: "easeOut" }} />
      <text x="64" y="62" textAnchor="middle" className="fill-fg text-[28px] font-extrabold">{pct}%</text>
      <text x="64" y="82" textAnchor="middle" className="fill-muted text-[11px]">mức đạt</text>
    </svg>
  );
}

function Result({ setId, order, answers, graded, onRestart }: { setId: string; order: PracticeQuestion[]; answers: Record<string, Answer>; graded: Record<string, GradeResult>; onRestart: () => void }) {
  const { d, user } = useSessionData();
  const [filter, setFilter] = useState<Filter>("all");
  const scored = order.filter((q) => graded[q.id].status !== "self");
  const correct = scored.filter((q) => graded[q.id].status === "correct").length;
  const wrong = scored.length - correct;
  const self = order.length - scored.length;
  const pctScore = scored.length ? Math.round((correct / scored.length) * 100) : 0;
  const v = VERDICT.find((x) => pctScore >= x.min)!;
  const byObj = new Map<string, { ok: number; n: number }>();
  for (const q of scored) {
    const c = byObj.get(q.objectiveId) ?? { ok: 0, n: 0 };
    byObj.set(q.objectiveId, { ok: c.ok + (graded[q.id].status === "correct" ? 1 : 0), n: c.n + 1 });
  }
  const rows = [...byObj.entries()].map(([o, x]) => ({ o, rate: Math.round((x.ok / x.n) * 100), ...x })).sort((a, b) => a.rate - b.rate);
  const weakest = rows.find((r) => r.rate < 80);
  const { book } = studentBook(d, user.id);
  const sgk = getSet(setId)?.sgkRef;
  const sgkEntry = sgk ? findSgk(sgk) : undefined;
  const lesson = !sgk && weakest ? LESSONS.find((l) => l.textbookId === book && l.objectiveIds.includes(weakest.o)) : undefined;
  const review = sgkEntry ? { href: `/student/sgk/${sgk}`, label: `Đọc lại Bài ${sgkEntry.lesson.no}` } : lesson ? { href: `/student/learning/${lesson.id}`, label: `Ôn bài “${lesson.title}”` } : null;
  const shown = order.map((q, i) => ({ q, i })).filter(({ q }) => filter === "all" || (filter === "wrong" ? graded[q.id].status === "wrong" : graded[q.id].status === "correct"));
  const tone = (q: PracticeQuestion) => graded[q.id].status === "correct" ? "bg-emerald-500 text-white" : graded[q.id].status === "wrong" ? "bg-rose-500 text-white" : "bg-slate-300 text-slate-700";
  return (
    <div className="space-y-5">
      <Celebrate show={pctScore >= 80} />
      <section className={cn("overflow-hidden rounded-3xl border border-line bg-gradient-to-br to-transparent p-6", v.bg)}>
        <div className="flex flex-wrap items-center gap-6">
          <ScoreRing pct={pctScore} color={v.ring} />
          <div className="min-w-0 flex-1 basis-72">
            <span className={cn("inline-block rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide", v.chip)}>{v.label}</span>
            <h2 className="mt-2 text-2xl font-bold text-fg">Em làm đúng {correct}/{scored.length} câu</h2>
            <p className="text-sm text-muted">{v.text}{self ? ` ${self} câu tự luận em tự đánh giá, không tính điểm.` : ""}</p>
            <div className="mt-4 grid max-w-md grid-cols-3 gap-2">
              <div className="rounded-2xl bg-emerald-500/15 px-3 py-2"><p className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-300">{correct}</p><p className="text-xs font-medium text-emerald-800/80 dark:text-emerald-200/80">câu đúng</p></div>
              <div className="rounded-2xl bg-rose-500/15 px-3 py-2"><p className="text-2xl font-extrabold text-rose-700 dark:text-rose-300">{wrong}</p><p className="text-xs font-medium text-rose-800/80 dark:text-rose-200/80">câu sai</p></div>
              <div className="rounded-2xl bg-slate-500/10 px-3 py-2"><p className="text-2xl font-extrabold text-fg">{self}</p><p className="text-xs font-medium text-muted">tự đánh giá</p></div>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Button onClick={onRestart}><RotateCcw className="size-4" /> Làm lại</Button>
            {review && <Button asChild variant="secondary"><Link href={review.href}><BookOpen className="size-4" /> {review.label}</Link></Button>}
            <Button asChild variant="ghost"><Link href="/student/practice">Bộ khác</Link></Button>
          </div>
        </div>
        <ol className="mt-5 flex flex-wrap gap-1.5" aria-label="Bản đồ câu">
          {order.map((q, i) => <li key={q.id}><a href={`#cau-${i + 1}`} title={KIND_LABEL[q.kind]} className={cn("grid size-8 place-items-center rounded-lg text-xs font-bold shadow-sm transition-transform hover:scale-110", tone(q))}>{i + 1}</a></li>)}
        </ol>
      </section>

      {weakest && (
        <section className="flex flex-wrap items-center gap-3 rounded-2xl border border-amber-400/40 bg-amber-400/10 p-4">
          <Target className="size-5 shrink-0 text-amber-600" aria-hidden />
          <p className="min-w-0 flex-1 text-sm text-fg">Nên ôn lại: <b>{getObjective(weakest.o)?.description}</b> <span className="text-muted">(đúng {weakest.ok}/{weakest.n})</span></p>
          {review && <Button asChild size="sm" variant="secondary"><Link href={review.href}>{review.label} <ArrowRight className="size-4" /></Link></Button>}
        </section>
      )}

      {rows.length > 1 && (
        <section className="rounded-2xl border border-line bg-surface p-5">
          <h2 className="mb-3 font-semibold text-fg">Kết quả theo mục tiêu</h2>
          <div className="space-y-3">
            {rows.map((r) => (
              <div key={r.o}>
                <p className="flex justify-between gap-2 text-sm text-fg"><span>{getObjective(r.o)?.description}</span><span className="shrink-0 font-semibold">{r.ok}/{r.n}</span></p>
                <AnimatedBar value={r.rate} tone={r.rate >= 80 ? "success" : r.rate >= 50 ? "cyan" : "warning"} label={`Mức đạt ${r.rate}%`} className="mt-1" />
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-line bg-surface p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold text-fg">Xem lại từng câu</h2>
          <div className="flex gap-1 rounded-xl bg-surface-2 p-1 text-sm" role="group" aria-label="Lọc câu">
            {([["all", `Tất cả ${order.length}`], ["wrong", `Câu sai ${wrong}`], ["correct", `Câu đúng ${correct}`]] as [Filter, string][]).map(([f, l]) => (
              <button key={f} type="button" aria-pressed={filter === f} onClick={() => setFilter(f)} className={cn("rounded-lg px-3 py-1 font-medium", filter === f ? "bg-surface text-fg shadow-sm" : "text-muted hover:text-fg")}>{l}</button>
            ))}
          </div>
        </div>
        <ol className="space-y-3">
          {shown.map(({ q, i }) => {
            const g = graded[q.id];
            return (
              <li key={q.id} id={`cau-${i + 1}`} className={cn("scroll-mt-24 rounded-2xl border-l-4 bg-surface-2/50 p-4", g.status === "correct" ? "border-emerald-500" : g.status === "wrong" ? "border-rose-500" : "border-slate-400")}>
                <div className="flex flex-wrap items-start gap-2">
                  <span className={cn("grid size-7 shrink-0 place-items-center rounded-lg text-xs font-bold", tone(q))}>{i + 1}</span>
                  <p className="min-w-0 flex-1 font-medium text-fg">{q.prompt}</p>
                  <Badge>{KIND_LABEL[q.kind]}</Badge>
                </div>
                <p className="mt-2 text-sm"><span className="text-muted">Em trả lời: </span><span className={cn("font-medium", g.status === "wrong" ? "text-rose-700 line-through decoration-rose-400/60 dark:text-rose-300" : "text-fg")}>{answerText(q, answers[q.id] ?? null)}</span></p>
                <div className="mt-2"><Feedback q={q} g={g} /></div>
              </li>
            );
          })}
          {shown.length === 0 && <li className="py-6 text-center text-sm text-muted">{filter === "wrong" ? "Không có câu sai. Tuyệt!" : "Chưa có câu đúng."}</li>}
        </ol>
      </section>
    </div>
  );
}

export default function PracticeRunPage() {
  const { id } = useParams<{ id: string }>();
  return <Suspense fallback={<PageSkeleton />}><Runner setId={id} /></Suspense>;
}
