"use client";
/**
 * Khóa học — quản lý quá trình học: thầy cô xây chương trình (khóa học → chương → bài → hoạt động + bài kiểm tra cuối bài),
 * phát hành cho lớp và theo dõi tiến độ. SGK số là tài liệu tham khảo để dựng khung.
 */
import { LabCollage } from "@/components/landing/hero-visuals";
import { PageHero } from "@/components/layout/page-hero";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, BookMarked, BookOpen, ClipboardCheck, FlaskConical, Layers, Plus, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import type { Course, Grade, TextbookId } from "@/lib/domain/types";
import { TEXTBOOKS } from "@/lib/data/curriculum";
import { allLessons, courseCompletion, finalTest } from "@/lib/courses/course";
import { classStudents, teacherClasses } from "@/lib/store/scoped";
import { useSessionData } from "@/lib/store/use-role";
import { cn, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/feedback";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/form";

const GRADE_BG: Record<Grade, string> = { 10: "from-cyan/25", 11: "from-blue/25", 12: "from-violet/25" };

function useCourseStats(c: Course) {
  const { d } = useSessionData();
  const lessons = allLessons(c);
  const students = d.classes.filter((x) => c.classIds.includes(x.id)).flatMap((x) => classStudents(d, x.id));
  const pct = students.map((s) => courseCompletion(c, { progress: d.courseProgress.find((p) => p.studentId === s.id && p.courseId === c.id), practiceAttempts: d.practiceAttempts, studentId: s.id }).percent);
  return {
    chapters: c.topics.length,
    lessons: lessons.length,
    sims: lessons.reduce((n, l) => n + l.blocks.filter((b) => b.kind === "simulation").length, 0),
    tests: lessons.filter((l) => finalTest(l)).length,
    students: students.length,
    avg: pct.length ? Math.round(pct.reduce((a, b) => a + b, 0) / pct.length) : 0,
  };
}

function CourseCard({ c }: { c: Course }) {
  const { d, user } = useSessionData();
  const s = useCourseStats(c);
  const classes = d.classes.filter((x) => c.classIds.includes(x.id));
  return (
    <li className={cn("flex flex-col rounded-3xl border border-line bg-surface bg-gradient-to-br via-surface to-surface p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg", GRADE_BG[c.grade])}>
      <div className="flex items-start gap-3">
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[#22d3ee] to-[#4f7fff] text-lg font-extrabold text-[#04111f]">{c.grade}</span>
        <div className="min-w-0 flex-1">
          <p className="text-lg font-bold leading-snug text-fg">{c.title}</p>
          <p className="mt-0.5 flex flex-wrap items-center gap-1 text-sm text-muted">
            Tin học {c.grade} <ArrowRight className="size-3.5" aria-hidden />
            {classes.length ? classes.map((x) => <span key={x.id} className="rounded-md bg-fg px-1.5 py-0.5 text-xs font-bold text-bg">{x.name}</span>) : <span className="italic">chưa chọn lớp</span>}
          </p>
        </div>
        {c.status === "published" ? <Badge tone="success">Đang dạy</Badge> : <Badge>Bản nháp</Badge>}
      </div>
      <ul className="mt-4 grid grid-cols-4 gap-2 text-center">
        {[{ icon: Layers, n: s.chapters, l: "chương" }, { icon: BookOpen, n: s.lessons, l: "bài" }, { icon: FlaskConical, n: s.sims, l: "mô phỏng" }, { icon: ClipboardCheck, n: s.tests, l: "bài KT" }].map((x) => (
          <li key={x.l} className="rounded-xl bg-bg/70 px-1 py-2"><x.icon className="mx-auto size-4 text-muted" aria-hidden /><b className="block text-base tabular-nums text-fg">{x.n}</b><span className="text-[11px] text-muted">{x.l}</span></li>
        ))}
      </ul>
      {c.status === "published" && (
        <div className="mt-4">
          <div className="mb-1 flex justify-between text-xs"><span className="text-muted"><Users className="mr-1 inline size-3.5" aria-hidden />{s.students} học sinh · tiến độ trung bình</span><b className="tabular-nums text-fg">{s.avg}%</b></div>
          <div className="h-2 rounded-full bg-surface-2"><div className="h-full rounded-full bg-success" style={{ width: `${s.avg}%` }} /></div>
        </div>
      )}
      <p className="mt-3 text-xs text-muted">Cập nhật {formatDate(c.updatedAt, true)}{c.sequential ? " · học lần lượt" : ""}</p>
      <div className="mt-auto flex flex-wrap gap-2 pt-4">
        <Button asChild size="sm"><Link href={`/teacher/courses/${c.id}`}>Mở chương trình</Link></Button>
        {c.status === "published" && <Button asChild size="sm" variant="secondary"><Link href={`/teacher/courses/${c.id}?xem=tien-do`}>Tiến độ học sinh</Link></Button>}
        <Button size="sm" variant="ghost" className="ml-auto" onClick={() => { if (window.confirm(`Xóa khóa học "${c.title}"? Tiến độ của học sinh cũng bị xóa.`)) { d.deleteCourse(c.id, user.id); toast.success("Đã xóa khóa học"); } }} aria-label={`Xóa ${c.title}`}><Trash2 /></Button>
      </div>
    </li>
  );
}

export default function TeacherCoursesPage() {
  const { d, user } = useSessionData();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const courses = d.courses.filter((c) => c.ownerId === user.id);
  const lessons = courses.reduce((n, c) => n + allLessons(c).length, 0);

  return (
    <>
      <PageHero variant="app" eyebrow="Khóa học · Quản lý quá trình học" icon={BookMarked} title="Xây chương trình," accent="tổ chức học theo tiến trình" description="Khóa học → Chương → Bài → Hoạt động (mô phỏng, thực hành) và Bài kiểm tra cuối bài. Phát hành cho lớp rồi theo dõi tiến độ từng em." actions={<Button onClick={() => setOpen(true)}><Plus /> Tạo khóa học</Button>} stats={[{ value: courses.length, label: "khóa học" }, { value: courses.filter((c) => c.status === "published").length, label: "đang dạy" }, { value: lessons, label: "bài học" }, { value: teacherClasses(d, user.id).length, label: "lớp phụ trách" }]} visual={<LabCollage slugs={["inside-computer-3d", "network-journey", "os-explorer", "smart-coding-city"]} hrefFor={(s) => `/labs/${s}`} />} />

      <ol className="mb-8 grid gap-2 sm:grid-cols-2 lg:grid-cols-5" aria-label="Các bước">
        {["Tạo khóa học, chọn lớp", "Tạo chương", "Thêm bài học", "Đính kèm mô phỏng, thêm bài kiểm tra", "Phát hành, theo dõi tiến độ"].map((t, i) => (
          <li key={t} className="flex items-center gap-2 rounded-2xl border border-line bg-surface px-3 py-2.5 text-sm text-fg"><span className="grid size-7 shrink-0 place-items-center rounded-full bg-cyan/15 text-xs font-bold text-cyan-fg">{i + 1}</span>{t}</li>
        ))}
      </ol>

      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <h2 className="text-2xl font-bold text-fg">Khóa học của tôi</h2>
        <Button asChild variant="ghost" size="sm"><Link href="/teacher/sgk"><BookOpen /> SGK số (tham khảo)</Link></Button>
      </div>
      {courses.length === 0 ? (
        <EmptyState icon={BookMarked} title="Chưa có khóa học" description="Tạo khóa học đầu tiên — có thể dựng sẵn chương, bài, mô phỏng và bài kiểm tra theo mục lục SGK rồi chỉnh tiếp." action={<Button onClick={() => setOpen(true)}><Plus /> Tạo khóa học</Button>} />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{courses.map((c) => <CourseCard key={c.id} c={c} />)}</ul>
      )}
      <CreateCourseDialog open={open} onOpenChange={setOpen} onCreate={(input) => { const id = d.createCourse({ ...input, ownerId: user.id }); toast.success("Đã tạo khóa học"); router.push(`/teacher/courses/${id}`); }} />
    </>
  );
}

function CreateCourseDialog({ open, onOpenChange, onCreate }: { open: boolean; onOpenChange: (v: boolean) => void; onCreate: (i: { title: string; description: string; grade: Grade; textbookId: TextbookId; sequential: boolean; scaffold: boolean; classIds: string[] }) => void }) {
  const { d, user } = useSessionData();
  const classes = teacherClasses(d, user.id);
  const [title, setTitle] = useState("");
  const [grade, setGrade] = useState<Grade>(classes[0]?.grade ?? 10);
  const [book, setBook] = useState<TextbookId>("kntt");
  const [description, setDescription] = useState("");
  const [classIds, setClassIds] = useState<string[]>([]);
  const [scaffold, setScaffold] = useState(true);
  const [sequential, setSequential] = useState(true);
  const [error, setError] = useState("");
  const fit = classes.filter((c) => c.grade === grade);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title="Tạo khóa học" description="Khóa học gắn với khối lớp và các lớp sẽ học. Có thể dựng sẵn chương → bài → hoạt động theo mục lục SGK.">
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (title.trim().length < 3) return setError("Tên khóa học cần ít nhất 3 ký tự");
            onCreate({ title: title.trim(), description: description.trim(), grade, textbookId: book, sequential, scaffold, classIds });
            onOpenChange(false);
            setTitle("");
            setDescription("");
            setClassIds([]);
          }}
        >
          <Field label="Tên khóa học" htmlFor="nc-title" error={error}>
            <Input id="nc-title" placeholder={`Tin học ${grade}`} value={title} onChange={(e) => { setTitle(e.target.value); setError(""); }} aria-invalid={Boolean(error)} />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Khối lớp" htmlFor="nc-grade">
              <Select id="nc-grade" value={grade} onChange={(e) => { setGrade(Number(e.target.value) as Grade); setClassIds([]); }}>{[10, 11, 12].map((g) => <option key={g} value={g}>Tin học {g}</option>)}</Select>
            </Field>
            <Field label="Bộ sách" htmlFor="nc-book">
              <Select id="nc-book" value={book} onChange={(e) => setBook(e.target.value as TextbookId)}>{TEXTBOOKS.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</Select>
            </Field>
          </div>
          <fieldset>
            <legend className="mb-1.5 text-sm font-medium text-fg">Dạy cho lớp</legend>
            {fit.length === 0 ? <p className="text-xs text-muted">Thầy cô chưa có lớp khối {grade}. Có thể chọn lớp sau khi tạo.</p> : (
              <div className="flex flex-wrap gap-2">
                {fit.map((c) => (
                  <label key={c.id} className={cn("flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-1.5 text-sm", classIds.includes(c.id) ? "border-cyan bg-cyan/10 text-fg" : "border-line text-muted")}>
                    <input type="checkbox" checked={classIds.includes(c.id)} onChange={(e) => setClassIds(e.target.checked ? [...classIds, c.id] : classIds.filter((x) => x !== c.id))} /> {c.name}
                  </label>
                ))}
              </div>
            )}
          </fieldset>
          <Field label="Mô tả" htmlFor="nc-desc"><Textarea id="nc-desc" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} /></Field>
          <Checkbox label={book === "kntt" ? "Dựng sẵn chương, bài, mô phỏng và bài kiểm tra cuối bài theo mục lục SGK" : "Dựng sẵn chủ đề và bài theo chương trình"} checked={scaffold} onChange={(e) => setScaffold(e.target.checked)} />
          <Checkbox label="Học lần lượt: hoàn thành bài trước mới mở bài sau" checked={sequential} onChange={(e) => setSequential(e.target.checked)} />
          <div className="flex justify-end pt-2"><Button type="submit"><Plus /> Tạo và mở chương trình</Button></div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
