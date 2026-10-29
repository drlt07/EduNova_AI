"use client";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { toast } from "sonner";
import { useApp } from "@/lib/store/app-store";
import { useCurrentUser } from "@/lib/store/hooks";
import { cn } from "@/lib/utils";

/** Nút lưu một mục vào "Đã lưu" (key dạng lesson:10-19, sim:robot-factory, kho:qr-code). Chỉ hiện cho giáo viên. */
export function SaveToggle({ itemKey, label, className, compact }: { itemKey: string; label: string; className?: string; compact?: boolean }) {
  const user = useCurrentUser();
  const saved = useApp((s) => s.saved.some((x) => x.userId === user?.id && x.key === itemKey));
  const toggle = useApp((s) => s.toggleSaved);
  if (!user || user.role !== "teacher") return null;
  const Icon = saved ? BookmarkCheck : Bookmark;
  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={saved ? `Bỏ lưu ${label}` : `Lưu ${label}`}
      onClick={() => { toggle(user.id, itemKey); toast.success(saved ? "Đã bỏ khỏi Đã lưu" : "Đã lưu vào Thư viện › Đã lưu"); }}
      className={cn("inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors", saved ? "border-brand/40 bg-brand/10 text-blue-fg" : "border-line bg-surface text-muted hover:text-fg", className)}
    >
      <Icon className={cn("size-4", saved && "fill-current")} aria-hidden />
      {!compact && (saved ? "Đã lưu" : "Lưu")}
    </button>
  );
}
