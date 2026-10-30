"use client";
/**
 * Đã giao, chia theo lớp: chọn một lớp ở thanh trên (mỗi lớp có số bài và số bài chờ chấm), hoặc "Tất cả lớp" để xem
 * từng lớp thành một nhóm. Mỗi dòng: tên, nguồn, tiến độ nộp, hạn; mở dòng để xem chi tiết.
 */
import Link from "next/link";
import { useMemo, useState } from "react";
import { ListChecks, Lock, LockOpen, Plus, Search, Send } from "lucide-react";
import { toast } from "sonner";
import type { Assignment } from "@/lib/domain/types";
import { teacherAssignments, teacherClasses } from "@/lib/store/scoped";
import { useSessionData } from "@/lib/store/use-role";
import { assignmentCourse, assignmentStats } from "@/lib/teacher/assign";
import { cn, formatDate, matchesQuery } from "@/lib/utils";
import { EmptyState } from "@/components/ui/feedback";
import { Input, Select } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { AssignDialog } from "@/components/teacher/assign-dialog";
import { useQueryState } from "@/lib/use-query-state";
import { AssessHeader, MenuItem, RowMenu } from "@/components/teacher/assess-tabs";

type Bucket = "" | "ongoing" | "overdue" | "closed" | "draft";
const BUCKETS: { id: Bucket; label: string }[] = [
  { id: "", label: "Tất cả" },
  { id: "ongoing", label: "Còn hạn" },
  { id: "overdue", label: "Quá hạn" },
  { id: "closed", label: "Đã đóng" },
  { id: "draft", label: "Chưa giao" },
];

