"use client";
import { useState } from "react";
import { Bot, ShieldCheck } from "lucide-react";
import type { Topic } from "@/lib/ai/tutor";
import { useSessionData } from "@/lib/store/use-role";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label, Select } from "@/components/ui/form";
import { PageHeader } from "@/components/ui/misc";
import { TutorChat } from "@/components/tutor/tutor-chat";
import { studySuggestions } from "@/lib/store/student-insights";

const TOPICS: { id: Topic; label: string }[] = [
  { id: "if", label: "Câu lệnh rẽ nhánh if" },
  { id: "logic", label: "Biểu thức logic and/or/not" },
  { id: "loop", label: "Vòng lặp for/while" },
  { id: "test", label: "Kiểm thử, giá trị biên" },
  { id: "binary", label: "Hệ nhị phân, cổng logic" },
];

export default function TutorPage() {
  const { d, user } = useSessionData();
  const [topic, setTopic] = useState<Topic>("if");
  const label = TOPICS.find((t) => t.id === topic)?.label;
  const weak = studySuggestions(d, user.id)[0];
  return (
    <>
      <PageHeader title="Gia sư AI" description="Hỏi để hiểu bài: gia sư giải thích, gợi ý từng bước, hỏi lại để em tự suy luận — không làm bài hộ." />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <Card className="flex h-[640px] flex-col overflow-hidden p-4">
          <TutorChat key={topic} context={{ title: label, topic, weakObjective: weak?.text }} userId={user.id} />
        </Card>
        <aside className="space-y-4">
          <Card>
            <CardHeader><CardTitle as="h2">Chủ đề</CardTitle></CardHeader>
            <CardContent>
              <Label htmlFor="topic">Em muốn hỏi về</Label>
              <Select id="topic" value={topic} onChange={(e) => setTopic(e.target.value as Topic)}>
                {TOPICS.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
              </Select>
              <p className="mt-2 text-xs text-muted">Khi em bấm “Hỏi gia sư” trong bài học, phòng lập trình hay trò chơi, gia sư tự biết em đang ở đâu và lỗi gì.</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle as="h2" className="flex items-center gap-2"><ShieldCheck className="size-4 text-success-fg" /> Gia sư hoạt động thế nào</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm text-muted">
              <p className="flex gap-2"><Bot className="mt-0.5 size-4 shrink-0" aria-hidden /> Bản demo dùng câu trả lời soạn sẵn theo chủ đề và luật, chưa kết nối mô hình AI thật. Mọi câu trả lời đều được gắn nhãn.</p>
              <p>Gia sư không đưa lời giải hoàn chỉnh cho bài tập, và tự khóa khi em làm bài kiểm tra chính thức.</p>
              <p>Câu hỏi của em được lưu lại để giáo viên xem em cần hỗ trợ phần nào.</p>
            </CardContent>
          </Card>
        </aside>
      </div>
    </>
  );
}
