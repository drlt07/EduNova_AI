import { NextResponse } from "next/server";
import { adapterAnthropic } from "@khbd/lib/llm/anthropic";
import { adapterGemini } from "@khbd/lib/llm/gemini";
import { LabGradeLlmSchema } from "@/lib/ai/lab-grader";

export const runtime = "nodejs";
export const maxDuration = 60;
const MAX_BODY = 16_000;

/** Chấm phần giải thích của bài mô phỏng theo LLM_PROVIDER. "mock" (mặc định) → { fallback: true } để chấm bằng bộ luật. */
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
    const data = await adapter.goi({ luot: "cham_mo_phong", heThong: body.system, noiDung: body.content, schema: LabGradeLlmSchema }, req.signal);
    return NextResponse.json({ data }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ fallback: true });
  }
}
