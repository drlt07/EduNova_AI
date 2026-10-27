import { describe, expect, it } from "vitest";
import { evaluate, ExpressionError, parseExpression } from "@/lib/sim/expression";
import {
  builderToText,
  compileRule,
  diagnose,
  gardenTestCases,
  GARDEN_IDENTS,
  referencePump,
  runRule,
  runTests,
  simulateTimeline,
} from "@/lib/sim/smart-garden";
import { checkMeshes } from "@/lib/sim/glb-check";
import { applyGate, bitsToNumber, numberToBits } from "@/lib/sim/binary";

const P = { threshold: 40, requireWater: true };

function compile(text: string) {
  const r = compileRule(text);
  if (!r.ok) throw r.error;
  return r.ast;
}

describe("expression parser", () => {
  it("evaluates python-like conditions with precedence", () => {
    const ast = parseExpression("humidity < 40 and has_water or False", GARDEN_IDENTS);
    expect(evaluate(ast, { humidity: 30, has_water: true })).toBe(true);
    expect(evaluate(ast, { humidity: 30, has_water: false })).toBe(false);
  });

  it("accepts full if-line syntax", () => {
    const ast = parseExpression("if humidity < 40 and has_water:", GARDEN_IDENTS);
    expect(evaluate(ast, { humidity: 39, has_water: true })).toBe(true);
  });

  it("supports not and parentheses", () => {
    const ast = parseExpression("not (humidity >= 40) and not not has_water", GARDEN_IDENTS);
    expect(evaluate(ast, { humidity: 10, has_water: true })).toBe(true);
  });

  it.each([
    ["humidity = 40", "==" ],
    ["humidity < 40 && has_water", "and"],
    ["humidity < 40 and hasWater", "has_water"],
    ["humidity < 40 and true", "True"],
    ["(humidity < 40", ""],
    ["", ""],
    ["humidity < 40 has_water", ""],
  ])("rejects invalid input %s with a helpful error", (src, hintFragment) => {
    let err: unknown;
    try {
      parseExpression(src, GARDEN_IDENTS);
    } catch (e) {
      err = e;
    }
    expect(err).toBeInstanceOf(ExpressionError);
    const e = err as ExpressionError;
    expect(`${e.message} ${e.hint ?? ""}`).toContain(hintFragment);
  });

  it("rejects code-injection style input (no eval)", () => {
    expect(() => parseExpression("__import__('os')", GARDEN_IDENTS)).toThrow(ExpressionError);
    expect(() => parseExpression("humidity; process.exit()", GARDEN_IDENTS)).toThrow(ExpressionError);
  });

  it("limits length and depth", () => {
    expect(() => parseExpression("humidity < 1 or ".repeat(30) + "True", GARDEN_IDENTS)).toThrow(/dài quá/);
    expect(() => parseExpression("(".repeat(25) + "True" + ")".repeat(25), GARDEN_IDENTS)).toThrow(/sâu/);
  });
});

describe("smart garden engine", () => {
  it("reference: water when humidity < 40 AND hasWater", () => {
    expect(referencePump({ humidity: 39, hasWater: true }, P)).toBe(true);
    expect(referencePump({ humidity: 40, hasWater: true }, P)).toBe(false);
    expect(referencePump({ humidity: 10, hasWater: false }, P)).toBe(false);
  });

  it("correct rule passes all generated test cases", () => {
    const results = runTests(compile("humidity < 40 and has_water"), gardenTestCases(40), P);
    expect(results.every((r) => r.pass)).toBe(true);
    expect(results.length).toBe(8);
  });

  it("<= rule fails exactly the boundary case", () => {
    const results = runTests(compile("humidity <= 40 and has_water"), gardenTestCases(40), P);
    const failed = results.filter((r) => !r.pass);
    expect(failed.map((r) => r.caseId)).toEqual(["tc-equal"]);
    expect(diagnose(results)).toEqual(["boundary"]);
  });

  it("missing water check is diagnosed", () => {
    const results = runTests(compile("humidity < 40"), gardenTestCases(40), P);
    expect(diagnose(results)).toContain("no-water");
  });

  it("run output explains plant state and trace", () => {
    const out = runRule(compile("humidity < 40"), { humidity: 20, hasWater: false }, P);
    expect(out.pump).toBe(true);
    expect(out.pass).toBe(false);
    expect(out.plant).toBe("pump-dry");
    expect(out.trace.length).toBeGreaterThan(0);
  });

  it("builder produces parseable rules", () => {
    const text = builderToText({ comparator: "<", threshold: 40, connector: "and", water: "has_water" });
    expect(text).toBe("humidity < 40 and has_water");
    expect(compileRule(text).ok).toBe(true);
    expect(builderToText({ comparator: ">=", threshold: 60, connector: "none", water: "has_water" })).toBe("humidity >= 60");
  });

  it("timeline is deterministic and never pumps on empty tank with correct rule", () => {
    const ast = compile("humidity < 40 and has_water");
    const a = simulateTimeline(ast, { humidity: 30, water: 40 });
    const b = simulateTimeline(ast, { humidity: 30, water: 40 });
    expect(a).toEqual(b);
    expect(a.some((p) => p.pump && p.water === 0)).toBe(false);
  });

  it("custom threshold changes expectations", () => {
    const cases = gardenTestCases(55);
    const results = runTests(compile("humidity < 55 and has_water"), cases, { threshold: 55, requireWater: true });
    expect(results.every((r) => r.pass)).toBe(true);
  });
});

describe("other lab utilities", () => {
  it("binary conversion round-trips", () => {
    expect(bitsToNumber(numberToBits(173))).toBe(173);
    expect(numberToBits(5, 4)).toEqual([false, true, false, true]);
    expect(applyGate("XOR", true, false)).toBe(true);
    expect(applyGate("NAND", true, true)).toBe(false);
  });

  it("GLB mesh check reports missing meshes instead of faking", () => {
    const r = checkMeshes(["Case", "CPU"]);
    expect(r.ok).toBe(false);
    expect(r.missing).toContain("RAM");
    expect(checkMeshes(["Case", "Motherboard", "CPU", "RAM", "SSD", "GPU", "PSU", "CPU_Cooler"]).ok).toBe(true);
  });
});

import { analyzeGardenCode, CODE_SAMPLES } from "@/lib/sim/code-check";

describe("code playground analysis (no Python execution)", () => {
  it("correct sample compiles with no errors", () => {
    const a = analyzeGardenCode(CODE_SAMPLES[0].code);
    expect(a.errors).toEqual([]);
    expect(a.condition).toBe("humidity < 40 and has_water");
  });
  it("syntax sample reports colon, indentation and operator errors", () => {
    const msgs = analyzeGardenCode(CODE_SAMPLES[3].code).errors.map((e) => e.message).join(" | ");
    expect(msgs).toContain("hai chấm");
    expect(msgs).toContain("thụt lề");
  });
  it("arbitrary code is not executed, only noted", () => {
    const a = analyzeGardenCode("import os\nos.system('rm -rf /')\nif humidity < 40:\n    pump_on()\n");
    expect(a.notes.length).toBeGreaterThanOrEqual(2);
    expect(a.errors).toEqual([]);
  });
});
