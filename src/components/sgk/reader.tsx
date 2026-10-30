"use client";
import { LessonQA } from "./lesson-qa";
import { SaveToggle } from "@/components/teacher/save-toggle";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, BookOpen, Bot, CheckCircle2, ChevronRight, Circle, ClipboardList, Code2, FileText, FlaskConical, ListChecks, Lock, MessageCircleQuestion, MonitorPlay, PencilLine, Send, Star, Target, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Assignment } from "@/lib/domain/types";
import type { DemoData } from "@/lib/data/seed";
import { CODING_EXERCISES } from "@/lib/data/coding-exercises";
import { getLabBySlug } from "@/lib/data/labs";
import { getQuestion, KIND_LABEL, setsForLesson, type PracticeQuestion } from "@/lib/data/practice";
import { LessonCodeTab, LessonLabsTab, LessonQuizTab } from "@/components/courses/lesson-panel";
import { bookEntry, bookOf, itemKey, lessonChecks, lessonSimSlugs, neighbors, type BookEntry } from "@/lib/sgk/book";
import { teacherClasses, assignedStudents, studentClassIds } from "@/lib/store/scoped";
import { useSessionData } from "@/lib/store/use-role";
import { taskOutcome } from "@/lib/teacher/assign";
import { missionStatus } from "@/lib/store/student";
import { cn, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/form";
import { EmptyState } from "@/components/ui/feedback";
import { AssignDialog, type AssignPreset } from "@/components/teacher/assign-dialog";
import { TutorScope, useTutor } from "@/components/tutor/tutor-provider";
import { Block, Rich, type BlockCtx } from "./blocks";
import { Presenter } from "./presenter";
import { LessonSims } from "@/components/lessons/lesson-sims";
import { UnlockChips } from "@/components/teacher/unlock-chips";
import { codeKey, labKey, lessonKey, setKey } from "@/lib/access/unlocks";
import { lessonAssignables } from "@/lib/teacher/lesson-items";
import { useAccess } from "@/lib/access/use-access";

type Role = "teacher" | "student";
type TabId = "noi-dung" | "mo-phong" | "cau-hoi" | "lap-trinh" | "nhiem-vu" | "luyen-tap" | "hoi-dap";
const TAB_META: Record<TabId, { label: string; icon: React.ComponentType<{ className?: string }>; on: string }> = {
  "noi-dung": { label: "Kiến thức", icon: FileText, on: "bg-brand text-brand-ink" },
  "mo-phong": { label: "Mô phỏng", icon: FlaskConical, on: "bg-brand text-brand-ink" },
  "cau-hoi": { label: "Luyện tập", icon: ListChecks, on: "bg-brand text-brand-ink" },
  "lap-trinh": { label: "Lập trình", icon: Code2, on: "bg-brand text-brand-ink" },
  "luyen-tap": { label: "Luyện tập", icon: ListChecks, on: "bg-brand text-brand-ink" },
  "nhiem-vu": { label: "Đã giao & kết quả", icon: ClipboardList, on: "bg-brand text-brand-ink" },
  "hoi-dap": { label: "Hỏi đáp", icon: MessageCircleQuestion, on: "bg-brand text-brand-ink" },
};
const GRADE_BG: Record<number, string> = { 10: "from-[#2563eb] to-[#38bdf8]", 11: "from-[#1d4ed8] to-[#4f46e5]", 12: "from-[#1e40af] to-[#0ea5e9]" };
/** Mỗi bài: Kiến thức · Mô phỏng · Luyện tập (gồm câu hỏi và lập trình); giáo viên có thêm tab hoạt động đã giao và kết quả. */
const TEACHER_TABS: TabId[] = ["noi-dung", "mo-phong", "luyen-tap", "nhiem-vu", "hoi-dap"];
const STUDENT_TABS: TabId[] = ["noi-dung", "mo-phong", "luyen-tap", "hoi-dap"];
/** Đường dẫn cũ (?tab=cau-hoi, lap-trinh, nhiem-vu của học sinh) vẫn mở đúng tab mới. */
const TAB_ALIAS: Record<string, TabId> = { "cau-hoi": "luyen-tap", "lap-trinh": "luyen-tap" };
const base = (role: Role) => (role === "teacher" ? "/teacher/sgk" : "/student/sgk");

export { lessonAssignables };

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

/** Trang một bài trong Khóa học: mọi thứ của bài (tóm tắt kiến thức, mô phỏng, câu hỏi, lập trình, nhiệm vụ); KHBD soạn riêng ở Trợ lý KHBD nằm trong các tab ngay dưới tên bài. */
export function BookReader({ refId, role }: { refId: string; role: Role }) {
  const { d, user } = useSessionData();
  const tutor = useTutor();
  const access = useAccess();
  const e = bookEntry(refId);
  const [present, setPresent] = useState(false);
  const [assign, setAssign] = useState<AssignPreset | null | undefined>(undefined);
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const tabs = role === "teacher" ? TEACHER_TABS : STUDENT_TABS;
  const rawTab = params.get("tab") ?? "";
  const wanted = TAB_ALIAS[rawTab] ?? (rawTab === "nhiem-vu" && role === "student" ? "luyen-tap" : rawTab);
  const tab = (tabs as string[]).includes(wanted) ? (wanted as TabId) : "noi-dung";
  const setTab = (t: TabId) => router.replace(t === "noi-dung" ? pathname : `${pathname}?tab=${t}`, { scroll: false });
  const markRead = d.markBookRead;
  const userId = user.id;
  const content = e?.content;
  const ids = content?.sections.map((s) => s.id) ?? [];
  useReadTracking(ids, (id) => markRead(userId, refId, id));

  if (!e) return <EmptyState icon={BookOpen} title="Không tìm thấy bài" action={<Button asChild><Link href={base(role)}>{role === "teacher" ? "Về Bài học" : "Về Khóa học"}</Link></Button>} />;
  const teacher = role === "teacher";
  const book = bookOf(e.grade);
  if (!teacher && !access.can(lessonKey(refId))) return <LockedLesson e={e} />;
  const { prev, next } = neighbors(refId);
  const progress = d.bookProgress.find((p) => p.userId === user.id && p.ref === refId);
  const picks = new Set(d.bookPicks.filter((p) => p.userId === user.id && p.key.startsWith(`${refId}#`)).map((p) => p.key));
  const ctx: BlockCtx = { teacher, canSim: (slug) => access.can(labKey(slug)), picked: (k) => picks.has(k), onPick: (k) => { d.toggleBookPick(user.id, k); }, onAssign: (slug) => setAssign({ kind: "lab", ref: slug }) };
  const simKey = (slug: string) => `${refId}#sim:${slug}`;
  const ask = (section: string) => tutor.open({ title: `${book.title} · Bài ${e.lesson.no}. ${e.lesson.title} — ${section}`, capability: teacher ? "guide" : "explain" });
  const allSims = [...lessonSimSlugs(e), ...d.lessonLabs.filter((l) => l.sgkRef === refId && (teacher ? l.ownerId === user.id : true)).map((l) => l.slug)].filter((x, i, arr) => arr.indexOf(x) === i).filter((slug) => teacher || access.can(labKey(slug)));
  const myAssignments = teacher ? lessonAssignments(d, d.assignments.filter((a) => a.ownerId === user.id), user.id, e) : studentLessonTasks(d, user.id, e);
  const quizCount = teacher ? (content ? lessonChecks(content).length : 0) + d.teacherQuizzes.filter((q) => q.ownerId === user.id && q.sgkRef === refId).length + setsForLesson(e.ref, e.lesson.key).length : 0;
  const codeCount = e.lesson.key ? CODING_EXERCISES.filter((x) => x.lessonKey === e.lesson.key).length : 0;
  const qaClasses = new Set(teacher ? teacherClasses(d, user.id).map((c) => c.id) : studentClassIds(d, user.id));
  const counts: Partial<Record<TabId, number>> = { "hoi-dap": d.lessonQA.filter((q) => q.ref === e.ref && qaClasses.has(q.classId)).length, "mo-phong": allSims.length, "nhiem-vu": myAssignments.length, "luyen-tap": teacher ? quizCount + codeCount : studentPractice(d, user.id, e, access.can).length + studentCode(e, access.can).length };
  const extraLabs = d.lessonLabs.filter((l) => l.sgkRef === refId && (teacher ? l.ownerId === user.id : true)).map((l) => getLabBySlug(l.slug)).filter((l): l is NonNullable<typeof l> => !!l && !lessonSimSlugs(e).includes(l.slug));

  return (
    <TutorScope title={`${book.title} · Bài ${e.lesson.no}. ${e.lesson.title}`} topic="general" level={teacher ? "free" : "guided"}>
      <nav aria-label="Vị trí" className="mb-3 flex flex-wrap items-center gap-1 text-xs text-muted">
        <Link href={base(role)} className="hover:text-fg">Khóa học</Link><ChevronRight className="size-3" aria-hidden />
        <Link href={`${base(role)}?lop=${e.grade}`} className="hover:text-fg">{book.title}</Link><ChevronRight className="size-3" aria-hidden />
        <span>Chủ đề {e.topic.no}. {e.topic.title}</span><ChevronRight className="size-3" aria-hidden />
        <span className="font-medium text-fg">Bài {e.lesson.no}</span>
      </nav>

      <header className="rounded-2xl border border-line bg-surface p-5">
        <div className="flex flex-wrap items-center gap-4">
          <span className={cn("grid size-14 shrink-0 place-items-center rounded-xl bg-gradient-to-br text-white", GRADE_BG[e.grade])}><span className="text-center leading-none"><span className="block text-[10px] font-semibold uppercase opacity-80">Bài</span><span className="text-2xl font-extrabold">{e.lesson.no}</span></span></span>
          <div className="min-w-0 flex-1 basis-72">
            <p className="text-sm font-medium text-muted">{book.title} · Chủ đề {e.topic.no}. {e.topic.title}{content ? ` · ${content.periods} tiết` : ""}</p>
            <h1 className="mt-0.5 text-2xl font-bold tracking-tight text-fg sm:text-3xl">{e.lesson.title}</h1>
            {teacher ? <><TaughtStrip e={e} /><OpenStrip e={e} /></> : content && <ReadStrip read={progress?.read.length ?? 0} total={content.sections.length} />}
          </div>
          <span className="flex flex-wrap gap-2">
            {teacher ? (
              <>
                <SaveToggle itemKey={`lesson:${e.ref}`} label={`Bài ${e.lesson.no}`} className="h-8" />
                {content && <Button size="sm" variant="secondary" onClick={() => setPresent(true)}><MonitorPlay /> Trình chiếu</Button>}
                <Button size="sm" onClick={() => setAssign(null)}><Send /> Giao cho lớp</Button>
              </>
            ) : (
              <Button size="sm" variant="violet" onClick={() => ask("cả bài")}><Bot /> Hỏi AI Gia sư</Button>
            )}
          </span>
        </div>
      </header>

      <nav aria-label="Các phần của bài" className="sticky top-16 z-10 -mx-4 mt-4 overflow-x-auto bg-bg/95 px-4 py-2 backdrop-blur sm:mx-0 sm:px-0">
        <ul className="flex w-max gap-1.5 rounded-2xl border border-line bg-surface p-1.5">
          {tabs.map((t) => {
            const M = TAB_META[t];
            const n = counts[t];
            const on = tab === t;
            return (
              <li key={t}>
                <button type="button" ref={on ? (el) => el?.scrollIntoView({ block: "nearest", inline: "nearest" }) : undefined} aria-current={on ? "page" : undefined} onClick={() => setTab(t)} className={cn("flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-semibold transition-colors", on ? M.on : "text-muted hover:bg-surface-2 hover:text-fg")}>
                  <M.icon className="size-4" aria-hidden /> {t === "noi-dung" && !teacher ? "Học" : M.label}
                  {n !== undefined && <span className={cn("rounded-full px-1.5 text-xs tabular-nums", on ? "bg-white/25" : n ? "bg-surface-2 text-fg" : "text-muted")}>{n}</span>}
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
                    {!teacher && !access.can(lessonKey(r)) ? (
                      <span title="Thầy cô chưa mở bài này" className="flex items-start gap-1.5 rounded-lg px-2 py-1.5 leading-snug text-muted/70"><Lock className="mt-0.5 size-3.5 shrink-0" aria-label="đang khóa" />Bài {l.no}. {l.title}</span>
                    ) : <Link href={`${base(role)}/${r}`} aria-current={cur ? "page" : undefined} className={cn("block rounded-lg px-2 py-1.5 leading-snug", cur ? "bg-brand font-semibold text-brand-ink shadow-sm shadow-brand/30" : "text-fg/80 hover:bg-surface-2")}>Bài {l.no}. {l.title}</Link>}
                    {cur && content && (
                      <ul className="my-1 ml-2 space-y-0.5 border-l-2 border-brand/30 pl-2">
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
              <section className="rounded-2xl border border-blue-500/25 bg-blue-500/5 p-4">
                <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-blue-700 dark:text-blue-300"><Target className="size-4" aria-hidden /> Yêu cầu cần đạt</h2>
                <ol className="mt-3 space-y-2 text-sm text-fg">{content.objectives.map((o, i) => <li key={o} className="flex gap-2.5"><span className="grid size-6 shrink-0 place-items-center rounded-full bg-brand text-xs font-bold text-brand-ink">{i + 1}</span><span className="pt-0.5">{o}</span></li>)}</ol>
              </section>
              <section className="mt-4 flex gap-3 rounded-2xl border border-sky-400/30 bg-gradient-to-br from-sky-400/15 to-blue-400/5 p-4">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-sky-500 text-lg text-white" aria-hidden>💡</span>
                <div><h2 className="text-sm font-bold uppercase tracking-wide text-sky-700 dark:text-sky-300">Khởi động</h2>
                <p className="mt-1 text-lg leading-relaxed text-fg"><Rich text={content.warmUp} /></p></div>
              </section>

              {content.sections.map((s, i) => {
                const k = itemKey(refId, s.id);
                const picked = picks.has(k);
                return (
                  <section key={s.id} id={`muc-${s.id}`} className="scroll-mt-32 border-b border-line py-6">
                    <div className="flex flex-wrap items-start gap-2">
                      <h2 className="flex min-w-0 basis-full items-center gap-2.5 text-xl font-bold text-fg sm:basis-auto sm:flex-1"><span className={cn("grid size-8 shrink-0 place-items-center rounded-xl bg-gradient-to-br text-sm font-extrabold text-white", GRADE_BG[e.grade])}>{i + 1}</span>{s.title}{progress?.read.includes(s.id) && <CheckCircle2 className="size-4 text-success-fg" aria-label="đã đọc" />}</h2>
                      {teacher && <Button size="sm" variant="ghost" aria-pressed={picked} onClick={() => d.toggleBookPick(user.id, k)}><Star className={cn(picked && "fill-warning text-warning")} /> {picked ? "Đã chọn dạy" : "Chọn để dạy"}</Button>}
                      <Button size="sm" variant="ghost" onClick={() => ask(s.title)}><Bot /> {teacher ? "Gợi ý cách dạy" : "Hỏi AI về mục này"}</Button>
                    </div>
                    {s.blocks.map((b, j) => <Block key={j} b={b} ctx={ctx} simKey={simKey} />)}
                    <Notes refId={refId} sectionId={s.id} />
                  </section>
                );
              })}

              <section className="py-6">
                <h2 className="flex items-center gap-2 text-xl font-bold text-fg"><ListChecks className="size-5 text-blue-fg" aria-hidden /> Luyện tập</h2>
                <ol className="mt-3 space-y-3">
                  {content.practice.map((p, i) => (
                    <li key={i} className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
                      <p className="text-fg"><span className="font-semibold">Bài {i + 1}.</span> <Rich text={p.task} /></p>
                      {p.hint && <details className="mt-2 text-sm" open={teacher}><summary className="cursor-pointer font-medium text-cyan-fg">Gợi ý</summary><p className="mt-1 text-fg"><Rich text={p.hint} /></p></details>}
                      {p.answer && <details className="mt-2 text-sm" open={teacher}><summary className="cursor-pointer font-medium text-cyan-fg">{teacher ? "Đáp án" : "Xem lời giải"}</summary><pre className="mt-1 overflow-x-auto whitespace-pre-wrap rounded-lg bg-surface-2 p-3 font-mono text-xs text-fg">{p.answer}</pre></details>}
                    </li>
                  ))}
                </ol>
                <div className="mt-6 rounded-2xl border border-indigo-500/25 bg-indigo-500/5 p-4">
                  <h2 className="text-lg font-bold text-indigo-700 dark:text-indigo-300">Vận dụng</h2>
                  <p className="mt-1 leading-7 text-fg/90"><Rich text={content.apply} /></p>
                </div>
                <div className="mt-4 rounded-2xl border border-cyan/40 bg-gradient-to-br from-cyan/10 to-transparent p-4">
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
              <p>Bài này chưa có nội dung. {teacher ? "Thầy cô vẫn gắn được mô phỏng, soạn câu hỏi và giao cho lớp ở các tab phía trên; học sinh sẽ thấy ngay trong bài." : "Em theo dõi bài trên lớp; mô phỏng và luyện tập của bài nằm ở các tab phía trên."}</p>
              <span className="flex flex-wrap gap-2">
                {(teacher ? ["mo-phong", "luyen-tap", "nhiem-vu"] as TabId[] : ["mo-phong", "luyen-tap"] as TabId[]).map((t) => <Button key={t} size="sm" variant="secondary" onClick={() => setTab(t)}>{TAB_META[t].label}{counts[t] ? ` (${counts[t]})` : ""}</Button>)}
              </span>
            </div>
          )}

          <nav className="mt-4 flex flex-wrap justify-between gap-3 border-t border-line pt-4" aria-label="Bài trước và bài sau">
            {prev ? <Link href={`${base(role)}/${prev.ref}`} className="group flex max-w-[48%] items-center gap-2 text-sm text-muted hover:text-fg"><ArrowLeft className="size-4 shrink-0" aria-hidden /><span><span className="block text-xs">Bài trước</span><span className="font-medium text-fg">Bài {prev.lesson.no}. {prev.lesson.title}</span></span></Link> : <span />}
            {next && (teacher || access.can(lessonKey(next.ref))) && <Link href={`${base(role)}/${next.ref}`} className="group ml-auto flex max-w-[48%] items-center gap-2 text-right text-sm text-muted hover:text-fg"><span><span className="block text-xs">Bài sau</span><span className="font-medium text-fg">Bài {next.lesson.no}. {next.lesson.title}</span></span><ArrowRight className="size-4 shrink-0" aria-hidden /></Link>}
          </nav>
        </article>
      </div>
      )}

      {tab !== "noi-dung" && (
        <div className="mt-6 max-w-4xl">
          {tab === "mo-phong" && !teacher && <SimMissions e={e} kinds={["lab"]} />}
          {tab === "mo-phong" && (teacher ? <LessonLabsTab refId={refId} inline={lessonSimSlugs(e)} /> : allSims.length ? <LessonSims labs={allSims.map((s) => getLabBySlug(s)).filter((l): l is NonNullable<typeof l> => !!l)} studentId={user.id} /> : <EmptyState icon={FlaskConical} title="Chưa có mô phỏng được giao" description="Khi thầy cô giao mô phỏng của bài này cho lớp, em sẽ làm ngay tại đây." />)}
          {tab === "luyen-tap" && teacher && (
            <div className="space-y-8">
              <div><ContentChecks e={e} onOpen={() => setTab("noi-dung")} /><LessonQuizTab refId={refId} /></div>
              <section><h3 className="mb-2 font-semibold text-fg">Bài lập trình</h3><LessonCodeTab refId={refId} /></section>
            </div>
          )}
          {tab === "luyen-tap" && !teacher && <><SimMissions e={e} kinds={["quiz", "code"]} /><StudentPracticeTab e={e} /></>}
          {tab === "nhiem-vu" && teacher && <TeacherTasks e={e} onAssign={() => setAssign(null)} />}
          {tab === "hoi-dap" && <LessonQA e={e} />}
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
  const sets = new Set(setsForLesson(e.ref, e.lesson.key).map((x) => x.id));
  const code = new Set(e.lesson.key ? CODING_EXERCISES.filter((x) => x.lessonKey === e.lesson.key).map((x) => x.id) : []);
  return d.assignments.filter((a) => classIds.has(a.classId) && a.status !== "draft" && (!a.studentIds || a.studentIds.includes(userId)))
    .filter((a) => a.sgkRef === e.ref || (a.task?.kind === "lab" && sims.includes(a.task.ref)) || (a.task?.kind === "quiz" && sets.has(a.task.ref)) || (a.task?.kind === "code" && code.has(a.task.ref)));
}

/** Bộ câu hỏi học sinh làm được ở bài này: bộ có sẵn của bài và bộ thầy cô đã giao lớp em. */
function studentPractice(d: DemoData, userId: string, e: BookEntry, can: (key: string) => boolean) {
  const classIds = studentClassIds(d, userId);
  const kinds = (ks: PracticeQuestion["kind"][]) => [...new Set(ks)].map((k) => KIND_LABEL[k]);
  const sets = setsForLesson(e.ref, e.lesson.key).filter((s) => can(setKey(s.id))).map((s) => ({ id: s.id, title: s.title, n: s.questionIds.length, mine: false, kinds: kinds(s.questionIds.map(getQuestion).filter((q): q is PracticeQuestion => !!q).map((q) => q.kind)) }));
  const tq = d.teacherQuizzes.filter((q) => q.sgkRef === e.ref && q.status === "published" && q.classIds.some((c) => classIds.includes(c))).map((q) => ({ id: q.id, title: q.title, n: q.questions.length, mine: true, kinds: kinds(q.questions.map((x) => x.kind)) }));
  return [...tq, ...sets];
}

/** Mô phỏng thầy cô giao thành nhiệm vụ ở bài này: hạn, trạng thái, nút làm. */
function SimMissions({ e, kinds }: { e: BookEntry; kinds: ("lab" | "quiz" | "code")[] }) {
  const { d, user } = useSessionData();
  const tasks = studentLessonTasks(d, user.id, e).filter((a) => a.task && kinds.includes(a.task.kind));
  if (!tasks.length) return null;
  return (
    <ul className="mb-5 space-y-2">
      {tasks.map((a) => {
        const o = taskOutcome(d, user.id, a);
        const late = !o.done && missionStatus(d, user.id, a) === "overdue";
        return (
          <li key={a.id} className={cn("flex flex-wrap items-center gap-3 rounded-2xl border p-4", o.done ? "border-success/40 bg-success/5" : late ? "border-danger/40 bg-danger/5" : "border-brand/40 bg-brand/5")}>
            <ClipboardList className={cn("size-5 shrink-0", o.done ? "text-success-fg" : late ? "text-danger-fg" : "text-blue-fg")} aria-hidden />
            <span className="min-w-0 flex-1">
              <span className="block text-xs font-semibold uppercase tracking-wide text-muted">Thầy cô giao</span>
              <span className="block font-semibold text-fg">{a.title}</span>
              <span className="block text-sm text-muted">{o.done ? `Đã hoàn thành · ${o.text}` : `${late ? "Quá hạn" : "Hạn"} ${formatDate(a.dueAt, true)}`}{a.note ? ` · ${a.note}` : ""}</span>
            </span>
            <Button asChild size="sm" variant={o.done ? "secondary" : "primary"}><Link href={`/student/missions/${a.id}`}>{o.done ? "Xem / làm lại" : "Làm bài"}</Link></Button>
          </li>
        );
      })}
    </ul>
  );
}

function studentCode(e: BookEntry, can: (key: string) => boolean) {
  return e.lesson.key ? CODING_EXERCISES.filter((x) => x.lessonKey === e.lesson.key && can(codeKey(x.id))) : [];
}

/** Bài thầy cô chưa mở cho lớp em. */
function LockedLesson({ e }: { e: BookEntry }) {
  return (
    <EmptyState icon={Lock} title={`Bài ${e.lesson.no}. ${e.lesson.title} chưa được mở`} description="Thầy cô sẽ mở bài khi lớp học tới. Trong lúc chờ, em ôn lại các bài đã mở nhé." action={<Button asChild><Link href={`/student/sgk?lop=${e.grade}`}>Về mục lục khóa học</Link></Button>} />
  );
}

/** Giáo viên mở bài, luyện tập, lập trình của bài này cho từng lớp. */
function OpenStrip({ e }: { e: BookEntry }) {
  const { d, user } = useSessionData();
  const classes = teacherClasses(d, user.id).filter((c) => c.grade === e.grade);
  if (!classes.length) return null;
  return (
    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
      <span className="text-muted">Mở cho học sinh:</span>
      {classes.map((c) => <UnlockChips key={c.id} classId={c.id} refId={e.ref} lessonKey={e.lesson.key} label={c.name} />)}
    </div>
  );
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
      <div className="h-2 w-44 overflow-hidden rounded-full border border-line bg-surface"><div className="h-full rounded-full bg-gradient-to-r from-blue-600 to-sky-400" style={{ width: `${(read / total) * 100}%` }} /></div>
      <span className="font-medium text-fg">Đã đọc {read}/{total} mục{read === total ? " 🎉" : ""}</span>
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

function TeacherTasks({ e, onAssign }: { e: BookEntry; onAssign: () => void }) {
  const { d, user } = useSessionData();
  const assigned = lessonAssignments(d, d.assignments.filter((a) => a.ownerId === user.id), user.id, e);
  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="font-semibold text-fg">Đã giao từ bài này</h3>
        <Button size="sm" onClick={onAssign}><Send /> Giao cho lớp</Button>
      </div>
      {assigned.length === 0 ? <p className="text-sm text-muted">Chưa giao hoạt động nào từ bài này. Chọn mô phỏng hoặc luyện tập ở các tab trên rồi bấm “Giao”.</p> : (
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
                <Button asChild size="sm" variant="ghost"><Link href={`/teacher/assignments/${a.id}`}>Xem kết quả</Link></Button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function StudentPracticeTab({ e }: { e: BookEntry }) {
  const { d, user } = useSessionData();
  const access = useAccess();
  const sets = studentPractice(d, user.id, e, access.can);
  const code = studentCode(e, access.can);
  const locked = setsForLesson(e.ref, e.lesson.key).filter((s) => !access.can(setKey(s.id))).length + (e.lesson.key ? CODING_EXERCISES.filter((x) => x.lessonKey === e.lesson.key && !access.can(codeKey(x.id))).length : 0);
  if (!sets.length && !code.length) return locked ? <EmptyState icon={Lock} title="Phần luyện tập chưa mở" description={`Bài có ${locked} bộ luyện tập / bài lập trình. Thầy cô sẽ mở khi lớp học xong phần lí thuyết.`} /> : <p className="text-sm text-muted">Bài này chưa có bộ câu hỏi hay bài lập trình riêng. Câu hỏi củng cố nằm ngay trong phần Nội dung.</p>;
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
