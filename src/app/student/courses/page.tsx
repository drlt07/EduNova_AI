"use client";
import Link from "next/link";
import { useMemo } from "react";
import { BookMarked, GraduationCap } from "lucide-react";
import { TEXTBOOKS } from "@/lib/data/curriculum";
import { allLessons, courseCompletion } from "@/lib/courses/course";
import { studentClassIds } from "@/lib/store/scoped";
import { useSessionData } from "@/lib/store/use-role";
import { Badge } from "@/components/ui/badge";
import { EmptyState, Progress } from "@/components/ui/feedback";
import { PageHeader } from "@/components/ui/misc";

export default function StudentCoursesPage() {
  const { d, user } = useSessionData();
  const courses = useMemo(() => {
    const mine = studentClassIds(d, user.id);
    return d.courses.filter((c) => c.status === "published" && c.classIds.some((id) => mine.includes(id)));
  }, [d, user.id]);

  return (
    <>
      <PageHeader title="Khóa học" description="Các khóa học thầy cô đã phát hành cho lớp của em, sắp xếp theo chương trình Tin học." />
      {courses.length === 0 ? (
        <EmptyState icon={BookMarked} title="Chưa có khóa học" description="Khi thầy cô phát hành khóa học cho lớp, khóa học sẽ hiện ở đây." />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {courses.map((c) => {
            const progress = d.courseProgress.find((p) => p.studentId === user.id && p.courseId === c.id);
            const comp = courseCompletion(c, { progress, practiceAttempts: d.practiceAttempts, studentId: user.id });
            const teacher = d.users.find((u) => u.id === c.ownerId);
            return (
              <li key={c.id}>
                <Link href={`/student/courses/${c.id}`} className="flex h-full flex-col rounded-2xl border border-line bg-surface p-5 transition-colors hover:border-cyan/40">
                  <div className="flex items-start gap-3">
                    <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-cyan/25 to-violet/20 text-cyan-fg"><GraduationCap className="size-5" aria-hidden /></span>
                    <div className="min-w-0">
                      <p className="font-semibold text-fg">{c.title}</p>
                      <p className="text-xs text-muted">{teacher?.name} · {TEXTBOOKS.find((t) => t.id === c.textbookId)?.name}</p>
                    </div>
                  </div>
                  <p className="mt-3 line-clamp-2 text-sm text-muted">{c.description}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <Badge tone="blue">Tin {c.grade}</Badge>
                    <Badge>{c.topics.length} chủ đề · {allLessons(c).length} bài</Badge>
                    {c.sequential && <Badge tone="violet">Học lần lượt</Badge>}
                  </div>
                  <div className="mt-auto pt-4">
                    <p className="mb-1 text-xs text-muted">Đã hoàn thành {comp.done}/{comp.total} bài</p>
                    <Progress value={comp.percent} tone="success" label={`Tiến độ ${c.title}`} />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
