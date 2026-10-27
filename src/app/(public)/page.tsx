import Link from "next/link";
import { ArrowRight, BarChart3, BookOpenCheck, ClipboardCheck, FlaskConical, GraduationCap, NotebookPen, ShieldCheck, Sparkles, Wand2, Workflow } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LabCard } from "@/components/labs/lab-card";
import { GardenScene } from "@/components/labs/smart-garden/garden-scene";
import { LAB_TEMPLATES } from "@/lib/data/labs";
import { LESSONS, OBJECTIVES } from "@/lib/data/curriculum";

const VALUES = [
  { icon: Workflow, title: "Liên thông từ KHBD tới minh chứng", text: "Mỗi hoạt động gắn với lớp, bộ sách, bài học và yêu cầu cần đạt, kèm cách đánh giá. Không còn mục tiêu bị bỏ sót." },
  { icon: FlaskConical, title: "Phòng thí nghiệm tương tác", text: "Học sinh thực hành an toàn trên mô phỏng. Mỗi lần thử được ghi lại để giáo viên thấy cả quá trình, không chỉ kết quả cuối." },
  { icon: ShieldCheck, title: "Trợ lý AI do giáo viên kiểm soát", text: "Trợ lý chỉ đưa gợi ý: soạn bài, chấm bài, phân tích. Giáo viên luôn là người quyết định." },
];

const WORKFLOW = [
  { icon: NotebookPen, title: "KHBD", text: "Soạn 4 pha, gắn mục tiêu & minh chứng" },
  { icon: Wand2, title: "Thiết kế hoạt động", text: "5 bước: mục tiêu → thí nghiệm → cấu hình → tiêu chí chấm → giao bài" },
  { icon: FlaskConical, title: "Thí nghiệm", text: "Học sinh thực hành, thử các trường hợp đặc biệt" },
  { icon: ClipboardCheck, title: "Nộp & chấm bài", text: "Máy kiểm tra tự động, giáo viên chấm theo tiêu chí" },
  { icon: BarChart3, title: "Thống kê", text: "Mức đạt theo mục tiêu, lỗi thường gặp" },
  { icon: Sparkles, title: "Cải tiến KHBD", text: "Gợi ý điều chỉnh bài dạy, giáo viên duyệt" },
];

const FAQ = [
  { q: "Dữ liệu bài học có đúng với sách giáo khoa không?", a: "Nội dung hiện tại là minh họa theo khung GDPT 2018, cần giáo viên đối chiếu lại với sách và yêu cầu cần đạt chính thức." },
  { q: "Học sinh có viết Python thật không?", a: "Học sinh viết điều kiện theo đúng cú pháp Python. Ở bản dùng thử, hệ thống kiểm tra điều kiện này để điều khiển mô phỏng; việc chạy trọn vẹn một chương trình Python sẽ có ở phiên bản sau." },
  { q: "Trợ lý AI hoạt động thế nào?", a: "Ở bản dùng thử, trợ lý trả lời theo các mẫu gợi ý soạn sẵn dựa trên bài làm của học sinh. Trợ lý không đưa đáp án và mọi gợi ý đều cần giáo viên duyệt." },
  { q: "Dữ liệu của tôi được lưu ở đâu?", a: "Ở bản dùng thử, mọi thay đổi chỉ lưu trên trình duyệt của bạn. Phiên bản chính thức sẽ lưu trên máy chủ và phân quyền theo lớp." },
  { q: "Học sinh lớp khác có xem được bài của nhau không?", a: "Không. Học sinh chỉ thấy nhiệm vụ của lớp mình và bài làm của chính mình; giáo viên chỉ thấy các lớp mình phụ trách." },
];

