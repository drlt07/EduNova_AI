import Link from "next/link";
import { BookOpen, PlayCircle } from "lucide-react";
import type { Lesson } from "@/lib/domain/types";
import { DIFFICULTY_LABEL, getTopic } from "@/lib/data/curriculum";
import { LAB_TEMPLATES } from "@/lib/data/labs";
import { getLessonContent } from "@/lib/data/lesson-content";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { LabIcon } from "@/components/labs/lab-card";
import { GardenScene } from "@/components/labs/smart-garden/garden-scene";

const DIFF_TONE = { "co-ban": "success", "trung-binh": "warning", "nang-cao": "danger" } as const;
const COVER: Record<string, string> = {
  A: "from-blue/25 to-cyan/10",
  B: "from-cyan/25 to-blue/10",
  C: "from-violet/20 to-blue/10",
  D: "from-danger/15 to-warning/10",
  E: "from-warning/20 to-success/10",
  F: "from-success/20 to-cyan/10",
  G: "from-violet/20 to-danger/10",
};

export function lessonLabs(l: Lesson) {
  return LAB_TEMPLATES.filter((lab) => lab.featureStatus !== "PLANNED" && lab.textbookMapping.some((m) => m.lessonIds.includes(l.id)));
}

/** Ảnh xem trước: mô phỏng thật nếu bài có phòng thí nghiệm, nếu không là ảnh bìa theo chủ đề. */
function Thumb({ lesson }: { lesson: Lesson }) {
  const lab = lessonLabs(lesson)[0];
  if (lab?.slug === "smart-garden")
    return (
      <div className="overflow-hidden rounded-xl bg-[#0B1220]">
        <GardenScene humidity={32} hasWater pump plant="healthy" threshold={40} />
      </div>
    );
  return (
    <div className={cn("flex aspect-[7/4] flex-col items-center justify-center gap-2 rounded-xl bg-gradient-to-br", COVER[lesson.topicId] ?? COVER.A)}>
      {lab ? <LabIcon slug={lab.slug} className="size-12 text-cyan-fg" /> : <BookOpen className="size-12 text-blue-fg" aria-hidden />}
      <span className="px-4 text-center text-xs font-medium text-muted">{getTopic(lesson.topicId)?.name}</span>
    </div>
  );
}

export function LessonCard({ lesson, href }: { lesson: Lesson; href: string }) {
  const hasLab = lessonLabs(lesson).length > 0;
  const full = !!getLessonContent(lesson.key);
  return (
    <Link href={href} className="group flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-sm transition-all hover:-translate-y-0.5 hover:border-cyan/50 hover:shadow-md">
      <div className="flex items-center justify-between bg-surface-2/60 px-4 py-3">
        <span className="grid size-9 place-items-center rounded-lg bg-success/15 text-success-fg">
          {hasLab ? <PlayCircle className="size-5" aria-hidden /> : <BookOpen className="size-5" aria-hidden />}
        </span>
        <Badge tone={hasLab ? "success" : "blue"}>{hasLab ? "Có mô phỏng" : "Bài học"}</Badge>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <h3 className="text-center text-lg font-bold leading-snug text-fg group-hover:text-cyan-fg">{lesson.title}</h3>
        <Thumb lesson={lesson} />
        <p className="text-sm text-muted">Lớp {lesson.grade} · Chủ đề {lesson.topicId} · Bài {lesson.order}</p>
        <div className="mt-auto flex items-center justify-between gap-2">
          <Badge tone={DIFF_TONE[lesson.difficulty]}>{DIFFICULTY_LABEL[lesson.difficulty]}</Badge>
          {full && <span className="text-xs font-medium text-success-fg">Bài giảng đầy đủ</span>}
        </div>
      </div>
    </Link>
  );
}
