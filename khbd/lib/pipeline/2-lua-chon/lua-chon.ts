import { z } from "zod";

/** Gợi ý hình thức (GV chọn hoặc gõ tự do; không có mặc định). */
export const GOI_Y_HINH_THUC = [
  "Luyện tập trên nền tảng số", "Trò chơi học tập", "Phiên tòa giả định", "Đóng vai", "Tranh biện",
  "Trạm", "Mảnh ghép", "Thực hành", "Thí nghiệm", "Dự án",
];

export const MachSchema = z.object({
  ten: z.string().trim().min(1, "Đặt tên cho mạch/mục."),
  yeuCau: z.array(z.string()), // mã đoạn MT thuộc I.1
});

export const LuaChonSchema = z
  .object({
    chuyenKhung: z.boolean(),
    taoLaiHoatDong: z.boolean(),
    nls: z.boolean(),
    ai: z.boolean(),
    tiengAnh: z.boolean(),
    lhdn: z.boolean(),
    hinhThucHD2: z.array(z.string().trim().min(1)),
    hinhThucHD3: z.array(z.string().trim().min(1)),
    /** Định hướng GV đã duyệt (từ gợi ý theo nội dung bài): diễn biến HĐ II, nhiệm vụ HĐ III. */
    dinhHuongHD2: z.string(),
    dinhHuongHD3: z.string(),
    nenTang: z.array(z.string().trim().min(1)),
    phuongAn: z.enum(["A", "B", "C"]).nullable(),
    mach: z.array(MachSchema),
    maNls: z.array(z.string()),
    maAi: z.array(z.string()),
    /** Hoạt động dịch ở phụ lục: HD1–HD4 (khung mới) hoặc mã hoạt động trong giáo án gốc (HDC-x). */
    hoatDongTiengAnh: z.string().nullable(),
    /** dich: dịch hoạt động ở phụ lục; clil: bổ sung từ khóa, nhiệm vụ dùng tiếng Anh trong hoạt động; ca_hai. */
    /** null: GV chưa chọn (tiếng Anh luôn do GV chọn, không chọn sẵn). */
    cachTiengAnh: z.enum(["dich", "clil", "ca_hai"]).nullable(),
    /** Cách triển khai GV đã duyệt cho từng hoạt động (mã hoạt động → mô tả). */
    trienKhai: z.record(z.string(), z.string()),
    tuHoc: z.object({ bat: z.boolean(), nenTang: z.string().trim() }),
  });

export type LuaChon = z.infer<typeof LuaChonSchema>;

export const LUA_CHON_TRONG: LuaChon = {
  chuyenKhung: false, taoLaiHoatDong: false, nls: false, ai: false, tiengAnh: false, lhdn: false,
  hinhThucHD2: [], hinhThucHD3: [], dinhHuongHD2: "", dinhHuongHD3: "", nenTang: [], phuongAn: null, mach: [], maNls: [], maAi: [],
  hoatDongTiengAnh: null, cachTiengAnh: null, trienKhai: {}, tuHoc: { bat: false, nenTang: "" },
};

/** Nền tảng tự học mặc định khi có LHĐN (theo yêu cầu của GV). */
export const NEN_TANG_TU_HOC_LHDN = "EduNext";

/**
 * Bật/tắt một việc. Riêng LHĐN: khi bật, mặc định học sinh tự học trước giờ trên EduNext
 * (nếu GV chưa nhập nền tảng tự học); GV vẫn đổi được.
 */
export function doiViec(lc: LuaChon, viec: "chuyenKhung" | "taoLaiHoatDong" | "nls" | "ai" | "tiengAnh" | "lhdn", bat: boolean): LuaChon {
  const moi = { ...lc, [viec]: bat };
  if (viec === "lhdn" && bat) moi.tuHoc = { bat: true, nenTang: lc.tuHoc.nenTang.trim() || NEN_TANG_TU_HOC_LHDN };
  return moi;
}

