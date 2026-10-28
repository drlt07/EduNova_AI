"use client";
import Link from "next/link";
import { ArrowLeft, Clock, Database, Lightbulb, Trophy } from "lucide-react";
import { ALGOS, HSG_TOPICS, isAlgoId } from "@/lib/data/hsg";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/feedback";
import { AlgoVisualizer } from "./algo-visualizer";
import { AlgoThumb } from "./hsg-catalog";

/** Trang một thuật toán HSG: giới thiệu ngắn, chuyển nhanh giữa các thuật toán cùng chuyên đề, mô phỏng từng bước. */
export function AlgoPage({ id }: { id: string }) {
  if (!isAlgoId(id)) return <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6"><EmptyState icon={Trophy} title="Không tìm thấy thuật toán" description="Thuật toán này chưa có trong chuyên đề HSG." action={<Button asChild><Link href="/thuat-toan">Xem chuyên đề HSG</Link></Button>} /></div>;
  const a = ALGOS[id];
  const topic = HSG_TOPICS.find((t) => t.id === a.topic)!;
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <Button asChild variant="ghost" size="sm"><Link href="/thuat-toan"><ArrowLeft /> Chuyên đề HSG</Link></Button>
      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
        <AlgoThumb id={id} className="hidden h-14 w-[88px] sm:block" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-violet-fg">Bồi dưỡng HSG · Chuyên đề {topic.no}. {topic.title}</p>
          <h1 className="text-2xl font-bold tracking-tight text-fg sm:text-3xl">{a.title}</h1>
          <p className="mt-1 text-sm text-muted">{a.summary}</p>
        </div>
        <dl className="flex flex-wrap gap-2 text-xs">
          <div className="rounded-xl border border-line bg-surface px-3 py-2"><dt className="flex items-center gap-1 text-muted"><Clock className="size-3" aria-hidden /> Thời gian</dt><dd className="font-mono font-semibold text-fg">{a.time}</dd></div>
          <div className="rounded-xl border border-line bg-surface px-3 py-2"><dt className="flex items-center gap-1 text-muted"><Database className="size-3" aria-hidden /> Bộ nhớ</dt><dd className="font-mono font-semibold text-fg">{a.space}</dd></div>
        </dl>
      </div>

      {topic.algos.length > 1 && (
        <nav aria-label={`Thuật toán trong chuyên đề ${topic.title}`} className="mt-5 overflow-x-auto">
          <ul className="flex w-max gap-1 rounded-2xl border border-line bg-surface p-1">
            {topic.algos.map((x) => (
              <li key={x}>
                <Link href={`/thuat-toan/${x}`} aria-current={x === id ? "page" : undefined} className={cn("block rounded-xl px-3.5 py-2 text-sm font-medium transition-colors", x === id ? "bg-gradient-to-r from-[#22d3ee] to-[#4f7fff] text-[#04111f] shadow-sm" : "text-muted hover:bg-surface-2 hover:text-fg")}>{ALGOS[x].title}</Link>
              </li>
            ))}
          </ul>
        </nav>
      )}

      <section className="mt-5" aria-label="Mô phỏng">
        <AlgoVisualizer key={id} id={id} />
      </section>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl border border-line bg-surface p-4">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-fg"><Lightbulb className="size-4 text-warning-fg" aria-hidden /> Ý tưởng</p>
          <p className="mt-1 text-sm text-muted">{a.idea}</p>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-4">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-fg"><Trophy className="size-4 text-violet-fg" aria-hidden /> Khi đi thi</p>
          <p className="mt-1 text-sm text-muted">{a.tip}</p>
        </div>
      </div>
    </div>
  );
}
