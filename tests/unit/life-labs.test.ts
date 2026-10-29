import { describe, expect, it } from "vitest";
import { checkDigit } from "@/components/life/barcode";
import { caesar } from "@/components/life/encryption";
import { rle } from "@/components/life/image-compress";
import { rank } from "@/components/life/recommender";
import { charsetSize, crackSeconds, humanTime } from "@/components/life/password";
import { colorDist, hex } from "@/components/life/rgb-pixel";
import { DEFAULT_FEATURED, LIFE_LABS } from "@/lib/data/life-labs";
import { LIFE_COMPONENTS } from "@/components/life/life-registry";

describe("mô phỏng đời sống", () => {
  it("chữ số kiểm tra EAN-13 đúng chuẩn", () => {
    expect(checkDigit([8, 9, 3, 5, 0, 0, 1, 2, 3, 4, 5, 6])).toBe(2);
    expect(checkDigit([4, 0, 0, 6, 3, 8, 1, 3, 3, 3, 9, 3])).toBe(1); // 4006381333931
  });
  it("Caesar mã hóa và giải mã ngược nhau, bỏ dấu tiếng Việt", () => {
    expect(caesar("Mèo", 2)).toBe("OGQ");
    expect(caesar(caesar("XIN CHAO", 4), -4)).toBe("XIN CHAO");
  });
  it("RLE đếm đúng loạt", () => {
    expect(rle("TTTTRRRRRRTT").map(([c, n]) => `${n}${c}`).join("")).toBe("4T6R2T");
  });
  it("gợi ý: độ đa dạng 0 ưu tiên chủ đề đã xem, độ đa dạng cao đưa chủ đề mới lên", () => {
    const narrow = rank(["v2", "v10"], 0).slice(0, 3).map((x) => x.v.id);
    expect(narrow.every((id) => ["v6", "v8"].includes(id) || id === narrow[2])).toBe(true);
    const wide = rank(["v2", "v10"], 1).slice(0, 4);
    expect(wide.some((x) => x.fit === 0)).toBe(true);
  });
  it("mật khẩu: độ dài quan trọng hơn kí hiệu; mật khẩu phổ biến lộ ngay", () => {
    expect(charsetSize("aB3!")).toBe(95);
    expect(crackSeconds("123456", 1e9)).toBeLessThan(1);
    expect(crackSeconds("Lan2009", 1e9)).toBeLessThan(1);
    expect(crackSeconds("con-meo-an-ca-sang", 1e9)).toBeGreaterThan(crackSeconds("P@ss1", 1e9) * 1e6);
    expect(humanTime(0.5)).toBe("ngay lập tức");
    expect(humanTime(7200)).toBe("2,0 giờ");
  });
  it("RGB: mã hex và khoảng cách màu", () => {
    expect(hex(255, 140, 0)).toBe("#FF8C00");
    expect(colorDist([0, 0, 0], [0, 0, 0])).toBe(0);
    expect(colorDist([255, 0, 0], [0, 0, 0])).toBe(255);
  });
  it("mỗi mô phỏng trong kho có thành phần chạy; mô phỏng nổi bật có thật", () => {
    expect(LIFE_LABS.every((l) => LIFE_COMPONENTS[l.slug])).toBe(true);
    expect(DEFAULT_FEATURED.every((s) => LIFE_LABS.some((l) => l.slug === s))).toBe(true);
  });
});
