"use client";
/**
 * Khóa học: chỉ tìm, tạo và chọn khóa học. Số liệu chi tiết (tiến độ, kết quả) nằm trong từng khóa học.
 */
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { BookMarked, ChevronRight, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import type { Grade, TextbookId } from "@/lib/domain/types";
import { TEXTBOOKS } from "@/lib/data/curriculum";
import { allLessons } from "@/lib/courses/course";
import { teacherClasses } from "@/lib/store/scoped";
import { useSessionData } from "@/lib/store/use-role";
import { cn, matchesQuery } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/feedback";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/form";

const GRADE_BG: Record<Grade, string> = { 10: "from-[#22d3ee] to-[#4f7fff]", 11: "from-[#60a5fa] to-[#6366f1]", 12: "from-[#a78bfa] to-[#ec4899]" };

export default function TeacherCoursesPage() {
  const { d, user } = useSessionData();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const courses = d.courses.filter((c) => c.ownerId === user.id);
  const shown = courses.filter((c) => matchesQuery(q, c.title, c.description));
  return (
    <>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-fg">Khóa học</h1>
          <p className="mt-1 text-muted">Quản lý nội dung và chương trình giảng dạy</p>
        </div>
        <Button onClick={() => setOpen(true)}><Plus /> Tạo khóa học</Button>
      </div>
      {courses.length === 0 ? (
        <EmptyState icon={BookMarked} title="Chưa có khóa học" description="Tạo khóa học → thêm module (bài học, mô phỏng, bài kiểm tra) → giao cho lớp. Có thể dựng sẵn module theo SGK." action={<Button onClick={() => setOpen(true)}><Plus /> Tạo khóa học</Button>} />
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
                      <span className="block truncate text-sm text-muted">{c.topics.length} module · {items} nội dung · {classes.length ? `Lớp ${classes.join(", ")}` : "chưa có lớp"}</span>
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
      <DialogContent title="Tạo khóa học" description="Khóa học gắn với khối lớp và các lớp sẽ học. Có thể dựng sẵn module theo chủ đề SGK, sau đó thêm hoặc sắp xếp nội dung.">
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
          <Checkbox label={book === "kntt" ? "Dựng sẵn module theo chủ đề SGK (bài học, mô phỏng, bài kiểm tra)" : "Dựng sẵn chủ đề và bài theo chương trình"} checked={scaffold} onChange={(e) => setScaffold(e.target.checked)} />
          <Checkbox label="Học lần lượt: hoàn thành bài trước mới mở bài sau" checked={sequential} onChange={(e) => setSequential(e.target.checked)} />
          <div className="flex justify-end pt-2"><Button type="submit"><Plus /> Tạo khóa học</Button></div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
