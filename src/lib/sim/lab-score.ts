/** Chấm điểm mô phỏng có nhiệm vụ: hoàn thành là có điểm, mỗi lần chọn sai trừ bớt. */

import type { LabGrade } from "@/lib/ai/lab-grader";

export interface LabResult {
  id: string;
  studentId: string;
  labSlug: string;
  /** Thang 10, bước 0,5. */
  score: number;
  mistakes: number;
  /** Thời gian làm (giây), tính từ lúc mở mô phỏng. */
  seconds: number;
  finishedAt: string;
  /** Câu trả lời phần giải thích sau khi làm xong. */
  answer?: string;
  /** Bản chấm của AI (hoặc bộ luật) cho cả bài. */
  grade?: LabGrade;
  /** Giáo viên duyệt hoặc sửa điểm; khi có, \`score\` lấy theo điểm này. */
  review?: { score: number; note: string; by: string; at: string };
}

/** Mô phỏng có nhiệm vụ và màn hình hoàn thành, nên chấm được điểm. */
export const SCORED_LABS = new Set(["inside-computer-3d", "network-journey", "os-explorer", "database-city", "sql-detective", "debug-detective", "digital-safety", "ai-discovery", "digital-citizen", "binary-control", "smart-home", "digital-camera", "robot-factory", "maze-robot", "software-ecosystem", "device-connection", "cloud-sharing", "network-builder", "css-box", "web-navigation"]);

/** 10 điểm, mỗi lần chọn sai trừ 0,5; đã hoàn thành thì thấp nhất 5. */
export const labScore = (mistakes: number) => Math.max(5, 10 - 0.5 * Math.max(0, mistakes));

/** "8,5" — điểm viết kiểu Việt Nam. */
export const fmtScore = (x: number) => (Number.isInteger(x) ? String(x) : x.toFixed(1).replace(".", ","));

export const fmtDuration = (s: number) => (s < 60 ? `${s} giây` : `${Math.round(s / 60)} phút`);

export interface LabStudentRow {
  studentId: string;
  best: LabResult;
  attempts: number;
}

/** Kết quả một mô phỏng của một nhóm học sinh: điểm cao nhất mỗi em, ai chưa làm. */
export function labSummary(results: LabResult[], studentIds: string[], slug: string, since?: string) {
  const ids = new Set(studentIds);
  const mine = results.filter((r) => r.labSlug === slug && ids.has(r.studentId) && (!since || r.finishedAt >= since));
  const rows: LabStudentRow[] = [];
  for (const id of studentIds) {
    const rs = mine.filter((r) => r.studentId === id);
    if (!rs.length) continue;
    const best = rs.reduce((a, b) => (b.score > a.score || (b.score === a.score && b.finishedAt > a.finishedAt) ? b : a));
    rows.push({ studentId: id, best, attempts: rs.length });
  }
  rows.sort((a, b) => b.best.score - a.best.score);
  const avg = rows.length ? Math.round((rows.reduce((s, r) => s + r.best.score, 0) / rows.length) * 10) / 10 : 0;
  return { rows, done: rows.length, missing: studentIds.filter((id) => !rows.some((r) => r.studentId === id)), avg };
}
