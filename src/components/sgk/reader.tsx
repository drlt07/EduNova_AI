"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, BookOpen, Bot, CheckCircle2, ChevronRight, Circle, ClipboardList, Code2, FileText, FlaskConical, ListChecks, Lock, MonitorPlay, NotebookPen, PencilLine, Send, Star, Target, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Assignment } from "@/lib/domain/types";
import type { DemoData } from "@/lib/data/seed";
import { CODING_EXERCISES } from "@/lib/data/coding-exercises";
import { getLabBySlug } from "@/lib/data/labs";
import { getQuestion, KIND_LABEL, PRACTICE_SETS, type PracticeQuestion } from "@/lib/data/practice";
import { LessonCodeTab, LessonLabsTab, LessonQuizTab } from "@/components/courses/lesson-panel";
import { sgkLessonId } from "@/lib/data/sgk-kntt";
import { bookEntry, bookOf, itemKey, lessonChecks, lessonSimSlugs, neighbors, type BookEntry } from "@/lib/sgk/book";
import { fmtScore, labSummary } from "@/lib/sim/lab-score";
import { teacherClasses, assignedStudents, studentClassIds } from "@/lib/store/scoped";
import { useSessionData } from "@/lib/store/use-role";
import { taskOutcome } from "@/lib/teacher/assign";
import { cn, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/form";
import { EmptyState } from "@/components/ui/feedback";
import { AssignDialog, type AssignPreset } from "@/components/teacher/assign-dialog";
import { TutorScope, useTutor } from "@/components/tutor/tutor-provider";
import { Block, Rich, type BlockCtx } from "./blocks";
import { Presenter } from "./presenter";
import { LessonSims } from "@/components/lessons/lesson-sims";

type Role = "teacher" | "student";
type TabId = "noi-dung" | "mo-phong" | "cau-hoi" | "lap-trinh" | "khbd" | "nhiem-vu" | "luyen-tap";
const TAB_META: Record<TabId, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  "noi-dung": { label: "Nội dung", icon: FileText },
  "mo-phong": { label: "Mô phỏng", icon: FlaskConical },
  "cau-hoi": { label: "Câu hỏi luyện tập", icon: ListChecks },
  "lap-trinh": { label: "Bài lập trình", icon: Code2 },
  "luyen-tap": { label: "Luyện tập", icon: ListChecks },
  khbd: { label: "KHBD", icon: NotebookPen },
  "nhiem-vu": { label: "Nhiệm vụ & kết quả", icon: ClipboardList },
};
const TEACHER_TABS: TabId[] = ["noi-dung", "mo-phong", "cau-hoi", "lap-trinh", "khbd", "nhiem-vu"];
const STUDENT_TABS: TabId[] = ["noi-dung", "mo-phong", "luyen-tap", "nhiem-vu"];
const base = (role: Role) => (role === "teacher" ? "/teacher/sgk" : "/student/sgk");

/** Những gì giao được từ bài này: mô phỏng, bộ câu hỏi, bài code. */
export function lessonAssignables(d: DemoData, userId: string, e: BookEntry): AssignPreset[] {
  const sims = [...new Set([...lessonSimSlugs(e), ...d.lessonLabs.filter((l) => l.ownerId === userId && l.sgkRef === e.ref).map((l) => l.slug)])];
  return [
    ...sims.map((ref) => ({ kind: "lab" as const, ref })),
    ...d.teacherQuizzes.filter((q) => q.ownerId === userId && q.sgkRef === e.ref).map((q) => ({ kind: "quiz" as const, ref: q.id })),
    ...(e.lesson.key ? PRACTICE_SETS.filter((s) => s.lessonKey === e.lesson.key).map((s) => ({ kind: "quiz" as const, ref: s.id })) : []),
    ...(e.lesson.key ? CODING_EXERCISES.filter((x) => x.lessonKey === e.lesson.key).map((x) => ({ kind: "code" as const, ref: x.id })) : []),
  ];
}

/** Nhiệm vụ đã giao thuộc bài này (gắn bài khi giao, hoặc giao đúng nội dung của bài). */
export function lessonAssignments(d: DemoData, assignments: Assignment[], userId: string, e: BookEntry) {
  const items = lessonAssignables(d, userId, e);
  return assignments.filter((a) => a.sgkRef === e.ref || (a.task && items.some((i) => i.kind === a.task!.kind && i.ref === a.task!.ref)));
}

