import Link from "next/link";
import { Logo } from "./logo";

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-surface/40">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-4">
        <div className="md:col-span-2">
          <Logo />
          <p className="mt-3 max-w-md text-sm text-muted">
            Nền tảng dạy và học Tin học THPT theo Chương trình GDPT 2018. Bản dùng thử: nội dung bài học mang tính minh họa.
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold text-fg">Sản phẩm</p>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            <li><Link className="hover:text-fg" href="/labs">Mô phỏng</Link></li>
            <li><Link className="hover:text-fg" href="/curriculum">Cây chương trình</Link></li>
            <li><Link className="hover:text-fg" href="/explore">Bài học</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold text-fg">Không gian</p>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            <li><Link className="hover:text-fg" href="/login?role=teacher">Dành cho giáo viên</Link></li>
            <li><Link className="hover:text-fg" href="/login?role=student">Dành cho học sinh</Link></li>
            <li><Link className="hover:text-fg" href="/about">Giới thiệu</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line py-4 text-center text-xs text-muted">© 2026 EduNova AI · Bản dùng thử</div>
    </footer>
  );
}
