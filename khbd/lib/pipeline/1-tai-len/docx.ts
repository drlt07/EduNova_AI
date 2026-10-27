import PizZip from "pizzip";
import mammoth from "mammoth";
import { KT_ANH } from "../6-xuat-file/hinh";
import { DOMParser, XMLSerializer } from "@xmldom/xmldom";
import { maHoaTheoPhong, sangUnicode } from "./ma-hoa";
import { ommlSangLatex } from "./omml";
import type { BaoTienDo } from "../kieu";

const W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";

export type KetQuaDocx = {
  html: string;
  soCongThuc: number;
  mathType: { stt: number; nguCanh: string }[];
  soDoanDoiMa: number;
};

function phongCuaStyle(styles: Document | null): { macDinh?: string; theoStyle: Map<string, string> } {
  const theoStyle = new Map<string, string>();
  if (!styles) return { theoStyle };
  let macDinh: string | undefined;
  const dd = styles.getElementsByTagNameNS(W, "rPrDefault")[0];
  const f = dd?.getElementsByTagNameNS(W, "rFonts")[0];
  if (f) macDinh = f.getAttributeNS(W, "ascii") || f.getAttributeNS(W, "hAnsi") || undefined;
  const ds = styles.getElementsByTagNameNS(W, "style");
  for (let i = 0; i < ds.length; i++) {
    const st = ds[i];
    const rf = st.getElementsByTagNameNS(W, "rFonts")[0];
    const ma = st.getAttributeNS(W, "styleId");
    const phong = rf && (rf.getAttributeNS(W, "ascii") || rf.getAttributeNS(W, "hAnsi"));
    if (ma && phong) theoStyle.set(ma, phong);
  }
  return { macDinh, theoStyle };
}

function conTrucTiep(el: Element, localName: string): Element | undefined {
  for (let c = el.firstChild; c; c = c.nextSibling) {
    if (c.nodeType === 1 && (c as Element).localName === localName) return c as Element;
  }
  return undefined;
}

function taoRunChu(doc: Document, chu: string): Element {
  const r = doc.createElementNS(W, "w:r");
  const t = doc.createElementNS(W, "w:t");
  t.setAttribute("xml:space", "preserve");
  t.appendChild(doc.createTextNode(chu));
  r.appendChild(t);
  return r;
}

function vanBanDoan(p: Element | null): string {
  if (!p) return "";
  const ts = p.getElementsByTagNameNS(W, "t");
  let s = "";
  for (let i = 0; i < ts.length; i++) s += ts[i].textContent ?? "";
  return s.trim();
}

function timCha(el: Element, localName: string): Element | null {
  let n = el.parentNode as Element | null;
  while (n && n.nodeType === 1) {
    if (n.localName === localName) return n;
    n = n.parentNode as Element | null;
  }
  return null;
}

