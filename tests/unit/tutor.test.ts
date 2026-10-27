import { describe, expect, it } from "vitest";
import { getExercise } from "@/lib/data/coding-exercises";
import { normalizeOutput, runPython } from "@/lib/py/interpreter";
import { LEVEL_FROM_HINT, firstProbe, practiceSuggestions, probeCondition, ruleTutor, type TutorRequest, type TutorState, type TutorTest } from "@/lib/ai/tutor-core";
import { askTutor, buildTutorPrompt } from "@/lib/ai/tutor-llm";

const EX = getExercise("if-max")!;
/** Học sinh viết sai điều kiện: in số nhỏ hơn thay vì số lớn hơn. */
const WRONG = "a = int(input())\nb = int(input())\nif a < b:\n    print(a)\nelse:\n    print(b)";

function testsFor(code: string): TutorTest[] {
  return EX.tests.map((t) => {
    const ref = runPython(EX.solution, { stdin: t.stdin, echoInput: false, trace: false });
    const got = runPython(code, { stdin: t.stdin, echoInput: false, trace: false });
    const expected = normalizeOutput(ref.output);
    const actual = got.ok ? normalizeOutput(got.output) : "";
    return { name: t.name, stdin: t.stdin, expected, actual, pass: got.ok && actual === expected };
  });
}
const codeState = (code = WRONG): TutorState => ({ kind: "code", exerciseId: EX.id, task: EX.task, code, tests: testsFor(code) });
const req = (patch: Partial<TutorRequest>): TutorRequest => ({ capability: "debug", message: "Em không hiểu tại sao chương trình của em cho kết quả sai.", level: "guided", topic: "if", hintCount: 0, ...patch });

describe("AI Gia sư: dữ kiện kiểm chứng từ bài làm thật", () => {
  it("chạy thử điều kiện trên trường hợp đang sai và tính đúng giá trị biến, đúng/sai", () => {
    const p = probeCondition(WRONG, { name: "thử", stdin: ["5", "9"], expected: "9", actual: "5", pass: false })!;
    expect(p.condition).toBe("a < b");
    expect(p.values).toEqual([{ name: "a", value: "5" }, { name: "b", value: "9" }]);
    expect(p.truth).toBe(true);
    const q = probeCondition(EX.solution, { name: "thử", stdin: ["5", "9"], expected: "9", actual: "9", pass: true })!;
    expect(q.condition).toBe("a > b");
    expect(q.truth).toBe(false);
  });

  it("phân tích lỗi: hỏi gợi mở bằng giá trị của trường hợp sai, kèm Đúng/Sai có đáp án đúng, không đưa lời giải", () => {
    const st = codeState();
    const fail = (st as Extract<TutorState, { kind: "code" }>).tests!.find((t) => !t.pass)!;
    const r = ruleTutor(req({ state: st }));
    expect(r.reply).toContain(`Chương trình đang sai ở trường hợp “${fail.name}”`);
    expect(r.reply).toMatch(/điều kiện a < b lúc này đúng hay sai\?/);
    expect(r.quiz?.options).toEqual(["Đúng", "Sai"]);
    const truth = firstProbe(st)!.truth;
    expect(r.quiz?.correctIndex).toBe(truth ? 0 : 1);
    expect(r.code).toBeUndefined();
    expect(r.usedState).toEqual(["mã nguồn", expect.stringMatching(/^kiểm thử \d\/4 đạt$/)]);
  });

  it("lỗi cú pháp: chỉ đúng dòng lỗi; chưa kiểm thử: đề nghị chạy kiểm thử thay vì đoán", () => {
    const bad = runPython("a = 5\nif a > 3\n    print(a)", {});
    const r = ruleTutor(req({ state: { kind: "code", code: "a = 5\nif a > 3\n    print(a)", runError: { type: bad.error!.type, line: bad.error!.line, explain: bad.error!.explain } } }));
    expect(r.reply).toContain(`dòng ${bad.error!.line}`);
    expect(ruleTutor(req({ state: { kind: "code", code: WRONG } })).reply).toMatch(/bấm Kiểm thử/);
    expect(ruleTutor(req({})).reply).toMatch(/chưa thấy kết quả chạy/);
  });

  it("mô phỏng: dựa trên vấn đề đọc được từ trạng thái mô phỏng", () => {
    const st: TutorState = { kind: "simulation", sim: "mô phỏng Thành phố giao thông", summary: "Pha đèn…", problems: ["Đã có 2 lần xe vượt đèn đỏ."], facts: { violations: 2 } };
    expect(ruleTutor(req({ state: st })).reply).toContain("Đã có 2 lần xe vượt đèn đỏ.");
  });
});

