/**
 * Phiêu lưu Nova — bộ kịch bản trò chơi 3D ôn Tin học (mỗi kịch bản là một tệp tự chạy trong public/, sinh từ tools/).
 * Kịch bản 1 "Sự cố ở Ngôi nhà Nova" (public/nova/index.html), kịch bản 2 "Đêm trước kỳ thi"
 * (public/nova/dem-truoc-ky-thi/index.html) và kịch bản 3 "Mất liên lạc ở Trạm Nova-7" (public/nova/tram-nova-7/index.html),
 * cùng sinh từ tools/nova. Mỗi chương là một thử thách Tin học thực hành;
 * các mô phỏng cùng chủ đề của kịch bản 1 trỏ về chương tương ứng.
 */

/** Trang công khai của bộ kịch bản (danh sách); mỗi kịch bản ở `${NOVA_PATH}/${slug}`. */
export const NOVA_PATH = "/phieu-luu-nova";
/** Bản Next.js phục vụ trò chơi ở /nova/index.html; bản demo một tệp đặt trò chơi cạnh trang (đặt qua biến lúc build). */
export const NOVA_GAME_SRC = process.env.NEXT_PUBLIC_NOVA_SRC || "/nova/index.html";
/** Nhãn "Mới" hiện trong vài tuần đầu sau khi ra mắt. */
export const NOVA_NEW_UNTIL = "2026-12-01";
export const isNovaNew = (now: number) => now < Date.parse(NOVA_NEW_UNTIL);

export interface NovaChapter {
  n: number;
  room: string;
  title: string;
  learn: string;
  /** Mô phỏng (kho đời sống hoặc mô phỏng theo bài) có thử thách cùng chủ đề. */
  slugs: string[];
}

export const NOVA_CHAPTERS: NovaChapter[] = [
  { n: 1, room: "Phòng làm việc", title: "Lắp lại máy tính", learn: "CPU, RAM, SSD, bộ nguồn và quá trình khởi động", slugs: ["inside-computer-3d", "storage-units"] },
  { n: 2, room: "Phòng khách", title: "Mất kết nối", learn: "Đặt router, cổng WAN/LAN, địa chỉ IP và gateway", slugs: ["network-journey", "network-builder", "device-connection"] },
  { n: 3, room: "Bếp", title: "Bữa tối và mã QR", learn: "Nhận ra mã QR dán đè, kiểm tra người nhận trước khi chuyển tiền", slugs: ["qr-code"] },
  { n: 4, room: "Cổng nhà", title: "Đèn tín hiệu trước cổng", learn: "Luật NẾU – THÌ, đèn vàng và thứ tự ưu tiên", slugs: ["smart-coding-city"] },
  { n: 5, room: "Gác mái", title: "Gác mái AI", learn: "Dữ liệu có nhãn, nhãn sai khiến AI học sai", slugs: ["ai-discovery", "spam-filter", "recommender"] },
  { n: 6, room: "Phòng máy chủ", title: "Trận cuối với Glitch", learn: "Lừa đảo trực tuyến, mật khẩu, OTP, tệp lạ", slugs: ["digital-safety", "password", "digital-citizen"] },
];

/** Kịch bản 2 "Đêm trước kỳ thi": nội dung Tin 10–12 mà kịch bản 1 chưa có. */
export const NOVA2_CHAPTERS: NovaChapter[] = [
  { n: 1, room: "Phòng máy", title: "Mật khẩu nhị phân", learn: "Mã ASCII, đổi nhị phân sang thập phân, bảng mã UTF-8", slugs: ["binary-logic", "rgb-pixel"] },
  { n: 2, room: "Phòng giáo vụ", title: "Bảng điểm bị sửa", learn: "SELECT … WHERE, UPDATE có điều kiện, khóa chính và CHECK", slugs: ["database-city", "sql-detective"] },
  { n: 3, room: "Thư viện", title: "10.000 hồ sơ", learn: "Tìm kiếm nhị phân, sắp xếp nổi bọt, số lần so sánh", slugs: [] },
  { n: 4, room: "Phòng máy chủ", title: "Ba chương trình lỗi", learn: "Đọc và gỡ lỗi Python: chia làm tròn lên, range(), chia cho 0", slugs: ["debug-detective"] },
  { n: 5, room: "Phòng truyền thông", title: "Trang thông báo bị chiếm", learn: "Sửa thẻ HTML, bộ chọn và thuộc tính CSS, nhận ra đường link giả", slugs: ["web-creator"] },
  { n: 6, room: "Trung tâm dữ liệu", title: "Đối đầu KHÓA ĐEN", learn: "Xử lý mã độc tống tiền: cách ly, sao lưu 3-2-1, xác thực hai bước, pháp luật", slugs: ["encryption", "digital-safety", "password", "digital-citizen"] },
];

