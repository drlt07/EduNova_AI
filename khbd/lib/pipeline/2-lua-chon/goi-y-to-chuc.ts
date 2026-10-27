import duLieu from "@khbd/data/goi_y_to_chuc.json";
import { boDauThuong } from "@khbd/lib/data/nls";
import type { PhanTichGiaoAn, ThongTinBai } from "@khbd/lib/pipeline/kieu";

/**
 * Gợi ý sau khi đọc giáo án: hình thức tổ chức HĐ II, HĐ III và việc cần làm.
 * Căn cứ chính là hai bảng của khung (data/goi_y_to_chuc.json, chép nguyên văn); từ khóa nội dung
 * chỉ để xếp thứ tự. Chỉ gợi ý, không chọn sẵn: GV bấm mới thêm vào lựa chọn.
 */

export type HinhThucHd2Khung = { hinh_thuc: string; phu_hop: string; dien_bien: string; san_pham: string };
export type NhiemVuHd3Khung = { mon: string; dang_nhiem_vu: string; san_pham: string };
export const GOI_Y_KHUNG = duLieu as { nguon: string; hd2: HinhThucHd2Khung[]; hd3: NhiemVuHd3Khung[] };

/** Tên môn/nhóm môn trong khung → mã môn của app. */
const TEN_MON_KHUNG: [string, string[]][] = [
  ["KHTN", ["VAT_LI", "HOA_HOC", "SINH_HOC"]], ["Toán", ["TOAN"]], ["Vật lí", ["VAT_LI"]], ["Hóa học", ["HOA_HOC"]],
  ["Sinh học", ["SINH_HOC"]], ["Ngữ văn", ["NGU_VAN"]], ["Ngoại ngữ", ["NGOAI_NGU"]], ["Lịch sử", ["LICH_SU"]],
  ["Địa lí", ["DIA_LI"]], ["GDKT&PL", ["GDKT_PL"]], ["GDCD", ["GDKT_PL"]], ["HĐTN", ["HDTN_HN"]],
  ["Công nghệ", ["CONG_NGHE"]], ["Tin học", ["TIN_HOC"]], ["GDTC", ["GDTC"]], ["Âm nhạc", ["AM_NHAC"]], ["Mĩ thuật", ["MI_THUAT"]],
];
const monTrong = (o: string) => new Set(TEN_MON_KHUNG.filter(([t]) => o.includes(t)).flatMap(([, ma]) => ma));

/** Bỏ ngoặc vuông của chỗ trống trong khung khi hiển thị/gửi đi: "[nền tảng luyện tập]" → "nền tảng luyện tập". */
export const boNgoac = (s: string) => s.replace(/\[([^\]]*)\]/g, "$1").replace(/\s+/g, " ").trim();

const chuan = (s: string) => ` ${boDauThuong(s).replace(/[^a-z0-9]+/g, " ").trim()} `;
const coTu = (vb: string, tu: string) => vb.includes(chuan(tu));

/** Nội dung bài gợi tới hình thức nào (để xếp thứ tự trong các hình thức khung cho là phù hợp). */
const DAU_HIEU_HD2: Record<string, string[]> = {
  "Luyện tập trên hệ thống số (2 lượt)": ["bài tập", "tính toán", "phương trình", "công thức", "trắc nghiệm", "từ vựng", "ngữ pháp"],
  "Phiên tòa giả định": ["vụ án", "vi phạm", "xét xử", "trách nhiệm", "nhân vật", "công lao"],
  "Đóng vai, xử lí tình huống": ["tình huống", "ứng xử", "giao tiếp", "hội thoại"],
  "Tranh biện": ["quan điểm", "ý kiến", "tranh luận", "nghị luận", "ủng hộ", "phản đối"],
  "Trạm luyện tập": ["dạng bài", "dạng toán", "các dạng", "mức độ"],
  "Mảnh ghép": ["đặc điểm", "so sánh", "giai đoạn", "vùng", "khu vực", "nguyên nhân"],
  "Trò chơi học tập": ["khái niệm", "thuật ngữ", "từ vựng"],
  "Thực hành có hướng dẫn": ["thực hành", "thao tác", "động tác", "kĩ thuật", "kỹ thuật", "luyện tập kĩ năng"],
};

export type GoiYHinhThuc = { ten: string; diem: number; lyDo: string[]; dienBien?: string; sanPham?: string };

