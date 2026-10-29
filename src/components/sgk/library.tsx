"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, BookMarked, BookOpen, CheckCircle2, ClipboardList, Code2, FileText, FlaskConical, ListChecks, Lock, Play, Send } from "lucide-react";
import type { Grade } from "@/lib/domain/types";
import { ALGO_IDS } from "@/lib/data/hsg";
import { CODING_EXERCISES } from "@/lib/data/coding-exercises";
import { getLabBySlug } from "@/lib/data/labs";
import { PRACTICE_SETS, setsForLesson } from "@/lib/data/practice";
import { BOOKS, bookEntry, bookLessons, bookOf, contentCount, lessonChecks, lessonSimSlugs, type BookEntry } from "@/lib/sgk/book";
import { teacherClasses } from "@/lib/store/scoped";
import { useSessionData } from "@/lib/store/use-role";
import { cn, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { AlgoThumb } from "@/components/algo/hsg-catalog";
import { LabArt } from "@/components/labs/lab-art";
import { AssignDialog, type AssignPreset } from "@/components/teacher/assign-dialog";
import { lessonAssignables, lessonAssignments } from "./reader";
import { labKey, lessonKey } from "@/lib/access/unlocks";
import { useAccess } from "@/lib/access/use-access";

type Role = "teacher" | "student";
const base = (role: Role) => (role === "teacher" ? "/teacher/sgk" : "/student/sgk");

/** Bài đọc gần nhất của người dùng, để "tiếp tục". */
function useLastRead() {
  const { d, user } = useSessionData();
  const last = d.bookProgress.filter((p) => p.userId === user.id).sort((a, b) => b.at.localeCompare(a.at))[0];
  return last && { p: last, e: bookEntry(last.ref) };
}

export function SgkLibrary({ role }: { role: Role }) {
  const params = useSearchParams();
  const g = Number(params.get("lop"));
  if (g === 10 || g === 11 || g === 12) return <BookToc grade={g} role={role} />;
  return <Shelf role={role} />;
}

const GRADE_BG: Record<Grade, string> = { 10: "from-[#2563eb] to-[#38bdf8]", 11: "from-[#1d4ed8] to-[#4f46e5]", 12: "from-[#1e40af] to-[#0ea5e9]" };

/** Bài học theo khối: Tin học 10/11/12 → chủ đề → bài, trong bài có mô phỏng và câu hỏi luyện tập. */
function Shelf({ role }: { role: Role }) {
  const { d, user } = useSessionData();
  const last = useLastRead();
  const teacher = role === "teacher";
  const myGrades = teacher ? [...new Set(teacherClasses(d, user.id).map((c) => c.grade))] : [...new Set(d.classes.filter((c) => d.enrollments.some((e) => e.classId === c.id && e.studentId === user.id)).map((c) => c.grade))];
  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-fg">Khóa học</h1>
          <p className="mt-1 text-muted">{teacher ? "Chọn lớp → chủ đề → bài. Mỗi bài có kiến thức, mô phỏng, luyện tập và nút giao cho lớp." : "Học từng bài, làm mô phỏng và câu hỏi luyện tập ngay trong bài."}</p>
        </div>
        {teacher && <Button asChild variant="ghost" size="sm"><Link href="/teacher/courses"><BookMarked /> Khóa học tự soạn</Link></Button>}
      </div>

      {last?.e && (
        <Link href={`${base(role)}/${last.e.ref}`} className="group mb-8 flex items-center gap-4 rounded-2xl border border-line bg-surface p-4 transition-colors hover:border-brand/40">
          <span className={cn("grid size-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br text-xl font-extrabold text-white", GRADE_BG[last.e.grade])}>{last.e.grade}</span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-fg">{teacher ? "Tiếp tục bài dạy" : "Học tiếp"}</p>
            <p className="mt-0.5 text-lg font-bold text-fg">Bài {last.e.lesson.no}. {last.e.lesson.title}</p>
            <p className="text-sm text-muted">{bookOf(last.e.grade).title} · {formatDate(last.p.at)}</p>
          </div>
          <ArrowRight className="size-5 shrink-0 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-blue-fg" aria-hidden />
        </Link>
      )}

      <ul className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {BOOKS.map((b) => {
          const lessons = bookLessons(b.grade);
          const sims = new Set(lessons.flatMap((l) => lessonSimSlugs(l))).size;
          const sets = PRACTICE_SETS.filter((x) => x.grade === b.grade).length;
          const done = teacher ? new Set(d.taughtLessons.filter((t) => t.teacherId === user.id && t.ref.startsWith(`${b.grade}-`)).map((t) => t.ref)).size : d.bookProgress.filter((p) => p.userId === user.id && p.ref.startsWith(`${b.grade}-`)).length;
          const mine = myGrades.includes(b.grade);
          return (
            <li key={b.grade}>
              <Link href={`${base(role)}?lop=${b.grade}`} className="group flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-900/10">
                <div className={cn("relative h-36 bg-gradient-to-br p-4 text-white", GRADE_BG[b.grade])}>
                  <span aria-hidden className="absolute -bottom-6 right-3 text-[110px] font-extrabold leading-none text-white/15">{b.grade}</span>
                  <span className="flex items-start gap-1.5">
                    <span className="rounded-lg bg-white/20 px-2.5 py-1 text-xs font-bold uppercase tracking-wide">Lớp {b.grade}</span>
                    {mine && <span className="ml-auto rounded-lg bg-slate-950/40 px-2.5 py-1 text-xs font-medium">{teacher ? "Lớp của tôi" : "Lớp em"}</span>}
                  </span>
                  <p className="absolute bottom-4 left-4 flex items-center gap-3 text-sm font-medium"><span>{lessons.length} bài</span><span aria-hidden>•</span><span>{sims} mô phỏng</span></p>
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <h2 className="text-lg font-bold text-fg">{b.title}</h2>
                  <p className="mt-1 text-sm text-muted">{b.subtitle}</p>
                  <p className="mt-3 text-xs text-muted">{sets} bộ câu hỏi luyện tập · {contentCount(b.grade)} bài có nội dung</p>
                  <div className="mt-2 h-1.5 rounded-full bg-surface-2"><div className="h-full rounded-full bg-brand" style={{ width: `${(done / lessons.length) * 100}%` }} /></div>
                  <p className="mt-1 text-xs text-muted">{teacher ? `Đã dạy ${done}/${lessons.length} bài` : `Em đã học ${done}/${lessons.length} bài`}</p>
                  <span className="mt-4 inline-flex items-center gap-1.5 self-start rounded-xl bg-brand/10 px-4 py-2 text-sm font-semibold text-blue-fg transition-colors group-hover:bg-brand group-hover:text-brand-ink">Mở <ArrowRight className="size-4" aria-hidden /></span>
                </div>
              </Link>
            </li>
          );
        })}
        {!teacher && <li>
          <Link href="/thuat-toan" className="group flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-900/10">
            <div className="grid h-36 grid-cols-4 content-center gap-2 bg-gradient-to-br from-[#1e3a8a] to-[#3b82f6] p-4">{(["bubble", "bfs", "dijkstra", "knapsack"] as const).map((id) => <AlgoThumb key={id} id={id} className="h-auto w-full rounded-md bg-white/90" />)}</div>
            <div className="flex flex-1 flex-col p-5">
              <h2 className="text-lg font-bold text-fg">Chuyên đề HSG</h2>
              <p className="mt-1 text-sm text-muted">{ALGO_IDS.length} thuật toán chạy từng bước, đoán bước tiếp theo.</p>
              <span className="mt-4 inline-flex items-center gap-1.5 self-start rounded-xl bg-brand/10 px-4 py-2 text-sm font-semibold text-blue-fg transition-colors group-hover:bg-brand group-hover:text-brand-ink">Mở chuyên đề <ArrowRight className="size-4" aria-hidden /></span>
            </div>
          </Link>
        </li>}
      </ul>
    </div>
  );
}