export default function AssignmentsPage() {
  const { d, user } = useSessionData();
  const classes = teacherClasses(d, user.id);
  const [classId, setClassId] = useQueryState("lop");
  const [assigning, setAssigning] = useState(false);
  const [q, setQ] = useState("");
  const [bucket, setBucket] = useState<Bucket>("");
  const [now] = useState(() => Date.now());

  const all = useMemo(() => teacherAssignments(d, user.id).map((a) => ({ a, s: assignmentStats(d, a), src: assignmentCourse(d, a) })), [d, user.id]);
  const rows = all.filter((r) => !classId || r.a.classId === classId);
  const bucketOf = (a: Assignment): Bucket => (a.status === "draft" ? "draft" : a.status === "closed" ? "closed" : new Date(a.dueAt).getTime() > now ? "ongoing" : "overdue");
  const shown = rows
    .filter(({ a }) => (!bucket || bucketOf(a) === bucket) && matchesQuery(q, a.title))
    .sort((x, y) => Number(bucketOf(x.a) === "draft") - Number(bucketOf(y.a) === "draft") || y.a.dueAt.localeCompare(x.a.dueAt));

  const groups = classId
    ? [{ cls: classes.find((c) => c.id === classId), list: shown }]
    : classes.map((c) => ({ cls: c as (typeof classes)[number] | undefined, list: shown.filter((r) => r.a.classId === c.id) })).filter((g) => g.list.length);

  return (
    <>
      <AssessHeader subtitle="Bài đã giao theo từng lớp: theo dõi hạn nộp, mở chi tiết để xem bài nộp và kết quả từng em" actions={<Button onClick={() => setAssigning(true)}><Plus /> Giao bài{classId ? ` cho ${classes.find((c) => c.id === classId)?.name ?? ""}` : ""}</Button>} />
      <div role="tablist" aria-label="Lớp" className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {[{ id: "", name: "Tất cả lớp" }, ...classes].map((c) => {
          const list = all.filter((r) => !c.id || r.a.classId === c.id);
          const pending = list.reduce((n, r) => n + r.s.pending, 0);
          const on = classId === c.id;
          return (
            <button key={c.id || "all"} type="button" role="tab" aria-selected={on} onClick={() => setClassId(c.id)} className={cn("flex shrink-0 items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-semibold transition-colors", on ? "border-brand bg-brand text-brand-ink" : "border-line bg-surface text-fg hover:border-brand/40")}>
              {c.name}
              <span className={cn("rounded-full px-1.5 text-xs tabular-nums", on ? "bg-white/25" : "bg-surface-2 text-muted")}>{list.length}</span>
              {pending > 0 && <span className={cn("rounded-full px-1.5 text-xs font-bold", on ? "bg-white text-blue-fg" : "bg-warning/20 text-warning-fg")} title="Bài chờ chấm">{pending} chờ chấm</span>}
            </button>
          );
        })}
      </div>
      <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center">
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">Tìm bài</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
          <Input className="pl-9" placeholder="Tìm bài tập…" value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
        <Select aria-label="Trạng thái" className="md:w-44" value={bucket} onChange={(e) => setBucket(e.target.value as Bucket)}>
          {BUCKETS.map((b) => <option key={b.id} value={b.id}>{b.label} ({b.id ? rows.filter((r) => bucketOf(r.a) === b.id).length : rows.length})</option>)}
        </Select>
      </div>

      {shown.length === 0 ? <EmptyState icon={ListChecks} title="Không có bài nào" description="Bấm “Giao bài”, hoặc mở một bài trong Khóa học rồi bấm “Giao cho lớp”." action={<Button onClick={() => setAssigning(true)}><Plus /> Giao bài</Button>} /> : (
        <div className="space-y-6">
          {groups.map(({ cls, list }) => (
            <section key={cls?.id ?? "x"} aria-label={cls ? `Lớp ${cls.name}` : "Lớp khác"}>
              {!classId && (
                <div className="mb-2 flex items-baseline justify-between gap-2">
                  <h2 className="text-lg font-bold text-fg">{cls ? `Lớp ${cls.name}` : "Lớp khác"} <span className="text-sm font-normal text-muted">· {list.length} bài</span></h2>
                  {cls && <button type="button" onClick={() => setClassId(cls.id)} className="text-sm font-medium text-blue-fg hover:underline">Chỉ xem lớp này</button>}
                </div>
              )}
              <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
                <table className="w-full min-w-[640px] text-sm">
                  <thead>
                    <tr className="border-b border-line text-left text-xs font-semibold uppercase tracking-wide text-muted">
                      <th scope="col" className="px-4 py-3">Bài tập</th>
                      <th scope="col" className="px-3 py-3">Lớp</th>
                      <th scope="col" className="px-3 py-3">Đã nộp</th>
                      <th scope="col" className="px-3 py-3">Hạn</th>
                      <th scope="col" className="w-10 px-2 py-3"><span className="sr-only">Thao tác</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.map(({ a, s, src }) => {
                      const b = bucketOf(a);
                      const klass = d.classes.find((c) => c.id === a.classId);
                      const state = b === "draft" ? "Chưa giao" : a.task ? "Máy chấm" : s.pending ? `${s.pending} cần chấm` : s.done ? "Đã chấm" : "Thầy cô chấm";
                      return (
                        <tr key={a.id} className="border-b border-line/60 last:border-0 hover:bg-surface-2/50">
                          <td className="px-4 py-3">
                            <Link href={`/teacher/assignments/${a.id}`} className="font-semibold text-fg hover:underline">{a.title}</Link>
                            <p className="text-xs text-muted">{src ? src.course.title : "Độc lập"} · <span className={cn(s.pending > 0 && "font-semibold text-violet-fg", b === "draft" && "font-semibold text-warning-fg")}>{state}</span></p>
                          </td>
                          <td className="px-3 py-3 font-medium text-fg">{klass?.name}{a.studentIds && <span className="block text-xs font-normal text-muted">{a.studentIds.length} em</span>}</td>
                          <td className="px-3 py-3">
                            {b === "draft" ? <span className="text-muted">–</span> : (
                              <div className="flex items-center gap-2"><span className="w-10 tabular-nums text-fg">{s.done}/{s.target}</span><span className="h-1.5 w-16 rounded-full bg-surface-2"><span className="block h-full rounded-full bg-success" style={{ width: `${(s.done / Math.max(1, s.target)) * 100}%` }} /></span></div>
                            )}
                          </td>
                          <td className={cn("px-3 py-3 tabular-nums", b === "overdue" ? "font-semibold text-danger-fg" : "text-fg")}>{formatDate(a.dueAt)}{b === "closed" && <span className="block text-xs font-normal text-muted">đã đóng</span>}</td>
                          <td className="px-2 py-3">
                            <RowMenu label={`Thao tác: ${a.title}`}>
                              <MenuItem href={`/teacher/assignments/${a.id}`}>Mở chi tiết</MenuItem>
                              {s.pending > 0 && <MenuItem href={`/teacher/assessment?assignment=${a.id}`}>Chấm {s.pending} bài</MenuItem>}
                              {b === "draft"
                                ? <MenuItem onClick={() => { d.updateAssignment(a.id, { status: "open", publishedAt: new Date().toISOString() }); toast.success(`Đã giao cho ${klass?.name}`); }}><Send /> Giao ngay</MenuItem>
                                : <MenuItem onClick={() => { d.updateAssignment(a.id, { status: a.status === "open" ? "closed" : "open" }); toast.success(a.status === "open" ? "Đã đóng nhận bài" : "Đã mở lại"); }}>{a.status === "open" ? <><Lock /> Đóng nhận bài</> : <><LockOpen /> Mở lại</>}</MenuItem>}
                            </RowMenu>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
        </div>
      )}
      <AssignDialog open={assigning} onOpenChange={setAssigning} classId={classId || undefined} />
    </>
  );
}
