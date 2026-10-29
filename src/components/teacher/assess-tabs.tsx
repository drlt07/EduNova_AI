"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { teacherSubmissions } from "@/lib/store/scoped";
import { useSessionData } from "@/lib/store/use-role";
import { cn } from "@/lib/utils";
import { labReviewQueue } from "@/components/teacher/lab-review";

interface SectionTab { href: string; label: string; match?: string[]; count?: number }

/** Đầu trang của một mục trong sidebar: tiêu đề, mô tả ngắn và các tab con (khu vực chức năng, không phải các bước). */
function SectionHeader({ title, subtitle, tabs, actions }: { title: string; subtitle: string; tabs: SectionTab[]; actions?: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-fg">{title}</h1>
          <p className="mt-1 text-sm text-muted">{subtitle}</p>
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
      <nav aria-label={title} className="mb-5 overflow-x-auto border-b border-line">
        <ul className="flex w-max gap-1">
          {tabs.map((t) => {
            const on = (t.match ?? [t.href]).some((m) => pathname === m || pathname.startsWith(`${m}/`));
            return (
              <li key={t.href}>
                <Link href={t.href} aria-current={on ? "page" : undefined} className={cn("-mb-px flex items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-semibold transition-colors", on ? "border-fg text-fg" : "border-transparent text-muted hover:text-fg")}>
                  {t.label}
                  {!!t.count && <span className="rounded-full bg-warning/20 px-1.5 text-xs font-bold text-warning-fg">{t.count}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}

/** Lớp của tôi: lớp học, bài đã giao (mọi lớp), chờ chấm, sổ điểm. */
export function ClassesHeader({ subtitle = "Lớp, học sinh, bài đã giao và kết quả", actions }: { subtitle?: string; actions?: React.ReactNode }) {
  const { d, user } = useSessionData();
  const pending = teacherSubmissions(d, user.id).filter((s) => s.status === "submitted").length + labReviewQueue(d, user.id).length;
  return (
    <SectionHeader title="Lớp của tôi" subtitle={subtitle} actions={actions} tabs={[
      { href: "/teacher/classes", label: "Lớp học" },
      { href: "/teacher/assignments", label: "Bài đã giao" },
      { href: "/teacher/assessment", label: "Chờ chấm", count: pending },
      { href: "/teacher/results", label: "Sổ điểm" },
    ]} />
  );
}

/** Thư viện: kho mô phỏng, ngân hàng luyện tập, học liệu và tài nguyên tự tạo. */
export function LibraryHeader({ subtitle = "Tài nguyên dùng lại cho mọi bài học và lớp", actions }: { subtitle?: string; actions?: React.ReactNode }) {
  return (
    <SectionHeader title="Thư viện" subtitle={subtitle} actions={actions} tabs={[
      { href: "/teacher/sims", label: "Mô phỏng", match: ["/teacher/sims"] },
      { href: "/teacher/bank", label: "Ngân hàng luyện tập", match: ["/teacher/bank", "/teacher/activity-builder"] },
      { href: "/teacher/library", label: "Học liệu", match: ["/teacher/library", "/teacher/resources", "/teacher/labs"] },
    ]} />
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
