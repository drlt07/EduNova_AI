"use client";
import Link from "next/link";
import { Suspense, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, CheckCircle2, CircleDashed, ClipboardCheck, Code2, Database, Dumbbell, Gauge, Globe, ListChecks, Network, Search, Shuffle, Terminal, Timer } from "lucide-react";
import { CODING_EXERCISES } from "@/lib/data/coding-exercises";
import { DIFFICULTY_LABEL } from "@/lib/data/curriculum";
import { PRACTICE_SETS, KIND_LABEL, getQuestion } from "@/lib/data/practice";
import type { Difficulty } from "@/lib/domain/types";
import { useSessionData } from "@/lib/store/use-role";
import { studentClassIds } from "@/lib/store/scoped";
import { findSgk } from "@/lib/data/sgk-kntt";
import { cn, formatDate, matchesQuery } from "@/lib/utils";
import { SectionHead } from "@/components/layout/section-head";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/form";
import { PageSkeleton } from "@/components/ui/feedback";

const DIFF_TONE: Record<Difficulty, string> = { "co-ban": "text-success-fg", "trung-binh": "text-warning-fg", "nang-cao": "text-danger-fg" };
const DIFF_BAR: Record<Difficulty, string> = { "co-ban": "bg-success", "trung-binh": "bg-warning", "nang-cao": "bg-danger" };
const MODES = [
  { id: "practice", label: "Luyện tập", icon: ClipboardCheck, desc: "xem giải thích ngay" },
  { id: "adaptive", label: "Thích ứng", icon: Shuffle, desc: "câu sau theo phần còn yếu" },
  { id: "exam", label: "Kiểm tra", icon: Timer, desc: "tính giờ, khóa gia sư" },
] as const;
const OTHER = [
  { href: "/student/games/web-builder", icon: Globe, title: "HTML/CSS", desc: "Dựng trang web, xem kết quả ngay.", grade: 12 },
  { href: "/student/games/sql-detective", icon: Database, title: "Truy vấn SQL", desc: "Thám tử SQL: truy vấn chạy thật trên CSDL thư viện.", grade: 11 },
  { href: "/student/games/network-journey", icon: Network, title: "Thực hành mạng", desc: "Đấu nối LAN, theo gói tin, sửa lỗi bằng ping.", grade: 12 },
  { href: "/student/games/debug-detective", icon: Terminal, title: "Kiểm thử & gỡ lỗi", desc: "Thiết kế test bắt lỗi giá trị biên.", grade: 10 },
];
type Tab = "code" | "quiz" | "other";

