"use client";
import { LEVEL_LABEL } from "@/lib/ai/tutor-core";
import { useId, useRef } from "react";
import { ChevronDown, ChevronUp, GripVertical, Trash2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import type { CourseBlock, Grade } from "@/lib/domain/types";
import { BLOCK_LABEL, MAX_FILE_BYTES } from "@/lib/courses/course";
import { LAB_TEMPLATES } from "@/lib/data/labs";
import { CODING_EXERCISES } from "@/lib/data/coding-exercises";
import { PRACTICE_SETS } from "@/lib/data/practice";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/form";
import { BLOCK_ICON, formatBytes } from "./block-view";

const FILE_ACCEPT = ".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.png,.jpg,.jpeg,.gif,.webp,.svg";
const MEDIA_ACCEPT = "image/*,video/mp4,video/webm";

function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}

function FilePicker({ accept, value, onPick, onClear, label }: { accept: string; value?: CourseBlock["file"]; onPick: (f: NonNullable<CourseBlock["file"]>) => void; onClear: () => void; label: string }) {
  const ref = useRef<HTMLInputElement>(null);
  async function pick(file?: File) {
    if (!file) return;
    if (file.size > MAX_FILE_BYTES) {
      toast.error(`Tệp ${formatBytes(file.size)} vượt giới hạn ${formatBytes(MAX_FILE_BYTES)} của bản dùng thử. Hãy dùng đường dẫn hoặc nén tệp.`);
      return;
    }
    try {
      onPick({ name: file.name, type: file.type || "application/octet-stream", size: file.size, dataUrl: await readFile(file) });
      toast.success(`Đã tải lên ${file.name}`);
    } catch {
      toast.error("Không đọc được tệp");
    }
  }
  return (
    <div className="flex flex-wrap items-center gap-2">
      <input ref={ref} type="file" accept={accept} className="sr-only" aria-label={label} onChange={(e) => { void pick(e.target.files?.[0]); e.target.value = ""; }} />
      <Button type="button" size="sm" variant="secondary" onClick={() => ref.current?.click()}><Upload className="size-3.5" /> {value ? "Đổi tệp" : label}</Button>
      {value && (
        <span className="flex items-center gap-1 rounded-lg bg-surface-2 px-2 py-1 text-xs text-fg">
          {value.name} · {formatBytes(value.size)}
          <button type="button" onClick={onClear} aria-label={`Bỏ tệp ${value.name}`} className="text-muted hover:text-danger-fg"><X className="size-3.5" /></button>
        </span>
      )}
      <span className="text-xs text-muted">Tối đa {formatBytes(MAX_FILE_BYTES)} (bản dùng thử lưu trên trình duyệt)</span>
    </div>
  );
}

export interface BlockEditorProps {
  block: CourseBlock;
  grade: Grade;
  index: number;
  count: number;
  open: boolean;
  dragging: boolean;
  onToggle: () => void;
  onChange: (patch: Partial<CourseBlock>) => void;
  onMove: (to: number) => void;
  onDelete: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  onDropHere: () => void;
}

