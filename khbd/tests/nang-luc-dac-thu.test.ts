import { describe, expect, it } from "vitest";
import { docVanBanKhung } from "@khbd/lib/data/khung";
import { bieuHienHienThi, nangLucDacThu, timMon } from "@khbd/lib/data/nang-luc-dac-thu";

const khung = docVanBanKhung();
const bangVII = khung.slice(khung.indexOf("VII. TRA CỨU NĂNG LỰC ĐẶC THÙ"));

describe("nang_luc_dac_thu.json", () => {
  it("có đủ 15 môn THPT, không có KHTN (THCS)", () => {
    expect(nangLucDacThu.mon).toHaveLength(15);
    expect(nangLucDacThu.mon.some((m) => m.ten_mon.includes("KHTN"))).toBe(false);
  });

  it("gợi ý cách ghi theo cấu trúc biểu hiện năng lực, không còn chỗ trống, có ghi nguồn", () => {
    for (const mon of nangLucDacThu.mon) {
      expect(mon.goi_y, mon.ten_mon).not.toMatch(/[[\]]|\.{3,}|…/);
      expect(mon.goi_y, mon.ten_mon).toMatch(/^Học sinh .+ được .+\.$/);
      expect(bangVII, mon.goi_y_thanh_phan).toContain(mon.goi_y_thanh_phan);
      expect(["Ví dụ do giáo viên cung cấp", "Bản nháp theo cấu trúc biểu hiện năng lực, chờ giáo viên duyệt"]).toContain(mon.goi_y_nguon);
    }
    expect(nangLucDacThu.mon.find((m) => m.ma_mon === "TOAN")!.goi_y).toBe(
      "Học sinh nhận diện được các đại lượng và mối quan hệ trong tình huống thực tiễn; biểu diễn được mối quan hệ đó bằng mô hình toán học phù hợp và sử dụng mô hình để giải quyết vấn đề.",
    );
  });

  it("mọi tên năng lực, thành phần chép nguyên văn từ mục VII của khung", () => {
    for (const mon of nangLucDacThu.mon) {
      for (const nl of mon.nang_luc) {
        expect(bangVII, nl.ten).toContain(nl.ten);
        for (const tp of nl.thanh_phan) expect(bangVII, tp.ten).toContain(tp.ten);
      }
    }
  });

  it("mã không trùng", () => {
    const ma = nangLucDacThu.mon.flatMap((m) =>
      m.nang_luc.flatMap((nl) => [nl.ma, ...nl.thanh_phan.map((tp) => tp.ma)]),
    );
    expect(new Set(ma).size).toBe(ma.length);
  });

  it("Tin học giữ kí hiệu NLa–NLe của khung", () => {
    const tin = timMon("TIN_HOC")!;
    expect(tin.nang_luc[0].thanh_phan.map((tp) => tp.ma)).toEqual(
      ["NLa", "NLb", "NLc", "NLd", "NLe"].map((k) => `TIN_HOC.1.${k}`),
    );
  });

  it("biểu hiện chưa duyệt thì không hiển thị", () => {
    expect(bieuHienHienThi({ ma: "X", ten: "x", bieu_hien: ["a"], da_duyet: false })).toEqual([]);
    expect(bieuHienHienThi({ ma: "X", ten: "x", bieu_hien: ["a"], da_duyet: true })).toEqual(["a"]);
  });
});
