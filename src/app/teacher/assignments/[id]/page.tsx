"use client";
/** Chi tiết một bài giao: tiến độ nộp/chấm, danh sách học sinh với điểm, và các thao tác (sửa hạn, đóng, củng cố, xem như HS). */
import Link from "next/link";
import { Fragment, useState } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, BookMarked, ClipboardCheck, Eye, Lock, LockOpen, Pencil, RotateCcw, Send } from "lucide-react";
import { toast } from "sonner";
import type { Assignment, HintMode } from "@/lib/domain/types";
import { CODING_EXERCISES } from "@/lib/data/coding-exercises";
import { getQuestion, getSet, KIND_LABEL, LEVEL_LABEL, levelOf, type PracticeQuestion } from "@/lib/data/practice";
import { HINT_LABEL } from "@/lib/labels";
import { bookEntry } from "@/lib/sgk/book";
import { assignedStudents, teacherAssignments } from "@/lib/store/scoped";
import { useSessionData } from "@/lib/store/use-role";
import { SCORING_LABEL, assignmentCourse, assignmentStats, gradeCell } from "@/lib/teacher/assign";
import { fmtScore } from "@/lib/sim/lab-score";
import { cn, formatDate, relativeDays } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ErrorState } from "@/components/ui/feedback";
import { Field, Input, Select } from "@/components/ui/form";
import { LabPreview } from "@/components/labs/lab-preview";
import { AssignDialog } from "@/components/teacher/assign-dialog";
import { lessonAssignables } from "@/components/sgk/reader";

const TASK_LABEL = { lab: "Mô phỏng", quiz: "Bộ câu hỏi", code: "Bài lập trình" } as const;
const toLocal = (iso: string) => { const d = new Date(iso); return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16); };

export default function AssignmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { d, user } = useSessionData();
  const a = teacherAssignments(d, user.id).find((x) => x.id === id);
  if (!a) return <ErrorState page title="Không tìm thấy bài giao" action={<Button asChild variant="secondary"><Link href="/teacher/assignments">Về danh sách</Link></Button>} />;
  return <Detail key={a.id} a={a} />;
}

