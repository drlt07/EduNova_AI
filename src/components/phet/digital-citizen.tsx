"use client";
/**
 * Tin 12 Bài 6 – Công dân số (kiểu PhET).
 * Màn Sóng lan truyền: một bài đăng lan qua mạng bạn bè 40 người theo từng vòng; chỉnh tỉ lệ chia sẻ lại,
 * bật "kiểm chứng trước khi chia sẻ" hay "báo cáo, gỡ bài" để thấy số người bị ảnh hưởng thay đổi.
 * Thử thách: ba câu chuyện chat rẽ nhánh, chọn cách ứng xử; ba thước đo đổi theo lựa chọn.
 */
import { useEffect, useState } from "react";
import { MessagesSquare, Pause, Play, Share2, SkipForward } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { applyEffect, METER_LABEL, START_METERS, STORIES, type Meters } from "@/lib/sim/digital-citizen";
import { ChallengeFrame, Panel, Readout, ResetAll, Segmented, SimLayout, SimShell, SimSlider, SimToggle, Stage, useChallenge } from "./kit";

const N = 40;
const NODES = Array.from({ length: N }, (_, i) => {
  const ring = i < 6 ? 1 : i < 18 ? 2 : 3;
  const idx = i < 6 ? i : i < 18 ? i - 6 : i - 18;
  const count = ring === 1 ? 6 : ring === 2 ? 12 : 22;
  const a = (idx / count) * Math.PI * 2 + ring * 0.4;
  const r = ring * 52;
  return { x: 200 + r * Math.cos(a), y: 170 + r * Math.sin(a) * 0.78, ring };
});
const dist = (a: number, b: number) => Math.hypot(NODES[a].x - NODES[b].x, NODES[a].y - NODES[b].y);
const LINKS: [number, number][] = [];
for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) if (dist(i, j) < 62) LINKS.push([i, j]);
const ME = { x: 200, y: 170 };
const rand = (i: number, step: number) => { let h = (i * 374761393 + step * 668265263) >>> 0; h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0; return (h % 1000) / 1000; };

type PostKind = "meme" | "fake" | "useful";
const POSTS: Record<PostKind, { label: string; harm: boolean; verifyBlocks: boolean; color: string }> = {
  meme: { label: "Ảnh chế giễu một bạn", harm: true, verifyBlocks: false, color: "#e11d48" },
  fake: { label: "Tin giả “nghỉ học vì bão”", harm: true, verifyBlocks: true, color: "#f97316" },
  useful: { label: "Lịch thi chính thức của trường", harm: false, verifyBlocks: false, color: "#16a34a" },
};

/** Tập người đã thấy bài sau `steps` vòng. */
function spread(p: number, steps: number, kind: PostKind, verify: boolean, removeAt: number | null) {
  const seen = new Set<number>([0, 1, 2, 3, 4, 5].filter((i) => rand(i, 0) < 0.85));
  let frontier = [...seen];
  for (let s = 1; s <= steps; s++) {
    if (removeAt !== null && s > removeAt) break;
    const next: number[] = [];
    for (const i of frontier) {
      const share = rand(i, s) < p * (verify && POSTS[kind].verifyBlocks ? 0.15 : 1) * (kind === "useful" ? 1.1 : 1);
      if (!share) continue;
      for (const [a, b] of LINKS) { const o = a === i ? b : b === i ? a : -1; if (o >= 0 && !seen.has(o)) { seen.add(o); next.push(o); } }
    }
    frontier = next;
  }
  return seen;
}

function Explore() {
  const [kind, setKind] = useState<PostKind>("meme");
  const [p, setP] = useState(45);
  const [verify, setVerify] = useState(false);
  const [report, setReport] = useState(false);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const maxStep = 8;
  const active = playing && step < maxStep;
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setStep((s) => Math.min(maxStep, s + 1)), 700);
    return () => clearInterval(id);
  }, [active]);
  const removeAt = report ? 2 : null;
  const seen = spread(p / 100, step, kind, verify, removeAt);
  const post = POSTS[kind];
  const change = (f: () => void) => { f(); setStep(0); setPlaying(false); };
  return (
    <SimLayout
      stage={
        <Stage dark className="p-3">
          <svg viewBox="0 0 400 340" className="w-full" role="img" aria-label={`Bài đăng đã tới ${seen.size} người`}>
            {LINKS.map(([a, b], i) => <line key={i} x1={NODES[a].x} y1={NODES[a].y} x2={NODES[b].x} y2={NODES[b].y} stroke={seen.has(a) && seen.has(b) ? post.color : "#334155"} strokeWidth={seen.has(a) && seen.has(b) ? 2 : 1} opacity={0.7} />)}
            {[0, 1, 2, 3, 4, 5].map((i) => <line key={`m${i}`} x1={ME.x} y1={ME.y} x2={NODES[i].x} y2={NODES[i].y} stroke={step > 0 || seen.has(i) ? post.color : "#334155"} strokeWidth={1.5} />)}
            {NODES.map((n, i) => <circle key={i} cx={n.x} cy={n.y} r={9} fill={seen.has(i) && step > 0 ? post.color : "#1e293b"} stroke="#64748b" strokeWidth={1.5} className="transition-colors duration-500" />)}
            <circle cx={ME.x} cy={ME.y} r={15} fill="#38bdf8" stroke="white" strokeWidth={2} /><text x={ME.x} y={ME.y + 4} textAnchor="middle" className="fill-slate-900 text-[10px] font-bold">Em</text>
            {report && step > 2 && <text x={200} y={330} textAnchor="middle" className="fill-emerald-300 text-[12px] font-semibold">Bài đã bị báo cáo và gỡ sau vòng 2</text>}
          </svg>
          <p className="text-center text-sm text-slate-300">Vòng {step}/{maxStep} · {post.label}</p>
        </Stage>
      }
      controls={
        <>
          <Panel title="Đo">
            <div className="grid grid-cols-2 gap-2">
              <Readout label="Đã thấy bài" value={`${step ? seen.size : 0}/${N}`} tone={post.harm ? "rose" : "green"} />
              <Readout label={post.harm ? "Mức tổn hại" : "Người được lợi"} value={step ? (post.harm ? `${Math.round((seen.size / N) * 100)}%` : seen.size) : 0} tone={post.harm ? "amber" : "green"} />
            </div>
          </Panel>
          <Panel title="Bài đăng">
            <Segmented label="Loại bài" value={kind} options={(Object.keys(POSTS) as PostKind[]).map((k) => ({ value: k, label: POSTS[k].label.split(" ").slice(0, 2).join(" ") }))} onChange={(v) => change(() => setKind(v))} />
            <SimSlider label="Tỉ lệ người chia sẻ lại" value={p} min={0} max={80} step={5} unit="%" onChange={(v) => change(() => setP(v))} />
            <SimToggle label="Mọi người kiểm chứng trước khi chia sẻ" checked={verify} onChange={(v) => change(() => setVerify(v))} />
            <SimToggle label="Có người báo cáo, nền tảng gỡ bài" checked={report} onChange={(v) => change(() => setReport(v))} />
          </Panel>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={() => { if (step >= maxStep) setStep(0); setPlaying(!active); }}>{active ? <><Pause /> Dừng</> : <><Play /> Đăng</>}</Button>
            <Button size="sm" variant="secondary" aria-label="Một vòng" onClick={() => setStep((s) => Math.min(maxStep, s + 1))}><SkipForward /></Button>
            <ResetAll onClick={() => { setKind("meme"); setP(45); setVerify(false); setReport(false); setStep(0); setPlaying(false); }} />
          </div>
        </>
      }
    />
  );
}

