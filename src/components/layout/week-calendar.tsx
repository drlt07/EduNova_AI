/** weekday theo giờ Việt Nam (1 = Thứ 2). */
export function vnWeekday(iso: string | Date): number {
  const d = new Date(new Date(iso).toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }));
  return ((d.getDay() + 6) % 7) + 1;
}

export function isThisWeek(iso: string, now = new Date()): boolean {
  const diff = (new Date(iso).getTime() - now.getTime()) / 86_400_000;
  const today = vnWeekday(now);
  return diff >= -(today - 1) - 0.5 && diff <= 7 - today + 0.5;
}
