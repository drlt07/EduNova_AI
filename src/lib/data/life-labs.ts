/**
 * Kho mô phỏng công khai: Tin học trong đời sống — những công nghệ quanh ta mà sách giáo khoa chưa có bài riêng.
 * Bộ mô phỏng theo bài SGK (LAB_TEMPLATES) chỉ dành cho giáo viên giao nhiệm vụ; bộ này ai cũng mở được.
 */
export interface LifeLab {
  slug: string;
  title: string;
  tagline: string;
  description: string;
  /** Nhóm hiển thị trong kho. */
  group: "thuong-ngay" | "an-toan" | "du-lieu";
  minutes: number;
  /** Liên hệ với kiến thức Tin học ở trường. */
  links: string;
  tags: string[];
  /** Mô phỏng mới thêm vào kho. */
  isNew?: boolean;
}

export const LIFE_GROUPS: { id: LifeLab["group"]; title: string; sub: string; emoji: string }[] = [
  { id: "thuong-ngay", title: "Công nghệ thường ngày", sub: "Quét mã, định vị, màn hình, mua sắm — chuyện gì xảy ra bên trong?", emoji: "📱" },
  { id: "an-toan", title: "Bảo mật và an toàn", sub: "Mật khẩu, tin nhắn bí mật, thư rác — tự bảo vệ mình trên mạng.", emoji: "🛡️" },
  { id: "du-lieu", title: "Dữ liệu và trí tuệ nhân tạo", sub: "Ứng dụng học từ dữ liệu của em để gợi ý, nén, dự đoán.", emoji: "🤖" },
];

/** Kho mặc định: mô phỏng nổi bật trên trang kho và trang chủ (quản trị viên đổi được). */
export const DEFAULT_FEATURED = ["qr-code", "password", "recommender"];

