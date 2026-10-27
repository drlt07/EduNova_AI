import { describe, expect, it } from "vitest";
import { activityBuilderSchema, classSchema, labConfigSchema } from "@/lib/validation/schemas";
import { gardenTestCases } from "@/lib/sim/smart-garden";

const future = new Date(Date.now() + 3 * 86_400_000).toISOString().slice(0, 16);
const valid = {
  lessonPlanId: "lp-1",
  objectiveIds: ["O10-F-02", "O10-F-04"],
  format: "lab" as const,
  labTemplateId: "lab-smart-garden",
  config: {
    mode: "challenge" as const,
    hintMode: "guided" as const,
    params: { threshold: 40, requireWater: true, initialHumidity: 55, initialHasWater: true, allowRuleEditor: true },
    testCaseIds: gardenTestCases(40).map((c) => c.id),
  },
  title: "Smart Garden thử thách",
  instructions: "Viết luật để bơm chỉ bật khi đất khô và còn nước.",
  questions: [{ id: "q1", kind: "mcq" as const, prompt: "Ở 40% bơm thế nào?", options: ["Bật", "Tắt"], correctIndex: 1 }],
  rubricTitle: "Rubric",
  criteria: [
    { title: "Điều kiện", objectiveId: "O10-F-02", maxScore: 4 },
    { title: "Kiểm thử", objectiveId: "O10-F-04", maxScore: 4 },
  ],
  classIds: ["c-10a1"],
  dueAt: future,
};

const issues = (v: unknown) => {
  const r = activityBuilderSchema.safeParse(v);
  return r.success ? [] : r.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
};

describe("activity builder validation", () => {
  it("accepts a valid configuration", () => {
    expect(issues(valid)).toEqual([]);
  });
  it("assessment mode requires hints off", () => {
    expect(issues({ ...valid, config: { ...valid.config, mode: "assessment" } }).join()).toContain("config.hintMode");
  });
  it("requires boundary test case and threshold range", () => {
    const out = issues({ ...valid, config: { ...valid.config, testCaseIds: ["tc-dry", "tc-wet", "tc-nowater", "tc-zero", "tc-full"], params: { ...valid.config.params, threshold: 95 } } });
    expect(out.join()).toContain("config.testCaseIds");
    expect(out.join()).toContain("config.params.threshold");
  });
  it("rejects planned labs, past deadlines, uncovered objectives", () => {
    const out = issues({ ...valid, labTemplateId: "lab-inside-computer", dueAt: "2020-01-01T10:00", criteria: [valid.criteria[0], { ...valid.criteria[0], title: "Khác" }] });
    expect(out.join()).toContain("labTemplateId");
    expect(out.join()).toContain("dueAt");
    expect(out.join()).toContain("O10-F-04");
  });
  it("mcq needs a correct answer", () => {
    expect(issues({ ...valid, questions: [{ ...valid.questions[0], correctIndex: undefined }] }).join()).toContain("correctIndex");
  });
});

describe("other schemas", () => {
  it("lab config", () => {
    expect(labConfigSchema.safeParse({ ...valid.config, title: "Cấu hình", visibility: "private" }).success).toBe(true);
    expect(labConfigSchema.safeParse({ ...valid.config, mode: "challenge", testCaseIds: ["tc-equal", "tc-dry", "tc-wet"], title: "x1x", visibility: "private" }).success).toBe(false);
  });
  it("class", () => {
    expect(classSchema.safeParse({ name: "10A3", grade: 10, textbookId: "kntt", pathway: "chung", schoolYear: "2026–2027" }).success).toBe(true);
    expect(classSchema.safeParse({ name: "<script>", grade: 10, textbookId: "kntt", pathway: "chung", schoolYear: "2026" }).success).toBe(false);
  });
});

import { STEP_SCHEMAS } from "@/lib/validation/schemas";

describe("per-step validation (cross-field checks run even when later steps are empty)", () => {
  it("step 3 catches assessment+hints although step 4 is still empty", () => {
    const partial = { ...valid, title: "", instructions: "", criteria: [], config: { ...valid.config, mode: "assessment" } };
    const r = STEP_SCHEMAS[2].safeParse(partial);
    expect(r.success).toBe(false);
    expect(r.error?.issues.map((i) => i.path.join("."))).toContain("config.hintMode");
  });
  it("step 4 checks objective coverage", () => {
    const r = STEP_SCHEMAS[3].safeParse({ ...valid, criteria: [valid.criteria[0], { ...valid.criteria[0], title: "Lặp" }] });
    expect(r.success).toBe(false);
  });
  it("all steps accept the valid draft", () => {
    for (const s of STEP_SCHEMAS) expect(s.safeParse(valid).success).toBe(true);
  });
});
