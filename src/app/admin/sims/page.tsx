"use client";
import { Suspense } from "react";
import { FlaskConical } from "lucide-react";
import { PageHero } from "@/components/layout/page-hero";
import { PageSkeleton } from "@/components/ui/feedback";
import { SimLibrary } from "@/components/labs/sim-library";

/** Quản trị: xem bộ mô phỏng theo bài SGK (bộ dành cho giáo viên giao nhiệm vụ, không hiện ở Kho mô phỏng công khai). */
export default function Page() {
  return (
    <>
      <PageHero variant="app" eyebrow="Quản trị" icon={FlaskConical} title="Mô phỏng" accent="theo bài SGK" description="Bộ mô phỏng gắn với từng bài Tin học 10, 11, 12. Chỉ giáo viên và quản trị viên thấy; giáo viên giao cho lớp thành nhiệm vụ. Kho mô phỏng công khai là bộ riêng về Tin học trong đời sống." />
      <Suspense fallback={<PageSkeleton />}><SimLibrary hrefFor={(l) => `/labs/${l.slug}`} /></Suspense>
    </>
  );
}
