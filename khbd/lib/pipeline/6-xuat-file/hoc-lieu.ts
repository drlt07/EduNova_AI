/**
 * Học liệu số / mô phỏng EduNova gắn vào từng hoạt động của bản soạn.
 * GV chọn ở bước "Học liệu và mô phỏng"; code chèn đoạn `bo_sung` ngay sau nội dung của hoạt động đó
 * và thêm một dòng vào mục Thiết bị dạy học. Không đổi, không xóa chữ của GV.
 */
import type { PhanTichGiaoAn } from "@khbd/lib/pipeline/kieu";
import { laBang, type BanSoan, type Phan, type TruongMau } from "./ban-soan";
import type { Doan } from "./xml";

export type HocLieuGan = {
  /** Mã hoạt động trong bản soạn: HD1…HD4, GD1, GD3 (khung mới) hoặc HDC-n (giữ bố cục) */
  hd: string;
  loai: "mo_phong" | "hoc_lieu";
  ten: string;
  /** Mô tả nhiệm vụ cho HS — GV biên tập được */
  nhiemVu: string;
  /** Đường dẫn mở học liệu (nếu có) */
  duongDan?: string;
};

export type HoatDongBan = { hd: string; ten: string };

/** Tên hiển thị cho phần không có dòng tiêu đề riêng trong bản soạn. */
const TEN_MAC_DINH: Record<string, string> = { GD1: "Giai đoạn 1 – Tự học trước giờ học", GD3: "Giai đoạn 3 – Sau giờ học" };

export const TRUONG_HOAT_DONG: TruongMau[] = ["gd1", "tienTrinh", "gd3", "noiDungCu"];

const laDoan = (k: Phan["khoi"][number]): k is Doan => !laBang(k);

/** Danh sách hoạt động của bản soạn (theo thứ tự xuất hiện) để GV chọn chỗ gắn học liệu. */
export function hoatDongCuaBan(ban: BanSoan, pt?: PhanTichGiaoAn): HoatDongBan[] {
  const ds: HoatDongBan[] = [];
  for (const p of ban.phan) {
    if (!TRUONG_HOAT_DONG.includes(p.truong)) continue;
    for (const k of p.khoi) {
      if (!laDoan(k) || !k.hd || ds.some((x) => x.hd === k.hd)) continue;
      const tieuDe = p.khoi.find((x): x is Doan => laDoan(x) && x.hd === k.hd && x.kieu === "TenHoatDong");
      const cu = pt?.hoatDong.find((h) => h.ma === k.hd);
      ds.push({ hd: k.hd, ten: (tieuDe?.chu ?? cu?.ten ?? TEN_MAC_DINH[k.hd] ?? k.hd).trim() });
    }
  }
  return ds;
}

function doanHocLieu(h: HocLieuGan): Doan[] {
  const nhan = h.loai === "mo_phong" ? "Mô phỏng:" : "Học liệu số:";
  return [
    { nguon: "bo_sung", cap: 1, nhan, chu: `${h.ten}${h.duongDan ? ` (${h.duongDan})` : ""}.`, hd: h.hd, vai: "buoc" },
    ...(h.nhiemVu.trim() ? [{ nguon: "bo_sung", cap: 2, chu: h.nhiemVu.trim(), hd: h.hd, vai: "buoc_viec" } as Doan] : []),
  ];
}

/**
 * Chèn học liệu vào sau đoạn cuối của hoạt động tương ứng; hoạt động không còn trong bản soạn thì bỏ qua.
 * Mục Thiết bị dạy học có thêm một dòng liệt kê các học liệu (mỗi tên một lần).
 */
export function chenHocLieu(ban: BanSoan, ds: HocLieuGan[] = []): BanSoan {
  if (!ds.length) return ban;
  const conHd = new Set(hoatDongCuaBan(ban).map((h) => h.hd));
  const dung = ds.filter((h) => conHd.has(h.hd) && h.ten.trim());
  if (!dung.length) return ban;
  const phan = ban.phan.map((p) => {
    if (!TRUONG_HOAT_DONG.includes(p.truong)) return p;
    const khoi = [...p.khoi];
    for (const hd of new Set(dung.map((h) => h.hd))) {
      let cuoi = -1;
      khoi.forEach((k, i) => { if (laDoan(k) && k.hd === hd) cuoi = i; });
      if (cuoi < 0) continue;
      khoi.splice(cuoi + 1, 0, ...dung.filter((h) => h.hd === hd).flatMap(doanHocLieu));
    }
    return { ...p, khoi };
  });
  const ten = [...new Set(dung.map((h) => h.ten.trim()))];
  const dongThietBi: Doan = { nguon: "bo_sung", cap: 1, nhan: "Học liệu số, mô phỏng:", chu: `${ten.join("; ")}.` };
  const coThietBi = phan.some((p) => p.truong === "thietBi");
  return {
    ...ban,
    phan: coThietBi
      ? phan.map((p) => (p.truong === "thietBi" ? { ...p, khoi: [...p.khoi, dongThietBi] } : p))
      : [...phan, { truong: "thietBi", khoi: [dongThietBi] }],
  };
}
