/**
 * Adapter dùng quyền "sample" của trang Claude (bản xem trước): gọi Claude bằng tài khoản người xem,
 * không cần khóa API. Không có system prompt riêng nên ghép luật + nội dung + khuôn JSON vào một lời nhắc.
 */
import * as z from "zod/v4";
import { kiemTraKhuon, LoiLlm, type AdapterLlm } from "./index";

type HamSample = {
  json<T = unknown>(input: string, options?: { signal?: AbortSignal; modelTier?: "default" | "complex" | "quick"; cache?: boolean }): Promise<T>;
};

const THONG_BAO: Record<string, string> = {
  not_granted: "Thầy/cô chưa cho phép trang dùng Claude để soạn.",
  sampling_disabled: "Tài khoản này chưa dùng được Claude để soạn.",
  rate_limited: "Đã dùng nhiều lượt liên tiếp. Thầy/cô chờ một lát rồi soạn lại.",
  refused: "Claude không soạn phần này. Thầy/cô thử soạn lại.",
  invalid_json: "Kết quả chưa đúng định dạng. Thầy/cô soạn lại phần này.",
  prompt_too_large: "Giáo án quá dài cho một lượt soạn.",
};

export async function layAdapterSample(): Promise<AdapterLlm | null> {
  const claude = (globalThis as unknown as { claude?: { use(ten: string): Promise<unknown> } }).claude;
  const sample = claude ? ((await claude.use("sample")) as HamSample | null) : null;
  if (!sample) return null;
  return {
    ten: "claude",
    giaLap: false,
    async goi(yc, signal) {
      const khuon = JSON.stringify(z.toJSONSchema(yc.schema));
      const loiNhac = `${yc.heThong}\n\n${yc.noiDung}\n\nChỉ trả lời bằng đúng một đối tượng JSON theo JSON Schema sau, không kèm chữ nào khác:\n${khuon}`;
      try {
        const kq = await sample.json(loiNhac, { signal, modelTier: "default", cache: false });
        return kiemTraKhuon(yc.schema, kq);
      } catch (e) {
        if (e instanceof LoiLlm) throw e;
        const ma = (e as { code?: string })?.code ?? "";
        if (ma === "cancelled") throw new DOMException("Đã dừng", "AbortError");
        throw new LoiLlm(THONG_BAO[ma] ?? "Không soạn được phần này. Thầy/cô soạn lại.", ma === "refused" ? "tu_choi" : "khac");
      }
    },
  };
}
