import { describe, expect, it } from "vitest";
import type { Course, CourseProgress, PracticeAttempt } from "@/lib/domain/types";
import { allLessons, courseCompletion, finalTest, isLessonDone, lessonCells, lessonStates, moveItem, newBlock, newLesson, newTopic, scaffoldTopics, validateForPublish, youtubeEmbed } from "@/lib/courses/course";
import { seedCourses } from "@/lib/data/courses-seed";
import { buildSeed } from "@/lib/data/seed";
import { studentClassIds } from "@/lib/store/scoped";
import { assignmentCourse, gradeCell } from "@/lib/teacher/assign";

function course(sequential: boolean): Course {
  const l1 = newLesson("Bài 1", undefined, [newBlock("text", { id: "b1", body: "x" }), newBlock("media", { id: "b2", mediaUrl: "https://example.com/a.png" })]);
  const l2 = newLesson("Bài 2", undefined, [newBlock("practice", { id: "b3", practiceSetId: "if-basic", minScore: 70 })]);
  const l3 = { ...newLesson("Bài 3", undefined, [newBlock("text", { id: "b4", body: "y" })]), alwaysOpen: true };
  const l4 = newLesson("Bài 4", undefined, [newBlock("text", { id: "b5", body: "z" })]);
  return { id: "c", ownerId: "t1", title: "K", description: "", grade: 10, textbookId: "kntt", topics: [newTopic("T", "F", [l1, l2, l3, l4])], sequential, classIds: [], status: "draft", createdAt: "", updatedAt: "" };
}
const prog = (done: string[]): CourseProgress => ({ studentId: "s1", courseId: "c", done: Object.fromEntries(done.map((id) => [id, { at: "" }])), updatedAt: "" });
const attempt = (correct: number, total: number): PracticeAttempt => ({
  id: "a", studentId: "s1", setId: "if-basic", mode: "practice", startedAt: "", finishedAt: "",
  items: Array.from({ length: total }, (_, i) => ({ questionId: `q${i}`, objectiveId: "O", status: i < correct ? "correct" : "wrong", answer: "" })),
});

describe("Khóa học: hoàn thành và khóa bài", () => {
  it("bài hoàn thành khi xong mọi khối bắt buộc (khối không bắt buộc không cần)", () => {
    const l1 = allLessons(course(false))[0];
    expect(isLessonDone(l1, { progress: prog(["b1"]), practiceAttempts: [], studentId: "s1" })).toBe(true);
    expect(isLessonDone(l1, { progress: prog(["b2"]), practiceAttempts: [], studentId: "s1" })).toBe(false);
  });

  it("khối luyện tập tự hoàn thành khi đạt ngưỡng điểm, chưa đạt thì chưa", () => {
    const l2 = allLessons(course(false))[1];
    expect(isLessonDone(l2, { practiceAttempts: [attempt(5, 8)], studentId: "s1" })).toBe(false); // 63%
    expect(isLessonDone(l2, { practiceAttempts: [attempt(5, 8), attempt(6, 8)], studentId: "s1" })).toBe(true); // 75%
    expect(isLessonDone(l2, { practiceAttempts: [attempt(8, 8)], studentId: "s2" })).toBe(false); // bài của học sinh khác
  });

  it("học lần lượt: bài sau khóa tới khi xong bài trước; bài 'mở tự do' luôn mở", () => {
    const st = lessonStates(course(true), { progress: prog([]), practiceAttempts: [], studentId: "s1" });
    expect(st.map((s) => s.locked)).toEqual([false, true, false, true]);
    const st2 = lessonStates(course(true), { progress: prog(["b1"]), practiceAttempts: [], studentId: "s1" });
    expect(st2.map((s) => s.locked)).toEqual([false, false, false, true]);
  });

  it("không học lần lượt thì không khóa bài nào", () => {
    const st = lessonStates(course(false), { progress: prog([]), practiceAttempts: [], studentId: "s1" });
    expect(st.every((s) => !s.locked)).toBe(true);
  });

  it("tính phần trăm hoàn thành khóa học", () => {
    expect(courseCompletion(course(false), { progress: prog(["b1", "b4"]), practiceAttempts: [], studentId: "s1" })).toEqual({ done: 2, total: 4, percent: 50 });
  });
});

