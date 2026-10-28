/** Khung chung cho mô phỏng thuật toán: mỗi thuật toán sinh ra danh sách "khung hình" (frame) để phát lại từng bước. */

/** Câu hỏi dự đoán gắn vào một khung: học sinh đoán trước khi xem bước tiếp theo. */
export interface Ask {
  q: string;
  options: string[];
  answer: number;
}

export interface FrameBase {
  /** Dòng code (tính từ 0) đang chạy, để tô sáng. */
  line: number;
  /** Lời giải thích bước này, viết cho học sinh. */
  note: string;
  ask?: Ask;
}

/** Bộ đếm hiển thị dưới mô phỏng: tên → giá trị. */
export type Counters = Record<string, number | string>;
