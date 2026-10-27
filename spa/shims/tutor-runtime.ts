/**
 * Bản demo một file: AI Gia sư dùng quyền "sample" của trang Claude (tài khoản người xem).
 * Ngoài Claude hoặc khi người xem không cho phép → null, gia sư dùng bộ luật.
 */
import { layAdapterSample } from "@khbd/lib/llm/sample";
import { TutorLlmSchema, type TutorLlm } from "@/lib/ai/tutor-llm";

export const tutorLlm: TutorLlm = async (system, content, signal) => {
  const adapter = await layAdapterSample().catch(() => null);
  if (!adapter) return null;
  return adapter.goi({ luot: "gia_su", heThong: system, noiDung: content, schema: TutorLlmSchema }, signal);
};

export const TUTOR_SOURCE_NOTE = "Trên Claude, gia sư trả lời bằng tài khoản Claude của người xem; nếu không được phép, gia sư dùng bộ luật dựa trên bài làm thật của em.";
