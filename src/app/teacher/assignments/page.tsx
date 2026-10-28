"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { CalendarClock, ClipboardCheck, ListChecks, Lock, LockOpen, Pencil, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { teacherAssignments, teacherClasses, assignedStudents } from "@/lib/store/scoped";
import { useSessionData } from "@/lib/store/use-role";
import { cn, formatDate, isFutureBy, matchesQuery, relativeDays } from "@/lib/utils";
import { LAB_TEMPLATES } from "@/lib/data/labs";
import { LabArt } from "@/components/labs/lab-art";
import { HINT_LABEL, MODE_LABEL } from "@/lib/labels";
import type { HintMode } from "@/lib/domain/types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { EmptyState, Progress } from "@/components/ui/feedback";
import { Field, Input, Select } from "@/components/ui/form";
import { SectionHead } from "@/components/layout/section-head";
import { AssessTabs } from "@/components/teacher/assess-tabs";
import { AssignDialog } from "@/components/teacher/assign-dialog";
import { taskOutcome } from "@/lib/teacher/assign";

const TASK_LABEL = { lab: "Mô phỏng", quiz: "Bộ câu hỏi", code: "Bài code" } as const;

/** Kết quả từng em của một nhiệm vụ máy chấm: ai xong, được bao nhiêu, ai chưa làm. */
function TaskResults({ assignmentId }: { assignmentId: string }) {
  const { d } = useSessionData();
  const a = d.assignments.find((x) => x.id === assignmentId)!;
  const rows = assignedStudents(d, a).map((u) => ({ u, o: taskOutcome(d, u.id, a) })).sort((x, y) => Number(y.o.done) - Number(x.o.done) || (y.o.ratio ?? 0) - (x.o.ratio ?? 0));
  const done = rows.filter((r) => r.o.done);
  return (
    <DialogContent title={a.title} description={`${d.classes.find((c) => c.id === a.classId)?.name} · ${done.length}/${rows.length} em đã làm xong · hạn ${formatDate(a.dueAt, true)}`}>
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

const HINT: Record<HintMode, string> = HINT_LABEL;
const toLocal = (iso: string) => { const d = new Date(iso); return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16); };

export default function AssignmentsPage() {
  const { d, user } = useSessionData();
  const classes = teacherClasses(d, user.id);
  const [classId, setClassId] = useState("");
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<{ id: string; dueAt: string; hintMode: HintMode } | null>(null);
  const [creating, setCreating] = useState(false);
  const [viewing, setViewing] = useState<string | null>(null);

  const list = useMemo(() => teacherAssignments(d, user.id).filter((a) => (!classId || a.classId === classId) && (!status || a.status === status)), [d, user.id, classId, status]);

  const counts = useMemo(() => {
    const m = new Map<string, { total: number; subs: number; graded: number; working: number }>();
    for (const a of list) {
      const total = d.enrollments.filter((e) => e.classId === a.classId).length;
      if (a.task) {
        const outs = assignedStudents(d, a).map((u) => taskOutcome(d, u.id, a));
        m.set(a.id, { total, subs: outs.filter((o) => o.done).length, graded: outs.filter((o) => o.done).length, working: outs.filter((o) => !o.done && o.text).length });
        continue;
      }
      const subs = d.submissions.filter((s) => s.assignmentId === a.id);
      m.set(a.id, {
        total,
        subs: subs.length,
        graded: subs.filter((s) => s.status === "graded").length,
        working: d.attempts.filter((x) => x.assignmentId === a.id && x.status !== "submitted").length,
      });
    }
    return m;
  }, [d, list]);
  const shown = list.filter((a) => matchesQuery(q, a.title));

  return (
    <>
      <SectionHead
        icon={ClipboardCheck}
        title="Bài tập & Đánh giá"
        subtitle="Giao nhiệm vụ cho lớp, theo dõi bài nộp và chấm theo tiêu chí."
        actions={<Button onClick={() => setCreating(true)}><Plus /> Giao nhiệm vụ</Button>}
      />
      <AssessTabs />
      <div className="mb-5 rounded-2xl border border-line bg-surface p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <label className="relative min-w-0 flex-1">
            <span className="sr-only">Tìm nhiệm vụ</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
            <Input className="pl-9" placeholder="Tìm nhiệm vụ…" value={q} onChange={(e) => setQ(e.target.value)} />
          </label>
          <div className="flex gap-2">
            <Select aria-label="Lọc lớp" className="w-36" value={classId} onChange={(e) => setClassId(e.target.value)}>
              <option value="">Mọi lớp</option>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
            <Select aria-label="Lọc trạng thái" className="w-40" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">Mọi trạng thái</option>
              <option value="open">Đang mở</option>
              <option value="closed">Đã đóng</option>
            </Select>
          </div>
        </div>
        <p className="mt-3 text-sm text-muted" aria-live="polite">Tìm thấy {shown.length} nhiệm vụ</p>
      </div>
      {shown.length === 0 ? <EmptyState icon={ListChecks} title="Không có nhiệm vụ phù hợp" action={<Button size="sm" onClick={() => setCreating(true)}><Plus /> Giao nhiệm vụ</Button>} /> : (
        <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {shown.map((a) => {
            const c = counts.get(a.id)!;
            const pendingGrade = c.subs - c.graded;
            const act = d.activities.find((x) => x.id === a.activityId);
            const cfg = act?.labConfigId ? d.labConfigs.find((x) => x.id === act.labConfigId) : undefined;
            const lab = cfg && LAB_TEMPLATES.find((l) => l.id === cfg.labTemplateId);
            const klass = d.classes.find((x) => x.id === a.classId);
            const open = a.status === "open";
            return (
              <li key={a.id} className="flex flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-[0_10px_40px_-18px_var(--cyan)]">
                <div className="relative aspect-[16/8] overflow-hidden bg-surface-2">
                  {a.task?.kind === "lab" ? <LabArt slug={a.task.ref} className={cn("size-full", !open && "opacity-60 grayscale")} /> : lab ? <LabArt slug={lab.slug} className={cn("size-full", !open && "opacity-60 grayscale")} /> : <div className="grid size-full place-items-center bg-gradient-to-br from-cyan/20 to-violet/20"><ListChecks className="size-10 text-cyan-fg" aria-hidden /></div>}
                  <span className="absolute left-3 top-3 rounded-full bg-surface/90 px-2.5 py-0.5 text-xs font-bold text-fg shadow-sm">{klass?.name}</span>
                  <span className={cn("absolute right-3 top-3 rounded-full px-2.5 py-0.5 text-xs font-semibold shadow-sm", open ? "bg-success text-white" : "bg-surface/90 text-muted")}>{open ? "Đang mở" : "Đã đóng"}</span>
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <p className="font-semibold leading-snug text-fg">{a.title}</p>
                  <p className="mt-1 text-xs text-muted">{a.task ? [TASK_LABEL[a.task.kind], "máy chấm", a.hintMode === "off" ? "không dùng gia sư" : "có gia sư"].join(" · ") : [cfg && MODE_LABEL[cfg.mode], HINT[a.hintMode]].filter(Boolean).join(" · ")}</p>
                  {a.note && <p className="mt-1 line-clamp-2 text-xs italic text-fg">“{a.note}”</p>}
                  <p className={cn("mt-2 inline-flex w-fit items-center gap-1 rounded-lg px-2 py-0.5 text-xs font-medium", open && isFutureBy(a.dueAt, 0) ? "bg-warning/15 text-warning-fg" : "bg-surface-2 text-muted")}>
                    <CalendarClock className="size-3.5" aria-hidden /> Hạn {formatDate(a.dueAt, true)} · {relativeDays(a.dueAt)}
                  </p>
                  <div className="mt-3">
                    <div className="mb-1 flex justify-between text-xs"><span className="text-fg"><b>{c.subs}</b>/{c.total} {a.task ? "đã làm xong" : "đã nộp"}</span><span className="text-muted">{c.working} đang làm</span></div>
                    <Progress value={(c.subs / Math.max(1, c.total)) * 100} label={`Tiến độ ${a.title}`} />
                  </div>
                  <div className="mt-auto flex items-center gap-1 pt-4">
                    {a.task ? (
                      <Button size="sm" className="flex-1" variant="secondary" onClick={() => setViewing(a.id)}>Xem kết quả từng em</Button>
                    ) : (
                      <Button size="sm" className="flex-1" variant={pendingGrade ? "primary" : "secondary"} asChild>
                        <Link href={`/teacher/assessment?assignment=${a.id}`}>{pendingGrade ? `Chấm ${pendingGrade} bài` : "Xem bài đã chấm"}</Link>
                      </Button>
                    )}
                    <Button size="icon" variant="ghost" aria-label={`Sửa ${a.title}`} title="Sửa hạn nộp, gợi ý" onClick={() => setEditing({ id: a.id, dueAt: toLocal(a.dueAt), hintMode: a.hintMode })}><Pencil /></Button>
                    <Button size="icon" variant="ghost" aria-label={open ? `Đóng nhận bài ${a.title}` : `Mở lại ${a.title}`} title={open ? "Đóng nhận bài" : "Mở lại"} onClick={() => { d.updateAssignment(a.id, { status: open ? "closed" : "open" }); toast.success(open ? "Đã đóng nhận bài" : "Đã mở lại"); }}>{open ? <Lock /> : <LockOpen />}</Button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        {editing && (
          <DialogContent title="Sửa nhiệm vụ">
            <div className="space-y-3">
              <Field label="Hạn nộp" htmlFor="ed-due"><Input id="ed-due" type="datetime-local" value={editing.dueAt} onChange={(e) => setEditing({ ...editing, dueAt: e.target.value })} /></Field>
              <Field label="Chế độ gợi ý" htmlFor="ed-hint"><Select id="ed-hint" value={editing.hintMode} onChange={(e) => setEditing({ ...editing, hintMode: e.target.value as HintMode })}>{Object.entries(HINT).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</Select></Field>
              <Button className="w-full" onClick={() => { const t = new Date(editing.dueAt).getTime(); if (Number.isNaN(t)) return toast.error("Ngày không hợp lệ"); d.updateAssignment(editing.id, { dueAt: new Date(t).toISOString(), hintMode: editing.hintMode }); setEditing(null); toast.success("Đã lưu"); }}>Lưu</Button>
            </div>
          </DialogContent>
        )}
      </Dialog>
      <AssignDialog open={creating} onOpenChange={setCreating} />
      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        {viewing && <TaskResults assignmentId={viewing} />}
      </Dialog>
    </>
  );
}
