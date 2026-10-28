"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { AlertTriangle, ArrowRight, BookOpen, Bot, CalendarDays, CheckCircle2, ClipboardCheck, FlaskConical, ListChecks, MonitorPlay, NotebookPen, Trophy, Users, UserX } from "lucide-react";
import { toast } from "sonner";
import { classNotes } from "@/lib/analytics/class-notes";
import { LESSONS } from "@/lib/data/curriculum";
import { sgkRefForKey } from "@/lib/data/sgk-kntt";
import { bookEntry, bookOf } from "@/lib/sgk/book";
import { teacherAssignments, teacherClasses } from "@/lib/store/scoped";
import { useSessionData } from "@/lib/store/use-role";
import { fmtScore } from "@/lib/sim/lab-score";
import { classHealth, sameDay, todos, upcomingSlots, type Slot, type TodoKind } from "@/lib/teacher/today";
import { cn, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { isThisWeek } from "@/components/layout/week-calendar";
import { ClassInsights, WeekTimetable } from "@/components/teacher/dashboard-panels";
import { AssignDialog, type AssignPreset } from "@/components/teacher/assign-dialog";
import { lessonAssignables } from "@/components/sgk/reader";
import { BookCover } from "@/components/sgk/book-cover";

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
        {s.lesson && <p className="text-xs text-muted">{bookOf(s.cls.grade).title} · {s.planId ? "đã có KHBD" : "chưa có KHBD"}{s.lesson.content ? "" : " · bài chưa có nội dung số"}</p>}
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
  const [remedy, setRemedy] = useState<{ ref: string; items: AssignPreset[] } | null>(null);
  const data = useMemo(() => {
    const classes = teacherClasses(d, user.id);
    const slots = upcomingSlots(d, user.id, now, 7);
    const today = slots.filter((s) => sameDay(s.at, now));
    const next = today.length ? [] : slots.slice(0, 3);
    const deadlines = teacherAssignments(d, user.id).filter((a) => isThisWeek(a.dueAt)).map((a) => ({ id: a.id, dueAt: a.dueAt, className: d.classes.find((c) => c.id === a.classId)?.name ?? "", title: a.title }));
    const last = d.bookProgress.filter((p) => p.userId === user.id).sort((a, b) => b.at.localeCompare(a.at))[0];
    const students = new Set(d.enrollments.filter((e) => classes.some((c) => c.id === e.classId)).map((e) => e.studentId)).size;
    return { classes, today, next, todo: todos(d, user.id, now), health: classHealth(d, user.id), notes: classNotes(d, user.id, now.getTime()), deadlines, last, students };
  }, [d, user.id, now]);
  const pending = data.todo.filter((t) => t.kind === "grade").reduce((n, t) => n + Number(/Chấm (\d+)/.exec(t.title)?.[1] ?? 0), 0);
  const missing = data.todo.filter((t) => t.kind === "missing").reduce((n, t) => n + (t.names?.length ?? 0), 0);
  const taughtWeek = d.taughtLessons.filter((t) => t.teacherId === user.id && isThisWeek(t.at)).length;
  const lastEntry = data.last && bookEntry(data.last.ref);
  const flagged = data.health.filter((h) => h.flag);
  const remedyFor = (objectiveId?: string) => {
    const lesson = objectiveId ? LESSONS.find((l) => l.textbookId === "kntt" && l.objectiveIds.includes(objectiveId)) : undefined;
    const ref = lesson && sgkRefForKey(lesson.key);
    const e = ref ? bookEntry(ref) : undefined;
    if (e) setRemedy({ ref: e.ref, items: lessonAssignables(d, user.id, e) });
  };

  const parts = [
    data.today.length ? `${data.today.length} tiết dạy (${data.today.map((s) => `${s.cls.name} tiết ${s.period}`).join(", ")})` : "không có tiết dạy",
    pending ? `${pending} bài chờ chấm` : "",
    missing ? `${missing} lượt học sinh chưa nộp sắp hết hạn` : "",
  ].filter(Boolean);
  const heroLesson = [...data.today, ...data.next].find((x) => x.lesson);
  const summary = parts.length > 1 ? `${parts.slice(0, -1).join(", ")} và ${parts.at(-1)}` : parts[0];

  return (
    <>
      <header className="relative mb-6 overflow-hidden rounded-3xl bg-gradient-to-br from-[#2563eb] via-[#1d4ed8] to-[#0891b2] p-6 text-white shadow-lg shadow-blue-600/20 sm:p-8">
        <div aria-hidden className="pointer-events-none absolute -right-16 -top-20 size-72 rounded-full bg-white/10" />
        <div aria-hidden className="pointer-events-none absolute -bottom-24 right-40 size-56 rounded-full bg-cyan-300/20" />
        <p className="relative inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold"><CalendarDays className="size-3.5" aria-hidden /> {DAY[now.getDay()]}, {formatDate(now.toISOString())}</p>
        <h1 className="relative mt-3 text-2xl font-extrabold tracking-tight sm:text-3xl">Chào {user.name.split(" ").pop()}!</h1>
        <p className="relative mt-1 max-w-2xl text-sm text-blue-50 sm:text-base">Hôm nay có {summary}.</p>
        <div className="relative mt-5 flex flex-wrap gap-2">
          {heroLesson && <Link href={`/teacher/sgk/${heroLesson.lesson!.ref}`} className="inline-flex h-10 items-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-blue-700 shadow-sm hover:bg-blue-50"><MonitorPlay className="size-4" aria-hidden /> Bài {heroLesson.lesson!.lesson.no} · {heroLesson.cls.name}</Link>}
          {pending > 0 && <Link href="/teacher/assignments" className="inline-flex h-10 items-center gap-2 rounded-xl bg-cyan-300 px-4 text-sm font-semibold text-slate-900 hover:bg-cyan-200"><ClipboardCheck className="size-4" aria-hidden /> Chấm {pending} bài</Link>}
          <Link href="/teacher/lesson-planner" className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-4 text-sm font-semibold text-white hover:bg-white/20"><NotebookPen className="size-4" aria-hidden /> Soạn KHBD</Link>
        </div>
      </header>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <section aria-labelledby="lich-h" className="min-w-0 rounded-2xl border border-line bg-surface p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 id="lich-h" className="flex items-center gap-2 text-lg font-bold text-fg"><CalendarDays className="size-5 text-cyan-fg" aria-hidden /> {data.today.length ? "Lịch dạy hôm nay" : "Tiết dạy sắp tới"}</h2>
            <Button size="sm" variant="ghost" onClick={() => setWeek(!week)} aria-expanded={week}>{week ? "Ẩn cả tuần" : "Xem cả tuần"}</Button>
          </div>
          {!data.today.length && <p className="mt-1 text-sm text-muted">Hôm nay không có tiết. Các tiết gần nhất:</p>}
          <ul className="mt-2 divide-y divide-line">{(data.today.length ? data.today : data.next).map((s) => <SlotRow key={`${s.cls.id}-${s.at.toISOString()}`} s={s} now={now} />)}</ul>
          {week && <div className="mt-4"><WeekTimetable classes={data.classes} deadlines={data.deadlines} /></div>}
        </section>

        <section id="viec" aria-labelledby="viec-h" className="min-w-0 scroll-mt-24 rounded-2xl border border-line bg-surface p-5">
          <h2 id="viec-h" className="text-lg font-bold text-fg">Việc cần làm</h2>
          {data.todo.length === 0 ? <p className="mt-2 text-sm text-muted">Không còn việc gấp. Thầy cô có thể chuẩn bị trước bài của tuần sau.</p> : (
            <ol className="mt-3 space-y-2">
              {data.todo.slice(0, 6).map((t) => {
                const I = TODO_ICON[t.kind];
                return (
                  <li key={t.id} className="rounded-xl border border-line p-3">
                    <div className="flex items-start gap-3">
                      <span className={cn("grid size-8 shrink-0 place-items-center rounded-lg", I.cls)}><I.icon className="size-4" aria-hidden /></span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-fg">{t.title}</p>
                        <p className="text-xs text-muted">{t.detail}</p>
                        {t.names && open === t.id && <p className="mt-1.5 text-sm text-fg">{t.names.join(", ")}</p>}
                      </div>
                      {t.names ? <Button size="sm" variant="ghost" onClick={() => setOpen(open === t.id ? null : t.id)} aria-expanded={open === t.id}>{open === t.id ? "Ẩn" : "Xem tên"}</Button> : t.href && <Button asChild size="sm" variant="secondary"><Link href={t.href}>{t.kind === "grade" ? "Chấm" : "Chuẩn bị"}</Link></Button>}
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </section>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { href: "/teacher/classes", icon: Users, value: data.classes.length, label: `lớp · ${data.students} học sinh` },
          { href: "/teacher/assessment", icon: ClipboardCheck, value: pending, label: "bài chờ chấm" },
          { href: "#viec", icon: UserX, value: missing, label: "lượt chưa nộp sắp hết hạn" },
          { href: "/teacher/sgk", icon: BookOpen, value: taughtWeek, label: "bài đã dạy tuần này" },
        ].map((k) => (
          <Link key={k.label} href={k.href} className="group flex items-center gap-3 rounded-2xl border border-line bg-surface p-4 transition-colors hover:border-cyan/50">
            <k.icon className="size-5 shrink-0 text-muted group-hover:text-cyan-fg" aria-hidden />
            <span className="text-2xl font-bold tabular-nums text-fg">{k.value}</span>
            <span className="text-sm text-muted">{k.label}</span>
            <ArrowRight className="ml-auto size-4 text-muted opacity-0 transition-opacity group-hover:opacity-100" aria-hidden />
          </Link>
        ))}
      </div>

      <div className="mt-6 grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <ClassInsights notes={data.notes} onRemedy={remedyFor} />
        <div className="min-w-0 space-y-6">
          {lastEntry && (
            <Link href={`/teacher/sgk/${lastEntry.ref}${data.last!.last ? `#muc-${data.last!.last}` : ""}`} className="group flex items-center gap-4 rounded-2xl border border-line bg-surface p-4 transition-colors hover:border-cyan/50">
              <BookCover grade={lastEntry.grade} className="h-20 w-auto shrink-0" />
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-semibold uppercase tracking-wide text-cyan-fg">Tiếp tục bài dạy</span>
                <span className="block font-bold text-fg">Bài {lastEntry.lesson.no}. {lastEntry.lesson.title}</span>
                <span className="block text-xs text-muted">{bookOf(lastEntry.grade).title} · mở lần cuối {formatDate(data.last!.at)}</span>
              </span>
              <ArrowRight className="size-5 shrink-0 text-muted group-hover:text-cyan-fg" aria-hidden />
            </Link>
          )}

          <section aria-labelledby="lop-h" className="rounded-2xl border border-line bg-surface p-5">
            <h2 id="lop-h" className="text-lg font-bold text-fg">Các lớp</h2>
            {flagged.length > 0 && <p className="mt-1 flex items-center gap-1.5 text-sm text-warning-fg"><AlertTriangle className="size-4 shrink-0" aria-hidden /> {flagged.map((h) => `${h.cls.name}: ${h.flag}`).join("; ")}.</p>}
            <ul className="mt-3 divide-y divide-line">
              {data.health.map((h) => (
                <li key={h.cls.id}>
                  <Link href={`/teacher/classes/${h.cls.id}`} className="group flex flex-wrap items-center gap-x-4 gap-y-1 py-2.5">
                    <span className="w-14 font-bold text-fg group-hover:text-cyan-fg">{h.cls.name}</span>
                    <span className="text-sm text-muted">{h.students} em · đã dạy {h.taught} bài</span>
                    <span className={cn("text-sm", h.doneRate < 70 ? "font-semibold text-warning-fg" : "text-muted")}>{h.doneRate}% nhiệm vụ xong</span>
                    {h.avgLab !== undefined && <span className="text-sm text-muted">mô phỏng TB {fmtScore(h.avgLab)}</span>}
                    <ArrowRight className="ml-auto size-4 text-muted group-hover:text-cyan-fg" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="tat-h">
            <h2 id="tat-h" className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">Lối tắt</h2>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {[
                { href: "/teacher/sgk", label: "SGK số", icon: BookOpen },
                { href: "/labs", label: "Kho mô phỏng", icon: FlaskConical },
                { href: "/teacher/lesson-planner/assistant", label: "Trợ lý KHBD AI", icon: Bot },
                { href: "/teacher/resources", label: "Câu hỏi & học liệu", icon: ListChecks },
                { href: "/teacher/assignments", label: "Giao nhiệm vụ", icon: ClipboardCheck },
                { href: "/thuat-toan", label: "Chuyên đề HSG", icon: Trophy },
              ].map((q) => (
                <Link key={q.href} href={q.href} className="flex items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2.5 text-sm font-medium text-fg transition-colors hover:border-cyan/40">
                  <q.icon className="size-4 shrink-0 text-cyan-fg" aria-hidden /> {q.label}
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>

      <AssignDialog open={!!remedy} onOpenChange={(o) => !o && setRemedy(null)} sgkRef={remedy?.ref} suggest={remedy?.items} />
    </>
  );
}
