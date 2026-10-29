"use client";
import type { Remembered } from "@/lib/auth/remembered";
import { Avatar } from "@/components/ui/misc";

/** Thẻ tài khoản đã nhớ trên máy: avatar, tên, email và nút đổi tài khoản. */
export function RememberedChip({ who, onSwitch }: { who: Remembered; onSwitch: () => void }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-line bg-surface-2/50 p-3">
      <Avatar user={who} size={44} />
      <span className="min-w-0 flex-1">
        <span className="block truncate font-semibold text-fg">{who.name}</span>
        <span className="block truncate text-sm text-muted">{who.email}</span>
      </span>
      <button type="button" onClick={onSwitch} className="shrink-0 rounded-lg px-2.5 py-1.5 text-sm font-semibold text-blue-fg hover:bg-brand/10">Đổi tài khoản</button>
    </div>
  );
}
