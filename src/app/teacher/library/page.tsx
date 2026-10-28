"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BookPlus, Copy, Eye, FlaskConical, Library, NotebookPen, Sparkles } from "lucide-react";
import { toast } from "sonner";
import type { Grade, Visibility } from "@/lib/domain/types";
import { getLab } from "@/lib/data/labs";
import { getLesson } from "@/lib/data/curriculum";
import { MODE_LABEL } from "@/lib/labels";
import { bookEntry } from "@/lib/sgk/book";
import { useSessionData } from "@/lib/store/use-role";
import { cn, formatDate, matchesQuery } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/feedback";
import { Input, Select } from "@/components/ui/form";

const VIS: Record<Visibility, { label: string; help: string }> = {
  private: { label: "Riêng tư", help: "chỉ mình tôi thấy" },
  class: { label: "Lớp", help: "học sinh các lớp được giao thấy" },
  school: { label: "Trường", help: "giáo viên cùng trường thấy và sao chép được" },
  public: { label: "Công khai", help: "mọi giáo viên dùng EduNova thấy và sao chép được" },
};
type Kind = "lessonPlans" | "labConfigs" | "resources";
type Scope = "mine" | "school" | "public";
const KIND_LABEL: Record<Kind, string> = { lessonPlans: "Kế hoạch bài dạy", labConfigs: "Thiết lập mô phỏng", resources: "Học liệu" };
const KIND_ICON = { lessonPlans: NotebookPen, labConfigs: FlaskConical, resources: Sparkles };
const SCOPES: { id: Scope; label: string; help: string }[] = [
  { id: "mine", label: "Của tôi", help: "Tài nguyên thầy cô tạo; đổi quyền chia sẻ ngay trên từng mục." },
  { id: "school", label: "Của trường", help: "Đồng nghiệp cùng trường chia sẻ ở mức Trường." },
  { id: "public", label: "Chia sẻ chung", help: "Giáo viên khác chia sẻ công khai. Tạo bản sao để tùy chỉnh, bản gốc không bị ảnh hưởng." },
];

interface Item { kind: Kind; id: string; ownerId: string; title: string; sub: string; grade?: Grade; visibility: Visibility; date: string; minutes?: number }

/**
 * Thư viện học liệu: phân biệt của tôi / của trường / chia sẻ chung, lọc theo khối và loại, xem trước,
 * tạo bản sao để tùy chỉnh, thêm vào bài SGK đang dạy.
 */
