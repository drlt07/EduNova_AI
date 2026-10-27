import type { KeHoach } from "../3-ke-hoach";
import { coClil, coDichTiengAnh, type LuaChon } from "../2-lua-chon/lua-chon";

/** Một lượt gọi LLM nhỏ, đúng phạm vi được viết. */
export type Luot = { ma: string; ten: string; moTa: string };

/** Hình thức có luyện tập bằng câu hỏi (cần sinh bộ câu hỏi và kiểm định đáp án). */
export function dungCauHoi(lc: LuaChon): boolean {
  if (lc.chuyenKhung && !lc.taoLaiHoatDong) return true;
  return lc.hinhThucHD2.some((h) => /nền tảng số|trò chơi|trạm|câu hỏi|trắc nghiệm|luyện tập/i.test(h));
}

/**
 * Danh sách lượt soạn theo đúng việc GV chọn; phần không chọn thì không có lượt.
 * soHinh: số ảnh trong giáo án gốc; có ảnh thì đọc hình trước để các lượt sau hiểu đủ nội dung.
 */
export function lapDanhSachLuot(kh: KeHoach, lc: LuaChon, soHinh = 0, hoatDong: { ma: string; ten: string; cha?: string }[] = []): Luot[] {
  const ds: Luot[] = [];
  const them = (ma: string, ten: string, moTa: string) => ds.push({ ma, ten, moTa });
  const soTiet = kh.thoiLuong?.length ?? 1;

  // Giữ bố cục gốc: hoạt động GV đã chọn cách triển khai thì soạn lại theo cách đó (hoạt động con theo hoạt động cha).
  if (!lc.chuyenKhung) {
    for (const h of hoatDong) {
      if (!lc.trienKhai[h.ma]?.trim() || (h.cha && lc.trienKhai[h.cha]?.trim())) continue;
      ds.push({ ma: `tk_${h.ma}`, ten: `Soạn lại: ${h.ten}`, moTa: "Theo cách tổ chức đã chọn; câu hỏi, ví dụ, tư liệu của thầy/cô giữ nguyên văn." });
    }
  }
  if (soHinh > 0) them("doc_hinh", `Đọc ${soHinh} hình trong giáo án`, "Đọc bảng biến thiên, đồ thị, công thức, bảng chụp ảnh; app tính lại và chỉ tạo lại hình khớp với bản gốc.");

  if (lc.chuyenKhung) {
    them("gd1", "Giai đoạn 1: nhiệm vụ tự học", "Nhiệm vụ HS ở nhà, gói tự học, câu hỏi Lý thuyết – Cơ bản – Nâng cao có đáp án.");
    them("hd1", "HĐ I: tình huống mở đầu, nhận định chỉnh lỗi", "Dùng lại tình huống của thầy/cô; soạn 2–3 nhận định ứng với lỗi hay gặp.");
  }
  if (lc.chuyenKhung || lc.taoLaiHoatDong) {
    const ht2 = lc.hinhThucHD2.length ? ` (${lc.hinhThucHD2.join(", ")})` : "";
    const ht3 = lc.hinhThucHD3.length ? ` (${lc.hinhThucHD3.join(", ")})` : "";
    them("hd2", `HĐ II: tổ chức luyện tập phân hóa${ht2}`, `4 bước, 3 nhóm Nắm tốt / Cần củng cố / Cần hỗ trợ${soTiet > 1 ? `, chia theo ${soTiet} tiết` : ""}.`);
    if (dungCauHoi(lc)) {
      them("cau_hoi", "Bộ câu hỏi luyện tập HĐ II", "Số câu, dạng câu, mức độ do app tính theo môn; mỗi phương án sai ứng với một lỗi hiểu.");
    }
    them("hd3", `HĐ III: nhiệm vụ vận dụng${ht3}`, "Giải trọn tình huống mở đầu; dùng lại tư liệu, câu hỏi của thầy/cô.");
    them("hd4", "HĐ IV: exit ticket, chốt kiến thức", "Câu kiểm tra nhanh không trùng câu luyện tập.");
    them("dac_thu", "Năng lực đặc thù: thể hiện ở hoạt động", "Tên thành phần chép từ dữ liệu; chỉ viết phần “Thể hiện ở HĐ …”.");
  }
  if (lc.chuyenKhung) {
    them("gd3", "Giai đoạn 3 và phụ lục đánh giá sản phẩm", "Câu chữ cố định của khung, app tự điền.");
  }
  if (lc.nls && lc.maNls.length) them("nls", `Năng lực số: ${lc.maNls.join(", ")}`, "Hành vi, minh chứng, tiêu chí; nguyên văn chỉ báo do app chép.");
  if (lc.ai) them("ai", `Năng lực AI: ${lc.maAi.length ? lc.maAi.join(", ") : "theo khung"}`, "Quy trình dùng AI có kiểm chứng, câu lệnh mẫu, phiếu kiểm chứng.");
  if (lc.lhdn) them("lhdn", "Tích hợp LHĐN", "Theo luật trong rules/lhdn.md.");
  if (ds.some((l) => l.ma === "cau_hoi")) them("kiem_dinh", "Kiểm định đáp án", "Giải lại đề đã xóa đáp án, so sánh, soạn lại câu lệch.");
  // Tiếng Anh xử lí sau cùng, trên hoạt động đã có (sau khi chuyển khung và tích hợp năng lực).
  if (coClil(lc)) them("clil", "Tiếng Anh (CLIL) trong hoạt động đã chọn", "Key words và nhiệm vụ dùng tiếng Anh; chỉ thêm vào một hoạt động.");
  if (coDichTiengAnh(lc)) them("tieng_anh", "Phụ lục tiếng Anh", "Dịch đúng hoạt động đã chọn; giữ nguyên mã năng lực, tên riêng.");
  return ds;
}
