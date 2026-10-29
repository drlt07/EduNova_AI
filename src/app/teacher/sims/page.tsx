"use client";
import { Suspense, useState } from "react";
import Link from "next/link";
import { FlaskConical, Send } from "lucide-react";
import type { LabTemplate } from "@/lib/domain/types";
import { assignedStudents, teacherClasses } from "@/lib/store/scoped";
import { taskOutcome } from "@/lib/teacher/assign";
import { useSessionData } from "@/lib/store/use-role";
import { cn, formatDate } from "@/lib/utils";
import { PageHero } from "@/components/layout/page-hero";
import { Button } from "@/components/ui/button";
import { PageSkeleton } from "@/components/ui/feedback";
import { SimLibrary } from "@/components/labs/sim-library";
import { AssignDialog, type AssignPreset } from "@/components/teacher/assign-dialog";

/** Mô phỏng theo bài cho giáo viên: chạy thử, giao cho lớp thành nhiệm vụ có hạn và theo dõi số em đã làm xong. */
function TeacherSims() {
  const { d, user } = useSessionData();
  const classes = teacherClasses(d, user.id);
  const [assign, setAssign] = useState<{ preset: AssignPreset; ref?: string; classId?: string } | null>(null);
  const extra = (lab: LabTemplate, ref?: string) => {
    const mine = classes.filter((c) => lab.grades.includes(c.grade));
    return (
      <div className="space-y-1.5 rounded-xl border border-line bg-surface-2/50 px-3 py-2">
        {mine.length === 0 && <p className="text-xs text-muted">Chưa có lớp Tin {lab.grades.join(", ")}.</p>}
        {mine.map((c) => {
          const a = d.assignments.find((x) => x.classId === c.id && x.status !== "draft" && x.task?.kind === "lab" && x.task.ref === lab.slug);
          if (!a) return (
            <div key={c.id} className="flex items-center gap-2 text-xs">
              <b className="w-12 text-fg">{c.name}</b><span className="flex-1 text-muted">chưa giao</span>
              <Button size="sm" variant="secondary" data-testid={`assign-sim-${c.id}-${lab.slug}`} onClick={() => setAssign({ preset: { kind: "lab", ref: lab.slug }, ref, classId: c.id })}><Send /> Giao</Button>
            </div>
          );
          const st = assignedStudents(d, a);
          const done = st.filter((u) => taskOutcome(d, u.id, a).done).length;
          return (
            <Link key={c.id} href={`/teacher/classes/${c.id}?tab=nhiem-vu`} className="flex items-center gap-2 rounded-lg text-xs hover:bg-surface">
              <b className="w-12 text-fg">{c.name}</b>
              <span className="h-1.5 flex-1 rounded-full bg-surface"><span className="block h-full rounded-full bg-success" style={{ width: `${(done / Math.max(1, st.length)) * 100}%` }} /></span>
              <span className="tabular-nums text-fg">{done}/{st.length} xong</span>
              <span className={cn("rounded px-1.5", new Date(a.dueAt).getTime() < Date.now() ? "bg-danger/15 text-danger-fg" : "bg-surface text-muted")}>hạn {formatDate(a.dueAt)}</span>
            </Link>
          );
        })}
      </div>
    );
  };
  return (
    <>
      <PageHero variant="app" eyebrow="Tình huống mô phỏng" icon={FlaskConical} title="Mô phỏng" accent="theo bài học" description="Bộ mô phỏng theo bài trong sách, chỉ giáo viên quản lí. Giao một mô phỏng cho lớp thì nó thành nhiệm vụ: học sinh phải làm xong trong bài của khóa học, máy tự chấm, thầy cô theo dõi tiến độ ngay tại đây." />
      <SimLibrary hrefFor={(l) => `/labs/${l.slug}`} extra={extra} />
      <AssignDialog open={!!assign} onOpenChange={(o) => !o && setAssign(null)} preset={assign?.preset} sgkRef={assign?.ref} classId={assign?.classId} />
    </>
  );
}

export default function Page() {
  return <Suspense fallback={<PageSkeleton />}><TeacherSims /></Suspense>;
}
