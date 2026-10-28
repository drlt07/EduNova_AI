"use client";
import { useMemo } from "react";
import { useSessionData } from "@/lib/store/use-role";
import { studentUnlocks } from "./unlocks";

/** Học sinh: chỉ phần lớp đã được mở. Giáo viên/quản trị: thấy hết. */
export function useAccess() {
  const { d, user } = useSessionData();
  const student = user.role === "student";
  return useMemo(() => {
    const keys = student ? studentUnlocks(d, user.id) : null;
    return { student, can: (key: string) => !keys || keys.has(key) };
  }, [student, d, user.id]);
}
