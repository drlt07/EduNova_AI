/**
 * Mô hình cho AI Gia sư trong app Next.js: gọi /api/tutor (khóa chung LLM_PROVIDER/LLM_API_KEY ở máy chủ).
 * Máy chủ ở chế độ mock → trả null để gia sư dùng bộ luật. Bản demo một file thay bằng spa/shims/tutor-runtime.ts.
 */
import type { TutorLlm } from "./tutor-llm";

export const tutorLlm: TutorLlm = async (system, content, signal) => {
  const res = await fetch("/api/tutor", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ system, content }), signal });
  if (!res.ok) throw new Error("Gia sư chưa trả lời được");
  const json = (await res.json()) as { fallback?: boolean; data?: unknown };
  return json.fallback ? null : (json.data ?? null);
};

/** Mô tả nguồn trả lời hiển thị cho học sinh. */
export const TUTOR_SOURCE_NOTE = "Khi máy chủ chưa kết nối mô hình AI, gia sư trả lời theo bộ luật dựa trên bài làm thật của em.";
