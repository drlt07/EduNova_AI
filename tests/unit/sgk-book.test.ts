import { describe, expect, it } from "vitest";
import { BOOKS, bookEntry, bookLessons, contentCount, lessonChecks, lessonSimSlugs, neighbors } from "@/lib/sgk/book";
import { G10 } from "@/lib/sgk/content/g10";
import { G11 } from "@/lib/sgk/content/g11";
import { G12 } from "@/lib/sgk/content/g12";
import { getLabBySlug } from "@/lib/data/labs";
import { isAlgoId } from "@/lib/data/hsg";

const ALL = [...G10, ...G11, ...G12];

describe("nội dung SGK số", () => {
  it("mỗi bài có nội dung đều nằm trong mục lục, không trùng", () => {
    expect(new Set(ALL.map((l) => l.ref)).size).toBe(ALL.length);
    for (const l of ALL) expect(bookEntry(l.ref)?.content, l.ref).toBe(l);
  });

  it("mục, mô phỏng, câu hỏi củng cố hợp lệ", () => {
    for (const l of ALL) {
      expect(l.objectives.length, l.ref).toBeGreaterThan(0);
      expect(new Set(l.sections.map((s) => s.id)).size, l.ref).toBe(l.sections.length);
      for (const s of l.sections) for (const b of s.blocks) {
        if (b.t === "sim") expect(getLabBySlug(b.slug), `${l.ref} ${b.slug}`).toBeTruthy();
        if (b.t === "algo") expect(isAlgoId(b.id)).toBe(true);
        if (b.t === "check") {
          expect(b.answer).toBeLessThan(b.options.length);
          expect(b.objective, `${l.ref} ${b.id}`).toBeLessThan(l.objectives.length);
        }
      }
    }
    const ids = ALL.flatMap((l) => lessonChecks(l).map((c) => c.id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("mỗi yêu cầu cần đạt có ít nhất một câu hỏi củng cố", () => {
    for (const l of ALL) {
      const covered = new Set(lessonChecks(l).map((c) => c.objective));
      l.objectives.forEach((_, i) => expect(covered.has(i), `${l.ref} mục tiêu ${i + 1}`).toBe(true));
    }
  });

  it("điều hướng bài trước/sau và mô phỏng của bài", () => {
    expect(neighbors("10-1").prev).toBeUndefined();
    expect(neighbors("10-1").next?.ref).toBe("10-2");
    expect(neighbors("10-19").prev?.ref).toBe("10-18");
    expect(lessonSimSlugs(bookEntry("10-19")!)).toEqual(expect.arrayContaining(["smart-garden", "smart-coding-city"]));
    for (const b of BOOKS) expect(contentCount(b.grade)).toBeGreaterThan(4);
    expect(bookLessons(11).length).toBe(16);
  });
});
