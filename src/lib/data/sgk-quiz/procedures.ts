/**
 * Câu thao tác mô phỏng cho các bài thực hành: một cửa sổ giả lập, học sinh bấm đúng chỗ theo từng bước
 * (ví dụ kiểm tra lỗi ổ đĩa, dọn dẹp ổ đĩa, gửi thư có đính kèm, chia sẻ thư mục). Giao diện mô phỏng, không phải ảnh chụp phần mềm thật.
 */
export interface ProcItem { id: string; label: string; icon?: string; sub?: string; why?: string }
export interface ProcStep { ask: string; title: string; path?: string; layout: "desktop" | "list" | "menu" | "tabs" | "dialog"; items: ProcItem[]; correct: string; done: string }
export interface Procedure { id: string; ref: string; prompt: string; app: string; steps: ProcStep[]; explanation: string }

const DESKTOP: ProcItem[] = [
  { id: "thispc", label: "This PC", icon: "🖥️" },
  { id: "trash", label: "Thùng rác", icon: "🗑️", why: "Thùng rác chứa tệp đã xoá, không có công cụ ổ đĩa." },
  { id: "browser", label: "Trình duyệt", icon: "🌐", why: "Trình duyệt dùng để vào web." },
  { id: "docs", label: "Tài liệu", icon: "📁", why: "Đây là một thư mục, không phải ổ đĩa." },
];
const DRIVES: ProcItem[] = [
  { id: "c", label: "Ổ C: (Windows)", icon: "💽", sub: "còn trống 9 GB / 120 GB" },
  { id: "d", label: "Ổ D: (Dữ liệu)", icon: "💽", sub: "còn trống 300 GB / 500 GB", why: "Ổ D còn trống nhiều; ổ cần xử lí là ổ C." },
  { id: "e", label: "USB E:", icon: "🔌", sub: "còn trống 6 GB / 16 GB", why: "Đây là USB, không phải ổ hệ thống." },
];
const CONTEXT: ProcItem[] = [
  { id: "open", label: "Mở", why: "Mở chỉ xem các thư mục bên trong ổ." },
  { id: "format", label: "Định dạng (Format)…", why: "Định dạng sẽ XOÁ TOÀN BỘ dữ liệu trên ổ!" },
  { id: "rename", label: "Đổi tên", why: "Đổi tên ổ không kiểm tra hay dọn dẹp gì." },
  { id: "props", label: "Thuộc tính (Properties)" },
];

