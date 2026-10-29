"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { BookOpenCheck, CheckCircle2, ClipboardCheck, History, MessageCircleQuestion, Send, Upload } from "lucide-react";
import { classHistory, type ClassEvent } from "@/lib/teacher/overview";
import { useSessionData } from "@/lib/store/use-role";
import { cn, formatDate } from "@/lib/utils";
import { EmptyState } from "@/components/ui/feedback";

const KIND: Record<ClassEvent["kind"], { label: string; icon: typeof Send; cls: string }> = {
  assign: { label: "Giao bài", icon: Send, cls: "bg-brand/10 text-blue-fg" },
  submit: { label: "Nộp bài", icon: Upload, cls: "bg-sky-500/10 text-sky-700 dark:text-sky-300" },
  done: { label: "Hoàn thành", icon: CheckCircle2, cls: "bg-success/10 text-success-fg" },
  grade: { label: "Chấm bài", icon: ClipboardCheck, cls: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300" },
  taught: { label: "Đã dạy", icon: BookOpenCheck, cls: "bg-surface-2 text-muted" },
  question: { label: "Câu hỏi", icon: MessageCircleQuestion, cls: "bg-warning/10 text-warning-fg" },
};

/** Lịch sử hoạt động của lớp: giao bài, nộp bài, hoàn thành, chấm bài, bài đã dạy, câu hỏi — mới nhất trước. */
export function ClassHistory({ classId }: { classId: string }) {
  const { d } = useSessionData();
  const all = useMemo(() => classHistory(d, classId), [d, classId]);
  const [kind, setKind] = useState<ClassEvent["kind"] | "">("");
  const [limit, setLimit] = useState(40);
  const list = all.filter((e) => !kind || e.kind === kind);
  if (!all.length) return <EmptyState icon={History} title="Chưa có hoạt động" description="Giao bài, nộp bài, chấm bài của lớp sẽ hiện ở đây." />;
  const shown = list.slice(0, limit).map((e, i, arr) => ({ e, day: formatDate(e.at), head: i === 0 || formatDate(arr[i - 1].at) !== formatDate(e.at) }));
  return (
    <section aria-label="Lịch sử hoạt động" className="mb-6">
      <div role="group" aria-label="Lọc hoạt động" className="mb-4 flex flex-wrap gap-1 rounded-xl border border-line bg-surface p-1 text-sm">
        {([["", "Tất cả"], ...Object.entries(KIND).map(([k, v]) => [k, v.label])] as [ClassEvent["kind"] | "", string][]).map(([k, l]) => (
          <button key={k} type="button" aria-pressed={kind === k} onClick={() => setKind(k)} className={cn("rounded-lg px-3 py-1.5 font-medium", kind === k ? "bg-brand text-brand-ink" : "text-muted hover:text-fg")}>{l} ({k ? all.filter((e) => e.kind === k).length : all.length})</button>
        ))}
      </div>
      <ol className="rounded-2xl border border-line bg-surface px-4">
        {shown.map(({ e, day, head }) => {
          const K = KIND[e.kind];
          return (
            <li key={e.id}>
              {head && <p className="border-t border-line pb-1 pt-3 text-xs font-semibold uppercase tracking-wide text-muted first:border-t-0">{day}</p>}
              <div className="flex items-center gap-3 py-2">
                <span className={cn("grid size-8 shrink-0 place-items-center rounded-lg", K.cls)}><K.icon className="size-4" aria-hidden /></span>
                {e.href ? <Link href={e.href} className="min-w-0 flex-1 truncate text-sm text-fg hover:underline">{e.text}</Link> : <span className="min-w-0 flex-1 truncate text-sm text-fg">{e.text}</span>}
                <span className="shrink-0 text-xs tabular-nums text-muted">{formatDate(e.at, true).split(" ").pop()}</span>
              </div>
            </li>
          );
        })}
      </ol>
      {list.length > limit && <button type="button" onClick={() => setLimit(limit + 40)} className="mt-3 text-sm font-medium text-blue-fg hover:underline">Xem thêm ({list.length - limit})</button>}
    </section>
  );
}
