"use client";
/**
 * Thư viện tình huống mô phỏng theo khối lớp: trước hết ba ô Tin học 10 / 11 / 12;
 * chọn một khối thì hiện các bài trong sách theo thứ tự, dưới tên mỗi bài là các mô phỏng của bài đó.
 */
import { useMemo } from "react";
import { ArrowLeft, ArrowRight, FlaskConical, Search, SearchX } from "lucide-react";
import type { Grade, LabTemplate } from "@/lib/domain/types";
import { LAB_TEMPLATES } from "@/lib/data/labs";
import { bookLessons, lessonSimSlugs } from "@/lib/sgk/book";
import { useQueryState } from "@/lib/use-query-state";
import { cn, matchesQuery } from "@/lib/utils";
import { LabCard, type LabProgress } from "@/components/labs/lab-card";
import { LabArt } from "@/components/labs/lab-art";
import { Input } from "@/components/ui/form";
import { EmptyState } from "@/components/ui/feedback";

const GRADES: Grade[] = [10, 11, 12];
const GRADE_BG: Record<Grade, string> = { 10: "from-[#2563eb] to-[#06b6d4]", 11: "from-[#4f46e5] to-[#7c3aed]", 12: "from-[#7c3aed] to-[#db2777]" };
const GRADE_SUB: Record<Grade, string> = { 10: "Dữ liệu, mạng, an toàn số, lập trình Python", 11: "Hệ điều hành, phần cứng, chia sẻ dữ liệu, CSDL và SQL", 12: "Trí tuệ nhân tạo, mạng máy tính, công dân số, thiết kế web" };

export interface SimGroup { ref: string; no: number; title: string; topic: string; labs: LabTemplate[] }

/** Các bài có mô phỏng của một khối (mỗi mô phỏng xếp ở bài đầu tiên dùng nó) và mô phỏng chưa gắn bài. */
export function simsByLesson(grade: Grade) {
  const seen = new Set<string>();
  const groups: SimGroup[] = [];
  for (const e of bookLessons(grade)) {
    const labs = lessonSimSlugs(e).map((s) => LAB_TEMPLATES.find((l) => l.slug === s)).filter((l): l is LabTemplate => !!l && !seen.has(l.slug));
    labs.forEach((l) => seen.add(l.slug));
    if (labs.length) groups.push({ ref: e.ref, no: e.lesson.no, title: e.lesson.title, topic: `Chủ đề ${e.topic.no}. ${e.topic.title}`, labs });
  }
  const other = LAB_TEMPLATES.filter((l) => l.grades.includes(grade) && !seen.has(l.slug));
  return { groups, other, total: seen.size + other.length };
}

interface Props {
  hrefFor: (lab: LabTemplate) => string | undefined;
  progressOf?: (lab: LabTemplate) => LabProgress;
  /** Chỉ hiện mô phỏng thỏa điều kiện (vd học sinh: chỉ mô phỏng thầy cô đã giao). */
  filter?: (lab: LabTemplate) => boolean;
  /** Nút thêm dưới mỗi thẻ (vd giáo viên: giao, mở cho lớp). */
  extra?: (lab: LabTemplate, ref?: string) => React.ReactNode;
  /** Lời nhắn khi một khối chưa có mô phỏng nào hiện. */
  emptyText?: string;
}

