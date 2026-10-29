"use client";
import type { LabTemplate } from "@/lib/domain/types";
import { fmtScore } from "@/lib/sim/lab-score";
import { useApp } from "@/lib/store/app-store";
import { useCurrentUser } from "@/lib/store/hooks";
import { type LabProgress } from "@/components/labs/lab-card";
import { SimLibrary } from "@/components/labs/sim-library";

/** Thư viện tình huống mô phỏng: chọn khối lớp, rồi xem mô phỏng theo từng bài. */
export function LabsClient({ hrefBase = "/labs" }: { hrefBase?: string }) {
  const user = useCurrentUser();
  const results = useApp((s) => s.labResults);
  const student = user?.role === "student" ? user.id : undefined;
  const progress = (l: LabTemplate): LabProgress => {
    if (!student) return undefined;
    const mine = results.filter((r) => r.studentId === student && r.labSlug === l.slug);
    return mine.length ? { label: `Hoàn thành · ${fmtScore(Math.max(...mine.map((r) => r.score)))}`, done: true } : { label: "Chưa học", done: false };
  };
  return <SimLibrary hrefFor={(l) => `${hrefBase}/${l.slug}`} progressOf={student ? progress : undefined} />;
}
