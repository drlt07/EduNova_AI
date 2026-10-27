"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { AlertTriangle, ArrowLeft, ChevronDown, ChevronUp, Eye, GripVertical, Pencil, Plus, Send, Trash2, Undo2, Users } from "lucide-react";
import { toast } from "sonner";
import type { Course, CourseBlock, CourseBlockKind, CourseLesson, CourseProgress, CourseTopic } from "@/lib/domain/types";
import { BLOCK_LABEL, allLessons, courseCompletion, moveItem, newBlock, newLesson, newTopic, validateForPublish } from "@/lib/courses/course";
import { LESSONS, TEXTBOOKS, TOPICS } from "@/lib/data/curriculum";
import { classStudents, teacherClasses } from "@/lib/store/scoped";
import { useSessionData } from "@/lib/store/use-role";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { EmptyState, ErrorState, Notice, Progress } from "@/components/ui/feedback";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/form";
import { PageHeader } from "@/components/ui/misc";
import { BlockEditor } from "@/components/courses/block-editor";
import { BLOCK_ICON } from "@/components/courses/block-view";
import { CoursePlayer } from "@/components/courses/course-player";

const ADD_KINDS: CourseBlockKind[] = ["text", "media", "simulation", "python", "practice", "file"];

type Drag = { kind: "block"; index: number } | { kind: "lesson"; topicId: string; index: number } | null;

