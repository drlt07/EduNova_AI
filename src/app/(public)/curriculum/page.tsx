import type { Metadata } from "next";
import { Suspense } from "react";
import { GraduationCap } from "lucide-react";
import { LESSONS, OBJECTIVES, TOPICS } from "@/lib/data/curriculum";
import { PageSkeleton } from "@/components/ui/feedback";
import { PageHero } from "@/components/layout/page-hero";
import { GradeTiles } from "@/components/landing/hero-visuals";
import { CurriculumClient } from "./curriculum-client";

export const metadata: Metadata = { title: "Chương trình học Tin học 10–12" };

export default function CurriculumPage() {
  return (
    <>
      <PageHero
        eyebrow="Chương trình học · GDPT 2018"
        icon={GraduationCap}
        title="Tin học 10, 11, 12"
        accent="trong một lộ trình"
        description="Chủ đề A–G → bài học → yêu cầu cần đạt, phân biệt nội dung chung và định hướng ICT/CS. Chọn khối lớp để xem bài và mô phỏng đi kèm."
        stats={[
          { value: 3, label: "khối lớp" },
          { value: TOPICS.length, label: "chủ đề A–G" },
          { value: new Set(LESSONS.map((l) => l.key)).size, label: "bài học" },
          { value: OBJECTIVES.length, label: "yêu cầu cần đạt" },
        ]}
        visual={<GradeTiles hrefFor={(g) => `/curriculum?grade=${g}`} />}
      />
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <Suspense fallback={<PageSkeleton />}>
          <CurriculumClient />
        </Suspense>
      </div>
    </>
  );
}
