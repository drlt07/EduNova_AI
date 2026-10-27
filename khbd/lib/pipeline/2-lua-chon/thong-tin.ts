import { nangLucDacThu } from "@khbd/lib/data/nang-luc-dac-thu";
import type { ThongTinBai } from "../kieu";

// Tên gọi khác của môn → ma_mon. Đặt trước tên chuẩn để "Hoạt động trải nghiệm" không bị nhận nhầm.
const TEN_KHAC: [RegExp, string][] = [
  [/tiếng anh|ngoại ngữ|tiếng pháp|tiếng trung|tiếng nhật|tiếng nga|tiếng hàn|tiếng đức|english/i, "NGOAI_NGU"],
  [/giáo dục kinh tế và pháp luật|gdkt\s*(&|và)?\s*pl|kinh tế (và|&) pháp luật|giáo dục công dân|gdcd/i, "GDKT_PL"],
  [/giáo dục thể chất|thể dục|gdtc/i, "GDTC"],
  [/hoạt động trải nghiệm|hđtn|hướng nghiệp/i, "HDTN_HN"],
  [/tin học/i, "TIN_HOC"],
  [/công nghệ/i, "CONG_NGHE"],
  [/ngữ văn|văn học/i, "NGU_VAN"],
  [/vật lý|vật lí/i, "VAT_LI"],
  [/hóa học|hoá học/i, "HOA_HOC"],
  [/địa lý|địa lí/i, "DIA_LI"],
  [/mỹ thuật|mĩ thuật/i, "MI_THUAT"],
];

export function nhanMon(chu: string): string | null {
  for (const [re, ma] of TEN_KHAC) if (re.test(chu)) return ma;
  for (const mon of nangLucDacThu.mon) {
    const ten = mon.ten_mon.split(",")[0].trim();
    if (new RegExp(`(^|[^\\p{L}])${ten}($|[^\\p{L}])`, "iu").test(chu)) return mon.ma_mon;
  }
  return null;
}

