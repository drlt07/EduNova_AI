import { describe, expect, it } from "vitest";
import { DOMParser } from "@xmldom/xmldom";
import { ommlSangLatex } from "@khbd/lib/pipeline/1-tai-len/omml";

const NS = 'xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math"';
const r = (t: string) => `<m:r><m:t>${t}</m:t></m:r>`;
function tex(trong: string): string {
  const doc = new DOMParser().parseFromString(`<m:oMath ${NS}>${trong}</m:oMath>`, "text/xml");
  return ommlSangLatex(doc.documentElement as unknown as Element);
}

describe("OMML → LaTeX", () => {
  it("phân số, lũy thừa, chỉ số", () => {
    expect(tex(`<m:f><m:num>${r("1")}</m:num><m:den>${r("2")}</m:den></m:f>`)).toBe("\\frac{1}{2}");
    expect(tex(`<m:sSup><m:e>${r("x")}</m:e><m:sup>${r("2")}</m:sup></m:sSup>`)).toBe("x^{2}");
    expect(tex(`<m:sSub><m:e>${r("x")}</m:e><m:sub>${r("1")}</m:sub></m:sSub>`)).toBe("x_{1}");
  });
  it("căn bậc hai và căn bậc n", () => {
    expect(tex(`<m:rad><m:radPr><m:degHide m:val="1"/></m:radPr><m:deg/><m:e>${r("x+1")}</m:e></m:rad>`)).toBe("\\sqrt{x+1}");
    expect(tex(`<m:rad><m:deg>${r("3")}</m:deg><m:e>${r("x")}</m:e></m:rad>`)).toBe("\\sqrt[3]{x}");
  });
  it("hệ phương trình dùng cases", () => {
    const he = `<m:d><m:dPr><m:begChr m:val="{"/><m:endChr m:val=""/></m:dPr><m:e><m:eqArr><m:e>${r("x+y=3")}</m:e><m:e>${r("x-y=1")}</m:e></m:eqArr></m:e></m:d>`;
    expect(tex(he)).toBe("\\begin{cases} x+y=3 \\\\ x-y=1 \\end{cases}");
  });
  it("ngoặc, tổng, hàm lượng giác, kí hiệu", () => {
    expect(tex(`<m:d><m:e>${r("a+b")}</m:e></m:d>`)).toBe("\\left(a+b\\right)");
    expect(tex(`<m:nary><m:naryPr><m:chr m:val="∑"/></m:naryPr><m:sub>${r("i=1")}</m:sub><m:sup>${r("n")}</m:sup><m:e>${r("i")}</m:e></m:nary>`)).toBe("\\sum_{i=1}^{n} i");
    expect(tex(`<m:func><m:fName>${r("sin")}</m:fName><m:e>${r("x")}</m:e></m:func>`)).toBe("\\sin x");
    expect(tex(r("x≤2"))).toBe("x\\le 2");
    expect(tex(r("x∈ℝ"))).toBe("x\\in \\mathbb{R}");
  });
  it("vectơ và gạch trên", () => {
    expect(tex(`<m:acc><m:accPr><m:chr m:val="⃗"/></m:accPr><m:e>${r("AB")}</m:e></m:acc>`)).toBe("\\vec{AB}");
    expect(tex(`<m:bar><m:e>${r("AB")}</m:e></m:bar>`)).toBe("\\overline{AB}");
  });
});