export default function HomePage() {
  const featured = ["smart-garden", "web-creator", "binary-logic", "inside-computer-3d", "database-city", "ai-discovery"].map((s) => LAB_TEMPLATES.find((l) => l.slug === s)!);
  const gradeInfo = ([10, 11, 12] as const).map((g) => ({
    g,
    lessons: new Set(LESSONS.filter((l) => l.grade === g).map((l) => l.title)).size,
    objectives: OBJECTIVES.filter((o) => o.grade === g).length,
    labs: LAB_TEMPLATES.filter((l) => l.grades.includes(g)).length,
  }));
  const gradeText: Record<number, string> = {
    10: "Hệ nhị phân, an toàn số, lập trình Python: biến, rẽ nhánh, lặp, hàm, kiểm thử.",
    11: "Bên trong máy tính, hệ điều hành, cơ sở dữ liệu quan hệ, SQL; định hướng ICT/CS.",
    12: "Trí tuệ nhân tạo, mạng máy tính, HTML/CSS, công dân số; định hướng ICT/CS.",
  };

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden bg-grid">
        <div aria-hidden className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(79,127,255,0.28),transparent)]" />
        <div className="relative mx-auto grid max-w-7xl gap-12 px-4 pb-20 pt-14 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:pt-20">
          <div>
            <Badge tone="cyan" className="mb-5">
              <GraduationCap className="size-3.5" /> Tin học THPT · GDPT 2018 · Lớp 10–11–12
            </Badge>
            <h1 className="text-4xl font-extrabold leading-[1.1] tracking-tight text-fg sm:text-5xl lg:text-[56px]">
              Từ kế hoạch bài dạy tới <span className="text-gradient">phòng thí nghiệm</span> và minh chứng học tập
            </h1>
            <p className="mt-5 max-w-xl text-lg text-muted">
              EduNova AI nối KHBD, hoạt động, mô phỏng tương tác, bài nộp, rubric và báo cáo thành một vòng khép kín — để mỗi mục tiêu đều có hoạt động và mỗi điểm số đều có minh chứng.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/login?role=teacher">
                  Trải nghiệm vai trò Giáo viên <ArrowRight />
                </Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href="/labs/smart-garden">Thử Vườn tưới thông minh</Link>
              </Button>
            </div>
          </div>
          <div className="relative">
            <div className="rounded-[22px] border border-line bg-surface/80 p-3 shadow-[0_30px_80px_-30px_rgba(34,211,238,0.35)] backdrop-blur">
              <div className="mb-3 flex items-center justify-between px-1">
                <div className="flex gap-1.5" aria-hidden>
                  <span className="size-2.5 rounded-full bg-danger/70" />
                  <span className="size-2.5 rounded-full bg-warning/70" />
                  <span className="size-2.5 rounded-full bg-success/70" />
                </div>
                <span className="text-xs text-muted">Vườn tưới thông minh · Tin 10 · câu lệnh if</span>
                <span />
              </div>
              <div className="overflow-hidden rounded-2xl bg-[#0B1220]">
                <GardenScene humidity={32} hasWater pump plant="healthy" threshold={40} />
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                <div className="rounded-xl bg-surface-2 p-2"><p className="text-muted">độ ẩm</p><p className="font-mono font-semibold text-cyan-fg">32%</p></div>
                <div className="rounded-xl bg-surface-2 p-2"><p className="text-muted">còn nước</p><p className="font-semibold text-cyan-fg">Có</p></div>
                <div className="rounded-xl bg-surface-2 p-2"><p className="text-muted">máy bơm</p><p className="font-semibold text-success-fg">BẬT</p></div>
              </div>
              <pre className="mt-2 overflow-x-auto rounded-xl bg-[#0B1220] p-3 font-mono text-xs text-slate-300">
                <span className="text-violet-300">if</span> humidity &lt; 40 <span className="text-violet-300">and</span> has_water:{"\n"}    pump_on()
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* VALUES */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6" aria-labelledby="values-h">
        <h2 id="values-h" className="text-center text-3xl font-bold tracking-tight text-fg">Ba giá trị cốt lõi</h2>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {VALUES.map((v) => (
            <div key={v.title} className="rounded-2xl border border-line bg-surface p-6">
              <span className="grid size-11 place-items-center rounded-xl bg-gradient-to-br from-cyan/20 to-violet/20 text-cyan-fg">
                <v.icon className="size-5" />
              </span>
              <h3 className="mt-4 text-lg font-semibold text-fg">{v.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{v.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* GRADES */}
      <section className="border-y border-line bg-surface/40" aria-labelledby="grades-h">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h2 id="grades-h" className="text-3xl font-bold tracking-tight text-fg">Tin học 10 · 11 · 12</h2>
              <p className="mt-2 text-muted">Nội dung chung và định hướng ICT/CS; 3 bộ sách Kết nối tri thức, Cánh Diều, Chân trời sáng tạo.</p>
            </div>
            <Badge tone="warning">Nội dung minh họa</Badge>
          </div>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {gradeInfo.map((x) => (
              <Link key={x.g} href={`/explore?grade=${x.g}`} className="group rounded-2xl border border-line bg-surface p-6 transition-colors hover:border-cyan/40">
                <p className="text-5xl font-extrabold text-gradient">{x.g}</p>
                <p className="mt-1 font-semibold text-fg">Tin học lớp {x.g}</p>
                <p className="mt-2 text-sm text-muted">{gradeText[x.g]}</p>
                <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
                  {[["bài", x.lessons], ["mục tiêu", x.objectives], ["thí nghiệm", x.labs]].map(([k, v]) => (
                    <div key={k as string} className="rounded-xl bg-surface-2 py-2">
                      <dd className="font-bold text-fg">{v}</dd>
                      <dt className="text-xs text-muted">{k}</dt>
                    </div>
                  ))}
                </dl>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-cyan-fg">
                  Khám phá <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* LABS */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6" aria-labelledby="labs-h">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h2 id="labs-h" className="text-3xl font-bold tracking-tight text-fg">Phòng thí nghiệm nổi bật</h2>
            <p className="mt-2 text-muted">Một số phòng thí nghiệm đã dùng được, số khác đang được xây dựng.</p>
          </div>
          <Button asChild variant="outline">
            <Link href="/labs">Xem tất cả {LAB_TEMPLATES.length} phòng thí nghiệm</Link>
          </Button>
        </div>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((lab) => (
            <LabCard key={lab.id} lab={lab} href={`/labs/${lab.slug}`} />
          ))}
        </div>
      </section>

      {/* WORKFLOW */}
      <section className="border-y border-line bg-surface/40" aria-labelledby="wf-h">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <h2 id="wf-h" className="text-3xl font-bold tracking-tight text-fg">Từ bài dạy đến thí nghiệm và cải tiến</h2>
          <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
            {WORKFLOW.map((w, i) => (
              <li key={w.title} className="relative rounded-2xl border border-line bg-surface p-5">
                <span className="font-mono text-xs text-muted">0{i + 1}</span>
                <w.icon className="mt-2 size-6 text-cyan-fg" aria-hidden />
                <p className="mt-3 font-semibold text-fg">{w.title}</p>
                <p className="mt-1 text-sm text-muted">{w.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto grid max-w-7xl gap-5 px-4 py-16 sm:px-6 md:grid-cols-2">
        <div className="rounded-3xl border border-cyan/30 bg-gradient-to-br from-cyan/15 via-blue/10 to-transparent p-8">
          <BookOpenCheck className="size-8 text-cyan-fg" aria-hidden />
          <h2 className="mt-4 text-2xl font-bold text-fg">Dành cho giáo viên</h2>
          <p className="mt-2 text-muted">Soạn KHBD, thiết kế hoạt động thí nghiệm, giao bài, chấm theo tiêu chí và nhận gợi ý cải tiến bài dạy.</p>
          <Button asChild className="mt-6">
            <Link href="/login?role=teacher">Vào không gian giáo viên</Link>
          </Button>
        </div>
        <div className="rounded-3xl border border-violet/30 bg-gradient-to-br from-violet/15 via-blue/10 to-transparent p-8">
          <FlaskConical className="size-8 text-violet-fg" aria-hidden />
          <h2 className="mt-4 text-2xl font-bold text-fg">Dành cho học sinh</h2>
          <p className="mt-2 text-muted">Làm nhiệm vụ trong phòng thí nghiệm, thử nghiệm an toàn, hỏi mentor gợi mở và theo dõi bản đồ năng lực của riêng mình.</p>
          <Button asChild variant="violet" className="mt-6">
            <Link href="/login?role=student">Vào không gian học sinh</Link>
          </Button>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-4 pb-20 sm:px-6" aria-labelledby="faq-h">
        <h2 id="faq-h" className="text-center text-3xl font-bold tracking-tight text-fg">Câu hỏi thường gặp</h2>
        <div className="mt-8 space-y-3">
          {FAQ.map((f) => (
            <details key={f.q} className="group rounded-2xl border border-line bg-surface p-5 open:border-cyan/30">
              <summary className="cursor-pointer list-none font-semibold text-fg marker:hidden">
                <span className="flex items-center justify-between gap-4">
                  {f.q}
                  <span className="text-cyan-fg transition-transform group-open:rotate-45" aria-hidden>+</span>
                </span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-muted">{f.a}</p>
            </details>
          ))}
        </div>
      </section>
    </>
  );
}