/** Luyện tập kiểu trang chấm code: bảng bài có trạng thái, độ khó, lần nộp gần nhất, bộ lọc; trắc nghiệm và thực hành khác ở tab riêng. */
function PracticeHub() {
  const { d, user } = useSessionData();
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const tab = (["code", "quiz", "other"].includes(params.get("muc") ?? "") ? params.get("muc") : "code") as Tab;
  const [q, setQ] = useState("");
  const [topic, setTopic] = useState("");
  const [diff, setDiff] = useState("");
  const [status, setStatus] = useState("");

  const rows = useMemo(() => CODING_EXERCISES.map((e, i) => {
    const w = d.codeWorks.find((c) => c.studentId === user.id && c.exerciseId === e.id);
    const st = w?.lastRun ? (w.lastRun.passed === w.lastRun.total && w.lastRun.total > 0 ? "solved" : "tried") : w ? "tried" : "new";
    return { e, no: i + 1, w, st };
  }), [d.codeWorks, user.id]);
  const solved = rows.filter((r) => r.st === "solved").length;
  const nextUp = rows.find((r) => r.st === "tried") ?? rows.find((r) => r.st === "new");
  const topics = [...new Set(CODING_EXERCISES.map((e) => e.topic))];
  const shown = rows.filter((r) => matchesQuery(q, r.e.title, r.e.task, r.e.topic) && (!topic || r.e.topic === topic) && (!diff || r.e.difficulty === diff) && (!status || r.st === status));
  const myClasses = studentClassIds(d, user.id);
  const assigned = d.teacherQuizzes.filter((tq) => tq.status === "published" && tq.classIds.some((c) => myClasses.includes(c)));
  const setTab = (t: Tab) => router.replace(`${pathname}?muc=${t}`, { scroll: false });

  const tabs: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }>; count: string }[] = [
    { id: "code", label: "Lập trình Python", icon: Code2, count: `${solved}/${CODING_EXERCISES.length}` },
    { id: "quiz", label: "Trắc nghiệm", icon: ListChecks, count: String(PRACTICE_SETS.length + assigned.length) },
    { id: "other", label: "Thực hành khác", icon: Gauge, count: String(OTHER.length) },
  ];

  return (
    <>
      <SectionHead icon={Dumbbell} title="Luyện tập" subtitle="Viết code được chấm tự động bằng cách chạy thật, làm trắc nghiệm theo bài, thực hành SQL, mạng, web." actions={<Button asChild variant="secondary"><Link href="/student/code?bai=tu-do"><Terminal /> Sân chơi Python</Link></Button>} />
      <nav aria-label="Loại luyện tập" className="mb-5 overflow-x-auto">
        <ul className="flex w-max gap-1 rounded-2xl border border-line bg-surface p-1">
          {tabs.map((t) => (
            <li key={t.id}>
              <button type="button" aria-pressed={tab === t.id} onClick={() => setTab(t.id)} className={cn("flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition-colors", tab === t.id ? "bg-gradient-to-r from-[#22d3ee] to-[#4f7fff] text-[#04111f] shadow-sm" : "text-muted hover:bg-surface-2 hover:text-fg")}>
                <t.icon className="size-4" aria-hidden /> {t.label} <span className={cn("rounded-full px-1.5 text-xs font-bold", tab === t.id ? "bg-white/60" : "bg-surface-2")}>{t.count}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {tab === "code" && (
        <>
          <div className="mb-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
            <div className="rounded-2xl border border-line bg-surface p-4">
              <div className="flex items-baseline justify-between"><p className="text-sm font-semibold text-fg">Đã giải {solved}/{CODING_EXERCISES.length} bài</p><p className="text-xs text-muted">theo độ khó</p></div>
              <div className="mt-2 grid grid-cols-3 gap-3">
                {(["co-ban", "trung-binh", "nang-cao"] as Difficulty[]).map((k) => {
                  const all = rows.filter((r) => r.e.difficulty === k);
                  const ok = all.filter((r) => r.st === "solved").length;
                  return (
                    <div key={k}>
                      <p className={cn("text-xs font-semibold", DIFF_TONE[k])}>{DIFFICULTY_LABEL[k]} <span className="text-muted">{ok}/{all.length}</span></p>
                      <div className="mt-1 h-2 overflow-hidden rounded-full bg-surface-2"><div className={cn("h-full", DIFF_BAR[k])} style={{ width: `${all.length ? (ok / all.length) * 100 : 0}%` }} /></div>
                    </div>
                  );
                })}
              </div>
            </div>
            {nextUp && (
              <Link href={`/student/code?bai=${nextUp.e.id}`} className="group flex items-center gap-3 rounded-2xl border border-cyan/40 bg-gradient-to-br from-cyan/15 to-violet/10 p-4 transition-colors hover:border-cyan">
                <span className="min-w-0">
                  <span className="block text-xs font-semibold uppercase tracking-wide text-cyan-fg">{nextUp.st === "tried" ? "Làm tiếp" : "Bài nên làm tiếp"}</span>
                  <span className="block font-semibold text-fg">{nextUp.e.title}</span>
                  <span className="block text-xs text-muted">{nextUp.e.topic} · {DIFFICULTY_LABEL[nextUp.e.difficulty]}</span>
                </span>
                <ArrowRight className="size-5 shrink-0 text-cyan-fg transition-transform group-hover:translate-x-0.5" aria-hidden />
              </Link>
            )}
          </div>

          <div className="mb-3 flex flex-col gap-2 rounded-2xl border border-line bg-surface p-3 md:flex-row md:items-center">
            <label className="relative min-w-0 flex-1">
              <span className="sr-only">Tìm bài</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
              <Input className="pl-9" placeholder="Tìm bài theo tên, chủ đề…" value={q} onChange={(e) => setQ(e.target.value)} />
            </label>
            <div className="flex flex-wrap gap-2">
              <Select aria-label="Chủ đề" className="w-40" value={topic} onChange={(e) => setTopic(e.target.value)}><option value="">Mọi chủ đề</option>{topics.map((t) => <option key={t}>{t}</option>)}</Select>
              <Select aria-label="Độ khó" className="w-36" value={diff} onChange={(e) => setDiff(e.target.value)}><option value="">Mọi độ khó</option>{(["co-ban", "trung-binh", "nang-cao"] as Difficulty[]).map((k) => <option key={k} value={k}>{DIFFICULTY_LABEL[k]}</option>)}</Select>
              <Select aria-label="Trạng thái" className="w-36" value={status} onChange={(e) => setStatus(e.target.value)}><option value="">Mọi trạng thái</option><option value="solved">Đã giải</option><option value="tried">Đang làm</option><option value="new">Chưa làm</option></Select>
            </div>
          </div>
          <p className="mb-2 text-sm text-muted" aria-live="polite">{shown.length} bài</p>
          <div className="relative overflow-x-auto rounded-2xl border border-line bg-surface">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="border-b border-line text-left text-xs text-muted">
                <tr><th className="w-12 px-4 py-2.5 font-medium">TT</th><th className="px-2 py-2.5 font-medium">Bài</th><th className="px-2 py-2.5 font-medium">Chủ đề</th><th className="px-2 py-2.5 font-medium">Độ khó</th><th className="px-2 py-2.5 font-medium">Lần nộp gần nhất</th><th className="px-4 py-2.5"><span className="sr-only">Thao tác</span></th></tr>
              </thead>
              <tbody>
                {shown.map(({ e, no, w, st }) => (
                  <tr key={e.id} className="border-b border-line/60 last:border-0 hover:bg-surface-2/50">
                    <td className="px-4 py-3">
                      {st === "solved" ? <CheckCircle2 className="size-5 text-success-fg" aria-label="Đã giải" /> : st === "tried" ? <CircleDashed className="size-5 text-warning-fg" aria-label="Đang làm" /> : <span className="font-mono text-xs text-muted">{no}</span>}
                    </td>
                    <td className="px-2 py-3">
                      <Link href={`/student/code?bai=${e.id}`} className="font-semibold text-fg hover:text-cyan-fg">{e.title}</Link>
                      <p className="line-clamp-1 max-w-md text-xs text-muted">{e.task}</p>
                    </td>
                    <td className="px-2 py-3"><Badge>{e.topic}</Badge></td>
                    <td className={cn("px-2 py-3 text-xs font-semibold", DIFF_TONE[e.difficulty])}>{DIFFICULTY_LABEL[e.difficulty]}</td>
                    <td className="px-2 py-3 text-xs text-muted">{w?.lastRun ? <><b className={st === "solved" ? "text-success-fg" : "text-warning-fg"}>{w.lastRun.passed}/{w.lastRun.total} test</b> · {formatDate(w.lastRun.at)}</> : "—"}</td>
                    <td className="px-4 py-3 text-right"><Button asChild size="sm" variant={st === "solved" ? "ghost" : "secondary"}><Link href={`/student/code?bai=${e.id}`}>{st === "solved" ? "Xem lại" : st === "tried" ? "Làm tiếp" : "Giải bài"}</Link></Button></td>
                  </tr>
                ))}
                {shown.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-muted">Không có bài phù hợp bộ lọc.</td></tr>}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === "quiz" && (
        <>
          {assigned.length > 0 && (
            <section aria-labelledby="assigned-h" className="mb-6">
              <h2 id="assigned-h" className="mb-2 text-sm font-semibold uppercase tracking-wide text-violet-fg">Thầy cô giao</h2>
              <ul className="grid gap-3 lg:grid-cols-2">
                {assigned.map((tq) => {
                  const ref = findSgk(tq.sgkRef);
                  const done = d.practiceAttempts.filter((a) => a.studentId === user.id && a.setId === tq.id);
                  return (
                    <li key={tq.id} className="flex flex-col rounded-2xl border border-violet/40 bg-gradient-to-br from-violet/10 to-transparent p-4">
                      <p className="text-xs text-muted">{d.users.find((u) => u.id === tq.ownerId)?.name} · {ref ? `Tin ${ref.grade} – Bài ${ref.lesson.no}. ${ref.lesson.title}` : tq.sgkRef}</p>
                      <h3 className="mt-1 font-semibold text-fg">{tq.title}</h3>
                      <p className="text-xs text-muted">{tq.questions.length} câu{done.length ? ` · em đã làm ${done.length} lần` : " · chưa làm"}</p>
                      <div className="mt-3 flex gap-2">
                        <Button asChild size="sm"><Link href={`/student/practice/${tq.id}?che-do=practice`}>Luyện tập</Link></Button>
                        <Button asChild size="sm" variant="secondary"><Link href={`/student/practice/${tq.id}?che-do=exam`}>Kiểm tra</Link></Button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
          <p className="mb-4 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted">{MODES.map((m) => <span key={m.id} className="flex items-center gap-1.5"><m.icon className="size-3.5 text-cyan-fg" aria-hidden /><b className="text-fg">{m.label}</b>: {m.desc}</span>)}</p>
          <ul className="grid gap-4 lg:grid-cols-2">
            {PRACTICE_SETS.map((s) => {
              const attempts = d.practiceAttempts.filter((a) => a.studentId === user.id && a.setId === s.id).sort((a, b) => b.finishedAt.localeCompare(a.finishedAt));
              const last = attempts[0];
              const scored = last?.items.filter((i) => i.status !== "self") ?? [];
              const kinds = [...new Set(s.questionIds.map((qid) => getQuestion(qid)?.kind).filter(Boolean))];
              return (
                <li key={s.id} className="flex flex-col rounded-2xl border border-line bg-surface p-5">
                  <div className="flex flex-wrap gap-1.5"><Badge tone="blue">Lớp {s.grade}</Badge><Badge>{s.questionIds.length} câu</Badge></div>
                  <h3 className="mt-2 font-semibold text-fg">{s.title}</h3>
                  <p className="text-sm text-muted">{s.description}</p>
                  <p className="mt-2 text-xs text-muted">Dạng câu: {kinds.map((k) => KIND_LABEL[k!]).join(", ")}</p>
                  {last && <p className="mt-2 text-sm text-fg">Lần gần nhất ({formatDate(last.finishedAt)}): <b>{scored.filter((i) => i.status === "correct").length}/{scored.length}</b> câu đúng · {attempts.length} lần làm</p>}
                  <div className="mt-auto flex flex-wrap gap-2 pt-4">
                    {MODES.map((m, i) => (
                      <Button key={m.id} asChild size="sm" variant={i === 0 ? "primary" : "secondary"}>
                        <Link href={`/student/practice/${s.id}?che-do=${m.id}`} data-testid={`practice-${s.id}-${m.id}`}>{m.label}</Link>
                      </Button>
                    ))}
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}

      {tab === "other" && (
        <ul className="grid gap-4 sm:grid-cols-2">
          {OTHER.map((o) => (
            <li key={o.href}>
              <Link href={o.href} className="group flex h-full gap-4 rounded-2xl border border-line bg-surface p-5 transition-all hover:-translate-y-0.5 hover:border-cyan/40">
                <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-cyan/25 to-violet/20 text-cyan-fg"><o.icon className="size-6" aria-hidden /></span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-fg">{o.title} <Badge tone="blue" className="ml-1">Tin {o.grade}</Badge></span>
                  <span className="block text-sm text-muted">{o.desc}</span>
                </span>
                <ArrowRight className="size-4 shrink-0 self-center text-cyan-fg transition-transform group-hover:translate-x-0.5" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

export default function PracticePage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <PracticeHub />
    </Suspense>
  );
}
