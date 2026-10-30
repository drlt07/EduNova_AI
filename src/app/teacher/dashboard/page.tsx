"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, BookOpen, CheckCircle2, ClipboardCheck, MonitorPlay, NotebookPen, School, Send, TrendingUp, Users, UserX } from "lucide-react";
import { toast } from "sonner";
import { LESSONS } from "@/lib/data/curriculum";
import { bookOf } from "@/lib/sgk/book";
import { teacherAssignments, teacherClasses } from "@/lib/store/scoped";
import { useSessionData } from "@/lib/store/use-role";
import { assignmentProgress, classProgress, myLessons, teacherOverview } from "@/lib/teacher/overview";
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

/** Ô chỉ số: số lớn, nhãn, bấm để mở trang liên quan. */
function Kpi({ icon: Icon, value, label, href, tone }: { icon: typeof Users; value: string; label: string; href: string; tone: string }) {
  return (
    <Link href={href} className="group rounded-2xl border border-line bg-surface p-4 transition hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-md">
      <span className={cn("grid size-9 place-items-center rounded-xl", tone)}><Icon className="size-[18px]" aria-hidden /></span>
      <p className="mt-3 text-3xl font-bold tabular-nums tracking-tight text-fg">{value}</p>
      <p className="text-sm text-muted group-hover:text-fg">{label}</p>
    </Link>
  );
}

const pad = (n: number) => String(n).padStart(2, "0");
type LessonTab = "teaching" | "recent" | "saved" | "toAssign";
const LESSON_TABS: [LessonTab, string][] = [["teaching", "Đang dạy"], ["recent", "Vừa mở"], ["saved", "Đã lưu"], ["toAssign", "Cần giao"]];

