"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { BookMarked, GraduationCap, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Grade, TextbookId } from "@/lib/domain/types";
import { TEXTBOOKS } from "@/lib/data/curriculum";
import { allLessons } from "@/lib/courses/course";
import { useSessionData } from "@/lib/store/use-role";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/feedback";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/form";
import { PageHeader } from "@/components/ui/misc";
import { SharedResources } from "@/components/teacher/shared-resources";

export default function TeacherCoursesPage() {
  const { d, user } = useSessionData();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const courses = d.courses.filter((c) => c.ownerId === user.id);

  return (
    <>
      <PageHeader
        title="Khóa học & bài giảng"
        description="Xây khóa học theo khối lớp, bộ sách, chủ đề và bài học; mỗi bài gồm kiến thức, video, mô phỏng, thực hành Python và luyện tập."
        actions={<Button onClick={() => setOpen(true)}><Plus /> Tạo khóa học</Button>}
      />
      <SharedResources items={["labs", "resources", "activity", "library"]} />
      {courses.length === 0 ? (
        <EmptyState icon={BookMarked} title="Chưa có khóa học" description="Tạo khóa học đầu tiên — có thể dựng sẵn khung chủ đề và bài theo chương trình." action={<Button onClick={() => setOpen(true)}><Plus /> Tạo khóa học</Button>} />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {courses.map((c) => {
            const classes = d.classes.filter((x) => c.classIds.includes(x.id));
            return (
              <li key={c.id} className="flex flex-col rounded-2xl border border-line bg-surface p-5">
                <div className="flex items-start gap-3">
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-cyan/25 to-violet/20 text-cyan-fg"><GraduationCap className="size-5" aria-hidden /></span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-fg">{c.title}</p>
                    <p className="text-xs text-muted">Tin {c.grade} · {TEXTBOOKS.find((t) => t.id === c.textbookId)?.name}</p>
                  </div>
                  {c.status === "published" ? <Badge tone="success">Đã phát hành</Badge> : <Badge>Bản nháp</Badge>}
                </div>
                <p className="mt-3 line-clamp-2 text-sm text-muted">{c.description || "Chưa có mô tả."}</p>
                <div className="mt-3 flex flex-wrap gap-1.5 text-xs">
                  <Badge>{c.topics.length} chủ đề · {allLessons(c).length} bài</Badge>
                  {c.status === "published" && classes.map((x) => <Badge key={x.id} tone="blue">{x.name}</Badge>)}
                </div>
                <p className="mt-2 text-xs text-muted">Cập nhật {formatDate(c.updatedAt, true)}</p>
                <div className="mt-auto flex gap-2 pt-4">
                  <Button asChild size="sm"><Link href={`/teacher/courses/${c.id}`}>Mở trình soạn</Link></Button>
                  <Button size="sm" variant="ghost" onClick={() => { if (window.confirm(`Xóa khóa học "${c.title}"? Tiến độ của học sinh cũng bị xóa.`)) { d.deleteCourse(c.id, user.id); toast.success("Đã xóa khóa học"); } }} aria-label={`Xóa ${c.title}`}><Trash2 /></Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <CreateCourseDialog open={open} onOpenChange={setOpen} onCreate={(input) => { const id = d.createCourse({ ...input, ownerId: user.id }); toast.success("Đã tạo khóa học"); router.push(`/teacher/courses/${id}`); }} />
    </>
  );
}

function CreateCourseDialog({ open, onOpenChange, onCreate }: { open: boolean; onOpenChange: (v: boolean) => void; onCreate: (i: { title: string; description: string; grade: Grade; textbookId: TextbookId; sequential: boolean; scaffold: boolean }) => void }) {
  const [title, setTitle] = useState("");
  const [grade, setGrade] = useState<Grade>(10);
  const [book, setBook] = useState<TextbookId>("kntt");
  const [description, setDescription] = useState("");
  const [scaffold, setScaffold] = useState(true);
  const [sequential, setSequential] = useState(false);
  const [error, setError] = useState("");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title="Tạo khóa học" description="Chọn khối lớp và bộ sách; có thể dựng sẵn khung chủ đề, bài học theo chương trình để chỉnh tiếp.">
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (title.trim().length < 3) return setError("Tên khóa học cần ít nhất 3 ký tự");
            onCreate({ title: title.trim(), description: description.trim(), grade, textbookId: book, sequential, scaffold });
            onOpenChange(false);
            setTitle("");
            setDescription("");
          }}
        >
          <Field label="Tên khóa học" htmlFor="nc-title" error={error}>
            <Input id="nc-title" placeholder={`Tin học lớp ${grade}`} value={title} onChange={(e) => { setTitle(e.target.value); setError(""); }} aria-invalid={Boolean(error)} />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Khối lớp" htmlFor="nc-grade">
              <Select id="nc-grade" value={grade} onChange={(e) => setGrade(Number(e.target.value) as Grade)}>{[10, 11, 12].map((g) => <option key={g} value={g}>Tin học {g}</option>)}</Select>
            </Field>
            <Field label="Bộ sách" htmlFor="nc-book">
              <Select id="nc-book" value={book} onChange={(e) => setBook(e.target.value as TextbookId)}>{TEXTBOOKS.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</Select>
            </Field>
          </div>
          <Field label="Mô tả" htmlFor="nc-desc"><Textarea id="nc-desc" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} /></Field>
          <Checkbox label="Dựng sẵn khung chủ đề và bài học theo chương trình" checked={scaffold} onChange={(e) => setScaffold(e.target.checked)} />
          <Checkbox label="Học lần lượt: hoàn thành bài trước mới mở bài sau" checked={sequential} onChange={(e) => setSequential(e.target.checked)} />
          <div className="flex justify-end pt-2"><Button type="submit"><Plus /> Tạo và mở trình soạn</Button></div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
