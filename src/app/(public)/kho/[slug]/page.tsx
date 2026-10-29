"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, GraduationCap } from "lucide-react";
import { getLifeLab, LIFE_LABS } from "@/lib/data/life-labs";
import { LIFE_COMPONENTS, LifeArt } from "@/components/life/life-registry";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/feedback";

/** Một mô phỏng trong Kho mô phỏng công khai. */
export default function KhoSimPage() {
  const { slug } = useParams<{ slug: string }>();
  const lab = getLifeLab(slug);
  const Sim = LIFE_COMPONENTS[slug];
  if (!lab || !Sim) return <ErrorState page title="Không tìm thấy mô phỏng" action={<Button asChild><Link href="/kho">Về Kho mô phỏng</Link></Button>} />;
  const others = LIFE_LABS.filter((l) => l.slug !== slug).slice(0, 3);
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <Button asChild variant="ghost" size="sm" className="mb-3"><Link href="/kho"><ArrowLeft /> Kho mô phỏng</Link></Button>
      <h1 className="text-3xl font-bold tracking-tight text-fg">{lab.title}</h1>
      <p className="mt-1 text-muted">{lab.tagline}</p>
      <p className="mb-5 mt-2 inline-flex items-center gap-1.5 rounded-lg bg-brand/10 px-2.5 py-1 text-xs font-semibold text-blue-fg"><GraduationCap className="size-3.5" aria-hidden /> Liên hệ bài học: {lab.links}</p>
      <Sim />
      <section className="mt-10">
        <h2 className="mb-3 text-lg font-bold text-fg">Thử tiếp</h2>
        <ul className="grid gap-4 sm:grid-cols-3">{others.map((o) => <li key={o.slug}><Link href={`/kho/${o.slug}`} className="block overflow-hidden rounded-2xl border border-line bg-surface hover:border-brand/40"><LifeArt slug={o.slug} className="aspect-[16/9] w-full" /><p className="p-3 text-sm font-semibold text-fg">{o.title}</p></Link></li>)}</ul>
      </section>
    </div>
  );
}
