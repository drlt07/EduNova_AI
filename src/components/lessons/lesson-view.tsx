"use client";
import Link from "next/link";
import { createContext, useContext, useEffect, useState } from "react";
import { motion } from "motion/react";
import { ArrowLeft, Bookmark, BookmarkCheck, Bot, CheckCircle2, Circle, Clock, Code2, Eye, FlaskConical, Gamepad2, HelpCircle, Lightbulb, ListChecks, NotebookPen, Star, Target, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Lesson } from "@/lib/domain/types";
import { DIFFICULTY_LABEL, getObjective, getTextbook, getTopic } from "@/lib/data/curriculum";
import { getLessonContent, type Block } from "@/lib/data/lesson-content";
import { CODING_EXERCISES } from "@/lib/data/coding-exercises";
import { PRACTICE_SETS } from "@/lib/data/practice";
import { lessonSections } from "@/lib/store/student-insights";
import { useApp } from "@/lib/store/app-store";
import { cn, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Notice, Progress } from "@/components/ui/feedback";
import { Label, Textarea } from "@/components/ui/form";
import { LabPreview } from "@/components/labs/lab-preview";
import { useTutor } from "@/components/tutor/tutor-provider";
import { lessonLabs } from "./lesson-card";
import { IfVisualizer } from "./if-visualizer";
import { Quiz } from "./quiz";

const DIFF_TONE = { "co-ban": "success", "trung-binh": "warning", "nang-cao": "danger" } as const;

/** Thông tin học sinh (nếu có) để theo dõi tiến độ từng phần. */
const StudentCtx = createContext<{ studentId: string; lesson: Lesson } | null>(null);

function Code({ code, label }: { code: string; label?: string }) {
  return (
    <div>
      {label && <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>}
      <pre tabIndex={0} className="overflow-x-auto rounded-xl bg-[#0B1220] p-4 font-mono text-[13px] leading-6 text-slate-200">{code}</pre>
    </div>
  );
}

function BlockView({ b }: { b: Block }) {
  switch (b.type) {
    case "p":
      return <p className="leading-relaxed text-fg">{b.text}</p>;
    case "code":
      return <Code code={b.code} />;
    case "note":
      return <Notice tone="warning"><strong>Lưu ý: </strong>{b.text}</Notice>;
    case "table":
      return (
        <div className="overflow-x-auto rounded-xl border border-line" tabIndex={0}>
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-2 text-xs text-muted"><tr>{b.head.map((h) => <th key={h} className="px-3 py-2 font-semibold">{h}</th>)}</tr></thead>
            <tbody>{b.rows.map((r, i) => <tr key={i} className="border-t border-line">{r.map((c, k) => <td key={k} className="px-3 py-2 font-mono text-fg">{c}</td>)}</tr>)}</tbody>
          </table>
        </div>
      );
  }
}

