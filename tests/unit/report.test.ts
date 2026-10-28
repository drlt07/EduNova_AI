import { describe, expect, it } from "vitest";
import { buildSeed } from "@/lib/data/seed";
import { completionRows, errorRows, labRetries, metrics, objectiveRows, shortReport, supportGroups } from "@/lib/analytics/report";

describe("báo cáo kết quả học tập", () => {
  const d = buildSeed();
  it("chỉ số có tử/mẫu khớp danh sách phía sau", () => {
    const m = metrics(d, "t1", {});
    const rows = completionRows(d, "t1", {});
    expect(m.complete.of).toBe(`${rows.filter((r) => r.state !== "missing").length}/${rows.length}`);
    expect(m.submit.of).toBe("6/8");
    expect(m.graded.of).toBe("4/6");
  });
  it("mục tiêu gắn bài SGK, có điểm từng em, sắp yếu trước", () => {
    const o = objectiveRows(d, "t1", { classId: "c-10a1" });
    expect(o.length).toBeGreaterThan(0);
    for (let i = 1; i < o.length; i++) expect(o[i].mastery).toBeGreaterThanOrEqual(o[i - 1].mastery);
    expect(o.some((x) => x.lessonRef?.startsWith("10-"))).toBe(true);
    expect(o[0].students.length).toBe(o[0].samples);
  });
  it("lỗi phổ biến trỏ tới mục SGK; nhóm hỗ trợ và báo cáo ngắn có nội dung", () => {
    const e = errorRows(d, "t1", {});
    expect(e.find((x) => x.key === "boundary")?.sgk?.ref).toBe("10-19");
    expect(supportGroups(d, "t1", {}).some((g) => g.id === "missing")).toBe(true);
    expect(supportGroups(d, "t1", { classId: "c-11a2" }).some((g) => g.id === "lab")).toBe(true);
    const r = shortReport(d, "t1", { classId: "c-10a1" });
    expect(r[0]).toMatch(/^10A1: hoàn thành/);
    expect(labRetries(d, "t1", {})).toBeNull();
  });
});
