/**
 * Dữ liệu chương trình KHỞI TẠO MINH HỌA theo khung GDPT 2018 – Tin học THPT.
 * Tên bài, thứ tự và yêu cầu cần đạt CHƯA được thẩm định với sách giáo khoa thực tế:
 * mọi bản ghi có curriculumVerified = false cho tới khi giáo viên/admin xác nhận.
 */
import type { Chapter, Grade, Lesson, Objective, Pathway, QuizQuestion, Textbook, TextbookId, Topic } from "@/lib/domain/types";

export const TEXTBOOKS: Textbook[] = [
  { id: "kntt", name: "Kết nối tri thức với cuộc sống", short: "KNTT", publisher: "NXB Giáo dục Việt Nam" },
  { id: "cd", name: "Cánh Diều", short: "Cánh Diều", publisher: "NXB Đại học Sư phạm" },
  { id: "ctst", name: "Chân trời sáng tạo", short: "CTST", publisher: "NXB Giáo dục Việt Nam" },
];

export const TOPICS: Topic[] = [
  { id: "A", code: "A", name: "Máy tính và xã hội tri thức" },
  { id: "B", code: "B", name: "Mạng máy tính và Internet" },
  { id: "C", code: "C", name: "Tổ chức lưu trữ, tìm kiếm và trao đổi thông tin" },
  { id: "D", code: "D", name: "Đạo đức, pháp luật và văn hoá trong môi trường số" },
  { id: "E", code: "E", name: "Ứng dụng tin học" },
  { id: "F", code: "F", name: "Giải quyết vấn đề với sự trợ giúp của máy tính" },
  { id: "G", code: "G", name: "Hướng nghiệp với tin học" },
];

export const PATHWAY_LABEL: Record<Pathway, string> = {
  chung: "Nội dung chung",
  ICT: "Định hướng Tin học ứng dụng (ICT)",
  CS: "Định hướng Khoa học máy tính (CS)",
};

const o = (id: string, grade: Grade, topicId: string, pathway: Pathway, level: Objective["level"], description: string): Objective => ({
  id,
  code: id,
  grade,
  topicId,
  pathway,
  level,
  description,
  curriculumVerified: false,
});

