"use client";
import Link from "next/link";
import { Suspense, useMemo, useState } from "react";
import { CalendarClock, CheckCircle2, ClipboardList, Code2, Dumbbell, FlaskConical, Globe, ListChecks, Lock, MousePointerClick, Terminal } from "lucide-react";
import { CODING_EXERCISES } from "@/lib/data/coding-exercises";
import { DIFFICULTY_LABEL } from "@/lib/data/curriculum";
import { PRACTICE_SETS, getQuestion } from "@/lib/data/practice";
import { findSgk, sgkRefForKey } from "@/lib/data/sgk-kntt";
import { codeKey, setKey } from "@/lib/access/unlocks";
import { useAccess } from "@/lib/access/use-access";
import { MISSION_STATUS_LABEL, studentMissions } from "@/lib/store/student";
import { studentClassIds } from "@/lib/store/scoped";
import { useSessionData } from "@/lib/store/use-role";
import { cn, relativeDays } from "@/lib/utils";
import { SectionHead } from "@/components/layout/section-head";
import { Button } from "@/components/ui/button";
import { PageSkeleton } from "@/components/ui/feedback";

type Kind = "quiz" | "proc" | "code" | "teacher" | "mission";
type Status = "new" | "doing" | "done";
interface Tile { id: string; kind: Kind; title: string; sub: string; href: string; status: Status; result?: string; group: string; due?: string }

const KIND: Record<Kind, { label: string; icon: React.ComponentType<{ className?: string }>; bg: string }> = {
  quiz: { label: "Trắc nghiệm", icon: ListChecks, bg: "from-[#2563eb] to-[#06b6d4]" },
  proc: { label: "Trắc nghiệm + thao tác", icon: MousePointerClick, bg: "from-[#0d9488] to-[#22c55e]" },
  code: { label: "Lập trình Python", icon: Code2, bg: "from-[#1e293b] to-[#475569]" },
  teacher: { label: "Thầy cô soạn", icon: ClipboardList, bg: "from-[#7c3aed] to-[#db2777]" },
  mission: { label: "Nhiệm vụ", icon: FlaskConical, bg: "from-[#ea580c] to-[#f59e0b]" },
};
const STATUS: Record<Status, { label: string; cls: string }> = {
  new: { label: "Chưa làm", cls: "bg-white/90 text-slate-700" },
  doing: { label: "Đang làm", cls: "bg-amber-300 text-amber-950" },
  done: { label: "Đã xong", cls: "bg-emerald-300 text-emerald-950" },
};
const FILTERS: [Status | "all", string][] = [["all", "Tất cả"], ["new", "Chưa làm"], ["doing", "Đang làm"], ["done", "Đã xong"]];

const groupName = (ref?: string) => { const f = ref ? findSgk(ref) : undefined; return f ? `Tin ${f.grade} · Bài ${f.lesson.no}. ${f.lesson.title}` : "Bài tập khác"; };
const groupOrder = (g: string) => { const m = g.match(/Tin (\d+) · Bài (\d+)/); return m ? Number(m[1]) * 100 + Number(m[2]) : -1; };

