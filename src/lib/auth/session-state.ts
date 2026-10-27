"use client";
import { useSyncExternalStore } from "react";
import { AUTH_MODE } from "@/lib/supabase/config";

/** Bản dùng thử luôn sẵn sàng; đăng nhập thật thì chờ xác minh phiên với Supabase xong. */
let ready = AUTH_MODE === "demo";
const listeners = new Set<() => void>();

export function setAuthReady() {
  if (ready) return;
  ready = true;
  for (const l of listeners) l();
}

export function useAuthReady(): boolean {
  return useSyncExternalStore(
    (cb) => (listeners.add(cb), () => listeners.delete(cb)),
    () => ready,
    () => false,
  );
}
