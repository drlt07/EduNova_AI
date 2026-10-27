/** Chấm câu luyện tập. Dự đoán đầu ra và điền code được đối chiếu bằng cách chạy chương trình thật. */
import type { PracticeQuestion } from "@/lib/data/practice";
import { normalizeOutput, runPython } from "@/lib/py/interpreter";

export type Answer = number | boolean | string | string[] | null;
export interface GradeResult {
  /** correct/wrong: chấm tự động; self: học sinh tự đánh giá (không tính vào mức đạt) */
  status: "correct" | "wrong" | "self";
  expected?: string;
  detail?: string;
}

export function predictAnswer(q: Extract<PracticeQuestion, { kind: "predict" }>): string {
  const r = runPython(q.code, { stdin: q.stdin, echoInput: false, trace: false });
  return normalizeOutput(r.ok ? r.output : `${r.error!.type}`);
}

const norm = (s: string) => normalizeOutput(s).replace(/\s+/g, " ").trim();

export function gradeQuestion(q: PracticeQuestion, answer: Answer, ctx: { passedLevels?: number[] } = {}): GradeResult {
  switch (q.kind) {
    case "mcq":
      return { status: answer === q.correctIndex ? "correct" : "wrong", expected: q.options[q.correctIndex] };
    case "truefalse":
      return { status: answer === q.answer ? "correct" : "wrong", expected: q.answer ? "Đúng" : "Sai" };
    case "order": {
      const ok = Array.isArray(answer) && answer.length === q.lines.length && answer.every((l, i) => l === q.lines[i]);
      return { status: ok ? "correct" : "wrong", expected: q.lines.join("\n") };
    }
    case "predict": {
      const expected = predictAnswer(q);
      return { status: typeof answer === "string" && norm(answer) === norm(expected) ? "correct" : "wrong", expected };
    }
    case "finderror":
      return { status: answer === q.errorLine ? "correct" : "wrong", expected: `Dòng ${q.errorLine}` };
    case "fillcode": {
      const fill = typeof answer === "string" ? answer.trim() : "";
      if (!fill) return { status: "wrong", expected: q.reference, detail: "Chưa điền." };
      for (const stdin of q.tests) {
        const ref = runPython(q.template.replace("___", q.reference), { stdin, echoInput: false, trace: false });
        const got = runPython(q.template.replace("___", fill), { stdin, echoInput: false, trace: false, maxSteps: 20_000 });
        if (!got.ok) return { status: "wrong", expected: q.reference, detail: `${got.error!.type}: ${got.error!.explain}` };
        if (normalizeOutput(got.output) !== normalizeOutput(ref.output))
          return { status: "wrong", expected: q.reference, detail: `Sai với dữ liệu vào ${stdin.join(", ")}: in ra "${normalizeOutput(got.output)}", cần "${normalizeOutput(ref.output)}".` };
      }
      return { status: "correct", expected: q.reference };
    }
    case "short":
      return { status: "self", expected: q.sample };
    case "sim":
      return { status: ctx.passedLevels?.includes(q.level) ? "correct" : "wrong", detail: ctx.passedLevels?.includes(q.level) ? undefined : "Chưa hoàn thành cấp độ này trong trò chơi." };
  }
}

/** Trộn cố định (không ngẫu nhiên) để thứ tự hiển thị ổn định giữa các lần render. */
export function shuffled<T>(items: T[], seed: string): T[] {
  let h = 0;
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    h = (h * 1103515245 + 12345) >>> 0;
    const j = h % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  if (a.every((x, i) => x === items[i]) && a.length > 1) [a[0], a[1]] = [a[1], a[0]];
  return a;
}

/** Luyện tập thích ứng (luật): ưu tiên mục tiêu có tỉ lệ đúng thấp nhất, câu chưa làm trước. */
export function pickNext(pool: PracticeQuestion[], history: { questionId: string; status: GradeResult["status"] }[]): PracticeQuestion | undefined {
  const byObj = new Map<string, { ok: number; n: number }>();
  for (const h of history) {
    const q = pool.find((x) => x.id === h.questionId);
    if (!q || h.status === "self") continue;
    const cur = byObj.get(q.objectiveId) ?? { ok: 0, n: 0 };
    byObj.set(q.objectiveId, { ok: cur.ok + (h.status === "correct" ? 1 : 0), n: cur.n + 1 });
  }
  const done = new Set(history.map((h) => h.questionId));
  const rate = (o: string) => { const v = byObj.get(o); return v ? v.ok / v.n : 0.5; };
  const remaining = pool.filter((q) => !done.has(q.id));
  return remaining.sort((a, b) => rate(a.objectiveId) - rate(b.objectiveId))[0];
}
