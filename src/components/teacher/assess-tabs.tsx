"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, ClipboardCheck, Library, Send } from "lucide-react";
import { teacherAssignments, teacherSubmissions } from "@/lib/store/scoped";
import { labReviewQueue } from "@/components/teacher/lab-review";
import { useSessionData } from "@/lib/store/use-role";
import { cn } from "@/lib/utils";

/**
 * Bốn phần của "Bài tập & Đánh giá": ngân hàng bài tập (tạo / sửa) → đã giao (theo dõi hạn nộp) → chờ chấm (chấm thủ công)
 * → kết quả đánh giá (sổ điểm). Áp dụng cho cả bài thuộc khóa học và bài giao độc lập.
 */
export function AssessTabs() {
  const pathname = usePathname();
  const { d, user } = useSessionData();
  const pending = teacherSubmissions(d, user.id).filter((s) => s.status === "submitted").length + labReviewQueue(d, user.id).length;
  const open = teacherAssignments(d, user.id).filter((a) => a.status === "open").length;
  const tabs = [
    { href: "/teacher/bank", label: "Ngân hàng bài tập", sub: "Tạo / chỉnh sửa", icon: Library, match: ["/teacher/bank", "/teacher/activity-builder", "/teacher/resources"] },
    { href: "/teacher/assignments", label: "Đã giao", sub: "Theo dõi hạn nộp", icon: Send, count: open, tone: "bg-blue/15 text-blue-fg" },
    { href: "/teacher/assessment", label: "Chờ chấm", sub: "Chấm thủ công", icon: ClipboardCheck, count: pending, tone: "bg-warning/20 text-warning-fg" },
    { href: "/teacher/results", label: "Kết quả đánh giá", sub: "Sổ điểm theo lớp", icon: BarChart3 },
  ];
  return (
    <nav aria-label="Bài tập & Đánh giá" className="mb-6">
      <ol className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        {tabs.map((t, i) => {
          const on = (t.match ?? [t.href]).some((m) => pathname.startsWith(m));
          return (
            <li key={t.href}>
              <Link href={t.href} aria-current={on ? "page" : undefined} className={cn("flex h-full items-center gap-3 rounded-2xl border p-3 transition-colors", on ? "border-fg bg-fg text-bg" : "border-line bg-surface text-fg hover:border-fg/40")}>
                <span className={cn("grid size-9 shrink-0 place-items-center rounded-xl text-sm font-bold", on ? "bg-bg/15" : "bg-surface-2")}><t.icon className="size-4" aria-hidden /></span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold"><span className={cn("mr-1 text-xs", on ? "opacity-70" : "text-muted")}>{i + 1}.</span>{t.label}</span>
                  <span className={cn("block truncate text-xs", on ? "opacity-70" : "text-muted")}>{t.sub}</span>
                </span>
                {!!t.count && <span className={cn("rounded-full px-2 py-0.5 text-xs font-bold", on ? "bg-bg/20" : t.tone)}>{t.count}</span>}
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