/** HĐ II: hình thức trong bảng "Gợi ý hình thức tổ chức HĐ II" của khung, phù hợp môn và nội dung bài. */
export function goiYHinhThucHd2(mon: string | null, vanBan: string[], soLuong = 3): GoiYHinhThuc[] {
  const vb = chuan(vanBan.join(" \n "));
  return GOI_Y_KHUNG.hd2
    .map((h) => {
      const lyDo: string[] = [];
      let diem = 0;
      if (mon && monTrong(h.phu_hop).has(mon)) { diem += 4; lyDo.push(`Khung: phù hợp ${h.phu_hop}`); }
      else if (/mọi môn/i.test(h.phu_hop)) { diem += 1; lyDo.push("Khung: phù hợp mọi môn"); }
      const khop = (DAU_HIEU_HD2[h.hinh_thuc] ?? []).filter((t) => coTu(vb, t));
      if (khop.length) { diem += 2 + Math.min(khop.length - 1, 2); lyDo.push(`Nội dung bài: ${khop.slice(0, 3).join(", ")}`); }
      return { ten: h.hinh_thuc, diem, lyDo, dienBien: boNgoac(h.dien_bien), sanPham: h.san_pham };
    })
    .filter((g) => g.diem >= 3)
    .sort((a, b) => b.diem - a.diem)
    .slice(0, soLuong);
}

/** Dòng "Gợi ý nhiệm vụ HĐ III theo môn" của khung cho môn này. */
export function nhiemVuHd3TheoMon(mon: string | null): NhiemVuHd3Khung | null {
  if (!mon) return null;
  return GOI_Y_KHUNG.hd3.find((h) => monTrong(h.mon).has(mon)) ?? null;
}

/** Cách tổ chức HĐ III, lấy từ khung: "Thảo luận nhóm hoặc thực hành/thí nghiệm/làm việc với tư liệu – theo môn", dự án theo mốc khi bài ≥ 3 tiết, và dạng nhiệm vụ của môn. */
const HINH_THUC_HD3: { ten: string; mon: string[]; tu: string[] }[] = [
  { ten: "Thảo luận nhóm", mon: [], tu: ["thảo luận", "nhóm"] },
  { ten: "Giải tình huống thực tế", mon: ["TOAN"], tu: ["thực tế", "thực tiễn", "mô hình hóa", "bài toán"] },
  { ten: "Thí nghiệm", mon: ["VAT_LI", "HOA_HOC", "SINH_HOC"], tu: ["thí nghiệm", "phản ứng", "đo đạc", "quan sát"] },
  { ten: "Thực hành", mon: ["TIN_HOC", "CONG_NGHE", "GDTC"], tu: ["thực hành", "máy tính", "lập trình", "lắp ráp", "vận hành"] },
  { ten: "Làm việc với tư liệu", mon: ["LICH_SU", "DIA_LI", "NGU_VAN"], tu: ["tư liệu", "bản đồ", "biểu đồ", "số liệu", "văn bản"] },
  { ten: "Đóng vai", mon: ["GDKT_PL", "NGOAI_NGU"], tu: ["tình huống", "ứng xử", "hội thoại", "nhập vai"] },
  { ten: "Biểu diễn, sáng tạo", mon: ["GDTC", "AM_NHAC", "MI_THUAT"], tu: ["biểu diễn", "sáng tạo", "tác phẩm"] },
  { ten: "Thiết kế sản phẩm", mon: ["CONG_NGHE"], tu: ["thiết kế", "bản vẽ", "sản phẩm"] },
  { ten: "Dự án", mon: ["HDTN_HN"], tu: ["dự án"] },
];

/** Tên các cách tổ chức HĐ III để GV bấm chọn. */
export const GOI_Y_HINH_THUC_HD3 = HINH_THUC_HD3.map((h) => h.ten);
/** Tên các hình thức HĐ II trong bảng của khung. */
export const GOI_Y_HINH_THUC_HD2 = GOI_Y_KHUNG.hd2.map((h) => h.hinh_thuc);

/** HĐ III: cách tổ chức hợp với dạng nhiệm vụ của môn (khung) và nội dung bài; bài ≥ 3 tiết thêm dự án theo mốc. */
export function goiYHinhThucHd3(mon: string | null, vanBan: string[], soTiet: number | null, soLuong = 3): GoiYHinhThuc[] {
  const vb = chuan(vanBan.join(" \n "));
  const nv = nhiemVuHd3TheoMon(mon);
  return HINH_THUC_HD3
    .map((h) => {
      const lyDo: string[] = [];
      let diem = 0;
      if (mon && h.mon.includes(mon) && nv) { diem += 4; lyDo.push(`Khung: hợp dạng nhiệm vụ HĐ III môn ${nv.mon}`); }
      if (h.ten === "Thảo luận nhóm") { diem += 2; lyDo.push("Khung: HĐ III chỉ 1 nhiệm vụ, nhóm 3–4 HS"); }
      if (h.ten === "Dự án" && (soTiet ?? 1) >= 3) { diem += 3; lyDo.push("Khung: bài từ 3 tiết chia HĐ III theo mốc (thí nghiệm/thực hành/dự án)"); }
      const khop = h.tu.filter((t) => coTu(vb, t));
      if (khop.length && h.ten !== "Thảo luận nhóm") { diem += 2; lyDo.push(`Nội dung bài: ${khop.slice(0, 3).join(", ")}`); }
      return { ten: h.ten, diem, lyDo, sanPham: h.mon.includes(mon ?? "") ? nv?.san_pham : undefined };
    })
    .filter((g) => g.diem >= 3)
    .sort((a, b) => b.diem - a.diem)
    .slice(0, soLuong);
}

