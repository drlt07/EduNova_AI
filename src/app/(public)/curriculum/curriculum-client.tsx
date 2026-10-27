"use client";
import Link from "next/link";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { ChevronRight, ShieldAlert } from "lucide-react";
import { LESSONS, OBJECTIVES, PATHWAY_LABEL, TEXTBOOKS, TOPICS } from "@/lib/data/curriculum";
import { LAB_TEMPLATES } from "@/lib/data/labs";
import type { Grade, TextbookId } from "@/lib/domain/types";
import { Badge } from "@/components/ui/badge";
import { Label, Select } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function CurriculumClient() {
  const [book, setBook] = useState<TextbookId>("kntt");
  // ?grade=10|11|12 từ trang chủ mở sẵn đúng khối lớp
  const qGrade = useSearchParams().get("grade");
  const initialGrade = qGrade === "11" || qGrade === "12" ? qGrade : "10";
  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end gap-4">
        <div className="w-64">
          <Label htmlFor="cur-book">Bộ sách</Label>
          <Select id="cur-book" className="mt-1.5" value={book} onChange={(e) => setBook(e.target.value as TextbookId)}>
            {TEXTBOOKS.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </Select>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-warning/30 bg-warning/5 px-3 py-2 text-sm text-fg">
          <ShieldAlert className="size-4 text-warning-fg" aria-hidden />
          Nội dung minh họa, cần đối chiếu với sách giáo khoa.
        </div>
      </div>
      <Tabs defaultValue={initialGrade} key={initialGrade}>
        <TabsList aria-label="Chọn lớp">
          {[10, 11, 12].map((g) => <TabsTrigger key={g} value={String(g)}>Tin học {g}</TabsTrigger>)}
        </TabsList>
        {([10, 11, 12] as Grade[]).map((g) => (
          <TabsContent key={g} value={String(g)}>
            <div className="space-y-3">
              {TOPICS.map((t) => {
                const lessons = LESSONS.filter((l) => l.grade === g && l.textbookId === book && l.topicId === t.id);
                if (!lessons.length) return null;
                return (
                  <details key={t.id} open className="group rounded-2xl border border-line bg-surface">
                    <summary className="flex cursor-pointer list-none items-center gap-3 p-5">
                      <ChevronRight className="size-4 text-muted transition-transform group-open:rotate-90" aria-hidden />
                      <span className="grid size-8 place-items-center rounded-lg bg-cyan/10 font-mono font-bold text-cyan-fg">{t.code}</span>
                      <span className="font-semibold text-fg">{t.name}</span>
                      <Badge className="ml-auto">{lessons.length} bài</Badge>
                    </summary>
                    <ul className="space-y-3 px-5 pb-5">
                      {lessons.map((l) => {
                        const labs = LAB_TEMPLATES.filter((lab) => lab.textbookMapping.some((m) => m.lessonIds.includes(l.id)));
                        return (
                          <li key={l.id} className="rounded-xl border border-line bg-surface-2/50 p-4">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-mono text-xs text-muted">Bài {l.order}</span>
                              <span className="font-medium text-fg">{l.title}</span>
                              <Badge tone={l.pathway === "chung" ? "neutral" : "violet"}>{PATHWAY_LABEL[l.pathway]}</Badge>
                            </div>
                            <p className="mt-1 text-sm text-muted">{l.summary}</p>
                            <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-muted">Yêu cầu cần đạt</p>
                            <ul className="mt-1 space-y-1">
                              {l.objectiveIds.map((id) => {
                                const o = OBJECTIVES.find((x) => x.id === id)!;
                                return (
                                  <li key={id} className="text-sm text-fg">
                                    <span className="mr-2 font-mono text-xs text-cyan-fg">{id}</span>
                                    {o.description} <span className="text-xs text-muted">({o.level})</span>
                                  </li>
                                );
                              })}
                            </ul>
                            {labs.length > 0 && (
                              <p className="mt-3 text-sm text-muted">
                                Thí nghiệm:{" "}
                                {labs.map((lab, i) => (
                                  <span key={lab.id}>
                                    {i > 0 && ", "}
                                    <Link className="font-medium text-cyan-fg hover:underline" href={`/labs/${lab.slug}`}>{lab.title}</Link>
                                  </span>
                                ))}
                              </p>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </details>
                );
              })}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
