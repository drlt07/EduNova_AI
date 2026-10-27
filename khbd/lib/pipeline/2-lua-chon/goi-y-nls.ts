import type { ChiBaoNls } from "@khbd/lib/data/nls-csv";
import { boDauThuong } from "@khbd/lib/data/nls";

/**
 * Gợi ý mã năng lực số theo nội dung kiến thức và cách tổ chức của bài. Bảng căn cứ dưới đây là
 * kinh nghiệm sư phạm dùng để gợi ý (GV chọn mã), không phải dữ liệu chuẩn.
 * Theo khung: không thêm mã chỉ vì có dùng nền tảng số (LMS, Quizizz...), nên tên nền tảng không là căn cứ.
 */

type LoaiCanCu = "noi_dung" | "to_chuc" | "nhiem_vu_so";
/** dich: mã thành phần (1.1) hoặc mã chỉ báo cụ thể (2.2.5.3). */
type CanCu = { loai: LoaiCanCu; tu: string[]; dich: string[] };

export const CAN_CU_GOI_Y: CanCu[] = [
  // Nội dung kiến thức
  { loai: "noi_dung", tu: ["bảng số liệu", "số liệu", "biểu đồ", "thống kê", "mẫu số liệu", "bảng tần số", "dữ liệu"], dich: ["1.3", "5.3"] },
  { loai: "noi_dung", tu: ["đồ thị", "mô hình", "hình học không gian", "quỹ đạo", "chuyển động", "dao động", "điện trường", "từ trường", "cấu trúc phân tử", "mạng tinh thể", "tế bào"], dich: ["5.3"] },
  { loai: "noi_dung", tu: ["bản đồ", "lược đồ", "tính toán", "vẽ hình"], dich: ["5.2"] },
  { loai: "noi_dung", tu: ["tư liệu", "tài liệu", "sử liệu", "tra cứu", "thời sự", "nhân vật lịch sử", "sự kiện lịch sử"], dich: ["1.1"] },
  { loai: "noi_dung", tu: ["nguồn tư liệu", "độ tin cậy", "tin giả", "quan điểm", "nhận định", "đánh giá thông tin"], dich: ["1.2"] },
  { loai: "noi_dung", tu: ["trích dẫn", "tài liệu tham khảo", "ghi nguồn"], dich: ["2.2.5.3", "3.3"] },
  { loai: "noi_dung", tu: ["bản quyền", "quyền tác giả", "sở hữu trí tuệ"], dich: ["3.3"] },
  { loai: "noi_dung", tu: ["viết bài", "đoạn văn", "bài văn", "thuyết trình", "báo cáo", "áp phích", "poster", "sơ đồ tư duy", "sáng tác", "thiết kế"], dich: ["3.1"] },
  { loai: "noi_dung", tu: ["thuật toán", "lập trình", "câu lệnh", "vòng lặp", "chương trình máy tính"], dich: ["3.4"] },
  { loai: "noi_dung", tu: ["quyền và nghĩa vụ", "công dân", "dịch vụ công", "thủ tục hành chính"], dich: ["2.3"] },
  { loai: "noi_dung", tu: ["ứng xử", "mạng xã hội", "văn hóa giao tiếp"], dich: ["2.5"] },
  { loai: "noi_dung", tu: ["dữ liệu cá nhân", "quyền riêng tư", "bí mật đời tư", "thông tin cá nhân"], dich: ["4.2"] },
  { loai: "noi_dung", tu: ["sức khỏe tinh thần", "bắt nạt", "nghiện"], dich: ["4.3"] },
  { loai: "noi_dung", tu: ["rác thải điện tử"], dich: ["4.4"] },
  { loai: "noi_dung", tu: ["hội thoại", "viết thư", "email"], dich: ["2.1"] },
  { loai: "noi_dung", tu: ["trí tuệ nhân tạo", "AI"], dich: ["6.2", "6.3"] },
  // Cách tổ chức (hình thức GV chọn, hoặc kĩ thuật có trong giáo án)
  { loai: "to_chuc", tu: ["dự án"], dich: ["3.1", "2.4", "1.1"] },
  { loai: "to_chuc", tu: ["tranh biện", "tranh luận", "phiên tòa giả định"], dich: ["1.2", "1.1"] },
  { loai: "to_chuc", tu: ["mảnh ghép", "trạm", "khăn trải bàn", "thảo luận nhóm", "hoạt động nhóm", "làm việc nhóm"], dich: ["2.4"] },
  { loai: "to_chuc", tu: ["thí nghiệm", "thực hành"], dich: ["5.3", "1.3"] },
  { loai: "to_chuc", tu: ["đóng vai"], dich: ["2.5"] },
  { loai: "to_chuc", tu: ["trình bày sản phẩm", "báo cáo sản phẩm", "triển lãm", "phòng tranh"], dich: ["2.2", "3.1"] },
  // Nhiệm vụ số nêu rõ trong giáo án (công cụ gắn với một thao tác, không phải nền tảng giao bài)
  { loai: "nhiem_vu_so", tu: ["tìm kiếm", "Internet", "trang web", "website"], dich: ["1.1"] },
  { loai: "nhiem_vu_so", tu: ["kiểm chứng", "đối chiếu nguồn"], dich: ["1.2"] },
  { loai: "nhiem_vu_so", tu: ["Excel", "bảng tính", "Google Sheets", "lưu trữ", "thư mục"], dich: ["1.3"] },
  { loai: "nhiem_vu_so", tu: ["Google Docs", "Padlet", "Jamboard", "cộng tác"], dich: ["2.4"] },
  { loai: "nhiem_vu_so", tu: ["PowerPoint", "Canva", "video", "infographic", "podcast", "trình chiếu"], dich: ["3.1"] },
  { loai: "nhiem_vu_so", tu: ["GeoGebra", "Desmos", "máy tính cầm tay"], dich: ["5.2", "5.3"] },
  { loai: "nhiem_vu_so", tu: ["PhET", "thí nghiệm ảo", "mô phỏng"], dich: ["5.3"] },
  { loai: "nhiem_vu_so", tu: ["Python", "Scratch"], dich: ["3.4"] },
  { loai: "nhiem_vu_so", tu: ["mật khẩu", "phần mềm độc hại", "bảo mật"], dich: ["4.1"] },
  { loai: "nhiem_vu_so", tu: ["ChatGPT", "Gemini", "Copilot", "chatbot"], dich: ["6.2", "6.3"] },
];

