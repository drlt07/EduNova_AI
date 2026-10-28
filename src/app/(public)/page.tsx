import Link from "next/link";
import { AccountCta, GuestOnly } from "@/components/layout/account-cta";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Bot,
  ClipboardCheck,
  Code2,
  Compass,
  FlaskConical,
  Gamepad2,
  GraduationCap,
  Hourglass,
  Lightbulb,
  Lock,
  NotebookPen,
  Play,
  Sparkles,
  Trophy,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HeroTraffic } from "@/components/landing/hero-traffic";
import { RoleLink } from "@/components/landing/role-link";
import { ComputerArt, FarmArt, NetworkArt, TrafficArt } from "@/components/landing/sim-art";
import { LAB_TEMPLATES, getLabBySlug } from "@/lib/data/labs";
import { LESSONS } from "@/lib/data/curriculum";
import { cn } from "@/lib/utils";

const GRADES = [
  { g: 10, title: "Dữ liệu và lập trình", text: "Thông tin và dữ liệu, hệ nhị phân, an toàn số, lập trình Python: biến, rẽ nhánh, vòng lặp, hàm.", tone: "from-cyan/25 via-cyan/5" },
  { g: 11, title: "Máy tính và cơ sở dữ liệu", text: "Bên trong máy tính, hệ điều hành, cơ sở dữ liệu quan hệ và truy vấn SQL.", tone: "from-blue/25 via-blue/5" },
  { g: 12, title: "Mạng, AI và sáng tạo số", text: "Mạng máy tính, trí tuệ nhân tạo, thiết kế web với HTML/CSS, công dân số.", tone: "from-violet/25 via-violet/5" },
];

/** Mô tả bám đúng những gì mô phỏng làm được hôm nay; phần chưa có ghi rõ "sắp có". */
const SIMS = [
  { slug: "smart-coding-city", art: TrafficArt, title: "Điều khiển giao thông thông minh", meta: "Tin học 10 • Câu lệnh rẽ nhánh", text: "Điều khiển đèn tín hiệu, quan sát xe dừng trước vạch và đi qua giao lộ trong thành phố 3D.", note: "Trình soạn Python điều khiển xe và đèn: sắp có" },
  { slug: "smart-garden", art: FarmArt, title: "Nông trại thông minh", meta: "Tin học 10 • Điều kiện và vòng lặp", text: "Thiết lập quy tắc tưới nước dựa trên cảm biến và quan sát cây trồng." },
  { slug: "inside-computer-3d", art: ComputerArt, title: "Khám phá bên trong máy tính", meta: "Tin học 11 • Hệ thống máy tính", text: "Xoay, quan sát và tương tác với các thành phần phần cứng." },
  { slug: "network-journey", art: NetworkArt, title: "Giải cứu mạng máy tính", meta: "Tin học 12 • Mạng máy tính", text: "Kết nối các thiết bị, truyền dữ liệu và xử lý sự cố mạng." },
];

const STEPS = [
  { icon: BookOpen, title: "Tìm hiểu kiến thức", text: "Tiếp cận bài học bằng hình ảnh, ví dụ và hoạt động tương tác." },
  { icon: Compass, title: "Khám phá mô phỏng", text: "Bước vào tình huống 3D, nhận nhiệm vụ và quan sát vấn đề." },
  { icon: FlaskConical, title: "Thực hành và thử nghiệm", text: "Viết chương trình, thay đổi tham số và quan sát kết quả." },
  { icon: Bot, title: "Nhận hướng dẫn từ AI", text: "Được giải thích và gợi ý từng bước khi gặp khó khăn." },
  { icon: Trophy, title: "Đánh giá và tiến bộ", text: "Xem kết quả, rút kinh nghiệm và hoàn thiện kỹ năng." },
];

