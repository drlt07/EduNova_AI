"use client";
/**
 * Trình soạn khóa học: Khóa học → Chương → Bài → Hoạt động (kiến thức, mô phỏng, thực hành…) + Bài kiểm tra cuối bài.
 * Tab Tiến độ: bảng học sinh × bài, trạng thái từng bài và điểm bài kiểm tra.
 */
import Link from "next/link";
import { Suspense, useMemo, useState } from "react";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, ArrowLeft, CalendarClock, ChevronDown, ChevronUp, ClipboardCheck, Eye, FlaskConical, GripVertical, Layers, Lock, Pencil, Plus, Send, Settings2, Trash2, Undo2, Users } from "lucide-react";
import { toast } from "sonner";
import type { Course, CourseBlock, CourseBlockKind, CourseLesson, CourseProgress, CourseTopic } from "@/lib/domain/types";
import { allLessons, courseCompletion, finalTest, lessonCells, moveItem, newBlock, newLesson, newTopic, validateForPublish, type CellState } from "@/lib/courses/course";
import { TEXTBOOKS } from "@/lib/data/curriculum";
import { getLabBySlug } from "@/lib/data/labs";
import { getSet, setsForLesson } from "@/lib/data/practice";
import { findSgk, sgkLessonId } from "@/lib/data/sgk-kntt";
import { gradeLessons, lessonItems } from "@/lib/access/unlocks";
import { assignedStudents, classStudents, teacherClasses } from "@/lib/store/scoped";
import { useSessionData } from "@/lib/store/use-role";
import { taskOutcome } from "@/lib/teacher/assign";
import { cn, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { EmptyState, ErrorState, Notice, PageSkeleton } from "@/components/ui/feedback";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/form";
import { PageHeader } from "@/components/ui/misc";
import { BlockEditor } from "@/components/courses/block-editor";
import { BLOCK_ICON } from "@/components/courses/block-view";
import { CoursePlayer } from "@/components/courses/course-player";
import { AssignDialog, type AssignPreset } from "@/components/teacher/assign-dialog";

const ADD_KINDS: { kind: CourseBlockKind; label: string }[] = [
  { kind: "text", label: "Kiến thức" },
  { kind: "simulation", label: "Đính kèm mô phỏng" },
  { kind: "python", label: "Thực hành Python" },
  { kind: "media", label: "Video / hình" },
  { kind: "practice", label: "Luyện tập" },
  { kind: "file", label: "Tài liệu" },
];
type Tab = "noi-dung" | "tien-do" | "thong-tin";
type Drag = { kind: "block"; index: number } | { kind: "lesson"; topicId: string; index: number } | null;

export default function CourseEditorPage() {
  return <Suspense fallback={<PageSkeleton />}><Inner /></Suspense>;
}

function Inner() {
  const { id } = useParams<{ id: string }>();
  const { d, user } = useSessionData();
  const course = d.courses.find((c) => c.id === id && c.ownerId === user.id);
  if (!course) {
    return <ErrorState page title="Không tìm thấy khóa học" description="Khóa học không tồn tại hoặc không thuộc quyền của bạn." action={<Button asChild variant="secondary"><Link href="/teacher/courses">Về danh sách khóa học</Link></Button>} />;
  }
  return <Editor key={course.id} course={course} />;
}

function Editor({ course }: { course: Course }) {
  const { d, user } = useSessionData();
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const raw = params.get("xem");
  const tab: Tab = raw === "tien-do" || raw === "thong-tin" ? raw : "noi-dung";
  const setTab = (t: Tab) => router.replace(t === "noi-dung" ? pathname : `${pathname}?xem=${t}`, { scroll: false });
  const [lessonId, setLessonId] = useState<string | undefined>(() => allLessons(course).find((l) => l.blocks.length > 2)?.id ?? allLessons(course)[0]?.id);
  const [preview, setPreview] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const bookName = TEXTBOOKS.find((t) => t.id === course.textbookId)?.name;
  const classes = d.classes.filter((c) => course.classIds.includes(c.id));

  if (preview) {
    return (
      <>
        <PageHeader title={`Xem như học sinh: ${course.title}`} description="Bản xem trước — thao tác ở đây không ghi vào tiến độ của học sinh." actions={<Button variant="secondary" onClick={() => setPreview(false)}><Pencil /> Quay lại chỉnh sửa</Button>} />
        <PreviewPlayer course={course} />
      </>
    );
  }

  const TABS: { id: Tab; label: string; icon: typeof Layers }[] = [
    { id: "noi-dung", label: "Chương trình", icon: Layers },
    { id: "tien-do", label: "Tiến độ học sinh", icon: Users },
    { id: "thong-tin", label: "Thông tin & lớp", icon: Settings2 },
  ];

  return (
    <>
      <Button asChild variant="ghost" size="sm" className="mb-2"><Link href="/teacher/courses"><ArrowLeft /> Khóa học</Link></Button>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-cyan-fg">Khóa học · Tin học {course.grade} · {bookName}</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-fg">{course.title || "Khóa học chưa đặt tên"}</h1>
          <p className="mt-1 flex flex-wrap items-center gap-1.5 text-sm text-muted">
            {course.status === "published" ? <Badge tone="success">Đang dạy</Badge> : <Badge>Bản nháp</Badge>}
            <span>Tin học {course.grade} →</span>
            {classes.length ? classes.map((c) => <span key={c.id} className="rounded-md bg-fg px-1.5 py-0.5 text-xs font-bold text-bg">{c.name}</span>) : <span className="italic">chưa chọn lớp</span>}
            <span>· {course.topics.length} chương · {allLessons(course).length} bài · lưu tự động</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => setPreview(true)}><Eye /> Xem như học sinh</Button>
          <Button onClick={() => setPublishOpen(true)}><Send /> {course.status === "published" ? "Lớp học / thu hồi" : "Phát hành cho lớp"}</Button>
        </div>
      </div>

      <div className="mb-5 flex gap-1 overflow-x-auto border-b border-line" role="tablist" aria-label="Khóa học">
        {TABS.map((t) => (
          <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)} className={cn("-mb-px flex shrink-0 items-center gap-2 border-b-2 px-3 py-2 text-sm font-medium", tab === t.id ? "border-fg text-fg" : "border-transparent text-muted hover:text-fg")}>
            <t.icon className="size-4" aria-hidden /> {t.label}
          </button>
        ))}
      </div>

      {tab === "noi-dung" && <Builder course={course} lessonId={lessonId} setLessonId={setLessonId} />}
      {tab === "tien-do" && <ProgressTab course={course} onOpenLesson={(id) => { setLessonId(id); setTab("noi-dung"); }} />}
      {tab === "thong-tin" && (
        <div className="max-w-3xl space-y-3 rounded-2xl border border-line bg-surface p-5">
          <Field label="Tên khóa học" htmlFor="c-title"><Input id="c-title" value={course.title} onChange={(e) => d.updateCourse(course.id, { title: e.target.value })} /></Field>
          <Field label="Mô tả" htmlFor="c-desc"><Textarea id="c-desc" rows={3} value={course.description} onChange={(e) => d.updateCourse(course.id, { description: e.target.value })} /></Field>
          <Checkbox label="Học lần lượt: hoàn thành bài trước mới mở bài sau" checked={course.sequential} onChange={(e) => d.updateCourse(course.id, { sequential: e.target.checked })} />
          <p className="text-sm text-muted">Lớp học: {classes.map((c) => c.name).join(", ") || "chưa chọn"}. Đổi lớp ở nút “{course.status === "published" ? "Lớp học / thu hồi" : "Phát hành cho lớp"}”.</p>
        </div>
      )}

      <PublishDialog course={course} open={publishOpen} onOpenChange={setPublishOpen} actorId={user.id} />
    </>
  );
}

