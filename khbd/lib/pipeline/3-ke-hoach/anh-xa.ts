import type { HoatDongCu, LoaiHoatDongCu } from "../kieu";

/** Đích trong khung mới khi chuyển khung. */
export type DichAnhXa = "GD1" | "HD1" | "HD2" | "HD3" | "HD4" | "GD3" | "bo_qua";

export const TEN_DICH: Record<DichAnhXa, string> = {
  GD1: "Giai đoạn 1 (tự học)",
  HD1: "HĐ I. Khởi động & chỉnh lỗi",
  HD2: "HĐ II. Luyện tập phân hóa",
  HD3: "HĐ III. Vận dụng thực tế",
  HD4: "HĐ IV. Đánh giá, phản tư",
  GD3: "Giai đoạn 3 (sau giờ học)",
  bo_qua: "Không dùng",
};

// Khởi động → HĐ I; Hình thành kiến thức → GĐ1 + nhận định chỉnh lỗi ở HĐ I; Luyện tập → HĐ II;
// Vận dụng → HĐ III; Củng cố, dặn dò → HĐ IV và GĐ3.
const MAC_DINH: Record<LoaiHoatDongCu, DichAnhXa[]> = {
  khoi_dong: ["HD1"],
  hinh_thanh: ["GD1", "HD1"],
  luyen_tap: ["HD2"],
  van_dung: ["HD3"],
  cung_co: ["HD4", "GD3"],
  khac: [],
};

export type DongAnhXa = { hoatDongCu: string; tenCu: string; dich: DichAnhXa[] };

export function anhXaMacDinh(hoatDong: HoatDongCu[]): DongAnhXa[] {
  return hoatDong.map((h) => ({ hoatDongCu: h.ma, tenCu: h.ten, dich: [...MAC_DINH[h.loai]] }));
}

export function kiemTraAnhXa(bang: DongAnhXa[]): string[] {
  const loi: string[] = [];
  for (const d of bang) if (d.dich.length === 0) loi.push(`Chưa chọn chỗ đặt cho "${d.tenCu}".`);
  return loi;
}
