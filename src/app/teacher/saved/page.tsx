"use client";
import Link from "next/link";
import { Bookmark, BookOpen, FlaskConical, Sparkles } from "lucide-react";
import { getLabBySlug } from "@/lib/data/labs";
import { getLifeLab } from "@/lib/data/life-labs";
import { bookEntry } from "@/lib/sgk/book";
import { useSessionData } from "@/lib/store/use-role";
import { formatDate } from "@/lib/utils";
import { EmptyState } from "@/components/ui/feedback";
import { LibraryHeader } from "@/components/teacher/assess-tabs";
import { SaveToggle } from "@/components/teacher/save-toggle";

interface Row { key: string; title: string; detail: string; href: string; icon: typeof BookOpen; at: string }

/** Thư viện › Đã lưu: bài học, mô phỏng theo bài và mô phỏng đời sống giáo viên đã đánh dấu. */
export default function SavedPage() {
  const { d, user } = useSessionData();
  const rows: Row[] = d.saved.filter((s) => s.userId === user.id).flatMap((s): Row[] => {
    const [kind, id] = [s.key.slice(0, s.key.indexOf(":")), s.key.slice(s.key.indexOf(":") + 1)];
    if (kind === "lesson") { const e = bookEntry(id); return e ? [{ key: s.key, title: `Bài ${e.lesson.no}. ${e.lesson.title}`, detail: `Bài học · Tin học ${e.grade}`, href: `/teacher/sgk/${id}`, icon: BookOpen, at: s.at }] : []; }
    if (kind === "sim") { const l = getLabBySlug(id); return l ? [{ key: s.key, title: l.title, detail: `Mô phỏng theo bài · Tin ${l.grades.join(", ")}`, href: `/labs/${id}`, icon: FlaskConical, at: s.at }] : []; }
    if (kind === "kho") { const l = getLifeLab(id); return l ? [{ key: s.key, title: l.title, detail: "Mô phỏng đời sống", href: `/teacher/kho/${id}`, icon: Sparkles, at: s.at }] : []; }
    return [];
  });
  return (
    <>
      <LibraryHeader subtitle="Bài học và mô phỏng thầy cô đã lưu để dùng lại nhanh" />
      {rows.length === 0 ? (
        <EmptyState icon={Bookmark} title="Chưa lưu mục nào" description="Bấm nút Lưu ở một bài học hoặc mô phỏng để đưa vào đây." />
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {rows.map((r) => (
            <li key={r.key} className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-4">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand/10 text-blue-fg"><r.icon className="size-5" aria-hidden /></span>
              <Link href={r.href} className="min-w-0 flex-1">
                <span className="block truncate font-semibold text-fg hover:underline">{r.title}</span>
                <span className="block text-xs text-muted">{r.detail} · lưu {formatDate(r.at)}</span>
              </Link>
              <SaveToggle itemKey={r.key} label={r.title} compact />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
