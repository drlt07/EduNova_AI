/**
 * Giao nhiệm vụ nhanh: giáo viên chọn thẳng một mô phỏng, bộ câu hỏi hoặc bài code, chọn lớp, chọn hạn theo
 * thời khóa biểu. Máy tự biết em nào đã làm và kết quả ra sao (không cần chấm tay).
 */
import type { Assignment, ClassRoom } from "@/lib/domain/types";
import type { DemoData } from "@/lib/data/seed";
import { fmtScore } from "@/lib/sim/lab-score";
import { assignedStudents } from "@/lib/store/scoped";

export type TaskKind = "lab" | "quiz" | "code";

/** Giờ bắt đầu tiết (buổi sáng 1–5, buổi chiều 6–10). */
const PERIOD_START: Record<number, [number, number]> = {
  1: [7, 0], 2: [7, 50], 3: [8, 45], 4: [9, 40], 5: [10, 30],
  6: [13, 0], 7: [13, 50], 8: [14, 45], 9: [15, 40], 10: [16, 30],
};

const weekdayOf = (d: Date) => ((d.getDay() + 6) % 7) + 1;

/** Giờ vào tiết học kế tiếp của lớp, sau `from` ít nhất `minGapH` giờ. */
export function nextClassTime(c: Pick<ClassRoom, "schedule">, from: Date, minGapH = 1): Date | undefined {
  const earliest = from.getTime() + minGapH * 3_600_000;
  let best: Date | undefined;
  for (let k = 0; k <= 14; k++) {
    const day = new Date(from.getFullYear(), from.getMonth(), from.getDate() + k);
    for (const s of c.schedule) {
      if (s.weekday !== weekdayOf(day)) continue;
      const [h, m] = PERIOD_START[Number(s.period.replace(/\D/g, ""))] ?? [7, 0];
      const at = new Date(day.getFullYear(), day.getMonth(), day.getDate(), h, m);
      if (at.getTime() >= earliest && (!best || at < best)) best = at;
    }
    if (best) return best;
  }
  return best;
}

export type DueChoice = "next" | "tonight" | "sunday" | "custom";

/** Hạn nộp cho một lớp theo lựa chọn nhanh. */
export function dueFor(choice: Exclude<DueChoice, "custom">, c: Pick<ClassRoom, "schedule">, now: Date): Date {
  if (choice === "next") return nextClassTime(c, now) ?? dueFor("sunday", c, now);
  if (choice === "tonight") {
    const t = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 21, 0);
    return t.getTime() - now.getTime() >= 3_600_000 ? t : new Date(t.getTime() + 86_400_000);
  }
  const daysToSunday = (7 - weekdayOf(now)) % 7;
  const t = new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysToSunday, 21, 0);
  return t.getTime() - now.getTime() >= 3_600_000 ? t : new Date(t.getTime() + 7 * 86_400_000);
}

