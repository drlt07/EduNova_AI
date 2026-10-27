"use client";
import Link from "next/link";
import { useMemo } from "react";
import { BarChart3, ClipboardCheck, Lightbulb, ListChecks, NotebookPen, Plus, Users, Wand2 } from "lucide-react";
import { useSessionData } from "@/lib/store/use-role";
import { teacherAssignments, teacherClasses, teacherSubmissions } from "@/lib/store/scoped";
import { completion, objectiveMastery, refinementSuggestions } from "@/lib/analytics/compute";
import { formatDate, relativeDays } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState, Progress } from "@/components/ui/feedback";
import { PageHeader, StatCard } from "@/components/ui/misc";
import { WeekCalendar, isThisWeek, vnWeekday, type CalendarItem } from "@/components/layout/week-calendar";

export default function TeacherDashboard() {
  const { d, user } = useSessionData();
  const data = useMemo(() => {
    const classes = teacherClasses(d, user.id);
    const assignments = teacherAssignments(d, user.id);
    const subs = teacherSubmissions(d, user.id);
    const plans = d.lessonPlans.filter((p) => p.ownerId === user.id);
    const pending = subs.filter((s) => s.status === "submitted");
    const classIds = new Set(classes.map((c) => c.id));
    const studentIds = new Set(d.enrollments.filter((e) => classIds.has(e.classId)).map((e) => e.studentId));
    const recent = d.auditLog.filter((a) => a.actorId === user.id || studentIds.has(a.actorId)).slice(0, 7);
    const calendar: CalendarItem[] = [
      ...classes.flatMap((c) => c.schedule.map((s) => ({ weekday: s.weekday, title: c.name, detail: `${s.period} · ${s.room}`, tone: "class" as const }))),
      ...assignments.filter((a) => isThisWeek(a.dueAt)).map((a) => ({ weekday: vnWeekday(a.dueAt), title: "Hạn nộp", detail: `${d.classes.find((c) => c.id === a.classId)?.name}: ${a.title}`, tone: "deadline" as const })),
    ];
    return { classes, assignments, subs, plans, pending, recent, calendar, comp: completion(d, user.id), mastery: objectiveMastery(d, user.id), suggestions: refinementSuggestions(d, user.id).slice(0, 2) };
  }, [d, user.id]);
  const name = (id: string) => d.users.find((u) => u.id === id)?.name ?? id;

  return (
    <>
      <PageHeader
        title={`Xin chào, ${user.name.split(" ").pop()}`}
        description="Tổng quan lớp học, kế hoạch bài dạy và bài làm của học sinh."
        actions={
          <>
            <Button asChild variant="secondary"><Link href="/teacher/lesson-planner?new=1"><Plus /> KHBD mới</Link></Button>
            <Button asChild><Link href="/teacher/activity-builder"><Wand2 /> Thiết kế hoạt động</Link></Button>
          </>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Lớp phụ trách" value={data.classes.length} hint={`${new Set(d.enrollments.filter((e) => data.classes.some((c) => c.id === e.classId)).map((e) => e.studentId)).size} học sinh`} icon={Users} />
        <StatCard label="Kế hoạch bài dạy" value={data.plans.length} hint={`${data.plans.filter((p) => p.status === "draft").length} bản nháp`} icon={NotebookPen} tone="blue" />
        <StatCard label="Nhiệm vụ đã giao" value={data.assignments.length} hint={`${data.comp.rate}% lượt đã nộp`} icon={ListChecks} tone="violet" />
        <StatCard label="Bài chờ chấm" value={data.pending.length} hint={`${data.comp.graded} bài đã chấm`} icon={ClipboardCheck} tone="success" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <Card>
          <CardHeader><CardTitle as="h2">Lịch tuần này</CardTitle><CardDescription>Tiết dạy theo thời khóa biểu lớp và hạn nộp nhiệm vụ.</CardDescription></CardHeader>
          <CardContent tabIndex={0} aria-label="Lịch tuần (cuộn ngang trên màn hình nhỏ)" className="overflow-x-auto"><div className="min-w-[560px]"><WeekCalendar items={data.calendar} /></div></CardContent>
        </Card>
        <Card className="border-violet/30 bg-gradient-to-b from-violet/10 to-transparent">
          <CardHeader>
            <CardTitle as="h2" className="flex items-center gap-2"><Lightbulb className="size-4 text-violet-fg" /> Gợi ý cải tiến</CardTitle>
            <CardDescription>Dựa trên kết quả chấm bài gần đây</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.mastery.length === 0 ? (
              <p className="text-sm text-muted">Chưa có đánh giá chính thức nào để phân tích.</p>
            ) : (
              <ul className="space-y-3">
                {data.mastery.map((m) => (
                  <li key={m.objectiveId}>
                    <div className="mb-1 flex justify-between text-xs"><span className="font-mono text-cyan-fg">{m.objectiveId}</span><span className="text-fg">đạt {m.mastery}%</span></div>
                    <Progress value={m.mastery} tone={m.mastery < 70 ? "warning" : "success"} label={`Mức đạt ${m.objectiveId}`} />
                  </li>
                ))}
              </ul>
            )}
            {data.suggestions.map((s) => (
              <div key={s.id} className="rounded-xl border border-line bg-surface p-3 text-sm">
                <p className="text-xs font-semibold text-warning-fg">{s.trigger}</p>
                <p className="mt-1 text-fg">{s.suggestion}</p>
              </div>
            ))}
            <Button asChild variant="outline" size="sm"><Link href="/teacher/analytics"><BarChart3 /> Xem thống kê</Link></Button>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader><CardTitle as="h2">Nhiệm vụ đang mở</CardTitle></CardHeader>
          <CardContent>
            {data.assignments.length === 0 ? (
              <EmptyState title="Chưa giao nhiệm vụ nào" action={<Button asChild size="sm"><Link href="/teacher/activity-builder">Thiết kế hoạt động</Link></Button>} />
            ) : (
              <ul className="divide-y divide-line">
                {data.assignments.slice(0, 5).map((a) => {
                  const total = d.enrollments.filter((e) => e.classId === a.classId).length;
                  const done = d.submissions.filter((s) => s.assignmentId === a.id).length;
                  return (
                    <li key={a.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-fg">{a.title}</p>
                        <p className="text-xs text-muted">{d.classes.find((c) => c.id === a.classId)?.name} · hạn {formatDate(a.dueAt)} ({relativeDays(a.dueAt)})</p>
                      </div>
                      <div className="w-full sm:w-48"><div className="mb-1 text-right text-xs text-muted">{done}/{total} đã nộp</div><Progress value={(done / Math.max(1, total)) * 100} label={`Tiến độ ${a.title}`} /></div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle as="h2">Hoạt động gần đây</CardTitle></CardHeader>
          <CardContent>
            {data.recent.length === 0 ? <p className="text-sm text-muted">Chưa có hoạt động.</p> : (
              <ol className="space-y-3">
                {data.recent.map((a) => (
                  <li key={a.id} className="border-l-2 border-cyan/40 pl-3 text-sm">
                    <p className="text-fg">{a.summary}</p>
                    <p className="text-xs text-muted">{name(a.actorId)} · {formatDate(a.at, true)}</p>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>
      </div>

      <section className="mt-6" aria-labelledby="qa-h">
        <h2 id="qa-h" className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">Thao tác nhanh</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { href: "/teacher/lesson-planner", label: "Soạn KHBD", icon: NotebookPen },
            { href: "/teacher/activity-builder", label: "Thiết kế hoạt động", icon: Wand2 },
            { href: "/teacher/assessment", label: `Chấm ${data.pending.length} bài`, icon: ClipboardCheck },
            { href: "/teacher/analytics", label: "Thống kê học tập", icon: BarChart3 },
          ].map((q) => (
            <Link key={q.href} href={q.href} className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-4 font-medium text-fg transition-colors hover:border-cyan/40">
              <q.icon className="size-5 text-cyan-fg" aria-hidden /> {q.label}
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
