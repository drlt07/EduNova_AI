"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, FlaskConical, Library, NotebookPen, Sparkles } from "lucide-react";
import { toast } from "sonner";
import type { Visibility } from "@/lib/domain/types";
import { getLab } from "@/lib/data/labs";
import { getLesson } from "@/lib/data/curriculum";
import { MODE_LABEL } from "@/lib/labels";
import { useSessionData } from "@/lib/store/use-role";
import { formatDate, matchesQuery } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/feedback";
import { Input, Select } from "@/components/ui/form";
import { PageHeader } from "@/components/ui/misc";
import { FilterGroup } from "@/components/ui/tabs";

const VIS: Record<Visibility, string> = { private: "Riêng tư", class: "Lớp", school: "Trường", public: "Công khai" };
type Kind = "lessonPlans" | "labConfigs" | "resources";
const KIND_LABEL: Record<Kind, string> = { lessonPlans: "KHBD", labConfigs: "Thiết lập thí nghiệm", resources: "Học liệu" };
const KIND_ICON = { lessonPlans: NotebookPen, labConfigs: FlaskConical, resources: Sparkles };

export default function LibraryPage() {
  const { d, user } = useSessionData();
  const router = useRouter();
  const [tab, setTab] = useState<"mine" | "shared">("mine");
  const [kind, setKind] = useState("");
  const [vis, setVis] = useState("");
  const [q, setQ] = useState("");

  const items = useMemo(() => {
    const all = [
      ...d.lessonPlans.map((x) => ({ kind: "lessonPlans" as const, id: x.id, ownerId: x.ownerId, title: x.title, sub: getLesson(x.lessonId)?.title ?? "", visibility: x.visibility, date: x.updatedAt })),
      ...d.labConfigs.map((x) => ({ kind: "labConfigs" as const, id: x.id, ownerId: x.ownerId, title: x.title, sub: `${getLab(x.labTemplateId)?.title} · ${MODE_LABEL[x.mode]} · bản ${x.version}`, visibility: x.visibility, date: x.createdAt })),
      ...d.resources.filter((x) => x.reviewStatus === "approved" || x.ownerId === user.id).map((x) => ({ kind: "resources" as const, id: x.id, ownerId: x.ownerId, title: x.title, sub: getLesson(x.lessonId)?.title ?? "", visibility: x.visibility, date: x.createdAt })),
    ];
    return all.filter((x) =>
      (tab === "mine" ? x.ownerId === user.id : x.ownerId !== user.id && (x.visibility === "school" || x.visibility === "public")) &&
      (!kind || x.kind === kind) && (!vis || x.visibility === vis) && matchesQuery(q, x.title, x.sub));
  }, [d, user.id, tab, kind, vis, q]);

  function duplicate(kindKey: Kind, id: string) {
    if (kindKey === "lessonPlans") {
      const p = d.lessonPlans.find((x) => x.id === id)!;
      const newId = d.createLessonPlan({ ownerId: user.id, title: `${p.title} (bản sao)`, grade: p.grade, textbookId: p.textbookId, lessonId: p.lessonId, objectiveIds: p.objectiveIds, durationMinutes: p.durationMinutes, status: "draft", visibility: "private", activities: structuredClone(p.activities), notes: `Sao chép từ thư viện chia sẻ.` });
      toast.success("Đã sao chép KHBD", { action: { label: "Mở", onClick: () => router.push(`/teacher/lesson-planner/${newId}`) } });
    } else if (kindKey === "resources") {
      const r = d.resources.find((x) => x.id === id)!;
      d.addResource({ ...structuredClone(r), ownerId: user.id, title: `${r.title} (bản sao)`, visibility: "private", source: "teacher" });
      toast.success("Đã sao chép học liệu");
    } else {
      const c = d.labConfigs.find((x) => x.id === id)!;
      d.saveLabConfig({ ownerId: user.id, labTemplateId: c.labTemplateId, title: `${c.title} (bản sao)`, mode: c.mode, hintMode: c.hintMode, params: c.params, testCaseIds: c.testCaseIds, visibility: "private" });
      toast.success("Đã sao chép thiết lập");
    }
  }

  return (
    <>
      <PageHeader title="Thư viện chia sẻ" description="Chia sẻ KHBD, thiết lập thí nghiệm và học liệu với đồng nghiệp; sao chép tài liệu được chia sẻ về để dùng." />
      <FilterGroup label="Phạm vi thư viện" value={tab} onChange={(v) => setTab(v as "mine" | "shared")} options={[{ value: "mine", label: "Của tôi" }, { value: "shared", label: "Được chia sẻ với tôi" }]} />
      <div className="my-4 grid gap-3 sm:grid-cols-[1fr_180px_180px]">
        <Input type="search" aria-label="Tìm trong thư viện" placeholder="Tìm…" value={q} onChange={(e) => setQ(e.target.value)} />
        <Select aria-label="Loại" value={kind} onChange={(e) => setKind(e.target.value)}><option value="">Mọi loại</option>{Object.entries(KIND_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</Select>
        <Select aria-label="Quyền chia sẻ" value={vis} onChange={(e) => setVis(e.target.value)}><option value="">Mọi quyền</option>{Object.entries(VIS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</Select>
      </div>
      {items.length === 0 ? <EmptyState icon={Library} title="Không có mục nào" description={tab === "shared" ? "Chưa có đồng nghiệp chia sẻ ở mức Trường/Công khai phù hợp bộ lọc." : "Thử đổi bộ lọc."} /> : (
        <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {items.map((x) => {
            const Icon = KIND_ICON[x.kind];
            const owner = d.users.find((u) => u.id === x.ownerId);
            return (
              <li key={`${x.kind}-${x.id}`} className="flex flex-col rounded-2xl border border-line bg-surface p-4">
                <div className="flex items-center gap-2"><Icon className="size-4 text-cyan-fg" aria-hidden /><Badge>{KIND_LABEL[x.kind]}</Badge><Badge tone={x.visibility === "public" ? "success" : x.visibility === "private" ? "neutral" : "blue"}>{VIS[x.visibility]}</Badge></div>
                <p className="mt-2 font-semibold text-fg">{x.title}</p>
                <p className="text-xs text-muted">{x.sub}</p>
                <p className="mt-1 text-xs text-muted">{owner?.name} · {formatDate(x.date)}</p>
                <div className="mt-auto flex items-center gap-2 pt-3">
                  {tab === "mine" ? (
                    <>
                      <label htmlFor={`vis-${x.id}`} className="sr-only">Quyền chia sẻ cho {x.title}</label>
                      <Select id={`vis-${x.id}`} className="h-8 text-xs" value={x.visibility} onChange={(e) => { d.setVisibility(x.kind, x.id, e.target.value as Visibility); toast.success("Đã cập nhật quyền chia sẻ"); }}>
                        {Object.entries(VIS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                      </Select>
                      {x.kind === "lessonPlans" && <Button asChild size="sm" variant="ghost"><Link href={`/teacher/lesson-planner/${x.id}`}>Mở</Link></Button>}
                    </>
                  ) : (
                    <Button size="sm" variant="secondary" onClick={() => duplicate(x.kind, x.id)}><Copy /> Sao chép về của tôi</Button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
