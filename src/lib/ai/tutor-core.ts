/**
 * AI Gia sư EduNova — lõi xử lý (không phụ thuộc React).
 * Bốn khả năng: giải thích kiến thức, hướng dẫn từng bước, phân tích lỗi, gợi ý luyện tập.
 * Ba mức do giáo viên đặt: học tự do, luyện tập có hướng dẫn, kiểm tra (tắt).
 * Mọi nhận định về lỗi dựa trên TRẠNG THÁI THẬT của bài (mã nguồn, kết quả kiểm thử, trạng thái mô phỏng);
 * dữ kiện kiểm chứng được (giá trị biến, đúng/sai của điều kiện) do code tính bằng trình thông dịch, không để mô hình đoán.
 */
import type { HintMode } from "@/lib/domain/types";
import { CODING_EXERCISES, getExercise } from "@/lib/data/coding-exercises";
import { PRACTICE_SETS } from "@/lib/data/practice";
import { runPython } from "@/lib/py/interpreter";
import { LIB, detectTopic, type Topic } from "./tutor";

export type TutorCapability = "explain" | "guide" | "debug" | "practice";
export type TutorLevel = "free" | "guided" | "exam";

export const CAPABILITY_LABEL: Record<TutorCapability, string> = {
  explain: "Giải thích kiến thức",
  guide: "Hướng dẫn từng bước",
  debug: "Phân tích lỗi",
  practice: "Gợi ý luyện tập",
};
export const LEVEL_LABEL: Record<TutorLevel, string> = { free: "Học tự do", guided: "Luyện tập có hướng dẫn", exam: "Kiểm tra" };
/** Mức hỗ trợ của bài giao (trường hintMode sẵn có) → mức của gia sư. */
export const LEVEL_FROM_HINT: Record<HintMode, TutorLevel> = { full: "free", guided: "guided", off: "exam" };

export interface TutorTest {
  name: string;
  stdin: string[];
  expected: string;
  actual: string;
  pass: boolean;
  error?: string;
}

export type TutorState =
  | { kind: "code"; task?: string; exerciseId?: string; code: string; runError?: { type: string; line: number; explain: string }; tests?: TutorTest[] }
  | {
      kind: "simulation"; sim: string; summary: string; problems: string[]; facts: Record<string, string | number | boolean>;
      /** Câu hỏi gợi mở theo bậc, tính từ trạng thái mô phỏng (src/lib/ai/sim-hints.ts). Không chứa đáp án. */
      ladder?: string[];
    }
  | { kind: "quiz"; question: string; answer?: string; correct?: boolean }
  | { kind: "lesson"; section?: string };

