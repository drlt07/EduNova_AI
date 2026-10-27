import type { Metadata } from "next";
import { Suspense } from "react";
import { BookOpen } from "lucide-react";
import { PageSkeleton } from "@/components/ui/feedback";
import { ExploreClient } from "./explore-client";

export const metadata: Metadata = { title: "Bài học" };

export default function ExplorePage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="flex items-center gap-4">
        <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-success to-cyan text-white shadow-md" aria-hidden>
          <BookOpen className="size-7" />
        </span>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-fg">Bài học Tin học</h1>
          <p className="mt-1 text-muted">Bài giảng, ví dụ và mô phỏng tương tác cho lớp 10, 11, 12</p>
        </div>
      </div>
      <div className="mt-8">
        <Suspense fallback={<PageSkeleton />}>
          <ExploreClient />
        </Suspense>
      </div>
    </div>
  );
}