function SectionBar({ id, title }: { id: string; title: string }) {
  const ctx = useContext(StudentCtx)!;
  const { studentId, lesson } = ctx;
  const p = useApp((s) => s.lessonProgress.find((x) => x.studentId === studentId && x.lessonId === lesson.id));
  const markSection = useApp((s) => s.markSection);
  const toggleConfused = useApp((s) => s.toggleConfused);
  const tutor = useTutor();
  const done = !!p?.sectionsDone.includes(id);
  const confused = !!p?.confused.includes(id);
  const topic = lesson.key.includes("if") ? "if" : lesson.key.includes("loop") ? "loop" : lesson.key.includes("binary") ? "binary" : "general";
  return (
    <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-line pt-4">
      {id === "kiem-tra" ? (
        <span className={cn("flex items-center gap-1.5 text-sm", done ? "text-success-fg" : "text-muted")}>
          {done ? <CheckCircle2 className="size-4" /> : <Circle className="size-4" />}
          {done ? `Đã đạt (${p?.quiz?.correct}/${p?.quiz?.total})` : p?.quiz ? `Lần trước đúng ${p.quiz.correct}/${p.quiz.total} — cần đúng ít nhất 60%` : "Phần này hoàn thành khi em làm bài kiểm tra nhanh"}
        </span>
      ) : (
        <Button size="sm" variant={done ? "secondary" : "primary"} aria-pressed={done} onClick={() => markSection(studentId, lesson.id, id, !done)} data-testid={`done-${id}`}>
          {done ? <CheckCircle2 className="size-4" /> : <Circle className="size-4" />} {done ? "Đã học xong" : "Đánh dấu đã học xong"}
        </Button>
      )}
      <Button size="sm" variant="ghost" aria-pressed={confused} onClick={() => toggleConfused(studentId, lesson.id, id)} className={cn(confused && "bg-warning/15 text-warning-fg")}>
        <HelpCircle className="size-4" /> {confused ? "Em chưa hiểu phần này" : "Chưa hiểu"}
      </Button>
      <Button size="sm" variant="ghost" onClick={() => tutor.open({ title: `${lesson.title} — ${title}`, topic, ref: `${lesson.id}#${id}` })}><Bot className="size-4" /> Hỏi gia sư</Button>
      {confused && <span className="w-full text-xs text-warning-fg">Giáo viên sẽ thấy phần này cần giảng lại. Em có thể hỏi gia sư hoặc xem lại ví dụ.</span>}
    </div>
  );
}

function Section({ id, icon: Icon, title, step, track, children }: { id: string; icon: React.ComponentType<{ className?: string }>; title: string; step?: number; track?: boolean; children: React.ReactNode }) {
  const ctx = useContext(StudentCtx);
  return (
    <motion.section
      id={id}
      aria-labelledby={`${id}-h`}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.4 }}
      className="scroll-mt-24 rounded-2xl border border-line bg-surface p-5 sm:p-6"
    >
      <h2 id={`${id}-h`} className="mb-4 flex items-center gap-2 text-xl font-bold text-fg">
        {step ? <span className="grid size-8 place-items-center rounded-full bg-gradient-to-br from-cyan to-violet text-sm text-white">{step}</span> : <Icon className="size-5 text-cyan-fg" />}
        {title}
      </h2>
      <div className="space-y-4">{children}</div>
      {ctx && track && <SectionBar id={id} title={title} />}
    </motion.section>
  );
}

