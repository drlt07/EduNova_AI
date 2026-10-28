/**
 * Selector phân quyền — mô phỏng RLS ở phía client cho giai đoạn 1.
 * Production: các quy tắc này được thực thi bằng RLS trong PostgreSQL (supabase/migrations/, kiểm thử trong tests/db).
 */
import type { DemoData } from "@/lib/data/seed";
import type { Assignment, ClassRoom, Submission, User } from "@/lib/domain/types";

type D = Pick<DemoData, "users" | "classes" | "enrollments" | "assignments" | "submissions" | "assessments" | "attempts" | "events" | "activities" | "rubrics" | "labConfigs" | "lessonPlans">;

export function getUser(d: Pick<DemoData, "users">, id: string | null): User | undefined {
  return id ? d.users.find((u) => u.id === id) : undefined;
}

export function teacherClasses(d: D, teacherId: string): ClassRoom[] {
  return d.classes.filter((c) => c.teacherId === teacherId);
}

export function studentClassIds(d: D, studentId: string): string[] {
  return d.enrollments.filter((e) => e.studentId === studentId).map((e) => e.classId);
}

export function classStudents(d: D, classId: string): User[] {
  const ids = new Set(d.enrollments.filter((e) => e.classId === classId).map((e) => e.studentId));
  return d.users.filter((u) => ids.has(u.id));
}

export function teacherAssignments(d: D, teacherId: string): Assignment[] {
  const own = new Set(teacherClasses(d, teacherId).map((c) => c.id));
  return d.assignments.filter((a) => own.has(a.classId) && a.ownerId === teacherId);
}

export function studentAssignments(d: D, studentId: string): Assignment[] {
  const mine = new Set(studentClassIds(d, studentId));
  return d.assignments.filter((a) => mine.has(a.classId) && (!a.studentIds || a.studentIds.includes(studentId)));
}

/** Học sinh được giao một nhiệm vụ: cả lớp, hoặc chỉ các em được chọn. */
export function assignedStudents(d: D, a: Pick<Assignment, "classId" | "studentIds">): User[] {
  const all = classStudents(d, a.classId);
  return a.studentIds ? all.filter((u) => a.studentIds!.includes(u.id)) : all;
}

/** Bài nộp giáo viên được xem: chỉ thuộc assignment của lớp mình. */
export function teacherSubmissions(d: D, teacherId: string): Submission[] {
  const asg = new Set(teacherAssignments(d, teacherId).map((a) => a.id));
  return d.submissions.filter((s) => asg.has(s.assignmentId));
}

export function studentSubmissions(d: D, studentId: string): Submission[] {
  return d.submissions.filter((s) => s.studentId === studentId);
}

export function canTeacherViewSubmission(d: D, teacherId: string, submissionId: string): boolean {
  return teacherSubmissions(d, teacherId).some((s) => s.id === submissionId);
}

export function canStudentViewAssignment(d: D, studentId: string, assignmentId: string): boolean {
  return studentAssignments(d, studentId).some((a) => a.id === assignmentId);
}

/** Đánh giá học sinh được xem: của chính mình và đã chốt (final). */
export function studentAssessments(d: D, studentId: string) {
  const subs = new Set(studentSubmissions(d, studentId).map((s) => s.id));
  return d.assessments.filter((a) => subs.has(a.submissionId) && a.status === "final");
}

export function assignmentBundle(d: D, assignmentId: string) {
  const assignment = d.assignments.find((a) => a.id === assignmentId);
  const activity = assignment && d.activities.find((x) => x.id === assignment.activityId);
  const rubric = activity && d.rubrics.find((r) => r.id === activity.rubricId);
  const labConfig = activity?.labConfigId ? d.labConfigs.find((c) => c.id === activity.labConfigId) : undefined;
  const lessonPlan = activity && d.lessonPlans.find((p) => p.id === activity.lessonPlanId);
  const klass = assignment && d.classes.find((c) => c.id === assignment.classId);
  return { assignment, activity, rubric, labConfig, lessonPlan, klass };
}
