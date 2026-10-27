"use client";
import { useMemo } from "react";
import { Bot, ShieldCheck } from "lucide-react";
import { CAPABILITY_LABEL, type TutorCapability } from "@/lib/ai/tutor-core";
import { getObjective } from "@/lib/data/curriculum";
import { summarizeTutor } from "@/lib/analytics/tutor-insights";
import { classStudents, teacherClasses } from "@/lib/store/scoped";
import { useSessionData } from "@/lib/store/use-role";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/feedback";

const TOPIC_LABEL: Record<string, string> = { if: "Câu lệnh rẽ nhánh", logic: "Biểu thức logic", loop: "Vòng lặp", test: "Kiểm thử, giá trị biên", binary: "Hệ nhị phân", general: "Khác" };

/** Những điều học sinh hay hỏi AI Gia sư — tổng hợp, không đọc từng cuộc trò chuyện. */
export function TutorInsightsCard({ classId }: { classId?: string }) {
  const { d, user } = useSessionData();
  const s = useMemo(() => {
    const classes = teacherClasses(d, user.id).filter((c) => !classId || c.id === classId);
    const ids = [...new Set(classes.flatMap((c) => classStudents(d, c.id).map((u) => u.id)))];
    return summarizeTutor(d.tutorEvents, ids);
  }, [d, user.id, classId]);
  const maxCap = Math.max(1, ...Object.values(s.byCapability));
  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle as="h2" className="flex items-center gap-2"><Bot className="size-4 text-violet-fg" aria-hidden /> AI Gia sư: học sinh hay hỏi gì</CardTitle>
        <CardDescription>{s.total ? `${s.total} lượt hỏi từ ${s.students} học sinh.` : ""} Chỉ có số liệu tổng hợp để hỗ trợ đúng nội dung; thầy cô không đọc nội dung trò chuyện.</CardDescription>
      </CardHeader>
      <CardContent>
        {s.total === 0 ? <EmptyState icon={Bot} title="Chưa có lượt hỏi nào" className="py-6" /> : (
          <div className="grid gap-6 lg:grid-cols-3">
            <div>
              <h3 className="mb-2 text-sm font-semibold text-fg">Em cần hỗ trợ kiểu gì</h3>
              <ul className="space-y-2 text-sm">
                {(Object.keys(s.byCapability) as TutorCapability[]).map((k) => (
                  <li key={k}>
                    <div className="flex justify-between"><span className="text-fg">{CAPABILITY_LABEL[k]}</span><span className="tabular-nums text-muted">{s.byCapability[k]}</span></div>
                    <div className="mt-1 h-1.5 rounded-full bg-surface-2"><div className="h-full rounded-full bg-violet" style={{ width: `${(s.byCapability[k] / maxCap) * 100}%` }} /></div>
                  </li>
                ))}
              </ul>
              <h3 className="mb-2 mt-4 text-sm font-semibold text-fg">Chủ đề hay hỏi</h3>
              <ul className="space-y-1 text-sm">{s.topics.map((t) => <li key={t.topic} className="flex justify-between"><span className="text-fg">{TOPIC_LABEL[t.topic] ?? t.topic}</span><span className="tabular-nums text-muted">{t.count}</span></li>)}</ul>
            </div>
            <div>
              <h3 className="mb-2 text-sm font-semibold text-fg">Lỗi phổ biến</h3>
              {s.errors.length === 0 ? <p className="text-sm text-muted">Chưa có lỗi nào nhiều em cùng gặp.</p> : (
                <ul className="space-y-2 text-sm">{s.errors.map((e) => <li key={e.type} className="rounded-lg bg-surface-2 px-3 py-2"><p className="font-medium text-fg">{e.type}</p><p className="text-xs text-muted">{e.students} học sinh · {e.count} lượt hỏi</p></li>)}</ul>
              )}
              {s.hiddenErrors > 0 && <p className="mt-2 text-xs text-muted">{s.hiddenErrors} loại lỗi chỉ một em gặp được ẩn để bảo vệ quyền riêng tư.</p>}
            </div>
            <div>
              <h3 className="mb-2 text-sm font-semibold text-fg">Kiến thức cần củng cố</h3>
              <ul className="space-y-2 text-sm">
                {s.objectives.map((o) => (
                  <li key={o.objectiveId} className="rounded-lg border border-line px-3 py-2">
                    <p className="font-mono text-xs text-cyan-fg">{o.objectiveId}</p>
                    <p className="text-fg">{getObjective(o.objectiveId)?.description}</p>
                    <p className="text-xs text-muted">{o.students} học sinh cần hướng dẫn hoặc tìm lỗi</p>
                  </li>
                ))}
              </ul>
              <p className="mt-3 flex items-start gap-1.5 text-xs text-muted"><ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-success-fg" aria-hidden /> Không hiển thị theo từng học sinh.</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
