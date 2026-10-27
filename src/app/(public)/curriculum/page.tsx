import type { Metadata } from "next";
import { CurriculumClient } from "./curriculum-client";

export const metadata: Metadata = { title: "Cây chương trình Tin học 10–12" };

export default function CurriculumPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight text-fg">Cây kiến thức Tin học THPT</h1>
      <p className="mt-2 max-w-2xl text-muted">Chương trình GDPT 2018: chủ đề A–G → bài học → yêu cầu cần đạt, phân biệt nội dung chung và định hướng ICT/CS.</p>
      <div className="mt-8">
        <CurriculumClient />
      </div>
    </div>
  );
}
