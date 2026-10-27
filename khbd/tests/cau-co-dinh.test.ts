import { describe, expect, it } from "vitest";
import { docVanBanKhung } from "@khbd/lib/data/khung";
import * as C from "@khbd/lib/pipeline/6-xuat-file/cau-co-dinh";

const khung = docVanBanKhung();

describe("câu chữ cố định chép đúng khung", () => {
  it("các câu nguyên văn có trong khung", () => {
    for (const c of [C.HD1_MUC_TIEU, C.HD1_SAN_PHAM, C.HD4_EXIT.replace("3–5", "[3–5]"), C.CLIL, ...C.QUY_TRINH_AI.filter((_, i) => i !== 1), C.AI_KHONG_DAT, ...C.GD3, C.GD3_NHIEU_TIET]) {
      expect(khung, c).toContain(c);
    }
    for (const bang of [C.BANG_DANH_GIA, C.PHIEU_KIEM_CHUNG_AI, C.THUAT_NGU]) {
      for (const o of bang.flat().filter(Boolean)) expect(khung, o).toContain(o);
    }
  });
  it("không còn ngoặc [ ] trong câu cố định", () => {
    const chuoi = (v: unknown): string[] =>
      typeof v === "string" ? [v] : Array.isArray(v) ? v.flatMap(chuoi) : typeof v === "object" && v ? Object.values(v).flatMap(chuoi) : [];
    const tatCa = [
      ...Object.values(C).filter((v) => typeof v !== "function").flatMap(chuoi),
      ...C.hd2Buoc([1, 2, 3, 4]), ...C.gd1NhiemVu(""), ...C.gd1NhiemVu("EduNext"), C.gd1CongViecGv(""),
    ];
    for (const c of tatCa) expect(c).not.toMatch(/[[\]]/);
  });
});