export type GoiYViec = Partial<Record<"chuyenKhung" | "taoLaiHoatDong" | "nls", string>>;

/** Việc nên làm, đọc từ cấu trúc giáo án cũ. Không gợi ý AI, tiếng Anh, LHĐN: các việc đó do GV quyết định. */
export function goiYViec(pt: PhanTichGiaoAn): GoiYViec {
  const kq: GoiYViec = {};
  const tatCa = pt.doan.map((d) => d.vanBan).join("\n");
  const cu = pt.hoatDong.filter((h) => ["khoi_dong", "hinh_thanh", "cung_co"].includes(h.loai));
  const coKhungMoi = /luyện tập phân hóa|vận dụng thực tế|giai đoạn\s*1/i.test(tatCa + "\n" + pt.hoatDong.map((h) => h.ten).join("\n"));
  if (!coKhungMoi && pt.hoatDong.length) {
    kq.chuyenKhung = `Giáo án theo cấu trúc cũ${cu.length ? `: ${cu.slice(0, 3).map((h) => h.ten.replace(/^(hoạt động|HĐ)\s*\d+\s*[:.]?\s*/i, "")).join(", ")}` : ""}.`;
  }
  const loai = new Set(pt.hoatDong.map((h) => h.loai));
  if (pt.hoatDong.length && (!loai.has("luyen_tap") || !loai.has("van_dung"))) {
    kq.taoLaiHoatDong = `Giáo án chưa có ${[!loai.has("luyen_tap") && "luyện tập", !loai.has("van_dung") && "vận dụng"].filter(Boolean).join(" và ")} riêng.`;
  } else if (!/phân hóa|nhóm mức/i.test(tatCa) && pt.hoatDong.length) {
    kq.taoLaiHoatDong = "Luyện tập chưa phân hóa theo nhóm mức đạt.";
  }
  if (!/\b[1-6]\.[1-6]\.(?:5\.\d|NC1[a-z])\b/.test(tatCa) && !/năng lực số/i.test(tatCa)) kq.nls = "Giáo án chưa có mã năng lực số.";
  return kq;
}

/** Văn bản giáo án dùng cho gợi ý: tên bài, mục tiêu, hoạt động, câu hỏi, thiết bị. */
export function vanBanDeGoiY(pt: PhanTichGiaoAn, tt: ThongTinBai): string[] {
  return [tt.tenBai ?? "", ...pt.doan.filter((d) => ["HD", "CH", "TB", "MT"].includes(d.loai)).map((d) => d.vanBan)];
}

/** Phương án tổ chức bài từ 3 tiết, theo mô tả phương án A/B/C của khung. */
export function goiYPhuongAn(pt: PhanTichGiaoAn, tt: ThongTinBai): { ma: "A" | "B" | "C"; lyDo: string } | null {
  if ((tt.soTiet ?? 0) < 3) return null;
  const vb = chuan(vanBanDeGoiY(pt, tt).join(" \n "));
  const thucHanh = ["thí nghiệm", "dự án", "thực hành"].filter((t) => coTu(vb, t));
  if (thucHanh.length) return { ma: "A", lyDo: `Bài có ${thucHanh.join(", ")}: cần nhiều thời gian vận dụng.` };
  const mucCon = pt.doan.filter((d) => d.muc === "tien_trinh" && d.loai === "TD" && /^(\d+|[IVX]+)[.)]\s/.test(d.vanBan));
  if (mucCon.length >= 2 && mucCon.length <= 3) return { ma: "B", lyDo: `Giáo án có ${mucCon.length} mạch nội dung: ${mucCon.map((d) => d.vanBan).join("; ")}.` };
  const yc = pt.doan.filter((d) => d.loai === "MT" && d.nhomMucTieu === "I.1").length;
  if (yc >= (tt.soTiet ?? 0)) return { ma: "C", lyDo: `Bài nặng kiến thức (${yc} yêu cầu cần đạt).` };
  return null;
}
