"use client";
import { useState } from "react";
import { Bot, Film, MessagesSquare } from "lucide-react";
import { METER_LABEL, START_METERS, STORIES, applyEffect, type Chat, type Choice, type Meters } from "@/lib/sim/digital-citizen";
import { useTutorActivity } from "@/components/tutor/tutor-provider";
import { MissionDone, MissionLayout, type Feedback, type MissionStage } from "@/components/sim/mission";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const ICONS = { group: MessagesSquare, "ai-essay": Bot, deepfake: Film } as const;
const STAGES: MissionStage[] = STORIES.map((s) => ({ id: s.id, label: s.title, icon: ICONS[s.id as keyof typeof ICONS] }));
const HUE: Record<string, string> = {};
const avatarColor = (who: string) => (HUE[who] ??= ["bg-rose-500", "bg-sky-500", "bg-amber-500", "bg-violet-500", "bg-emerald-500", "bg-slate-500"][[...who].reduce((a, c) => a + c.charCodeAt(0), 0) % 6]);

/**
 * Công dân số (Tin 12 – Bài 6): ba câu chuyện chat rẽ nhánh — bắt nạt trên mạng, dùng AI trung thực,
 * video giả mạo. Mỗi lựa chọn hiện hệ quả trong khung chat và đổi ba thước đo.
 */
