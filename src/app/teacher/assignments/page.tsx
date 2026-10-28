"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { BookOpen, CalendarClock, ClipboardCheck, Eye, ListChecks, Lock, LockOpen, Pencil, Plus, RotateCcw, Search, Send } from "lucide-react";
import { toast } from "sonner";
import type { Assignment, HintMode } from "@/lib/domain/types";
import { CODING_EXERCISES } from "@/lib/data/coding-exercises";
import { LAB_TEMPLATES } from "@/lib/data/labs";
import { getQuestion, getSet, KIND_LABEL, LEVEL_LABEL, levelOf, type PracticeQuestion } from "@/lib/data/practice";
import { HINT_LABEL, MODE_LABEL } from "@/lib/labels";
import { bookEntry } from "@/lib/sgk/book";
import { assignedStudents, teacherAssignments, teacherClasses } from "@/lib/store/scoped";
import { useSessionData } from "@/lib/store/use-role";
import { taskOutcome } from "@/lib/teacher/assign";
import { cn, formatDate, matchesQuery, relativeDays } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/feedback";
import { Field, Input, Select } from "@/components/ui/form";
import { LabArt } from "@/components/labs/lab-art";
import { LabPreview } from "@/components/labs/lab-preview";
import { AssessTabs } from "@/components/teacher/assess-tabs";
import { LabReviewQueue } from "@/components/teacher/lab-review";
import { AssignDialog } from "@/components/teacher/assign-dialog";
import { lessonAssignables } from "@/components/sgk/reader";

const TASK_LABEL = { lab: "Mô phỏng", quiz: "Bộ câu hỏi", code: "Bài code" } as const;
type Bucket = "grading" | "ongoing" | "ended" | "draft";
const BUCKETS: { id: Bucket; label: string; empty: string }[] = [
  { id: "grading", label: "Chờ chấm", empty: "Không có bài nào chờ thầy cô chấm." },
  { id: "ongoing", label: "Đang diễn ra", empty: "Không có nhiệm vụ nào đang mở." },
  { id: "ended", label: "Đã kết thúc", empty: "Chưa có nhiệm vụ nào kết thúc." },
  { id: "draft", label: "Chưa giao", empty: "Không có bản nháp. Trong hộp thoại giao nhiệm vụ, chọn “Lưu nháp, giao sau”." },
];
const toLocal = (iso: string) => { const d = new Date(iso); return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16); };

interface Stat { target: number; done: number; working: number; pending: number; graded: number; weak: string[] }

/** Kết quả từng em của nhiệm vụ máy chấm. */
function TaskResults({ a }: { a: Assignment }) {
  const { d } = useSessionData();
  const rows = assignedStudents(d, a).map((u) => ({ u, o: taskOutcome(d, u.id, a) })).sort((x, y) => Number(y.o.done) - Number(x.o.done) || (y.o.ratio ?? 0) - (x.o.ratio ?? 0));
  return (
    <DialogContent title={a.title} description={`${d.classes.find((c) => c.id === a.classId)?.name} · ${rows.filter((r) => r.o.done).length}/${rows.length} em đã làm xong · hạn ${formatDate(a.dueAt, true)}`}>
      <ul className="max-h-[60vh] divide-y divide-line overflow-y-auto text-sm">
        {rows.map(({ u, o }) => (
          <li key={u.id} className="flex items-center gap-3 py-2">
            <span className="min-w-0 flex-1 truncate text-fg">{u.name}</span>
            {o.text ? <span className={cn("rounded-md px-2 py-0.5 text-xs font-semibold", (o.ratio ?? 0) >= 0.8 ? "bg-success/15 text-success-fg" : (o.ratio ?? 0) >= 0.5 ? "bg-warning/15 text-warning-fg" : "bg-danger/15 text-danger-fg")}>{o.text}</span> : <span className="text-xs text-muted">chưa làm</span>}
            {o.at && <span className="w-24 shrink-0 text-right text-xs text-muted">{formatDate(o.at, true)}</span>}
          </li>
        ))}
      </ul>
    </DialogContent>
  );
}

/** Xem nhiệm vụ như học sinh sẽ thấy (giáo viên làm thử không bị ghi điểm). */
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

