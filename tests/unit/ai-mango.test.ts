import { describe, expect, it } from "vitest";
import { EXTRA_KEO, TEST, TRAIN, decisionGrid, evaluate, predict } from "@/lib/sim/ai-mango";

describe("mô hình phân loại xoài", () => {
  it("học từ xoài cát: đoán đúng xoài cát nhưng sai mọi quả xoài keo chín (thiên lệch dữ liệu)", () => {
    const r = evaluate(TRAIN, TEST);
    expect(r.accuracy).toBe(70);
    expect(r.rows.filter((x) => x.guess !== x.label).every((x) => x.variety === "Xoài keo" && x.label === "chin")).toBe(true);
  });

  it("bổ sung dữ liệu xoài keo thì đoán đúng cả lô", () => {
    expect(evaluate([...TRAIN, ...EXTRA_KEO], TEST).accuracy).toBe(100);
  });

  it("vùng quyết định: góc vàng–mềm là chín, góc xanh–cứng là còn xanh", () => {
    expect(predict(TRAIN, 0.95, 0.95)).toBe("chin");
    expect(predict(TRAIN, 0.05, 0.05)).toBe("xanh");
    const g = decisionGrid(TRAIN, 10);
    expect(g).toHaveLength(10);
    expect(g[0][9]).toBe("chin");
    expect(g[9][0]).toBe("xanh");
  });
});