export const OBJECTIVES: Objective[] = [
  // Lớp 10
  o("O10-A-01", 10, "A", "chung", "hiểu", "Biểu diễn được số nguyên không âm ở hệ nhị phân; giải thích bit, byte."),
  o("O10-A-02", 10, "A", "chung", "vận dụng", "Thực hiện được các phép toán logic AND, OR, NOT, XOR trên bit."),
  o("O10-D-01", 10, "D", "chung", "hiểu", "Nhận diện được một số nguy cơ khi tham gia môi trường số và cách phòng tránh."),
  o("O10-F-01", 10, "F", "chung", "vận dụng", "Sử dụng được biến, lệnh gán và biểu thức trong chương trình Python."),
  o("O10-F-02", 10, "F", "chung", "vận dụng", "Viết được câu lệnh rẽ nhánh if/else với biểu thức điều kiện dùng phép so sánh."),
  o("O10-F-03", 10, "F", "chung", "vận dụng", "Kết hợp được các điều kiện bằng toán tử logic and, or, not."),
  o("O10-F-04", 10, "F", "chung", "vận dụng", "Kiểm thử được chương trình với bộ dữ liệu gồm trường hợp biên; phát hiện và sửa lỗi."),
  o("O10-F-05", 10, "F", "chung", "vận dụng", "Sử dụng được câu lệnh lặp for/while và hàm tự định nghĩa."),
  // Lớp 11
  o("O11-A-01", 11, "A", "chung", "hiểu", "Nhận biết được chức năng các thành phần chính bên trong máy tính (CPU, RAM, bộ lưu trữ, bo mạch chủ...)."),
  o("O11-A-02", 11, "A", "chung", "hiểu", "Giải thích được vai trò của hệ điều hành trong quản lý tiến trình, bộ nhớ và tệp."),
  o("O11-F-01", 11, "F", "chung", "hiểu", "Trình bày được khái niệm cơ sở dữ liệu quan hệ, bảng, khóa chính, khóa ngoài."),
  o("O11-F-02", 11, "F", "chung", "vận dụng", "Viết được truy vấn SQL đơn giản để tìm kiếm, lọc dữ liệu; hiểu phân quyền truy cập."),
  o("O11-CS-01", 11, "F", "CS", "vận dụng", "Cài đặt và so sánh được một số thuật toán sắp xếp, tìm kiếm."),
  o("O11-ICT-01", 11, "E", "ICT", "vận dụng", "Sử dụng được phần mềm chỉnh sửa ảnh/làm video ở mức cơ bản."),
  // Lớp 12
  o("O12-A-01", 12, "A", "chung", "hiểu", "Giải thích được khái niệm trí tuệ nhân tạo, học máy và vai trò của dữ liệu; nhận biết thiên lệch dữ liệu."),
  o("O12-B-01", 12, "B", "chung", "hiểu", "Mô tả được chức năng thiết bị mạng và cách gói tin di chuyển qua mạng (mức khái niệm)."),
  o("O12-D-01", 12, "D", "chung", "vận dụng", "Thể hiện được hành vi văn minh, an toàn, có trách nhiệm khi giao tiếp và sử dụng AI trên môi trường số."),
  o("O12-F-01", 12, "F", "chung", "vận dụng", "Tạo được trang web đơn giản bằng HTML và định dạng bằng CSS."),
  o("O12-CS-01", 12, "F", "CS", "hiểu", "Mô tả được quy trình huấn luyện và đánh giá một mô hình phân loại đơn giản."),
  o("O12-ICT-01", 12, "E", "ICT", "vận dụng", "Sử dụng được một số dịch vụ mạng và công cụ cộng tác trực tuyến."),
];

const IF_QUIZ: QuizQuestion[] = [
  {
    id: "q-if-1",
    prompt: "Với humidity = 40, biểu thức humidity < 40 cho kết quả gì?",
    options: ["True", "False", "Lỗi cú pháp", "40"],
    correctIndex: 1,
    explanation: "40 không nhỏ hơn 40, nên kết quả là False. Đây chính là trường hợp biên.",
  },
  {
    id: "q-if-2",
    prompt: "Toán tử nào trong Python cho kết quả True chỉ khi CẢ HAI vế đều True?",
    options: ["or", "not", "and", "=="],
    correctIndex: 2,
    explanation: "and chỉ đúng khi cả hai điều kiện đều đúng.",
  },
  {
    id: "q-if-3",
    prompt: "Dòng nào là câu lệnh if đúng cú pháp Python?",
    options: ["if (x = 5)", "if x == 5:", "if x == 5 then", "if x == 5 {"],
    correctIndex: 1,
    explanation: "Python dùng == để so sánh và kết thúc dòng if bằng dấu hai chấm.",
  },
  {
    id: "q-if-4",
    prompt: "Với x = 7, đoạn lệnh sau in ra gì?\nif x > 10:\n    print(\"A\")\nelif x > 5:\n    print(\"B\")\nelse:\n    print(\"C\")",
    options: ["A", "B", "C", "B và C"],
    correctIndex: 1,
    explanation: "x > 10 sai nên xét tiếp elif: 7 > 5 đúng, in B và bỏ qua else.",
  },
  {
    id: "q-if-5",
    prompt: "Biểu thức not (3 > 5) or 2 == 3 có giá trị gì?",
    options: ["True", "False"],
    correctIndex: 0,
    explanation: "3 > 5 là False nên not (3 > 5) là True; True or (bất kỳ) là True.",
  },
];

