import { NextResponse } from "next/server";
import { adapterAnthropic } from "@khbd/lib/llm/anthropic";
import { adapterGemini } from "@khbd/lib/llm/gemini";
import { TutorLlmSchema } from "@/lib/ai/tutor-llm";

export const runtime = "nodejs";
export const maxDuration = 60;
const MAX_BODY = 64_000;

/** AI Gia sư: gọi mô hình theo LLM_PROVIDER. "mock" (mặc định) → { fallback: true } để giao diện dùng bộ luật. */
export async function POST(req: Request) {
  const provider = (process.env.LLM_PROVIDER ?? "mock").toLowerCase();
  if (provider === "mock") return NextResponse.json({ fallback: true });
  const text = await req.text();
  if (text.length > MAX_BODY) return NextResponse.json({ error: "Yêu cầu quá lớn" }, { status: 413 });
  let body: { system?: unknown; content?: unknown };
  try {
    body = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: "JSON không hợp lệ" }, { status: 400 });
  }
  if (typeof body.system !== "string" || typeof body.content !== "string") return NextResponse.json({ error: "Thiếu nội dung" }, { status: 400 });
  try {
    const adapter = provider === "anthropic" ? adapterAnthropic(process.env) : provider === "gemini" ? adapterGemini(process.env) : null;
    if (!adapter) return NextResponse.json({ fallback: true });
    const data = await adapter.goi({ luot: "gia_su", heThong: body.system, noiDung: body.content, schema: TutorLlmSchema }, req.signal);
    return NextResponse.json({ data }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    // Lỗi mô hình (hết hạn mức, sai khóa…) → giao diện dùng bộ luật thay vì báo lỗi cho học sinh
    return NextResponse.json({ fallback: true });
  }
}