/** Thẻ chỉnh một khối nội dung: kéo thả hoặc nút lên/xuống để sắp xếp, mở ra để sửa chi tiết. */
export function BlockEditor({ block, grade, index, count, open, dragging, onToggle, onChange, onMove, onDelete, onDragStart, onDragEnd, onDropHere }: BlockEditorProps) {
  const id = useId();
  const Icon = BLOCK_ICON[block.kind];
  const labs = [...LAB_TEMPLATES].sort((a, b) => Number(!a.grades.includes(grade)) - Number(!b.grades.includes(grade)));
  const exercises = CODING_EXERCISES.filter((x) => x.grade === grade);
  const sets = PRACTICE_SETS.filter((x) => x.grade === grade);
  return (
    <li
      draggable
      onDragStart={(e) => { e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", block.id); onDragStart(); }}
      onDragEnd={onDragEnd}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => { e.preventDefault(); onDropHere(); }}
      className={cn("rounded-2xl border bg-surface transition-opacity", dragging ? "border-cyan/60 opacity-50" : "border-line")}
    >
      <div className="flex items-center gap-2 p-3">
        <GripVertical className="size-4 shrink-0 cursor-grab text-muted" aria-hidden />
        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-cyan/10 text-cyan-fg"><Icon className="size-4" aria-hidden /></span>
        <button type="button" onClick={onToggle} aria-expanded={open} aria-controls={`${id}-body`} className="min-w-0 flex-1 text-left">
          <span className="block truncate text-sm font-medium text-fg">{block.title || BLOCK_LABEL[block.kind]}</span>
          <span className="block text-xs text-muted">{BLOCK_LABEL[block.kind]} · {block.required ? "bắt buộc" : "không bắt buộc"}</span>
        </button>
        <Button size="icon" variant="ghost" disabled={index === 0} onClick={() => onMove(index - 1)} aria-label={`Đưa "${block.title}" lên`}><ChevronUp /></Button>
        <Button size="icon" variant="ghost" disabled={index === count - 1} onClick={() => onMove(index + 1)} aria-label={`Đưa "${block.title}" xuống`}><ChevronDown /></Button>
        <Button size="icon" variant="ghost" onClick={onDelete} aria-label={`Xóa "${block.title}"`}><Trash2 /></Button>
      </div>
      {open && (
        <div id={`${id}-body`} className="space-y-3 border-t border-line p-4">
          <Field label="Tiêu đề" htmlFor={`${id}-title`}>
            <Input id={`${id}-title`} value={block.title} onChange={(e) => onChange({ title: e.target.value })} />
          </Field>
          {block.kind === "simulation" && (
            <Field label="Mô phỏng" htmlFor={`${id}-lab`} hint="Mô phỏng 'Đang phát triển' hiển thị cho học sinh nhưng chưa chơi được.">
              <Select id={`${id}-lab`} value={block.labSlug ?? ""} onChange={(e) => onChange({ labSlug: e.target.value || undefined })}>
                <option value="">— Chọn mô phỏng —</option>
                {labs.map((l) => <option key={l.slug} value={l.slug}>{l.title} · Tin {l.grades.join(", ")}{l.status === "planned" ? " · đang phát triển" : ""}</option>)}
              </Select>
            </Field>
          )}
          {block.kind === "python" && (
            <Field label="Bài thực hành Python" htmlFor={`${id}-ex`} hint="Học sinh hoàn thành khi chương trình đạt tất cả trường hợp kiểm thử.">
              <Select id={`${id}-ex`} value={block.exerciseId ?? ""} onChange={(e) => onChange({ exerciseId: e.target.value || undefined })}>
                <option value="">— Chọn bài —</option>
                {exercises.map((x) => <option key={x.id} value={x.id}>{x.title} · {x.topic}</option>)}
              </Select>
            </Field>
          )}
          {block.kind === "practice" && (
            <div className="grid gap-3 sm:grid-cols-[1fr_160px]">
              <Field label="Bộ câu hỏi" htmlFor={`${id}-set`}>
                <Select id={`${id}-set`} value={block.practiceSetId ?? ""} onChange={(e) => onChange({ practiceSetId: e.target.value || undefined })}>
                  <option value="">— Chọn bộ câu hỏi —</option>
                  {sets.map((x) => <option key={x.id} value={x.id}>{x.title} · {x.questionIds.length} câu</option>)}
                </Select>
              </Field>
              <Field label="Cần đạt (%)" htmlFor={`${id}-min`}>
                <Input id={`${id}-min`} type="number" min={0} max={100} step={5} value={block.minScore ?? 0} onChange={(e) => onChange({ minScore: Math.max(0, Math.min(100, Number(e.target.value) || 0)) })} />
              </Field>
            </div>
          )}
          {block.kind === "media" && (
            <div className="space-y-2">
              <Field label="Đường dẫn video hoặc hình" htmlFor={`${id}-url`} hint="Hỗ trợ link YouTube, ảnh (.png, .jpg, .svg) hoặc video (.mp4). Hoặc tải tệp lên bên dưới.">
                <Input id={`${id}-url`} type="url" placeholder="https://www.youtube.com/watch?v=…" value={block.file ? "" : (block.mediaUrl ?? "")} disabled={Boolean(block.file)} onChange={(e) => onChange({ mediaUrl: e.target.value || undefined })} />
              </Field>
              <FilePicker accept={MEDIA_ACCEPT} label="Tải ảnh/video lên" value={block.file} onPick={(file) => onChange({ file, mediaUrl: undefined })} onClear={() => onChange({ file: undefined })} />
            </div>
          )}
          {block.kind === "file" && <FilePicker accept={FILE_ACCEPT} label="Tải tài liệu lên (Word, PDF, slide…)" value={block.file} onPick={(file) => onChange({ file, title: block.title === BLOCK_LABEL.file ? file.name : block.title })} onClear={() => onChange({ file: undefined })} />}
          <Field label={block.kind === "text" ? "Nội dung" : "Hướng dẫn cho học sinh"} htmlFor={`${id}-body`}>
            <Textarea id={`${id}-body`} rows={block.kind === "text" ? 9 : 3} value={block.body ?? ""} onChange={(e) => onChange({ body: e.target.value })} className={block.kind === "text" ? "font-mono text-[13px]" : undefined} />
          </Field>
          <Field label="Mức hỗ trợ của AI Gia sư" htmlFor={`${id}-tutor`} hint="Học tự do: giải thích chi tiết, có ví dụ. Có hướng dẫn: câu hỏi gợi mở, gợi ý tăng dần. Kiểm tra: gia sư tắt.">
            <Select id={`${id}-tutor`} value={block.tutorLevel ?? "guided"} onChange={(e) => onChange({ tutorLevel: e.target.value as CourseBlock["tutorLevel"] })}>
              {(["free", "guided", "exam"] as const).map((l) => <option key={l} value={l}>{LEVEL_LABEL[l]}</option>)}
            </Select>
          </Field>
          <Checkbox label="Bắt buộc để hoàn thành bài" checked={block.required} onChange={(e) => onChange({ required: e.target.checked })} />
        </div>
      )}
    </li>
  );
}