/** Kịch bản 3 "Mất liên lạc ở Trạm Nova-7": hệ điều hành, ảnh số, truyền thông, cảm biến, bảng tính, AI có giám sát. */
export const NOVA3_CHAPTERS: NovaChapter[] = [
  { n: 1, room: "Phòng điều khiển", title: "Nhật ký và tiến trình", learn: "Cây thư mục, đường dẫn, dừng tiến trình lạ, tệp tạm", slugs: ["os-explorer"] },
  { n: 2, room: "Phòng ảnh vệ tinh", title: "Màu sai lệch", learn: "Pha màu RGB, dung lượng ảnh thô, PNG và JPEG", slugs: ["rgb-pixel", "image-compress"] },
  { n: 3, room: "Phòng liên lạc", title: "Tin nhắn mã hóa", learn: "Mã Caesar, ghép gói tin theo số thứ tự, Mbps và MB", slugs: ["encryption", "download-time", "network-journey"] },
  { n: 4, room: "Nhà kính", title: "Chương trình tưới cây", learn: "Vòng lặp while, if – else với cảm biến, lệnh chờ", slugs: ["smart-garden"] },
  { n: 5, room: "Phòng dữ liệu", title: "Số liệu bị giấu", learn: "AVERAGE, COUNTIF và chọn loại biểu đồ", slugs: [] },
  { n: 6, room: "Lõi ECHO", title: "Đối thoại với ECHO", learn: "Kiểm chứng nhận định của AI, con người giám sát quyết định quan trọng", slugs: ["ai-discovery", "digital-citizen"] },
];

export const chapterLabel = (c: NovaChapter) => (c.n < 6 ? `Chương ${c.n}` : "Chương cuối");

export function novaChapterFor(slug: string): NovaChapter | undefined {
  return NOVA_CHAPTERS.find((c) => c.slugs.includes(slug));
}

export interface Adventure {
  slug: string;
  no: number;
  /** Phiên bản giao diện khác của cùng kịch bản (ví dụ "dễ thương"). */
  variant?: string;
  title: string;
  tagline: string;
  summary: string;
  /** Tệp trò chơi; chưa có nghĩa là kịch bản đang soạn. */
  src?: string;
  minutes: number;
  chapters: NovaChapter[];
  /** Màu bìa (gradient Tailwind). */
  cover: string;
}

/** Số kịch bản dự kiến của bộ; ô chưa có kịch bản hiện "Sắp ra mắt". */
export const ADVENTURE_SLOTS = 3;

export const ADVENTURES: Adventure[] = [
  {
    slug: "ngoi-nha-nova",
    no: 1,
    title: "Sự cố ở Ngôi nhà Nova",
    tagline: "Giải cứu ngôi nhà thông minh khỏi mã độc Glitch",
    summary: "Lắp lại máy tính, sửa mạng Wi-Fi, vạch mặt mã QR giả, lập trình đèn giao thông, dạy lại AI rồi đánh bại Glitch ở phòng máy chủ.",
    src: NOVA_GAME_SRC,
    minutes: 40,
    chapters: NOVA_CHAPTERS,
    cover: "from-[#1e1b4b] via-[#312e81] to-[#0e7490]",
  },
  {
    slug: "ngoi-nha-hong",
    no: 1,
    variant: "phiên bản dễ thương",
    title: "Sự cố ở Ngôi nhà Nova",
    tagline: "Cùng câu chuyện và thử thách, giao diện pastel tông hồng",
    summary: "Kịch bản 1 với nhân vật chibi đội mũ, căn nhà màu hồng nhẹ và giao diện bo tròn. Nội dung, độ khó và tiến trình chơi giống bản chính; tiến độ lưu riêng.",
    src: NOVA_GAME_SRC.replace(/index\.html$/, "ngoi-nha-hong/index.html"),
    minutes: 40,
    chapters: NOVA_CHAPTERS,
    cover: "from-[#9d174d] via-[#db2777] to-[#f9a8d4]",
  },
  {
    slug: "dem-truoc-ky-thi",
    no: 2,
    title: "Đêm trước kỳ thi",
    tagline: "Cứu đề thi khỏi mã độc tống tiền KHÓA ĐEN trước 6 giờ sáng",
    summary: "Giải mã mật khẩu nhị phân, truy vấn SQL tìm điểm bị sửa, tìm và sắp xếp hồ sơ, gỡ lỗi Python, sửa trang web rồi xử lý sự cố mã độc. Đồng hồ đếm ngược, chọn sai mất 10 phút.",
    src: NOVA_GAME_SRC.replace(/index\.html$/, "dem-truoc-ky-thi/index.html"),
    minutes: 45,
    chapters: NOVA2_CHAPTERS,
    cover: "from-[#0b1120] via-[#3b0a1a] to-[#9f1239]",
  },
  {
    slug: "tram-nova-7",
    no: 3,
    title: "Mất liên lạc ở Trạm Nova-7",
    tagline: "Giành lại trạm nghiên cứu trên sao Hỏa từ AI bảo trì ECHO",
    summary: "Tìm nhật ký trong cây thư mục, pha màu ảnh vệ tinh, giải mã Caesar, ghép gói tin, sắp xếp chương trình tưới cây, dùng COUNTIF vạch ra số liệu bị giấu rồi kiểm chứng các nhận định của ECHO. Thanh oxy thay cho sao.",
    src: NOVA_GAME_SRC.replace(/index\.html$/, "tram-nova-7/index.html"),
    minutes: 40,
    chapters: NOVA3_CHAPTERS,
    cover: "from-[#1c0f0a] via-[#7c2d12] to-[#ea580c]",
  },
];

export const getAdventure = (slug: string) => ADVENTURES.find((a) => a.slug === slug);
/** Kịch bản 1 — đích của các liên kết "Thử thách này có trong Chương N". */
export const NOVA_HOME_GAME = `${NOVA_PATH}/ngoi-nha-nova`;
