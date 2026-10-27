/**
 * Khóa AI riêng của giáo viên: lưu trên trình duyệt (phiên hoặc nhớ trên máy), nhận dạng loại khóa,
 * chọn bộ nối Claude/Gemini, đổi lỗi của nhà cung cấp sang tiếng Việt. Không gọi AI thật.
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import Anthropic from "@anthropic-ai/sdk";
import { ApiError } from "@google/genai";
import * as z from "zod/v4";
import { adapterTuKhoa, docKhoaAi, kiemTraKhoaAi, loiDangKhoa, luuKhoaAi, xoaKhoaAi, type KhoaAi } from "@khbd/lib/llm/khoa-nguoi-dung";
import { jsonSchemaChoGemini, loiGemini } from "@khbd/lib/llm/gemini";
import { loiAnthropic } from "@khbd/lib/llm/anthropic";
import { layAdapterMayChu } from "@khbd/lib/llm/may-chu";
import { LoiLlm } from "@khbd/lib/llm";
import { SchemaHd3 } from "@khbd/lib/pipeline/4-sinh-noi-dung/dinh-nghia";

const CLAUDE: KhoaAi = { nhaCungCap: "anthropic", khoa: "sk-ant-api03-abcdefghijklmnop", moHinh: "" };
const GEMINI: KhoaAi = { nhaCungCap: "gemini", khoa: "AIzaSyA1234567890abcdefghijk", moHinh: "" };

/** Kho giả cho localStorage/sessionStorage (môi trường test không có trình duyệt). */
function khoGia(): Storage {
  const m = new Map<string, string>();
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => void m.set(k, v), removeItem: (k) => void m.delete(k), clear: () => m.clear(), key: () => null, get length() { return m.size; } };
}

describe("lưu khóa trên trình duyệt", () => {
  beforeEach(() => { (globalThis as { window?: unknown }).window = { localStorage: khoGia(), sessionStorage: khoGia() }; });
  afterEach(() => { delete (globalThis as { window?: unknown }).window; });

  it("mặc định chỉ giữ trong phiên; chọn nhớ thì lưu trên máy; đổi chế độ không để lại bản cũ; xóa là hết", () => {
    expect(docKhoaAi()).toBeNull();
    luuKhoaAi(CLAUDE, false);
    expect(docKhoaAi()).toEqual({ khoa: CLAUDE, nho: false });
    luuKhoaAi(GEMINI, true);
    expect(docKhoaAi()).toEqual({ khoa: GEMINI, nho: true });
    const w = (globalThis as unknown as { window: { sessionStorage: Storage } }).window;
    expect(w.sessionStorage.length).toBe(0);
    xoaKhoaAi();
    expect(docKhoaAi()).toBeNull();
  });

  it("không có kho lưu (chế độ riêng tư, khung nhúng) thì không lỗi", () => {
    delete (globalThis as { window?: unknown }).window;
    expect(() => luuKhoaAi(CLAUDE, true)).not.toThrow();
    expect(docKhoaAi()).toBeNull();
  });
});

describe("nhận dạng khóa", () => {
  it("đúng dạng thì không báo lỗi; dán thiếu, để trống, nhầm loại khóa thì báo rõ", () => {
    expect(loiDangKhoa(CLAUDE)).toBeNull();
    expect(loiDangKhoa(GEMINI)).toBeNull();
    expect(loiDangKhoa({ ...CLAUDE, khoa: " " })).toContain("chưa dán khóa");
    expect(loiDangKhoa({ ...CLAUDE, khoa: "sk-ant-abc" })).toContain("chưa đúng dạng");
    expect(loiDangKhoa({ ...CLAUDE, khoa: GEMINI.khoa })).toContain("khóa Gemini (Google), không phải Claude");
    expect(loiDangKhoa({ ...GEMINI, khoa: CLAUDE.khoa })).toContain("khóa Claude (Anthropic), không phải Gemini");
  });

  it("kiểm tra khóa sai dạng thì dừng ngay, không gọi nhà cung cấp", async () => {
    await expect(kiemTraKhoaAi({ ...GEMINI, khoa: "abc" })).rejects.toThrow(/chưa đúng dạng/);
  });
});

describe("chọn bộ nối", () => {
  it("khóa của giáo viên → bộ nối đúng nhà cung cấp, không phải giả lập", () => {
    expect(adapterTuKhoa(CLAUDE)).toMatchObject({ ten: "anthropic", giaLap: false });
    expect(adapterTuKhoa(GEMINI)).toMatchObject({ ten: "gemini", giaLap: false });
  });

  it("máy chủ: LLM_PROVIDER=gemini cần khóa; có khóa thì dùng Gemini", () => {
    const ctx = {} as Parameters<typeof layAdapterMayChu>[0];
    expect(() => layAdapterMayChu(ctx, { LLM_PROVIDER: "gemini" })).toThrow(/LLM_API_KEY/);
    expect(layAdapterMayChu(ctx, { LLM_PROVIDER: "gemini", LLM_API_KEY: GEMINI.khoa }).ten).toBe("gemini");
    expect(() => layAdapterMayChu(ctx, { LLM_PROVIDER: "openai" })).toThrow(/anthropic, gemini hoặc mock/);
  });
});

describe("lỗi của nhà cung cấp → thông báo tiếng Việt", () => {
  it("Claude: khóa sai, hết tiền, quá nhiều yêu cầu", () => {
    const sai = loiAnthropic(new Anthropic.AuthenticationError(401, undefined, "invalid x-api-key", new Headers()), true) as LoiLlm;
    expect(sai).toBeInstanceOf(LoiLlm);
    expect(sai.message).toContain("Khóa AI của tôi");
    expect((loiAnthropic(new Anthropic.BadRequestError(400, undefined, "Your credit balance is too low", new Headers())) as Error).message).toContain("hết tiền");
    expect((loiAnthropic(new Anthropic.RateLimitError(429, undefined, "rate", new Headers())) as Error).message).toContain("chờ một lát");
  });

  it("Gemini: khóa sai, hết lượt miễn phí, sai tên mô hình", () => {
    expect((loiGemini(new ApiError({ message: "API key not valid. Please pass a valid API key.", status: 400 }), true) as Error).message).toContain("Khóa API Gemini không hợp lệ");
    expect((loiGemini(new ApiError({ message: "Resource has been exhausted", status: 429 })) as Error).message).toContain("hết lượt miễn phí");
    expect((loiGemini(new ApiError({ message: "not found", status: 404 })) as Error).message).toContain("Để trống ô mô hình");
  });
});

it("schema gửi cho Gemini: JSON Schema đúng của lượt soạn, không có khóa $schema", () => {
  const js = jsonSchemaChoGemini(SchemaHd3) as { type: string; properties: Record<string, unknown>; $schema?: string };
  expect(js.$schema).toBeUndefined();
  expect(js.type).toBe("object");
  for (const k of ["mucTieu", "buoc", "danhGia"]) expect(js.properties, k).toHaveProperty(k);
  expect(jsonSchemaChoGemini(z.object({ a: z.enum(["x", "y"]) }))).toMatchObject({ properties: { a: { enum: ["x", "y"] } } });
});
