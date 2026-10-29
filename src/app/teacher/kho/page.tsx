"use client";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { SectionHead } from "@/components/layout/section-head";
import { Button } from "@/components/ui/button";
import { KhoGallery } from "@/components/life/kho";

/** Mô phỏng đời sống trong không gian giáo viên: Tin học quanh ta, mở tự do, không tính điểm. */
export default function Page() {
  return (
    <>
      <SectionHead icon={Sparkles} title="Mô phỏng đời sống" subtitle="Tin học quanh ta: tự do khám phá, không tính điểm. Mô phỏng theo bài học nằm trong Khóa học và Thư viện." actions={<Button asChild variant="secondary" size="sm"><Link href="/teacher/sims">Mô phỏng theo bài</Link></Button>} />
      <KhoGallery base="/teacher/kho" />
    </>
  );
}
