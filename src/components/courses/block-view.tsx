"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { BookOpen, CheckCircle2, Circle, ClipboardCheck, Code2, Dumbbell, FileText, FlaskConical, Image as ImageIcon, Play, RotateCcw } from "lucide-react";
import type { CourseBlock, CourseBlockKind } from "@/lib/domain/types";
import { BLOCK_LABEL, SELF_MARK_KINDS, youtubeEmbed } from "@/lib/courses/course";
import { getLabBySlug } from "@/lib/data/labs";
import { getExercise } from "@/lib/data/coding-exercises";
import { getSet } from "@/lib/data/practice";
import { useSessionData } from "@/lib/store/use-role";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LabPreview } from "@/components/labs/lab-preview";
import { PythonWorkspace, type WorkspaceEvent } from "@/components/code/python-workspace";

export const BLOCK_ICON: Record<CourseBlockKind, React.ComponentType<{ className?: string }>> = {
  text: BookOpen,
  media: ImageIcon,
  simulation: FlaskConical,
  python: Code2,
  practice: Dumbbell,
  file: FileText,
};

export function formatBytes(n: number) {
  return n < 1024 ? `${n} B` : n < 1_048_576 ? `${(n / 1024).toFixed(0)} KB` : `${(n / 1_048_576).toFixed(1)} MB`;
}

/** data URL → blob URL (iframe/video xem được tệp lớn, tự thu hồi khi đổi tệp). */
function useBlobUrl(dataUrl?: string) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!dataUrl) return;
    let u: string | null = null;
    let alive = true;
    fetch(dataUrl)
      .then((r) => r.blob())
      .then((b) => {
        if (!alive) return;
        u = URL.createObjectURL(b);
        setUrl(u);
      })
      .catch(() => {});
    return () => {
      alive = false;
      if (u) URL.revokeObjectURL(u);
    };
  }, [dataUrl]);
  return dataUrl ? url : null;
}

function isImage(url: string, type?: string) {
  return type?.startsWith("image/") || url.startsWith("data:image/") || /\.(png|jpe?g|gif|webp|svg)(\?|$)/i.test(url);
}
function isVideo(url: string, type?: string) {
  return type?.startsWith("video/") || /\.(mp4|webm|ogg)(\?|$)/i.test(url);
}

function Media({ block }: { block: CourseBlock }) {
  const blob = useBlobUrl(block.file?.dataUrl);
  const url = block.file ? blob : block.mediaUrl;
  if (!url) return <p className="text-sm text-muted">Đang tải…</p>;
  const yt = !block.file && youtubeEmbed(url);
  if (yt) return <iframe src={yt} title={block.title} className="aspect-video w-full rounded-xl border border-line" allow="encrypted-media; picture-in-picture" allowFullScreen />;
  if (isVideo(url, block.file?.type)) return <video src={url} controls className="w-full rounded-xl border border-line" />;
  // eslint-disable-next-line @next/next/no-img-element -- ảnh do giáo viên tải lên (blob/data URL), next/image không tối ưu được
  if (isImage(block.file?.dataUrl ?? url, block.file?.type)) return <img src={url} alt={block.title} className="mx-auto max-h-[460px] rounded-xl border border-line bg-white object-contain" />;
  return <a href={url} target="_blank" rel="noreferrer" className="text-sm font-medium text-cyan-fg hover:underline">Mở nội dung</a>;
}

function FileBlock({ block }: { block: CourseBlock }) {
  const blob = useBlobUrl(block.file?.dataUrl);
  const f = block.file;
  if (!f) return null;
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-surface-2 px-4 py-3">
        <FileText className="size-5 text-cyan-fg" aria-hidden />
        <span className="min-w-0 flex-1 truncate text-sm font-medium text-fg">{f.name}</span>
        <span className="text-xs text-muted">{formatBytes(f.size)}</span>
        {blob && <a href={blob} download={f.name} className="text-sm font-medium text-cyan-fg hover:underline">Tải xuống</a>}
      </div>
      {blob && f.type === "application/pdf" && <iframe src={blob} title={f.name} className="h-[520px] w-full rounded-xl border border-line bg-white" />}
      {/* eslint-disable-next-line @next/next/no-img-element -- blob URL của tệp tải lên */}
      {blob && f.type.startsWith("image/") && <img src={blob} alt={f.name} className="mx-auto max-h-[460px] rounded-xl border border-line" />}
    </div>
  );
}

function SimulationBlock({ block }: { block: CourseBlock }) {
  const lab = block.labSlug ? getLabBySlug(block.labSlug) : undefined;
  const [open, setOpen] = useState(false);
  if (!lab) return <p className="text-sm text-danger-fg">Chưa chọn mô phỏng.</p>;
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-surface-2 px-4 py-3">
        <FlaskConical className="size-5 text-cyan-fg" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="font-medium text-fg">{lab.title}</p>
          <p className="text-xs text-muted">{lab.tagline}</p>
        </div>
        {lab.status === "planned" ? <Badge tone="violet">Đang phát triển</Badge> : (
          <Button size="sm" variant={open ? "secondary" : "primary"} onClick={() => setOpen((v) => !v)} aria-expanded={open}>
            {open ? "Thu gọn" : <><Play className="size-3.5" /> Mở mô phỏng</>}
          </Button>
        )}
      </div>
      {open && <LabPreview slug={lab.slug} />}
    </div>
  );
}

