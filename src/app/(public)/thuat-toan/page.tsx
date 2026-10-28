import type { Metadata } from "next";
import Link from "next/link";
import { Play, Trophy } from "lucide-react";
import { ALGO_IDS, ALGOS, HSG_TOPICS, type AlgoId } from "@/lib/data/hsg";
import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/layout/page-hero";
import { AlgoThumb, HsgCatalog } from "@/components/algo/hsg-catalog";

const HERO: AlgoId[] = ["bubble", "binary", "bfs", "merge", "dijkstra", "dfs", "quick", "knapsack", "sieve"];

export const metadata: Metadata = { title: "Chuyên đề HSG" };

export default function HsgPage() {
  return (
    <>
      <PageHero
        eyebrow="Bồi dưỡng học sinh giỏi"
        icon={Trophy}
        title="Nhìn thấy thuật toán"
        accent="chạy từng bước"
        description="Các thuật toán hay gặp trong đề thi HSG Tin học: tự nhập dữ liệu, chạy từng bước theo code Python, đoán bước tiếp theo và so sánh độ phức tạp."
        actions={<Button asChild size="lg"><Link href="/thuat-toan/bfs"><Play /> Thử loang BFS</Link></Button>}
        stats={[{ value: ALGO_IDS.length, label: "mô phỏng thuật toán" }, { value: HSG_TOPICS.length, label: "chuyên đề" }, { value: "Python", label: "code đi kèm" }, { value: "Dự đoán", label: "chế độ luyện" }]}
        visual={<div className="grid grid-cols-3 gap-3">{HERO.map((id) => <Link key={id} href={`/thuat-toan/${id}`} aria-label={ALGOS[id].title}><AlgoThumb id={id} className="h-auto w-full rounded-xl bg-surface shadow-sm transition-transform hover:-translate-y-0.5" /></Link>)}</div>}
      />
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <h2 className="mb-4 text-xl font-bold text-fg">Các chuyên đề</h2>
        <HsgCatalog />
      </div>
    </>
  );
}
