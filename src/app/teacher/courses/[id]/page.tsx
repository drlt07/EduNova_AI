"use client";
/**
 * Khóa học (kiểu Canvas Modules): danh sách module mở rộng được; mỗi module chứa bài học, mô phỏng, học liệu, bài tập,
 * bài kiểm tra theo thứ tự giáo viên sắp. Tab Học sinh (tiến độ), Kết quả (sổ điểm bài thuộc khóa học), Cài đặt (lớp, phát hành).
 */
import Link from "next/link";
import { Suspense, useMemo, useState } from "react";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ChevronDown, ChevronUp, Eye, Lock, Pencil, Plus, Send, Trash2, Undo2, Users } from "lucide-react";
import { toast } from "sonner";
import type { Course, CourseBlock, CourseBlockKind, CourseProgress, CourseTopic } from "@/lib/domain/types";
import { ITEM_LABEL, courseCompletion, lessonCells, moduleItems, moveItem, newBlock, newLesson, newTopic, reorderModule, validateForPublish, type CellState, type ItemType } from "@/lib/courses/course";
import { classStudents, teacherClasses } from "@/lib/store/scoped";
import { useSessionData } from "@/lib/store/use-role";
import { cn, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState, Notice, PageSkeleton } from "@/components/ui/feedback";
import { Checkbox, Field, Input, Textarea } from "@/components/ui/form";
import { PageHeader } from "@/components/ui/misc";
import { BlockEditor } from "@/components/courses/block-editor";
import { CoursePlayer } from "@/components/courses/course-player";
import { AssignDialog, type AssignPreset } from "@/components/teacher/assign-dialog";
import { MenuItem, RowMenu } from "@/components/teacher/assess-tabs";
import { Gradebook } from "@/components/teacher/gradebook";

type Tab = "noi-dung" | "hoc-sinh" | "ket-qua" | "cai-dat";
const TABS: { id: Tab; label: string }[] = [
  { id: "noi-dung", label: "Nội dung" },
  { id: "hoc-sinh", label: "Học sinh" },
  { id: "ket-qua", label: "Kết quả" },
  { id: "cai-dat", label: "Cài đặt" },
];
const ADD: { type: ItemType; kind: CourseBlockKind; extra?: Partial<CourseBlock> }[] = [
  { type: "lesson", kind: "text" },
  { type: "sim", kind: "simulation" },
  { type: "exercise", kind: "practice", extra: { title: "Bài tập" } },
  { type: "test", kind: "practice", extra: { title: "Bài kiểm tra", final: true, tutorLevel: "exam" } },
  { type: "code", kind: "python" },
  { type: "doc", kind: "file" },
  { type: "media", kind: "media" },
];
const CHIP: Record<ItemType, string> = {
  lesson: "bg-blue/10 text-blue-fg", sim: "bg-cyan/15 text-cyan-fg", test: "bg-violet/15 text-violet-fg", exercise: "bg-warning/15 text-warning-fg",
  code: "bg-success/15 text-success-fg", doc: "bg-surface-2 text-muted", media: "bg-surface-2 text-muted",
};

export default function CourseEditorPage() {
  return <Suspense fallback={<PageSkeleton />}><Inner /></Suspense>;
}

function Inner() {
  const { id } = useParams<{ id: string }>();
  const { d, user } = useSessionData();
  const course = d.courses.find((c) => c.id === id && c.ownerId === user.id);
  if (!course) return <ErrorState page title="Không tìm thấy khóa học" description="Khóa học không tồn tại hoặc không thuộc quyền của bạn." action={<Button asChild variant="secondary"><Link href="/teacher/courses">Về danh sách khóa học</Link></Button>} />;
  return <Editor key={course.id} course={course} />;
}

