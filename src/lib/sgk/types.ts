/**
 * Sách giáo khoa số EduNova: nội dung bài viết lại theo mục lục SGK Tin học "Kết nối tri thức" (không sao chép
 * văn bản sách in). Một bài = mục tiêu → khởi động → các mục kiến thức (có mô phỏng, câu hỏi củng cố đặt đúng
 * chỗ) → luyện tập → vận dụng → ghi nhớ.
 */
import type { AlgoId } from "@/lib/data/hsg";

/** Hình minh họa vẽ sẵn (SVG), xem components/sgk/figures.tsx. */
export type FigureId = "ipo" | "binary-place" | "logic-gates" | "if-flow" | "loop-flow" | "function-box" | "bug-kinds" | "computer-parts" | "os-layers" | "db-table" | "lan" | "packet-layers" | "ai-learn" | "html-tree" | "css-rule" | "variable-box";

export type BookBlock =
  /** Đoạn văn; **đậm** và `code` được hiển thị. */
  | { t: "p"; text: string }
  | { t: "list"; items: string[]; ordered?: boolean }
  | { t: "code"; code: string; output?: string; caption?: string }
  | { t: "table"; head: string[]; rows: string[][]; caption?: string }
  | { t: "note"; tone: "key" | "tip" | "warn"; text: string }
  | { t: "figure"; fig: FigureId; caption: string }
  /** Mô phỏng đặt ngay tại mục kiến thức tương ứng. */
  | { t: "sim"; slug: string; task: string }
  | { t: "algo"; id: AlgoId; task: string }
  /** Câu hỏi củng cố gắn với một yêu cầu cần đạt (chỉ số trong objectives). */
  | { t: "check"; id: string; q: string; options: string[]; answer: number; why: string; objective: number };

export interface BookSection {
  id: string;
  title: string;
  blocks: BookBlock[];
}

/** Ghi chú của người dùng trên một mục của bài. */
export interface BookNote { id: string; userId: string; ref: string; sectionId: string; text: string; at: string }
/** Tiến độ đọc: các mục đã đọc, mục đọc gần nhất. */
export interface BookProgress { userId: string; ref: string; read: string[]; last?: string; at: string }
/** Giáo viên đánh dấu đã dạy bài ở một lớp. */
export interface TaughtLesson { teacherId: string; classId: string; ref: string; at: string }

export interface BookLesson {
  /** Mã bài SGK "lớp-số bài", vd "10-19". */
  ref: string;
  /** Yêu cầu cần đạt, viết theo chương trình. */
  objectives: string[];
  /** Số tiết dự kiến. */
  periods: number;
  warmUp: string;
  sections: BookSection[];
  practice: { task: string; hint?: string; answer?: string }[];
  apply: string;
  remember: string[];
}
