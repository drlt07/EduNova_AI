/** Kiểm tra liên kết mục tiêu – hoạt động – minh chứng (luật xác định, không phải AI). */
import type { LessonPlan } from "@/lib/domain/types";

export interface PlanIssue {
  severity: "error" | "warning" | "info";
  message: string;
  objectiveId?: string;
  activityId?: string;
}

export const PHASES = [
  { id: "mo-dau", label: "Mở đầu" },
  { id: "hinh-thanh", label: "Hình thành kiến thức" },
  { id: "luyen-tap", label: "Luyện tập" },
  { id: "van-dung", label: "Vận dụng" },
] as const;

export function checkLessonPlan(lp: Pick<LessonPlan, "objectiveIds" | "activities" | "durationMinutes" | "title">): PlanIssue[] {
  const issues: PlanIssue[] = [];
  if (!lp.title.trim()) issues.push({ severity: "error", message: "KHBD chưa có tiêu đề." });
  if (lp.objectiveIds.length === 0) issues.push({ severity: "error", message: "Chưa chọn mục tiêu (yêu cầu cần đạt) nào." });
  for (const ph of PHASES) {
    if (!lp.activities.some((a) => a.phase === ph.id)) issues.push({ severity: "warning", message: `Thiếu hoạt động ở pha "${ph.label}".` });
  }
  for (const obj of lp.objectiveIds) {
    const linked = lp.activities.filter((a) => a.objectiveIds.includes(obj));
    if (linked.length === 0) issues.push({ severity: "error", objectiveId: obj, message: `Mục tiêu ${obj} chưa gắn với hoạt động nào.` });
    else if (!linked.some((a) => a.evidence.trim())) issues.push({ severity: "error", objectiveId: obj, message: `Mục tiêu ${obj} chưa có minh chứng đánh giá.` });
  }
  for (const a of lp.activities) {
    if (a.objectiveIds.length === 0) issues.push({ severity: "warning", activityId: a.id, message: `Hoạt động "${a.title || "chưa đặt tên"}" chưa gắn mục tiêu.` });
    if (!a.product.trim()) issues.push({ severity: "warning", activityId: a.id, message: `Hoạt động "${a.title || "chưa đặt tên"}" chưa mô tả sản phẩm học tập.` });
    for (const o of a.objectiveIds) if (!lp.objectiveIds.includes(o)) issues.push({ severity: "warning", activityId: a.id, message: `Hoạt động "${a.title}" gắn mục tiêu ${o} không thuộc KHBD.` });
  }
  if (lp.durationMinutes < 15 || lp.durationMinutes > 180) issues.push({ severity: "warning", message: "Thời lượng bất thường (nên 15–180 phút)." });
  if (issues.length === 0) issues.push({ severity: "info", message: "Mọi mục tiêu đều có hoạt động và minh chứng đánh giá." });
  return issues;
}
