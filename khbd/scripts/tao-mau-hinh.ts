/**
 * Tạo giáo án cũ giả có hình chụp (bảng biến thiên, đồ thị, công thức, bảng số liệu, hình minh họa) để chạy thử
 * tính năng đọc và tạo lại hình: samples/input/toan12_don_dieu_cuc_tri.docx
 * Chạy: npx tsx scripts/tao-mau-hinh.ts
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { Document, ImageRun, Packer, Paragraph, TextRun, AlignmentType } from "docx";
import { veDoThi, diemTuBbt } from "../lib/toan/do-thi";
import { phanTichHam } from "../lib/toan/bang-bien-thien";

const FONT = "DejaVu Serif";
const thoat = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");

/** Bảng biến thiên vẽ tay kiểu sách giáo khoa (ảnh chụp giả). cot: nhãn x; dh: hàng y' (mốc và khoảng xen kẽ); y: [nhãn, cao|thấp]. */
function anhBbt(x: string[], dh: string[], y: { nhan: string; tren: boolean; tc?: [string, boolean, string, boolean] }[], muiTen: ("len" | "xuong")[]): string {
  const W = 520, H = 190, trai = 60, hangX = 36, hangD = 36;
  const n = x.length, buoc = (W - trai - 30) / (n - 1);
  const X = (i: number) => trai + 15 + i * buoc;
  const p: string[] = [`<rect width="${W}" height="${H}" fill="#fff"/>`, `<rect x="1" y="1" width="${W - 2}" height="${H - 2}" fill="none" stroke="#000" stroke-width="1.5"/>`,
    `<line x1="${trai}" y1="0" x2="${trai}" y2="${H}" stroke="#000" stroke-width="1.5"/>`,
    `<line x1="0" y1="${hangX}" x2="${W}" y2="${hangX}" stroke="#000" stroke-width="1.2"/>`,
    `<line x1="0" y1="${hangX + hangD}" x2="${W}" y2="${hangX + hangD}" stroke="#000" stroke-width="1.2"/>`,
    `<text x="${trai / 2}" y="24" text-anchor="middle" font-style="italic">x</text>`,
    `<text x="${trai / 2}" y="${hangX + 24}" text-anchor="middle" font-style="italic">y'</text>`,
    `<text x="${trai / 2}" y="${hangX + hangD + 46}" text-anchor="middle" font-style="italic">y</text>`];
  const yTren = hangX + hangD + 22, yDuoi = H - 12;
  x.forEach((s, i) => p.push(`<text x="${X(i)}" y="24" text-anchor="middle">${thoat(s)}</text>`));
  dh.forEach((s, k) => {
    const xx = k % 2 === 0 ? X(k / 2) : (X((k - 1) / 2) + X((k + 1) / 2)) / 2;
    if (s === "||") p.push(`<line x1="${xx - 2}" y1="${hangX}" x2="${xx - 2}" y2="${H}" stroke="#000"/><line x1="${xx + 2}" y1="${hangX}" x2="${xx + 2}" y2="${H}" stroke="#000"/>`);
    else if (s) p.push(`<text x="${xx}" y="${hangX + 24}" text-anchor="middle">${thoat(s)}</text>`);
  });
  y.forEach((v, i) => {
    if (v.tc) {
      const [t, tTren, ph, pTren] = v.tc;
      p.push(`<text x="${X(i) - 8}" y="${tTren ? yTren : yDuoi}" text-anchor="end">${thoat(t)}</text>`, `<text x="${X(i) + 8}" y="${pTren ? yTren : yDuoi}" text-anchor="start">${thoat(ph)}</text>`);
    } else p.push(`<text x="${X(i)}" y="${v.tren ? yTren : yDuoi}" text-anchor="middle">${thoat(v.nhan)}</text>`);
  });
  muiTen.forEach((m, k) => {
    const x1 = X(k) + (y[k].tc ? 50 : 22), x2 = X(k + 1) - (y[k + 1].tc ? 50 : 22), y1 = m === "len" ? yDuoi - 8 : yTren + 4, y2 = m === "len" ? yTren + 4 : yDuoi - 8;
    const goc = Math.atan2(y2 - y1, x2 - x1);
    const a1 = goc + Math.PI - 0.4, a2 = goc + Math.PI + 0.4;
    p.push(`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#000" stroke-width="1.3"/>`,
      `<path d="M${x2} ${y2} L${x2 + 9 * Math.cos(a1)} ${y2 + 9 * Math.sin(a1)} L${x2 + 9 * Math.cos(a2)} ${y2 + 9 * Math.sin(a2)} Z" fill="#000"/>`);
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" font-family="${FONT}" font-size="17">${p.join("")}</svg>`;
}

function anhCongThuc(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="360" height="70" font-family="${FONT}" font-size="26"><rect width="360" height="70" fill="#fff"/>`
    + `<text x="20" y="45" font-style="italic">y' = 3x</text><text x="122" y="32" font-size="16">2</text><text x="136" y="45">− 6x = 3x(x − 2)</text></svg>`;
}

function anhBang(): string {
  const hang = [["x", "−1", "0", "1", "2", "3"], ["y", "−2", "2", "0", "−2", "2"]];
  const w = 70, h = 40;
  const p = [`<rect width="${w * 6 + 2}" height="${h * 2 + 2}" fill="#fff"/>`];
  hang.forEach((r, i) => r.forEach((o, j) => p.push(`<rect x="${1 + j * w}" y="${1 + i * h}" width="${w}" height="${h}" fill="none" stroke="#000"/>`,
    `<text x="${1 + j * w + w / 2}" y="${1 + i * h + 27}" text-anchor="middle" ${j === 0 ? 'font-style="italic"' : ""}>${o}</text>`)));
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w * 6 + 2}" height="${h * 2 + 2}" font-family="${FONT}" font-size="19">${p.join("")}</svg>`;
}

/** Hình minh họa: tấm bìa cắt góc làm hộp không nắp. */
function anhMinhHoa(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="220" font-family="${FONT}" font-size="15"><rect width="300" height="220" fill="#fff"/>`
    + `<rect x="40" y="20" width="220" height="180" fill="#f3efe4" stroke="#000"/>`
    + [[40, 20], [220, 20], [40, 160], [220, 160]].map(([a, b]) => `<rect x="${a}" y="${b}" width="40" height="40" fill="#fff" stroke="#000" stroke-dasharray="4 3"/>`).join("")
    + `<text x="60" y="15" text-anchor="middle">x</text><text x="150" y="214" text-anchor="middle">12 cm</text></svg>`;
}

const png = async (svg: string, tiLe = 1) => sharp(Buffer.from(svg), { density: 96 * tiLe }).png().toBuffer();
const hinh = async (svg: string, rong: number, cao: number) =>
  new Paragraph({ alignment: AlignmentType.CENTER, children: [new ImageRun({ type: "png", data: await png(svg, 2), transformation: { width: rong, height: cao } })] });
const p = (s: string) => new Paragraph({ children: [new TextRun(s)] });
const dam = (s: string) => new Paragraph({ children: [new TextRun({ text: s, bold: true })] });
const giua = (s: string) => new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: s, bold: true })] });
const dong = (s: string) => new Paragraph({ text: s, bullet: { level: 0 } });

async function main() {
  const ham = "x^3-3x^2+2";
  const doThi = veDoThi(ham, diemTuBbt(phanTichHam(ham), ham));
  const noiDung = [
    giua("KẾ HOẠCH BÀI DẠY"),
    p("Trường: THPT Lê Quý Đôn. Tổ: Toán"),
    p("Môn: Toán. Lớp: 12"),
    giua("BÀI 1. TÍNH ĐƠN ĐIỆU VÀ CỰC TRỊ CỦA HÀM SỐ"),
    p("Thời gian thực hiện: 2 tiết"),
    dam("I. MỤC TIÊU"),
    dam("1. Kiến thức"),
    dong("Nhận biết được tính đồng biến, nghịch biến của hàm số trên một khoảng dựa vào dấu của đạo hàm."),
    dong("Thể hiện được tính đơn điệu, điểm cực trị, giá trị cực trị của hàm số thông qua bảng biến thiên."),
    dam("2. Năng lực"),
    dong("Tư duy và lập luận toán học: lập bảng biến thiên, đọc cực trị từ bảng biến thiên và đồ thị."),
    dam("3. Phẩm chất"),
    dong("Chăm chỉ, cẩn thận khi tính toán."),
    dam("II. THIẾT BỊ DẠY HỌC VÀ HỌC LIỆU"),
    dong("Máy chiếu, phần mềm GeoGebra."),
    dong("Phiếu học tập số 1."),
    dam("III. TIẾN TRÌNH DẠY HỌC"),
    dam("Hoạt động 1: Khởi động"),
    p("a) Mục tiêu: Tạo nhu cầu tìm hiểu tính đơn điệu qua bài toán làm hộp không nắp."),
    p("b) Tổ chức thực hiện: GV nêu bài toán: Từ tấm bìa hình vuông cạnh 12 cm, cắt bốn góc bốn hình vuông cạnh x cm rồi gấp thành hộp không nắp. Với x bằng bao nhiêu thì thể tích hộp lớn nhất?"),
    await hinh(anhMinhHoa(), 200, 147),
    p("HS thảo luận cặp đôi, nêu dự đoán."),
    dam("Hoạt động 2: Hình thành kiến thức mới"),
    p("Ví dụ 1. Xét hàm số y = x^3 - 3x^2 + 2. Tính đạo hàm:"),
    await hinh(anhCongThuc(), 240, 47),
    p("Bảng giá trị của hàm số y = x^3 - 3x^2 + 2:"),
    await hinh(anhBang(), 280, 54),
    p("Bảng biến thiên của hàm số y = x^3 - 3x^2 + 2:"),
    await hinh(anhBbt(["−∞", "0", "2", "+∞"], ["", "+", "0", "−", "0", "+", ""], [{ nhan: "−∞", tren: false }, { nhan: "2", tren: true }, { nhan: "−2", tren: false }, { nhan: "+∞", tren: true }], ["len", "xuong", "len"]), 360, 132),
    p("Kết luận: Hàm số đồng biến trên các khoảng (−∞; 0) và (2; +∞), nghịch biến trên (0; 2); đạt cực đại tại x = 0, cực tiểu tại x = 2."),
    p("Đồ thị của hàm số y = x^3 - 3x^2 + 2:"),
    await hinh(doThi.svg, 300, 250),
    dam("Hoạt động 3: Luyện tập"),
    p("Câu 1. Cho hàm số y = (2x + 1)/(x − 1) có bảng biến thiên như sau. Khẳng định nào đúng?"),
    await hinh(anhBbt(["−∞", "1", "+∞"], ["", "−", "||", "−", ""], [{ nhan: "2", tren: true }, { nhan: "", tren: true, tc: ["−∞", false, "+∞", true] }, { nhan: "2", tren: false }], ["xuong", "xuong"]), 330, 120),
    p("A. Hàm số nghịch biến trên ℝ.   B. Hàm số nghịch biến trên từng khoảng (−∞; 1) và (1; +∞).   C. Hàm số đồng biến trên (1; +∞).   D. Hàm số có cực trị."),
    dam("Hoạt động 4: Vận dụng"),
    p("Giải bài toán làm hộp ở Hoạt động 1: lập hàm thể tích V(x) = x(12 − 2x)^2 với 0 < x < 6, lập bảng biến thiên và kết luận."),
    dam("Củng cố, dặn dò"),
    dong("Nhắc lại các bước xét tính đơn điệu và tìm cực trị."),
    dong("Làm bài tập 1.1 – 1.5 SGK."),
  ];
  const doc = new Document({ sections: [{ children: noiDung }] });
  const duong = path.join(process.cwd(), "samples/input/toan12_don_dieu_cuc_tri.docx");
  fs.writeFileSync(duong, await Packer.toBuffer(doc));
  console.log("Đã ghi", duong);
}

main();
