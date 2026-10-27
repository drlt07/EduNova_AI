import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { docFile, kiemTraFile } from "@khbd/lib/pipeline/1-tai-len";
import { tienXuLyDocument } from "@khbd/lib/pipeline/1-tai-len/docx";

const mau = (ten: string) => fs.readFileSync(path.join(process.cwd(), "samples/input", ten));

describe("đọc file", () => {
  it("Toán 10: công thức Word thành $LaTeX$, giữ in đậm", async () => {
    const kq = await docFile("toan10.docx", mau("toan10_bat_phuong_trinh_bac_hai.docx"));
    expect(kq.html).toContain("$x^{2}-5x+6\\le 0$");
    expect(kq.html).toContain("$y=\\sqrt{-x^{2}+4x-3}$");
    expect(kq.html).toContain("$\\frac{1}{2}x^{2}-x-4&lt;0$");
    expect(kq.html).toContain("<strong>I. MỤC TIÊU</strong>");
  });

  it("Lịch sử 11: giữ bảng, đổi đoạn TCVN3 sang Unicode", async () => {
    const kq = await docFile("ls11.docx", mau("lich_su11_chien_tranh_bao_ve_to_quoc.docx"));
    expect(kq.html).toContain("<table>");
    expect(kq.html).toContain("Ta thường tới bữa quên ăn, nửa đêm vỗ gối");
    expect(kq.canhBao.join(" ")).toContain("TCVN3");
  });

  it("Hóa học 12: giữ chỉ số dưới trong công thức hóa học", async () => {
    const kq = await docFile("hoa12.docx", mau("hoa12_ester.docx"));
    expect(kq.html).toContain("CH<sub>3</sub>COOC<sub>2</sub>H<sub>5</sub>");
  });

  it("từ chối .doc, file quá 20 MB, định dạng khác", () => {
    expect(() => kiemTraFile("giao_an.doc", 1000)).toThrow(/Save As/);
    expect(() => kiemTraFile("giao_an.docx", 21 * 1024 * 1024)).toThrow(/20 MB/);
    expect(() => kiemTraFile("anh.png", 1000)).toThrow(/\.docx hoặc \.pdf/);
    expect(kiemTraFile("Giao_An.PDF", 1000)).toBe("pdf");
  });

  it("đánh dấu công thức MathType để GV nhập lại", () => {
    const xml = `<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:o="urn:schemas-microsoft-com:office:office"><w:body><w:p><w:r><w:t>Tính </w:t></w:r><w:r><w:object><o:OLEObject ProgID="Equation.DSMT4"/></w:object></w:r></w:p></w:body></w:document>`;
    const kq = tienXuLyDocument(xml);
    expect(kq.mathType).toEqual([{ stt: 1, nguCanh: "Tính" }]);
    expect(kq.xml).toContain("⟦MathType 1⟧");
  });
});
