import { boDauThuong } from "@khbd/lib/data/nls";
import type { KeHoach } from "@khbd/lib/pipeline/3-ke-hoach";
import type { NguCanhSoan, NoiDungSoan } from "@khbd/lib/pipeline/4-sinh-noi-dung/dinh-nghia";
import type { LoiKiemTra } from "./kiem-tra-file";

/**
 * Kiểm tra tính khả thi của hoạt động trước khi xuất KHBD: thời gian khớp, số bước vừa phải,
 * mỗi bước nêu việc cụ thể của GV và HS, chỉ dùng thiết bị có trong giáo án, có sản phẩm và cách đánh giá,
 * năng lực số có hành vi số thật. Các bảng từ khóa dưới đây dùng để kiểm tra, không phải dữ liệu chuẩn.
 */

/** Đồ dùng lớp học thông thường, không cần ghi trong giáo án. */
export const DO_DUNG_LOP = ["bảng", "phấn", "bút", "giấy", "vở", "SGK", "sách giáo khoa", "phiếu học tập", "bảng phụ", "giấy A0", "thẻ màu", "nam châm"];

/** Thiết bị, học liệu có sẵn: mục Thiết bị của GV, nền tảng GV chọn, đồ dùng lớp học thông thường. */
export function thietBiCoSan(ctx: Pick<NguCanhSoan, "doan" | "luaChon">): string[] {
  return [
    ...ctx.doan.filter((d) => d.loai === "TB").map((d) => d.vanBan),
    ...ctx.luaChon.nenTang,
    ...(ctx.luaChon.tuHoc.bat && ctx.luaChon.tuHoc.nenTang ? [ctx.luaChon.tuHoc.nenTang] : []),
    ...DO_DUNG_LOP,
  ];
}

/** Tổng số phút của một hoạt động trong kế hoạch (cộng các tiết); 0 nếu không có. */
export const phutHoatDong = (kh: Pick<KeHoach, "thoiLuong">, hd: string) =>
  (kh.thoiLuong ?? []).reduce((s, t) => s + t.muc.filter((m) => m.hd === hd).reduce((a, m) => a + m.phut, 0), 0);

const chuan = (s: string) => ` ${boDauThuong(s).replace(/[^a-z0-9]+/g, " ").trim()} `;

/** Thiết bị cần có sẵn mới dùng được; khóa dài đứng trước để "máy tính cầm tay" không bị hiểu là "máy tính". */
const THIET_BI_CAN: [string, string[]][] = [
  ["máy tính cầm tay", ["máy tính cầm tay", "casio"]],
  ["máy tính bảng", ["máy tính bảng", "tablet", "ipad"]],
  ["máy tính", ["máy tính", "laptop", "phòng máy"]],
  ["điện thoại", ["điện thoại", "smartphone"]],
  ["máy chiếu", ["máy chiếu", "tivi", "màn hình"]],
  ["Internet", ["internet", "wifi", "mạng"]],
  ["video", ["video", "máy chiếu", "tivi"]],
  ["loa", ["loa"]],
  ["kính hiển vi", ["kính hiển vi"]],
  ["ống nghiệm", ["ống nghiệm", "dụng cụ thí nghiệm"]],
  ["hóa chất", ["hóa chất", "dung dịch"]],
  ["đèn cồn", ["đèn cồn"]],
];

/** Thiết bị nhắc trong văn bản mà giáo án không có. */
export function thietBiThieu(vanBan: string, coSan: string[]): string[] {
  let vb = chuan(vanBan);
  const san = chuan(coSan.join(" | "));
  const thieu: string[] = [];
  for (const [ten, dongNghia] of THIET_BI_CAN) {
    const k = chuan(ten);
    if (!vb.includes(k)) continue;
    vb = vb.split(k).join(" ");
    if (!dongNghia.some((d) => san.includes(chuan(d)))) thieu.push(ten);
  }
  return thieu;
}

/** Cụm chung chung: bỏ hết các cụm này mà câu còn quá ít chữ thì là câu chung chung. */
const CUM_CHUNG = [
  "giáo viên", "học sinh", "gv", "hs", "các nhóm", "nhóm", "cả lớp", "giao nhiệm vụ", "nhận nhiệm vụ", "thực hiện nhiệm vụ",
  "thảo luận", "đại diện", "trình bày", "báo cáo", "nhận xét", "bổ sung", "chốt kiến thức", "chốt", "kết luận", "theo dõi",
  "quan sát", "hỗ trợ", "lắng nghe", "trả lời", "câu hỏi", "đặt câu hỏi", "làm việc", "hoạt động", "tổ chức", "đánh giá",
  "hướng dẫn", "và", "các", "của", "cho", "theo", "với", "rồi", "sau đó",
];

export function laCauChung(s: string): boolean {
  let vb = chuan(s);
  for (const c of [...CUM_CHUNG].sort((a, b) => b.length - a.length)) vb = vb.split(chuan(c)).join(" ");
  return vb.trim().split(/\s+/).filter((t) => t.length > 1).length < 4;
}