function Editor({ course }: { course: Course }) {
  const { d } = useSessionData();
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const raw = params.get("xem");
  const tab: Tab = TABS.some((t) => t.id === raw) ? (raw as Tab) : "noi-dung";
  const setTab = (t: Tab) => router.replace(t === "noi-dung" ? pathname : `${pathname}?xem=${t}`, { scroll: false });
  const [preview, setPreview] = useState(false);
  const [open, setOpen] = useState<string[]>(() => course.topics.slice(0, 1).map((t) => t.id));
  const classes = courseClasses(course, d);

  if (preview) {
    return (
      <>
        <PageHeader title={`Xem như học sinh: ${course.title}`} description="Bản xem trước — thao tác ở đây không ghi vào tiến độ của học sinh." actions={<Button variant="secondary" onClick={() => setPreview(false)}><Pencil /> Quay lại chỉnh sửa</Button>} />
        <PreviewPlayer course={course} />
      </>
    );
  }

  function addModule() {
    const t = newTopic(`Module ${course.topics.length + 1}: Module mới`);
    d.updateCourse(course.id, { topics: [...course.topics, t] });
    setOpen((o) => [...o, t.id]);
  }

  return (
    <>
      <Button asChild variant="ghost" size="sm" className="mb-2"><Link href="/teacher/courses"><ArrowLeft /> Khóa học</Link></Button>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-cyan-fg">Khóa học · Tin học {course.grade}</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-fg">{course.title || "Khóa học chưa đặt tên"}</h1>
          <p className="mt-1 text-sm text-muted">{classes.length ? classes.map((c) => c.name).join(", ") : "Chưa giao cho lớp"} · {course.status === "published" ? "Đang giảng dạy" : "Bản nháp"}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" onClick={() => setPreview(true)}><Eye /> Xem như học sinh</Button>
          {tab === "noi-dung" && <Button onClick={addModule}><Plus /> Thêm Module</Button>}
        </div>
      </div>
      <nav className="mb-5 flex gap-1 overflow-x-auto border-b border-line" role="tablist" aria-label="Khóa học">
        {TABS.map((t) => <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)} className={cn("-mb-px shrink-0 border-b-2 px-3 py-2.5 text-sm font-semibold", tab === t.id ? "border-fg text-fg" : "border-transparent text-muted hover:text-fg")}>{t.label}</button>)}
      </nav>
      {tab === "noi-dung" && <Modules course={course} open={open} setOpen={setOpen} />}
      {tab === "hoc-sinh" && <ProgressTab course={course} onOpenLesson={(lid) => { const t = course.topics.find((x) => x.lessons.some((l) => l.id === lid)); if (t) setOpen((o) => [...new Set([...o, t.id])]); setTab("noi-dung"); }} />}
      {tab === "ket-qua" && (classes.length ? <Gradebook courseId={course.id} classIds={course.classIds} /> : <EmptyState icon={Users} title="Khóa học chưa giao cho lớp nào" description="Chọn lớp ở tab Cài đặt để xem kết quả." />)}
      {tab === "cai-dat" && <Settings course={course} />}
    </>
  );
}

/* ---------- Nội dung: danh sách module ---------- */