/** Tổng quan của giáo viên: chỉ số lớp học, bài học của tôi, tiến độ lớp, tiết dạy và việc cần xử lý. */
export default function TeacherToday() {
  const { d, user } = useSessionData();
  const [now] = useState(() => new Date());
  const [open, setOpen] = useState<string | null>(null);
  const [week, setWeek] = useState(false);
  const [lessonTab, setLessonTab] = useState<LessonTab>("teaching");
  const [by, setBy] = useState<"class" | "assignment">("class");
  const data = useMemo(() => {
    const classes = teacherClasses(d, user.id);
    const slots = upcomingSlots(d, user.id, now, 7);
    const today = slots.filter((s) => sameDay(s.at, now));
    const next = today.length ? [] : slots.slice(0, 3);
    const deadlines = teacherAssignments(d, user.id).filter((a) => isThisWeek(a.dueAt)).map((a) => ({ id: a.id, dueAt: a.dueAt, className: d.classes.find((c) => c.id === a.classId)?.name ?? "", title: a.title }));
    return { classes, today, next, todo: todos(d, user.id, now), deadlines, ov: teacherOverview(d, user.id, now.getTime()), lessons: myLessons(d, user.id, now.getTime()), byClass: classProgress(d, user.id), byAsg: assignmentProgress(d, user.id, 8) };
  }, [d, user.id, now]);
  const { ov, lessons } = data;
  const heroLesson = [...data.today, ...data.next].find((x) => x.lesson);
  const lessonRows = lessonTab === "toAssign" ? lessons.toAssign.map((x) => ({ e: x.e, note: `Đã dạy ở ${x.cls.name}, chưa giao hoạt động` })) : lessons[lessonTab].map((e) => ({ e, note: bookOf(e.grade).title }));

  return (
    <>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted">{DAY[now.getDay()]}, {formatDate(now.toISOString())}</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-fg">Chào {user.name.split(" ").pop()}!</h1>
          <p className="mt-1 text-sm text-muted">{data.today.length ? `Hôm nay có ${data.today.length} tiết dạy.` : "Hôm nay không có tiết dạy."}{ov.pending ? ` ${ov.pending} bài đang chờ chấm.` : ""}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {heroLesson && <Button asChild><Link href={`/teacher/sgk/${heroLesson.lesson!.ref}`}><MonitorPlay /> Bài {heroLesson.lesson!.lesson.no} · {heroLesson.cls.name}</Link></Button>}
          {ov.pending > 0 && <Button asChild variant="secondary"><Link href="/teacher/assessment"><ClipboardCheck /> Chấm {ov.pending} bài</Link></Button>}
        </div>
      </header>

      <section aria-label="Chỉ số" className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        <Kpi icon={School} value={pad(ov.classes)} label="Lớp đang dạy" href="/teacher/classes" tone="bg-brand/10 text-blue-fg" />
        <Kpi icon={Users} value={pad(ov.students)} label="Học sinh" href="/teacher/classes" tone="bg-sky-500/10 text-sky-700 dark:text-sky-300" />
        <Kpi icon={Send} value={pad(ov.assigned)} label="Bài đã giao" href="/teacher/assignments" tone="bg-indigo-500/10 text-indigo-700 dark:text-indigo-300" />
        <Kpi icon={BookOpen} value={pad(ov.teaching)} label="Bài đang dạy" href="/teacher/sgk" tone="bg-brand/10 text-blue-fg" />
        <Kpi icon={ClipboardCheck} value={pad(ov.pending)} label="Bài chờ chấm" href="/teacher/assessment" tone={ov.pending ? "bg-warning/15 text-warning-fg" : "bg-surface-2 text-muted"} />
        <Kpi icon={TrendingUp} value={ov.completion === null ? "–" : `${ov.completion}%`} label="Tỷ lệ hoàn thành" href="/teacher/analytics" tone="bg-success/10 text-success-fg" />
      </section>

      <div className="grid items-start gap-6 xl:grid-cols-2">
        <section aria-labelledby="bh-h" className="min-w-0 rounded-2xl border border-line bg-surface p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div><h2 id="bh-h" className="text-lg font-bold text-fg">Bài học của tôi</h2><p className="text-sm text-muted">Bài đang dạy, vừa mở, đã lưu và hoạt động cần giao.</p></div>
            <Button asChild size="sm" variant="ghost"><Link href="/teacher/sgk">Mở Khóa học <ArrowRight /></Link></Button>
          </div>
          <div role="tablist" aria-label="Nhóm bài học" className="mt-3 flex flex-wrap gap-1 rounded-xl bg-surface-2 p-1 text-sm">
            {LESSON_TABS.map(([k, l]) => { const n = k === "toAssign" ? lessons.toAssign.length : lessons[k].length; return <button key={k} type="button" role="tab" aria-selected={lessonTab === k} onClick={() => setLessonTab(k)} className={cn("flex-1 rounded-lg px-2.5 py-1.5 font-medium", lessonTab === k ? "bg-surface text-fg shadow-sm" : "text-muted hover:text-fg")}>{l} <span className="tabular-nums text-muted">{n}</span></button>; })}
          </div>
          {lessonRows.length === 0 ? <p className="mt-4 text-sm text-muted">{lessonTab === "saved" ? "Chưa lưu bài nào. Bấm Lưu ở đầu một bài học." : lessonTab === "toAssign" ? "Bài đã dạy đều đã có hoạt động giao cho lớp." : "Chưa có bài nào."}</p> : (
            <ul className="mt-3 divide-y divide-line">
              {lessonRows.slice(0, 6).map(({ e, note }, i) => (
                <li key={`${e.ref}-${i}`} className="flex items-center gap-3 py-2.5">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#2563eb] to-[#38bdf8] text-center text-white"><span className="leading-none"><span className="block text-[9px] font-semibold uppercase opacity-80">Bài</span><b className="text-sm">{e.lesson.no}</b></span></span>
                  <Link href={`/teacher/sgk/${e.ref}`} className="min-w-0 flex-1"><span className="block truncate font-semibold text-fg hover:underline">{e.lesson.title}</span><span className="block truncate text-xs text-muted">{note}</span></Link>
                  <Button asChild size="sm" variant={lessonTab === "toAssign" ? "primary" : "ghost"}><Link href={`/teacher/sgk/${e.ref}${lessonTab === "toAssign" ? "?tab=mo-phong" : ""}`}>{lessonTab === "toAssign" ? <><Send /> Giao</> : "Mở"}</Link></Button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="td-h" className="min-w-0 rounded-2xl border border-line bg-surface p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div><h2 id="td-h" className="text-lg font-bold text-fg">Tiến độ lớp học</h2><p className="text-sm text-muted">Tỷ lệ hoàn thành các bài đang mở.</p></div>
            <div role="group" aria-label="Xem theo" className="flex gap-1 rounded-xl bg-surface-2 p-1 text-sm">
              {([["class", "Theo lớp"], ["assignment", "Theo bài giao"]] as const).map(([k, l]) => <button key={k} type="button" aria-pressed={by === k} onClick={() => setBy(k)} className={cn("rounded-lg px-2.5 py-1.5 font-medium", by === k ? "bg-surface text-fg shadow-sm" : "text-muted hover:text-fg")}>{l}</button>)}
            </div>
          </div>
          <ul className="mt-4 space-y-3">
            {by === "class" ? data.byClass.map((r) => (
              <li key={r.cls.id}>
                <Link href={`/teacher/classes/${r.cls.id}`} className="block rounded-xl p-1 hover:bg-surface-2">
                  <span className="flex items-baseline justify-between gap-2 text-sm"><span><b className="text-fg">{r.cls.name}</b> <span className="text-muted">· {r.students} học sinh · {r.open} bài đang mở</span></span><b className="tabular-nums text-fg">{r.pct === null ? "–" : `${r.pct}%`}</b></span>
                  <span className="mt-1.5 block h-2.5 overflow-hidden rounded-full bg-surface-2"><span className={cn("block h-full rounded-full", (r.pct ?? 0) >= 70 ? "bg-success" : (r.pct ?? 0) >= 40 ? "bg-brand" : "bg-warning")} style={{ width: `${r.pct ?? 0}%` }} /></span>
                  <span className="mt-0.5 block text-xs text-muted">{r.target ? `${r.done}/${r.target} lượt hoàn thành` : "Chưa có bài đang mở"}</span>
                </Link>
              </li>
            )) : data.byAsg.length === 0 ? <li className="text-sm text-muted">Chưa có bài đang mở.</li> : data.byAsg.map((r) => (
              <li key={r.a.id}>
                <Link href={`/teacher/assignments/${r.a.id}`} className="block rounded-xl p-1 hover:bg-surface-2">
                  <span className="flex items-baseline justify-between gap-2 text-sm"><span className="min-w-0 truncate"><b className="text-fg">{r.a.title}</b> <span className="text-muted">· {r.cls?.name} · hạn {formatDate(r.a.dueAt)}</span></span><b className="tabular-nums text-fg">{r.pct}%</b></span>
                  <span className="mt-1.5 block h-2.5 overflow-hidden rounded-full bg-surface-2"><span className={cn("block h-full rounded-full", r.pct >= 70 ? "bg-success" : r.pct >= 40 ? "bg-brand" : "bg-warning")} style={{ width: `${r.pct}%` }} /></span>
                  <span className="mt-0.5 block text-xs text-muted">{r.done}/{r.target} em đã {r.a.task ? "làm" : "nộp"}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="lich-h" className="min-w-0 rounded-2xl border border-line bg-surface p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 id="lich-h" className="text-lg font-bold text-fg">{data.today.length ? "Tiết dạy hôm nay" : "Tiết dạy sắp tới"}</h2>
            <Button size="sm" variant="ghost" onClick={() => setWeek(!week)} aria-expanded={week}>{week ? "Ẩn cả tuần" : "Xem cả tuần"}</Button>
          </div>
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
    </>
  );
}
