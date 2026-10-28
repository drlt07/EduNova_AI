import { describe, expect, it } from "vitest";
import { dueFor, fmtDue, nextClassTime, taskOutcome } from "@/lib/teacher/assign";

// Thứ 4, 28/10/2026, 10:00 giờ máy.
const WED = new Date(2026, 9, 28, 10, 0);
const cls = { schedule: [{ weekday: 1, period: "Tiết 2", room: "P1" }, { weekday: 4, period: "Tiết 3", room: "P1" }] };

describe("hạn nộp theo thời khóa biểu", () => {
  it("tiết sau là Thứ 5 tiết 3 (08:45)", () => {
    const t = nextClassTime(cls, WED)!;
    expect(fmtDue(t)).toBe("Thứ 5, 08:45");
    expect(t.getDate()).toBe(29);
  });

  it("đang trong giờ trước tiết chưa tới 1 tiếng thì lấy buổi sau nữa", () => {
    const thu0815 = new Date(2026, 9, 29, 8, 15);
    expect(fmtDue(nextClassTime(cls, thu0815)!)).toBe("Thứ 2, 07:50");
  });

  it("21:00 tối nay, nếu đã muộn thì tối mai; Chủ nhật 21:00", () => {
    expect(fmtDue(dueFor("tonight", cls, WED))).toBe("Thứ 4, 21:00");
    expect(fmtDue(dueFor("tonight", cls, new Date(2026, 9, 28, 20, 30)))).toBe("Thứ 5, 21:00");
    const sun = dueFor("sunday", cls, WED);
    expect(fmtDue(sun)).toBe("Chủ nhật, 21:00");
    expect(sun.getDate()).toBe(1);
  });

  it("lớp không có lịch thì rơi về Chủ nhật", () => {
    expect(fmtDue(dueFor("next", { schedule: [] }, WED))).toBe("Chủ nhật, 21:00");
  });
});

describe("kết quả nhiệm vụ máy chấm", () => {
  const pub = "2026-10-28T00:00:00.000Z";
  const d = {
    labResults: [
      { id: "1", studentId: "s1", labSlug: "os-explorer", score: 7, mistakes: 6, seconds: 300, finishedAt: "2026-10-28T03:00:00.000Z" },
      { id: "2", studentId: "s1", labSlug: "os-explorer", score: 9.5, mistakes: 1, seconds: 200, finishedAt: "2026-10-28T04:00:00.000Z" },
      { id: "3", studentId: "s2", labSlug: "os-explorer", score: 10, mistakes: 0, seconds: 100, finishedAt: "2026-10-27T04:00:00.000Z" },
    ],
    practiceAttempts: [
      { id: "p", studentId: "s1", setId: "if-basic", mode: "practice" as const, startedAt: pub, finishedAt: "2026-10-28T05:00:00.000Z", items: [{ questionId: "a", status: "correct" as const }, { questionId: "b", status: "wrong" as const }, { questionId: "c", status: "self" as const }] },
    ],
    codeWorks: [{ id: "c", studentId: "s1", exerciseId: "ex1", code: "", versions: [], updatedAt: pub, lastRun: { passed: 3, total: 5, at: "2026-10-28T06:00:00.000Z" } }],
  };

  it("mô phỏng: điểm cao nhất sau khi giao; làm trước khi giao không tính", () => {
    expect(taskOutcome(d as never, "s1", { task: { kind: "lab", ref: "os-explorer" }, publishedAt: pub })).toMatchObject({ done: true, text: "9,5 điểm" });
    expect(taskOutcome(d as never, "s2", { task: { kind: "lab", ref: "os-explorer" }, publishedAt: pub }).done).toBe(false);
  });

  it("câu hỏi tính câu chấm được; code chưa đạt hết test thì chưa xong nhưng có kết quả", () => {
    expect(taskOutcome(d as never, "s1", { task: { kind: "quiz", ref: "if-basic" }, publishedAt: pub })).toMatchObject({ done: true, text: "1/2 câu đúng" });
    expect(taskOutcome(d as never, "s1", { task: { kind: "code", ref: "ex1" }, publishedAt: pub })).toMatchObject({ done: false, text: "Đạt 3/5 test" });
  });
});