export function SimLibrary({ hrefFor, progressOf, filter, extra, emptyText = "Không có mô phỏng phù hợp." }: Props) {
  const [lop, setLop] = useQueryState("lop");
  const [q, setQ] = useQueryState("q");
  const grade = GRADES.find((g) => String(g) === lop);
  const data = useMemo(() => Object.fromEntries(GRADES.map((g) => {
    const x = simsByLesson(g);
    if (!filter) return [g, x];
    const groups = x.groups.map((gr) => ({ ...gr, labs: gr.labs.filter(filter) })).filter((gr) => gr.labs.length);
    const other = x.other.filter(filter);
    return [g, { groups, other, total: groups.reduce((n, gr) => n + gr.labs.length, 0) + other.length }];
  })) as Record<Grade, ReturnType<typeof simsByLesson>>, [filter]);
  const card = (l: LabTemplate, ref?: string) => {
    const href = hrefFor(l);
    if (!href) return null;
    return <div key={l.slug} className="flex min-w-0 flex-col gap-2"><LabCard lab={l} href={href} progress={progressOf?.(l)} />{extra?.(l, ref)}</div>;
  };

  if (!grade) {
    const shown = GRADES.filter((g) => !filter || data[g].total > 0);
    if (!shown.length) return <EmptyState icon={FlaskConical} title="Chưa có mô phỏng" description={emptyText} />;
    return (
      <ul className="grid gap-5 md:grid-cols-3">
        {shown.map((g) => {
          const x = data[g];
          const arts = [...x.groups.flatMap((gr) => gr.labs), ...x.other].slice(0, 3);
          const done = progressOf ? [...x.groups.flatMap((gr) => gr.labs), ...x.other].filter((l) => progressOf(l)?.done).length : null;
          return (
            <li key={g}>
              <button type="button" onClick={() => setLop(String(g))} data-testid={`sim-grade-${g}`} className="group flex w-full flex-col overflow-hidden rounded-3xl border border-line bg-surface text-left shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl">
                <div className={cn("relative grid h-44 grid-cols-3 gap-2 bg-gradient-to-br p-4", GRADE_BG[g])}>
                  {arts.map((l) => <LabArt key={l.slug} slug={l.slug} className="h-full w-full rounded-xl object-cover opacity-90 ring-2 ring-white/30" />)}
                  <span className="absolute bottom-3 left-4 text-6xl font-black text-white drop-shadow">{g}</span>
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <h2 className="text-xl font-bold text-fg">Tin học {g}</h2>
                  <p className="mt-1 text-sm text-muted">{GRADE_SUB[g]}</p>
                  <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-fg"><span><b>{x.total}</b> mô phỏng</span><span><b>{x.groups.length}</b> bài có mô phỏng</span>{done !== null && <span className="text-success-fg"><b>{done}</b> em đã làm</span>}</p>
                  <span className="mt-4 inline-flex items-center gap-1.5 self-start rounded-xl bg-brand/10 px-4 py-2 text-sm font-semibold text-blue-fg transition-colors group-hover:bg-brand group-hover:text-brand-ink">Xem mô phỏng lớp {g} <ArrowRight className="size-4" aria-hidden /></span>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    );
  }

  const x = data[grade];
  const match = (l: LabTemplate) => matchesQuery(q, l.title, l.tagline, l.description, l.tags.join(" "));
  const groups = x.groups.map((gr) => ({ ...gr, labs: gr.labs.filter((l) => match(l) || matchesQuery(q, gr.title)) })).filter((gr) => gr.labs.length);
  const other = x.other.filter(match);
  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <button type="button" onClick={() => { setLop(""); setQ(""); }} className="inline-flex items-center gap-1 text-sm font-medium text-muted hover:text-fg"><ArrowLeft className="size-4" aria-hidden /> Tất cả khối lớp</button>
        <span className={cn("grid size-12 place-items-center rounded-2xl bg-gradient-to-br text-xl font-black text-white", GRADE_BG[grade])}>{grade}</span>
        <div className="min-w-0 flex-1"><h2 className="text-2xl font-bold text-fg">Mô phỏng Tin học {grade}</h2><p className="text-sm text-muted">{x.total} mô phỏng, xếp theo bài trong sách</p></div>
        <nav aria-label="Đổi khối" className="flex gap-1 rounded-xl border border-line bg-surface p-1">{GRADES.map((g) => <button key={g} type="button" aria-pressed={g === grade} onClick={() => setLop(String(g))} className={cn("rounded-lg px-3 py-1.5 text-sm font-medium", g === grade ? "bg-brand text-brand-ink" : "text-muted hover:text-fg")}>Lớp {g}</button>)}</nav>
      </div>
      <div className="relative mb-6 max-w-md">
        <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted" aria-hidden />
        <Input type="search" aria-label="Tìm mô phỏng" placeholder="Tìm theo tên bài hoặc mô phỏng…" value={q} onChange={(e) => setQ(e.target.value)} className="h-11 rounded-xl pl-11" />
      </div>
      {groups.length === 0 && other.length === 0 && <EmptyState icon={SearchX} title={q ? "Không có mô phỏng phù hợp" : "Chưa có mô phỏng"} description={q ? "Thử từ khóa khác." : emptyText} />}
      <div className="space-y-10">
        {groups.map((gr) => (
          <section key={gr.ref} aria-labelledby={`sim-${gr.ref}`}>
            <div className="mb-4 border-b-2 border-line pb-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">{gr.topic}</p>
              <h3 id={`sim-${gr.ref}`} className="mt-0.5 flex flex-wrap items-baseline gap-2 text-xl font-bold text-fg"><span className="rounded-lg bg-brand/10 px-2 py-0.5 text-base text-blue-fg">Bài {gr.no}</span>{gr.title}</h3>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">{gr.labs.map((l) => card(l, gr.ref))}</div>
          </section>
        ))}
        {other.length > 0 && (
          <section aria-labelledby="sim-other">
            <h3 id="sim-other" className="mb-4 flex items-center gap-2 border-b-2 border-line pb-2 text-xl font-bold text-fg"><FlaskConical className="size-5 text-muted" aria-hidden /> Mô phỏng mở rộng</h3>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">{other.map((l) => card(l))}</div>
          </section>
        )}
      </div>
    </div>
  );
}
