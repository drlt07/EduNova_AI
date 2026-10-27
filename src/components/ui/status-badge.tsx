import { Hourglass } from "lucide-react";
import type { FeatureStatus } from "@/lib/domain/types";
import { Badge } from "./badge";

/**
 * Chỉ hiển thị nhãn cho chức năng CHƯA có ("Sắp có"). Chức năng dùng được không cần nhãn
 * để giao diện gọn; trạng thái chi tiết xem ở trang Giới thiệu.
 */
export function StatusBadge({ status, className, detail }: { status: FeatureStatus; className?: string; detail?: string }) {
  if (status !== "PLANNED") return null;
  return (
    <Badge tone="violet" className={className} title={detail ?? "Chức năng đang được xây dựng"}>
      <Hourglass className="size-3" aria-hidden />
      Sắp có
    </Badge>
  );
}
