import type { Course, CourseBlock } from "@/lib/domain/types";
import { scaffoldTopics } from "@/lib/courses/course";

/** Sơ đồ khối if/else (SVG nội tuyến) làm hình minh họa mẫu — không cần tải ảnh từ ngoài. */
const IF_FLOWCHART =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 260" font-family="Arial,sans-serif" font-size="14">
<rect width="420" height="260" fill="#f8fafc"/>
<rect x="150" y="12" width="120" height="34" rx="17" fill="#0e93b0"/><text x="210" y="34" fill="#fff" text-anchor="middle">Bắt đầu</text>
<path d="M210 46 V66" stroke="#334155" stroke-width="2" fill="none"/>
<polygon points="210,66 300,106 210,146 120,106" fill="#fde68a" stroke="#b45309" stroke-width="2"/><text x="210" y="102" text-anchor="middle">đèn == "đỏ"</text><text x="210" y="120" text-anchor="middle" font-size="12">?</text>
<path d="M120 106 H60 V176" stroke="#334155" stroke-width="2" fill="none"/><text x="78" y="98">Đúng</text>
<path d="M300 106 H360 V176" stroke="#334155" stroke-width="2" fill="none"/><text x="312" y="98">Sai</text>
<rect x="10" y="176" width="110" height="38" rx="6" fill="#fecaca" stroke="#dc2626"/><text x="65" y="200" text-anchor="middle">dừng()</text>
<rect x="300" y="176" width="110" height="38" rx="6" fill="#bbf7d0" stroke="#16a34a"/><text x="355" y="200" text-anchor="middle">đi_tiếp()</text>
<text x="210" y="248" text-anchor="middle" fill="#475569" font-size="12">Sơ đồ khối câu lệnh if/else</text>
</svg>`);

const IF_BLOCKS: CourseBlock[] = [
  {
    id: "seed-cb-if-1",
    kind: "text",
    title: "Nội dung kiến thức",
    required: true,
    body: `Câu lệnh rẽ nhánh cho phép chương trình chọn việc cần làm dựa trên một điều kiện.

Cú pháp:
if <điều kiện>:
    <các lệnh khi điều kiện Đúng>
else:
    <các lệnh khi điều kiện Sai>

- Điều kiện là biểu thức cho kết quả True hoặc False, ví dụ den == "do" hay do_am < 40.
- Các lệnh bên trong if/else phải thụt lề như nhau (thường 4 dấu cách).
- Dùng elif khi có nhiều hơn hai trường hợp, ví dụ đèn xanh, vàng, đỏ.`,
  },
  { id: "seed-cb-if-2", kind: "media", title: "Sơ đồ khối câu lệnh if/else", required: false, mediaUrl: IF_FLOWCHART, body: "Quan sát hai nhánh Đúng/Sai trước khi viết chương trình." },
  { id: "seed-cb-if-3", kind: "simulation", title: "Mô phỏng Thành phố giao thông", required: true, labSlug: "smart-coding-city", body: "Quan sát xe dừng khi đèn đỏ và đi khi đèn xanh. Chuyển sang chế độ thủ công và tự điều khiển đèn cho 12 lượt xe qua an toàn." },
  { id: "seed-cb-if-4", kind: "python", title: "Bài thực hành Python: Xếp loại học tập", required: true, exerciseId: "if-grade", body: "Viết chương trình dùng if/elif/else. Bấm Kiểm thử, đạt tất cả trường hợp là hoàn thành." },
  { id: "seed-cb-if-5", kind: "practice", title: "Bài luyện tập cuối bài", required: true, practiceSetId: "if-basic", minScore: 70, body: "Làm bộ câu hỏi, đạt từ 70% trở lên là hoàn thành." },
];

/** Khóa học mẫu của cô Hà cho 10A1: khung theo chương trình, bài "Câu lệnh rẽ nhánh" có đủ các loại nội dung. */
export function seedCourses(createdAt: string): Course[] {
  let n = 0;
  const topics = scaffoldTopics(10, "kntt").map((t, ti) => ({
    ...t,
    id: `seed-ct-${ti}`,
    lessons: t.lessons.map((l) => {
      n++;
      const isIf = l.lessonId === "L-10-if-kntt";
      return {
        ...l,
        id: isIf ? "seed-cl-if" : `seed-cl-${n}`,
        title: isIf ? "Câu lệnh rẽ nhánh" : l.title,
        blocks: isIf ? IF_BLOCKS : l.blocks.map((b, bi) => ({ ...b, id: `seed-cb-${n}-${bi}` })),
      };
    }),
  }));
  return [
    {
      id: "course-10-kntt",
      ownerId: "t1",
      title: "Tin học lớp 10",
      description: "Khóa học theo bộ Kết nối tri thức. Bài Câu lệnh rẽ nhánh có đủ kiến thức, sơ đồ, mô phỏng Thành phố giao thông, thực hành Python và luyện tập.",
      grade: 10,
      textbookId: "kntt",
      topics,
      sequential: false,
      classIds: ["c-10a1"],
      status: "published",
      createdAt,
      updatedAt: createdAt,
    },
  ];
}
