"use client";

import { useRef } from "react";
import { Maximize } from "lucide-react";

/** Khung iframe của một kịch bản, kèm nút mở toàn màn hình (trong trò chơi còn có nút riêng và phím F). */
export function NovaFrame({ src, title }: { src: string; title: string }) {
  const ref = useRef<HTMLIFrameElement>(null);
  const full = () => {
    const el = ref.current;
    if (!el) return;
    void el.requestFullscreen?.().then(() => el.contentWindow?.focus()).catch(() => undefined);
  };
  return (
    <div>
      <section aria-label="Trò chơi" className="overflow-hidden rounded-3xl border border-line bg-[#d9e4ee] shadow-xl">
        <iframe ref={ref} src={src} title={title} className="block h-[min(640px,80vh)] w-full" allow="autoplay; fullscreen" allowFullScreen />
      </section>
      <div className="mt-2 flex justify-end">
        <button type="button" onClick={full} className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-surface px-3 py-1.5 text-sm font-semibold text-fg hover:bg-surface-2">
          <Maximize className="size-4" aria-hidden /> Toàn màn hình
        </button>
      </div>
    </div>
  );
}
