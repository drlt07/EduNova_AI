"use client";
import Link from "next/link";
import { Suspense, useMemo } from "react";
import { Button } from "@/components/ui/button";
import type { LabTemplate } from "@/lib/domain/types";
import { GAMES } from "@/lib/data/games";
import { fmtScore } from "@/lib/sim/lab-score";
import { useSessionData } from "@/lib/store/use-role";
import { type LabProgress } from "@/components/labs/lab-card";
import { SimLibrary } from "@/components/labs/sim-library";
import { labKey } from "@/lib/access/unlocks";
import { useAccess } from "@/lib/access/use-access";
import { PageSkeleton } from "@/components/ui/feedback";

export default function GamesPage() {
  return <Suspense fallback={<PageSkeleton />}><Games /></Suspense>;
}

function Games() {
  const { d, user } = useSessionData();
  /** Trạng thái của em theo điểm mô phỏng đã lưu. */
  const progressOf = (l: LabTemplate): LabProgress => {
    const rs = d.labResults.filter((r) => r.studentId === user.id && r.labSlug === l.slug);
    return rs.length ? { label: `Hoàn thành · ${fmtScore(Math.max(...rs.map((r) => r.score)))}`, done: true } : { label: "Chưa học", done: false };
  };
  const access = useAccess();
  const assigned = useMemo(() => (l: LabTemplate) => access.can(labKey(l.slug)), [access]);
  const hrefFor = (l: LabTemplate) => { const g = GAMES.find((x) => x.labSlug === l.slug && x.status === "available"); return g ? `/student/games/${g.slug}` : undefined; };

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-fg">Mô phỏng</h1>
          <p className="mt-1 text-sm text-muted">Mô phỏng thầy cô đã giao, xếp theo bài học. Mỗi mô phỏng cũng nằm ngay trong bài.</p>
        </div>
        <Button asChild variant="secondary"><Link href="/student/kho">Mô phỏng đời sống</Link></Button>
      </div>
      <SimLibrary hrefFor={hrefFor} progressOf={progressOf} filter={assigned} emptyText="Thầy cô chưa giao mô phỏng nào ở khối này. Muốn thử thêm, em mở Mô phỏng đời sống." />
    </>
  );
}
