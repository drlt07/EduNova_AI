/**
 * Bảng thời lượng gợi ý theo khung (mục III, Giai đoạn 2). GV sửa được; kiemTraThoiLuong
 * bảo đảm ràng buộc cứng: mỗi tiết đúng 45 phút, không bỏ HĐ IV.
 */

export const PHUT_MOI_TIET = 45;

export type MaHoatDong = "HD1" | "HD2" | "HD3" | "HD4" | "CHOT" | "NHAC_LAI";
export type PhuongAn = "A" | "B" | "C";

export type MucThoiLuong = {
  hd: MaHoatDong;
  ten: string; // nhãn hiển thị, vd "HĐ II (lượt 2). Luyện tập chuyên sâu"
  phut: number;
  mach?: number; // PA B: số mạch; PA C: số mục
};

export type TietHoc = { tiet: number; nhan?: string; muc: MucThoiLuong[] };

const HD1 = "HĐ I. Khởi động & chỉnh lỗi";
const HD2 = "HĐ II. Luyện tập phân hóa";
const HD3 = "HĐ III. Vận dụng thực tế";
const HD4 = "HĐ IV. Đánh giá, phản tư";

const tiet = (so: number, muc: MucThoiLuong[], nhan?: string): TietHoc => ({ tiet: so, nhan, muc });

function bai1Tiet(): TietHoc[] {
  return [tiet(1, [
    { hd: "HD1", ten: HD1, phut: 7 }, { hd: "HD2", ten: HD2, phut: 15 },
    { hd: "HD3", ten: HD3, phut: 15 }, { hd: "HD4", ten: HD4, phut: 8 },
  ])];
}

function bai2Tiet(): TietHoc[] {
  return [
    tiet(1, [{ hd: "HD1", ten: HD1, phut: 15 }, { hd: "HD2", ten: HD2, phut: 30 }]),
    tiet(2, [{ hd: "HD3", ten: HD3, phut: 35 }, { hd: "HD4", ten: HD4, phut: 10 }]),
  ];
}

function phuongAnA(soTiet: number): TietHoc[] {
  const kq: TietHoc[] = [tiet(1, [{ hd: "HD1", ten: HD1, phut: 15 }, { hd: "HD2", ten: soTiet >= 4 ? "HĐ II (lượt 1). Luyện tập phân hóa" : HD2, phut: 30 }])];
  if (soTiet >= 4) kq.push(tiet(2, [{ hd: "HD2", ten: "HĐ II (lượt 2). Luyện tập chuyên sâu", phut: 45 }]));
  // Bài từ 5 tiết: thêm tiết HĐ III mốc 1 (dự án, thực hành dài).
  while (kq.length < soTiet - 1) {
    kq.push(tiet(kq.length + 1, [{ hd: "HD3", ten: "HĐ III (mốc 1). Thực hiện nhiệm vụ vận dụng", phut: 45 }]));
  }
  kq.push(tiet(soTiet, [
    { hd: "HD3", ten: "HĐ III (mốc 2). Hoàn thiện và trình bày", phut: 33 },
    { hd: "HD4", ten: HD4, phut: 12 },
  ]));
  return kq;
}

function tietMach(so: number, mach: number): TietHoc {
  return tiet(so, [
    { hd: "HD1", ten: `HĐ I.${mach}. Khởi động & chỉnh lỗi`, phut: 8, mach },
    { hd: "HD2", ten: `HĐ II.${mach}. Luyện tập phân hóa`, phut: 20, mach },
    { hd: "HD3", ten: `HĐ III.${mach}. Vận dụng ngắn`, phut: 14, mach },
    { hd: "CHOT", ten: "Chốt tiết", phut: 3, mach },
  ], `Mạch ${mach}`);
}

function tietTongHop(so: number): TietHoc {
  return tiet(so, [
    { hd: "NHAC_LAI", ten: "Nhắc lại, hệ thống hóa", phut: 5 },
    { hd: "HD3", ten: "HĐ III. Vận dụng tổng hợp", phut: 28 },
    { hd: "HD4", ten: HD4, phut: 12 },
  ], "Tổng hợp");
}

function phuongAnB(soTiet: number): TietHoc[] {
  const kq: TietHoc[] = [];
  for (let i = 1; i < soTiet; i++) kq.push(tietMach(i, i));
  kq.push(tietTongHop(soTiet));
  return kq;
}

