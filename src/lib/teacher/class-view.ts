/**
 * Dữ liệu cho trang chi tiết lớp: tiến độ dạy theo SGK, trạng thái từng em với từng nhiệm vụ, hồ sơ học tập một em.
 */
import type { Assignment, ClassRoom, Grade } from "@/lib/domain/types";
import type { DemoData } from "@/lib/data/seed";
import { getObjective, LESSONS } from "@/lib/data/curriculum";
import { sgkRefForKey } from "@/lib/data/sgk-kntt";
import { bookLessons } from "@/lib/sgk/book";
import { diagnose, ERROR_PATTERN_LABELS } from "@/lib/sim/smart-garden";
import { getLabBySlug } from "@/lib/data/labs";
import { studentMastery } from "@/lib/store/student";
import { taskOutcome } from "./assign";

/** Bài SGK (bộ KNTT) gắn với một yêu cầu cần đạt, để giao bài củng cố. */
export function refForObjective(objectiveId?: string): string | undefined {
  const l = objectiveId ? LESSONS.find((x) => x.textbookId === "kntt" && x.objectiveIds.includes(objectiveId)) : undefined;
  return l ? sgkRefForKey(l.key) : undefined;
}

export type CellStatus = "not-joined" | "not-assigned" | "done" | "working" | "late" | "todo";

export const CELL_LABEL: Record<CellStatus, string> = {
  "not-joined": "Chưa tham gia lớp",
  "not-assigned": "Không được giao",
  done: "Đã xong",
  working: "Đang làm",
  late: "Quá hạn, chưa nộp",
  todo: "Chưa nộp",
};

export function cellStatus(d: DemoData, a: Assignment, studentId: string, now = Date.now()): { status: CellStatus; text?: string } {
  const en = d.enrollments.find((e) => e.classId === a.classId && e.studentId === studentId);
  if (en?.status === "invited") return { status: "not-joined" };
  if (a.studentIds && !a.studentIds.includes(studentId)) return { status: "not-assigned" };
  if (a.task) {
    const o = taskOutcome(d, studentId, a);
    if (o.done) return { status: "done", text: o.text };
    if (o.text) return { status: "working", text: o.text };
  } else {
    const sub = d.submissions.find((s) => s.assignmentId === a.id && s.studentId === studentId);
    if (sub) {
      const asm = d.assessments.find((x) => x.submissionId === sub.id && x.status === "final");
      return { status: "done", text: asm ? `${asm.scores.reduce((s, x) => s + x.score, 0)} điểm` : "chờ chấm" };
    }
    if (d.attempts.some((x) => x.assignmentId === a.id && x.studentId === studentId && x.status !== "submitted")) return { status: "working" };
  }
  return { status: new Date(a.dueAt).getTime() < now ? "late" : "todo" };
}

/** Tiến độ dạy theo từng chủ đề của sách khối lớp. */
export function teachingProgress(d: Pick<DemoData, "taughtLessons">, teacherId: string, cls: Pick<ClassRoom, "id" | "grade">) {
  const all = bookLessons(cls.grade as Grade);
  const taught = new Set(d.taughtLessons.filter((t) => t.teacherId === teacherId && t.classId === cls.id).map((t) => t.ref));
  const topics = [...new Map(all.map((e) => [e.topic.no, e.topic])).values()].map((t) => {
    const ls = all.filter((e) => e.topic.no === t.no);
    return { topic: t, total: ls.length, taught: ls.filter((e) => taught.has(e.ref)).length };
  });
  return { total: all.length, taught: taught.size, topics };
}

export interface Weakness { label: string; why: string; ref?: string; objectiveId?: string }

/** Hồ sơ một em trong lớp: kết quả từng nhiệm vụ, điểm mô phỏng, điều cần củng cố (kèm bài SGK để giao lại). */
export function studentProfile(d: DemoData, studentId: string, classId: string) {
  const asg = d.assignments.filter((a) => a.classId === classId);
  const tasks = asg.map((a) => ({ a, ...cellStatus(d, a, studentId) }));
  const labs = d.labResults.filter((r) => r.studentId === studentId).sort((x, y) => y.finishedAt.localeCompare(x.finishedAt));
  const weak: Weakness[] = [];
  const refFor = refForObjective;
  for (const m of studentMastery(d, studentId)) if (m.mastery < 70) weak.push({ label: getObjective(m.objectiveId)?.description ?? m.objectiveId, why: `đạt ${m.mastery}% qua ${m.samples} lần chấm`, objectiveId: m.objectiveId, ref: refFor(m.objectiveId) });
  const patterns = new Set(d.submissions.filter((s) => s.studentId === studentId && asg.some((a) => a.id === s.assignmentId)).flatMap((s) => diagnose(s.testResults)));
  const P_OBJ: Record<string, string> = { boundary: "O10-F-04", "no-water": "O10-F-03", logic: "O10-F-02", extreme: "O10-F-04" };
  for (const p of patterns) if (!weak.some((w) => w.label === ERROR_PATTERN_LABELS[p])) weak.push({ label: ERROR_PATTERN_LABELS[p], why: "gặp trong bài nộp", objectiveId: P_OBJ[p], ref: refFor(P_OBJ[p]) });
  const bestLab = new Map<string, number>();
  for (const r of labs) bestLab.set(r.labSlug, Math.max(bestLab.get(r.labSlug) ?? 0, r.score));
  for (const [slug, score] of bestLab) if (score < 7) weak.push({ label: `Mô phỏng ${getLabBySlug(slug)?.title ?? slug}`, why: `điểm cao nhất ${String(score).replace(".", ",")}`, ref: undefined });
  const read = d.bookProgress.filter((p) => p.userId === studentId);
  return { tasks, labs, weak, read, done: tasks.filter((t) => t.status === "done").length, open: tasks.filter((t) => t.status === "todo" || t.status === "late" || t.status === "working").length };
}
