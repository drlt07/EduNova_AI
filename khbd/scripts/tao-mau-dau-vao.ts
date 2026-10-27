/**
 * Tạo 4 giáo án cũ giả (khung 5 hoạt động kiểu cũ) để chạy thử: samples/input/*.docx
 * Chạy: npx tsx scripts/tao-mau-dau-vao.ts
 */
import fs from "node:fs";
import path from "node:path";
import {
  AlignmentType, Document, Math as MathBlock, MathFraction, MathRadical, MathRun, MathSubScript,
  MathSuperScript, Packer, Paragraph, Table, TableCell, TableRow, TextRun, WidthType,
} from "docx";
import { unicodeSangTcvn3 } from "../lib/pipeline/1-tai-len/ma-hoa";

type Phan = string | TextRun | MathBlock;

const p = (...phan: Phan[]) =>
  new Paragraph({ children: phan.map((x) => (typeof x === "string" ? new TextRun(x) : x)) });
const dam = (s: string) => new Paragraph({ children: [new TextRun({ text: s, bold: true })] });
const giua = (s: string) =>
  new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: s, bold: true })] });
const dong = (s: string) => new Paragraph({ text: s, bullet: { level: 0 } });
const m = (...c: (MathRun | MathFraction | MathSuperScript | MathSubScript | MathRadical)[]) =>
  new MathBlock({ children: c });
const r = (s: string) => new MathRun(s);
const mu = (co: string, so: string) => new MathSuperScript({ children: [r(co)], superScript: [r(so)] });
const chiSo = (co: string, so: string) => new MathSubScript({ children: [r(co)], subScript: [r(so)] });
const hoa = (...phan: (string | [string])[]) =>
  phan.map((x) => (typeof x === "string" ? new TextRun(x) : new TextRun({ text: x[0], subScript: true })));

function bang(hang: string[][]) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: hang.map(
      (h, i) =>
        new TableRow({
          children: h.map(
            (o) => new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: o, bold: i === 0 })] })] }),
          ),
        }),
    ),
  });
}

function toan10() {
  return [
    giua("KẾ HOẠCH BÀI DẠY"),
    p("Trường: THPT Nguyễn Trãi. Tổ: Toán – Tin"),
    p("Môn: Toán. Lớp: 10"),
    giua("BÀI 3. BẤT PHƯƠNG TRÌNH BẬC HAI MỘT ẨN"),
    p("Thời gian thực hiện: 2 tiết"),
    dam("I. MỤC TIÊU"),
    dam("1. Kiến thức"),
    dong("Giải được bất phương trình bậc hai một ẩn."),
    p("- Nhận biết được bất phương trình bậc hai một ẩn có dạng ", m(r("a"), mu("x", "2"), r("+bx+c>0")), "."),
    dong("Vận dụng được bất phương trình bậc hai một ẩn vào giải quyết bài toán thực tiễn."),
    dam("2. Năng lực"),
    dong("Tư duy và lập luận toán học: xét dấu tam thức bậc hai để tìm tập nghiệm."),
    dong("Mô hình hóa toán học: chuyển bài toán lợi nhuận thành bất phương trình bậc hai."),
    dam("3. Phẩm chất"),
    dong("Chăm chỉ, trung thực khi báo cáo kết quả."),
    dam("II. THIẾT BỊ DẠY HỌC VÀ HỌC LIỆU"),
    dong("Máy chiếu, phần mềm GeoGebra."),
    dong("Phiếu học tập số 1, số 2."),
    dam("III. TIẾN TRÌNH DẠY HỌC"),
    dam("Hoạt động 1: Khởi động"),
    p("a) Mục tiêu: Tạo nhu cầu tìm hiểu cách giải bất phương trình bậc hai."),
    p("b) Tổ chức thực hiện: GV nêu bài toán: Một cửa hàng bán x sản phẩm thì lợi nhuận là ",
      m(r("P(x)=-"), mu("x", "2"), r("+40x-300")), " (nghìn đồng). Bán bao nhiêu sản phẩm thì cửa hàng có lãi?"),
    p("HS thảo luận cặp đôi, nêu dự đoán."),
    dam("Hoạt động 2: Hình thành kiến thức mới"),
    p("GV giới thiệu định nghĩa bất phương trình bậc hai một ẩn và cách giải bằng xét dấu tam thức bậc hai."),
    p("Ví dụ 1: Giải bất phương trình ", m(mu("x", "2"), r("-5x+6≤0")), "."),
    p("Lời giải: Tam thức có hai nghiệm ", m(chiSo("x", "1"), r("=2")), " và ", m(chiSo("x", "2"), r("=3")),
      ". Tập nghiệm ", m(r("S=[2;3]")), "."),
    p("Ví dụ 2: Tìm tập xác định của hàm số ",
      m(r("y="), new MathRadical({ children: [r("-"), mu("x", "2"), r("+4x-3")] })), "."),
    dam("Hoạt động 3: Luyện tập"),
    p("Câu 1. Tập nghiệm của bất phương trình ", m(mu("x", "2"), r("-4>0")), " là"),
    p("A. (−2; 2)   B. (−∞; −2) ∪ (2; +∞)   C. [−2; 2]   D. ℝ"),
    p("Câu 2. Giải bất phương trình ", m(new MathFraction({ numerator: [r("1")], denominator: [r("2")] }), mu("x", "2"), r("-x-4<0")), "."),
    dam("Hoạt động 4: Vận dụng"),
    p("Giải bài toán lợi nhuận ở Hoạt động 1. HS làm theo nhóm 4, trình bày trên bảng phụ."),
    dam("Củng cố, dặn dò"),
    dong("Nhắc lại các bước giải bất phương trình bậc hai."),
    dong("Làm bài tập 6.15, 6.16 SGK."),
  ];
}