/**
 * Lựa chọn trên giao diện (theo GV):
 * - chỉ tiếng Anh: giữ nguyên KHBD gốc, dịch một hoạt động ở phụ lục;
 * - năng lực số, AI: giữ bố cục gốc, thêm mã và nhiệm vụ tích hợp vào hoạt động;
 * - LHĐN: chuyển sang khung 3 giai đoạn; chọn hình thức HĐ II/HĐ III thì soạn lại hai hoạt động đó.
 */
export function chuanHoaLuaChon(lc: LuaChon): LuaChon {
  return { ...lc, chuyenKhung: lc.lhdn, taoLaiHoatDong: lc.lhdn && (lc.hinhThucHD2.length > 0 || lc.hinhThucHD3.length > 0) };
}
/** Có dịch hoạt động ở phụ lục / có CLIL trong hoạt động. */
export const coDichTiengAnh = (lc: LuaChon) => lc.tiengAnh && (lc.cachTiengAnh === "dich" || lc.cachTiengAnh === "ca_hai");
export const coClil = (lc: LuaChon) => lc.tiengAnh && (lc.cachTiengAnh === "clil" || lc.cachTiengAnh === "ca_hai");

/**
 * Hoạt động hợp nhất để tích hợp tiếng Anh: khung 3 giai đoạn → HĐ III (khung khuyên);
 * giữ bố cục gốc → hoạt động vận dụng, rồi luyện tập, hình thành kiến thức của GV.
 */
export function hoatDongTiengAnhMacDinh(pt: { hoatDong: { ma: string; loai: string; cha?: string }[] }, lc: LuaChon): string | null {
  if (lc.lhdn) return "HD3";
  for (const loai of ["van_dung", "luyen_tap", "hinh_thanh"]) {
    // Gợi ý hoạt động lớn (dịch cả các hoạt động con của nó).
    const h = pt.hoatDong.find((x) => x.loai === loai && !x.cha) ?? pt.hoatDong.find((x) => x.loai === loai);
    if (h) return h.ma;
  }
  return pt.hoatDong[0]?.ma ?? null;
}

/** Hoạt động có thể chọn để tích hợp tiếng Anh với bố cục đang dùng. */
const hoatDongTiengAnhHopLe = (l: LuaChon, pt: { hoatDong: { ma: string }[] }) => (l.lhdn ? ["HD1", "HD2", "HD3", "HD4"] : pt.hoatDong.map((h) => h.ma));

/**
 * Chuẩn hóa theo giáo án: chế độ; hoạt động tiếng Anh không còn hợp lệ với bố cục (vd vừa bật/tắt LHĐN) thì bỏ chọn.
 * Tiếng Anh do GV chọn (cách tích hợp, hoạt động), app không chọn sẵn.
 */
export function chuanHoaTheoBai(lc: LuaChon, pt: { hoatDong: { ma: string; loai: string }[] }): LuaChon {
  const l = chuanHoaLuaChon(lc);
  if (!l.tiengAnh || !l.hoatDongTiengAnh || hoatDongTiengAnhHopLe(l, pt).includes(l.hoatDongTiengAnh)) return l;
  return { ...l, hoatDongTiengAnh: null };
}

/** GV chọn đúng hoạt động gợi ý (dùng ở kịch bản mẫu và test): điền hoạt động tiếng Anh theo hoatDongTiengAnhMacDinh. */
export function chonTiengAnhTheoGoiY(lc: LuaChon, pt: { hoatDong: { ma: string; loai: string }[] }): LuaChon {
  const l = chuanHoaTheoBai(lc, pt);
  return l.tiengAnh && !l.hoatDongTiengAnh ? { ...l, hoatDongTiengAnh: hoatDongTiengAnhMacDinh(pt, l) } : l;
}

export const LUA_CHON_BAT_DAU: LuaChon = chuanHoaLuaChon(LUA_CHON_TRONG);

