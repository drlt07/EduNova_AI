import { describe, expect, it } from "vitest";
import { HOTSPOTS, INBOX, SENSITIVE_COUNT, checkPassword, judgeMessage } from "@/lib/sim/digital-safety";

describe("hộp thư", () => {
  it("có cả tin lừa đảo lẫn tin thật; nhận xét nêu dấu hiệu", () => {
    expect(INBOX.filter((m) => m.scam).length).toBeGreaterThan(0);
    expect(INBOX.filter((m) => !m.scam).length).toBeGreaterThan(0);
    expect(judgeMessage(INBOX[0], false).ok).toBe(false);
    expect(judgeMessage(INBOX[0], true).message).toMatch(/tên miền lạ/);
    expect(INBOX.find((m) => m.id === "bank")!.link!.real).not.toBe(INBOX.find((m) => m.id === "bank")!.link!.shown);
  });
});

describe("mật khẩu", () => {
  it("mật khẩu phổ biến hoặc chứa thông tin cá nhân luôn yếu", () => {
    expect(checkPassword("123456").score).toBe(0);
    expect(checkPassword("An2009@Leloi!!xyz").score).toBeLessThanOrEqual(1);
    expect(checkPassword("An2009@Leloi!!xyz").issues.join(" ")).toMatch(/thông tin cá nhân/);
  });

  it("dài, đủ loại kí tự, không lộ thông tin thì đạt; thời gian dò tăng theo độ dài", () => {
    const strong = checkPassword("Trau-Vang#Gac7Cau");
    expect(strong.ok).toBe(true);
    expect(strong.label).toBe("Rất mạnh");
    expect(checkPassword("Ab1!").score).toBe(0);
    expect(checkPassword("Abcd1!xy").crackTime).not.toBe(strong.crackTime);
  });
});

it("ảnh có đúng 4 chi tiết nhạy cảm và vài chi tiết đánh lạc hướng", () => {
  expect(SENSITIVE_COUNT).toBe(4);
  expect(HOTSPOTS.some((h) => !h.sensitive)).toBe(true);
});
