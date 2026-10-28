"use client";
import { useMemo } from "react";
import { Bot, ShieldCheck } from "lucide-react";
import type { TutorCapability } from "@/lib/ai/tutor-core";
import { getObjective } from "@/lib/data/curriculum";
import { summarizeTutor } from "@/lib/analytics/tutor-insights";
import { classStudents, teacherClasses } from "@/lib/store/scoped";
import { useSessionData } from "@/lib/store/use-role";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/feedback";

const ASK: Record<TutorCapability, string> = { explain: "giải thích lại kiến thức", guide: "hướng dẫn từng bước", debug: "tìm lỗi trong bài", practice: "gợi ý bài luyện thêm" };

/** "Viết được câu lệnh…" → "viết câu lệnh…" để đặt vào giữa câu. */
const plain = (desc: string) => desc.replace(/\.$/, "").replace(/^((?:\S+ ){0,2}?\S+) được /, "$1 ").replace(/^./, (c) => c.toLowerCase());

const TOPIC_LABEL: Record<string, string> = { if: "Câu lệnh rẽ nhánh", logic: "Biểu thức logic", loop: "Vòng lặp", test: "Kiểm thử, giá trị biên", binary: "Hệ nhị phân", general: "Khác" };

/** Những điều học sinh hay hỏi AI Gia sư — tổng hợp, không đọc từng cuộc trò chuyện. */
export function TutorInsightsCard({ classId }: { classId?: string }) {
  const { d, user } = useSessionData();
  const s = useMemo(() => {
    const classes = teacherClasses(d, user.id).filter((c) => !classId || c.id === classId);
    const ids = [...new Set(classes.flatMap((c) => classStudents(d, c.id).map((u) => u.id)))];
    return summarizeTutor(d.tutorEvents, ids);
  }, [d, user.id, classId]);
  const caps = (Object.keys(s.byCapability) as TutorCapability[]).filter((k) => s.byCapability[k] > 0).sort((x, y) => s.byCapability[y] - s.byCapability[x]);
  const topTopic = s.topics[0];
  const lines: { key: string; node: React.ReactNode }[] = [];
  if (caps.length) lines.push({ key: "cap", node: <>Các em nhờ <b>{ASK[caps[0]]}</b> nhiều nhất ({s.byCapability[caps[0]]} lần){caps[1] ? <>, sau đó là {ASK[caps[1]]} ({s.byCapability[caps[1]]} lần)</> : null}{topTopic ? <>, chủ yếu ở phần <b>{(TOPIC_LABEL[topTopic.topic] ?? topTopic.topic).toLowerCase()}</b></> : null}.</> });
  if (s.errors.length) lines.push({ key: "err", node: <>Lỗi nhiều em cùng gặp: {s.errors.map((e, i) => <span key={e.type}>{i ? ", " : ""}<b>{e.type.toLowerCase()}</b> ({e.students} em)</span>)}.</> });
  for (const o of s.objectives.slice(0, 2)) {
    const desc = getObjective(o.objectiveId)?.description;
    if (desc) lines.push({ key: o.objectiveId, node: <>{o.students} em phải nhờ gia sư chỉ từng bước khi <b>{plain(desc)}</b>. Phần này nên giảng lại ngắn ở tiết sau.</> });
  }
  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle as="h2" className="flex items-center gap-2"><Bot className="size-4 text-violet-fg" aria-hidden /> Các em hỏi AI Gia sư những gì</CardTitle>
        <CardDescription>{s.total ? `Gần đây ${s.students} em hỏi gia sư ${s.total} lần.` : ""}</CardDescription>
      </CardHeader>
      <CardContent>
        {s.total === 0 ? <EmptyState icon={Bot} title="Chưa em nào hỏi gia sư" className="py-6" /> : (
          <>
            <ul className="space-y-2.5 text-sm text-fg">{lines.map((l) => <li key={l.key} className="flex gap-2"><span className="mt-2 size-1.5 shrink-0 rounded-full bg-violet" aria-hidden />{<span>{l.node}</span>}</li>)}</ul>
            <p className="mt-4 flex items-start gap-1.5 text-xs text-muted"><ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-success-fg" aria-hidden /> Thầy cô chỉ thấy số liệu chung, không đọc được các em hỏi gì và không biết em nào hỏi.{s.hiddenErrors > 0 ? ` Lỗi chỉ một em gặp không được liệt kê.` : ""}</p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