export default function AssignmentsPage() {
  const { d, user } = useSessionData();
  const classes = teacherClasses(d, user.id);
  const [classId, setClassId] = useState("");
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<Bucket | null>(null);
  const [editing, setEditing] = useState<{ id: string; dueAt: string; hintMode: HintMode } | null>(null);
  const [creating, setCreating] = useState(false);
  const [dialog, setDialog] = useState<{ kind: "results" | "preview"; a: Assignment } | null>(null);
  const [remedial, setRemedial] = useState<{ a: Assignment; studentIds: string[] } | null>(null);
  const [now] = useState(() => Date.now());

  const all = useMemo(() => teacherAssignments(d, user.id).filter((a) => !classId || a.classId === classId), [d, user.id, classId]);
  const stats = useMemo(() => {
    const m = new Map<string, Stat>();
    for (const a of all) {
      const students = assignedStudents(d, a);
      if (a.task) {
        const outs = students.map((u) => ({ u, o: taskOutcome(d, u.id, a) }));
        m.set(a.id, { target: students.length, done: outs.filter((x) => x.o.done).length, working: outs.filter((x) => !x.o.done && x.o.text).length, pending: 0, graded: 0, weak: outs.filter((x) => !x.o.done || (x.o.ratio ?? 1) < 0.65).map((x) => x.u.id) });
      } else {
        const subs = d.submissions.filter((s) => s.assignmentId === a.id);
        const graded = subs.filter((s) => s.status === "graded");
        m.set(a.id, { target: students.length, done: subs.length, working: d.attempts.filter((x) => x.assignmentId === a.id && x.status !== "submitted").length, pending: subs.length - graded.length, graded: graded.length, weak: students.filter((u) => !subs.some((s) => s.studentId === u.id) || subs.some((s) => s.studentId === u.id && s.testResults.some((r) => !r.pass))).map((u) => u.id) });
      }
    }
    return m;
  }, [d, all]);
  const bucketOf = (a: Assignment): Bucket => (a.status === "draft" ? "draft" : stats.get(a.id)!.pending > 0 ? "grading" : a.status === "open" && new Date(a.dueAt).getTime() > now ? "ongoing" : "ended");
  const counts = Object.fromEntries(BUCKETS.map((b) => [b.id, all.filter((a) => bucketOf(a) === b.id).length])) as Record<Bucket, number>;
  const active: Bucket = tab ?? (counts.grading ? "grading" : "ongoing");
  const shown = all.filter((a) => bucketOf(a) === active && matchesQuery(q, a.title)).sort((x, y) => x.dueAt.localeCompare(y.dueAt));

  return (
    <>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-fg">Bài tập & Đánh giá</h1>
          <p className="mt-1 text-muted">Nhiệm vụ giao từ bài học: máy chấm mô phỏng, câu hỏi, code; thầy cô chấm phần theo tiêu chí.</p>
        </div>
        <Button onClick={() => setCreating(true)}><Plus /> Giao nhiệm vụ</Button>
      </div>
      <AssessTabs />
      <LabReviewQueue />

      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center">
        <div className="flex gap-1 overflow-x-auto rounded-xl border border-line bg-surface p-1" role="tablist" aria-label="Trạng thái nhiệm vụ">
          {BUCKETS.map((b) => (
            <button key={b.id} type="button" role="tab" aria-selected={active === b.id} onClick={() => setTab(b.id)} className={cn("shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium", active === b.id ? "bg-fg text-bg" : "text-muted hover:text-fg")}>
              {b.label} <span className={cn("ml-1 rounded-full px-1.5 text-xs", active === b.id ? "bg-bg/20" : b.id === "grading" && counts.grading ? "bg-violet/15 text-violet-fg" : "bg-surface-2")}>{counts[b.id]}</span>
            </button>
          ))}
        </div>
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">Tìm nhiệm vụ</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
          <Input className="pl-9" placeholder="Tìm nhiệm vụ…" value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
        <Select aria-label="Lọc lớp" className="w-36" value={classId} onChange={(e) => setClassId(e.target.value)}>
          <option value="">Mọi lớp</option>
          {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </Select>
      </div>

      {shown.length === 0 ? <EmptyState icon={ListChecks} title={BUCKETS.find((b) => b.id === active)!.empty} action={<Button size="sm" onClick={() => setCreating(true)}><Plus /> Giao nhiệm vụ</Button>} /> : (
        <ul className="divide-y divide-line rounded-2xl border border-line bg-surface">
          {shown.map((a) => {
            const s = stats.get(a.id)!;
            const act = d.activities.find((x) => x.id === a.activityId);
            const cfg = act?.labConfigId ? d.labConfigs.find((x) => x.id === act.labConfigId) : undefined;
            const labSlug = a.task?.kind === "lab" ? a.task.ref : cfg ? LAB_TEMPLATES.find((l) => l.id === cfg.labTemplateId)?.slug : undefined;
            const e = a.sgkRef ? bookEntry(a.sgkRef) : undefined;
            const klass = d.classes.find((x) => x.id === a.classId);
            const open = a.status === "open";
            const late = open && new Date(a.dueAt).getTime() < now;
            return (
              <li key={a.id} className="flex flex-wrap items-center gap-4 p-4">
                {labSlug ? <LabArt slug={labSlug} className="hidden h-14 w-24 shrink-0 rounded-lg sm:block" /> : <span className="hidden h-14 w-24 shrink-0 place-items-center rounded-lg bg-surface-2 text-muted sm:grid">{a.task?.kind === "code" ? "</>" : <ListChecks className="size-5" aria-hidden />}</span>}
                <div className="min-w-0 flex-1 basis-64">
                  <p className="text-xs text-muted"><span className="mr-1.5 rounded bg-fg px-1.5 py-0.5 font-bold text-bg">{klass?.name}</span>{a.studentIds ? `giao riêng ${a.studentIds.length} em · ` : ""}{e ? <span className="inline-flex items-center gap-1"><BookOpen className="size-3" aria-hidden /> Bài {e.lesson.no}. {e.lesson.title}</span> : null}</p>
                  <p className="mt-0.5 font-semibold text-fg">{a.title}</p>
                  <p className="text-xs text-muted">
                    <span className={cn("mr-1 rounded px-1.5 py-0.5 font-medium", a.task ? "bg-cyan/15 text-cyan-fg" : "bg-violet/15 text-violet-fg")}>{a.task ? "Máy chấm" : "Thầy cô chấm"}</span>
                    {a.task ? TASK_LABEL[a.task.kind] : [cfg && MODE_LABEL[cfg.mode], HINT_LABEL[a.hintMode]].filter(Boolean).join(" · ")}
                    {a.note && <span className="italic"> · “{a.note}”</span>}
                  </p>
                  <p className={cn("mt-1 inline-flex items-center gap-1 text-xs", late ? "font-semibold text-danger-fg" : "text-muted")}><CalendarClock className="size-3.5" aria-hidden /> Hạn {formatDate(a.dueAt, true)} · {relativeDays(a.dueAt)}{a.status === "closed" ? " · đã đóng" : ""}</p>
                </div>
                {a.status !== "draft" && (
                  <div className="w-52 space-y-1.5 text-xs">
                    <div><div className="mb-0.5 flex justify-between"><span className="text-fg"><b>{s.done}</b>/{s.target} {a.task ? "làm xong" : "đã nộp"}</span>{s.working > 0 && <span className="text-muted">{s.working} đang làm</span>}</div><div className="h-1.5 rounded-full bg-surface-2"><div className="h-full rounded-full bg-success" style={{ width: `${(s.done / Math.max(1, s.target)) * 100}%` }} /></div></div>
                    {!a.task && s.done > 0 && <div><div className="mb-0.5 flex justify-between"><span className="text-fg"><b>{s.graded}</b>/{s.done} đã chấm</span>{s.pending > 0 && <span className="font-semibold text-violet-fg">{s.pending} chờ chấm</span>}</div><div className="h-1.5 rounded-full bg-surface-2"><div className="h-full rounded-full bg-violet" style={{ width: `${(s.graded / Math.max(1, s.done)) * 100}%` }} /></div></div>}
                  </div>
                )}
                <div className="flex flex-wrap items-center gap-1">
                  {a.status === "draft" ? (
                    <Button size="sm" onClick={() => { d.updateAssignment(a.id, { status: "open", publishedAt: new Date().toISOString() }); toast.success(`Đã giao “${a.title}” cho ${klass?.name}`); }}><Send /> Giao ngay</Button>
                  ) : a.task ? (
                    <Button size="sm" variant="secondary" onClick={() => setDialog({ kind: "results", a })}>Kết quả</Button>
                  ) : (
                    <Button size="sm" variant={s.pending ? "primary" : "secondary"} asChild><Link href={`/teacher/assessment?assignment=${a.id}`}>{s.pending ? `Chấm ${s.pending} bài` : "Xem bài đã chấm"}</Link></Button>
                  )}
                  {a.status !== "draft" && s.weak.length > 0 && (active === "ended" || s.done > 0) && <Button size="sm" variant="ghost" title="Giao lại cho các em chưa làm hoặc làm chưa đạt" onClick={() => setRemedial({ a, studentIds: s.weak })}><RotateCcw /> Củng cố {s.weak.length} em</Button>}
                  <Button size="icon" variant="ghost" aria-label={`Xem như học sinh: ${a.title}`} title="Xem như học sinh" onClick={() => setDialog({ kind: "preview", a })}><Eye /></Button>
                  <Button size="icon" variant="ghost" aria-label={`Sửa ${a.title}`} title="Sửa hạn nộp, gợi ý" onClick={() => setEditing({ id: a.id, dueAt: toLocal(a.dueAt), hintMode: a.hintMode })}><Pencil /></Button>
                  {a.status !== "draft" && <Button size="icon" variant="ghost" aria-label={open ? `Đóng nhận bài ${a.title}` : `Mở lại ${a.title}`} title={open ? "Đóng nhận bài" : "Mở lại"} onClick={() => { d.updateAssignment(a.id, { status: open ? "closed" : "open" }); toast.success(open ? "Đã đóng nhận bài" : "Đã mở lại"); }}>{open ? <Lock /> : <LockOpen />}</Button>}
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <p className="mt-3 flex items-center gap-1.5 text-xs text-muted"><ClipboardCheck className="size-3.5" aria-hidden /> Máy chấm: mô phỏng (10 điểm, trừ 0,5 mỗi lần chọn sai), bộ câu hỏi (số câu đúng), code (số test đạt). Thầy cô chấm: hoạt động tự thiết kế theo tiêu chí.</p>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        {editing && (
          <DialogContent title="Sửa nhiệm vụ">
            <div className="space-y-3">
              <Field label="Hạn nộp" htmlFor="ed-due"><Input id="ed-due" type="datetime-local" value={editing.dueAt} onChange={(e) => setEditing({ ...editing, dueAt: e.target.value })} /></Field>
              <Field label="Chế độ gợi ý" htmlFor="ed-hint"><Select id="ed-hint" value={editing.hintMode} onChange={(e) => setEditing({ ...editing, hintMode: e.target.value as HintMode })}>{Object.entries(HINT_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</Select></Field>
              <Button className="w-full" onClick={() => { const t = new Date(editing.dueAt).getTime(); if (Number.isNaN(t)) return toast.error("Ngày không hợp lệ"); d.updateAssignment(editing.id, { dueAt: new Date(t).toISOString(), hintMode: editing.hintMode }); setEditing(null); toast.success("Đã lưu"); }}>Lưu</Button>
            </div>
          </DialogContent>
        )}
      </Dialog>
      <AssignDialog open={creating} onOpenChange={setCreating} />
      <AssignDialog
        open={!!remedial}
        onOpenChange={(o) => !o && setRemedial(null)}
        title="Giao lại bài củng cố"
        classId={remedial?.a.classId}
        studentIds={remedial?.studentIds}
        sgkRef={remedial?.a.sgkRef}
        preset={remedial?.a.task ? { kind: remedial.a.task.kind, ref: remedial.a.task.ref } : undefined}
        suggest={remedial?.a.sgkRef && bookEntry(remedial.a.sgkRef) ? lessonAssignables(d, user.id, bookEntry(remedial.a.sgkRef)!) : undefined}
      />
      <Dialog open={!!dialog} onOpenChange={(o) => !o && setDialog(null)}>
        {dialog?.kind === "results" && <TaskResults a={dialog.a} />}
        {dialog?.kind === "preview" && <Preview a={dialog.a} />}
      </Dialog>
    </>
  );
}
