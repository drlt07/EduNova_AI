"use client";

/** Giỏ chọn: các mục GV bấm "Dùng trong bài soạn", lưu trong trình duyệt, đưa vào bước 2. */
export type MucGioChon = { loai: "dac_thu" | "nls"; ma: string; ten: string };

const KHOA = "khbd.gio-chon";

export function docGio(): MucGioChon[] {
  try {
    return JSON.parse(localStorage.getItem(KHOA) ?? "[]");
  } catch {
    return [];
  }
}

export function datGio(gio: MucGioChon[]) {
  try {
    localStorage.setItem(KHOA, JSON.stringify(gio));
  } catch {
    // Trình duyệt chặn lưu trữ: giỏ chỉ sống trong phiên.
  }
}

export function batTatMuc(gio: MucGioChon[], muc: MucGioChon): MucGioChon[] {
  return gio.some((m) => m.ma === muc.ma)
    ? gio.filter((m) => m.ma !== muc.ma)
    : [...gio, muc];
}
