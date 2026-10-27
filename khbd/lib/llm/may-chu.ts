import { adapterGiaLap, type AdapterLlm } from "./index";
import { adapterAnthropic } from "./anthropic";
import { adapterGemini } from "./gemini";
import { taoMauGiaLap } from "./mau-gia-lap";
import type { NguCanhSoan } from "@khbd/lib/pipeline/4-sinh-noi-dung/dinh-nghia";

/** Chọn adapter theo LLM_PROVIDER: "mock" (mặc định, giả lập), "anthropic" hoặc "gemini". */
export function layAdapterMayChu(ctx: NguCanhSoan, env: Record<string, string | undefined> = process.env): AdapterLlm {
  const nhaCungCap = (env.LLM_PROVIDER ?? "mock").toLowerCase();
  if (nhaCungCap === "mock") return adapterGiaLap(taoMauGiaLap(ctx), { min: 300, max: 700 });
  if (nhaCungCap === "anthropic") return adapterAnthropic(env);
  if (nhaCungCap === "gemini") return adapterGemini(env);
  throw new Error(`Nhà cung cấp "${nhaCungCap}" chưa được hỗ trợ. Dùng LLM_PROVIDER=anthropic, gemini hoặc mock.`);
}
