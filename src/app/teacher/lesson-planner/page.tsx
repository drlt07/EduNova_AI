"use client";
import Link from "next/link";
import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FilePlus2, NotebookPen, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { LESSONS, TEXTBOOKS, getLesson, getTextbook } from "@/lib/data/curriculum";
import type { Grade, TextbookId } from "@/lib/domain/types";
import { checkLessonPlan } from "@/lib/analytics/lesson-plan-check";
import { useSessionData } from "@/lib/store/use-role";
import { formatDate, matchesQuery } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { EmptyState, PageSkeleton } from "@/components/ui/feedback";
import { Field, Input, Select } from "@/components/ui/form";
import { PageHeader } from "@/components/ui/misc";

function LessonPlannerList() {
  const { d, user } = useSessionData();
  const router = useRouter();
  const params = useSearchParams();
  const [open, setOpen] = useState(params.get("new") === "1");
  const [q, setQ] = useState("");
  const [grade, setGrade] = useState("");
  const [status, setStatus] = useState("");
  const [toDelete, setToDelete] = useState<string | null>(null);

  const [form, setForm] = useState<{ title: string; grade: Grade; textbookId: TextbookId; lessonId: string }>({ title: "", grade: 10, textbookId: "kntt", lessonId: "" });
  const [formError, setFormError] = useState<string | null>(null);
  const lessonOptions = LESSONS.filter((l) => l.grade === form.grade && l.textbookId === form.textbookId);

  const plans = useMemo(
    () => d.lessonPlans.filter((p) => p.ownerId === user.id && (!grade || String(p.grade) === grade) && (!status || p.status === status) && matchesQuery(q, p.title, getLesson(p.lessonId)?.title)),
    [d.lessonPlans, user.id, grade, status, q],
  );

  function create() {
    const lesson = getLesson(form.lessonId);
    if (form.title.trim().length < 3) return setFormError("Tiêu đề tối thiểu 3 ký tự.");
    if (!lesson) return setFormError("Chọn bài học.");
    const id = d.createLessonPlan({
      ownerId: user.id,
      title: form.title.trim(),
      grade: form.grade,
      textbookId: form.textbookId,
      lessonId: lesson.id,
      objectiveIds: [...lesson.objectiveIds],
      durationMinutes: 45,
      status: "draft",
      visibility: "private",
      activities: [],
      notes: "",
    });
    toast.success("Đã tạo KHBD nháp");
    router.push(`/teacher/lesson-planner/${id}`);
  }

  return (
    <>
      <PageHeader
        title="Kế hoạch bài dạy"
        description="Soạn KHBD theo 4 hoạt động: Mở đầu, Hình thành kiến thức, Luyện tập, Vận dụng."
        actions={<Button onClick={() => setOpen(true)}><FilePlus2 /> KHBD mới</Button>}
      />
      <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_160px_160px]">
        <div className="relative">
          <label htmlFor="lp-q" className="sr-only">Tìm KHBD</label>
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
          <Input id="lp-q" type="search" placeholder="Tìm theo tên KHBD hoặc bài học" className="pl-9" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Select aria-label="Lọc lớp" value={grade} onChange={(e) => setGrade(e.target.value)}>
          <option value="">Mọi lớp</option>
          {[10, 11, 12].map((g) => <option key={g} value={g}>Lớp {g}</option>)}
        </Select>
        <Select aria-label="Lọc trạng thái" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Mọi trạng thái</option>
          <option value="draft">Bản nháp</option>
          <option value="published">Đã xuất bản</option>
        </Select>
      </div>
      {plans.length === 0 ? (
        <EmptyState icon={NotebookPen} title="Không có KHBD phù hợp" description="Tạo KHBD mới hoặc thay đổi bộ lọc." action={<Button size="sm" onClick={() => setOpen(true)}>Tạo KHBD</Button>} />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {plans.map((p) => {
            const errors = checkLessonPlan(p).filter((i) => i.severity === "error").length;
            return (
              <li key={p.id} className="flex flex-col rounded-2xl border border-line bg-surface p-5">
                <div className="flex flex-wrap gap-1.5">
                  <Badge tone="blue">Tin {p.grade}</Badge>
                  <Badge>{getTextbook(p.textbookId).short}</Badge>
                  <Badge tone={p.status === "published" ? "success" : "neutral"}>{p.status === "published" ? "Đã xuất bản" : "Nháp"}</Badge>
                  <Badge tone={errors ? "danger" : "success"}>{errors ? `Còn ${errors} mục cần bổ sung` : "Đầy đủ"}</Badge>
                </div>
                <Link href={`/teacher/lesson-planner/${p.id}`} className="mt-3 font-semibold text-fg hover:text-cyan-fg">{p.title}</Link>
                <p className="mt-1 text-sm text-muted">{getLesson(p.lessonId)?.title}</p>
                <p className="mt-2 text-xs text-muted">{p.activities.length} hoạt động · v{p.currentVersion} · cập nhật {formatDate(p.updatedAt)}</p>
                <div className="mt-auto flex gap-2 pt-4">
                  <Button asChild size="sm" variant="secondary"><Link href={`/teacher/lesson-planner/${p.id}`}>Mở</Link></Button>
                  <Button asChild size="sm" variant="outline"><Link href={`/teacher/activity-builder?plan=${p.id}`}>Tạo hoạt động</Link></Button>
                  <Button size="sm" variant="ghost" aria-label={`Xóa ${p.title}`} onClick={() => setToDelete(p.id)}><Trash2 /></Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent title="Tạo KHBD mới" description="Chọn lớp, bộ sách và bài học; mục tiêu của bài được gợi ý sẵn.">
          <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); create(); }}>
            <Field label="Tiêu đề KHBD" htmlFor="new-title" error={formError ?? undefined}>
              <Input id="new-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="vd: Câu lệnh rẽ nhánh if — Tiết 2" autoFocus />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Lớp" htmlFor="new-grade">
                <Select id="new-grade" value={form.grade} onChange={(e) => setForm({ ...form, grade: Number(e.target.value) as Grade, lessonId: "" })}>
                  {[10, 11, 12].map((g) => <option key={g} value={g}>Lớp {g}</option>)}
                </Select>
              </Field>
              <Field label="Bộ sách" htmlFor="new-book">
                <Select id="new-book" value={form.textbookId} onChange={(e) => setForm({ ...form, textbookId: e.target.value as TextbookId, lessonId: "" })}>
                  {TEXTBOOKS.map((t) => <option key={t.id} value={t.id}>{t.short}</option>)}
                </Select>
              </Field>
            </div>
            <Field label="Bài học" htmlFor="new-lesson">
              <Select id="new-lesson" value={form.lessonId} onChange={(e) => setForm({ ...form, lessonId: e.target.value })}>
                <option value="">— Chọn bài —</option>
                {lessonOptions.map((l) => <option key={l.id} value={l.id}>{l.title}</option>)}
              </Select>
            </Field>
            <Button type="submit" className="w-full">Tạo & mở trình soạn</Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <DialogContent title="Xóa KHBD?" description="Thao tác xóa cả lịch sử phiên bản và không thể hoàn tác.">
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setToDelete(null)}>Hủy</Button>
            <Button variant="danger" onClick={() => { if (toDelete) d.deleteLessonPlan(toDelete, user.id); setToDelete(null); toast.success("Đã xóa KHBD"); }}>Xóa</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <LessonPlannerList />
    </Suspense>
  );
}
