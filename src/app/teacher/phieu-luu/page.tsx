"use client";
import { AdventureHub } from "@/components/nova/adventures";

const TIP = (
  <p className="mt-3 max-w-3xl rounded-xl bg-indigo-500/10 px-3 py-2 text-sm text-indigo-800 dark:text-indigo-200">
    Gợi ý dùng trên lớp: sau khi dạy một chủ đề, cho cả lớp chơi chương tương ứng (mỗi chương 5–8 phút) rồi hỏi lại “vì sao chọn như vậy”. Mỗi chương ghi rõ chủ đề và mô phỏng cùng chủ đề để giao thêm.
  </p>
);

/** Phiêu lưu Nova trong không gian giáo viên: các kịch bản trò chơi 3D ôn Tin học, kèm gợi ý dùng trên lớp. */
export default function Page() {
  return <AdventureHub base="/teacher/phieu-luu" intro={TIP} />;
}
