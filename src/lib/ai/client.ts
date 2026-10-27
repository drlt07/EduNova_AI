"use client";
import type { AgentKey } from "./agents";

/** Gọi agent qua API server (không có key ở client). */
export async function callAgent<T = unknown>(agent: AgentKey, input: unknown): Promise<T> {
  const res = await fetch(`/api/ai/${agent}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
  const data = await res.json().catch(() => ({ error: "Phản hồi không hợp lệ" }));
  if (!res.ok) throw new Error(data.error ?? `Lỗi ${res.status}`);
  return data as T;
}