/** Số phút ghi ở tên hoạt động, vd "Hoạt động 1: Mở đầu (10 phút)"; không ghi thì 0. */
export const phutTrongTen = (ten: string) => Number(/(\d+)\s*phút/i.exec(ten)?.[1] ?? 0);

type Buoc = { ten: string; phut: number; gv: string; hs: string };
const loi = (noiDung: string, nghiem = true): LoiKiemTra => ({ loai: "kha_thi", noiDung, nghiem });

/** Các bước của một hoạt động: tổng phút đúng thời lượng, số bước vừa phải, việc GV và HS cụ thể. */
export function kiemTraBuoc(buoc: Buoc[], phut: number, tenHd: string): LoiKiemTra[] {
  const kq: LoiKiemTra[] = [];
  const tong = buoc.reduce((s, b) => s + b.phut, 0);
  if (phut > 0 && tong !== phut) kq.push(loi(`${tenHd}: tổng thời gian các bước là ${tong} phút, thời lượng hoạt động là ${phut} phút; điều chỉnh các bước trong hoạt động cho khớp.`));
  const toiDa = phut > 0 && phut < 10 ? 3 : 5;
  if (buoc.length > toiDa) kq.push(loi(`${tenHd}: ${buoc.length} bước là quá nhiều cho ${phut || "thời lượng này"} phút; gộp còn tối đa ${toiDa} bước.`));
  if (buoc.length < 2) kq.push(loi(`${tenHd}: cần ít nhất 2 bước tổ chức.`));
  for (const b of buoc) {
    if (b.phut < 1) kq.push(loi(`${tenHd} – ${b.ten}: số phút không hợp lệ.`));
    if (laCauChung(b.gv) || laCauChung(b.hs)) kq.push(loi(`${tenHd} – ${b.ten}: việc GV/HS còn chung chung (“${laCauChung(b.gv) ? b.gv : b.hs}”); nêu cụ thể câu hỏi, dữ liệu, vai, thao tác hoặc sản phẩm.`));
  }
  return kq;
}

/** Hoạt động chỉ dùng thiết bị có trong giáo án (kể cả thiết bị nhắc trong lời văn). */
export function kiemTraThietBi(khaiBao: string[], vanBan: string, coSan: string[], tenHd: string): LoiKiemTra[] {
  const thieu = new Set([...thietBiThieu(khaiBao.join(" | "), coSan), ...thietBiThieu(vanBan, coSan)]);
  return [...thieu].map((t) => loi(`${tenHd}: cần ${t} nhưng giáo án không có trong thiết bị dạy học; dùng thiết bị có sẵn hoặc đổi cách tổ chức.`));
}

/** Từ chỉ thao tác số thật (để phân biệt với đóng kịch, thảo luận đơn thuần). */
const HANH_VI_SO = [
  "máy tính", "điện thoại", "phần mềm", "ứng dụng", "trực tuyến", "internet", "công cụ số", "tệp", "file", "thư mục", "bảng tính",
  "trình chiếu", "lập trình", "chương trình", "câu lệnh", "python", "nền tảng", "website", "trang web", "tìm kiếm", "dữ liệu số",
  "geogebra", "excel", "canva", "padlet", "video", "ảnh số", "trí tuệ nhân tạo", "chatbot", "mô phỏng", "biểu mẫu", "google",
];

/** Năng lực số phải có hành vi số thực tế (công cụ + thao tác), không chỉ đóng kịch, thảo luận. */
export function coHanhViSo(bieuHien: string, congCu: string): boolean {
  if (!congCu.trim()) return false;
  const vb = chuan(`${bieuHien} ${congCu}`);
  return HANH_VI_SO.some((t) => vb.includes(chuan(t)));
}

const PP = [
  ["trò chơi", /trò chơi|rung chuông|ô chữ|đuổi hình|ai nhanh hơn/i],
  ["công nghệ", /phần mềm|máy tính|trực tuyến|điện thoại|ứng dụng|nền tảng/i],
  ["đóng vai", /đóng vai|đóng kịch|nhập vai/i],
] as const;

/** Toàn bài: cảnh báo nếu áp dụng máy móc một cách tổ chức cho mọi hoạt động. */
export function kiemTraLapPhuongPhap(nd: NoiDungSoan): LoiKiemTra[] {
  const cach = [nd.hd1?.cachToChuc, nd.hd2 ? nd.hd2.giaoNhiemVu : undefined, nd.hd3?.phuongPhap].filter((x): x is string => !!x);
  if (cach.length < 3) return [];
  return PP.filter(([, re]) => cach.every((c) => re.test(c))).map(([ten]) => loi(`Cả ${cach.length} hoạt động đều dùng ${ten}; nên đổi cách tổ chức ở một hoạt động cho phù hợp nội dung.`, false));
}
