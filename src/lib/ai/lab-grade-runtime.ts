/**
 * Mô hình chấm bài mô phỏng trong app Next.js: gọi /api/lab-grade (khóa LLM_PROVIDER/LLM_API_KEY ở máy chủ).
 * Máy chủ ở chế độ mock → null, bài được chấm bằng bộ luật. Bản demo một file thay bằng spa/shims/lab-grade-runtime.ts.
 */
import type { LabGradeLlm } from "./lab-grader";

export const labGradeLlm: LabGradeLlm = async (system, content, signal) => {
  const res = await fetch("/api/lab-grade", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ system, content }), signal });
  if (!res.ok) return null;
  const json = (await res.json()) as { fallback?: boolean; data?: unknown };
  return json.fallback ? null : (json.data ?? null);
};
