"use client";
import Link from "next/link";
import { useState } from "react";
import { ArrowRight, CalendarDays, CheckCircle2, Lightbulb, NotebookPen, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { classNotes } from "@/lib/analytics/class-notes";
import { LESSONS } from "@/lib/data/curriculum";
import { useSessionData } from "@/lib/store/use-role";
import { sameDay, upcomingSlots } from "@/lib/teacher/today";
import { cn, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const DAY = ["CN", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];
const STEPS = ["Nhận biết bài SGK và yêu cầu cần đạt", "Dựng 4 hoạt động: Khởi động, Hình thành kiến thức, Luyện tập, Vận dụng", "Gợi ý mô phỏng, học liệu kèm lý do", "Soạn lại từng hoạt động theo yêu cầu của thầy cô", "Kiểm tra, xem trước, xuất Word/PDF, lưu phiên bản"];

/**
 * Đầu trang Trợ lý KHBD: bài sắp dạy (soạn ngay với trợ lý), điều chỉnh KHBD sau buổi học từ lỗi sai thật của học sinh.
 * Mọi thay đổi chỉ ghi vào KHBD khi thầy cô bấm duyệt.
 */
export function PlannerHome() {
  const { d, user } = useSessionData();
  const [now] = useState(() => new Date());
  const [applied, setApplied] = useState<Record<string, boolean>>({});
  const seen = new Set<string>();
  const upcoming = upcomingSlots(d, user.id, now, 7).filter((s) => s.lesson && s.at.getTime() > now.getTime() - 45 * 60_000 && !seen.has(s.cls.id) && seen.add(s.cls.id)).slice(0, 4);
  const plans = d.lessonPlans.filter((p) => p.ownerId === user.id);
  const notes = classNotes(d, user.id, now.getTime()).filter((n) => n.next && n.objectiveId);
  const adjust = notes.flatMap((n) => {
    const plan = plans.find((p) => p.objectiveIds.includes(n.objectiveId!));
    return plan ? [{ n, plan }] : [];
  });

  return (
    <div className="mb-8 space-y-6">
      <section aria-labelledby="sap-day-h" className="rounded-2xl border border-line bg-surface p-5">
        <h2 id="sap-day-h" className="flex items-center gap-2 text-lg font-bold text-fg"><CalendarDays className="size-5 text-cyan-fg" aria-hidden /> Bài sắp dạy</h2>
        {upcoming.length === 0 ? <p className="mt-2 text-sm text-muted">Không có tiết nào trong tuần tới.</p> : (
          <ul className="mt-3 divide-y divide-line">
            {upcoming.map((s) => {
              const lesson = LESSONS.find((l) => l.textbookId === "kntt" && l.key && l.key === s.lesson!.lesson.key);
              return (
                <li key={s.cls.id} className="flex flex-wrap items-center gap-3 py-3">
                  <span className="w-28 shrink-0 text-sm text-muted"><b className="text-fg">{s.cls.name}</b> · {sameDay(s.at, now) ? "hôm nay" : DAY[s.at.getDay()]} tiết {s.period}</span>
                  <span className="min-w-0 flex-1 basis-56">
                    <span className="block font-medium text-fg">Bài {s.lesson!.lesson.no}. {s.lesson!.lesson.title}</span>
                    <span className={cn("text-xs", s.planId ? "text-success-fg" : "text-warning-fg")}>{s.planId ? "đã có KHBD" : "chưa có KHBD"}</span>
                  </span>
                  {s.planId ? <Button asChild size="sm" variant="secondary"><Link href={`/teacher/lesson-planner/${s.planId}`}><NotebookPen /> Mở KHBD</Link></Button>
                    : <Button asChild size="sm"><Link href={lesson ? `/teacher/lesson-planner/assistant?lesson=${lesson.id}` : "/teacher/lesson-planner/assistant"}><Wand2 /> Soạn với trợ lý</Link></Button>}
                  <Button asChild size="sm" variant="ghost"><Link href={`/teacher/sgk/${s.lesson!.ref}`}>Xem bài SGK</Link></Button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {adjust.length > 0 && (
        <section aria-labelledby="dieu-chinh-h" className="rounded-2xl border border-warning/40 bg-surface p-5">
          <h2 id="dieu-chinh-h" className="flex items-center gap-2 text-lg font-bold text-fg"><Lightbulb className="size-5 text-warning-fg" aria-hidden /> Điều chỉnh sau buổi học</h2>
          <p className="text-sm text-muted">Rút ra từ bài làm của học sinh. Thầy cô duyệt thì đề xuất được ghi vào KHBD thành phiên bản mới.</p>
          <ul className="mt-3 space-y-3">
            {adjust.slice(0, 4).map(({ n, plan }) => (
              <li key={n.id} className="rounded-xl border border-line p-3">
                <p className="text-sm font-medium text-fg">{n.next}</p>
                <p className="mt-1 text-xs text-muted">Vì: {n.className} · {n.who} {n.text} · KHBD “{plan.title}”</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {applied[n.id] ? <span className="inline-flex items-center gap-1 text-sm font-medium text-success-fg"><CheckCircle2 className="size-4" aria-hidden /> Đã ghi vào KHBD (v{d.lessonPlans.find((p) => p.id === plan.id)?.currentVersion})</span> : (
                    <Button size="sm" onClick={() => { d.updateLessonPlan(plan.id, { notes: `${plan.notes}\n[Điều chỉnh sau buổi học ${formatDate(now.toISOString())}] ${n.next} (vì ${n.who} ${n.text})`.trim() }); d.saveLessonPlanVersion(plan.id, `Điều chỉnh sau buổi học: ${n.text}`, user.id); setApplied({ ...applied, [n.id]: true }); toast.success("Đã ghi vào KHBD thành phiên bản mới"); }}>Duyệt & ghi vào KHBD</Button>
                  )}
                  <Button asChild size="sm" variant="ghost"><Link href={`/teacher/lesson-planner/${plan.id}`}>Mở KHBD <ArrowRight /></Link></Button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-label="Trợ lý làm được gì" className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-2xl bg-surface-2/60 px-4 py-3 text-sm text-muted">
        <span className="font-semibold text-fg">Trợ lý KHBD:</span>
        {STEPS.map((s, i) => <span key={s} className="flex items-center gap-2">{i > 0 && <ArrowRight className="size-3.5" aria-hidden />}{s}</span>)}
        <span className="basis-full text-xs">Thầy cô duyệt và sửa lần cuối mọi nội dung.</span>
      </section>
    </div>
  );
}
