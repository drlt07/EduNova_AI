# Phiêu lưu Nova (trò chơi 3D)

- `game.src.html` — mã nguồn trò chơi "Sự cố ở Ngôi nhà Nova" (three.js r128, biểu tượng Tabler).
- `vendor/three-r128.min.js` — three.js 0.128.0 (MIT, `vendor/three-LICENSE.txt`). Giữ đúng r128 vì trò chơi viết theo API cũ (`outputEncoding`, ánh sáng không vật lý).
- `vendor/icons.css` — 36 biểu tượng Tabler Icons 3.19.0 (MIT) trò chơi dùng, font woff2 đã cắt gọn (~8 KB) nhúng base64.
- `build.mjs` — gói tất cả thành `public/nova/index.html` (một tệp, không gọi CDN). Chạy `node tools/nova/build.mjs` sau khi sửa `game.src.html`.

Thêm biểu tượng mới vào trò chơi: cắt lại font từ gói `@tabler/icons-webfont@3.19.0` bằng fontTools
(`pyftsubset` với danh sách mã của các lớp `ti-*` dùng trong `game.src.html`), ghi đè `vendor/icons.css`.

Trang trong web: `/phieu-luu-nova` (`src/app/(public)/phieu-luu-nova/page.tsx`); các mô phỏng cùng chủ đề khai báo trong
`src/lib/data/nova-adventure.ts`.
