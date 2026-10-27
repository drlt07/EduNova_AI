"use client";
import { useSyncExternalStore } from "react";
import { useApp } from "./app-store";
import { getUser } from "./scoped";

/** true sau khi mock repository nạp xong dữ liệu từ localStorage (server luôn false). */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    (cb) => useApp.persist.onFinishHydration(cb),
    () => useApp.persist.hasHydrated(),
    () => false,
  );
}

export function useCurrentUser() {
  const userId = useApp((s) => s.userId);
  const users = useApp((s) => s.users);
  return getUser({ users }, userId);
}
