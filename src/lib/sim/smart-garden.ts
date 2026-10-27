/**
 * Smart Garden Lab — engine deterministic.
 * Luật tham chiếu: tưới khi humidity < threshold AND hasWater (mặc định threshold = 40).
 * Đây là mô phỏng học tập bằng TypeScript, KHÔNG chạy Python.
 */
import type { LabTestCase, SmartGardenParams, TestResult } from "@/lib/domain/types";
import { evaluate, ExpressionError, parseExpression, type Node, type TraceStep } from "./expression";

export const GARDEN_IDENTS = ["humidity", "has_water"] as const;

export interface GardenInput {
  humidity: number;
  hasWater: boolean;
}

export const DEFAULT_GARDEN_PARAMS: SmartGardenParams = {
  threshold: 40,
  requireWater: true,
  initialHumidity: 55,
  initialHasWater: true,
  allowRuleEditor: true,
};

export function clampHumidity(h: number): number {
  if (!Number.isFinite(h)) return 0;
  return Math.max(0, Math.min(100, Math.round(h)));
}

/** Kết quả đúng theo đề bài (luật tham chiếu do giáo viên cấu hình). */
export function referencePump(input: GardenInput, params: Pick<SmartGardenParams, "threshold" | "requireWater">): boolean {
  const dry = input.humidity < params.threshold;
  return params.requireWater ? dry && input.hasWater : dry;
}

export function referenceRuleText(params: Pick<SmartGardenParams, "threshold" | "requireWater">): string {
  return params.requireWater ? `humidity < ${params.threshold} and has_water` : `humidity < ${params.threshold}`;
}

// ---------- Rule builder (dạng chọn) ----------
export interface BuilderRule {
  comparator: "<" | "<=" | ">" | ">=";
  threshold: number;
  connector: "and" | "or" | "none";
  water: "has_water" | "not has_water";
}

export function builderToText(r: BuilderRule): string {
  const base = `humidity ${r.comparator} ${r.threshold}`;
  return r.connector === "none" ? base : `${base} ${r.connector} ${r.water}`;
}

// ---------- Compile & run ----------
export type CompileResult = { ok: true; ast: Node; text: string } | { ok: false; error: ExpressionError };

export function compileRule(text: string): CompileResult {
  try {
    return { ok: true, ast: parseExpression(text, GARDEN_IDENTS), text };
  } catch (e) {
    if (e instanceof ExpressionError) return { ok: false, error: e };
    throw e;
  }
}

export type PlantState = "healthy" | "thirsty" | "overwatered" | "pump-dry";

export interface RunOutput {
  pump: boolean;
  expected: boolean;
  pass: boolean;
  plant: PlantState;
  trace: TraceStep[];
  message: string;
}

export function runRule(ast: Node, input: GardenInput, params: Pick<SmartGardenParams, "threshold" | "requireWater">): RunOutput {
  const trace: TraceStep[] = [];
  const v = evaluate(ast, { humidity: input.humidity, has_water: input.hasWater }, trace);
  const pump = typeof v === "boolean" ? v : v !== 0;
  const expected = referencePump(input, params);
  const pass = pump === expected;
  let plant: PlantState = "healthy";
  let message: string;
  if (pump && !input.hasWater) {
    plant = "pump-dry";
    message = "Máy bơm chạy khi bình hết nước — bơm có thể hỏng.";
  } else if (pump && input.humidity >= params.threshold) {
    plant = "overwatered";
    message = "Đất đã đủ ẩm nhưng vẫn tưới — cây có nguy cơ úng.";
  } else if (!pump && input.humidity < params.threshold && input.hasWater) {
    plant = "thirsty";
    message = "Đất khô, còn nước nhưng không tưới — cây bị héo.";
  } else {
    message = pump ? "Bơm bật: đất khô và bình còn nước." : "Bơm tắt: không cần hoặc không thể tưới.";
  }
  return { pump, expected, pass, plant, trace, message };
}

