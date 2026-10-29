"use client";
/**
 * Đã giao: bảng mọi bài đã giao của các lớp (bài thuộc khóa học và bài độc lập). Mỗi dòng chỉ có tên, nguồn, lớp,
 * tiến độ nộp và hạn; mở dòng để xem chi tiết (danh sách học sinh, điểm, thao tác).
 */
import Link from "next/link";
import { useMemo, useState } from "react";
import { ListChecks, Lock, LockOpen, Search, Send } from "lucide-react";
import { toast } from "sonner";
import type { Assignment } from "@/lib/domain/types";
import { teacherAssignments, teacherClasses } from "@/lib/store/scoped";
import { useSessionData } from "@/lib/store/use-role";
import { assignmentCourse, assignmentStats } from "@/lib/teacher/assign";
import { cn, formatDate, matchesQuery } from "@/lib/utils";
import { EmptyState } from "@/components/ui/feedback";
import { Input, Select } from "@/components/ui/form";
import { AssessTabs, MenuItem, RowMenu } from "@/components/teacher/assess-tabs";

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
  const [classId, setClassId] = useState("");
  const [q, setQ] = useState("");
  const [bucket, setBucket] = useState<Bucket>("");
  const [now] = useState(() => Date.now());

  const rows = useMemo(() => teacherAssignments(d, user.id)
    .filter((a) => !classId || a.classId === classId)
    .map((a) => ({ a, s: assignmentStats(d, a), src: assignmentCourse(d, a) })), [d, user.id, classId]);
  const bucketOf = (a: Assignment): Bucket => (a.status === "draft" ? "draft" : a.status === "closed" ? "closed" : new Date(a.dueAt).getTime() > now ? "ongoing" : "overdue");
  const shown = rows
    .filter(({ a }) => (!bucket || bucketOf(a) === bucket) && matchesQuery(q, a.title))
    .sort((x, y) => Number(bucketOf(x.a) === "draft") - Number(bucketOf(y.a) === "draft") || y.a.dueAt.localeCompare(x.a.dueAt));

  return (
    <>
      <AssessTabs />
      <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center">
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">Tìm bài</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
          <Input className="pl-9" placeholder="Tìm bài tập…" value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
        <Select aria-label="Trạng thái" className="md:w-44" value={bucket} onChange={(e) => setBucket(e.target.value as Bucket)}>
          {BUCKETS.map((b) => <option key={b.id} value={b.id}>{b.label} ({b.id ? rows.filter((r) => bucketOf(r.a) === b.id).length : rows.length})</option>)}
        </Select>
        <Select aria-label="Lớp" className="md:w-36" value={classId} onChange={(e) => setClassId(e.target.value)}>
          <option value="">Mọi lớp</option>
          {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </Select>
      </div>

      {shown.length === 0 ? <EmptyState icon={ListChecks} title="Không có bài nào" description="Bấm “Giao bài mới” để giao từ khóa học hoặc từ thư viện bài tập." /> : (
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
              {shown.map(({ a, s, src }) => {
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
      )}
    </>
  );
}
