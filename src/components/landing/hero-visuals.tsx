import Link from "next/link";
import { ArrowRight, CheckCircle2, Play } from "lucide-react";
import { LESSONS, OBJECTIVES } from "@/lib/data/curriculum";
import { LAB_TEMPLATES } from "@/lib/data/labs";
import { getLessonContent } from "@/lib/data/lesson-content";
import { cn } from "@/lib/utils";
import { HeroTraffic } from "./hero-traffic";
import { LabArt } from "@/components/labs/lab-art";

/** Mô phỏng nhỏ chạy thật (cảnh giao lộ 3D) trong khung, kèm chú thích và nút mở. */
export function MiniSimPreview({ href, title = "Thành phố giao thông · Tin 10", task = "Điều khiển đèn để 12 lượt xe qua giao lộ an toàn.", cta = "Trải nghiệm ngay" }: { href: string; title?: string; task?: string; cta?: string }) {
  return (
    <figure className="rounded-[22px] border border-line bg-surface/80 p-3 shadow-[0_30px_80px_-30px_rgba(34,211,238,0.35)] backdrop-blur">
      <div className="mb-2.5 flex items-center justify-between gap-3 px-1">
        <div className="flex gap-1.5" aria-hidden>
          <span className="size-2.5 rounded-full bg-danger/70" />
          <span className="size-2.5 rounded-full bg-warning/70" />
          <span className="size-2.5 rounded-full bg-success/70" />
        </div>
        <span className="truncate text-xs text-muted">Mô phỏng đang chạy</span>
        <span />
      </div>
      <HeroTraffic />
      <figcaption className="mt-3 flex flex-wrap items-center justify-between gap-3 px-1">
        <span className="min-w-0">
          <span className="block text-sm font-semibold text-fg">{title}</span>
          <span className="block text-xs text-muted">{task}</span>
        </span>
        <Link href={href} className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#2563eb] to-[#0ea5e9] px-3 py-1.5 text-xs font-semibold text-white shadow-[0_0_20px_-6px_var(--cyan)] hover:brightness-110">
          <Play className="size-3.5" aria-hidden /> {cta}
        </Link>
      </figcaption>
    </figure>
  );
}

const GRADE_INFO = [
  { g: 10, title: "Dữ liệu và lập trình", tone: "from-cyan/30 to-cyan/5" },
  { g: 11, title: "Máy tính và cơ sở dữ liệu", tone: "from-blue/30 to-blue/5" },
  { g: 12, title: "Mạng, AI và sáng tạo số", tone: "from-violet/30 to-violet/5" },
] as const;

/** Ba thẻ khối lớp với số bài, yêu cầu cần đạt, mô phỏng tính từ dữ liệu. */
export function GradeTiles({ hrefFor }: { hrefFor: (g: number) => string }) {
  return (
    <ul className="grid gap-3">
      {GRADE_INFO.map((x) => {
        const lessons = new Set(LESSONS.filter((l) => l.grade === x.g).map((l) => l.key)).size;
        const objectives = OBJECTIVES.filter((o) => o.grade === x.g).length;
        const labs = LAB_TEMPLATES.filter((l) => l.grades.includes(x.g)).length;
        return (
          <li key={x.g}>
            <Link href={hrefFor(x.g)} className={cn("group flex items-center gap-4 rounded-2xl border border-line bg-gradient-to-r p-4 transition-all hover:-translate-y-0.5 hover:border-cyan/40", x.tone)}>
              <span className="text-4xl font-extrabold text-gradient tabular-nums">{x.g}</span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold text-fg">{x.title}</span>
                <span className="block text-xs text-muted">{lessons} bài · {objectives} yêu cầu cần đạt · {labs} mô phỏng</span>
              </span>
              <ArrowRight className="size-4 text-cyan-fg transition-transform group-hover:translate-x-0.5" aria-hidden />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/** Bài học mẫu: câu hỏi khởi động và các phần của bài (dữ liệu thật của bài Câu lệnh rẽ nhánh). */
export function LessonPeek({ href }: { href: string }) {
  const c = getLessonContent("10-if");
  if (!c) return null;
  return (
    <Link href={href} className="block rounded-[22px] border border-line bg-surface/80 p-5 shadow-[0_30px_80px_-30px_rgba(79,127,255,0.35)] backdrop-blur transition-colors hover:border-cyan/40">
      <p className="text-xs font-semibold uppercase tracking-wide text-cyan-fg">Bài học mẫu · Tin 10</p>
      <p className="mt-1 text-lg font-bold text-fg">Câu lệnh rẽ nhánh if</p>
      <p className="mt-3 rounded-xl bg-surface-2 p-3 text-sm text-fg">“{c.warmUp.question}”</p>
      <ol className="mt-3 space-y-1.5 text-sm">
        {["Tình huống", "Khám phá", "Quan sát trực quan", "Kiểm tra nhanh", "Vận dụng"].map((s, i) => (
          <li key={s} className="flex items-center gap-2 text-muted"><span className="grid size-5 place-items-center rounded-full bg-cyan/15 font-mono text-[10px] font-bold text-cyan-fg">{i + 1}</span>{s}</li>
        ))}
      </ol>
      <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-cyan-fg">Mở bài học <ArrowRight className="size-4" aria-hidden /></span>
    </Link>
  );
}

/** Ô ghép 4 mô phỏng thật (ảnh minh họa + tên + lớp), bấm để mở. */
export function LabCollage({ slugs, hrefFor }: { slugs: string[]; hrefFor: (slug: string) => string }) {
  const labs = slugs.map((s) => LAB_TEMPLATES.find((l) => l.slug === s)).filter((l): l is (typeof LAB_TEMPLATES)[number] => !!l);
  return (
    <ul className="grid grid-cols-2 gap-3">
      {labs.map((l) => (
        <li key={l.slug}>
          <Link href={hrefFor(l.slug)} className="group block overflow-hidden rounded-2xl border border-line bg-surface shadow-[0_20px_50px_-30px_rgba(79,127,255,0.5)] transition-all hover:-translate-y-0.5 hover:border-cyan/40">
            <span className="block aspect-[16/9] overflow-hidden"><LabArt slug={l.slug} className="size-full transition-transform duration-500 group-hover:scale-105" /></span>
            <span className="block px-3 py-2">
              <span className="block truncate text-sm font-semibold text-fg">{l.title}</span>
              <span className="block text-xs text-muted">Tin {l.grades.join(", ")}</span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** Các bước bắt đầu, đánh số. */
export function StepTiles({ steps }: { steps: { title: string; text: string }[] }) {
  return (
    <ol className="grid gap-3">
      {steps.map((s, i) => (
        <li key={s.title} className="flex gap-3 rounded-2xl border border-line bg-surface/80 p-4 backdrop-blur">
          <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#2563eb] to-[#0ea5e9] font-bold text-white">{i + 1}</span>
          <span><span className="block font-semibold text-fg">{s.title}</span><span className="block text-sm text-muted">{s.text}</span></span>
        </li>
      ))}
      <li className="flex items-center gap-2 px-1 text-xs text-muted"><CheckCircle2 className="size-3.5 text-success-fg" aria-hidden /> Bản dùng thử: không cần mật khẩu, dữ liệu lưu trên trình duyệt.</li>
    </ol>
  );
}
