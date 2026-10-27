import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

let counter = 0;
export function uid(prefix = "id"): string {
  counter = (counter + 1) % 1_000_000;
  const rand =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `${prefix}-${rand}${counter.toString(36)}`;
}

const TZ = "Asia/Ho_Chi_Minh";

export function formatDate(iso: string, withTime = false): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: TZ,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  }).format(d);
}

export function formatTime(iso: string): string {
  return new Intl.DateTimeFormat("vi-VN", { timeZone: TZ, hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(new Date(iso));
}

export function relativeDays(iso: string, now = Date.now()): string {
  const diff = Math.round((new Date(iso).getTime() - now) / 86_400_000);
  if (diff === 0) return "hôm nay";
  if (diff === 1) return "ngày mai";
  if (diff === -1) return "hôm qua";
  return diff > 0 ? `còn ${diff} ngày` : `${-diff} ngày trước`;
}

export function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

export function normalizeVi(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d");
}

export function matchesQuery(query: string, ...fields: (string | undefined)[]): boolean {
  const q = normalizeVi(query.trim());
  if (!q) return true;
  return fields.some((f) => f && normalizeVi(f).includes(q));
}

export function downloadText(filename: string, content: string, type = "text/csv;charset=utf-8") {
  const blob = new Blob(["﻿" + content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Hạn nộp hợp lệ: sau thời điểm hiện tại ít nhất `minHours` giờ. */
export function isFutureBy(isoOrLocal: string, minHours = 1): boolean {
  const t = new Date(isoOrLocal).getTime();
  return !Number.isNaN(t) && t >= Date.now() + minHours * 3_600_000;
}

/** Giá trị cho input datetime-local, cách hiện tại `days` ngày. */
export function localDateTimeFromNow(days: number): string {
  const d = new Date(Date.now() + days * 86_400_000);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}
