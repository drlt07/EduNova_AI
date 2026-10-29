/**
 * Nhà máy robot (Tin 10 Bài 20): logic range của Python và bộ chẩn đoán lỗi thường gặp.
 * Chỉ dựa trên dãy giá trị, không phụ thuộc hoạt ảnh — giao diện vẽ gì cũng không đổi kết quả chấm.
 */

export const SLOTS = 13;

/** Dãy giá trị của range như Python (bước khác 0), cắt ở 40 phần tử để an toàn. */
export function pyRange(start: number, stop: number, step: number): number[] {
  const out: number[] = [];
  if (step === 0) return out;
  for (let i = start; step > 0 ? i < stop : i > stop; i += step) { out.push(i); if (out.length >= 40) break; }
  return out;
}

export const rangeText = (a: number, b: number, s: number) => (s === 1 && a === 0 ? `range(${b})` : s === 1 ? `range(${a}, ${b})` : `range(${a}, ${b}, ${s})`);

export interface RangeTask { id: string; prompt: string; target: number[]; why: string }

export const RANGE_TASKS: RangeTask[] = [
  { id: "t1", prompt: "Đặt hộp vào các vị trí 0, 1, 2, 3, 4.", target: [0, 1, 2, 3, 4], why: "range(5) chạy từ 0 đến 4." },
  { id: "t2", prompt: "Đặt hộp vào các vị trí 3 đến 8.", target: [3, 4, 5, 6, 7, 8], why: "range(3, 9): stop = 9 vì stop không được lấy." },
  { id: "t3", prompt: "Chỉ đặt hộp ở vị trí chẵn từ 2 đến 10.", target: [2, 4, 6, 8, 10], why: "range(2, 11, 2) hoặc range(2, 12, 2)." },
  { id: "t4", prompt: "Đặt hộp ở 10, 7, 4, 1 (cánh tay đi ngược).", target: [10, 7, 4, 1], why: "Bước âm: range(10, 0, -3)." },
  { id: "t5", prompt: "Lặp đúng 4 lần, bắt đầu từ vị trí 5, mỗi lần cách 2 ô.", target: [5, 7, 9, 11], why: "range(5, 12, 2) cho 5, 7, 9, 11." },
  { id: "t6", prompt: "Vận dụng: xe nâng chỉ lấy hàng từ cuối băng chuyền về đầu, ở các ô chia hết cho 4 (không lấy ô 0).", target: [12, 8, 4], why: "range(12, 0, -4): bắt đầu ở 12, bước −4, dừng trước 0 nên ô 0 không có hộp." },
];

export type RangeError = "empty" | "step-sign" | "start" | "step-size" | "missing-last" | "extra-last" | "other";

/** Tên lỗi hiển thị cho học sinh và thầy cô. */
export const RANGE_ERROR_LABEL: Record<RangeError, string> = {
  empty: "range rỗng (start đã vượt qua stop)",
  "step-sign": "bước sai chiều",
  start: "sai điểm bắt đầu",
  "step-size": "sai độ lớn bước",
  "missing-last": "thiếu phần tử cuối (stop không được lấy)",
  "extra-last": "thừa phần tử ở cuối",
  other: "dãy chưa khớp",
};

export interface RangeDiagnosis {
  ok: boolean;
  error?: RangeError;
  /** Ba bậc gợi ý: nhắc quy tắc → chỉ chỗ sai → gợi ý tham số. Không đưa nguyên đáp án. */
  hints: [string, string, string];
  /** Ô có hộp nhưng không phải đích, và ô đích còn trống — để tô trên băng chuyền. */
  wrong: number[];
  missing: number[];
}

// Không để lộ là đã đúng trước khi học sinh tự kiểm tra
const OK_HINTS: [string, string, string] = ["Nhẩm lần lượt các giá trị của i: start, start + step, … và dừng trước stop.", "So từng giá trị đó với các ô đích có khung tím.", "Nếu dãy em nhẩm khớp hết các ô đích, bấm Kiểm tra."];

