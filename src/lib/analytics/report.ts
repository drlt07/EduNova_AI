/**
 * Báo cáo kết quả học tập để ra quyết định: chỉ số có định nghĩa rõ, đi sâu lớp → bài → mục tiêu → học sinh,
 * lỗi phổ biến gắn với mục SGK, nhóm cần hỗ trợ, trước/sau khi làm lại, báo cáo ngắn.
 */
import type { DemoData } from "@/lib/data/seed";
import type { User } from "@/lib/domain/types";
import { getObjective, LESSONS } from "@/lib/data/curriculum";
import { sgkRefForKey } from "@/lib/data/sgk-kntt";
import { getLabBySlug } from "@/lib/data/labs";
import { bookEntry } from "@/lib/sgk/book";
import { diagnose, ERROR_PATTERN_LABELS } from "@/lib/sim/smart-garden";
import { fmtScore } from "@/lib/sim/lab-score";
import { assignedStudents, classStudents, teacherAssignments, teacherClasses } from "@/lib/store/scoped";
import { taskOutcome } from "@/lib/teacher/assign";

type D = DemoData;

export const METRIC_HELP = {
  submit: "Bài đã nộp ÷ số lượt được giao, chỉ tính nhiệm vụ thầy cô chấm (hoạt động tự thiết kế).",
  complete: "Lượt đã xong ÷ số lượt được giao, tính mọi nhiệm vụ: nộp bài, làm xong mô phỏng, bộ câu hỏi, đạt mọi test code.",
  graded: "Bài đã chấm ÷ bài đã nộp (nhiệm vụ thầy cô chấm).",
  mastery: "Tổng điểm đạt ÷ tổng điểm tối đa của các tiêu chí gắn với yêu cầu cần đạt, chỉ tính bài đã chấm chính thức.",
} as const;

export interface Scope { classId?: string }

function scopeAsg(d: D, teacherId: string, s: Scope) {
  return teacherAssignments(d, teacherId).filter((a) => a.status !== "draft" && (!s.classId || a.classId === s.classId));
}
function scopeStudents(d: D, teacherId: string, s: Scope): User[] {
  const cls = teacherClasses(d, teacherId).filter((c) => !s.classId || c.id === s.classId);
  return [...new Map(cls.flatMap((c) => classStudents(d, c.id)).map((u) => [u.id, u])).values()];
}

export interface Row { student: User; assignment: string; state: "done" | "submitted" | "missing"; detail?: string }

/** Các lượt (em × nhiệm vụ) phía sau chỉ số hoàn thành, để giáo viên xem danh sách. */
export function completionRows(d: D, teacherId: string, s: Scope): Row[] {
  const out: Row[] = [];
  for (const a of scopeAsg(d, teacherId, s)) for (const u of assignedStudents(d, a)) {
    if (a.task) { const o = taskOutcome(d, u.id, a); out.push({ student: u, assignment: a.title, state: o.done ? "done" : "missing", detail: o.text }); }
    else { const sub = d.submissions.find((x) => x.assignmentId === a.id && x.studentId === u.id); out.push({ student: u, assignment: a.title, state: sub ? (sub.status === "graded" ? "done" : "submitted") : "missing", detail: sub ? (sub.status === "graded" ? "đã chấm" : "chờ chấm") : undefined }); }
  }
  return out;
}

export function metrics(d: D, teacherId: string, s: Scope) {
  const manual = scopeAsg(d, teacherId, s).filter((a) => !a.task);
  let expected = 0, submitted = 0, graded = 0;
  for (const a of manual) {
    const st = assignedStudents(d, a);
    expected += st.length;
    const subs = d.submissions.filter((x) => x.assignmentId === a.id && st.some((u) => u.id === x.studentId));
    submitted += subs.length;
    graded += subs.filter((x) => x.status === "graded").length;
  }
  const rows = completionRows(d, teacherId, s);
  const done = rows.filter((r) => r.state !== "missing").length;
  const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0);
  return { submit: { value: pct(submitted, expected), of: `${submitted}/${expected}` }, complete: { value: pct(done, rows.length), of: `${done}/${rows.length}` }, graded: { value: pct(graded, submitted), of: `${graded}/${submitted}` } };
}

