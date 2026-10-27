/**
 * Câu chữ cố định của khung (docs/khung_khbd.docx), chép nguyên văn phần không có ngoặc [ ].
 * Phần trong ngoặc là chỗ GV/LLM điền, không bao giờ đưa ra file.
 */

export const HD1_MUC_TIEU = "Khơi gợi hứng thú, kết nối kiến thức tự học với tình huống thực tế, đồng thời sửa các lỗi học sinh mắc phải khi làm bài ở nhà.";
export const HD1_SAN_PHAM = "Câu trả lời có lí giải; mỗi HS ghi lại ít nhất 01 lỗi đã sửa.";

export const hd2Buoc = (phut: [number, number, number, number]) => [
  `Giao nhiệm vụ (${phut[0]} phút): GV nêu nhiệm vụ, chia nhóm/phân vai theo mức đạt (Nắm tốt / Cần củng cố / Cần hỗ trợ), nêu rõ sản phẩm và tiêu chí.`,
  `Thực hiện nhiệm vụ (${phut[1]} phút): GV quan sát, hỗ trợ trực tiếp nhóm Cần hỗ trợ, giao nhiệm vụ mở rộng cho nhóm Nắm tốt.`,
  `Báo cáo, thảo luận (${phut[2]} phút): tập trung vào các lỗi hiểu hay gặp.`,
  `Kết luận, nhận định (${phut[3]} phút): GV chỉnh các lỗi còn lại; HS ghi lại lỗi đã sửa.`,
];
export const HD2_SAN_PHAM = "HS ghi lại nguyên nhân của ít nhất 01 lỗi đã sửa.";

export const QUY_TRINH_AI = [
  "HS tự làm trước phần cốt lõi, chưa dùng AI.",
  "Nhập câu lệnh xin gợi ý, không yêu cầu AI làm thay.",
  "Không nhập tên, hình ảnh, tài khoản, vị trí hoặc dữ liệu cá nhân.",
  "Lưu câu lệnh và gợi ý; đối chiếu với SGK, tư liệu gốc, số liệu chính thống hoặc kết quả thí nghiệm/thao tác trên Phiếu kiểm chứng phản hồi AI, ghi rõ giữ lại, sửa hoặc loại bỏ kèm lí do.",
  "Tự diễn đạt lại; sản phẩm ghi “Có sử dụng AI hỗ trợ”.",
];
export const AI_KHONG_DAT = "Không đạt nếu sao chép nguyên phản hồi AI, thiếu căn cứ hoặc chứa dữ liệu cá nhân.";

export const HD4_EXIT = "HS làm nhanh 3–5 câu theo dạng câu hỏi của môn trên hệ thống và ghi 1 điều đã nắm vững, 1 nội dung còn vướng mắc.";

export const gd1NhiemVu = (nenTang: string) => [
  nenTang
    ? `Đăng nhập ${nenTang}, đọc phần tóm tắt lí thuyết trên cơ sở SGK.`
    : "Đọc phần tóm tắt lí thuyết trên cơ sở SGK.",
  "Hoàn thành các câu hỏi Lý thuyết – Cơ bản – Nâng cao theo yêu cầu của hệ thống.",
  "Ghi lại 01 câu hỏi hoặc nội dung chưa hiểu để GV khai thác ở HĐ I.",
];
export const gd1CongViecGv = (nenTang: string) =>
  `Đọc bảng kết quả${nenTang ? ` trên ${nenTang}` : ""}: tỉ lệ hoàn thành, điểm trung bình, câu sai hoặc bỏ qua nhiều nhất ở từng mức, nhận xét của hệ thống (nếu có) và câu hỏi HS đã đặt; xác định 1–3 lỗi cốt lõi để chuẩn bị chỉnh lỗi ở HĐ I; chia nhóm theo mức đạt: Nắm tốt (đạt cả mức Nâng cao) / Cần củng cố (đạt Lý thuyết – Cơ bản) / Cần hỗ trợ (chưa đạt Lý thuyết) để phân hóa câu hỏi ở HĐ II.`;

export const GD3 = [
  "GV tổng hợp Exit ticket và kết quả trên hệ thống, đối chiếu với kết quả câu hỏi Lý thuyết – Cơ bản – Nâng cao ở Giai đoạn 1; lỗi còn lại dùng cho phần chỉnh lỗi của bài sau.",
];
export const GD3_NHIEU_TIET = "Bài nhiều tiết: Sau mỗi tiết giữa chừng, GV xem kết quả trên hệ thống và sản phẩm trung gian để điều chỉnh nhóm, nhiệm vụ, thời lượng của tiết sau; đánh giá cá nhân dựa trên phần việc ghi nhận trong nhóm.";

/** Năng lực chung theo khung (mục I.2), dùng khi giáo án của GV chưa ghi năng lực chung. */
export const NL_CHUNG_TU_HOC = "Tự chủ và tự học trong tìm tòi, khám phá tại nhà;";
export const NL_CHUNG_HOP_TAC = "Giao tiếp và hợp tác trong trình bày, thảo luận nhóm trên lớp;";
export const NL_CHUNG_GQVD = "Giải quyết vấn đề và sáng tạo khi giải quyết nhiệm vụ vận dụng ở HĐ III.";

