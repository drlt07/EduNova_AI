/**
 * Số liệu cho trang Tổng quan, Thông báo và Lịch sử hoạt động của giáo viên.
 * Mọi con số tính từ dữ liệu thật đã ghi lại (lớp, bài giao, bài nộp, kết quả mô phỏng/luyện tập), không có số minh họa.
 */
import type { DemoData } from "@/lib/data/seed";
import type { Assignment, ClassRoom, LessonQuestion, SavedItem } from "@/lib/domain/types";
import { bookEntry, type BookEntry } from "@/lib/sgk/book";
import { assignedStudents, classStudents, teacherAssignments, teacherClasses } from "@/lib/store/scoped";
import { assignmentStats, taskOutcome } from "@/lib/teacher/assign";

const DAY_MS = 86_400_000;

/** Dữ liệu mẫu + phần lưu theo phiên (mục đã lưu, hỏi đáp). */
export type OverviewData = DemoData & { saved: SavedItem[]; lessonQA: LessonQuestion[] };

/** Bài chờ chấm: bài nộp chưa chấm + bài mô phỏng AI chấm chưa chắc chắn cần thầy cô duyệt. */
export function pendingCount(d: OverviewData, teacherId: string) {
  const mine = new Set(teacherAssignments(d, teacherId).map((a) => a.id));
  const students = new Set(teacherClasses(d, teacherId).flatMap((c) => classStudents(d, c.id).map((u) => u.id)));
  const subs = d.submissions.filter((s) => s.status === "submitted" && mine.has(s.assignmentId)).length;
  const labs = d.labResults.filter((r) => r.grade?.needsReview && !r.review && students.has(r.studentId)).length;
  return subs + labs;
}

export interface Overview {
  classes: number;
  students: number;
  assigned: number;
  teaching: number;
  pending: number;
  /** Tỉ lệ lượt hoàn thành trên tổng lượt được giao của các bài đang mở (0–100), hoặc null khi chưa giao bài nào. */
  completion: number | null;
}

/** Các bài SGK đang dạy: có bài giao còn mở, hoặc đánh dấu đã dạy trong 21 ngày gần đây. */
export function teachingRefs(d: OverviewData, teacherId: string, now = Date.now()): string[] {
  const open = teacherAssignments(d, teacherId).filter((a) => a.status === "open" && a.sgkRef).map((a) => a.sgkRef!);
  const recent = d.taughtLessons.filter((t) => t.teacherId === teacherId && now - new Date(t.at).getTime() < 21 * DAY_MS).map((t) => t.ref);
  return [...new Set([...open, ...recent])];
}

export function teacherOverview(d: OverviewData, teacherId: string, now = Date.now()): Overview {
  const classes = teacherClasses(d, teacherId);
  const students = new Set(classes.flatMap((c) => classStudents(d, c.id).map((u) => u.id))).size;
  const published = teacherAssignments(d, teacherId).filter((a) => a.status !== "draft");
  const open = published.filter((a) => a.status === "open");
  let done = 0, target = 0;
  for (const a of open) { const s = assignmentStats(d, a); done += s.done; target += s.target; }
  return { classes: classes.length, students, assigned: published.length, teaching: teachingRefs(d, teacherId, now).length, pending: pendingCount(d, teacherId), completion: target ? Math.round((done / target) * 100) : null };
}

export interface ClassProgress { cls: ClassRoom; students: number; done: number; target: number; pct: number | null; open: number }

/** Tiến độ từng lớp: tổng lượt hoàn thành / lượt được giao của các bài đang mở trong lớp. */
export function classProgress(d: OverviewData, teacherId: string): ClassProgress[] {
  return teacherClasses(d, teacherId).map((cls) => {
    const open = teacherAssignments(d, teacherId).filter((a) => a.classId === cls.id && a.status === "open");
    let done = 0, target = 0;
    for (const a of open) { const s = assignmentStats(d, a); done += s.done; target += s.target; }
    return { cls, students: classStudents(d, cls.id).length, done, target, pct: target ? Math.round((done / target) * 100) : null, open: open.length };
  });
}

export interface AssignmentProgress { a: Assignment; cls?: ClassRoom; done: number; target: number; pct: number }