const DAY = ["", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ nhật"];
/** "Thứ 5, 07:00" */
export const fmtDue = (d: Date) => `${DAY[weekdayOf(d)]}, ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;

type D = Pick<DemoData, "labResults" | "practiceAttempts" | "codeWorks">;

export interface TaskOutcome {
  done: boolean;
  /** Kết quả ngắn gọn: "8,5 điểm", "4/5 câu đúng", "Đạt 5/5 test". */
  text?: string;
  /** Tỉ lệ đạt 0..1, để tô màu. */
  ratio?: number;
  at?: string;
  /** Số lần đã làm được tính (sau khi giao, trong giới hạn số lần). */
  used?: number;
}

export const SCORING_LABEL = { best: "Lần cao nhất", last: "Lần gần nhất", first: "Lần đầu" } as const;

/** Chọn lần được tính điểm theo cấu hình bài giao; `items` đã xếp theo thời gian tăng dần. */
function pickScored<T>(items: T[], value: (x: T) => number, a: Pick<Assignment, "maxAttempts" | "scoring">): T {
  const scope = a.maxAttempts ? items.slice(0, a.maxAttempts) : items;
  if (a.scoring === "first") return scope[0];
  if (a.scoring === "last") return scope[scope.length - 1];
  return scope.reduce((x, y) => (value(y) > value(x) ? y : x));
}

/** Kết quả nhiệm vụ của một em: chỉ tính bài làm sau khi giao, trong giới hạn số lần, theo cách tính điểm của bài giao. */
export function taskOutcome(d: D, studentId: string, a: Pick<Assignment, "task" | "publishedAt" | "maxAttempts" | "scoring">): TaskOutcome {
  const t = a.task;
  if (!t) return { done: false };
  const cap = <T,>(xs: T[]) => (a.maxAttempts ? Math.min(xs.length, a.maxAttempts) : xs.length);
  if (t.kind === "lab") {
    const rs = d.labResults.filter((r) => r.studentId === studentId && r.labSlug === t.ref && r.finishedAt >= a.publishedAt).sort((x, y) => x.finishedAt.localeCompare(y.finishedAt));
    if (!rs.length) return { done: false };
    const pick = pickScored(rs, (r) => r.score, a);
    return { done: true, text: `${fmtScore(pick.score)} điểm`, ratio: pick.score / 10, at: pick.finishedAt, used: cap(rs) };
  }
  if (t.kind === "quiz") {
    const rs = d.practiceAttempts.filter((p) => p.studentId === studentId && p.setId === t.ref && p.finishedAt >= a.publishedAt).sort((x, y) => x.finishedAt.localeCompare(y.finishedAt));
    if (!rs.length) return { done: false };
    const score = (p: (typeof rs)[number]) => {
      const sc = p.items.filter((i) => i.status !== "self");
      return { ok: sc.filter((i) => i.status === "correct").length, n: sc.length };
    };
    const pick = pickScored(rs, (p) => { const x = score(p); return x.ok / Math.max(1, x.n); }, a);
    const best = score(pick);
    const counted = a.maxAttempts ? rs.slice(0, a.maxAttempts) : rs;
    const left = Math.max(...counted.map((p) => p.violations ?? 0));
    const auto = pick.autoSubmitted;
    return { done: true, text: `${best.ok}/${best.n} câu đúng${auto ? " · bị nộp tự động vì rời tab" : left ? ` · rời tab ${left} lần` : ""}`, ratio: best.ok / Math.max(1, best.n), at: pick.finishedAt, used: cap(rs) };
  }
  const w = d.codeWorks.find((c) => c.studentId === studentId && c.exerciseId === t.ref);
  if (!w?.lastRun || w.lastRun.at < a.publishedAt) return { done: false };
  const { passed, total } = w.lastRun;
  return { done: passed === total, text: `Đạt ${passed}/${total} test`, ratio: passed / Math.max(1, total), at: w.lastRun.at, used: 1 };
}

/** Còn được làm (và tính điểm) không: chưa đóng và chưa hết số lần. */
export function attemptsLeft(o: TaskOutcome, a: Pick<Assignment, "maxAttempts">): number | undefined {
  return a.maxAttempts ? Math.max(0, a.maxAttempts - (o.used ?? 0)) : undefined;
}

/** Đường dẫn để học sinh làm nhiệm vụ. */
export function taskHref(t: NonNullable<Assignment["task"]>): string {
  if (t.kind === "quiz") return `/student/practice/${t.ref}`;
  if (t.kind === "code") return `/student/code?bai=${t.ref}`;
  return `/labs/${t.ref}`;
}

/** Khóa học mà bài giao thuộc về: giao từ khóa học, hoặc trùng bài SGK của khóa học đã phát hành cho lớp đó. Trống = giao độc lập. */
export function assignmentCourse(d: Pick<DemoData, "courses">, a: Pick<Assignment, "courseId" | "sgkRef" | "classId">) {
  const course = a.courseId ? d.courses.find((c) => c.id === a.courseId) : a.sgkRef ? d.courses.find((c) => c.status === "published" && c.classIds.includes(a.classId) && c.topics.some((t) => t.lessons.some((l) => l.sgkRef === a.sgkRef))) : undefined;
  if (!course) return undefined;
  const lesson = a.sgkRef ? course.topics.flatMap((t) => t.lessons).find((l) => l.sgkRef === a.sgkRef) : undefined;
  return { course, lesson };
}

export type GradeStatus = "graded" | "pending" | "missing" | "late" | "open";
export interface GradeCell { status: GradeStatus; ratio?: number; text?: string; at?: string }

/**
 * Một ô sổ điểm: kết quả của một em ở một bài giao. Bài máy chấm lấy từ kết quả làm bài; bài thầy cô chấm lấy từ
 * phiếu chấm đã chốt (thang theo tổng điểm tối đa của tiêu chí).
 */
export function gradeCell(d: D & Pick<DemoData, "submissions" | "assessments" | "rubrics">, studentId: string, a: Assignment, now: number): GradeCell {
  const overdue = new Date(a.dueAt).getTime() < now;
  if (a.task) {
    const o = taskOutcome(d, studentId, a);
    if (o.text) return { status: "graded", ratio: o.ratio, text: o.text, at: o.at };
    return { status: overdue ? "missing" : "open" };
  }
  const sub = d.submissions.find((s) => s.assignmentId === a.id && s.studentId === studentId);
  if (!sub) return { status: overdue ? "missing" : "open" };
  const late = new Date(sub.submittedAt).getTime() > new Date(a.dueAt).getTime();
  const as = d.assessments.find((x) => x.submissionId === sub.id && x.status === "final");
  if (!as) return { status: late ? "late" : "pending", at: sub.submittedAt, text: "chờ chấm" };
  const rubric = d.rubrics.find((r) => r.id === as.rubricId);
  const max = rubric?.criteria.reduce((n, c) => n + c.maxScore, 0) || 1;
  const got = as.scores.reduce((n, s) => n + s.score, 0);
  return { status: "graded", ratio: got / max, text: `${fmtScore(Math.round((got / max) * 20) / 2)} điểm`, at: sub.submittedAt };
}

export interface AssignmentStats { target: number; done: number; working: number; pending: number; graded: number; weak: string[] }

/** Tình hình một bài giao: số em được giao, đã làm/nộp, chờ chấm, đã chấm, em cần củng cố. */
export function assignmentStats(d: DemoData, a: Assignment): AssignmentStats {
  const students = assignedStudents(d, a);
  if (a.task) {
    const outs = students.map((u) => ({ u, o: taskOutcome(d, u.id, a) }));
    return { target: students.length, done: outs.filter((x) => x.o.done).length, working: outs.filter((x) => !x.o.done && x.o.text).length, pending: 0, graded: 0, weak: outs.filter((x) => !x.o.done || (x.o.ratio ?? 1) < 0.65).map((x) => x.u.id) };
  }
  const subs = d.submissions.filter((s) => s.assignmentId === a.id);
  const graded = subs.filter((s) => s.status === "graded");
  return { target: students.length, done: subs.length, working: d.attempts.filter((x) => x.assignmentId === a.id && x.status !== "submitted").length, pending: subs.length - graded.length, graded: graded.length, weak: students.filter((u) => !subs.some((s) => s.studentId === u.id) || subs.some((s) => s.studentId === u.id && s.testResults.some((r) => !r.pass))).map((u) => u.id) };
}
