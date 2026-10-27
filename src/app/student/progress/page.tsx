"use client";
import Link from "next/link";
import { useMemo } from "react";
import { BookOpen, Bot, Crosshair, Info, TrendingUp, Wrench } from "lucide-react";
import { LESSONS, getTopic } from "@/lib/data/curriculum";
import { commonErrors, improvements, objectiveEvidence, studentBook, studySuggestions, topicProgress } from "@/lib/store/student-insights";
import { useSessionData } from "@/lib/store/use-role";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/feedback";
import { PageHeader } from "@/components/ui/misc";
import { AnimatedBar, CountUp, Stagger, StaggerItem } from "@/components/motion";

function levelOf(m: number | null) {
  if (m === null) return { label: "Chưa có minh chứng", cls: "border-line bg-surface-2 text-muted" };
  if (m >= 80) return { label: "Vững", cls: "border-success/50 bg-success/15 text-success-fg" };
  if (m >= 50) return { label: "Đang tiến bộ", cls: "border-cyan/50 bg-cyan/15 text-cyan-fg" };
  return { label: "Cần ôn thêm", cls: "border-warning/50 bg-warning/15 text-warning-fg" };
}

export default function ProgressPage() {
  const { d, user } = useSessionData();
  const { grade, book } = studentBook(d, user.id);
  const topics = useMemo(() => topicProgress(d, user.id), [d, user.id]);
  const ev = useMemo(() => objectiveEvidence(d, user.id, grade), [d, user.id, grade]);
  const errors = commonErrors(d, user.id);
  const better = improvements(d, user.id);
  const next = studySuggestions(d, user.id);
  const hints = d.aiInteractions.filter((a) => a.userId === user.id && a.agent === "learning-tutor").length;
  return (
    <>
      <PageHeader title="Tiến độ học tập" description={`Lớp ${grade}. Ba loại tiến độ được tính riêng để em biết mình đã học, đã hiểu và đã làm được đến đâu.`} />
      <Card className="mb-5">
        <CardHeader><CardTitle as="h2" className="flex items-center gap-2"><Info className="size-4 text-cyan-fg" /> Cách tính</CardTitle></CardHeader>
        <CardContent className="grid gap-3 text-sm sm:grid-cols-3">
          <p><b className="text-fg">Nội dung</b> <span className="text-muted">= số phần bài học em đánh dấu “Đã học xong” / tổng số phần. Chỉ đọc bài chưa có nghĩa là đã hiểu.</span></p>
          <p><b className="text-fg">Mức đạt</b> <span className="text-muted">= tỉ lệ đúng ở câu hỏi trong bài, bộ luyện tập và điểm giáo viên chấm (điểm giáo viên tính gấp đôi). Câu tự luận tự đánh giá không tính.</span></p>
          <p><b className="text-fg">Thực hành</b> <span className="text-muted">= tỉ lệ cấp trò chơi và bài lập trình em đã làm đạt mọi kiểm thử, trên số đã thử.</span></p>
        </CardContent>
      </Card>

      <h2 className="mb-3 text-lg font-semibold text-fg">Theo chủ đề</h2>
      <Stagger as="ul" className="mb-6 grid gap-4 md:grid-cols-2">
        {topics.map((t) => (
          <StaggerItem as="li" key={t.topicId} className="rounded-2xl border border-line bg-surface p-5">
            <p className="font-semibold text-fg">{t.name}</p>
            <p className="text-xs text-muted">{t.lessons} bài học</p>
            <div className="mt-3 space-y-2.5 text-sm">
              {([["Nội dung", t.content, "cyan"], ["Mức đạt", t.mastery, "violet"], ["Thực hành", t.practice, "success"]] as const).map(([label, v, tone]) => (
                <div key={label}>
                  <p className="flex justify-between text-fg"><span>{label}</span><span className="font-semibold">{v === null ? "—" : <CountUp value={v} suffix="%" />}</span></p>
                  <AnimatedBar value={v} tone={tone} label={`${label} ${t.name}`} className="mt-1" />
                </div>
              ))}
            </div>
          </StaggerItem>
        ))}
      </Stagger>

      <Card className="mb-5">
        <CardHeader><CardTitle as="h2" className="flex items-center gap-2"><Crosshair className="size-4 text-violet-fg" /> Bản đồ kiến thức</CardTitle></CardHeader>
        <CardContent>
          <div className="mb-3 flex flex-wrap gap-2 text-xs">{[null, 30, 60, 90].map((m) => { const l = levelOf(m); return <span key={l.label} className={cn("rounded-full border px-2 py-0.5", l.cls)}>{l.label}</span>; })}</div>
          <ul className="grid gap-2 md:grid-cols-2">
            {ev.map((e) => {
              const l = levelOf(e.mastery);
              const lesson = LESSONS.find((x) => x.textbookId === book && x.objectiveIds.includes(e.objectiveId));
              return (
                <li key={e.objectiveId} className={cn("rounded-xl border p-3", l.cls)}>
                  <p className="text-sm font-medium text-fg">{e.description}</p>
                  <p className="mt-1 text-xs">{l.label}{e.mastery !== null && ` · ${e.mastery}%`} · {getTopic(e.topicId)?.name}</p>
                  <p className="mt-0.5 text-xs text-muted">{e.evidence ? `Minh chứng: ${e.sources.join(", ")} (${e.evidence} lượt)` : "Chưa có câu hỏi hoặc bài chấm nào"}{e.practice !== null && ` · thực hành ${e.practice}%`}</p>
                  {lesson && <Link href={`/student/learning/${lesson.id}`} className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-cyan-fg hover:underline"><BookOpen className="size-3" /> {lesson.title}</Link>}
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card>
          <CardHeader><CardTitle as="h2" className="flex items-center gap-2"><Wrench className="size-4 text-warning-fg" /> Lỗi hay gặp</CardTitle></CardHeader>
          <CardContent>
            {errors.length ? <ul className="space-y-2 text-sm">{errors.map((e) => <li key={e.label} className="flex justify-between gap-2"><span className="text-fg">{e.label}</span><Badge tone="warning">{e.count}</Badge></li>)}</ul> : <EmptyState title="Chưa ghi nhận lỗi nào" className="py-6" />}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle as="h2" className="flex items-center gap-2"><TrendingUp className="size-4 text-success-fg" /> Em đã tiến bộ</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {better.length ? better.map((b) => <p key={b.title} className="text-fg">{b.title}: <b>{b.first}% → {b.last}%</b></p>) : <p className="text-muted">Làm lại một bộ luyện tập để thấy mức tiến bộ.</p>}
            <p className="flex items-center gap-1.5 border-t border-line pt-2 text-muted"><Bot className="size-4" aria-hidden /> Em đã hỏi gia sư AI {hints} lần.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle as="h2">Mục tiêu tiếp theo</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {next.map((s) => (
              <div key={s.href} className="text-sm">
                <p className="text-fg">{s.text}</p>
                <Button asChild size="sm" variant="secondary" className="mt-1"><Link href={s.href}>{s.action}</Link></Button>
              </div>
            ))}
            {!next.length && <p className="text-sm text-muted">Em đã hoàn thành các gợi ý hiện có.</p>}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
