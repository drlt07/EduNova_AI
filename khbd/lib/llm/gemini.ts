/**
 * Adapter Google Gemini (có gói miễn phí giới hạn lượt). Dùng ở máy chủ (LLM_PROVIDER=gemini, khóa trong .env)
 * hoặc trên trình duyệt với khóa riêng của giáo viên. Kết quả là JSON theo schema zod (đổi sang JSON Schema),
 * rồi kiểm tra lại bằng zod như mọi adapter khác.
 */
import { ApiError, FinishReason, GoogleGenAI } from "@google/genai";
import * as z from "zod/v4";
import { kiemTraKhuon, LoiLlm, type AdapterLlm } from "./index";

/** Tên rút gọn luôn trỏ tới bản Flash mới nhất (bản có trong gói miễn phí). */
export const MO_HINH_GEMINI_MAC_DINH = "gemini-flash-latest";

export type CauHinhGemini = { apiKey: string; model?: string; trinhDuyet?: boolean };

/** Đổi lỗi của Gemini thành thông báo tiếng Việt cho giáo viên. */
export function loiGemini(e: unknown, trinhDuyet = false): unknown {
  if (e instanceof LoiLlm) return e;
  const noiSua = trinhDuyet ? "Kiểm tra lại khóa trong mục “Khóa AI của tôi”." : "Kiểm tra LLM_API_KEY.";
  if (e instanceof ApiError) {
    if (e.status === 400 && /api key/i.test(e.message)) return new LoiLlm(`Khóa API Gemini không hợp lệ. ${noiSua}`, "chua_cau_hinh");
    if (e.status === 401 || e.status === 403) return new LoiLlm(`Khóa API Gemini không có quyền dùng mô hình này. ${noiSua}`, "chua_cau_hinh");
    if (e.status === 404) return new LoiLlm("Không tìm thấy mô hình Gemini đã chọn. Để trống ô mô hình để dùng mặc định.", "chua_cau_hinh");
    if (e.status === 429) return new LoiLlm("Đã hết lượt miễn phí của Gemini trong lúc này (giới hạn theo phút hoặc theo ngày). Thầy/cô chờ rồi soạn lại, hoặc dùng khóa trả phí.");
    if (e.status >= 500) return new LoiLlm(`Máy chủ Gemini đang lỗi (${e.status}). Thầy/cô soạn lại phần này.`);
    return new LoiLlm(`Gemini từ chối yêu cầu: ${e.message}`);
  }
  if (e instanceof TypeError) return new LoiLlm("Không kết nối được tới Gemini. Thầy/cô kiểm tra mạng rồi soạn lại.");
  return e;
}

/** JSON Schema cho Gemini từ schema zod (bỏ khóa $schema). */
export function jsonSchemaChoGemini(schema: z.ZodType): unknown {
  const { $schema: _boQua, ...js } = z.toJSONSchema(schema) as Record<string, unknown>;
  return js;
}

export function taoAdapterGemini(ch: CauHinhGemini): AdapterLlm {
  const ai = new GoogleGenAI({ apiKey: ch.apiKey });
  const model = ch.model?.trim() || MO_HINH_GEMINI_MAC_DINH;
  return {
    ten: "gemini",
    giaLap: false,
    docAnh: true,
    async goi(yc, signal) {
      try {
        const res = await ai.models.generateContent({
          model,
          contents: yc.anh?.length
            ? [{ role: "user", parts: [...yc.anh.map((a) => ({ inlineData: { mimeType: a.mime, data: a.base64 } })), { text: yc.noiDung }] }]
            : yc.noiDung,
          config: {
            systemInstruction: yc.heThong,
            responseMimeType: "application/json",
            responseJsonSchema: jsonSchemaChoGemini(yc.schema),
            maxOutputTokens: 16000,
            abortSignal: signal,
          },
        });
        const lyDo = res.candidates?.[0]?.finishReason;
        if (lyDo === FinishReason.MAX_TOKENS) throw new LoiLlm("Nội dung quá dài, bị cắt giữa chừng. Thầy/cô soạn lại phần này.", "sai_khuon");
        if (lyDo === FinishReason.SAFETY || lyDo === FinishReason.PROHIBITED_CONTENT || lyDo === FinishReason.BLOCKLIST) {
          throw new LoiLlm("Mô hình từ chối phần này. Thầy/cô thử soạn lại hoặc sửa nội dung.", "tu_choi");
        }
        let duLieu: unknown;
        try {
          duLieu = JSON.parse(res.text ?? "");
        } catch {
          throw new LoiLlm("Kết quả của Gemini không phải JSON hợp lệ. Thầy/cô soạn lại phần này.", "sai_khuon");
        }
        return kiemTraKhuon(yc.schema, duLieu);
      } catch (e) {
        throw loiGemini(e, ch.trinhDuyet);
      }
    },
  };
}

/** Kiểm tra khóa mà không tốn lượt soạn: lấy thông tin mô hình. */
export async function kiemTraKhoaGemini(ch: CauHinhGemini): Promise<void> {
  try {
    await new GoogleGenAI({ apiKey: ch.apiKey }).models.get({ model: ch.model?.trim() || MO_HINH_GEMINI_MAC_DINH });
  } catch (e) {
    throw loiGemini(e, ch.trinhDuyet);
  }
}

/** Máy chủ: khóa chung trong .env. */
export function adapterGemini(env: Record<string, string | undefined>): AdapterLlm {
  const apiKey = env.LLM_API_KEY || env.GEMINI_API_KEY;
  if (!apiKey) throw new LoiLlm("Chưa đặt LLM_API_KEY trong file .env.", "chua_cau_hinh");
  return taoAdapterGemini({ apiKey, model: env.LLM_MODEL });
}
