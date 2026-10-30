import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, Gamepad2, Keyboard, MousePointerClick, Save } from "lucide-react";
import { NOVA_CHAPTERS, NOVA_GAME_SRC, chapterLabel } from "@/lib/data/nova-adventure";
import { getLifeLab } from "@/lib/data/life-labs";
import { getLabBySlug } from "@/lib/data/labs";

export const metadata: Metadata = { title: "Phiêu lưu Nova" };

/** Tên và đường dẫn của một mô phỏng liên quan (kho đời sống hoặc mô phỏng theo bài). */
function simLink(slug: string) {
  const life = getLifeLab(slug);
  if (life) return { href: `/kho/${slug}`, title: life.title };
  const lab = getLabBySlug(slug);
  return lab ? { href: `/labs/${slug}`, title: lab.title } : null;
}

/** Phiêu lưu Nova: trò chơi 3D ôn Tin học qua 6 chương, chạy ngay trên trình duyệt, không cần tài khoản. */
export default function NovaAdventurePage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <header className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-3xl">
          <p className="flex items-center gap-2 text-sm font-semibold text-indigo-700 dark:text-indigo-300">
            <span className="rounded-full bg-rose-500 px-2 py-0.5 text-xs font-bold text-white">Mới</span>
            <Gamepad2 className="size-4" aria-hidden /> Trò chơi 3D · học bằng thực hành
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-fg sm:text-4xl">Phiêu lưu Nova: Sự cố ở Ngôi nhà Nova</h1>
          <p className="mt-2 text-muted">Mã độc Glitch đã chiếm ngôi nhà thông minh. Em là kỹ thuật viên: lắp lại máy tính, sửa mạng, thanh toán an toàn, lập trình đèn giao thông, dạy lại AI và đánh bại Glitch ở phòng máy chủ.</p>
        </div>
      </header>

      <section aria-label="Trò chơi" className="overflow-hidden rounded-3xl border border-line bg-[#d9e4ee] shadow-xl">
        <iframe src={NOVA_GAME_SRC} title="Trò chơi Sự cố ở Ngôi nhà Nova" className="block h-[min(640px,80vh)] w-full" allow="autoplay; fullscreen" />
      </section>
      <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-muted" aria-label="Cách chơi">
        <li className="inline-flex items-center gap-1.5"><MousePointerClick className="size-4" aria-hidden /> Bấm xuống sàn để đi, mũi tên vàng chỉ đường</li>
        <li className="inline-flex items-center gap-1.5"><Keyboard className="size-4" aria-hidden /> W A S D hoặc phím mũi tên · E để tương tác · Space để đọc tiếp</li>
        <li className="inline-flex items-center gap-1.5"><Save className="size-4" aria-hidden /> Tiến độ tự lưu trên trình duyệt này</li>
      </ul>

      <section aria-labelledby="chuong-h" className="mt-10">
        <h2 id="chuong-h" className="text-2xl font-bold tracking-tight text-fg">6 chương, 6 chủ đề Tin học</h2>
        <p className="mt-1 text-muted">Xong chương này mở khóa phòng tiếp theo. Muốn hiểu sâu hơn, thử các mô phỏng cùng chủ đề.</p>
        <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {NOVA_CHAPTERS.map((c) => (
            <li key={c.n} className="flex flex-col rounded-2xl border border-line bg-surface p-5">
              <p className="text-xs font-bold uppercase tracking-wide text-indigo-700 dark:text-indigo-300">{chapterLabel(c)} · {c.room}</p>
              <h3 className="mt-1 text-lg font-bold text-fg">{c.title}</h3>
              <p className="mt-1 flex-1 text-sm text-muted">{c.learn}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {c.slugs.map(simLink).filter((x): x is NonNullable<ReturnType<typeof simLink>> => !!x).map((x) => (
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
