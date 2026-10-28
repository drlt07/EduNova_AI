"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { CalendarClock, Code2, FolderKanban, Gamepad2, ListChecks, Target, UserRound } from "lucide-react";
import { MISSION_STATUS_LABEL, studentMissions, type MissionStatus } from "@/lib/store/student";
import { useSessionData } from "@/lib/store/use-role";
import { formatDate, relativeDays } from "@/lib/utils";
import { getLab } from "@/lib/data/labs";
import { DIFFICULTY_LABEL, getLesson } from "@/lib/data/curriculum";
import { CODING_EXERCISES } from "@/lib/data/coding-exercises";
import { FARM_LEVELS, getGame } from "@/lib/data/games";
import { getSet } from "@/lib/data/practice";
import type { DemoData } from "@/lib/data/seed";
import { MODE_LABEL } from "@/lib/labels";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/feedback";
import { PageHeader } from "@/components/ui/misc";
import { FilterGroup } from "@/components/ui/tabs";

const GROUPS: Record<string, MissionStatus[]> = {
  todo: ["not_started", "in_progress", "paused"],
  done: ["submitted", "graded"],
  late: ["overdue", "closed"],
};

interface SelfItem { id: string; icon: typeof Code2; kind: string; title: string; detail: string; href: string; done: boolean; at: string }

/** Việc em tự chọn luyện (không do giáo viên giao). */
function selfChosen(d: DemoData, studentId: string): SelfItem[] {
  const out: SelfItem[] = [];
  for (const g of d.gameProgress.filter((x) => x.studentId === studentId)) out.push({ id: `g-${g.gameSlug}`, icon: Gamepad2, kind: "Trò chơi", title: getGame(g.gameSlug)?.title ?? g.gameSlug, detail: `Đã qua ${g.passed.length}/${FARM_LEVELS.length} cấp`, href: `/student/games/${g.gameSlug}`, done: g.passed.length >= FARM_LEVELS.length, at: g.updatedAt });
  for (const c of d.codeWorks.filter((x) => x.studentId === studentId)) {
    const ex = CODING_EXERCISES.find((e) => e.id === c.exerciseId);
    out.push({ id: `c-${c.id}`, icon: Code2, kind: "Lập trình", title: ex?.title ?? "Viết tự do", detail: c.lastRun ? `Đạt ${c.lastRun.passed}/${c.lastRun.total} kiểm thử` : "Chưa chạy kiểm thử", href: `/student/code?bai=${c.exerciseId}`, done: !!c.lastRun && c.lastRun.passed === c.lastRun.total, at: c.updatedAt });
  }
  const sets = new Map<string, DemoData["practiceAttempts"][number]>();
  for (const a of d.practiceAttempts.filter((x) => x.studentId === studentId)) if (!sets.has(a.setId) || sets.get(a.setId)!.finishedAt < a.finishedAt) sets.set(a.setId, a);
  for (const a of sets.values()) {
    const sc = a.items.filter((i) => i.status !== "self");
    const ok = sc.filter((i) => i.status === "correct").length;
    out.push({ id: `p-${a.setId}`, icon: ListChecks, kind: "Luyện tập", title: getSet(a.setId)?.title ?? d.teacherQuizzes.find((q) => q.id === a.setId)?.title ?? a.setId, detail: `Lần gần nhất ${ok}/${sc.length} câu đúng`, href: `/student/practice/${a.setId}`, done: sc.length > 0 && ok / sc.length >= 0.8, at: a.finishedAt });
  }
  for (const p of d.projects.filter((x) => x.studentId === studentId)) out.push({ id: `pj-${p.id}`, icon: FolderKanban, kind: "Dự án", title: p.title, detail: `${p.tasks.filter((t) => t.done).length}/${p.tasks.length} việc`, href: `/student/projects/${p.id}`, done: p.status === "done", at: p.updatedAt });
  return out.sort((a, b) => b.at.localeCompare(a.at));
}

