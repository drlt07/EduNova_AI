"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, BookOpen, CheckCircle2, ClipboardCheck, MonitorPlay, NotebookPen, UserX } from "lucide-react";
import { toast } from "sonner";
import { LESSONS } from "@/lib/data/curriculum";
import { bookEntry, bookOf } from "@/lib/sgk/book";
import { teacherAssignments, teacherClasses } from "@/lib/store/scoped";
import { useSessionData } from "@/lib/store/use-role";
import { assignmentStats } from "@/lib/teacher/assign";
import { sameDay, todos, upcomingSlots, type Slot, type TodoKind } from "@/lib/teacher/today";
import { cn, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { isThisWeek } from "@/components/layout/week-calendar";
import { WeekTimetable } from "@/components/teacher/dashboard-panels";

const DAY = ["Chủ nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
const hhmm = (d: Date) => `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
const TODO_ICON: Record<TodoKind, { icon: typeof ClipboardCheck; cls: string }> = {
  missing: { icon: UserX, cls: "bg-danger/15 text-danger-fg" },
  grade: { icon: ClipboardCheck, cls: "bg-violet/15 text-violet-fg" },
  prepare: { icon: NotebookPen, cls: "bg-warning/15 text-warning-fg" },
};

function SlotRow({ s, now }: { s: Slot; now: Date }) {
  const { d, user } = useSessionData();
  const taught = s.lesson && d.taughtLessons.some((t) => t.teacherId === user.id && t.classId === s.cls.id && t.ref === s.lesson!.ref);
  const past = s.at.getTime() + 45 * 60_000 < now.getTime();
  const lessonId = s.lesson && LESSONS.find((l) => l.textbookId === "kntt" && l.key === s.lesson!.lesson.key)?.id;
  return (
    <li className={cn("flex flex-wrap items-center gap-3 py-3", past && "opacity-60")}>
      <div className="w-16 shrink-0 text-center">
        <p className="text-lg font-bold tabular-nums text-fg">{hhmm(s.at)}</p>
        <p className="text-[11px] text-muted">Tiết {s.period}</p>
      </div>
      <div className="min-w-0 flex-1 basis-56">
        <p className="text-sm text-muted"><span className="mr-1.5 rounded bg-fg px-1.5 py-0.5 text-xs font-bold text-bg">{s.cls.name}</span>{s.room}{!sameDay(s.at, now) && ` · ${DAY[s.at.getDay()]} ${formatDate(s.at.toISOString()).slice(0, 5)}`}</p>
        {s.lesson ? <Link href={`/teacher/sgk/${s.lesson.ref}`} className="mt-0.5 block font-semibold text-fg hover:text-cyan-fg">Bài {s.lesson.lesson.no}. {s.lesson.lesson.title}</Link> : <p className="mt-0.5 font-semibold text-fg">Đã dạy hết sách</p>}
        {s.lesson && <p className="text-xs text-muted">{bookOf(s.cls.grade).title} · {s.planId ? "đã có KHBD" : "chưa có KHBD"}</p>}
      </div>
      {s.lesson && (
        <div className="flex flex-wrap gap-1.5">
          <Button asChild size="sm" variant="secondary"><Link href={`/teacher/sgk/${s.lesson.ref}`}><MonitorPlay /> Mở bài</Link></Button>
          <Button asChild size="sm" variant="ghost"><Link href={s.planId ? `/teacher/lesson-planner/${s.planId}` : lessonId ? `/teacher/lesson-planner/assistant?lesson=${lessonId}` : "/teacher/lesson-planner/assistant"}><NotebookPen /> {s.planId ? "KHBD" : "Soạn KHBD"}</Link></Button>
          <Button size="sm" variant="ghost" aria-pressed={!!taught} onClick={() => { d.toggleTaught(user.id, s.cls.id, s.lesson!.ref); if (!taught) toast.success(`${s.cls.name}: đã dạy xong Bài ${s.lesson!.lesson.no}`); }}><CheckCircle2 className={cn(taught && "text-success-fg")} /> {taught ? "Đã dạy" : "Dạy xong"}</Button>
        </div>
      )}
    </li>
  );
}

/** Trang làm việc của giáo viên: hôm nay dạy gì, cần làm gì trước, lớp nào cần chú ý. */
export default function TeacherToday() {
  const { d, user } = useSessionData();
  const [now] = useState(() => new Date());
  const [open, setOpen] = useState<string | null>(null);
  const [week, setWeek] = useState(false);
  const data = useMemo(() => {
    const classes = teacherClasses(d, user.id);
    const slots = upcomingSlots(d, user.id, now, 7);
    const today = slots.filter((s) => sameDay(s.at, now));
    const next = today.length ? [] : slots.slice(0, 3);
    const deadlines = teacherAssignments(d, user.id).filter((a) => isThisWeek(a.dueAt)).map((a) => ({ id: a.id, dueAt: a.dueAt, className: d.classes.find((c) => c.id === a.classId)?.name ?? "", title: a.title }));
    const last = d.bookProgress.filter((p) => p.userId === user.id).sort((a, b) => b.at.localeCompare(a.at))[0];
    const students = new Set(d.enrollments.filter((e) => classes.some((c) => c.id === e.classId)).map((e) => e.studentId)).size;
    return { classes, today, next, todo: todos(d, user.id, now), deadlines, last, students };
  }, [d, user.id, now]);
  const pending = data.todo.filter((t) => t.kind === "grade").reduce((n, t) => n + Number(/Chấm (\d+)/.exec(t.title)?.[1] ?? 0), 0);
  const missing = data.todo.filter((t) => t.kind === "missing").reduce((n, t) => n + (t.names?.length ?? 0), 0);
  const lastEntry = data.last && bookEntry(data.last.ref);

  const parts = [
    data.today.length ? `${data.today.length} tiết dạy (${data.today.map((s) => `${s.cls.name} tiết ${s.period}`).join(", ")})` : "không có tiết dạy",
    pending ? `${pending} bài chờ chấm` : "",
    missing ? `${missing} lượt học sinh chưa nộp sắp hết hạn` : "",
  ].filter(Boolean);
  const heroLesson = [...data.today, ...data.next].find((x) => x.lesson);
  const summary = parts.length > 1 ? `${parts.slice(0, -1).join(", ")} và ${parts.at(-1)}` : parts[0];

  const running = teacherAssignments(d, user.id).filter((a) => a.status === "open").sort((x, y) => x.dueAt.localeCompare(y.dueAt)).slice(0, 4);

  return (
    <>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted">{DAY[now.getDay()]}, {formatDate(now.toISOString())}</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-fg">Chào {user.name.split(" ").pop()}!</h1>
          <p className="mt-1 text-sm text-muted">Hôm nay có {summary}.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {heroLesson && <Button asChild><Link href={`/teacher/sgk/${heroLesson.lesson!.ref}`}><MonitorPlay /> Bài {heroLesson.lesson!.lesson.no} · {heroLesson.cls.name}</Link></Button>}
          {pending > 0 && <Button asChild variant="secondary"><Link href="/teacher/assessment"><ClipboardCheck /> Chấm {pending} bài</Link></Button>}
        </div>
      </header>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <section aria-labelledby="lich-h" className="min-w-0 rounded-2xl border border-line bg-surface p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 id="lich-h" className="text-lg font-bold text-fg">{data.today.length ? "Tiết dạy hôm nay" : "Tiết dạy sắp tới"}</h2>
            <Button size="sm" variant="ghost" onClick={() => setWeek(!week)} aria-expanded={week}>{week ? "Ẩn cả tuần" : "Xem cả tuần"}</Button>
          </div>
          {!data.today.length && <p className="mt-1 text-sm text-muted">Hôm nay không có tiết. Các tiết gần nhất:</p>}
          <ul className="mt-2 divide-y divide-line">{(data.today.length ? data.today : data.next).map((s) => <SlotRow key={`${s.cls.id}-${s.at.toISOString()}`} s={s} now={now} />)}</ul>
          {week && <div className="mt-4"><WeekTimetable classes={data.classes} deadlines={data.deadlines} /></div>}
        </section>

        <section id="viec" aria-labelledby="viec-h" className="min-w-0 scroll-mt-24 rounded-2xl border border-line bg-surface p-5">
          <h2 id="viec-h" className="text-lg font-bold text-fg">Việc cần xử lý</h2>
          {data.todo.length === 0 ? <p className="mt-2 text-sm text-muted">Không còn việc gấp.</p> : (
            <ol className="mt-3 divide-y divide-line">
              {data.todo.slice(0, 6).map((t) => {
                const I = TODO_ICON[t.kind];
                return (
                  <li key={t.id} className="py-2.5">
                    <div className="flex items-start gap-3">
                      <I.icon className={cn("mt-0.5 size-4 shrink-0", I.cls.split(" ").find((c) => c.startsWith("text-")))} aria-hidden />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-fg">{t.title}</p>
                        <p className="text-xs text-muted">{t.detail}</p>
                        {t.names && open === t.id && <p className="mt-1.5 text-sm text-fg">{t.names.join(", ")}</p>}
                      </div>
                      {t.names ? <Button size="sm" variant="ghost" onClick={() => setOpen(open === t.id ? null : t.id)} aria-expanded={open === t.id}>{open === t.id ? "Ẩn" : "Xem tên"}</Button> : t.href && <Button asChild size="sm" variant="ghost"><Link href={t.href}>Mở</Link></Button>}
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </section>
      </div>

      <section aria-labelledby="tiep-h" className="mt-6">
        <h2 id="tiep-h" className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">Đang thực hiện</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {lastEntry && (
            <Link href={`/teacher/sgk/${lastEntry.ref}${data.last!.last ? `#muc-${data.last!.last}` : ""}`} className="group flex items-center gap-3 rounded-2xl border border-line bg-surface p-4 hover:border-fg/30">
              <BookOpen className="size-5 shrink-0 text-blue-fg" aria-hidden />
              <span className="min-w-0 flex-1">
                <span className="block text-xs text-muted">Bài đang soạn / dạy · {bookOf(lastEntry.grade).title}</span>
                <span className="block truncate font-semibold text-fg">Bài {lastEntry.lesson.no}. {lastEntry.lesson.title}</span>
              </span>
              <ArrowRight className="size-4 shrink-0 text-muted group-hover:text-fg" aria-hidden />
            </Link>
          )}
          {running.map((a) => {
            const st = assignmentStats(d, a);
            return (
              <Link key={a.id} href={`/teacher/assignments/${a.id}`} className="group flex items-center gap-3 rounded-2xl border border-line bg-surface p-4 hover:border-fg/30">
                <ClipboardCheck className="size-5 shrink-0 text-violet-fg" aria-hidden />
                <span className="min-w-0 flex-1">
                  <span className="block text-xs text-muted">{d.classes.find((c) => c.id === a.classId)?.name} · hạn {formatDate(a.dueAt)}</span>
                  <span className="block truncate font-semibold text-fg">{a.title}</span>
                </span>
                <span className="shrink-0 text-sm tabular-nums text-muted">{st.done}/{st.target}</span>
              </Link>
            );
          })}
        </div>
      </section>
    </>
  );
}

