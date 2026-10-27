/**
 * Tạo templates/mau.docx: Styles theo thể thức trình bày của dự án và thẻ docxtemplater.
 * Định dạng chỉ nằm ở Styles; code chỉ gắn tên style. Chạy: npx tsx scripts/tao-mau-word.ts
 */
import fs from "node:fs";
import path from "node:path";
import PizZip from "pizzip";

const W = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math"';
const TNR = '<w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:eastAsia="Times New Roman" w:cs="Times New Roman"/>';

const kieu = (id: string, ten: string, pPr: string, rPr: string, loai = "paragraph", them = "") =>
  `<w:style w:type="${loai}" w:styleId="${id}"${id === "Normal" ? ' w:default="1"' : ""}><w:name w:val="${ten}"/>${id !== "Normal" && loai === "paragraph" ? '<w:basedOn w:val="Normal"/>' : ""}${them}<w:qFormat/><w:pPr>${pPr}</w:pPr><w:rPr>${rPr}</w:rPr></w:style>`;

const styles = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles ${W}>
<w:docDefaults>
  <w:rPrDefault><w:rPr>${TNR}<w:color w:val="000000"/><w:sz w:val="26"/><w:szCs w:val="26"/><w:lang w:val="vi-VN"/></w:rPr></w:rPrDefault>
  <w:pPrDefault><w:pPr><w:spacing w:before="0" w:after="60" w:line="276" w:lineRule="auto"/><w:jc w:val="both"/></w:pPr></w:pPrDefault>
</w:docDefaults>
${kieu("Normal", "Normal", "", "")}
${kieu("TieuDeMon", "Tieu de mon", '<w:jc w:val="center"/><w:spacing w:after="60"/>', "<w:b/>")}
${kieu("TenBai", "Ten bai", '<w:jc w:val="center"/><w:spacing w:before="60" w:after="120"/>', '<w:b/><w:caps/><w:sz w:val="28"/><w:szCs w:val="28"/>')}
${kieu("Muc1", "Muc lon", '<w:keepNext/><w:spacing w:before="120" w:after="60"/><w:jc w:val="left"/>', "<w:b/><w:caps/>")}
${kieu("Muc2", "Muc con", '<w:keepNext/><w:spacing w:before="60" w:after="60"/><w:jc w:val="left"/>', "<w:b/>")}
${kieu("TenHoatDong", "Ten hoat dong", '<w:keepNext/><w:spacing w:before="120" w:after="60"/><w:jc w:val="left"/>', "<w:b/>")}
${kieu("ListBullet", "List Bullet", '<w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr><w:ind w:left="284" w:hanging="284"/>', "")}
${kieu("ListBullet2", "List Bullet 2", '<w:numPr><w:ilvl w:val="1"/><w:numId w:val="1"/></w:numPr><w:ind w:left="567" w:hanging="283"/>', "")}
${kieu("BangChu", "Chu trong bang", '<w:spacing w:before="20" w:after="20" w:line="240" w:lineRule="auto"/><w:jc w:val="left"/>', '<w:sz w:val="24"/><w:szCs w:val="24"/>')}
${kieu("BangTieuDe", "Tieu de bang", '<w:spacing w:before="20" w:after="20" w:line="240" w:lineRule="auto"/><w:jc w:val="center"/>', '<w:b/><w:sz w:val="24"/><w:szCs w:val="24"/>')}
<w:style w:type="table" w:styleId="BangKeKhung"><w:name w:val="Bang ke khung"/><w:tblPr>
  <w:tblBorders>${["top", "left", "bottom", "right", "insideH", "insideV"].map((b) => `<w:${b} w:val="single" w:sz="4" w:space="0" w:color="000000"/>`).join("")}</w:tblBorders>
  <w:tblCellMar><w:top w:w="40" w:type="dxa"/><w:left w:w="100" w:type="dxa"/><w:bottom w:w="40" w:type="dxa"/><w:right w:w="100" w:type="dxa"/></w:tblCellMar>
</w:tblPr></w:style>
</w:styles>`;

const muc = (ilvl: number, chu: string, trai: number) =>
  `<w:lvl w:ilvl="${ilvl}"><w:start w:val="1"/><w:numFmt w:val="bullet"/><w:lvlText w:val="${chu}"/><w:lvlJc w:val="left"/><w:pPr><w:ind w:left="${trai}" w:hanging="${ilvl ? 283 : 284}"/></w:pPr><w:rPr>${TNR}</w:rPr></w:lvl>`;
const numbering = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:numbering ${W}><w:abstractNum w:abstractNumId="0"><w:multiLevelType w:val="hybridMultilevel"/>${muc(0, "-", 284)}${muc(1, "+", 567)}</w:abstractNum><w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num></w:numbering>`;

