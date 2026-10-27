/**
 * Gói các file luật rules/*.md thành lib/llm/luat.generated.ts để dùng cả ở máy chủ lẫn trình duyệt.
 * Sửa luật trong rules/ rồi chạy: npm run luat (tự chạy trước dev/build/test).
 */
import fs from "node:fs";
import path from "node:path";

const goc = path.resolve(import.meta.dirname, "..");
const thuMuc = path.join(goc, "rules");
const luat = Object.fromEntries(
  fs.readdirSync(thuMuc).filter((f) => f.endsWith(".md")).sort()
    .map((f) => [f.replace(/\.md$/, ""), fs.readFileSync(path.join(thuMuc, f), "utf8").trim()]),
);
const ra = `// Tự sinh từ rules/*.md bằng scripts/tao-luat.mjs. Không sửa tay.\nexport const LUAT: Record<string, string> = ${JSON.stringify(luat, null, 2)};\n`;
fs.writeFileSync(path.join(goc, "lib/llm/luat.generated.ts"), ra);
console.log("Đã gói", Object.keys(luat).length, "file luật");
