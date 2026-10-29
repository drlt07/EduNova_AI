"use client";
import { useState } from "react";
import { MessageCircleQuestion, Send } from "lucide-react";
import { toast } from "sonner";
import type { BookEntry } from "@/lib/sgk/book";
import { studentClassIds, teacherClasses } from "@/lib/store/scoped";
import { useSessionData } from "@/lib/store/use-role";
import { cn, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/feedback";
import { Textarea } from "@/components/ui/form";
import { Avatar } from "@/components/ui/misc";

/**
 * Hỏi đáp trong một bài: học sinh hỏi trong lớp của mình, thầy cô (và bạn cùng lớp) trả lời.
 * Giáo viên thấy câu hỏi của học sinh các lớp mình dạy; học sinh thấy câu hỏi của lớp mình.
 */
export function LessonQA({ e }: { e: BookEntry }) {
  const { d, user } = useSessionData();
  const teacher = user.role === "teacher";
  const myClasses = teacher ? teacherClasses(d, user.id).filter((c) => c.grade === e.grade).map((c) => c.id) : studentClassIds(d, user.id).filter((id) => d.classes.find((c) => c.id === id)?.grade === e.grade);
  const [text, setText] = useState("");
  const [only, setOnly] = useState(false);
  const list = d.lessonQA
    .filter((q) => q.ref === e.ref && myClasses.includes(q.classId))
    .filter((q) => !only || !q.replies.some((r) => d.users.find((u) => u.id === r.authorId)?.role === "teacher"));
  const nameOf = (id: string) => d.users.find((u) => u.id === id);

  const ask = () => {
    if (text.trim().length < 5) return toast.error("Em viết câu hỏi rõ hơn một chút nhé.");
    if (!myClasses[0]) return toast.error("Em chưa ở lớp nào học bài này.");
    d.askQuestion({ ref: e.ref, classId: myClasses[0], authorId: user.id, text });
    setText("");
    toast.success("Đã gửi câu hỏi cho thầy cô");
  };

  return (
    <div className="space-y-4">
      {!teacher && (
        <div className="rounded-2xl border border-line bg-surface p-4">
          <label htmlFor="qa-ask" className="flex items-center gap-2 text-sm font-semibold text-fg"><MessageCircleQuestion className="size-4 text-blue-fg" aria-hidden /> Hỏi thầy cô về Bài {e.lesson.no}</label>
          <Textarea id="qa-ask" className="mt-2 min-h-[80px]" maxLength={800} placeholder="Ví dụ: Vì sao điều kiện do_am < 40 dùng dấu < mà không dùng <= ?" value={text} onChange={(x) => setText(x.target.value)} />
          <div className="mt-2 flex items-center justify-between gap-2">
            <span className="text-xs text-muted">Thầy cô và các bạn cùng lớp sẽ thấy câu hỏi này.</span>
            <Button size="sm" onClick={ask}><Send /> Gửi câu hỏi</Button>
          </div>
        </div>
      )}
      {teacher && (
        <label className="flex items-center gap-2 text-sm text-muted"><input type="checkbox" checked={only} onChange={(x) => setOnly(x.target.checked)} className="size-4 accent-[var(--brand)]" /> Chỉ câu chưa có thầy cô trả lời</label>
      )}
      {list.length === 0 ? (
        <EmptyState icon={MessageCircleQuestion} title="Chưa có câu hỏi" description={teacher ? "Câu hỏi của học sinh các lớp thầy cô dạy về bài này sẽ hiện ở đây." : "Có chỗ nào chưa hiểu, em hỏi ngay ở trên."} />
      ) : (
        <ul className="space-y-3">{list.map((q) => <QuestionItem key={q.id} id={q.id} nameOf={nameOf} />)}</ul>
      )}
    </div>
  );
}

function QuestionItem({ id, nameOf }: { id: string; nameOf: (id: string) => { name: string; hue: number; role: string } | undefined }) {
  const { d, user } = useSessionData();
  const q = d.lessonQA.find((x) => x.id === id)!;
  const [reply, setReply] = useState("");
  const author = nameOf(q.authorId);
  const cls = d.classes.find((c) => c.id === q.classId);
  const answered = q.replies.some((r) => nameOf(r.authorId)?.role === "teacher");
  const send = () => {
    if (reply.trim().length < 2) return;
    d.replyQuestion(q.id, user.id, reply);
    setReply("");
  };
  return (
    <li className="rounded-2xl border border-line bg-surface p-4">
      <div className="flex items-start gap-3">
        {author && <Avatar user={author} size={34} />}
        <div className="min-w-0 flex-1">
          <p className="text-sm"><b className="text-fg">{author?.name}</b> <span className="text-muted">· {cls?.name} · {formatDate(q.at, true)}</span>
            <span className={cn("ml-2 rounded-full px-2 py-0.5 text-[11px] font-semibold", answered ? "bg-success/15 text-success-fg" : "bg-warning/15 text-warning-fg")}>{answered ? "Đã trả lời" : "Chờ trả lời"}</span></p>
          <p className="mt-1 whitespace-pre-wrap text-fg">{q.text}</p>
          {q.replies.length > 0 && (
            <ul className="mt-3 space-y-2 border-l-2 border-line pl-3">
              {q.replies.map((r) => { const a = nameOf(r.authorId); return (
                <li key={r.id} className="text-sm"><b className={cn(a?.role === "teacher" ? "text-blue-fg" : "text-fg")}>{a?.name}{a?.role === "teacher" && " (thầy cô)"}</b> <span className="text-xs text-muted">{formatDate(r.at, true)}</span><p className="whitespace-pre-wrap text-fg">{r.text}</p></li>
              ); })}
            </ul>
          )}
          <div className="mt-3 flex gap-2">
            <label htmlFor={`rp-${q.id}`} className="sr-only">Trả lời</label>
            <input id={`rp-${q.id}`} value={reply} onChange={(x) => setReply(x.target.value)} onKeyDown={(x) => { if (x.key === "Enter") send(); }} maxLength={800} placeholder={user.role === "teacher" ? "Trả lời học sinh…" : "Trả lời bạn…"} className="h-9 min-w-0 flex-1 rounded-lg border border-line bg-surface px-3 text-sm text-fg outline-none focus:border-brand" />
            <Button size="sm" variant="secondary" onClick={send} disabled={reply.trim().length < 2}><Send /> Trả lời</Button>
          </div>
        </div>
      </div>
    </li>
  );
}