/** Môn nào hay hình thành thành phần nào: chỉ cộng thêm điểm, không tự gợi ý. */
export const THANH_PHAN_THEO_MON: Record<string, string[]> = {
  NGU_VAN: ["3.1", "2.2", "3.3", "1.2"], TOAN: ["5.3", "5.2", "1.3"], NGOAI_NGU: ["2.1", "3.1", "1.1"],
  VAT_LI: ["5.3", "1.3", "5.2"], HOA_HOC: ["5.3", "1.3", "1.1"], SINH_HOC: ["5.3", "1.3", "1.1"],
  LICH_SU: ["1.1", "1.2", "3.1"], DIA_LI: ["1.3", "5.2", "1.1"], GDKT_PL: ["2.3", "2.5", "4.2", "1.2"],
  CONG_NGHE: ["5.2", "3.1", "5.1"], TIN_HOC: ["3.4", "5.1", "4.1"], GDTC: ["4.3", "3.1"],
  AM_NHAC: ["3.1", "3.3"], MI_THUAT: ["3.1", "3.3"], HDTN_HN: ["2.4", "5.4", "2.3"],
};

/** Chỉ báo hay dùng nhất ở lớp học của mỗi thành phần, khi căn cứ chỉ nêu thành phần. */
const CHI_BAO_MAC_DINH: Record<string, string> = {
  "1.1": "1.1.5.2", "1.2": "1.2.5.1", "1.3": "1.3.5.1", "2.1": "2.1.5.1", "2.2": "2.2.5.1", "2.3": "2.3.5.2",
  "2.4": "2.4.5.1", "2.5": "2.5.5.2", "2.6": "2.6.5.2", "3.1": "3.1.5.1", "3.2": "3.2.5.1", "3.3": "3.3.5.1",
  "3.4": "3.4.5.1", "4.1": "4.1.5.3", "4.2": "4.2.5.1", "4.3": "4.3.5.2", "4.4": "4.4.5.1", "5.1": "5.1.5.2",
  "5.2": "5.2.5.2", "5.3": "5.3.5.1", "5.4": "5.4.5.3", "6.1": "6.1.5.2", "6.2": "6.2.5.3", "6.3": "6.3.5.2",
};

const TRONG_SO: Record<LoaiCanCu, number> = { nhiem_vu_so: 4, to_chuc: 3, noi_dung: 2 };
const NHAN: Record<LoaiCanCu, string> = { nhiem_vu_so: "Nhiệm vụ số", to_chuc: "Tổ chức", noi_dung: "Nội dung" };

