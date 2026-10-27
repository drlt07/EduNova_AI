"use client";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Search, SearchX } from "lucide-react";
import { LESSONS, TEXTBOOKS, TOPICS } from "@/lib/data/curriculum";
import { useQueryState } from "@/lib/use-query-state";
import { matchesQuery } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/feedback";
import { Input, Label, Select } from "@/components/ui/form";
import { LessonCard } from "@/components/lessons/lesson-card";

export function ExploreClient() {
  const router = useRouter();
  const [q, setQ] = useQueryState("q");
  const [grade, setGrade] = useQueryState("grade");
  const [book, setBook] = useQueryState("book", "kntt");
  const [topic, setTopic] = useQueryState("topic");

  const results = useMemo(
    () =>
      LESSONS.filter(
        (l) =>
          (!grade || String(l.grade) === grade) &&
          l.textbookId === book &&
          (!topic || l.topicId === topic) &&
          matchesQuery(q, l.title, l.summary, l.keywords.join(" ")),
      ).sort((a, b) => a.grade - b.grade || a.order - b.order),
    [q, grade, book, topic],
  );
  const hasFilter = q || grade || topic || book !== "kntt";

  return (
    <div>
      <div className="rounded-2xl border border-line bg-surface p-4 shadow-sm sm:p-5">
        <div className="grid gap-3 md:grid-cols-[1fr_150px_200px_220px]">
          <div className="relative">
            <Label htmlFor="q" className="sr-only">Tìm bài học</Label>
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
            <Input id="q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm kiếm bài học…" className="h-11 pl-9" type="search" />
          </div>
          <div>
            <Label htmlFor="grade" className="sr-only">Lớp</Label>
            <Select id="grade" className="h-11" value={grade} onChange={(e) => setGrade(e.target.value)}>
              <option value="">Tất cả lớp</option>
              {[10, 11, 12].map((g) => <option key={g} value={g}>Lớp {g}</option>)}
            </Select>
          </div>
          <div>
            <Label htmlFor="book" className="sr-only">Bộ sách</Label>
            <Select id="book" className="h-11" value={book} onChange={(e) => setBook(e.target.value)}>
              {TEXTBOOKS.map((t) => <option key={t.id} value={t.id}>{t.name.replace(" với cuộc sống", "")}</option>)}
            </Select>
          </div>
          <div>
            <Label htmlFor="topic" className="sr-only">Chủ đề</Label>
            <Select id="topic" className="h-11" value={topic} onChange={(e) => setTopic(e.target.value)}>
              <option value="">Tất cả chủ đề</option>
              {TOPICS.map((t) => <option key={t.id} value={t.id}>{t.code}. {t.name}</option>)}
            </Select>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between gap-2">
          <p className="text-sm text-muted" aria-live="polite">Tìm thấy {results.length} kết quả</p>
          {hasFilter && <Button variant="ghost" size="sm" onClick={() => router.replace("/explore", { scroll: false })}>Xóa bộ lọc</Button>}
        </div>
      </div>
      <div className="mt-6">
        {results.length === 0 ? (
          <EmptyState icon={SearchX} title="Không tìm thấy bài học" description="Thử bỏ bớt bộ lọc hoặc dùng từ khóa khác (không cần gõ dấu)." />
        ) : (
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((l) => <li key={l.id}><LessonCard lesson={l} href={`/bai-hoc/${l.id}`} /></li>)}
          </ul>
        )}
      </div>
    </div>
  );
}
