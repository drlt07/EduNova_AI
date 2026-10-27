"use client";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/misc";
import { KhbdAssistant } from "@/components/khbd/khbd-assistant";

export default function LessonPlanAssistantPage() {
  return (
    <>
      <Button asChild variant="ghost" size="sm" className="mb-2"><Link href="/teacher/lesson-planner"><ArrowLeft /> Kế hoạch bài dạy</Link></Button>
      <PageHeader title="Trợ lý xây dựng kế hoạch bài dạy" description="Chọn bài, tải KHBD có sẵn hoặc soạn mới, để trợ lý phân tích và đề xuất; gắn mô phỏng vào hoạt động rồi hoàn thiện, lưu phiên bản và xuất Word/PDF." />
      <KhbdAssistant />
    </>
  );
}
