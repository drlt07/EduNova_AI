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

import { avgWait, bestTravel, cacheMisses, diagnoseDownload, diagnoseEdits, diagnoseFit, diagnoseMisses, diagnosePrintOrder, diagnosePrintWait, diagnoseRoute, diagnoseTravel, downloadSeconds, editText, printOrder, runCache, scanOrder, travel, type EditAct } from "@/lib/sim/life-computer";
import { PRINT_JOBS } from "@/components/life/print-queue";

describe("mô phỏng máy tính & đời sống mới", () => {
  it("tải xuống: 1 byte = 8 bit, 1 GB = 1024 MB; nhận diện quên nhân 8", () => {
    expect(downloadSeconds(8, 32)).toBe(2);
    expect(downloadSeconds(1024, 100)).toBeCloseTo(81.92);
    expect(diagnoseDownload(2, 8, 32, false).ok).toBe(true);
    expect(diagnoseDownload(82, 1024, 100, true).ok).toBe(true);
    expect(diagnoseDownload(0.25, 8, 32, false).error).toBe("quên đổi byte sang bit (×8)");
    expect(diagnoseDownload(80, 1024, 100, true).error).toBe("dùng 1 GB = 1000 MB");
  });

  it("hàng đợi máy in: FIFO, tài liệu ngắn trước giảm thời gian chờ trung bình", () => {
    expect(printOrder(PRINT_JOBS, "sjf").map((j) => j.id)).toEqual(["vy", "lan", "huy", "minh"]);
    expect(avgWait(printOrder(PRINT_JOBS, "sjf"))).toBeLessThan(avgWait(PRINT_JOBS));
    expect(diagnosePrintOrder(["minh", "lan", "huy", "vy"], PRINT_JOBS, "fifo").ok).toBe(true);
    expect(diagnosePrintOrder(["minh", "lan", "huy", "vy"], PRINT_JOBS, "sjf").error).toBe("vẫn xếp theo thứ tự gửi");
    expect(diagnosePrintWait(114, PRINT_JOBS, "fifo", "vy").ok).toBe(true);
    expect(diagnosePrintWait(120, PRINT_JOBS, "fifo", "vy").error).toBe("cộng cả thời gian in tài liệu của chính mình");
    expect(diagnosePrintWait(48, PRINT_JOBS, "sjf", "minh").ok).toBe(true);
  });

  it("hoàn tác: ngăn xếp LIFO, thao tác mới xóa ngăn Làm lại, hoàn tác cả lệnh xóa", () => {
    const T = (w: string): EditAct => ({ kind: "type", word: `${w} ` });
    const Z: EditAct = { kind: "undo" }, Y: EditAct = { kind: "redo" }, D: EditAct = { kind: "del" };
    expect(editText([T("Hôm"), T("nay"), T("trời"), Z])).toBe("Hôm nay");
    expect(editText([T("A"), T("B"), T("C"), Z, Z, Y])).toBe("A B");
    const mid = [T("Tin"), T("học"), Z, T("hay"), Y];
    expect(editText(mid)).toBe("Tin hay");
    expect(diagnoseEdits("Tin hay học", mid).error).toBe("quên: thao tác mới xóa ngăn Làm lại");
    expect(diagnoseEdits("học hay", mid).error).toBe("hoàn tác thao tác cũ nhất thay vì mới nhất");
    expect(editText([T("Em"), T("thích"), D, T("yêu"), Z, Z])).toBe("Em thích");
  });

  it("thẻ nhớ: làm tròn xuống, 1024 chứ không phải 1000", () => {
    expect(diagnoseFit(2048, 8, 4).ok).toBe(true);
    expect(diagnoseFit(2000, 8, 4).error).toBe("dùng 1 GB = 1000 MB");
    expect(diagnoseFit(71, 7, 100).ok).toBe(true);
    expect(diagnoseFit(72, 7, 100).error).toBe("làm tròn lên");
    expect(diagnoseFit(2, 8, 4).error).toBe("quên đổi GB sang MB");
  });

  it("bộ nhớ đệm: LRU khác FIFO; cần đủ chỗ cho cả vòng lặp", () => {
    const seq = ["truong", "tkb", "truong", "tudien", "tkb"];
    expect(cacheMisses(seq, 2)).toBe(4);
    expect(cacheMisses(seq, 2, "fifo")).toBe(3);
    expect(diagnoseMisses(3, seq, 2).error).toBe("bỏ trang vào sớm nhất thay vì trang lâu chưa dùng nhất");
    expect(runCache(["truong", "tkb", "tudien", "truong", "bando"], 3).at(-1)!.evicted).toBe("tkb");
    const loop = ["truong", "tkb", "tudien", "truong", "tkb", "tudien", "truong"];
    expect([1, 2, 3].map((s) => cacheMisses(loop, s))).toEqual([7, 7, 3]);
  });

  it("thang máy: quãng đường, đi một chiều, lộ trình ngắn nhất", () => {
    expect(travel(1, [7, 2, 9, 3])).toBe(24);
    expect(scanOrder(6, [3, 8, 10, 1], "up")).toEqual([8, 10, 3, 1]);
    expect(travel(6, [8, 10, 3, 1])).toBe(13);
    expect(bestTravel(5, [8, 2, 9, 4])).toBe(10);
    expect(diagnoseRoute([4, 2, 8, 9], 5, [8, 2, 9, 4]).ok).toBe(true);
    expect(diagnoseRoute([8, 2, 9, 4], 5, [8, 2, 9, 4]).error).toBe("đổi chiều nhiều lần");
    expect(diagnoseTravel(24, 1, [7, 2, 9, 3]).ok).toBe(true);
    expect(diagnoseTravel(2, 1, [7, 2, 9, 3]).error).toBe("trừ đoạn đi xuống thay vì cộng");
    expect(bestTravel(3, [1, 4, 7, 2, 6])).toBe(8);
  });
});