function BookToc({ grade, role }: { grade: Grade; role: Role }) {
  const { d, user } = useSessionData();
  const access = useAccess();
  const router = useRouter();
  const params = useSearchParams();
  const teacher = role === "teacher";
  const book = bookOf(grade);
  const lessons = bookLessons(grade);
  const classes = teacher ? teacherClasses(d, user.id).filter((c) => c.grade === grade) : [];
  const topics = [...new Map(lessons.map((l) => [l.topic.no, l.topic])).values()];
  // Bài đang xem nhanh: theo URL, nếu không thì bài đọc gần nhất của khối, rồi bài đầu tiên có nội dung số.
  const lastHere = d.bookProgress.filter((p) => p.userId === user.id && p.ref.startsWith(`${grade}-`)).sort((a, b) => b.at.localeCompare(a.at))[0]?.ref;
  const isOpen = (ref: string) => teacher || access.can(lessonKey(ref));
  const opened = lessons.filter((l) => isOpen(l.ref));
  const sel = lessons.find((l) => l.ref === params.get("bai")) ?? lessons.find((l) => l.ref === lastHere) ?? opened.filter((l) => l.content).at(-1) ?? opened[0] ?? lessons[0];
  const pick = (ref: string) => router.replace(`${base(role)}?lop=${grade}&bai=${ref}`, { scroll: false });
  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end gap-4">
        <span className={cn("hidden size-20 shrink-0 place-items-center rounded-2xl bg-gradient-to-br text-3xl font-extrabold text-white sm:grid", GRADE_BG[grade])}>{grade}</span>
        <div className="min-w-0 flex-1 basis-64">
          <Link href={base(role)} className="inline-flex items-center gap-1 text-sm font-medium text-muted hover:text-fg"><ArrowLeft className="size-4" aria-hidden /> Tất cả khóa học</Link>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-fg">{book.title}</h1>
          <p className="text-sm text-muted">{book.subtitle} · {topics.length} chủ đề · {lessons.length} bài · {teacher ? `${contentCount(grade)} bài có nội dung` : <b className="text-fg">thầy cô đã mở {opened.length} bài</b>}</p>
        </div>
        <nav aria-label="Chọn khối" className="flex gap-1 rounded-xl border border-line bg-surface p-1">
          {BOOKS.map((b) => <Link key={b.grade} href={`${base(role)}?lop=${b.grade}`} aria-current={b.grade === grade ? "page" : undefined} className={cn("rounded-lg px-3 py-1.5 text-sm font-medium", b.grade === grade ? "bg-brand text-brand-ink" : "text-muted hover:text-fg")}>Lớp {b.grade}</Link>)}
          <Link href="/thuat-toan" className="rounded-lg px-3 py-1.5 text-sm font-medium text-muted hover:text-fg">HSG</Link>
        </nav>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
        {/* Danh sách bài: màn hình lớn chọn để xem nhanh, màn hình nhỏ mở thẳng bài */}
        <nav aria-label="Mục lục" className="rounded-2xl border border-line bg-surface p-2 lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto">
          {topics.map((t) => (
            <section key={t.no} aria-labelledby={`cd-${t.no}`} className="mb-2">
              <h2 id={`cd-${t.no}`} className="px-2 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-muted">Chủ đề {t.no}. {t.title}</h2>
              <ol className="space-y-0.5">
                {lessons.filter((l) => l.topic.no === t.no).map((l) => {
                  const sims = lessonSimSlugs(l).length;
                  const cur = l.ref === sel?.ref;
                  const taught = teacher && classes.filter((c) => d.taughtLessons.some((x) => x.teacherId === user.id && x.classId === c.id && x.ref === l.ref));
                  const read = !teacher && d.bookProgress.find((p) => p.userId === user.id && p.ref === l.ref);
                  if (!isOpen(l.ref)) return (
                    <li key={l.ref}>
                      <button type="button" onClick={() => pick(l.ref)} aria-current={cur ? "true" : undefined} className={cn("flex w-full items-baseline gap-2 rounded-xl border px-3 py-2 text-left", cur ? "border-line bg-surface-2" : "border-transparent")}>
                        <span className="w-12 shrink-0 text-xs font-semibold tabular-nums text-muted/70">Bài {l.lesson.no}</span>
                        <span className="min-w-0 flex-1 text-sm text-muted/80">{l.lesson.title}</span>
                        <Lock className="size-3.5 shrink-0 self-center text-muted/70" aria-label="chưa mở" />
                      </button>
                    </li>
                  );
                  return (
                    <li key={l.ref}>
                      <Link
                        href={`${base(role)}/${l.ref}`}
                        onClick={(ev) => { if (window.matchMedia("(min-width: 1024px)").matches) { ev.preventDefault(); pick(l.ref); } }}
                        aria-current={cur ? "true" : undefined}
                        className={cn("block rounded-xl border px-3 py-2 transition-colors", cur ? "border-brand/50 bg-brand/10" : "border-transparent hover:bg-surface-2")}
                      >
                        <span className="flex items-baseline gap-2">
                          <span className="w-12 shrink-0 text-xs font-semibold tabular-nums text-muted">Bài {l.lesson.no}</span>
                          <span className={cn("min-w-0 flex-1 text-sm font-medium", l.content ? "text-fg" : "text-fg/60")}>{l.lesson.title}</span>
                        </span>
                        <span className="ml-14 mt-0.5 flex flex-wrap gap-x-2 text-[11px] text-muted">
                          {l.content ? <span className="text-success-fg">Có nội dung</span> : <span>Chưa có nội dung</span>}
                          {sims > 0 && <span className="inline-flex items-center gap-0.5 text-cyan-fg"><FlaskConical className="size-3" aria-hidden />{sims}</span>}
                          {taught && taught.map((c) => <span key={c.id} className="inline-flex items-center gap-0.5 font-semibold text-success-fg"><CheckCircle2 className="size-3" aria-hidden />{c.name}</span>)}
                          {read && l.content && <span className="font-semibold text-success-fg">đã đọc {read.read.length}/{l.content.sections.length}</span>}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ol>
            </section>
          ))}
        </nav>

        <div className="hidden min-w-0 lg:block">{sel && <LessonPreview key={sel.ref} e={sel} role={role} />}</div>
      </div>
    </div>
  );
}

/** Xem nhanh một bài ngay trong mục lục: yêu cầu cần đạt, mô phỏng nổi bật, những gì có trong bài, các mục. */
function LessonPreview({ e, role }: { e: BookEntry; role: Role }) {
  const { d, user } = useSessionData();
  const access = useAccess();
  const [assign, setAssign] = useState<AssignPreset | null | undefined>(undefined);
  const teacher = role === "teacher";
  if (!teacher && !access.can(lessonKey(e.ref))) return (
    <article className="grid place-items-center rounded-2xl border border-dashed border-line bg-surface p-10 text-center">
      <span className="grid size-14 place-items-center rounded-2xl bg-surface-2"><Lock className="size-6 text-muted" aria-hidden /></span>
      <h2 className="mt-3 text-xl font-bold text-fg">Bài {e.lesson.no}. {e.lesson.title}</h2>
      <p className="mt-1 max-w-sm text-sm text-muted">Thầy cô chưa mở bài này cho lớp em. Bài sẽ hiện ra khi lớp học tới.</p>
    </article>
  );
  const href = `${base(role)}/${e.ref}`;
  const sims = [...new Set([...lessonSimSlugs(e), ...d.lessonLabs.filter((l) => l.sgkRef === e.ref && (!teacher || l.ownerId === user.id)).map((l) => l.slug)])].filter((s) => teacher || access.can(labKey(s))).map((s) => getLabBySlug(s)).filter((l): l is NonNullable<typeof l> => !!l);
  const checks = e.content ? lessonChecks(e.content).length : 0;
  const quizzes = setsForLesson(e.ref, e.lesson.key).length + d.teacherQuizzes.filter((q) => q.sgkRef === e.ref && (teacher ? q.ownerId === user.id : q.status === "published")).length;
  const code = e.lesson.key ? CODING_EXERCISES.filter((x) => x.lessonKey === e.lesson.key).length : 0;
  const tasks = teacher ? lessonAssignments(d, d.assignments.filter((a) => a.ownerId === user.id), user.id, e).length : 0;
  const progress = d.bookProgress.find((p) => p.userId === user.id && p.ref === e.ref);
  const sim = sims[0];
  const parts: { tab: string; label: string; n: number; icon: React.ComponentType<{ className?: string }> }[] = [
    { tab: "", label: "mục kiến thức", n: e.content?.sections.length ?? 0, icon: FileText },
    { tab: "mo-phong", label: "mô phỏng", n: sims.length, icon: FlaskConical },
    { tab: "luyen-tap", label: "câu hỏi luyện tập", n: checks + quizzes, icon: ListChecks },
    { tab: "luyen-tap", label: "bài lập trình", n: code, icon: Code2 },
    ...(teacher ? [{ tab: "nhiem-vu", label: "hoạt động đã giao", n: tasks, icon: ClipboardList }] : []),
  ];
  return (
    <article className="rounded-2xl border border-line bg-surface p-6">
      <div className="flex flex-wrap items-start gap-3 border-b border-line pb-4">
        <div className="min-w-0 flex-1 basis-64">
          <p className="text-xs font-medium text-muted"><span className="mr-1.5 rounded bg-brand/10 px-1.5 py-0.5 font-semibold text-cyan-fg">Bài {e.lesson.no}</span>Chủ đề {e.topic.no}. {e.topic.title}{e.content ? ` · ${e.content.periods} tiết` : ""}</p>
          <h2 className="mt-1.5 text-2xl font-bold text-fg">{e.lesson.title}</h2>
        </div>
        <span className="flex flex-wrap gap-2">
          {teacher && <Button size="sm" variant="secondary" onClick={() => setAssign(null)}><Send /> Giao</Button>}
          <Button asChild size="sm"><Link href={href}><BookOpen /> {teacher ? "Mở bài" : progress ? "Học tiếp" : "Vào bài"}</Link></Button>
        </span>
      </div>

      {e.content ? (
        <section className="mt-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">Yêu cầu cần đạt</h3>
          <ul className="mt-2 space-y-1.5 text-sm text-fg">{e.content.objectives.map((o) => <li key={o} className="flex gap-2"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success-fg" aria-hidden />{o}</li>)}</ul>
        </section>
      ) : <p className="mt-4 rounded-xl border border-dashed border-line p-4 text-sm text-muted">Bài này chưa có nội dung. {teacher ? "Thầy cô vẫn gắn mô phỏng, soạn câu hỏi và giao nhiệm vụ trong trang bài." : "Mô phỏng và nhiệm vụ của bài vẫn mở được trong trang bài."}</p>}

      {sim && (
        <section className="mt-5 flex flex-wrap items-center gap-4 rounded-2xl border border-cyan/30 bg-cyan/5 p-4">
          <LabArt slug={sim.slug} className="h-20 w-32 shrink-0 rounded-xl" />
          <div className="min-w-0 flex-1 basis-48">
            <p className="text-xs font-semibold uppercase tracking-wide text-cyan-fg">Mô phỏng của bài{sims.length > 1 ? ` · 1/${sims.length}` : ""}</p>
            <p className="font-semibold text-fg">{sim.title}</p>
            <p className="text-sm text-muted">{sim.tagline}</p>
          </div>
          <span className="flex flex-wrap gap-2">
            <Button asChild size="sm" variant="secondary"><Link href={`/labs/${sim.slug}`}><Play /> {teacher ? "Chạy thử" : "Làm"}</Link></Button>
            {teacher && <Button size="sm" onClick={() => setAssign({ kind: "lab", ref: sim.slug })}><Send /> Giao cho lớp</Button>}
          </span>
        </section>
      )}

      <section className="mt-5">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">Trong bài có</h3>
        <ul className="mt-2 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {parts.map((p) => (
            <li key={p.label}>
              <Link href={p.tab ? `${href}?tab=${p.tab}` : href} className="flex items-center gap-3 rounded-xl border border-line px-3 py-2.5 transition-colors hover:border-cyan/40">
                <p.icon className="size-4 shrink-0 text-muted" aria-hidden />
                <span className="text-lg font-bold tabular-nums text-fg">{p.n}</span>
                <span className="text-sm text-muted">{p.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {e.content && (
        <section className="mt-5">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">Các mục</h3>
          <ol className="mt-2 divide-y divide-line rounded-xl border border-line">
            {e.content.sections.map((s, i) => (
              <li key={s.id}>
                <Link href={`${href}#muc-${s.id}`} className="flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-surface-2">
                  <span className="w-5 text-right font-semibold tabular-nums text-cyan-fg">{i + 1}.</span>
                  <span className="min-w-0 flex-1 text-fg">{s.title}</span>
                  {progress?.read.includes(s.id) && <CheckCircle2 className="size-4 text-success-fg" aria-label="đã đọc" />}
                </Link>
              </li>
            ))}
          </ol>
        </section>
      )}
      {teacher && <AssignDialog open={assign !== undefined} onOpenChange={(o) => !o && setAssign(undefined)} preset={assign ?? undefined} sgkRef={e.ref} suggest={lessonAssignables(d, user.id, e)} />}
    </article>
  );
}
