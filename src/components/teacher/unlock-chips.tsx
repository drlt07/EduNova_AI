"use client";
import { BookOpen, Code2, ListChecks, Lock, LockOpen } from "lucide-react";
import { toast } from "sonner";
import { classUnlocks, codeKey, lessonItems, lessonKey, setKey } from "@/lib/access/unlocks";
import { useSessionData } from "@/lib/store/use-role";
import { cn } from "@/lib/utils";

interface Props { classId: string; className?: string; refId: string; lessonKey?: string; label?: string; compact?: boolean }

/** Ba công tắc mở cho lớp: nội dung bài, bộ luyện tập của bài, bài lập trình của bài. */
export function UnlockChips({ classId, refId, lessonKey: key, label, compact }: Props) {
  const { d, user } = useSessionData();
  const open = classUnlocks(d, classId);
  const { sets, code } = lessonItems(refId, key);
  const groups = [
    { id: "bai", icon: BookOpen, text: "Bài học", keys: [lessonKey(refId)] },
    { id: "luyen", icon: ListChecks, text: `Luyện tập`, n: sets.reduce((a, s) => a + s.questionIds.length, 0), keys: sets.map((s) => setKey(s.id)) },
    { id: "code", icon: Code2, text: "Lập trình", n: code.length, keys: code.map((c) => codeKey(c.id)) },
  ].filter((g) => g.keys.length);
  return (
    <span className="flex flex-wrap items-center gap-1.5">
      {label && <span className="text-xs font-semibold text-muted">{label}</span>}
      {groups.map((g) => {
        const on = g.keys.every((k) => open.has(k));
        return (
          <button
            key={g.id}
            type="button"
            aria-pressed={on}
            data-testid={`unlock-${classId}-${refId}-${g.id}`}
            title={on ? "Học sinh đang thấy — bấm để khóa lại" : "Học sinh chưa thấy — bấm để mở cho lớp"}
            onClick={() => { d.setUnlocked(user.id, classId, g.keys, !on); toast.success(`${on ? "Đã khóa" : "Đã mở"} ${g.text.toLowerCase()} cho lớp`); }}
            className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold transition-colors", on ? "border-success/40 bg-success/15 text-success-fg" : "border-line bg-surface text-muted hover:border-brand/40 hover:text-fg")}
          >
            {on ? <LockOpen className="size-3.5" aria-hidden /> : <Lock className="size-3.5" aria-hidden />}
            {!compact && <g.icon className="size-3.5" aria-hidden />}
            {g.text}{g.n ? ` · ${g.n}` : ""}
          </button>
        );
      })}
    </span>
  );
}
