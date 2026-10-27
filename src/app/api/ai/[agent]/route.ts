import { NextResponse } from "next/server";
import { isAgentKey, runAgent } from "@/lib/ai/agents";

const MAX_BODY = 64_000;

export async function POST(req: Request, ctx: RouteContext<"/api/ai/[agent]">) {
  const { agent } = await ctx.params;
  if (!isAgentKey(agent)) return NextResponse.json({ error: "Agent không tồn tại" }, { status: 404 });
  const text = await req.text();
  if (text.length > MAX_BODY) return NextResponse.json({ error: "Yêu cầu quá lớn" }, { status: 413 });
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: "JSON không hợp lệ" }, { status: 400 });
  }
  const result = runAgent(agent, body);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json(result.output, { headers: { "Cache-Control": "no-store" } });
}
