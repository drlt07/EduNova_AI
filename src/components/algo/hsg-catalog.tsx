import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ALGOS, HSG_TOPICS, type AlgoId, type HsgTopicId } from "@/lib/data/hsg";
import { cn } from "@/lib/utils";

const TOPIC_TONE: Record<HsgTopicId, { band: string; chip: string; fill: string }> = {
  sort: { band: "from-cyan/30 to-cyan/5", chip: "bg-cyan/15 text-cyan-fg", fill: "var(--cyan)" },
  search: { band: "from-blue/30 to-blue/5", chip: "bg-blue/15 text-blue-fg", fill: "var(--blue)" },
  graph: { band: "from-violet/30 to-violet/5", chip: "bg-violet/15 text-violet-fg", fill: "var(--violet)" },
  dp: { band: "from-success/30 to-success/5", chip: "bg-success/15 text-success-fg", fill: "var(--success)" },
  number: { band: "from-warning/30 to-warning/5", chip: "bg-warning/15 text-warning-fg", fill: "var(--warning)" },
};

/** Hình nhỏ minh hoạ dạng mô phỏng của thuật toán. */
export function AlgoThumb({ id, className }: { id: AlgoId; className?: string }) {
  const c = TOPIC_TONE[ALGOS[id].topic].fill;
  const t = ALGOS[id].topic;
  return (
    <svg viewBox="0 0 64 40" className={cn("shrink-0", className)} aria-hidden>
      <rect width="64" height="40" rx="8" fill={c} fillOpacity={0.12} />
      {t === "sort" && [14, 26, 10, 32, 20, 28].map((h, k) => <rect key={k} x={8 + k * 8.5} y={36 - h} width={6} height={h} rx={1.5} fill={c} fillOpacity={k === 1 || k === 2 ? 1 : 0.55} />)}
      {t === "search" && Array.from({ length: 6 }, (_, k) => <rect key={k} x={5 + k * 9.3} y={14} width={8} height={12} rx={2} fill={c} fillOpacity={k === (id === "binary" ? 2 : 4) ? 1 : k < 2 && id === "binary" ? 0.15 : 0.45} />)}
      {t === "graph" && (id === "dijkstra" ? (
        <g stroke={c} strokeWidth={2}><line x1={12} y1={20} x2={30} y2={9} /><line x1={30} y1={9} x2={52} y2={20} /><line x1={12} y1={20} x2={32} y2={31} /><line x1={32} y1={31} x2={52} y2={20} />{[[12, 20], [30, 9], [32, 31], [52, 20]].map(([x, y]) => <circle key={x} cx={x} cy={y} r={4.5} fill={c} />)}</g>
      ) : Array.from({ length: 24 }, (_, k) => <rect key={k} x={8 + (k % 8) * 6.2} y={7 + Math.floor(k / 8) * 9} width={5} height={8} rx={1} fill={c} fillOpacity={[0, 1, 2, 8, 9, 16].includes(k) ? 0.9 : [3, 10, 17, 18].includes(k) ? 0.45 : 0.12} />))}
      {t === "dp" && Array.from({ length: 15 }, (_, k) => <rect key={k} x={10 + (k % 5) * 9.2} y={8 + Math.floor(k / 5) * 8.5} width={8} height={7} rx={1.5} fill={c} fillOpacity={k < 7 ? 0.7 : k === 7 ? 1 : 0.15} />)}
      {t === "number" && Array.from({ length: 18 }, (_, k) => <rect key={k} x={6 + (k % 6) * 9} y={7 + Math.floor(k / 6) * 9} width={7.5} height={7.5} rx={1.5} fill={c} fillOpacity={[0, 1, 3, 5, 9, 11, 15].includes(k) ? 0.95 : 0.15} />)}
    </svg>
  );
}

/** Danh mục chuyên đề HSG theo chủ đề; mỗi thuật toán mở mô phỏng từng bước. */
export function HsgCatalog({ hrefFor = (id) => `/thuat-toan/${id}` }: { hrefFor?: (id: AlgoId) => string }) {
  return (
    <div className="gap-4 lg:columns-2 [&>*]:mb-4">
      {HSG_TOPICS.map((t) => {
        const tone = TOPIC_TONE[t.id];
        return (
          <article key={t.id} className="break-inside-avoid overflow-hidden rounded-2xl border border-line bg-surface">
            <header className={cn("bg-gradient-to-r px-5 py-4", tone.band)}>
              <div className="flex items-center gap-3">
                <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-bold", tone.chip)}>Chuyên đề {t.no}</span>
                <h4 className="min-w-0 flex-1 font-semibold text-fg">{t.title}</h4>
                <span className="text-xs text-muted">{t.algos.length} mô phỏng</span>
              </div>
              <p className="mt-1 text-xs text-muted">{t.blurb}</p>
            </header>
            <ul className="divide-y divide-line">
              {t.algos.map((id) => {
                const a = ALGOS[id];
                return (
                  <li key={id}>
                    <Link href={hrefFor(id)} className="group flex items-center gap-3 px-5 py-3 transition-colors hover:bg-surface-2/50">
                      <AlgoThumb id={id} className="h-10 w-16" />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-fg group-hover:text-cyan-fg">{a.title}</span>
                        <span className="block text-xs text-muted">{a.summary}</span>
                      </span>
                      <span className="hidden shrink-0 rounded-md bg-surface-2 px-2 py-0.5 font-mono text-[11px] text-fg sm:inline">{a.time.split(",")[0]}</span>
                      <ArrowRight className="size-4 shrink-0 text-muted group-hover:text-cyan-fg" aria-hidden />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </article>
        );
      })}
    </div>
  );
}