/** So dãy range đang chọn với dãy đích, tìm lỗi đầu tiên theo thứ tự học sinh hay mắc. */
export function diagnoseRange(start: number, stop: number, step: number, target: number[]): RangeDiagnosis {
  const got = pyRange(start, stop, step);
  const gotSet = new Set(got), tSet = new Set(target);
  const wrong = got.filter((x) => !tSet.has(x));
  const missing = target.filter((x) => !gotSet.has(x));
  const ok = got.length === target.length && got.every((x, i) => x === target[i]);
  if (ok) return { ok, hints: OK_HINTS, wrong, missing };

  const first = target[0], last = target[target.length - 1];
  const tStep = target.length > 1 ? target[1] - target[0] : step;
  const down = tStep < 0;
  const res = (error: RangeError, hints: [string, string, string]): RangeDiagnosis => ({ ok, error, hints, wrong, missing });

  if (got.length === 0)
    return res("empty", [
      step > 0 ? "Với bước dương, i tăng dần: vòng lặp chỉ chạy khi start nhỏ hơn stop." : "Với bước âm, i giảm dần: vòng lặp chỉ chạy khi start lớn hơn stop.",
      `Hiện start = ${start}, stop = ${stop}: chưa có lần lặp nào nên băng chuyền trống.`,
      `Dãy đích ${down ? "đi ngược" : "đi xuôi"} từ ${first}. Đặt start = ${first} rồi chỉnh stop ${down ? "nhỏ hơn" : "lớn hơn"} ${last}.`,
    ]);
  if (target.length > 1 && Math.sign(step) !== Math.sign(tStep))
    return res("step-sign", [
      "Dấu của step quyết định chiều đi: step dương thì đi xuôi, step âm thì đi ngược.",
      `Dãy đích đi ${down ? "ngược (số giảm dần)" : "xuôi (số tăng dần)"}, còn step = ${step} đang đi ${step > 0 ? "xuôi" : "ngược"}.`,
      `Đổi dấu step${down ? " thành số âm" : " thành số dương"}, rồi kiểm tra lại start và stop.`,
    ]);
  if (got[0] !== first)
    return res("start", [
      "Giá trị đầu tiên của i luôn là start.",
      `Hộp đầu tiên đang rơi ở ô ${got[0]}, nhưng ô đích đầu tiên là ${first}.`,
      `Đặt start = ${first}.`,
    ]);
  if (target.length > 1 && Math.abs(step) !== Math.abs(tStep))
    return res("step-size", [
      "step là khoảng cách giữa hai giá trị liên tiếp của i.",
      `Hai ô đích liên tiếp cách nhau ${Math.abs(tStep)} ô, còn step đang là ${step}.`,
      `Đặt step = ${tStep}.`,
    ]);
  // start và step đã đúng: chỉ còn stop
  if (got.length < target.length)
    return res("missing-last", [
      "stop không được lấy: range dừng TRƯỚC khi chạm tới stop.",
      `Còn thiếu hộp ở ô ${missing.join(", ")}. Vòng lặp dừng sớm quá.`,
      `stop cần ${down ? "nhỏ hơn" : "lớn hơn"} ${last} — thử dịch stop thêm 1 ô về phía ${down ? "đầu" : "cuối"} băng chuyền.`,
    ]);
  if (got.length > target.length)
    return res("extra-last", [
      "Số lần lặp bằng số phần tử của range; stop quá xa thì lặp thừa.",
      `Hộp ở ô ${wrong.join(", ")} là thừa. Vòng lặp chạy quá dãy đích.`,
      `stop phải nằm ngay sau ${last} theo chiều đi, nhưng chưa tới ô ${got[target.length]}.`,
    ]);
  return res("other", ["So từng giá trị của i với các ô đích.", `Ô sai: ${wrong.join(", ") || "—"}; ô còn trống: ${missing.join(", ") || "—"}.`, "Chỉnh lần lượt start, step rồi stop."]);
}
