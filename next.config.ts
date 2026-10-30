import type { NextConfig } from "next";

// Phần lớn trang hub đọc state phía client (mock repository), nên tắt
// cacheComponents/partialPrefetching ở giai đoạn 1 để giữ mô hình render đơn giản.
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  // Cho máy khác cùng mạng Wi-Fi/LAN mở bản chạy thử (npm run dev) qua IP nội bộ, ví dụ http://192.168.3.1:3000
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*", "172.16.*.*", "*.local"],
  // Trợ lý soạn KHBD đọc .docx/.pdf ở máy chủ
  serverExternalPackages: ["pdf-parse", "mammoth", "@xmldom/xmldom"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
