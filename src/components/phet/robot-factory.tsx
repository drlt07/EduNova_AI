"use client";
/** Tin 10 Bài 20 – Nhà máy robot tự động: for i in range(start, stop, step) điều khiển cánh tay đặt hộp lên băng chuyền, chạy từng bước. */
import { useEffect, useState } from "react";
import { Pause, Play, SkipForward } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ChallengeFrame, Panel, Readout, ResetAll, Segmented, SimLayout, SimShell, SimSlider, Stage, useChallenge } from "./kit";

const SLOTS = 13;
/** Dãy giá trị của range như Python (bước khác 0), cắt ở 40 phần tử để an toàn. */
export function pyRange(start: number, stop: number, step: number): number[] {
  const out: number[] = [];
  if (step === 0) return out;
  for (let i = start; step > 0 ? i < stop : i > stop; i += step) { out.push(i); if (out.length >= 40) break; }
  return out;
}
const rangeText = (a: number, b: number, s: number) => (s === 1 && a === 0 ? `range(${b})` : s === 1 ? `range(${a}, ${b})` : `range(${a}, ${b}, ${s})`);

function Belt({ seq, done, cur, target }: { seq: number[]; done: number; cur?: number; target?: number[] }) {
  const placed = new Set(seq.slice(0, done));
  const W = 640, slot = W / SLOTS;
  return (
    <svg viewBox={`0 0 ${W} 230`} className="h-auto w-full" role="img" aria-label={`Băng chuyền: đã đặt hộp ở vị trí ${[...placed].join(", ") || "chưa có"}`}>
      <rect x="0" y="150" width={W} height="34" rx="17" fill="#334155" />
      {Array.from({ length: 26 }, (_, k) => <rect key={k} x={k * 25 + ((done * 6) % 25)} y="162" width="12" height="10" rx="2" fill="#475569" />)}
      {Array.from({ length: SLOTS }, (_, k) => (
        <g key={k} transform={`translate(${k * slot + slot / 2} 0)`}>
          {target?.includes(k) && <rect x="-19" y="104" width="38" height="44" rx="6" fill="none" stroke="#a78bfa" strokeWidth="2" strokeDasharray="5 4" />}
          {placed.has(k) && <g><rect x="-17" y="108" width="34" height="40" rx="5" fill={cur === k ? "#f59e0b" : "#fbbf24"} stroke="#b45309" strokeWidth="2" /><text y="134" textAnchor="middle" fontSize="14" fontWeight="800" fill="#78350f">{k}</text></g>}
          <text y="204" textAnchor="middle" fontSize="12" fontFamily="monospace" fill="#64748b">{k}</text>
        </g>
      ))}
      {cur !== undefined && cur >= 0 && cur < SLOTS && (
        <g transform={`translate(${cur * slot + slot / 2} 0)`} style={{ transition: "transform .3s" }}>
          <rect x="-4" y="0" width="8" height="70" fill="#64748b" />
          <rect x="-26" y="62" width="52" height="16" rx="4" fill="#2563eb" />
          <path d="M-20 78 L-14 100 M20 78 L14 100" stroke="#2563eb" strokeWidth="6" strokeLinecap="round" />
          <circle r="10" cy="8" fill="#1e3a8a" />
        </g>
      )}
      <text x="8" y="22" fontSize="13" fill="#64748b">Vị trí trên băng chuyền</text>
    </svg>
  );
}

function Code({ a, b, s, body, line }: { a: number; b: number; s: number; body: "dat" | "cong"; line: number }) {
  const L = (n: number, t: string) => <div className={cn("rounded px-2", line === n && "bg-amber-400/25")}><span className="mr-3 select-none text-slate-500">{n}</span>{t}</div>;
  return (
    <pre className="rounded-xl bg-[#0f172a] p-3 font-mono text-sm leading-7 text-slate-100 [font-variant-ligatures:none]">
      {body === "cong" && L(1, "tong = 0")}
      {L(body === "cong" ? 2 : 1, `for i in ${rangeText(a, b, s)}:`)}
      {L(body === "cong" ? 3 : 2, body === "dat" ? "    dat_hop(vi_tri=i)" : "    tong = tong + i")}
      {body === "cong" && L(4, "    dat_hop(vi_tri=i)")}
    </pre>
  );
}

function usePlayer(len: number) {
  const [done, setDone] = useState(0);
  const [playing, setPlaying] = useState(false);
  const active = playing && done < len;
  useEffect(() => {
    if (!active) return;
    const t = window.setTimeout(() => setDone((d) => d + 1), 650);
    return () => window.clearTimeout(t);
  }, [active, done]);
  return { done, playing: active, setPlaying, step: () => setDone((d) => Math.min(len, d + 1)), reset: () => { setDone(0); setPlaying(false); } };
}

