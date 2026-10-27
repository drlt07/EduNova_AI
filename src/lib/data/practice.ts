/** Ngân hàng câu hỏi luyện tập. Đáp án "dự đoán đầu ra" và "điền code" được tính bằng cách chạy chương trình thật. */
import type { Grade } from "@/lib/domain/types";

type Base = { id: string; objectiveId: string; prompt: string; explanation: string };
export type PracticeQuestion =
  | (Base & { kind: "mcq"; code?: string; options: string[]; correctIndex: number })
  | (Base & { kind: "truefalse"; answer: boolean })
  | (Base & { kind: "order"; lines: string[] })
  | (Base & { kind: "fillcode"; template: string; reference: string; tests: string[][] })
  | (Base & { kind: "predict"; code: string; stdin?: string[] })
  | (Base & { kind: "finderror"; code: string; errorLine: number })
  | (Base & { kind: "short"; sample: string })
  | (Base & { kind: "sim"; gameSlug: string; level: number });

export const KIND_LABEL: Record<PracticeQuestion["kind"], string> = {
  mcq: "Trắc nghiệm",
  truefalse: "Đúng/Sai",
  order: "Sắp xếp",
  fillcode: "Điền code",
  predict: "Dự đoán đầu ra",
  finderror: "Tìm lỗi",
  short: "Tự luận ngắn",
  sim: "Thực hành mô phỏng",
};

export const QUESTIONS: PracticeQuestion[] = [
  { id: "p-if-1", kind: "mcq", objectiveId: "O10-F-02", prompt: "Dòng nào là câu lệnh if đúng cú pháp Python?", options: ["if (x = 5)", "if x == 5:", "if x == 5 then", "if x == 5 {"], correctIndex: 1, explanation: "Python dùng == để so sánh và kết thúc dòng if bằng dấu hai chấm." },
  { id: "p-if-2", kind: "predict", objectiveId: "O10-F-02", prompt: "Chương trình in ra gì?", code: "a = 8\nb = 12\nif a > b:\n    print(a)\nelse:\n    print(b)", explanation: "8 > 12 là False nên nhánh else được thực hiện." },
  { id: "p-if-3", kind: "predict", objectiveId: "O10-F-02", prompt: "Với x = 7, chương trình in ra gì?", code: "x = 7\nif x > 10:\n    print('A')\nelif x > 5:\n    print('B')\nelse:\n    print('C')", explanation: "x > 10 sai, x > 5 đúng nên in B và bỏ qua else." },
  { id: "p-if-4", kind: "order", objectiveId: "O10-F-02", prompt: "Sắp xếp các dòng thành chương trình in ra số lớn hơn trong hai số a, b.", lines: ["a = int(input())", "b = int(input())", "if a > b:", "    print(a)", "else:", "    print(b)"], explanation: "Nhập dữ liệu trước, sau đó if, khối lệnh của if, rồi else và khối lệnh của else." },
  { id: "p-if-5", kind: "fillcode", objectiveId: "O10-F-02", prompt: "Điền điều kiện để chương trình in “chẵn” khi n là số chẵn.", template: 'n = int(input())\nif ___:\n    print("chẵn")\nelse:\n    print("lẻ")', reference: "n % 2 == 0", tests: [["4"], ["7"], ["0"], ["-3"]], explanation: "Số chẵn chia 2 dư 0: n % 2 == 0." },
  { id: "p-if-6", kind: "finderror", objectiveId: "O10-F-02", prompt: "Chương trình có một dòng sai. Chọn dòng sai.", code: "x = int(input())\nif x = 0:\n    print('bằng 0')\nelse:\n    print('khác 0')", errorLine: 2, explanation: "Dòng 2 dùng = (phép gán) thay vì == (so sánh)." },
  { id: "p-if-7", kind: "short", objectiveId: "O10-F-04", prompt: "Vì sao khi kiểm thử điều kiện humidity < 40 cần thử cả giá trị 40?", sample: "Vì 40 là giá trị biên: tại 40 thì < và <= cho kết quả khác nhau, nên đây là chỗ dễ viết sai nhất.", explanation: "Giá trị biên là nơi lỗi hay xuất hiện." },
  { id: "p-if-8", kind: "sim", objectiveId: "O10-F-03", prompt: "Hoàn thành cấp 2 của Nông trại thông minh: chỉ bật bơm khi đất khô và bình còn nước.", gameSlug: "smart-farm", level: 2, explanation: "Cần kết hợp hai điều kiện bằng and." },
  { id: "p-lg-1", kind: "truefalse", objectiveId: "O10-F-03", prompt: "Biểu thức True and False có giá trị True.", answer: false, explanation: "and chỉ đúng khi cả hai vế đều đúng." },
  { id: "p-lg-2", kind: "truefalse", objectiveId: "O10-F-03", prompt: "not (3 > 5) có giá trị True.", answer: true, explanation: "3 > 5 là False nên not (3 > 5) là True." },
  { id: "p-lg-3", kind: "predict", objectiveId: "O10-F-03", prompt: "Chương trình in ra gì?", code: "h = 30\nw = False\nprint(h < 40 and w, h < 40 or w)", explanation: "True and False → False; True or False → True." },
  { id: "p-lg-4", kind: "fillcode", objectiveId: "O10-F-03", prompt: "Điền điều kiện: năm y là năm nhuận nếu chia hết cho 400, hoặc chia hết cho 4 nhưng không chia hết cho 100.", template: 'y = int(input())\nif ___:\n    print("nhuận")\nelse:\n    print("không")', reference: "y % 400 == 0 or (y % 4 == 0 and y % 100 != 0)", tests: [["2024"], ["1900"], ["2000"], ["2023"]], explanation: "Kết hợp or và and, chú ý dấu ngoặc." },
  { id: "p-lg-5", kind: "mcq", objectiveId: "O10-F-03", prompt: "Máy bơm chỉ được bật khi đất khô VÀ bình còn nước. Điều kiện nào đúng?", options: ["humidity < 40 or has_water", "humidity < 40 and has_water", "humidity > 40 and has_water", "not has_water"], correctIndex: 1, explanation: "Hai điều kiện cùng phải đúng nên dùng and." },
  { id: "p-ts-1", kind: "mcq", objectiveId: "O10-F-04", prompt: "Với điều kiện điểm >= 8, bộ dữ liệu kiểm thử nào tốt nhất?", options: ["9, 10", "7.9, 8, 8.1", "0, 100", "5"], correctIndex: 1, explanation: "Thử ngay dưới, đúng bằng và ngay trên giá trị biên." },
  { id: "p-ts-2", kind: "predict", objectiveId: "O10-F-04", prompt: "Học sinh viết sai dấu so sánh. Với diem = 8, chương trình in ra gì?", code: "diem = 8\nif diem > 8:\n    print('Tốt')\nelse:\n    print('Chưa tốt')", explanation: "8 > 8 là False nên in “Chưa tốt” — lỗi chỉ lộ ra khi thử giá trị biên." },
  { id: "p-lp-1", kind: "predict", objectiveId: "O10-F-05", prompt: "Chương trình in ra gì?", code: "s = 0\nfor i in range(1, 5):\n    s += i\nprint(s)", explanation: "range(1, 5) gồm 1, 2, 3, 4 nên tổng là 10." },
  { id: "p-lp-2", kind: "order", objectiveId: "O10-F-05", prompt: "Sắp xếp thành chương trình in các số chẵn từ 2 đến 10.", lines: ["for i in range(1, 11):", "    if i % 2 == 0:", "        print(i)"], explanation: "Vòng for bao ngoài, if kiểm tra số chẵn, print nằm trong if." },
  { id: "p-lp-3", kind: "fillcode", objectiveId: "O10-F-05", prompt: "Điền để chương trình in tổng các số từ 1 đến n.", template: "n = int(input())\ntong = 0\nfor i in range(___):\n    tong += i\nprint(tong)", reference: "1, n + 1", tests: [["5"], ["1"], ["10"]], explanation: "range(1, n + 1) chạy từ 1 đến n." },
  { id: "p-lp-4", kind: "finderror", objectiveId: "O10-F-05", prompt: "Vòng lặp sau chạy mãi không dừng. Dòng nào gây ra lỗi (thiếu lệnh)?", code: "i = 1\nwhile i <= 5:\n    print(i)\nprint('xong')", errorLine: 3, explanation: "Trong thân vòng lặp (sau dòng 3) cần tăng i, ví dụ i += 1." },
  { id: "p-bn-1", kind: "mcq", objectiveId: "O10-A-01", prompt: "Số nhị phân 1010 bằng bao nhiêu ở hệ thập phân?", options: ["8", "10", "12", "1010"], correctIndex: 1, explanation: "1·8 + 0·4 + 1·2 + 0·1 = 10." },
  { id: "p-bn-2", kind: "truefalse", objectiveId: "O10-A-01", prompt: "1 byte gồm 8 bit.", answer: true, explanation: "1 byte = 8 bit." },
  { id: "p-bn-3", kind: "mcq", objectiveId: "O10-A-02", prompt: "Cổng logic nào cho kết quả 1 khi hai đầu vào khác nhau?", options: ["AND", "OR", "XOR", "NAND"], correctIndex: 2, explanation: "XOR cho 1 khi hai đầu vào khác nhau." },
];