function tietMuc(so: number, muc: number): TietHoc {
  return tiet(so, [
    { hd: "HD1", ten: `HĐ I. Khởi động & chỉnh lỗi (mục ${muc})`, phut: 8, mach: muc },
    { hd: "HD2", ten: `HĐ II. Luyện tập phân hóa (mục ${muc})`, phut: 32, mach: muc },
    { hd: "CHOT", ten: "Chốt mục", phut: 5, mach: muc },
  ], `Mục ${muc}`);
}

/**
 * PA C: mỗi mục một tiết. soMuc = soTiet - 1 → phần tổng hợp ở tiết riêng;
 * soMuc = soTiet → phần tổng hợp ghép vào cuối tiết mục cuối.
 */
function phuongAnC(soTiet: number, soMuc = soTiet - 1): TietHoc[] {
  const kq: TietHoc[] = [];
  if (soMuc >= soTiet) {
    for (let i = 1; i < soTiet; i++) kq.push(tietMuc(i, i));
    kq.push(tiet(soTiet, [
      { hd: "HD1", ten: `HĐ I. Khởi động & chỉnh lỗi (mục ${soTiet})`, phut: 5, mach: soTiet },
      { hd: "HD2", ten: `HĐ II. Luyện tập phân hóa (mục ${soTiet})`, phut: 20, mach: soTiet },
      { hd: "HD3", ten: "HĐ III. Vận dụng tổng hợp", phut: 12 },
      { hd: "HD4", ten: HD4, phut: 8 },
    ], `Mục ${soTiet} + tổng hợp`));
    return kq;
  }
  for (let i = 1; i <= soMuc; i++) kq.push(tietMuc(i, i));
  kq.push(tietTongHop(soMuc + 1));
  return kq;
}

export function lapThoiLuong(soTiet: number, phuongAn: PhuongAn | null, soMuc?: number): TietHoc[] {
  if (!Number.isInteger(soTiet) || soTiet < 1) throw new Error("Số tiết phải là số nguyên từ 1 trở lên.");
  if (soTiet === 1) return bai1Tiet();
  if (soTiet === 2) return bai2Tiet();
  if (!phuongAn) throw new Error("Bài từ 3 tiết cần chọn phương án A, B hoặc C.");
  if (phuongAn === "A") return phuongAnA(soTiet);
  if (phuongAn === "B") return phuongAnB(soTiet);
  return phuongAnC(soTiet, soMuc);
}

export type LoiThoiLuong = { muc: string; noiDung: string; nghiem: boolean };

export function kiemTraThoiLuong(dsTiet: TietHoc[], phuongAn: PhuongAn | null = null): LoiThoiLuong[] {
  const loi: LoiThoiLuong[] = [];
  for (const t of dsTiet) {
    const tong = t.muc.reduce((s, m) => s + m.phut, 0);
    if (tong !== PHUT_MOI_TIET) {
      loi.push({ muc: `Tiết ${t.tiet}`, noiDung: `Tổng ${tong} phút, cần đúng ${PHUT_MOI_TIET} phút.`, nghiem: true });
    }
    for (const m of t.muc) {
      if (!Number.isFinite(m.phut) || m.phut <= 0) {
        loi.push({ muc: `Tiết ${t.tiet} – ${m.ten}`, noiDung: "Thời lượng phải lớn hơn 0.", nghiem: true });
      }
    }
  }
  const cuoi = dsTiet[dsTiet.length - 1];
  if (!dsTiet.some((t) => t.muc.some((m) => m.hd === "HD4"))) {
    loi.push({ muc: "HĐ IV", noiDung: "Không được bỏ HĐ IV. Đánh giá, phản tư.", nghiem: true });
  } else if (!cuoi.muc.some((m) => m.hd === "HD4")) {
    loi.push({ muc: "HĐ IV", noiDung: "HĐ IV phải nằm ở tiết cuối.", nghiem: true });
  }
  if (phuongAn === "C") {
    const khoang: Partial<Record<MaHoatDong, [number, number]>> = { HD1: [5, 10], HD2: [25, 35], CHOT: [3, 7] };
    for (const t of dsTiet.filter((x) => x.nhan?.startsWith("Mục") && !x.nhan.includes("tổng hợp"))) {
      for (const m of t.muc) {
        const k = khoang[m.hd];
        if (k && (m.phut < k[0] || m.phut > k[1])) {
          loi.push({ muc: `Tiết ${t.tiet} – ${m.ten}`, noiDung: `Khung gợi ý ${k[0]}–${k[1]} phút.`, nghiem: false });
        }
      }
    }
  }
  return loi;
}
