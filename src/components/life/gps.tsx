"use client";
/** Định vị GPS: mỗi vệ tinh cho biết khoảng cách → một đường tròn; giao của ba đường tròn là vị trí. Sai số đồng hồ làm các vòng lệch. */
import { useState } from "react";
import { Crosshair, Satellite } from "lucide-react";
import { cn } from "@/lib/utils";
import { ChallengeFrame, Panel, Readout, ResetAll, SimLayout, SimShell, SimSlider, SimToggle, Stage, useChallenge } from "@/components/phet/kit";

const W = 400, H = 300;
interface Sat { x: number; y: number; color: string; name: string }
const SATS: Sat[] = [{ x: 70, y: 60, color: "#2563eb", name: "Vệ tinh A" }, { x: 330, y: 70, color: "#ea580c", name: "Vệ tinh B" }, { x: 210, y: 270, color: "#16a34a", name: "Vệ tinh C" }];
const dist = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y);

/** Điểm khớp nhất với ba khoảng cách (dò lưới, đủ cho minh họa). */
function solve(sats: Sat[], r: number[]) {
  let best = { x: 0, y: 0, e: Infinity };
  for (let x = 0; x <= W; x += 4) for (let y = 0; y <= H; y += 4) {
    const e = sats.reduce((s, sat, i) => s + (dist(sat, { x, y }) - r[i]) ** 2, 0);
    if (e < best.e) best = { x, y, e };
  }
  return { x: best.x, y: best.y, err: Math.sqrt(best.e / sats.length) };
}

function GpsMap({ sats, r, me, guess, showCircles, onPick }: { sats: Sat[]; r: number[]; me?: { x: number; y: number }; guess?: { x: number; y: number; err: number }; showCircles: boolean[]; onPick?: (p: { x: number; y: number }) => void }) {
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={cn("w-full rounded-xl bg-[#e0f2fe]", onPick && "cursor-crosshair")} role="img" aria-label="Bản đồ và ba vệ tinh"
      onClick={onPick ? (e) => { const b = e.currentTarget.getBoundingClientRect(); onPick({ x: ((e.clientX - b.left) / b.width) * W, y: ((e.clientY - b.top) / b.height) * H }); } : undefined}>
      <path d="M0 200 Q120 170 200 210 T400 190 V300 H0 Z" fill="#bbf7d0" /><path d="M0 120 L400 150" stroke="#94a3b8" strokeWidth={10} opacity={0.5} /><path d="M150 0 L190 300" stroke="#94a3b8" strokeWidth={8} opacity={0.5} />
      {sats.map((s, i) => showCircles[i] && <circle key={i} cx={s.x} cy={s.y} r={r[i]} fill={s.color} fillOpacity={0.06} stroke={s.color} strokeWidth={2} />)}
      {sats.map((s) => <g key={s.name}><rect x={s.x - 9} y={s.y - 6} width={18} height={12} rx={2} fill={s.color} /><rect x={s.x - 22} y={s.y - 3} width={10} height={6} fill="#93c5fd" /><rect x={s.x + 12} y={s.y - 3} width={10} height={6} fill="#93c5fd" /></g>)}
      {guess && <g><circle cx={guess.x} cy={guess.y} r={Math.max(6, guess.err)} fill="#2563eb" fillOpacity={0.15} /><circle cx={guess.x} cy={guess.y} r={6} fill="#2563eb" stroke="white" strokeWidth={2} /></g>}
      {me && <g><path d={`M${me.x} ${me.y} l-7 -16 a8 8 0 1 1 14 0 z`} fill="#e11d48" stroke="white" strokeWidth={1.5} /></g>}
    </svg>
  );
}

function Explore() {
  const [me, setMe] = useState({ x: 190, y: 160 });
  const [clock, setClock] = useState(0);
  const [show, setShow] = useState([true, true, true]);
  const [useC, setUseC] = useState(true);
  const sats = useC ? SATS : SATS.slice(0, 2);
  const r = sats.map((s, i) => dist(s, me) + (i === 0 ? clock : 0));
  const g = solve(sats, r);
  const off = Math.round(dist(g, me));
  return (
    <SimLayout
      stage={<Stage className="space-y-2 p-3"><GpsMap sats={sats} r={r} me={me} guess={g} showCircles={show} onPick={setMe} /><p className="text-center text-xs text-muted">Bấm lên bản đồ để đặt vị trí thật của em (ghim đỏ). Chấm xanh là vị trí điện thoại tính ra.</p></Stage>}
      controls={
        <>
          <Panel title="Kết quả">
            <div className="grid grid-cols-2 gap-2"><Readout label="Lệch" value={`${off * 5} m`} tone={off < 4 ? "green" : off < 15 ? "amber" : "rose"} /><Readout label="Số vệ tinh" value={sats.length} /></div>
            {!useC && <p className="text-xs text-warning-fg">Hai đường tròn cắt nhau ở hai điểm: điện thoại chưa biết em ở điểm nào.</p>}
          </Panel>
          <Panel title="Vệ tinh">
            <SimToggle label="Dùng vệ tinh C" checked={useC} onChange={setUseC} />
            {sats.map((s, i) => <SimToggle key={s.name} label={`Vòng của ${s.name}`} checked={show[i]} onChange={(v) => setShow(show.map((x, k) => (k === i ? v : x)))} />)}
          </Panel>
          <Panel title="Sai số">
            <SimSlider label="Đồng hồ vệ tinh A lệch" value={clock} min={-40} max={40} onChange={setClock} format={(v) => `${v * 5} m`} />
            <p className="text-xs text-muted">Tín hiệu đi với tốc độ ánh sáng: đồng hồ lệch một phần triệu giây là lệch 300 m. Nhà cao tầng làm tín hiệu dội lại cũng gây lệch.</p>
          </Panel>
          <ResetAll onClick={() => { setMe({ x: 190, y: 160 }); setClock(0); setShow([true, true, true]); setUseC(true); }} />
        </>
      }
    />
  );
}

