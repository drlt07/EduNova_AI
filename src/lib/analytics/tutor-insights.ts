/**
 * Tổng hợp việc dùng AI Gia sư cho giáo viên — không có nội dung trò chuyện, không theo từng học sinh.
 * Loại lỗi chỉ hiện khi có từ MIN_STUDENTS học sinh trở lên gặp, để không lộ một em cụ thể.
 */
import type { TutorEvent } from "@/lib/domain/types";

export const MIN_STUDENTS = 2;

export interface TutorInsights {
  total: number;
  students: number;
  byCapability: Record<TutorEvent["capability"], number>;
  topics: { topic: string; count: number }[];
  errors: { type: string; count: number; students: number }[];
  objectives: { objectiveId: string; count: number; students: number }[];
  hiddenErrors: number;
}

const top = <T,>(m: Map<string, T>, n: number, by: (v: T) => number) => [...m.entries()].sort((a, b) => by(b[1]) - by(a[1])).slice(0, n);

export function summarizeTutor(events: TutorEvent[], studentIds: string[]): TutorInsights {
  const mine = events.filter((e) => studentIds.includes(e.studentId));
  const byCapability = { explain: 0, guide: 0, debug: 0, practice: 0 };
  const topics = new Map<string, number>();
  const errors = new Map<string, { count: number; students: Set<string> }>();
  const objectives = new Map<string, { count: number; students: Set<string> }>();
  for (const e of mine) {
    byCapability[e.capability]++;
    topics.set(e.topic, (topics.get(e.topic) ?? 0) + 1);
    if (e.errorType) {
      const x = errors.get(e.errorType) ?? { count: 0, students: new Set<string>() };
      x.count++; x.students.add(e.studentId); errors.set(e.errorType, x);
    }
    // Kiến thức cần củng cố: mục tiêu em phải hỏi để được hướng dẫn hoặc tìm lỗi
    if (e.objectiveId && (e.capability === "debug" || e.capability === "guide")) {
      const x = objectives.get(e.objectiveId) ?? { count: 0, students: new Set<string>() };
      x.count++; x.students.add(e.studentId); objectives.set(e.objectiveId, x);
    }
  }
  const allErrors = top(errors, 50, (v) => v.students.size);
  return {
    total: mine.length,
    students: new Set(mine.map((e) => e.studentId)).size,
    byCapability,
    topics: top(topics, 5, (v) => v).map(([topic, count]) => ({ topic, count })),
    errors: allErrors.filter(([, v]) => v.students.size >= MIN_STUDENTS).slice(0, 5).map(([type, v]) => ({ type, count: v.count, students: v.students.size })),
    hiddenErrors: allErrors.filter(([, v]) => v.students.size < MIN_STUDENTS).length,
    objectives: top(objectives, 4, (v) => v.students.size).map(([objectiveId, v]) => ({ objectiveId, count: v.count, students: v.students.size })),
  };
}
