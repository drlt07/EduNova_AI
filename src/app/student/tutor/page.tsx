"use client";
import { useState } from "react";
import { BookOpen, Bug, Dumbbell, Footprints, PanelRight, ShieldCheck } from "lucide-react";
import type { Topic } from "@/lib/ai/tutor";
import { CAPABILITY_LABEL, LEVEL_LABEL } from "@/lib/ai/tutor-core";
import { useSessionData } from "@/lib/store/use-role";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label, Select } from "@/components/ui/form";
import { PageHeader } from "@/components/ui/misc";
import { TutorChat } from "@/components/tutor/tutor-chat";

const TOPICS: { id: Topic; label: string }[] = [
  { id: "if", label: "Tin học 10 – Câu lệnh rẽ nhánh if" },
  { id: "logic", label: "Tin học 10 – Biểu thức logic and/or/not" },
  { id: "loop", label: "Tin học 10 – Vòng lặp for/while" },
  { id: "test", label: "Tin học 10 – Kiểm thử, giá trị biên" },
  { id: "binary", label: "Tin học 10 – Hệ nhị phân, cổng logic" },
];

const CAPS = [
  { icon: BookOpen, id: "explain" as const, text: "Giải thích bài SGK theo trình độ của em, đưa ví dụ dễ hiểu." },
  { icon: Footprints, id: "guide" as const, text: "Đặt câu hỏi gợi mở, giúp em tự tìm cách giải." },
  { icon: Bug, id: "debug" as const, text: "Đọc mã nguồn, kết quả kiểm thử hoặc trạng thái mô phỏng để chỉ ra vấn đề." },
  { icon: Dumbbell, id: "practice" as const, text: "Đề xuất bài tương tự cho phần em chưa vững." },
];

/** Trang AI Gia sư riêng: hỏi kiến thức, ôn bài, luyện thêm theo chủ đề. Trong bài học, gia sư mở ngay bên phải. */
export default function TutorPage() {
  const { user } = useSessionData();
  const [topic, setTopic] = useState<Topic>("if");
  const label = TOPICS.find((t) => t.id === topic)!.label;
  return (
    <>
      <PageHeader title="AI Gia sư" description="Hướng dẫn học tập cá nhân: giải thích kiến thức, gợi mở từng bước, chỉ ra lỗi và gợi ý luyện tập — giúp em tự suy nghĩ và tự sửa, không làm bài hộ." />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="flex h-[680px] flex-col overflow-hidden p-4">
          <TutorChat key={topic} activity={{ title: label, topic, level: "free", kind: "free" }} userId={user.id} />
        </Card>
        <aside className="space-y-4">
          <Card>
            <CardHeader><CardTitle as="h2">Chủ đề ôn tập</CardTitle></CardHeader>
            <CardContent>
              <Label htmlFor="topic">Em muốn hỏi về</Label>
              <Select id="topic" value={topic} onChange={(e) => setTopic(e.target.value as Topic)}>
                {TOPICS.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
              </Select>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle as="h2">Cô giúp được gì</CardTitle></CardHeader>
            <CardContent>
              <ul className="space-y-2.5 text-sm">
                {CAPS.map((c) => <li key={c.id} className="flex gap-2"><c.icon className="mt-0.5 size-4 shrink-0 text-violet-fg" aria-hidden /><span><b className="text-fg">{CAPABILITY_LABEL[c.id]}.</b> <span className="text-muted">{c.text}</span></span></li>)}
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle as="h2" className="flex items-center gap-2"><PanelRight className="size-4 text-cyan-fg" aria-hidden /> Gia sư ngay trong bài</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm text-muted">
              <p>Khi em lập trình, làm mô phỏng hay luyện tập, bấm <b className="text-fg">AI Gia sư</b> ở góc phải: cô mở bên cạnh bài, đọc đúng bài làm hiện tại của em (mã nguồn, kết quả kiểm thử, trạng thái mô phỏng) rồi mới hướng dẫn.</p>
              <p>Mức hỗ trợ do thầy cô đặt cho từng hoạt động: <b className="text-fg">{LEVEL_LABEL.free}</b> (giải thích chi tiết, có ví dụ), <b className="text-fg">{LEVEL_LABEL.guided}</b> (câu hỏi gợi mở, gợi ý tăng dần), <b className="text-fg">{LEVEL_LABEL.exam}</b> (gia sư tắt).</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle as="h2" className="flex items-center gap-2"><ShieldCheck className="size-4 text-success-fg" aria-hidden /> Quyền riêng tư</CardTitle></CardHeader>
            <CardContent className="text-sm text-muted">Thầy cô không đọc nội dung trò chuyện. Hệ thống chỉ tổng hợp chủ đề em hay hỏi, lỗi thường gặp và kiến thức cần củng cố để thầy cô hỗ trợ đúng chỗ.</CardContent>
          </Card>
        </aside>
      </div>
    </>
  );
}