/* ---------- Chương trình: cây chương → bài, nội dung bài ---------- */

function Builder({ course, lessonId, setLessonId }: { course: Course; lessonId?: string; setLessonId: (id?: string) => void }) {
  const { d } = useSessionData();
  const [drag, setDrag] = useState<Drag>(null);
  const [editTopic, setEditTopic] = useState<string | null>(null);
  const lesson = allLessons(course).find((l) => l.id === lessonId);
  const setTopics = (topics: CourseTopic[]) => d.updateCourse(course.id, { topics });
  const patchLesson = (lid: string, fn: (l: CourseLesson) => CourseLesson) => setTopics(course.topics.map((t) => ({ ...t, lessons: t.lessons.map((l) => (l.id === lid ? fn(l) : l)) })));

  function addTopic() {
    const t = newTopic(`Chương ${course.topics.length + 1}. Chương mới`);
    setTopics([...course.topics, t]);
    setEditTopic(t.id);
  }
  function addLesson(topicId: string) {
    const l = newLesson("Bài học mới", undefined, [newBlock("text", { title: "Tóm tắt kiến thức" })]);
    setTopics(course.topics.map((t) => (t.id === topicId ? { ...t, lessons: [...t.lessons, l] } : t)));
    setLessonId(l.id);
  }
  function deleteTopic(t: CourseTopic) {
    if (!window.confirm(`Xóa "${t.title}" cùng ${t.lessons.length} bài học?`)) return;
    setTopics(course.topics.filter((x) => x.id !== t.id));
    if (t.lessons.some((l) => l.id === lessonId)) setLessonId(undefined);
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[340px_minmax(0,1fr)]">
      <aside className="space-y-3 lg:sticky lg:top-20 lg:self-start" aria-label="Chương và bài">
        <div className="max-h-[75vh] space-y-2 overflow-y-auto rounded-2xl border border-line bg-surface p-2">
          {course.topics.length === 0 && <p className="p-3 text-sm text-muted">Chưa có chương. Thêm chương để bắt đầu.</p>}
          {course.topics.map((t, ti) => (
            <details key={t.id} open={t.lessons.some((l) => l.id === lessonId) || ti === 0} className="group rounded-xl bg-surface-2/60 p-1.5">
              <summary className="flex cursor-pointer list-none items-center gap-1 rounded-lg px-1.5 py-1">
                {editTopic === t.id ? (
                  <TopicForm topic={t} onSave={(patch) => { setTopics(course.topics.map((x) => (x.id === t.id ? { ...x, ...patch } : x))); setEditTopic(null); }} onCancel={() => setEditTopic(null)} />
                ) : (
                  <>
                    <ChevronDown className="size-3.5 shrink-0 text-muted transition-transform group-open:rotate-180" aria-hidden />
                    <span className="min-w-0 flex-1 text-sm font-bold text-fg">{t.title}</span>
                    <span className="text-xs text-muted">{t.lessons.length}</span>
                    <Button size="icon" variant="ghost" className="size-7" disabled={ti === 0} onClick={(e) => { e.preventDefault(); setTopics(moveItem(course.topics, ti, ti - 1)); }} aria-label={`Đưa ${t.title} lên`}><ChevronUp className="size-3.5" /></Button>
                    <Button size="icon" variant="ghost" className="size-7" onClick={(e) => { e.preventDefault(); setEditTopic(t.id); }} aria-label={`Sửa ${t.title}`}><Pencil className="size-3.5" /></Button>
                    <Button size="icon" variant="ghost" className="size-7" onClick={(e) => { e.preventDefault(); deleteTopic(t); }} aria-label={`Xóa ${t.title}`}><Trash2 className="size-3.5" /></Button>
                  </>
                )}
              </summary>
              <ul className="mt-1 space-y-0.5">
                {t.lessons.map((l, li) => {
                  const sims = l.blocks.filter((b) => b.kind === "simulation").length;
                  const test = finalTest(l);
                  return (
                    <li
                      key={l.id}
                      draggable
                      onDragStart={(e) => { e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", l.id); setDrag({ kind: "lesson", topicId: t.id, index: li }); }}
                      onDragEnd={() => setDrag(null)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => { e.preventDefault(); if (drag?.kind === "lesson" && drag.topicId === t.id) setTopics(course.topics.map((x) => (x.id === t.id ? { ...x, lessons: moveItem(x.lessons, drag.index, li) } : x))); setDrag(null); }}
                      className={cn("flex items-center gap-1 rounded-lg", drag?.kind === "lesson" && drag.topicId === t.id && drag.index === li && "opacity-50")}
                    >
                      <GripVertical className="size-3.5 shrink-0 cursor-grab text-muted" aria-hidden />
                      <button type="button" onClick={() => setLessonId(l.id)} aria-current={l.id === lessonId ? "true" : undefined} className={cn("min-w-0 flex-1 rounded-lg px-2 py-1.5 text-left", l.id === lessonId ? "bg-cyan/15" : "hover:bg-surface")}>
                        <span className={cn("block truncate text-sm", l.id === lessonId ? "font-semibold text-fg" : "text-fg")}>{l.title}</span>
                        <span className="flex items-center gap-2 text-[11px] text-muted">
                          <span>{l.blocks.filter((b) => !b.final).length} hoạt động</span>
                          {sims > 0 && <span className="inline-flex items-center gap-0.5 text-cyan-fg"><FlaskConical className="size-3" aria-hidden />{sims}</span>}
                          {test ? <span className="inline-flex items-center gap-0.5 text-violet-fg"><ClipboardCheck className="size-3" aria-hidden />KT</span> : <span className="italic">chưa có KT</span>}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
              <Button size="sm" variant="ghost" className="mt-1 w-full justify-start" onClick={() => addLesson(t.id)}><Plus className="size-3.5" /> Thêm bài</Button>
            </details>
          ))}
        </div>
        <Button variant="secondary" className="w-full" onClick={addTopic}><Plus /> Tạo chương</Button>
      </aside>

      <section className="min-w-0" aria-label="Nội dung bài học">
        {!lesson ? <EmptyState title="Chọn một bài học" description="Chọn bài ở cột bên trái hoặc thêm bài mới." /> : <LessonPanel key={lesson.id} course={course} lesson={lesson} patch={(fn) => patchLesson(lesson.id, fn)} onDelete={() => { if (!window.confirm(`Xóa bài "${lesson.title}" và toàn bộ hoạt động?`)) return; setTopics(course.topics.map((t) => ({ ...t, lessons: t.lessons.filter((l) => l.id !== lesson.id) }))); setLessonId(undefined); }} />}
      </section>
    </div>
  );
}

function LessonPanel({ course, lesson, patch, onDelete }: { course: Course; lesson: CourseLesson; patch: (fn: (l: CourseLesson) => CourseLesson) => void; onDelete: () => void }) {
  const { d, user } = useSessionData();
  const [openBlock, setOpenBlock] = useState<string | null>(null);
  const [drag, setDrag] = useState<number | null>(null);
  const [assign, setAssign] = useState<AssignPreset | null>(null);
  const topic = course.topics.find((t) => t.lessons.some((l) => l.id === lesson.id));
  const acts = lesson.blocks.filter((b) => !b.final);
  const test = finalTest(lesson);
  const setActs = (next: CourseBlock[]) => patch((l) => ({ ...l, blocks: [...next, ...l.blocks.filter((b) => b.final)] }));
  const setTest = (b?: CourseBlock) => patch((l) => ({ ...l, blocks: [...l.blocks.filter((x) => !x.final), ...(b ? [b] : [])] }));
  const ref = lesson.sgkRef;
  const sgk = ref ? findSgk(ref) : undefined;
  const suggestSims = ref && sgk ? lessonItems(ref, sgk.lesson.key).labs.filter((s) => !acts.some((b) => b.labSlug === s) && getLabBySlug(s)?.status !== "planned") : [];
  const testSets = [
    ...d.teacherQuizzes.filter((q) => q.ownerId === user.id && (!ref || q.sgkRef === ref)).map((q) => ({ id: q.id, title: `${q.title} (của tôi)`, n: q.questions.length })),
    ...(ref && sgk ? setsForLesson(ref, sgk.lesson.key) : []).map((s) => ({ id: s.id, title: s.title, n: s.questionIds.length })),
  ];
  const testSet = test?.practiceSetId ? (getSet(test.practiceSetId) ? { title: getSet(test.practiceSetId)!.title, n: getSet(test.practiceSetId)!.questionIds.length } : (() => { const q = d.teacherQuizzes.find((x) => x.id === test.practiceSetId); return q ? { title: q.title, n: q.questions.length } : undefined; })()) : undefined;

  function addAct(kind: CourseBlockKind, extra: Partial<CourseBlock> = {}) {
    const b = newBlock(kind, extra);
    setActs([...acts, b]);
    if (!extra.labSlug) setOpenBlock(b.id);
  }
  function addTest() {
    const first = testSets[0];
    setTest(newBlock("practice", { title: "Bài kiểm tra cuối bài", final: true, practiceSetId: first?.id, tutorLevel: "exam" }));
  }

  /** Bài đã giao cho các lớp của khóa học, ứng với một mục (mô phỏng / bộ câu hỏi). */
  const delivered = (kind: "lab" | "quiz", refId?: string) => refId ? d.assignments.filter((a) => course.classIds.includes(a.classId) && a.status !== "draft" && a.task?.kind === kind && a.task.ref === refId) : [];
  const deliverables = [
    ...acts.filter((b) => b.kind === "simulation" && b.labSlug).map((b) => ({ key: b.id, label: getLabBySlug(b.labSlug!)?.title ?? b.title, icon: FlaskConical, preset: { kind: "lab" as const, ref: b.labSlug! } })),
    ...(test?.practiceSetId ? [{ key: test.id, label: `Bài kiểm tra: ${testSet?.title ?? ""}`, icon: ClipboardCheck, preset: { kind: "quiz" as const, ref: test.practiceSetId } }] : []),
  ];

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-line bg-surface p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">{topic?.title}</p>
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Tên bài" htmlFor="l-title"><Input id="l-title" value={lesson.title} onChange={(e) => patch((l) => ({ ...l, title: e.target.value }))} /></Field>
          <Field label="Bài SGK tương ứng" htmlFor="l-sgk" hint="Gợi ý mô phỏng, bộ câu hỏi và nối kết quả của bài.">
            <Select id="l-sgk" value={ref ?? ""} onChange={(e) => { const r = e.target.value || undefined; const f = r ? findSgk(r) : undefined; patch((l) => ({ ...l, sgkRef: r, lessonId: f ? sgkLessonId(f.lesson) : l.lessonId })); }}>
              <option value="">— Không gắn —</option>
              {gradeLessons(course.grade).map((x) => <option key={x.ref} value={x.ref}>Bài {x.lesson.no}. {x.lesson.title}</option>)}
            </Select>
          </Field>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          {course.sequential ? <Checkbox label="Mở tự do (vào được dù chưa xong bài trước)" checked={Boolean(lesson.alwaysOpen)} onChange={(e) => patch((l) => ({ ...l, alwaysOpen: e.target.checked }))} /> : <span className="text-xs text-muted">Hoàn thành bài khi xong mọi hoạt động bắt buộc và bài kiểm tra.</span>}
          <Button size="sm" variant="ghost" onClick={onDelete}><Trash2 className="size-3.5" /> Xóa bài</Button>
        </div>
      </div>

      <section aria-labelledby="h-acts">
        <h2 id="h-acts" className="mb-2 flex items-center gap-2 text-lg font-bold text-fg"><span className="grid size-7 place-items-center rounded-lg bg-cyan/15 text-cyan-fg"><Layers className="size-4" aria-hidden /></span> Hoạt động học tập <span className="text-sm font-normal text-muted">({acts.length})</span></h2>
        {acts.length === 0 ? <p className="rounded-2xl border border-dashed border-line p-4 text-sm text-muted">Chưa có hoạt động. Thêm kiến thức, mô phỏng hoặc bài thực hành bên dưới.</p> : (
          <ol className="space-y-2" aria-label="Hoạt động trong bài (kéo thả để sắp xếp)">
            {acts.map((b, i) => (
              <BlockEditor
                key={b.id}
                block={b}
                grade={course.grade}
                index={i}
                count={acts.length}
                open={openBlock === b.id}
                dragging={drag === i}
                onToggle={() => setOpenBlock(openBlock === b.id ? null : b.id)}
                onChange={(p) => setActs(acts.map((x) => (x.id === b.id ? { ...x, ...p } : x)))}
                onMove={(to) => setActs(moveItem(acts, i, to))}
                onDelete={() => { if (window.confirm(`Xóa "${b.title}"?`)) setActs(acts.filter((x) => x.id !== b.id)); }}
                onDragStart={() => setDrag(i)}
                onDragEnd={() => setDrag(null)}
                onDropHere={() => { if (drag !== null) setActs(moveItem(acts, drag, i)); setDrag(null); }}
              />
            ))}
          </ol>
        )}
        {suggestSims.length > 0 && (
          <div className="mt-3 rounded-2xl bg-cyan/5 p-3">
            <p className="mb-2 text-xs font-semibold text-cyan-fg">Mô phỏng theo bài SGK — bấm để đính kèm</p>
            <div className="flex flex-wrap gap-1.5">{suggestSims.map((s) => <button key={s} type="button" onClick={() => { addAct("simulation", { labSlug: s, title: `Mô phỏng: ${getLabBySlug(s)?.title}` }); toast.success("Đã đính kèm mô phỏng"); }} className="inline-flex items-center gap-1 rounded-lg border border-cyan/40 bg-surface px-2.5 py-1 text-xs font-medium text-fg hover:bg-cyan/10"><Plus className="size-3" aria-hidden /> {getLabBySlug(s)?.title}</button>)}</div>
          </div>
        )}
        <div className="mt-3 flex flex-wrap gap-2">
          {ADD_KINDS.map((k) => { const Icon = BLOCK_ICON[k.kind]; return <Button key={k.kind} size="sm" variant={k.kind === "simulation" ? "primary" : "secondary"} onClick={() => addAct(k.kind)}><Icon className="size-3.5" /> {k.label}</Button>; })}
        </div>
      </section>

      <section aria-labelledby="h-test" className="rounded-2xl border-2 border-violet/30 bg-violet/5 p-4">
        <h2 id="h-test" className="mb-2 flex items-center gap-2 text-lg font-bold text-fg"><span className="grid size-7 place-items-center rounded-lg bg-violet/15 text-violet-fg"><ClipboardCheck className="size-4" aria-hidden /></span> Bài kiểm tra cuối bài</h2>
        {!test ? (
          <div className="flex flex-wrap items-center gap-3">
            <p className="min-w-0 flex-1 text-sm text-muted">Bài chưa có bài kiểm tra. {testSets.length ? `Có ${testSets.length} bộ câu hỏi phù hợp.` : "Tạo bộ câu hỏi ở Ngân hàng bài tập."}</p>
            <Button size="sm" onClick={addTest} disabled={!testSets.length}><Plus /> Thêm bài kiểm tra</Button>
            {!testSets.length && <Button size="sm" variant="secondary" asChild><Link href="/teacher/bank">Ngân hàng bài tập</Link></Button>}
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-[1fr_120px_auto] sm:items-end">
            <Field label="Bộ câu hỏi" htmlFor="t-set">
              <Select id="t-set" value={test.practiceSetId ?? ""} onChange={(e) => setTest({ ...test, practiceSetId: e.target.value || undefined })}>
                <option value="">— Chọn bộ câu hỏi —</option>
                {test.practiceSetId && !testSets.some((s) => s.id === test.practiceSetId) && testSet && <option value={test.practiceSetId}>{testSet.title}</option>}
                {testSets.map((s) => <option key={s.id} value={s.id}>{s.title} · {s.n} câu</option>)}
              </Select>
            </Field>
            <Field label="Cần đạt (%)" htmlFor="t-min"><Input id="t-min" type="number" min={0} max={100} step={5} value={test.minScore ?? 70} onChange={(e) => setTest({ ...test, minScore: Math.max(0, Math.min(100, Number(e.target.value) || 0)) })} /></Field>
            <Button size="sm" variant="ghost" onClick={() => setTest(undefined)}><Trash2 /> Bỏ</Button>
            <p className="text-xs text-muted sm:col-span-3">{testSet ? `${testSet.n} câu · chấm tự động · học sinh hoàn thành bài khi đạt ${test.minScore ?? 70}%.` : "Chọn bộ câu hỏi để phát hành được."}</p>
          </div>
        )}
      </section>

      <section aria-labelledby="h-deliver" className="rounded-2xl border border-line bg-surface p-4">
        <h2 id="h-deliver" className="mb-1 flex items-center gap-2 font-bold text-fg"><CalendarClock className="size-4 text-blue-fg" aria-hidden /> Giao cho lớp & đặt hạn</h2>
        <p className="mb-3 text-xs text-muted">Mô phỏng và bài kiểm tra giao từ đây là bài tập thuộc khóa học: hiện ở Bài tập & Đánh giá → Đã giao và vào sổ điểm.</p>
        {!courseClasses(course, d).length ? <p className="text-sm text-muted">Chọn lớp (Phát hành cho lớp) để giao bài.</p> : deliverables.length === 0 ? <p className="text-sm text-muted">Bài chưa có mô phỏng hay bài kiểm tra để giao.</p> : (
          <ul className="divide-y divide-line">
            {deliverables.map((x) => {
              const done = delivered(x.preset.kind, x.preset.ref);
              return (
                <li key={x.key} className="flex flex-wrap items-center gap-3 py-2 text-sm">
                  <x.icon className="size-4 shrink-0 text-muted" aria-hidden />
                  <span className="min-w-0 flex-1 basis-48 font-medium text-fg">{x.label}</span>
                  {done.map((a) => {
                    const ss = assignedStudents(d, a);
                    const n = ss.filter((u) => taskOutcome(d, u.id, a).done).length;
                    return <span key={a.id} className="rounded-md bg-blue/10 px-2 py-0.5 text-xs text-blue-fg"><b>{d.classes.find((c) => c.id === a.classId)?.name}</b> · hạn {formatDate(a.dueAt)} · {n}/{ss.length} xong</span>;
                  })}
                  <Button size="sm" variant={done.length ? "ghost" : "primary"} onClick={() => setAssign(x.preset)}><Send /> {done.length ? "Giao thêm" : "Giao & đặt hạn"}</Button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
      <AssignDialog open={!!assign} onOpenChange={(o) => !o && setAssign(null)} preset={assign ?? undefined} sgkRef={ref} courseId={course.id} classId={course.classIds[0]} title="Giao bài thuộc khóa học" />
    </div>
  );
}

const courseClasses = (course: Course, d: ReturnType<typeof useSessionData>["d"]) => d.classes.filter((c) => course.classIds.includes(c.id));

function TopicForm({ topic, onSave, onCancel }: { topic: CourseTopic; onSave: (p: Partial<CourseTopic>) => void; onCancel: () => void }) {
  const [title, setTitle] = useState(topic.title);
  return (
    <form className="flex w-full gap-1 p-0.5" onSubmit={(e) => { e.preventDefault(); if (title.trim()) onSave({ title: title.trim() }); }}>
      <Input aria-label="Tên chương" className="h-8" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
      <Button type="submit" size="sm">Lưu</Button>
      <Button type="button" size="sm" variant="ghost" onClick={onCancel}>Hủy</Button>
    </form>
  );
}

/* ---------- Tiến độ học sinh ---------- */

const CELL: Record<CellState, { label: string; cls: string }> = {
  done: { label: "Hoàn thành", cls: "bg-success text-white" },
  doing: { label: "Đang học", cls: "bg-warning/70 text-fg" },
  todo: { label: "Chưa bắt đầu", cls: "bg-surface-2 text-muted" },
  locked: { label: "Chưa mở", cls: "bg-surface-2/50 text-muted" },
};

function ProgressTab({ course, onOpenLesson }: { course: Course; onOpenLesson: (id: string) => void }) {
  const { d } = useSessionData();
  const cls = courseClasses(course, d);
  const [classId, setClassId] = useState(cls[0]?.id ?? "");
  const [onlyActive, setOnlyActive] = useState(true);
  const lessons = useMemo(() => course.topics.flatMap((t) => t.lessons.map((l) => ({ t, l }))).filter((x) => x.l.blocks.length > 0), [course.topics]);
  const rows = useMemo(() => classStudents(d, classId).map((u) => {
    const ctx = { progress: d.courseProgress.find((p) => p.studentId === u.id && p.courseId === course.id), practiceAttempts: d.practiceAttempts, studentId: u.id };
    const cells = new Map(lessonCells(course, ctx).map((c) => [c.lessonId, c]));
    return { u, cells, comp: courseCompletion(course, ctx) };
  }), [d, classId, course]);
  const touched = lessons.filter((x) => rows.some((r) => { const c = r.cells.get(x.l.id); return c && (c.state === "done" || c.state === "doing"); }));
  const shownLessons = onlyActive && touched.length ? lessons.slice(0, Math.min(lessons.length, lessons.indexOf(touched[touched.length - 1]) + 2)) : lessons;

  if (course.status !== "published" || !cls.length) return <EmptyState icon={Users} title="Khóa học chưa phát hành cho lớp nào" description="Phát hành cho lớp để theo dõi tiến độ từng học sinh theo từng bài." />;
  const mean = rows.length ? Math.round(rows.reduce((n, r) => n + r.comp.percent, 0) / rows.length) : 0;
  const tests = rows.flatMap((r) => [...r.cells.values()].flatMap((c) => (c.test !== null ? [c.test] : [])));
  const behind = rows.filter((r) => r.comp.percent < mean - 20);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {cls.length > 1 && <div className="flex gap-1 rounded-xl border border-line bg-surface p-1" role="radiogroup" aria-label="Lớp">{cls.map((c) => <button key={c.id} type="button" role="radio" aria-checked={classId === c.id} onClick={() => setClassId(c.id)} className={cn("rounded-lg px-3 py-1.5 text-sm font-semibold", classId === c.id ? "bg-fg text-bg" : "text-muted hover:text-fg")}>{c.name}</button>)}</div>}
        <Checkbox label="Chỉ hiện các bài lớp đang học tới" checked={onlyActive} onChange={(e) => setOnlyActive(e.target.checked)} />
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Hoàn thành trung bình", value: `${mean}%`, sub: `${rows.length} học sinh lớp ${cls.find((c) => c.id === classId)?.name}` },
          { label: "Bài cả lớp đã học tới", value: touched.length, sub: `trên ${lessons.length} bài của khóa học` },
          { label: "Điểm bài kiểm tra TB", value: tests.length ? `${Math.round(tests.reduce((a, b) => a + b, 0) / tests.length)}%` : "–", sub: `${tests.length} lượt kiểm tra` },
          { label: "Đang chậm hơn lớp", value: behind.length, sub: behind.length ? behind.slice(0, 3).map((r) => r.u.name.split(" ").pop()).join(", ") : "Không có em nào chậm hơn 20%" },
        ].map((k) => <div key={k.label} className="rounded-2xl border border-line bg-surface p-3"><p className="text-xs font-semibold uppercase tracking-wide text-muted">{k.label}</p><p className="mt-1 text-2xl font-bold tabular-nums text-fg">{k.value}</p><p className="truncate text-xs text-muted">{k.sub}</p></div>)}
      </div>
      <div className="flex flex-wrap gap-3 text-xs text-muted" aria-label="Chú thích">
        {(Object.keys(CELL) as CellState[]).map((s) => <span key={s} className="inline-flex items-center gap-1.5"><span className={cn("grid size-4 place-items-center rounded", CELL[s].cls)}>{s === "locked" && <Lock className="size-2.5" aria-hidden />}</span>{CELL[s].label}</span>)}
        <span>· số trong ô: % đúng bài kiểm tra cuối bài</span>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
        <table className="w-full min-w-max border-collapse text-sm">
          <caption className="sr-only">Tiến độ học sinh theo bài</caption>
          <thead>
            <tr className="border-b border-line">
              <th scope="col" rowSpan={2} className="sticky left-0 z-10 bg-surface px-3 py-2 text-left align-bottom font-semibold text-fg">Học sinh</th>
              {course.topics.map((t) => { const n = shownLessons.filter((x) => x.t.id === t.id).length; return n ? <th key={t.id} scope="colgroup" colSpan={n} className="border-l border-line px-2 py-1 text-left text-xs font-semibold text-muted"><span className="line-clamp-1" title={t.title}>{t.title.split(".")[0]}</span></th> : null; })}
              <th scope="col" rowSpan={2} className="px-3 py-2 align-bottom font-semibold text-fg">Tiến độ</th>
            </tr>
            <tr className="border-b border-line">
              {shownLessons.map(({ l }) => <th key={l.id} scope="col" className="px-0.5 py-1"><button type="button" onClick={() => onOpenLesson(l.id)} title={l.title} className="w-9 rounded text-[11px] font-semibold text-muted hover:bg-surface-2 hover:text-fg">{(/Bài (\d+)/.exec(l.title)?.[1] ?? "•")}</button></th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.u.id} className="border-b border-line/60">
                <th scope="row" className="sticky left-0 z-10 bg-surface px-3 py-1.5 text-left font-medium text-fg">{r.u.name}</th>
                {shownLessons.map(({ l }) => {
                  const c = r.cells.get(l.id);
                  if (!c) return <td key={l.id} />;
                  return <td key={l.id} className="px-0.5 py-1"><span title={`${l.title}: ${CELL[c.state].label} · ${c.doneBlocks}/${c.total} hoạt động${c.test !== null ? ` · kiểm tra ${c.test}%` : ""}`} className={cn("mx-auto grid h-7 w-9 place-items-center rounded-md text-[11px] font-bold tabular-nums", CELL[c.state].cls)}>{c.state === "locked" ? <Lock className="size-3" aria-label="Chưa mở" /> : c.test !== null ? c.test : ""}</span></td>;
                })}
                <td className="px-3 py-1.5"><div className="flex items-center gap-2"><div className="h-2 w-24 rounded-full bg-surface-2"><div className="h-full rounded-full bg-success" style={{ width: `${r.comp.percent}%` }} /></div><span className="w-16 text-xs tabular-nums text-muted">{r.comp.done}/{r.comp.total} bài</span></div></td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-surface-2/60 text-[11px] text-muted">
              <th scope="row" className="sticky left-0 z-10 bg-surface-2 px-3 py-1.5 text-left font-semibold text-fg">% hoàn thành</th>
              {shownLessons.map(({ l }) => { const n = rows.filter((r) => r.cells.get(l.id)?.state === "done").length; return <td key={l.id} className="px-0.5 py-1.5 text-center tabular-nums">{rows.length ? Math.round((n / rows.length) * 100) : 0}</td>; })}
              <td className="px-3 py-1.5 font-bold text-fg">{mean}%</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

/** Xem trước: tiến độ giả lập trong bộ nhớ, không ghi vào store. */
function PreviewPlayer({ course }: { course: Course }) {
  const [done, setDone] = useState<CourseProgress["done"]>({});
  const progress: CourseProgress = { studentId: "preview", courseId: course.id, done, updatedAt: "" };
  return (
    <CoursePlayer
      course={course}
      studentId="preview"
      progress={progress}
      practiceAttempts={[]}
      preview
      onMark={(blockId, isDone, score) => setDone((cur) => { const next = { ...cur }; if (isDone) next[blockId] = { at: new Date().toISOString(), score }; else delete next[blockId]; return next; })}
    />
  );
}

function PublishDialog({ course, open, onOpenChange, actorId }: { course: Course; open: boolean; onOpenChange: (v: boolean) => void; actorId: string }) {
  const { d } = useSessionData();
  const mine = teacherClasses(d, actorId);
  const [selected, setSelected] = useState<string[]>(course.classIds);
  const check = useMemo(() => validateForPublish(course), [course]);
  const noTest = allLessons(course).filter((l) => l.blocks.length && !finalTest(l)).length;
  return (
    <Dialog open={open} onOpenChange={(v) => { if (v) setSelected(course.classIds); onOpenChange(v); }}>
      <DialogContent title="Phát hành khóa học" description="Học sinh các lớp được chọn thấy khóa học trong mục Khóa học của tôi.">
        <fieldset className="space-y-2">
          <legend className="mb-1 text-sm font-medium text-fg">Lớp học khóa này</legend>
          {mine.map((c) => (
            <Checkbox key={c.id} label={<span>{c.name}{c.grade !== course.grade && <span className="text-warning-fg"> · khác khối (lớp {c.grade})</span>}</span>} checked={selected.includes(c.id)} onChange={(e) => setSelected((s) => (e.target.checked ? [...s, c.id] : s.filter((x) => x !== c.id)))} />
          ))}
        </fieldset>
        {check.errors.length > 0 && (
          <Notice tone="danger" className="mt-4">
            <p className="font-medium">Cần sửa trước khi phát hành:</p>
            <ul className="mt-1 list-disc pl-5">{check.errors.slice(0, 6).map((e) => <li key={e}>{e}</li>)}</ul>
          </Notice>
        )}
        {(check.warnings.length > 0 || noTest > 0) && (
          <p className="mt-3 flex items-start gap-2 text-xs text-muted"><AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-warning-fg" aria-hidden />{[check.warnings.length && `${check.warnings.length} bài chưa có nội dung`, noTest && `${noTest} bài chưa có bài kiểm tra cuối bài`].filter(Boolean).join(" · ")} (vẫn phát hành được).</p>
        )}
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          {course.status === "published" && <Button variant="ghost" onClick={() => { d.unpublishCourse(course.id, actorId); toast.success("Đã thu hồi về bản nháp"); onOpenChange(false); }}><Undo2 /> Thu hồi</Button>}
          <Button disabled={!selected.length || check.errors.length > 0} onClick={() => { d.publishCourse(course.id, selected, actorId); toast.success("Đã phát hành khóa học"); onOpenChange(false); }}><Send /> Phát hành cho {selected.length} lớp</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

