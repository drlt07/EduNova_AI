"use client";
import Link from "next/link";
import { ClipboardCheck, Gauge, Shuffle, Timer } from "lucide-react";
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

export default function PracticePage() {
  const { d, user } = useSessionData();
  return (
    <>
      <PageHeader title="Luyện tập & kiểm tra" description="Chọn bộ câu hỏi và cách làm. Câu dự đoán đầu ra và điền code được chấm bằng cách chạy chương trình thật." />
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
              <h2 className="mt-2 font-semibold text-fg">{s.title}</h2>
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
