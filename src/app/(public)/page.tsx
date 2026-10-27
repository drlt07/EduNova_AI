import Link from "next/link";
import { ArrowRight, BarChart3, BookOpen, Bot, Check, ClipboardCheck, Code2, Compass, FlaskConical, Gamepad2, NotebookPen, Play, Sparkles, Trophy, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeroTraffic } from "@/components/landing/hero-traffic";
import { RoleLink } from "@/components/landing/role-link";
import { ComputerArt, FarmArt, NetworkArt, TrafficArt } from "@/components/landing/sim-art";
import { LESSONS } from "@/lib/data/curriculum";
import { LAB_TEMPLATES, getLabBySlug } from "@/lib/data/labs";
import { cn } from "@/lib/utils";

/* Bố cục: một cột đọc rộng 6xl; các khu xen kẽ nền trang / dải nền bề mặt có đường kẻ mảnh; một màu nhấn (cyan-fg). */

const GRADES = [
  { g: 10, title: "Dữ liệu và lập trình" },
  { g: 11, title: "Máy tính và cơ sở dữ liệu" },
  { g: 12, title: "Mạng, AI và sáng tạo số" },
] as const;

/** Mô tả bám đúng những gì mô phỏng làm được hôm nay; phần chưa có ghi rõ. */
const SIMS = [
  { slug: "smart-coding-city", art: TrafficArt, title: "Điều khiển giao thông thông minh", meta: "Tin 10 · Câu lệnh rẽ nhánh", text: "Điều khiển đèn tín hiệu, quan sát xe dừng trước vạch và đi qua giao lộ trong thành phố 3D." },
  { slug: "smart-garden", art: FarmArt, title: "Nông trại thông minh", meta: "Tin 10 · Điều kiện, vòng lặp", text: "Đặt quy tắc tưới theo cảm biến độ ẩm và quan sát cây trồng." },
  { slug: "inside-computer-3d", art: ComputerArt, title: "Khám phá bên trong máy tính", meta: "Tin 11 · Hệ thống máy tính", text: "Xoay, quan sát và lắp các linh kiện phần cứng." },
  { slug: "network-journey", art: NetworkArt, title: "Giải cứu mạng máy tính", meta: "Tin 12 · Mạng máy tính", text: "Kết nối thiết bị, truyền dữ liệu và xử lý sự cố mạng." },
];

const STEPS = [
  { icon: BookOpen, title: "Tìm hiểu", text: "Bài học có hình ảnh, ví dụ, câu hỏi tương tác." },
  { icon: Compass, title: "Khám phá", text: "Bước vào tình huống mô phỏng, nhận nhiệm vụ." },
  { icon: FlaskConical, title: "Thực hành", text: "Viết chương trình, đổi tham số, quan sát kết quả." },
  { icon: Bot, title: "Được hướng dẫn", text: "AI Gia sư gợi mở khi em gặp khó." },
  { icon: Trophy, title: "Tiến bộ", text: "Xem kết quả, nhận xét và hoàn thiện kỹ năng." },
];

const SPACES = [
  {
    role: "student" as const,
    title: "Học sinh",
    text: "Học theo chương trình, khám phá mô phỏng, tự luyện và theo dõi kết quả.",
    items: ["Khóa học và nhiệm vụ thầy cô giao", "Tình huống mô phỏng theo khối lớp", "Luyện tập: lập trình, trắc nghiệm, HTML/CSS", "AI Gia sư ngay trong bài", "Kết quả học tập trong trang cá nhân"],
    cta: "Vào không gian học sinh",
    icon: Gamepad2,
  },
  {
    role: "teacher" as const,
    title: "Giáo viên",
    text: "Chuẩn bị bài dạy, tổ chức hoạt động với mô phỏng và đánh giá theo minh chứng.",
    items: ["Trợ lý KHBD AI: soạn, cải tiến, xuất Word", "Khóa học: bài học, mô phỏng, hoạt động", "Lớp học của tôi", "Bài tập & Đánh giá theo tiêu chí", "Kết quả học tập và điều học sinh hay hỏi"],
    cta: "Vào không gian giáo viên",
    icon: NotebookPen,
  },
];

function SectionHead({ id, eyebrow, title, text, action }: { id: string; eyebrow: string; title: string; text?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-fg">{eyebrow}</p>
        <h2 id={id} className="mt-2 text-balance text-3xl font-bold tracking-tight text-fg sm:text-[34px]">{title}</h2>
        {text && <p className="mt-3 text-muted">{text}</p>}
      </div>
      {action}
    </div>
  );
}

