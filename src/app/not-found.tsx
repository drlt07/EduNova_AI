import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main id="main" className="grid flex-1 place-items-center px-4 py-24 text-center">
      <div>
        <p className="font-mono text-sm text-cyan-fg">404</p>
        <h1 className="mt-2 text-3xl font-bold text-fg">Không tìm thấy trang</h1>
        <p className="mt-2 text-muted">Đường dẫn không tồn tại hoặc đã thay đổi.</p>
        <Button asChild className="mt-6"><Link href="/">Về trang chủ</Link></Button>
      </div>
    </main>
  );
}
