import type { Metadata } from "next";
import { FlowChips } from "@/components/landing/hero-visuals";
import { PageHero } from "@/components/layout/page-hero";
import { CheckCircle2, FlaskConical, Hourglass, Info } from "lucide-react";

export const metadata: Metadata = { title: "Giới thiệu" };

const GROUPS = [
  {
    icon: CheckCircle2,
    tone: "text-success-fg",
    title: "Đã dùng được",
    items: [
      "Soạn kế hoạch bài dạy theo 4 hoạt động, lưu phiên bản, tự kiểm tra mục tiêu nào chưa có hoạt động hoặc chưa có cách đánh giá",
      "Thiết kế hoạt động 5 bước và giao nhiệm vụ cho lớp",
      "Phòng thí nghiệm Vườn tưới thông minh, Bit và cổng logic, Xưởng thiết kế web",
      "Máy tự kiểm tra bài làm, giáo viên chấm theo tiêu chí, thống kê theo lớp và theo mục tiêu",
    ],
  },
  {
    icon: FlaskConical,
    tone: "text-warning-fg",
    title: "Đang thử nghiệm",
    items: [
      "Tài khoản dùng thử; dữ liệu chỉ lưu trên trình duyệt của bạn",
      "Các trợ lý AI trả lời theo mẫu gợi ý soạn sẵn, chưa dùng mô hình AI thật",
      "Luyện lập trình: kiểm tra câu lệnh if/else, chưa chạy trọn chương trình Python",
    ],
  },
  {
    icon: Hourglass,
    tone: "text-violet-fg",
    title: "Sắp có",
    items: ["Đăng nhập bằng email, lưu dữ liệu trên máy chủ", "Chạy Python đầy đủ", "Bên trong máy tính 3D và các phòng thí nghiệm khác", "Xuất kế hoạch bài dạy ra Word"],
  },
];

export default function AboutPage() {
  return (
    <>
    <PageHero
      eyebrow="Giới thiệu"
      icon={Info}
      title="Về EduNova AI"
      accent="— học qua trải nghiệm"
      description="Nối kế hoạch bài dạy với mô phỏng, bài tập, đánh giá và báo cáo, để mỗi mục tiêu đều có hoạt động và mỗi điểm số đều có minh chứng."
      stats={[{ value: 6, label: "chức năng cho giáo viên" }, { value: 5, label: "chức năng cho học sinh" }, { value: 3, label: "mức hỗ trợ của AI Gia sư" }, { value: "10–12", label: "Tin học THPT" }]}
      visual={<FlowChips steps={["KHBD", "Khóa học", "Mô phỏng", "Bài nộp", "Đánh giá", "Báo cáo", "Cải tiến KHBD"]} />}
    />
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h2 className="text-xl font-bold text-fg">Tình trạng chức năng</h2>
      <div className="mt-6 space-y-6">
        {GROUPS.map((g) => (
          <section key={g.title} className="rounded-2xl border border-line bg-surface p-6">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-fg"><g.icon className={`size-5 ${g.tone}`} aria-hidden /> {g.title}</h2>
            <ul className="mt-3 list-disc space-y-1.5 pl-5 text-muted">{g.items.map((i) => <li key={i}>{i}</li>)}</ul>
          </section>
        ))}
      </div>
      <p className="mt-8 text-sm text-muted">Nội dung bài học và yêu cầu cần đạt hiện mang tính minh họa, cần giáo viên đối chiếu với sách giáo khoa và chương trình chính thức.</p>
    </div>
    </>
  );
}
