import pdfParse from "pdf-parse/lib/pdf-parse.js";
import { doanMaHoa, sangUnicode } from "./ma-hoa";

export type KetQuaPdf = { html: string; soTrang: number; laBanScan: boolean; maHoa: string };

function thoatHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export async function docPdf(buffer: Buffer): Promise<KetQuaPdf> {
  const { text, numpages } = await pdfParse(buffer);
  const soKiTu = text.replace(/\s/g, "").length;
  const laBanScan = soKiTu / Math.max(numpages, 1) < 100;
  const maHoa = doanMaHoa(text);
  const chu = sangUnicode(text, maHoa);
  const html = chu
    .split(/\n/)
    .map((d) => d.trim())
    .filter(Boolean)
    .map((d) => `<p>${thoatHtml(d)}</p>`)
    .join("");
  return { html, soTrang: numpages, laBanScan, maHoa };
}
