"use client";
import { useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Search, SearchX } from "lucide-react";
import { LAB_TEMPLATES } from "@/lib/data/labs";
import { LAB_LEVELS, LAB_TOPICS, labMeta, topicLabel } from "@/lib/data/lab-catalog";
import { fmtScore } from "@/lib/sim/lab-score";
import { useApp } from "@/lib/store/app-store";
import { useCurrentUser } from "@/lib/store/hooks";
import { useQueryState } from "@/lib/use-query-state";
import { cn, matchesQuery } from "@/lib/utils";
import { LabCard, type LabProgress } from "@/components/labs/lab-card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/feedback";
import { Input, Label, Select } from "@/components/ui/form";

/** Thư viện tình huống mô phỏng: tìm, lọc theo lớp – mức độ – chủ đề – trạng thái, thẻ có ảnh. */
export function LabsClient({ hrefBase = "/labs" }: { hrefBase?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useCurrentUser();
  const results = useApp((s) => s.labResults);
  const [q, setQ] = useQueryState("q");
  const [grade, setGrade] = useQueryState("grade");
  const [level, setLevel] = useQueryState("muc-do");
  const [topic, setTopic] = useQueryState("chu-de");
  const [status, setStatus] = useQueryState("status");
  const student = user?.role === "student" ? user.id : undefined;

  const progress = (slug: string): LabProgress => {
    if (!student) return undefined;
    const mine = results.filter((r) => r.studentId === student && r.labSlug === slug);
    if (!mine.length) return { label: "Chưa học", done: false };
    return { label: `Hoàn thành · ${fmtScore(Math.max(...mine.map((r) => r.score)))}`, done: true };
  };

  const list = useMemo(
    () =>
      LAB_TEMPLATES.filter((l) => {
        const m = labMeta(l.slug);
        const done = !!student && results.some((r) => r.studentId === student && r.labSlug === l.slug);
        const okStatus = !status || (student ? (status === "done" ? done : !done) : l.status === status);
        return (!grade || l.grades.includes(Number(grade) as 10 | 11 | 12)) && (!level || m.level === level) && (!topic || m.topic === topic) && okStatus && matchesQuery(q, l.title, l.tagline, l.description, l.tags.join(" "), topicLabel(m.topic));
      }),
    [q, grade, level, topic, status, student, results],
  );
  const filtered = !!(q || grade || level || topic || status);

  return (
    <div>
      <div className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)]">
          <div className="relative">
            <Label htmlFor="lab-q" className="sr-only">Tìm mô phỏng</Label>
            <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted" aria-hidden />
            <Input id="lab-q" type="search" placeholder="Tìm mô phỏng (ví dụ: nhị phân, gói tin, SQL, lừa đảo)…" value={q} onChange={(e) => setQ(e.target.value)} className="h-12 rounded-xl pl-11" />
          </div>
          <div>
            <Label htmlFor="lab-grade" className="sr-only">Khối lớp</Label>
            <Select id="lab-grade" className="h-12 rounded-xl" value={grade} onChange={(e) => setGrade(e.target.value)}>
              <option value="">Tất cả khối lớp (10, 11, 12)</option>
              {[10, 11, 12].map((g) => <option key={g} value={g}>Lớp {g}</option>)}
            </Select>
          </div>
          <div>
            <Label htmlFor="lab-level" className="sr-only">Mức độ</Label>
            <Select id="lab-level" className="h-12 rounded-xl" value={level} onChange={(e) => setLevel(e.target.value)}>
              <option value="">Tất cả mức độ</option>
              {Object.entries(LAB_LEVELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </Select>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-4" role="group" aria-label="Lọc theo chủ đề">
          <span className="mr-1 text-sm font-medium text-muted">Chủ đề:</span>
          {[{ id: "", label: "Tất cả" }, ...LAB_TOPICS].map((t) => (
            <button key={t.id} type="button" aria-pressed={topic === t.id} onClick={() => setTopic(t.id)} className={cn("rounded-xl px-3 py-1.5 text-sm font-medium transition-colors", topic === t.id ? "bg-brand text-brand-ink shadow-sm shadow-brand/30" : "bg-surface-2 text-fg/80 hover:bg-line")}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Label htmlFor="lab-status" className="text-sm font-medium text-muted">Trạng thái:</Label>
          <Select id="lab-status" className="h-9 w-44 rounded-xl" value={status} onChange={(e) => setStatus(e.target.value)}>
            {student ? (
              <><option value="">Tất cả bài</option><option value="todo">Chưa học</option><option value="done">Đã hoàn thành</option></>
            ) : (
              <><option value="">Tất cả</option><option value="available">Chơi được</option><option value="preview">Bản xem thử</option></>
            )}
          </Select>
          {filtered && <Button size="sm" variant="ghost" onClick={() => router.replace(pathname, { scroll: false })}>Xóa lọc</Button>}
        </div>
      </div>

      <p className="mt-6 text-sm text-muted" aria-live="polite">Hiển thị <b className="text-fg">{list.length}</b> mô phỏng</p>
      {list.length === 0 ? (
        <EmptyState className="mt-4" icon={SearchX} title="Không có mô phỏng phù hợp" description="Thử bỏ bớt bộ lọc." />
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((lab) => <LabCard key={lab.id} lab={lab} href={`${hrefBase}/${lab.slug}`} progress={progress(lab.slug)} />)}
        </div>
      )}
    </div>
  );
}
