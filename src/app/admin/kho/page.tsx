"use client";
/** Quản trị Kho mô phỏng công khai: ẩn/hiện từng mô phỏng, chọn mô phỏng nổi bật (trang kho + trang chủ), xem lượt thử. */
import Link from "next/link";
import { Eye, EyeOff, FlaskConical, Play, Star } from "lucide-react";
import { toast } from "sonner";
import { LIFE_GROUPS, LIFE_LABS } from "@/lib/data/life-labs";
import { useApp } from "@/lib/store/app-store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { SectionHead } from "@/components/layout/section-head";
import { LifeArt } from "@/components/life/life-registry";
import { GROUP_THEME, fmtPlays } from "@/components/life/kho";
import { HsgBanner } from "@/components/algo/hsg-banner";

export default function AdminKhoPage() {
  const kho = useApp((s) => s.kho);
  const setHidden = useApp((s) => s.setKhoHidden);
  const setFeatured = useApp((s) => s.setKhoFeatured);
  const total = LIFE_LABS.reduce((n, l) => n + (kho.plays[l.slug] ?? 0), 0);
  const max = Math.max(1, ...LIFE_LABS.map((l) => kho.plays[l.slug] ?? 0));
  const rows = [...LIFE_LABS].sort((a, b) => (kho.plays[b.slug] ?? 0) - (kho.plays[a.slug] ?? 0));
  return (
    <>
      <SectionHead icon={FlaskConical} title="Mô phỏng đời sống" subtitle="Kho công khai cho khách, học sinh và giáo viên. Ẩn mô phỏng chưa phù hợp, chọn mô phỏng nổi bật hiện trên trang kho và trang chủ." actions={<Button asChild variant="secondary"><Link href="/kho">Xem kho như khách</Link></Button>} />
      <HsgBanner className="mb-6" />
      <div className="mb-5 grid gap-2 sm:grid-cols-4">
        {[
          { label: "Mô phỏng trong kho", value: LIFE_LABS.length },
          { label: "Đang hiện", value: LIFE_LABS.length - kho.hidden.length },
          { label: "Nổi bật", value: kho.featured.length },
          { label: "Tổng lượt thử", value: total.toLocaleString("vi-VN") },
        ].map((k) => <div key={k.label} className="rounded-2xl border border-line bg-surface p-3"><p className="text-xs font-semibold uppercase tracking-wide text-muted">{k.label}</p><p className="mt-1 text-2xl font-bold tabular-nums text-fg">{k.value}</p></div>)}
      </div>
      <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
        {rows.map((l) => {
          const hidden = kho.hidden.includes(l.slug);
          const featured = kho.featured.includes(l.slug);
          const g = LIFE_GROUPS.find((x) => x.id === l.group)!;
          const plays = kho.plays[l.slug] ?? 0;
          return (
            <li key={l.slug} className={cn("flex flex-wrap items-center gap-4 p-3", hidden && "bg-surface-2/50")}>
              <LifeArt slug={l.slug} className={cn("h-16 w-28 shrink-0 rounded-xl", hidden && "opacity-40 grayscale")} />
              <div className="min-w-0 flex-1 basis-56">
                <p className="font-semibold text-fg">{l.title}{l.isNew && <span className="ml-2 rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-bold text-white">Mới</span>}</p>
                <p className="text-xs text-muted"><span className={cn("mr-1.5 rounded-full px-2 py-0.5 font-semibold", GROUP_THEME[l.group].chip)}>{g.emoji} {g.title}</span>{l.minutes} phút · {l.links}</p>
              </div>
              <div className="w-40" title={`${plays} lượt thử`}>
                <div className="mb-0.5 flex justify-between text-xs"><span className="text-muted">Lượt thử</span><b className="tabular-nums text-fg">{fmtPlays(plays)}</b></div>
                <div className="h-1.5 rounded-full bg-surface-2"><div className="h-full rounded-full bg-blue" style={{ width: `${(plays / max) * 100}%` }} /></div>
              </div>
              <div className="flex flex-wrap gap-1">
                <Button size="sm" variant={featured ? "primary" : "secondary"} disabled={hidden} aria-pressed={featured} onClick={() => { setFeatured(l.slug, !featured); toast.success(featured ? "Đã bỏ nổi bật" : "Đã đặt nổi bật"); }}><Star className={cn(featured && "fill-current")} /> {featured ? "Nổi bật" : "Đặt nổi bật"}</Button>
                <Button size="sm" variant="ghost" aria-pressed={!hidden} onClick={() => { setHidden(l.slug, !hidden); if (!hidden && featured) setFeatured(l.slug, false); toast.success(hidden ? "Đã hiện trong kho" : "Đã ẩn khỏi kho"); }}>{hidden ? <><EyeOff /> Đang ẩn</> : <><Eye /> Đang hiện</>}</Button>
                <Button size="sm" variant="ghost" asChild><Link href={`/kho/${l.slug}`}><Play /> Chạy thử</Link></Button>
              </div>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-xs text-muted">Mô phỏng ẩn không hiện trong kho và trang chủ; đường dẫn trực tiếp báo “tạm ẩn” (quản trị viên vẫn mở được để kiểm tra).</p>
    </>
  );
}
