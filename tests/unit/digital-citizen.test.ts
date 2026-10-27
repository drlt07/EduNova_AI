import { expect, it } from "vitest";
import { START_METERS, STORIES, applyEffect } from "@/lib/sim/digital-citizen";

it("mỗi bước có đúng một lựa chọn tốt nhất, và nó không làm giảm thước đo nào", () => {
  for (const s of STORIES) for (const st of s.steps) {
    const good = st.choices.filter((c) => c.verdict === "good");
    expect(good).toHaveLength(1);
    expect(Object.values(good[0].effect).every((v) => (v ?? 0) >= 0)).toBe(true);
  }
});

it("đi theo lựa chọn tốt thì cả ba thước đo đều tăng; thước đo luôn trong 0–100", () => {
  let best = START_METERS, worst = START_METERS;
  for (const s of STORIES) for (const st of s.steps) {
    best = applyEffect(best, st.choices.find((c) => c.verdict === "good")!.effect);
    worst = applyEffect(worst, st.choices.find((c) => c.verdict === "bad")?.effect ?? {});
  }
  expect(best.safety).toBeGreaterThan(START_METERS.safety);
  expect(best.trust).toBeLessThanOrEqual(100);
  expect(worst.trust).toBeGreaterThanOrEqual(0);
  expect(worst.trust).toBeLessThan(START_METERS.trust);
});