/** Theo dõi mục đang đọc để lưu tiến độ và "đọc tiếp". */
function useReadTracking(ids: string[], onSeen: (id: string) => void) {
  const key = ids.join(",");
  const cb = useRef(onSeen);
  useEffect(() => { cb.current = onSeen; });
  useEffect(() => {
    if (!key || typeof IntersectionObserver === "undefined") return;
    const obs = new IntersectionObserver((es) => { for (const x of es) if (x.isIntersecting) cb.current(x.target.id.replace(/^muc-/, "")); }, { rootMargin: "-35% 0px -55% 0px" });
    for (const id of key.split(",")) { const el = document.getElementById(`muc-${id}`); if (el) obs.observe(el); }
    return () => obs.disconnect();
  }, [key]);
}

function Notes({ refId, sectionId }: { refId: string; sectionId: string }) {
  const { d, user } = useSessionData();
  const notes = d.bookNotes.filter((n) => n.userId === user.id && n.ref === refId && n.sectionId === sectionId);
  const [text, setText] = useState<string | null>(null);
  return (
    <div className="mt-2 space-y-2">
      {notes.map((n) => (
        <div key={n.id} className="flex items-start gap-2 rounded-lg border-l-4 border-warning bg-warning/5 px-3 py-2 text-sm text-fg">
          <PencilLine className="mt-0.5 size-4 shrink-0 text-warning-fg" aria-hidden />
          <p className="min-w-0 flex-1 whitespace-pre-line">{n.text}</p>
          <button type="button" aria-label="Xóa ghi chú" onClick={() => d.deleteBookNote(n.id, user.id)} className="text-muted hover:text-danger-fg"><Trash2 className="size-4" /></button>
        </div>
      ))}
      {text !== null && (
        <div className="space-y-2">
          <Textarea autoFocus aria-label="Ghi chú cho mục này" className="min-h-[64px]" placeholder={user.role === "teacher" ? "Ví dụ: hỏi lớp dự đoán trước khi chạy; nhắc lỗi dấu hai chấm." : "Ghi lại điều em cần nhớ hoặc chưa hiểu."} value={text} onChange={(e) => setText(e.target.value)} />
          <div className="flex gap-2"><Button size="sm" onClick={() => { if (text.trim()) d.addBookNote({ userId: user.id, ref: refId, sectionId, text: text.trim() }); setText(null); }}>Lưu ghi chú</Button><Button size="sm" variant="ghost" onClick={() => setText(null)}>Hủy</Button></div>
        </div>
      )}
      {text === null && <button type="button" onClick={() => setText("")} className="inline-flex items-center gap-1 text-xs font-medium text-muted hover:text-fg"><PencilLine className="size-3.5" aria-hidden /> Thêm ghi chú</button>}
    </div>
  );
}