const chuan = (s: string) => ` ${boDauThuong(s).replace(/[^a-z0-9]+/g, " ").trim()} `;

/** Mã năng lực số thường gắn với môn (thành phần đầu trong THANH_PHAN_THEO_MON), dùng khi bài không có căn cứ gợi ý. */
export function maNlsTheoMon(mon: string | null | undefined): string[] {
  const tp = THANH_PHAN_THEO_MON[mon ?? ""]?.[0];
  return tp && CHI_BAO_MAC_DINH[tp] ? [CHI_BAO_MAC_DINH[tp]] : [];
}

export type BaiDeGoiY = {
  mon?: string | null;
  /** Mục tiêu, hoạt động, câu hỏi, thiết bị trong giáo án. */
  vanBan: string[];
  hinhThucHD2?: string[];
  hinhThucHD3?: string[];
  tuHoc?: boolean;
};

export type GoiYChiBao = { chiBao: ChiBaoNls; diem: number; lyDo: string[] };

/**
 * Mỗi thành phần được cộng điểm theo căn cứ khớp (nhiệm vụ số > cách tổ chức > nội dung kiến thức),
 * cộng thêm nếu thường gắn với môn. Phải có ít nhất một căn cứ từ bài; mỗi thành phần gợi ý một chỉ báo.
 */
export function goiYChiBao(chiBao: ChiBaoNls[], bai: BaiDeGoiY, soLuong = 5): GoiYChiBao[] {
  if (chiBao.length === 0) return [];
  const goc = bai.vanBan.join(" \n ");
  const giaoAn = chuan(goc);
  const coTu = (tu: string, vb: string, vbGoc: string) =>
    /^[A-Z]{2,}$/.test(tu) ? new RegExp(`(^|[^\\p{L}])${tu}([^\\p{L}]|$)`, "u").test(vbGoc) : vb.includes(chuan(tu));

  const diem = new Map<string, { diem: number; lyDo: string[]; chiBao?: string }>();
  const cong = (dich: string, d: number, lyDo: string) => {
    const tp = dich.split(".").slice(0, 2).join(".");
    const o = diem.get(tp) ?? { diem: 0, lyDo: [] };
    if (o.lyDo.includes(lyDo)) return;
    o.diem += d;
    o.lyDo.push(lyDo);
    if (dich !== tp) o.chiBao ??= dich;
    diem.set(tp, o);
  };

  const hinhThuc = [
    ...(bai.hinhThucHD2 ?? []).map((h) => ({ h, o: "HĐ II" })),
    ...(bai.hinhThucHD3 ?? []).map((h) => ({ h, o: "HĐ III" })),
  ];
  for (const cc of CAN_CU_GOI_Y) {
    for (const tu of cc.tu) {
      const daChon = cc.loai === "to_chuc" ? hinhThuc.find(({ h }) => coTu(tu, chuan(h), h)) : undefined;
      if (daChon) for (const d of cc.dich) cong(d, TRONG_SO.to_chuc, `${NHAN.to_chuc}: ${daChon.h} (${daChon.o})`);
      else if (coTu(tu, giaoAn, goc)) for (const d of cc.dich) cong(d, TRONG_SO[cc.loai] - (cc.loai === "to_chuc" ? 1 : 0), `${NHAN[cc.loai]}: ${tu}`);
    }
  }
  if (bai.tuHoc) cong("1.1", 2, `${NHAN.to_chuc}: học sinh tự học trước giờ, khai thác học liệu`);
  for (const tp of THANH_PHAN_THEO_MON[bai.mon ?? ""] ?? []) {
    const o = diem.get(tp);
    if (o) o.diem += 1;
  }

  return [...diem]
    .map(([tp, o]) => {
      const cua = chiBao.filter((c) => c.maThanhPhan === tp);
      const c = cua.find((x) => x.ma === o.chiBao) ?? cua.find((x) => x.ma === CHI_BAO_MAC_DINH[tp]) ?? cua[0];
      return c ? { chiBao: c, diem: o.diem, lyDo: o.lyDo.slice(0, 3) } : null;
    })
    .filter((g): g is GoiYChiBao => g !== null)
    .sort((a, b) => b.diem - a.diem || a.chiBao.ma.localeCompare(b.chiBao.ma))
    .slice(0, soLuong);
}
