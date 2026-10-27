/**
 * Gợi ý điểm rubric THAM KHẢO dựa trên minh chứng (test tự động + sự kiện lab).
 * Luật xác định, không phải AI. Giáo viên luôn quyết định điểm cuối cùng.
 */
import type { ExperimentEvent, Rubric, Submission } from "@/lib/domain/types";

export interface ScoreSuggestion {
  criterionId: string;
  score: number;
  reason: string;
}

const scale = (ratio: number, max: number) => Math.max(1, Math.min(max, Math.round(ratio * max)));

export function suggestScores(sub: Pick<Submission, "testResults" | "rule" | "explanation">, rubric: Rubric, events: ExperimentEvent[]): ScoreSuggestion[] {
  const r = sub.testResults;
  const passed = (cats: string[]) => {
    const xs = r.filter((x) => cats.includes(x.category));
    return xs.length ? xs.filter((x) => x.pass).length / xs.length : 1;
  };
  const tests = events.filter((e) => e.type === "test");
  const runs = events.filter((e) => e.type === "run").length;
  const usesAnd = /\band\b/.test(sub.rule);
  const explainsBoundary = /(biên|bằng|=\s*40|40\s*%?\s*(thì|không))/i.test(sub.explanation);

  return rubric.criteria.map((c) => {
    switch (c.objectiveId) {
      case "O10-F-02": {
        const ratio = passed(["normal", "boundary", "extreme"]);
        return { criterionId: c.id, score: scale(ratio, c.maxScore), reason: `Đạt ${Math.round(ratio * 100)}% test thường/biên/cực trị.` };
      }
      case "O10-F-03": {
        const water = passed(["no-water"]);
        const ratio = water * (usesAnd ? 1 : 0.6) * (sub.explanation.trim().length > 20 ? 1 : 0.85);
        return { criterionId: c.id, score: scale(ratio, c.maxScore), reason: `${water === 1 ? "Xử lý đúng trường hợp hết nước" : "Sai trường hợp hết nước"}; ${usesAnd ? "dùng and" : "không dùng and"}.` };
      }
      case "O10-F-04": {
        const boundary = passed(["boundary"]);
        const base = tests.length === 0 ? 0.25 : 0.5;
        const ratio = Math.min(1, base + boundary * 0.35 + (explainsBoundary ? 0.15 : 0));
        return { criterionId: c.id, score: scale(ratio, c.maxScore), reason: `${tests.length} lần chạy bộ test, ${runs} lần chạy thử; biên ${boundary === 1 ? "đúng" : "sai"}${explainsBoundary ? ", có giải thích biên" : ""}.` };
      }
      default: {
        const ratio = r.length ? r.filter((x) => x.pass).length / r.length : 0;
        return { criterionId: c.id, score: scale(ratio, c.maxScore), reason: `Theo tỉ lệ test đạt (${Math.round(ratio * 100)}%).` };
      }
    }
  });
}
