"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, BookOpen, Bot, CheckCircle2, ChevronRight, Circle, ClipboardList, MonitorPlay, NotebookPen, PencilLine, Send, Star, Target, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Assignment } from "@/lib/domain/types";
import type { DemoData } from "@/lib/data/seed";
import { CODING_EXERCISES } from "@/lib/data/coding-exercises";
import { getLabBySlug } from "@/lib/data/labs";
import { PRACTICE_SETS } from "@/lib/data/practice";
import { sgkLessonId } from "@/lib/data/sgk-kntt";
import { bookEntry, bookOf, itemKey, lessonSimSlugs, neighbors, type BookEntry } from "@/lib/sgk/book";
import { fmtScore, labSummary } from "@/lib/sim/lab-score";
import { classStudents, teacherClasses } from "@/lib/store/scoped";
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

/** Trình đọc một bài của SGK số. Giáo viên: đáp án, chọn mục để dạy, trình chiếu, giao nhiệm vụ. Học sinh: học, làm, ghi chú. */
export function BookReader({ refId, role }: { refId: string; role: Role }) {
  const { d, user } = useSessionData();
  const tutor = useTutor();
  const e = bookEntry(refId);
  const [present, setPresent] = useState(false);
  const [assign, setAssign] = useState<AssignPreset | null | undefined>(undefined);
  const markRead = d.markBookRead;
  const userId = user.id;
  const content = e?.content;
  const ids = content?.sections.map((s) => s.id) ?? [];
  useReadTracking(ids, (id) => markRead(userId, refId, id));

  if (!e) return <EmptyState icon={BookOpen} title="Không tìm thấy bài" action={<Button asChild><Link href={base(role)}>Về thư viện SGK số</Link></Button>} />;
  const teacher = role === "teacher";
  const book = bookOf(e.grade);
  const { prev, next } = neighbors(refId);
  const progress = d.bookProgress.find((p) => p.userId === user.id && p.ref === refId);
  const picks = new Set(d.bookPicks.filter((p) => p.userId === user.id && p.key.startsWith(`${refId}#`)).map((p) => p.key));
  const ctx: BlockCtx = { teacher, picked: (k) => picks.has(k), onPick: (k) => { d.toggleBookPick(user.id, k); }, onAssign: (slug) => setAssign({ kind: "lab", ref: slug }) };
  const simKey = (slug: string) => `${refId}#sim:${slug}`;
  const ask = (section: string) => tutor.open({ title: `${book.title} · Bài ${e.lesson.no}. ${e.lesson.title} — ${section}`, capability: teacher ? "guide" : "explain" });
  const lessonId = sgkLessonId(e.lesson);
  const extraLabs = d.lessonLabs.filter((l) => l.sgkRef === refId && (teacher ? l.ownerId === user.id : true)).map((l) => getLabBySlug(l.slug)).filter((l): l is NonNullable<typeof l> => !!l && !lessonSimSlugs(e).includes(l.slug));

  return (
    <TutorScope title={`${book.title} · Bài ${e.lesson.no}. ${e.lesson.title}`} topic="general" level={teacher ? "free" : "guided"}>
      <nav aria-label="Vị trí" className="mb-3 flex flex-wrap items-center gap-1 text-xs text-muted">
        <Link href={base(role)} className="hover:text-fg">SGK số</Link><ChevronRight className="size-3" aria-hidden />
        <Link href={`${base(role)}?lop=${e.grade}`} className="hover:text-fg">{book.title}</Link><ChevronRight className="size-3" aria-hidden />
        <span>Chủ đề {e.topic.no}. {e.topic.title}</span><ChevronRight className="size-3" aria-hidden />
        <span className="font-medium text-fg">Bài {e.lesson.no}</span>
      </nav>

      <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)] xl:grid-cols-[220px_minmax(0,1fr)_280px]">
        {/* Mục lục */}
        <aside className="hidden lg:block">
          <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto pr-1 text-sm">
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
        <article className="min-w-0">
          <header className="border-b border-line pb-4">
            <p className="text-sm font-medium text-muted">{book.title} · Chủ đề {e.topic.no}</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-fg">Bài {e.lesson.no}. {e.lesson.title}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {content && <span className="text-xs text-muted">{content.periods} tiết · {content.sections.length} mục</span>}
              <span className="ml-auto flex flex-wrap gap-2">
                {teacher ? (
                  <>
                    {content && <Button size="sm" variant="secondary" onClick={() => setPresent(true)}><MonitorPlay /> Trình chiếu</Button>}
                    {lessonId && <Button asChild size="sm" variant="secondary"><Link href={`/teacher/lesson-planner/assistant?lesson=${lessonId}`}><NotebookPen /> Soạn KHBD</Link></Button>}
                    <Button size="sm" onClick={() => setAssign(null)}><Send /> Giao nhiệm vụ</Button>
                  </>
                ) : (
                  <Button size="sm" variant="secondary" onClick={() => ask("cả bài")}><Bot /> Hỏi AI Gia sư</Button>
                )}
              </span>
            </div>
          </header>

          {content ? (
            <>
              <section className="mt-5 rounded-2xl border border-line bg-surface p-4">
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
                  <section key={s.id} id={`muc-${s.id}`} className="scroll-mt-24 border-b border-line py-6">
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
                  <div className="mt-6">
                    <h2 className="mb-2 font-semibold text-fg">Mô phỏng thầy cô gắn thêm</h2>
                    <LessonSims labs={extraLabs} studentId={teacher ? undefined : user.id} />
                  </div>
                )}
              </section>
            </>
          ) : (
            <div className="mt-6 space-y-4">
              <p className="rounded-2xl border border-dashed border-line p-5 text-sm text-muted">Bài này chưa có nội dung số. {teacher ? "Thầy cô vẫn gắn được mô phỏng, soạn câu hỏi và giao nhiệm vụ cho bài này; học sinh sẽ thấy ngay trong SGK số." : "Em theo dõi bài trên lớp và làm các nhiệm vụ thầy cô giao."}</p>
              {(lessonSimSlugs(e).length > 0 || extraLabs.length > 0) && <LessonSims labs={[...lessonSimSlugs(e).map((s) => getLabBySlug(s)!).filter(Boolean), ...extraLabs]} studentId={teacher ? undefined : user.id} />}
              {teacher && <Button asChild variant="secondary"><Link href={`/teacher/courses?grade=${e.grade}&bai=${refId}&tab=labs`}>Gắn mô phỏng, soạn câu hỏi cho bài</Link></Button>}
            </div>
          )}

          <nav className="mt-4 flex flex-wrap justify-between gap-3 border-t border-line pt-4" aria-label="Bài trước và bài sau">
            {prev ? <Link href={`${base(role)}/${prev.ref}`} className="group flex max-w-[48%] items-center gap-2 text-sm text-muted hover:text-fg"><ArrowLeft className="size-4 shrink-0" aria-hidden /><span><span className="block text-xs">Bài trước</span><span className="font-medium text-fg">Bài {prev.lesson.no}. {prev.lesson.title}</span></span></Link> : <span />}
            {next && <Link href={`${base(role)}/${next.ref}`} className="group ml-auto flex max-w-[48%] items-center gap-2 text-right text-sm text-muted hover:text-fg"><span><span className="block text-xs">Bài sau</span><span className="font-medium text-fg">Bài {next.lesson.no}. {next.lesson.title}</span></span><ArrowRight className="size-4 shrink-0" aria-hidden /></Link>}
          </nav>
        </article>

        {/* Bảng bên phải */}
        <aside className="min-w-0 xl:block">
          <div className="space-y-4 xl:sticky xl:top-20">
            {teacher ? <TeacherPanel e={e} picks={picks} onAssign={() => setAssign(null)} /> : <StudentPanel e={e} />}
          </div>
        </aside>
      </div>

      {present && content && <Presenter e={e} picks={picks} onClose={() => setPresent(false)} />}
      {teacher && <AssignDialog open={assign !== undefined} onOpenChange={(o) => !o && setAssign(undefined)} preset={assign ?? undefined} sgkRef={refId} suggest={lessonAssignables(d, user.id, e)} />}
    </TutorScope>
  );
}