/** Luyện tập: lưới ô bài tập thầy cô đã mở hoặc giao; bấm một ô là vào làm. */
function PracticeHub() {
  const { d, user } = useSessionData();
  const access = useAccess();
  const [filter, setFilter] = useState<Status | "all">("all");

  const { missions, tiles, locked } = useMemo(() => {
    const mine = studentClassIds(d, user.id);
    const lastAttempt = (id: string) => d.practiceAttempts.filter((a) => a.studentId === user.id && a.setId === id).sort((a, b) => b.finishedAt.localeCompare(a.finishedAt))[0];
    const quizTile = (id: string, title: string, n: number, kind: Kind, group: string): Tile => {
      const last = lastAttempt(id);
      const scored = last?.items.filter((i) => i.status !== "self") ?? [];
      const ok = scored.filter((i) => i.status === "correct").length;
      return { id, kind, title, sub: `${n} câu`, href: `/student/practice/${id}?che-do=practice`, status: !last ? "new" : ok / Math.max(1, scored.length) >= 0.8 ? "done" : "doing", result: last ? `${ok}/${scored.length} câu đúng` : undefined, group };
    };
    const missions: Tile[] = studentMissions(d, user.id).filter((m) => m.status !== "closed").map((m) => ({
      id: m.assignment.id, kind: m.assignment.task?.kind === "code" ? "code" : m.assignment.task?.kind === "quiz" ? "quiz" : "mission", title: m.assignment.title, sub: MISSION_STATUS_LABEL[m.status].label,
      href: `/student/missions/${m.assignment.id}`, status: ["submitted", "graded"].includes(m.status) ? "done" : m.status === "not_started" ? "new" : "doing", group: "", due: m.assignment.dueAt,
    }));
    const teacher = d.teacherQuizzes.filter((q) => q.status === "published" && q.classIds.some((c) => mine.includes(c))).map((q) => quizTile(q.id, q.title, q.questions.length, "teacher", groupName(q.sgkRef)));
    const sets = PRACTICE_SETS.filter((s) => access.can(setKey(s.id))).map((s) => {
      const proc = s.questionIds.some((x) => getQuestion(x)?.kind === "interactive");
      return quizTile(s.id, s.sgkRef ? "Luyện tập cả bài" : s.title, s.questionIds.length, proc ? "proc" : "quiz", groupName(s.sgkRef ?? sgkRefForKey(s.lessonKey)));
    });
    const code = CODING_EXERCISES.filter((e) => access.can(codeKey(e.id))).map((e): Tile => {
      const w = d.codeWorks.find((c) => c.studentId === user.id && c.exerciseId === e.id);
      const solved = !!w?.lastRun && w.lastRun.total > 0 && w.lastRun.passed === w.lastRun.total;
      return { id: e.id, kind: "code", title: e.title, sub: `${e.topic} · ${DIFFICULTY_LABEL[e.difficulty]}`, href: `/student/code?bai=${e.id}`, status: solved ? "done" : w ? "doing" : "new", result: w?.lastRun ? `${w.lastRun.passed}/${w.lastRun.total} test đạt` : undefined, group: groupName(sgkRefForKey(e.lessonKey)) };
    });
    const locked = PRACTICE_SETS.filter((s) => !access.can(setKey(s.id))).length + CODING_EXERCISES.filter((e) => !access.can(codeKey(e.id))).length;
    return { missions, tiles: [...teacher, ...sets, ...code], locked };
  }, [d, user.id, access]);

  const all = [...missions, ...tiles];
  const done = all.filter((t) => t.status === "done").length;
  const pass = (t: Tile) => filter === "all" || t.status === filter;
  // Bài mới mở (bài sau trong sách) lên trước
  const groups = [...new Set(tiles.filter(pass).map((t) => t.group))].sort((a, b) => groupOrder(b) - groupOrder(a));
  const shownMissions = missions.filter(pass);

  return (
    <>
      <SectionHead icon={Dumbbell} title="Luyện tập" subtitle="Bài tập thầy cô đã mở cho lớp em. Bấm vào một ô để bắt đầu." actions={<><Button asChild variant="secondary"><Link href="/student/code?bai=tu-do"><Terminal /> Sân chơi Python</Link></Button><Button asChild variant="ghost"><Link href="/student/code?che-do=web"><Globe /> HTML/CSS</Link></Button></>} />

      <section className="mb-6 flex flex-wrap items-center gap-4 rounded-2xl border border-line bg-gradient-to-r from-brand/10 via-cyan/5 to-emerald-500/10 p-4">
        <div className="min-w-0 flex-1 basis-60">
          <p className="font-semibold text-fg">Em đã xong {done}/{all.length} bài tập</p>
          <div className="mt-2 h-2.5 max-w-md overflow-hidden rounded-full bg-surface-2"><div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500" style={{ width: `${all.length ? (done / all.length) * 100 : 0}%` }} /></div>
        </div>
        <div className="flex flex-wrap gap-1 rounded-xl bg-surface p-1 text-sm shadow-sm" role="group" aria-label="Lọc theo trạng thái">
          {FILTERS.map(([f, l]) => {
            const n = f === "all" ? all.length : all.filter((t) => t.status === f).length;
            return <button key={f} type="button" aria-pressed={filter === f} onClick={() => setFilter(f)} className={cn("rounded-lg px-3 py-1.5 font-medium", filter === f ? "bg-brand text-brand-ink" : "text-muted hover:text-fg")}>{l} <span className="text-xs opacity-80">{n}</span></button>;
          })}
        </div>
      </section>

      {shownMissions.length > 0 && (
        <section aria-labelledby="giao-h" className="mb-8">
          <h2 id="giao-h" className="mb-3 flex items-center gap-2 text-lg font-bold text-fg"><CalendarClock className="size-5 text-orange-500" aria-hidden /> Thầy cô giao, có hạn nộp</h2>
          <TileGrid tiles={shownMissions} />
        </section>
      )}

      {groups.map((g) => (
        <section key={g} aria-label={g} className="mb-8">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted">{g}</h2>
          <TileGrid tiles={tiles.filter((t) => t.group === g && pass(t))} />
        </section>
      ))}

      {all.length === 0 && <p className="rounded-2xl border border-dashed border-line p-8 text-center text-muted">Thầy cô chưa mở bài tập nào cho lớp em.</p>}
      {locked > 0 && filter === "all" && (
        <p className="flex items-center gap-2 rounded-2xl border border-dashed border-line bg-surface px-4 py-3 text-sm text-muted"><Lock className="size-4" aria-hidden /> Còn {locked} bài tập thầy cô chưa mở. Bài mới sẽ hiện ở đây khi lớp học tới.</p>
      )}
    </>
  );
}

function TileGrid({ tiles }: { tiles: Tile[] }) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
      {tiles.map((t) => {
        const K = KIND[t.kind];
        const S = STATUS[t.status];
        return (
          <li key={`${t.kind}-${t.id}`} className="min-w-0">
            <Link href={t.href} data-testid={`tile-${t.id}`} className={cn("group relative flex aspect-square flex-col overflow-hidden rounded-2xl bg-gradient-to-br p-3.5 text-white shadow-md transition-all hover:-translate-y-1 hover:shadow-xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/40 sm:p-4", K.bg)}>
              <K.icon aria-hidden className="pointer-events-none absolute -bottom-4 -right-4 size-24 opacity-15 transition-transform group-hover:scale-110" />
              <span className="flex items-start justify-between gap-2">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white/20"><K.icon className="size-5" aria-hidden /></span>
                <span className={cn("whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-bold", S.cls)}>{t.status === "done" && <CheckCircle2 className="mr-0.5 inline size-3" aria-hidden />}{S.label}</span>
              </span>
              <span className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-white/75">{K.label}</span>
              <span className="line-clamp-3 text-sm font-bold leading-snug sm:text-base">{t.title}</span>
              <span className="relative mt-auto text-xs text-white/90">{t.result ?? t.sub}{t.due ? ` · hạn ${relativeDays(t.due)}` : ""}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export default function PracticePage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <PracticeHub />
    </Suspense>
  );
}