describe("AI Gia sư: mức hỗ trợ do giáo viên đặt", () => {
  it("ánh xạ mức của bài giao: chi tiết → học tự do, từng bước → có hướng dẫn, tắt → kiểm tra", () => {
    expect(LEVEL_FROM_HINT).toEqual({ full: "free", guided: "guided", off: "exam" });
  });

  it("kiểm tra: gia sư tắt, không gọi mô hình", async () => {
    let called = false;
    const r = await askTutor(req({ level: "exam", state: codeState() }), async () => { called = true; return { reply: "x" }; });
    expect(r.reply).toMatch(/tạm tắt/);
    expect(called).toBe(false);
  });

  it("có hướng dẫn: không đưa lời giải dù em xin", () => {
    const r = ruleTutor(req({ askSolution: true, hintCount: 5, state: codeState() }));
    expect(r.code).toBeUndefined();
    expect(r.reply).toMatch(/không đưa lời giải/);
  });

  it("học tự do: cần đủ gợi ý rồi mới có lời giải", () => {
    expect(ruleTutor(req({ level: "free", askSolution: true, hintCount: 1, state: codeState() })).code).toBeUndefined();
    expect(ruleTutor(req({ level: "free", askSolution: true, hintCount: 2, state: codeState() })).code).toBe(EX.solution);
  });

  it("mô hình AI: dùng câu trả lời của mô hình, nhưng chặn mã nguồn khi không được phép; lỗi/sai khuôn → bộ luật", async () => {
    const llm = async () => ({ reply: "Em thử a = 5, b = 9 nhé?", code: "print(max(a, b))" });
    const r = await askTutor(req({ state: codeState() }), llm);
    expect(r.source).toBe("ai");
    expect(r.reply).toBe("Em thử a = 5, b = 9 nhé?");
    expect(r.code).toBeUndefined();
    expect((await askTutor(req({ state: codeState() }), async () => { throw new Error("hết hạn mức"); })).source).toBe("rules");
    expect((await askTutor(req({ state: codeState() }), async () => ({ khong: "dung khuon" }))).source).toBe("rules");
    expect((await askTutor(req({ state: codeState() }), async () => null)).source).toBe("rules");
  });

  it("lời nhắc gửi mô hình có trạng thái thật và dữ kiện đã kiểm chứng; không có lời giải khi chưa được phép", () => {
    const prompt = buildTutorPrompt(req({ state: codeState() }));
    expect(prompt).toContain("DỮ_KIỆN_KIỂM_CHỨNG");
    expect(prompt).toContain("điều kiện a < b");
    expect(prompt).not.toContain("LỜI_GIẢI_THAM_KHẢO");
    expect(buildTutorPrompt(req({ level: "free", askSolution: true, hintCount: 2, state: codeState() }))).toContain("LỜI_GIẢI_THAM_KHẢO");
  });
});

describe("AI Gia sư: gợi ý luyện tập", () => {
  it("đề xuất bài cùng chủ đề, bỏ bài em đã làm đạt; đường dẫn có thật", () => {
    const all = practiceSuggestions("if");
    expect(all.some((s) => s.href === "/student/code?bai=if-max")).toBe(true);
    expect(practiceSuggestions("if", ["if-max"]).some((s) => s.href.includes("if-max"))).toBe(false);
    expect(all.some((s) => s.href.startsWith("/student/practice/if-basic"))).toBe(true);
  });
});

import { summarizeTutor } from "@/lib/analytics/tutor-insights";
describe("Tổng hợp AI Gia sư cho giáo viên", () => {
  const ev = (studentId: string, errorType?: string, capability: "debug" | "explain" = "debug") => ({ id: Math.random().toString(), studentId, at: "", capability, topic: "if", activity: "code" as const, level: "guided" as const, errorType, objectiveId: "O10-F-02", source: "rules" as const });
  it("chỉ tính học sinh của lớp; lỗi chỉ một em gặp bị ẩn; không có nội dung tin nhắn", () => {
    const s = summarizeTutor([ev("s1", "Sai kiểm thử"), ev("s2", "Sai kiểm thử"), ev("s3", "SyntaxError"), ev("s16", "Sai kiểm thử")], ["s1", "s2", "s3"]);
    expect(s.total).toBe(3);
    expect(s.errors).toEqual([{ type: "Sai kiểm thử", count: 2, students: 2 }]);
    expect(s.hiddenErrors).toBe(1);
    expect(s.objectives[0]).toMatchObject({ objectiveId: "O10-F-02", students: 3 });
    expect(JSON.stringify(s)).not.toMatch(/message|text|reply/);
  });
});