describe("Khóa học: soạn và phát hành", () => {
  it("dựng khung theo chương trình đúng khối/bộ sách, có khối kiến thức", () => {
    const topics = scaffoldTopics(10, "kntt");
    const lessons = topics.flatMap((t) => t.lessons);
    expect(topics).toHaveLength(6);
    expect(lessons).toHaveLength(34);
    expect(lessons.every((l) => l.blocks[0].kind === "text")).toBe(true);
    expect(lessons.find((l) => l.lessonId === "L-10-if-kntt")?.title).toBe("Bài 19. Câu lệnh rẽ nhánh if");
    expect(scaffoldTopics(10, "cd").flatMap((t) => t.lessons).every((l) => l.lessonId?.endsWith("-cd"))).toBe(true);
  });

  it("kéo thả sắp xếp không làm mất phần tử", () => {
    expect(moveItem(["a", "b", "c", "d"], 0, 2)).toEqual(["b", "c", "a", "d"]);
    expect(moveItem(["a", "b", "c"], 2, 0)).toEqual(["c", "a", "b"]);
    expect(moveItem(["a", "b"], 0, 5)).toEqual(["a", "b"]);
  });

  it("chặn phát hành khi khối thiếu mô phỏng / bài Python / bộ câu hỏi", () => {
    const c = course(false);
    c.topics[0].lessons[0].blocks.push(newBlock("simulation"), newBlock("python"));
    const r = validateForPublish(c);
    expect(r.errors.some((e) => e.includes("mô phỏng"))).toBe(true);
    expect(r.errors.some((e) => e.includes("Python"))).toBe(true);
    expect(validateForPublish(course(false)).errors).toEqual([]);
  });

  it("chuyển link YouTube sang link nhúng", () => {
    expect(youtubeEmbed("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ");
    expect(youtubeEmbed("https://youtu.be/dQw4w9WgXcQ?t=3")).toBe("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ");
    expect(youtubeEmbed("https://example.com/video.mp4")).toBeNull();
  });
});

describe("Khóa học: chương → bài → hoạt động, bài kiểm tra cuối bài", () => {
  it("dựng khung KNTT có tên chương, mô phỏng theo bài và bài kiểm tra cuối bài", () => {
    const topics = scaffoldTopics(10, "kntt");
    expect(topics[0].title.startsWith("Chương 1.")).toBe(true);
    const lessons = topics.flatMap((t) => t.lessons);
    expect(lessons.every((l) => l.sgkRef)).toBe(true);
    expect(lessons.filter((l) => finalTest(l)).length).toBeGreaterThan(25);
    expect(lessons.some((l) => l.blocks.some((b) => b.kind === "simulation" && b.labSlug))).toBe(true);
    const c = { ...course(false), topics };
    expect(validateForPublish(c).errors).toEqual([]);
  });

  it("bảng tiến độ: hoàn thành / đang học / chưa mở và điểm bài kiểm tra", () => {
    const d = buildSeed();
    const c = d.courses.find((x) => x.id === "course-10-t2")!;
    const ctx = { progress: undefined, practiceAttempts: d.practiceAttempts, studentId: "s16" };
    const cells = lessonCells(c, ctx);
    expect(cells.length).toBe(allLessons(c).length);
    expect(cells.some((x) => x.test !== null)).toBe(true);
    expect(cells.some((x) => x.state === "locked")).toBe(true); // học lần lượt
    expect(cells.every((x) => x.state !== "done" || x.test === null || x.test >= 0)).toBe(true);
  });

  it("bài giao biết mình thuộc khóa học hay giao độc lập; sổ điểm phân biệt chưa nộp và còn hạn", () => {
    const d = buildSeed();
    const a = (id: string) => d.assignments.find((x) => x.id === id)!;
    expect(assignmentCourse(d, a("as-seed-t2-7"))?.course.id).toBe("course-10-t2");
    expect(assignmentCourse(d, a("as-seed-t2-7"))?.lesson?.sgkRef).toBe("10-7");
    expect(assignmentCourse(d, a("as-seed-t2-code"))).toBeUndefined();
    const now = Date.now();
    const code = gradeCell(d, "s16", a("as-seed-t2-code"), now);
    expect(code.status).toBe("open");
    const quiz = ["s16", "s17", "s18"].map((s) => gradeCell(d, s, a("as-seed-t2-7"), now));
    expect(quiz.every((g) => g.status === "graded" || g.status === "missing")).toBe(true);
    expect(quiz.some((g) => g.status === "graded" && g.ratio! > 0)).toBe(true);
  });
});

describe("Khóa học mẫu", () => {
  it("bài Câu lệnh rẽ nhánh có đủ 5 loại nội dung và hợp lệ để phát hành", () => {
    const [c] = seedCourses("2026-01-01T00:00:00Z");
    const ifLesson = allLessons(c).find((l) => l.id === "seed-cl-if")!;
    expect(ifLesson.blocks.map((b) => b.kind)).toEqual(["text", "media", "simulation", "python", "practice"]);
    expect(validateForPublish(c).errors).toEqual([]);
    expect(new Set(allLessons(c).flatMap((l) => l.blocks.map((b) => b.id))).size).toBe(allLessons(c).reduce((n, l) => n + l.blocks.length, 0));
  });

  it("chỉ học sinh lớp được phát hành mới thấy khóa học", () => {
    const d = buildSeed();
    const visible = (sid: string) => d.courses.filter((c) => c.status === "published" && c.classIds.some((id) => studentClassIds(d, sid).includes(id)));
    expect(visible("s1").map((c) => c.id)).toContain("course-10-kntt"); // 10A1
    expect(visible("s16").map((c) => c.id)).toEqual(["course-10-t2"]); // 10A2 chỉ thấy khóa của cô Bảo
  });
});
