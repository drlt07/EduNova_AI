"use client";
import { useState } from "react";
import { Check, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { getLabBySlug } from "@/lib/data/labs";
import type { LabResult } from "@/lib/sim/lab-score";
import { classStudents, teacherClasses } from "@/lib/store/scoped";
import { useSessionData } from "@/lib/store/use-role";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form";
import { LabGradeCard } from "@/components/sim/lab-result";

/** Bài mô phỏng AI đã chấm nhưng cần giáo viên xem lại, thuộc các lớp của giáo viên. */
export function labReviewQueue(d: ReturnType<typeof useSessionData>["d"], teacherId: string) {
  const students = new Map(teacherClasses(d, teacherId).flatMap((c) => classStudents(d, c.id).map((u) => [u.id, { name: u.name, cls: c.name }] as const)));
  return d.labResults.filter((r) => r.grade?.needsReview && !r.review && students.has(r.studentId)).map((r) => ({ r, ...students.get(r.studentId)! }));
}

/** Duyệt điểm AI: đồng ý, hoặc sửa điểm kèm lời nhắn cho học sinh. */
export function LabReviewForm({ r, onDone }: { r: LabResult; onDone?: () => void }) {
  const { d, user } = useSessionData();
  const [score, setScore] = useState(String(r.review?.score ?? r.score).replace(".", ","));
  const [note, setNote] = useState(r.review?.note ?? "");
  const save = (value: number) => {
    if (!Number.isFinite(value) || value < 0 || value > 10) return toast.error("Điểm từ 0 đến 10");
    d.reviewLabResult(r.id, user.id, value, note.trim());
    toast.success("Đã lưu điểm duyệt");
    onDone?.();
  };
  return (
    <div className="mt-2 flex flex-wrap items-end gap-2">
      <label className="text-xs text-muted">Điểm<Input aria-label="Điểm duyệt" inputMode="decimal" className="mt-0.5 h-8 w-16" value={score} onChange={(e) => setScore(e.target.value)} /></label>
      <label className="min-w-0 flex-1 basis-40 text-xs text-muted">Lời nhắn cho em (không bắt buộc)<Input aria-label="Lời nhắn" className="mt-0.5 h-8" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ví dụ: Ý về RAM đúng rồi, nhưng thiếu vai trò của CPU." /></label>
      {r.grade && <Button size="sm" variant="secondary" onClick={() => save(r.grade!.score)}><Check /> Đồng ý điểm AI</Button>}
      <Button size="sm" onClick={() => save(Number(score.replace(",", ".")))}>Lưu điểm</Button>
    </div>
  );
}

/** Hàng đợi duyệt ở trang Bài tập & Đánh giá. */
export function LabReviewQueue() {
  const { d, user } = useSessionData();
  const queue = labReviewQueue(d, user.id);
  if (!queue.length) return null;
  return (
    <section id="duyet-mo-phong" className="mb-6 scroll-mt-24 rounded-2xl border border-warning/40 bg-warning/5 p-4">
      <h2 className="flex items-center gap-2 font-semibold text-fg"><Sparkles className="size-4 text-violet-fg" aria-hidden /> {queue.length} bài mô phỏng AI đã chấm, cần thầy cô xem lại</h2>
      <p className="text-sm text-muted">AI chấm phần giải thích theo các ý chính của bài. Những bài dưới đây AI chưa chắc chắn; điểm học sinh thấy là điểm tạm cho đến khi thầy cô duyệt.</p>
      <ul className="mt-3 grid gap-3 lg:grid-cols-2">
        {queue.map(({ r, name, cls }) => (
          <li key={r.id} className="rounded-xl border border-line bg-bg p-3">
            <p className="mb-2 text-sm"><b className="text-fg">{name}</b> <span className="text-muted">· {cls} · {getLabBySlug(r.labSlug)?.title}</span></p>
            {r.grade && <LabGradeCard grade={r.grade} answer={r.answer} />}
            <LabReviewForm r={r} />
          </li>
        ))}
      </ul>
    </section>
  );
}
