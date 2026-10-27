import { describe, expect, it } from "vitest";
import { CODING_EXERCISES } from "@/lib/data/coding-exercises";
import { FARM_LEVELS } from "@/lib/data/games";
import { PRACTICE_SETS, QUESTIONS, getQuestion } from "@/lib/data/practice";
import { gradeFarmLevel } from "@/lib/practice/farm-grade";
import { gradeQuestion, pickNext, predictAnswer, shuffled } from "@/lib/practice/grade";
import { runPython } from "@/lib/py/interpreter";

const FARM_SOLUTIONS: Record<number, string> = {
  1: "if humidity < 40:\n    pump_on()\nelse:\n    pump_off()",
  2: "if humidity < 40 and has_water:\n    pump_on()\nelse:\n    pump_off()",
  3: "if humidity < 0 or humidity > 100:\n    pump_off()\n    print('Lỗi cảm biến')\nelif humidity < 40 and has_water:\n    pump_on()\nelse:\n    pump_off()",
  4: "for h in beds:\n    if h < 40 and has_water:\n        pump_on()\n    else:\n        pump_off()",
};

describe("coding exercises", () => {
  it.each(CODING_EXERCISES.map((e) => [e.id, e] as const))("%s: reference solution runs on every test", (_, ex) => {
    for (const t of ex.tests) expect(runPython(ex.solution, { stdin: t.stdin, echoInput: false }).ok).toBe(true);
  });
});

describe("smart farm grading", () => {
  it.each(FARM_LEVELS.map((l) => [l.id, l] as const))("level %s: solution passes, starter does not", (_, level) => {
    expect(gradeFarmLevel(FARM_SOLUTIONS[level.id], level).passed).toBe(true);
    expect(gradeFarmLevel(level.starter, level).passed).toBe(false);
  });
  it("level 2 catches pumping with an empty tank", () => {
    const r = gradeFarmLevel(FARM_SOLUTIONS[1], FARM_LEVELS[1]);
    expect(r.results.find((x) => x.name === "Khô, hết nước")?.pass).toBe(false);
  });
  it("level 3 requires the sensor error message", () => {
    const r = gradeFarmLevel(FARM_SOLUTIONS[2], FARM_LEVELS[2]);
    expect(r.passed).toBe(false);
  });
  it("syntax errors are reported, not thrown", () => {
    const r = gradeFarmLevel("if humidity < 40\n    pump_on()", FARM_LEVELS[0]);
    expect(r.results[0].actual).toContain("SyntaxError");
  });
});

describe("practice grading", () => {
  it("every set references existing questions", () => {
    for (const s of PRACTICE_SETS) for (const id of s.questionIds) expect(getQuestion(id), id).toBeDefined();
  });
  it("predict answers come from real execution", () => {
    const q = getQuestion("p-if-2")!;
    if (q.kind !== "predict") throw new Error();
    expect(predictAnswer(q)).toBe("12");
    expect(gradeQuestion(q, " 12 ").status).toBe("correct");
    expect(gradeQuestion(q, "8").status).toBe("wrong");
  });
  it("fill-code is checked by running tests, accepting equivalent answers", () => {
    const q = getQuestion("p-if-5")!;
    expect(gradeQuestion(q, "n % 2 == 0").status).toBe("correct");
    expect(gradeQuestion(q, "not n % 2").status).toBe("correct");
    const wrong = gradeQuestion(q, "n % 2 == 1");
    expect(wrong.status).toBe("wrong");
    expect(wrong.detail).toContain("Sai với dữ liệu vào");
    expect(gradeQuestion(q, "n = 2").detail).toContain("SyntaxError");
  });
  it("other kinds", () => {
    expect(gradeQuestion(getQuestion("p-if-6")!, 2).status).toBe("correct");
    expect(gradeQuestion(getQuestion("p-lg-1")!, false).status).toBe("correct");
    const order = getQuestion("p-if-4")!;
    if (order.kind !== "order") throw new Error();
    expect(gradeQuestion(order, order.lines).status).toBe("correct");
    expect(gradeQuestion(order, shuffled(order.lines, "x")).status).toBe("wrong");
    expect(gradeQuestion(getQuestion("p-if-7")!, "abc").status).toBe("self");
    expect(gradeQuestion(getQuestion("p-if-8")!, null, { passedLevels: [1, 2] }).status).toBe("correct");
  });
  it("adaptive picks the weakest objective first", () => {
    const pool = PRACTICE_SETS[1].questionIds.map((id) => QUESTIONS.find((q) => q.id === id)!);
    const next = pickNext(pool, [
      { questionId: "p-lg-1", status: "correct" },
      { questionId: "p-ts-1", status: "wrong" },
    ]);
    expect(next?.objectiveId).toBe("O10-F-04");
  });
});