function TeacherPanel({ e, picks, onAssign }: { e: BookEntry; picks: Set<string>; onAssign: () => void }) {
  const { d, user } = useSessionData();
  const classes = teacherClasses(d, user.id).filter((c) => c.grade === e.grade);
  const assigned = lessonAssignments(d, d.assignments.filter((a) => a.ownerId === user.id), user.id, e);
  const sectionTitle = (k: string) => {
    const id = k.split("#")[1];
    if (id.startsWith("sim:")) return `Mô phỏng: ${getLabBySlug(id.slice(4))?.title ?? id}`;
    return e.content?.sections.find((s) => s.id === id)?.title ?? id;
  };
  return (
    <>
      <section className="rounded-2xl border border-line bg-surface p-4">
        <h2 className="text-sm font-semibold text-fg">Dạy bài này</h2>
        {classes.length === 0 ? <p className="mt-1 text-xs text-muted">Thầy cô chưa có lớp khối {e.grade}.</p> : (
          <ul className="mt-2 space-y-1.5">
            {classes.map((c) => {
              const t = d.taughtLessons.find((x) => x.teacherId === user.id && x.classId === c.id && x.ref === e.ref);
              return (
                <li key={c.id}>
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-fg">
                    <input type="checkbox" checked={!!t} onChange={() => { d.toggleTaught(user.id, c.id, e.ref); if (!t) toast.success(`Đã đánh dấu dạy xong ở ${c.name}`); }} />
                    <span className="font-medium">{c.name}</span>
                    <span className="text-xs text-muted">{t ? `đã dạy ${formatDate(t.at)}` : "chưa dạy"}</span>
                  </label>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-line bg-surface p-4">
        <h2 className="flex items-center gap-1.5 text-sm font-semibold text-fg"><Star className="size-4 fill-warning text-warning" aria-hidden /> Đã chọn để dạy ({picks.size})</h2>
        {picks.size === 0 ? <p className="mt-1 text-xs text-muted">Bấm “Chọn để dạy” ở mục kiến thức hoặc mô phỏng. Chế độ trình chiếu có thể chỉ chiếu các mục đã chọn.</p> : (
          <ul className="mt-2 space-y-1 text-sm">{[...picks].map((k) => <li key={k} className="truncate text-fg">• {sectionTitle(k)}</li>)}</ul>
        )}
      </section>

      <section className="rounded-2xl border border-line bg-surface p-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="flex items-center gap-1.5 text-sm font-semibold text-fg"><ClipboardList className="size-4" aria-hidden /> Nhiệm vụ của bài</h2>
          <Button size="sm" variant="ghost" onClick={onAssign}><Send /> Giao</Button>
        </div>
        {assigned.length === 0 ? <p className="mt-1 text-xs text-muted">Chưa giao nhiệm vụ nào từ bài này.</p> : (
          <ul className="mt-2 space-y-2 text-sm">
            {assigned.map((a) => {
              const students = classStudents(d, a.classId);
              const done = a.task ? students.filter((u) => taskOutcome(d, u.id, a).done).length : d.submissions.filter((s) => s.assignmentId === a.id).length;
              return (
                <li key={a.id}>
                  <Link href="/teacher/assignments" className="block rounded-lg border border-line px-2.5 py-1.5 hover:border-cyan/40">
                    <span className="block truncate font-medium text-fg">{a.title}</span>
                    <span className="text-xs text-muted">{d.classes.find((c) => c.id === a.classId)?.name} · {done}/{students.length} em xong</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </>
  );
}

function StudentPanel({ e }: { e: BookEntry }) {
  const { d, user } = useSessionData();
  const progress = d.bookProgress.find((p) => p.userId === user.id && p.ref === e.ref);
  const total = e.content?.sections.length ?? 0;
  const classIds = new Set(d.enrollments.filter((x) => x.studentId === user.id).map((x) => x.classId));
  const tasks = d.assignments.filter((a) => classIds.has(a.classId)).filter((a) => a.sgkRef === e.ref || (a.task?.kind === "lab" && lessonSimSlugs(e).includes(a.task.ref)));
  const sims = lessonSimSlugs(e).map((slug) => ({ slug, r: labSummary(d.labResults, [user.id], slug).rows[0] })).filter((x) => x.r);
  return (
    <>
      {total > 0 && (
        <section className="rounded-2xl border border-line bg-surface p-4">
          <h2 className="text-sm font-semibold text-fg">Em đã đọc {progress?.read.length ?? 0}/{total} mục</h2>
          <div className="mt-2 h-2 rounded-full bg-surface-2"><div className="h-full rounded-full bg-success" style={{ width: `${((progress?.read.length ?? 0) / total) * 100}%` }} /></div>
        </section>
      )}
      <section className="rounded-2xl border border-line bg-surface p-4">
        <h2 className="text-sm font-semibold text-fg">Nhiệm vụ của bài</h2>
        {tasks.length === 0 ? <p className="mt-1 text-xs text-muted">Thầy cô chưa giao nhiệm vụ cho bài này.</p> : (
          <ul className="mt-2 space-y-2 text-sm">
            {tasks.map((a) => { const o = taskOutcome(d, user.id, a); return <li key={a.id}><Link href={`/student/missions/${a.id}`} className="block rounded-lg border border-line px-2.5 py-1.5 hover:border-cyan/40"><span className="block truncate font-medium text-fg">{a.title}</span><span className={cn("text-xs", o.done ? "text-success-fg" : "text-muted")}>{o.text ?? `hạn ${formatDate(a.dueAt, true)}`}</span></Link></li>; })}
          </ul>
        )}
      </section>
      {sims.length > 0 && (
        <section className="rounded-2xl border border-line bg-surface p-4">
          <h2 className="text-sm font-semibold text-fg">Điểm mô phỏng của em</h2>
          <ul className="mt-2 space-y-1 text-sm">{sims.map((x) => <li key={x.slug} className="flex justify-between gap-2"><span className="truncate text-fg">{getLabBySlug(x.slug)?.title}</span><b className="text-success-fg">{fmtScore(x.r!.best.score)}</b></li>)}</ul>
        </section>
      )}
    </>
  );
}