export const LIFE_LABS: LifeLab[] = [
  { slug: "qr-code", title: "Mã QR chịu được vết bẩn", tagline: "Vì sao mã QR rách một góc vẫn quét được?", description: "Gõ một đường link, xem nó thành ma trận ô đen trắng. Dán \"vết bẩn\" lên mã và đổi mức sửa lỗi L, M, Q, H để thấy khi nào điện thoại còn đọc được. Thử thách: chọn mức sửa lỗi cho mã in trên áo, trên bao bì ngoài trời.", group: "thuong-ngay", minutes: 10, links: "Biểu diễn dữ liệu bằng bit (Tin 10)", tags: ["QR", "mã hóa", "sửa lỗi"] },
  { slug: "gps", title: "Định vị GPS bằng ba vệ tinh", tagline: "Điện thoại biết em đứng đâu bằng cách đo khoảng cách", description: "Mỗi vệ tinh cho biết em cách nó bao xa, tức là em nằm trên một đường tròn. Kéo các vệ tinh, chỉnh khoảng cách và xem giao điểm của ba đường tròn chính là vị trí. Thêm sai số đồng hồ để thấy vì sao GPS trong thành phố đôi khi lệch.", group: "thuong-ngay", minutes: 12, links: "Thông tin và xử lí thông tin (Tin 10), mạng (Tin 12)", tags: ["GPS", "định vị", "vệ tinh"] },
  { slug: "barcode", title: "Mã vạch siêu thị", tagline: "Một chữ số cuối giúp máy quét phát hiện đọc sai", description: "Mã vạch EAN-13 có 12 chữ số sản phẩm và 1 chữ số kiểm tra. Đổi từng chữ số, xem vạch đen trắng và chữ số kiểm tra tính lại thế nào; gõ nhầm một số thì máy quét báo lỗi ngay. Thử thách: tính chữ số kiểm tra, tìm mã bị in sai.", group: "thuong-ngay", minutes: 10, links: "Thuật toán, vòng lặp (Tin 10)", tags: ["mã vạch", "chữ số kiểm tra", "siêu thị"] },
  { slug: "encryption", title: "Mã hóa tin nhắn", tagline: "Từ mật mã Caesar đến ổ khóa công khai", description: "Màn Caesar: dịch chữ cái theo khóa, xem kẻ nghe lén chỉ cần thử 25 khóa là đọc được. Màn Ổ khóa: ai cũng có thể khóa hộp bằng ổ khóa công khai của em, nhưng chỉ chìa riêng của em mở được — ý tưởng của mã hóa đầu cuối trong ứng dụng nhắn tin.", group: "an-toan", minutes: 15, links: "An toàn trên không gian mạng (Tin 10), bảo mật CSDL (Tin 11)", tags: ["mã hóa", "Caesar", "khóa công khai"] },
  { slug: "spam-filter", title: "Bộ lọc thư rác", tagline: "Chặn thư lừa đảo mà không chặn nhầm thư thật", description: "Mỗi từ đáng ngờ cộng điểm cho thư; vượt ngưỡng thì vào mục Thư rác. Chỉnh trọng số từ khóa và ngưỡng, xem bảng chặn đúng / chặn nhầm / lọt lưới thay đổi. Thử thách: đặt ngưỡng sao cho không thư thật nào bị chặn nhầm.", group: "an-toan", minutes: 12, links: "Câu lệnh rẽ nhánh (Tin 10), học máy (Tin 12)", tags: ["thư rác", "phân loại", "ngưỡng"] },
  { slug: "recommender", title: "Thuật toán gợi ý video", tagline: "Vì sao bảng tin toàn video giống nhau?", description: "Bấm xem vài video, hệ thống đếm chủ đề em thích và xếp hạng video tiếp theo. Chỉnh độ \"đa dạng\" để thấy bong bóng lọc hình thành hay vỡ ra. Thử thách: dự đoán video được gợi ý đầu tiên.", group: "du-lieu", minutes: 12, links: "Trí tuệ nhân tạo (Tin 12), danh sách và sắp xếp (Tin 10)", tags: ["gợi ý", "AI", "bong bóng lọc"] },
  { slug: "image-compress", title: "Nén ảnh khi gửi qua mạng", tagline: "Ảnh nhẹ đi 10 lần mà mắt gần như không thấy khác", description: "Kéo thanh chất lượng: ảnh được chia khối và làm tròn màu, dung lượng giảm theo biểu đồ. Màn Nén không mất dữ liệu: mã hóa loạt điểm ảnh giống nhau (RLE) để thấy vì sao ảnh nhiều mảng màu nén tốt hơn ảnh chụp.", group: "du-lieu", minutes: 12, links: "Dữ liệu hình ảnh (Tin 10)", tags: ["nén ảnh", "dung lượng", "RLE"] },
  { slug: "password", title: "Mật khẩu mạnh cỡ nào?", tagline: "Máy tính đoán ra mật khẩu của em trong bao lâu?", description: "Gõ thử một mật khẩu, xem số kí tự có thể, độ dài và thời gian máy đoán ra khi chạy 1 nghìn, 1 tỉ hay 100 tỉ lần mỗi giây. Thấy vì sao \"Lan2009\" lộ ngay còn một cụm từ dài lại an toàn. Thử thách: chọn mật khẩu mạnh nhất, cách làm mật khẩu mạnh lên nhanh nhất.", group: "an-toan", minutes: 10, links: "An toàn trên không gian mạng (Tin 10), lũy thừa và tổ hợp", tags: ["mật khẩu", "bảo mật", "xác thực"], isNew: true },
  { slug: "rgb-pixel", title: "Màn hình trộn màu RGB", tagline: "16,7 triệu màu từ ba bóng đèn nhỏ", description: "Phóng to một điểm ảnh trên màn hình: ba đèn đỏ, xanh lá, xanh dương. Kéo độ sáng từng đèn, xem màu trộn ra, mã #RRGGBB và 8 bit của mỗi đèn. Thử thách: pha đúng màu đích, tính số màu một điểm ảnh 24 bit hiển thị được.", group: "thuong-ngay", minutes: 10, links: "Biểu diễn hình ảnh bằng bit (Tin 10), mã màu CSS (Tin 12)", tags: ["RGB", "điểm ảnh", "màu"], isNew: true },
];

export const getLifeLab = (slug: string) => LIFE_LABS.find((l) => l.slug === slug);
