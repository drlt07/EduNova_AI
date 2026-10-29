"use client";
import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";
import { teacherSubmissions } from "@/lib/store/scoped";
import { useSessionData } from "@/lib/store/use-role";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { labReviewQueue } from "@/components/teacher/lab-review";
import { AssignDialog } from "@/components/teacher/assign-dialog";

const TABS = [
  { href: "/teacher/assignments", label: "Đã giao" },
  { href: "/teacher/bank", label: "Thư viện bài tập", match: ["/teacher/bank", "/teacher/activity-builder", "/teacher/resources"] },
  { href: "/teacher/assessment", label: "Chờ chấm", count: true },
  { href: "/teacher/results", label: "Sổ điểm" },
];

/**
 * Đầu trang chung của "Bài tập & Đánh giá": một tiêu đề, một nút "Giao bài mới" (chọn nguồn trong hộp thoại) và một
 * thanh tab ngang. Các tab là khu vực chức năng, không phải các bước phải làm lần lượt.
 */
export function AssessTabs({ subtitle = "Quản lý bài tập và kết quả của các lớp", actions }: { subtitle?: string; actions?: React.ReactNode }) {
  const pathname = usePathname();
  const { d, user } = useSessionData();
  const [open, setOpen] = useState(false);
  const pending = teacherSubmissions(d, user.id).filter((s) => s.status === "submitted").length + labReviewQueue(d, user.id).length;
  return (
    <>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-fg">Bài tập & Đánh giá</h1>
          <p className="mt-1 text-muted">{subtitle}</p>
        </div>
        <div className="flex flex-wrap gap-2">{actions}<Button onClick={() => setOpen(true)}><Plus /> Giao bài mới</Button></div>
      </div>
      <nav aria-label="Bài tập & Đánh giá" className="mb-5 overflow-x-auto border-b border-line">
        <ul className="flex w-max gap-1">
          {TABS.map((t) => {
            const on = (t.match ?? [t.href]).some((m) => pathname.startsWith(m));
            return (
              <li key={t.href}>
                <Link href={t.href} aria-current={on ? "page" : undefined} className={cn("-mb-px flex items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-semibold transition-colors", on ? "border-fg text-fg" : "border-transparent text-muted hover:text-fg")}>
                  {t.label}
                  {t.count && pending > 0 && <span className="rounded-full bg-warning/20 px-1.5 text-xs font-bold text-warning-fg">{pending}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <AssignDialog open={open} onOpenChange={setOpen} title="Giao bài mới" />
    </>
  );
}

/** Menu ba chấm cho một dòng: gom các thao tác phụ để dòng gọn. */
export function RowMenu({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <details className="relative">
      <summary aria-label={label} className="grid size-8 cursor-pointer list-none place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-fg [&::-webkit-details-marker]:hidden">
        <span aria-hidden className="text-lg leading-none">⋯</span>
      </summary>
      <div className="absolute right-0 z-30 mt-1 w-56 overflow-hidden rounded-xl border border-line bg-surface py-1 shadow-xl" onClick={(e) => e.currentTarget.parentElement?.removeAttribute("open")}>
        {children}
      </div>
    </details>
  );
}

export function MenuItem({ onClick, href, children, danger }: { onClick?: () => void; href?: string; children: React.ReactNode; danger?: boolean }) {
  const cls = cn("flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-surface-2 [&_svg]:size-4", danger ? "text-danger-fg" : "text-fg");
  return href ? <Link href={href} className={cls}>{children}</Link> : <button type="button" onClick={onClick} className={cls}>{children}</button>;
}
