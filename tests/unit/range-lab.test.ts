import { describe, expect, it } from "vitest";
import { diagnoseRange, pyRange, rangeText, RANGE_TASKS } from "@/lib/sim/range-lab";
import { pyRange as legacyPyRange } from "@/components/phet/robot-factory";
import { challengeReducer, initialChallenge, type ChallengeAction } from "@/lib/sim/challenge";
import { labSummary, type LabResult } from "@/lib/sim/lab-score";

describe("Nhà máy robot: range và chẩn đoán", () => {
  it("giữ đúng ngữ nghĩa range của Python", () => {
    expect(pyRange(0, 5, 1)).toEqual([0, 1, 2, 3, 4]);
    expect(pyRange(10, 0, -3)).toEqual([10, 7, 4, 1]);
    expect(pyRange(12, 0, -4)).toEqual([12, 8, 4]);
    expect(pyRange(5, 5, 1)).toEqual([]);
    expect(pyRange(1, 5, 0)).toEqual([]);
    expect(legacyPyRange).toBe(pyRange);
    expect(rangeText(0, 5, 1)).toBe("range(5)");
    expect(rangeText(3, 9, 1)).toBe("range(3, 9)");
    expect(rangeText(10, 0, -3)).toBe("range(10, 0, -3)");
  });

  it("mọi thử thách đều làm được với thanh trượt (start 0–12, stop 0–13, step −4…4)", () => {
    for (const t of RANGE_TASKS) {
      let found = false;
      for (let a = 0; a <= 12 && !found; a++) for (let b = 0; b <= 13 && !found; b++) for (let s = -4; s <= 4; s++) if (s && diagnoseRange(a, b, s, t.target).ok) { found = true; break; }
      expect(found, t.id).toBe(true);
    }
  });

  it("nhận diện lỗi stop không được lấy", () => {
    const d = diagnoseRange(3, 8, 1, [3, 4, 5, 6, 7, 8]);
    expect(d.ok).toBe(false);
    expect(d.error).toBe("missing-last");
    expect(d.missing).toEqual([8]);
    expect(d.hints[0]).toMatch(/stop không được lấy/);
    expect(d.hints.join(" ")).not.toMatch(/range\(3, 9\)/); // không lộ nguyên đáp án
  });

  it("nhận diện range rỗng, sai chiều, sai start, sai bước, thừa phần tử", () => {
    expect(diagnoseRange(10, 0, 1, [10, 7, 4, 1]).error).toBe("empty");
    expect(diagnoseRange(1, 11, 3, [10, 7, 4, 1]).error).toBe("step-sign");
    expect(diagnoseRange(0, 11, 2, [2, 4, 6, 8, 10]).error).toBe("start");
    expect(diagnoseRange(10, 0, -2, [10, 7, 4, 1]).error).toBe("step-size");
    const extra = diagnoseRange(5, 14, 2, [5, 7, 9, 11]);
    expect(extra.error).toBe("extra-last");
    expect(extra.wrong).toEqual([13]);
    expect(diagnoseRange(2, 12, 2, [2, 4, 6, 8, 10]).ok).toBe(true);
  });

  it("gợi ý khi đã đúng không tiết lộ là đã đúng", () => {
    expect(diagnoseRange(0, 5, 1, [0, 1, 2, 3, 4]).hints.join(" ")).not.toMatch(/đúng|khớp rồi/i);
  });
});

describe("Khung thử thách: lưu chi tiết và không trừ điểm khi thử lại đáp án cũ", () => {
  const play = (acts: ChallengeAction[]) => acts.reduce(challengeReducer, initialChallenge());
  const wrong = (answer?: string): ChallengeAction => ({ type: "check", ok: false, text: "sai", label: "A", info: answer ? { answer, error: "thiếu phần tử cuối" } : undefined });

  it("ghi lỗi từng thử thách, gợi ý và đáp án cuối", () => {
    const s = play([
      wrong("range(3, 8)"), wrong("range(3, 8)"), { type: "hint", label: "A" },
      { type: "check", ok: true, text: "đúng", label: "A", info: { answer: "range(3, 9)" } }, { type: "next" },
      { type: "check", ok: true, text: "đúng", label: "B", info: { answer: "range(5)" } },
    ]);
    expect(s.mistakes).toBe(1);
    expect(s.steps).toEqual([
      { id: "c1", label: "A", tries: 2, ok: true, errors: ["thiếu phần tử cuối"], hints: 1, answer: "range(3, 9)" },
      { id: "c2", label: "B", tries: 1, ok: true, errors: [], hints: 0, answer: "range(5)" },
    ]);
    expect(s.hintLevel).toBe(0);
  });

  it("đổi đáp án sai khác thì vẫn tính là một lần sai mới", () => {
    expect(play([wrong("range(3, 8)"), wrong("range(3, 7)"), wrong("range(3, 8)")]).mistakes).toBe(3);
  });

  it("gợi ý tối đa 3 bậc", () => {
    const h: ChallengeAction = { type: "hint", label: "A" };
    const s = play([h, h, h, h]);
    expect(s.hintLevel).toBe(3);
    expect(s.steps[0].hints).toBe(3);
  });

  it("mô phỏng cũ gọi check(ok, text) vẫn trừ điểm mỗi lần sai như trước", () => {
    const s = play([wrong(), wrong()]);
    expect(s.mistakes).toBe(2);
    const r = challengeReducer(s, { type: "restart" });
    expect(r.steps).toEqual([]);
    expect(r.run).toBe(1);
  });

  it("kết quả cũ không có steps vẫn tổng hợp được", () => {
    const old: LabResult = { id: "x", studentId: "s1", labSlug: "robot-factory", score: 9, mistakes: 2, seconds: 300, finishedAt: "2026-10-01T00:00:00Z" };
    const neu: LabResult = { ...old, id: "y", score: 10, mistakes: 0, finishedAt: "2026-10-02T00:00:00Z", steps: [{ id: "c1", label: "Thử thách 1", tries: 1, ok: true, errors: [], hints: 0 }] };
    const s = labSummary([old, neu], ["s1", "s2"], "robot-factory");
    expect(s.rows[0].best.id).toBe("y");
    expect(s.rows[0].attempts).toBe(2);
    expect(s.missing).toEqual(["s2"]);
  });
});
