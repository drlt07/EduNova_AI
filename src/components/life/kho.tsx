"use client";
/**
 * Kho mô phỏng công khai — dùng chung cho trang công khai (/kho), học sinh (/student/kho), giáo viên (/teacher/kho)
 * và trang chủ. Quản trị viên ẩn/hiện, chọn mô phỏng nổi bật ở /admin/kho; lượt thử được đếm khi mở mô phỏng.
 */
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Clock, Eye, GraduationCap, Play, Search, SearchX, Sparkles, Star } from "lucide-react";
import { DEFAULT_FEATURED, LIFE_GROUPS, LIFE_LABS, getLifeLab, type LifeLab } from "@/lib/data/life-labs";
import { useApp } from "@/lib/store/app-store";
import { useCurrentUser } from "@/lib/store/hooks";
import { cn, matchesQuery } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/feedback";
import { LIFE_COMPONENTS, LifeArt } from "./life-registry";
import { SaveToggle } from "@/components/teacher/save-toggle";
import { HsgBanner } from "@/components/algo/hsg-banner";
import { NovaChapterNote } from "@/components/nova/nova-link";

export const GROUP_THEME: Record<LifeLab["group"], { chip: string; text: string; glow: string; bar: string; soft: string }> = {
  "may-tinh": { chip: "bg-indigo-100 text-indigo-800 dark:bg-indigo-500/20 dark:text-indigo-200", text: "text-indigo-700 dark:text-indigo-300", glow: "hover:shadow-indigo-500/25", bar: "from-indigo-400 to-violet-400", soft: "from-indigo-100 via-white to-violet-50 dark:from-indigo-500/15 dark:via-surface dark:to-violet-500/10" },
  "thuong-ngay": { chip: "bg-sky-100 text-sky-800 dark:bg-sky-500/20 dark:text-sky-200", text: "text-sky-700 dark:text-sky-300", glow: "hover:shadow-sky-500/25", bar: "from-sky-400 to-cyan-400", soft: "from-sky-100 via-white to-cyan-50 dark:from-sky-500/15 dark:via-surface dark:to-cyan-500/10" },
  "an-toan": { chip: "bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-200", text: "text-rose-700 dark:text-rose-300", glow: "hover:shadow-rose-500/25", bar: "from-rose-400 to-fuchsia-400", soft: "from-rose-100 via-white to-fuchsia-50 dark:from-rose-500/15 dark:via-surface dark:to-fuchsia-500/10" },
  "du-lieu": { chip: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200", text: "text-emerald-700 dark:text-emerald-300", glow: "hover:shadow-emerald-500/25", bar: "from-emerald-400 to-lime-400", soft: "from-emerald-100 via-white to-lime-50 dark:from-emerald-500/15 dark:via-surface dark:to-lime-500/10" },
};

const FACTS = [
  { emoji: "🔳", text: "Mã QR mất gần 30% vẫn quét được nhờ mã sửa lỗi." },
  { emoji: "🛰️", text: "Điện thoại cần ít nhất 3 vệ tinh để biết em đứng đâu." },
  { emoji: "🔑", text: "Thêm 4 kí tự làm mật khẩu khó đoán hơn hàng triệu lần." },
  { emoji: "🌈", text: "Mỗi điểm ảnh chỉ có 3 đèn nhưng tạo ra 16,7 triệu màu." },
];

export const fmtPlays = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1).replace(".", ",")}k` : String(n));

/** Mô phỏng đang hiện trong kho (theo cài đặt của quản trị viên). */
export function useKho() {
  const kho = useApp((s) => s.kho) ?? { hidden: [], featured: DEFAULT_FEATURED, plays: {} };
  const visible = LIFE_LABS.filter((l) => !kho.hidden.includes(l.slug));
  const featured = kho.featured.map((s) => visible.find((l) => l.slug === s)).filter((l): l is LifeLab => !!l);
  return { kho, visible, featured: featured.length ? featured : visible.slice(0, 3) };
}

function Spotlight({ list, base, plays }: { list: LifeLab[]; base: string; plays: Record<string, number> }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused || list.length < 2) return;
    const t = window.setInterval(() => setI((x) => (x + 1) % list.length), 6000);
    return () => window.clearInterval(t);
  }, [paused, list.length]);
  const l = list[Math.min(i, list.length - 1)];
  if (!l) return null;
  const th = GROUP_THEME[l.group];
  const g = LIFE_GROUPS.find((x) => x.id === l.group)!;
  return (
    <section aria-label="Mô phỏng nổi bật" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} className={cn("relative overflow-hidden rounded-[32px] border border-line bg-gradient-to-br p-5 shadow-sm sm:p-8", th.soft)}>
      <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-white/60 blur-3xl dark:bg-white/5" />
      <div className="relative grid items-center gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        <div key={l.slug} className="kho-in">
          <p className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-wider">
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-400 px-2.5 py-1 text-amber-950"><Star className="size-3.5 fill-current" aria-hidden /> Nổi bật</span>
            <span className={cn("rounded-full px-2.5 py-1", th.chip)}>{g.emoji} {g.title}</span>
          </p>
          <h2 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight text-fg sm:text-4xl">{l.title}</h2>
          <p className={cn("mt-2 text-lg font-semibold", th.text)}>{l.tagline}</p>
          <p className="mt-3 line-clamp-3 text-muted">{l.description}</p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Button asChild size="lg" className="rounded-2xl shadow-lg"><Link href={`${base}/${l.slug}`}><Play className="fill-current" /> Chơi ngay</Link></Button>
            <span className="inline-flex items-center gap-1.5 text-sm text-muted"><Clock className="size-4" aria-hidden /> {l.minutes} phút</span>
            <span className="inline-flex items-center gap-1.5 text-sm text-muted"><Eye className="size-4" aria-hidden /> {fmtPlays(plays[l.slug] ?? 0)} lượt thử</span>
          </div>
        </div>
        <Link href={`${base}/${l.slug}`} className="group relative block" aria-label={`Mở ${l.title}`}>
          <div aria-hidden className={cn("absolute inset-4 -z-0 rotate-3 rounded-[28px] bg-gradient-to-br opacity-60 transition-transform group-hover:rotate-6", th.bar)} />
          <div key={l.slug} className="relative overflow-hidden rounded-[28px] border-4 border-white shadow-2xl kho-in dark:border-slate-800">
            <LifeArt slug={l.slug} className="aspect-[16/10] w-full transition-transform duration-700 group-hover:scale-105" />
            <span className="absolute inset-0 grid place-items-center opacity-0 transition-opacity group-hover:opacity-100"><span className="grid size-16 place-items-center rounded-full bg-white/95 text-slate-900 shadow-xl"><Play className="size-7 translate-x-0.5 fill-current" aria-hidden /></span></span>
          </div>
        </Link>
      </div>
      {list.length > 1 && (
        <div className="relative mt-6 flex flex-wrap gap-2" role="tablist" aria-label="Chọn mô phỏng nổi bật">
          {list.map((x, k) => (
            <button key={x.slug} type="button" role="tab" aria-selected={k === i} onClick={() => setI(k)} className={cn("flex items-center gap-2 rounded-2xl border p-1.5 pr-3 text-left text-sm transition-all", k === i ? "border-fg bg-surface shadow-md" : "border-transparent bg-surface/60 hover:bg-surface")}>
              <LifeArt slug={x.slug} className="h-9 w-14 rounded-xl" />
              <span className="max-w-40 truncate font-semibold text-fg">{x.title}</span>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

export function KhoCard({ l, base, plays, featured }: { l: LifeLab; base: string; plays: number; featured?: boolean }) {
  const th = GROUP_THEME[l.group];
  const g = LIFE_GROUPS.find((x) => x.id === l.group)!;
  return (
    <Link href={`${base}/${l.slug}`} className={cn("group relative flex h-full flex-col overflow-hidden rounded-[28px] border border-line bg-surface shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl", th.glow)}>
      <div className="relative aspect-[16/10] overflow-hidden">
        <LifeArt slug={l.slug} className="size-full transition-transform duration-700 group-hover:scale-110" />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
        <span className={cn("absolute left-3 top-3 rounded-full px-2.5 py-1 text-xs font-bold shadow-sm", th.chip)}>{g.emoji} {g.title.split(" ")[0] === "Công" ? "Thường ngày" : g.title.split(" và ")[0]}</span>
        <span className="absolute right-3 top-3 flex gap-1">
          {l.isNew && <span className="rounded-full bg-rose-500 px-2.5 py-1 text-xs font-bold text-white shadow">Mới</span>}
          {featured && <span className="inline-flex items-center gap-1 rounded-full bg-amber-400 px-2 py-1 text-xs font-bold text-amber-950 shadow"><Star className="size-3 fill-current" aria-hidden /> Hot</span>}
        </span>
        <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-lg bg-black/55 px-2 py-1 text-xs font-semibold text-white backdrop-blur"><Clock className="size-3.5" aria-hidden />{l.minutes} phút</span>
        <span className="absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-lg bg-black/55 px-2 py-1 text-xs font-semibold text-white backdrop-blur"><Eye className="size-3.5" aria-hidden />{fmtPlays(plays)}</span>
        <span className="absolute inset-0 grid place-items-center"><span className="grid size-14 scale-50 place-items-center rounded-full bg-white/95 text-slate-900 opacity-0 shadow-xl transition-all duration-300 group-hover:scale-100 group-hover:opacity-100"><Play className="size-6 translate-x-0.5 fill-current" aria-hidden /></span></span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-lg font-bold leading-snug text-fg">{l.title}</h3>
        <p className={cn("mt-1 text-sm font-semibold", th.text)}>{l.tagline}</p>
        <p className="mt-2 line-clamp-2 text-sm text-muted">{l.description}</p>
        <NovaChapterNote slug={l.slug} asText className="mt-3 self-start" />
        <div className="mt-auto flex flex-wrap gap-1.5 pt-4">{l.tags.map((t) => <span key={t} className="rounded-full bg-surface-2 px-2.5 py-0.5 text-xs text-muted">#{t}</span>)}</div>
      </div>
      <div aria-hidden className={cn("h-1.5 bg-gradient-to-r", th.bar)} />
    </Link>
  );
}

/** Toàn bộ kho: nổi bật, sự thật thú vị, tìm kiếm, nhóm. `base`: đường dẫn trang chi tiết (vd "/kho", "/student/kho"). */
export function KhoGallery({ base }: { base: string }) {
  const { kho, visible, featured } = useKho();
  const [q, setQ] = useState("");
  const [tab, setTab] = useState("");
  const groups = LIFE_GROUPS.filter((g) => !tab || g.id === tab).map((g) => ({ ...g, list: visible.filter((l) => l.group === g.id && matchesQuery(q, l.title, l.tagline, l.description, l.tags.join(" "))) })).filter((g) => g.list.length);
  return (
    <div className="space-y-10">
      <Spotlight list={featured} base={base} plays={kho.plays} />
      <HsgBanner />

      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="Bạn có biết?">
        {FACTS.map((f) => <li key={f.text} className="flex items-start gap-3 rounded-2xl border border-line bg-surface p-4 shadow-sm"><span className="text-2xl" aria-hidden>{f.emoji}</span><p className="text-sm text-fg"><b className="block text-xs uppercase tracking-wide text-muted">Bạn có biết?</b>{f.text}</p></li>)}
      </ul>

      <div className="sticky top-16 z-20 flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-surface/90 p-2.5 shadow-sm backdrop-blur">
        <label className="relative min-w-0 flex-1 basis-60">
          <span className="sr-only">Tìm mô phỏng</span>
          <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted" aria-hidden />
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm: QR, mật khẩu, màu RGB, thư rác…" className="h-11 w-full rounded-xl border border-line bg-bg pl-11 pr-3 text-sm text-fg placeholder:text-muted focus:border-brand focus:outline-none" />
        </label>
        <nav aria-label="Nhóm mô phỏng" className="flex flex-wrap gap-1">
          {[{ id: "", title: "Tất cả", emoji: "✨" }, ...LIFE_GROUPS].map((g) => <button key={g.id} type="button" aria-pressed={tab === g.id} onClick={() => setTab(g.id)} className={cn("rounded-xl px-3 py-2 text-sm font-semibold transition-colors", tab === g.id ? "bg-fg text-bg" : "text-muted hover:bg-surface-2 hover:text-fg")}>{g.emoji} {g.title}</button>)}
        </nav>
      </div>

      {groups.length === 0 && <div className="py-16 text-center text-muted"><SearchX className="mx-auto mb-2 size-8" aria-hidden />Không có mô phỏng nào khớp “{q}”.</div>}
      {groups.map((g) => (
        <section key={g.id} aria-labelledby={`kho-${g.id}`}>
          <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
            <div className="flex items-center gap-3">
              <span className={cn("grid size-12 place-items-center rounded-2xl text-2xl", GROUP_THEME[g.id].chip)} aria-hidden>{g.emoji}</span>
              <div><h2 id={`kho-${g.id}`} className="text-2xl font-extrabold tracking-tight text-fg">{g.title}</h2><p className="text-sm text-muted">{g.sub}</p></div>
            </div>
            <span className="rounded-full bg-surface-2 px-3 py-1 text-xs font-semibold text-muted">{g.list.length} mô phỏng</span>
          </div>
          <ul className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {g.list.map((l) => <li key={l.slug} className="min-w-0"><KhoCard l={l} base={base} plays={kho.plays[l.slug] ?? 0} featured={kho.featured.includes(l.slug)} /></li>)}
          </ul>
        </section>
      ))}
    </div>
  );
}

/** Trang một mô phỏng trong kho; ghi một lượt thử khi mở. */
export function KhoSim({ slug, base }: { slug: string; base: string }) {
  const { kho, visible } = useKho();
  const user = useCurrentUser();
  const count = useApp((s) => s.countKhoPlay);
  const lab = getLifeLab(slug);
  const Sim = LIFE_COMPONENTS[slug];
  const hidden = kho.hidden.includes(slug) && user?.role !== "admin";
  useEffect(() => { if (lab && !hidden) count(slug); }, [slug, lab, hidden, count]);
  if (!lab || !Sim || hidden) return <ErrorState page title={hidden ? "Mô phỏng đang tạm ẩn" : "Không tìm thấy mô phỏng"} action={<Button asChild><Link href={base}>Về Kho mô phỏng</Link></Button>} />;
  const th = GROUP_THEME[lab.group];
  const g = LIFE_GROUPS.find((x) => x.id === lab.group)!;
  const others = visible.filter((l) => l.slug !== slug).sort((a, b) => Number(b.group === lab.group) - Number(a.group === lab.group)).slice(0, 3);
  return (
    <div>
      <Button asChild variant="ghost" size="sm" className="mb-3"><Link href={base}><ArrowLeft /> Kho mô phỏng</Link></Button>
      <div className={cn("mb-5 rounded-[28px] border border-line bg-gradient-to-br p-5 sm:p-6", th.soft)}>
        <p className="flex flex-wrap items-center gap-2 text-xs font-bold"><span className={cn("rounded-full px-2.5 py-1", th.chip)}>{g.emoji} {g.title}</span>{lab.isNew && <span className="rounded-full bg-rose-500 px-2.5 py-1 text-white">Mới</span>}</p>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-3"><h1 className="text-3xl font-extrabold tracking-tight text-fg">{lab.title}</h1><SaveToggle itemKey={`kho:${slug}`} label={lab.title} /></div>
        <p className={cn("mt-1 text-lg font-semibold", th.text)}>{lab.tagline}</p>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-surface/80 px-2.5 py-1 font-semibold text-fg"><GraduationCap className="size-3.5" aria-hidden /> Liên hệ bài học: {lab.links}</span>
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-surface/80 px-2.5 py-1 text-muted"><Clock className="size-3.5" aria-hidden /> {lab.minutes} phút</span>
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-surface/80 px-2.5 py-1 text-muted"><Eye className="size-3.5" aria-hidden /> {fmtPlays(kho.plays[slug] ?? 0)} lượt thử</span>
          <NovaChapterNote slug={slug} />
        </div>
      </div>
      <Sim />
      <section className="mt-10">
        <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-fg"><Sparkles className="size-5 text-amber-500" aria-hidden /> Thử tiếp</h2>
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{others.map((o) => <li key={o.slug}><KhoCard l={o} base={base} plays={kho.plays[o.slug] ?? 0} /></li>)}</ul>
      </section>
    </div>
  );
}

/** Ô mô phỏng trên trang chủ: lấy từ kho (nổi bật trước). */
export function KhoShowcase() {
  const { kho, visible, featured } = useKho();
  const list = [...featured, ...visible.filter((l) => !featured.includes(l))].slice(0, 4);
  return (
    <>
      <div className="mt-10 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {list.map((l) => <KhoCard key={l.slug} l={l} base="/kho" plays={kho.plays[l.slug] ?? 0} featured={kho.featured.includes(l.slug)} />)}
      </div>
      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <Button asChild size="lg"><Link href="/kho">Mở kho {visible.length} mô phỏng <ArrowRight /></Link></Button>
      </div>
    </>
  );
}