export interface ObjectiveRow { objectiveId: string; description: string; mastery: number; samples: number; lessonRef?: string; lessonTitle?: string; students: { student: User; pct: number }[] }

/** Mức đạt theo yêu cầu cần đạt, kèm bài SGK và điểm từng em (từ bài chấm chính thức). */
export function objectiveRows(d: D, teacherId: string, s: Scope): ObjectiveRow[] {
  const asg = new Set(scopeAsg(d, teacherId, s).map((a) => a.id));
  const acc = new Map<string, Map<string, { got: number; max: number }>>();
  for (const sub of d.submissions.filter((x) => asg.has(x.assignmentId))) {
    const a = d.assessments.find((x) => x.submissionId === sub.id && x.status === "final");
    const rubric = a && d.rubrics.find((r) => r.id === a.rubricId);
    if (!a || !rubric) continue;
    for (const sc of a.scores) {
      const c = rubric.criteria.find((x) => x.id === sc.criterionId);
      if (!c) continue;
      const m = acc.get(c.objectiveId) ?? new Map();
      const cur = m.get(sub.studentId) ?? { got: 0, max: 0 };
      m.set(sub.studentId, { got: cur.got + sc.score, max: cur.max + c.maxScore });
      acc.set(c.objectiveId, m);
    }
  }
  return [...acc.entries()].map(([objectiveId, m]) => {
    const lesson = LESSONS.find((l) => l.textbookId === "kntt" && l.objectiveIds.includes(objectiveId));
    const ref = lesson ? sgkRefForKey(lesson.key) : undefined;
    const e = ref ? bookEntry(ref) : undefined;
    const got = [...m.values()].reduce((x, v) => x + v.got, 0), max = [...m.values()].reduce((x, v) => x + v.max, 0);
    return {
      objectiveId, description: getObjective(objectiveId)?.description ?? objectiveId, mastery: max ? Math.round((got / max) * 100) : 0, samples: m.size,
      lessonRef: ref, lessonTitle: e ? `Bài ${e.lesson.no}. ${e.lesson.title}` : undefined,
      students: [...m.entries()].map(([id, v]) => ({ student: d.users.find((u) => u.id === id)!, pct: v.max ? Math.round((v.got / v.max) * 100) : 0 })).filter((x) => x.student).sort((x, y) => x.pct - y.pct),
    };
  }).sort((a, b) => a.mastery - b.mastery);
}

/** Lỗi phổ biến (từ kiểm thử bài nộp) và mục SGK nên ôn lại. */
const PATTERN_SGK: Record<string, { ref: string; section: string }> = {
  boundary: { ref: "10-19", section: "kiem-thu" },
  "no-water": { ref: "10-19", section: "ket-hop" },
  logic: { ref: "10-19", section: "dieu-kien" },
  extreme: { ref: "10-30", section: "bo-test" },
};
export function errorRows(d: D, teacherId: string, s: Scope) {
  const asg = new Set(scopeAsg(d, teacherId, s).map((a) => a.id));
  const m = new Map<string, User[]>();
  for (const sub of d.submissions.filter((x) => asg.has(x.assignmentId))) for (const p of diagnose(sub.testResults)) {
    const u = d.users.find((x) => x.id === sub.studentId);
    if (u) m.set(p, [...(m.get(p) ?? []), u]);
  }
  return [...m.entries()].map(([key, students]) => {
    const link = PATTERN_SGK[key];
    const e = link && bookEntry(link.ref);
    const section = e?.content?.sections.find((x) => x.id === link.section);
    return { key, label: ERROR_PATTERN_LABELS[key] ?? key, students, sgk: link && e ? { ref: link.ref, section: link.section, title: `Bài ${e.lesson.no}, mục “${section?.title ?? link.section}”` } : undefined };
  }).sort((a, b) => b.students.length - a.students.length);
}

export interface SupportGroup { id: "missing" | "gap" | "lab"; title: string; why: string; students: { student: User; note: string }[] }