const BIN_QUIZ: QuizQuestion[] = [
  {
    id: "q-bin-1",
    prompt: "Số nhị phân 1010 bằng bao nhiêu ở hệ thập phân?",
    options: ["8", "10", "12", "1010"],
    correctIndex: 1,
    explanation: "1·8 + 0·4 + 1·2 + 0·1 = 10.",
  },
  {
    id: "q-bin-2",
    prompt: "1 byte gồm bao nhiêu bit?",
    options: ["4", "8", "16", "1024"],
    correctIndex: 1,
    explanation: "1 byte = 8 bit.",
  },
];

interface BaseLesson {
  key: string;
  grade: Grade;
  topicId: string;
  pathway: Pathway;
  title: string;
  summary: string;
  objectiveIds: string[];
  keywords: string[];
  books: TextbookId[];
  concepts?: Lesson["concepts"];
  quiz?: QuizQuestion[];
}

const DIFFICULTY: Record<string, Lesson["difficulty"]> = {
  "10-safety": "co-ban", "10-variables": "co-ban", "10-binary": "co-ban", "11-hardware": "co-ban", "12-citizen": "co-ban", "12-cloud": "co-ban",
  "11-sort": "nang-cao", "11-sql": "nang-cao", "12-ml": "nang-cao", "10-loop": "nang-cao",
};

