"use client";
/**
 * Khóa học: chỉ tìm, tạo và chọn khóa học. Số liệu chi tiết (tiến độ, kết quả) nằm trong từng khóa học.
 */
import Link from "next/link";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BookMarked, ChevronRight, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import type { Grade, TextbookId } from "@/lib/domain/types";
import { TEXTBOOKS } from "@/lib/data/curriculum";
import { allLessons } from "@/lib/courses/course";
import { teacherClasses } from "@/lib/store/scoped";
import { gradeLessons } from "@/lib/access/unlocks";
import { CoursesHeader } from "@/components/teacher/assess-tabs";
import { useSessionData } from "@/lib/store/use-role";
import { cn, matchesQuery } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { EmptyState, PageSkeleton } from "@/components/ui/feedback";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/form";

const GRADE_BG: Record<Grade, string> = { 10: "from-[#2563eb] to-[#38bdf8]", 11: "from-[#1d4ed8] to-[#4f46e5]", 12: "from-[#1e40af] to-[#0ea5e9]" };

export default function TeacherCoursesPage() {
  return <Suspense fallback={<PageSkeleton />}><CoursesList /></Suspense>;
}

function CoursesList() {
  const { d, user } = useSessionData();
  const router = useRouter();
  const params = useSearchParams();
  const [open, setOpen] = useState(() => params.get("tao") === "1");
  const [q, setQ] = useState("");
  const courses = d.courses.filter((c) => c.ownerId === user.id);
  const shown = courses.filter((c) => matchesQuery(q, c.title, c.description));
  return (
    <>
      <CoursesHeader subtitle="Khóa học thầy cô tự dựng: chủ đề → bài → hoạt động, giao cho lớp và theo dõi tiến độ" actions={<Button onClick={() => setOpen(true)}><Plus /> Tạo khóa học</Button>} />
      {courses.length === 0 ? (
        <EmptyState icon={BookMarked} title="Chưa có khóa học" description="Tạo khóa học → thêm chủ đề → bài học → hoạt động (kiến thức, mô phỏng, kiểm tra) → giao cho lớp. Có thể dựng sẵn theo mục lục SGK." action={<Button onClick={() => setOpen(true)}><Plus /> Tạo khóa học</Button>} />
      ) : (
        <>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium text-muted">{courses.length} khóa học</p>
            {courses.length > 4 && (
              <label className="relative w-64">
                <span className="sr-only">Tìm khóa học</span>
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
                <Input className="h-9 pl-9" placeholder="Tìm khóa học…" value={q} onChange={(e) => setQ(e.target.value)} />
              </label>
            )}
          </div>
          <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
            {shown.map((c) => {
              const classes = d.classes.filter((x) => c.classIds.includes(x.id)).map((x) => x.name);
              const items = allLessons(c).reduce((n, l) => n + l.blocks.length, 0);
              return (
                <li key={c.id}>
                  <Link href={`/teacher/courses/${c.id}`} className="group flex items-center gap-4 px-4 py-3.5 hover:bg-surface-2/50">
                    <span className={cn("grid size-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br text-white", GRADE_BG[c.grade])}><span className="text-center leading-none"><b className="block text-lg">{c.grade}</b><span className="text-[9px] font-semibold tracking-wider">TIN HỌC</span></span></span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold text-fg">{c.title}</span>
                      <span className="block truncate text-sm text-muted">{c.topics.length} chủ đề · {allLessons(c).length} bài · {items} hoạt động · {classes.length ? `Lớp ${classes.join(", ")}` : "chưa có lớp"}</span>
                    </span>
                    {c.status === "published" ? <Badge tone="success">Đang dạy</Badge> : <Badge>Bản nháp</Badge>}
                    <ChevronRight className="size-5 shrink-0 text-muted transition-transform group-hover:translate-x-0.5" aria-hidden />
                  </Link>
                </li>
              );
            })}
          </ul>
        </>
      )}
      <CreateCourseDialog open={open} onOpenChange={setOpen} onCreate={({ publish, ...input }) => {
        const id = d.createCourse({ ...input, ownerId: user.id });
        if (publish) d.publishCourse(id, input.classIds, user.id);
        toast.success(publish ? `Đã tạo và phát hành cho ${input.classIds.length} lớp` : "Đã tạo khóa học");
        router.push(`/teacher/courses/${id}`);
      }} />
    </>
  );
}

