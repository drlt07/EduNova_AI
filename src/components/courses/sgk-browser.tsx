"use client";
import Link from "next/link";
import { ArrowRight, BookOpen, FlaskConical, ListChecks, NotebookPen, Plus, SlidersHorizontal, Trophy } from "lucide-react";
import type { Grade } from "@/lib/domain/types";
import { SGK_KNTT, sgkCount, sgkLabs, sgkLessonId, sgkRef } from "@/lib/data/sgk-kntt";
import { hsgCount } from "@/lib/data/hsg";
import { cn } from "@/lib/utils";
import { HsgCatalog } from "@/components/algo/hsg-catalog";
import { Button } from "@/components/ui/button";

const GRADE_TILE: Record<Grade, { title: string; tone: string; ring: string }> = {
  10: { title: "Dữ liệu và lập trình Python", tone: "from-cyan/30 via-cyan/10", ring: "ring-cyan" },
  11: { title: "Máy tính và cơ sở dữ liệu", tone: "from-blue/30 via-blue/10", ring: "ring-blue" },
  12: { title: "AI, mạng và thiết kế web", tone: "from-violet/30 via-violet/10", ring: "ring-violet" },
};

/** Màu cho từng chủ đề, xoay vòng như các khối màu ở trang chủ. */
const TOPIC_TONE = [
  { band: "from-cyan/30 to-cyan/5", chip: "bg-cyan/15 text-cyan-fg" },
  { band: "from-blue/30 to-blue/5", chip: "bg-blue/15 text-blue-fg" },
  { band: "from-violet/30 to-violet/5", chip: "bg-violet/15 text-violet-fg" },
  { band: "from-success/30 to-success/5", chip: "bg-success/15 text-success-fg" },
  { band: "from-warning/30 to-warning/5", chip: "bg-warning/15 text-warning-fg" },
  { band: "from-danger/30 to-danger/5", chip: "bg-danger/15 text-danger-fg" },
];

export type Track = Grade | "hsg";

/**
 * Chọn khối lớp → mục lục SGK Kết nối tri thức theo chủ đề, mỗi bài kèm bài tương tác, mô phỏng và lối soạn KHBD.
 * Ô thứ tư "HSG" mở các chuyên đề bồi dưỡng học sinh giỏi với mô phỏng thuật toán.
 */
export function SgkBrowser({ grade: track, onGrade, onCreate, onOpenLesson, stats }: { grade: Track; onGrade: (g: Track) => void; onCreate: (g: Grade) => void; onOpenLesson?: (ref: string) => void; stats?: (ref: string) => { quizzes: number; extraLabs: number } }) {
  const hsg = hsgCount();
  return (
    <section aria-labelledby="sgk-h" className="mb-10">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-cyan-fg">Chương trình SGK · Kết nối tri thức</p>
          <h2 id="sgk-h" className="text-2xl font-bold text-fg">Chọn khối lớp</h2>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" role="group" aria-label="Khối lớp">
        {([10, 11, 12] as Grade[]).map((g) => {
          const c = sgkCount(g);
          const on = g === track;
          return (
            <button
              key={g}
              type="button"
              aria-pressed={on}
              onClick={() => onGrade(g)}
              className={cn(
                "group relative overflow-hidden rounded-3xl border bg-gradient-to-br to-transparent p-5 text-left transition-all hover:-translate-y-0.5",
                GRADE_TILE[g].tone,
                on ? cn("border-transparent shadow-[0_18px_50px_-24px_var(--cyan)] ring-2", GRADE_TILE[g].ring) : "border-line opacity-80 hover:opacity-100",
              )}
            >
              <span className="flex items-baseline gap-3">
                <span className="text-5xl font-extrabold text-gradient tabular-nums">{g}</span>
                <span className="min-w-0">
                  <span className="block text-lg font-bold text-fg">Tin học {g}</span>
                  <span className="block text-sm text-muted">{GRADE_TILE[g].title}</span>
                </span>
              </span>
              <span className="mt-4 flex flex-wrap gap-1.5 text-xs font-medium">
                <span className="rounded-full bg-surface/80 px-2.5 py-1 text-fg">{c.topics} chủ đề</span>
                <span className="rounded-full bg-surface/80 px-2.5 py-1 text-fg">{c.lessons} bài</span>
                <span className="rounded-full bg-surface/80 px-2.5 py-1 text-cyan-fg">{c.linked} bài tương tác</span>
              </span>
              {on && <span className="absolute right-4 top-4 rounded-full bg-fg px-2.5 py-0.5 text-[11px] font-semibold text-bg">Đang xem</span>}
            </button>
          );
        })}
        <button
          type="button"
          aria-pressed={track === "hsg"}
          onClick={() => onGrade("hsg")}
          className={cn(
            "group relative overflow-hidden rounded-3xl border bg-gradient-to-br from-warning/30 via-warning/10 to-transparent p-5 text-left transition-all hover:-translate-y-0.5",
            track === "hsg" ? "border-transparent shadow-[0_18px_50px_-24px_var(--warning)] ring-2 ring-warning" : "border-line opacity-80 hover:opacity-100",
          )}
        >
          <span className="flex items-baseline gap-3">
            <span className="grid size-12 shrink-0 place-items-center self-center rounded-2xl bg-gradient-to-br from-warning to-danger text-white shadow-sm"><Trophy className="size-6" aria-hidden /></span>
            <span className="min-w-0">
              <span className="block text-lg font-bold text-fg">Bồi dưỡng HSG</span>
              <span className="block text-sm text-muted">Thuật toán nổi bật</span>
            </span>
          </span>
          <span className="mt-4 flex flex-wrap gap-1.5 text-xs font-medium">
            <span className="rounded-full bg-surface/80 px-2.5 py-1 text-fg">{hsg.topics} chuyên đề</span>
            <span className="rounded-full bg-surface/80 px-2.5 py-1 text-warning-fg">{hsg.algos} mô phỏng thuật toán</span>
          </span>
          {track === "hsg" && <span className="absolute right-4 top-4 rounded-full bg-fg px-2.5 py-0.5 text-[11px] font-semibold text-bg">Đang xem</span>}
        </button>
      </div>

      {track === "hsg" ? (
        <>
          <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="flex items-center gap-2 text-xl font-bold text-fg"><Trophy className="size-5 text-warning-fg" aria-hidden /> Chuyên đề bồi dưỡng học sinh giỏi</h3>
              <p className="text-sm text-muted">Mỗi thuật toán chạy từng bước theo code Python, có chế độ dự đoán để học sinh đoán bước tiếp theo. Học sinh mở được ở mục Tình huống mô phỏng.</p>
            </div>
            <Button asChild variant="secondary"><Link href="/thuat-toan">Trang chuyên đề <ArrowRight /></Link></Button>
          </div>
          <div className="mt-4"><HsgCatalog /></div>
        </>
      ) : (
        <GradeToc grade={track} onCreate={onCreate} onOpenLesson={onOpenLesson} stats={stats} />
      )}
    </section>
  );
}

