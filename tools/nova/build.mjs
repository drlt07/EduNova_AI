/**
 * Gói trò chơi "Phiêu lưu Nova" (tools/nova/game.src.html) thành một tệp tự chạy public/nova/index.html:
 * thay thư viện three r128 và bộ biểu tượng Tabler lấy từ CDN bằng bản đặt sẵn trong tools/nova/vendor,
 * để trò chơi chạy cả khi không ra được mạng ngoài (bản demo một tệp, trường chặn CDN),
 * và chèn gói đồ họa tools/nova/visual-pack.js (phòng, nhân vật, ánh sáng đẹp hơn; luật chơi giữ nguyên).
 * Chạy: node tools/nova/build.mjs
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(dir, "../..");
const read = (f) => readFileSync(path.join(dir, f), "utf8");

let html = read("game.src.html");
const icons = read("vendor/icons.css");
const three = read("vendor/three-r128.min.js");
const visual = read("visual-pack.js");
if (three.includes("</script")) throw new Error("three.min.js chứa </script>, không nhúng thẳng được");

const swap = (from, to) => {
  if (!html.includes(from)) throw new Error(`Không thấy đoạn cần thay: ${from.slice(0, 80)}`);
  html = html.replace(from, () => to);
};
swap('<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.19.0/dist/tabler-icons.min.css">', `<style>${icons}</style>`);
swap('<script src="https://cdn.jsdelivr.net/npm/three@0.128.0/build/three.min.js"></script>', `<script>${three}</script>`);
// Gói đồ họa (visual-pack.js): chèn ngay trước dòng khởi chạy trò chơi.
swap("CH=CHS[1];S.background=", `${visual}\nCH=CHS[1];S.background=`);
// Nhúng trong trang EduNova (iframe): khung trò chơi lấp đầy iframe, nền trong suốt.
swap("</style>\n</head>", "html,body{height:100%}body{padding:0;background:transparent}.g{max-width:none;height:100%;border-radius:0}\n</style>\n</head>");

const out = path.join(root, "public/nova/index.html");
mkdirSync(path.dirname(out), { recursive: true });
writeFileSync(out, html);
console.log(`ok ${path.relative(root, out)} ${(html.length / 1024).toFixed(0)} KB`);
