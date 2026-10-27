import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LESSONS, getLesson } from "@/lib/data/curriculum";
import { LessonView } from "@/components/lessons/lesson-view";

export function generateStaticParams() {
  return LESSONS.map((l) => ({ id: l.id }));
}

export async function generateMetadata({ params }: PageProps<"/bai-hoc/[id]">): Promise<Metadata> {
  const { id } = await params;
  return { title: getLesson(id)?.title ?? "Không tìm thấy bài học" };
}

export default async function LessonPage({ params }: PageProps<"/bai-hoc/[id]">) {
  const { id } = await params;
  const lesson = getLesson(id);
  if (!lesson) notFound();
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <LessonView lesson={lesson} backHref="/explore" backLabel="Tất cả bài học" />
    </div>
  );
}
