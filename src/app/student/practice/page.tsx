"use client";
import Link from "next/link";
import { ArrowRight, ClipboardCheck, Code2, Database, Gauge, Globe, Hourglass, ListChecks, Network, Shuffle, Timer } from "lucide-react";
import { CODING_EXERCISES } from "@/lib/data/coding-exercises";
import { PRACTICE_SETS, KIND_LABEL, getQuestion } from "@/lib/data/practice";
import { useSessionData } from "@/lib/store/use-role";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/misc";
import { Stagger, StaggerItem } from "@/components/motion";

const MODES = [
  { id: "practice", label: "Luyện tập", icon: ClipboardCheck, desc: "Làm từng câu, xem giải thích ngay. Được hỏi gia sư." },
  { id: "adaptive", label: "Thích ứng", icon: Shuffle, desc: "Câu tiếp theo được chọn theo phần em còn yếu (theo luật)." },
  { id: "exam", label: "Kiểm tra", icon: Timer, desc: "Có giới hạn thời gian, khóa gia sư, chấm khi nộp." },
] as const;

/** 5 dạng luyện tập; dạng chưa làm xong ghi rõ "Đang phát triển", không cho vào. */
const TYPES = [
  { id: "code", label: "Lập trình Python", icon: Code2, desc: "Viết, chạy, kiểm thử chương trình; bảng biến và chạy từng bước.", href: "/student/code" },
  { id: "quiz", label: "Trắc nghiệm", icon: ListChecks, desc: "Bộ câu hỏi theo bài: trắc nghiệm, đúng/sai, dự đoán đầu ra, tìm lỗi.", href: "#trac-nghiem" },
  { id: "html", label: "HTML/CSS", icon: Globe, desc: "Dựng trang web và xem kết quả ngay.", href: "/student/games/web-builder" },
  { id: "sql", label: "SQL", icon: Database, desc: "Truy vấn cơ sở dữ liệu thư viện, kiểm tra kết quả truy vấn.", href: null },
  { id: "net", label: "Thực hành mạng ảo", icon: Network, desc: "Nối thiết bị, cấu hình địa chỉ, tìm lỗi kết nối.", href: null },
] as const;

export default function PracticePage() {
  const { d, user } = useSessionData();
  const codeDone = d.codeWorks.filter((w) => w.studentId === user.id && w.lastRun && w.lastRun.passed === w.lastRun.total && w.lastRun.total > 0).length;
  const stat: Partial<Record<(typeof TYPES)[number]["id"], string>> = {
    code: `${codeDone}/${CODING_EXERCISES.length} bài đạt kiểm thử`,
    quiz: `${PRACTICE_SETS.length} bộ câu hỏi`,
  };
  return (
    <>
      <PageHeader title="Luyện tập" description="Tự làm để thành thạo: lập trình, trắc nghiệm, SQL, HTML/CSS và thực hành mạng ảo. Gặp khó, mở AI Gia sư ngay trong bài." />
      <ul className="mb-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {TYPES.map((t) => (
          <li key={t.id}>
            {t.href ? (
              <Link href={t.href} className="group flex h-full gap-3 rounded-2xl border border-line bg-surface p-4 transition-colors hover:border-cyan/40">
                <t.icon className="size-6 shrink-0 text-cyan-fg" aria-hidden />
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-fg">{t.label}</span>
                  <span className="block text-sm text-muted">{t.desc}</span>
                  {stat[t.id] && <span className="mt-1 block text-xs text-muted">{stat[t.id]}</span>}
                </span>
                <ArrowRight className="size-4 shrink-0 self-center text-cyan-fg transition-transform group-hover:translate-x-0.5" aria-hidden />
              </Link>
            ) : (
              <div className="flex h-full gap-3 rounded-2xl border border-dashed border-line bg-surface/60 p-4" aria-disabled="true">
                <t.icon className="size-6 shrink-0 text-muted" aria-hidden />
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2 font-semibold text-fg">{t.label} <Badge tone="violet"><Hourglass className="size-3" aria-hidden /> Đang phát triển</Badge></span>
                  <span className="block text-sm text-muted">{t.desc}</span>
                </span>
              </div>
            )}
          </li>
        ))}
      </ul>
      <h2 id="trac-nghiem" className="mb-3 scroll-mt-24 text-lg font-semibold text-fg">Trắc nghiệm theo bài</h2>
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        {MODES.map((m) => (
          <div key={m.id} className="flex gap-3 rounded-2xl border border-line bg-surface p-4">
            <m.icon className="size-5 shrink-0 text-cyan-fg" aria-hidden />
            <div><p className="font-semibold text-fg">{m.label}</p><p className="text-sm text-muted">{m.desc}</p></div>
          </div>
        ))}
      </div>
      <Stagger as="ul" className="grid gap-4 lg:grid-cols-2">
        {PRACTICE_SETS.map((s) => {
          const attempts = d.practiceAttempts.filter((a) => a.studentId === user.id && a.setId === s.id).sort((a, b) => b.finishedAt.localeCompare(a.finishedAt));
          const last = attempts[0];
          const scored = last?.items.filter((i) => i.status !== "self") ?? [];
          const kinds = [...new Set(s.questionIds.map((q) => getQuestion(q)?.kind).filter(Boolean))];
          return (
            <StaggerItem as="li" key={s.id} className="flex flex-col rounded-2xl border border-line bg-surface p-5 transition-shadow hover:shadow-lg">
              <div className="flex flex-wrap gap-1.5"><Badge tone="blue">Lớp {s.grade}</Badge><Badge>{s.questionIds.length} câu</Badge></div>
              <h3 className="mt-2 font-semibold text-fg">{s.title}</h3>
              <p className="text-sm text-muted">{s.description}</p>
              <p className="mt-2 text-xs text-muted">Dạng câu: {kinds.map((k) => KIND_LABEL[k!]).join(", ")}</p>
              {last && (
                <p className="mt-2 flex items-center gap-1.5 text-sm text-fg"><Gauge className="size-4 text-cyan-fg" aria-hidden /> Lần gần nhất ({formatDate(last.finishedAt)}): {scored.filter((i) => i.status === "correct").length}/{scored.length} câu đúng · {attempts.length} lần làm</p>
              )}
              <div className="mt-auto flex flex-wrap gap-2 pt-4">
                {MODES.map((m, i) => (
                  <Button key={m.id} asChild size="sm" variant={i === 0 ? "primary" : "secondary"}>
                    <Link href={`/student/practice/${s.id}?che-do=${m.id}`} data-testid={`practice-${s.id}-${m.id}`}>{m.label}</Link>
                  </Button>
                ))}
              </div>
            </StaggerItem>
          );
        })}
      </Stagger>
    </>
  );
}
