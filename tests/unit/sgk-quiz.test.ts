import { describe, expect, it } from "vitest";
import { getObjective } from "@/lib/data/curriculum";
import { getQuestion, setsForLesson, widgetExpected } from "@/lib/data/practice";
import { SGK_KNTT, sgkRef } from "@/lib/data/sgk-kntt";
import { PROCEDURES } from "@/lib/data/sgk-quiz/procedures";
import { gradeQuestion } from "@/lib/practice/grade";
import type { Grade } from "@/lib/domain/types";

const refs = ([10, 11, 12] as Grade[]).flatMap((g) => SGK_KNTT[g].flatMap((t) => t.lessons.map((l) => sgkRef(g, l))));

describe("câu hỏi luyện tập theo từng bài", () => {
  it("mọi bài trong mục lục đều có bộ khoảng 10 câu trắc nghiệm", () => {
    for (const ref of refs) {
      const set = setsForLesson(ref).find((s) => s.id === `bai-${ref}`);
      expect(set, ref).toBeDefined();
      expect(set!.questionIds.length, ref).toBeGreaterThanOrEqual(10);
    }
  });
  it("mỗi câu có 4 phương án khác nhau, đáp án hợp lệ, có giải thích", () => {
    for (const ref of refs) for (const id of setsForLesson(ref).find((s) => s.id === `bai-${ref}`)!.questionIds) {
      const q = getQuestion(id)!;
      expect(["mcq", "interactive"]).toContain(q.kind);
      if (q.kind !== "mcq") continue;
      expect(new Set(q.options).size, id).toBe(q.options.length);
      expect(q.correctIndex, id).toBeGreaterThanOrEqual(0);
      expect(q.correctIndex, id).toBeLessThan(q.options.length);
      expect(q.explanation.length, id).toBeGreaterThan(3);
      expect(gradeQuestion(q, q.correctIndex).status).toBe("correct");
    }
  });
  it("đáp án đúng không dồn vào một vị trí", () => {
    const pos = [0, 0, 0, 0];
    for (const ref of refs) for (const id of setsForLesson(ref).find((s) => s.id === `bai-${ref}`)!.questionIds) { const q = getQuestion(id)!; if (q.kind === "mcq") pos[q.correctIndex]++; }
    const total = pos.reduce((a, b) => a + b, 0);
    for (const p of pos) expect(p / total).toBeGreaterThan(0.15);
  });
  it("mục tiêu theo bài có nhãn để hiện trong kết quả", () => {
    expect(getObjective("SGK-11-2")?.description).toMatch(/Thực hành sử dụng hệ điều hành/);
  });
  it("câu thao tác mô phỏng: bước đúng có trong danh sách, chỉ đạt khi làm xong", () => {
    for (const p of PROCEDURES) for (const s of p.steps) expect(s.items.some((x) => x.id === s.correct), `${p.id}: ${s.ask}`).toBe(true);
    const q = getQuestion("proc-11-2-check")!;
    expect(q.kind === "interactive" && widgetExpected(q.widget)).toBe("xong");
    expect(gradeQuestion(q, "xong:2").status).toBe("correct");
    expect(gradeQuestion(q, "buoc:3:0").status).toBe("wrong");
    expect(setsForLesson("11-2")[0].questionIds).toContain("proc-11-2-check");
  });
});
