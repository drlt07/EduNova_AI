"use client";
import Link from "next/link";
import { LibraryHeader } from "@/components/teacher/assess-tabs";
import { Button } from "@/components/ui/button";
import { KhoGallery } from "@/components/life/kho";

/** Kho mô phỏng công khai trong không gian giáo viên: Tin học trong đời sống, mở tự do. */
export default function Page() {
  return (
    <>
      <LibraryHeader subtitle="Mô phỏng đời sống: tự do khám phá, không tính điểm." actions={<Button asChild variant="secondary" size="sm"><Link href="/teacher/sims">Mô phỏng theo bài</Link></Button>} />
      <KhoGallery base="/teacher/kho" />
    </>
  );
}
