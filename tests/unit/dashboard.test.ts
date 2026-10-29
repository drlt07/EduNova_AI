import { describe, expect, it } from "vitest";
import { buildSeed } from "@/lib/data/seed";
import { dashboard } from "@/lib/analytics/dashboard";

describe("bảng điều khiển kết quả học tập", () => {
  const now = new Date("2026-10-28T08:00:00Z");
  const d = buildSeed(now);
  it("có số liệu mẫu 6 tuần, các chỉ số khớp nhau", () => {
    const r = dashboard(d, "t1", { days: 28 }, now.getTime());
    expect(r.kpi.attempts.value).toBeGreaterThan(50);
    expect(r.kpi.avg.value).toBeGreaterThan(30);
    expect(r.hist.reduce((s, b) => s + b.n, 0)).toBe(r.kpi.attempts.value);
    expect(r.series.length).toBeGreaterThan(0);
    expect(r.byLesson.every((x, i, a) => i === 0 || a[i - 1].avg <= x.avg)).toBe(true);
  });
  it("lọc chéo theo bài và học sinh thu hẹp mọi biểu đồ", () => {
    const all = dashboard(d, "t1", { days: 42 }, now.getTime());
    const ref = all.byLesson[0].ref;
    const one = dashboard(d, "t1", { days: 42, lessonRef: ref }, now.getTime());
    expect(one.byLesson.map((x) => x.ref)).toEqual([ref]);
    const sid = all.students[0].student.id;
    const st = dashboard(d, "t1", { days: 42, studentId: sid }, now.getTime());
    expect(st.students.map((x) => x.student.id)).toEqual([sid]);
  });
  it("lọc theo lớp chỉ còn một đường xu hướng", () => {
    const r = dashboard(d, "t1", { days: 42, classId: "c-10a1" }, now.getTime());
    expect(r.series.map((s) => s.id)).toEqual(["c-10a1"]);
  });
});
