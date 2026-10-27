import fs from "node:fs";
import path from "node:path";
import PizZip from "pizzip";

/** Văn bản thuần của docs/khung_khbd.docx: mỗi đoạn một dòng, mỗi ô bảng một dòng. */
export function docVanBanKhung(duongDan = path.join(process.cwd(), "docs/khung_khbd.docx")): string {
  const zip = new PizZip(fs.readFileSync(duongDan));
  const xml = zip.file("word/document.xml")!.asText();
  return xml
    .split(/<\/w:p>/)
    .map((doan) =>
      [...doan.matchAll(/<w:t(?:\s[^>]*)?>([^<]*)<\/w:t>/g)]
        .map((m) => m[1])
        .join("")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'"),
    )
    .filter((dong) => dong.length > 0)
    .join("\n");
}
