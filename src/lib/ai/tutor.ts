/**
 * Gia sư Tin học (bản mẫu theo luật): phản hồi theo chế độ, chủ đề và ngữ cảnh học tập.
 * Không đưa đáp án hoàn chỉnh; khóa khi học sinh đang làm bài kiểm tra chính thức.
 */
import { QUESTIONS } from "@/lib/data/practice";

export type TutorMode = "explain" | "hint" | "debug" | "socratic" | "review";
export type TutorAction = "simpler" | "hint" | "example" | "check" | undefined;
export type Topic = "if" | "logic" | "loop" | "test" | "binary" | "general";

export interface TutorInput {
  mode: TutorMode;
  action?: TutorAction;
  message: string;
  topic: Topic;
  turn: number;
  locked: boolean;
  context: { title?: string; error?: { type: string; explain: string; line: number }; failing?: string[]; weakObjective?: string };
}

export interface TutorOutput {
  reply: string;
  code?: string;
  quiz?: { question: string; code?: string; options: string[]; correctIndex: number; explanation: string };
  hintLevel: number;
}

const LIB: Record<Exclude<Topic, "general">, { explain: string; simpler: string; example: { text: string; code: string }; hints: string[]; socratic: string[]; objective: string }> = {
  if: {
    explain: "Câu lệnh if giúp chương trình chọn việc cần làm. Python kiểm tra điều kiện: nếu True thì chạy khối lệnh thụt lề bên dưới, nếu False thì bỏ qua (hoặc chạy nhánh else).",
    simpler: "Hãy nghĩ if giống câu “Nếu trời mưa thì mang ô”. Máy tính kiểm tra “trời mưa?” — đúng thì làm, sai thì thôi.",
    example: { text: "Ví dụ: in “Đạt” nếu điểm từ 5 trở lên.", code: "diem = 6\nif diem >= 5:\n    print('Đạt')\nelse:\n    print('Chưa đạt')" },
    hints: ["Em hãy đọc to điều kiện của mình thành một câu tiếng Việt. Câu đó có đúng với yêu cầu đề bài không?", "Kiểm tra dấu so sánh: đề bài nói “dưới”, “từ … trở lên” hay “bằng”? Mỗi cách ứng với một toán tử khác nhau (<, >=, ==).", "Đừng quên dấu hai chấm cuối dòng if và thụt lề 4 dấu cách cho các lệnh bên trong."],
    socratic: ["Nếu điều kiện của em là False thì chương trình sẽ làm gì tiếp theo?", "Có trường hợp nào cả nhánh if và nhánh else đều không đúng với ý em muốn không?", "Em dự đoán chương trình in gì khi giá trị đúng bằng ngưỡng? Hãy thử chạy để kiểm chứng."],
    objective: "O10-F-02",
  },
  logic: {
    explain: "Toán tử and đúng khi CẢ HAI điều kiện đúng; or đúng khi CÓ ÍT NHẤT MỘT điều kiện đúng; not đảo True thành False và ngược lại.",
    simpler: "and giống “và”: phải đủ cả hai. or giống “hoặc”: chỉ cần một. Máy bơm cần đất khô VÀ còn nước — thiếu một trong hai là không bật.",
    example: { text: "Ví dụ: máy bơm chỉ bật khi đất khô và bình còn nước.", code: "humidity = 30\nhas_water = False\nprint(humidity < 40 and has_water)  # False vì hết nước" },
    hints: ["Có những điều kiện nào phải CÙNG đúng thì máy mới hoạt động?", "Thử lập bảng: với has_water = False, biểu thức của em cho kết quả gì?", "Nếu dùng or, chỉ cần một vế đúng là cả biểu thức đúng. Đó có phải điều em muốn không?"],
    socratic: ["Với humidity = 20 và has_water = False, biểu thức của em là True hay False?", "Vì sao and phù hợp hơn or trong bài máy bơm?", "Có cách nào viết điều kiện “không hết nước” bằng not không?"],
    objective: "O10-F-03",
  },
  loop: {
    explain: "Vòng lặp for lặp lại một khối lệnh với từng giá trị trong dãy (ví dụ range(1, 6) cho 1, 2, 3, 4, 5). while lặp khi điều kiện còn đúng.",
    simpler: "Vòng lặp giống việc đếm từ 1 đến 5 và làm cùng một việc ở mỗi số. range(1, 6) dừng TRƯỚC số 6.",
    example: { text: "Ví dụ: tính tổng 1 + 2 + 3 + 4 + 5.", code: "tong = 0\nfor i in range(1, 6):\n    tong += i\nprint(tong)  # 15" },
    hints: ["range(a, b) có lấy giá trị b không? Hãy in thử các giá trị của i.", "Với while, biến trong điều kiện có thay đổi bên trong vòng lặp không? Nếu không, vòng lặp sẽ chạy mãi.", "Lệnh nào cần nằm TRONG vòng lặp (thụt lề), lệnh nào nằm SAU vòng lặp?"],
    socratic: ["Vòng lặp của em chạy bao nhiêu lần? Em đếm thế nào?", "Nếu đặt print bên trong vòng lặp thay vì sau vòng lặp, kết quả khác gì?", "Biến tổng nên được gán giá trị ban đầu ở đâu: trong hay ngoài vòng lặp?"],
    objective: "O10-F-05",
  },
  test: {
    explain: "Kiểm thử là chạy chương trình với nhiều bộ dữ liệu để tìm lỗi. Bộ test tốt có trường hợp thông thường, giá trị biên (ngay tại ngưỡng) và trường hợp đặc biệt.",
    simpler: "Đừng chỉ thử một số. Với ngưỡng 40, hãy thử 39, 40 và 41 — lỗi hay nằm đúng ở 40.",
    example: { text: "Ví dụ bộ test cho điều kiện “dưới 40%”:", code: "# 39 → bật\n# 40 → tắt (giá trị biên)\n# 41 → tắt\n# hết nước → tắt" },
    hints: ["Em đã thử giá trị đúng bằng ngưỡng chưa?", "Trường hợp “hết nước” hoặc dữ liệu lạ (số âm) đã được thử chưa?", "Hãy so sánh kết quả mong đợi và kết quả thực tế ở trường hợp sai đầu tiên."],
    socratic: ["Vì sao chỉ thử một giá trị thì chưa đủ để tin chương trình đúng?", "Trường hợp nào dễ làm chương trình sai nhất?", "Nếu đổi < thành <=, trường hợp nào sẽ cho kết quả khác?"],
    objective: "O10-F-04",
  },
  binary: {
    explain: "Máy tính lưu thông tin bằng bit (0 hoặc 1). 8 bit tạo thành 1 byte. Mỗi vị trí bit có giá trị 1, 2, 4, 8, … tính từ phải sang trái.",
    simpler: "Số nhị phân giống dãy công tắc: công tắc bật (1) thì cộng giá trị của vị trí đó. 1010 = 8 + 2 = 10.",
    example: { text: "Ví dụ đổi 13 sang nhị phân:", code: "13 = 8 + 4 + 1\n→ 1101" },
    hints: ["Viết giá trị các vị trí: 8, 4, 2, 1. Bit nào đang là 1?", "Cộng giá trị của các vị trí có bit 1.", "Muốn đổi ngược, hãy chọn các lũy thừa của 2 cộng lại bằng số cần đổi."],
    socratic: ["Với 4 bit, số lớn nhất biểu diễn được là bao nhiêu?", "Vì sao 1 byte có 256 giá trị khác nhau?", "Cổng XOR cho 1 khi nào?"],
    objective: "O10-A-01",
  },
};

