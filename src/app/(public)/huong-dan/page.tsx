import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { StepTiles } from "@/components/landing/hero-visuals";
import { PageHero } from "@/components/layout/page-hero";
import Link from "next/link";
import { GraduationCap, LifeBuoy, NotebookPen } from "lucide-react";

export const metadata: Metadata = { title: "Hướng dẫn sử dụng" };

const GUIDES = [
  {
    icon: GraduationCap,
    title: "Học sinh",
    steps: [
      "Vào Đăng nhập, chọn tài khoản học sinh dùng thử (không cần mật khẩu).",
      "Ở Tổng quan, mở bài học đang học dở hoặc chọn bài mới trong mục Bài học.",
      "Vào Trò chơi mô phỏng để thực hành; mỗi lần chạy, kiểm thử được lưu lại.",
      "Gặp khó khăn, hỏi Gia sư AI — gia sư gợi ý từng bước, không đưa sẵn đáp án.",
      "Xem Tiến độ học tập và Hồ sơ để biết mình đã đạt những mục tiêu nào.",
    ],
  },
  {
    icon: NotebookPen,
    title: "Giáo viên",
    steps: [
      "Vào Đăng nhập, chọn tài khoản giáo viên dùng thử.",
      "Tạo Kế hoạch bài dạy, gắn mục tiêu với hoạt động và cách đánh giá.",
      "Dùng Thiết kế hoạt động để chọn mô phỏng, cấu hình và giao cho lớp.",
      "Mở Chấm bài để xem bài nộp kèm quá trình làm bài, chỉnh điểm theo tiêu chí.",
      "Xem Thống kê học tập để nhận gợi ý cải tiến bài dạy.",
    ],
  },
];

const FAQ = [
  { q: "Dữ liệu bài học có đúng với sách giáo khoa không?", a: "Nội dung hiện tại là minh họa theo khung GDPT 2018, cần giáo viên đối chiếu lại với sách và yêu cầu cần đạt chính thức." },
  { q: "Học sinh có viết Python thật không?", a: "Có, trong Phòng lập trình và Nông trại thông minh. Bản dùng thử chạy một tập con Python (biến, if/elif/else, for/while, hàm, input/print) ngay trên trình duyệt, chưa hỗ trợ import, class, dict." },
  { q: "Trợ lý AI hoạt động thế nào?", a: "Ở bản dùng thử, trợ lý trả lời theo các mẫu gợi ý soạn sẵn. Trợ lý không đưa đáp án và mọi gợi ý cho giáo viên đều cần giáo viên duyệt." },
  { q: "Dữ liệu của tôi được lưu ở đâu?", a: "Ở bản dùng thử, mọi thay đổi chỉ lưu trên trình duyệt của bạn. Xóa dữ liệu trang web sẽ mất các thay đổi." },
  { q: "Học sinh lớp khác có xem được bài của nhau không?", a: "Không. Học sinh chỉ thấy nhiệm vụ của lớp mình và bài làm của chính mình; giáo viên chỉ thấy các lớp mình phụ trách." },
];

export default function GuidePage() {
  return (
    <>
    <PageHero
      eyebrow="Hướng dẫn"
      icon={LifeBuoy}
      title="Bắt đầu với EduNova"
      accent="trong 3 bước"
      description="Đăng nhập bằng email và mật khẩu (hoặc tài khoản dùng thử theo vai trò), vào không gian của mình và làm theo luồng học hoặc luồng soạn bài bên dưới."
      actions={<Button asChild size="lg"><Link href="/login">Đăng nhập dùng thử</Link></Button>}
      visual={<StepTiles steps={[{ title: "Đăng nhập", text: "Chọn tài khoản Giáo viên hoặc Học sinh, không cần mật khẩu." }, { title: "Vào không gian của em", text: "Giáo viên vào Tổng quan, học sinh vào Khóa học của tôi." }, { title: "Học hoặc soạn bài", text: "Học sinh học bài, làm mô phỏng; giáo viên soạn KHBD, giao bài." }]} />}
    />
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="grid gap-5 md:grid-cols-2">
        {GUIDES.map((g) => (
          <section key={g.title} className="rounded-2xl border border-line bg-surface p-6" aria-labelledby={`g-${g.title}`}>
            <h2 id={`g-${g.title}`} className="flex items-center gap-2 text-lg font-semibold text-fg"><g.icon className="size-5 text-cyan-fg" aria-hidden /> {g.title}</h2>
            <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-fg">
              {g.steps.map((s) => <li key={s}>{s}</li>)}
            </ol>
          </section>
        ))}
      </div>

      <section className="mt-12" aria-labelledby="faq-h">
        <h2 id="faq-h" className="text-2xl font-bold tracking-tight text-fg">Câu hỏi thường gặp</h2>
        <div className="mt-5 space-y-3">
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

      <section id="lien-he" className="mt-12 scroll-mt-24 rounded-2xl border border-line bg-surface p-6" aria-labelledby="contact-h">
        <h2 id="contact-h" className="flex items-center gap-2 text-lg font-semibold text-fg"><LifeBuoy className="size-5 text-cyan-fg" aria-hidden /> Liên hệ</h2>
        <p className="mt-2 text-sm text-muted">
          Thông tin liên hệ chính thức sẽ được công bố khi có đơn vị vận hành. Trong bản dùng thử, học sinh có thể gửi báo lỗi, góp ý trong mục Cài đặt của không gian học sinh.
        </p>
        <Link href="/login?role=student" className="mt-3 inline-block text-sm font-medium text-cyan-fg hover:underline">Đăng nhập để gửi góp ý</Link>
      </section>
    </div>
    </>
  );
}
