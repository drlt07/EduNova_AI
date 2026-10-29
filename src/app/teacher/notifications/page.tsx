"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { teacherNotifications, type TeacherNotification } from "@/lib/teacher/overview";
import { useSessionData } from "@/lib/store/use-role";
import { cn, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/feedback";
import { SectionHead } from "@/components/layout/section-head";

const KINDS: { id: string; label: string; test: (n: TeacherNotification) => boolean }[] = [
  { id: "", label: "Tất cả", test: () => true },
  { id: "nop", label: "Bài nộp mới", test: (n) => n.id.startsWith("sub-") || n.id.startsWith("done-") },
  { id: "cham", label: "Cần chấm / duyệt", test: (n) => n.tone === "warning" && !n.id.startsWith("due-") },
  { id: "han", label: "Sắp đến hạn", test: (n) => n.id.startsWith("due-") },
  { id: "hoi", label: "Câu hỏi", test: (n) => n.id.startsWith("qa-") },
];

/** Thông báo của giáo viên: bài nộp mới, hạn chấm, hạn nộp sắp tới, câu hỏi của học sinh trong bài học. */
export default function TeacherNotifications() {
  const { d, user } = useSessionData();
  const [kind, setKind] = useState("");
  const all = useMemo(() => teacherNotifications(d, user.id), [d, user.id]);
  const read = new Set(d.notifRead[user.id] ?? []);
  const test = KINDS.find((k) => k.id === kind)!.test;
  const list = all.filter(test);
  const unread = all.filter((n) => !read.has(n.id)).length;
  return (
    <>
      <SectionHead icon={Bell} title="Thông báo" subtitle={unread ? `${unread} thông báo chưa đọc` : "Đã đọc hết"} actions={unread > 0 ? <Button size="sm" variant="secondary" onClick={() => d.markNotifRead(user.id, all.map((n) => n.id))}><CheckCheck /> Đánh dấu đã đọc tất cả</Button> : undefined} />
      <div role="group" aria-label="Lọc thông báo" className="mb-4 flex flex-wrap gap-1 rounded-xl border border-line bg-surface p-1 text-sm">
        {KINDS.map((k) => { const n = all.filter(k.test).length; return <button key={k.id} type="button" aria-pressed={kind === k.id} onClick={() => setKind(k.id)} className={cn("rounded-lg px-3 py-1.5 font-medium", kind === k.id ? "bg-brand text-brand-ink" : "text-muted hover:text-fg")}>{k.label} ({n})</button>; })}
      </div>
      {list.length === 0 ? <EmptyState icon={Bell} title="Không có thông báo" description="Bài nộp mới, việc cần chấm và câu hỏi của học sinh sẽ hiện ở đây." /> : (
        <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
          {list.map((n) => (
            <li key={n.id}>
              <Link href={n.href} onClick={() => d.markNotifRead(user.id, [n.id])} className={cn("flex items-start gap-3 px-4 py-3 hover:bg-surface-2", !read.has(n.id) && "bg-brand/[0.04]")}>
                <span className={cn("mt-1.5 size-2.5 shrink-0 rounded-full", n.tone === "warning" ? "bg-warning" : n.tone === "success" ? "bg-success" : "bg-brand")} aria-hidden />
                <span className="min-w-0 flex-1">
                  <span className={cn("block text-sm text-fg", !read.has(n.id) && "font-semibold")}>{n.text}</span>
                  <span className="block text-xs text-muted">{n.detail} · {formatDate(n.at, true)}</span>
                </span>
                {!read.has(n.id) && <span className="sr-only">chưa đọc</span>}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
