"use client";
/** Thuật toán gợi ý video: đếm chủ đề em đã xem, chấm điểm video theo chủ đề trùng; độ đa dạng thấp sinh ra bong bóng lọc. */
import { useState } from "react";
import { Play, Sparkles, ThumbsUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { ChallengeFrame, Panel, Readout, ResetAll, SimLayout, SimShell, SimSlider, Stage, useChallenge } from "@/components/phet/kit";

type Topic = "game" | "bongda" | "nauan" | "khoahoc" | "amnhac";
const TOPIC: Record<Topic, { label: string; color: string; emoji: string }> = {
  game: { label: "Trò chơi", color: "#7c3aed", emoji: "🎮" }, bongda: { label: "Bóng đá", color: "#16a34a", emoji: "⚽" }, nauan: { label: "Nấu ăn", color: "#ea580c", emoji: "🍳" },
  khoahoc: { label: "Khoa học", color: "#2563eb", emoji: "🔭" }, amnhac: { label: "Âm nhạc", color: "#db2777", emoji: "🎵" },
};
interface Video { id: string; title: string; topics: Topic[]; views: number }
const VIDEOS: Video[] = [
  { id: "v1", title: "Top 10 pha bóng đẹp tuần", topics: ["bongda"], views: 90 }, { id: "v2", title: "Chơi game sinh tồn 24h", topics: ["game"], views: 95 },
  { id: "v3", title: "Nấu phở tại nhà", topics: ["nauan"], views: 60 }, { id: "v4", title: "Vì sao bầu trời màu xanh?", topics: ["khoahoc"], views: 55 },
  { id: "v5", title: "Hát cover nhạc phim", topics: ["amnhac"], views: 70 }, { id: "v6", title: "Game bóng đá mới ra mắt", topics: ["game", "bongda"], views: 80 },
  { id: "v7", title: "Khoa học trong nấu ăn", topics: ["khoahoc", "nauan"], views: 40 }, { id: "v8", title: "Nhạc nền game hay nhất", topics: ["game", "amnhac"], views: 65 },
  { id: "v9", title: "Robot tự chơi bóng đá", topics: ["khoahoc", "bongda"], views: 50 }, { id: "v10", title: "Mẹo leo rank nhanh", topics: ["game"], views: 85 },
];
/** Điểm = độ hợp sở thích × (1 − đa dạng) + độ phổ biến/khác lạ × đa dạng. */
export function rank(history: string[], diversity: number) {
  const count: Record<string, number> = {};
  for (const id of history) for (const t of VIDEOS.find((v) => v.id === id)!.topics) count[t] = (count[t] ?? 0) + 1;
  const total = Math.max(1, history.length);
  return VIDEOS.filter((v) => !history.includes(v.id)).map((v) => {
    const fit = v.topics.reduce((s, t) => s + (count[t] ?? 0), 0) / total;
    const fresh = v.topics.every((t) => !count[t]) ? 1 : 0;
    const s = fit * (1 - diversity) + (fresh * 0.6 + v.views / 250) * diversity + v.views / 1000;
    return { v, s: Math.round(s * 100) / 100, fit };
  }).sort((a, b) => b.s - a.s);
}

function Thumb({ v }: { v: Video }) {
  return <span className="relative grid aspect-video w-full place-items-center rounded-lg text-3xl" style={{ background: `linear-gradient(135deg, ${TOPIC[v.topics[0]].color}, ${TOPIC[v.topics[v.topics.length - 1]].color}aa)` }}>{v.topics.map((t) => TOPIC[t].emoji).join("")}<Play className="absolute bottom-1 right-1 size-4 text-white/80" aria-hidden /></span>;
}

function Explore() {
  const [history, setHistory] = useState<string[]>(["v2", "v10"]);
  const [div, setDiv] = useState(20);
  const r = rank(history, div / 100);
  const top = r.slice(0, 4);
  const topicsShown = new Set(top.flatMap((x) => x.v.topics));
  return (
    <SimLayout
      stage={
        <Stage className="space-y-4 p-4">
          <div>
            <p className="mb-2 text-sm font-semibold text-fg">Bảng tin gợi ý cho em</p>
            <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">{top.map((x, i) => <li key={x.v.id}><button type="button" onClick={() => setHistory([...history, x.v.id])} className="w-full text-left"><Thumb v={x.v} /><p className="mt-1 line-clamp-2 text-xs font-semibold text-fg">{i + 1}. {x.v.title}</p><p className="text-[11px] text-muted">điểm {x.s}</p></button></li>)}</ul>
            <p className="mt-2 text-xs text-muted">Bấm vào một video để xem — hệ thống ghi lại và gợi ý lại ngay.</p>
          </div>
          <div className="rounded-2xl bg-white p-3 shadow-sm dark:bg-slate-900">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Hệ thống nghĩ em thích</p>
            <div className="space-y-1.5">{(Object.keys(TOPIC) as Topic[]).map((t) => { const n = history.filter((id) => VIDEOS.find((v) => v.id === id)!.topics.includes(t)).length; return <div key={t} className="grid grid-cols-[90px_minmax(0,1fr)_24px] items-center gap-2 text-xs"><span className="text-fg">{TOPIC[t].emoji} {TOPIC[t].label}</span><span className="h-2.5 rounded-full bg-surface-2"><span className="block h-full rounded-full" style={{ width: `${(n / Math.max(1, history.length)) * 100}%`, background: TOPIC[t].color }} /></span><b className="text-right tabular-nums text-fg">{n}</b></div>; })}</div>
          </div>
        </Stage>
      }
      controls={
        <>
          <Panel title={`Đã xem (${history.length})`}>
            <ul className="flex flex-wrap gap-1">{history.map((id) => <li key={id}><button type="button" onClick={() => setHistory(history.filter((x) => x !== id))} className="rounded-full bg-surface px-2 py-0.5 text-xs hover:bg-line" title="Bỏ khỏi lịch sử">{VIDEOS.find((v) => v.id === id)!.topics.map((t) => TOPIC[t].emoji).join("")} ✕</button></li>)}</ul>
          </Panel>
          <Panel title="Thuật toán"><SimSlider label="Độ đa dạng" value={div} min={0} max={100} step={10} onChange={setDiv} unit="%" /><p className="text-xs text-muted">0%: chỉ gợi ý đúng thứ em đã xem. Cao: chen thêm chủ đề mới.</p></Panel>
          <div className="grid grid-cols-2 gap-2"><Readout label="Chủ đề trên bảng tin" value={`${topicsShown.size}/5`} tone={topicsShown.size <= 2 ? "rose" : "green"} /><Readout label="Đã xem" value={history.length} /></div>
          {topicsShown.size <= 2 && <p className="text-xs text-warning-fg">Bong bóng lọc: bảng tin chỉ còn {topicsShown.size} chủ đề, em ít khi gặp điều mới.</p>}
          <ResetAll onClick={() => { setHistory(["v2", "v10"]); setDiv(20); }} />
        </>
      }
    />
  );
}

const TASKS = [
  { kind: "predict" as const, history: ["v1", "v9"], div: 0 },
  { kind: "bubble" as const },
  { kind: "predict" as const, history: ["v3", "v7"], div: 0 },
  { kind: "data" as const },
];
function Game() {
  const c = useChallenge(TASKS.length);
  const t = TASKS[Math.min(c.idx, TASKS.length - 1)];
  const [pick, setPick] = useState<string | null>(null);
  const key = `${c.run}-${c.idx}`; const [seen, setSeen] = useState(key);
  if (seen !== key) { setSeen(key); setPick(null); }
  if (t.kind === "predict") {
    const r = rank(t.history, t.div);
    const choices = [r[0], r[3], r[6]].filter(Boolean).map((x) => x.v).sort((a, b) => a.id.localeCompare(b.id));
    const check = () => c.check(pick === r[0].v.id, pick === r[0].v.id ? `Đúng: video này trùng nhiều chủ đề nhất với lịch sử.` : "Đếm xem chủ đề nào xuất hiện trong các video đã xem, video nào trùng nhiều nhất.");
    return (
      <ChallengeFrame c={c} prompt={<>Em vừa xem: {t.history.map((id) => VIDEOS.find((v) => v.id === id)!.title).join(" và ")}. Video nào được gợi ý đầu tiên (độ đa dạng 0%)?</>} onCheck={check} summary={SUMMARY}>
        <ul className="grid gap-3 sm:grid-cols-3">{choices.map((v) => <li key={v.id}><button type="button" aria-pressed={pick === v.id} onClick={() => setPick(v.id)} className={cn("w-full rounded-xl border-2 p-2 text-left", pick === v.id ? "border-brand bg-brand/10" : "border-line bg-surface")}><Thumb v={v} /><p className="mt-1 text-sm font-semibold text-fg">{v.title}</p></button></li>)}</ul>
      </ChallengeFrame>
    );
  }
  const opts = t.kind === "bubble" ? [["it", "Bảng tin chỉ còn vài chủ đề giống những gì đã xem"], ["nhieu", "Bảng tin có quá nhiều chủ đề"], ["cham", "Ứng dụng chạy chậm"]] : [["xem", "Video em xem, thời gian xem, lượt thích, bỏ qua"], ["mk", "Mật khẩu của em"], ["khong", "Không dùng dữ liệu gì"]];
  const right = t.kind === "bubble" ? "it" : "xem";
  return (
    <ChallengeFrame c={c} prompt={t.kind === "bubble" ? "“Bong bóng lọc” là gì?" : "Thuật toán gợi ý học từ dữ liệu nào của em?"} onCheck={() => c.check(pick === right, pick === right ? (t.kind === "bubble" ? "Đúng: thuật toán chỉ đưa thứ em đã thích, nên em ít gặp quan điểm, chủ đề mới." : "Đúng: mỗi lần xem, bấm thích hay lướt qua đều là dữ liệu dạy thuật toán.") : "Thử lại ở màn Khám phá với độ đa dạng 0%.")} summary={SUMMARY}>
      <div className="grid gap-2 sm:grid-cols-3">{opts.map(([id, l]) => <button key={id} type="button" aria-pressed={pick === id} onClick={() => setPick(id)} className={cn("rounded-xl border-2 px-4 py-3 text-left font-semibold", pick === id ? "border-brand bg-brand/10" : "border-line bg-surface")}>{l}</button>)}</div>
    </ChallengeFrame>
  );
}
const SUMMARY = ["Thuật toán gợi ý chấm điểm từng video theo độ hợp với lịch sử xem của em rồi sắp xếp.", "Chỉ gợi ý cái giống cũ tạo ra bong bóng lọc; thêm độ đa dạng giúp gặp điều mới.", "Mỗi lượt xem, thích, bỏ qua đều là dữ liệu — em có thể chủ động xem đa dạng hơn."];

export function RecommenderLab() {
  return <SimShell title="Thuật toán gợi ý video" screens={[{ id: "kham-pha", label: "Bảng tin", icon: ThumbsUp, render: () => <Explore /> }, { id: "thu-thach", label: "Thử thách", icon: Sparkles, render: () => <Game /> }]} />;
}
