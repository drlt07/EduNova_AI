/** Thông tin hiển thị thư viện tình huống mô phỏng: chủ đề, mức độ, thời lượng, số nhiệm vụ. */
import { CLUES } from "@/lib/sim/sql-detective";

export const LAB_TOPICS = [
  { id: "he-thong", label: "Hệ thống máy tính & Số hóa" },
  { id: "mang", label: "Mạng máy tính & Internet" },
  { id: "lap-trinh", label: "Thuật toán & Lập trình" },
  { id: "csdl", label: "Cơ sở dữ liệu & SQL" },
  { id: "dao-duc", label: "Đạo đức, Pháp luật số" },
  { id: "ai", label: "Trí tuệ nhân tạo (AI)" },
  { id: "logic", label: "Mạch logic & Phần cứng" },
] as const;
export type LabTopic = (typeof LAB_TOPICS)[number]["id"];

export const LAB_LEVELS = { "co-ban": "Cơ bản", "trung-binh": "Trung bình", "nang-cao": "Nâng cao" } as const;
export type LabLevel = keyof typeof LAB_LEVELS;

export interface LabMeta { topic: LabTopic; level: LabLevel; minutes: number; missions: number }

export const LAB_META: Record<string, LabMeta> = {
  "smart-garden": { topic: "lap-trinh", level: "co-ban", minutes: 20, missions: 3 },
  "binary-logic": { topic: "logic", level: "co-ban", minutes: 15, missions: 2 },
  "smart-coding-city": { topic: "lap-trinh", level: "trung-binh", minutes: 25, missions: 3 },
  "debug-detective": { topic: "lap-trinh", level: "trung-binh", minutes: 25, missions: 3 },
  "digital-safety": { topic: "dao-duc", level: "co-ban", minutes: 15, missions: 3 },
  "inside-computer-3d": { topic: "he-thong", level: "co-ban", minutes: 25, missions: 3 },
  "os-explorer": { topic: "he-thong", level: "trung-binh", minutes: 20, missions: 3 },
  "database-city": { topic: "csdl", level: "trung-binh", minutes: 30, missions: 3 },
  "sql-detective": { topic: "csdl", level: "nang-cao", minutes: 30, missions: CLUES.length },
  "ai-discovery": { topic: "ai", level: "trung-binh", minutes: 25, missions: 3 },
  "network-journey": { topic: "mang", level: "trung-binh", minutes: 30, missions: 3 },
  "web-creator": { topic: "lap-trinh", level: "co-ban", minutes: 30, missions: 1 },
  "digital-citizen": { topic: "dao-duc", level: "co-ban", minutes: 20, missions: 3 },
  "binary-control": { topic: "logic", level: "co-ban", minutes: 15, missions: 5 },
  "smart-home": { topic: "logic", level: "trung-binh", minutes: 20, missions: 5 },
  "digital-camera": { topic: "he-thong", level: "trung-binh", minutes: 25, missions: 5 },
  "robot-factory": { topic: "lap-trinh", level: "co-ban", minutes: 20, missions: 5 },
  "maze-robot": { topic: "lap-trinh", level: "trung-binh", minutes: 25, missions: 4 },
  "software-ecosystem": { topic: "he-thong", level: "co-ban", minutes: 15, missions: 4 },
  "device-connection": { topic: "he-thong", level: "co-ban", minutes: 15, missions: 4 },
  "cloud-sharing": { topic: "mang", level: "co-ban", minutes: 20, missions: 4 },
  "network-builder": { topic: "mang", level: "trung-binh", minutes: 20, missions: 4 },
  "css-box": { topic: "lap-trinh", level: "trung-binh", minutes: 20, missions: 4 },
  "web-navigation": { topic: "mang", level: "trung-binh", minutes: 20, missions: 4 },
};

/** Tình huống mô phỏng chính của từng bài (Kết nối tri thức), xếp trước các mô phỏng khác của bài. */
export const SGK_SIMS: Record<string, string[]> = {
  "10-4": ["binary-control"],
  "10-5": ["smart-home"],
  "10-6": ["digital-camera"],
  "10-19": ["smart-coding-city", "smart-garden"],
  "10-20": ["robot-factory"],
  "10-21": ["maze-robot"],
  "11-1": ["os-explorer"],
  "11-3": ["software-ecosystem"],
  "11-4": ["inside-computer-3d"],
  "11-5": ["device-connection"],
  "11-6": ["cloud-sharing"],
  "12-1": ["ai-discovery"],
  "12-3": ["network-builder"],
  "12-4": ["network-journey"],
  "12-10": ["web-navigation"],
  "12-16": ["css-box"],
};

export const labMeta = (slug: string): LabMeta => LAB_META[slug] ?? { topic: "lap-trinh", level: "co-ban", minutes: 20, missions: 1 };
export const topicLabel = (t: LabTopic) => LAB_TOPICS.find((x) => x.id === t)!.label;