/** Trang một bài trong Khóa học: mọi thứ của bài (nội dung, mô phỏng, câu hỏi, lập trình, KHBD, nhiệm vụ) nằm trong các tab ngay dưới tên bài. */
export function BookReader({ refId, role }: { refId: string; role: Role }) {
  const { d, user } = useSessionData();
  const tutor = useTutor();
  const e = bookEntry(refId);
  const [present, setPresent] = useState(false);
  const [assign, setAssign] = useState<AssignPreset | null | undefined>(undefined);
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const tabs = role === "teacher" ? TEACHER_TABS : STUDENT_TABS;
  const tab = (tabs as string[]).includes(params.get("tab") ?? "") ? (params.get("tab") as TabId) : "noi-dung";
  const setTab = (t: TabId) => router.replace(t === "noi-dung" ? pathname : `${pathname}?tab=${t}`, { scroll: false });
  const markRead = d.markBookRead;
  const userId = user.id;
  const content = e?.content;
  const ids = content?.sections.map((s) => s.id) ?? [];
  useReadTracking(ids, (id) => markRead(userId, refId, id));

  if (!e) return <EmptyState icon={BookOpen} title="Không tìm thấy bài" action={<Button asChild><Link href={base(role)}>Về Khóa học</Link></Button>} />;
  const teacher = role === "teacher";
  const book = bookOf(e.grade);
  const { prev, next } = neighbors(refId);
  const progress = d.bookProgress.find((p) => p.userId === user.id && p.ref === refId);
  const picks = new Set(d.bookPicks.filter((p) => p.userId === user.id && p.key.startsWith(`${refId}#`)).map((p) => p.key));
  const ctx: BlockCtx = { teacher, picked: (k) => picks.has(k), onPick: (k) => { d.toggleBookPick(user.id, k); }, onAssign: (slug) => setAssign({ kind: "lab", ref: slug }) };
  const simKey = (slug: string) => `${refId}#sim:${slug}`;
  const ask = (section: string) => tutor.open({ title: `${book.title} · Bài ${e.lesson.no}. ${e.lesson.title} — ${section}`, capability: teacher ? "guide" : "explain" });
  const allSims = [...lessonSimSlugs(e), ...d.lessonLabs.filter((l) => l.sgkRef === refId && (teacher ? l.ownerId === user.id : true)).map((l) => l.slug)].filter((x, i, arr) => arr.indexOf(x) === i);
  const myAssignments = teacher ? lessonAssignments(d, d.assignments.filter((a) => a.ownerId === user.id), user.id, e) : studentLessonTasks(d, user.id, e);
  const quizCount = teacher ? (content ? lessonChecks(content).length : 0) + d.teacherQuizzes.filter((q) => q.ownerId === user.id && q.sgkRef === refId).length + (e.lesson.key ? PRACTICE_SETS.filter((x) => x.lessonKey === e.lesson.key).length : 0) : 0;
  const codeCount = e.lesson.key ? CODING_EXERCISES.filter((x) => x.lessonKey === e.lesson.key).length : 0;
  const counts: Partial<Record<TabId, number>> = { "mo-phong": allSims.length, "cau-hoi": quizCount, "lap-trinh": codeCount, "nhiem-vu": myAssignments.length, "luyen-tap": studentPractice(d, user.id, e).length + codeCount };
  const extraLabs = d.lessonLabs.filter((l) => l.sgkRef === refId && (teacher ? l.ownerId === user.id : true)).map((l) => getLabBySlug(l.slug)).filter((l): l is NonNullable<typeof l> => !!l && !lessonSimSlugs(e).includes(l.slug));

  return (
    <TutorScope title={`${book.title} · Bài ${e.lesson.no}. ${e.lesson.title}`} topic="general" level={teacher ? "free" : "guided"}>
      <nav aria-label="Vị trí" className="mb-3 flex flex-wrap items-center gap-1 text-xs text-muted">
        <Link href={base(role)} className="hover:text-fg">Khóa học</Link><ChevronRight className="size-3" aria-hidden />
        <Link href={`${base(role)}?lop=${e.grade}`} className="hover:text-fg">{book.title}</Link><ChevronRight className="size-3" aria-hidden />
        <span>Chủ đề {e.topic.no}. {e.topic.title}</span><ChevronRight className="size-3" aria-hidden />
        <span className="font-medium text-fg">Bài {e.lesson.no}</span>
      </nav>

      <header>
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-0 flex-1 basis-72">
            <p className="text-sm font-medium text-muted">{book.title} · Chủ đề {e.topic.no}{content ? ` · ${content.periods} tiết` : ""}</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-fg">Bài {e.lesson.no}. {e.lesson.title}</h1>
          </div>
          <span className="flex flex-wrap gap-2">
            {teacher ? (
              <>
                {content && <Button size="sm" variant="secondary" onClick={() => setPresent(true)}><MonitorPlay /> Trình chiếu</Button>}
                <Button size="sm" onClick={() => setAssign(null)}><Send /> Giao nhiệm vụ</Button>
              </>
            ) : (
              <Button size="sm" variant="secondary" onClick={() => ask("cả bài")}><Bot /> Hỏi AI Gia sư</Button>
            )}
          </span>
        </div>
        {teacher ? <TaughtStrip e={e} /> : content && <ReadStrip read={progress?.read.length ?? 0} total={content.sections.length} />}
      </header>

      <nav aria-label="Các phần của bài" className="sticky top-16 z-10 -mx-4 mt-4 overflow-x-auto border-b border-line bg-bg/95 px-4 backdrop-blur sm:mx-0 sm:px-0">
        <ul className="flex w-max gap-1">
          {tabs.map((t) => {
            const M = TAB_META[t];
            const n = counts[t];
            return (
              <li key={t}>
                <button type="button" ref={tab === t ? (el) => el?.scrollIntoView({ block: "nearest", inline: "nearest" }) : undefined} aria-current={tab === t ? "page" : undefined} onClick={() => setTab(t)} className={cn("-mb-px flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors", tab === t ? "border-brand text-fg" : "border-transparent text-muted hover:text-fg")}>
                  <M.icon className="size-4" aria-hidden /> {M.label}
                  {n !== undefined && <span className={cn("rounded-full px-1.5 text-xs tabular-nums", n ? "bg-surface-2 text-fg" : "text-muted")}>{n}</span>}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {tab === "noi-dung" && (
      <div className="mt-6 grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
        {/* Mục lục */}
        <aside className="hidden lg:block">
          <div className="sticky top-32 max-h-[calc(100vh-9rem)] overflow-y-auto pr-1 text-sm">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Chủ đề {e.topic.no}</p>
            <ul className="space-y-0.5">
              {e.topic.lessons.map((l) => {
                const r = `${e.grade}-${l.no}`;
                const cur = r === refId;
                return (
                  <li key={l.no}>
                    <Link href={`${base(role)}/${r}`} aria-current={cur ? "page" : undefined} className={cn("block rounded-lg px-2 py-1.5 leading-snug", cur ? "bg-fg text-bg" : "text-fg/80 hover:bg-surface-2")}>Bài {l.no}. {l.title}</Link>
                    {cur && content && (
                      <ul className="my-1 ml-2 space-y-0.5 border-l border-line pl-2">
                        {content.sections.map((s, i) => (
                          <li key={s.id}><a href={`#muc-${s.id}`} className="flex items-center gap-1.5 rounded px-1 py-0.5 text-xs text-muted hover:text-fg">{progress?.read.includes(s.id) ? <CheckCircle2 className="size-3 shrink-0 text-success-fg" aria-label="đã đọc" /> : <Circle className="size-3 shrink-0" aria-hidden />}{i + 1}. {s.title}</a></li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
            <Link href={`${base(role)}?lop=${e.grade}`} className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-cyan-fg hover:underline"><BookOpen className="size-3.5" aria-hidden /> Mục lục cả sách</Link>
          </div>
        </aside>

        {/* Trang sách */}
        <article className="min-w-0 max-w-3xl">
          {teacher && picks.size > 0 && <PickedStrip e={e} picks={picks} onPresent={content ? () => setPresent(true) : undefined} />}
          {content ? (
            <>
              <section className="rounded-2xl border border-line bg-surface p-4">
                <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted"><Target className="size-4" aria-hidden /> Yêu cầu cần đạt</h2>
                <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-fg">{content.objectives.map((o) => <li key={o}>{o}</li>)}</ol>
              </section>
              <section className="mt-4 rounded-2xl bg-gradient-to-br from-warning/10 to-transparent p-4">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-warning-fg">Khởi động</h2>
                <p className="mt-1 text-lg leading-relaxed text-fg"><Rich text={content.warmUp} /></p>
              </section>

              {content.sections.map((s, i) => {
                const k = itemKey(refId, s.id);
                const picked = picks.has(k);
                return (
                  <section key={s.id} id={`muc-${s.id}`} className="scroll-mt-32 border-b border-line py-6">
                    <div className="flex flex-wrap items-start gap-2">
                      <h2 className="min-w-0 basis-full text-xl font-bold text-fg sm:basis-auto sm:flex-1"><span className="mr-2 text-cyan-fg">{i + 1}.</span>{s.title}</h2>
                      {teacher && <Button size="sm" variant="ghost" aria-pressed={picked} onClick={() => d.toggleBookPick(user.id, k)}><Star className={cn(picked && "fill-warning text-warning")} /> {picked ? "Đã chọn dạy" : "Chọn để dạy"}</Button>}
                      <Button size="sm" variant="ghost" onClick={() => ask(s.title)}><Bot /> {teacher ? "Gợi ý cách dạy" : "Hỏi AI về mục này"}</Button>
                    </div>
                    {s.blocks.map((b, j) => <Block key={j} b={b} ctx={ctx} simKey={simKey} />)}
                    <Notes refId={refId} sectionId={s.id} />
                  </section>
                );
              })}

              <section className="py-6">
                <h2 className="text-xl font-bold text-fg">Luyện tập</h2>
                <ol className="mt-3 space-y-3">
                  {content.practice.map((p, i) => (
                    <li key={i} className="rounded-xl border border-line p-4">
                      <p className="text-fg"><span className="font-semibold">Bài {i + 1}.</span> <Rich text={p.task} /></p>
                      {p.hint && <details className="mt-2 text-sm" open={teacher}><summary className="cursor-pointer font-medium text-cyan-fg">Gợi ý</summary><p className="mt-1 text-fg"><Rich text={p.hint} /></p></details>}
                      {p.answer && <details className="mt-2 text-sm" open={teacher}><summary className="cursor-pointer font-medium text-cyan-fg">{teacher ? "Đáp án" : "Xem lời giải"}</summary><pre className="mt-1 overflow-x-auto whitespace-pre-wrap rounded-lg bg-surface-2 p-3 font-mono text-xs text-fg">{p.answer}</pre></details>}
                    </li>
                  ))}
                </ol>
                <h2 className="mt-6 text-xl font-bold text-fg">Vận dụng</h2>
                <p className="mt-2 leading-7 text-fg/90"><Rich text={content.apply} /></p>
                <div className="mt-6 rounded-2xl border border-cyan/40 bg-cyan/5 p-4">
                  <h2 className="font-semibold text-fg">Ghi nhớ</h2>
                  <ul className="mt-2 space-y-1.5 text-sm text-fg">{content.remember.map((r) => <li key={r} className="flex gap-2"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-cyan-fg" aria-hidden /><Rich text={r} /></li>)}</ul>
                </div>
                {extraLabs.length > 0 && (
                  <p className="mt-6 text-sm text-muted">Bài còn {extraLabs.length} mô phỏng thầy cô gắn thêm. <button type="button" className="font-medium text-cyan-fg hover:underline" onClick={() => setTab("mo-phong")}>Mở tab Mô phỏng</button></p>
                )}
              </section>
            </>
          ) : (
            <div className="space-y-3 rounded-2xl border border-dashed border-line p-5 text-sm text-muted">
              <p>Bài này chưa có nội dung. {teacher ? "Thầy cô vẫn gắn được mô phỏng, soạn câu hỏi và giao nhiệm vụ cho bài ở các tab phía trên; học sinh sẽ thấy ngay trong bài." : "Em theo dõi bài trên lớp; mô phỏng và nhiệm vụ của bài nằm ở các tab phía trên."}</p>
              <span className="flex flex-wrap gap-2">
                {(teacher ? ["mo-phong", "cau-hoi", "nhiem-vu"] as TabId[] : ["mo-phong", "nhiem-vu"] as TabId[]).map((t) => <Button key={t} size="sm" variant="secondary" onClick={() => setTab(t)}>{TAB_META[t].label}{counts[t] ? ` (${counts[t]})` : ""}</Button>)}
              </span>
            </div>
          )}

          <nav className="mt-4 flex flex-wrap justify-between gap-3 border-t border-line pt-4" aria-label="Bài trước và bài sau">
            {prev ? <Link href={`${base(role)}/${prev.ref}`} className="group flex max-w-[48%] items-center gap-2 text-sm text-muted hover:text-fg"><ArrowLeft className="size-4 shrink-0" aria-hidden /><span><span className="block text-xs">Bài trước</span><span className="font-medium text-fg">Bài {prev.lesson.no}. {prev.lesson.title}</span></span></Link> : <span />}
            {next && <Link href={`${base(role)}/${next.ref}`} className="group ml-auto flex max-w-[48%] items-center gap-2 text-right text-sm text-muted hover:text-fg"><span><span className="block text-xs">Bài sau</span><span className="font-medium text-fg">Bài {next.lesson.no}. {next.lesson.title}</span></span><ArrowRight className="size-4 shrink-0" aria-hidden /></Link>}
          </nav>
        </article>
      </div>
      )}

      {tab !== "noi-dung" && (
        <div className="mt-6 max-w-4xl">
          {tab === "mo-phong" && (teacher ? <LessonLabsTab refId={refId} inline={lessonSimSlugs(e)} /> : allSims.length ? <LessonSims labs={allSims.map((s) => getLabBySlug(s)).filter((l): l is NonNullable<typeof l> => !!l)} studentId={user.id} /> : <p className="text-sm text-muted">Bài này chưa có mô phỏng.</p>)}
          {tab === "cau-hoi" && <><ContentChecks e={e} onOpen={() => setTab("noi-dung")} /><LessonQuizTab refId={refId} /></>}
          {tab === "lap-trinh" && <LessonCodeTab refId={refId} />}
          {tab === "khbd" && <PlanTab e={e} />}
          {tab === "luyen-tap" && <StudentPracticeTab e={e} />}
          {tab === "nhiem-vu" && (teacher ? <TeacherTasks e={e} onAssign={() => setAssign(null)} /> : <StudentTasks e={e} />)}
        </div>
      )}

      {present && content && <Presenter e={e} picks={picks} onClose={() => setPresent(false)} />}
      {teacher && <AssignDialog open={assign !== undefined} onOpenChange={(o) => !o && setAssign(undefined)} preset={assign ?? undefined} sgkRef={refId} suggest={lessonAssignables(d, user.id, e)} />}
    </TutorScope>
  );
}

/** Nhiệm vụ lớp học sinh được giao thuộc bài này. */
function studentLessonTasks(d: DemoData, userId: string, e: BookEntry) {
  const classIds = new Set(studentClassIds(d, userId));
  const sims = lessonSimSlugs(e);
  return d.assignments.filter((a) => classIds.has(a.classId) && a.status !== "draft" && (!a.studentIds || a.studentIds.includes(userId))).filter((a) => a.sgkRef === e.ref || (a.task?.kind === "lab" && sims.includes(a.task.ref)));
}

/** Bộ câu hỏi học sinh làm được ở bài này: bộ có sẵn của bài và bộ thầy cô đã giao lớp em. */
function studentPractice(d: DemoData, userId: string, e: BookEntry) {
  const classIds = studentClassIds(d, userId);
  const kinds = (ks: PracticeQuestion["kind"][]) => [...new Set(ks)].map((k) => KIND_LABEL[k]);
  const sets = e.lesson.key ? PRACTICE_SETS.filter((s) => s.lessonKey === e.lesson.key).map((s) => ({ id: s.id, title: s.title, n: s.questionIds.length, mine: false, kinds: kinds(s.questionIds.map(getQuestion).filter((q): q is PracticeQuestion => !!q).map((q) => q.kind)) })) : [];
  const tq = d.teacherQuizzes.filter((q) => q.sgkRef === e.ref && q.status === "published" && q.classIds.some((c) => classIds.includes(c))).map((q) => ({ id: q.id, title: q.title, n: q.questions.length, mine: true, kinds: kinds(q.questions.map((x) => x.kind)) }));
  return [...tq, ...sets];
}

function sectionLabel(d: DemoData, e: BookEntry, k: string) {
  const id = k.split("#")[1];
  if (id.startsWith("sim:")) return `Mô phỏng: ${getLabBySlug(id.slice(4))?.title ?? id}`;
  if (id.startsWith("res:")) return `Học liệu: ${d.resources.find((r) => r.id === id.slice(4))?.title ?? "đã xóa"}`;
  if (id.startsWith("khbd:")) return `KHBD: ${d.lessonPlans.find((p) => p.id === id.slice(5))?.title ?? "đã xóa"}`;
  return e.content?.sections.find((s) => s.id === id)?.title ?? id;
}

/** Dải "đã dạy ở lớp nào" ngay dưới tên bài. */
function TaughtStrip({ e }: { e: BookEntry }) {
  const { d, user } = useSessionData();
  const classes = teacherClasses(d, user.id).filter((c) => c.grade === e.grade);
  if (!classes.length) return null;
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
      <span className="text-muted">Đã dạy ở:</span>
      {classes.map((c) => {
        const t = d.taughtLessons.find((x) => x.teacherId === user.id && x.classId === c.id && x.ref === e.ref);
        return (
          <button key={c.id} type="button" aria-pressed={!!t} title={t ? `Đã dạy ${formatDate(t.at)} — bấm để bỏ` : "Bấm khi dạy xong bài ở lớp này"} onClick={() => { d.toggleTaught(user.id, c.id, e.ref); if (!t) toast.success(`Đã đánh dấu dạy xong ở ${c.name}`); }} className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors", t ? "border-success/40 bg-success/15 text-success-fg" : "border-line text-muted hover:text-fg")}>
            {t ? <CheckCircle2 className="size-3.5" aria-hidden /> : <Circle className="size-3.5" aria-hidden />} {c.name}{t ? ` · ${formatDate(t.at)}` : ""}
          </button>
        );
      })}
    </div>
  );
}

function ReadStrip({ read, total }: { read: number; total: number }) {
  return (
    <div className="mt-3 flex items-center gap-3 text-sm">
      <span className="text-muted">Em đã đọc {read}/{total} mục</span>
      <div className="h-1.5 w-40 rounded-full bg-surface-2"><div className="h-full rounded-full bg-success" style={{ width: `${(read / total) * 100}%` }} /></div>
    </div>
  );
}

function PickedStrip({ e, picks, onPresent }: { e: BookEntry; picks: Set<string>; onPresent?: () => void }) {
  const { d } = useSessionData();
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2 rounded-2xl border border-warning/40 bg-warning/5 px-4 py-2.5 text-sm">
      <Star className="size-4 fill-warning text-warning" aria-hidden />
      <span className="font-semibold text-fg">Đã chọn để dạy:</span>
      <span className="min-w-0 flex-1 text-fg/80">{[...picks].map((k) => sectionLabel(d, e, k)).join(" · ")}</span>
      {onPresent && <Button size="sm" variant="ghost" onClick={onPresent}><MonitorPlay /> Chiếu</Button>}
    </div>
  );
}

/** Câu hỏi củng cố có sẵn trong nội dung bài (đã gắn yêu cầu cần đạt). */
function ContentChecks({ e, onOpen }: { e: BookEntry; onOpen: () => void }) {
  const checks = e.content ? lessonChecks(e.content) : [];
  if (!checks.length) return null;
  return (
    <section className="mb-6">
      <h3 className="mb-2 font-semibold text-fg">Câu hỏi củng cố trong bài ({checks.length})</h3>
      <p className="mb-2 text-xs text-muted">Học sinh trả lời ngay khi đọc từng mục; không cần giao riêng.</p>
      <ul className="divide-y divide-line rounded-xl border border-line bg-surface">
        {checks.map((c) => <li key={c.id} className="px-3 py-2 text-sm text-fg"><Rich text={c.q} /></li>)}
      </ul>
      <button type="button" onClick={onOpen} className="mt-2 text-xs font-medium text-cyan-fg hover:underline">Xem trong nội dung bài</button>
    </section>
  );
}

function PlanTab({ e }: { e: BookEntry }) {
  const { d, user } = useSessionData();
  const id = sgkLessonId(e.lesson);
  const plans = id ? d.lessonPlans.filter((p) => p.ownerId === user.id && p.lessonId === id) : [];
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button asChild><Link href={`/teacher/lesson-planner/assistant${id ? `?lesson=${id}` : ""}`}><NotebookPen /> Soạn KHBD bài này</Link></Button>
        {id && <Button asChild variant="secondary"><Link href={`/bai-hoc/${id}`}><BookOpen /> Xem bài học tương tác</Link></Button>}
      </div>
      {plans.length === 0 ? <p className="text-sm text-muted">Chưa có KHBD cho bài này. {id ? "" : "Thầy cô có thể tải KHBD của mình lên Trợ lý KHBD để phân tích, bổ sung năng lực số và gắn mô phỏng."}</p> : (
        <ul className="space-y-2">
          {plans.map((p) => (
            <li key={p.id}>
              <Link href={`/teacher/lesson-planner/${p.id}`} className="flex flex-wrap items-center gap-2 rounded-xl border border-line bg-surface p-3 hover:border-cyan/40">
                <span className="min-w-0 flex-1"><span className="block font-semibold text-fg">{p.title}</span><span className="block text-xs text-muted">{p.activities.length} hoạt động · {p.durationMinutes} phút</span></span>
                <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", p.status === "published" ? "bg-success/15 text-success-fg" : "bg-surface-2 text-muted")}>{p.status === "published" ? "Đã dùng" : "Nháp"}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function TeacherTasks({ e, onAssign }: { e: BookEntry; onAssign: () => void }) {
  const { d, user } = useSessionData();
  const assigned = lessonAssignments(d, d.assignments.filter((a) => a.ownerId === user.id), user.id, e);
  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="font-semibold text-fg">Nhiệm vụ đã giao từ bài này</h3>
        <Button size="sm" onClick={onAssign}><Send /> Giao nhiệm vụ</Button>
      </div>
      {assigned.length === 0 ? <p className="text-sm text-muted">Chưa giao nhiệm vụ nào từ bài này.</p> : (
        <ul className="space-y-2">
          {assigned.map((a) => {
            const students = assignedStudents(d, a);
            const done = a.task ? students.filter((u) => taskOutcome(d, u.id, a).done).length : d.submissions.filter((s) => s.assignmentId === a.id).length;
            const pct = students.length ? Math.round((done / students.length) * 100) : 0;
            return (
              <li key={a.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-surface p-3">
                <span className="min-w-0 flex-1 basis-56">
                  <span className="block font-semibold text-fg">{a.title}</span>
                  <span className="block text-xs text-muted">{d.classes.find((c) => c.id === a.classId)?.name} · {a.status === "draft" ? "bản nháp" : `hạn ${formatDate(a.dueAt, true)}`}</span>
                </span>
                <span className="flex w-40 items-center gap-2 text-xs text-muted"><span className="h-1.5 flex-1 rounded-full bg-surface-2"><span className="block h-full rounded-full bg-success" style={{ width: `${pct}%` }} /></span>{done}/{students.length}</span>
                <Button asChild size="sm" variant="ghost"><Link href={`/teacher/classes/${a.classId}?tab=ket-qua`}>Kết quả lớp</Link></Button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function StudentTasks({ e }: { e: BookEntry }) {
  const { d, user } = useSessionData();
  const tasks = studentLessonTasks(d, user.id, e);
  const sims = lessonSimSlugs(e).map((slug) => ({ slug, r: labSummary(d.labResults, [user.id], slug).rows[0] })).filter((x) => x.r);
  return (
    <div className="space-y-6">
      <section>
        <h3 className="mb-2 font-semibold text-fg">Nhiệm vụ thầy cô giao</h3>
        {tasks.length === 0 ? <p className="text-sm text-muted">Thầy cô chưa giao nhiệm vụ cho bài này.</p> : (
          <ul className="space-y-2">
            {tasks.map((a) => { const o = taskOutcome(d, user.id, a); return <li key={a.id}><Link href={`/student/missions/${a.id}`} className="flex flex-wrap items-center gap-2 rounded-xl border border-line bg-surface p-3 hover:border-cyan/40"><span className="min-w-0 flex-1 font-semibold text-fg">{a.title}</span><span className={cn("text-xs", o.done ? "font-semibold text-success-fg" : "text-muted")}>{o.text ?? `hạn ${formatDate(a.dueAt, true)}`}</span></Link></li>; })}
          </ul>
        )}
      </section>
      {sims.length > 0 && (
        <section>
          <h3 className="mb-2 font-semibold text-fg">Điểm mô phỏng của em</h3>
          <ul className="divide-y divide-line rounded-xl border border-line bg-surface text-sm">{sims.map((x) => <li key={x.slug} className="flex justify-between gap-2 px-3 py-2"><span className="truncate text-fg">{getLabBySlug(x.slug)?.title}</span><b className="text-success-fg">{fmtScore(x.r!.best.score)}</b></li>)}</ul>
        </section>
      )}
    </div>
  );
}

function StudentPracticeTab({ e }: { e: BookEntry }) {
  const { d, user } = useSessionData();
  const sets = studentPractice(d, user.id, e);
  const code = e.lesson.key ? CODING_EXERCISES.filter((x) => x.lessonKey === e.lesson.key) : [];
  if (!sets.length && !code.length) return <p className="text-sm text-muted">Bài này chưa có bộ câu hỏi hay bài lập trình riêng. Câu hỏi củng cố nằm ngay trong phần Nội dung.</p>;
  return (
    <div className="space-y-6">
      {sets.length > 0 && (
        <section>
          <h3 className="font-semibold text-fg">Câu hỏi luyện tập</h3>
          <p className="mb-2 flex items-center gap-1.5 text-xs text-muted"><Lock className="size-3.5" aria-hidden /> Làm trong chế độ khóa tab: toàn màn hình, rời bài 3 lần thì bài tự nộp.</p>
          <ul className="space-y-2">
            {sets.map((s) => <li key={s.id} className="flex flex-wrap items-center gap-2 rounded-xl border border-line bg-surface p-3"><span className="min-w-0 flex-1"><span className="block font-semibold text-fg">{s.title}</span><span className="block text-xs text-muted">{s.n} câu{s.mine ? " · thầy cô giao" : ""} · {s.kinds.join(", ")}</span></span><Button asChild size="sm"><Link href={`/student/practice/${s.id}`}>Làm bài</Link></Button></li>)}
          </ul>
        </section>
      )}
      {code.length > 0 && (
        <section>
          <h3 className="mb-2 font-semibold text-fg">Bài lập trình</h3>
          <ul className="space-y-2">
            {code.map((x) => <li key={x.id} className="flex flex-wrap items-center gap-2 rounded-xl border border-line bg-surface p-3"><span className="min-w-0 flex-1"><span className="block font-semibold text-fg">{x.title}</span><span className="block text-xs text-muted">{x.tests.length} test chấm tự động</span></span><Button asChild size="sm" variant="secondary"><Link href={`/student/code?bai=${x.id}`}>Giải bài</Link></Button></li>)}
          </ul>
        </section>
      )}
    </div>
  );
}
