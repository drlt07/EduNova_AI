import Link from "next/link";
import { Gamepad2 } from "lucide-react";
import { NOVA_HOME_GAME, chapterLabel, novaChapterFor } from "@/lib/data/nova-adventure";
import { cn } from "@/lib/utils";

/**
 * Dòng "Thử thách này có trong Chương N của Phiêu lưu Nova" dưới mô phỏng cùng chủ đề.
 * `asText`: dùng bên trong thẻ đã là liên kết (thẻ mô phỏng) — không lồng liên kết.
 */
export function NovaChapterNote({ slug, asText, className }: { slug: string; asText?: boolean; className?: string }) {
  const c = novaChapterFor(slug);
  if (!c) return null;
  const body = <><Gamepad2 className="size-4 shrink-0" aria-hidden /> <span>Thử thách này có trong {chapterLabel(c)} của <b className="font-semibold">Phiêu lưu Nova</b></span></>;
  const cls = cn("inline-flex items-center gap-1.5 rounded-lg bg-indigo-500/10 px-2.5 py-1 text-xs text-indigo-700 dark:text-indigo-300", className);
  return asText ? <span className={cls}>{body}</span> : <Link href={NOVA_HOME_GAME} className={cn(cls, "hover:bg-indigo-500/15")}>{body} <span aria-hidden>→</span></Link>;
}
