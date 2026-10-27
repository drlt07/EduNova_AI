"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { CalendarClock, ListChecks, Lock, LockOpen, Plus, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { teacherAssignments, teacherClasses } from "@/lib/store/scoped";
import { useSessionData } from "@/lib/store/use-role";
import { formatDate, isFutureBy, localDateTimeFromNow, relativeDays } from "@/lib/utils";
import { HINT_LABEL, MODE_LABEL } from "@/lib/labels";
import type { HintMode } from "@/lib/domain/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { EmptyState, Progress } from "@/components/ui/feedback";
import { Field, Input, Select } from "@/components/ui/form";
import { PageHeader } from "@/components/ui/misc";

const HINT: Record<HintMode, string> = HINT_LABEL;
const toLocal = (iso: string) => { const d = new Date(iso); return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16); };

export default function AssignmentsPage() {
  const { d, user } = useSessionData();
  const classes = teacherClasses(d, user.id);
  const [classId, setClassId] = useState("");
  const [status, setStatus] = useState("");
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

  return (
    <>
      <PageHeader
        title="Giao nhiệm vụ"
        description="Theo dõi tiến độ nộp bài, chỉnh hạn nộp và giao lại hoạt động cho lớp khác."
        actions={<>
          <Button variant="secondary" onClick={() => setCreating(true)} disabled={!activities.length}><Plus /> Giao hoạt động có sẵn</Button>
          <Button asChild><Link href="/teacher/activity-builder"><Wand2 /> Hoạt động mới</Link></Button>
        </>}
      />
      <div className="mb-4 flex flex-wrap gap-3">
        <Select aria-label="Lọc lớp" className="w-44" value={classId} onChange={(e) => setClassId(e.target.value)}>
          <option value="">Mọi lớp</option>
          {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </Select>
        <Select aria-label="Lọc trạng thái" className="w-44" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Mọi trạng thái</option>
          <option value="open">Đang mở</option>
          <option value="closed">Đã đóng</option>
        </Select>
      </div>
      {list.length === 0 ? <EmptyState icon={ListChecks} title="Không có nhiệm vụ phù hợp" action={<Button asChild size="sm"><Link href="/teacher/activity-builder">Tạo hoạt động</Link></Button>} /> : (
        <ul className="space-y-3">
          {list.map((a) => {
            const total = d.enrollments.filter((e) => e.classId === a.classId).length;
            const subs = d.submissions.filter((s) => s.assignmentId === a.id);
            const graded = subs.filter((s) => s.status === "graded").length;
            const inProgress = d.attempts.filter((x) => x.assignmentId === a.id && x.status !== "submitted").length;
            const act = d.activities.find((x) => x.id === a.activityId);
            const cfg = act?.labConfigId ? d.labConfigs.find((c) => c.id === act.labConfigId) : undefined;
            const rubric = act && d.rubrics.find((r) => r.id === act.rubricId);
            return (
              <li key={a.id} className="rounded-2xl border border-line bg-surface p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap gap-1.5">
                      <Badge tone="blue">{d.classes.find((c) => c.id === a.classId)?.name}</Badge>
                      <Badge tone={a.status === "open" ? "success" : "neutral"}>{a.status === "open" ? "Đang mở" : "Đã đóng"}</Badge>
                      {cfg && <Badge tone="cyan">{MODE_LABEL[cfg.mode]}</Badge>}
                      <Badge>{HINT[a.hintMode]}</Badge>
                      {rubric && <Badge tone="violet">{rubric.criteria.length} tiêu chí chấm</Badge>}
                    </div>
                    <p className="mt-2 font-semibold text-fg">{a.title}</p>
                    <p className="flex items-center gap-1 text-sm text-muted"><CalendarClock className="size-4" aria-hidden /> Hạn {formatDate(a.dueAt, true)} · {relativeDays(a.dueAt)}</p>
                  </div>
                  <div className="w-full lg:w-72">
                    <div className="mb-1 flex justify-between text-xs text-muted"><span>{subs.length}/{total} đã nộp · {inProgress} đang làm</span><span>{graded} đã chấm</span></div>
                    <Progress value={(subs.length / Math.max(1, total)) * 100} label={`Tiến độ ${a.title}`} />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="secondary" asChild><Link href={`/teacher/assessment?assignment=${a.id}`}>Chấm bài</Link></Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditing({ id: a.id, dueAt: toLocal(a.dueAt), hintMode: a.hintMode })}>Sửa</Button>
                    <Button size="sm" variant="ghost" onClick={() => { d.updateAssignment(a.id, { status: a.status === "open" ? "closed" : "open" }); toast.success(a.status === "open" ? "Đã đóng nhận bài" : "Đã mở lại"); }}>{a.status === "open" ? <><Lock /> Đóng</> : <><LockOpen /> Mở lại</>}</Button>
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
        <DialogContent title="Giao hoạt động có sẵn" description="Dùng lại hoạt động và tiêu chí chấm đã tạo.">
          <div className="space-y-3">
            <Field label="Hoạt động" htmlFor="cr-act"><Select id="cr-act" value={form.activityId} onChange={(e) => setForm({ ...form, activityId: e.target.value })}>{activities.map((a) => <option key={a.id} value={a.id}>{a.title}</option>)}</Select></Field>
            <Field label="Lớp" htmlFor="cr-class"><Select id="cr-class" value={form.classId} onChange={(e) => setForm({ ...form, classId: e.target.value })}>{classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select></Field>
            <Field label="Hạn nộp" htmlFor="cr-due"><Input id="cr-due" type="datetime-local" value={form.dueAt} onChange={(e) => setForm({ ...form, dueAt: e.target.value })} /></Field>
            <Field label="Gợi ý" htmlFor="cr-hint"><Select id="cr-hint" value={form.hintMode} onChange={(e) => setForm({ ...form, hintMode: e.target.value as HintMode })}>{Object.entries(HINT).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</Select></Field>
            <Button className="w-full" onClick={create}>Giao</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
