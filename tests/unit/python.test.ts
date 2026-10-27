import { describe, expect, it } from "vitest";
import { normalizeOutput, runPython } from "@/lib/py/interpreter";

const out = (src: string, stdin: string[] = []) => {
  const r = runPython(src, { stdin, echoInput: false });
  if (!r.ok) throw new Error(`${r.error!.type}: ${r.error!.message} @${r.error!.line}`);
  return normalizeOutput(r.output);
};

describe("python subset: core semantics", () => {
  it("arithmetic matches Python (int/float, //, %, **)", () => {
    expect(out("print(7/2, 7//2, -7//2, 7%3, -7%3, 2**10, 4/2)")).toBe("3.5 3 -4 1 2 1024 2.0");
    expect(out("print(0.1+0.2)")).toBe("0.30000000000000004");
    expect(out("print(round(2.5), round(3.5), round(3.14159, 2))")).toBe("2 4 3.14");
  });
  it("if / elif / else picks the first true branch", () => {
    const src = "diem = float(input())\nif diem >= 8:\n    print('Tốt')\nelif diem >= 6.5:\n    print('Khá')\nelse:\n    print('Chưa đạt')";
    expect(out(src, ["8.5"])).toBe("Tốt");
    expect(out(src, ["6.5"])).toBe("Khá");
    expect(out(src, ["3"])).toBe("Chưa đạt");
  });
  it("loops, break, continue, lists, strings, functions", () => {
    expect(out("s = 0\nfor i in range(1, 6):\n    s += i\nprint(s)")).toBe("15");
    expect(out("i = 0\nwhile True:\n    i += 1\n    if i % 2 == 0:\n        continue\n    if i > 7:\n        break\n    print(i, end=' ')")).toBe("1 3 5 7");
    expect(out("a = [3, 1, 2]\na.append(5)\na.sort()\nprint(a, len(a), a[-1], a[1:3])")).toBe("[1, 2, 3, 5] 4 5 [2, 3]");
    expect(out("s = 'Tin hoc'\nprint(s.upper(), s[0], 'hoc' in s, s.split())")).toBe("TIN HOC T True ['Tin', 'hoc']");
    expect(out("def binh_phuong(x):\n    return x * x\nprint(binh_phuong(9))")).toBe("81");
    expect(out("def f(n):\n    if n <= 1:\n        return 1\n    return n * f(n - 1)\nprint(f(5))")).toBe("120");
    expect(out("x = 3\nprint(f'x = {x}, x^2 = {x**2}, {1/3:.2f}')")).toBe("x = 3, x^2 = 9, 0.33");
    expect(out("print(1 < 2 < 3, 3 < 2 < 4, not 0, None)")).toBe("True False True None");
    expect(out("print('a', 'b', sep='-')")).toBe("a-b");
  });
  it("input prompts are excluded when grading but shown in console mode", () => {
    expect(out("n = int(input('Nhập n: '))\nprint(n * 2)", ["4"])).toBe("8");
    const r = runPython("n = int(input('Nhập n: '))\nprint(n * 2)", { stdin: ["4"] });
    expect(r.output).toBe("Nhập n: 4\n8\n");
  });
});

describe("python subset: errors with Vietnamese explanations", () => {
  const error = (src: string, stdin: string[] = []) => runPython(src, { stdin }).error!;
  it.each([
    ["if x = 5:\n    print(x)", "SyntaxError", "=="],
    ["x = 5\nif x > 3\n    print(x)", "SyntaxError", "hai chấm"],
    ["if True:\nprint(1)", "IndentationError", "thụt lề"],
    ["print(y)", "NameError", "chưa được tạo"],
    ["print(1/0)", "ZeroDivisionError", "chia cho 0"],
    ["n = input()\nprint(n + 1)", "TypeError", "str"],
    ["a = [1]\nprint(a[3])", "IndexError", "ngoài phạm vi"],
    ["x = int('abc')", "ValueError", "số nguyên"],
    ["while True:\n    pass", "TimeoutError", "vòng lặp"],
    ["import os", "SyntaxError", "chưa hỗ trợ"],
  ])("%s → %s", (src, type, hint) => {
    const e = error(src, ["7"]);
    expect(e.type).toBe(type);
    expect(`${e.message} ${e.explain}`).toContain(hint);
    expect(e.line).toBeGreaterThan(0);
  });
  it("reports the right line number", () => {
    expect(error("a = 1\nb = 2\nprint(c)").line).toBe(3);
  });
  it("needs stdin when input() has no data", () => {
    expect(error("x = input()").type).toBe("EOFError");
  });
});

describe("python subset: execution trace for visualization", () => {
  it("records each step with variables and branch decisions", () => {
    const r = runPython("a = 8\nb = 12\nif a > b:\n    print(a)\nelse:\n    print(b)");
    expect(r.ok).toBe(true);
    expect(r.output).toBe("12\n");
    expect(r.trace.map((s) => s.line)).toEqual([1, 2, 3, 5, 6]);
    const ifStep = r.trace[2];
    expect(ifStep.note).toContain("8 > 12");
    expect(ifStep.branch).toBe("skipped");
    expect(r.trace[3].note).toContain("else");
    expect(r.trace[1].vars.find((v) => v.name === "b")).toMatchObject({ value: "12", type: "int", changed: true });
    expect(r.trace[1].vars.find((v) => v.name === "a")?.changed).toBe(false);
    expect(r.trace[4].output).toBe("12\n");
  });
  it("records hardware hook calls for simulations", () => {
    const r = runPython("for h in beds:\n    if h < 40:\n        pump_on()\n    else:\n        pump_off()", {
      globals: { beds: { k: "list", items: [{ k: "int", v: 30 }, { k: "int", v: 70 }] } },
      hooks: ["pump_on", "pump_off"],
    });
    expect(r.events.map((e) => e.name)).toEqual(["pump_on", "pump_off"]);
  });
});
