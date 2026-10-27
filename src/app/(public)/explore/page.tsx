import type { Metadata } from "next";
import { Suspense } from "react";
import { BookOpen } from "lucide-react";
import { LESSONS } from "@/lib/data/curriculum";
import { LESSON_CONTENT } from "@/lib/data/lesson-content";
import { PageSkeleton } from "@/components/ui/feedback";
import { PageHero } from "@/components/layout/page-hero";
import { LessonPeek } from "@/components/landing/hero-visuals";
import { ExploreClient } from "./explore-client";

export const metadata: Metadata = { title: "Bài học" };

export default function ExplorePage() {
  return (
    <>
      <PageHero
        eyebrow="Bài học"
        icon={BookOpen}
        title="Bài học Tin học"
        accent="có ví dụ chạy được"
        description="Mỗi bài đi theo 5 bước: tình huống, khám phá, quan sát trực quan, kiểm tra nhanh và vận dụng — kèm mô phỏng và bài lập trình liên quan."
        stats={[
          { value: new Set(LESSONS.map((l) => l.key)).size, label: "bài theo chương trình" },
          { value: Object.keys(LESSON_CONTENT).length, label: "bài có nội dung đầy đủ" },
          { value: 3, label: "bộ sách" },
          { value: 5, label: "bước mỗi bài" },
        ]}
        visual={<LessonPeek href="/bai-hoc/L-10-if-kntt" />}
      />
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <Suspense fallback={<PageSkeleton />}>
          <ExploreClient />
        </Suspense>
      </div>
    </>
  );
}
