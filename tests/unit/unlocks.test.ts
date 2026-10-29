import { describe, expect, it } from "vitest";
import { buildSeed } from "@/lib/data/seed";
import { classUnlocks, lessonKey, nextLockedLesson, setKey, studentUnlocks } from "@/lib/access/unlocks";

describe("giáo viên mở dần nội dung cho lớp", () => {
  const d = buildSeed(new Date("2026-10-01T08:00:00Z"));
  it("học sinh chỉ có phần lớp mình được mở", () => {
    const s1 = studentUnlocks(d, "s1"); // 10A1
    expect(s1.has(lessonKey("10-1"))).toBe(true);
    expect(s1.has(setKey("bai-10-1"))).toBe(true);
    expect(s1.has(lessonKey("10-30"))).toBe(false);
    expect(s1.has(lessonKey("11-1"))).toBe(false);
    expect(s1.has("lab:binary-control")).toBe(true); // mô phỏng của bài đã mở
    expect(s1.has("lab:function-machine")).toBe(false); // bài 26 chưa mở
  });
  it("nhiệm vụ giao thẳng cũng mở nội dung đó", () => {
    const d2 = { ...d, assignments: [...d.assignments, { ...d.assignments[0], id: "x", classId: "c-10a1", status: "open" as const, task: { kind: "quiz" as const, ref: "bai-10-33" }, sgkRef: "10-33", studentIds: undefined }] };
    expect(studentUnlocks(d2, "s1").has(setKey("bai-10-33"))).toBe(true);
    expect(studentUnlocks(d2, "s1").has(lessonKey("10-33"))).toBe(true);
  });
  it("bài tiếp theo chưa mở theo thứ tự mục lục", () => {
    expect(classUnlocks(d, "c-11a2").size).toBeGreaterThan(0);
    expect(nextLockedLesson(d, "c-11a2", 11)?.ref).toBe("11-4");
  });
});