export default function LibraryPage() {
  const { d, user } = useSessionData();
  const router = useRouter();
  const [scope, setScope] = useState<Scope>("mine");
  const [kind, setKind] = useState("");
  const [grade, setGrade] = useState("");
  const [q, setQ] = useState("");
  const [preview, setPreview] = useState<Item | null>(null);
  const current = d.bookProgress.filter((p) => p.userId === user.id).sort((a, b) => b.at.localeCompare(a.at))[0];
  const currentLesson = current && bookEntry(current.ref);

  const items = useMemo(() => {
    const all: Item[] = [
      ...d.lessonPlans.map((x) => ({ kind: "lessonPlans" as const, id: x.id, ownerId: x.ownerId, title: x.title, sub: getLesson(x.lessonId)?.title ?? "", grade: x.grade, visibility: x.visibility, date: x.updatedAt, minutes: x.durationMinutes })),
      ...d.labConfigs.map((x) => ({ kind: "labConfigs" as const, id: x.id, ownerId: x.ownerId, title: x.title, sub: `${getLab(x.labTemplateId)?.title} · ${MODE_LABEL[x.mode]} · bản ${x.version}`, grade: getLab(x.labTemplateId)?.grades[0], visibility: x.visibility, date: x.createdAt })),
      ...d.resources.filter((x) => x.reviewStatus === "approved" || x.ownerId === user.id).map((x) => ({ kind: "resources" as const, id: x.id, ownerId: x.ownerId, title: x.title, sub: `${getLesson(x.lessonId)?.title ?? ""} · ${x.items.length} thẻ`, grade: getLesson(x.lessonId)?.grade, visibility: x.visibility, date: x.createdAt })),
    ];
    return all.filter((x) =>
      (scope === "mine" ? x.ownerId === user.id : x.ownerId !== user.id && x.visibility === scope) &&
      (!kind || x.kind === kind) && (!grade || String(x.grade) === grade) && matchesQuery(q, x.title, x.sub)).sort((a, b) => b.date.localeCompare(a.date));
  }, [d, user.id, scope, kind, grade, q]);

  function duplicate(x: Item) {
    if (x.kind === "lessonPlans") {
      const p = d.lessonPlans.find((y) => y.id === x.id)!;
      const newId = d.createLessonPlan({ ownerId: user.id, title: `${p.title} (bản sao)`, grade: p.grade, textbookId: p.textbookId, lessonId: p.lessonId, objectiveIds: p.objectiveIds, durationMinutes: p.durationMinutes, status: "draft", visibility: "private", activities: structuredClone(p.activities), notes: `Sao chép từ thư viện, bản gốc của ${d.users.find((u) => u.id === p.ownerId)?.name}.` });
      toast.success("Đã tạo bản sao KHBD để tùy chỉnh", { action: { label: "Mở", onClick: () => router.push(`/teacher/lesson-planner/${newId}`) } });
    } else if (x.kind === "resources") {
      const r = d.resources.find((y) => y.id === x.id)!;
      d.addResource({ ...structuredClone(r), ownerId: user.id, title: `${r.title} (bản sao)`, visibility: "private", source: "teacher" });
      toast.success("Đã tạo bản sao học liệu");
    } else {
      const c = d.labConfigs.find((y) => y.id === x.id)!;
      d.saveLabConfig({ ownerId: user.id, labTemplateId: c.labTemplateId, title: `${c.title} (bản sao)`, mode: c.mode, hintMode: c.hintMode, params: c.params, testCaseIds: c.testCaseIds, visibility: "private" });
      toast.success("Đã tạo bản sao thiết lập");
    }
  }

  /** Gắn vào bài SGK thầy cô mở gần nhất: mô phỏng vào danh sách mô phỏng của bài, học liệu/KHBD vào mục đã chọn để dạy. */
  function addToLesson(x: Item) {
    if (!currentLesson) return toast.error("Mở một bài trong Khóa học trước, rồi quay lại thêm học liệu.");
    if (x.kind === "labConfigs") {
      const slug = getLab(d.labConfigs.find((y) => y.id === x.id)!.labTemplateId)?.slug;
      if (slug && !d.lessonLabs.some((l) => l.ownerId === user.id && l.sgkRef === currentLesson.ref && l.slug === slug)) d.toggleLessonLab(user.id, currentLesson.ref, slug);
    } else {
      const key = `${currentLesson.ref}#${x.kind === "resources" ? "res" : "khbd"}:${x.id}`;
      if (!d.bookPicks.some((p) => p.userId === user.id && p.key === key)) d.toggleBookPick(user.id, key);
    }
    toast.success(`Đã thêm vào Bài ${currentLesson.lesson.no}. ${currentLesson.lesson.title}`, { action: { label: "Mở bài", onClick: () => router.push(`/teacher/sgk/${currentLesson.ref}`) } });
  }

  return (
    <>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-fg">Thư viện học liệu</h1>
          <p className="mt-1 text-muted">Tìm và dùng lại KHBD, thiết lập mô phỏng, học liệu của mình và đồng nghiệp.</p>
        </div>
        {currentLesson && <p className="rounded-xl bg-surface-2/60 px-3 py-2 text-sm text-muted">Bài đang dạy: <b className="text-fg">Bài {currentLesson.lesson.no}. {currentLesson.lesson.title}</b></p>}
      </div>
      <div className="mb-2 flex w-fit gap-1 overflow-x-auto rounded-xl border border-line bg-surface p-1" role="tablist" aria-label="Phạm vi">
        {SCOPES.map((s) => <button key={s.id} type="button" role="tab" aria-selected={scope === s.id} onClick={() => setScope(s.id)} className={cn("shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium", scope === s.id ? "bg-fg text-bg" : "text-muted hover:text-fg")}>{s.label}</button>)}
      </div>
      <p className="mb-4 text-xs text-muted">{SCOPES.find((s) => s.id === scope)!.help}</p>
      <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_200px_140px]">
        <Input type="search" aria-label="Tìm trong thư viện" placeholder="Tìm theo tên, bài học…" value={q} onChange={(e) => setQ(e.target.value)} />
        <Select aria-label="Loại tài nguyên" value={kind} onChange={(e) => setKind(e.target.value)}><option value="">Mọi loại</option>{Object.entries(KIND_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</Select>
        <Select aria-label="Khối" value={grade} onChange={(e) => setGrade(e.target.value)}><option value="">Mọi khối</option>{[10, 11, 12].map((g) => <option key={g} value={g}>Tin {g}</option>)}</Select>
      </div>
      {items.length === 0 ? <EmptyState icon={Library} title="Không có mục nào" description={scope === "mine" ? "Thử đổi bộ lọc, hoặc tạo KHBD trong Trợ lý KHBD." : "Chưa có đồng nghiệp chia sẻ mục phù hợp bộ lọc."} /> : (
        <ul className="divide-y divide-line rounded-2xl border border-line bg-surface">
          {items.map((x) => {
            const Icon = KIND_ICON[x.kind];
            const owner = d.users.find((u) => u.id === x.ownerId);
            return (
              <li key={`${x.kind}-${x.id}`} className="flex flex-wrap items-center gap-3 p-4">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-surface-2 text-muted"><Icon className="size-5" aria-hidden /></span>
                <div className="min-w-0 flex-1 basis-60">
                  <p className="font-semibold text-fg">{x.title}</p>
                  <p className="text-xs text-muted">{KIND_LABEL[x.kind]}{x.grade ? ` · Tin ${x.grade}` : ""}{x.sub ? ` · ${x.sub}` : ""}{x.minutes ? ` · ${x.minutes} phút` : ""}</p>
                  <p className="text-xs text-muted">{owner?.name ?? "Không rõ"} · cập nhật {formatDate(x.date)}</p>
                </div>
                {scope === "mine" ? (
                  <label className="flex items-center gap-2 text-xs text-muted" title={VIS[x.visibility].help}>
                    <span className="sr-only">Quyền chia sẻ cho {x.title}</span>
                    <Select className="h-8 w-28 text-xs" value={x.visibility} onChange={(e) => { const v = e.target.value as Visibility; d.setVisibility(x.kind, x.id, v); toast.success(`${VIS[v].label}: ${VIS[v].help}`); }}>
                      {Object.entries(VIS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </Select>
                  </label>
                ) : <Badge tone={x.visibility === "public" ? "success" : "blue"}>{VIS[x.visibility].label}</Badge>}
                <div className="flex flex-wrap gap-1">
                  <Button size="sm" variant="ghost" onClick={() => setPreview(x)}><Eye /> Xem</Button>
                  <Button size="sm" variant="ghost" onClick={() => addToLesson(x)} title={currentLesson ? `Thêm vào Bài ${currentLesson.lesson.no}` : "Mở một bài trong Khóa học trước"}><BookPlus /> Thêm vào bài</Button>
                  {scope === "mine" && x.kind === "lessonPlans" ? <Button asChild size="sm" variant="secondary"><Link href={`/teacher/lesson-planner/${x.id}`}>Mở</Link></Button> : scope !== "mine" && <Button size="sm" variant="secondary" onClick={() => duplicate(x)}><Copy /> Tạo bản sao</Button>}
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <p className="mt-3 text-xs text-muted">Quyền chia sẻ: {Object.values(VIS).map((v) => `${v.label}: ${v.help}`).join(" · ")}.</p>

      <Dialog open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
        {preview && (
          <DialogContent title={preview.title} description={`${KIND_LABEL[preview.kind]} · ${d.users.find((u) => u.id === preview.ownerId)?.name} · ${VIS[preview.visibility].label}`} className="max-w-2xl">
            {preview.kind === "lessonPlans" && (() => { const p = d.lessonPlans.find((y) => y.id === preview.id)!; return (
              <div className="space-y-2 text-sm">
                <p className="text-muted">{getLesson(p.lessonId)?.title} · {p.durationMinutes} phút · {p.activities.length} hoạt động · phiên bản {p.currentVersion}</p>
                <ol className="space-y-2">{p.activities.map((a, i) => <li key={a.id} className="rounded-lg border border-line p-2"><p className="font-medium text-fg">{i + 1}. {a.title} </p><p className="text-xs text-muted">{a.content}</p><p className="text-xs text-muted">Sản phẩm: {a.product}</p></li>)}</ol>
                {p.activities.length === 0 && <p className="text-muted">KHBD chưa có hoạt động.</p>}
              </div>
            ); })()}
            {preview.kind === "resources" && (() => { const r = d.resources.find((y) => y.id === preview.id)!; return <ul className="grid gap-2 sm:grid-cols-2">{r.items.map((it, i) => <li key={i} className="rounded-lg border border-line p-2 text-sm"><p className="font-medium text-fg">{it.front}</p><p className="text-muted">{it.back}</p></li>)}</ul>; })()}
            {preview.kind === "labConfigs" && (() => { const c = d.labConfigs.find((y) => y.id === preview.id)!; return <div className="space-y-1 text-sm"><p className="text-fg">{getLab(c.labTemplateId)?.title} · {MODE_LABEL[c.mode]}</p><p className="text-muted">Thông số: {Object.entries(c.params).map(([k, v]) => `${k} = ${v}`).join(", ")}</p><p className="text-muted">{c.testCaseIds.length} ca kiểm thử</p></div>; })()}
          </DialogContent>
        )}
      </Dialog>
    </>
  );
}
