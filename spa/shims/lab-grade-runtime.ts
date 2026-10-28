/**
 * Bản demo một file: chấm phần giải thích bằng quyền "sample" của trang Claude (tài khoản người xem).
 * Ngoài Claude hoặc khi người xem không cho phép → null, bài được chấm bằng bộ luật.
 */
import { layAdapterSample } from "@khbd/lib/llm/sample";
import { LabGradeLlmSchema, type LabGradeLlm } from "@/lib/ai/lab-grader";

export const labGradeLlm: LabGradeLlm = async (system, content, signal) => {
  const adapter = await layAdapterSample().catch(() => null);
  if (!adapter) return null;
  return adapter.goi({ luot: "cham_mo_phong", heThong: system, noiDung: content, schema: LabGradeLlmSchema }, signal);
};