function TermList({ lesson }: { lesson: Lesson }) {
  const ctx = useContext(StudentCtx);
  const bookmarks = useApp((s) => s.bookmarks);
  const toggleBookmark = useApp((s) => s.toggleBookmark);
  if (!lesson.concepts?.length) return null;
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {lesson.concepts.map((c) => {
        const saved = ctx && bookmarks.some((b) => b.studentId === ctx.studentId && b.kind === "term" && b.refId === `${lesson.id}:${c.term}`);
        return (
          <div key={c.term} className="relative rounded-xl border border-cyan/25 bg-cyan/5 p-4">
            <p className="pr-8 font-semibold text-cyan-fg">{c.term}</p>
            <p className="mt-1 text-sm text-fg">{c.definition}</p>
            {ctx && (
              <button type="button" aria-pressed={!!saved} aria-label={saved ? `Bỏ lưu thuật ngữ ${c.term}` : `Lưu thuật ngữ ${c.term}`} onClick={() => { const on = toggleBookmark({ studentId: ctx.studentId, kind: "term", refId: `${lesson.id}:${c.term}`, title: c.term, detail: c.definition, href: `/student/learning/${lesson.id}#kien-thuc` }); toast.success(on ? "Đã lưu thuật ngữ" : "Đã bỏ lưu"); }} className="absolute right-3 top-3 rounded p-1 text-muted hover:text-warning-fg">
                <Star className={cn("size-4", saved && "fill-warning text-warning-fg")} />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

function NotesPanel({ studentId, lesson }: { studentId: string; lesson: Lesson }) {
  const notes = useApp((s) => s.notes).filter((n) => n.studentId === studentId && n.lessonId === lesson.id);
  const addNote = useApp((s) => s.addNote);
  const deleteNote = useApp((s) => s.deleteNote);
  const [text, setText] = useState("");
  return (
    <div className="rounded-2xl border border-line bg-surface p-4">
      <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-fg"><NotebookPen className="size-4 text-violet-fg" /> Ghi chú của em</p>
      <form onSubmit={(e) => { e.preventDefault(); if (!text.trim()) return; addNote(studentId, lesson.id, text.trim().slice(0, 1000)); setText(""); toast.success("Đã lưu ghi chú"); }}>
        <Label htmlFor="note" className="sr-only">Ghi chú mới</Label>
        <Textarea id="note" value={text} onChange={(e) => setText(e.target.value)} placeholder="Điều em muốn nhớ…" className="min-h-[70px] text-sm" />
        <Button type="submit" size="sm" className="mt-2 w-full" disabled={!text.trim()}>Lưu ghi chú</Button>
      </form>
      <ul className="mt-3 max-h-56 space-y-2 overflow-y-auto" tabIndex={0} aria-label="Danh sách ghi chú">
        {notes.map((n) => (
          <li key={n.id} className="group rounded-lg bg-surface-2 p-2 text-sm">
            <p className="whitespace-pre-wrap text-fg">{n.text}</p>
            <p className="mt-1 flex items-center justify-between text-xs text-muted">{formatDate(n.createdAt, true)}<button type="button" onClick={() => deleteNote(n.id)} aria-label="Xóa ghi chú" className="rounded p-0.5 hover:text-danger-fg"><Trash2 className="size-3.5" /></button></p>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Ghi lại phần đang đọc để lần sau quay lại đúng chỗ. */
function useTrackReading(studentId: string | undefined, lessonId: string, ids: string[]) {
  const setLastSection = useApp((s) => s.setLastSection);
  const key = ids.join(",");
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash) window.setTimeout(() => document.getElementById(hash)?.scrollIntoView({ behavior: "smooth" }), 250);
  }, []);
  useEffect(() => {
    if (!studentId || typeof IntersectionObserver === "undefined") return;
    let last = "";
    const obs = new IntersectionObserver((entries) => {
      const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (vis && vis.target.id !== last) {
        last = vis.target.id;
        setLastSection(studentId, lessonId, last);
      }
    }, { rootMargin: "-30% 0px -60% 0px" });
    for (const id of key.split(",")) {
      const el = document.getElementById(id);
      if (el) obs.observe(el);
    }
    return () => obs.disconnect();
  }, [studentId, lessonId, key, setLastSection]);
}

export function LessonView({ lesson, backHref, backLabel, studentId }: { lesson: Lesson; backHref: string; backLabel: string; studentId?: string }) {
  const content = getLessonContent(lesson.key);
  const labs = lessonLabs(lesson);
  const tracked = lessonSections(lesson.id);
  const progress = useApp((s) => (studentId ? s.lessonProgress.find((x) => x.studentId === studentId && x.lessonId === lesson.id) : undefined));
  const bookmarked = useApp((s) => !!studentId && s.bookmarks.some((b) => b.studentId === studentId && b.kind === "lesson" && b.refId === lesson.id));
  const toggleBookmark = useApp((s) => s.toggleBookmark);
  const recordLessonQuiz = useApp((s) => s.recordLessonQuiz);
  const exercises = CODING_EXERCISES.filter((e) => e.lessonKey === lesson.key);
  const sets = PRACTICE_SETS.filter((s) => s.lessonKey === lesson.key);
  const toc: [string, string][] = content
    ? [["muc-tieu", "Mục tiêu"], ["khoi-dong", "1. Tình huống mở đầu"], ["kien-thuc", "2. Khám phá kiến thức"], ["quan-sat", "3. Quan sát trực quan"], ["kiem-tra", "4. Kiểm tra nhanh"], ["van-dung", "5. Vận dụng"], ["ghi-nho", "Ghi nhớ"]]
    : [["muc-tieu", "Mục tiêu"], ["kien-thuc", "Nội dung"], ...(labs.length ? [["mo-phong", "Mô phỏng"] as [string, string]] : []), ...(lesson.quiz?.length ? [["kiem-tra", "Kiểm tra nhanh"] as [string, string]] : [])];
  useTrackReading(studentId, lesson.id, toc.map(([id]) => id));
  const doneCount = tracked.filter((s) => progress?.sectionsDone.includes(s)).length;
  const quiz = lesson.quiz?.length ? <Quiz questions={lesson.quiz} onComplete={studentId ? (c, t) => { recordLessonQuiz(studentId, lesson.id, c, t); toast.success(c / t >= 0.6 ? "Đã ghi nhận kết quả — em đạt phần kiểm tra nhanh" : "Đã ghi nhận kết quả — em xem lại phần kiến thức nhé"); } : undefined} /> : null;

  const body = (
    <div>
      <Button asChild variant="ghost" size="sm"><Link href={backHref}><ArrowLeft /> {backLabel}</Link></Button>
      <header className="relative mt-3 overflow-hidden rounded-2xl border border-line bg-gradient-to-br from-cyan/10 via-surface to-violet/5 p-6">
        <span aria-hidden className="pointer-events-none absolute -right-12 -top-12 size-48 rounded-full bg-cyan/20 blur-3xl [animation:blob-float_10s_ease-in-out_infinite]" />
        <div className="relative">
          <p className="text-sm text-muted">Tin học {lesson.grade} · Chủ đề {lesson.topicId}. {getTopic(lesson.topicId)?.name}</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-fg">{lesson.title}</h1>
          <p className="mt-2 max-w-3xl text-muted">{lesson.summary}</p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Badge tone="blue">Lớp {lesson.grade} · Bài {lesson.order}</Badge>
            <Badge>{getTextbook(lesson.textbookId).name}</Badge>
            <Badge tone={DIFF_TONE[lesson.difficulty]}>{DIFFICULTY_LABEL[lesson.difficulty]}</Badge>
            {content && <Badge tone="neutral"><Clock className="size-3" aria-hidden /> {content.duration}</Badge>}
            {labs.length > 0 && <Badge tone="success"><FlaskConical className="size-3" aria-hidden /> Có mô phỏng</Badge>}
            {studentId && (
              <Button size="sm" variant="ghost" aria-pressed={bookmarked} onClick={() => { const on = toggleBookmark({ studentId, kind: "lesson", refId: lesson.id, title: lesson.title, href: `/student/learning/${lesson.id}` }); toast.success(on ? "Đã lưu bài học" : "Đã bỏ lưu"); }} data-testid="lesson-bookmark">
                {bookmarked ? <BookmarkCheck className="size-4 text-warning-fg" /> : <Bookmark className="size-4" />} {bookmarked ? "Đã lưu" : "Lưu bài"}
              </Button>
            )}
          </div>
          {studentId && tracked.length > 0 && (
            <div className="mt-4 max-w-md">
              <Progress value={(doneCount / tracked.length) * 100} label={`Đã học ${doneCount}/${tracked.length} phần`} />
              <p className="mt-1 text-xs text-muted">Đã học {doneCount}/{tracked.length} phần. Phần “Kiểm tra nhanh” chỉ hoàn thành khi em trả lời đúng ít nhất 60%.</p>
            </div>
          )}
        </div>
      </header>

      <div className="mt-6 grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
        <div className="hidden space-y-4 lg:sticky lg:top-24 lg:block lg:h-fit">
          <nav aria-label="Mục lục bài học">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Mục lục</p>
            <ol className="space-y-1 border-l border-line">
              {toc.map(([id, label]) => {
                const done = progress?.sectionsDone.includes(id);
                const here = progress?.lastSection === id;
                return (
                  <li key={id}>
                    <a href={`#${id}`} onClick={(e) => { e.preventDefault(); document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }); history.replaceState(null, "", `#${id}`); }} className={cn("-ml-px flex items-center gap-1.5 border-l-2 py-1 pl-3 text-sm hover:border-cyan hover:text-fg", here ? "border-cyan text-fg" : "border-transparent text-muted")}>
                      {studentId && tracked.includes(id) && (done ? <CheckCircle2 className="size-3.5 shrink-0 text-success-fg" aria-label="đã học" /> : <Circle className="size-3.5 shrink-0" aria-hidden />)}
                      {label}
                    </a>
                  </li>
                );
              })}
            </ol>
          </nav>
          {studentId && <NotesPanel studentId={studentId} lesson={lesson} />}
        </div>

        <div className="min-w-0 space-y-6">
          <Section id="muc-tieu" icon={Target} title="Mục tiêu bài học" track>
            <p className="text-fg">Sau bài học này, em có thể:</p>
            <ul className="space-y-2">
              {lesson.objectiveIds.map((o) => <li key={o} className="flex gap-2 text-fg"><span className="mt-1 size-2 shrink-0 rounded-full bg-cyan" aria-hidden />{getObjective(o)?.description}</li>)}
            </ul>
          </Section>

          {content ? (
            <>
              <Section id="khoi-dong" icon={Lightbulb} step={1} title="Tình huống mở đầu" track>
                <p className="rounded-xl bg-surface-2 p-4 font-medium text-fg">{content.warmUp.question}</p>
                <details className="rounded-xl border border-line p-4">
                  <summary className="cursor-pointer font-medium text-cyan-fg">Gợi ý suy nghĩ</summary>
                  <p className="mt-2 text-fg">{content.warmUp.idea}</p>
                </details>
              </Section>
              <Section id="kien-thuc" icon={ListChecks} step={2} title="Khám phá kiến thức" track>
                <TermList lesson={lesson} />
                {content.sections.map((s) => (
                  <div key={s.title} className="space-y-3">
                    <h3 className="text-lg font-semibold text-fg">{s.title}</h3>
                    {s.blocks.map((b, i) => <BlockView key={i} b={b} />)}
                  </div>
                ))}
                <h3 className="pt-2 text-lg font-semibold text-fg">Ví dụ</h3>
                {content.examples.map((ex) => (
                  <div key={ex.title} className="space-y-3 rounded-xl border border-line p-4">
                    <h4 className="font-semibold text-fg">{ex.title}</h4>
                    <Code code={ex.code} label="Chương trình" />
                    <div className="overflow-x-auto" tabIndex={0}>
                      <table className="w-full text-left text-sm">
                        <thead className="text-xs text-muted"><tr><th className="pb-1 pr-4 font-medium">Đầu vào</th><th className="pb-1 font-medium">Kết quả</th></tr></thead>
                        <tbody>{ex.run.map((r, i) => <tr key={i} className="border-t border-line"><td className="py-1.5 pr-4 font-mono text-fg">{r.input ?? "—"}</td><td className="py-1.5 font-mono text-success-fg">{r.output}</td></tr>)}</tbody>
                      </table>
                    </div>
                    <p className="text-sm text-muted">{ex.explain}</p>
                  </div>
                ))}
              </Section>
              <Section id="quan-sat" icon={Eye} step={3} title="Quan sát trực quan" track>
                <p className="text-fg">Kéo thanh độ ẩm và bật/tắt bình nước. Dòng lệnh sáng lên là dòng thực sự được chạy — kết quả lấy từ việc chạy chương trình, không phải hình vẽ sẵn.</p>
                <IfVisualizer />
                {labs.length > 0 && (
                  <details className="rounded-xl border border-line p-4">
                    <summary className="cursor-pointer font-medium text-cyan-fg">Mở phòng thí nghiệm đầy đủ</summary>
                    {content.labTask && <p className="mt-3 rounded-xl bg-success/10 p-3 text-sm text-fg">Nhiệm vụ: {content.labTask}</p>}
                    <div className="mt-3 space-y-3">{labs.map((lab) => <LabPreview key={lab.id} slug={lab.slug} />)}</div>
                  </details>
                )}
              </Section>
              {quiz && <Section id="kiem-tra" icon={ListChecks} step={4} title="Kiểm tra nhanh" track>{quiz}</Section>}
              <Section id="van-dung" icon={Target} step={5} title="Vận dụng" track>
                {studentId && (
                  <div className="grid gap-3 sm:grid-cols-3">
                    <Link href="/student/games/smart-farm" className="group rounded-xl border border-success/30 bg-gradient-to-br from-success/10 to-transparent p-4 transition-all hover:-translate-y-0.5">
                      <Gamepad2 className="size-6 text-success-fg" aria-hidden />
                      <p className="mt-2 font-semibold text-fg">Nông trại thông minh</p>
                      <p className="text-sm text-muted">Lập trình máy bơm qua 4 cấp độ</p>
                    </Link>
                    {exercises.length > 0 && (
                      <Link href={`/student/code?bai=${exercises[0].id}`} className="rounded-xl border border-cyan/30 bg-gradient-to-br from-cyan/10 to-transparent p-4 transition-all hover:-translate-y-0.5">
                        <Code2 className="size-6 text-cyan-fg" aria-hidden />
                        <p className="mt-2 font-semibold text-fg">{exercises.length} bài lập trình</p>
                        <p className="text-sm text-muted">Có kiểm thử tự động</p>
                      </Link>
                    )}
                    {sets.length > 0 && (
                      <Link href={`/student/practice/${sets[0].id}`} className="rounded-xl border border-violet/30 bg-gradient-to-br from-violet/10 to-transparent p-4 transition-all hover:-translate-y-0.5">
                        <ListChecks className="size-6 text-violet-fg" aria-hidden />
                        <p className="mt-2 font-semibold text-fg">Luyện tập thêm</p>
                        <p className="text-sm text-muted">{sets.map((s) => s.title).join(", ")}</p>
                      </Link>
                    )}
                  </div>
                )}
                {content.exercises.map((ex) => (
                  <div key={ex.title} className="space-y-2 rounded-xl border border-line p-4">
                    <h3 className="font-semibold text-fg">{ex.title}</h3>
                    <p className="text-fg">{ex.task}</p>
                    <details className="rounded-lg bg-surface-2 p-3">
                      <summary className="cursor-pointer text-sm font-medium text-cyan-fg">Xem gợi ý</summary>
                      <p className="mt-2 text-sm text-fg">{ex.hint}</p>
                    </details>
                    <details className="rounded-lg bg-surface-2 p-3">
                      <summary className="cursor-pointer text-sm font-medium text-cyan-fg">Xem lời giải</summary>
                      <div className="mt-2"><Code code={ex.solution} /></div>
                    </details>
                  </div>
                ))}
              </Section>
              <Section id="ghi-nho" icon={Lightbulb} title="Ghi nhớ">
                <ul className="space-y-2">{content.remember.map((r) => <li key={r} className="flex gap-2 text-fg"><span className="mt-1 size-2 shrink-0 rounded-full bg-success" aria-hidden />{r}</li>)}</ul>
              </Section>
            </>
          ) : (
            <>
              <Section id="kien-thuc" icon={ListChecks} title="Nội dung" track>
                <TermList lesson={lesson} />
                <Notice tone="info">Bài giảng chi tiết của bài này đang được biên soạn. Xem bài mẫu đầy đủ: “Câu lệnh rẽ nhánh if” (Tin 10).</Notice>
              </Section>
              {labs.length > 0 && (
                <Section id="mo-phong" icon={FlaskConical} title="Mô phỏng">
                  {labs.map((lab) => (
                    <div key={lab.id} className="space-y-2">
                      {labs.length > 1 && <h3 className="font-semibold text-fg">{lab.title}</h3>}
                      <LabPreview slug={lab.slug} />
                    </div>
                  ))}
                </Section>
              )}
              {quiz && <Section id="kiem-tra" icon={ListChecks} title="Kiểm tra nhanh" track>{quiz}</Section>}
            </>
          )}
          {studentId && <div className="lg:hidden"><NotesPanel studentId={studentId} lesson={lesson} /></div>}
          <p className="text-xs text-muted">Nội dung mang tính minh họa, giáo viên nên đối chiếu với sách giáo khoa trước khi sử dụng.</p>
        </div>
      </div>
    </div>
  );
  return studentId ? <StudentCtx.Provider value={{ studentId, lesson }}>{body}</StudentCtx.Provider> : body;
}