function Modules({ course, open, setOpen }: { course: Course; open: string[]; setOpen: (fn: (o: string[]) => string[]) => void }) {
  const { d } = useSessionData();
  const [rename, setRename] = useState<string | null>(null);
  const [openItem, setOpenItem] = useState<string | null>(null);
  const [adding, setAdding] = useState<string | null>(null);
  const [drag, setDrag] = useState<{ topic: string; index: number } | null>(null);
  const [assign, setAssign] = useState<{ preset: AssignPreset; sgkRef?: string } | null>(null);
  const setTopics = (topics: CourseTopic[]) => d.updateCourse(course.id, { topics });
  const patchTopic = (id: string, fn: (t: CourseTopic) => CourseTopic) => setTopics(course.topics.map((t) => (t.id === id ? fn(t) : t)));
  const delivered = (kind: string, ref?: string) => (ref ? d.assignments.filter((a) => course.classIds.includes(a.classId) && a.status !== "draft" && a.task?.kind === kind && a.task.ref === ref) : []);

  function addItem(t: CourseTopic, spec: (typeof ADD)[number]) {
    const b = newBlock(spec.kind, { ...(spec.type === "lesson" ? { title: "Bài học mới" } : {}), ...spec.extra });
    if (spec.type === "lesson" || !t.lessons.length) {
      patchTopic(t.id, (x) => ({ ...x, lessons: [...x.lessons, newLesson(spec.type === "lesson" ? "Bài học mới" : t.title, undefined, [b])] }));
    } else {
      patchTopic(t.id, (x) => ({ ...x, lessons: x.lessons.map((l, i) => (i === x.lessons.length - 1 ? { ...l, blocks: [...l.blocks, b] } : l)) }));
    }
    setAdding(null);
    setOpenItem(b.id);
  }

  if (!course.topics.length) return <EmptyState title="Khóa học chưa có module" description="Bấm “Thêm Module” để bắt đầu; mỗi module gồm bài học, mô phỏng và bài kiểm tra." />;
  return (
    <div className="space-y-3">
      {course.topics.map((t, ti) => {
        const items = moduleItems(t);
        const isOpen = open.includes(t.id);
        return (
          <section key={t.id} className="overflow-hidden rounded-2xl border border-line bg-surface" aria-label={t.title}>
            <div className="flex items-center gap-2 bg-surface-2/60 px-3 py-2.5">
              {rename === t.id ? (
                <form className="flex flex-1 gap-2" onSubmit={(e) => { e.preventDefault(); const v = new FormData(e.currentTarget).get("n")?.toString().trim(); if (v) patchTopic(t.id, (x) => ({ ...x, title: v })); setRename(null); }}>
                  <Input name="n" aria-label="Tên module" defaultValue={t.title} autoFocus className="h-9" />
                  <Button type="submit" size="sm">Lưu</Button>
                  <Button type="button" size="sm" variant="ghost" onClick={() => setRename(null)}>Hủy</Button>
                </form>
              ) : (
                <>
                  <button type="button" aria-expanded={isOpen} onClick={() => setOpen((o) => (isOpen ? o.filter((x) => x !== t.id) : [...o, t.id]))} className="flex min-w-0 flex-1 items-center gap-2 text-left">
                    <ChevronDown className={cn("size-4 shrink-0 text-muted transition-transform", !isOpen && "-rotate-90")} aria-hidden />
                    <span className="truncate font-bold text-fg">{t.title}</span>
                    <span className="shrink-0 text-sm text-muted">{items.length} nội dung</span>
                  </button>
                  <Button size="sm" variant="ghost" onClick={() => { setOpen((o) => [...new Set([...o, t.id])]); setAdding(t.id); }}><Plus /> Thêm nội dung</Button>
                  <RowMenu label={`Thao tác module ${t.title}`}>
                    <MenuItem onClick={() => setRename(t.id)}><Pencil /> Đổi tên</MenuItem>
                    {ti > 0 && <MenuItem onClick={() => setTopics(moveItem(course.topics, ti, ti - 1))}><ChevronUp /> Đưa lên</MenuItem>}
                    {ti < course.topics.length - 1 && <MenuItem onClick={() => setTopics(moveItem(course.topics, ti, ti + 1))}><ChevronDown /> Đưa xuống</MenuItem>}
                    <MenuItem danger onClick={() => { if (window.confirm(`Xóa "${t.title}" cùng ${items.length} nội dung?`)) setTopics(course.topics.filter((x) => x.id !== t.id)); }}><Trash2 /> Xóa module</MenuItem>
                  </RowMenu>
                </>
              )}
            </div>
            {isOpen && (
              <div className="p-2">
                {items.length === 0 && <p className="px-2 py-3 text-sm text-muted">Module trống. Thêm bài học, mô phỏng hoặc bài kiểm tra.</p>}
                <ol className="space-y-1.5">
                  {items.map((it, i) => {
                    const ref = it.block.kind === "simulation" ? ["lab", it.block.labSlug] : it.block.kind === "practice" ? ["quiz", it.block.practiceSetId] : it.block.kind === "python" ? ["code", it.block.exerciseId] : null;
                    const done = ref ? delivered(ref[0]!, ref[1]) : [];
                    return (
                      <BlockEditor
                        key={it.block.id}
                        block={it.block}
                        grade={course.grade}
                        index={i}
                        count={items.length}
                        open={openItem === it.block.id}
                        dragging={drag?.topic === t.id && drag.index === i}
                        label={it.title}
                        chip={ITEM_LABEL[it.type]}
                        actions={
                          <span className="flex shrink-0 items-center gap-1.5">
                            <span className={cn("hidden rounded-md px-2 py-0.5 text-xs font-semibold sm:inline", CHIP[it.type])}>{ITEM_LABEL[it.type]}</span>
                            {done.length > 0 && <span className="hidden rounded-md bg-success/10 px-2 py-0.5 text-xs text-success-fg md:inline" title={done.map((a) => `${d.classes.find((c) => c.id === a.classId)?.name}: hạn ${formatDate(a.dueAt)}`).join(", ")}>Đã giao · hạn {formatDate(done[0].dueAt)}</span>}
                            {ref?.[1] && <Button size="sm" variant="ghost" onClick={() => setAssign({ preset: { kind: ref[0] as AssignPreset["kind"], ref: ref[1]! }, sgkRef: it.lesson.sgkRef })}><Send /> Giao</Button>}
                          </span>
                        }
                        onToggle={() => setOpenItem(openItem === it.block.id ? null : it.block.id)}
                        onChange={(p) => patchTopic(t.id, (x) => ({ ...x, lessons: x.lessons.map((l) => ({ ...l, blocks: l.blocks.map((b) => (b.id === it.block.id ? { ...b, ...p } : b)) })) }))}
                        onMove={(to) => patchTopic(t.id, (x) => reorderModule(x, i, to))}
                        onDelete={() => { if (window.confirm(`Xóa "${it.title}"?`)) patchTopic(t.id, (x) => ({ ...x, lessons: x.lessons.map((l) => ({ ...l, blocks: l.blocks.filter((b) => b.id !== it.block.id) })).filter((l) => l.blocks.length) })); }}
                        onDragStart={() => setDrag({ topic: t.id, index: i })}
                        onDragEnd={() => setDrag(null)}
                        onDropHere={() => { if (drag?.topic === t.id) patchTopic(t.id, (x) => reorderModule(x, drag.index, i)); setDrag(null); }}
                      />
                    );
                  })}
                </ol>
                {adding === t.id ? (
                  <div className="mt-2 rounded-xl border border-dashed border-line p-3">
                    <p className="mb-2 text-sm font-medium text-fg">Thêm vào {t.title.split(":")[0]}</p>
                    <div className="flex flex-wrap gap-2">
                      {ADD.map((a) => <button key={a.type} type="button" onClick={() => addItem(t, a)} className={cn("rounded-lg px-3 py-1.5 text-sm font-semibold", CHIP[a.type])}>{ITEM_LABEL[a.type]}</button>)}
                      <Button size="sm" variant="ghost" onClick={() => setAdding(null)}>Hủy</Button>
                    </div>
                  </div>
                ) : (
                  <button type="button" onClick={() => setAdding(t.id)} className="mt-2 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-muted hover:bg-surface-2 hover:text-fg"><Plus className="size-4" aria-hidden /> Thêm nội dung</button>
                )}
              </div>
            )}
          </section>
        );
      })}
      <AssignDialog open={!!assign} onOpenChange={(o) => !o && setAssign(null)} preset={assign?.preset} sgkRef={assign?.sgkRef} courseId={course.id} classId={course.classIds[0]} title="Giao bài" />
    </div>
  );
}

