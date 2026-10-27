"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { studentClassIds } from "@/lib/store/scoped";
import { useSessionData } from "@/lib/store/use-role";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/feedback";
import { PageHeader } from "@/components/ui/misc";
import { CoursePlayer } from "@/components/courses/course-player";

export default function StudentCoursePage() {
  const { id } = useParams<{ id: string }>();
  const { d, user } = useSessionData();
  const course = d.courses.find((c) => c.id === id);
  const mine = studentClassIds(d, user.id);
  // Học sinh chỉ xem được khóa học đã phát hành cho lớp mình
  if (!course || course.status !== "published" || !course.classIds.some((c) => mine.includes(c))) {
    return <ErrorState page title="Không tìm thấy khóa học" description="Khóa học không tồn tại hoặc chưa được phát hành cho lớp của em." action={<Button asChild variant="secondary"><Link href="/student/courses">Về danh sách khóa học</Link></Button>} />;
  }
  const progress = d.courseProgress.find((p) => p.studentId === user.id && p.courseId === course.id);
  return (
    <>
      <Button asChild variant="ghost" size="sm" className="mb-2"><Link href="/student/courses"><ArrowLeft /> Khóa học</Link></Button>
      <PageHeader title={course.title} description={course.description} />
      <CoursePlayer
        course={course}
        studentId={user.id}
        progress={progress}
        practiceAttempts={d.practiceAttempts}
        codeFor={(ex) => d.codeWorks.find((w) => w.studentId === user.id && w.exerciseId === ex)?.code}
        onMark={(blockId, done, score) => {
          const was = Boolean(progress?.done[blockId]);
          d.markCourseBlock(user.id, course.id, blockId, done, score);
          if (done && !was) toast.success("Đã ghi nhận hoàn thành");
        }}
        onOpenLesson={(lessonId) => d.setCourseLastLesson(user.id, course.id, lessonId)}
        onPythonTests={(ex, passed, total, code, errorType) => d.recordCodeRun(user.id, ex, code, { passed, total, errorType })}
        onPythonSave={(ex, code) => d.saveCode(user.id, ex, code)}
      />
    </>
  );
}