function lichSu11() {
  const tcvn = (s: string) =>
    new Paragraph({ children: [new TextRun({ text: unicodeSangTcvn3(s), font: ".VnTime" })] });
  return [
    p("Môn: Lịch sử – Lớp 11"),
    giua("BÀI 7. KHÁI QUÁT VỀ CHIẾN TRANH BẢO VỆ TỔ QUỐC TRONG LỊCH SỬ VIỆT NAM"),
    p("Số tiết: 3"),
    dam("I. MỤC TIÊU"),
    dam("1. Kiến thức"),
    dong("Nêu được vai trò, ý nghĩa của chiến tranh bảo vệ Tổ quốc trong lịch sử Việt Nam."),
    dong("Giải thích được nguyên nhân thắng lợi của các cuộc kháng chiến chống ngoại xâm."),
    dam("2. Kĩ năng"),
    dong("Khai thác tư liệu lịch sử, lập bảng thống kê."),
    dam("3. Thái độ"),
    dong("Trân trọng truyền thống yêu nước, đấu tranh chống ngoại xâm của dân tộc."),
    dam("II. THIẾT BỊ DẠY HỌC VÀ HỌC LIỆU"),
    dong("Lược đồ các cuộc kháng chiến tiêu biểu."),
    dong("Tư liệu: trích Hịch tướng sĩ của Trần Quốc Tuấn."),
    dam("III. TIẾN TRÌNH DẠY HỌC"),
    dam("Hoạt động 1: Mở đầu"),
    p("GV cho HS xem hình ảnh tượng đài Trần Hưng Đạo và hỏi: Em biết gì về nhân vật này?"),
    dam("Hoạt động 2: Hình thành kiến thức mới"),
    p("Tư liệu 1:"),
    tcvn("“Ta thường tới bữa quên ăn, nửa đêm vỗ gối; ruột đau như cắt, nước mắt đầm đìa…”"),
    p("GV yêu cầu HS hoàn thành bảng sau:"),
    bang([
      ["Cuộc kháng chiến", "Thời gian", "Người lãnh đạo", "Kết quả"],
      ["Kháng chiến chống Tống lần thứ hai", "1075 – 1077", "Lý Thường Kiệt", "Thắng lợi"],
      ["Ba lần kháng chiến chống Mông – Nguyên", "1258 – 1288", "Trần Quốc Tuấn", "Thắng lợi"],
      ["Kháng chiến chống quân Xiêm", "1785", "Nguyễn Huệ", "Thắng lợi"],
    ]),
    dam("Hoạt động 3: Luyện tập"),
    p("Câu 1. Chiến thắng Bạch Đằng năm 1288 gắn với tên tuổi của ai?"),
    p("Câu 2. Vì sao nhân dân ta luôn giành thắng lợi trong các cuộc chiến tranh bảo vệ Tổ quốc?"),
    dam("Hoạt động 4: Vận dụng"),
    p("Viết đoạn văn khoảng 150 chữ về bài học lịch sử rút ra từ các cuộc kháng chiến bảo vệ Tổ quốc."),
  ];
}

