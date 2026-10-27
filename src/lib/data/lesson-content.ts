/**
 * Nội dung chi tiết của bài học (soạn mẫu để minh họa cấu trúc một bài học hoàn chỉnh).
 * Khóa theo `Lesson.key` nên dùng chung cho các bộ sách. Giáo viên cần đối chiếu với SGK trước khi dạy.
 */

export type Block =
  | { type: "p"; text: string }
  | { type: "code"; code: string }
  | { type: "table"; head: string[]; rows: string[][] }
  | { type: "note"; text: string };

export interface LessonContent {
  key: string;
  duration: string;
  warmUp: { question: string; idea: string };
  sections: { title: string; blocks: Block[] }[];
  examples: { title: string; code: string; run: { input?: string; output: string }[]; explain: string }[];
  labSlug?: string;
  labTask?: string;
  exercises: { title: string; task: string; hint: string; solution: string }[];
  remember: string[];
}

const IF_LESSON: LessonContent = {
  key: "10-if",
  duration: "2 tiết",
  warmUp: {
    question: "Cuối tuần không ai ở trường, vườn rau của lớp bị héo. Nếu lắp một máy bơm tự động, máy cần “biết” điều gì để quyết định có tưới hay không?",
    idea: "Máy cần kiểm tra một điều kiện (đất có khô không? bình còn nước không?) rồi chọn một trong hai việc: tưới hoặc không tưới. Trong Python, ta dùng câu lệnh if để làm việc này.",
  },
  sections: [
    {
      title: "1. Biểu thức điều kiện",
      blocks: [
        { type: "p", text: "Biểu thức điều kiện (biểu thức logic) là biểu thức chỉ nhận một trong hai giá trị True (đúng) hoặc False (sai). Ta thường tạo điều kiện bằng các phép so sánh." },
        {
          type: "table",
          head: ["Phép so sánh", "Ý nghĩa", "Ví dụ với x = 40", "Kết quả"],
          rows: [
            ["<", "nhỏ hơn", "x < 40", "False"],
            ["<=", "nhỏ hơn hoặc bằng", "x <= 40", "True"],
            [">", "lớn hơn", "x > 30", "True"],
            [">=", "lớn hơn hoặc bằng", "x >= 41", "False"],
            ["==", "bằng", "x == 40", "True"],
            ["!=", "khác", "x != 40", "False"],
          ],
        },
        { type: "note", text: "Dấu = là phép gán (x = 40), còn == mới là phép so sánh bằng (x == 40). Đây là lỗi rất hay gặp." },
      ],
    },
    {
      title: "2. Kết hợp điều kiện: and, or, not",
      blocks: [
        { type: "p", text: "Khi cần xét nhiều điều kiện cùng lúc, ta nối chúng bằng các toán tử logic." },
        {
          type: "table",
          head: ["A", "B", "A and B", "A or B", "not A"],
          rows: [
            ["True", "True", "True", "True", "False"],
            ["True", "False", "False", "True", "False"],
            ["False", "True", "False", "True", "True"],
            ["False", "False", "False", "False", "True"],
          ],
        },
        { type: "p", text: "Ví dụ: máy bơm chỉ nên bật khi đất khô VÀ bình còn nước, nên điều kiện là: humidity < 40 and has_water." },
      ],
    },
    {
      title: "3. Câu lệnh if dạng thiếu",
      blocks: [
        { type: "code", code: "if <điều kiện>:\n    <khối lệnh>" },
        { type: "p", text: "Nếu điều kiện đúng, khối lệnh được thực hiện; nếu sai, chương trình bỏ qua khối lệnh và chạy tiếp." },
        { type: "note", text: "Cuối dòng if phải có dấu hai chấm ':' và các lệnh bên trong phải thụt lề (thường là 4 dấu cách)." },
      ],
    },
    {
      title: "4. Câu lệnh if … else (dạng đủ)",
      blocks: [
        { type: "code", code: "if <điều kiện>:\n    <khối lệnh 1>\nelse:\n    <khối lệnh 2>" },
        { type: "p", text: "Điều kiện đúng thì thực hiện khối lệnh 1, sai thì thực hiện khối lệnh 2. Luôn có đúng một khối được thực hiện." },
      ],
    },
    {
      title: "5. Nhiều nhánh: if … elif … else",
      blocks: [
        { type: "code", code: "if <điều kiện 1>:\n    <khối lệnh 1>\nelif <điều kiện 2>:\n    <khối lệnh 2>\nelse:\n    <khối lệnh 3>" },
        { type: "p", text: "Python kiểm tra lần lượt từ trên xuống, gặp điều kiện đúng đầu tiên thì thực hiện khối lệnh tương ứng và bỏ qua các nhánh còn lại." },
      ],
    },
  ],
  examples: [
    {
      title: "Ví dụ 1. Số chẵn hay số lẻ",
      code: 'n = int(input("Nhập số nguyên: "))\nif n % 2 == 0:\n    print(n, "là số chẵn")\nelse:\n    print(n, "là số lẻ")',
      run: [
        { input: "8", output: "8 là số chẵn" },
        { input: "15", output: "15 là số lẻ" },
      ],
      explain: "n % 2 là số dư khi chia n cho 2. Số dư bằng 0 thì n chẵn.",
    },
    {
      title: "Ví dụ 2. Xếp loại học tập",
      code: 'diem = float(input("Nhập điểm trung bình: "))\nif diem >= 8:\n    print("Tốt")\nelif diem >= 6.5:\n    print("Khá")\nelif diem >= 5:\n    print("Đạt")\nelse:\n    print("Chưa đạt")',
      run: [
        { input: "8.5", output: "Tốt" },
        { input: "6.5", output: "Khá" },
        { input: "4", output: "Chưa đạt" },
      ],
      explain: "Thứ tự các nhánh rất quan trọng: nếu đặt diem >= 5 lên đầu thì điểm 8.5 cũng bị xếp “Đạt”.",
    },
    {
      title: "Ví dụ 3. Máy bơm tưới cây",
      code: "if humidity < 40 and has_water:\n    pump_on()\nelse:\n    pump_off()",
      run: [
        { input: "humidity = 30, has_water = True", output: "Bơm BẬT" },
        { input: "humidity = 40, has_water = True", output: "Bơm TẮT (40 không nhỏ hơn 40)" },
        { input: "humidity = 20, has_water = False", output: "Bơm TẮT (hết nước)" },
      ],
      explain: "Hãy chú ý trường hợp humidity = 40: đây là giá trị biên, nơi < và <= cho kết quả khác nhau.",
    },
  ],
  labSlug: "smart-garden",
  labTask: "Viết điều kiện cho máy bơm, sau đó bấm Kiểm thử. Thử đổi < thành <= và quan sát trường hợp độ ẩm đúng bằng 40%.",
  exercises: [
    {
      title: "Bài 1. Ba cạnh tam giác",
      task: "Nhập ba số dương a, b, c. Cho biết ba số đó có phải là độ dài ba cạnh của một tam giác hay không.",
      hint: "Ba số là ba cạnh tam giác khi tổng hai cạnh bất kỳ lớn hơn cạnh còn lại. Cần kết hợp ba điều kiện bằng and.",
      solution: 'a = float(input("a = "))\nb = float(input("b = "))\nc = float(input("c = "))\nif a + b > c and a + c > b and b + c > a:\n    print("Là ba cạnh của một tam giác")\nelse:\n    print("Không phải ba cạnh của tam giác")',
    },
    {
      title: "Bài 2. Năm nhuận",
      task: "Nhập một năm y. Năm nhuận là năm chia hết cho 400, hoặc chia hết cho 4 nhưng không chia hết cho 100. Hãy cho biết y có phải năm nhuận không.",
      hint: "Dùng phép % để kiểm tra chia hết, kết hợp and, or và cặp ngoặc đơn.",
      solution: 'y = int(input("Năm: "))\nif y % 400 == 0 or (y % 4 == 0 and y % 100 != 0):\n    print(y, "là năm nhuận")\nelse:\n    print(y, "không phải năm nhuận")',
    },
    {
      title: "Bài 3. Vườn tưới thông minh hơn",
      task: "Tránh tưới vào buổi trưa nắng: máy bơm chỉ bật khi đất khô (dưới 40%), bình còn nước và giờ hiện tại KHÔNG nằm trong khoảng 11 giờ đến 14 giờ. Hãy viết điều kiện.",
      hint: "Điều kiện về giờ có thể viết là not (11 <= gio <= 14).",
      solution: "if humidity < 40 and has_water and not (11 <= gio <= 14):\n    pump_on()\nelse:\n    pump_off()",
    },
  ],
  remember: [
    "Điều kiện chỉ nhận giá trị True hoặc False.",
    "Dùng == để so sánh bằng; dấu = là phép gán.",
    "Cuối dòng if, elif, else có dấu hai chấm; khối lệnh bên trong phải thụt lề.",
    "and: đúng khi mọi điều kiện đều đúng; or: đúng khi có ít nhất một điều kiện đúng.",
    "Luôn kiểm thử chương trình với giá trị biên (ví dụ 39, 40, 41).",
  ],
};

export const LESSON_CONTENT: Record<string, LessonContent> = { [IF_LESSON.key]: IF_LESSON };

export function getLessonContent(key: string): LessonContent | undefined {
  return LESSON_CONTENT[key];
}
