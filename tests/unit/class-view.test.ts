import { describe, expect, it } from "vitest";
import { buildSeed } from "@/lib/data/seed";
import { cellStatus, refForObjective, studentProfile, teachingProgress } from "@/lib/teacher/class-view";
import { studentAssignments, assignedStudents } from "@/lib/store/scoped";

describe("trang chi tiết lớp", () => {
  const d = buildSeed();
  it("phân biệt chưa vào lớp, không được giao, chưa nộp, xong", () => {
    const a = d.assignments.find((x) => x.id === "as-seed-os")!;
    expect(cellStatus(d, a, "s9").status).toBe("done");
    expect(cellStatus(d, a, "s12", new Date(a.dueAt).getTime() - 1000).status).toBe("todo");
    expect(cellStatus(d, a, "s12", new Date(a.dueAt).getTime() + 1000).status).toBe("late");
    const only = { ...a, id: "x", studentIds: ["s10"] };
    expect(cellStatus({ ...d, assignments: [...d.assignments, only] }, only, "s9").status).toBe("not-assigned");
    const invited = { ...d, enrollments: d.enrollments.map((e) => (e.studentId === "s12" && e.classId === "c-11a2" ? { ...e, status: "invited" as const } : e)) };
    expect(cellStatus(invited, a, "s12").status).toBe("not-joined");
  });

  it("nhiệm vụ giao riêng chỉ đến đúng các em được chọn", () => {
    const a = { ...d.assignments.find((x) => x.id === "as-seed-os")!, id: "rieng", studentIds: ["s10"] };
    const dd = { ...d, assignments: [...d.assignments, a] };
    expect(studentAssignments(dd, "s10").some((x) => x.id === "rieng")).toBe(true);
    expect(studentAssignments(dd, "s9").some((x) => x.id === "rieng")).toBe(false);
    expect(assignedStudents(dd, a).map((u) => u.id)).toEqual(["s10"]);
  });

  it("tiến độ dạy theo chủ đề và hồ sơ học sinh", () => {
    const p = teachingProgress(d, "t1", { id: "c-10a1", grade: 10 });
    expect(p.taught).toBe(2);
    expect(p.topics.reduce((s, t) => s + t.total, 0)).toBe(p.total);
    const prof = studentProfile(d, "s10", "c-11a2");
    expect(prof.weak.some((w) => w.label.includes("Trung tâm điều hành máy tính"))).toBe(true);
    expect(refForObjective("O10-F-04")).toMatch(/^10-/);
  });
});
