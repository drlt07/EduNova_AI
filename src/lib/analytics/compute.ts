/**
 * Learning analytics — tính hoàn toàn từ dữ liệu trong repository (không có số liệu cứng).
 */
import type { DemoData } from "@/lib/data/seed";
import { getObjective } from "@/lib/data/curriculum";
import { diagnose, ERROR_PATTERN_LABELS } from "@/lib/sim/smart-garden";
import { classStudents, teacherAssignments, teacherSubmissions } from "@/lib/store/scoped";
import { pct } from "@/lib/utils";

type D = DemoData;

export interface ObjectiveMastery {
  objectiveId: string;
  description: string;
  mastery: number; // 0..100
  samples: number;
}

export interface AnalyticsFilter {
  classId?: string;
  assignmentId?: string;
}

export function scopedAssignments(d: D, teacherId: string, f: AnalyticsFilter = {}) {
  return teacherAssignments(d, teacherId).filter((a) => (!f.classId || a.classId === f.classId) && (!f.assignmentId || a.id === f.assignmentId));
}

export function objectiveMastery(d: D, teacherId: string, f: AnalyticsFilter = {}): ObjectiveMastery[] {
  const asg = new Set(scopedAssignments(d, teacherId, f).map((a) => a.id));
  const subs = new Map(teacherSubmissions(d, teacherId).filter((s) => asg.has(s.assignmentId)).map((s) => [s.id, s]));
  const acc = new Map<string, { got: number; max: number; n: number }>();
  for (const a of d.assessments) {
    if (a.status !== "final" || !subs.has(a.submissionId)) continue;
    const rubric = d.rubrics.find((r) => r.id === a.rubricId);
    if (!rubric) continue;
    for (const s of a.scores) {
      const c = rubric.criteria.find((x) => x.id === s.criterionId);
      if (!c) continue;
      const cur = acc.get(c.objectiveId) ?? { got: 0, max: 0, n: 0 };
      acc.set(c.objectiveId, { got: cur.got + s.score, max: cur.max + c.maxScore, n: cur.n + 1 });
    }
  }
  return [...acc.entries()]
    .map(([objectiveId, v]) => ({ objectiveId, description: getObjective(objectiveId)?.description ?? objectiveId, mastery: pct(v.got, v.max), samples: v.n }))
    .sort((a, b) => a.objectiveId.localeCompare(b.objectiveId));
}

export function completion(d: D, teacherId: string, f: AnalyticsFilter = {}) {
  // Nhiệm vụ máy chấm (mô phỏng, câu hỏi, code) không có bài nộp; kết quả xem ở taskOutcome.
  const assignments = scopedAssignments(d, teacherId, f).filter((a) => !a.task);
  let expected = 0;
  let submitted = 0;
  let graded = 0;
  for (const a of assignments) {
    const students = classStudents(d, a.classId);
    expected += students.length;
    const subs = d.submissions.filter((s) => s.assignmentId === a.id && students.some((u) => u.id === s.studentId));
    submitted += subs.length;
    graded += subs.filter((s) => s.status === "graded").length;
  }
  return { expected, submitted, graded, rate: pct(submitted, expected), gradedRate: pct(graded, submitted) };
}

export function errorPatterns(d: D, teacherId: string, f: AnalyticsFilter = {}) {
  const asg = new Set(scopedAssignments(d, teacherId, f).map((a) => a.id));
  const subs = teacherSubmissions(d, teacherId).filter((s) => asg.has(s.assignmentId));
  const counts: Record<string, number> = {};
  for (const s of subs) for (const p of diagnose(s.testResults)) counts[p] = (counts[p] ?? 0) + 1;
  return Object.entries(ERROR_PATTERN_LABELS).map(([key, label]) => ({ key, label, count: counts[key] ?? 0, share: pct(counts[key] ?? 0, subs.length) }));
}

export function attemptStats(d: D, teacherId: string, f: AnalyticsFilter = {}) {
  const asg = new Set(scopedAssignments(d, teacherId, f).map((a) => a.id));
  const attempts = d.attempts.filter((a) => a.assignmentId && asg.has(a.assignmentId));
  const perAttempt = attempts.map((a) => {
    const ev = d.events.filter((e) => e.attemptId === a.id);
    return { attemptId: a.id, studentId: a.studentId, runs: ev.filter((e) => e.type === "run").length, tests: ev.filter((e) => e.type === "test").length };
  });
  const totalRuns = perAttempt.reduce((s, x) => s + x.runs, 0);
  const buckets = [
    { label: "0–2 lần chạy", count: perAttempt.filter((x) => x.runs <= 2).length },
    { label: "3–5 lần chạy", count: perAttempt.filter((x) => x.runs >= 3 && x.runs <= 5).length },
    { label: "6+ lần chạy", count: perAttempt.filter((x) => x.runs >= 6).length },
  ];
  const tested = perAttempt.filter((x) => x.tests > 0).length;
  return { attempts: perAttempt.length, avgRuns: perAttempt.length ? Math.round((totalRuns / perAttempt.length) * 10) / 10 : 0, testedShare: pct(tested, perAttempt.length), buckets };
}

/**
 * Before/after: chỉ có khi một học sinh có ≥2 đánh giá final trên cùng mục tiêu ở các assignment khác nhau.
 * Không đủ dữ liệu → trả về null, UI phải hiển thị "chưa đủ dữ liệu".
 */