const TASKS = [
  { kind: "locate" as const, me: { x: 280, y: 190 } },
  { kind: "count" as const },
  { kind: "locate" as const, me: { x: 110, y: 220 } },
  { kind: "why" as const },
];
function Game() {
  const c = useChallenge(TASKS.length);
  const t = TASKS[Math.min(c.idx, TASKS.length - 1)];
  const [pick, setPick] = useState<{ x: number; y: number } | null>(null);
  const [ans, setAns] = useState<string | null>(null);
  const key = `${c.run}-${c.idx}`; const [seen, setSeen] = useState(key);
  if (seen !== key) { setSeen(key); setPick(null); setAns(null); }
  const r = t.kind === "locate" ? SATS.map((s) => dist(s, t.me)) : [0, 0, 0];
  const prompt = t.kind === "locate" ? "Ba vệ tinh báo khoảng cách (ba vòng tròn). Bấm vào chỗ em đang đứng." : t.kind === "count" ? "Trên mặt phẳng, cần ít nhất bao nhiêu vệ tinh để biết chắc một vị trí?" : "Vì sao GPS trong ngõ hẹp giữa nhà cao tầng hay bị lệch?";
  const opts = t.kind === "count" ? [["1", "1 vệ tinh"], ["2", "2 vệ tinh"], ["3", "3 vệ tinh"], ["5", "5 vệ tinh"]] : [["doi", "Tín hiệu dội vào tường nên đi đường dài hơn, khoảng cách đo sai"], ["pin", "Điện thoại yếu pin"], ["ban-do", "Bản đồ chưa cập nhật"]];
  const check = () => {
    if (t.kind === "locate") { if (!pick) return c.check(false, "Bấm lên bản đồ."); const d = dist(pick, t.me); return c.check(d < 22, d < 22 ? "Đúng: em đứng ở giao điểm chung của cả ba vòng." : "Tìm điểm nằm trên cả ba đường tròn cùng lúc."); }
    if (t.kind === "count") return c.check(ans === "3", ans === "3" ? "Đúng: hai vòng cắt nhau ở hai điểm, vòng thứ ba chọn ra một điểm. Trong không gian thật cần thêm vệ tinh thứ tư để sửa sai số đồng hồ." : "Thử bỏ vệ tinh C ở màn Khám phá xem hai vòng cắt nhau mấy điểm.");
    return c.check(ans === "doi", ans === "doi" ? "Đúng: GPS tính khoảng cách từ thời gian tín hiệu đi; tín hiệu dội tường đi xa hơn nên khoảng cách bị đo dài ra." : "GPS đo khoảng cách bằng thời gian tín hiệu bay. Điều gì làm thời gian đó sai?");
  };
  return (
    <ChallengeFrame c={c} prompt={prompt} onCheck={check} summary={["Vệ tinh gửi giờ phát; điện thoại đo thời gian tín hiệu bay để tính khoảng cách.", "Mỗi khoảng cách là một đường tròn; giao của ba đường tròn là vị trí.", "Sai số đồng hồ, tín hiệu dội làm vị trí lệch."]}>
      {t.kind === "locate" ? <Stage className="p-3"><GpsMap sats={SATS} r={r} guess={pick ? { ...pick, err: 0 } : undefined} showCircles={[true, true, true]} onPick={setPick} /></Stage>
        : <div className="grid gap-2 sm:grid-cols-2">{opts.map(([id, l]) => <button key={id} type="button" aria-pressed={ans === id} onClick={() => setAns(id)} className={cn("rounded-xl border-2 px-4 py-3 text-left font-semibold", ans === id ? "border-brand bg-brand/10" : "border-line bg-surface")}>{l}</button>)}</div>}
    </ChallengeFrame>
  );
}

export function GpsLab() {
  return <SimShell title="Định vị GPS bằng ba vệ tinh" screens={[{ id: "kham-pha", label: "Khám phá", icon: Satellite, render: () => <Explore /> }, { id: "thu-thach", label: "Thử thách", icon: Crosshair, render: () => <Game /> }]} />;
}
