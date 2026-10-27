import { describe, expect, it } from "vitest";
import { chiaMucDo, maTranCauHoi } from "@khbd/lib/pipeline/4-sinh-noi-dung/ma-tran-cau-hoi";

describe("ma trận câu hỏi theo môn", () => {
  it("chia mức độ NB/TH/VD", () => {
    expect(chiaMucDo(6)).toEqual(["NB", "NB", "TH", "TH", "VD", "VD"]);
    expect(chiaMucDo(3)).toEqual(["NB", "TH", "VD"]);
  });
  it("Toán 2 tiết: nhiều lựa chọn + đúng sai + trả lời ngắn + tự luận", () => {
    const m = maTranCauHoi("TOAN", 30);
    expect([m.nhieuLuaChon.length, m.dungSai.length, m.traLoiNgan.length, m.tuLuan]).toEqual([10, 2, 2, 1]);
  });
  it("bài 1 tiết: 6 câu nhiều lựa chọn + 1 câu đúng sai", () => {
    const m = maTranCauHoi("HOA_HOC", 15);
    expect([m.nhieuLuaChon.length, m.dungSai.length, m.traLoiNgan.length]).toEqual([6, 1, 0]);
  });
  it("Lịch sử không có trả lời ngắn; Ngoại ngữ chỉ nhiều lựa chọn; GDTC vài câu", () => {
    expect(maTranCauHoi("LICH_SU", 30).traLoiNgan).toEqual([]);
    expect(maTranCauHoi("NGOAI_NGU", 30).dungSai).toEqual([]);
    expect(maTranCauHoi("GDTC", 30).nhieuLuaChon).toHaveLength(3);
  });
});
