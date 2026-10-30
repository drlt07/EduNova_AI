/**
 * Phiêu lưu Nova — trò chơi 3D "Sự cố ở Ngôi nhà Nova" (public/nova/index.html, sinh từ tools/nova).
 * Mỗi chương là một thử thách Tin học thực hành; các mô phỏng cùng chủ đề trỏ về chương tương ứng.
 */

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
