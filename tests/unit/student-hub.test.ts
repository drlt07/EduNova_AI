import { describe, expect, it } from "vitest";
import { buildSeed } from "@/lib/data/seed";
import { getLesson, lessonId } from "@/lib/data/curriculum";
import { computeAchievements } from "@/lib/store/achievements";
import { continueItems, learningTimeline, lessonSections, objectiveEvidence, topicProgress } from "@/lib/store/student-insights";

const base = buildSeed(new Date("2026-10-20T08:00:00Z"));
const IF = lessonId("10-if", "kntt");
const IF_TOPIC = getLesson(IF)!.topicId;

describe("student hub insights", () => {
  it("if-lesson has the five learning steps plus objectives", () => {
    expect(lessonSections(IF)).toEqual(["muc-tieu", "khoi-dong", "kien-thuc", "quan-sat", "kiem-tra", "van-dung"]);
  });

  it("timeline only contains the student's own recorded activity, in time order", () => {
    const t = learningTimeline(base, "s1");
    expect(t.length).toBeGreaterThan(0);
    expect([...t].sort((a, b) => a.at.localeCompare(b.at))).toEqual(t);
    expect(learningTimeline(base, "s16").some((x) => t.some((y) => y.id === x.id))).toBe(false);
  });

  it("reading sections raises content progress but not mastery", () => {
    const pick = (dd: typeof base) => topicProgress(dd, "s1").find((t) => t.topicId === IF_TOPIC)!;
    const before = pick(base);
    const d = { ...base, lessonProgress: base.lessonProgress.map((p) => (p.studentId === "s1" && p.lessonId === IF ? { ...p, sectionsDone: [...p.sectionsDone, "kien-thuc", "quan-sat"] } : p)) };
    const after = pick(d);
    expect(after.content).toBeGreaterThan(before.content);
    const evBefore = objectiveEvidence(base, "s1", 10).filter((e) => e.sources.includes("câu hỏi trong bài"));
    const evAfter = objectiveEvidence(d, "s1", 10).filter((e) => e.sources.includes("câu hỏi trong bài"));
    expect(evAfter.length).toBe(evBefore.length);
  });

  it("unfinished lesson shows in continue list with the last section anchor", () => {
    const d = { ...base, lessonProgress: [{ studentId: "s1", lessonId: IF, sectionsDone: ["muc-tieu"], confused: [], lastSection: "quan-sat", updatedAt: "2026-10-21T09:00:00Z" }] };
    const item = continueItems(d, "s1").find((c) => c.kind === "lesson");
    expect(item?.href).toBe(`/student/learning/${IF}#quan-sat`);
  });

  it("achievements come from the student's own evidence", () => {
    const d = { ...base, projects: [{ id: "pj1", studentId: "s1", templateId: "calculator", title: "Máy tính", kind: "python" as const, files: [], tasks: [], log: [], visibility: "private" as const, status: "done" as const, reflection: "x", createdAt: "", updatedAt: "" }] };
    expect(computeAchievements(d, "s1").find((a) => a.id === "maker")?.earned).toBe(true);
    expect(computeAchievements(d, "s16").find((a) => a.id === "maker")?.earned).toBe(false);
  });
});
