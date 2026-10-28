"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardCheck, ListChecks, Sparkles, Wand2 } from "lucide-react";
import { teacherSubmissions } from "@/lib/store/scoped";
import { useSessionData } from "@/lib/store/use-role";
import { cn } from "@/lib/utils";

/** Các phần của "Bài tập & Đánh giá" dưới dạng tab, kèm số việc đang chờ. */
export function AssessTabs() {
  const pathname = usePathname();
  const { d, user } = useSessionData();
  const pending = teacherSubmissions(d, user.id).filter((s) => s.status === "submitted").length;
  const tabs = [
    { href: "/teacher/assignments", label: "Giao bài", icon: ListChecks },
    { href: "/teacher/assessment", label: "Chấm bài", icon: ClipboardCheck, count: pending },
    { href: "/teacher/activity-builder", label: "Thiết kế hoạt động", icon: Wand2 },
    { href: "/teacher/resources", label: "Câu hỏi & học liệu", icon: Sparkles },
  ];
  return (
    <nav aria-label="Bài tập & Đánh giá" className="mb-5 overflow-x-auto border-b border-line">
      <ul className="flex w-max gap-1">
        {tabs.map((t) => {
          const on = pathname.startsWith(t.href);
          return (
            <li key={t.href}>
              <Link href={t.href} aria-current={on ? "page" : undefined} className={cn("-mb-px flex items-center gap-2 border-b-2 px-3 py-2 text-sm font-medium transition-colors", on ? "border-fg text-fg" : "border-transparent text-muted hover:text-fg")}>
                <t.icon className="size-4" aria-hidden /> {t.label}
                {!!t.count && <span className={cn("rounded-full px-1.5 text-xs font-bold", "bg-warning/20 text-warning-fg")}>{t.count}</span>}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