function Detail({ a }: { a: Assignment }) {
  const { d, user } = useSessionData();
  const [now] = useState(() => Date.now());
  const [dialog, setDialog] = useState<"preview" | "edit" | null>(null);
  const [remedial, setRemedial] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const s = assignmentStats(d, a);
  const src = assignmentCourse(d, a);
  const klass = d.classes.find((c) => c.id === a.classId);
  const rows = assignedStudents(d, a).map((u) => ({ u, c: gradeCell(d, u.id, a, now), sub: d.submissions.find((x) => x.assignmentId === a.id && x.studentId === u.id) }));
  const scores = rows.flatMap((r) => (r.c.status === "graded" && r.c.ratio !== undefined ? [Math.round(r.c.ratio * 20) / 2] : []));
  const e = a.sgkRef ? bookEntry(a.sgkRef) : undefined;
  // còn hạn mà chưa ai làm thì chưa nói tới củng cố
  const weak = new Date(a.dueAt).getTime() < now || s.done > 0 ? s.weak : [];

  return (
    <>
      <Button asChild variant="ghost" size="sm" className="mb-2"><Link href="/teacher/assignments"><ArrowLeft /> Bài đã giao</Link></Button>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-muted">{e ? <Link href={`/teacher/sgk/${e.ref}`} className="inline-flex items-center gap-1 font-medium text-cyan-fg hover:underline"><BookMarked className="size-3.5" aria-hidden /> Tin {e.grade} · Bài {e.lesson.no}. {e.lesson.title}</Link> : src ? src.course.title : "Không gắn bài học"} · {a.task ? TASK_LABEL[a.task.kind] : "Hoạt động chấm theo tiêu chí"}{a.task ? ` · ${a.maxAttempts ? `tối đa ${a.maxAttempts} lần` : "không giới hạn lần làm"} · tính ${SCORING_LABEL[a.scoring ?? "best"].toLowerCase()}` : ""}</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-fg">{a.title}</h1>
          <p className="mt-1 text-sm text-muted">Lớp <b className="text-fg">{klass?.name}</b>{a.studentIds ? ` (${a.studentIds.length} em)` : ""} · Hạn {formatDate(a.dueAt, true)} ({relativeDays(a.dueAt)}) · {a.status === "draft" ? "chưa giao" : a.status === "closed" ? "đã đóng" : "đang mở"}{a.note ? ` · “${a.note}”` : ""}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {a.status === "draft" && <Button onClick={() => { d.updateAssignment(a.id, { status: "open", publishedAt: new Date().toISOString() }); toast.success("Đã giao"); }}><Send /> Giao ngay</Button>}
          {s.pending > 0 && <Button asChild><Link href={`/teacher/assessment?assignment=${a.id}`}><ClipboardCheck /> Chấm {s.pending} bài</Link></Button>}
          <Button variant="secondary" onClick={() => setDialog("edit")}><Pencil /> Sửa hạn</Button>
          <Button variant="secondary" onClick={() => setDialog("preview")}><Eye /> Xem như học sinh</Button>
          {a.status !== "draft" && <Button variant="ghost" onClick={() => { d.updateAssignment(a.id, { status: a.status === "open" ? "closed" : "open" }); toast.success(a.status === "open" ? "Đã đóng nhận bài" : "Đã mở lại"); }}>{a.status === "open" ? <><Lock /> Đóng nhận bài</> : <><LockOpen /> Mở lại</>}</Button>}
        </div>
      </div>

      <div className="mb-5 grid gap-2 sm:grid-cols-4">
        {[
          { label: a.task ? "Đã làm" : "Đã nộp", value: `${s.done}/${s.target}` },
          { label: "Chờ chấm", value: a.task ? "–" : s.pending },
          { label: "Điểm trung bình", value: scores.length ? fmtScore(Math.round((scores.reduce((x, y) => x + y, 0) / scores.length) * 10) / 10) : "–" },
          { label: "Cần củng cố", value: weak.length || "–" },
        ].map((k) => <div key={k.label} className="rounded-2xl border border-line bg-surface p-3"><p className="text-xs font-semibold uppercase tracking-wide text-muted">{k.label}</p><p className="mt-1 text-2xl font-bold tabular-nums text-fg">{k.value}</p></div>)}
      </div>

      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-lg font-bold text-fg">Học sinh</h2>
        {weak.length > 0 && a.status !== "draft" && <Button size="sm" variant="secondary" onClick={() => setRemedial(true)}><RotateCcw /> Giao củng cố cho {weak.length} em</Button>}
      </div>
      <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
        <table className="w-full min-w-[520px] text-sm">
          <thead><tr className="border-b border-line text-left text-xs font-semibold uppercase tracking-wide text-muted"><th className="px-4 py-2.5">Học sinh</th><th className="px-3 py-2.5">Trạng thái</th><th className="px-3 py-2.5">Kết quả</th><th className="px-3 py-2.5">Thời gian</th><th className="w-24" /></tr></thead>
          <tbody>
            {rows.map(({ u, c, sub }) => (
              <Fragment key={u.id}>
              <tr className="border-b border-line/60 last:border-0">
                <td className="px-4 py-2.5 font-medium text-fg">{u.name}</td>
                <td className="px-3 py-2.5"><span className={cn("rounded-md px-2 py-0.5 text-xs font-semibold", c.status === "graded" ? "bg-success/15 text-success-fg" : c.status === "missing" ? "bg-danger/15 text-danger-fg" : c.status === "open" ? "bg-surface-2 text-muted" : "bg-violet/15 text-violet-fg")}>{{ graded: a.task ? "Đã làm" : "Đã chấm", missing: "Chưa nộp", open: "Chưa làm", pending: "Chờ chấm", late: "Nộp muộn, chờ chấm" }[c.status]}</span></td>
                <td className="px-3 py-2.5 tabular-nums text-fg">{c.status === "graded" ? c.text : "–"}</td>
                <td className="px-3 py-2.5 text-xs text-muted">{c.at ? formatDate(c.at, true) : "–"}</td>
                <td className="px-3 py-2.5 text-right">
                  {sub ? <Link className="text-xs font-semibold text-cyan-fg hover:underline" href={`/teacher/assessment?assignment=${a.id}&submission=${sub.id}`}>{sub.status === "graded" ? "Xem bài" : "Chấm"}</Link>
                    : a.task && c.status === "graded" && <button type="button" aria-expanded={open === u.id} onClick={() => setOpen(open === u.id ? null : u.id)} className="text-xs font-semibold text-cyan-fg hover:underline">{open === u.id ? "Thu gọn" : "Bài làm"}</button>}
                </td>
              </tr>
              {open === u.id && a.task && <tr className="border-b border-line/60 bg-surface-2/40"><td colSpan={5} className="px-4 py-3"><WorkDetail a={a} studentId={u.id} /></td></tr>}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={!!dialog} onOpenChange={(o) => !o && setDialog(null)}>
        {dialog === "preview" && <Preview a={a} />}
        {dialog === "edit" && <EditForm a={a} onDone={() => setDialog(null)} />}
      </Dialog>
      <AssignDialog open={remedial} onOpenChange={setRemedial} title="Giao lại bài củng cố" classId={a.classId} studentIds={weak} sgkRef={a.sgkRef} courseId={a.courseId} preset={a.task ? { kind: a.task.kind, ref: a.task.ref } : undefined} suggest={e ? lessonAssignables(d, user.id, e) : undefined} />
    </>
  );
}

function EditForm({ a, onDone }: { a: Assignment; onDone: () => void }) {
  const { d } = useSessionData();
  const [due, setDue] = useState(toLocal(a.dueAt));
  const [hint, setHint] = useState<HintMode>(a.hintMode);
  return (
    <DialogContent title="Sửa bài giao">
      <div className="space-y-3">
        <Field label="Hạn nộp" htmlFor="ed-due"><Input id="ed-due" type="datetime-local" value={due} onChange={(e) => setDue(e.target.value)} /></Field>
        <Field label="Chế độ gợi ý" htmlFor="ed-hint"><Select id="ed-hint" value={hint} onChange={(e) => setHint(e.target.value as HintMode)}>{Object.entries(HINT_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</Select></Field>
        <Button className="w-full" onClick={() => { const t = new Date(due).getTime(); if (Number.isNaN(t)) return toast.error("Ngày không hợp lệ"); d.updateAssignment(a.id, { dueAt: new Date(t).toISOString(), hintMode: hint }); toast.success("Đã lưu"); onDone(); }}>Lưu</Button>
      </div>
    </DialogContent>
  );
}

/** Bài làm của một em ở nhiệm vụ máy chấm: các lần làm được tính, câu sai kèm đáp án và giải thích, lỗi chương trình. */
function WorkDetail({ a, studentId }: { a: Assignment; studentId: string }) {
  const { d } = useSessionData();
  const t = a.task!;
  const cap = <T,>(xs: T[]) => (a.maxAttempts ? xs.slice(0, a.maxAttempts) : xs);
  if (t.kind === "lab") {
    const rs = cap(d.labResults.filter((r) => r.studentId === studentId && r.labSlug === t.ref && r.finishedAt >= a.publishedAt).sort((x, y) => x.finishedAt.localeCompare(y.finishedAt)));
    return (
      <ol className="space-y-2 text-sm">
        {rs.map((r, i) => (
          <li key={r.id} className="rounded-lg border border-line bg-surface p-2.5">
            <p className="text-fg"><b>Lần {i + 1}</b> · {formatDate(r.finishedAt, true)} · <b>{fmtScore(r.score)} điểm</b> · {r.mistakes} lần chọn sai · {Math.round(r.seconds / 60)} phút</p>
            {r.answer && <p className="mt-1 text-muted">Giải thích của em: “{r.answer}”</p>}
            {r.grade && r.grade.improve.length > 0 && <p className="mt-1 text-muted">Cần cải thiện: {r.grade.improve.join("; ")}</p>}{r.review?.note && <p className="mt-1 text-muted">Thầy cô nhận xét: {r.review.note}</p>}
          </li>
        ))}
      </ol>
    );
  }
  if (t.kind === "code") {
    const w = d.codeWorks.find((c) => c.studentId === studentId && c.exerciseId === t.ref);
    if (!w?.lastRun) return <p className="text-sm text-muted">Chưa chạy kiểm thử.</p>;
    return (
      <div className="space-y-2 text-sm">
        <p className="text-fg">Lần chạy gần nhất {formatDate(w.lastRun.at, true)}: đạt <b>{w.lastRun.passed}/{w.lastRun.total}</b> test{w.lastRun.errorType ? ` · lỗi ${w.lastRun.errorType}` : ""}</p>
        {w.code && <pre className="max-h-56 overflow-auto rounded-lg bg-[#0b1220] p-3 font-mono text-xs text-slate-200">{w.code}</pre>}
      </div>
    );
  }
  const tq = d.teacherQuizzes.find((q) => q.id === t.ref);
  const q = (id: string) => tq?.questions.find((x) => x.id === id) ?? getQuestion(id);
  const rs = cap(d.practiceAttempts.filter((p) => p.studentId === studentId && p.setId === t.ref && p.finishedAt >= a.publishedAt).sort((x, y) => x.finishedAt.localeCompare(y.finishedAt)));
  const right = (x: PracticeQuestion) => ("options" in x && x.options && "correctIndex" in x ? x.options[x.correctIndex as number] : "answer" in x && typeof x.answer === "boolean" ? (x.answer ? "Đúng" : "Sai") : undefined);
  return (
    <div className="space-y-3 text-sm">
      {rs.map((p, i) => {
        const wrong = p.items.filter((it) => it.status === "wrong");
        const sc = p.items.filter((it) => it.status !== "self");
        return (
          <div key={p.id} className="rounded-lg border border-line bg-surface p-2.5">
            <p className="text-fg"><b>Lần {i + 1}</b> · {formatDate(p.finishedAt, true)} · <b>{sc.filter((it) => it.status === "correct").length}/{sc.length} câu đúng</b>{p.autoSubmitted ? " · nộp tự động vì rời tab" : p.violations ? ` · rời tab ${p.violations} lần` : ""}</p>
            {wrong.length > 0 && (
              <ul className="mt-2 space-y-1.5">
                {wrong.map((it) => { const x = q(it.questionId); return x ? (
                  <li key={it.questionId} className="rounded-md bg-danger/5 px-2.5 py-1.5">
                    <p className="text-fg">✗ {x.prompt}</p>
                    <p className="text-xs text-muted">{it.answer ? `Em chọn: ${it.answer} · ` : ""}{right(x) ? `Đáp án: ${right(x)}` : ""}</p>
                    {x.explanation && <p className="text-xs text-muted">Giải thích: {x.explanation}</p>}
                  </li>
                ) : null; })}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}

/** Xem bài như học sinh sẽ thấy (giáo viên làm thử không bị ghi điểm). */
function Preview({ a }: { a: Assignment }) {
  const { d } = useSessionData();
  const t = a.task;
  const quiz = t?.kind === "quiz" ? (d.teacherQuizzes.find((q) => q.id === t.ref)?.questions ?? getSet(t.ref)?.questionIds.map(getQuestion).filter((q): q is PracticeQuestion => !!q) ?? []) : [];
  const ex = t?.kind === "code" ? CODING_EXERCISES.find((e) => e.id === t.ref) : undefined;
  return (
    <DialogContent title={`Học sinh sẽ thấy: ${a.title}`} description={[a.note && `Lời dặn: “${a.note}”`, `Hạn ${formatDate(a.dueAt, true)}`, a.hintMode === "off" ? "không dùng AI Gia sư" : "được hỏi AI Gia sư"].filter(Boolean).join(" · ")} className="max-w-4xl">
      {t?.kind === "lab" && <LabPreview slug={t.ref} />}
      {t?.kind === "quiz" && (
        <ol className="max-h-[65vh] space-y-3 overflow-y-auto pr-1">
          {quiz.map((q, i) => (
            <li key={q.id} className="rounded-xl border border-line p-3 text-sm">
              <p className="text-xs text-muted">Câu {i + 1} · {KIND_LABEL[q.kind]} · {LEVEL_LABEL[levelOf(q)]}</p>
              <p className="mt-1 font-medium text-fg">{q.prompt}</p>
              {"options" in q && q.options && <ul className="mt-2 grid gap-1 sm:grid-cols-2">{q.options.map((o, k) => <li key={k} className="rounded-lg border border-line px-2 py-1 font-mono text-xs text-fg">{"ABCD"[k]}. {o}</li>)}</ul>}
            </li>
          ))}
        </ol>
      )}
      {ex && (
        <div className="space-y-2 text-sm">
          <p className="text-fg">{ex.task}</p>
          <p className="text-muted">{ex.tests.length} bộ test chấm tự động. Học sinh thấy dữ liệu thử của 2 test đầu.</p>
          <pre className="rounded-lg bg-[#0b1220] p-3 font-mono text-xs text-slate-200">{ex.starter}</pre>
        </div>
      )}
      {!t && <p className="text-sm text-muted">Hoạt động tự thiết kế: học sinh làm trong phòng thí nghiệm, nộp bài kèm giải thích; thầy cô chấm theo tiêu chí.</p>}
    </DialogContent>
  );
}
