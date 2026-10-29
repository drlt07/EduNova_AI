"use client";
import Link from "next/link";
import { ClassesHeader } from "@/components/teacher/assess-tabs";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowRight, Plus, Users } from "lucide-react";
import { classStudents, teacherClasses } from "@/lib/store/scoped";
import { useSessionData } from "@/lib/store/use-role";
import { teachingProgress } from "@/lib/teacher/class-view";
import { classHealth, nextLesson } from "@/lib/teacher/today";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/feedback";
import { ClassFormDialog } from "@/components/teacher/class-form-dialog";

/** Các lớp của giáo viên: mỗi lớp gắn với sách của khối, tiến độ dạy, bài dạy tiếp và cảnh báo. */
export default function ClassesPage() {
  const { d, user } = useSessionData();
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const classes = teacherClasses(d, user.id);
  const health = classHealth(d, user.id);
  return (
    <>
      <ClassesHeader subtitle="Mỗi lớp: dạy đến bài nào, bài đã giao, từng em đang thế nào" actions={<Button onClick={() => setCreating(true)}><Plus /> Lớp mới</Button>} />
      {classes.length === 0 ? <EmptyState icon={Users} title="Chưa có lớp nào" description="Tạo lớp và chọn khối để có lộ trình bài học." action={<Button onClick={() => setCreating(true)}><Plus /> Tạo lớp</Button>} /> : (
        <ul className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {classes.map((c) => {
            const p = teachingProgress(d, user.id, c);
            const next = nextLesson(d, user.id, c);
            const h = health.find((x) => x.cls.id === c.id)!;
            return (
              <li key={c.id}>
                <Link href={`/teacher/classes/${c.id}`} className="group flex h-full flex-col rounded-2xl border border-line bg-surface p-5 transition-colors hover:border-cyan/50">
                  <div className="flex items-start gap-4">
                    <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[#ea580c] to-[#f59e0b] text-xl font-extrabold text-white">{c.grade}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-2xl font-bold text-fg group-hover:text-cyan-fg">{c.name}</p>
                      <p className="text-sm text-muted">Tin học {c.grade} · {classStudents(d, c.id).length} em</p>
                      <p className="text-xs text-muted">{c.schedule.map((s) => `${["", "T2", "T3", "T4", "T5", "T6", "T7"][s.weekday]} ${s.period.toLowerCase()}`).join(" · ") || "chưa có lịch"}</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="mb-1 flex justify-between text-xs"><span className="text-fg">Đã dạy <b>{p.taught}</b>/{p.total} bài</span><span className="text-muted">{Math.round((p.taught / p.total) * 100)}%</span></div>
                    <div className="h-2 rounded-full bg-surface-2"><div className="h-full rounded-full bg-cyan" style={{ width: `${(p.taught / p.total) * 100}%` }} /></div>
                  </div>
                  <p className="mt-3 text-sm text-fg"><span className="text-muted">Dạy tiếp:</span> {next ? `Bài ${next.lesson.no}. ${next.lesson.title}` : "đã hết sách"}</p>
                  <p className="text-sm text-muted">{h.doneRate}% lượt nhiệm vụ đã xong</p>
                  {h.flag && <p className="mt-2 flex items-center gap-1.5 text-sm font-medium text-warning-fg"><AlertTriangle className="size-4" aria-hidden /> {h.flag}</p>}
                  <span className="mt-auto inline-flex items-center gap-1 pt-4 text-sm font-semibold text-cyan-fg">Mở lớp <ArrowRight className="size-4" aria-hidden /></span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
      <ClassFormDialog open={creating} onOpenChange={setCreating} onCreated={(id) => router.push(`/teacher/classes/${id}`)} />
    </>
  );
}
