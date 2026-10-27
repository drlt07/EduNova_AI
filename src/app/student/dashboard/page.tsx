"use client";
import Link from "next/link";
import { useMemo } from "react";
import { motion } from "motion/react";
import { ArrowRight, Award, BookOpen, CalendarClock, Code2, FolderKanban, Gamepad2, Lock, PlayCircle, Sparkles, Target } from "lucide-react";
import { GAMES } from "@/lib/data/games";
import { LESSONS, DIFFICULTY_LABEL } from "@/lib/data/curriculum";
import { getLessonContent } from "@/lib/data/lesson-content";
import { computeAchievements } from "@/lib/store/achievements";
import { MISSION_STATUS_LABEL, studentMissions } from "@/lib/store/student";
import { continueItems, studentBook, studySuggestions, topicProgress, type ContinueItem } from "@/lib/store/student-insights";
import { useSessionData } from "@/lib/store/use-role";
import { formatDate, relativeDays } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/feedback";
import { AnimatedBar, CountUp, FadeIn, Stagger, StaggerItem } from "@/components/motion";

const CONT_ICON: Record<ContinueItem["kind"], typeof BookOpen> = { lesson: BookOpen, game: Gamepad2, code: Code2, mission: Target, project: FolderKanban };

export default function StudentDashboard() {
  const { d, user } = useSessionData();
  const data = useMemo(() => {
    const { grade, book, klass } = studentBook(d, user.id);
    const missions = studentMissions(d, user.id);
    const todo = missions.filter((m) => ["not_started", "in_progress", "paused"].includes(m.status)).sort((a, b) => a.assignment.dueAt.localeCompare(b.assignment.dueAt));
    const ach = computeAchievements(d, user.id);
    const started = new Set(d.lessonProgress.filter((p) => p.studentId === user.id).map((p) => p.lessonId));
    const recommended = LESSONS.filter((l) => l.grade === grade && l.textbookId === book && !started.has(l.id)).sort((a, b) => Number(!!getLessonContent(b.key)) - Number(!!getLessonContent(a.key))).slice(0, 3);
    return {
      grade,
      klass,
      todo,
      cont: continueItems(d, user.id).slice(0, 4),
      topics: topicProgress(d, user.id),
      tips: studySuggestions(d, user.id),
      ach,
      recommended,
      stats: {
        lessons: d.lessonProgress.filter((p) => p.studentId === user.id).length,
        practice: d.practiceAttempts.filter((p) => p.studentId === user.id).length,
        code: d.codeWorks.filter((c) => c.studentId === user.id && c.lastRun && c.lastRun.passed === c.lastRun.total).length,
        badges: ach.filter((a) => a.earned).length,
      },
    };
  }, [d, user.id]);

  return (
    <div className="space-y-6">
      <section aria-labelledby="welcome" className="relative overflow-hidden rounded-3xl border border-line bg-gradient-to-br from-cyan/15 via-surface to-violet/15 p-6 sm:p-8">
        <span aria-hidden className="pointer-events-none absolute -right-10 -top-16 size-56 rounded-full bg-cyan/25 blur-3xl [animation:blob-float_9s_ease-in-out_infinite]" />
        <span aria-hidden className="pointer-events-none absolute -bottom-20 right-1/3 size-56 rounded-full bg-violet/25 blur-3xl [animation:blob-float_11s_ease-in-out_infinite_reverse]" />
        <div className="relative">
          <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-sm font-medium text-cyan-fg">Lớp {data.klass?.name ?? data.grade}</motion.p>
          <motion.h1 id="welcome" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mt-1 text-2xl font-bold text-fg sm:text-3xl">Chào {user.name.split(" ").pop()}! Hôm nay mình học gì nhé?</motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} className="mt-2 max-w-2xl text-muted">
            {data.todo.length ? <>Em có <b className="text-fg">{data.todo.length}</b> nhiệm vụ cần làm, gần nhất hạn {relativeDays(data.todo[0].assignment.dueAt)}.</> : "Em không có nhiệm vụ nào đang chờ. Thử một trò chơi hoặc bài luyện tập nhé!"}
          </motion.p>
          <div className="mt-5 flex flex-wrap gap-2">
            {data.cont[0] ? <Button asChild><Link href={data.cont[0].href}><PlayCircle className="size-4" /> Học tiếp: {data.cont[0].title}</Link></Button> : <Button asChild><Link href="/student/learning"><BookOpen className="size-4" /> Vào bài học</Link></Button>}
            <Button asChild variant="secondary"><Link href="/student/games"><Gamepad2 className="size-4" /> Trò chơi mô phỏng</Link></Button>
          </div>
          <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {([["Bài đã học", data.stats.lessons], ["Lượt luyện tập", data.stats.practice], ["Bài code đạt", data.stats.code], ["Huy hiệu", data.stats.badges]] as const).map(([k, v]) => (
              <div key={k} className="rounded-2xl border border-line/70 bg-surface/70 p-3 backdrop-blur">
                <dt className="text-xs text-muted">{k}</dt>
                <dd className="text-2xl font-bold text-fg"><CountUp value={v} /></dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader><CardTitle as="h2">Tiếp tục học</CardTitle></CardHeader>
          <CardContent>
            {data.cont.length === 0 ? <EmptyState title="Chưa có gì đang làm dở" description="Bắt đầu một bài học, em sẽ quay lại đúng chỗ đã dừng." className="py-6" /> : (
              <Stagger as="ul" className="grid gap-3 sm:grid-cols-2">
                {data.cont.map((c) => {
                  const Icon = CONT_ICON[c.kind];
                  return (
                    <StaggerItem as="li" key={c.id}>
                      <Link href={c.href} className="group flex items-center gap-3 rounded-xl border border-line p-3 transition-all hover:-translate-y-0.5 hover:border-cyan/40 hover:shadow-md" data-testid={`continue-${c.kind}`}>
                        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-cyan/15 text-cyan-fg"><Icon className="size-5" aria-hidden /></span>
                        <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium text-fg">{c.title}</span><span className="text-xs text-muted">{c.detail}</span></span>
                        <ArrowRight className="size-4 text-muted transition-transform group-hover:translate-x-1" aria-hidden />
                      </Link>
                    </StaggerItem>
                  );
                })}
              </Stagger>
            )}
          </CardContent>
        </Card>
        <Card className="border-violet/30 bg-gradient-to-b from-violet/10 to-transparent">
          <CardHeader><CardTitle as="h2" className="flex items-center gap-2"><Sparkles className="size-4 text-violet-fg" /> Gợi ý học tập</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {data.tips.map((t) => (
              <FadeIn key={t.href} className="text-sm">
                <p className="text-fg">{t.text}</p>
                <Link href={t.href} className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-violet-fg hover:underline">{t.action} <ArrowRight className="size-3.5" /></Link>
              </FadeIn>
            ))}
            <p className="text-xs text-muted">Gợi ý tính theo luật từ kết quả của em (bản demo, không dùng mô hình AI).</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader className="flex-row items-center justify-between"><CardTitle as="h2">Nhiệm vụ sắp đến hạn</CardTitle><Link href="/student/missions" className="text-sm text-cyan-fg hover:underline">Tất cả</Link></CardHeader>
          <CardContent>
            {data.todo.length === 0 ? <EmptyState icon={Target} title="Không có nhiệm vụ đang chờ" className="py-6" /> : (
              <ul className="divide-y divide-line">
                {data.todo.slice(0, 4).map(({ assignment: a, status }) => (
                  <li key={a.id} className="flex flex-wrap items-center gap-3 py-3">
                    <CalendarClock className="size-5 shrink-0 text-muted" aria-hidden />
                    <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-fg">{a.title}</p><p className="text-xs text-muted">Hạn {formatDate(a.dueAt, true)} ({relativeDays(a.dueAt)})</p></div>
                    <Badge tone={MISSION_STATUS_LABEL[status].tone}>{MISSION_STATUS_LABEL[status].label}</Badge>
                    <Button asChild size="sm" variant="secondary"><Link href={`/student/missions/${a.id}`}>Mở</Link></Button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex-row items-center justify-between"><CardTitle as="h2">Tiến độ theo chủ đề</CardTitle><Link href="/student/progress" className="text-sm text-cyan-fg hover:underline">Chi tiết</Link></CardHeader>
          <CardContent className="space-y-3">
            {data.topics.slice(0, 5).map((t) => (
              <div key={t.topicId}>
                <p className="flex justify-between gap-2 text-sm text-fg"><span className="truncate">{t.name}</span><span className="shrink-0 text-xs text-muted">{t.mastery === null ? "chưa có điểm" : `mức đạt ${t.mastery}%`}</span></p>
                <AnimatedBar value={t.content} label={`Nội dung đã học ${t.name}`} className="mt-1" />
              </div>
            ))}
            <p className="text-xs text-muted">Thanh màu: phần nội dung đã học xong.</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader><CardTitle as="h2">Gợi ý cho em</CardTitle></CardHeader>
          <CardContent>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {data.recommended.map((l) => (
                <li key={l.id}>
                  <Link href={`/student/learning/${l.id}`} className="flex h-full flex-col rounded-xl border border-line p-3 transition-all hover:-translate-y-0.5 hover:border-cyan/40">
                    <BookOpen className="size-5 text-cyan-fg" aria-hidden />
                    <span className="mt-2 text-sm font-medium text-fg">{l.title}</span>
                    <span className="mt-auto pt-1 text-xs text-muted">Bài học · {DIFFICULTY_LABEL[l.difficulty]}</span>
                  </Link>
                </li>
              ))}
              {GAMES.filter((g) => g.status === "available").slice(0, 1).map((g) => (
                <li key={g.slug}>
                  <Link href={`/student/games/${g.slug}`} className="flex h-full flex-col rounded-xl border border-line bg-gradient-to-br from-success/10 to-transparent p-3 transition-all hover:-translate-y-0.5 hover:border-success/40">
                    <Gamepad2 className="size-5 text-success-fg" aria-hidden />
                    <span className="mt-2 text-sm font-medium text-fg">{g.title}</span>
                    <span className="mt-auto pt-1 text-xs text-muted">Trò chơi mô phỏng</span>
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex-row items-center justify-between"><CardTitle as="h2">Thành tích gần đây</CardTitle><Link href="/student/portfolio" className="text-sm text-cyan-fg hover:underline">Xem</Link></CardHeader>
          <CardContent>
            <ul className="grid grid-cols-3 gap-2">
              {[...data.ach].sort((a, b) => Number(b.earned) - Number(a.earned) || b.progress - a.progress).slice(0, 6).map((a, i) => (
                <motion.li key={a.id} initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: i * 0.06, type: "spring", stiffness: 260 }} className="flex flex-col items-center gap-1 rounded-xl p-2 text-center" title={a.description}>
                  <span className={a.earned ? "grid size-11 place-items-center rounded-2xl bg-success/15 text-success-fg" : "grid size-11 place-items-center rounded-2xl bg-surface-2 text-muted"}>{a.earned ? <Award className="size-5" aria-hidden /> : <Lock className="size-4" aria-hidden />}</span>
                  <span className="text-xs text-fg">{a.title}</span>
                </motion.li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
