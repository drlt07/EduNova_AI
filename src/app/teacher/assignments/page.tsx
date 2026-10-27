"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { CalendarClock, ClipboardCheck, ListChecks, Lock, LockOpen, Pencil, Plus, Search, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { teacherAssignments, teacherClasses } from "@/lib/store/scoped";
import { useSessionData } from "@/lib/store/use-role";
import { cn, formatDate, isFutureBy, localDateTimeFromNow, matchesQuery, relativeDays } from "@/lib/utils";
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
  const activities = d.activities.filter((a) => a.ownerId === user.id && a.status === "published");
  const [form, setForm] = useState(() => ({ activityId: activities[0]?.id ?? "", classId: classes[0]?.id ?? "", dueAt: localDateTimeFromNow(5), hintMode: "guided" as HintMode }));

  const list = useMemo(() => teacherAssignments(d, user.id).filter((a) => (!classId || a.classId === classId) && (!status || a.status === status)), [d, user.id, classId, status]);

  function create() {
    const act = activities.find((a) => a.id === form.activityId);
    if (!act) return toast.error("Chọn hoạt động");
    if (!classes.some((c) => c.id === form.classId)) return toast.error("Chọn lớp của bạn");
    if (!isFutureBy(form.dueAt)) return toast.error("Hạn nộp phải sau hiện tại ít nhất 1 giờ");
    if (d.assignments.some((a) => a.activityId === act.id && a.classId === form.classId)) return toast.error("Hoạt động này đã được giao cho lớp đó");
    const cfg = d.labConfigs.find((c) => c.id === act.labConfigId);
    if (cfg?.mode === "assessment" && form.hintMode !== "off") return toast.error("Hoạt động ở chế độ Kiểm tra phải chọn Không gợi ý");
    d.createAssignment({ ownerId: user.id, activityId: act.id, classId: form.classId, title: act.title, dueAt: new Date(form.dueAt).toISOString(), hintMode: form.hintMode });
    setCreating(false);
    toast.success("Đã giao nhiệm vụ");
  }

  const counts = useMemo(() => {
    const m = new Map<string, { total: number; subs: number; graded: number; working: number }>();
    for (const a of list) {
      const subs = d.submissions.filter((s) => s.assignmentId === a.id);
      m.set(a.id, {
        total: d.enrollments.filter((e) => e.classId === a.classId).length,
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
        actions={activities.length ? <Button onClick={() => setCreating(true)}><Plus /> Giao bài</Button> : <Button asChild><Link href="/teacher/activity-builder"><Wand2 /> Tạo hoạt động đầu tiên</Link></Button>}
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
      {shown.length === 0 ? <EmptyState icon={ListChecks} title="Không có nhiệm vụ phù hợp" action={<Button asChild size="sm"><Link href="/teacher/activity-builder">Tạo hoạt động</Link></Button>} /> : (
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
                  {lab ? <LabArt slug={lab.slug} className={cn("size-full", !open && "opacity-60 grayscale")} /> : <div className="grid size-full place-items-center bg-gradient-to-br from-cyan/20 to-violet/20"><ListChecks className="size-10 text-cyan-fg" aria-hidden /></div>}
                  <span className="absolute left-3 top-3 rounded-full bg-surface/90 px-2.5 py-0.5 text-xs font-bold text-fg shadow-sm">{klass?.name}</span>
                  <span className={cn("absolute right-3 top-3 rounded-full px-2.5 py-0.5 text-xs font-semibold shadow-sm", open ? "bg-success text-white" : "bg-surface/90 text-muted")}>{open ? "Đang mở" : "Đã đóng"}</span>
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <p className="font-semibold leading-snug text-fg">{a.title}</p>
                  <p className="mt-1 text-xs text-muted">{[cfg && MODE_LABEL[cfg.mode], HINT[a.hintMode]].filter(Boolean).join(" · ")}</p>
                  <p className={cn("mt-2 inline-flex w-fit items-center gap-1 rounded-lg px-2 py-0.5 text-xs font-medium", open && isFutureBy(a.dueAt, 0) ? "bg-warning/15 text-warning-fg" : "bg-surface-2 text-muted")}>
                    <CalendarClock className="size-3.5" aria-hidden /> Hạn {formatDate(a.dueAt, true)} · {relativeDays(a.dueAt)}
                  </p>
                  <div className="mt-3">
                    <div className="mb-1 flex justify-between text-xs"><span className="text-fg"><b>{c.subs}</b>/{c.total} đã nộp</span><span className="text-muted">{c.working} đang làm</span></div>
                    <Progress value={(c.subs / Math.max(1, c.total)) * 100} label={`Tiến độ ${a.title}`} />
                  </div>
                  <div className="mt-auto flex items-center gap-1 pt-4">
                    <Button size="sm" className="flex-1" variant={pendingGrade ? "primary" : "secondary"} asChild>
                      <Link href={`/teacher/assessment?assignment=${a.id}`}>{pendingGrade ? `Chấm ${pendingGrade} bài` : "Xem bài đã chấm"}</Link>
                    </Button>
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
      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent title="Giao bài" description="Chọn hoạt động đã có (kèm tiêu chí chấm), lớp và hạn nộp.">
          <div className="space-y-3">
            <Field label="Hoạt động" htmlFor="cr-act"><Select id="cr-act" value={form.activityId} onChange={(e) => setForm({ ...form, activityId: e.target.value })}>{activities.map((a) => <option key={a.id} value={a.id}>{a.title}</option>)}</Select></Field>
            <Field label="Lớp" htmlFor="cr-class"><Select id="cr-class" value={form.classId} onChange={(e) => setForm({ ...form, classId: e.target.value })}>{classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select></Field>
            <Field label="Hạn nộp" htmlFor="cr-due"><Input id="cr-due" type="datetime-local" value={form.dueAt} onChange={(e) => setForm({ ...form, dueAt: e.target.value })} /></Field>
            <Field label="Gợi ý" htmlFor="cr-hint"><Select id="cr-hint" value={form.hintMode} onChange={(e) => setForm({ ...form, hintMode: e.target.value as HintMode })}>{Object.entries(HINT).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</Select></Field>
            <Button className="w-full" onClick={create}>Giao</Button>
            <p className="text-center text-sm text-muted">Chưa có hoạt động phù hợp? <Link href="/teacher/activity-builder" className="font-medium text-cyan-fg hover:underline">Thiết kế hoạt động mới</Link></p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
