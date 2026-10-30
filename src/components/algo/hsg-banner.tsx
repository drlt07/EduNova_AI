import Link from "next/link";
import { Trophy } from "lucide-react";
import { AlgoThumb } from "@/components/algo/hsg-catalog";
import { ALGO_IDS, HSG_TOPICS } from "@/lib/data/hsg";
import { cn } from "@/lib/utils";

/** Lối vào Chuyên đề HSG (trang /thuat-toan, mở công khai): nằm trong Mô phỏng đời sống của mọi vai trò. */
export function HsgBanner({ className }: { className?: string }) {
  return (
    <Link href="/thuat-toan" className={cn("group flex flex-wrap items-center gap-4 rounded-2xl border border-warning/40 bg-gradient-to-r from-warning/20 via-warning/5 to-transparent p-4 transition-all hover:-translate-y-0.5 sm:p-5", className)}>
      <span className="hidden gap-2 sm:flex" aria-hidden>{(["bubble", "bfs", "dijkstra"] as const).map((id) => <AlgoThumb key={id} id={id} className="h-10 w-16 rounded-lg bg-surface" />)}</span>
      <span className="min-w-0 flex-1 basis-60">
        <span className="flex items-center gap-2 text-lg font-bold text-fg"><Trophy className="size-5 text-warning-fg" aria-hidden /> Chuyên đề HSG: mô phỏng thuật toán</span>
        <span className="block text-sm text-muted">{ALGO_IDS.length} thuật toán trong {HSG_TOPICS.length} chuyên đề: sắp xếp, tìm kiếm, loang BFS/DFS, Dijkstra, quy hoạch động, sàng nguyên tố. Chạy từng bước và đoán bước tiếp theo.</span>
      </span>
      <span className="rounded-xl bg-fg px-3 py-2 text-sm font-semibold text-bg group-hover:opacity-90">Mở chuyên đề</span>
    </Link>
  );
}