function Status({ ready }: { ready: boolean }) {
  return ready ? (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-success-fg"><span className="size-1.5 rounded-full bg-success" aria-hidden /> Chơi được</span>
  ) : (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted"><span className="size-1.5 rounded-full bg-muted/60" aria-hidden /> Đang phát triển</span>
  );
}

export default function HomePage() {
  const lessonsOf = (g: number) => LESSONS.filter((l) => l.grade === g && l.textbookId === "kntt").sort((a, b) => a.order - b.order);
  const playable = LAB_TEMPLATES.filter((l) => l.status !== "planned").length;
  const facts = [
    { value: "10 · 11 · 12", label: "Ba khối lớp, GDPT 2018" },
    { value: `${LAB_TEMPLATES.length}`, label: `Mô phỏng, ${playable} chơi được` },
    { value: "5 bước", label: "Từ kiến thức đến thực hành" },
    { value: "AI", label: "Gia sư và trợ lý KHBD" },
  ];
  const [lead, ...rest] = SIMS;
  const leadReady = getLabBySlug(lead.slug)?.status === "available";

  return (
    <>
      {/* HERO */}
      <section aria-labelledby="hero-h" className="border-b border-line">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-14 sm:px-6 lg:grid-cols-[1fr_1.1fr] lg:py-20">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-fg">Nền tảng học tập Tin học THPT</p>
            <h1 id="hero-h" className="mt-4 text-balance text-4xl font-extrabold leading-[1.08] tracking-tight text-fg sm:text-5xl lg:text-[54px]">
              Học Tin học qua trải nghiệm. <span className="text-cyan-fg">Sáng tạo cùng AI.</span>
            </h1>
            <p className="mt-5 max-w-[34rem] text-lg leading-relaxed text-muted">
              Bài học tương tác, mô phỏng 3D và thực hành lập trình cho Tin học 10, 11, 12 — kết nối giáo viên và học sinh trong một không gian học tập.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button asChild size="lg" variant="ink">
                <Link href="/labs">Khám phá mô phỏng <ArrowRight /></Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <RoleLink role="student">Bắt đầu học tập</RoleLink>
              </Button>
            </div>
            <p className="mt-4 text-sm text-muted">Bản dùng thử có sẵn tài khoản, không cần mật khẩu.</p>
          </div>

          <figure className="min-w-0">
            <div className="overflow-hidden rounded-2xl border border-line bg-surface">
              <HeroTraffic />
              <figcaption className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-fg">Thành phố giao thông · Tin 10</p>
                  <p className="text-xs text-muted">Nhiệm vụ thử: điều khiển đèn để 12 lượt xe qua giao lộ an toàn.</p>
                </div>
                <Link href="/labs/smart-coding-city" className="inline-flex items-center gap-1.5 text-sm font-semibold text-cyan-fg hover:underline">
                  <Play className="size-3.5" aria-hidden /> Trải nghiệm ngay
                </Link>
              </figcaption>
            </div>
          </figure>
        </div>
        <dl className="mx-auto grid max-w-6xl grid-cols-2 border-t border-line px-4 sm:px-6 lg:grid-cols-4">
          {facts.map((f, i) => (
            <div key={f.label} className={cn("py-5", i % 2 === 1 && "pl-5 border-l border-line", i >= 2 && "border-t border-line lg:border-t-0", i > 0 && "lg:border-l lg:pl-6")}>
              <dt className="text-xs text-muted">{f.label}</dt>
              <dd className="mt-1 text-xl font-bold tracking-tight text-fg tabular-nums">{f.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* CHƯƠNG TRÌNH */}
      <section aria-labelledby="grades-h" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
        <SectionHead id="grades-h" eyebrow="Chương trình học" title="Tin học 10, 11 và 12 trong một lộ trình" text="Mỗi khối có chủ đề, bài học và mô phỏng đi kèm theo bộ sách Kết nối tri thức." />
        <div className="mt-10 grid overflow-hidden rounded-2xl border border-line bg-surface md:grid-cols-3">
          {GRADES.map((x, i) => (
            <Link key={x.g} href={`/curriculum?grade=${x.g}`} className={cn("group flex flex-col p-6 transition-colors hover:bg-surface-2", i > 0 && "border-t border-line md:border-l md:border-t-0")}>
              <span className="font-mono text-sm text-muted">Lớp {x.g}</span>
              <h3 className="mt-1 text-lg font-bold text-fg">{x.title}</h3>
              <ul className="mt-4 space-y-2 text-sm text-muted">
                {lessonsOf(x.g).slice(0, 3).map((l) => (
                  <li key={l.id} className="flex gap-2"><span className="mt-2 size-1 shrink-0 rounded-full bg-muted/60" aria-hidden /><span className="line-clamp-1">{l.title}</span></li>
                ))}
              </ul>
              <span className="mt-auto inline-flex items-center gap-1 pt-6 text-sm font-semibold text-cyan-fg">
                {lessonsOf(x.g).length} bài học <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* KHO MÔ PHỎNG */}
      <section aria-labelledby="sims-h" className="border-y border-line bg-surface/60">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
          <SectionHead
            id="sims-h"
            eyebrow="Kho mô phỏng"
            title="Kiến thức trở nên sống động qua từng mô phỏng"
            text="Không chỉ đọc và ghi nhớ — học sinh trực tiếp thao tác, thử nghiệm và giải quyết tình huống gắn với bài học."
            action={<Button asChild variant="outline"><Link href="/labs">Xem toàn bộ kho <ArrowRight /></Link></Button>}
          />
          <div className="mt-10 grid gap-4 lg:grid-cols-[1.25fr_1fr]">
            <Link href={`/labs/${lead.slug}`} className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-surface transition-colors hover:border-fg/25">
              <lead.art className="aspect-[16/9] w-full" />
              <div className="flex flex-1 flex-col gap-2 border-t border-line p-6">
                <div className="flex items-center justify-between gap-3"><span className="text-xs text-muted">{lead.meta}</span><Status ready={leadReady} /></div>
                <h3 className="text-xl font-bold text-fg">{lead.title}</h3>
                <p className="text-sm text-muted">{lead.text}</p>
                <span className="mt-auto inline-flex items-center gap-1 pt-3 text-sm font-semibold text-cyan-fg">Bắt đầu <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden /></span>
              </div>
            </Link>
            <ul className="grid gap-4">
              {rest.map((s) => {
                const ready = getLabBySlug(s.slug)?.status === "available";
                return (
                  <li key={s.slug}>
                    <Link href={`/labs/${s.slug}`} className="group grid h-full grid-cols-[112px_minmax(0,1fr)] overflow-hidden rounded-2xl border border-line bg-surface transition-colors hover:border-fg/25 sm:grid-cols-[148px_minmax(0,1fr)]">
                      <s.art className={cn("h-full w-full object-cover", !ready && "opacity-70 grayscale")} />
                      <div className="flex min-w-0 flex-col gap-1 border-l border-line p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2"><span className="text-xs text-muted">{s.meta}</span><Status ready={ready} /></div>
                        <h3 className="font-semibold text-fg">{s.title}</h3>
                        <p className="line-clamp-2 text-sm text-muted">{s.text}</p>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </section>

      {/* PHƯƠNG PHÁP */}
      <section aria-labelledby="steps-h" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
        <SectionHead id="steps-h" eyebrow="Phương pháp" title="Học Tin học theo cách mới" text="Mỗi mô phỏng là một bước trong quá trình học, không chỉ để giải trí." />
        <ol className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-5">
          {STEPS.map((s, i) => (
            <li key={s.title} className="flex flex-col gap-3 bg-surface p-5">
              <div className="flex items-center justify-between">
                <s.icon className="size-5 text-cyan-fg" aria-hidden />
                <span className="font-mono text-xs text-muted">{String(i + 1).padStart(2, "0")}</span>
              </div>
              <h3 className="font-semibold text-fg">{s.title}</h3>
              <p className="text-sm text-muted">{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* HAI KHÔNG GIAN */}
      <section aria-labelledby="spaces-h" className="border-y border-line bg-surface/60">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
          <SectionHead id="spaces-h" eyebrow="Hai không gian" title="Dành cho học sinh và giáo viên" />
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {SPACES.map((s) => (
              <div key={s.role} className="flex flex-col rounded-2xl border border-line bg-surface p-7">
                <div className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-xl bg-surface-2 text-cyan-fg"><s.icon className="size-5" aria-hidden /></span>
                  <h3 className="text-xl font-bold text-fg">{s.title}</h3>
                </div>
                <p className="mt-3 text-muted">{s.text}</p>
                <ul className="mt-5 space-y-2.5">
                  {s.items.map((it) => (
                    <li key={it} className="flex items-start gap-2.5 text-sm text-fg"><Check className="mt-0.5 size-4 shrink-0 text-cyan-fg" aria-hidden /> {it}</li>
                  ))}
                </ul>
                <div className="mt-auto pt-7">
                  <RoleLink role={s.role} className="inline-flex items-center gap-1.5 text-sm font-semibold text-fg hover:text-cyan-fg">{s.cta} <ArrowRight className="size-4" aria-hidden /></RoleLink>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TRỢ LÝ AI */}
      <section aria-labelledby="ai-h" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-fg">Trợ lý AI</p>
            <h2 id="ai-h" className="mt-2 text-balance text-3xl font-bold tracking-tight text-fg sm:text-[34px]">AI đồng hành, đúng lúc cần</h2>
            <p className="mt-4 text-muted">AI hỗ trợ suy nghĩ và sáng tạo — không thay thế quá trình học tập của học sinh hay quyết định chuyên môn của giáo viên.</p>
            <ul className="mt-6 space-y-3 text-sm">
              {[
                [Sparkles, "Gia sư đọc đúng bài làm của em: mã nguồn, kết quả kiểm thử, trạng thái mô phỏng."],
                [ClipboardCheck, "Giáo viên đặt mức hỗ trợ: học tự do, có hướng dẫn, hoặc tắt khi kiểm tra."],
                [BarChart3, "Giáo viên xem tổng hợp điều học sinh hay hỏi, không đọc nội dung trò chuyện."],
              ].map(([Icon, t]) => {
                const I = Icon as typeof Sparkles;
                return <li key={t as string} className="flex gap-3"><I className="mt-0.5 size-4 shrink-0 text-cyan-fg" aria-hidden /><span className="text-fg">{t as string}</span></li>;
              })}
            </ul>
          </div>

          <div className="grid gap-4">
            <figure className="min-w-0 rounded-2xl border border-line bg-surface p-5">
              <figcaption className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted"><Users className="size-3.5" aria-hidden /> Học sinh · đang điều khiển giao thông</figcaption>
              <pre className="mt-3 overflow-x-auto rounded-xl bg-[#0B1220] px-4 py-3 font-mono text-[13px] leading-6 text-slate-200">{`if den == "do":
    di_tiep()        `}<span className="text-rose-300"># xe vượt đèn đỏ</span>{`
else:
    dung_truoc_vach()`}</pre>
              <p className="mt-3 flex gap-2.5 text-sm text-fg"><Bot className="mt-0.5 size-4 shrink-0 text-cyan-fg" aria-hidden /> Em hãy kiểm tra điều kiện của đèn đỏ. Khi trạng thái này xảy ra, xe nên nhận lệnh gì?</p>
            </figure>
            <figure className="min-w-0 rounded-2xl border border-line bg-surface p-5">
              <figcaption className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted"><NotebookPen className="size-3.5" aria-hidden /> Giáo viên · đang soạn KHBD</figcaption>
              <p className="mt-3 text-sm text-muted">Mục tiêu: <span className="text-fg">Sử dụng được câu lệnh rẽ nhánh if…else để giải quyết bài toán.</span></p>
              <div className="mt-3 flex gap-2.5 text-sm">
                <Code2 className="mt-0.5 size-4 shrink-0 text-cyan-fg" aria-hidden />
                <p className="text-fg">Đề xuất cho hoạt động vận dụng: mô phỏng <b>Thành phố giao thông</b>, tiêu chí “điều kiện đúng, đã thử đủ trạng thái đèn”. <span className="text-muted">Chờ giáo viên duyệt.</span></p>
              </div>
            </figure>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section aria-labelledby="cta-h" className="border-t border-line bg-surface/60">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-4 py-14 sm:px-6 md:flex-row md:items-center">
          <div>
            <h2 id="cta-h" className="text-balance text-2xl font-bold tracking-tight text-fg sm:text-3xl">Sẵn sàng khám phá Tin học theo cách mới?</h2>
            <p className="mt-2 text-muted">Bắt đầu với một bài học, trải nghiệm mô phỏng và tự giải quyết thử thách công nghệ.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg" variant="ink"><Link href="/labs">Khám phá kho mô phỏng <ArrowRight /></Link></Button>
            <Button asChild size="lg" variant="outline"><Link href="/login">Đăng nhập</Link></Button>
          </div>
        </div>
      </section>
    </>
  );
}