export const PROCEDURES: Procedure[] = [
  {
    id: "proc-11-2-check", ref: "11-2", app: "Windows", prompt: "Máy báo ổ C: có thể bị lỗi. Hãy dùng công cụ của hệ điều hành để kiểm tra lỗi trên ổ C:",
    explanation: "This PC → chuột phải ổ C: → Thuộc tính → thẻ Công cụ → Kiểm tra → Quét ổ đĩa.",
    steps: [
      { ask: "Mở nơi hiển thị các ổ đĩa của máy.", title: "Màn hình nền", layout: "desktop", items: DESKTOP, correct: "thispc", done: "Mở This PC: thấy danh sách ổ đĩa." },
      { ask: "Nhấp chuột phải vào ổ cần kiểm tra.", title: "This PC", path: "This PC", layout: "list", items: DRIVES, correct: "c", done: "Hiện menu chuột phải của ổ C:" },
      { ask: "Chọn mục để mở các thông tin và công cụ của ổ.", title: "Menu chuột phải – Ổ C:", layout: "menu", items: CONTEXT, correct: "props", done: "Mở hộp thoại Thuộc tính của ổ C:" },
      { ask: "Chuyển sang thẻ chứa công cụ kiểm tra lỗi.", title: "Thuộc tính – Ổ C:", layout: "tabs", items: [{ id: "general", label: "Chung", why: "Thẻ Chung hiện dung lượng và Dọn dẹp ổ đĩa." }, { id: "tools", label: "Công cụ" }, { id: "hardware", label: "Phần cứng", why: "Thẻ này liệt kê thiết bị." }, { id: "sharing", label: "Chia sẻ", why: "Thẻ này để chia sẻ qua mạng." }], correct: "tools", done: "Thẻ Công cụ: Kiểm tra lỗi và Tối ưu hoá ổ." },
      { ask: "Chọn công cụ kiểm tra lỗi hệ thống tệp.", title: "Thuộc tính – Công cụ", layout: "dialog", items: [{ id: "check", label: "Kiểm tra", sub: "Kiểm tra ổ đĩa để tìm lỗi hệ thống tệp" }, { id: "optimize", label: "Tối ưu hoá", sub: "Tối ưu hoá và chống phân mảnh ổ", why: "Tối ưu hoá sắp xếp lại dữ liệu, không tìm lỗi." }], correct: "check", done: "Hộp thoại Kiểm tra lỗi hiện ra." },
      { ask: "Bắt đầu quét ổ đĩa.", title: "Kiểm tra lỗi (Ổ C:)", layout: "dialog", items: [{ id: "scan", label: "Quét ổ đĩa" }, { id: "cancel", label: "Huỷ", why: "Huỷ sẽ đóng hộp thoại mà không kiểm tra." }], correct: "scan", done: "Windows quét xong: không tìm thấy lỗi trên ổ C:" },
    ],
  },
  {
    id: "proc-11-2-clean", ref: "11-2", app: "Windows", prompt: "Ổ C: gần đầy (còn 9 GB). Dọn tệp tạm và Thùng rác để giải phóng dung lượng mà không xoá tài liệu.",
    explanation: "This PC → chuột phải ổ C: → Thuộc tính → thẻ Chung → Dọn dẹp ổ đĩa → chọn Tệp tạm thời, Thùng rác → OK.",
    steps: [
      { ask: "Mở nơi hiển thị các ổ đĩa.", title: "Màn hình nền", layout: "desktop", items: DESKTOP, correct: "thispc", done: "Mở This PC." },
      { ask: "Ổ nào đang gần đầy? Nhấp chuột phải vào ổ đó.", title: "This PC", path: "This PC", layout: "list", items: DRIVES, correct: "c", done: "Menu chuột phải của ổ C:" },
      { ask: "Mở thông tin của ổ.", title: "Menu chuột phải – Ổ C:", layout: "menu", items: CONTEXT, correct: "props", done: "Hộp thoại Thuộc tính, thẻ Chung." },
      { ask: "Bấm công cụ dọn dẹp ổ đĩa.", title: "Thuộc tính – Chung", layout: "dialog", items: [{ id: "cleanup", label: "Dọn dẹp ổ đĩa", sub: "Dung lượng: 111 GB đã dùng / 120 GB" }, { id: "compress", label: "Nén ổ đĩa để tiết kiệm dung lượng", why: "Nén làm máy chậm hơn, không xoá tệp rác." }], correct: "cleanup", done: "Danh sách loại tệp có thể xoá." },
      { ask: "Chọn loại tệp nên xoá (không đụng tới tài liệu).", title: "Dọn dẹp ổ đĩa (C:)", layout: "list", items: [{ id: "temp", label: "Tệp tạm thời + Thùng rác", icon: "🧹", sub: "3,2 GB" }, { id: "docsdel", label: "Thư mục Tài liệu", icon: "📁", sub: "12 GB", why: "Tài liệu là dữ liệu của em, không phải tệp rác!" }, { id: "system", label: "Tệp hệ điều hành", icon: "⚙️", why: "Xoá tệp hệ thống có thể làm máy không khởi động được." }], correct: "temp", done: "Đã chọn tệp tạm thời và Thùng rác." },
      { ask: "Xác nhận dọn dẹp.", title: "Dọn dẹp ổ đĩa (C:)", layout: "dialog", items: [{ id: "ok", label: "OK – Xoá tệp" }, { id: "cancel", label: "Huỷ", why: "Huỷ thì chưa dọn gì." }], correct: "ok", done: "Đã giải phóng 3,2 GB. Ổ C: còn trống 12,2 GB." },
    ],
  },
  {
    id: "proc-10-10", ref: "10-10", app: "Trình duyệt", prompt: "Tìm và tải về tài liệu ôn tập câu lệnh if từ một nguồn tin cậy, lưu vào thư mục học tập.",
    explanation: "Dùng từ khoá cụ thể, chọn nguồn .edu.vn, tải tệp PDF (không tải tệp .exe lạ), lưu vào thư mục của em.",
    steps: [
      { ask: "Bắt đầu tìm kiếm.", title: "Trình duyệt – Thẻ mới", layout: "desktop", items: [{ id: "search", label: "Ô tìm kiếm", icon: "🔎" }, { id: "ad", label: "Tải game miễn phí!", icon: "🎮", why: "Đây là quảng cáo." }, { id: "news", label: "Tin giải trí", icon: "📰", why: "Không liên quan tới việc cần tìm." }], correct: "search", done: "Con trỏ ở ô tìm kiếm." },
      { ask: "Chọn từ khoá hiệu quả nhất.", title: "Gợi ý tìm kiếm", layout: "menu", items: [{ id: "k1", label: "tài liệu", why: "Quá chung chung." }, { id: "k2", label: "câu lệnh if python site:edu.vn" }, { id: "k3", label: "giúp em với", why: "Không có từ khoá nội dung." }], correct: "k2", done: "Hiện kết quả từ các trang .edu.vn." },
      { ask: "Chọn kết quả đáng tin cậy.", title: "Kết quả tìm kiếm", layout: "list", items: [{ id: "r1", label: "[Quảng cáo] Tải ngay bộ đề VIP", icon: "📢", why: "Kết quả quảng cáo, không rõ nguồn." }, { id: "r2", label: "Câu lệnh if – Tổ Tin học, THPT …(.edu.vn)", icon: "🏫" }, { id: "r3", label: "Diễn đàn ẩn danh: đáp án hết", icon: "💬", why: "Không rõ tác giả, dễ sai." }], correct: "r2", done: "Mở trang của trường." },
      { ask: "Tải tệp tài liệu về.", title: "Trang Tổ Tin học", layout: "dialog", items: [{ id: "pdf", label: "Tải on-tap-if.pdf", sub: "PDF, 420 KB" }, { id: "exe", label: "Tải trình tải nhanh (.exe)", sub: "Ứng dụng", why: "Tệp .exe lạ có thể chứa mã độc." }], correct: "pdf", done: "Hộp thoại lưu tệp hiện ra." },
      { ask: "Lưu vào đúng nơi.", title: "Lưu tệp", layout: "list", items: [{ id: "tin10", label: "Tài liệu > Tin10", icon: "📁" }, { id: "desktop", label: "Màn hình nền (để lẫn với tệp khác)", icon: "🖥️", why: "Nên lưu vào thư mục học tập để dễ tìm." }], correct: "tin10", done: "Đã lưu on-tap-if.pdf vào Tài liệu > Tin10." },
    ],
  },
  {
    id: "proc-10-13", ref: "10-13", app: "Inkscape", prompt: "Vẽ một hình chữ nhật tô màu xanh dương rồi nhân bản nó.",
    explanation: "Chọn công cụ hình chữ nhật, kéo để vẽ, mở Fill and Stroke → thẻ Fill → chọn màu, rồi Ctrl + D để nhân bản.",
    steps: [
      { ask: "Chọn công cụ vẽ hình chữ nhật.", title: "Inkscape – Hộp công cụ", layout: "desktop", items: [{ id: "select", label: "Chọn", icon: "↖️", why: "Công cụ chọn không vẽ hình." }, { id: "rect", label: "Hình chữ nhật", icon: "▭" }, { id: "ellipse", label: "Elip", icon: "◯", why: "Công cụ này vẽ hình tròn, elip." }, { id: "text", label: "Văn bản", icon: "A", why: "Dùng để viết chữ." }], correct: "rect", done: "Con trỏ đổi thành dấu cộng." },
      { ask: "Vẽ hình lên trang.", title: "Trang vẽ", layout: "dialog", items: [{ id: "drag", label: "Kéo chuột trên trang vẽ" }, { id: "dbl", label: "Nháy đúp vào thước kẻ", why: "Thao tác này không vẽ hình." }], correct: "drag", done: "Đã có một hình chữ nhật." },
      { ask: "Mở bảng chỉnh màu tô và viền.", title: "Menu Đối tượng", layout: "menu", items: [{ id: "fill", label: "Tô và viền (Fill and Stroke)…" }, { id: "align", label: "Căn chỉnh…", why: "Căn chỉnh không đổi màu." }, { id: "layers", label: "Lớp…", why: "Quản lí lớp, không đổi màu." }], correct: "fill", done: "Bảng Fill and Stroke mở ra." },
      { ask: "Chọn thẻ đổi màu bên trong hình.", title: "Fill and Stroke", layout: "tabs", items: [{ id: "tfill", label: "Tô (Fill)" }, { id: "tstroke", label: "Viền (Stroke paint)", why: "Thẻ này đổi màu đường viền." }, { id: "tstyle", label: "Kiểu viền", why: "Thẻ này đổi độ dày, nét viền." }], correct: "tfill", done: "Bảng màu tô hiện ra." },
      { ask: "Chọn màu xanh dương.", title: "Bảng màu", layout: "dialog", items: [{ id: "red", label: "Đỏ", why: "Cần màu xanh dương." }, { id: "blue", label: "Xanh dương" }, { id: "yellow", label: "Vàng", why: "Cần màu xanh dương." }], correct: "blue", done: "Hình chữ nhật đã tô xanh dương." },
      { ask: "Nhân bản hình bằng phím tắt.", title: "Phím tắt", layout: "menu", items: [{ id: "ctrld", label: "Ctrl + D" }, { id: "ctrls", label: "Ctrl + S", why: "Ctrl + S để lưu tệp." }, { id: "ctrlz", label: "Ctrl + Z", why: "Ctrl + Z để hoàn tác." }], correct: "ctrld", done: "Đã có bản sao nằm đè đúng vị trí, kéo ra để thấy." },
    ],
  },
  {
    id: "proc-11-7", ref: "11-7", app: "Trình duyệt", prompt: "Tìm tài liệu PDF mới trong năm qua về an toàn thông tin cho học sinh.",
    explanation: "Dùng filetype:pdf trong từ khoá rồi lọc theo thời gian “Năm qua”.",
    steps: [
      { ask: "Chọn câu tìm kiếm phù hợp nhất.", title: "Ô tìm kiếm", layout: "menu", items: [{ id: "q1", label: "an toàn", why: "Quá chung." }, { id: "q2", label: "\"an toàn thông tin\" học sinh filetype:pdf" }, { id: "q3", label: "pdf", why: "Không có nội dung cần tìm." }], correct: "q2", done: "Kết quả chỉ gồm tệp PDF có cụm “an toàn thông tin”." },
      { ask: "Mở bộ lọc kết quả.", title: "Kết quả tìm kiếm", layout: "tabs", items: [{ id: "all", label: "Tất cả", why: "Đang ở thẻ này rồi." }, { id: "images", label: "Hình ảnh", why: "Cần tài liệu, không phải ảnh." }, { id: "tools", label: "Công cụ" }], correct: "tools", done: "Hiện bộ lọc Thời gian." },
      { ask: "Chỉ lấy tài liệu mới trong năm qua.", title: "Công cụ – Thời gian", layout: "menu", items: [{ id: "any", label: "Mọi lúc", why: "Sẽ có cả tài liệu rất cũ." }, { id: "year", label: "Năm qua" }, { id: "hour", label: "Giờ qua", why: "Quá hẹp, gần như không có kết quả." }], correct: "year", done: "Kết quả là các tệp PDF trong 12 tháng gần đây." },
    ],
  },
  {
    id: "proc-11-8", ref: "11-8", app: "Thư điện tử", prompt: "Gửi bài tập (tệp bai-tap.docx) cho cô giáo, đồng thời gửi bản sao ẩn cho bạn cùng nhóm.",
    explanation: "Soạn thư → Tới: cô giáo → BCC: bạn cùng nhóm → Đính kèm tệp → Gửi.",
    steps: [
      { ask: "Bắt đầu viết thư mới.", title: "Hộp thư", layout: "desktop", items: [{ id: "compose", label: "Soạn thư", icon: "✏️" }, { id: "inbox", label: "Hộp thư đến", icon: "📥", why: "Đây là thư đã nhận." }, { id: "spam", label: "Thư rác", icon: "🚫", why: "Không liên quan." }], correct: "compose", done: "Cửa sổ thư mới." },
      { ask: "Ô nào nhập địa chỉ cô giáo (người nhận chính)?", title: "Thư mới", layout: "list", items: [{ id: "to", label: "Tới", icon: "👩‍🏫" }, { id: "cc", label: "CC", icon: "👥", why: "CC là gửi bản sao công khai." }, { id: "subject", label: "Tiêu đề", icon: "🏷️", why: "Tiêu đề không phải nơi ghi địa chỉ." }], correct: "to", done: "Tới: co.lan@truong.edu.vn." },
      { ask: "Thêm bạn cùng nhóm sao cho cô và các bạn không thấy địa chỉ của nhau.", title: "Thư mới", layout: "list", items: [{ id: "cc2", label: "CC", icon: "👥", why: "CC hiện địa chỉ cho mọi người." }, { id: "bcc", label: "BCC", icon: "🕶️" }, { id: "body", label: "Nội dung thư", icon: "📝", why: "Không nhập địa chỉ vào nội dung." }], correct: "bcc", done: "BCC: ban.minh@truong.edu.vn." },
      { ask: "Đính kèm tệp bài tập.", title: "Thanh công cụ thư", layout: "menu", items: [{ id: "attach", label: "📎 Đính kèm tệp" }, { id: "emoji", label: "😀 Biểu tượng cảm xúc", why: "Không đính kèm được tệp." }, { id: "discard", label: "🗑️ Huỷ thư", why: "Sẽ xoá thư đang soạn!" }], correct: "attach", done: "Chọn tệp để đính kèm." },
      { ask: "Chọn đúng tệp.", title: "Chọn tệp", layout: "list", items: [{ id: "doc", label: "bai-tap.docx", icon: "📄" }, { id: "img", label: "anh-ca-nhan.jpg", icon: "🖼️", why: "Không phải tệp bài tập." }], correct: "doc", done: "Đã đính kèm bai-tap.docx (24 KB)." },
      { ask: "Gửi thư.", title: "Thư mới", layout: "dialog", items: [{ id: "send", label: "Gửi" }, { id: "draft", label: "Lưu nháp", why: "Lưu nháp thì thư chưa được gửi." }], correct: "send", done: "Thư đã gửi. Cô nhận được, bạn Minh nhận bản sao ẩn." },
    ],
  },
  {
    id: "proc-12-5", ref: "12-5", app: "Windows", prompt: "Chia sẻ thư mục TaiLieuTin trên mạng LAN để nhóm Tin 12 chỉ đọc được, không sửa, xoá.",
    explanation: "Chuột phải thư mục → Thuộc tính → thẻ Chia sẻ → Chia sẻ… → chọn Nhóm Tin 12 → quyền Đọc → Chia sẻ.",
    steps: [
      { ask: "Nhấp chuột phải vào thư mục cần chia sẻ.", title: "File Explorer – Tài liệu", path: "Tài liệu", layout: "list", items: [{ id: "tl", label: "TaiLieuTin", icon: "📁" }, { id: "rieng", label: "AnhCaNhan", icon: "📁", why: "Thư mục cá nhân, không nên chia sẻ." }, { id: "game", label: "TroChoi", icon: "📁", why: "Không phải thư mục cần chia sẻ." }], correct: "tl", done: "Menu chuột phải của TaiLieuTin." },
      { ask: "Mở thông tin của thư mục.", title: "Menu chuột phải", layout: "menu", items: [{ id: "open", label: "Mở", why: "Chỉ mở thư mục ra xem." }, { id: "delete", label: "Xoá", why: "Sẽ xoá thư mục!" }, { id: "props", label: "Thuộc tính" }], correct: "props", done: "Hộp thoại Thuộc tính." },
      { ask: "Chuyển sang thẻ chia sẻ.", title: "Thuộc tính – TaiLieuTin", layout: "tabs", items: [{ id: "general", label: "Chung", why: "Thẻ thông tin chung." }, { id: "sharing", label: "Chia sẻ" }, { id: "security", label: "Bảo mật", why: "Thẻ phân quyền NTFS trên máy, chưa chia sẻ qua mạng." }], correct: "sharing", done: "Thẻ Chia sẻ." },
      { ask: "Bấm nút chia sẻ.", title: "Thuộc tính – Chia sẻ", layout: "dialog", items: [{ id: "share", label: "Chia sẻ…" }, { id: "ok", label: "OK", why: "Bấm OK lúc này chưa chia sẻ gì." }], correct: "share", done: "Hộp thoại chọn người được chia sẻ." },
      { ask: "Chọn người được chia sẻ.", title: "Chia sẻ – Chọn người", layout: "list", items: [{ id: "group", label: "Nhóm Tin 12", icon: "👥" }, { id: "everyone", label: "Everyone (mọi người)", icon: "🌍", why: "Mọi người trong mạng đều vào được, quá rộng." }], correct: "group", done: "Đã thêm Nhóm Tin 12." },
      { ask: "Đặt quyền cho nhóm chỉ đọc được.", title: "Mức quyền", layout: "menu", items: [{ id: "read", label: "Đọc" }, { id: "rw", label: "Đọc/Ghi", why: "Đọc/Ghi cho phép sửa và xoá tệp." }, { id: "remove", label: "Xoá người này", why: "Nhóm sẽ không vào được." }], correct: "read", done: "Quyền: Đọc." },
      { ask: "Hoàn tất chia sẻ.", title: "Chia sẻ", layout: "dialog", items: [{ id: "doshare", label: "Chia sẻ" }, { id: "cancel", label: "Huỷ", why: "Huỷ thì không chia sẻ." }], correct: "doshare", done: "Thư mục đã chia sẻ: \\\\MAY-GV\\TaiLieuTin (chỉ đọc)." },
    ],
  },
];
