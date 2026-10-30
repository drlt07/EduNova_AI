import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getLabBySlug, LAB_TEMPLATES } from "@/lib/data/labs";
import { getObjective } from "@/lib/data/curriculum";
import { MODE_LABEL } from "@/lib/labels";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { ACCENT, LabIcon } from "@/components/labs/lab-card";
import { LabPreview } from "@/components/labs/lab-preview";
import { cn } from "@/lib/utils";
import { NovaChapterNote } from "@/components/nova/nova-link";

export function generateStaticParams() {
  return LAB_TEMPLATES.map((l) => ({ slug: l.slug }));
}

export async function generateMetadata({ params }: PageProps<"/labs/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const lab = getLabBySlug(slug);
  return { title: lab ? lab.title : "Không tìm thấy lab" };
}

export default async function LabDetailPage({ params }: PageProps<"/labs/[slug]">) {
  const { slug } = await params;
  const lab = getLabBySlug(slug);
  if (!lab) notFound();
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <Button asChild variant="ghost" size="sm">
        <Link href="/labs"><ArrowLeft /> Tất cả phòng thí nghiệm</Link>
      </Button>
      <div className="mt-4 flex flex-col gap-5 md:flex-row md:items-start">
        <span className={cn("grid size-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br", ACCENT[lab.accent])}>
          <LabIcon slug={lab.slug} className="size-8" />
        </span>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight text-fg">{lab.title}</h1>
            <StatusBadge status={lab.featureStatus} />
          </div>
          <p className="mt-1 text-lg text-muted">{lab.tagline}</p>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted">{lab.description}</p>
          <NovaChapterNote slug={lab.slug} className="mt-3" />
          <div className="mt-3 flex flex-wrap gap-1.5">
            {lab.grades.map((g) => <Badge key={g} tone="blue">Tin {g}</Badge>)}
            {lab.pathways.map((p) => <Badge key={p} tone="violet">{p === "chung" ? "Nội dung chung" : p}</Badge>)}
            {lab.modes.map((m) => <Badge key={m} tone="cyan">{MODE_LABEL[m]}</Badge>)}
          </div>
        </div>
      </div>

      <section className="mt-8" aria-labelledby="preview-h">
        <h2 id="preview-h" className="mb-3 text-lg font-semibold text-fg">Chạy thử</h2>
        <LabPreview slug={lab.slug} />
      </section>

      <div className="mt-8 grid gap-5 lg:grid-cols-3">
        <Card>
          <CardHeader><CardTitle as="h2">Yêu cầu cần đạt</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {lab.objectiveIds.map((id) => (
                <li key={id}><span className="font-mono text-xs text-cyan-fg">{id}</span> <span className="text-fg">{getObjective(id)?.description}</span></li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle as="h2">Bài tập mẫu</CardTitle></CardHeader>
          <CardContent>
            <ol className="list-decimal space-y-2 pl-5 text-sm text-fg">
              {lab.sampleTasks.map((t) => <li key={t}>{t}</li>)}
            </ol>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle as="h2">Cách sử dụng</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm text-muted">
            <p>Học sinh làm qua <strong className="text-fg">nhiệm vụ giáo viên giao</strong> hoặc tự khám phá trong mục Phòng thí nghiệm.</p>
            <p>Giáo viên chọn mức độ, ngưỡng và các trường hợp kiểm tra khi giao bài.</p>
            <div className="flex flex-wrap gap-2">
              <Button asChild size="sm"><Link href="/login?role=teacher">Giáo viên</Link></Button>
              <Button asChild size="sm" variant="secondary"><Link href="/login?role=student">Học sinh</Link></Button>
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