function Explore() {
  const [a, setA] = useState(0);
  const [b, setB] = useState(5);
  const [s, setS] = useState(1);
  const [body, setBody] = useState<"dat" | "cong">("dat");
  const seq = pyRange(a, b, s);
  const p = usePlayer(seq.length);
  const cur = p.done > 0 ? seq[p.done - 1] : undefined;
  const tong = seq.slice(0, p.done).reduce((x, y) => x + y, 0);
  const change = (f: () => void) => { f(); p.reset(); };
  return (
    <SimLayout
      stage={
        <div className="space-y-3">
          <Stage className="p-3"><Belt seq={seq} done={p.done} cur={cur} /></Stage>
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
            <Code a={a} b={b} s={s} body={body} line={p.done === 0 ? 0 : body === "cong" ? 3 : 2} />
            <div className="grid grid-cols-2 gap-2 md:grid-cols-1">
              <Readout label="Biến i" value={cur ?? "—"} />
              <Readout label="Số lần lặp" value={`${p.done}/${seq.length}`} tone="green" />
              {body === "cong" && <Readout label="tong" value={tong} tone="amber" />}
            </div>
          </div>
          <p className="text-sm text-muted">Dãy giá trị của i: <span className="font-mono text-fg">[{seq.map((x, k) => <span key={k} className={cn(k < p.done && "font-bold text-blue-fg")}>{k ? ", " : ""}{x}</span>)}]</span>{seq.length === 0 && " — range rỗng, vòng lặp không chạy lần nào."}</p>
        </div>
      }
      controls={
        <>
          <Panel title="range(start, stop, step)">
            <SimSlider label="start" value={a} min={0} max={12} onChange={(v) => change(() => setA(v))} />
            <SimSlider label="stop (không lấy)" value={b} min={0} max={13} onChange={(v) => change(() => setB(v))} />
            <SimSlider label="step" value={s} min={-3} max={3} onChange={(v) => change(() => setS(v === 0 ? 1 : v))} />
          </Panel>
          <Panel title="Thân vòng lặp">
            <Segmented label="Mỗi lần lặp" value={body} options={[{ value: "dat", label: "Đặt hộp" }, { value: "cong", label: "Cộng dồn + đặt hộp" }]} onChange={(v) => change(() => setBody(v))} />
          </Panel>
          <Panel title="Chạy">
            <div className="flex gap-2">
              <Button size="sm" onClick={() => (p.done >= seq.length ? (p.reset(), p.setPlaying(true)) : p.setPlaying(!p.playing))}>{p.playing ? <><Pause /> Dừng</> : <><Play /> Chạy</>}</Button>
              <Button size="sm" variant="secondary" disabled={p.done >= seq.length} onClick={p.step}><SkipForward /> Từng bước</Button>
            </div>
          </Panel>
          <ResetAll onClick={() => { setA(0); setB(5); setS(1); setBody("dat"); p.reset(); }} />
        </>
      }
    />
  );
}

const TASKS: { prompt: string; target: number[]; why: string }[] = [
  { prompt: "Đặt hộp vào các vị trí 0, 1, 2, 3, 4.", target: [0, 1, 2, 3, 4], why: "range(5) chạy từ 0 đến 4." },
  { prompt: "Đặt hộp vào các vị trí 3 đến 8.", target: [3, 4, 5, 6, 7, 8], why: "range(3, 9): stop = 9 vì stop không được lấy." },
  { prompt: "Chỉ đặt hộp ở vị trí chẵn từ 2 đến 10.", target: [2, 4, 6, 8, 10], why: "range(2, 11, 2) hoặc range(2, 12, 2)." },
  { prompt: "Đặt hộp ở 10, 7, 4, 1 (cánh tay đi ngược).", target: [10, 7, 4, 1], why: "Bước âm: range(10, 0, -3)." },
  { prompt: "Lặp đúng 4 lần, bắt đầu từ vị trí 5, mỗi lần cách 2 ô.", target: [5, 7, 9, 11], why: "range(5, 12, 2) cho 5, 7, 9, 11." },
];

function Game() {
  const c = useChallenge(TASKS.length);
  const t = TASKS[Math.min(c.idx, TASKS.length - 1)];
  const [a, setA] = useState(0);
  const [b, setB] = useState(1);
  const [s, setS] = useState(1);
  const key = `${c.run}-${c.idx}`;
  const [seen, setSeen] = useState(key);
  if (seen !== key) { setSeen(key); setA(0); setB(1); setS(1); }
  const seq = pyRange(a, b, s);
  const check = () => {
    const ok = seq.length === t.target.length && seq.every((x, i) => x === t.target[i]);
    c.check(ok, ok ? `Đúng: ${rangeText(a, b, s)}. ${t.why}` : `${rangeText(a, b, s)} cho [${seq.join(", ")}]. Cần [${t.target.join(", ")}].`);
  };
  return (
    <ChallengeFrame c={c} prompt={t.prompt} onCheck={check} summary={["range(start, stop, step) bắt đầu từ start, dừng TRƯỚC stop.", "step là bước nhảy; step âm thì đếm ngược.", "Số lần lặp bằng số phần tử của range."]}>
      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_260px]">
        <Stage className="p-3"><Belt seq={seq} done={seq.length} target={t.target} /><p className="px-2 pb-1 text-xs text-muted">Khung tím nét đứt: nơi cần đặt hộp.</p></Stage>
        <Panel title={rangeText(a, b, s)}>
          <SimSlider label="start" value={a} min={0} max={12} onChange={setA} />
          <SimSlider label="stop" value={b} min={0} max={13} onChange={setB} />
          <SimSlider label="step" value={s} min={-3} max={3} onChange={(v) => setS(v === 0 ? 1 : v)} />
        </Panel>
      </div>
    </ChallengeFrame>
  );
}

export function RobotFactoryLab() {
  return <SimShell title="Nhà máy robot tự động" screens={[{ id: "kham-pha", label: "Khám phá", render: () => <Explore /> }, { id: "thu-thach", label: "Thử thách", render: () => <Game /> }]} />;
}
