import { describe, expect, it } from "vitest";
import { buildSeed } from "@/lib/data/seed";
import { insights, insightsText } from "@/lib/analytics/report";

describe("chẩn đoán kết quả học tập", () => {
  it("xếp việc cần xử lý trước điểm sáng, mỗi nhận định có bằng chứng", () => {
    const list = insights(buildSeed(), "t1", {});
    expect(list.length).toBeGreaterThan(0);
    const order = { risk: 0, watch: 1, good: 2 } as const;
    for (let i = 1; i < list.length; i++) expect(order[list[i].tone]).toBeGreaterThanOrEqual(order[list[i - 1].tone]);
    for (const x of list) expect(x.evidence.length).toBeGreaterThan(5);
  });
  it("yêu cầu cần đạt yếu có nút giao củng cố đúng các em dưới 70%", () => {
    const weak = insights(buildSeed(), "t1", {}).find((x) => x.id.startsWith("obj-"));
    const act = weak?.actions.find((a) => a.kind === "remedy");
    expect(act && act.kind === "remedy" && act.studentIds.length).toBeGreaterThan(0);
  });
  it("bản chữ dán được vào sổ", () => {
    expect(insightsText(insights(buildSeed(), "t1", {}), "các lớp")).toMatch(/^Báo cáo các lớp\n\[Cần xử lý\]/);
  });
});
