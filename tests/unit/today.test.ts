import { describe, expect, it } from "vitest";
import { buildSeed } from "@/lib/data/seed";
import { classHealth, nextLesson, todos, upcomingSlots } from "@/lib/teacher/today";

const d = buildSeed();
// Thứ 2, 2/11/2026 07:00 — 10A1 có tiết 2.
const MON = new Date(2026, 10, 2, 7, 0);

describe("trang Hôm nay", () => {
  it("bài dạy tiếp là bài sau bài muộn nhất đã dạy", () => {
    expect(nextLesson(d, "t1", { id: "c-10a1", grade: 10 })?.ref).toBe("10-19");
    expect(nextLesson(d, "t1", { id: "c-11a2", grade: 11 })?.ref).toBe("11-2");
    expect(nextLesson(d, "t1", { id: "c-12a3", grade: 12 })?.ref).toBe("12-1");
  });

  it("tiết dạy sắp tới sắp theo giờ và kèm bài SGK", () => {
    const s = upcomingSlots(d, "t1", MON, 7);
    expect(s.length).toBeGreaterThan(3);
    expect(s[0].cls.name).toBe("10A1");
    expect(s[0].at.getHours()).toBe(7);
    expect(s[0].lesson?.ref).toBe("10-19");
    for (let i = 1; i < s.length; i++) expect(s[i].at >= s[i - 1].at).toBe(true);
  });

  it("việc cần làm có bài chờ chấm, sắp xếp việc gấp trước", () => {
    const t = todos(d, "t1", MON);
    expect(t.some((x) => x.kind === "grade")).toBe(true);
    for (let i = 1; i < t.length; i++) expect(t[i].urgency).toBeLessThanOrEqual(t[i - 1].urgency);
  });

  it("tình hình lớp tính được cho mọi lớp", () => {
    const h = classHealth(d, "t1");
    expect(h.map((x) => x.cls.name)).toEqual(["10A1", "11A2", "12A3"]);
    for (const x of h) expect(x.doneRate).toBeGreaterThanOrEqual(0);
  });
});
