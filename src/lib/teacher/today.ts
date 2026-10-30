/**
 * Trang "Hôm nay" của giáo viên: tiết dạy hôm nay và sắp tới (kèm bài SGK dạy tiếp ở mỗi lớp), việc cần làm theo
 * thứ tự ưu tiên, lớp cần chú ý. Tính hoàn toàn từ dữ liệu, không có số liệu cứng.
 */
import type { ClassRoom, Grade } from "@/lib/domain/types";
import type { DemoData } from "@/lib/data/seed";
import { sgkLessonId } from "@/lib/data/sgk-kntt";
import { bookLessons, type BookEntry } from "@/lib/sgk/book";
import { classStudents, teacherAssignments, teacherClasses, assignedStudents } from "@/lib/store/scoped";
import { taskOutcome } from "./assign";

const PERIOD_START: Record<number, [number, number]> = { 1: [7, 0], 2: [7, 50], 3: [8, 45], 4: [9, 40], 5: [10, 30], 6: [13, 0], 7: [13, 50], 8: [14, 45], 9: [15, 40], 10: [16, 30] };
const weekdayOf = (d: Date) => ((d.getDay() + 6) % 7) + 1;

export interface Slot { cls: ClassRoom; at: Date; period: number; room: string; lesson?: BookEntry; planId?: string }

/** Bài SGK dạy tiếp ở một lớp: bài ngay sau bài muộn nhất đã đánh dấu dạy; chưa dạy bài nào thì bài đầu sách. */
export function nextLesson(d: Pick<DemoData, "taughtLessons">, teacherId: string, cls: Pick<ClassRoom, "id" | "grade">): BookEntry | undefined {
  const all = bookLessons(cls.grade as Grade);
  const taught = new Set(d.taughtLessons.filter((t) => t.teacherId === teacherId && t.classId === cls.id).map((t) => t.ref));
  let last = -1;
  all.forEach((e, i) => { if (taught.has(e.ref)) last = i; });
  return all.slice(last + 1).find((e) => !taught.has(e.ref));
}

/** Các tiết dạy trong `days` ngày tới, bắt đầu từ hôm nay (kể cả tiết đã qua trong ngày). */
export function upcomingSlots(d: DemoData, teacherId: string, now: Date, days = 7): Slot[] {
  const out: Slot[] = [];
  for (const cls of teacherClasses(d, teacherId)) {
    const lesson = nextLesson(d, teacherId, cls);
    const lid = lesson && sgkLessonId(lesson.lesson);
    const planId = lid ? d.lessonPlans.find((p) => p.ownerId === teacherId && p.lessonId === lid)?.id : undefined;
    for (let k = 0; k < days; k++) {
      const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() + k);
      for (const s of cls.schedule) {
        if (s.weekday !== weekdayOf(day)) continue;
        const period = Number(s.period.replace(/\D/g, "")) || 1;
        const [h, m] = PERIOD_START[period] ?? [7, 0];
        out.push({ cls, at: new Date(day.getFullYear(), day.getMonth(), day.getDate(), h, m), period, room: s.room, lesson, planId });
      }
    }
  }
  return out.sort((a, b) => a.at.getTime() - b.at.getTime());
}

export const sameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

export type TodoKind = "grade" | "missing" | "prepare";
export interface Todo {
  id: string;
  kind: TodoKind;
  title: string;
  detail: string;
  href?: string;
  /** Tên các em liên quan (chưa nộp…), để mở danh sách ngay tại chỗ. */
  names?: string[];
  urgency: number;
}

