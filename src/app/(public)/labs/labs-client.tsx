"use client";
import { useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Search, SearchX } from "lucide-react";
import { LAB_TEMPLATES } from "@/lib/data/labs";
import { useQueryState } from "@/lib/use-query-state";
import { matchesQuery } from "@/lib/utils";
import { LabCard, STATUS_LABEL } from "@/components/labs/lab-card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/feedback";
import { Input, Label, Select } from "@/components/ui/form";
import { cn } from "@/lib/utils";

const ALL_TAGS = [...new Set(LAB_TEMPLATES.flatMap((l) => l.tags))].sort();

export function LabsClient({ hrefBase = "/labs" }: { hrefBase?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [q, setQ] = useQueryState("q");
  const [grade, setGrade] = useQueryState("grade");
  const [status, setStatus] = useQueryState("status");
  const [tag, setTag] = useQueryState("tag");
  const list = useMemo(
    () =>
      LAB_TEMPLATES.filter(
        (l) =>
          (!grade || l.grades.includes(Number(grade) as 10 | 11 | 12)) &&
          (!status || l.status === status) &&
          (!tag || l.tags.includes(tag)) &&
          matchesQuery(q, l.title, l.tagline, l.description, l.tags.join(" ")),
      ),
    [q, grade, status, tag],
  );
  return (
    <div>
      <div className="grid gap-3 rounded-2xl border border-line bg-surface p-4 sm:grid-cols-2 lg:grid-cols-[1fr_160px_200px_auto]">
        <div>
          <Label htmlFor="lab-q" className="sr-only">Tìm phòng thí nghiệm</Label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
            <Input id="lab-q" type="search" placeholder="Tìm theo tên hoặc chủ đề…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
          </div>
        </div>
        <div>
          <Label htmlFor="lab-grade" className="sr-only">Lớp</Label>
          <Select id="lab-grade" value={grade} onChange={(e) => setGrade(e.target.value)}>
            <option value="">Mọi lớp</option>
            {[10, 11, 12].map((g) => <option key={g} value={g}>Tin {g}</option>)}
          </Select>
        </div>
        <div>
          <Label htmlFor="lab-status" className="sr-only">Trạng thái</Label>
          <Select id="lab-status" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Mọi trạng thái</option>
            {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Select>
        </div>
        <Button variant="ghost" onClick={() => router.replace(pathname, { scroll: false })} disabled={!q && !grade && !status && !tag}>
          Xóa lọc
        </Button>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5" role="group" aria-label="Lọc theo tag">
        {ALL_TAGS.map((t) => (
          <button key={t} type="button" aria-pressed={tag === t} onClick={() => setTag(tag === t ? "" : t)} className={cn("rounded-full border px-2.5 py-1 text-xs font-medium transition-colors", tag === t ? "border-cyan bg-cyan/15 text-cyan-fg" : "border-line text-muted hover:text-fg")}>
            #{t}
          </button>
        ))}
      </div>
      <p className="mt-5 text-sm text-muted" aria-live="polite">{list.length} phòng thí nghiệm</p>
      {list.length === 0 ? (
        <EmptyState className="mt-4" icon={SearchX} title="Không có phòng thí nghiệm phù hợp" description="Thử bỏ bớt bộ lọc." />
      ) : (
        <div className="mt-4 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((lab) => <LabCard key={lab.id} lab={lab} href={`${hrefBase}/${lab.slug}`} />)}
        </div>
      )}
    </div>
  );
}