/* ---------- Cài đặt: thông tin, lớp, phát hành ---------- */

function Settings({ course }: { course: Course }) {
  const { d, user } = useSessionData();
  const mine = teacherClasses(d, user.id);
  const router = useRouter();
  const check = useMemo(() => validateForPublish(course), [course]);
  return (
    <div className="max-w-3xl space-y-5">
      <section className="space-y-3 rounded-2xl border border-line bg-surface p-5">
        <h2 className="font-bold text-fg">Thông tin</h2>
        <Field label="Tên khóa học" htmlFor="c-title"><Input id="c-title" value={course.title} onChange={(e) => d.updateCourse(course.id, { title: e.target.value })} /></Field>
        <Field label="Mô tả" htmlFor="c-desc"><Textarea id="c-desc" rows={3} value={course.description} onChange={(e) => d.updateCourse(course.id, { description: e.target.value })} /></Field>
        <Checkbox label="Học lần lượt: hoàn thành nội dung trước mới mở bài sau" checked={course.sequential} onChange={(e) => d.updateCourse(course.id, { sequential: e.target.checked })} />
      </section>
      <section className="space-y-3 rounded-2xl border border-line bg-surface p-5">
        <h2 className="font-bold text-fg">Lớp học khóa này</h2>
        <p className="text-sm text-muted">Một khóa học dùng cho nhiều lớp; hạn nộp và kết quả quản lý riêng từng lớp.</p>
        <div className="flex flex-wrap gap-2">
          {mine.map((c) => (
            <label key={c.id} className={cn("flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-1.5 text-sm", course.classIds.includes(c.id) ? "border-cyan bg-cyan/10 text-fg" : "border-line text-muted")}>
              <input type="checkbox" checked={course.classIds.includes(c.id)} onChange={(e) => d.updateCourse(course.id, { classIds: e.target.checked ? [...course.classIds, c.id] : course.classIds.filter((x) => x !== c.id) })} /> {c.name}{c.grade !== course.grade && <span className="text-warning-fg"> (khối {c.grade})</span>}
            </label>
          ))}
        </div>
        {check.errors.length > 0 && <Notice tone="danger"><p className="font-medium">Cần sửa trước khi phát hành:</p><ul className="mt-1 list-disc pl-5">{check.errors.slice(0, 6).map((e) => <li key={e}>{e}</li>)}</ul></Notice>}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {course.status === "published" ? <Badge tone="success">Đang giảng dạy</Badge> : <Badge>Bản nháp</Badge>}
          <span className="flex-1" />
          {course.status === "published" && <Button variant="ghost" onClick={() => { d.unpublishCourse(course.id, user.id); toast.success("Đã thu hồi về bản nháp"); }}><Undo2 /> Thu hồi</Button>}
          <Button disabled={!course.classIds.length || check.errors.length > 0} onClick={() => { d.publishCourse(course.id, course.classIds, user.id); toast.success("Học sinh các lớp đã thấy khóa học"); }}><Send /> {course.status === "published" ? "Cập nhật lớp" : `Phát hành cho ${course.classIds.length} lớp`}</Button>
        </div>
      </section>
      <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-danger/30 p-5">
        <div><h2 className="font-bold text-fg">Xóa khóa học</h2><p className="text-sm text-muted">Tiến độ của học sinh trong khóa cũng bị xóa.</p></div>
        <Button variant="ghost" className="text-danger-fg" onClick={() => { if (window.confirm(`Xóa khóa học "${course.title}"?`)) { d.deleteCourse(course.id, user.id); toast.success("Đã xóa khóa học"); router.push("/teacher/courses"); } }}><Trash2 /> Xóa</Button>
      </section>
    </div>
  );
}

const courseClasses = (course: Course, d: ReturnType<typeof useSessionData>["d"]) => d.classes.filter((c) => course.classIds.includes(c.id));
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
              {course.topics.map((t) => { const n = shownLessons.filter((x) => x.t.id === t.id).length; return n ? <th key={t.id} scope="colgroup" colSpan={n} className="border-l border-line px-2 py-1 text-left text-xs font-semibold text-muted"><span className="line-clamp-1" title={t.title}>{t.title.split(":")[0].split(".")[0]}</span></th> : null; })}
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