export function assignmentProgress(d: OverviewData, teacherId: string, limit = 6): AssignmentProgress[] {
  return teacherAssignments(d, teacherId)
    .filter((a) => a.status === "open")
    .sort((x, y) => x.dueAt.localeCompare(y.dueAt))
    .slice(0, limit)
    .map((a) => { const s = assignmentStats(d, a); return { a, cls: d.classes.find((c) => c.id === a.classId), done: s.done, target: s.target, pct: s.target ? Math.round((s.done / s.target) * 100) : 0 }; });
}

export interface MyLessons { teaching: BookEntry[]; recent: BookEntry[]; saved: BookEntry[]; toAssign: { e: BookEntry; cls: ClassRoom }[] }

/** "Bài học của tôi": đang dạy, vừa mở, đã lưu và bài đã dạy ở lớp nhưng chưa giao hoạt động nào. */
export function myLessons(d: OverviewData, teacherId: string, now = Date.now()): MyLessons {
  const entry = (ref: string) => bookEntry(ref);
  const defined = <T,>(x: T | undefined): x is T => !!x;
  const teaching = teachingRefs(d, teacherId, now).map(entry).filter(defined);
  const recent = d.bookProgress.filter((p) => p.userId === teacherId).sort((a, b) => b.at.localeCompare(a.at)).slice(0, 6).map((p) => entry(p.ref)).filter(defined);
  const saved = d.saved.filter((s) => s.userId === teacherId && s.key.startsWith("lesson:")).map((s) => entry(s.key.slice(7))).filter(defined);
  const assigned = new Set(teacherAssignments(d, teacherId).filter((a) => a.sgkRef).map((a) => `${a.classId}|${a.sgkRef}`));
  const toAssign = d.taughtLessons
    .filter((t) => t.teacherId === teacherId && !assigned.has(`${t.classId}|${t.ref}`))
    .sort((a, b) => b.at.localeCompare(a.at))
    .flatMap((t) => { const e = entry(t.ref); const cls = d.classes.find((c) => c.id === t.classId); return e && cls ? [{ e, cls }] : []; });
  return { teaching, recent, saved, toAssign };
}

export interface TeacherNotification { id: string; text: string; detail: string; at: string; href: string; tone: "info" | "warning" | "success" }

/** Thông báo của giáo viên: bài nộp mới, mô phỏng cần duyệt, hạn sắp tới còn em chưa làm, câu hỏi mới trong bài học. */
export function teacherNotifications(d: OverviewData, teacherId: string, now = Date.now()): TeacherNotification[] {
  const out: TeacherNotification[] = [];
  const asg = teacherAssignments(d, teacherId);
  const byId = new Map(asg.map((a) => [a.id, a]));
  const name = (id: string) => d.users.find((u) => u.id === id)?.name ?? "Học sinh";
  const clsName = (id: string) => d.classes.find((c) => c.id === id)?.name ?? "";
  for (const s of d.submissions) {
    const a = byId.get(s.assignmentId);
    if (!a || now - new Date(s.submittedAt).getTime() > 14 * DAY_MS) continue;
    out.push({ id: `sub-${s.id}`, text: `${name(s.studentId)} đã nộp “${a.title}”`, detail: `${clsName(a.classId)} · ${s.status === "submitted" ? "chờ chấm" : "đã chấm"}`, at: s.submittedAt, href: s.status === "submitted" ? `/teacher/assessment?assignment=${a.id}` : `/teacher/assignments/${a.id}`, tone: s.status === "submitted" ? "warning" : "info" });
  }
  for (const a of asg.filter((x) => x.task && x.status !== "draft")) {
    for (const u of assignedStudents(d, a)) {
      const o = taskOutcome(d, u.id, a);
      if (!o.done || !o.at || now - new Date(o.at).getTime() > 7 * DAY_MS) continue;
      out.push({ id: `done-${a.id}-${u.id}`, text: `${u.name} đã hoàn thành “${a.title}”`, detail: `${clsName(a.classId)}${o.text ? ` · ${o.text}` : ""}`, at: o.at, href: `/teacher/assignments/${a.id}`, tone: "success" });
    }
  }
  const students = new Set(teacherClasses(d, teacherId).flatMap((c) => classStudents(d, c.id).map((u) => u.id)));
  for (const r of d.labResults.filter((x) => x.grade?.needsReview && !x.review && students.has(x.studentId)))
    out.push({ id: `lab-${r.id}`, text: `Cần duyệt điểm mô phỏng của ${name(r.studentId)}`, detail: "AI chưa chắc chắn ở phần giải thích", at: r.finishedAt, href: "/teacher/assignments#duyet-mo-phong", tone: "warning" });
  for (const a of asg.filter((x) => x.status === "open")) {
    const left = new Date(a.dueAt).getTime() - now;
    if (left <= 0 || left > 2 * DAY_MS) continue;
    const s = assignmentStats(d, a);
    if (s.done >= s.target) continue;
    out.push({ id: `due-${a.id}`, text: `Sắp đến hạn “${a.title}”: còn ${s.target - s.done} em chưa ${a.task ? "làm" : "nộp"}`, detail: `${clsName(a.classId)} · còn ${Math.max(1, Math.round(left / 3_600_000))} giờ`, at: a.dueAt, href: `/teacher/assignments/${a.id}`, tone: "warning" });
  }
  const myClasses = new Set(teacherClasses(d, teacherId).map((c) => c.id));
  for (const q of d.lessonQA.filter((x) => myClasses.has(x.classId) && x.authorId !== teacherId && !x.replies.some((r) => r.authorId === teacherId))) {
    const e = bookEntry(q.ref);
    out.push({ id: `qa-${q.id}`, text: `${name(q.authorId)} hỏi trong Bài ${e?.lesson.no ?? ""}: “${q.text.slice(0, 60)}${q.text.length > 60 ? "…" : ""}”`, detail: `${clsName(q.classId)} · chưa trả lời`, at: q.at, href: `/teacher/sgk/${q.ref}?tab=hoi-dap`, tone: "info" });
  }
  return out.sort((a, b) => b.at.localeCompare(a.at));
}