/** Chỉ thêm phần tích hợp, giữ nguyên toàn bộ giáo án cũ. */
export function chiTichHop(lc: LuaChon): boolean {
  return !lc.chuyenKhung && !lc.taoLaiHoatDong;
}

export function canPhuongAn(lc: LuaChon, soTiet: number): boolean {
  return soTiet >= 3 && (lc.chuyenKhung || lc.taoLaiHoatDong);
}

/** Môn Ngoại ngữ vẫn có phụ lục tiếng Anh nhưng không dùng CLIL. */
export function dungClil(lc: LuaChon, maMon: string | null): boolean {
  return lc.tiengAnh && maMon !== "NGOAI_NGU";
}

/** Lỗi chặn nút "Bắt đầu". yeuCauI1: mã các đoạn MT thuộc I.1. */
export function kiemTraLuaChon(lc: LuaChon, soTiet: number, yeuCauI1: string[]): string[] {
  const loi: string[] = [];
  if (!(lc.chuyenKhung || lc.taoLaiHoatDong || lc.nls || lc.ai || lc.tiengAnh || lc.lhdn)) {
    loi.push("Chọn ít nhất một chức năng: năng lực số, năng lực AI, tiếng Anh hoặc LHĐN.");
  }
  if (lc.taoLaiHoatDong) {
    if (lc.hinhThucHD2.length === 0) loi.push("Chọn hoặc nhập hình thức tổ chức HĐ II.");
    if (lc.hinhThucHD3.length === 0) loi.push("Chọn hoặc nhập hình thức tổ chức HĐ III.");
  }
  if (canPhuongAn(lc, soTiet)) {
    if (!lc.phuongAn) loi.push("Bài từ 3 tiết: chọn cách tổ chức A, B hoặc C.");
    if (lc.phuongAn === "B" || lc.phuongAn === "C") {
      const ten = lc.phuongAn === "B" ? "mạch" : "mục";
      if (lc.mach.length < 2) loi.push(`Cần ít nhất 2 ${ten}.`);
      lc.mach.forEach((m, i) => { if (!m.ten.trim()) loi.push(`Đặt tên cho ${ten} ${i + 1}.`); });
      const dem = new Map<string, number>();
      lc.mach.forEach((m) => m.yeuCau.forEach((y) => dem.set(y, (dem.get(y) ?? 0) + 1)));
      const thieu = yeuCauI1.filter((y) => !dem.has(y));
      const trung = [...dem].filter(([, n]) => n > 1).map(([y]) => y);
      if (thieu.length) loi.push(`Yêu cầu cần đạt chưa gán vào ${ten}: ${thieu.join(", ")}.`);
      if (trung.length) loi.push(`Mỗi yêu cầu cần đạt chỉ thuộc một ${ten}: ${trung.join(", ")}.`);
      if (lc.phuongAn === "B" && lc.mach.length !== soTiet - 1) {
        loi.push(`Phương án B với ${soTiet} tiết cần ${soTiet - 1} mạch (tiết cuối là tổng hợp).`);
      }
      if (lc.phuongAn === "C" && lc.mach.length !== soTiet - 1 && lc.mach.length !== soTiet) {
        loi.push(`Phương án C với ${soTiet} tiết cần ${soTiet - 1} mục (tổng hợp ở tiết riêng) hoặc ${soTiet} mục (tổng hợp cuối tiết mục cuối).`);
      }
    }
  }
  if (lc.tiengAnh && !lc.cachTiengAnh) loi.push("Tiếng Anh: chọn cách tích hợp (dịch, CLIL hoặc cả hai).");
  if (lc.tiengAnh && !lc.hoatDongTiengAnh) loi.push("Tiếng Anh: chọn hoạt động tích hợp.");
  if (lc.nls && lc.maNls.length > 3) loi.push("Năng lực số: chọn 1–3 mã (theo khung).");
  return loi;
}
