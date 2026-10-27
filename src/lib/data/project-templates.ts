/** Mẫu dự án cho Xưởng dự án. */
import type { Grade } from "@/lib/domain/types";

export type ProjectKind = "python" | "web" | "report";

export interface ProjectTemplate {
  id: string;
  title: string;
  grade: Grade;
  kind: ProjectKind;
  summary: string;
  status: "available" | "planned";
  files: { name: string; content: string }[];
  tasks: string[];
}

export const PROJECT_TEMPLATES: ProjectTemplate[] = [
  {
    id: "smart-home",
    title: "Bộ điều khiển nhà thông minh",
    grade: 10,
    kind: "python",
    summary: "Chương trình Python bật/tắt đèn, quạt theo nhiệt độ và giờ trong ngày.",
    status: "available",
    files: [{ name: "main.py", content: '# Bộ điều khiển nhà thông minh\nnhiet_do = float(input("Nhiệt độ: "))\ngio = int(input("Giờ: "))\n\n# TODO: bật quạt khi nhiệt độ trên 30 độ\n# TODO: bật đèn khi trời tối (từ 18 giờ đến 6 giờ sáng)\n' }],
    tasks: ["Nhập nhiệt độ và giờ", "Viết điều kiện bật/tắt quạt", "Viết điều kiện bật/tắt đèn", "Kiểm thử với ít nhất 4 bộ dữ liệu", "Viết mô tả và bài học rút ra"],
  },
  {
    id: "calculator",
    title: "Máy tính đơn giản",
    grade: 10,
    kind: "python",
    summary: "Nhập hai số và phép toán (+, -, *, /), in kết quả; báo lỗi khi chia cho 0.",
    status: "available",
    files: [{ name: "main.py", content: 'a = float(input("Số thứ nhất: "))\nphep = input("Phép toán (+ - * /): ")\nb = float(input("Số thứ hai: "))\n\n# TODO: dùng if/elif để tính kết quả\n' }],
    tasks: ["Nhập hai số và phép toán", "Xử lý 4 phép toán bằng if/elif", "Báo lỗi khi chia cho 0", "Báo lỗi khi phép toán không hợp lệ", "Kiểm thử từng phép toán"],
  },
  {
    id: "club-website",
    title: "Website câu lạc bộ",
    grade: 12,
    kind: "web",
    summary: "Trang web giới thiệu câu lạc bộ Tin học bằng HTML/CSS.",
    status: "available",
    files: [
      { name: "index.html", content: "<h1>CLB Tin học</h1>\n<p>Giới thiệu ngắn về câu lạc bộ.</p>\n<h2>Hoạt động</h2>\n<ul>\n  <li>Lập trình Python</li>\n</ul>\n" },
      { name: "style.css", content: "body { font-family: sans-serif; padding: 16px; }\nh1 { color: #0e7490; }\n" },
    ],
    tasks: ["Phần đầu trang với tên câu lạc bộ", "Mục giới thiệu và hoạt động", "Bảng lịch sinh hoạt", "Định dạng màu sắc, phông chữ bằng CSS", "Kiểm tra hiển thị trên điện thoại"],
  },
  {
    id: "ai-report",
    title: "Báo cáo thử nghiệm AI",
    grade: 12,
    kind: "report",
    summary: "Thực hiện một thử nghiệm dữ liệu nhỏ và báo cáo giới hạn của mô hình.",
    status: "available",
    files: [{ name: "bao-cao.txt", content: "1. Câu hỏi nghiên cứu:\n\n2. Dữ liệu sử dụng:\n\n3. Cách thử nghiệm:\n\n4. Kết quả:\n\n5. Giới hạn và thiên lệch có thể có:\n\n6. Bài học rút ra:\n" }],
    tasks: ["Đặt câu hỏi nghiên cứu", "Mô tả dữ liệu", "Ghi lại kết quả thử nghiệm", "Phân tích giới hạn, thiên lệch", "Kết luận"],
  },
  {
    id: "library-db",
    title: "Cơ sở dữ liệu thư viện",
    grade: 11,
    kind: "report",
    summary: "Thiết kế bảng, khóa chính, khóa ngoài cho hệ thống mượn trả sách.",
    status: "planned",
    files: [],
    tasks: [],
  },
];

export const getTemplate = (id: string) => PROJECT_TEMPLATES.find((t) => t.id === id);