function PythonBlock({ block, initialCode, onTests, onSave }: { block: CourseBlock; initialCode?: string; onTests?: (passed: number, total: number, code: string, errorType?: string) => void; onSave?: (code: string) => void }) {
  const ex = block.exerciseId ? getExercise(block.exerciseId) : undefined;
  const [code, setCode] = useState(initialCode ?? ex?.starter ?? "");
  if (!ex) return <p className="text-sm text-danger-fg">Chưa chọn bài thực hành.</p>;
  function onEvent(e: WorkspaceEvent) {
    if (e.kind === "test" && e.tests) onTests?.(e.tests.filter((t) => t.pass).length, e.tests.length, code, e.tests.find((t) => t.error)?.error?.split(":")[0]);
    if (e.kind === "run" || e.kind === "save") onSave?.(code);
  }
  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-line bg-surface-2 px-4 py-3 text-sm">
        <p className="font-medium text-fg">{ex.title}</p>
        <p className="mt-1 whitespace-pre-line text-muted">{ex.task}</p>
      </div>
      <PythonWorkspace code={code} onCodeChange={setCode} exercise={ex} onEvent={onEvent} height={260} />
      <Button size="sm" variant="ghost" onClick={() => setCode(ex.starter)}><RotateCcw className="size-3.5" /> Mã ban đầu</Button>
    </div>
  );
}

function PracticeBlock({ block, best, preview }: { block: CourseBlock; best: number | null; preview: boolean }) {
  const { d } = useSessionData();
  const tq = d.teacherQuizzes.find((q) => q.id === block.practiceSetId);
  const set = block.practiceSetId ? (getSet(block.practiceSetId) ?? (tq ? { id: tq.id, title: tq.title, questionIds: tq.questions.map((q) => q.id) } : undefined)) : undefined;
  if (!set) return <p className="text-sm text-danger-fg">Chưa chọn bộ câu hỏi.</p>;
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-surface-2 px-4 py-3">
      {block.final ? <ClipboardCheck className="size-5 text-violet-fg" aria-hidden /> : <Dumbbell className="size-5 text-cyan-fg" aria-hidden />}
      <div className="min-w-0 flex-1">
        <p className="font-medium text-fg">{block.final && <span className="mr-1.5 rounded bg-violet/15 px-1.5 py-0.5 text-xs font-semibold text-violet-fg">Bài kiểm tra cuối bài</span>}{set.title} · {set.questionIds.length} câu</p>
        <p className="text-xs text-muted">Cần đạt từ {block.minScore ?? 0}%{best !== null && ` · kết quả tốt nhất của em: ${best}%`}</p>
      </div>
      {preview ? <Badge>Học sinh làm bài ở trang Luyện tập</Badge> : (
        <Button asChild size="sm"><Link href={`/student/practice/${set.id}`}>{best === null ? "Làm bài" : "Làm lại"}</Link></Button>
      )}
    </div>
  );
}

export interface BlockViewProps {
  block: CourseBlock;
  done: boolean;
  /** Bản xem trước của giáo viên: không ghi dữ liệu */
  preview?: boolean;
  bestPractice?: number | null;
  initialCode?: string;
  onMark?: (done: boolean, score?: number) => void;
  onPythonTests?: (passed: number, total: number, code: string, errorType?: string) => void;
  onPythonSave?: (code: string) => void;
}

/** Một khối nội dung trong bài giảng, kèm trạng thái hoàn thành. */
export function BlockView({ block, done, preview = false, bestPractice = null, initialCode, onMark, onPythonTests, onPythonSave }: BlockViewProps) {
  const Icon = BLOCK_ICON[block.kind];
  const selfMark = SELF_MARK_KINDS.includes(block.kind);
  return (
    <section className={cn("rounded-2xl border bg-surface p-5", done ? "border-success/40" : "border-line")} aria-labelledby={`blk-${block.id}`}>
      <header className="mb-3 flex flex-wrap items-center gap-2">
        <span className="grid size-8 place-items-center rounded-lg bg-cyan/10 text-cyan-fg"><Icon className="size-4" aria-hidden /></span>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted">{BLOCK_LABEL[block.kind]}{block.required ? " · bắt buộc" : " · không bắt buộc"}</p>
          <h3 id={`blk-${block.id}`} className="font-semibold text-fg">{block.title}</h3>
        </div>
        {done ? <Badge tone="success"><CheckCircle2 className="size-3" aria-hidden /> Đã hoàn thành</Badge> : <Badge><Circle className="size-3" aria-hidden /> Chưa hoàn thành</Badge>}
      </header>
      {block.body && block.kind !== "text" && <p className="mb-3 whitespace-pre-line text-sm text-muted">{block.body}</p>}
      {block.kind === "text" && <div className="whitespace-pre-wrap text-[15px] leading-relaxed text-fg">{block.body}</div>}
      {block.kind === "media" && <Media block={block} />}
      {block.kind === "file" && <FileBlock block={block} />}
      {block.kind === "simulation" && <SimulationBlock block={block} />}
      {block.kind === "python" && <PythonBlock block={block} initialCode={initialCode} onTests={(p, t, c, e) => { onPythonTests?.(p, t, c, e); if (p === t && t > 0) onMark?.(true, 100); }} onSave={onPythonSave} />}
      {block.kind === "practice" && <PracticeBlock block={block} best={bestPractice} preview={preview} />}
      <footer className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted">
        {selfMark ? (
          <Button size="sm" variant={done ? "ghost" : "secondary"} onClick={() => onMark?.(!done)} aria-pressed={done}>
            {done ? "Bỏ đánh dấu" : <><CheckCircle2 className="size-3.5" /> Đánh dấu đã học xong</>}
          </Button>
        ) : (
          <span>{block.kind === "python" ? "Tự hoàn thành khi chương trình đạt tất cả trường hợp kiểm thử." : `Tự hoàn thành khi đạt từ ${block.minScore ?? 0}% ở bộ luyện tập.`}</span>
        )}
      </footer>
    </section>
  );
}
