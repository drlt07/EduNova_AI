"use client";
import { FilePlus2, Upload } from "lucide-react";
import type { Grade, TextbookId } from "@/lib/domain/types";
import { LESSONS, TEXTBOOKS, TOPICS, getObjective } from "@/lib/data/curriculum";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/form";

export interface LessonChoice {
  grade: Grade;
  textbookId: TextbookId;
  lessonId: string;
  periods: number;
  source: "upload" | "starter";
}

/** Bước 1: lớp, bộ SGK, bài học, số tiết; và cách bắt đầu (tải KHBD có sẵn hoặc soạn mới). */
export function LessonPicker({ value, onChange, onNext }: { value: LessonChoice; onChange: (v: LessonChoice) => void; onNext: () => void }) {
  const lessons = LESSONS.filter((l) => l.grade === value.grade && l.textbookId === value.textbookId).sort((a, b) => a.order - b.order);
  const lesson = lessons.find((l) => l.id === value.lessonId);
  const set = (patch: Partial<LessonChoice>) => {
    const next = { ...value, ...patch };
    if (!LESSONS.some((l) => l.id === next.lessonId && l.grade === next.grade && l.textbookId === next.textbookId)) {
      next.lessonId = LESSONS.find((l) => l.grade === next.grade && l.textbookId === next.textbookId)?.id ?? "";
    }
    onChange(next);
  };
  return (
    <Card>
      <CardHeader>
        <CardTitle as="h2">Chọn bài học</CardTitle>
        <CardDescription>Trợ lý dùng bài học để gắn yêu cầu cần đạt, gợi ý mô phỏng và lưu KHBD vào đúng chỗ.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Lớp" htmlFor="kp-grade">
            <Select id="kp-grade" value={value.grade} onChange={(e) => set({ grade: Number(e.target.value) as Grade })}>
              {[10, 11, 12].map((g) => <option key={g} value={g}>Tin học {g}</option>)}
            </Select>
          </Field>
          <Field label="Bộ sách giáo khoa" htmlFor="kp-book">
            <Select id="kp-book" value={value.textbookId} onChange={(e) => set({ textbookId: e.target.value as TextbookId })}>
              {TEXTBOOKS.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </Select>
          </Field>
          <Field label="Bài học" htmlFor="kp-lesson" className="sm:col-span-2">
            <Select id="kp-lesson" value={value.lessonId} onChange={(e) => set({ lessonId: e.target.value })}>
              {TOPICS.map((t) => {
                const ls = lessons.filter((l) => l.topicId === t.id);
                return ls.length ? <optgroup key={t.id} label={`Chủ đề ${t.code}. ${t.name}`}>{ls.map((l) => <option key={l.id} value={l.id}>{l.title}</option>)}</optgroup> : null;
              })}
            </Select>
          </Field>
          <Field label="Số tiết" htmlFor="kp-periods" hint="Tiết 45 phút.">
            <Input id="kp-periods" type="number" min={1} max={6} value={value.periods} onChange={(e) => set({ periods: Math.max(1, Math.min(6, Number(e.target.value) || 1)) })} />
          </Field>
        </div>
        {lesson && (
          <div className="rounded-xl bg-surface-2 p-4 text-sm">
            <p className="font-medium text-fg">Yêu cầu cần đạt của bài</p>
            <ul className="mt-1.5 list-disc space-y-1 pl-5 text-muted">
              {lesson.objectiveIds.map((id) => <li key={id}><span className="font-mono text-xs text-cyan-fg">{id}</span> {getObjective(id)?.description}</li>)}
            </ul>
          </div>
        )}
        <fieldset>
          <legend className="mb-2 text-sm font-medium text-fg">Bắt đầu từ</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {([
              ["upload", Upload, "Tải KHBD có sẵn", "File Word hoặc PDF của thầy/cô. Trợ lý giữ nguyên nội dung gốc, chỉ bổ sung phần được chọn."],
              ["starter", FilePlus2, "Soạn mới", "Dựng bản khởi đầu từ dữ liệu bài học (yêu cầu cần đạt, kiến thức, câu hỏi); thầy/cô sửa trước khi soạn."],
            ] as const).map(([key, Icon, title, desc]) => (
              <label key={key} className={cn("flex cursor-pointer gap-3 rounded-2xl border p-4 transition-colors", value.source === key ? "border-cyan/60 bg-cyan/5 ring-1 ring-cyan/30" : "border-line hover:border-cyan/40")}>
                <input type="radio" name="kp-source" className="sr-only" checked={value.source === key} onChange={() => set({ source: key })} />
                <Icon className="mt-0.5 size-5 shrink-0 text-cyan-fg" aria-hidden />
                <span><span className="block font-semibold text-fg">{title}</span><span className="block text-sm text-muted">{desc}</span></span>
              </label>
            ))}
          </div>
        </fieldset>
        <div className="flex justify-end"><Button disabled={!lesson} onClick={onNext}>Tiếp tục</Button></div>
      </CardContent>
    </Card>
  );
}
