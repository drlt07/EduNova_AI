"use client";
import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { bookOf, itemKey, type BookEntry } from "@/lib/sgk/book";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Block, Rich, type BlockCtx } from "./blocks";

interface Slide { key: string; kicker: string; title: string; body: ReactNode }

/**
 * Trình chiếu bài học trên lớp: mỗi mục một trang chữ lớn, mô phỏng mở sẵn. Phím ← → để chuyển, Esc để thoát.
 * Có thể chỉ chiếu các mục thầy cô đã chọn để dạy.
 */
export function Presenter({ e, picks, onClose }: { e: BookEntry; picks: Set<string>; onClose: () => void }) {
  const c = e.content!;
  const [onlyPicked, setOnlyPicked] = useState(picks.size > 0);
  const [i, setI] = useState(0);
  const ctx: BlockCtx = { teacher: true, present: true };
  const book = bookOf(e.grade);
  const sections = c.sections.filter((s) => !onlyPicked || picks.has(itemKey(e.ref, s.id)) || s.blocks.some((b) => b.t === "sim" && picks.has(`${e.ref}#sim:${b.slug}`)));
  const slides: Slide[] = [
    { key: "mo-dau", kicker: `${book.title} · Chủ đề ${e.topic.no}`, title: `Bài ${e.lesson.no}. ${e.lesson.title}`, body: <><p className="text-2xl text-fg/80">Hôm nay chúng ta sẽ:</p><ol className="mt-4 list-decimal space-y-3 pl-8 text-3xl leading-snug text-fg">{c.objectives.map((o) => <li key={o}>{o}</li>)}</ol></> },
    { key: "khoi-dong", kicker: "Khởi động", title: "Cùng suy nghĩ", body: <p className="text-4xl leading-snug text-fg"><Rich text={c.warmUp} /></p> },
    // Mỗi mục: tách thành các trang, mô phỏng và câu hỏi đứng riêng một trang để đủ chỗ.
    ...sections.flatMap((s, si) => {
      const pages: Slide[] = [];
      let buf: typeof s.blocks = [];
      const flush = () => { if (buf.length) { const b = buf; pages.push({ key: `${s.id}-${pages.length}`, kicker: `Mục ${c.sections.indexOf(s) + 1}`, title: s.title, body: <>{b.map((x, j) => <Block key={j} b={x} ctx={ctx} />)}</> }); buf = []; } };
      for (const b of s.blocks) {
        if (b.t === "sim" || b.t === "check" || b.t === "algo") { flush(); pages.push({ key: `${s.id}-${pages.length}`, kicker: `Mục ${c.sections.indexOf(s) + 1}`, title: s.title, body: <Block b={b} ctx={ctx} /> }); }
        else { buf.push(b); if (buf.length >= 3) flush(); }
      }
      flush();
      return pages.map((p) => ({ ...p, key: `${si}-${p.key}` }));
    }),
    { key: "ghi-nho", kicker: "Ghi nhớ", title: "Điều cần nhớ", body: <ul className="space-y-4 text-3xl leading-snug text-fg">{c.remember.map((r) => <li key={r}>• <Rich text={r} /></li>)}</ul> },
    { key: "van-dung", kicker: "Về nhà", title: "Vận dụng", body: <p className="text-3xl leading-snug text-fg"><Rich text={c.apply} /></p> },
  ];
  const n = slides.length;
  const at = Math.min(i, n - 1);
  const s = slides[at];

  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") onClose();
      if (ev.key === "ArrowRight" || ev.key === "PageDown" || ev.key === " ") { ev.preventDefault(); setI((x) => Math.min(x + 1, n - 1)); }
      if (ev.key === "ArrowLeft" || ev.key === "PageUp") setI((x) => Math.max(x - 1, 0));
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [n, onClose]);

  return createPortal(
    <div role="dialog" aria-modal="true" aria-label="Trình chiếu bài học" className="fixed inset-0 z-[60] flex flex-col bg-bg">
      <div className="flex items-center gap-3 border-b border-line px-5 py-2 text-sm">
        <span className="font-semibold text-fg">Bài {e.lesson.no}. {e.lesson.title}</span>
        {picks.size > 0 && <label className="ml-4 flex items-center gap-1.5 text-muted"><input type="checkbox" checked={onlyPicked} onChange={(ev) => { setOnlyPicked(ev.target.checked); setI(0); }} /> Chỉ chiếu mục đã chọn ({picks.size})</label>}
        <span className="ml-auto tabular-nums text-muted">{at + 1} / {n}</span>
        <Button size="icon" variant="ghost" aria-label="Thoát trình chiếu" onClick={onClose}><X /></Button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-5xl px-8 py-10">
          <p className="text-lg font-semibold uppercase tracking-wide text-cyan-fg">{s.kicker}</p>
          <h2 className="mt-2 text-5xl font-bold tracking-tight text-fg">{s.title}</h2>
          <div className="mt-8">{s.body}</div>
        </div>
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-line px-5 py-3">
        <Button variant="secondary" onClick={() => setI(Math.max(0, at - 1))} disabled={at === 0}><ChevronLeft /> Trước</Button>
        <div className="flex gap-1" aria-hidden>{slides.map((x, k) => <span key={x.key} className={cn("h-1.5 rounded-full transition-all", k === at ? "w-6 bg-cyan" : "w-1.5 bg-line")} />)}</div>
        <Button onClick={() => setI(Math.min(n - 1, at + 1))} disabled={at === n - 1}>Tiếp <ChevronRight /></Button>
      </div>
    </div>,
    document.body,
  );
}
