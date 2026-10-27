"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Bell, BookOpen, Code2, Dumbbell, FolderKanban, Gamepad2, Search, Tag } from "lucide-react";
import { LESSONS } from "@/lib/data/curriculum";
import { CODING_EXERCISES } from "@/lib/data/coding-exercises";
import { GAMES } from "@/lib/data/games";
import { PRACTICE_SETS } from "@/lib/data/practice";
import { useApp, DEFAULT_PREFS } from "@/lib/store/app-store";
import { studentBook, studentNotifications } from "@/lib/store/student-insights";
import { cn, formatDate, matchesQuery } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/form";

type Hit = { id: string; title: string; detail: string; href: string; group: string; icon: React.ComponentType<{ className?: string }> };

export function useSearchIndex(studentId: string): Hit[] {
  const d = useApp();
  return useMemo(() => {
    const { book } = studentBook(d, studentId);
    const lessons = LESSONS.filter((l) => l.textbookId === book);
    const hits: Hit[] = [
      ...lessons.map((l) => ({ id: `l-${l.id}`, title: l.title, detail: `Bài học · Lớp ${l.grade} · ${l.keywords.join(", ")}`, href: `/student/learning/${l.id}`, group: "Bài học", icon: BookOpen })),
      ...lessons.flatMap((l) => (l.concepts ?? []).map((c) => ({ id: `t-${l.id}-${c.term}`, title: c.term, detail: `Thuật ngữ · ${c.definition}`, href: `/student/learning/${l.id}#kien-thuc`, group: "Thuật ngữ", icon: Tag }))),
      ...GAMES.filter((g) => g.status === "available").map((g) => ({ id: `g-${g.slug}`, title: g.title, detail: `Trò chơi · ${g.focus}`, href: `/student/games/${g.slug}`, group: "Trò chơi mô phỏng", icon: Gamepad2 })),
      ...CODING_EXERCISES.map((e) => ({ id: `c-${e.id}`, title: e.title, detail: `Bài lập trình · ${e.topic}`, href: `/student/code?bai=${e.id}`, group: "Phòng lập trình", icon: Code2 })),
      ...PRACTICE_SETS.map((s) => ({ id: `p-${s.id}`, title: s.title, detail: `Luyện tập · ${s.description}`, href: `/student/practice/${s.id}`, group: "Luyện tập", icon: Dumbbell })),
      ...d.projects.filter((p) => p.studentId === studentId).map((p) => ({ id: `pj-${p.id}`, title: p.title, detail: "Dự án của em", href: `/student/projects/${p.id}`, group: "Dự án", icon: FolderKanban })),
    ];
    return hits;
  }, [d, studentId]);
}

export function SearchPalette({ studentId }: { studentId: string }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const router = useRouter();
  const index = useSearchIndex(studentId);
  const results = useMemo(() => (q.trim() ? index.filter((h) => matchesQuery(q, h.title, h.detail)).slice(0, 12) : index.filter((h) => h.group !== "Thuật ngữ").slice(0, 8)), [q, index]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  function go(h: Hit) {
    setOpen(false);
    setQ("");
    router.push(h.href);
  }
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="flex h-9 w-full max-w-sm items-center gap-2 rounded-xl border border-line bg-surface-2 px-3 text-sm text-muted hover:border-cyan/40" aria-keyshortcuts="Control+K">
        <Search className="size-4" aria-hidden />
        <span className="sr-only sm:not-sr-only">Tìm bài học, trò chơi, thuật ngữ…</span>
        <kbd aria-hidden className="ml-auto hidden rounded border border-line px-1.5 text-[10px] md:inline">Ctrl K</kbd>
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent title="Tìm kiếm" className="max-w-xl">
          <Input
            autoFocus
            value={q}
            onChange={(e) => { setQ(e.target.value); setActive(0); }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(results.length - 1, a + 1)); }
              if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(0, a - 1)); }
              if (e.key === "Enter" && results[active]) go(results[active]);
            }}
            placeholder="Gõ từ khóa, không cần dấu: re nhanh, vong lap, bit…"
            aria-label="Từ khóa tìm kiếm"
            role="combobox"
            aria-expanded="true"
            aria-controls="search-results"
          />
          <ul id="search-results" role="listbox" className="mt-3 max-h-[50vh] space-y-1 overflow-y-auto">
            {results.length === 0 && <li className="p-3 text-sm text-muted">Không có kết quả phù hợp.</li>}
            {results.map((h, i) => (
              <li key={h.id} role="option" aria-selected={i === active}>
                <button type="button" onMouseEnter={() => setActive(i)} onClick={() => go(h)} className={cn("flex w-full items-start gap-3 rounded-xl px-3 py-2 text-left", i === active ? "bg-cyan/10" : "hover:bg-surface-2")}>
                  <h.icon className="mt-0.5 size-4 shrink-0 text-cyan-fg" />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-fg">{h.title}</span>
                    <span className="block truncate text-xs text-muted">{h.detail}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function NotificationBell({ studentId }: { studentId: string }) {
  const d = useApp();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const list = useMemo(() => studentNotifications(d, studentId), [d, studentId]);
  const read = new Set(d.notifRead[studentId] ?? []);
  const unread = list.filter((n) => !read.has(n.id)).length;
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", esc); };
  }, [open]);
  return (
    <div className="relative" ref={ref}>
      <Button variant="ghost" size="icon" aria-label={`Thông báo${unread ? `, ${unread} chưa đọc` : ""}`} aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <Bell />
        {unread > 0 && <span className="absolute right-1 top-1 grid min-w-4 place-items-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">{unread}</span>}
      </Button>
      {open && (
        <div className="absolute right-0 top-11 z-50 w-80 max-w-[calc(100vw-32px)] rounded-2xl border border-line bg-surface p-2 shadow-xl">
          <div className="flex items-center justify-between px-2 py-1">
            <p className="text-sm font-semibold text-fg">Thông báo</p>
            {unread > 0 && <button type="button" className="text-xs font-medium text-cyan-fg hover:underline" onClick={() => d.markNotifRead(studentId, list.map((n) => n.id))}>Đánh dấu đã đọc</button>}
          </div>
          {list.length === 0 ? <p className="p-3 text-sm text-muted">Chưa có thông báo.</p> : (
            <ul className="max-h-80 space-y-1 overflow-y-auto">
              {list.map((n) => (
                <li key={n.id}>
                  <Link href={n.href} onClick={() => { d.markNotifRead(studentId, [n.id]); setOpen(false); }} className={cn("block rounded-xl px-3 py-2 text-sm hover:bg-surface-2", !read.has(n.id) && "bg-cyan/5")}>
                    <span className={cn("mr-2 inline-block size-2 rounded-full", n.tone === "warning" ? "bg-warning" : n.tone === "success" ? "bg-success" : "bg-cyan")} aria-hidden />
                    <span className="text-fg">{n.text}</span>
                    <span className="block pl-4 text-xs text-muted">{formatDate(n.at, true)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

/** Áp dụng cỡ chữ và chế độ tương phản cao của người dùng. */
export function PrefsApplier({ userId }: { userId: string }) {
  const prefs = useApp((s) => s.prefs[userId]) ?? DEFAULT_PREFS;
  useEffect(() => {
    const el = document.documentElement;
    el.style.fontSize = `${Math.round(prefs.fontScale * 100)}%`;
    if (prefs.highContrast) el.dataset.contrast = "high";
    else delete el.dataset.contrast;
    return () => {
      el.style.fontSize = "";
      delete el.dataset.contrast;
    };
  }, [prefs.fontScale, prefs.highContrast]);
  return null;
}
