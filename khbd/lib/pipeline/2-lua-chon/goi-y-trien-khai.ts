import { boDauThuong } from "@khbd/lib/data/nls";
import type { LoaiHoatDongCu, PhanTichGiaoAn, ThongTinBai } from "@khbd/lib/pipeline/kieu";
import type { LuaChon } from "./lua-chon";
import { goiYHinhThucHd2, goiYHinhThucHd3, type GoiYHinhThuc } from "./goi-y-to-chuc";

/**
 * Gợi ý cách triển khai từng hoạt động theo chức năng GV chọn.
 * Giữ bố cục gốc (năng lực số, AI, tiếng Anh): hoạt động là hoạt động trong giáo án của GV.
 * LHĐN: hoạt động của khung 3 giai đoạn (Giai đoạn 1, HĐ I – IV).
 * Bảng cách làm dưới đây là kinh nghiệm sư phạm dùng để gợi ý; HĐ II, HĐ III của khung lấy từ bảng của khung.
 */

export type HoatDongTrienKhai = { ma: string; ten: string; loai: LoaiHoatDongCu | "tu_hoc" };

export function hoatDongTrienKhai(pt: PhanTichGiaoAn, lc: LuaChon): HoatDongTrienKhai[] {
  if (!lc.lhdn) return pt.hoatDong.map((h) => ({ ma: h.ma, ten: h.ten, loai: h.loai }));
  return [
    { ma: "GD1", ten: "Giai đoạn 1: Tự học ở nhà trước tiết học", loai: "tu_hoc" },
    { ma: "HD1", ten: "HĐ I. Khởi động & chỉnh lỗi", loai: "khoi_dong" },
    { ma: "HD2", ten: "HĐ II. Luyện tập phân hóa", loai: "luyen_tap" },
    { ma: "HD3", ten: "HĐ III. Vận dụng thực tế", loai: "van_dung" },
    { ma: "HD4", ten: "HĐ IV. Đánh giá, phản tư", loai: "cung_co" },
  ];
}

type CachLam = { ten: string; moTa: string; mon?: string[]; tu?: string[] };

const CACH_LAM: Record<string, CachLam[]> = {
  khoi_dong: [
    { ten: "Đóng kịch tình huống", moTa: "2–3 HS diễn nhanh một tình huống gắn với bài; cả lớp nêu câu hỏi cần giải quyết.", mon: ["GDKT_PL", "NGU_VAN", "LICH_SU", "NGOAI_NGU", "HDTN_HN"], tu: ["tình huống", "nhân vật", "ứng xử"] },
    { ten: "Tình huống thực tế qua hình ảnh, video ngắn", moTa: "GV chiếu hình ảnh hoặc video 1–2 phút; HS dự đoán, nêu điều muốn tìm hiểu.", mon: ["VAT_LI", "HOA_HOC", "SINH_HOC", "DIA_LI", "CONG_NGHE"], tu: ["hiện tượng", "thực tế", "thực tiễn"] },
    { ten: "Trò chơi khởi động", moTa: "Ô chữ, đuổi hình bắt chữ hoặc ai nhanh hơn với từ khóa của bài.", tu: ["khái niệm", "từ khóa"] },
    { ten: "Bài toán, câu hỏi có vấn đề", moTa: "Nêu một bài toán thực tế chưa giải được bằng kiến thức cũ để dẫn vào bài.", mon: ["TOAN", "TIN_HOC", "VAT_LI"], tu: ["bài toán", "giải"] },
  ],
  hinh_thanh: [
    { ten: "Mảnh ghép", moTa: "Nhóm chuyên gia tìm hiểu từng nội dung, nhóm mảnh ghép tổng hợp thành sơ đồ.", mon: ["LICH_SU", "DIA_LI", "SINH_HOC"], tu: ["đặc điểm", "nguyên nhân", "giai đoạn"] },
    { ten: "Khai thác tư liệu theo nhóm", moTa: "Mỗi nhóm đọc một tư liệu/đoạn SGK, trả lời câu hỏi định hướng, báo cáo.", mon: ["LICH_SU", "NGU_VAN", "GDKT_PL", "DIA_LI"], tu: ["tư liệu", "văn bản", "bản đồ"] },
    { ten: "Thí nghiệm, quan sát", moTa: "HS tiến hành hoặc quan sát thí nghiệm, ghi hiện tượng, rút ra kết luận.", mon: ["VAT_LI", "HOA_HOC", "SINH_HOC"], tu: ["thí nghiệm", "phản ứng", "quan sát"] },
    { ten: "Hỏi đáp gợi mở", moTa: "Chuỗi câu hỏi từ dễ đến khó dẫn HS tự rút ra định nghĩa, định lí.", mon: ["TOAN", "TIN_HOC", "VAT_LI"], tu: ["định nghĩa", "định lí", "công thức"] },
  ],
  cung_co: [
    { ten: "Exit ticket 3 câu", moTa: "3 câu kiểm tra nhanh (nhận biết, thông hiểu, vận dụng) trước khi kết thúc giờ." },
    { ten: "Sơ đồ tư duy tổng kết", moTa: "HS hoàn thiện sơ đồ tư duy kiến thức trọng tâm của bài." },
    { ten: "Phản tư 3 – 2 – 1", moTa: "3 điều đã học, 2 điều thú vị, 1 câu hỏi còn băn khoăn." },
  ],
  tu_hoc: [
    { ten: "Đọc tóm tắt lí thuyết, làm câu hỏi 3 mức", moTa: "HS đọc tóm tắt lí thuyết, làm câu hỏi Lý thuyết – Cơ bản – Nâng cao, ghi lại 1 câu hỏi chưa hiểu." },
    { ten: "Xem video bài giảng ngắn", moTa: "HS xem video 5–7 phút rồi trả lời câu hỏi kiểm tra trên nền tảng tự học." },
  ],
};
CACH_LAM.khac = CACH_LAM.hinh_thanh;