/** Việc cần làm, việc gấp nhất trước: hạn sắp hết, bài chờ chấm lâu, tiết sắp tới chưa có KHBD. */
export function todos(d: DemoData, teacherId: string, now: Date): Todo[] {
  const out: Todo[] = [];
  const t = now.getTime();
  for (const a of teacherAssignments(d, teacherId).filter((x) => x.status !== "draft")) {
    const cls = d.classes.find((c) => c.id === a.classId);
    if (!cls) continue;
    const students = assignedStudents(d, a);
    if (!a.task) {
      const pending = d.submissions.filter((s) => s.assignmentId === a.id && s.status === "submitted");
      if (pending.length) out.push({ id: `g-${a.id}`, kind: "grade", title: `Chấm ${pending.length} bài “${a.title}”`, detail: `${cls.name} · bài nộp sớm nhất ${Math.max(0, Math.round((t - Math.min(...pending.map((p) => new Date(p.submittedAt).getTime()))) / 86_400_000))} ngày trước`, href: `/teacher/assessment?assignment=${a.id}`, urgency: 2 + pending.length / 10 });
    }
    if (a.status !== "open") continue;
    const due = new Date(a.dueAt).getTime();
    const hours = (due - t) / 3_600_000;
    if (hours > 48) continue;
    const missing = students.filter((u) => (a.task ? !taskOutcome(d, u.id, a).done : !d.submissions.some((s) => s.assignmentId === a.id && s.studentId === u.id)));
    if (!missing.length) continue;
    out.push({ id: `m-${a.id}`, kind: "missing", title: `${missing.length} em chưa ${a.task ? "làm" : "nộp"} “${a.title}”`, detail: `${cls.name} · ${hours < 0 ? "đã quá hạn" : `còn ${Math.max(1, Math.round(hours))} giờ`}`, names: missing.map((u) => u.name), href: "/teacher/assignments", urgency: hours < 0 ? 3.5 : 3 });
  }
  const ids = new Set(teacherClasses(d, teacherId).flatMap((c) => classStudents(d, c.id).map((u) => u.id)));
  const toReview = d.labResults.filter((r) => r.grade?.needsReview && !r.review && ids.has(r.studentId));
  if (toReview.length) out.push({ id: "lab-review", kind: "grade", title: `Xem lại ${toReview.length} bài mô phỏng AI đã chấm`, detail: "AI chưa chắc chắn ở phần giải thích; điểm đang là điểm tạm", href: "/teacher/assignments#duyet-mo-phong", urgency: 2.2 });
  const seen = new Set<string>();
  for (const s of upcomingSlots(d, teacherId, now, 3)) {
    if (s.at.getTime() < t || !s.lesson || s.planId || seen.has(s.cls.id)) continue;
    seen.add(s.cls.id);
    const lid = sgkLessonId(s.lesson.lesson);
    out.push({ id: `p-${s.cls.id}`, kind: "prepare", title: `Chuẩn bị Bài ${s.lesson.lesson.no}. ${s.lesson.lesson.title}`, detail: `${s.cls.name} · ${sameDay(s.at, now) ? "hôm nay" : `${["CN", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"][s.at.getDay()]}`} tiết ${s.period} · chưa có KHBD`, href: lid ? `/teacher/lesson-planner/assistant?lesson=${lid}` : `/teacher/sgk/${s.lesson.ref}`, urgency: sameDay(s.at, now) ? 2.5 : 1.5 });
  }
  return out.sort((a, b) => b.urgency - a.urgency);
}

export interface ClassHealth {
  cls: ClassRoom;
  students: number;
  doneRate: number;
  /** Tổng lượt được giao (bài × học sinh); 0 = lớp chưa có bài giao. */
  assigned: number;
  missing: number;
  avgLab?: number;
  taught: number;
  flag?: string;
}

/** Tình hình từng lớp: tỉ lệ hoàn thành nhiệm vụ, số lượt chưa làm, điểm mô phỏng TB, bài đã dạy. */
export function classHealth(d: DemoData, teacherId: string): ClassHealth[] {
  return teacherClasses(d, teacherId).map((cls) => {
    const students = classStudents(d, cls.id);
    const asg = teacherAssignments(d, teacherId).filter((a) => a.classId === cls.id && a.status !== "draft");
    let expected = 0, done = 0;
    for (const a of asg) for (const u of students) { expected++; if (a.task ? taskOutcome(d, u.id, a).done : d.submissions.some((s) => s.assignmentId === a.id && s.studentId === u.id)) done++; }
    const labs = d.labResults.filter((r) => students.some((u) => u.id === r.studentId));
    const avgLab = labs.length ? Math.round((labs.reduce((s, r) => s + r.score, 0) / labs.length) * 10) / 10 : undefined;
    const doneRate = expected ? Math.round((done / expected) * 100) : 100;
    const flag = expected && doneRate < 70 ? `chỉ ${doneRate}% lượt nhiệm vụ đã xong` : avgLab !== undefined && avgLab < 7 ? `điểm mô phỏng TB ${avgLab}` : undefined;
    return { cls, students: students.length, doneRate, assigned: expected, missing: expected - done, avgLab, taught: d.taughtLessons.filter((t) => t.teacherId === teacherId && t.classId === cls.id).length, flag };
  });
}
