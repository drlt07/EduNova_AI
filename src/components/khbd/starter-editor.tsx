"use client";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import type { HamDocFile } from "@khbd/components/tao-khbd/Buoc1TaiLen";
import type { KetQuaTaiLen } from "@khbd/components/tao-khbd/kieu";
import type { Lesson } from "@/lib/domain/types";
import { buildStarterDraft, starterDocx, starterFileName, type StarterDraft } from "@/lib/khbd/starter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Notice } from "@/components/ui/feedback";
import { Field, Input, Textarea } from "@/components/ui/form";

/** Soạn mới: GV sửa bản khởi đầu (mỗi dòng một ý), rồi đưa vào trợ lý như một file KHBD tải lên. */
export function StarterEditor({ lesson, periods, docFile, onBack, onDone }: { lesson: Lesson; periods: number; docFile: HamDocFile; onBack: () => void; onDone: (kq: KetQuaTaiLen) => void }) {
  const [d, setD] = useState<StarterDraft>(() => buildStarterDraft(lesson, periods));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (patch: Partial<StarterDraft>) => setD((cur) => ({ ...cur, ...patch }));

  async function useDraft() {
    setBusy(true);
    setError(null);
    try {
      const bytes = await starterDocx(d);
      onDone(await docFile(new File([bytes.slice()], starterFileName(d)), null, () => {}));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không tạo được bản khởi đầu.");
    } finally {
      setBusy(false);
    }
  }

  const area = (id: keyof StarterDraft, label: string, rows = 3, hint?: string) => (
    <Field label={label} htmlFor={`st-${id}`} hint={hint}>
      <Textarea id={`st-${id}`} rows={rows} value={d[id] as string} onChange={(e) => set({ [id]: e.target.value } as Partial<StarterDraft>)} />
    </Field>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle as="h2">Bản khởi đầu cho bài “{lesson.title}”</CardTitle>
        <CardDescription>Dựng từ dữ liệu bài học. Thầy/cô sửa, thêm hoặc xóa dòng (mỗi dòng một ý); trợ lý coi đây là KHBD gốc và giữ nguyên chữ của thầy/cô.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Field label="Tên bài" htmlFor="st-title"><Input id="st-title" value={d.title} onChange={(e) => set({ title: e.target.value })} /></Field>
        <div className="grid gap-4 md:grid-cols-2">
          {area("knowledge", "I.1 Kiến thức", 4)}
          {area("competencies", "I.2 Năng lực", 4)}
          {area("qualities", "I.3 Phẩm chất", 2)}
          {area("equipment", "II. Thiết bị dạy học và học liệu", 2)}
        </div>
        <div className="space-y-3">
          <p className="text-sm font-semibold text-fg">III. Tiến trình dạy học</p>
          {d.activities.map((a, i) => (
            <div key={i} className="rounded-xl border border-line p-3">
              <Input aria-label={`Tên hoạt động ${i + 1}`} value={a.title} onChange={(e) => set({ activities: d.activities.map((x, k) => (k === i ? { ...x, title: e.target.value } : x)) })} className="font-medium" />
              <Textarea aria-label={`Nội dung ${a.title}`} rows={4} className="mt-2" value={a.body} onChange={(e) => set({ activities: d.activities.map((x, k) => (k === i ? { ...x, body: e.target.value } : x)) })} />
            </div>
          ))}
        </div>
        {error && <Notice tone="danger">{error}</Notice>}
        <div className="flex flex-wrap justify-between gap-2">
          <Button variant="secondary" onClick={onBack}>Quay lại</Button>
          <Button disabled={busy || !d.title.trim()} onClick={useDraft}>{busy ? <><Loader2 className="size-4 animate-spin" /> Đang chuẩn bị…</> : "Dùng bản khởi đầu này"}</Button>
        </div>
      </CardContent>
    </Card>
  );
}