/** Mục tiêu, sản phẩm của Giai đoạn 1 và HĐ IV (khung không ghi riêng; tóm từ nhiệm vụ của khung). */
export const GD1_MUC_TIEU = "HS tự học kiến thức nền của bài trước tiết học; GV nắm mức đạt của từng HS để tổ chức HĐ I, HĐ II.";
export const GD1_SAN_PHAM = "Kết quả câu hỏi Lý thuyết – Cơ bản – Nâng cao trên hệ thống; 01 câu hỏi hoặc nội dung HS chưa hiểu.";
export const HD4_MUC_TIEU = "Kiểm tra nhanh mức độ nắm kiến thức trọng tâm; HS phản tư việc học và nhận nhiệm vụ cho bài mới.";
export const HD4_SAN_PHAM = "Kết quả exit ticket; mỗi HS ghi 1 điều đã nắm vững, 1 nội dung còn vướng mắc.";

export const CLIL = "GV sử dụng tiếng Việt là chính, chỉ xen kẽ các key words/cụm thuật ngữ tiếng Anh cần thiết của từng hoạt động; HS nhận biết, đọc và dùng các key words đó khi thao tác, ghi phiếu hoặc báo cáo ngắn; không yêu cầu nói câu tiếng Anh hoàn chỉnh.";

export const BANG_DANH_GIA = [
  ["Tiêu chí", "Đạt", "Cần hoàn thiện"],
  ["Mức độ đáp ứng yêu cầu cần đạt", "Hoàn thành đầy đủ nhiệm vụ", "Còn thiếu một phần nhiệm vụ"],
  ["Độ chính xác của kiến thức, kĩ năng", "Kết quả đúng và giải thích rõ", "Còn nhầm lẫn hoặc thực hiện sai"],
  ["Chất lượng sản phẩm và minh chứng", "Sản phẩm rõ ràng, có kiểm tra", "Sản phẩm chưa hoàn thiện"],
];
export const DONG_DANH_GIA_NHOM = ["Hợp tác và đóng góp cá nhân (bài nhiều tiết, làm nhóm)", "Hoàn thành phần việc được giao, có ghi nhận", "Phần việc chưa rõ hoặc chưa hoàn thành"];
export const DONG_DANH_GIA_AI = ["Sử dụng AI minh bạch, có kiểm chứng", "Có đối chiếu và ghi nhận cách dùng", "Chấp nhận gợi ý AI mà chưa kiểm tra"];

export const PHIEU_KIEM_CHUNG_AI = [
  ["Gợi ý của AI", "Nguồn/thao tác đối chiếu", "Quyết định", "Lí do"],
  ["Gợi ý/đầu ra AI được HS ghi lại", "SGK, tư liệu gốc, số liệu chính thống, kết quả thí nghiệm hoặc thao tác", "Chấp nhận / Bác bỏ / Điều chỉnh", "HS tự giải thích bằng lời của mình"],
  ["", "SGK, tư liệu gốc, số liệu chính thống, kết quả thí nghiệm hoặc thao tác", "Chấp nhận / Bác bỏ / Điều chỉnh", ""],
];

export const MA_TRAN_TIEU_DE = ["Nhóm năng lực", "Mã/thành phần", "Biểu hiện trong bài học", "Vị trí", "Minh chứng/sản phẩm"];

export const THUAT_NGU = [
  ["Tiếng Việt", "English"],
  ["Kế hoạch bài dạy", "Lesson plan"],
  ["Giai đoạn 1: Tự học ở nhà trước tiết học", "Stage 1: Self-study at home before class"],
  ["Giai đoạn 2: Hoạt động trên lớp", "Stage 2: In-class activities"],
  ["Giai đoạn 3: Kiểm soát, đánh giá và điều chỉnh sau giờ học", "Stage 3: Monitoring, assessment and adjustment after class"],
  ["HĐ I. Khởi động & chỉnh lỗi", "Activity I. Warm-up & error correction"],
  ["HĐ II. Luyện tập phân hóa", "Activity II. Differentiated practice"],
  ["HĐ III. Vận dụng thực tế", "Activity III. Real-world application"],
  ["HĐ IV. Đánh giá, phản tư và hướng dẫn bài mới", "Activity IV. Assessment, reflection and preparation for the next lesson"],
  ["Mục tiêu / Tổ chức / Sản phẩm – đánh giá", "Objectives / Organisation / Products – Assessment"],
  ["Tiêu chí / Minh chứng", "Criteria / Evidence"],
  ["Tình huống mở đầu", "Opening situation"],
  ["Lý thuyết – Cơ bản – Nâng cao", "Theory – Basic – Advanced"],
  ["Nhận biết – Thông hiểu – Vận dụng", "Recognition – Comprehension – Application"],
  ["Nắm tốt / Cần củng cố / Cần hỗ trợ", "Proficient / Needs consolidation / Needs support"],
  ["Trắc nghiệm nhiều lựa chọn / đúng sai / trả lời ngắn", "Multiple-choice / true-false / short-answer questions"],
  ["Năng lực chung / Năng lực đặc thù", "General competences / Subject-specific competences"],
  ["Năng lực số / Năng lực AI", "Digital competence / AI competence"],
  ["Phẩm chất", "Qualities"],
  ["Phiếu kiểm chứng phản hồi AI", "AI Output Verification Sheet"],
  ["Exit ticket / Phản tư", "Exit ticket / Reflection"],
];

export const TEN_HD: Record<string, string> = {
  HD1: "HĐ I. KHỞI ĐỘNG & CHỈNH LỖI",
  HD2: "HĐ II. LUYỆN TẬP PHÂN HÓA",
  HD3: "HĐ III. VẬN DỤNG THỰC TẾ",
  HD4: "HĐ IV. ĐÁNH GIÁ, PHẢN TƯ VÀ HƯỚNG DẪN BÀI MỚI",
};