const BASE_LESSONS: BaseLesson[] = [
  { key: "10-binary", grade: 10, topicId: "A", pathway: "chung", title: "Biểu diễn thông tin trong máy tính: hệ nhị phân và dữ liệu logic", summary: "Bit, byte, chuyển đổi thập phân–nhị phân, phép toán logic trên bit.", objectiveIds: ["O10-A-01", "O10-A-02"], keywords: ["bit", "byte", "nhị phân", "logic"], books: ["kntt", "cd", "ctst"], concepts: [{ term: "Bit", definition: "Đơn vị thông tin nhỏ nhất, nhận một trong hai giá trị 0 hoặc 1." }, { term: "Byte", definition: "Nhóm 8 bit, biểu diễn được 256 giá trị khác nhau." }], quiz: BIN_QUIZ },
  { key: "10-safety", grade: 10, topicId: "D", pathway: "chung", title: "Ứng xử an toàn và có văn hoá trên môi trường số", summary: "Nhận diện lừa đảo, bảo vệ thông tin cá nhân, bản quyền.", objectiveIds: ["O10-D-01"], keywords: ["an toàn", "lừa đảo", "bản quyền"], books: ["kntt", "cd", "ctst"] },
  { key: "10-variables", grade: 10, topicId: "F", pathway: "chung", title: "Biến, lệnh gán và biểu thức trong Python", summary: "Khai báo biến, kiểu dữ liệu số và logic, biểu thức so sánh.", objectiveIds: ["O10-F-01"], keywords: ["python", "biến", "gán"], books: ["kntt", "cd", "ctst"] },
  { key: "10-if", grade: 10, topicId: "F", pathway: "chung", title: "Câu lệnh rẽ nhánh if", summary: "Cấu trúc if/else, biểu thức điều kiện, toán tử so sánh và logic; kiểm thử giá trị biên.", objectiveIds: ["O10-F-02", "O10-F-03", "O10-F-04"], keywords: ["python", "if", "else", "rẽ nhánh", "điều kiện", "and", "or"], books: ["kntt", "cd", "ctst"], concepts: [{ term: "Biểu thức điều kiện", definition: "Biểu thức cho kết quả True hoặc False, ví dụ humidity < 40." }, { term: "Toán tử logic", definition: "and, or, not dùng để kết hợp hoặc phủ định điều kiện." }, { term: "Giá trị biên", definition: "Giá trị nằm đúng tại ngưỡng (ví dụ 40), nơi < và <= cho kết quả khác nhau." }], quiz: IF_QUIZ },
  { key: "10-loop", grade: 10, topicId: "F", pathway: "chung", title: "Câu lệnh lặp và hàm trong Python", summary: "for, while, hàm tự định nghĩa với tham số và giá trị trả về.", objectiveIds: ["O10-F-05"], keywords: ["python", "for", "while", "hàm"], books: ["kntt", "cd", "ctst"] },
  { key: "10-debug", grade: 10, topicId: "F", pathway: "chung", title: "Kiểm thử và gỡ lỗi chương trình", summary: "Thiết kế dữ liệu kiểm thử, phân loại lỗi cú pháp/ngữ nghĩa, sửa lỗi.", objectiveIds: ["O10-F-04"], keywords: ["kiểm thử", "debug", "dữ liệu kiểm thử"], books: ["kntt", "ctst"] },
  { key: "11-hardware", grade: 11, topicId: "A", pathway: "chung", title: "Bên trong máy tính", summary: "CPU, RAM, bộ lưu trữ, bo mạch chủ, nguồn và các thiết bị ngoại vi.", objectiveIds: ["O11-A-01"], keywords: ["phần cứng", "cpu", "ram"], books: ["kntt", "cd", "ctst"] },
  { key: "11-os", grade: 11, topicId: "A", pathway: "chung", title: "Hệ điều hành", summary: "Chức năng hệ điều hành: quản lý tiến trình, bộ nhớ, tệp.", objectiveIds: ["O11-A-02"], keywords: ["hệ điều hành", "tiến trình", "bộ nhớ"], books: ["kntt", "cd"] },
  { key: "11-db", grade: 11, topicId: "F", pathway: "chung", title: "Cơ sở dữ liệu quan hệ", summary: "Bảng, bản ghi, trường, khóa chính, khóa ngoài, liên kết bảng.", objectiveIds: ["O11-F-01"], keywords: ["csdl", "khóa chính", "khóa ngoài"], books: ["kntt", "cd", "ctst"] },
  { key: "11-sql", grade: 11, topicId: "F", pathway: "chung", title: "Truy vấn dữ liệu với SQL", summary: "SELECT, WHERE, ORDER BY; quyền truy cập dữ liệu.", objectiveIds: ["O11-F-02"], keywords: ["sql", "truy vấn", "select"], books: ["kntt", "ctst"] },
  { key: "11-sort", grade: 11, topicId: "F", pathway: "CS", title: "Thuật toán sắp xếp và tìm kiếm", summary: "Sắp xếp chèn, chọn, nổi bọt; tìm kiếm tuần tự và nhị phân.", objectiveIds: ["O11-CS-01"], keywords: ["thuật toán", "sắp xếp"], books: ["kntt", "cd"] },
  { key: "11-media", grade: 11, topicId: "E", pathway: "ICT", title: "Chỉnh sửa ảnh và làm video cơ bản", summary: "Lớp ảnh, vùng chọn, cắt ghép video.", objectiveIds: ["O11-ICT-01"], keywords: ["ảnh", "video"], books: ["kntt", "ctst"] },
  { key: "12-ai", grade: 12, topicId: "A", pathway: "chung", title: "Giới thiệu trí tuệ nhân tạo", summary: "AI, học máy, dữ liệu huấn luyện, thiên lệch dữ liệu.", objectiveIds: ["O12-A-01"], keywords: ["ai", "học máy", "dữ liệu"], books: ["kntt", "cd", "ctst"] },
  { key: "12-network", grade: 12, topicId: "B", pathway: "chung", title: "Thiết bị mạng và giao thức", summary: "Switch, router, địa chỉ IP, gói tin (mức khái niệm).", objectiveIds: ["O12-B-01"], keywords: ["mạng", "router", "gói tin"], books: ["kntt", "cd", "ctst"] },
  { key: "12-citizen", grade: 12, topicId: "D", pathway: "chung", title: "Giao tiếp an toàn và sử dụng AI có trách nhiệm", summary: "Ứng xử văn minh, bảo vệ dữ liệu, dùng AI trung thực.", objectiveIds: ["O12-D-01"], keywords: ["công dân số", "ai", "đạo đức"], books: ["kntt", "cd", "ctst"] },
  { key: "12-web", grade: 12, topicId: "F", pathway: "chung", title: "Tạo trang web với HTML và CSS", summary: "Cấu trúc HTML, thẻ cơ bản, bộ chọn và thuộc tính CSS.", objectiveIds: ["O12-F-01"], keywords: ["html", "css", "web"], books: ["kntt", "cd", "ctst"] },
  { key: "12-ml", grade: 12, topicId: "F", pathway: "CS", title: "Học máy: mô hình phân loại đơn giản", summary: "Đặc trưng, nhãn, huấn luyện, đánh giá độ chính xác.", objectiveIds: ["O12-CS-01"], keywords: ["học máy", "phân loại"], books: ["kntt", "cd"] },
  { key: "12-cloud", grade: 12, topicId: "E", pathway: "ICT", title: "Dịch vụ mạng và cộng tác trực tuyến", summary: "Lưu trữ đám mây, soạn thảo cộng tác, chia sẻ quyền.", objectiveIds: ["O12-ICT-01"], keywords: ["đám mây", "cộng tác"], books: ["kntt", "ctst"] },
];

