/** Câu hỏi luyện tập soạn riêng cho từng bài (khoảng 10 câu trắc nghiệm, thứ tự phương án đã xáo cố định) và câu thao tác mô phỏng của các bài thực hành. */
import type { Grade } from "@/lib/domain/types";
import type { PracticeQuestion, PracticeSet } from "./practice";
import { QUIZ_G10, type Q } from "./sgk-quiz/g10";
import { QUIZ_G11 } from "./sgk-quiz/g11";
import { QUIZ_G12 } from "./sgk-quiz/g12";
import { PROCEDURES } from "./sgk-quiz/procedures";
import { findSgk } from "./sgk-kntt";
import { registerLessonObjectives } from "./curriculum";

const lessonName = (ref: string) => { const f = findSgk(ref); return f ? `Bài ${f.lesson.no}. ${f.lesson.title}` : `Bài ${ref.split("-")[1]}`; };

/** Mục tiêu tạm cho câu hỏi theo bài chưa gắn yêu cầu cần đạt đã thẩm định. */
export const sgkObjective = (ref: string) => `SGK-${ref}`;

/** Xáo phương án theo hạt giống cố định (cùng câu luôn cùng thứ tự). */
function shuffle(n: number, seed: string): number[] {
  let h = 2166136261;
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0;
  const a = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) { h = (Math.imul(h, 1103515245) + 12345) >>> 0; const j = h % (i + 1); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

function build(ref: string, qs: Q[]): PracticeQuestion[] {
  return qs.map(([prompt, options, answer, explanation], i) => {
    const id = `k-${ref}-${i + 1}`;
    const order = shuffle(options.length, id);
    return { id, kind: "mcq", objectiveId: sgkObjective(ref), prompt, options: order.map((k) => options[k]), correctIndex: order.indexOf(answer), explanation };
  });
}

const ALL: Record<string, Q[]> = { ...QUIZ_G10, ...QUIZ_G11, ...QUIZ_G12 };
const MCQ = Object.fromEntries(Object.entries(ALL).map(([ref, qs]) => [ref, build(ref, qs)])) as Record<string, PracticeQuestion[]>;
const PROC_Q: PracticeQuestion[] = PROCEDURES.map((p) => ({ id: p.id, kind: "interactive", objectiveId: sgkObjective(p.ref), prompt: p.prompt, widget: { type: "procedure", app: p.app, steps: p.steps }, explanation: p.explanation }));

registerLessonObjectives(Object.fromEntries([...Object.keys(ALL), ...PROCEDURES.map((p) => p.ref)].map((ref) => [sgkObjective(ref), `Nắm được nội dung ${lessonName(ref)} (Tin ${ref.split("-")[0]})`])));

export const SGK_QUESTIONS: PracticeQuestion[] = [...Object.values(MCQ).flat(), ...PROC_Q];

/** Mỗi bài một bộ: 10 câu trắc nghiệm, cộng thêm câu thao tác mô phỏng nếu là bài thực hành. */
export const SGK_SETS: PracticeSet[] = Object.entries(MCQ).map(([ref, qs]) => {
  const ps = PROC_Q.filter((p) => p.objectiveId === sgkObjective(ref));
  return {
    id: `bai-${ref}`, title: `Luyện tập ${lessonName(ref)}`, grade: Number(ref.split("-")[0]) as Grade, lessonKey: "", sgkRef: ref,
    description: `${qs.length} câu trắc nghiệm${ps.length ? ` + ${ps.length} câu thao tác mô phỏng` : ""} theo nội dung bài.`,
    questionIds: [...qs, ...ps].map((q) => q.id),
  };
});
