"use client";
import { Suspense, useState } from "react";
import { FlaskConical, Lock, LockOpen, Send } from "lucide-react";
import { toast } from "sonner";
import type { LabTemplate } from "@/lib/domain/types";
import { classUnlocks, labKey } from "@/lib/access/unlocks";
import { teacherClasses } from "@/lib/store/scoped";
import { useSessionData } from "@/lib/store/use-role";
import { cn } from "@/lib/utils";
import { PageHero } from "@/components/layout/page-hero";
import { Button } from "@/components/ui/button";
import { PageSkeleton } from "@/components/ui/feedback";
import { SimLibrary } from "@/components/labs/sim-library";
import { AssignDialog, type AssignPreset } from "@/components/teacher/assign-dialog";

/** Mô phỏng theo bài cho giáo viên: chạy thử, mở cho lớp (học sinh thấy trong bài của khóa học) hoặc giao thành nhiệm vụ có hạn. */
function TeacherSims() {
  const { d, user } = useSessionData();
  const classes = teacherClasses(d, user.id);
  const [assign, setAssign] = useState<{ preset: AssignPreset; ref?: string } | null>(null);
  const extra = (lab: LabTemplate, ref?: string) => {
    const mine = classes.filter((c) => lab.grades.includes(c.grade));
    return (
      <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-line bg-surface-2/50 px-3 py-2">
        <span className="mr-1 text-xs font-semibold text-muted">Mở cho:</span>
        {mine.length === 0 && <span className="text-xs text-muted">chưa có lớp Tin {lab.grades.join(", ")}</span>}
        {mine.map((c) => {
          const on = classUnlocks(d, c.id).has(labKey(lab.slug)) || d.assignments.some((a) => a.classId === c.id && a.status !== "draft" && a.task?.kind === "lab" && a.task.ref === lab.slug);
          return (
            <button key={c.id} type="button" aria-pressed={on} data-testid={`open-sim-${c.id}-${lab.slug}`} onClick={() => { d.setUnlocked(user.id, c.id, [labKey(lab.slug)], !on); toast.success(on ? `Đã khóa với ${c.name}` : `Đã mở cho ${c.name}: học sinh thấy trong bài học`); }}
              className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold", on ? "border-success/40 bg-success/15 text-success-fg" : "border-line bg-surface text-muted hover:text-fg")}>
              {on ? <LockOpen className="size-3.5" aria-hidden /> : <Lock className="size-3.5" aria-hidden />}{c.name}
            </button>
          );
        })}
        <Button size="sm" variant="ghost" className="ml-auto" onClick={() => setAssign({ preset: { kind: "lab", ref: lab.slug }, ref })}><Send /> Giao nhiệm vụ</Button>
      </div>
    );
  };
  return (
    <>
      <PageHero variant="app" eyebrow="Tình huống mô phỏng" icon={FlaskConical} title="Mô phỏng" accent="theo bài học" description="Chọn mô phỏng của từng bài để mở cho lớp hoặc giao thành nhiệm vụ. Học sinh chỉ thấy mô phỏng thầy cô đã mở hoặc giao, ngay trong bài của khóa học. Kho mô phỏng đầy đủ nằm ở trang công khai." />
      <SimLibrary hrefFor={(l) => `/labs/${l.slug}`} extra={extra} />
      <AssignDialog open={!!assign} onOpenChange={(o) => !o && setAssign(null)} preset={assign?.preset} sgkRef={assign?.ref} />
    </>
  );
}

export default function Page() {
  return <Suspense fallback={<PageSkeleton />}><TeacherSims /></Suspense>;
}
