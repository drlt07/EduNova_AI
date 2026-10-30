/**
 * Gói trò chơi "Phiêu lưu Nova" (tools/nova/game.src.html) thành một tệp tự chạy public/nova/index.html:
 * thay thư viện three r128 và bộ biểu tượng Tabler lấy từ CDN bằng bản đặt sẵn trong tools/nova/vendor,
 * để trò chơi chạy cả khi không ra được mạng ngoài (bản demo một tệp, trường chặn CDN),
 * và chèn các gói: đồ họa (visual-pack.js), âm thanh + toàn màn hình (audio-pack.js), cỡ chữ + sửa lỗi kẹt (read-pack.js),
 * phong cách THPT + độ khó (pro-pack.js).
 * Chạy: node tools/nova/build.mjs
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(dir, "../..");
const read = (f) => readFileSync(path.join(dir, f), "utf8");

const icons = read("vendor/icons.css");
const three = read("vendor/three-r128.min.js");
const visual = read("visual-pack.js");
const audio = read("audio-pack.js");
const readable = read("read-pack.js");
const pro = read("pro-pack.js");
// Hậu kỳ (bloom) của three r128, bản examples/js gắn vào biến THREE toàn cục.
const post = ["CopyShader", "LuminosityHighPassShader", "EffectComposer", "RenderPass", "ShaderPass", "UnrealBloomPass"].map((f) => read(`vendor/post/${f}.js`)).join("\n");
if (three.includes("</script")) throw new Error("three.min.js chứa </script>, không nhúng thẳng được");

/** Gói một kịch bản: lõi trò chơi + các gói chung; `extra` là gói nội dung riêng, `edits` đổi chữ hiển thị. */
function buildGame({ out, extra = "", edits = [] }) {
  let html = read("game.src.html");
  const swap = (from, to) => {
    if (!html.includes(from)) throw new Error(`Không thấy đoạn cần thay: ${from.slice(0, 80)}`);
    html = html.replace(from, () => to);
  };
  swap('<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.19.0/dist/tabler-icons.min.css">', `<style>${icons}</style>`);
  swap('<script src="https://cdn.jsdelivr.net/npm/three@0.128.0/build/three.min.js"></script>', `<script>${three}</script>\n<script>${post}</script>`);
  // Gói đồ họa (visual-pack.js), âm thanh + toàn màn hình (audio-pack.js), cỡ chữ + sửa lỗi kẹt (read-pack.js):
  // chèn ngay trước dòng khởi chạy trò chơi.
  swap("CH=CHS[1];S.background=", `${visual}\n${audio}\n${readable}\n${pro}\n${extra}\nCH=CHS[1];S.background=`);
  // Sửa lỗi bản gốc, chương 4: ô chọn thứ ba trong bảng luật đèn có id="c", trùng với khung vẽ 3D <canvas id="c">,
  // nên $('c').value luôn rỗng và trò chơi mãi báo "Hãy chọn đủ cả ba ô" (không qua được chương 4).
  swap('Trước khi đổi: <select id="c">', 'Trước khi đổi: <select id="r4c">');
  swap("const a=$('a').value,b=$('b').value,c=$('c').value;", "const a=$('a').value,b=$('b').value,c=$('r4c').value;");
  // Chương 4: khung hình đầu tiên có dt = 0 thì vận tốc xe thành NaN và xe biến mất vĩnh viễn.
  swap("c.v=(ns-c.s)/dt;", "c.v=dt>0?(ns-c.s)/dt:c.v;");
  // Giọng thoại hợp lứa tuổi THPT: bỏ tiếng cười kiểu hoạt hình của Glitch.
  html = html.replace(/,\s*hê hê/g, "").replace(/Hê hê[!,…]?\s*/g, "").replace(/'(GLITCH|NOVA)','([a-zà-ỹ])/g, (m, who, ch) => `'${who}','${ch.toUpperCase()}`).replace("Khôngggg!", "Không thể nào!");
  // Nhúng trong trang EduNova (iframe): khung trò chơi lấp đầy iframe, nền trong suốt.
  swap("</style>\n</head>", "html,body{height:100%}body{padding:0;background:transparent}.g{max-width:none;height:100%;border-radius:0}\n</style>\n</head>");

  for (const [from, to] of edits) swap(from, to);
  const file = path.join(root, out);
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, html);
  console.log(`ok ${out} ${(html.length / 1024).toFixed(0)} KB`);
}

// Kịch bản 1 · Sự cố ở Ngôi nhà Nova
buildGame({ out: "public/nova/index.html" });

// Kịch bản 2 · Đêm trước kỳ thi: cùng lõi, thay 6 chương (s2-pack.js), lưu tiến độ riêng.
buildGame({
  out: "public/nova/dem-truoc-ky-thi/index.html",
  extra: read("s2-pack.js"),
  edits: [
    ["<title>Sự cố ở Ngôi nhà Nova · EduNova</title>", "<title>Đêm trước kỳ thi · EduNova</title>"],
    ['<div style="font-size:22px;font-weight:500;margin:2px 0 4px">Sự cố ở Ngôi nhà Nova</div>', '<div style="font-size:22px;font-weight:500;margin:2px 0 4px">Đêm trước kỳ thi</div>'],
    ["Mã độc Glitch đã chiếm ngôi nhà thông minh. Hãy khôi phục 5 hệ thống và giải cứu quản gia NOVA.", "22:00, Trường THPT Nova bị mã độc tống tiền KHÓA ĐEN mã hóa toàn bộ hệ thống. Khôi phục đề thi, bảng điểm và trang thông báo trước 6:00 sáng."],
    ["ti-home-bolt", "ti-school"],
    ['placeholder="Tên kỹ thuật viên"', 'placeholder="Tên của bạn"'],
    ['Kỹ thuật viên <span id="mname"></span>', 'Đội Tin học · <span id="mname"></span>'],
    ["Bản đồ Ngôi nhà Nova", "Bản đồ Trường THPT Nova"],
    ["Hoàn thành từng phòng để mở khóa phòng tiếp theo. Tiến độ được lưu tự động.", "Hoàn thành từng phòng để mở khóa phòng tiếp theo. Sao tính theo thời gian còn lại. Tiến độ được lưu tự động."],
    ["localStorage.getItem('nova_save')", "localStorage.getItem('nova2_save')"],
    ["localStorage.setItem('nova_save'", "localStorage.setItem('nova2_save'"],
  ],
});
