/** Bài tập lập trình (Phòng lập trình). Kết quả mong đợi được tính bằng cách chạy lời giải mẫu. */
import type { Difficulty, Grade } from "@/lib/domain/types";

export interface CodingExercise {
  id: string;
  title: string;
  grade: Grade;
  topic: string;
  lessonKey: string;
  objectiveIds: string[];
  difficulty: Difficulty;
  task: string;
  /** Gợi ý từng bước, mở dần trong tab Gợi ý */
  hints: string[];
  starter: string;
  solution: string;
  tests: { name: string; stdin: string[] }[];
}

export const CODING_EXERCISES: CodingExercise[] = [
  {
    id: "if-max",
    title: "Số lớn hơn",
    grade: 10,
    topic: "Câu lệnh if",
    lessonKey: "10-if",
    objectiveIds: ["O10-F-02"],
    difficulty: "co-ban",
    task: "Nhập hai số nguyên a và b (mỗi số một dòng). In ra số lớn hơn.",
    hints: ["Dùng một câu lệnh if so sánh a với b.", "Nếu a > b thì in a, ngược lại (else) in b.", "Hai số bằng nhau thì in số nào cũng đúng — kiểm tra lại nhánh else."],
    starter: "a = int(input())\nb = int(input())\n# Viết câu lệnh if ở đây\n",
    solution: "a = int(input())\nb = int(input())\nif a > b:\n    print(a)\nelse:\n    print(b)",
    tests: [
      { name: "a lớn hơn", stdin: ["15", "4"] },
      { name: "b lớn hơn", stdin: ["8", "12"] },
      { name: "hai số bằng nhau", stdin: ["7", "7"] },
      { name: "số âm", stdin: ["-3", "-9"] },
    ],
  },
  {
    id: "if-even",
    title: "Chẵn hay lẻ",
    grade: 10,
    topic: "Câu lệnh if",
    lessonKey: "10-if",
    objectiveIds: ["O10-F-02"],
    difficulty: "co-ban",
    task: 'Nhập một số nguyên n. In "chẵn" nếu n là số chẵn, ngược lại in "lẻ".',
    hints: ["Số chẵn là số chia hết cho 2.", "Phép n % 2 cho số dư khi chia n cho 2.", "So sánh n % 2 == 0 để chọn in \"chẵn\" hay \"lẻ\". Số 0 là số chẵn."],
    starter: "n = int(input())\n",
    solution: 'n = int(input())\nif n % 2 == 0:\n    print("chẵn")\nelse:\n    print("lẻ")',
    tests: [
      { name: "số chẵn", stdin: ["8"] },
      { name: "số lẻ", stdin: ["15"] },
      { name: "số 0", stdin: ["0"] },
      { name: "số âm lẻ", stdin: ["-7"] },
    ],
  },
  {
    id: "if-grade",
    title: "Xếp loại học tập",
    grade: 10,
    topic: "Câu lệnh if",
    lessonKey: "10-if",
    objectiveIds: ["O10-F-02", "O10-F-04"],
    difficulty: "trung-binh",
    task: 'Nhập điểm trung bình (số thực). In "Tốt" nếu điểm ≥ 8, "Khá" nếu ≥ 6.5, "Đạt" nếu ≥ 5, còn lại in "Chưa đạt".',
    hints: ["Dùng if / elif / elif / else, xét từ mức cao xuống thấp.", "Điều kiện “≥ 8” viết là diem >= 8 (có dấu bằng).", "Kiểm tra giá trị biên: 8 phải ra \"Tốt\", 6.5 phải ra \"Khá\"."],
    starter: "diem = float(input())\n",
    solution: 'diem = float(input())\nif diem >= 8:\n    print("Tốt")\nelif diem >= 6.5:\n    print("Khá")\nelif diem >= 5:\n    print("Đạt")\nelse:\n    print("Chưa đạt")',
    tests: [
      { name: "điểm 9", stdin: ["9"] },
      { name: "biên 8", stdin: ["8"] },
      { name: "biên 6.5", stdin: ["6.5"] },
      { name: "điểm 5.5", stdin: ["5.5"] },
      { name: "điểm 3", stdin: ["3"] },
    ],
  },
  {
    id: "if-leap",
    title: "Năm nhuận",
    grade: 10,
    topic: "Biểu thức logic",
    lessonKey: "10-if",
    objectiveIds: ["O10-F-03"],
    difficulty: "trung-binh",
    task: 'Nhập năm y. In "nhuận" nếu y chia hết cho 400, hoặc chia hết cho 4 nhưng không chia hết cho 100. Ngược lại in "không nhuận".',
    hints: ["Có hai trường hợp nhuận, nối bằng or.", "Trường hợp 2 cần cả hai điều kiện: chia hết cho 4 and không chia hết cho 100.", "Thử với 1900 (không nhuận) và 2000 (nhuận)."],
    starter: "y = int(input())\n",
    solution: 'y = int(input())\nif y % 400 == 0 or (y % 4 == 0 and y % 100 != 0):\n    print("nhuận")\nelse:\n    print("không nhuận")',
    tests: [
      { name: "năm 2024", stdin: ["2024"] },
      { name: "năm 1900", stdin: ["1900"] },
      { name: "năm 2000", stdin: ["2000"] },
      { name: "năm 2026", stdin: ["2026"] },
    ],
  },
  {
    id: "loop-sum",
    title: "Tổng từ 1 đến n",
    grade: 10,
    topic: "Vòng lặp",
    lessonKey: "10-loop",
    objectiveIds: ["O10-F-05"],
    difficulty: "co-ban",
    task: "Nhập số nguyên dương n. Dùng vòng lặp để tính và in tổng 1 + 2 + … + n.",
    hints: ["Dùng for i in range(1, n + 1) để i chạy từ 1 tới n.", "Mỗi vòng cộng i vào biến tong.", "In tong sau khi vòng lặp kết thúc (không thụt lề vào trong for)."],
    starter: "n = int(input())\ntong = 0\n",
    solution: "n = int(input())\ntong = 0\nfor i in range(1, n + 1):\n    tong += i\nprint(tong)",
    tests: [
      { name: "n = 5", stdin: ["5"] },
      { name: "n = 1", stdin: ["1"] },
      { name: "n = 100", stdin: ["100"] },
    ],
  },
  {
    id: "loop-table",
    title: "Bảng cửu chương",
    grade: 10,
    topic: "Vòng lặp",
    lessonKey: "10-loop",
    objectiveIds: ["O10-F-05"],
    difficulty: "trung-binh",
    task: "Nhập số n. In bảng nhân n từ 1 đến 10, mỗi dòng dạng: n x i = kết quả",
    hints: ["Vòng for i chạy từ 1 tới 10: range(1, 11).", "print(n, \"x\", i, \"=\", n * i) tự thêm dấu cách giữa các phần.", "Đếm lại: phải in đúng 10 dòng."],
    starter: "n = int(input())\n",
    solution: 'n = int(input())\nfor i in range(1, 11):\n    print(n, "x", i, "=", n * i)',
    tests: [
      { name: "bảng 7", stdin: ["7"] },
      { name: "bảng 9", stdin: ["9"] },
    ],
  },
  {
    id: "list-count",
    title: "Đếm số điểm đạt",
    grade: 10,
    topic: "Danh sách",
    lessonKey: "10-loop",
    objectiveIds: ["O10-F-05"],
    difficulty: "nang-cao",
    task: "Dòng đầu nhập số n, n dòng sau mỗi dòng một điểm (số thực). In ra số điểm từ 5 trở lên.",
    hints: ["Đọc n trước, rồi lặp n lần để đọc từng điểm và thêm vào danh sách.", "Dùng float(input()) vì điểm có thể lẻ.", "Duyệt danh sách, mỗi điểm >= 5 thì tăng biến đếm."],
    starter: "n = int(input())\ndiem = []\n",
    solution: "n = int(input())\ndiem = []\nfor i in range(n):\n    diem.append(float(input()))\ndem = 0\nfor d in diem:\n    if d >= 5:\n        dem += 1\nprint(dem)",
    tests: [
      { name: "4 điểm", stdin: ["4", "7", "4.5", "5", "9"] },
      { name: "không ai đạt", stdin: ["2", "3", "4.9"] },
    ],
  },
];

export const getExercise = (id: string) => CODING_EXERCISES.find((x) => x.id === id);