/** Tách HTML thành các dòng chữ: mỗi đoạn, mỗi ô bảng, mỗi mục danh sách một dòng. */
export function dongChu(html: string): string[] {
  return html
    .replace(/<\/(p|td|th|li|h[1-6]|tr)>|<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .split("\n")
    .map((d) => d.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

const LOP = /(?:lớp|khối)\s*(?:học)?\s*[:.]?\s*(1[012])(?!\d)/i;
// "Toán 10", "HÓA HỌC 12", "Ngữ văn lớp 11"
const MON_LOP = /([\p{L}&\s]{2,40}?)\s+(?:lớp\s*)?(1[012])(?![\d.,])/iu;

function soTietTuDong(d: string): number | null {
  const m =
    d.match(/\(\s*(?:thời gian\s*[:.]?\s*)?0?(\d{1,2})\s*tiết\s*\)/i) ??
    d.match(/(?:thời gian thực hiện|thời lượng|thời gian|số tiết)\s*[:.]?\s*\(?\s*0?(\d{1,2})\s*tiết/i) ??
    d.match(/số tiết\s*[:.]?\s*0?(\d{1,2})(?!\d)/i) ??
    d.match(/(?:^|[\s:;–-])0?(\d{1,2})\s*tiết\s*$/i);
  if (m) return Number(m[1]);
  // Tiết theo phân phối chương trình: "Tiết 15, 16" → 2 tiết; "Tiết 12 – 14" → 3 tiết.
  const ppct = d.match(/^(?:tiết|tiết ppct|tiết theo ppct)\s*[:.]?\s*(\d{1,3})\s*(?:([,;và&]|[-–—đến]+)\s*(\d{1,3}))?((?:\s*[,;]\s*\d{1,3})*)\s*$/i);
  if (ppct && ppct[3]) {
    const dau = Number(ppct[1]), cuoi = Number(ppct[3]);
    const them = (ppct[4].match(/\d+/g) ?? []).length;
    if (/[-–—]|đến/.test(ppct[2])) return cuoi >= dau && cuoi - dau < 10 ? cuoi - dau + 1 : null;
    return 2 + them;
  }
  return null;
}

function tenBaiTuDong(d: string): string | null {
  const bo = (s: string) => s.replace(/\(\s*(?:thời gian\s*[:.]?\s*)?\d+\s*tiết\s*\)/i, "").replace(/\s*[(\-–]\s*tiết\s*[\d,\s–-]+\)?\s*$/i, "").trim();
  let m = d.match(/^(?:tên bài(?: dạy| học)?|tên chủ đề|chủ đề\/bài|bài dạy)\s*[:.\-–]\s*(.+)$/i);
  if (m && m[1].replace(/[.…\s]/g, "")) return bo(m[1]);
  m = d.match(/^(bài|unit|chủ đề|chuyên đề)\s*\d+[a-z]?\s*[.:\-–]?\s*(.{3,})$/i);
  if (m) return bo(d);
  return null;
}

/**
 * Trích môn, lớp, tên bài, số tiết từ phần đầu giáo án. Nhận các cách ghi thường gặp
 * (mẫu Công văn 5512, đầu trang dạng bảng, tên file). GV sửa lại ở bước 2.
 */
export function trichThongTin(cacDong: string[], tenFile = ""): ThongTinBai {
  const dau = cacDong.slice(0, 40);
  const kq: ThongTinBai = { mon: null, lop: null, tenBai: null, soTiet: null };
  let tenChuDe: string | null = null;

  for (const d of dau) {
    if (!kq.mon) {
      const m = d.match(/môn(?:\s*học)?(?:\s*\/\s*hoạt động giáo dục)?\s*[:.\-–]?\s*([^;,\n|]+)/i);
      if (m) kq.mon = nhanMon(m[1].replace(/\s*[-–]?\s*(lớp|khối)\b.*$/i, ""));
    }
    if (!kq.lop) {
      const m = d.match(LOP);
      if (m) kq.lop = Number(m[1]) as 10 | 11 | 12;
    }
    if (!kq.soTiet) kq.soTiet = soTietTuDong(d);
    const ten = tenBaiTuDong(d);
    if (ten) {
      if (/^(chủ đề|chuyên đề)/i.test(ten)) tenChuDe ??= ten;
      else kq.tenBai ??= ten;
    }
  }
  kq.tenBai ??= tenChuDe;

  // Dòng tiêu đề kiểu "KẾ HOẠCH BÀI DẠY TOÁN 10", "GIÁO ÁN HÓA HỌC 12".
  for (const d of dau) {
    if (kq.mon && kq.lop) break;
    const m = d.match(MON_LOP);
    if (!m) continue;
    const mon = nhanMon(m[1]);
    if (mon) {
      kq.mon ??= mon;
      kq.lop ??= Number(m[2]) as 10 | 11 | 12;
    }
  }
  if (!kq.mon) for (const d of dau) if ((kq.mon = nhanMonTieuDe(d))) break;

  // Cuối cùng thử tên file: "toan10_bai3.docx", "KHBD Hoa hoc 12.docx".
  if (tenFile) {
    const ten = boDau(tenFile.replace(/\.[^.]+$/, "").replace(/[_\-.]+/g, " "));
    kq.lop ??= (Number(ten.match(/(?:^|\D)(1[012])(?!\d)/)?.[1]) || null) as ThongTinBai["lop"];
    kq.mon ??= nhanMonKhongDau(ten);
  }
  // Không có ở đầu bài và tên file: đọc cả giáo án.
  kq.mon ??= nhanMonTheoNoiDung(cacDong);
  if (!kq.lop) for (const d of cacDong) {
    const m = d.match(LOP);
    if (m) { kq.lop = Number(m[1]) as 10 | 11 | 12; break; }
  }
  return kq;
}

/** Thuật ngữ đặc trưng của từng môn THPT, dùng khi giáo án không ghi tên môn. */
const THUAT_NGU_MON: Record<string, string[]> = {
  TOAN: ["phương trình", "bất phương trình", "hàm số", "đạo hàm", "tích phân", "vectơ", "xác suất", "logarit", "cấp số", "tam thức", "nghiệm", "đồ thị hàm số", "lượng giác"],
  VAT_LI: ["vận tốc", "gia tốc", "động lượng", "động năng", "thế năng", "điện trường", "từ trường", "dòng điện", "điện trở", "dao động", "con lắc", "định luật Newton", "cảm ứng điện từ"],
  HOA_HOC: ["phản ứng", "ester", "lipid", "acid", "axit", "base", "nguyên tử", "phân tử", "liên kết hóa học", "oxi hóa", "polymer", "polime", "cân bằng hóa học", "kim loại", "dung dịch"],
  SINH_HOC: ["tế bào", "gene", "gen", "ADN", "DNA", "nhiễm sắc thể", "quang hợp", "hô hấp", "enzyme", "enzim", "di truyền", "tiến hóa", "sinh thái", "đột biến"],
  LICH_SU: ["chiến tranh", "kháng chiến", "triều đại", "cách mạng", "khởi nghĩa", "thế kỉ", "đế quốc", "thực dân", "bảo vệ Tổ quốc", "sự kiện lịch sử"],
  DIA_LI: ["khí hậu", "địa hình", "dân cư", "lãnh thổ", "sông ngòi", "đô thị hóa", "vùng kinh tế", "bản đồ", "tài nguyên thiên nhiên"],
  NGU_VAN: ["văn bản", "tác phẩm", "tác giả", "thơ", "truyện", "nghị luận", "biện pháp tu từ", "đọc hiểu", "thể loại"],
  NGOAI_NGU: ["vocabulary", "grammar", "listening", "speaking", "reading", "writing", "pronunciation", "unit"],
  GDKT_PL: ["pháp luật", "nghĩa vụ", "công dân", "thị trường", "cung cầu", "lạm phát", "ngân sách", "thuế", "hiến pháp", "kinh doanh"],
  CONG_NGHE: ["thiết kế kĩ thuật", "bản vẽ kĩ thuật", "động cơ", "mạch điện", "trồng trọt", "chăn nuôi", "cơ khí", "vật liệu cơ khí"],
  TIN_HOC: ["lập trình", "Python", "thuật toán", "câu lệnh", "cơ sở dữ liệu", "mạng máy tính", "biến", "kiểu dữ liệu"],
  GDTC: ["bóng đá", "bóng chuyền", "bóng rổ", "cầu lông", "bật nhảy", "chạy cự li", "kĩ thuật động tác"],
  AM_NHAC: ["bài hát", "nhạc cụ", "giai điệu", "tiết tấu", "nhạc sĩ", "kí hiệu âm nhạc"],
  MI_THUAT: ["hội họa", "màu sắc", "bố cục", "điêu khắc", "tranh", "tạo hình"],
  HDTN_HN: ["hướng nghiệp", "trải nghiệm", "nghề nghiệp", "kĩ năng sống", "phát triển bản thân"],
};

/** Đếm thuật ngữ đặc trưng; chọn môn khi đủ nhiều và trội hẳn môn đứng sau. */
export function nhanMonTheoNoiDung(cacDong: string[]): string | null {
  const vb = ` ${boDau(cacDong.join(" ")).replace(/[^a-z0-9]+/g, " ")} `;
  const dem = Object.entries(THUAT_NGU_MON)
    .map(([ma, ds]) => [ma, ds.reduce((s, t) => s + (vb.split(` ${boDau(t).replace(/[^a-z0-9]+/g, " ")} `).length - 1), 0)] as const)
    .sort((a, b) => b[1] - a[1]);
  const [nhat, nhi] = dem;
  return nhat[1] >= 4 && nhat[1] >= 2 * (nhi?.[1] ?? 0) ? nhat[0] : null;
}

function nhanMonTieuDe(d: string): string | null {
  return /^(kế hoạch bài dạy|giáo án|khbd)\b/i.test(d) ? nhanMon(d.replace(/^(kế hoạch bài dạy|giáo án|khbd)/i, "")) : null;
}

export function boDau(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase();
}

const MON_KHONG_DAU: [RegExp, string][] = [
  [/toan/, "TOAN"], [/ngu van|\bvan\b/, "NGU_VAN"], [/tieng anh|english|anh van/, "NGOAI_NGU"],
  [/vat l[iy]|\bly\b/, "VAT_LI"], [/hoa hoc|\bhoa\b/, "HOA_HOC"], [/sinh hoc|\bsinh\b/, "SINH_HOC"],
  [/lich su|\bsu\b/, "LICH_SU"], [/dia l[iy]|\bdia\b/, "DIA_LI"], [/gdktpl|kinh te|phap luat|gdcd/, "GDKT_PL"],
  [/cong nghe/, "CONG_NGHE"], [/tin hoc|\btin\b/, "TIN_HOC"], [/the duc|gdtc/, "GDTC"],
  [/am nhac/, "AM_NHAC"], [/m[iy] thuat/, "MI_THUAT"], [/hdtn|trai nghiem/, "HDTN_HN"],
];

function nhanMonKhongDau(s: string): string | null {
  // Tách "toan10" thành "toan 10" để \b hoạt động.
  const t = s.replace(/([a-z])(\d)/g, "$1 $2");
  for (const [re, ma] of MON_KHONG_DAU) if (re.test(t)) return ma;
  return null;
}
