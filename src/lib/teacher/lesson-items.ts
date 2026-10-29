/** Hoạt động giao được của một bài SGK: mô phỏng (theo chương trình và thầy cô gắn thêm), bộ câu hỏi, bài lập trình. */
import type { DemoData } from "@/lib/data/seed";
import { CODING_EXERCISES } from "@/lib/data/coding-exercises";
import { setsForLesson } from "@/lib/data/practice";
import { lessonSimSlugs, type BookEntry } from "@/lib/sgk/book";

export interface LessonItem { kind: "lab" | "quiz" | "code"; ref: string }

export function lessonAssignables(d: Pick<DemoData, "lessonLabs" | "teacherQuizzes">, userId: string, e: BookEntry): LessonItem[] {
  const sims = [...new Set([...lessonSimSlugs(e), ...d.lessonLabs.filter((l) => l.ownerId === userId && l.sgkRef === e.ref).map((l) => l.slug)])];
  return [
    ...sims.map((ref) => ({ kind: "lab" as const, ref })),
    ...d.teacherQuizzes.filter((q) => q.ownerId === userId && q.sgkRef === e.ref).map((q) => ({ kind: "quiz" as const, ref: q.id })),
    ...setsForLesson(e.ref, e.lesson.key).map((s) => ({ kind: "quiz" as const, ref: s.id })),
    ...(e.lesson.key ? CODING_EXERCISES.filter((x) => x.lessonKey === e.lesson.key).map((x) => ({ kind: "code" as const, ref: x.id })) : []),
  ];
}