const chuan = (s: string) => ` ${boDauThuong(s).replace(/[^a-z0-9]+/g, " ").trim()} `;

/** Cách làm gợi ý cho một hoạt động, xếp theo môn và nội dung bài. */
export function goiYCachLam(hd: HoatDongTrienKhai, mon: string | null, vanBan: string[], soTiet: number | null): GoiYHinhThuc[] {
  if (hd.loai === "luyen_tap") return goiYHinhThucHd2(mon, vanBan);
  if (hd.loai === "van_dung") return goiYHinhThucHd3(mon, vanBan, soTiet);
  const vb = chuan(vanBan.join(" \n "));
  return (CACH_LAM[hd.loai] ?? [])
    .map((c) => {
      const lyDo: string[] = [];
      let diem = 1;
      if (mon && c.mon?.includes(mon)) { diem += 3; lyDo.push("Hợp đặc trưng môn"); }
      const khop = (c.tu ?? []).filter((t) => vb.includes(chuan(t)));
      if (khop.length) { diem += 2; lyDo.push(`Nội dung bài: ${khop.slice(0, 2).join(", ")}`); }
      return { ten: c.ten, diem, lyDo, dienBien: c.moTa };
    })
    .sort((a, b) => b.diem - a.diem)
    .slice(0, 3);
}

