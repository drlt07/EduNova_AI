"use client";
import { useSyncExternalStore } from "react";
import { useApp } from "./app-store";
import { getUser } from "./scoped";
import { useAuthReady } from "@/lib/auth/session-state";

/** true sau khi kho dữ liệu nạp xong từ localStorage và (đăng nhập thật) đã xác minh phiên (server luôn false). */
export function useHydrated(): boolean {
  const store = useSyncExternalStore(
    (cb) => useApp.persist.onFinishHydration(cb),
    () => useApp.persist.hasHydrated(),
    () => false,
  );
  return useAuthReady() && store;
}

export function useCurrentUser() {
  const userId = useApp((s) => s.userId);
  const users = useApp((s) => s.users);
  return getUser({ users }, userId);
}
