"use client";
import { MiniSimPreview } from "@/components/landing/hero-visuals";
import { PageHero } from "@/components/layout/page-hero";
import Link from "next/link";
import { Suspense, useMemo } from "react";
import { Gamepad2, Trophy } from "lucide-react";
import type { LabTemplate } from "@/lib/domain/types";
import { GAMES } from "@/lib/data/games";
import { fmtScore } from "@/lib/sim/lab-score";
import { useSessionData } from "@/lib/store/use-role";
import { type LabProgress } from "@/components/labs/lab-card";
import { SimLibrary } from "@/components/labs/sim-library";
import { labKey } from "@/lib/access/unlocks";
import { useAccess } from "@/lib/access/use-access";
import { PageSkeleton } from "@/components/ui/feedback";
import { AlgoThumb } from "@/components/algo/hsg-catalog";
import { ALGO_IDS, HSG_TOPICS } from "@/lib/data/hsg";

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
      <PageHero variant="app" eyebrow="Tình huống mô phỏng" icon={Gamepad2} title="Khám phá Tin học" accent="bằng cách thử" description="Các mô phỏng thầy cô đã giao, xếp theo bài học. Mỗi mô phỏng cũng nằm ngay trong bài của khóa học. Gặp khó, mở AI Gia sư bên cạnh mô phỏng." stats={[{ value: GAMES.filter((g) => g.status === "available").length, label: "chơi được ngay" }, { value: GAMES.length, label: "tình huống" }, { value: 3, label: "khối lớp" }, { value: "3D", label: "giao lộ thông minh" }]} visual={<MiniSimPreview href="/student/games/traffic-city" cta="Chơi ngay" />} />
      <SimLibrary hrefFor={hrefFor} progressOf={progressOf} filter={assigned} emptyText="Thầy cô chưa giao mô phỏng nào ở khối này. Muốn thử thêm, em vào Kho mô phỏng ở trang chủ." />
      <Link href="/thuat-toan" className="group mb-6 mt-12 flex flex-wrap items-center gap-4 rounded-2xl border border-warning/40 bg-gradient-to-r from-warning/20 via-warning/5 to-transparent p-4 transition-all hover:-translate-y-0.5 sm:p-5">
        <span className="hidden gap-2 sm:flex" aria-hidden>{(["bubble", "bfs", "dijkstra"] as const).map((id) => <AlgoThumb key={id} id={id} className="h-10 w-16 rounded-lg bg-surface" />)}</span>
        <span className="min-w-0 flex-1 basis-60">
          <span className="flex items-center gap-2 text-lg font-bold text-fg"><Trophy className="size-5 text-warning-fg" aria-hidden /> Chuyên đề HSG: mô phỏng thuật toán</span>
          <span className="block text-sm text-muted">{ALGO_IDS.length} thuật toán trong {HSG_TOPICS.length} chuyên đề: sắp xếp, tìm kiếm, loang BFS/DFS, Dijkstra, quy hoạch động, sàng nguyên tố. Chạy từng bước và đoán bước tiếp theo.</span>
        </span>
        <span className="rounded-xl bg-fg px-3 py-2 text-sm font-semibold text-bg group-hover:opacity-90">Mở chuyên đề</span>
      </Link>
    </>
  );
}
