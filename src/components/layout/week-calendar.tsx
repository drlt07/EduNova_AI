import { CalendarClock } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CalendarItem {
  weekday: number; // 1 = Thứ 2 … 7 = Chủ nhật
  title: string;
  detail: string;
  tone: "class" | "deadline";
}

const DAYS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

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

export function WeekCalendar({ items }: { items: CalendarItem[] }) {
  const today = vnWeekday(new Date());
  return (
    <div className="grid grid-cols-7 gap-1.5" role="list" aria-label="Lịch tuần này">
      {DAYS.map((d, i) => {
        const dayItems = items.filter((x) => x.weekday === i + 1);
        return (
          <div key={d} role="listitem" className={cn("min-h-[120px] rounded-xl border p-1.5", today === i + 1 ? "border-cyan/50 bg-cyan/5" : "border-line bg-surface-2/40")}>
            <p className={cn("mb-1 text-center text-xs font-semibold", today === i + 1 ? "text-cyan-fg" : "text-muted")}>{d}</p>
            <ul className="space-y-1">
              {dayItems.map((x, k) => (
                <li key={k} title={`${x.title} — ${x.detail}`} className={cn("rounded-lg px-1.5 py-1 text-[11px] leading-tight", x.tone === "deadline" ? "bg-warning/15 text-warning-fg" : "bg-blue/15 text-blue-fg")}>
                  {x.tone === "deadline" && <CalendarClock className="mb-0.5 inline size-3" aria-hidden />} <span className="font-semibold">{x.title}</span>
                  <span className="block">{x.detail}</span>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
