/**
 * Mục lục SGK Tin học 10, 11, 12 bộ "Kết nối tri thức với cuộc sống" (NXB Giáo dục Việt Nam).
 * Lớp 11, 12 hiện chỉ gồm phần chung cho mọi học sinh; phần theo định hướng Tin học ứng dụng (ICT)
 * và Khoa học máy tính (CS) bổ sung sau khi đối chiếu sách.
 * `key` nối bài SGK với bài tương tác sẵn có trong EduNova (BASE_LESSONS.key), nếu có.
 */
import type { Grade } from "@/lib/domain/types";
import { LAB_TEMPLATES } from "./labs";
import { lessonId } from "./curriculum";

export interface SgkLesson {
  no: number;
  title: string;
  key?: string;
}
export interface SgkTopic {
  no: number;
  title: string;
  lessons: SgkLesson[];
}

const L = (no: number, title: string, key?: string): SgkLesson => ({ no, title, ...(key ? { key } : {}) });

export const SGK_KNTT: Record<Grade, SgkTopic[]> = {
  10: [
    { no: 1, title: "Máy tính và xã hội tri thức", lessons: [L(1, "Thông tin và xử lí thông tin"), L(2, "Vai trò của thiết bị thông minh và tin học đối với xã hội"), L(3, "Một số kiểu dữ liệu và dữ liệu văn bản"), L(4, "Hệ nhị phân và dữ liệu số nguyên", "10-binary"), L(5, "Dữ liệu lôgic", "10-binary"), L(6, "Dữ liệu âm thanh và hình ảnh"), L(7, "Thực hành sử dụng thiết bị số thông dụng")] },
    { no: 2, title: "Mạng máy tính và Internet", lessons: [L(8, "Mạng máy tính trong cuộc sống hiện đại"), L(9, "An toàn trên không gian mạng", "10-safety"), L(10, "Thực hành khai thác tài nguyên trên Internet")] },
    { no: 3, title: "Đạo đức, pháp luật và văn hoá trong môi trường số", lessons: [L(11, "Ứng xử trên môi trường số. Nghĩa vụ tôn trọng bản quyền", "10-safety")] },
    { no: 4, title: "Ứng dụng tin học", lessons: [L(12, "Phần mềm thiết kế đồ hoạ"), L(13, "Bổ sung các đối tượng đồ hoạ"), L(14, "Làm việc với đối tượng đường và văn bản"), L(15, "Hoàn thiện hình ảnh đồ hoạ")] },
    {
      no: 5,
      title: "Giải quyết vấn đề với sự trợ giúp của máy tính",
      lessons: [
        L(16, "Ngôn ngữ lập trình bậc cao và Python"), L(17, "Biến và lệnh gán", "10-variables"), L(18, "Các lệnh vào ra đơn giản"), L(19, "Câu lệnh rẽ nhánh if", "10-if"),
        L(20, "Câu lệnh lặp for", "10-loop"), L(21, "Câu lệnh lặp while", "10-loop"), L(22, "Kiểu dữ liệu danh sách"), L(23, "Một số lệnh làm việc với dữ liệu danh sách"),
        L(24, "Xâu kí tự"), L(25, "Một số lệnh làm việc với xâu kí tự"), L(26, "Hàm trong Python", "10-loop"), L(27, "Tham số của hàm"), L(28, "Phạm vi của biến"),
        L(29, "Nhận biết lỗi chương trình", "10-debug"), L(30, "Kiểm thử và gỡ lỗi chương trình", "10-debug"), L(31, "Thực hành viết chương trình đơn giản"), L(32, "Ôn tập lập trình Python"),
      ],
    },
    { no: 6, title: "Hướng nghiệp với tin học", lessons: [L(33, "Nghề thiết kế đồ hoạ máy tính"), L(34, "Nghề phát triển phần mềm")] },
  ],
  11: [
    { no: 1, title: "Máy tính và xã hội tri thức", lessons: [L(1, "Hệ điều hành", "11-os"), L(2, "Thực hành sử dụng hệ điều hành", "11-os"), L(3, "Phần mềm nguồn mở và phần mềm chạy trên Internet"), L(4, "Bên trong máy tính", "11-hardware"), L(5, "Kết nối máy tính với các thiết bị số")] },
    { no: 2, title: "Tổ chức lưu trữ, tìm kiếm và trao đổi thông tin", lessons: [L(6, "Lưu trữ và chia sẻ tệp tin trên Internet"), L(7, "Thực hành tìm kiếm thông tin trên Internet"), L(8, "Thực hành nâng cao sử dụng thư điện tử và mạng xã hội")] },
    { no: 3, title: "Đạo đức, pháp luật và văn hoá trong môi trường số", lessons: [L(9, "Giao tiếp an toàn trên Internet")] },
    { no: 4, title: "Giới thiệu các hệ cơ sở dữ liệu", lessons: [L(10, "Lưu trữ dữ liệu và khai thác thông tin phục vụ quản lí"), L(11, "Cơ sở dữ liệu", "11-db"), L(12, "Hệ quản trị cơ sở dữ liệu và hệ cơ sở dữ liệu"), L(13, "Cơ sở dữ liệu quan hệ", "11-db"), L(14, "SQL – Ngôn ngữ truy vấn có cấu trúc", "11-sql"), L(15, "Bảo mật và an toàn hệ cơ sở dữ liệu")] },
    { no: 5, title: "Hướng nghiệp với tin học", lessons: [L(16, "Công việc quản trị cơ sở dữ liệu")] },
  ],
  12: [
    { no: 1, title: "Máy tính và xã hội tri thức", lessons: [L(1, "Làm quen với trí tuệ nhân tạo", "12-ai"), L(2, "Trí tuệ nhân tạo trong khoa học và đời sống", "12-ai")] },
    { no: 2, title: "Mạng máy tính và Internet", lessons: [L(3, "Một số thiết bị mạng thông dụng", "12-network"), L(4, "Giao thức mạng", "12-network"), L(5, "Thực hành chia sẻ tài nguyên trên mạng")] },
    { no: 3, title: "Đạo đức, pháp luật và văn hoá trong môi trường số", lessons: [L(6, "Giao tiếp và ứng xử trong không gian số", "12-citizen")] },
    {
      no: 4,
      title: "Giải quyết vấn đề với sự trợ giúp của máy tính",
      lessons: [
        L(7, "HTML và cấu trúc trang web", "12-web"), L(8, "Định dạng văn bản"), L(9, "Tạo danh sách, bảng"), L(10, "Tạo liên kết"), L(11, "Chèn tệp tin đa phương tiện và khung nội tuyến vào trang web"),
        L(12, "Tạo biểu mẫu"), L(13, "Khái niệm, vai trò của CSS", "12-web"), L(14, "Định dạng văn bản bằng CSS"), L(15, "Tạo màu cho chữ và nền"), L(16, "Định dạng khung"),
        L(17, "Các mức ưu tiên của bộ chọn"), L(18, "Thực hành tổng hợp thiết kế trang web"),
      ],
    },
    { no: 5, title: "Hướng nghiệp với tin học", lessons: [L(19, "Dịch vụ sửa chữa và bảo trì máy tính"), L(20, "Nhóm nghề quản trị thuộc ngành công nghệ thông tin"), L(21, "Hội thảo hướng nghiệp")] },
  ],
};

