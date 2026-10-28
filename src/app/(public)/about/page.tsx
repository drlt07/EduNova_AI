import type { Metadata } from "next";
import { LabCollage } from "@/components/landing/hero-visuals";
import { PageHero } from "@/components/layout/page-hero";
import Link from "next/link";
import { ArrowRight, Info } from "lucide-react";
import { LAB_TEMPLATES } from "@/lib/data/labs";
import { ALGO_IDS } from "@/lib/data/hsg";
import { CODING_EXERCISES } from "@/lib/data/coding-exercises";
import { sgkCount } from "@/lib/data/sgk-kntt";

export const metadata: Metadata = { title: "Giới thiệu" };

const sgkLessons = sgkCount(10).lessons + sgkCount(11).lessons + sgkCount(12).lessons;
const labs = LAB_TEMPLATES.filter((l) => l.status !== "planned").length;

const USES: { who: string; rows: [string, string, string][] }[] = [
  {
    who: "Thầy cô",
    rows: [
      ["Mở đúng bài trong SGK", `Mục lục Kết nối tri thức 10–12 (${sgkLessons} bài). Mỗi bài gắn sẵn mô phỏng, thêm bộ câu hỏi và giao cho lớp.`, "/teacher/courses"],
      ["Soạn KHBD", "Bốn hoạt động, gắn mô phỏng vào từng hoạt động, lưu phiên bản, tải về Word hoặc PDF.", "/teacher/lesson-planner"],
      ["Giao bài, chấm bài", "Máy chấm phần trắc nghiệm và code; phần tự luận chấm theo tiêu chí.", "/teacher/assignments"],
      ["Biết lớp hổng chỗ nào", "Kết quả theo từng yêu cầu cần đạt, không chỉ điểm trung bình.", "/teacher/analytics"],
    ],
  },
  {
    who: "Học sinh",
    rows: [
      ["Chơi mô phỏng", `${labs} tình huống có nhiệm vụ: lắp máy tính 3D, đưa gói tin qua router, truy vấn SQL tìm thủ phạm…`, "/labs"],
      ["Ôn thi HSG", `${ALGO_IDS.length} thuật toán chạy từng bước theo code Python, có chế độ đoán bước tiếp theo.`, "/thuat-toan"],
      ["Luyện code", `${CODING_EXERCISES.length} bài Python chấm bằng test, có gợi ý và chạy từng dòng để xem biến thay đổi.`, "/student/practice"],
      ["Hỏi AI Gia sư", "Gia sư thấy em đang làm đến đâu, gợi ý từng bước chứ không đưa ngay đáp án.", "/student/tutor"],
    ],
  },
];

const LOG: [string, string[]][] = [
  ["28/10/2026", ["Thêm chuyên đề bồi dưỡng HSG với 12 thuật toán.", "Mỗi bài SGK có chỗ gắn mô phỏng, soạn câu hỏi giao lớp và xem bài code liên quan.", "Trang luyện code làm lại theo kiểu chấm bài trực tuyến."]],
  ["27/10/2026", ["Đăng nhập bằng email trường; tài khoản giáo viên nhận theo tên miền email.", "Thêm 9 mô phỏng: máy tính 3D, gói tin, hệ điều hành, thành phố dữ liệu, SQL, gỡ lỗi, an toàn số, AI, công dân số."]],
];

const LIMITS = [
  "Bản dùng thử lưu mọi thứ trên trình duyệt đang mở, xoá dữ liệu trình duyệt là mất. Bản cho trường đã đăng nhập bằng tài khoản thật, nhưng bài làm và bộ câu hỏi chưa chuyển hết lên máy chủ.",
  "Python chạy bằng trình thông dịch rút gọn: đủ biến, rẽ nhánh, vòng lặp, danh sách, xâu, hàm như trong Tin 10–11; chưa có import, thư viện hay đọc ghi tệp.",
  "AI Gia sư chỉ dùng mô hình AI thật khi nhà trường cài khoá API; bản dùng thử trả lời theo mẫu soạn sẵn.",
  "Nội dung bài và yêu cầu cần đạt cần thầy cô đối chiếu lại với SGK và chương trình chính thức.",
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
      stats={[{ value: sgkLessons, label: "bài SGK Tin 10–12" }, { value: labs, label: "mô phỏng có nhiệm vụ" }, { value: ALGO_IDS.length, label: "thuật toán HSG" }, { value: CODING_EXERCISES.length, label: "bài code chấm tự động" }]}
      visual={<LabCollage slugs={["inside-computer-3d", "network-journey", "os-explorer", "smart-coding-city"]} hrefFor={(s) => `/labs/${s}`} />}
    />
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <h2 className="text-xl font-bold text-fg">Dùng EduNova để làm gì</h2>
      <div className="mt-5 grid gap-8 md:grid-cols-2">
        {USES.map((u) => (
          <section key={u.who} aria-label={u.who}>
            <h3 className="border-b border-line pb-2 text-sm font-semibold uppercase tracking-wide text-muted">{u.who}</h3>
            <ul className="divide-y divide-line">
              {u.rows.map(([title, text, href]) => (
                <li key={title}>
                  <Link href={href} className="group flex items-start gap-3 py-3">
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold text-fg group-hover:text-cyan-fg">{title}</span>
                      <span className="block text-sm text-muted">{text}</span>
                    </span>
                    <ArrowRight className="mt-1 size-4 shrink-0 text-muted group-hover:text-cyan-fg" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <div className="mt-12 grid gap-8 md:grid-cols-2">
        <section aria-labelledby="log-h">
          <h2 id="log-h" className="text-xl font-bold text-fg">Mới cập nhật</h2>
          <ol className="mt-4 space-y-5">
            {LOG.map(([date, items]) => (
              <li key={date} className="border-l-2 border-cyan/50 pl-4">
                <p className="text-sm font-semibold tabular-nums text-fg">{date}</p>
                <ul className="mt-1 space-y-1 text-sm text-muted">{items.map((x) => <li key={x}>{x}</li>)}</ul>
              </li>
            ))}
          </ol>
        </section>
        <section aria-labelledby="limit-h">
          <h2 id="limit-h" className="text-xl font-bold text-fg">Chưa làm được</h2>
          <ul className="mt-4 space-y-3 text-sm text-muted">{LIMITS.map((x) => <li key={x}>{x}</li>)}</ul>
        </section>
      </div>
    </div>
    </>
  );
}
