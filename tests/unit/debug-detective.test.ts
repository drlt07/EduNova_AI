import { describe, expect, it } from "vitest";
import { BUG_LINES, REGRESSION_AGES, SNIPPETS, fareProgram, runFare, runSnippet, testAdvice } from "@/lib/sim/debug-detective";

describe("ba loại lỗi, chạy thật", () => {
  it("cú pháp và khi chạy báo lỗi; lỗi logic chạy được nhưng sai kết quả", () => {
    for (const s of SNIPPETS) {
      const r = runSnippet(s);
      if (s.kind === "logic") {
        expect(r.error).toBeUndefined();
        expect(r.output).not.toBe(s.expected);
      } else expect(r.error).toBeTruthy();
    }
    expect(runSnippet(SNIPPETS.find((s) => s.id === "avg")!).error).toMatch(/ZeroDivision|chia/i);
  });
});

describe("chương trình bán vé", () => {
  it("bản lỗi chỉ sai đúng ở tuổi 17 và 60", () => {
    const wrong = Array.from({ length: 101 }, (_, a) => runFare(fareProgram(), a)).filter((t) => !t.pass).map((t) => t.age);
    expect(wrong).toEqual([17, 60]);
  });

  it("chọn đúng cả hai cách sửa thì mọi tuổi đều đúng; sửa sai thì vẫn trượt test biên", () => {
    const fixed = fareProgram(BUG_LINES.map((b) => b.answer));
    expect(Array.from({ length: 101 }, (_, a) => runFare(fixed, a)).every((t) => t.pass)).toBe(true);
    const badFix = fareProgram([1, 1]);
    expect(REGRESSION_AGES.map((a) => runFare(badFix, a)).some((t) => !t.pass)).toBe(true);
  });

  it("nhắc thử giá trị biên khi chỉ thử các tuổi ở giữa", () => {
    expect(testAdvice([10, 30, 45])).toMatch(/RANH GIỚI/);
    expect(testAdvice([10, 30, 60])).toBeNull();
  });
});