export interface PracticeSet {
  id: string;
  title: string;
  grade: Grade;
  lessonKey: string;
  description: string;
  questionIds: string[];
}

export const PRACTICE_SETS: PracticeSet[] = [
  { id: "if-basic", title: "Câu lệnh rẽ nhánh if", grade: 10, lessonKey: "10-if", description: "Cú pháp if/else, dự đoán kết quả, tìm lỗi.", questionIds: ["p-if-1", "p-if-2", "p-if-3", "p-if-4", "p-if-5", "p-if-6", "p-if-7", "p-if-8"] },
  { id: "logic", title: "Biểu thức logic và kiểm thử", grade: 10, lessonKey: "10-if", description: "and, or, not và giá trị biên.", questionIds: ["p-lg-1", "p-lg-2", "p-lg-3", "p-lg-4", "p-lg-5", "p-ts-1", "p-ts-2"] },
  { id: "loop", title: "Vòng lặp", grade: 10, lessonKey: "10-loop", description: "for, range, while.", questionIds: ["p-lp-1", "p-lp-2", "p-lp-3", "p-lp-4"] },
  { id: "binary", title: "Hệ nhị phân và cổng logic", grade: 10, lessonKey: "10-binary", description: "Bit, byte, chuyển đổi, cổng logic.", questionIds: ["p-bn-1", "p-bn-2", "p-bn-3"] },
];

export const getQuestion = (id: string) => QUESTIONS.find((q) => q.id === id);
export const getSet = (id: string) => PRACTICE_SETS.find((s) => s.id === id);
