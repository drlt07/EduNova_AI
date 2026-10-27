/**
 * Khám phá AI (Tin 12 – Bài 1, 2 KNTT): camera ở chợ đầu mối học cách phân loại xoài chín / xoài xanh.
 * Logic thuần: dữ liệu có nhãn, mô hình k láng giềng gần nhất (k = 3), độ chính xác, thiên lệch do dữ liệu thiếu đa dạng.
 */

export type Label = "chin" | "xanh";
export const LABEL_TEXT: Record<Label, string> = { chin: "Chín", xanh: "Còn xanh" };

export interface Mango {
  id: string;
  variety: "Xoài cát" | "Xoài keo";
  /** 0 = vỏ xanh lá, 1 = vỏ vàng */
  color: number;
  /** 0 = cứng, 1 = mềm */
  soft: number;
  label: Label;
}

const m = (id: string, variety: Mango["variety"], color: number, soft: number, label: Label): Mango => ({ id, variety, color, soft, label });

/** Dữ liệu huấn luyện ban đầu: chỉ có xoài cát (chín là vỏ vàng, mềm). */
export const TRAIN: Mango[] = [
  m("t1", "Xoài cát", 0.1, 0.15, "xanh"), m("t2", "Xoài cát", 0.8, 0.65, "chin"), m("t3", "Xoài cát", 0.2, 0.3, "xanh"),
  m("t4", "Xoài cát", 0.9, 0.8, "chin"), m("t5", "Xoài cát", 0.3, 0.2, "xanh"), m("t6", "Xoài cát", 0.75, 0.6, "chin"),
  m("t7", "Xoài cát", 0.25, 0.45, "xanh"), m("t8", "Xoài cát", 0.85, 0.9, "chin"), m("t9", "Xoài cát", 0.15, 0.4, "xanh"),
  m("t10", "Xoài cát", 0.95, 0.7, "chin"),
];

/** Lô xoài mới về chợ — có cả xoài keo (chín mà vỏ vẫn xanh). */
export const TEST: Mango[] = [
  m("q1", "Xoài cát", 0.2, 0.25, "xanh"), m("q2", "Xoài cát", 0.35, 0.35, "xanh"), m("q3", "Xoài cát", 0.85, 0.75, "chin"),
  m("q4", "Xoài cát", 0.7, 0.7, "chin"), m("q5", "Xoài keo", 0.2, 0.8, "chin"), m("q6", "Xoài keo", 0.3, 0.75, "chin"),
  m("q7", "Xoài keo", 0.25, 0.85, "chin"), m("q8", "Xoài keo", 0.15, 0.2, "xanh"), m("q9", "Xoài cát", 0.9, 0.6, "chin"),
  m("q10", "Xoài cát", 0.3, 0.1, "xanh"),
];

/** Mẫu bổ sung: xoài keo chín đã được người bán gán nhãn. */
export const EXTRA_KEO: Mango[] = [
  m("k1", "Xoài keo", 0.2, 0.75, "chin"), m("k2", "Xoài keo", 0.3, 0.85, "chin"), m("k3", "Xoài keo", 0.25, 0.7, "chin"), m("k4", "Xoài keo", 0.15, 0.9, "chin"),
];

export const K = 3;

export function predict(train: Mango[], color: number, soft: number): Label {
  const near = [...train].sort((a, b) => Math.hypot(a.color - color, a.soft - soft) - Math.hypot(b.color - color, b.soft - soft)).slice(0, K);
  const chin = near.filter((x) => x.label === "chin").length;
  return chin * 2 > near.length ? "chin" : "xanh";
}

export function evaluate(train: Mango[], test: Mango[]) {
  const rows = test.map((t) => ({ ...t, guess: predict(train, t.color, t.soft) }));
  const correct = rows.filter((r) => r.guess === r.label).length;
  return { rows, correct, accuracy: Math.round((correct / test.length) * 100) };
}

/** Lưới vùng quyết định để vẽ (n × n ô). */
export function decisionGrid(train: Mango[], n = 20): Label[][] {
  return Array.from({ length: n }, (_, r) => Array.from({ length: n }, (_, c) => predict(train, (c + 0.5) / n, 1 - (r + 0.5) / n)));
}

export const BIAS_OPTIONS = [
  "Camera bị hỏng nên nhìn sai màu",
  "Dữ liệu huấn luyện chỉ có xoài cát, máy chưa từng thấy xoài keo chín",
  "Cần dạy máy lâu hơn với đúng 10 quả cũ",
  "AI không bao giờ phân loại được trái cây",
];
export const BIAS_ANSWER = 1;

export const AI_OR_NOT: { text: string; ai: boolean; why: string }[] = [
  { text: "Hộp thư tự chuyển thư rác vào mục Spam, càng ngày càng lọc đúng hơn khi em bấm “Đây là thư rác”.", ai: true, why: "Mô hình học từ các thư đã được đánh dấu — học từ dữ liệu." },
  { text: "Đèn giao thông đổi màu theo giờ đã cài sẵn: xanh 30 giây, vàng 3 giây, đỏ 30 giây.", ai: false, why: "Chỉ chạy theo lịch cố định do người viết, không học từ dữ liệu." },
  { text: "Điện thoại mở khóa bằng khuôn mặt, nhận ra em cả khi đeo kính.", ai: true, why: "Nhận dạng khuôn mặt là mô hình học máy được huấn luyện trên nhiều ảnh." },
  { text: "Chương trình Python dùng if–else xếp loại học lực theo điểm trung bình.", ai: false, why: "Luật do người viết sẵn; máy không tự học." },
  { text: "Ứng dụng bản đồ dự đoán đường kẹt xe lúc 17 giờ dựa trên dữ liệu những ngày trước.", ai: true, why: "Dự đoán từ dữ liệu lịch sử là học máy." },
  { text: "Máy tính bỏ túi tính 125 × 48.", ai: false, why: "Tính toán theo quy tắc cố định, không học." },
];
