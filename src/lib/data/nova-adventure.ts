/**
 * Phiêu lưu Nova — bộ kịch bản trò chơi 3D ôn Tin học (mỗi kịch bản là một tệp tự chạy trong public/, sinh từ tools/).
 * Kịch bản 1 "Sự cố ở Ngôi nhà Nova" (public/nova/index.html, tools/nova). Mỗi chương là một thử thách Tin học
 * thực hành; các mô phỏng cùng chủ đề trỏ về chương tương ứng.
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

export const chapterLabel = (c: NovaChapter) => (c.n < 6 ? `Chương ${c.n}` : "Chương cuối");

export function novaChapterFor(slug: string): NovaChapter | undefined {
  return NOVA_CHAPTERS.find((c) => c.slugs.includes(slug));
}

export interface Adventure {
  slug: string;
  no: number;
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
];

export const getAdventure = (slug: string) => ADVENTURES.find((a) => a.slug === slug);
/** Kịch bản 1 — đích của các liên kết "Thử thách này có trong Chương N". */
export const NOVA_HOME_GAME = `${NOVA_PATH}/ngoi-nha-nova`;