type CreateInput = { title: string; description: string; grade: Grade; textbookId: TextbookId; sequential: boolean; scaffold: boolean; classIds: string[]; publish: boolean };

/**
 * Tạo khóa học kiểu "chọn mẫu" (như Khan Academy / Google Classroom): bấm một khối → tên, lớp cùng khối và
 * chủ đề → bài → hoạt động theo SGK được điền sẵn; chỉ cần bấm Tạo. Tùy chọn ít dùng gấp lại.
 */
function CreateCourseDialog({ open, onOpenChange, onCreate }: { open: boolean; onOpenChange: (v: boolean) => void; onCreate: (i: CreateInput) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open && (
        <DialogContent title="Tạo khóa học" description="Chọn một mẫu theo khối lớp: chủ đề, bài học, mô phỏng và câu hỏi luyện tập theo SGK được dựng sẵn, thầy cô chỉnh tiếp sau." className="max-w-2xl">
          <CreateCourseForm onCreate={(i) => { onCreate(i); onOpenChange(false); }} />
        </DialogContent>
      )}
    </Dialog>
  );
}

function CreateCourseForm({ onCreate }: { onCreate: (i: CreateInput) => void }) {
  const { d, user } = useSessionData();
  const classes = teacherClasses(d, user.id);
  const mine = [...new Set(classes.map((c) => c.grade))].sort();
  const firstGrade: Grade = mine[0] ?? 10;
  const autoTitle = (g: Grade | null, ids: string[]) => (g ? `Tin học ${g}${ids.length ? ` · ${classes.filter((c) => ids.includes(c.id)).map((c) => c.name).join(", ")}` : ""}` : "");
  const [grade, setGrade] = useState<Grade | null>(firstGrade);
  const [classIds, setClassIds] = useState<string[]>(() => classes.filter((c) => c.grade === firstGrade).map((c) => c.id));
  const [title, setTitle] = useState(() => autoTitle(firstGrade, classes.filter((c) => c.grade === firstGrade).map((c) => c.id)));
  const [touched, setTouched] = useState(false);
  const [book, setBook] = useState<TextbookId>("kntt");
  const [description, setDescription] = useState("");
  const [sequential, setSequential] = useState(false);
  const [publish, setPublish] = useState(true);
  const [more, setMore] = useState(false);
  const [error, setError] = useState("");

  const pickGrade = (g: Grade | null) => {
    const ids = g ? classes.filter((c) => c.grade === g).map((c) => c.id) : [];
    setGrade(g);
    setClassIds(ids);
    if (!touched) setTitle(autoTitle(g, ids));
  };
  const toggleClass = (id: string, on: boolean) => {
    const ids = on ? [...classIds, id] : classIds.filter((x) => x !== id);
    setClassIds(ids);
    if (!touched) setTitle(autoTitle(grade, ids));
  };
  const effGrade: Grade = grade ?? firstGrade;
  const fit = classes.filter((c) => c.grade === effGrade);
  const lessons = gradeLessons(effGrade);
  const topics = new Set(lessons.map((x) => x.topic.no)).size;

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (title.trim().length < 3) return setError("Tên khóa học cần ít nhất 3 ký tự");
        onCreate({ title: title.trim(), description: description.trim(), grade: effGrade, textbookId: book, sequential, scaffold: grade !== null, classIds, publish: publish && classIds.length > 0 });
      }}
    >
      <fieldset>
        <legend className="mb-2 text-sm font-semibold text-fg">1. Chọn mẫu</legend>
        <div className="grid gap-2 sm:grid-cols-4" role="radiogroup" aria-label="Mẫu khóa học">
          {([10, 11, 12] as Grade[]).map((g) => {
            const n = gradeLessons(g).length;
            const on = grade === g;
            return (
              <button key={g} type="button" role="radio" aria-checked={on} onClick={() => pickGrade(g)} className={cn("relative overflow-hidden rounded-2xl border p-3 text-left transition-all", on ? "border-brand ring-2 ring-brand/30" : "border-line hover:border-brand/40")}>
                <span className={cn("mb-2 grid size-10 place-items-center rounded-xl bg-gradient-to-br text-lg font-extrabold text-white", GRADE_BG[g])}>{g}</span>
                <span className="block font-semibold text-fg">Tin học {g}</span>
                <span className="block text-xs text-muted">{n} bài theo SGK</span>
                {mine.includes(g) && <span className="mt-1 inline-block rounded-full bg-success/15 px-1.5 text-[11px] font-semibold text-success-fg">Lớp của thầy cô</span>}
              </button>
            );
          })}
          <button type="button" role="radio" aria-checked={grade === null} onClick={() => pickGrade(null)} className={cn("rounded-2xl border border-dashed p-3 text-left transition-all", grade === null ? "border-brand ring-2 ring-brand/30" : "border-line hover:border-brand/40")}>
            <span className="mb-2 grid size-10 place-items-center rounded-xl bg-surface-2 text-muted"><Plus className="size-5" aria-hidden /></span>
            <span className="block font-semibold text-fg">Khóa trống</span>
            <span className="block text-xs text-muted">Tự thêm chủ đề, bài</span>
          </button>
        </div>
        {grade !== null && <p className="mt-2 text-xs text-muted">Dựng sẵn {topics} chủ đề, {lessons.length} bài; mỗi bài có phần kiến thức, mô phỏng và câu hỏi luyện tập có sẵn.</p>}
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-sm font-semibold text-fg">2. Dạy cho lớp</legend>
        {fit.length === 0 ? <p className="text-sm text-muted">Chưa có lớp khối {effGrade}. Vẫn tạo được, chọn lớp sau ở tab Cài đặt của khóa học.</p> : (
          <div className="flex flex-wrap gap-2">
            {fit.map((c) => (
              <label key={c.id} className={cn("flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-1.5 text-sm", classIds.includes(c.id) ? "border-brand bg-brand/10 text-fg" : "border-line text-muted")}>
                <input type="checkbox" checked={classIds.includes(c.id)} onChange={(e) => toggleClass(c.id, e.target.checked)} /> {c.name}
                <span className="text-xs text-muted">{d.enrollments.filter((x) => x.classId === c.id).length} em</span>
              </label>
            ))}
          </div>
        )}
      </fieldset>

      <Field label="3. Tên khóa học" htmlFor="nc-title" error={error}>
        <Input id="nc-title" value={title} onChange={(e) => { setTitle(e.target.value); setTouched(true); setError(""); }} aria-invalid={Boolean(error)} />
      </Field>

      <div className="space-y-2 rounded-xl bg-surface-2/60 p-3">
        <Checkbox label="Phát hành ngay cho lớp đã chọn (học sinh thấy khóa học)" checked={publish} disabled={!classIds.length} onChange={(e) => setPublish(e.target.checked)} />
        <Checkbox label="Học lần lượt: xong bài trước mới mở bài sau" checked={sequential} onChange={(e) => setSequential(e.target.checked)} />
        <button type="button" onClick={() => setMore(!more)} aria-expanded={more} className="text-sm font-medium text-blue-fg hover:underline">{more ? "Ẩn tùy chọn khác" : "Tùy chọn khác (bộ sách, mô tả)"}</button>
        {more && (
          <div className="grid gap-3 pt-1 sm:grid-cols-2">
            <Field label="Bộ sách" htmlFor="nc-book"><Select id="nc-book" value={book} onChange={(e) => setBook(e.target.value as TextbookId)}>{TEXTBOOKS.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</Select></Field>
            <Field label="Mô tả" htmlFor="nc-desc"><Textarea id="nc-desc" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} /></Field>
          </div>
        )}
      </div>
      <div className="flex justify-end"><Button type="submit"><Plus /> {publish && classIds.length ? `Tạo và giao cho ${classIds.length} lớp` : "Tạo khóa học"}</Button></div>
    </form>
  );
}
