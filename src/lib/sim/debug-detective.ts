/**
 * Thám tử gỡ lỗi (Tin 10 – Bài 29, 30 KNTT): ứng dụng bán vé xe buýt tính sai tiền với một số hành khách.
 * Logic thuần: phân loại lỗi (chạy thật bằng trình thông dịch), thiết kế test theo quy định, sửa lỗi và kiểm thử lại.
 */
import { normalizeOutput, runPython } from "@/lib/py/interpreter";

// ---------- Nhiệm vụ 1: ba loại lỗi ----------

export type ErrorKind = "syntax" | "runtime" | "logic";
export const ERROR_KIND_LABEL: Record<ErrorKind, string> = { syntax: "Lỗi cú pháp", runtime: "Lỗi khi chạy", logic: "Lỗi logic (ngữ nghĩa)" };

export interface Snippet {
  id: string;
  title: string;
  code: string;
  stdin: string[];
  kind: ErrorKind;
  why: string;
  /** Với lỗi logic: kết quả đúng phải là gì */
  expected?: string;
}

export const SNIPPETS: Snippet[] = [
  { id: "colon", title: "Kiểm tra vé tháng", code: "co_ve = input()\nif co_ve == 'co'\n    print('Mời lên xe')", stdin: ["co"], kind: "syntax", why: "Thiếu dấu hai chấm sau if: chương trình sai quy tắc viết của Python nên không chạy được dòng nào." },
  { id: "int", title: "Nhập tuổi hành khách", code: "tuoi = int(input())\nprint('Tuổi:', tuoi)", stdin: ["mười lăm"], kind: "runtime", why: "Câu lệnh viết đúng, nhưng khi chạy người dùng gõ chữ nên int() không đổi được thành số → lỗi khi chạy." },
  { id: "avg", title: "Giá vé trung bình", code: "tong = 0\nso_ve = 0\nprint(tong / so_ve)", stdin: [], kind: "runtime", why: "Chia cho 0 khi chưa bán vé nào: chỉ phát hiện lúc chạy." },
  { id: "change", title: "Tính tiền thối", code: "gia = 7000\ntra = int(input())\nprint(gia - tra)", stdin: ["10000"], kind: "logic", why: "Chạy không báo lỗi nhưng in -3000: phải là tra - gia. Lỗi logic chỉ phát hiện được bằng cách so với kết quả đúng.", expected: "3000" },
];

export function runSnippet(s: Snippet): { output: string; error?: string } {
  const r = runPython(s.code, { stdin: s.stdin, echoInput: false, trace: false });
  return r.ok ? { output: normalizeOutput(r.output) } : { output: normalizeOutput(r.output), error: `Dòng ${r.error!.line}: ${r.error!.type} — ${r.error!.explain}` };
}

// ---------- Nhiệm vụ 2–3: chương trình bán vé ----------

/** Quy định giá vé của thành phố (đáp án đúng). */
export function fareRule(age: number): number {
  if (age < 6 || age >= 60) return 0;
  if (age <= 17) return 3000;
  return 7000;
}
export const FARE_RULES = ["Dưới 6 tuổi: miễn phí", "Từ 6 đến 17 tuổi (học sinh): 3.000đ", "Từ 18 đến 59 tuổi: 7.000đ", "Từ 60 tuổi trở lên: miễn phí"];

export interface BugLine {
  line: number;
  buggy: string;
  options: string[];
  answer: number;
  why: string;
}

export const BUG_LINES: BugLine[] = [
  {
    line: 2,
    buggy: "if tuoi < 6 or tuoi > 60:",
    options: ["if tuoi < 6 or tuoi >= 60:", "if tuoi <= 6 or tuoi > 60:", "if tuoi < 6 and tuoi >= 60:"],
    answer: 0,
    why: "“Từ 60 tuổi” gồm cả 60, nên phải dùng >= 60. Đổi thành <= 6 sẽ làm sai trẻ 6 tuổi; dùng and thì không tuổi nào thỏa.",
  },
  {
    line: 4,
    buggy: "elif tuoi < 17:",
    options: ["elif tuoi > 17:", "elif tuoi <= 17:", "elif tuoi < 16:"],
    answer: 1,
    why: "“Đến 17 tuổi” gồm cả 17, nên phải là <= 17 (hoặc < 18).",
  },
];

export function fareProgram(fix: (number | null)[] = []): string {
  const l2 = fix[0] == null ? BUG_LINES[0].buggy : BUG_LINES[0].options[fix[0]];
  const l4 = fix[1] == null ? BUG_LINES[1].buggy : BUG_LINES[1].options[fix[1]];
  return ["tuoi = int(input())", l2, "    print(0)", l4, "    print(3000)", "else:", "    print(7000)"].join("\n");
}

export interface FareTest {
  age: number;
  expected: number;
  actual: string;
  pass: boolean;
}

export function runFare(code: string, age: number): FareTest {
  const r = runPython(code, { stdin: [String(age)], echoInput: false, trace: false });
  const actual = r.ok ? normalizeOutput(r.output) : `Lỗi: ${r.error!.type}`;
  const expected = fareRule(age);
  return { age, expected, actual, pass: actual === String(expected) };
}

/** Tuổi làm lộ lỗi của chương trình gốc (để biết học sinh đã bắt được đủ lỗi chưa). */
export const BUG_AGES: Record<number, number> = { 60: 0, 17: 1 };

/** Gợi ý theo các test học sinh đã chạy: chưa thử giá trị biên nào thì nhắc. */
export function testAdvice(ages: number[]): string | null {
  const boundaries = [5, 6, 17, 18, 59, 60];
  const tried = ages.filter((a) => boundaries.includes(a));
  if (ages.length >= 3 && tried.length === 0) return "Các tuổi em thử đều nằm giữa các khoảng. Lỗi hay nằm ở RANH GIỚI giữa hai mức giá: thử đúng các mốc trong quy định.";
  return null;
}

/** Bộ test kiểm tra lại sau khi sửa: mọi mốc biên và vài giá trị giữa. */
export const REGRESSION_AGES = [0, 5, 6, 10, 17, 18, 30, 59, 60, 75];