const SPACES = [
  {
    role: "student" as const,
    title: "Dành cho học sinh",
    text: "Học theo chương trình Tin học 10–12, khám phá mô phỏng, thực hành lập trình và theo dõi kết quả.",
    items: [
      [BookOpen, "Khóa học của tôi"],
      [Gamepad2, "Tình huống mô phỏng"],
      [Code2, "Luyện tập: lập trình, trắc nghiệm, HTML/CSS"],
      [Bot, "AI Gia sư ngay trong bài"],
      [Trophy, "Kết quả học tập trong trang cá nhân"],
    ] as const,
    cta: "Khám phá không gian học sinh",
    card: "border-cyan/30 from-cyan/15",
    icon: "text-cyan-fg",
  },
  {
    role: "teacher" as const,
    title: "Dành cho giáo viên",
    text: "Thiết kế kế hoạch bài dạy, tạo học liệu, sử dụng mô phỏng để tổ chức hoạt động và đánh giá học sinh.",
    items: [
      [Users, "Lớp học của tôi"],
      [BookOpen, "Khóa học: bài học, mô phỏng, hoạt động"],
      [ClipboardCheck, "Bài tập & Đánh giá"],
      [BarChart3, "Kết quả học tập"],
      [NotebookPen, "Trợ lý KHBD AI"],
    ] as const,
    cta: "Khám phá không gian giáo viên",
    card: "border-violet/30 from-violet/15",
    icon: "text-violet-fg",
  },
];

function SectionHead({ id, eyebrow, title, text, center }: { id: string; eyebrow: string; title: string; text?: string; center?: boolean }) {
  return (
    <div className={cn("max-w-2xl", center && "mx-auto text-center")}>
      <p className="text-sm font-semibold uppercase tracking-wider text-cyan-fg">{eyebrow}</p>
      <h2 id={id} className="mt-2 text-3xl font-bold tracking-tight text-fg sm:text-4xl">{title}</h2>
      {text && <p className="mt-3 text-muted sm:text-lg">{text}</p>}
    </div>
  );
}