export function beforeAfter(d: D, teacherId: string, f: AnalyticsFilter = {}) {
  const asg = new Set(scopedAssignments(d, teacherId, { classId: f.classId }).map((a) => a.id));
  const subs = teacherSubmissions(d, teacherId).filter((s) => asg.has(s.assignmentId));
  const byStudentObj = new Map<string, { at: string; ratio: number }[]>();
  for (const s of subs) {
    const a = d.assessments.find((x) => x.submissionId === s.id && x.status === "final");
    const rubric = a && d.rubrics.find((r) => r.id === a.rubricId);
    if (!a || !rubric) continue;
    for (const sc of a.scores) {
      const c = rubric.criteria.find((x) => x.id === sc.criterionId);
      if (!c) continue;
      const key = `${s.studentId}|${c.objectiveId}`;
      byStudentObj.set(key, [...(byStudentObj.get(key) ?? []), { at: s.submittedAt, ratio: sc.score / c.maxScore }]);
    }
  }
  const pairs = [...byStudentObj.values()].filter((v) => v.length >= 2).map((v) => v.sort((x, y) => x.at.localeCompare(y.at)));
  if (pairs.length === 0) return null;
  const before = pct(pairs.reduce((s, v) => s + v[0].ratio, 0), pairs.length);
  const after = pct(pairs.reduce((s, v) => s + v[v.length - 1].ratio, 0), pairs.length);
  return { pairs: pairs.length, before, after };
}

export interface RefinementSuggestion {
  id: string;
  trigger: string;
  suggestion: string;
  objectiveId?: string;
}

export interface RefinementInput {
  patterns: { key: string; share: number }[];
  mastery: { objectiveId: string; mastery: number; samples: number }[];
  attempts: number;
  testedShare: number;
}

/** Learning Analyst (luật, chạy được cả ở server agent): đề xuất cải tiến KHBD — giáo viên duyệt trước khi áp dụng. */
export function suggestRefinements(input: RefinementInput): RefinementSuggestion[] {
  const out: RefinementSuggestion[] = [];
  const share = (k: string) => input.patterns.find((x) => x.key === k)?.share ?? 0;
  if (share("boundary") >= 20)
    out.push({ id: "sg-boundary", trigger: `${share("boundary")}% bài nộp sai ở giá trị biên`, suggestion: "Thêm hoạt động Luyện tập 5 phút: so sánh humidity < 40 và humidity <= 40 tại 39, 40, 41 trước khi viết điều kiện.", objectiveId: "O10-F-04" });
  if (share("no-water") >= 20)
    out.push({ id: "sg-water", trigger: `${share("no-water")}% bài nộp quên kiểm tra bình nước`, suggestion: "Ở pha Hình thành kiến thức, đặt câu hỏi gợi mở: 'Nếu bình hết nước mà bơm vẫn chạy thì sao?' trước khi giới thiệu and.", objectiveId: "O10-F-03" });
  if (share("logic") >= 15)
    out.push({ id: "sg-logic", trigger: `${share("logic")}% bài nộp sai hướng so sánh`, suggestion: "Bổ sung ví dụ đọc biểu thức thành lời ('độ ẩm NHỎ HƠN 40') và yêu cầu học sinh dự đoán trước khi chạy.", objectiveId: "O10-F-02" });
  for (const m of input.mastery) {
    if (m.mastery < 70 && m.samples >= 2)
      out.push({ id: `sg-m-${m.objectiveId}`, trigger: `Mức đạt ${m.objectiveId} chỉ ${m.mastery}%`, suggestion: `Tăng thời lượng luyện tập cho mục tiêu ${m.objectiveId} và đánh giá thêm quá trình làm bài (số lần kiểm thử).`, objectiveId: m.objectiveId });
  }
  if (input.attempts > 0 && input.testedShare < 60)
    out.push({ id: "sg-test", trigger: `Chỉ ${input.testedShare}% lượt làm có kiểm thử`, suggestion: "Yêu cầu học sinh kiểm thử trước khi nộp, hoặc dùng chế độ Thử thách.", objectiveId: "O10-F-04" });
  return out;
}

export function refinementInput(d: D, teacherId: string, f: AnalyticsFilter = {}): RefinementInput {
  const stats = attemptStats(d, teacherId, f);
  return {
    patterns: errorPatterns(d, teacherId, f).map(({ key, share }) => ({ key, share })),
    mastery: objectiveMastery(d, teacherId, f).map(({ objectiveId, mastery, samples }) => ({ objectiveId, mastery, samples })),
    attempts: stats.attempts,
    testedShare: stats.testedShare,
  };
}

export function refinementSuggestions(d: D, teacherId: string, f: AnalyticsFilter = {}): RefinementSuggestion[] {
  return suggestRefinements(refinementInput(d, teacherId, f));
}

export function exportAssessmentsCsv(d: D, teacherId: string, f: AnalyticsFilter = {}): string {
  const asg = new Map(scopedAssignments(d, teacherId, f).map((a) => [a.id, a]));
  const rows = [["Lớp", "Nhiệm vụ", "Học sinh", "Nộp lúc", "Test đạt", "Tổng điểm", "Điểm tối đa", "Trạng thái"]];
  for (const s of teacherSubmissions(d, teacherId)) {
    const a = asg.get(s.assignmentId);
    if (!a) continue;
    const klass = d.classes.find((c) => c.id === a.classId)?.name ?? "";
    const student = d.users.find((u) => u.id === s.studentId)?.name ?? s.studentId;
    const asm = d.assessments.find((x) => x.submissionId === s.id);
    const rubric = asm && d.rubrics.find((r) => r.id === asm.rubricId);
    const total = asm ? asm.scores.reduce((t, x) => t + x.score, 0) : "";
    const max = rubric ? rubric.criteria.reduce((t, c) => t + c.maxScore, 0) : "";
    rows.push([klass, a.title, student, s.submittedAt, `${s.testResults.filter((r) => r.pass).length}/${s.testResults.length}`, String(total), String(max), asm?.status === "final" ? "Đã chấm" : "Chờ chấm"]);
  }
  return rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
}
