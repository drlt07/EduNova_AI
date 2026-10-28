/**
 * Giao nhiệm vụ nhanh: giáo viên chọn thẳng một mô phỏng, bộ câu hỏi hoặc bài code, chọn lớp, chọn hạn theo
 * thời khóa biểu. Máy tự biết em nào đã làm và kết quả ra sao (không cần chấm tay).
 */
import type { Assignment, ClassRoom } from "@/lib/domain/types";
import type { DemoData } from "@/lib/data/seed";
import { fmtScore } from "@/lib/sim/lab-score";

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
}

/** Kết quả nhiệm vụ của một em, chỉ tính bài làm sau khi giao. */
export function taskOutcome(d: D, studentId: string, a: Pick<Assignment, "task" | "publishedAt">): TaskOutcome {
  const t = a.task;
  if (!t) return { done: false };
  if (t.kind === "lab") {
    const rs = d.labResults.filter((r) => r.studentId === studentId && r.labSlug === t.ref && r.finishedAt >= a.publishedAt);
    if (!rs.length) return { done: false };
    const best = rs.reduce((x, y) => (y.score > x.score ? y : x));
    return { done: true, text: `${fmtScore(best.score)} điểm`, ratio: best.score / 10, at: best.finishedAt };
  }
  if (t.kind === "quiz") {
    const rs = d.practiceAttempts.filter((p) => p.studentId === studentId && p.setId === t.ref && p.finishedAt >= a.publishedAt);
    if (!rs.length) return { done: false };
    const score = (p: (typeof rs)[number]) => {
      const sc = p.items.filter((i) => i.status !== "self");
      return { ok: sc.filter((i) => i.status === "correct").length, n: sc.length };
    };
    const best = rs.map(score).reduce((x, y) => (y.ok / Math.max(1, y.n) > x.ok / Math.max(1, x.n) ? y : x));
    return { done: true, text: `${best.ok}/${best.n} câu đúng`, ratio: best.ok / Math.max(1, best.n), at: rs[0].finishedAt };
  }
  const w = d.codeWorks.find((c) => c.studentId === studentId && c.exerciseId === t.ref);
  if (!w?.lastRun || w.lastRun.at < a.publishedAt) return { done: false };
  const { passed, total } = w.lastRun;
  return { done: passed === total, text: `Đạt ${passed}/${total} test`, ratio: passed / Math.max(1, total), at: w.lastRun.at };
}

/** Đường dẫn để học sinh làm nhiệm vụ. */
export function taskHref(t: NonNullable<Assignment["task"]>): string {
  if (t.kind === "quiz") return `/student/practice/${t.ref}`;
  if (t.kind === "code") return `/student/code?bai=${t.ref}`;
  return `/labs/${t.ref}`;
}