function GradeToc({ grade, onCreate, onOpenLesson, stats }: { grade: Grade; onCreate: (g: Grade) => void; onOpenLesson?: (ref: string) => void; stats?: (ref: string) => { quizzes: number; extraLabs: number } }) {
  const count = sgkCount(grade);
  return (
    <>
      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-xl font-bold text-fg">Mục lục SGK Tin học {grade}</h3>
          <p className="text-sm text-muted">
            {count.topics} chủ đề · {count.lessons} bài{grade !== 10 && " · phần chung cho mọi học sinh (phần theo định hướng Tin học ứng dụng / Khoa học máy tính sẽ bổ sung)"}
          </p>
        </div>
        <Button onClick={() => onCreate(grade)}><Plus /> Tạo khóa học Tin {grade} theo SGK</Button>
      </div>

      <div className="mt-4 gap-4 lg:columns-2 [&>*]:mb-4">
        {SGK_KNTT[grade].map((t, ti) => {
          const tone = TOPIC_TONE[ti % TOPIC_TONE.length];
          return (
            <article key={t.no} className="break-inside-avoid overflow-hidden rounded-2xl border border-line bg-surface">
              <header className={cn("flex items-center gap-3 bg-gradient-to-r px-5 py-4", tone.band)}>
                <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-bold", tone.chip)}>Chủ đề {t.no}</span>
                <h4 className="min-w-0 flex-1 font-semibold text-fg">{t.title}</h4>
                <span className="text-xs text-muted">{t.lessons.length} bài</span>
              </header>
              <ol className="divide-y divide-line">
                {t.lessons.map((l) => {
                  const id = sgkLessonId(l);
                  const labs = sgkLabs(l);
                  const st = stats?.(sgkRef(grade, l));
                  return (
                    <li key={l.no} className="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-5 py-2.5 transition-colors hover:bg-surface-2/50">
                      <span className={cn("grid h-8 w-12 shrink-0 place-items-center rounded-lg text-[11px] font-bold leading-none", tone.chip)} aria-hidden>Bài {l.no}</span>
                      <span className="min-w-0 flex-1">
                        <button type="button" onClick={() => onOpenLesson?.(sgkRef(grade, l))} className="block text-left text-sm font-medium text-fg hover:text-cyan-fg"><span className="sr-only">Bài {l.no}. </span>{l.title}</button>
                        {(id || labs.length > 0 || st?.quizzes || st?.extraLabs) ? (
                          <span className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-muted">
                            {id && <span className="inline-flex items-center gap-1 text-cyan-fg"><BookOpen className="size-3" aria-hidden /> Bài tương tác</span>}
                            {labs.map((lab) => <span key={lab.id} className="inline-flex items-center gap-1 text-violet-fg"><FlaskConical className="size-3" aria-hidden /> {lab.title}</span>)}
                            {!!st?.extraLabs && <span className="inline-flex items-center gap-1 text-violet-fg"><FlaskConical className="size-3" aria-hidden /> +{st.extraLabs} mô phỏng thầy cô gắn</span>}
                            {!!st?.quizzes && <span className="inline-flex items-center gap-1 text-success-fg"><ListChecks className="size-3" aria-hidden /> {st.quizzes} bộ câu hỏi</span>}
                          </span>
                        ) : null}
                      </span>
                      <span className="flex w-full gap-1.5 pl-[60px] sm:w-auto sm:pl-0">
                        <button type="button" onClick={() => onOpenLesson?.(sgkRef(grade, l))} className="inline-flex items-center gap-1 rounded-lg border border-line px-2 py-1 text-xs font-medium text-fg hover:border-cyan/40"><SlidersHorizontal className="size-3" aria-hidden /> Mô phỏng, câu hỏi…</button>
                        {id && <Link href={`/teacher/lesson-planner/assistant?lesson=${id}`} className="inline-flex items-center gap-1 rounded-lg bg-cyan/15 px-2 py-1 text-xs font-semibold text-cyan-fg hover:bg-cyan/25"><NotebookPen className="size-3" aria-hidden /> Soạn KHBD</Link>}
                      </span>
                    </li>
                  );
                })}
              </ol>
            </article>
          );
        })}
      </div>
    </>
  );
}
