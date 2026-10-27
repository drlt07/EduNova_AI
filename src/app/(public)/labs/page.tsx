import type { Metadata } from "next";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/ui/feedback";
import { LabsClient } from "./labs-client";

export const metadata: Metadata = { title: "Mô phỏng" };

export default function LabsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight text-fg">Mô phỏng Tin học</h1>
      <p className="mt-2 max-w-2xl text-muted">Phòng thí nghiệm ảo tương tác, gắn với bài học lớp 10, 11, 12.</p>
      <div className="mt-8">
        <Suspense fallback={<PageSkeleton />}>
          <LabsClient />
        </Suspense>
      </div>
    </div>
  );
}