/** Nhóm học sinh cần hỗ trợ: chưa nộp nhiều, hổng kiến thức, điểm mô phỏng thấp. */
export function supportGroups(d: D, teacherId: string, s: Scope): SupportGroup[] {
  const students = scopeStudents(d, teacherId, s);
  const rows = completionRows(d, teacherId, s);
  const objs = objectiveRows(d, teacherId, s);
  const missing = students.map((u) => ({ student: u, n: rows.filter((r) => r.student.id === u.id && r.state === "missing").length })).filter((x) => x.n >= 1).sort((a, b) => b.n - a.n);
  const gap = students.map((u) => ({ student: u, weak: objs.filter((o) => o.students.some((x) => x.student.id === u.id && x.pct < 70)) })).filter((x) => x.weak.length);
  const lab = students.map((u) => {
    const rs = d.labResults.filter((r) => r.studentId === u.id);
    const best = new Map<string, number>();
    for (const r of rs) best.set(r.labSlug, Math.max(best.get(r.labSlug) ?? 0, r.score));
    return { student: u, low: [...best.entries()].filter(([, v]) => v < 7) };
  }).filter((x) => x.low.length);
  return [
    { id: "missing" as const, title: "Chưa hoàn thành nhiệm vụ", why: "Còn nhiệm vụ chưa nộp hoặc chưa làm xong.", students: missing.map((x) => ({ student: x.student, note: `${x.n} nhiệm vụ` })) },
    { id: "gap" as const, title: "Hổng yêu cầu cần đạt", why: "Đạt dưới 70% ở ít nhất một yêu cầu cần đạt trong bài đã chấm.", students: gap.map((x) => ({ student: x.student, note: x.weak.map((o) => `${o.students.find((y) => y.student.id === x.student.id)!.pct}%`).join(", ") })) },
    { id: "lab" as const, title: "Điểm mô phỏng thấp", why: "Điểm cao nhất dưới 7 ở ít nhất một mô phỏng.", students: lab.map((x) => ({ student: x.student, note: x.low.map(([slug, v]) => `${getLabBySlug(slug)?.title ?? slug} ${fmtScore(v)}`).join(", ") })) },
  ].filter((g) => g.students.length);
}

/** Trước/sau khi làm lại mô phỏng: lần đầu so với lần tốt nhất của cùng em, cùng mô phỏng. */
export function labRetries(d: D, teacherId: string, s: Scope) {
  const ids = new Set(scopeStudents(d, teacherId, s).map((u) => u.id));
  const by = new Map<string, number[]>();
  for (const r of [...d.labResults].filter((x) => ids.has(x.studentId)).sort((a, b) => a.finishedAt.localeCompare(b.finishedAt))) by.set(`${r.studentId}|${r.labSlug}`, [...(by.get(`${r.studentId}|${r.labSlug}`) ?? []), r.score]);
  const pairs = [...by.values()].filter((v) => v.length >= 2);
  if (!pairs.length) return null;
  const avg = (xs: number[]) => Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 10) / 10;
  return { pairs: pairs.length, before: avg(pairs.map((v) => v[0])), after: avg(pairs.map((v) => Math.max(...v))) };
}

/** Báo cáo ngắn, đọc trong một phút, dán được vào sổ hay nhóm chuyên môn. */
export function shortReport(d: D, teacherId: string, s: Scope): string[] {
  const m = metrics(d, teacherId, s);
  const objs = objectiveRows(d, teacherId, s);
  const errs = errorRows(d, teacherId, s);
  const groups = supportGroups(d, teacherId, s);
  const cls = s.classId ? d.classes.find((c) => c.id === s.classId)?.name : "Các lớp";
  const lines = [`${cls}: hoàn thành ${m.complete.value}% lượt nhiệm vụ (${m.complete.of}); bài thầy cô chấm đã nộp ${m.submit.value}%, đã chấm ${m.graded.value}%.`];
  if (objs.length) lines.push(`Yêu cầu cần đạt yếu nhất: “${objs[0].description}” đạt ${objs[0].mastery}%${objs[0].lessonTitle ? ` (${objs[0].lessonTitle})` : ""}.`);
  if (errs.length) lines.push(`Lỗi gặp nhiều nhất: ${errs[0].label.toLowerCase()} (${errs[0].students.length} bài)${errs[0].sgk ? `; ôn lại ${errs[0].sgk.title}` : ""}.`);
  for (const g of groups) lines.push(`${g.title}: ${g.students.map((x) => x.student.name).join(", ")}.`);
  return lines;
}
