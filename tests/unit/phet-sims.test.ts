import { describe, expect, it } from "vitest";
import { pyRange } from "@/components/phet/robot-factory";
import { MAZES, runAll, LIMIT, type Program } from "@/components/phet/maze-robot";
import { imageBytes, sampleError } from "@/components/phet/digital-camera";
import { analyse } from "@/components/phet/network-builder";
import { boxSize } from "@/components/phet/css-box";
import { reachable, resolve, PAGES, type Site } from "@/components/phet/web-navigation";
import { LAB_TEMPLATES } from "@/lib/data/labs";
import { LAB_META, SGK_SIMS } from "@/lib/data/lab-catalog";
import { LAB_RUBRICS } from "@/lib/ai/lab-grader";
import { bookEntry, lessonSimSlugs } from "@/lib/sgk/book";

const P = (p: Partial<Program>): Program => ({ cond: "chuaDich", n: 4, mode: "don", action: "di", test: "tuong", then: "trai", else: "di", ...p });

describe("mô phỏng kiểu PhET", () => {
  it("mọi mô phỏng gắn với bài đều có trong kho, có thông tin thẻ và tiêu chí chấm", () => {
    for (const [ref, slugs] of Object.entries(SGK_SIMS)) for (const s of slugs) {
      expect(LAB_TEMPLATES.some((l) => l.slug === s), `${ref}: ${s}`).toBe(true);
      expect(LAB_META[s], s).toBeDefined();
    }
    for (const s of ["binary-control", "smart-home", "digital-camera", "robot-factory", "maze-robot", "software-ecosystem", "device-connection", "cloud-sharing", "network-builder", "css-box", "web-navigation"]) expect(LAB_RUBRICS[s], s).toBeDefined();
  });
  it("bài có tình huống chính đứng đầu danh sách mô phỏng của bài", () => {
    expect(lessonSimSlugs(bookEntry("10-4")!)[0]).toBe("binary-control");
    expect(lessonSimSlugs(bookEntry("10-5")!)).not.toContain("binary-logic");
    expect(lessonSimSlugs(bookEntry("12-16")!)).toEqual(["css-box"]);
  });
  it("range như Python", () => {
    expect(pyRange(0, 5, 1)).toEqual([0, 1, 2, 3, 4]);
    expect(pyRange(2, 11, 2)).toEqual([2, 4, 6, 8, 10]);
    expect(pyRange(10, 0, -3)).toEqual([10, 7, 4, 1]);
    expect(pyRange(5, 5, 1)).toEqual([]);
  });
  it("mê cung: chương trình đúng tới đích, chương trình sai bị phát hiện lặp vô hạn", () => {
    const ok = (maze: string, p: Program) => { const m = MAZES[maze]; const r = runAll(m, p); const g = m.rows.findIndex((row) => row.includes("G")); return r.y === g && m.rows[g][r.x] === "G"; };
    expect(ok("thang", P({ cond: "khongTuong" }))).toBe(true);
    expect(ok("dem", P({ cond: "dem", n: 4 }))).toBe(true);
    expect(ok("trai", P({ mode: "neu", test: "tuong", then: "trai", else: "di" }))).toBe(true);
    expect(ok("phai", P({ mode: "neu", test: "tuong", then: "phai", else: "di" }))).toBe(true);
    expect(runAll(MAZES.trai, P({ mode: "don", action: "trai" })).iter).toBe(LIMIT);
  });
  it("máy ảnh số: dung lượng và thử thách âm thanh làm được", () => {
    expect(imageBytes(100, 24)).toBe(30000);
    expect(imageBytes(32, 8)).toBeLessThanOrEqual(2048);
    const solvable = Array.from({ length: 22 }, (_, i) => i + 3).some((r) => [1, 2, 3, 4, 5, 6, 7, 8].some((b) => sampleError(r, b) < 0.05));
    expect(solvable).toBe(true);
    expect(sampleError(48, 8)).toBeLessThan(sampleError(4, 2));
  });
  it("mạng trường học", () => {
    const a = analyse({ lab: "switch", lib: "ap", office: "switch", core: "router", edge: "modem" });
    expect(["lab", "lib", "office"].every((r) => a.net(r as "lab"))).toBe(true);
    expect(analyse({ lab: "switch", lib: "ap", office: "switch", core: "router" }).net("lab")).toBe(false);
    expect(analyse({ lab: "router" }).lan("lab")).toBe(false);
  });
  it("hộp CSS", () => {
    expect(boxSize({ width: 250, height: 90, padding: 20, border: 5, margin: 0, sizing: "content-box", style: "solid", radius: 0 }).visible).toBe(300);
    expect(boxSize({ width: 300, height: 90, padding: 20, border: 5, margin: 10, sizing: "border-box", style: "solid", radius: 0 })).toMatchObject({ visible: 300, content: 250, total: 320 });
  });
  it("đường dẫn web", () => {
    expect(resolve("lop/10a1.html", "../index.html")).toBe("index.html");
    expect(resolve("lop/10a1.html", "10a2.html")).toBe("lop/10a2.html");
    expect(resolve("lop/10a1.html", "lop/10a2.html")).toBeUndefined();
    expect(resolve("index.html", "/lop/10a1.html")).toBe("lop/10a1.html");
    const fixed = { "index.html": [{ text: "a", href: "gioi-thieu.html" }, { text: "b", href: "lop/10a1.html" }, { text: "c", href: "lien-he.html" }], "gioi-thieu.html": [{ text: "a", href: "index.html" }], "lien-he.html": [{ text: "a", href: "index.html" }], "lop/10a1.html": [{ text: "a", href: "../index.html" }, { text: "b", href: "10a2.html" }], "lop/10a2.html": [{ text: "a", href: "10a1.html" }] } as Site;
    expect(reachable(fixed).size).toBe(PAGES.length);
  });
});
