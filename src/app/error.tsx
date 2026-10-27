"use client";
import { ErrorState } from "@/components/ui/feedback";
import { Button } from "@/components/ui/button";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main id="main" className="mx-auto w-full max-w-xl flex-1 px-4 py-24">
      <ErrorState
        title="Trang gặp lỗi"
        description={`Đã có lỗi khi hiển thị nội dung${error.digest ? ` (mã ${error.digest})` : ""}. Dữ liệu demo của bạn vẫn còn trong trình duyệt.`}
        action={<Button onClick={reset}>Thử lại</Button>}
      />
    </main>
  );
}