export const lessonId = (key: string, book: TextbookId) => `L-${key}-${book}`;
export const chapterId = (grade: Grade, book: TextbookId, topicId: string) => `CH-${grade}-${book}-${topicId}`;

export const LESSONS: Lesson[] = BASE_LESSONS.flatMap((b) =>
  b.books.map((book) => ({
    id: lessonId(b.key, book),
    chapterId: chapterId(b.grade, book, b.topicId),
    textbookId: book,
    grade: b.grade,
    topicId: b.topicId,
    pathway: b.pathway,
    title: b.title,
    order: BASE_LESSONS.filter((x) => x.grade === b.grade && x.books.includes(book)).indexOf(b) + 1,
    summary: b.summary,
    objectiveIds: b.objectiveIds,
    keywords: b.keywords,
    concepts: b.concepts,
    quiz: b.quiz,
    key: b.key,
    difficulty: DIFFICULTY[b.key] ?? "trung-binh",
    curriculumVerified: false,
  })),
);

export const CHAPTERS: Chapter[] = Array.from(
  new Map(
    LESSONS.map((l) => [
      l.chapterId,
      {
        id: l.chapterId,
        textbookId: l.textbookId,
        grade: l.grade,
        topicId: l.topicId,
        title: `Chủ đề ${l.topicId}. ${TOPICS.find((t) => t.id === l.topicId)?.name ?? ""}`,
        order: TOPICS.findIndex((t) => t.id === l.topicId) + 1,
      } satisfies Chapter,
    ]),
  ).values(),
);

export const GRADES: Grade[] = [10, 11, 12];

export const DIFFICULTY_LABEL: Record<Lesson["difficulty"], string> = { "co-ban": "Cơ bản", "trung-binh": "Trung bình", "nang-cao": "Nâng cao" };

export function getLesson(id: string) {
  return LESSONS.find((l) => l.id === id);
}
/** Nhãn cho mục tiêu tạm "SGK-<lớp>-<bài>" của câu hỏi soạn theo bài (đăng kí từ dữ liệu luyện tập). */
const LESSON_OBJECTIVE_LABELS = new Map<string, string>();
export function registerLessonObjectives(labels: Record<string, string>) {
  for (const [k, v] of Object.entries(labels)) LESSON_OBJECTIVE_LABELS.set(k, v);
}
export function getObjective(id: string): Objective | undefined {
  const o = OBJECTIVES.find((x) => x.id === id);
  if (o) return o;
  const label = LESSON_OBJECTIVE_LABELS.get(id);
  if (!label) return undefined;
  const [, g] = id.split("-");
  return { id, code: id, grade: Number(g) as Grade, topicId: "", pathway: "chung", description: label, level: "hiểu", curriculumVerified: false };
}
export function getTextbook(id: TextbookId) {
  return TEXTBOOKS.find((t) => t.id === id)!;
}
export function getTopic(id: string) {
  return TOPICS.find((t) => t.id === id);
}
