"use client";
/**
 * Kho mô phỏng công khai: Tin học trong đời sống (mã QR, GPS, mã vạch, mã hóa, thư rác, gợi ý video, nén ảnh).
 * Ai cũng mở được, không cần lớp. Bộ mô phỏng theo bài SGK nằm riêng trong không gian giáo viên.
 */
import Link from "next/link";
import { ArrowRight, Clock, Search, SearchX } from "lucide-react";
import { LIFE_GROUPS, LIFE_LABS } from "@/lib/data/life-labs";
import { useQueryState } from "@/lib/use-query-state";
import { cn, matchesQuery } from "@/lib/utils";
import { LifeArt } from "@/components/life/life-registry";

export function LabsClient() {
  const [q, setQ] = useQueryState("q");
  const [tab, setTab] = useQueryState("nhom");
  const groups = LIFE_GROUPS.filter((g) => !tab || g.id === tab).map((g) => ({ ...g, list: LIFE_LABS.filter((l) => l.group === g.id && matchesQuery(q, l.title, l.tagline, l.description, l.tags.join(" "))) })).filter((g) => g.list.length);
  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-surface p-3 shadow-sm">
        <label className="relative min-w-0 flex-1 basis-64">
          <span className="sr-only">Tìm mô phỏng</span>
          <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted" aria-hidden />
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm mô phỏng: QR, GPS, mã hóa, thư rác…" className="h-11 w-full rounded-xl border border-line bg-bg pl-11 pr-3 text-sm text-fg placeholder:text-muted focus:border-brand focus:outline-none" />
        </label>
        <nav aria-label="Nhóm mô phỏng" className="flex flex-wrap gap-1">
          {[{ id: "", title: "Tất cả" }, ...LIFE_GROUPS].map((g) => <button key={g.id} type="button" aria-pressed={tab === g.id} onClick={() => setTab(g.id)} className={cn("rounded-xl px-3 py-2 text-sm font-semibold", tab === g.id ? "bg-brand text-brand-ink" : "text-muted hover:bg-surface-2 hover:text-fg")}>{g.title}</button>)}
        </nav>
      </div>
      {groups.length === 0 && <div className="py-16 text-center text-muted"><SearchX className="mx-auto mb-2 size-8" aria-hidden />Không có mô phỏng nào khớp “{q}”.</div>}
      <div className="space-y-12">
        {groups.map((g) => (
          <section key={g.id} aria-labelledby={`kho-${g.id}`}>
            <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
              <div><h2 id={`kho-${g.id}`} className="text-2xl font-bold tracking-tight text-fg">{g.title}</h2><p className="text-sm text-muted">{g.sub}</p></div>
              <span className="text-xs font-semibold uppercase tracking-wide text-muted">{g.list.length} mô phỏng</span>
            </div>
            <ul className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {g.list.map((l) => (
                <li key={l.slug} className="min-w-0">
                  <Link href={`/kho/${l.slug}`} className="group flex h-full flex-col overflow-hidden rounded-3xl border border-line bg-surface shadow-sm transition-all hover:-translate-y-1 hover:border-brand/40 hover:shadow-xl">
                    <div className="relative aspect-[16/9] overflow-hidden"><LifeArt slug={l.slug} className="size-full transition-transform duration-500 group-hover:scale-105" /><span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-lg bg-white/90 px-2 py-1 text-xs font-semibold text-slate-700"><Clock className="size-3.5" aria-hidden />{l.minutes} phút</span></div>
                    <div className="flex flex-1 flex-col p-5">
                      <h3 className="text-lg font-bold leading-snug text-fg">{l.title}</h3>
                      <p className="mt-1 text-sm font-medium text-blue-fg">{l.tagline}</p>
                      <p className="mt-2 line-clamp-3 text-sm text-muted">{l.description}</p>
                      <div className="mt-auto flex flex-wrap items-center gap-2 pt-4">
                        <span className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-brand-ink">Mở mô phỏng <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden /></span>
                        <span className="truncate rounded-xl bg-surface-2 px-3 py-2 text-xs text-muted" title={l.links}>Liên hệ: {l.links}</span>
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
