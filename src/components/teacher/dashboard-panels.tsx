import Link from "next/link";
import { ArrowRight, CalendarClock, ClipboardList, NotebookPen } from "lucide-react";
import type { ClassRoom, Grade } from "@/lib/domain/types";
import type { ObjectiveMastery, RefinementSuggestion } from "@/lib/analytics/compute";
import { LESSONS } from "@/lib/data/curriculum";
import { sgkRefForKey } from "@/lib/data/sgk-kntt";
import { vnWeekday } from "@/components/layout/week-calendar";
import { cn, formatDate } from "@/lib/utils";

const DAYS = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];
const GRADE_CHIP: Record<Grade, string> = {
  10: "border-cyan/40 bg-cyan/15 text-cyan-fg",
  11: "border-blue/40 bg-blue/15 text-blue-fg",
  12: "border-violet/40 bg-violet/15 text-violet-fg",
};

export interface Deadline {
  id: string;
  dueAt: string;
  className: string;
  title: string;
}

/** Thời khóa biểu buổi sáng (tiết × thứ) như bảng dán ở phòng giáo viên, kèm hạn nộp trong tuần. */
export function WeekTimetable({ classes, deadlines }: { classes: ClassRoom[]; deadlines: Deadline[] }) {
  const today = vnWeekday(new Date());
  const slots = classes.flatMap((c) => c.schedule.map((s) => ({ ...s, cls: c, no: Number(s.period.replace(/\D/g, "")) || 0 })));
  const periods = Math.max(5, ...slots.map((s) => s.no));
  return (
    <section aria-labelledby="tkb-h" className="min-w-0 rounded-2xl border border-line bg-surface p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="tkb-h" className="text-lg font-bold text-fg">Thời khóa biểu tuần này</h2>
        <span className="text-xs text-muted">{slots.length} tiết dạy · {deadlines.length} hạn nộp</span>
      </div>
      <div className="mt-4 overflow-x-auto" tabIndex={0} aria-label="Thời khóa biểu (cuộn ngang trên màn hình nhỏ)">
        <table className="w-full min-w-[520px] table-fixed border-separate border-spacing-1 text-sm">
          <thead>
            <tr>
              <th scope="col" className="w-14" />
              {DAYS.map((d, i) => (
                <th key={d} scope="col" className={cn("rounded-lg py-1.5 text-xs font-semibold", today === i + 1 ? "bg-fg text-bg" : "text-muted")}>
                  {d}
                  {today === i + 1 && <span className="sr-only"> (hôm nay)</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: periods }, (_, p) => (
              <tr key={p}>
                <th scope="row" className="text-left text-xs font-medium text-muted">Tiết {p + 1}</th>
                {DAYS.map((d, i) => {
                  const s = slots.find((x) => x.weekday === i + 1 && x.no === p + 1);
                  return (
                    <td key={d} className={cn("h-12 rounded-lg align-top", s ? "" : today === i + 1 ? "bg-surface-2/70" : "bg-surface-2/40")}>
                      {s && (
                        <Link href="/teacher/classes" className={cn("flex h-full flex-col justify-center rounded-lg border px-2 py-1 leading-tight hover:brightness-110", GRADE_CHIP[s.cls.grade])}>
                          <span className="font-bold">{s.cls.name}</span>
                          <span className="text-[11px] opacity-80">{s.room}</span>
                        </Link>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {deadlines.length > 0 && (
        <ul className="mt-4 space-y-2 border-t border-dashed border-line pt-4">
          {deadlines.map((x) => (
            <li key={x.id} className="flex items-center gap-3 text-sm">
              <span className="flex w-20 shrink-0 flex-col items-center rounded-lg bg-warning/15 py-1 text-warning-fg">
                <span className="text-[11px] font-semibold">{DAYS[vnWeekday(x.dueAt) - 1] ?? "CN"}</span>
                <span className="text-xs">{formatDate(x.dueAt).slice(0, 5)}</span>
              </span>
              <CalendarClock className="size-4 shrink-0 text-warning-fg" aria-hidden />
              <span className="min-w-0"><span className="font-semibold text-fg">{x.className}</span> <span className="text-muted">nộp</span> <span className="text-fg">{x.title}</span></span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** Gợi ý → đúng bài SGK: mở tab Câu hỏi của bài trong Khóa học, và Trợ lý KHBD của bài đó. */
function suggestionLinks(objectiveId?: string) {
  const lesson = objectiveId ? LESSONS.find((l) => l.textbookId === "kntt" && l.objectiveIds.includes(objectiveId)) : undefined;
  const ref = lesson ? sgkRefForKey(lesson.key) : undefined;
  return {
    quiz: ref ? `/teacher/courses?grade=${ref.split("-")[0]}&bai=${ref}&tab=quiz` : "/teacher/courses",
    plan: lesson ? `/teacher/lesson-planner/assistant?lesson=${lesson.id}` : "/teacher/lesson-planner",
  };
}

/** Tên bài học gắn với yêu cầu cần đạt, để giáo viên đọc "Câu lệnh rẽ nhánh if" thay vì mã O10-F-02. */
function lessonFor(objectiveId: string) {
  return LESSONS.find((l) => l.textbookId === "kntt" && l.objectiveIds.includes(objectiveId))?.title;
}

/** Mức đạt theo yêu cầu cần đạt + việc nên làm ở tiết sau, rút ra từ bài đã chấm. */
export function ClassInsights({ mastery, suggestions }: { mastery: ObjectiveMastery[]; suggestions: RefinementSuggestion[] }) {
  return (
    <section aria-labelledby="ins-h" className="min-w-0 rounded-2xl border border-line bg-surface p-5">
      <h2 id="ins-h" className="text-lg font-bold text-fg">Học sinh đang vướng ở đâu</h2>
      <p className="text-xs text-muted">Từ các bài đã chấm gần đây</p>
      {mastery.length === 0 ? (
        <p className="mt-4 text-sm text-muted">Chưa có bài chấm chính thức nào để phân tích.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {mastery.map((m) => {
            const low = m.mastery < 70;
            return (
              <li key={m.objectiveId} className="flex items-center gap-3">
                <span className={cn("grid size-11 shrink-0 place-items-center rounded-xl text-sm font-bold tabular-nums", low ? "bg-warning/15 text-warning-fg" : "bg-success/15 text-success-fg")}>{m.mastery}%</span>
                <span className="min-w-0 flex-1">
                  <span className="block line-clamp-2 text-sm font-medium text-fg" title={m.description}>{m.description}</span>
                  <span className="block text-xs text-muted">{lessonFor(m.objectiveId) ?? "Yêu cầu cần đạt"} · {m.samples} lượt chấm</span>
                </span>
              </li>
            );
          })}
        </ul>
      )}
      {suggestions.length > 0 && (
        <>
          <h3 className="mt-6 text-xs font-semibold uppercase tracking-wide text-muted">Nên làm ở tiết sau</h3>
          <ol className="mt-2 space-y-3">
            {suggestions.map((s) => {
              const links = suggestionLinks(s.objectiveId);
              const m = /^(\d+)% (.*)$/.exec(s.trigger);
              return (
                <li key={s.id} className="rounded-xl border-l-4 border-warning bg-warning/5 p-3">
                  <p className="text-sm text-fg">
                    {m ? <><span className="text-lg font-bold text-warning-fg">{m[1]}%</span> {m[2]}</> : <span className="font-semibold">{s.trigger}</span>}
                  </p>
                  <p className="mt-1 text-sm text-muted">{s.suggestion}</p>
                  <span className="mt-2 flex flex-wrap gap-3 text-xs font-semibold">
                    <Link href={links.plan} className="inline-flex items-center gap-1 text-cyan-fg hover:underline"><NotebookPen className="size-3.5" aria-hidden /> Thêm vào KHBD</Link>
                    <Link href={links.quiz} className="inline-flex items-center gap-1 text-cyan-fg hover:underline"><ClipboardList className="size-3.5" aria-hidden /> Giao bài luyện tập</Link>
                  </span>
                </li>
              );
            })}
          </ol>
        </>
      )}
      <Link href="/teacher/analytics" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-cyan-fg hover:underline">Xem kết quả học tập chi tiết <ArrowRight className="size-4" aria-hidden /></Link>
    </section>
  );
}
