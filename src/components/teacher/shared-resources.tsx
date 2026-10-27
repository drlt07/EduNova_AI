import Link from "next/link";
import { ClipboardCheck, FlaskConical, Library, ListChecks, Sparkles, Wand2 } from "lucide-react";

const ALL = {
  labs: { href: "/teacher/labs", icon: FlaskConical, label: "Kho mô phỏng", desc: "Chơi thử, cấu hình, chọn màn chơi" },
  resources: { href: "/teacher/resources", icon: Sparkles, label: "Học liệu & ngân hàng câu hỏi", desc: "Phiếu, sơ đồ, câu hỏi theo bài" },
  library: { href: "/teacher/library", icon: Library, label: "Thư viện dùng chung", desc: "KHBD, học liệu đồng nghiệp chia sẻ" },
  activity: { href: "/teacher/activity-builder", icon: Wand2, label: "Thiết kế hoạt động", desc: "Hoạt động có tiêu chí, giao cho lớp" },
  assign: { href: "/teacher/assignments", icon: ListChecks, label: "Giao bài", desc: "Hạn nộp, mức hỗ trợ AI" },
  grade: { href: "/teacher/assessment", icon: ClipboardCheck, label: "Chấm bài", desc: "Mã nguồn, lịch sử thử, nhận xét" },
} as const;

/** Tài nguyên dùng chung (không phải mục menu riêng): mở từ Khóa học hoặc Bài tập & Đánh giá. */
export function SharedResources({ items, title = "Tài nguyên dùng chung" }: { items: (keyof typeof ALL)[]; title?: string }) {
  return (
    <nav aria-label={title} className="mb-6">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">{title}</p>
      <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {items.map((k) => {
          const it = ALL[k];
          return (
            <li key={k}>
              <Link href={it.href} className="flex h-full items-start gap-3 rounded-xl border border-line bg-surface px-3 py-2.5 transition-colors hover:border-cyan/40">
                <it.icon className="mt-0.5 size-4 shrink-0 text-cyan-fg" aria-hidden />
                <span className="min-w-0"><span className="block text-sm font-medium text-fg">{it.label}</span><span className="block text-xs text-muted">{it.desc}</span></span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
