"use client";
import { Sparkles } from "lucide-react";
import { SectionHead } from "@/components/layout/section-head";
import { KhoGallery } from "@/components/life/kho";

/** Kho mô phỏng công khai trong không gian học sinh: Tin học trong đời sống, mở tự do. */
export default function Page() {
  return (
    <>
      <SectionHead icon={Sparkles} title="Mô phỏng đời sống" subtitle="Tin học quanh ta: tự do khám phá, không tính điểm. Mô phỏng theo bài học nằm trong Khóa học." />
      <KhoGallery base="/student/kho" />
    </>
  );
}
