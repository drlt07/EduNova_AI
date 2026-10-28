"use client";
import { useState } from "react";
import { ChevronDown, Play } from "lucide-react";
import type { LabTemplate } from "@/lib/domain/types";
import { fmtScore, labSummary, SCORED_LABS } from "@/lib/sim/lab-score";
import { useApp } from "@/lib/store/app-store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LabArt } from "@/components/labs/lab-art";
import { LabPreview } from "@/components/labs/lab-preview";

/**
 * Mục Mô phỏng của bài học: mỗi mô phỏng một dòng, mở ra để làm ngay trong bài.
 * Mô phỏng có nhiệm vụ được chấm điểm; em thấy điểm cao nhất của mình ngay trên dòng đó.
 */
export function LessonSims({ labs, studentId, task }: { labs: LabTemplate[]; studentId?: string; task?: string }) {
  const results = useApp((s) => s.labResults);
  const [open, setOpen] = useState<string | null>(labs.length === 1 ? labs[0].slug : null);
  return (
    <div className="space-y-3">
      {task && <p className="rounded-xl bg-success/10 p-3 text-sm text-fg">Nhiệm vụ: {task}</p>}
      {labs.map((lab) => {
        const scored = SCORED_LABS.has(lab.slug);
        const mine = studentId ? labSummary(results, [studentId], lab.slug).rows[0] : undefined;
        const isOpen = open === lab.slug;
        return (
          <div key={lab.slug} className="overflow-hidden rounded-2xl border border-line">
            <button type="button" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : lab.slug)} className="flex w-full items-center gap-3 p-3 text-left hover:bg-surface-2/50">
              <LabArt slug={lab.slug} className="h-14 w-24 shrink-0 rounded-lg" />
              <span className="min-w-0 flex-1">
                <span className="block font-semibold text-fg">{lab.title}</span>
                <span className="block text-sm text-muted">{lab.tagline}</span>
                <span className="mt-0.5 block text-xs">
                  {scored ? (mine ? <span className="font-semibold text-success-fg">Điểm của em: {fmtScore(mine.best.score)}/10{mine.attempts > 1 ? ` · ${mine.attempts} lượt` : ""}</span> : <span className="text-warning-fg">Có chấm điểm · em chưa làm</span>) : <span className="text-muted">Khám phá tự do, không chấm điểm</span>}
                </span>
              </span>
              {isOpen ? <ChevronDown className="size-5 shrink-0 rotate-180 text-muted" aria-hidden /> : <span className={cn("hidden shrink-0 sm:block")}><Button asChild size="sm" variant={mine ? "secondary" : "primary"}><span><Play /> {mine ? "Làm lại" : "Bắt đầu"}</span></Button></span>}
            </button>
            {isOpen && <div className="border-t border-line p-3"><LabPreview slug={lab.slug} /></div>}
          </div>
        );
      })}
    </div>
  );
}
