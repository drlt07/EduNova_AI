// Bản Artifact không có server: chạy cùng hàm agent (luật + template, demo) ngay trong trình duyệt.
import { runAgent, type AgentKey } from "@/lib/ai/agents";

export async function callAgent<T = unknown>(agent: AgentKey, input: unknown): Promise<T> {
  await new Promise((r) => setTimeout(r, 250));
  const r = runAgent(agent, JSON.parse(JSON.stringify(input)));
  if (!r.ok) throw new Error(r.error);
  return r.output as T;
}
