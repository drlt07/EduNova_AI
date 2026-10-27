/** Chấm chương trình Python của học sinh trong trò chơi Nông trại thông minh. */
import { farmGlobals, type FarmCase, type FarmLevel } from "@/lib/data/games";
import { runPython, type RunResult } from "@/lib/py/interpreter";

export interface FarmCaseResult {
  name: string;
  pass: boolean;
  expected: string;
  actual: string;
  run: RunResult;
}

const onOff = (b: boolean) => (b ? "BẬT" : "TẮT");

export function runFarmCase(code: string, c: FarmCase, trace = false): FarmCaseResult {
  const run = runPython(code, { globals: farmGlobals(c), hooks: ["pump_on", "pump_off"], trace, echoInput: false, maxSteps: 50_000 });
  if (!run.ok) return { name: c.name, pass: false, expected: describe(c.expect), actual: `${run.error!.type} (dòng ${run.error!.line})`, run };
  let actualStates: boolean[];
  let pass: boolean;
  if (Array.isArray(c.expect)) {
    actualStates = run.events.map((e) => e.name === "pump_on");
    pass = actualStates.length === c.expect.length && actualStates.every((s, i) => s === (c.expect as boolean[])[i]);
  } else {
    const last = run.events[run.events.length - 1];
    actualStates = [last ? last.name === "pump_on" : false];
    pass = actualStates[0] === c.expect;
  }
  if (pass && c.expectOutputIncludes && !run.output.includes(c.expectOutputIncludes)) pass = false;
  const actual = Array.isArray(c.expect) ? (actualStates.length ? actualStates.map(onOff).join(", ") : "không gọi bơm") : onOff(actualStates[0]) + (c.expectOutputIncludes ? ` · in: "${run.output.trim() || "(không in gì)"}"` : "");
  return { name: c.name, pass, expected: describe(c.expect) + (c.expectOutputIncludes ? ` · in: "${c.expectOutputIncludes}"` : ""), actual, run };
}

function describe(e: boolean | boolean[]) {
  return Array.isArray(e) ? e.map(onOff).join(", ") : onOff(e);
}

export function gradeFarmLevel(code: string, level: FarmLevel) {
  const results = level.cases.map((c) => runFarmCase(code, c));
  return { results, passed: results.every((r) => r.pass), score: results.filter((r) => r.pass).length };
}
