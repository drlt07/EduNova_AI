"use client";
import { LessonPeek } from "@/components/landing/hero-visuals";
import { PageHero } from "@/components/layout/page-hero";
import { BookCover } from "@/components/sgk/book-cover";
import Link from "next/link";
import { useMemo } from "react";
import { ArrowRight, BookMarked, BookOpen, CalendarClock, GraduationCap, Target } from "lucide-react";
import { LESSONS, TEXTBOOKS } from "@/lib/data/curriculum";
import { allLessons, courseCompletion } from "@/lib/courses/course";
import { MISSION_STATUS_LABEL, studentMissions } from "@/lib/store/student";
import { studentBook } from "@/lib/store/student-insights";
import { studentClassIds } from "@/lib/store/scoped";
import { useSessionData } from "@/lib/store/use-role";
import { formatDate, relativeDays } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState, Progress } from "@/components/ui/feedback";

/** Khóa học của tôi: một nơi để học — nhiệm vụ thầy cô giao, khóa học được phát hành và bài học theo SGK. */
export default function StudentCoursesPage() {
  const { d, user } = useSessionData();
  const { grade, book } = studentBook(d, user.id);
  const data = useMemo(() => {
    const mine = studentClassIds(d, user.id);
    const missions = studentMissions(d, user.id);
    return {
      todo: missions.filter((m) => ["not_started", "in_progress", "paused"].includes(m.status)),
      done: missions.filter((m) => !["not_started", "in_progress", "paused"].includes(m.status)).length,
      courses: d.courses.filter((c) => c.status === "published" && c.classIds.some((id) => mine.includes(id))),
      sgkLessons: LESSONS.filter((l) => l.grade === grade && l.textbookId === book).length,
    };
  }, [d, user.id, grade, book]);

  return (
    <>
      <PageHero variant="app" eyebrow={`Tin học ${grade} · ${TEXTBOOKS.find((t) => t.id === book)?.name ?? ""}`} icon={GraduationCap} title="Khóa học" accent="của tôi" description="Học các bài và làm nhiệm vụ thầy cô giao. Mô phỏng, bài lập trình và luyện tập nằm ngay trong từng bài." stats={[{ value: data.todo.length, label: "nhiệm vụ đang chờ" }, { value: data.courses.length, label: "khóa học được giao" }, { value: data.sgkLessons, label: "bài theo SGK" }, { value: data.done, label: "nhiệm vụ đã xong" }]} visual={<LessonPeek href="/student/learning/L-10-if-kntt" />} />

      <section aria-labelledby="sgk-book-h" className="mb-8">
        <h2 id="sgk-book-h" className="mb-3 flex items-center gap-2 text-lg font-semibold text-fg"><BookOpen className="size-5 text-cyan-fg" aria-hidden /> Sách giáo khoa số</h2>
        <Link href={`/student/sgk?lop=${grade}`} className="group flex items-center gap-4 rounded-2xl border border-line bg-surface p-4 transition-colors hover:border-cyan/40">
          <BookCover grade={grade} className="h-24 w-auto shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-fg">Tin học {grade}</p>
            <p className="text-sm text-muted">Đọc bài, làm mô phỏng ngay tại phần kiến thức, trả lời câu hỏi củng cố và ghi chú.</p>
          </div>
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-cyan-fg">Mở sách <ArrowRight className="size-4" /></span>
        </Link>
      </section>

      <section aria-labelledby="todo-h" className="mb-8">
        <div className="mb-3 flex items-end justify-between gap-3">
          <h2 id="todo-h" className="flex items-center gap-2 text-lg font-semibold text-fg"><Target className="size-5 text-cyan-fg" aria-hidden /> Nhiệm vụ thầy cô giao</h2>
          <Link href="/student/missions" className="text-sm font-medium text-cyan-fg hover:underline">Tất cả nhiệm vụ{data.done ? ` (${data.done} đã xong)` : ""}</Link>
        </div>
        {data.todo.length === 0 ? (
          <EmptyState icon={Target} title="Không có nhiệm vụ đang chờ" description="Khi thầy cô giao bài, nhiệm vụ sẽ hiện ở đây." className="py-6" />
        ) : (
          <ul className="grid gap-3 md:grid-cols-2">
            {data.todo.map((m) => {
              const st = MISSION_STATUS_LABEL[m.status];
              const days = relativeDays(m.assignment.dueAt);
              return (
                <li key={m.assignment.id} className="flex flex-col gap-2 rounded-2xl border border-line bg-surface p-4">
                  <div className="flex flex-wrap items-center gap-2"><Badge tone={st.tone}>{st.label}</Badge>{m.klass && <Badge tone="blue">{m.klass.name}</Badge>}</div>
                  <p className="font-semibold text-fg">{m.assignment.title}</p>
                  <p className="flex items-center gap-1.5 text-sm text-muted"><CalendarClock className="size-4" aria-hidden /> Hạn {formatDate(m.assignment.dueAt, true)} · {days}</p>
                  <div className="mt-auto pt-1"><Button asChild size="sm"><Link href={`/student/missions/${m.assignment.id}`}>{m.status === "not_started" ? "Bắt đầu" : "Làm tiếp"} <ArrowRight /></Link></Button></div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section aria-labelledby="courses-h" className="mb-8">
        <h2 id="courses-h" className="mb-3 flex items-center gap-2 text-lg font-semibold text-fg"><BookMarked className="size-5 text-cyan-fg" aria-hidden /> Khóa học thầy cô phát hành</h2>
        {data.courses.length === 0 ? (
          <EmptyState icon={BookMarked} title="Chưa có khóa học" description="Khi thầy cô phát hành khóa học cho lớp, khóa học sẽ hiện ở đây. Trong lúc chờ, em có thể học theo chương trình SGK bên dưới." className="py-6" />
        ) : (
          <ul className="grid gap-4 md:grid-cols-2">
            {data.courses.map((c) => {
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
      </section>

      <section aria-labelledby="sgk-h">
        <h2 id="sgk-h" className="mb-3 flex items-center gap-2 text-lg font-semibold text-fg"><BookOpen className="size-5 text-cyan-fg" aria-hidden /> Học theo chương trình SGK</h2>
        <Link href="/student/learning" className="flex flex-wrap items-center gap-4 rounded-2xl border border-line bg-surface p-5 transition-colors hover:border-cyan/40">
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-fg">Tin học {grade} · {TEXTBOOKS.find((t) => t.id === book)?.name}</p>
            <p className="text-sm text-muted">{data.sgkLessons} bài theo bộ sách của lớp em; tự học, đánh dấu phần đã hiểu, ghi chú và quay lại đúng chỗ đã dừng.</p>
          </div>
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-cyan-fg">Mở danh sách bài <ArrowRight className="size-4" /></span>
        </Link>
      </section>
    </>
  );
}
