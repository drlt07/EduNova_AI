import { describe, expect, it } from "vitest";
import { sliceIdx } from "@/components/phet/string-lab";
import { LAB_RUBRICS } from "@/lib/ai/lab-grader";
import { getLabBySlug } from "@/lib/data/labs";
import { SGK_SIMS } from "@/lib/data/lab-catalog";

const py = (s: string, a: number | null, b: number | null, c = 1) => sliceIdx(s.length, a, b, c).map((i) => s[i]).join("");

describe("mô phỏng kiểu PhET", () => {
  it("cắt xâu giống Python", () => {
    expect(py("PYTHON", 1, 4)).toBe("YTH");
    expect(py("abcdef", null, null, 2)).toBe("ace");
    expect(py("Tin hoc", -3, null)).toBe("hoc");
    expect(py("abcdef", null, null, -1)).toBe("fedcba");
    expect(py("abcdef", 4, 1, -1)).toBe("edc");
    expect(py("abc", -10, 10)).toBe("abc");
  });
  it("mọi mô phỏng gắn với bài đều tồn tại và có tiêu chí chấm", () => {
    for (const slugs of Object.values(SGK_SIMS)) for (const s of slugs) {
      expect(getLabBySlug(s), s).toBeDefined();
      if (!["smart-coding-city", "smart-garden"].includes(s)) expect(LAB_RUBRICS[s], s).toBeDefined();
    }
  });
});