export interface ClassEvent { id: string; at: string; kind: "assign" | "submit" | "grade" | "done" | "question" | "taught"; text: string; href?: string }

/** Lịch sử hoạt động của một lớp: giao bài, học sinh nộp/hoàn thành, chấm bài, câu hỏi, bài đã dạy. */
export function classHistory(d: OverviewData, classId: string): ClassEvent[] {
  const out: ClassEvent[] = [];
  const asg = d.assignments.filter((a) => a.classId === classId && a.status !== "draft");
  const name = (id: string) => d.users.find((u) => u.id === id)?.name ?? "Học sinh";
  for (const a of asg) {
    out.push({ id: `a-${a.id}`, at: a.publishedAt, kind: "assign", text: `Giao “${a.title}”${a.studentIds ? ` cho ${a.studentIds.length} em` : " cho cả lớp"}`, href: `/teacher/assignments/${a.id}` });
    for (const s of d.submissions.filter((x) => x.assignmentId === a.id)) {
      out.push({ id: `s-${s.id}`, at: s.submittedAt, kind: "submit", text: `${name(s.studentId)} nộp “${a.title}”`, href: `/teacher/assignments/${a.id}` });
      const asm = d.assessments.find((x) => x.submissionId === s.id);
      if (asm) out.push({ id: `g-${asm.id}`, at: asm.updatedAt, kind: "grade", text: `Đã chấm bài của ${name(s.studentId)} — “${a.title}”`, href: `/teacher/assignments/${a.id}` });
    }
    if (a.task)
      for (const u of assignedStudents(d, a)) {
        const o = taskOutcome(d, u.id, a);
        if (o.done && o.at) out.push({ id: `d-${a.id}-${u.id}`, at: o.at, kind: "done", text: `${name(u.id)} hoàn thành “${a.title}”${o.text ? ` (${o.text})` : ""}`, href: `/teacher/assignments/${a.id}` });
      }
  }
  for (const t of d.taughtLessons.filter((x) => x.classId === classId)) {
    const e = bookEntry(t.ref);
    if (e) out.push({ id: `t-${t.ref}-${t.at}`, at: t.at, kind: "taught", text: `Đã dạy Bài ${e.lesson.no}. ${e.lesson.title}`, href: `/teacher/sgk/${t.ref}` });
  }
  for (const q of d.lessonQA.filter((x) => x.classId === classId)) {
    out.push({ id: `q-${q.id}`, at: q.at, kind: "question", text: `${name(q.authorId)} đặt câu hỏi: “${q.text.slice(0, 80)}”`, href: `/teacher/sgk/${q.ref}?tab=hoi-dap` });
  }
  return out.sort((a, b) => b.at.localeCompare(a.at));
}
