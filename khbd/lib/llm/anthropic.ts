/**
 * Adapter Anthropic (Claude). Dùng ở hai nơi:
 * - máy chủ: khóa chung đọc từ LLM_API_KEY (hoặc ANTHROPIC_API_KEY) trong .env;
 * - trình duyệt: khóa riêng của giáo viên (gọi thẳng Anthropic, không qua máy chủ của app).
 * Structured output theo schema zod; bật dự phòng phía máy chủ khi mô hình từ chối vì chính sách.
 */
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { kiemTraKhuon, LoiLlm, type AdapterLlm, type YeuCauLlm } from "./index";

export const MO_HINH_MAC_DINH = "claude-opus-5-5";

export type CauHinhAnthropic = { apiKey: string; model?: string; trinhDuyet?: boolean };

const taoClient = (ch: CauHinhAnthropic) =>
  // Khóa là của chính giáo viên, chỉ nằm trên trình duyệt của họ: cho phép gọi thẳng từ trình duyệt.
  new Anthropic({ apiKey: ch.apiKey, ...(ch.trinhDuyet ? { dangerouslyAllowBrowser: true } : {}) });

/** Đổi lỗi của Anthropic thành thông báo tiếng Việt cho giáo viên. */
export function loiAnthropic(e: unknown, trinhDuyet = false): unknown {
  if (e instanceof LoiLlm) return e;
  const noiSua = trinhDuyet ? "Kiểm tra lại khóa trong mục “Khóa AI của tôi”." : "Kiểm tra LLM_API_KEY.";
  if (e instanceof Anthropic.AuthenticationError) return new LoiLlm(`Khóa API Claude không hợp lệ hoặc đã bị thu hồi. ${noiSua}`, "chua_cau_hinh");
  if (e instanceof Anthropic.PermissionDeniedError) return new LoiLlm(`Khóa API Claude không có quyền dùng mô hình này. ${noiSua}`, "chua_cau_hinh");
  if (e instanceof Anthropic.NotFoundError) return new LoiLlm("Không tìm thấy mô hình Claude đã chọn. Để trống ô mô hình để dùng mặc định.", "chua_cau_hinh");
  if (e instanceof Anthropic.RateLimitError) return new LoiLlm("Đang quá nhiều yêu cầu tới Claude. Thầy/cô chờ một lát rồi soạn lại.");
  if (e instanceof Anthropic.BadRequestError) {
    // Hết tiền trong tài khoản trả về 400; không có lớp lỗi riêng.
    if (/credit balance/i.test(e.message)) return new LoiLlm("Tài khoản Claude đã hết tiền. Thầy/cô nạp thêm tại console.anthropic.com (mục Billing).", "chua_cau_hinh");
    return new LoiLlm(`Claude từ chối yêu cầu: ${e.message}`);
  }
  if (e instanceof Anthropic.APIConnectionError) return new LoiLlm("Không kết nối được tới Claude. Thầy/cô kiểm tra mạng rồi soạn lại.");
  if (e instanceof Anthropic.APIError) return new LoiLlm(`Lỗi máy chủ AI (${e.status}). Thầy/cô soạn lại phần này.`);
  return e;
}

type KieuAnhClaude = "image/jpeg" | "image/png" | "image/gif" | "image/webp";
export const ANH_CLAUDE_DOC_DUOC: readonly string[] = ["image/jpeg", "image/png", "image/gif", "image/webp"];

/** Nội dung gửi Claude: ảnh (nếu có) đặt trước lời nhắc. */
function noiDungAnthropic(yc: YeuCauLlm) {
  const anh = (yc.anh ?? []).filter((a) => ANH_CLAUDE_DOC_DUOC.includes(a.mime));
  if (!anh.length) return yc.noiDung;
  return [
    ...anh.map((a) => ({ type: "image" as const, source: { type: "base64" as const, media_type: a.mime as KieuAnhClaude, data: a.base64 } })),
    { type: "text" as const, text: yc.noiDung },
  ];
}

export function taoAdapterAnthropic(ch: CauHinhAnthropic): AdapterLlm {
  const client = taoClient(ch);
  const model = ch.model?.trim() || MO_HINH_MAC_DINH;
  return {
    ten: "anthropic",
    giaLap: false,
    docAnh: true,
    async goi(yc, signal) {
      try {
        const res = await client.beta.messages.parse(
          {
            model,
            max_tokens: 16000,
            betas: ["server-side-fallback-2026-07-01"],
            fallbacks: "default",
            system: yc.heThong,
            messages: [{ role: "user", content: noiDungAnthropic(yc) }],
            output_config: { format: betaZodOutputFormat(yc.schema), effort: "medium" },
          },
          { signal },
        );
        if (res.stop_reason === "refusal") throw new LoiLlm("Mô hình từ chối phần này. Thầy/cô thử soạn lại hoặc sửa nội dung.", "tu_choi");
        if (res.stop_reason === "max_tokens") throw new LoiLlm("Nội dung quá dài, bị cắt giữa chừng. Thầy/cô soạn lại phần này.", "sai_khuon");
        return kiemTraKhuon(yc.schema, res.parsed_output);
      } catch (e) {
        throw loiAnthropic(e, ch.trinhDuyet);
      }
    },
  };
}

/** Kiểm tra khóa mà không tốn lượt soạn: lấy thông tin mô hình (không sinh nội dung). */
export async function kiemTraKhoaAnthropic(ch: CauHinhAnthropic): Promise<void> {
  try {
    await taoClient(ch).models.retrieve(ch.model?.trim() || MO_HINH_MAC_DINH);
  } catch (e) {
    throw loiAnthropic(e, ch.trinhDuyet);
  }
}

/** Máy chủ: khóa chung trong .env. */
export function adapterAnthropic(env: Record<string, string | undefined>): AdapterLlm {
  const apiKey = env.LLM_API_KEY || env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new LoiLlm("Chưa đặt LLM_API_KEY trong file .env.", "chua_cau_hinh");
  return taoAdapterAnthropic({ apiKey, model: env.LLM_MODEL });
}