const STEPS = STORIES.flatMap((s) => s.steps.map((st, i) => ({ story: s, step: st, first: i === 0 })));

function Meter({ label, v }: { label: string; v: number }) {
  return <div><p className="flex justify-between text-xs"><span className="text-muted">{label}</span><b className="text-fg">{v}</b></p><div className="h-2 rounded-full bg-surface-2"><div className={cn("h-full rounded-full transition-all", v >= 60 ? "bg-emerald-500" : v >= 35 ? "bg-amber-500" : "bg-rose-500")} style={{ width: `${v}%` }} /></div></div>;
}

function Game() {
  const c = useChallenge(STEPS.length);
  const cur = STEPS[Math.min(c.idx, STEPS.length - 1)];
  const [pick, setPick] = useState<number | null>(null);
  const [meters, setMeters] = useState<Meters>(START_METERS);
  const key = `${c.run}-${c.idx}`;
  const [seen, setSeen] = useState(key);
  if (seen !== key) { setSeen(key); setPick(null); if (c.idx === 0) setMeters(START_METERS); }
  const ch = pick !== null ? cur.step.choices[pick] : undefined;
  const check = () => {
    if (!ch) return c.check(false, "Chọn một cách ứng xử.");
    setMeters((m) => applyEffect(m, ch.effect));
    return c.check(ch.verdict === "good", ch.why);
  };
  return (
    <ChallengeFrame c={c} prompt={cur.step.prompt} onCheck={check} summary={["Không tham gia, không lan truyền nội dung làm tổn thương người khác; giúp người bị hại.", "Dùng AI để học, không để nộp thay; kiểm chứng thông tin AI đưa ra và nói rõ đã dùng AI.", "Kiểm chứng tin trước khi chia sẻ; không dùng hình ảnh người khác khi chưa được đồng ý."]}>
      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
        <Stage className="space-y-2 p-3">
          <p className="text-xs font-bold uppercase tracking-wide text-muted">{cur.story.title} · {cur.story.room}</p>
          {cur.first && cur.story.opening.map((m, i) => <p key={i} className={cn("max-w-[85%] rounded-2xl px-3 py-2 text-sm", m.me ? "ml-auto bg-brand text-brand-ink" : "bg-white text-slate-800 shadow-sm dark:bg-slate-900 dark:text-slate-100")}><b className="block text-[11px] opacity-70">{m.who}</b>{m.text}</p>)}
          {ch && c.feedback && ch.replies.map((m, i) => <p key={`r${i}`} className="max-w-[85%] rounded-2xl bg-amber-100 px-3 py-2 text-sm text-slate-800 dark:bg-amber-500/15 dark:text-amber-100"><b className="block text-[11px] opacity-70">{m.who}</b>{m.text}</p>)}
          <div className="space-y-2 pt-2">{cur.step.choices.map((o, i) => <button key={o.text} type="button" aria-pressed={pick === i} disabled={!!c.feedback?.ok} onClick={() => setPick(i)} className={cn("block w-full rounded-xl border-2 px-3 py-2 text-left text-sm", pick === i ? "border-brand bg-brand/10" : "border-line bg-surface hover:border-brand/40")}>{o.text}</button>)}</div>
        </Stage>
        <Panel title="Thước đo">{(Object.keys(METER_LABEL) as (keyof Meters)[]).map((k) => <Meter key={k} label={METER_LABEL[k]} v={meters[k]} />)}</Panel>
      </div>
    </ChallengeFrame>
  );
}

export function DigitalCitizenLab() {
  return <SimShell title="Công dân số" screens={[{ id: "lan-truyen", label: "Sóng lan truyền", icon: Share2, render: () => <Explore /> }, { id: "thu-thach", label: "Tình huống chat", icon: MessagesSquare, render: () => <Game /> }]} />;
}