export default function MissionsPage() {
  const { d, user } = useSessionData();
  const [source, setSource] = useState("teacher");
  const [tab, setTab] = useState("todo");
  const self = useMemo(() => selfChosen(d, user.id), [d, user.id]);
  const all = useMemo(() => studentMissions(d, user.id), [d, user.id]);
  const list = all.filter((m) => tab === "all" || GROUPS[tab].includes(m.status));
  return (
    <>
      <Link href="/student/courses" className="mb-2 inline-block text-sm font-medium text-cyan-fg hover:underline">← Khóa học của tôi</Link>
      <PageHeader title="Nhiệm vụ của tôi" description="Nhiệm vụ thầy cô giao và những việc em tự chọn luyện." />
      <div role="group" aria-label="Nguồn nhiệm vụ" className="mb-4 inline-flex gap-1 rounded-xl border border-line bg-surface-2 p-1">
        {[["teacher", `Giáo viên giao (${all.length})`], ["self", `Em tự chọn (${self.length})`]].map(([v, l]) => (
          <button key={v} type="button" aria-pressed={source === v} onClick={() => setSource(v)} className={source === v ? "rounded-lg bg-surface px-3 py-1.5 text-sm font-medium text-fg shadow-sm" : "rounded-lg px-3 py-1.5 text-sm font-medium text-muted"}>{l}</button>
        ))}
      </div>
      {source === "self" ? (
        self.length === 0 ? <EmptyState title="Em chưa tự luyện gì" description="Vào Trò chơi mô phỏng, Phòng lập trình, Luyện tập hoặc Xưởng dự án để bắt đầu." /> : (
          <ul className="grid gap-3 lg:grid-cols-2">
            {self.map((x) => (
              <li key={x.id}>
                <Link href={x.href} className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-4 transition-colors hover:border-cyan/40">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-cyan/15 text-cyan-fg"><x.icon className="size-5" aria-hidden /></span>
                  <span className="min-w-0 flex-1"><span className="block truncate font-medium text-fg">{x.title}</span><span className="text-xs text-muted">{x.kind} · {x.detail}</span></span>
                  <Badge tone={x.done ? "success" : "cyan"}>{x.done ? "Hoàn thành" : "Đang làm"}</Badge>
                </Link>
              </li>
            ))}
          </ul>
        )
      ) : (<>
      <FilterGroup
        label="Lọc nhiệm vụ"
        value={tab}
        onChange={setTab}
        options={[
          { value: "todo", label: `Cần làm (${all.filter((m) => GROUPS.todo.includes(m.status)).length})` },
          { value: "done", label: `Đã nộp (${all.filter((m) => GROUPS.done.includes(m.status)).length})` },
          { value: "late", label: `Quá hạn/đóng (${all.filter((m) => GROUPS.late.includes(m.status)).length})` },
          { value: "all", label: "Tất cả" },
        ]}
      />
      <div className="mt-5">
        {list.length === 0 ? <EmptyState icon={Target} title="Không có nhiệm vụ ở mục này" description={all.length === 0 ? "Lớp của bạn chưa được giao nhiệm vụ nào." : undefined} /> : (
          <ul className="grid gap-4 lg:grid-cols-2">
            {list.map(({ assignment: a, status, labConfig, klass, activity, lessonPlan }) => {
              const st = MISSION_STATUS_LABEL[status];
              const lab = labConfig && getLab(labConfig.labTemplateId);
              const teacher = d.users.find((u) => u.id === a.ownerId);
              const lesson = lessonPlan && getLesson(lessonPlan.lessonId);
              return (
                <li key={a.id} className="flex flex-col rounded-2xl border border-line bg-surface p-5">
                  <div className="flex flex-wrap gap-1.5">
                    <Badge tone={st.tone}>{st.label}</Badge>
                    <Badge tone="blue">{klass?.name}</Badge>
                    {labConfig && <Badge tone="cyan">{MODE_LABEL[labConfig.mode]}</Badge>}
                    {lab && <Badge>{lab.title}</Badge>}
                  </div>
                  <p className="mt-3 font-semibold text-fg">{a.title}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-muted">{activity?.instructions}</p>
                  <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted"><span className="flex items-center gap-1"><UserRound className="size-3.5" aria-hidden /> {teacher?.name ?? "Giáo viên"}</span>{lesson && <span>Độ khó: {DIFFICULTY_LABEL[lesson.difficulty]}</span>}</p>
                  <p className="mt-1 flex items-center gap-1 text-xs text-muted"><CalendarClock className="size-3.5" aria-hidden /> Hạn {formatDate(a.dueAt, true)} ({relativeDays(a.dueAt)})</p>
                  <div className="mt-auto pt-4">
                    <Button asChild size="sm" variant={status === "not_started" || status === "in_progress" || status === "paused" ? "primary" : "secondary"}>
                      <Link href={`/student/missions/${a.id}`} data-testid={`mission-${a.id}`}>
                        {status === "not_started" ? "Bắt đầu" : status === "in_progress" ? "Tiếp tục làm" : status === "paused" ? "Tiếp tục" : "Xem kết quả"}
                      </Link>
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      </>)}
    </>
  );
}