export default function HomePage() {
  return (
    <>
      {/* 02 · HERO */}
      <section className="relative overflow-hidden bg-grid" aria-labelledby="hero-h">
        <div aria-hidden className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(79,127,255,0.28),transparent)]" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 pb-20 pt-14 sm:px-6 lg:grid-cols-[1fr_1.05fr] lg:pt-20">
          <div>
            <Badge tone="cyan" className="mb-5">
              <GraduationCap className="size-3.5" /> Nền tảng học tập Tin học THPT
            </Badge>
            <h1 id="hero-h" className="text-4xl font-extrabold leading-[1.1] tracking-tight text-fg sm:text-5xl lg:text-[56px]">
              Học Tin học qua trải nghiệm. <span className="text-gradient">Sáng tạo cùng AI.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-muted">
              Khám phá kiến thức Tin học lớp 10, 11, 12 qua các bài học tương tác, trò chơi mô phỏng 3D và hoạt động thực hành lập trình. Kết nối giáo viên và học sinh trong một môi trường học tập thông minh.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/labs">
                  Khám phá mô phỏng <ArrowRight />
                </Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <RoleLink role="student">Bắt đầu học tập</RoleLink>
              </Button>
            </div>
            <GuestOnly>
              <p className="mt-4 flex items-center gap-2 text-sm text-muted">
                <Lock className="size-4 shrink-0 text-cyan-fg" aria-hidden />
                Đăng nhập để sử dụng các chức năng — bản dùng thử có sẵn tài khoản, không cần mật khẩu.
              </p>
            </GuestOnly>
          </div>
          <div className="relative">
            <div className="rounded-[22px] border border-line bg-surface/80 p-3 shadow-[0_30px_80px_-30px_rgba(34,211,238,0.35)] backdrop-blur">
              <div className="mb-3 flex items-center justify-between gap-3 px-1">
                <div className="flex gap-1.5" aria-hidden>
                  <span className="size-2.5 rounded-full bg-danger/70" />
                  <span className="size-2.5 rounded-full bg-warning/70" />
                  <span className="size-2.5 rounded-full bg-success/70" />
                </div>
                <span className="truncate text-xs text-muted">Smart Traffic City · Tin 10 · câu lệnh rẽ nhánh</span>
                <span />
              </div>
              <HeroTraffic />
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 px-1">
                <p className="text-sm text-muted">Nhiệm vụ thử: điều khiển đèn để 12 lượt xe qua giao lộ an toàn.</p>
                <Button asChild size="sm">
                  <Link href="/labs/smart-coding-city">
                    <Play className="size-3.5" /> Trải nghiệm ngay
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
        <div className="relative mx-auto max-w-7xl px-4 pb-12 sm:px-6">
          <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              [`${new Set(LESSONS.map((l) => l.key)).size}`, "bài học Tin 10–12 theo GDPT 2018"],
              [`${LAB_TEMPLATES.length}`, `mô phỏng, ${LAB_TEMPLATES.filter((l) => l.status !== "planned").length} chơi được ngay`],
              ["4", "khả năng của AI Gia sư, 3 mức do giáo viên đặt"],
              ["6 + 5", "chức năng cho giáo viên và học sinh"],
            ].map(([v, k]) => (
              <div key={k} className="rounded-2xl border border-line/70 bg-surface/70 p-4 backdrop-blur">
                <dd className="text-2xl font-extrabold text-gradient tabular-nums">{v}</dd>
                <dt className="mt-0.5 text-sm text-muted">{k}</dt>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* 03 · CHƯƠNG TRÌNH 10–11–12 */}
      <section className="border-y border-line bg-surface/40" aria-labelledby="grades-h">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <SectionHead id="grades-h" eyebrow="Chương trình học" title="Khám phá chương trình Tin học" text="Đầy đủ ba khối lớp theo Chương trình GDPT 2018 — mỗi khối có chủ đề, bài học và mô phỏng đi kèm." />
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {GRADES.map((x) => (
              <Link key={x.g} href={`/curriculum?grade=${x.g}`} className={cn("group relative overflow-hidden rounded-3xl border border-line bg-gradient-to-br to-transparent p-7 transition-all hover:-translate-y-0.5 hover:border-cyan/40", x.tone)}>
                <p className="text-6xl font-extrabold text-gradient">{x.g}</p>
                <h3 className="mt-2 text-xl font-bold text-fg">Tin học {x.g}</h3>
                <p className="font-medium text-fg">{x.title}</p>
                <p className="mt-2 text-sm text-muted">{x.text}</p>
                <ul className="mt-3 space-y-1 text-sm">
                  {LESSONS.filter((l) => l.grade === x.g && l.textbookId === "kntt").sort((a, b) => a.order - b.order).slice(0, 3).map((l) => (
                    <li key={l.id} className="flex items-start gap-2 text-fg"><BookOpen className="mt-0.5 size-3.5 shrink-0 text-cyan-fg" aria-hidden /><span className="line-clamp-1">{l.title}</span></li>
                  ))}
                </ul>
                <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-cyan-fg">
                  Xem bài học <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            ))}
          </div>
          <p className="mt-4 text-xs text-muted">Danh sách bài học hiện mang tính minh họa, cần đối chiếu với sách giáo khoa.</p>
        </div>
      </section>

      {/* 04 · KHO MÔ PHỎNG */}
      <section className="relative overflow-hidden" aria-labelledby="sims-h">
        <div aria-hidden className="pointer-events-none absolute -right-40 top-10 h-[420px] w-[620px] rounded-full bg-[radial-gradient(closest-side,rgba(139,92,246,0.18),transparent)]" />
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <SectionHead id="sims-h" eyebrow="Kho mô phỏng" title="Kiến thức trở nên sống động qua từng mô phỏng" text="Không chỉ đọc và ghi nhớ, học sinh được trực tiếp thao tác, thử nghiệm và giải quyết những tình huống gắn với kiến thức Tin học." />
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {SIMS.map((s) => {
              const ready = getLabBySlug(s.slug)?.status === "available";
              return (
                <Link key={s.slug} href={`/labs/${s.slug}`} className="group flex flex-col overflow-hidden rounded-3xl border border-line bg-surface transition-all hover:-translate-y-1 hover:border-cyan/40 hover:shadow-[0_18px_50px_-24px_var(--cyan)]">
                  <div className={cn("relative aspect-[16/9] overflow-hidden", !ready && "grayscale-[35%]")}>
                    <s.art className="h-full w-full transition-transform duration-500 group-hover:scale-[1.03]" />
                    <span className="absolute left-3 top-3">
                      {ready ? (
                        <Badge tone="success" className="bg-surface/90 backdrop-blur"><Play className="size-3" aria-hidden /> Chơi được</Badge>
                      ) : (
                        <Badge tone="violet" className="bg-surface/90 backdrop-blur"><Hourglass className="size-3" aria-hidden /> Đang phát triển</Badge>
                      )}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col p-6">
                    <p className="text-xs font-semibold uppercase tracking-wide text-cyan-fg">{s.meta}</p>
                    <h3 className="mt-1 text-xl font-bold text-fg">{s.title}</h3>
                    <p className="mt-2 text-sm text-muted">{s.text}</p>
                    {s.note && <p className="mt-2 text-xs text-muted">{s.note}</p>}
                    <span className="mt-auto inline-flex items-center gap-1 pt-4 text-sm font-semibold text-cyan-fg">
                      {ready ? "Bắt đầu" : "Xem giới thiệu"} <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
          <div className="mt-10 text-center">
            <Button asChild size="lg" variant="outline">
              <Link href="/labs">
                Xem toàn bộ kho mô phỏng <ArrowRight />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* 05 · PHƯƠNG PHÁP */}
      <section className="border-y border-line bg-surface/40" aria-labelledby="steps-h">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <SectionHead id="steps-h" eyebrow="Phương pháp" title="Học Tin học theo cách mới" text="Mỗi mô phỏng là một bước trong quá trình học, không chỉ để giải trí." center />
          <ol className="relative mt-12 grid gap-8 lg:grid-cols-5 lg:gap-4">
            <span aria-hidden className="absolute left-6 top-6 h-[calc(100%-3rem)] w-0.5 bg-gradient-to-b from-cyan via-blue to-violet lg:left-[10%] lg:right-[10%] lg:top-6 lg:h-0.5 lg:w-auto lg:bg-gradient-to-r" />
            {STEPS.map((s, i) => (
              <li key={s.title} className="relative flex gap-4 lg:flex-col lg:items-center lg:text-center">
                <span className="relative z-10 grid size-12 shrink-0 place-items-center rounded-2xl border border-line bg-surface text-cyan-fg shadow-sm">
                  <s.icon className="size-5" aria-hidden />
                </span>
                <div>
                  <p className="font-mono text-xs text-muted">0{i + 1}</p>
                  <p className="font-semibold text-fg">{s.title}</p>
                  <p className="mt-1 text-sm text-muted">{s.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* 06 · HAI KHÔNG GIAN */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6" aria-labelledby="spaces-h">
        <SectionHead id="spaces-h" eyebrow="Hai không gian" title="Dành cho học sinh và giáo viên" center />
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {SPACES.map((s) => (
            <div key={s.role} className={cn("flex flex-col rounded-3xl border bg-gradient-to-br via-blue/5 to-transparent p-8", s.card)}>
              <h3 className="text-2xl font-bold text-fg">{s.title}</h3>
              <p className="mt-2 text-muted">{s.text}</p>
              <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                {s.items.map(([Icon, label]) => (
                  <li key={label} className="flex items-center gap-3 rounded-xl bg-surface/70 px-3 py-2.5 text-sm font-medium text-fg">
                    <Icon className={cn("size-4 shrink-0", s.icon)} aria-hidden /> {label}
                  </li>
                ))}
              </ul>
              <div className="mt-auto pt-7">
                <Button asChild variant={s.role === "teacher" ? "violet" : "primary"}>
                  <RoleLink role={s.role}>
                    {s.cta} <ArrowRight />
                  </RoleLink>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 07 · TRỢ LÝ AI */}
      <section className="border-y border-line bg-surface/40" aria-labelledby="ai-h">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <SectionHead id="ai-h" eyebrow="Trợ lý AI" title="AI đồng hành trong dạy và học" text="Trợ lý xuất hiện đúng lúc cần, trong chính hoạt động học sinh và giáo viên đang làm." />
          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            <figure className="min-w-0 rounded-3xl border border-line bg-surface p-6">
              <figcaption className="flex items-center gap-2 text-sm font-semibold text-fg">
                <GraduationCap className="size-4 text-cyan-fg" aria-hidden /> Với học sinh · đang điều khiển giao thông
              </figcaption>
              <pre className="mt-4 overflow-x-auto rounded-xl bg-[#0B1220] p-4 font-mono text-[13px] leading-6 text-slate-200">{`if den == "do":
    di_tiep()        `}<span className="text-rose-300"># ← xe vượt đèn đỏ</span>{`
else:
    dung_truoc_vach()`}</pre>
              <div className="mt-4 flex gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-cyan/15 text-cyan-fg"><Bot className="size-4" aria-hidden /></span>
                <p className="rounded-2xl rounded-tl-sm bg-surface-2 px-4 py-3 text-sm text-fg">
                  Em hãy kiểm tra điều kiện của đèn đỏ. Khi trạng thái này xảy ra, xe nên nhận lệnh gì?
                </p>
              </div>
              <p className="mt-3 text-xs text-muted">Trợ lý đặt câu hỏi gợi mở, không đưa sẵn lời giải.</p>
            </figure>
            <figure className="min-w-0 rounded-3xl border border-line bg-surface p-6">
              <figcaption className="flex items-center gap-2 text-sm font-semibold text-fg">
                <NotebookPen className="size-4 text-violet-fg" aria-hidden /> Với giáo viên · đang xây dựng KHBD
              </figcaption>
              <div className="mt-4 rounded-xl border border-line bg-surface-2 p-4 text-sm">
                <p className="text-xs text-muted">Mục tiêu bài học</p>
                <p className="font-medium text-fg">Sử dụng được câu lệnh rẽ nhánh if…else để giải quyết bài toán.</p>
              </div>
              <div className="mt-4 flex gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-violet/15 text-violet-fg"><Sparkles className="size-4" aria-hidden /></span>
                <div className="flex-1 rounded-2xl rounded-tl-sm bg-surface-2 px-4 py-3 text-sm text-fg">
                  <p>Đề xuất hoạt động thực hành:</p>
                  <ul className="mt-2 space-y-1.5">
                    <li className="flex gap-2"><FlaskConical className="mt-0.5 size-4 shrink-0 text-cyan-fg" aria-hidden /> Nông trại thông minh — viết điều kiện tưới, thử giá trị biên 39/40/41</li>
                    <li className="flex gap-2"><ClipboardCheck className="mt-0.5 size-4 shrink-0 text-cyan-fg" aria-hidden /> Tiêu chí đánh giá: điều kiện đúng, đã kiểm thử trường hợp biên</li>
                  </ul>
                  <p className="mt-2 text-xs text-muted">Chờ giáo viên duyệt</p>
                </div>
              </div>
            </figure>
          </div>
          <p className="mx-auto mt-10 flex max-w-3xl items-start justify-center gap-3 text-center text-lg font-semibold text-fg">
            <Lightbulb className="mt-1 size-5 shrink-0 text-warning-fg" aria-hidden />
            AI hỗ trợ suy nghĩ và sáng tạo – không thay thế quá trình học tập của học sinh hay quyết định chuyên môn của giáo viên.
          </p>
          <p className="mt-2 text-center text-xs text-muted">Ở bản dùng thử, trợ lý trả lời theo mẫu gợi ý soạn sẵn, chưa dùng mô hình AI thật.</p>
        </div>
      </section>

      {/* 08 · CTA */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6" aria-labelledby="cta-h">
        <div className="relative overflow-hidden rounded-[28px] border border-cyan/30 bg-gradient-to-br from-cyan/20 via-blue/15 to-violet/20 px-6 py-14 text-center sm:px-12">
          <div aria-hidden className="blob-float pointer-events-none absolute -left-20 -top-20 size-64 rounded-full bg-cyan/20 blur-3xl" />
          <h2 id="cta-h" className="relative text-3xl font-extrabold tracking-tight text-fg sm:text-4xl">Sẵn sàng khám phá Tin học theo cách mới?</h2>
          <p className="relative mx-auto mt-3 max-w-xl text-muted sm:text-lg">Bắt đầu với một bài học, trải nghiệm mô phỏng và tự mình giải quyết những thử thách công nghệ.</p>
          <div className="relative mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg">
              <Link href="/labs">
                Khám phá kho mô phỏng <ArrowRight />
              </Link>
            </Button>
            <AccountCta />
          </div>
        </div>
      </section>
    </>
  );
}
