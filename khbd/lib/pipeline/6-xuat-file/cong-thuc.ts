import temml from "./dat-temml";
import "temml/contrib/mhchem/mhchem.js";
import katex from "katex";
import { mml2omml } from "mathml2omml";

/** LaTeX → công thức Word (OMML), qua MathML. Dùng được \ce{} (mhchem) cho phương trình hóa học. */
export function latexSangOmml(tex: string): string {
  const mml = temml.renderToString(tex, { xml: true, throwOnError: true });
  // mathml2omml không mã hóa < > & trong chữ của công thức (vd "4<0"): mã hóa lại để XML hợp lệ.
  return mml2omml(mml)
    .replace(/^<m:oMath[^>]*>/, "<m:oMath>")
    .replace(/(<m:t(?: [^>]*)?>)([\s\S]*?)(<\/m:t>)/g, (_, mo: string, chu: string, dong: string) =>
      mo + chu.replace(/&(?!(amp|lt|gt|quot|apos|#\d+);)/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;") + dong);
}

/** Kiểm tra LaTeX hợp lệ (KaTeX đọc được). Trả về thông báo lỗi hoặc null. */
export function loiLatex(tex: string): string | null {
  try {
    katex.renderToString(tex, { throwOnError: true, strict: "ignore" });
    return null;
  } catch (e) {
    return e instanceof Error ? e.message.replace(/^KaTeX parse error: /, "") : "Công thức không hợp lệ.";
  }
}

/** Tách chuỗi thành phần chữ và phần công thức $...$. */
export function tachCongThuc(chu: string): { loai: "chu" | "cong_thuc"; noiDung: string }[] {
  const kq: { loai: "chu" | "cong_thuc"; noiDung: string }[] = [];
  const re = /\$([^$]+)\$/g;
  let cuoi = 0;
  for (const m of chu.matchAll(re)) {
    if (m.index! > cuoi) kq.push({ loai: "chu", noiDung: chu.slice(cuoi, m.index) });
    kq.push({ loai: "cong_thuc", noiDung: m[1] });
    cuoi = m.index! + m[0].length;
  }
  if (cuoi < chu.length) kq.push({ loai: "chu", noiDung: chu.slice(cuoi) });
  return kq;
}
