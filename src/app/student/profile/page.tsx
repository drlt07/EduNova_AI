"use client";
import Link from "next/link";
import { useMemo } from "react";
import { Award, BookMarked, ClipboardCheck, Code2, Dumbbell, LineChart, MessageSquareQuote, Settings, Target } from "lucide-react";
import { getSet } from "@/lib/data/practice";
import { getExercise } from "@/lib/data/coding-exercises";
import { assignmentBundle, studentAssessments, studentClassIds, studentSubmissions } from "@/lib/store/scoped";
import { useSessionData } from "@/lib/store/use-role";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/feedback";
import { Avatar, PageHeader, StatCard } from "@/components/ui/misc";

type HistoryItem = { at: string; icon: typeof Target; kind: string; title: string; result: string; href?: string };

/** Trang cá nhân: Kết quả học tập (điểm, nhận xét của thầy cô, lịch sử bài làm) và lối vào hồ sơ, cài đặt. */
export default function StudentProfilePage() {
  const { d, user } = useSessionData();
  const data = useMemo(() => {
    const klass = d.classes.find((c) => studentClassIds(d, user.id).includes(c.id));
    const subs = studentSubmissions(d, user.id);
    const graded = studentAssessments(d, user.id).map((a) => {
      const sub = subs.find((s) => s.id === a.submissionId)!;
      const { assignment, rubric } = assignmentBundle(d, sub.assignmentId);
      const max = rubric?.criteria.reduce((n, c) => n + c.maxScore, 0) ?? 0;
      const total = a.scores.reduce((n, s) => n + s.score, 0);
      return { a, sub, assignment, rubric, max, total };
    }).sort((x, y) => y.a.updatedAt.localeCompare(x.a.updatedAt));
    const history: HistoryItem[] = [
      ...subs.map((s) => {
        const { assignment } = assignmentBundle(d, s.assignmentId);
        const passed = s.testResults.filter((t) => t.pass).length;
        return { at: s.submittedAt, icon: Target, kind: "Nhiệm vụ", title: assignment?.title ?? "Nhiệm vụ", result: `${s.status === "graded" ? "Đã chấm" : "Đã nộp"} · kiểm thử ${passed}/${s.testResults.length}`, href: `/student/missions/${s.assignmentId}` };
      }),
      ...d.practiceAttempts.filter((p) => p.studentId === user.id).map((p) => {
        const scored = p.items.filter((i) => i.status !== "self");
        return { at: p.finishedAt, icon: Dumbbell, kind: "Trắc nghiệm", title: getSet(p.setId)?.title ?? d.teacherQuizzes.find((q) => q.id === p.setId)?.title ?? p.setId, result: `${scored.filter((i) => i.status === "correct").length}/${scored.length} câu đúng` };
      }),
      ...d.codeWorks.filter((w) => w.studentId === user.id && w.lastRun).map((w) => ({ at: w.lastRun!.at, icon: Code2, kind: "Lập trình", title: getExercise(w.exerciseId)?.title ?? "Bài tự do", result: `Kiểm thử ${w.lastRun!.passed}/${w.lastRun!.total}${w.lastRun!.errorType ? ` · lỗi ${w.lastRun!.errorType}` : ""}`, href: "/student/code" })),
      ...d.courseProgress.filter((p) => p.studentId === user.id).flatMap((p) => {
        const course = d.courses.find((c) => c.id === p.courseId);
        const n = Object.keys(p.done).length;
        return course && n ? [{ at: p.updatedAt, icon: BookMarked, kind: "Khóa học", title: course.title, result: `${n} nội dung đã hoàn thành`, href: `/student/courses/${course.id}` }] : [];
      }),
    ].sort((x, y) => y.at.localeCompare(x.at)).slice(0, 30);
    const avg = graded.length ? graded.reduce((n, g) => n + (g.max ? (g.total / g.max) * 10 : 0), 0) / graded.length : null;
    return { klass, graded, history, avg, submitted: subs.length };
  }, [d, user.id]);

  return (
    <>
      <div className="mb-6 flex items-center gap-4">
        <Avatar user={user} size={56} />
        <div>
          <PageHeader title={user.name} description={`Học sinh${data.klass ? ` lớp ${data.klass.name}` : ""} · Trang cá nhân`} />
        </div>
      </div>

      <section aria-labelledby="kq-h" className="space-y-5">
        <h2 id="kq-h" className="text-lg font-semibold text-fg">Kết quả học tập</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <StatCard label="Bài đã nộp" value={data.submitted} icon={ClipboardCheck} />
          <StatCard label="Bài đã chấm" value={data.graded.length} icon={Award} tone="violet" />
          <StatCard label="Điểm trung bình (thang 10)" value={data.avg === null ? "—" : data.avg.toFixed(1)} icon={LineChart} tone="success" />
        </div>

        <Card>
          <CardHeader><CardTitle as="h3" className="flex items-center gap-2"><MessageSquareQuote className="size-4 text-cyan-fg" aria-hidden /> Điểm và nhận xét của thầy cô</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {data.graded.length === 0 ? <EmptyState icon={Award} title="Chưa có bài được chấm" description="Khi thầy cô chấm bài, điểm theo từng tiêu chí và nhận xét sẽ hiện ở đây." className="py-6" /> : data.graded.map((g) => (
              <article key={g.a.id} className="rounded-xl border border-line p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="min-w-0 flex-1 font-semibold text-fg">{g.assignment?.title}</p>
                  <Badge tone="success">{g.total}/{g.max} điểm</Badge>
                  <span className="text-xs text-muted">{formatDate(g.a.updatedAt)}</span>
                </div>
                <ul className="mt-2 space-y-1 text-sm">
                  {g.a.scores.map((s) => {
                    const c = g.rubric?.criteria.find((x) => x.id === s.criterionId);
                    return <li key={s.criterionId} className="flex flex-wrap gap-x-2"><span className="text-fg">{c?.title ?? s.criterionId}:</span><b className="text-fg">{s.score}/{c?.maxScore}</b>{s.comment && <span className="text-muted">— {s.comment}</span>}</li>;
                  })}
                </ul>
                {g.a.feedback && <p className="mt-3 rounded-lg bg-surface-2 px-3 py-2 text-sm text-fg">“{g.a.feedback}”</p>}
              </article>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle as="h3">Lịch sử bài làm</CardTitle></CardHeader>
          <CardContent>
            {data.history.length === 0 ? <EmptyState title="Chưa có bài làm" className="py-6" /> : (
              <ol className="divide-y divide-line">
                {data.history.map((h, i) => (
                  <li key={`${h.kind}-${h.at}-${i}`} className="flex flex-wrap items-center gap-3 py-2.5 text-sm">
                    <h.icon className="size-4 shrink-0 text-cyan-fg" aria-hidden />
                    <span className="w-24 shrink-0 text-xs text-muted">{h.kind}</span>
                    {h.href ? <Link href={h.href} className="min-w-0 flex-1 truncate font-medium text-fg hover:underline">{h.title}</Link> : <span className="min-w-0 flex-1 truncate font-medium text-fg">{h.title}</span>}
                    <span className="text-muted">{h.result}</span>
                    <span className="w-28 shrink-0 text-right text-xs text-muted tabular-nums">{formatDate(h.at, true)}</span>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>
      </section>

      <section aria-labelledby="more-h" className="mt-8">
        <h2 id="more-h" className="mb-3 text-lg font-semibold text-fg">Khác</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {([["/student/dashboard", BookMarked, "Tổng quan học tập", "Học tiếp, gợi ý, thành tích gần đây"], ["/student/progress", LineChart, "Tiến độ theo chủ đề", "Mức đạt từng yêu cầu cần đạt"], ["/student/portfolio", Award, "Thành tích và sản phẩm", "Huy hiệu, sản phẩm, xem lại quá trình"], ["/student/settings", Settings, "Cài đặt", "Cỡ chữ, tương phản, báo lỗi"]] as const).map(([href, Icon, t, desc]) => (
            <Link key={href} href={href} className="flex gap-3 rounded-2xl border border-line bg-surface p-4 hover:border-cyan/40">
              <Icon className="size-5 shrink-0 text-cyan-fg" aria-hidden />
              <span><span className="block font-medium text-fg">{t}</span><span className="block text-sm text-muted">{desc}</span></span>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
