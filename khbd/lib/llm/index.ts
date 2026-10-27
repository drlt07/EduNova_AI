/**
 * Lớp gọi LLM dùng chung. Mọi adapter nhận { heThong, noiDung, schema } và trả về dữ liệu ĐÃ kiểm tra
 * theo schema (zod). Trong phát triển và test chỉ dùng adapter giả lập; adapter thật đọc khóa từ
 * biến môi trường, chỉ chạy phía máy chủ (lib/llm/anthropic.ts).
 */
import type * as z from "zod/v4";

/** anh: ảnh gửi kèm (base64, không có tiền tố data:), chỉ dùng cho adapter có docAnh. */
export type AnhLlm = { mime: string; base64: string };
export type YeuCauLlm = { luot: string; heThong: string; noiDung: string; schema: z.ZodType; anh?: AnhLlm[] };

export interface AdapterLlm {
  ten: string;
  giaLap: boolean;
  /** Adapter gửi được ảnh cho mô hình (đọc hình trong giáo án). */
  docAnh?: boolean;
  goi(yc: YeuCauLlm, signal?: AbortSignal): Promise<unknown>;
}

export class LoiLlm extends Error {
  constructor(message: string, public ma: "tu_choi" | "sai_khuon" | "chua_cau_hinh" | "khac" = "khac") {
    super(message);
  }
}

export const cho = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((ok, loi) => {
    const t = setTimeout(ok, ms);
    signal?.addEventListener("abort", () => { clearTimeout(t); loi(new DOMException("Đã dừng", "AbortError")); });
  });

/** Kiểm tra dữ liệu LLM trả về; sai khuôn thì báo lỗi rõ ràng (bước 5 sẽ cho soạn lại). */
export function kiemTraKhuon(schema: z.ZodType, duLieu: unknown): unknown {
  const kq = schema.safeParse(duLieu);
  if (!kq.success) throw new LoiLlm(`Kết quả không đúng khuôn: ${kq.error.issues.slice(0, 3).map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")}`, "sai_khuon");
  return kq.data;
}

/** Giả lập: trả JSON mẫu đúng khuôn cho từng lượt (dùng cho test và chạy thử). */
export function adapterGiaLap(taoMau: (luot: string, yc: YeuCauLlm) => unknown, thoiGian = { min: 400, max: 900 }): AdapterLlm {
  return {
    ten: "mock",
    giaLap: true,
    docAnh: true,
    async goi(yc, signal) {
      await cho(thoiGian.min + Math.random() * (thoiGian.max - thoiGian.min), signal);
      return kiemTraKhuon(yc.schema, taoMau(yc.luot, yc));
    },
  };
}
