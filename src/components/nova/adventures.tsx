import Link from "next/link";
import { ArrowLeft, BookOpen, Clock, Gamepad2, Hourglass, Keyboard, Maximize, MousePointerClick, Play, Save } from "lucide-react";
import { ADVENTURES, ADVENTURE_SLOTS, chapterLabel, getAdventure, type Adventure } from "@/lib/data/nova-adventure";
import { getLifeLab } from "@/lib/data/life-labs";
import { getLabBySlug } from "@/lib/data/labs";
import { cn } from "@/lib/utils";
import { NovaFrame } from "./nova-frame";

/** Tên và đường dẫn của một mô phỏng liên quan: kho đời sống theo không gian đang đứng, mô phỏng theo bài ở trang công khai. */
function simLink(slug: string, khoBase: string) {
  const life = getLifeLab(slug);
  if (life) return { href: `${khoBase}/${slug}`, title: life.title };
  const lab = getLabBySlug(slug);
  return lab ? { href: `/labs/${slug}`, title: lab.title } : null;
}

/** Danh sách kịch bản của Phiêu lưu Nova; ô chưa có kịch bản hiện "Sắp ra mắt". */
export function AdventureHub({ base, intro }: { base: string; intro?: React.ReactNode }) {
  const empty = Math.max(0, ADVENTURE_SLOTS - ADVENTURES.length);
  return (
    <div>
      <header className="mb-6">
        <p className="flex items-center gap-2 text-sm font-semibold text-indigo-700 dark:text-indigo-300"><Gamepad2 className="size-4" aria-hidden /> Trò chơi 3D · học bằng thực hành</p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-fg">Phiêu lưu Nova</h1>
        <p className="mt-1 max-w-3xl text-muted">Mỗi kịch bản là một câu chuyện nhiều chương: đi lại trong không gian 3D, giải thử thách Tin học để cứu ngôi nhà, trường học, thành phố… Không cần tài khoản, tiến độ tự lưu.</p>
        {intro}
      </header>
      <ul className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {ADVENTURES.map((a) => (
          <li key={a.slug}>
            <Link href={`${base}/${a.slug}`} className="group flex h-full flex-col overflow-hidden rounded-3xl border border-line bg-surface shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl">
              <div className={cn("relative bg-gradient-to-br p-5 text-white", a.cover)}>
                <p className="text-xs font-bold uppercase tracking-wide text-cyan-200">Kịch bản {a.no}</p>
                <h2 className="mt-1 text-xl font-extrabold leading-snug">{a.title}</h2>
                <p className="mt-1 text-sm text-indigo-100">{a.tagline}</p>
                <ol className="mt-4 flex flex-wrap gap-1.5" aria-label="Các chương">
                  {a.chapters.map((c) => <li key={c.n} className="rounded-lg bg-white/10 px-2 py-0.5 text-xs ring-1 ring-white/15">{c.n < 6 ? c.n : "★"}. {c.title}</li>)}
                </ol>
              </div>
              <div className="flex flex-1 flex-col p-5">
                <p className="flex-1 text-sm text-muted">{a.summary}</p>
                <div className="mt-4 flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1 text-xs text-muted"><Clock className="size-3.5" aria-hidden /> khoảng {a.minutes} phút · {a.chapters.length} chương</span>
                  <span className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-3 py-1.5 text-sm font-semibold text-brand-ink group-hover:opacity-90"><Play className="size-4" aria-hidden /> Chơi</span>
                </div>
              </div>
            </Link>
          </li>
        ))}
        {Array.from({ length: empty }, (_, i) => (
          <li key={`soon-${i}`} className="flex min-h-56 flex-col items-center justify-center rounded-3xl border-2 border-dashed border-line p-6 text-center">
            <Hourglass className="size-8 text-muted" aria-hidden />
            <p className="mt-2 font-semibold text-fg">Kịch bản {ADVENTURES.length + i + 1}</p>
            <p className="text-sm text-muted">Sắp ra mắt</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Màn chơi một kịch bản: khung trò chơi, cách chơi, các chương và mô phỏng cùng chủ đề. */
export function AdventurePlay({ slug, base, khoBase }: { slug: string; base: string; khoBase: string }) {
  const a: Adventure | undefined = getAdventure(slug);
  if (!a?.src)
    return (
      <div className="py-16 text-center">
        <p className="text-lg font-semibold text-fg">Không tìm thấy kịch bản này</p>
        <Link href={base} className="mt-3 inline-flex items-center gap-1 text-blue-fg hover:underline"><ArrowLeft className="size-4" aria-hidden /> Về Phiêu lưu Nova</Link>
      </div>
    );
  return (
    <div>
      <Link href={base} className="inline-flex items-center gap-1 text-sm font-medium text-muted hover:text-fg"><ArrowLeft className="size-4" aria-hidden /> Phiêu lưu Nova</Link>
      <header className="mb-4 mt-2">
        <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">Kịch bản {a.no} · {a.chapters.length} chương · khoảng {a.minutes} phút</p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-fg">{a.title}</h1>
        <p className="mt-1 max-w-3xl text-muted">{a.summary}</p>
      </header>

      <NovaFrame src={a.src} title={`Trò chơi ${a.title}`} />
      <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-muted" aria-label="Cách chơi">
        <li className="inline-flex items-center gap-1.5"><MousePointerClick className="size-4" aria-hidden /> Bấm xuống sàn để đi, mũi tên vàng chỉ đường</li>
        <li className="inline-flex items-center gap-1.5"><Keyboard className="size-4" aria-hidden /> W A S D hoặc phím mũi tên · E để tương tác · Space để đọc tiếp</li>
        <li className="inline-flex items-center gap-1.5"><Maximize className="size-4" aria-hidden /> F: toàn màn hình · A+ đổi cỡ chữ · nút nốt nhạc bật/tắt nhạc nền</li>
        <li className="inline-flex items-center gap-1.5"><Save className="size-4" aria-hidden /> Tiến độ tự lưu trên trình duyệt này</li>
      </ul>

      <section aria-labelledby="chuong-h" className="mt-10">
        <h2 id="chuong-h" className="text-2xl font-bold tracking-tight text-fg">Các chương và chủ đề Tin học</h2>
        <p className="mt-1 text-muted">Xong chương này mở khóa phòng tiếp theo. Muốn hiểu sâu hơn, thử các mô phỏng cùng chủ đề.</p>
        <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {a.chapters.map((c) => (
            <li key={c.n} className="flex flex-col rounded-2xl border border-line bg-surface p-5">
              <p className="text-xs font-bold uppercase tracking-wide text-indigo-700 dark:text-indigo-300">{chapterLabel(c)} · {c.room}</p>
              <h3 className="mt-1 text-lg font-bold text-fg">{c.title}</h3>
              <p className="mt-1 flex-1 text-sm text-muted">{c.learn}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {c.slugs.map((s) => simLink(s, khoBase)).filter((x): x is NonNullable<ReturnType<typeof simLink>> => !!x).map((x) => (
                  <Link key={x.href} href={x.href} className="inline-flex items-center gap-1 rounded-lg bg-surface-2 px-2 py-1 text-xs font-medium text-fg hover:bg-brand/10 hover:text-blue-fg"><BookOpen className="size-3.5" aria-hidden /> {x.title}</Link>
                ))}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
