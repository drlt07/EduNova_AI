import type { HoatDongCu } from "../kieu";
import type { TietHoc } from "./thoi-luong";

/** Ô vị trí để gắn mã năng lực; chỉ sinh từ hoạt động thật sự có trong bài. */
export type OViTri = { ma: string; nhan: string };

const LA_MA: Record<string, string> = { HD1: "I", HD2: "II", HD3: "III", HD4: "IV" };

export function oViTriKhungMoi(dsTiet: TietHoc[], coTuHoc: boolean): OViTri[] {
  const kq: OViTri[] = coTuHoc ? [{ ma: "GD1", nhan: "Giai đoạn 1" }] : [];
  for (const t of dsTiet) {
    for (const m of t.muc) {
      const la = LA_MA[m.hd];
      if (!la) continue;
      const ma = `${m.hd}_T${t.tiet}`;
      if (!kq.some((o) => o.ma === ma)) kq.push({ ma, nhan: `HĐ ${la} – tiết ${t.tiet}` });
    }
  }
  return kq;
}

/** Chỉ tích hợp, giữ khung cũ: vị trí là các hoạt động của GV. */
export function oViTriKhungCu(hoatDong: HoatDongCu[]): OViTri[] {
  return hoatDong.map((h) => ({ ma: h.ma, nhan: h.ten }));
}