/** Id bài tương tác EduNova (bộ KNTT) gắn với bài SGK, nếu có. */
export function sgkLessonId(l: SgkLesson): string | undefined {
  return l.key ? lessonId(l.key, "kntt") : undefined;
}

/** Mô phỏng trong kho gắn với bài SGK (qua bài tương tác tương ứng). */
export function sgkLabs(l: SgkLesson) {
  const id = sgkLessonId(l);
  return id ? LAB_TEMPLATES.filter((lab) => lab.textbookMapping.some((m) => m.lessonIds.includes(id))) : [];
}

export function sgkCount(grade: Grade) {
  const lessons = SGK_KNTT[grade].flatMap((t) => t.lessons);
  return { topics: SGK_KNTT[grade].length, lessons: lessons.length, linked: lessons.filter((l) => l.key).length };
}

/** Mã bài SGK dùng chung trong ứng dụng: "lớp-số bài", vd "10-19". */
export const sgkRef = (grade: Grade, l: SgkLesson) => `${grade}-${l.no}`;

export function findSgk(ref: string): { grade: Grade; topic: SgkTopic; lesson: SgkLesson } | undefined {
  const [g, n] = ref.split("-").map(Number);
  if (g !== 10 && g !== 11 && g !== 12) return undefined;
  for (const topic of SGK_KNTT[g]) {
    const lesson = topic.lessons.find((l) => l.no === n);
    if (lesson) return { grade: g, topic, lesson };
  }
  return undefined;
}

/** Bài SGK đầu tiên gắn với một bài tương tác (key), vd "10-if" → "10-19". */
export function sgkRefForKey(key: string): string | undefined {
  for (const g of [10, 11, 12] as Grade[]) {
    for (const t of SGK_KNTT[g]) {
      const l = t.lessons.find((x) => x.key === key);
      if (l) return sgkRef(g, l);
    }
  }
  return undefined;
}

/** Mọi bài SGK gắn với một bài tương tác (key), vd "10-loop" → ["10-20", "10-21", "10-26"]. */
export function sgkRefsForKey(key: string): string[] {
  return ([10, 11, 12] as Grade[]).flatMap((g) => SGK_KNTT[g].flatMap((t) => t.lessons.filter((l) => l.key === key).map((l) => sgkRef(g, l))));
}