const p = (style: string, chu: string) => `<w:p><w:pPr><w:pStyle w:val="${style}"/></w:pPr><w:r><w:t xml:space="preserve">${chu}</w:t></w:r></w:p>`;
const the = (chu: string) => `<w:p><w:r><w:t xml:space="preserve">${chu}</w:t></w:r></w:p>`;

const than = [
  the("{#cheDoMoi}"),
  p("TieuDeMon", "MÔN {monHoa} – LỚP {lop}"),
  p("TenBai", "{tenBai} ({soTiet} TIẾT)"),
  "{@phuongAn}",
  p("Muc1", "I. MỤC TIÊU"),
  p("Muc2", "1. Kiến thức, kĩ năng"),
  "{@kienThuc}",
  p("Muc2", "2. Năng lực"),
  "{@nangLuc}",
  p("Muc2", "3. Phẩm chất"),
  "{@phamChat}",
  p("Muc1", "II. THIẾT BỊ DẠY HỌC VÀ HỌC LIỆU"),
  "{@thietBi}",
  p("Muc1", "III. TIẾN TRÌNH DẠY HỌC"),
  the("{#coGd1}"),
  p("Muc2", "GIAI ĐOẠN 1: TỰ HỌC Ở NHÀ TRƯỚC TIẾT HỌC"),
  "{@gd1}",
  the("{/coGd1}"),
  the("{#coGd2}"),
  p("Muc2", "GIAI ĐOẠN 2: HOẠT ĐỘNG TRÊN LỚP"),
  the("{/coGd2}"),
  "{@tienTrinh}",
  the("{#coGd3}"),
  p("Muc2", "GIAI ĐOẠN 3: KIỂM SOÁT, ĐÁNH GIÁ VÀ ĐIỀU CHỈNH SAU GIỜ HỌC"),
  "{@gd3}",
  the("{/coGd3}"),
  the("{/cheDoMoi}"),
  the("{#cheDoCu}"),
  "{@noiDungCu}",
  the("{/cheDoCu}"),
  the("{#coPhuLuc}"),
  p("Muc1", "{soPhuLuc}. PHỤ LỤC ĐÁNH GIÁ SẢN PHẨM"),
  "{@phuLuc}",
  the("{/coPhuLuc}"),
  the("{#coMaTran}"),
  // Nửa câu theo điều kiện: chỉ có "VÀ NĂNG LỰC AI" khi GV chọn tích hợp AI.
  p("Muc1", "{soMaTran}. MA TRẬN TÍCH HỢP {tenMaTran}{#coAi} VÀ NĂNG LỰC AI{/coAi}"),
  "{@maTran}",
  the("{/coMaTran}"),
  the("{#coTiengAnh}"),
  p("Muc1", "{soTiengAnh}. PHỤ LỤC TIẾNG ANH (ENGLISH APPENDIX)"),
  "{@tiengAnh}",
  the("{/coTiengAnh}"),
].map((x) => (x.startsWith("{@") ? `<w:p><w:r><w:t>${x}</w:t></w:r></w:p>` : x));

const document = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document ${W}><w:body>${than.join("")}
<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="850" w:bottom="1134" w:left="1701" w:header="567" w:footer="567" w:gutter="0"/></w:sectPr>
</w:body></w:document>`;

const zip = new PizZip();
zip.file("[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/><Override PartName="/word/settings.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml"/></Types>`);
zip.file("_rels/.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`);
zip.file("word/_rels/document.xml.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering" Target="numbering.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings" Target="settings.xml"/></Relationships>`);
zip.file("word/settings.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:settings ${W}><w:defaultTabStop w:val="720"/><m:mathPr><m:mathFont m:val="Cambria Math"/></m:mathPr><w:compat><w:compatSetting w:name="compatibilityMode" w:uri="http://schemas.microsoft.com/office/word" w:val="15"/></w:compat></w:settings>`);
zip.file("word/styles.xml", styles);
zip.file("word/numbering.xml", numbering);
zip.file("word/document.xml", document);

const ra = path.join(process.cwd(), "templates/mau.docx");
fs.writeFileSync(ra, zip.generate({ type: "nodebuffer" }));
console.log("Đã ghi", ra);
