import { describe, expect, it } from "vitest";
import { docVanBanKhung } from "@khbd/lib/data/khung";
import { nangLucAi } from "@khbd/lib/data/nang-luc-ai";

const khung = docVanBanKhung();

describe("nang_luc_ai.json", () => {
  it("mô tả, tiêu chí, minh chứng chép nguyên văn từ khung", () => {
    for (const nl of nangLucAi.nang_luc) {
      expect(khung).toContain(`${nl.ma}: ${nl.mo_ta}`);
      expect(khung).toContain(`Tiêu chí ${nl.ma}: ${nl.tieu_chi}`);
      expect(khung).toContain(nl.minh_chung);
      expect(khung).toContain(`${nl.ma} criteria: ${nl.tieu_chi_en}`);
    }
  });
  it("có đúng NLa, NLc, NLd như khung", () => {
    expect(nangLucAi.nang_luc.map((n) => n.ma)).toEqual(["NLa", "NLc", "NLd"]);
  });
});