export interface TutorQuiz {
  question: string;
  code?: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface TutorRequest {
  capability: TutorCapability;
  message: string;
  level: TutorLevel;
  topic: Topic;
  title?: string;
  state?: TutorState;
  /** Số gợi ý đã nhận trong hoạt động này */
  hintCount: number;
  /** Học sinh bấm "Xem lời giải" */
  askSolution?: boolean;
  /** Bài lập trình học sinh đã làm đạt (để không gợi ý lại) */
  passedExercises?: string[];
  history?: { role: "me" | "ai"; text: string }[];
}

export interface TutorReply {
  reply: string;
  code?: string;
  quiz?: TutorQuiz;
  suggestions?: { label: string; href: string }[];
  /** Phần trạng thái gia sư đã đọc (hiển thị cho học sinh) */
  usedState: string[];
  source: "ai" | "rules";
  /** Gợi ý này là gợi ý thứ mấy (tăng khi hướng dẫn từng bước) */
  hintStep: number;
}

/** Tối thiểu số gợi ý trước khi được xem lời giải (chỉ ở mức Học tự do). */
export const HINTS_BEFORE_SOLUTION = 2;

const lib = (t: Topic) => LIB[t === "general" ? "if" : t];

/** Tóm tắt phần trạng thái đã đọc, ghi cho học sinh biết gia sư dựa vào đâu. */
export function describeState(s?: TutorState): string[] {
  if (!s) return [];
  if (s.kind === "code") {
    const out = ["mã nguồn"];
    if (s.runError) out.push(`lỗi ${s.runError.type} ở dòng ${s.runError.line}`);
    if (s.tests?.length) out.push(`kiểm thử ${s.tests.filter((t) => t.pass).length}/${s.tests.length} đạt`);
    return out;
  }
  if (s.kind === "simulation") return [`trạng thái ${s.sim}`, ...(s.problems.length ? [`${s.problems.length} vấn đề`] : [])];
  if (s.kind === "quiz") return ["câu hỏi đang làm", ...(s.answer !== undefined ? ["câu trả lời của em"] : [])];
  return s.section ? [`mục “${s.section}”`] : [];
}

/* ---------- Dữ kiện kiểm chứng: chạy thử điều kiện if trên trường hợp đang sai ---------- */

export interface ProbeFact {
  test: TutorTest;
  /** Dòng if/elif đầu tiên (không gồm "if" và ":") */
  condition: string;
  line: number;
  values: { name: string; value: string }[];
  truth: boolean;
}

const KEYWORDS = new Set(["and", "or", "not", "True", "False", "None", "in", "is", "int", "float", "str", "len", "abs", "round", "min", "max"]);

/**
 * Lấy điều kiện if/elif đầu tiên ở mức thụt lề 0, chạy phần chương trình phía trên nó với dữ liệu của trường hợp kiểm thử
 * đang sai, rồi in giá trị các biến trong điều kiện và kết quả True/False của điều kiện.
 */
export function probeCondition(code: string, test: TutorTest): ProbeFact | null {
  const lines = code.split("\n");
  const idx = lines.findIndex((l) => /^(if|elif)\s+.+:\s*(#.*)?$/.test(l));
  if (idx < 0) return null;
  const condition = lines[idx].replace(/^(if|elif)\s+/, "").replace(/:\s*(#.*)?$/, "").trim();
  const names = [...new Set((condition.match(/[A-Za-z_][A-Za-z0-9_]*/g) ?? []).filter((n) => !KEYWORDS.has(n)))].slice(0, 4);
  const prefix = lines.slice(0, idx).filter((l) => !/^\s/.test(l) || l.trim() === "").join("\n");
  const probe = `${prefix}\n${names.map((n) => `print(${n})`).join("\n")}\nprint(${condition})`;
  const r = runPython(probe, { stdin: test.stdin, echoInput: false, trace: false, maxSteps: 20_000 });
  if (!r.ok) return null;
  const out = r.output.trim().split("\n").slice(-(names.length + 1));
  const last = out[out.length - 1]?.trim();
  if (last !== "True" && last !== "False") return null;
  return { test, condition, line: idx + 1, values: names.map((name, i) => ({ name, value: out[i]?.trim() ?? "?" })), truth: last === "True" };
}

export function firstProbe(s?: TutorState): ProbeFact | null {
  if (s?.kind !== "code" || s.runError) return null;
  const failing = s.tests?.find((t) => !t.pass && !t.error);
  return failing ? probeCondition(s.code, failing) : null;
}

const valuesText = (p: ProbeFact) => p.values.map((v) => `${v.name} = ${v.value}`).join(" và ");

function probeReply(p: ProbeFact): Pick<TutorReply, "reply" | "quiz"> {
  return {
    reply: `Cô thấy em đang dùng câu lệnh if/else. Chương trình đang sai ở trường hợp “${p.test.name}”. Trước tiên, em hãy thử với ${valuesText(p)}.\n\nTheo em, điều kiện ${p.condition} lúc này đúng hay sai?`,
    quiz: {
      question: `Với ${valuesText(p)}, điều kiện ${p.condition} là:`,
      options: ["Đúng", "Sai"],
      correctIndex: p.truth ? 0 : 1,
      explanation: `${p.condition} là ${p.truth ? "True" : "False"}, nên chương trình chạy nhánh ${p.truth ? "if" : "else"}. Kết quả mong đợi là “${p.test.expected}”, chương trình của em in “${p.test.actual || "(không in gì)"}”. Em xem nhánh đó đã làm đúng việc chưa?`,
    },
  };
}

/* ---------- Gợi ý luyện tập ---------- */

const EX_TOPIC: Partial<Record<Topic, (topic: string) => boolean>> = {
  if: (t) => /if/i.test(t),
  logic: (t) => /logic/i.test(t),
  loop: (t) => /lặp/i.test(t),
};
const SET_TOPIC: Partial<Record<Topic, string[]>> = { if: ["if-basic"], logic: ["logic"], test: ["logic"], loop: ["loop"], binary: ["binary"] };

export function practiceSuggestions(topic: Topic, passed: string[] = []): { label: string; href: string }[] {
  const match = EX_TOPIC[topic];
  const ex = match ? CODING_EXERCISES.filter((x) => match(x.topic) && !passed.includes(x.id)).slice(0, 2) : [];
  const sets = (SET_TOPIC[topic] ?? []).map((id) => PRACTICE_SETS.find((s) => s.id === id)).filter((s): s is NonNullable<typeof s> => Boolean(s));
  return [
    ...ex.map((x) => ({ label: `Lập trình: ${x.title}`, href: `/student/code?bai=${x.id}` })),
    ...sets.map((s) => ({ label: `Trắc nghiệm: ${s.title}`, href: `/student/practice/${s.id}?che-do=practice` })),
  ];
}

/* ---------- Bộ luật (dùng khi không có mô hình AI, hoặc mô hình lỗi) ---------- */

export function lockedReply(): TutorReply {
  return { reply: "Hoạt động này là bài kiểm tra nên AI Gia sư tạm tắt theo quy định của thầy cô. Em hãy tự tin làm bài; sau khi nộp, em có thể hỏi lại.", usedState: [], source: "rules", hintStep: 0 };
}

/** Lời giải chỉ đưa ở mức Học tự do, khi em đã nhận đủ gợi ý và tự bấm "Xem lời giải". */
export function solutionPolicy(req: TutorRequest): "allow" | "need_hints" | "not_allowed" {
  if (req.level !== "free") return "not_allowed";
  return req.hintCount >= HINTS_BEFORE_SOLUTION ? "allow" : "need_hints";
}

export function ruleTutor(req: TutorRequest): TutorReply {
  if (req.level === "exam") return lockedReply();
  const topic = req.topic === "general" ? detectTopic(req.message, "if") : req.topic;
  const L = lib(topic);
  const used = describeState(req.state);
  const step = Math.min(req.hintCount, L.hints.length - 1);
  const s = req.state;
  const base = { usedState: used, source: "rules" as const };

  if (req.askSolution || /lời giải|đáp án|giải hộ|làm hộ|viết hộ|full code/i.test(req.message)) {
    const policy = solutionPolicy(req);
    const ex = s?.kind === "code" && s.exerciseId ? getExercise(s.exerciseId) : undefined;
    if (policy === "allow" && ex) return { ...base, reply: "Đây là một lời giải. Em đọc từng dòng, đối chiếu với chương trình của mình, rồi tự gõ lại và chạy kiểm thử nhé.", code: ex.solution, hintStep: req.hintCount };
    if (policy === "need_hints") return { ...base, reply: `Em thử thêm ${HINTS_BEFORE_SOLUTION - req.hintCount} gợi ý nữa trước khi xem lời giải nhé. ${L.hints[step]}`, hintStep: step + 1 };
    return { ...base, reply: `Ở hoạt động này cô không đưa lời giải, để em tự làm được. Cô gợi ý nhé: ${L.hints[step]}`, hintStep: step + 1 };
  }

  switch (req.capability) {
    case "explain": {
      const simpler = /đơn giản|dễ hiểu|chưa hiểu/i.test(req.message);
      return req.level === "free"
        ? { ...base, reply: `${simpler ? L.simpler : L.explain}\n\n${L.example.text}`, code: L.example.code, hintStep: 0 }
        : { ...base, reply: `${simpler ? L.simpler : L.explain}\n\n${L.socratic[0]}`, hintStep: 0 };
    }
    case "practice": {
      const sug = practiceSuggestions(topic, req.passedExercises);
      return { ...base, reply: sug.length ? "Dựa trên phần em đang học, em thử các bài tương tự này:" : "Em đã làm hết bài luyện tập của chủ đề này. Thử chủ đề tiếp theo nhé!", suggestions: sug, hintStep: 0 };
    }
    case "guide":
    case "debug": {
      if (s?.kind === "code") {
        if (s.runError) return { ...base, reply: `Chương trình dừng ở dòng ${s.runError.line} với lỗi ${s.runError.type}: ${s.runError.explain}\n\nEm nhìn dòng ${s.runError.line} và dòng ngay phía trên. Em thấy thiếu hoặc thừa gì?`, hintStep: step + 1 };
        if (!s.tests) return { ...base, reply: "Em bấm Kiểm thử trước nhé, để cô xem chương trình sai ở trường hợp nào rồi cùng tìm nguyên nhân.", hintStep: 0 };
        if (s.tests.every((t) => t.pass)) return { ...base, reply: "Chương trình của em đã đạt tất cả trường hợp kiểm thử. Em thử giải thích vì sao chương trình đúng ở trường hợp giá trị biên nhé?", hintStep: 0 };
        const p = firstProbe(s);
        if (p && req.hintCount === 0) return { ...base, ...probeReply(p), hintStep: 1 };
        const f = s.tests.find((t) => !t.pass)!;
        return { ...base, reply: `Trường hợp “${f.name}” (dữ liệu vào: ${f.stdin.join(", ") || "không có"}) mong đợi “${f.expected}” nhưng chương trình in “${f.actual || f.error || "(không in gì)"}”.\n\n${L.hints[step]}`, hintStep: step + 1 };
      }
      if (s?.kind === "simulation") {
        // Có thang câu hỏi: hỏi gợi mở đúng chỗ em đang làm, không nói đáp án; mỗi lần hỏi thêm thì cụ thể hơn một bậc.
        if (s.ladder?.length) {
          const i = Math.min(req.hintCount, s.ladder.length - 1);
          return { ...base, reply: `${i === 0 ? "Cô đang nhìn mô phỏng của em. " : ""}${s.ladder[i]}`, hintStep: req.hintCount + 1 };
        }
        if (!s.problems.length) return { ...base, reply: `Cô đã xem ${s.sim}: ${s.summary} Chưa thấy vấn đề nào. Em muốn thử tình huống nào tiếp theo?`, hintStep: 0 };
        return { ...base, reply: `Cô thấy trong ${s.sim}: ${s.problems[0]}\n\n${L.socratic[req.hintCount % L.socratic.length]}`, hintStep: step + 1 };
      }
      if (s?.kind === "quiz" && s.correct === false) return { ...base, reply: `Câu trả lời “${s.answer}” chưa đúng. Em đọc lại câu hỏi và gạch chân từ khóa quan trọng. ${L.socratic[req.hintCount % L.socratic.length]}`, hintStep: step + 1 };
      return req.capability === "guide"
        ? { ...base, reply: L.hints[step], hintStep: step + 1 }
        : { ...base, reply: "Cô chưa thấy kết quả chạy hay kiểm thử nào trong hoạt động này. Em chạy chương trình hoặc làm thử mô phỏng, rồi hỏi lại để cô xem trạng thái thật nhé.", hintStep: 0 };
    }
  }
}