export function detectTopic(text: string, fallback: Topic = "general"): Topic {
  const t = text.toLowerCase();
  if (/\b(and|or|not)\b|logic|và|hoặc/.test(t)) return "logic";
  if (/for|while|range|lặp|vòng/.test(t)) return "loop";
  if (/test|kiểm thử|biên|trường hợp/.test(t)) return "test";
  if (/nhị phân|bit|byte|xor/.test(t)) return "binary";
  if (/\bif\b|elif|else|điều kiện|rẽ nhánh/.test(t)) return "if";
  return fallback;
}

function checkQuestion(objective: string, turn: number): TutorOutput["quiz"] {
  const pool = QUESTIONS.filter((q) => q.objectiveId === objective && (q.kind === "mcq" || q.kind === "truefalse"));
  const q = pool[turn % Math.max(1, pool.length)];
  if (!q) return undefined;
  if (q.kind === "mcq") return { question: q.prompt, code: q.code, options: q.options, correctIndex: q.correctIndex, explanation: q.explanation };
  if (q.kind === "truefalse") return { question: q.prompt, options: ["Đúng", "Sai"], correctIndex: q.answer ? 0 : 1, explanation: q.explanation };
  return undefined;
}

export function tutorReply(i: TutorInput): TutorOutput {
  if (i.locked) return { reply: "Em đang làm bài kiểm tra chính thức nên gia sư tạm khóa gợi ý. Hãy tự tin làm bài, sau khi nộp em có thể hỏi lại nhé.", hintLevel: 0 };
  const asksAnswer = /đáp án|giải hộ|làm hộ|viết hộ|cho em code|full code/i.test(i.message);
  const topic = i.topic === "general" ? detectTopic(i.message, "if") : i.topic;
  const L = LIB[topic === "general" ? "if" : topic];
  const level = Math.min(i.turn, L.hints.length - 1);

  if (asksAnswer)
    return { reply: "Mình không đưa đáp án hoàn chỉnh, vì mục tiêu là em tự làm được. Mình gợi ý nhé: " + L.hints[0], hintLevel: 1 };

  switch (i.action) {
    case "simpler":
      return { reply: L.simpler, hintLevel: 0 };
    case "example":
      return { reply: L.example.text, code: L.example.code, hintLevel: 0 };
    case "check": {
      const quiz = checkQuestion(L.objective, i.turn);
      return quiz ? { reply: "Thử câu này để kiểm tra em đã hiểu chưa:", quiz, hintLevel: 0 } : { reply: L.socratic[0], hintLevel: 0 };
    }
    case "hint":
      return { reply: L.hints[level], hintLevel: level + 1 };
  }

  switch (i.mode) {
    case "explain":
      return { reply: L.explain + (i.context.title ? ` Trong bài “${i.context.title}”, em hãy thử áp dụng ý này vào ví dụ đầu tiên.` : ""), hintLevel: 0 };
    case "hint":
      return { reply: L.hints[level], hintLevel: level + 1 };
    case "socratic":
      return { reply: L.socratic[i.turn % L.socratic.length], hintLevel: 0 };
    case "review": {
      const quiz = checkQuestion(i.context.weakObjective ?? L.objective, i.turn);
      return { reply: i.context.weakObjective ? "Dựa trên kết quả gần đây, đây là câu ôn tập cho mục tiêu em chưa vững:" : "Câu ôn tập cho em:", quiz, hintLevel: 0 };
    }
    case "debug": {
      const e = i.context.error;
      if (e)
        return { reply: `Chương trình báo lỗi ${e.type} ở dòng ${e.line}. ${e.explain} Em hãy nhìn dòng ${e.line} và dòng ngay phía trên nó.`, hintLevel: level + 1 };
      if (i.context.failing?.length)
        return { reply: `Chương trình chạy được nhưng sai ở trường hợp: ${i.context.failing.slice(0, 2).join("; ")}. ${L.hints[level]}`, hintLevel: level + 1 };
      return { reply: "Mình chưa thấy lỗi nào được ghi lại. Em hãy chạy chương trình hoặc bộ kiểm thử, rồi hỏi lại để mình xem kết quả nhé.", hintLevel: 0 };
    }
  }
}
