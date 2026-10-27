/** Nhãn tiếng Việt dùng chung cho giao diện. */
import type { HintMode, LabMode, LabTestCase } from "@/lib/domain/types";

export const MODE_LABEL: Record<LabMode, string> = { explore: "Khám phá", challenge: "Thử thách", assessment: "Kiểm tra" };
/** Mức hỗ trợ của AI Gia sư cho bài giao (trường hintMode): full = Học tự do, guided = Có hướng dẫn, off = Kiểm tra. */
export const HINT_LABEL: Record<HintMode, string> = { off: "Kiểm tra (AI Gia sư tắt)", guided: "Luyện tập có hướng dẫn", full: "Học tự do" };
export const CASE_LABEL: Record<LabTestCase["category"], string> = { normal: "thông thường", boundary: "giá trị biên", "no-water": "hết nước", extreme: "giá trị cực" };
export const ATTEMPT_LABEL: Record<string, string> = { in_progress: "đang làm", paused: "tạm dừng", submitted: "đã nộp" };