function hoa12() {
  return [
    p("MÔN HÓA HỌC – LỚP 12"),
    giua("BÀI 1. ESTER – LIPID (1 tiết)"),
    dam("I. MỤC TIÊU"),
    dam("1. Kiến thức"),
    dong("Nêu được khái niệm, công thức chung của ester."),
    dong("Trình bày được tính chất hóa học của ester: phản ứng thủy phân."),
    dam("2. Năng lực"),
    dong("Nhận thức hóa học: viết được phương trình phản ứng thủy phân ester."),
    dam("3. Phẩm chất"),
    dong("Trách nhiệm trong sử dụng hóa chất an toàn."),
    dam("II. THIẾT BỊ DẠY HỌC VÀ HỌC LIỆU"),
    dong("Ống nghiệm, ethyl acetate, dung dịch NaOH, đèn cồn."),
    dam("III. TIẾN TRÌNH DẠY HỌC"),
    dam("1. Hoạt động khởi động"),
    p("GV cho HS ngửi mùi chuối chín và hỏi: chất nào tạo nên mùi thơm này?"),
    dam("2. Hoạt động hình thành kiến thức"),
    p(...hoa("Ester đơn chức no, mạch hở có công thức chung C", ["n"], "H", ["2n"], "O", ["2"], " (n ≥ 2).")),
    p(...hoa("Phản ứng thủy phân trong môi trường base: CH", ["3"], "COOC", ["2"], "H", ["5"], " + NaOH → CH", ["3"], "COONa + C", ["2"], "H", ["5"], "OH")),
    p("Phương trình tổng quát: ", m(r("RCOOR' + NaOH → RCOONa + R'OH"))),
    dam("3. Hoạt động luyện tập"),
    p(...hoa("Câu 1. Chất nào sau đây là ester? A. CH", ["3"], "COOH  B. CH", ["3"], "COOCH", ["3"], "  C. C", ["2"], "H", ["5"], "OH  D. CH", ["3"], "CHO")),
    p("Câu 2. Thủy phân hoàn toàn 8,8 gam ethyl acetate trong dung dịch NaOH dư. Tính khối lượng muối thu được."),
    dam("4. Hoạt động vận dụng"),
    p("Giải thích vì sao xà phòng được sản xuất từ chất béo và dung dịch kiềm."),
  ];
}

function tin10() {
  return [
    giua("KẾ HOẠCH BÀI DẠY"),
    p("Môn: Tin học. Lớp: 10"),
    giua("BÀI 17. BIẾN VÀ LỆNH GÁN"),
    p("Thời gian thực hiện: 2 tiết"),
    dam("I. MỤC TIÊU"),
    dam("1. Kiến thức"),
    dong("Biết được khái niệm biến, cách đặt tên biến trong Python."),
    dong("Thực hiện được lệnh gán giá trị cho biến và các phép toán số học trên biến."),
    dam("2. Năng lực"),
    dong("Tự chủ và tự học: tự đọc tài liệu, thử lệnh gán trên máy."),
    dong("Giải quyết vấn đề với sự hỗ trợ của CNTT-TT: viết được chương trình Python dùng biến và lệnh gán để tính toán."),
    dong("Dùng đúng thuật ngữ tiếng Anh variable, assignment, expression khi trình bày."),
    dam("3. Phẩm chất"),
    dong("Chăm chỉ, cẩn thận khi viết và kiểm tra chương trình."),
    dam("II. THIẾT BỊ DẠY HỌC VÀ HỌC LIỆU"),
    dong("Máy tính đã cài Python, máy chiếu."),
    dong("Phiếu học tập: bảng theo dõi giá trị của biến."),
    dam("III. TIẾN TRÌNH DẠY HỌC"),
    dam("Hoạt động 1: Khởi động"),
    p("GV hỏi: Muốn máy tính nhớ điểm kiểm tra của một bạn để tính điểm trung bình thì làm thế nào?"),
    dam("Hoạt động 2: Hình thành kiến thức mới"),
    p("GV giới thiệu biến là tên dùng để lưu giá trị; quy tắc đặt tên biến trong Python."),
    p("Ví dụ: a = 5; b = a + 3; print(b) cho kết quả 8."),
    dam("Hoạt động 3: Luyện tập"),
    p("Câu 1. Tên biến nào sau đây hợp lệ trong Python? A. 2x  B. diem_tb  C. my-var  D. for"),
    p("Câu 2. Sau các lệnh x = 4; x = x * 2 thì x có giá trị bao nhiêu?"),
    dam("Hoạt động 4: Vận dụng"),
    p("HS viết chương trình nhập điểm ba môn, tính và in điểm trung bình; chạy thử với dữ liệu của mình."),
  ];
}

async function ghi(ten: string, noiDung: (Paragraph | Table)[]) {
  const doc = new Document({ sections: [{ children: noiDung }] });
  const duong = path.join(process.cwd(), "samples/input", ten);
  fs.writeFileSync(duong, await Packer.toBuffer(doc));
  console.log("Đã ghi", duong);
}

async function main() {
  await ghi("toan10_bat_phuong_trinh_bac_hai.docx", toan10());
  await ghi("lich_su11_chien_tranh_bao_ve_to_quoc.docx", lichSu11());
  await ghi("hoa12_ester.docx", hoa12());
  await ghi("tin10_bien_va_lenh_gan.docx", tin10());
}

main();
