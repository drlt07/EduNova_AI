import type { DemoData } from "@/lib/data/seed";
import type { Assignment } from "@/lib/domain/types";
import { getObjective } from "@/lib/data/curriculum";
import { assignmentBundle, studentAssessments, studentAssignments } from "./scoped";

export type MissionStatus = "not_started" | "in_progress" | "paused" | "submitted" | "graded" | "overdue" | "closed";

export const MISSION_STATUS_LABEL: Record<MissionStatus, { label: string; tone: "neutral" | "cyan" | "warning" | "success" | "violet" | "danger" }> = {
  not_started: { label: "Chưa bắt đầu", tone: "neutral" },
  in_progress: { label: "Đang làm", tone: "cyan" },
  paused: { label: "Tạm dừng", tone: "warning" },
  submitted: { label: "Đã nộp — chờ chấm", tone: "violet" },
  graded: { label: "Đã có kết quả", tone: "success" },
  overdue: { label: "Quá hạn", tone: "danger" },
  closed: { label: "Đã đóng", tone: "neutral" },
};

export function missionStatus(d: DemoData, studentId: string, a: Assignment, now = Date.now()): MissionStatus {
  const sub = d.submissions.find((s) => s.assignmentId === a.id && s.studentId === studentId);
  if (sub) return d.assessments.some((x) => x.submissionId === sub.id && x.status === "final") ? "graded" : "submitted";
  if (a.status === "closed") return "closed";
  const attempt = d.attempts.find((x) => x.assignmentId === a.id && x.studentId === studentId && x.status !== "submitted");
  if (new Date(a.dueAt).getTime() < now && !attempt) return "overdue";
  if (attempt) return attempt.status === "paused" ? "paused" : "in_progress";
  return "not_started";
}

export function studentMissions(d: DemoData, studentId: string) {
  return studentAssignments(d, studentId)
    .map((a) => ({ ...assignmentBundle(d, a.id), assignment: a, status: missionStatus(d, studentId, a) }))
    .sort((x, y) => x.assignment.dueAt.localeCompare(y.assignment.dueAt));
}

/** Mức đạt theo mục tiêu của RIÊNG học sinh (chỉ đánh giá final). */
export function studentMastery(d: DemoData, studentId: string) {
  const acc = new Map<string, { got: number; max: number; n: number }>();
  for (const a of studentAssessments(d, studentId)) {
    const rubric = d.rubrics.find((r) => r.id === a.rubricId);
    if (!rubric) continue;
    for (const s of a.scores) {
      const c = rubric.criteria.find((x) => x.id === s.criterionId);
      if (!c) continue;
      const cur = acc.get(c.objectiveId) ?? { got: 0, max: 0, n: 0 };
      acc.set(c.objectiveId, { got: cur.got + s.score, max: cur.max + c.maxScore, n: cur.n + 1 });
    }
  }
  return [...acc.entries()].map(([objectiveId, v]) => ({ objectiveId, description: getObjective(objectiveId)?.description ?? "", mastery: Math.round((v.got / v.max) * 100), samples: v.n }));
}

export function studentGrade(d: DemoData, studentId: string): 10 | 11 | 12 {
  const e = d.enrollments.find((x) => x.studentId === studentId);
  return d.classes.find((c) => c.id === e?.classId)?.grade ?? 10;
}
