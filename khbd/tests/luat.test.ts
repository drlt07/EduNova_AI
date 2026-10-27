import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { docVanBanKhung } from "@khbd/lib/data/khung";

const khung = docVanBanKhung().replace(/\s+/g, " ");
const thuMuc = path.join(process.cwd(), "rules");
const luat = fs.readdirSync(thuMuc).filter((f) => f.endsWith(".md")).map((f) => [f, fs.readFileSync(path.join(thuMuc, f), "utf8")] as const);

describe("file luật trong rules/", () => {
  it("có đủ các file luật; lhdn.md để trống chờ GV viết", () => {
    expect(luat.map(([f]) => f).sort()).toEqual(["ai.md", "bieu_hien.md", "cau_hoi.md", "cong_thuc.md", "doc_hinh.md", "hoat_dong.md", "khong_ai.md", "lhdn.md", "luat_loi.md", "nls.md", "tieng_anh.md", "to_chuc.md"]);
    expect(luat.find(([f]) => f === "lhdn.md")![1].trim()).toBe("");
  });

  it("không có ngoặc vuông chờ điền (không gửi khung còn [ ] cho AI)", () => {
    for (const [f, t] of luat) expect(t, f).not.toMatch(/[[\]]/);
  });

  it("các trích dẫn nguyên văn từ khung có đúng trong khung", () => {
    for (const [f, t] of luat) {
      // Mỗi dòng: phần nằm giữa dấu ngoặc kép đầu và cuối dòng là trích dẫn nguyên văn.
      let nguyenVan = false;
      for (const dong of t.split("\n")) {
        // Chỉ kiểm các dòng trong phần ghi "nguyên văn", đến khi gặp tiêu đề hoặc phần "Luật".
        if (/nguyên văn/i.test(dong)) nguyenVan = true;
        else if (/^#|^Luật/.test(dong)) nguyenVan = false;
        if (!nguyenVan) continue;
        const dau = dong.indexOf('"'), cuoi = dong.lastIndexOf('"');
        if (dau < 0 || cuoi - dau < 40) continue;
        for (const p of dong.slice(dau + 1, cuoi).split(/["“”]/).filter((x) => x.trim().length > 15)) {
          expect(khung, `${f}: ${p.slice(0, 50)}`).toContain(p.trim().replace(/\s+/g, " "));
        }
      }
    }
  });
});
