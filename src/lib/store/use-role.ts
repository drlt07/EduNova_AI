"use client";
import { useApp } from "./app-store";
import { useCurrentUser } from "./hooks";

/** Dùng bên trong AppShell (đã đảm bảo đúng vai trò trước khi render trang). */
export function useSessionData() {
  const d = useApp();
  const user = useCurrentUser();
  if (!user) throw new Error("Thiếu phiên đăng nhập — trang phải nằm trong AppShell");
  return { d, user };
}
