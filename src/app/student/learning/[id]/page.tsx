"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getLesson } from "@/lib/data/curriculum";
import { useSessionData } from "@/lib/store/use-role";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/feedback";
import { LessonView } from "@/components/lessons/lesson-view";

export default function StudentLessonPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useSessionData();
  const lesson = getLesson(id);
  if (!lesson) return <ErrorState page title="Không tìm thấy bài học" action={<Button asChild><Link href="/student/learning">Về danh sách bài học</Link></Button>} />;
  return <LessonView key={lesson.id} lesson={lesson} backHref="/student/learning" backLabel="Bài học" studentId={user.id} />;
}
