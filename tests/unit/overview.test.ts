import { describe, expect, it } from "vitest";
import { buildSeed } from "@/lib/data/seed";
import { classHistory, classProgress, myLessons, pendingCount, teacherNotifications, teacherOverview, type OverviewData } from "@/lib/teacher/overview";
import { teacherClasses } from "@/lib/store/scoped";

const now = Date.now();
const base = (): OverviewData => ({ ...buildSeed(), saved: [], lessonQA: [] });

describe("Tổng quan giáo viên", () => {
  const d = base();
  it("chỉ số lấy từ dữ liệu thật", () => {
    const ov = teacherOverview(d, "t1", now);
    expect(ov.classes).toBe(teacherClasses(d, "t1").length);
    expect(ov.students).toBeGreaterThan(0);
    expect(ov.pending).toBe(pendingCount(d, "t1"));
    if (ov.completion !== null) { expect(ov.completion).toBeGreaterThanOrEqual(0); expect(ov.completion).toBeLessThanOrEqual(100); }
  });
  it("tiến độ theo lớp có đủ lớp, phần trăm hợp lệ", () => {
    const rows = classProgress(d, "t1");
    expect(rows.length).toBe(teacherClasses(d, "t1").length);
    for (const r of rows) if (r.pct !== null) expect(r.pct).toBe(Math.round((100 * r.done) / r.target));
  });
  it("bài đã lưu hiện ở Bài học của tôi", () => {
    const withSaved: OverviewData = { ...d, saved: [{ userId: "t1", key: "lesson:10-19", at: new Date(now).toISOString() }, { userId: "t2", key: "lesson:11-2", at: new Date(now).toISOString() }] };
    expect(myLessons(withSaved, "t1", now).saved.map((e) => e.ref)).toEqual(["10-19"]);
  });
  it("câu hỏi chưa trả lời của học sinh lớp mình thành thông báo và lịch sử lớp", () => {
    const cls = teacherClasses(d, "t1")[0];
    const q = { id: "q1", ref: "10-19", classId: cls.id, authorId: "s1", text: "Vì sao cần elif?", at: new Date(now - 60_000).toISOString(), replies: [] };
    const withQ: OverviewData = { ...d, lessonQA: [q] };
    const n = teacherNotifications(withQ, "t1", now).find((x) => x.id.startsWith("qa-"));
    expect(n?.href).toBe("/teacher/sgk/10-19?tab=hoi-dap");
    expect(classHistory(withQ, cls.id).some((e) => e.kind === "question")).toBe(true);
    // Giáo viên lớp khác không nhận
    expect(teacherNotifications(withQ, "t2", now).some((x) => x.id.startsWith("qa-q1"))).toBe(false);
  });
  it("lịch sử lớp sắp mới nhất trước", () => {
    const h = classHistory(d, teacherClasses(d, "t1")[0].id);
    for (let i = 1; i < h.length; i++) expect(h[i - 1].at >= h[i].at).toBe(true);
  });
});