/** Sửa document.xml trước khi đưa cho mammoth: đổi mã chữ, công thức → $LaTeX$, đánh dấu MathType. */
export function tienXuLyDocument(xml: string, stylesXml?: string) {
  const doc = new DOMParser().parseFromString(xml, "text/xml") as unknown as Document;
  const styles = stylesXml ? (new DOMParser().parseFromString(stylesXml, "text/xml") as unknown as Document) : null;
  const { macDinh, theoStyle } = phongCuaStyle(styles);

  // 1. Đổi mã TCVN3/VNI theo phông của từng đoạn chữ.
  let soDoanDoiMa = 0;
  const runs = Array.from(doc.getElementsByTagNameNS(W, "r"));
  for (const r of runs) {
    const rPr = conTrucTiep(r, "rPr");
    const rf = rPr && conTrucTiep(rPr, "rFonts");
    let phong = rf ? rf.getAttributeNS(W, "ascii") || rf.getAttributeNS(W, "hAnsi") : "";
    if (!phong) {
      const p = timCha(r, "p");
      const pStyle = p && conTrucTiep(conTrucTiep(p, "pPr") ?? p, "pStyle");
      const maStyle = pStyle?.getAttributeNS(W, "val");
      phong = (maStyle && theoStyle.get(maStyle)) || macDinh || "";
    }
    const { maHoa, chuHoa } = maHoaTheoPhong(phong);
    if (maHoa === "unicode") continue;
    for (let c = r.firstChild; c; c = c.nextSibling) {
      if (c.nodeType === 1 && (c as Element).localName === "t") {
        c.textContent = sangUnicode(c.textContent ?? "", maHoa, chuHoa);
      }
    }
    if (rf) {
      for (const tt of ["ascii", "hAnsi", "cs"]) {
        if (rf.hasAttributeNS(W, tt)) rf.setAttributeNS(W, `w:${tt}`, "Times New Roman");
      }
    }
    soDoanDoiMa++;
  }

  // 2. Công thức Word → $LaTeX$.
  let soCongThuc = 0;
  const congThuc = [
    ...Array.from(doc.getElementsByTagName("m:oMathPara")),
    ...Array.from(doc.getElementsByTagName("m:oMath")).filter((m) => !timCha(m, "oMathPara")),
  ];
  for (const m of congThuc) {
    const latex = ommlSangLatex(m);
    m.parentNode?.replaceChild(taoRunChu(doc, `$${latex}$`), m);
    soCongThuc++;
  }

  // 3. MathType (đối tượng OLE "Equation.*"): không đọc được, đánh dấu để GV nhập lại.
  const mathType: { stt: number; nguCanh: string }[] = [];
  for (const ole of Array.from(doc.getElementsByTagName("o:OLEObject"))) {
    if (!/^Equation\./i.test(ole.getAttribute("ProgID") ?? "")) continue;
    const run = timCha(ole, "r");
    if (!run) continue;
    const stt = mathType.length + 1;
    mathType.push({ stt, nguCanh: vanBanDoan(timCha(run, "p")).slice(0, 120) });
    run.parentNode?.replaceChild(taoRunChu(doc, `⟦MathType ${stt}⟧`), run);
  }

  // 4. Ảnh: ghi kích thước hiển thị (wp:extent, EMU) vào mô tả ảnh để khi xuất giữ đúng cỡ ảnh gốc
  //    (mammoth chỉ giữ dữ liệu ảnh và mô tả).
  for (const pr of Array.from(doc.getElementsByTagName("wp:docPr"))) {
    const cha = pr.parentNode as Element | null;
    const ext = cha ? Array.from(cha.childNodes).find((c) => c.nodeType === 1 && (c as Element).nodeName === "wp:extent") as Element | undefined : undefined;
    if (!ext) continue;
    const goc = pr.getAttribute("descr") ?? "";
    pr.setAttribute("descr", `${KT_ANH}${ext.getAttribute("cx")}x${ext.getAttribute("cy")}${goc ? `|${goc}` : ""}`);
  }

  return { xml: new XMLSerializer().serializeToString(doc as unknown as Node), soCongThuc, mathType, soDoanDoiMa };
}

/** Nhường luồng một nhịp để giao diện kịp vẽ lại tiến độ. */
export const nhuong = () => new Promise<void>((r) => setTimeout(r, 0));

export async function docDocx(duLieu: ArrayBuffer | Uint8Array, baoTienDo?: BaoTienDo, styleMap?: string[]): Promise<KetQuaDocx> {
  baoTienDo?.("giai_nen");
  await nhuong();
  const zip = new PizZip(duLieu);
  const docFile = zip.file("word/document.xml");
  if (!docFile) throw new Error("File không đúng định dạng .docx.");
  baoTienDo?.("doi_ma");
  await nhuong();
  const ket = tienXuLyDocument(docFile.asText(), zip.file("word/styles.xml")?.asText());
  zip.file("word/document.xml", ket.xml);
  baoTienDo?.("chuyen_html");
  await nhuong();
  const moi = zip.generate({ type: "uint8array" });
  // Bản Node của mammoth đọc "buffer", bản trình duyệt đọc "arrayBuffer".
  const vao = { buffer: moi, arrayBuffer: moi.buffer } as unknown as { buffer: Buffer };
  const { value: html } = await mammoth.convertToHtml(vao, styleMap ? { styleMap } : undefined);
  return { html, soCongThuc: ket.soCongThuc, mathType: ket.mathType, soDoanDoiMa: ket.soDoanDoiMa };
}
