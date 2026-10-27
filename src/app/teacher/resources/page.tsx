"use client";
import { useMemo, useState } from "react";
import { Check, Pencil, Plus, Sparkles, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { LESSONS, getLesson } from "@/lib/data/curriculum";
import type { Resource, ResourceKind } from "@/lib/domain/types";
import { RESOURCE_KIND_LABEL, generateResourceItems } from "@/lib/ai/resource-templates";
import { useSessionData } from "@/lib/store/use-role";
import { formatDate, matchesQuery } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/feedback";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { PageHeader } from "@/components/ui/misc";

const REVIEW: Record<Resource["reviewStatus"], { label: string; tone: "warning" | "success" | "danger" }> = {
  pending: { label: "Chờ duyệt", tone: "warning" },
  approved: { label: "Đã duyệt", tone: "success" },
  rejected: { label: "Đã từ chối", tone: "danger" },
};

export default function ResourcesPage() {
  const { d, user } = useSessionData();
  const [kind, setKind] = useState("");
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [gen, setGen] = useState<{ lessonId: string; kind: ResourceKind }>({ lessonId: "L-10-if-kntt", kind: "flashcards" });
  const [editing, setEditing] = useState<Resource | null>(null);
  const list = useMemo(() => d.resources.filter((r) => r.ownerId === user.id && (!kind || r.kind === kind) && (!status || r.reviewStatus === status) && matchesQuery(q, r.title)), [d.resources, user.id, kind, status, q]);

  function generate() {
    const out = generateResourceItems(gen.lessonId, gen.kind);
    if (!out.items.length) return toast.error("Bài học không có dữ liệu để sinh mẫu");
    d.addResource({ ownerId: user.id, kind: gen.kind, title: out.title, lessonId: gen.lessonId, items: out.items, source: "template-demo", reviewStatus: "pending", visibility: "private" });
    d.logAI({ agent: "activity-designer", userId: user.id, contextRef: `Lesson:${gen.lessonId}`, inputSummary: `Sinh ${RESOURCE_KIND_LABEL[gen.kind]}`, output: { count: out.items.length }, flags: [] });
    setOpen(false);
    toast.success("Đã tạo — vui lòng xem lại và duyệt");
  }

  return (
    <>
      <PageHeader
        title="Học liệu & ngân hàng câu hỏi"
        description="Ngân hàng câu hỏi, thẻ ghi nhớ, sơ đồ, phiếu học tập. Nội dung tạo tự động cần được duyệt trước khi dùng."
        actions={<Button onClick={() => setOpen(true)}><Sparkles /> Tạo tự động</Button>}
      />
      <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_200px_180px]">
        <Input type="search" aria-label="Tìm học liệu" placeholder="Tìm học liệu…" value={q} onChange={(e) => setQ(e.target.value)} />
        <Select aria-label="Loại" value={kind} onChange={(e) => setKind(e.target.value)}>
          <option value="">Mọi loại</option>
          {Object.entries(RESOURCE_KIND_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </Select>
        <Select aria-label="Trạng thái duyệt" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Mọi trạng thái</option>
          {Object.entries(REVIEW).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </Select>
      </div>
      {list.length === 0 ? <EmptyState icon={Sparkles} title="Chưa có học liệu phù hợp" action={<Button size="sm" onClick={() => setOpen(true)}><Plus /> Tạo tự động</Button>} /> : (
        <ul className="grid gap-4 lg:grid-cols-2">
          {list.map((r) => (
            <li key={r.id} className="flex flex-col rounded-2xl border border-line bg-surface p-5">
              <div className="flex flex-wrap gap-1.5">
                <Badge tone="blue">{RESOURCE_KIND_LABEL[r.kind]}</Badge>
                <Badge tone={REVIEW[r.reviewStatus].tone}>{REVIEW[r.reviewStatus].label}</Badge>
                {r.source === "template-demo" && <Badge tone="violet">Tạo tự động</Badge>}
              </div>
              <p className="mt-3 font-semibold text-fg">{r.title}</p>
              <p className="text-xs text-muted">{getLesson(r.lessonId)?.title} · {formatDate(r.createdAt)}</p>
              <ul tabIndex={0} aria-label={`Nội dung ${r.title}`} className="mt-3 max-h-48 space-y-1.5 overflow-y-auto pr-1 text-sm">
                {r.items.map((it, i) => (
                  <li key={i} className="rounded-lg bg-surface-2 px-3 py-2"><span className="font-medium text-fg">{it.front}</span><span className="block text-muted">{it.back}</span></li>
                ))}
              </ul>
              <div className="mt-auto flex flex-wrap gap-2 pt-4">
                {r.reviewStatus !== "approved" && <Button size="sm" variant="secondary" onClick={() => { d.updateResource(r.id, { reviewStatus: "approved", title: r.title }); toast.success("Đã duyệt"); }}><Check /> Duyệt</Button>}
                {r.reviewStatus === "pending" && <Button size="sm" variant="ghost" onClick={() => d.updateResource(r.id, { reviewStatus: "rejected" })}><X /> Từ chối</Button>}
                <Button size="sm" variant="ghost" onClick={() => setEditing(structuredClone(r))}><Pencil /> Sửa</Button>
                <Button size="sm" variant="ghost" aria-label={`Xóa ${r.title}`} onClick={() => { d.deleteResource(r.id); toast.success("Đã xóa"); }}><Trash2 /></Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent title="Tạo học liệu tự động" description="Tạo từ khái niệm, câu hỏi và mục tiêu của bài học. Bạn cần duyệt trước khi dùng.">
          <div className="space-y-3">
            <Field label="Bài học" htmlFor="g-lesson">
              <Select id="g-lesson" value={gen.lessonId} onChange={(e) => setGen({ ...gen, lessonId: e.target.value })}>
                {LESSONS.filter((l) => l.textbookId === "kntt").map((l) => <option key={l.id} value={l.id}>Tin {l.grade} · {l.title}</option>)}
              </Select>
            </Field>
            <Field label="Loại học liệu" htmlFor="g-kind">
              <Select id="g-kind" value={gen.kind} onChange={(e) => setGen({ ...gen, kind: e.target.value as ResourceKind })}>
                {Object.entries(RESOURCE_KIND_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </Select>
            </Field>
            <Button className="w-full" onClick={generate}>Tạo</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        {editing && (
          <DialogContent title="Chỉnh sửa học liệu" className="max-w-2xl">
            <div className="space-y-3">
              <Field label="Tiêu đề" htmlFor="e-title"><Input id="e-title" value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} /></Field>
              {editing.items.map((it, i) => (
                <div key={i} className="grid gap-2 rounded-xl border border-line p-3 sm:grid-cols-[1fr_1fr_auto]">
                  <Textarea aria-label={`Mặt trước ${i + 1}`} value={it.front} onChange={(e) => setEditing({ ...editing, items: editing.items.map((x, k) => (k === i ? { ...x, front: e.target.value } : x)) })} className="min-h-[60px]" />
                  <Textarea aria-label={`Mặt sau ${i + 1}`} value={it.back} onChange={(e) => setEditing({ ...editing, items: editing.items.map((x, k) => (k === i ? { ...x, back: e.target.value } : x)) })} className="min-h-[60px]" />
                  <Button size="icon" variant="ghost" aria-label={`Xóa mục ${i + 1}`} onClick={() => setEditing({ ...editing, items: editing.items.filter((_, k) => k !== i) })}><Trash2 /></Button>
                </div>
              ))}
              <Button variant="secondary" size="sm" onClick={() => setEditing({ ...editing, items: [...editing.items, { front: "", back: "" }] })}><Plus /> Thêm mục</Button>
              <Button className="w-full" onClick={() => { if (editing.title.trim().length < 3) return toast.error("Tiêu đề quá ngắn"); d.updateResource(editing.id, { title: editing.title, items: editing.items.filter((x) => x.front.trim()), source: editing.source }); setEditing(null); toast.success("Đã lưu"); }}>Lưu thay đổi</Button>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </>
  );
}
