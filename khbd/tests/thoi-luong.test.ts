import { describe, expect, it } from "vitest";
import { kiemTraThoiLuong, lapThoiLuong, type TietHoc } from "@khbd/lib/pipeline/3-ke-hoach/thoi-luong";

const tomTat = (ds: TietHoc[]) => ds.map((t) => t.muc.map((m) => `${m.hd}:${m.phut}`).join(" "));

describe("lập thời lượng theo khung", () => {
  it("bài 1 tiết: 7 + 15 + 15 + 8", () => {
    const ds = lapThoiLuong(1, null);
    expect(tomTat(ds)).toEqual(["HD1:7 HD2:15 HD3:15 HD4:8"]);
    expect(kiemTraThoiLuong(ds)).toEqual([]);
  });

  it("bài 2 tiết: 15 + 30 | 35 + 10", () => {
    expect(tomTat(lapThoiLuong(2, null))).toEqual(["HD1:15 HD2:30", "HD3:35 HD4:10"]);
  });

  it("bài 3 tiết phương án A", () => {
    const ds = lapThoiLuong(3, "A");
    expect(tomTat(ds)).toEqual(["HD1:15 HD2:30", "HD3:45", "HD3:33 HD4:12"]);
    expect(kiemTraThoiLuong(ds, "A")).toEqual([]);
  });

  it("bài 4 và 5 tiết phương án A", () => {
    expect(tomTat(lapThoiLuong(4, "A"))).toEqual(["HD1:15 HD2:30", "HD2:45", "HD3:45", "HD3:33 HD4:12"]);
    expect(tomTat(lapThoiLuong(5, "A"))).toEqual(["HD1:15 HD2:30", "HD2:45", "HD3:45", "HD3:45", "HD3:33 HD4:12"]);
  });

  it("bài 3 tiết phương án B: 2 mạch + tổng hợp", () => {
    const ds = lapThoiLuong(3, "B");
    expect(tomTat(ds)).toEqual([
      "HD1:8 HD2:20 HD3:14 CHOT:3", "HD1:8 HD2:20 HD3:14 CHOT:3", "NHAC_LAI:5 HD3:28 HD4:12",
    ]);
    expect(ds.map((t) => t.nhan)).toEqual(["Mạch 1", "Mạch 2", "Tổng hợp"]);
    expect(kiemTraThoiLuong(ds, "B")).toEqual([]);
  });

  it("bài 4 tiết phương án C: 3 mục + tiết tổng hợp", () => {
    const ds = lapThoiLuong(4, "C", 3);
    expect(tomTat(ds)).toEqual([
      "HD1:8 HD2:32 CHOT:5", "HD1:8 HD2:32 CHOT:5", "HD1:8 HD2:32 CHOT:5", "NHAC_LAI:5 HD3:28 HD4:12",
    ]);
    expect(kiemTraThoiLuong(ds, "C")).toEqual([]);
  });

  it("bài 4 tiết phương án C: 4 mục, tổng hợp cuối tiết mục cuối", () => {
    const ds = lapThoiLuong(4, "C", 4);
    expect(tomTat(ds)[3]).toBe("HD1:5 HD2:20 HD3:12 HD4:8");
    expect(kiemTraThoiLuong(ds, "C").filter((l) => l.nghiem)).toEqual([]);
  });

  it("bài từ 3 tiết bắt buộc chọn phương án", () => {
    expect(() => lapThoiLuong(3, null)).toThrow(/phương án/);
  });
});

describe("kiểm tra thời lượng GV sửa", () => {
  it("báo lỗi khi tiết không đủ 45 phút", () => {
    const ds = lapThoiLuong(2, null);
    ds[0].muc[0].phut = 20;
    expect(kiemTraThoiLuong(ds)).toEqual([{ muc: "Tiết 1", noiDung: "Tổng 50 phút, cần đúng 45 phút.", nghiem: true }]);
  });

  it("báo lỗi khi bỏ HĐ IV", () => {
    const ds = lapThoiLuong(1, null);
    ds[0].muc = ds[0].muc.filter((m) => m.hd !== "HD4");
    ds[0].muc[2].phut += 8;
    expect(kiemTraThoiLuong(ds).map((l) => l.muc)).toEqual(["HĐ IV"]);
  });

  it("phương án C: cảnh báo nhẹ khi ra ngoài khung gợi ý", () => {
    const ds = lapThoiLuong(4, "C", 3);
    ds[0].muc[0].phut = 12;
    ds[0].muc[1].phut = 28;
    const loi = kiemTraThoiLuong(ds, "C");
    expect(loi).toHaveLength(1);
    expect(loi[0]).toMatchObject({ nghiem: false });
  });
});
