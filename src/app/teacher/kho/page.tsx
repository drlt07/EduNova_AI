"use client";
import { LibraryHeader } from "@/components/teacher/assess-tabs";
import { KhoGallery } from "@/components/life/kho";

/** Mô phỏng đời sống trong Thư viện của giáo viên: Tin học quanh ta (2D/3D), mở tự do, không tính điểm. */
export default function Page() {
  return (
    <>
      <LibraryHeader subtitle="Mô phỏng đời sống 2D/3D: Tin học quanh ta, tự do khám phá, không tính điểm." />
      <KhoGallery base="/teacher/kho" />
    </>
  );
}
