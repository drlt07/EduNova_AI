import { describe, expect, it } from "vitest";
import { attemptsLeft, dueFor, fmtDue, nextClassTime, taskOutcome } from "@/lib/teacher/assign";
import { NAV } from "@/components/layout/nav-config";

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

describe("Cấu hình giao bài: số lần làm và cách tính điểm", () => {
  const at = (h: number) => new Date(Date.UTC(2026, 9, 1, h)).toISOString();
  const base = { publishedAt: at(0), task: { kind: "lab" as const, ref: "binary-control" } };
  const d = {
    labResults: [
      { id: "r1", studentId: "s", labSlug: "binary-control", score: 6, mistakes: 4, seconds: 300, finishedAt: at(1) },
      { id: "r2", studentId: "s", labSlug: "binary-control", score: 9, mistakes: 1, seconds: 300, finishedAt: at(2) },
      { id: "r3", studentId: "s", labSlug: "binary-control", score: 7, mistakes: 3, seconds: 300, finishedAt: at(3) },
    ],
    practiceAttempts: [],
    codeWorks: [],
  };
  it("mặc định lấy lần cao nhất, không giới hạn", () => {
    expect(taskOutcome(d, "s", base)).toMatchObject({ ratio: 0.9, used: 3 });
  });
  it("giới hạn 1 lần: chỉ lần đầu được tính", () => {
    expect(taskOutcome(d, "s", { ...base, maxAttempts: 1 })).toMatchObject({ ratio: 0.6, used: 1 });
  });
  it("lần gần nhất / lần đầu trong giới hạn", () => {
    expect(taskOutcome(d, "s", { ...base, scoring: "last" }).ratio).toBe(0.7);
    expect(taskOutcome(d, "s", { ...base, maxAttempts: 2, scoring: "last" }).ratio).toBe(0.9);
    expect(taskOutcome(d, "s", { ...base, scoring: "first" }).ratio).toBe(0.6);
  });
  it("số lần còn lại", () => {
    expect(attemptsLeft(taskOutcome(d, "s", { ...base, maxAttempts: 2 }), { maxAttempts: 2 })).toBe(0);
    expect(attemptsLeft(taskOutcome(d, "s", base), {})).toBeUndefined();
  });
});

describe("Điều hướng", () => {
  it("giáo viên: Quản lý giảng dạy + Phiêu lưu Nova + 2 mục cá nhân", () => {
    expect(NAV.teacher.map((i) => i.label)).toEqual(["Tổng quan", "Khóa học", "Lớp của tôi", "Bài tập & Kiểm tra", "Thư viện", "Phiêu lưu Nova", "Trợ lý KHBD AI", "Thông báo", "Hồ sơ & Cài đặt"]);
  });
  it("Mô phỏng đời sống: nằm trong Thư viện của GV, mục riêng của HS và QTV", () => {
    expect(NAV.teacher.find((i) => i.label === "Thư viện")?.match).toContain("/teacher/kho");
    expect(NAV.student.find((i) => i.label === "Mô phỏng đời sống")?.href).toBe("/student/kho");
    expect(NAV.admin.find((i) => i.label === "Mô phỏng đời sống")?.href).toBe("/admin/kho");
    expect(NAV.student.find((i) => i.href === "/student/games")?.match).not.toContain("/student/kho");
  });
  it("trang cũ vẫn thuộc một mục (không mất chức năng)", () => {
    const all = NAV.teacher.flatMap((i) => [i.href, ...(i.match ?? [])]);
    for (const r of ["/teacher/courses", "/teacher/assignments", "/teacher/assessment", "/teacher/results", "/teacher/analytics", "/teacher/bank", "/teacher/kho", "/teacher/library", "/teacher/saved", "/teacher/activity-builder"]) expect(all).toContain(r);
  });
  it("Phiêu lưu Nova có ở cả giáo viên và học sinh", () => {
    expect(NAV.teacher.find((i) => i.label === "Phiêu lưu Nova")?.href).toBe("/teacher/phieu-luu");
    expect(NAV.student.find((i) => i.label === "Phiêu lưu Nova")?.href).toBe("/student/phieu-luu");
  });
  it("học sinh vào thẳng Bài của tôi", () => {
    expect(NAV.student[0].href).toBe("/student/missions");
  });
});

describe("Dữ liệu mẫu", () => {
  it("mọi bài làm mẫu nằm trong quá khứ (bài vừa giao chưa có ai làm)", async () => {
    const { buildSeed } = await import("@/lib/data/seed");
    const now = new Date();
    const d = buildSeed(now);
    expect(d.labResults.every((r) => r.finishedAt <= now.toISOString())).toBe(true);
    expect(d.practiceAttempts.every((p) => p.finishedAt <= now.toISOString())).toBe(true);
  });
});
