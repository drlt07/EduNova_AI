// Quét accessibility tự động (axe-core) trên các trang chính. Báo vi phạm mức serious/critical.
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const AXE = require.resolve("axe-core/axe.min.js");
const BASE = process.env.BASE_URL ?? "http://localhost:3100";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
// THEME=dark hoặc THEME=light để chọn giao diện khi quét (next-themes đọc localStorage "theme")
if (process.env.THEME) await page.addInitScript((t) => localStorage.setItem("theme", t), process.env.THEME);
const login = async (id) => {
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  // Tài khoản mẫu: <id>@demo.edunova.vn, mật khẩu chung của bản dùng thử (DEMO_PASSWORD trong src/lib/auth/local-auth.ts)
  await page.getByLabel("Email").fill(`${id}@demo.edunova.vn`);
  await page.getByLabel("Mật khẩu", { exact: true }).fill(process.env.DEMO_PASSWORD ?? "edunova2026");
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await page.waitForURL(/\/(teacher|student|admin)/);
};
const pages = {
  public: ["/", "/explore", "/curriculum", "/labs", "/labs/smart-garden", "/labs/smart-coding-city", "/about", "/login", "/register"],
  t1: ["/teacher/dashboard", "/teacher/lesson-planner", "/teacher/lesson-planner/lp-seed-if1", "/teacher/activity-builder", "/teacher/labs", "/teacher/assessment", "/teacher/analytics", "/teacher/classes"],
  s1: ["/student/dashboard", "/student/missions", "/student/missions/as-seed-1", "/student/learning", "/student/code", "/student/learning/L-10-if-kntt", "/student/games", "/student/games/smart-farm", "/student/games/traffic-city", "/student/tutor", "/student/practice", "/student/practice/if-basic", "/student/projects", "/student/progress", "/student/portfolio", "/student/settings"],
};
let total = 0;
for (const [who, list] of Object.entries(pages)) {
  if (who !== "public") await login(who);
  for (const p of list) {
    await page.goto(BASE + p, { waitUntil: "networkidle" });
    await page.locator("h1").first().waitFor();
    await page.addScriptTag({ path: AXE });
    const res = await page.evaluate(async () => (await window.axe.run(document, { resultTypes: ["violations"] })).violations.filter((v) => v.impact === "serious" || v.impact === "critical").map((v) => ({ id: v.id, impact: v.impact, n: v.nodes.length, sample: v.nodes[0]?.target?.join(" ") })));
    total += res.length;
    console.log(`${res.length ? "✗" : "✓"} ${p}${res.map((v) => `\n    ${v.impact} ${v.id} ×${v.n} e.g. ${v.sample}`).join("")}`);
  }
}
await browser.close();
console.log(`\nTổng vi phạm serious/critical: ${total}`);
process.exit(total ? 1 : 0);
