"use client";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { LESSONS, TOPICS, getTextbook } from "@/lib/data/curriculum";
import type { Grade } from "@/lib/domain/types";
import { studentGrade } from "@/lib/store/student";
import { useSessionData } from "@/lib/store/use-role";
import { matchesQuery } from "@/lib/utils";
import { EmptyState } from "@/components/ui/feedback";
import { Input, Label, Select } from "@/components/ui/form";
import { PageHeader } from "@/components/ui/misc";
import { LessonCard } from "@/components/lessons/lesson-card";

export default function LearningPage() {
  const { d, user } = useSessionData();
  const klass = d.classes.find((c) => d.enrollments.some((e) => e.studentId === user.id && e.classId === c.id));
  const book = klass?.textbookId ?? "kntt";
  const [grade, setGrade] = useState<Grade>(studentGrade(d, user.id));
  const [q, setQ] = useState("");
  const [topic, setTopic] = useState("");
  const lessons = useMemo(
    () => LESSONS.filter((l) => l.grade === grade && l.textbookId === book && (!topic || l.topicId === topic) && matchesQuery(q, l.title, l.summary, l.keywords.join(" "))).sort((a, b) => a.order - b.order),
    [grade, book, topic, q],
  );
  return (
    <>
      <PageHeader title="Bài học" description={`Bộ sách ${getTextbook(book).name}`} />
      <div className="mb-5 grid gap-3 rounded-2xl border border-line bg-surface p-4 md:grid-cols-[1fr_150px_240px]">
        <div className="relative">
          <Label htmlFor="sq" className="sr-only">Tìm bài học</Label>
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
          <Input id="sq" type="search" placeholder="Tìm kiếm bài học…" className="pl-9" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Select aria-label="Lớp" value={grade} onChange={(e) => setGrade(Number(e.target.value) as Grade)}>
          {[10, 11, 12].map((g) => <option key={g} value={g}>Lớp {g}</option>)}
        </Select>
        <Select aria-label="Chủ đề" value={topic} onChange={(e) => setTopic(e.target.value)}>
          <option value="">Tất cả chủ đề</option>
          {TOPICS.map((t) => <option key={t.id} value={t.id}>{t.code}. {t.name}</option>)}
        </Select>
      </div>
      <p className="mb-3 text-sm text-muted" aria-live="polite">Tìm thấy {lessons.length} bài học</p>
      {lessons.length === 0 ? <EmptyState title="Không có bài học phù hợp" /> : (
        <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {lessons.map((l) => <li key={l.id}><LessonCard lesson={l} href={`/student/learning/${l.id}`} /></li>)}
        </ul>
      )}
    </>
  );
}