export function runTests(ast: Node, cases: LabTestCase[], params: Pick<SmartGardenParams, "threshold" | "requireWater">): TestResult[] {
  return cases.map((c) => {
    const input = { humidity: Number(c.input.humidity), hasWater: Boolean(c.input.hasWater) };
    const out = runRule(ast, input, params);
    return { caseId: c.id, pass: out.pass, expected: out.expected, actual: out.pump, category: c.category };
  });
}

/** Sinh bộ test theo ngưỡng — biên luôn gồm threshold-1, threshold, threshold+1. */
export function gardenTestCases(threshold: number): LabTestCase[] {
  const t = clampHumidity(threshold);
  const mk = (id: string, name: string, humidity: number, hasWater: boolean, category: LabTestCase["category"]): LabTestCase => ({
    id,
    name,
    input: { humidity, hasWater },
    expected: { pump: humidity < t && hasWater },
    category,
  });
  return [
    mk("tc-dry", `Đất khô (${Math.max(0, t - 15)}%), còn nước`, Math.max(0, t - 15), true, "normal"),
    mk("tc-wet", `Đất ẩm (${Math.min(100, t + 25)}%), còn nước`, Math.min(100, t + 25), true, "normal"),
    mk("tc-below", `Ngay dưới ngưỡng (${t - 1}%)`, Math.max(0, t - 1), true, "boundary"),
    mk("tc-equal", `Bằng ngưỡng (${t}%)`, t, true, "boundary"),
    mk("tc-above", `Ngay trên ngưỡng (${t + 1}%)`, Math.min(100, t + 1), true, "boundary"),
    mk("tc-nowater", `Đất khô (${Math.max(0, t - 20)}%), hết nước`, Math.max(0, t - 20), false, "no-water"),
    mk("tc-zero", "Độ ẩm 0%, còn nước", 0, true, "extreme"),
    mk("tc-full", "Độ ẩm 100%, hết nước", 100, false, "extreme"),
  ];
}

// ---------- Mô phỏng theo thời gian ----------
export interface TimelinePoint {
  step: number;
  humidity: number;
  water: number;
  pump: boolean;
}

/**
 * Mỗi bước: bơm bật → +12% độ ẩm, -20% nước; bơm tắt → -7% độ ẩm (bay hơi).
 * Hoàn toàn deterministic để minh họa vòng lặp điều khiển.
 */
export function simulateTimeline(ast: Node, start: { humidity: number; water: number }, steps = 12): TimelinePoint[] {
  const points: TimelinePoint[] = [];
  let humidity = clampHumidity(start.humidity);
  let water = Math.max(0, Math.min(100, start.water));
  for (let step = 0; step <= steps; step++) {
    const v = evaluate(ast, { humidity, has_water: water > 0 });
    const pump = typeof v === "boolean" ? v : v !== 0;
    points.push({ step, humidity, water, pump });
    if (pump && water > 0) {
      humidity = clampHumidity(humidity + 12);
      water = Math.max(0, water - 20);
    } else {
      humidity = clampHumidity(humidity - 7);
    }
  }
  return points;
}

/** Phân loại lỗi thường gặp để mentor/analytics dùng (không lộ đáp án). */
export function diagnose(results: TestResult[]): string[] {
  const failed = new Set(results.filter((r) => !r.pass).map((r) => r.category));
  const out: string[] = [];
  if (failed.has("boundary")) out.push("boundary");
  if (failed.has("no-water")) out.push("no-water");
  if (failed.has("normal")) out.push("logic");
  if (failed.has("extreme")) out.push("extreme");
  return out;
}

export const ERROR_PATTERN_LABELS: Record<string, string> = {
  boundary: "Sai ở giá trị biên (< và <=)",
  "no-water": "Quên kiểm tra bình còn nước",
  logic: "Sai chiều so sánh hoặc toán tử logic",
  extreme: "Sai ở giá trị 0% hoặc 100%",
};