export default function CourseEditorPage() {
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
  const [lessonId, setLessonId] = useState<string | undefined>(() => allLessons(course).find((l) => l.blocks.length > 1)?.id ?? allLessons(course)[0]?.id);
  const [openBlock, setOpenBlock] = useState<string | null>(null);
  const [drag, setDrag] = useState<Drag>(null);
  const [preview, setPreview] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [progressOpen, setProgressOpen] = useState(false);
  const [editTopic, setEditTopic] = useState<string | null>(null);

  const lesson = allLessons(course).find((l) => l.id === lessonId);
  const topicOfLesson = course.topics.find((t) => t.lessons.some((l) => l.id === lessonId));
  const bookName = TEXTBOOKS.find((t) => t.id === course.textbookId)?.name;

  const setTopics = (topics: CourseTopic[]) => d.updateCourse(course.id, { topics });
  const patchLesson = (lid: string, fn: (l: CourseLesson) => CourseLesson) =>
    setTopics(course.topics.map((t) => ({ ...t, lessons: t.lessons.map((l) => (l.id === lid ? fn(l) : l)) })));
  const setBlocks = (blocks: CourseBlock[]) => lesson && patchLesson(lesson.id, (l) => ({ ...l, blocks }));

  function addTopic() {
    const t = newTopic("Chủ đề mới");
    setTopics([...course.topics, t]);
    setEditTopic(t.id);
  }
  function addLesson(topicId: string) {
    const l = newLesson("Bài học mới");
    setTopics(course.topics.map((t) => (t.id === topicId ? { ...t, lessons: [...t.lessons, l] } : t)));
    setLessonId(l.id);
  }
  function deleteLesson(lid: string, title: string) {
    if (!window.confirm(`Xóa bài "${title}" và toàn bộ nội dung?`)) return;
    setTopics(course.topics.map((t) => ({ ...t, lessons: t.lessons.filter((l) => l.id !== lid) })));
    if (lid === lessonId) setLessonId(undefined);
  }
  function deleteTopic(t: CourseTopic) {
    if (!window.confirm(`Xóa "${t.title}" cùng ${t.lessons.length} bài học?`)) return;
    setTopics(course.topics.filter((x) => x.id !== t.id));
    if (t.lessons.some((l) => l.id === lessonId)) setLessonId(undefined);
  }
  function addBlock(kind: CourseBlockKind) {
    if (!lesson) return;
    const b = newBlock(kind);
    setBlocks([...lesson.blocks, b]);
    setOpenBlock(b.id);
  }

  if (preview) {
    return (
      <>
        <PageHeader title={`Xem như học sinh: ${course.title}`} description="Bản xem trước — thao tác ở đây không ghi vào tiến độ của học sinh." actions={<Button variant="secondary" onClick={() => setPreview(false)}><Pencil /> Quay lại chỉnh sửa</Button>} />
        <PreviewPlayer course={course} />
      </>
    );
  }

  return (
    <>
      <Button asChild variant="ghost" size="sm" className="mb-2"><Link href="/teacher/courses"><ArrowLeft /> Khóa học</Link></Button>
      <PageHeader
        title={course.title || "Khóa học chưa đặt tên"}
        description={`Tin học ${course.grade} · ${bookName} · thay đổi được lưu tự động${course.status === "published" ? " và hiển thị ngay với học sinh" : ""}.`}
        badge={course.status === "published" ? <Badge tone="success">Đã phát hành</Badge> : <Badge>Bản nháp</Badge>}
        actions={
          <>
            {course.status === "published" && <Button variant="secondary" onClick={() => setProgressOpen(true)}><Users /> Tiến độ học sinh</Button>}
            <Button variant="secondary" onClick={() => setPreview(true)}><Eye /> Xem như học sinh</Button>
            <Button onClick={() => setPublishOpen(true)}><Send /> {course.status === "published" ? "Phát hành / lớp" : "Phát hành"}</Button>
          </>
        }
      />

      <details className="mb-5 rounded-2xl border border-line bg-surface p-4">
        <summary className="cursor-pointer text-sm font-semibold text-fg">Thông tin khóa học</summary>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <Field label="Tên khóa học" htmlFor="c-title"><Input id="c-title" value={course.title} onChange={(e) => d.updateCourse(course.id, { title: e.target.value })} /></Field>
          <div className="flex items-end pb-2"><Checkbox label="Học lần lượt: hoàn thành bài trước mới mở bài sau" checked={course.sequential} onChange={(e) => d.updateCourse(course.id, { sequential: e.target.checked })} /></div>
          <Field label="Mô tả" htmlFor="c-desc" className="md:col-span-2"><Textarea id="c-desc" rows={2} value={course.description} onChange={(e) => d.updateCourse(course.id, { description: e.target.value })} /></Field>
        </div>
      </details>

      <div className="grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
        {/* Cây chủ đề → bài học */}
        <aside className="space-y-3 lg:sticky lg:top-20 lg:self-start">
          <div className="max-h-[75vh] space-y-3 overflow-y-auto rounded-2xl border border-line bg-surface p-3">
            {course.topics.length === 0 && <p className="p-2 text-sm text-muted">Chưa có chủ đề. Thêm chủ đề để bắt đầu.</p>}
            {course.topics.map((t, ti) => (
              <div key={t.id} className="rounded-xl bg-surface-2/60 p-2">
                <div className="flex items-center gap-1">
                  {editTopic === t.id ? (
                    <TopicForm topic={t} onSave={(patch) => { setTopics(course.topics.map((x) => (x.id === t.id ? { ...x, ...patch } : x))); setEditTopic(null); }} onCancel={() => setEditTopic(null)} />
                  ) : (
                    <>
                      <p className="min-w-0 flex-1 px-1 text-xs font-semibold uppercase tracking-wide text-muted">{t.title}</p>
                      <Button size="icon" variant="ghost" className="size-7" disabled={ti === 0} onClick={() => setTopics(moveItem(course.topics, ti, ti - 1))} aria-label={`Đưa ${t.title} lên`}><ChevronUp className="size-3.5" /></Button>
                      <Button size="icon" variant="ghost" className="size-7" disabled={ti === course.topics.length - 1} onClick={() => setTopics(moveItem(course.topics, ti, ti + 1))} aria-label={`Đưa ${t.title} xuống`}><ChevronDown className="size-3.5" /></Button>
                      <Button size="icon" variant="ghost" className="size-7" onClick={() => setEditTopic(t.id)} aria-label={`Sửa ${t.title}`}><Pencil className="size-3.5" /></Button>
                      <Button size="icon" variant="ghost" className="size-7" onClick={() => deleteTopic(t)} aria-label={`Xóa ${t.title}`}><Trash2 className="size-3.5" /></Button>
                    </>
                  )}
                </div>
                <ul className="mt-1 space-y-0.5">
                  {t.lessons.map((l, li) => (
                    <li
                      key={l.id}
                      draggable
                      onDragStart={(e) => { e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", l.id); setDrag({ kind: "lesson", topicId: t.id, index: li }); }}
                      onDragEnd={() => setDrag(null)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (drag?.kind === "lesson" && drag.topicId === t.id) setTopics(course.topics.map((x) => (x.id === t.id ? { ...x, lessons: moveItem(x.lessons, drag.index, li) } : x)));
                        setDrag(null);
                      }}
                      className={cn("group flex items-center gap-1 rounded-lg", drag?.kind === "lesson" && drag.topicId === t.id && drag.index === li && "opacity-50")}
                    >
                      <GripVertical className="size-3.5 shrink-0 cursor-grab text-muted" aria-hidden />
                      <button type="button" onClick={() => setLessonId(l.id)} aria-current={l.id === lessonId ? "true" : undefined} className={cn("min-w-0 flex-1 truncate rounded-lg px-2 py-1.5 text-left text-sm", l.id === lessonId ? "bg-cyan/15 font-medium text-fg" : "text-fg hover:bg-surface")}>
                        {l.title}
                      </button>
                      <span className="text-xs text-muted">{l.blocks.length}</span>
                      <Button size="icon" variant="ghost" className="size-7" disabled={li === 0} onClick={() => setTopics(course.topics.map((x) => (x.id === t.id ? { ...x, lessons: moveItem(x.lessons, li, li - 1) } : x)))} aria-label={`Đưa bài ${l.title} lên`}><ChevronUp className="size-3.5" /></Button>
                    </li>
                  ))}
                </ul>
                <Button size="sm" variant="ghost" className="mt-1 w-full justify-start" onClick={() => addLesson(t.id)}><Plus className="size-3.5" /> Thêm bài</Button>
              </div>
            ))}
          </div>
          <Button variant="secondary" className="w-full" onClick={addTopic}><Plus /> Thêm chủ đề</Button>
        </aside>

        {/* Nội dung bài */}
        <section className="min-w-0 space-y-4" aria-label="Nội dung bài học">
          {!lesson ? (
            <EmptyState title="Chọn một bài học" description="Chọn bài ở cột bên trái hoặc thêm bài mới để soạn nội dung." />
          ) : (
            <>
              <div className="rounded-2xl border border-line bg-surface p-4">
                <p className="mb-3 text-xs text-muted">{topicOfLesson?.title}</p>
                <div className="grid gap-3 md:grid-cols-2">
                  <Field label="Tên bài" htmlFor="l-title"><Input id="l-title" value={lesson.title} onChange={(e) => patchLesson(lesson.id, (l) => ({ ...l, title: e.target.value }))} /></Field>
                  <Field label="Bài trong chương trình" htmlFor="l-cur" hint="Gắn bài để liên kết mục tiêu và yêu cầu cần đạt.">
                    <Select id="l-cur" value={lesson.lessonId ?? ""} onChange={(e) => patchLesson(lesson.id, (l) => ({ ...l, lessonId: e.target.value || undefined }))}>
                      <option value="">— Không gắn —</option>
                      {LESSONS.filter((x) => x.grade === course.grade && x.textbookId === course.textbookId).map((x) => <option key={x.id} value={x.id}>{x.title}</option>)}
                    </Select>
                  </Field>
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                  {course.sequential ? <Checkbox label="Mở tự do (học sinh vào được dù chưa xong bài trước)" checked={Boolean(lesson.alwaysOpen)} onChange={(e) => patchLesson(lesson.id, (l) => ({ ...l, alwaysOpen: e.target.checked }))} /> : <span className="text-xs text-muted">Hoàn thành bài khi xong mọi nội dung bắt buộc.</span>}
                  <Button size="sm" variant="ghost" onClick={() => deleteLesson(lesson.id, lesson.title)}><Trash2 className="size-3.5" /> Xóa bài</Button>
                </div>
              </div>

              {lesson.blocks.length === 0 ? (
                <EmptyState title="Bài chưa có nội dung" description="Thêm nội dung kiến thức, video, mô phỏng, bài Python hoặc luyện tập bên dưới." />
              ) : (
                <ol className="space-y-2" aria-label="Các nội dung trong bài (kéo thả để sắp xếp)">
                  {lesson.blocks.map((b, i) => (
                    <BlockEditor
                      key={b.id}
                      block={b}
                      grade={course.grade}
                      index={i}
                      count={lesson.blocks.length}
                      open={openBlock === b.id}
                      dragging={drag?.kind === "block" && drag.index === i}
                      onToggle={() => setOpenBlock(openBlock === b.id ? null : b.id)}
                      onChange={(patch) => setBlocks(lesson.blocks.map((x) => (x.id === b.id ? { ...x, ...patch } : x)))}
                      onMove={(to) => setBlocks(moveItem(lesson.blocks, i, to))}
                      onDelete={() => { if (window.confirm(`Xóa "${b.title}"?`)) setBlocks(lesson.blocks.filter((x) => x.id !== b.id)); }}
                      onDragStart={() => setDrag({ kind: "block", index: i })}
                      onDragEnd={() => setDrag(null)}
                      onDropHere={() => { if (drag?.kind === "block") setBlocks(moveItem(lesson.blocks, drag.index, i)); setDrag(null); }}
                    />
                  ))}
                </ol>
              )}

              <div className="rounded-2xl border border-dashed border-line p-4">
                <p className="mb-2 text-sm font-medium text-fg">Thêm nội dung</p>
                <div className="flex flex-wrap gap-2">
                  {ADD_KINDS.map((k) => {
                    const Icon = BLOCK_ICON[k];
                    return <Button key={k} size="sm" variant="secondary" onClick={() => addBlock(k)}><Icon className="size-3.5" /> {BLOCK_LABEL[k]}</Button>;
                  })}
                </div>
              </div>
            </>
          )}
        </section>
      </div>

      <PublishDialog course={course} open={publishOpen} onOpenChange={setPublishOpen} actorId={user.id} />
      <ProgressDialog course={course} open={progressOpen} onOpenChange={setProgressOpen} />
    </>
  );
}

function TopicForm({ topic, onSave, onCancel }: { topic: CourseTopic; onSave: (p: Partial<CourseTopic>) => void; onCancel: () => void }) {
  const [title, setTitle] = useState(topic.title);
  const [topicId, setTopicId] = useState(topic.topicId ?? "");
  return (
    <form className="w-full space-y-2 p-1" onSubmit={(e) => { e.preventDefault(); if (title.trim()) onSave({ title: title.trim(), topicId: topicId || undefined }); }}>
      <Input aria-label="Tên chủ đề" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
      <Select aria-label="Chủ đề trong chương trình" value={topicId} onChange={(e) => { setTopicId(e.target.value); const t = TOPICS.find((x) => x.id === e.target.value); if (t && (title === "Chủ đề mới" || !title.trim())) setTitle(`Chủ đề ${t.code}: ${t.name}`); }}>
        <option value="">— Chủ đề GDPT 2018 —</option>
        {TOPICS.map((t) => <option key={t.id} value={t.id}>{t.code}. {t.name}</option>)}
      </Select>
      <div className="flex gap-2"><Button type="submit" size="sm">Lưu</Button><Button type="button" size="sm" variant="ghost" onClick={onCancel}>Hủy</Button></div>
    </form>
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
  const classes = teacherClasses(d, actorId);
  const [selected, setSelected] = useState<string[]>(course.classIds);
  const check = useMemo(() => validateForPublish(course), [course]);
  return (
    <Dialog open={open} onOpenChange={(v) => { if (v) setSelected(course.classIds); onOpenChange(v); }}>
      <DialogContent title="Phát hành khóa học" description="Học sinh của các lớp được chọn sẽ thấy khóa học trong mục Khóa học.">
        <fieldset className="space-y-2">
          <legend className="mb-1 text-sm font-medium text-fg">Lớp nhận khóa học</legend>
          {classes.map((c) => (
            <Checkbox
              key={c.id}
              label={<span>{c.name}{c.grade !== course.grade && <span className="text-warning-fg"> · khác khối (lớp {c.grade})</span>}</span>}
              checked={selected.includes(c.id)}
              onChange={(e) => setSelected((s) => (e.target.checked ? [...s, c.id] : s.filter((x) => x !== c.id)))}
            />
          ))}
        </fieldset>
        {check.errors.length > 0 && (
          <Notice tone="danger" className="mt-4">
            <p className="font-medium">Cần sửa trước khi phát hành:</p>
            <ul className="mt-1 list-disc pl-5">{check.errors.slice(0, 6).map((e) => <li key={e}>{e}</li>)}</ul>
          </Notice>
        )}
        {check.warnings.length > 0 && (
          <p className="mt-3 flex items-start gap-2 text-xs text-muted"><AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-warning-fg" aria-hidden />{check.warnings.length} bài chưa có nội dung (vẫn phát hành được, học sinh thấy bài trống).</p>
        )}
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          {course.status === "published" && (
            <Button variant="ghost" onClick={() => { d.unpublishCourse(course.id, actorId); toast.success("Đã thu hồi về bản nháp"); onOpenChange(false); }}><Undo2 /> Thu hồi</Button>
          )}
          <Button
            disabled={!selected.length || check.errors.length > 0}
            onClick={() => { d.publishCourse(course.id, selected, actorId); toast.success("Đã phát hành khóa học"); onOpenChange(false); }}
          >
            <Send /> Phát hành cho {selected.length} lớp
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ProgressDialog({ course, open, onOpenChange }: { course: Course; open: boolean; onOpenChange: (v: boolean) => void }) {
  const { d } = useSessionData();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title="Tiến độ học sinh" description="Số bài đã hoàn thành trong khóa học, theo từng lớp được phát hành." className="max-w-2xl">
        <div className="max-h-[60vh] space-y-5 overflow-y-auto">
          {d.classes.filter((c) => course.classIds.includes(c.id)).map((c) => (
            <div key={c.id}>
              <p className="mb-2 font-semibold text-fg">Lớp {c.name}</p>
              <ul className="space-y-1.5">
                {classStudents(d, c.id).map((s) => {
                  const p = d.courseProgress.find((x) => x.studentId === s.id && x.courseId === course.id);
                  const comp = courseCompletion(course, { progress: p, practiceAttempts: d.practiceAttempts, studentId: s.id });
                  return (
                    <li key={s.id} className="grid grid-cols-[1fr_120px_70px] items-center gap-3 text-sm">
                      <span className="truncate text-fg">{s.name}</span>
                      <Progress value={comp.percent} tone="success" label={`Tiến độ ${s.name}`} />
                      <span className="text-right text-xs text-muted">{comp.done}/{comp.total} bài</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
