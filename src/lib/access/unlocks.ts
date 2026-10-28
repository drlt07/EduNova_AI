/**
 * Giáo viên mở dần nội dung cho từng lớp: bài học (nội dung + mô phỏng), bộ luyện tập, bài lập trình.
 * Học sinh chỉ thấy phần lớp mình đã được mở; giáo viên luôn thấy hết.
 */
import type { DemoData } from "@/lib/data/seed";
import { CODING_EXERCISES } from "@/lib/data/coding-exercises";
import { setsForLesson } from "@/lib/data/practice";
import { SGK_KNTT, sgkRef } from "@/lib/data/sgk-kntt";
import { studentClassIds } from "@/lib/store/scoped";
import type { Grade } from "@/lib/domain/types";

export interface Unlock { classId: string; key: string; by: string; at: string }

export const lessonKey = (ref: string) => `bai:${ref}`;
export const setKey = (id: string) => `bo:${id}`;
export const codeKey = (id: string) => `code:${id}`;

type D = Pick<DemoData, "unlocks" | "enrollments" | "assignments" | "teacherQuizzes">;

export function classUnlocks(d: Pick<DemoData, "unlocks">, classId: string): Set<string> {
  return new Set(d.unlocks.filter((u) => u.classId === classId).map((u) => u.key));
}

/** Mọi khóa học sinh được mở qua các lớp em học, cộng nội dung thầy cô đã giao thẳng (nhiệm vụ). */
export function studentUnlocks(d: D, studentId: string): Set<string> {
  const mine = studentClassIds(d as DemoData, studentId);
  const keys = new Set(d.unlocks.filter((u) => mine.includes(u.classId)).map((u) => u.key));
  for (const a of d.assignments) {
    if (!mine.includes(a.classId) || a.status === "draft" || (a.studentIds && !a.studentIds.includes(studentId)) || !a.task) continue;
    keys.add(a.task.kind === "quiz" ? setKey(a.task.ref) : a.task.kind === "code" ? codeKey(a.task.ref) : `lab:${a.task.ref}`);
    if (a.sgkRef) keys.add(lessonKey(a.sgkRef));
  }
  return keys;
}

/** Các bài theo thứ tự mục lục của một khối lớp. */
export function gradeLessons(grade: Grade) {
  return SGK_KNTT[grade].flatMap((t) => t.lessons.map((l) => ({ ref: sgkRef(grade, l), topic: t, lesson: l })));
}

/** Nội dung mở được của một bài: bộ luyện tập và bài lập trình gắn với bài. */
export function lessonItems(ref: string, key?: string) {
  return {
    sets: setsForLesson(ref, key),
    code: key ? CODING_EXERCISES.filter((x) => x.lessonKey === key) : [],
  };
}

/** Bài đầu tiên chưa mở theo thứ tự mục lục. */
export function nextLockedLesson(d: Pick<DemoData, "unlocks">, classId: string, grade: Grade) {
  const open = classUnlocks(d, classId);
  return gradeLessons(grade).find((x) => !open.has(lessonKey(x.ref)));
}