/** Hành vi số gợi ý theo năng lực thành phần (không nêu tên nền tảng). */
export const HANH_VI_SO: Record<string, string> = {
  "1.1": "tìm kiếm thông tin về nội dung bài bằng từ khóa phù hợp, ghi lại nguồn",
  "1.2": "đối chiếu hai nguồn thông tin, đánh giá độ tin cậy của từng nguồn",
  "1.3": "lưu, sắp xếp kết quả của nhóm vào thư mục hoặc bảng tính dùng chung",
  "2.1": "trao đổi, phân công nhiệm vụ trong nhóm qua công cụ trực tuyến",
  "2.2": "chia sẻ sản phẩm với lớp, ghi rõ nguồn tham khảo",
  "2.3": "tìm hiểu, sử dụng dịch vụ số công liên quan đến nội dung bài",
  "2.4": "cùng soạn sản phẩm nhóm trên tài liệu dùng chung",
  "2.5": "góp ý sản phẩm của bạn trên môi trường số theo quy tắc ứng xử",
  "2.6": "dùng tài khoản học tập đúng cách, bảo vệ danh tính khi nộp sản phẩm",
  "3.1": "tạo sản phẩm số (trang trình chiếu, sơ đồ) trình bày kết quả",
  "3.2": "chỉnh sửa, kết hợp tư liệu số đã có thành sản phẩm mới",
  "3.3": "ghi nguồn, giấy phép của tư liệu số sử dụng trong sản phẩm",
  "3.4": "viết và chạy chương trình để giải quyết nhiệm vụ",
  "4.1": "nhận diện rủi ro khi dùng thiết bị, áp dụng biện pháp an toàn",
  "4.2": "bảo vệ dữ liệu cá nhân khi đăng tải sản phẩm",
  "4.3": "sử dụng thiết bị số hợp lí, bảo vệ sức khỏe",
  "4.4": "nêu tác động của thiết bị số đến môi trường liên quan đến bài",
  "5.1": "tự xử lí sự cố kĩ thuật đơn giản khi dùng công cụ số",
  "5.2": "dùng công cụ số (phần mềm) để giải quyết nhiệm vụ của bài",
  "5.3": "dùng phần mềm vẽ, mô phỏng để khám phá kiến thức",
  "5.4": "tự đánh giá kĩ năng số của bản thân qua nhiệm vụ",
  "6.1": "nhận xét giới hạn của công cụ AI khi giải nhiệm vụ của bài",
  "6.2": "dùng AI gợi ý có trách nhiệm, ghi lại câu lệnh đã dùng",
  "6.3": "kiểm chứng kết quả AI trả về bằng SGK, tư liệu",
};

/** Hoạt động hợp với từng nhóm năng lực thành phần. */
const LOAI_HOP_MIEN: Record<string, (LoaiHoatDongCu | "tu_hoc")[]> = {
  "1": ["tu_hoc", "hinh_thanh", "van_dung"], "2": ["van_dung", "hinh_thanh"], "3": ["van_dung"],
  "4": ["hinh_thanh", "van_dung"], "5": ["luyen_tap", "van_dung", "hinh_thanh"], "6": ["van_dung"],
};

export type TichHop = { loai: "nls" | "ai" | "tieng_anh"; nhan: string; noiDung: string };

/** Phần tích hợp gợi ý đặt vào từng hoạt động theo chức năng GV chọn. */
export function goiYTichHop(ds: HoatDongTrienKhai[], lc: LuaChon): Record<string, TichHop[]> {
  const kq: Record<string, TichHop[]> = Object.fromEntries(ds.map((h) => [h.ma, []]));
  const chonHd = (uuTien: (LoaiHoatDongCu | "tu_hoc")[]) => uuTien.map((l) => ds.find((h) => h.loai === l)).find(Boolean) ?? ds[ds.length - 1];
  if (lc.nls) {
    for (const ma of lc.maNls) {
      const tp = ma.split(".").slice(0, 2).join(".");
      const hd = chonHd(LOAI_HOP_MIEN[ma[0]] ?? ["van_dung"]);
      if (hd) kq[hd.ma].push({ loai: "nls", nhan: ma, noiDung: `Mỗi HS ${HANH_VI_SO[tp] ?? "thực hiện nhiệm vụ số của bài"}; lưu sản phẩm làm minh chứng.` });
    }
  }
  if (lc.ai) {
    const hd = chonHd(["van_dung", "hinh_thanh"]);
    if (hd) kq[hd.ma].push({ loai: "ai", nhan: "Năng lực AI", noiDung: "HS tự làm trước, dùng AI để xin gợi ý, đối chiếu với SGK/tư liệu rồi diễn đạt lại; ghi phiếu kiểm chứng." });
  }
  if (lc.tiengAnh) {
    const hd = chonHd(["van_dung", "luyen_tap", "hinh_thanh"]);
    if (hd) kq[hd.ma].push({ loai: "tieng_anh", nhan: "Tiếng Anh", noiDung: "Nên chọn hoạt động này để dịch ở phụ lục tiếng Anh: thể hiện rõ nhất đặc trưng của bài (khung khuyên thường là hoạt động vận dụng)." });
  }
  return kq;
}

/** Văn bản giáo án dùng cho gợi ý (tên bài, mục tiêu, hoạt động, câu hỏi, thiết bị). */
export function vanBanBai(pt: PhanTichGiaoAn, tt: ThongTinBai): string[] {
  return [tt.tenBai ?? "", ...pt.doan.filter((d) => ["HD", "CH", "TB", "MT"].includes(d.loai)).map((d) => d.vanBan)];
}
