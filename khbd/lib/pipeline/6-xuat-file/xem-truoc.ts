import temml from "./dat-temml";
import { docDocx } from "../1-tai-len/docx";

/** HTML xem trước của file Word đã xuất: công thức hiển thị bằng MathML (trình duyệt tự vẽ). */
export async function htmlXemTruoc(file: Uint8Array): Promise<string> {
  const { html } = await docDocx(file, undefined, [
    "p[style-name='Tieu de mon'] => p.tieu-de-mon:fresh",
    "p[style-name='Ten bai'] => p.ten-bai:fresh",
    "p[style-name='Muc lon'] => p.muc-lon:fresh",
    "p[style-name='Muc con'] => p.muc-con:fresh",
    "p[style-name='Ten hoat dong'] => p.muc-con:fresh",
    "p[style-name='List Bullet'] => p.cap-1:fresh",
    "p[style-name='List Bullet 2'] => p.cap-2:fresh",
  ]);
  return html.replace(/\$([^$]+)\$/g, (m, tex: string) => {
    try {
      return temml.renderToString(tex.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&"));
    } catch {
      return m;
    }
  });
}
