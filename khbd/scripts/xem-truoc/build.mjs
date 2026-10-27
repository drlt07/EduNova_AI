/**
 * Đóng gói bản xem trước thành một trang HTML duy nhất (nhúng sẵn giáo án mẫu): dist-xem-truoc/index.html
 * Chạy: node scripts/xem-truoc/build.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { build } from "esbuild";
import postcss from "postcss";
import tailwind from "@tailwindcss/postcss";

const goc = path.resolve(import.meta.dirname, "../..");
const ra = path.join(goc, "dist-xem-truoc");
fs.mkdirSync(ra, { recursive: true });

// Chỉ nhúng file mẫu có tên trong danh sách mẫu của entry.tsx (file dùng cho test không nhúng, giữ trang nhẹ).
const entry = fs.readFileSync(path.join(import.meta.dirname, "entry.tsx"), "utf8");
const mau = Object.fromEntries(
  fs.readdirSync(path.join(goc, "samples/input")).filter((f) => f.endsWith(".docx") && entry.includes(`"${f}"`))
    .map((f) => [f, fs.readFileSync(path.join(goc, "samples/input", f)).toString("base64")]),
);

const js = await build({
  entryPoints: [path.join(goc, "scripts/xem-truoc/entry.tsx")],
  bundle: true, minify: true, write: false, format: "iife", platform: "browser", target: "es2020",
  jsx: "automatic", tsconfig: path.join(goc, "tsconfig.json"),
  define: {
    "process.env.NODE_ENV": '"production"',
    MAU_NHUNG: JSON.stringify(mau),
    MAU_WORD: JSON.stringify(fs.readFileSync(path.join(goc, "templates/mau.docx")).toString("base64")),
  },
  logLevel: "error",
});

const nguonCss = path.join(goc, "scripts/xem-truoc/tailwind.css");
const css = await postcss([tailwind({ base: goc })]).process(fs.readFileSync(nguonCss, "utf8"), { from: nguonCss });

const html = `<title>Soạn KHBD THPT</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700&display=swap">
<style>${css.css}</style>
<div id="app"></div>
<script>${js.outputFiles[0].text.replace(/<\/script/gi, "<\\/script")}</script>
`;
fs.writeFileSync(path.join(ra, "index.html"), html);
console.log("Đã ghi", path.join(ra, "index.html"), Math.round(html.length / 1024), "KB");
