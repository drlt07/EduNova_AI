import { describe, expect, it } from "vitest";
import { getQuestion, PRACTICE_SETS, QUESTIONS, widgetExpected } from "@/lib/data/practice";
import { gradeQuestion } from "@/lib/practice/grade";

const q = (id: string) => getQuestion(id)!;

describe("dạng câu hỏi mới", () => {
  it("mọi câu trong các bộ đều tồn tại", () => {
    for (const s of PRACTICE_SETS) for (const id of s.questionIds) expect(getQuestion(id), `${s.id}/${id}`).toBeDefined();
    expect(new Set(QUESTIONS.map((x) => x.id)).size).toBe(QUESTIONS.length);
  });
  it("chọn nhiều đáp án: phải đủ và không thừa", () => {
    expect(gradeQuestion(q("m-if-2"), [2, 0, 1]).status).toBe("correct");
    expect(gradeQuestion(q("m-if-2"), [0, 1]).status).toBe("wrong");
    expect(gradeQuestion(q("m-if-2"), [0, 1, 2, 3]).status).toBe("wrong");
  });
  it("ghép nối và điền khuyết", () => {
    const m = q("m-hw-1");
    expect(m.kind === "match" && gradeQuestion(m, m.pairs.map((p) => p[1])).status).toBe("correct");
    expect(gradeQuestion(q("m-sql-4"), [" select", "FROM", "Where "]).status).toBe("correct");
    expect(gradeQuestion(q("m-sql-4"), ["SELECT", "FROM", "WHEN"]).status).toBe("wrong");
  });
  it("thao tác trực tiếp: bit, cổng logic, máy bơm, dòng SQL, dấu hiệu lừa đảo", () => {
    expect(gradeQuestion(q("m-bn-1"), "10110010").status).toBe("correct");
    expect(gradeQuestion(q("m-bn-3"), "0110").status).toBe("correct");
    expect(gradeQuestion(q("m-bn-4"), "0110").status).toBe("wrong");
    expect(gradeQuestion(q("m-if-1"), "10010").status).toBe("correct");
    expect(gradeQuestion(q("m-sql-1"), "0,3").status).toBe("correct");
    const f = q("m-sf-1");
    expect(f.kind === "interactive" && widgetExpected(f.widget)).toBe("1,3,5,7");
    expect(gradeQuestion(f, "1,3,5").status).toBe("wrong");
  });
});