export function DigitalCitizenLab() {
  const [storyIdx, setStoryIdx] = useState(0);
  const [stepIdx, setStepIdx] = useState(0);
  const [chats, setChats] = useState<Chat[]>(STORIES[0].opening);
  const [chosen, setChosen] = useState<Choice | null>(null);
  const [meters, setMeters] = useState<Meters>(START_METERS);
  const [mistakes, setMistakes] = useState(0);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const done = storyIdx >= STORIES.length;
  const story = STORIES[Math.min(storyIdx, STORIES.length - 1)];
  const step = story.steps[stepIdx];

  const touchTutor = useTutorActivity("simulation", () => ({
    kind: "simulation",
    sim: "mô phỏng Công dân số (tình huống ứng xử trên mạng)",
    summary: done ? "Đã hoàn thành." : `Câu chuyện: ${story.title}. Tình huống: ${step.prompt}`,
    problems: feedback && !feedback.ok ? [feedback.text] : [],
    facts: { story: story.id, mistakes, ...meters },
  }), { title: "Công dân số · Tin 12", topic: "general", level: "free" });

  const choose = (c: Choice) => {
    if (chosen) return;
    touchTutor();
    setChosen(c);
    setMeters((m) => applyEffect(m, c.effect));
    setChats((x) => [...x, { who: "Em", text: c.text, me: true }, ...c.replies]);
    if (c.verdict !== "good") setMistakes((n) => n + 1);
    setFeedback({ ok: c.verdict === "good", text: `${c.verdict === "good" ? "Lựa chọn tốt. " : c.verdict === "ok" ? "Chưa tốt nhất. " : "Lựa chọn gây hại. "}${c.why}` });
  };

  const next = () => {
    setChosen(null);
    setFeedback(null);
    if (stepIdx + 1 < story.steps.length) return setStepIdx(stepIdx + 1);
    const ni = storyIdx + 1;
    setStoryIdx(ni);
    setStepIdx(0);
    if (ni < STORIES.length) setChats(STORIES[ni].opening);
  };

  const restart = () => { setStoryIdx(0); setStepIdx(0); setChats(STORIES[0].opening); setChosen(null); setMeters(START_METERS); setMistakes(0); setFeedback(null); };

  const scene = (
    <div className="overflow-hidden rounded-2xl border border-line bg-white text-slate-900 shadow-sm">
      <div className="grid grid-cols-3 gap-2 border-b border-slate-200 bg-slate-50 p-3">
        {(Object.keys(METER_LABEL) as (keyof Meters)[]).map((k) => (
          <div key={k}>
            <p className="flex justify-between text-[11px] font-semibold"><span className="truncate">{METER_LABEL[k]}</span><span className="tabular-nums">{meters[k]}</span></p>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-200"><div className={cn("h-full transition-all duration-500", meters[k] >= 60 ? "bg-emerald-500" : meters[k] >= 35 ? "bg-amber-500" : "bg-red-500")} style={{ width: `${meters[k]}%` }} /></div>
          </div>
        ))}
      </div>
      <p className="flex items-center gap-2 border-b border-slate-200 px-4 py-2 text-sm font-bold">{done ? "Kết thúc" : story.room}</p>
      <ul className="flex h-[400px] flex-col gap-2 overflow-y-auto bg-[#eef2f7] p-4" aria-live="polite">
        {(done ? [] : chats).map((c, i) => (
          <li key={i} className={cn("flex max-w-[85%] gap-2", c.me ? "flex-row-reverse self-end" : "self-start", c.who === "Hệ thống" && "max-w-full self-center")}>
            {c.who === "Hệ thống" ? (
              <span className="rounded-full bg-slate-300/70 px-3 py-1 text-[11px] text-slate-700">{c.text}</span>
            ) : (
              <>
                <span className={cn("grid size-7 shrink-0 place-items-center rounded-full text-[11px] font-bold text-white", c.me ? "bg-blue-600" : avatarColor(c.who))}>{c.who.slice(0, 1)}</span>
                <span className={cn("rounded-2xl px-3 py-2 text-sm shadow-sm", c.me ? "rounded-tr-sm bg-blue-600 text-white" : "rounded-tl-sm bg-white")}>
                  {!c.me && <span className="block text-[11px] font-semibold text-slate-500">{c.who}</span>}
                  {c.text}
                </span>
              </>
            )}
          </li>
        ))}
        {done && <li className="m-auto text-center text-sm text-slate-600">Em đã đi qua cả ba tình huống. Xem kết quả ở bên phải.</li>}
      </ul>
    </div>
  );

  return (
    <MissionLayout scene={scene} stages={STAGES} current={done ? "done" : story.id} feedback={feedback} mistakes={mistakes}>
      {!done ? (
        <>
          <h3 className="font-semibold text-fg">{story.title} · bước {stepIdx + 1}/{story.steps.length}</h3>
          <p className="mt-1 text-sm text-fg">{step.prompt}</p>
          <div className="mt-3 space-y-1.5">
            {step.choices.map((c) => (
              <Button key={c.text} size="sm" variant={chosen === c ? "primary" : "secondary"} disabled={!!chosen} className={cn("h-auto w-full justify-start whitespace-normal py-2 text-left", chosen && c.verdict === "good" && chosen !== c && "ring-2 ring-success")} onClick={() => choose(c)}>{c.text}</Button>
            ))}
          </div>
          {chosen && <Button size="sm" className="mt-3" onClick={next}>{stepIdx + 1 < story.steps.length ? "Diễn biến tiếp →" : storyIdx + 1 < STORIES.length ? "Câu chuyện tiếp theo →" : "Xem kết quả"}</Button>}
        </>
      ) : (
        <MissionDone
          mistakes={mistakes}
          title={`An toàn ${meters.safety} · Uy tín ${meters.trust} · Tập thể ${meters.community}`}
          onRestart={restart}
          points={[
            <>Thấy bạn bị chế giễu: <b>hỗ trợ người bị hại, yêu cầu gỡ, báo người lớn</b> — không hùa theo, không trả đũa.</>,
            <>Dùng AI để <b>học</b>, tự viết bài, <b>kiểm chứng thông tin</b> AI đưa ra và nói rõ đã dùng AI.</>,
            <>Gặp tin/video gây sốc: <b>kiểm tra nguồn chính thống trước khi chia sẻ</b>; không tạo nội dung giả mạo người thật.</>,
          ]}
        />
      )}
    </MissionLayout>
  );
}
