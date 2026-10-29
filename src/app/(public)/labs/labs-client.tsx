"use client";
/**
 * Kho mô phỏng công khai: trưng bày toàn bộ mô phỏng (Tin học 10, 11, 12 và thuật toán HSG) trên nền tối,
 * lọc theo tên và theo nhóm, mỗi nhóm một mục có số lượng. Ai cũng mở thử được, không cần lớp hay nhiệm vụ.
 */
import Link from "next/link";
import { ArrowRight, Search, SearchX } from "lucide-react";
import type { Grade } from "@/lib/domain/types";
import { LAB_TEMPLATES } from "@/lib/data/labs";
import { labMeta, topicLabel } from "@/lib/data/lab-catalog";
import { ALGOS, ALGO_IDS, HSG_TOPICS } from "@/lib/data/hsg";
import { useQueryState } from "@/lib/use-query-state";
import { cn, matchesQuery } from "@/lib/utils";
import { LabArt } from "@/components/labs/lab-art";
import { AlgoThumb } from "@/components/algo/hsg-catalog";

interface Item { id: string; title: string; desc: string; tag: string; href: string; art: React.ReactNode }
const GROUPS: { id: string; label: string; title: string; glow: string }[] = [
  { id: "10", label: "Tin học 10", title: "Tin học 10", glow: "from-sky-500/30" },
  { id: "11", label: "Tin học 11", title: "Tin học 11", glow: "from-violet-500/30" },
  { id: "12", label: "Tin học 12", title: "Tin học 12", glow: "from-fuchsia-500/30" },
  { id: "hsg", label: "Thuật toán HSG", title: "Chuyên đề HSG: thuật toán", glow: "from-amber-500/30" },
];

function items(group: string, hrefBase: string): Item[] {
  if (group === "hsg") return ALGO_IDS.map((id) => ({ id, title: ALGOS[id].title, desc: ALGOS[id].summary, tag: HSG_TOPICS.find((t) => t.id === ALGOS[id].topic)?.title ?? "thuật toán", href: `/thuat-toan/${id}`, art: <AlgoThumb id={id} className="size-full bg-slate-900 p-6" /> }));
  const g = Number(group) as Grade;
  return LAB_TEMPLATES.filter((l) => l.grades[0] === g && l.status !== "planned").map((l) => ({ id: l.slug, title: l.title, desc: l.description, tag: topicLabel(labMeta(l.slug).topic), href: `${hrefBase}/${l.slug}`, art: <LabArt slug={l.slug} className="size-full" /> }));
}

export function LabsClient({ hrefBase = "/labs" }: { hrefBase?: string }) {
  const [q, setQ] = useQueryState("q");
  const [tab, setTab] = useQueryState("nhom");
  const shown = GROUPS.filter((g) => !tab || g.id === tab).map((g) => ({ ...g, list: items(g.id, hrefBase).filter((x) => matchesQuery(q, x.title, x.desc, x.tag)) })).filter((g) => g.list.length);
  return (
    <div className="rounded-[2rem] bg-[#070b14] p-4 text-slate-100 shadow-2xl ring-1 ring-white/5 sm:p-8">
      <div className="sticky top-16 z-10 -mx-2 mb-8 flex flex-wrap items-center gap-3 rounded-2xl bg-[#070b14]/90 px-2 py-3 backdrop-blur">
        <label className="relative min-w-0 flex-1 basis-64">
          <span className="sr-only">Lọc mô phỏng theo tên</span>
          <span aria-hidden className="absolute left-4 top-1/2 size-2 -translate-y-1/2 rounded-full bg-cyan-400 shadow-[0_0_10px_2px_rgba(34,211,238,.7)]" />
          <Search className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-slate-500" aria-hidden />
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Lọc mô phỏng theo tên…" className="h-12 w-full rounded-2xl border border-white/10 bg-white/5 pl-9 pr-10 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-400/60 focus:outline-none" />
        </label>
        <nav aria-label="Nhóm mô phỏng" className="flex flex-wrap gap-1">
          {[{ id: "", label: "Tất cả" }, ...GROUPS].map((g) => (
            <button key={g.id} type="button" aria-pressed={tab === g.id} onClick={() => setTab(g.id)} className={cn("relative rounded-xl px-3 py-2 text-sm font-semibold transition-colors", tab === g.id ? "text-white" : "text-slate-400 hover:text-white")}>
              {g.label}
              {tab === g.id && <span aria-hidden className="absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,.8)]" />}
            </button>
          ))}
        </nav>
      </div>

      {shown.length === 0 && <div className="py-16 text-center text-slate-400"><SearchX className="mx-auto mb-2 size-8" aria-hidden />Không có mô phỏng nào khớp “{q}”.</div>}
      <div className="space-y-14">
        {shown.map((g) => (
          <section key={g.id} aria-labelledby={`kho-${g.id}`}>
            <div className="mb-5 flex items-end justify-between gap-3">
              <h2 id={`kho-${g.id}`} className="text-2xl font-black tracking-tight text-white sm:text-3xl">{g.title}</h2>
              <span className="text-xs font-bold uppercase tracking-widest text-slate-500">{g.list.length} mô phỏng</span>
            </div>
            <ul className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {g.list.map((x) => (
                <li key={x.id} className="min-w-0">
                  <Link href={x.href} className="group flex h-full flex-col overflow-hidden rounded-3xl border border-white/[0.07] bg-gradient-to-b from-white/[0.06] to-white/[0.02] transition-all hover:-translate-y-1 hover:border-cyan-400/40 hover:shadow-[0_20px_60px_-20px_rgba(34,211,238,.35)]">
                    <div className={cn("relative aspect-[16/9] overflow-hidden bg-gradient-to-br to-transparent", g.glow)}>
                      <div className="size-full saturate-[1.15] transition-transform duration-500 group-hover:scale-105">{x.art}</div>
                      <div aria-hidden className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#0b1020] to-transparent" />
                    </div>
                    <div className="flex flex-1 flex-col p-6">
                      <h3 className="text-xl font-extrabold leading-snug tracking-tight text-white">{x.title}</h3>
                      <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-slate-400">{x.desc}</p>
                      <div className="mt-auto flex flex-wrap items-center gap-2 pt-5">
                        <span className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-400 to-sky-400 px-4 py-2 text-sm font-bold text-slate-950 shadow-[0_0_20px_-4px_rgba(34,211,238,.8)]">Mở mô phỏng <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden /></span>
                        <span className="rounded-xl bg-white/5 px-3 py-2 text-xs font-semibold text-slate-300">{x.tag}</span>
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
