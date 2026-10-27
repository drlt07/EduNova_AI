import Link from "next/link";
import { Logo } from "./logo";

const COLUMNS = [
  {
    title: "Học tập",
    links: [
      { href: "/curriculum", label: "Chương trình học" },
      { href: "/labs", label: "Kho mô phỏng" },
      { href: "/login?role=student", label: "Dành cho học sinh" },
      { href: "/login?role=teacher", label: "Dành cho giáo viên" },
    ],
  },
  {
    title: "Hỗ trợ",
    links: [
      { href: "/huong-dan", label: "Hướng dẫn sử dụng" },
      { href: "/huong-dan#lien-he", label: "Liên hệ" },
      { href: "/about", label: "Giới thiệu" },
    ],
  },
  {
    title: "Pháp lý",
    links: [
      { href: "/chinh-sach", label: "Chính sách bảo mật" },
      { href: "/chinh-sach#dieu-khoan", label: "Điều khoản sử dụng" },
    ],
  },
];

/** Không đưa số liệu, đối tác hay đánh giá chưa được xác nhận vào chân trang. */
export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-surface/40">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div>
          <Logo />
          <p className="mt-3 max-w-sm text-sm text-muted">
            Nền tảng học tập Tin học THPT lớp 10, 11, 12 theo Chương trình GDPT 2018: bài học tương tác, mô phỏng 3D, thực hành lập trình và trợ lý AI có giáo viên giám sát.
          </p>
        </div>
        {COLUMNS.map((c) => (
          <div key={c.title}>
            <p className="text-sm font-semibold text-fg">{c.title}</p>
            <ul className="mt-3 space-y-2 text-sm text-muted">
              {c.links.map((l) => (
                <li key={l.href}><Link className="hover:text-fg" href={l.href}>{l.label}</Link></li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-line py-4 text-center text-xs text-muted">© 2026 EduNova AI · Bản dùng thử</div>
    </footer>
  );
}
