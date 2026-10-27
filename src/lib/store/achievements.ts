import type { DemoData } from "@/lib/data/seed";
import { studentAssessments } from "./scoped";

export interface Achievement {
  id: string;
  title: string;
  description: string;
  earned: boolean;
  progress: number; // 0..100
}

/** Huy hiệu cá nhân tính từ minh chứng của chính học sinh. Không có bảng xếp hạng. */
export function computeAchievements(d: DemoData, studentId: string): Achievement[] {
  const attempts = d.attempts.filter((a) => a.studentId === studentId);
  const ids = new Set(attempts.map((a) => a.id));
  const ev = d.events.filter((e) => ids.has(e.attemptId));
  const runs = ev.filter((e) => e.type === "run").length;
  const perfectTest = ev.some((e) => e.type === "test" && e.pass === true);
  const maxRunsInAttempt = Math.max(0, ...attempts.map((a) => ev.filter((e) => e.attemptId === a.id && e.type === "run").length));
  const subs = d.submissions.filter((s) => s.studentId === studentId).length;
  const finals = studentAssessments(d, studentId);
  const best = Math.max(0, ...finals.map((a) => {
    const r = d.rubrics.find((x) => x.id === a.rubricId);
    const max = r ? r.criteria.reduce((t, c) => t + c.maxScore, 0) : 1;
    return a.scores.reduce((t, s) => t + s.score, 0) / max;
  }));
  const web = d.portfolio.some((p) => p.studentId === studentId && p.kind === "web");
  const free = attempts.some((a) => !a.assignmentId) || d.gameProgress.some((g) => g.studentId === studentId) || d.codeWorks.some((c) => c.studentId === studentId) || d.practiceAttempts.some((a) => a.studentId === studentId);
  const farm = d.gameProgress.find((g) => g.studentId === studentId && g.gameSlug === "smart-farm");
  const farmPassed = farm?.passed.length ?? 0;
  const codeDone = d.codeWorks.filter((c) => c.studentId === studentId && c.lastRun && c.lastRun.passed === c.lastRun.total).length;
  const practiceBest = Math.max(0, ...d.practiceAttempts.filter((a) => a.studentId === studentId).map((a) => {
    const s = a.items.filter((i) => i.status !== "self");
    return s.length ? s.filter((i) => i.status === "correct").length / s.length : 0;
  }));
  const projectsDone = d.projects.filter((p) => p.studentId === studentId && p.status === "done").length;
  const lessonsDone = d.lessonProgress.filter((p) => p.studentId === studentId && p.quiz && p.quiz.correct === p.quiz.total).length;
  const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));
  return [
    { id: "first-run", title: "Nhà thí nghiệm", description: "Chạy thử mô phỏng lần đầu", earned: runs >= 1, progress: clamp(runs * 100) },
    { id: "tester", title: "Kiểm thử giỏi", description: "Đạt mọi trường hợp kiểm thử", earned: perfectTest, progress: perfectTest ? 100 : 0 },
    { id: "persistent", title: "Kiên trì", description: "Chạy thử ≥ 5 lần trong một lượt làm", earned: maxRunsInAttempt >= 5, progress: clamp((maxRunsInAttempt / 5) * 100) },
    { id: "submitter", title: "Hoàn thành nhiệm vụ", description: "Nộp bài nhiệm vụ đầu tiên", earned: subs >= 1, progress: clamp(subs * 100) },
    { id: "mastery", title: "Đạt chuẩn", description: "Đạt từ 80% điểm trở lên trong một nhiệm vụ", earned: best >= 0.8, progress: clamp((best / 0.8) * 100) },
    { id: "explorer", title: "Tự học", description: "Tự chọn luyện một trò chơi, bài lập trình hoặc bộ câu hỏi", earned: free, progress: free ? 100 : 0 },
    { id: "web", title: "Nhà thiết kế web", description: "Lưu một trang web vào hồ sơ học tập", earned: web, progress: web ? 100 : 0 },
    { id: "farmer", title: "Nông dân số", description: "Hoàn thành mọi cấp của Nông trại thông minh", earned: farmPassed >= 4, progress: clamp((farmPassed / 4) * 100) },
    { id: "coder", title: "Lập trình viên nhí", description: "Đạt mọi kiểm thử ở 3 bài lập trình", earned: codeDone >= 3, progress: clamp((codeDone / 3) * 100) },
    { id: "quiz", title: "Luyện tập chăm chỉ", description: "Đạt từ 80% trong một bộ luyện tập", earned: practiceBest >= 0.8, progress: clamp((practiceBest / 0.8) * 100) },
    { id: "lesson", title: "Hiểu bài", description: "Trả lời đúng hết câu hỏi kiểm tra nhanh của một bài học", earned: lessonsDone >= 1, progress: lessonsDone ? 100 : 0 },
    { id: "maker", title: "Nhà sáng tạo", description: "Hoàn thành một dự án ở Xưởng dự án", earned: projectsDone >= 1, progress: projectsDone ? 100 : 0 },
  ];
}
