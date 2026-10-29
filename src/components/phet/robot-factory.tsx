"use client";
/**
 * Tin 10 Bài 20 – Nhà máy robot tự động: for i in range(start, stop, step) điều khiển cánh tay đặt hộp lên băng chuyền.
 * Lớp hình ảnh ở đây; logic range và chẩn đoán lỗi ở lib/sim/range-lab (chấm điểm chỉ dựa vào dãy giá trị, không dựa vào hoạt ảnh).
 */
import { useEffect, useRef, useState } from "react";
import { Eye, Pause, Play, SkipForward } from "lucide-react";
import { cn } from "@/lib/utils";
import { diagnoseRange, pyRange, rangeText, RANGE_ERROR_LABEL, RANGE_TASKS, SLOTS } from "@/lib/sim/range-lab";
import { Button } from "@/components/ui/button";
import { useTutorActivity } from "@/components/tutor/tutor-provider";
import { ChallengeFrame, Panel, Readout, ResetAll, Segmented, SimShell, SimSlider, SimToggle, Stage, useChallenge } from "./kit";

export { pyRange } from "@/lib/sim/range-lab";

// Hình học băng chuyền (đơn vị viewBox)
const W = 720, X0 = 44, SW = (W - 2 * X0) / SLOTS, BELT_Y = 196;
/** Dải trống phía trên dành cho các nhãn i, lần lặp, dự đoán (không đè lên cánh tay). */
const TOP = 34, H = 310 + TOP;
const cx = (k: number) => X0 + SW * (k + 0.5);
/** Vị trí cờ stop: đặt ở mép trái ô stop (range dừng trước ô này). */
const stopX = (k: number) => X0 + SW * k;

function Crate({ k, tone, drop, label }: { k: number; tone: "amber" | "rose" | "cur"; drop?: boolean; label?: number }) {
  const c = { amber: ["#fbbf24", "#f59e0b", "#b45309"], cur: ["#fde68a", "#fbbf24", "#b45309"], rose: ["#fda4af", "#fb7185", "#9f1239"] }[tone];
  const x = cx(k) - 15, y = BELT_Y - 34;
  return (
    <g className={cn(drop && "sim-drop")}>
      <ellipse cx={cx(k) + 3} cy={BELT_Y + 2} rx="18" ry="4" fill="#000" opacity="0.35" />
      <path d={`M${x} ${y} l7 -7 h30 l-7 7 z`} fill={c[0]} />
      <path d={`M${x + 30} ${y} l7 -7 v30 l-7 7 z`} fill={c[2]} opacity="0.85" />
      <rect x={x} y={y} width="30" height="30" rx="2" fill={c[1]} stroke={c[2]} strokeWidth="1.5" />
      <path d={`M${x} ${y + 15} h30`} stroke={c[2]} strokeWidth="1" opacity="0.5" />
      {label !== undefined && <text x={x + 15} y={y + 21} textAnchor="middle" fontSize="13" fontWeight="800" fill="#451a03">{label}</text>}
    </g>
  );
}

function Ghost({ k, pulse }: { k: number; pulse?: boolean }) {
  const x = cx(k) - 15, y = BELT_Y - 34;
  return (
    <g className={cn(pulse && "sim-glow")} aria-hidden>
      <rect x={x - 3} y={y - 3} width="36" height="36" rx="5" fill="#a78bfa" opacity="0.12" />
      <path d={`M${x} ${y} l7 -7 h30 l-7 7 z M${x + 30} ${y} l7 -7 v30 l-7 7`} fill="none" stroke="#a78bfa" strokeWidth="1.5" strokeDasharray="4 3" />
      <rect x={x} y={y} width="30" height="30" rx="2" fill="none" stroke="#c4b5fd" strokeWidth="2" strokeDasharray="5 4" />
    </g>
  );
}

/** Cờ kéo được dưới băng chuyền; dùng chuột, cảm ứng hoặc phím mũi tên. */
function FlagHandle({ x, value, min, max, color, label, short, onChange, toValue }: { x: number; value: number; min: number; max: number; color: string; label: string; short: string; onChange?: (v: number) => void; toValue: (clientX: number) => number }) {
  const [dragging, setDragging] = useState(false);
  const set = (v: number) => { const n = Math.max(min, Math.min(max, v)); if (n !== value) onChange?.(n); };
  return (
    <g
      role="slider" aria-label={label} aria-valuemin={min} aria-valuemax={max} aria-valuenow={value} tabIndex={onChange ? 0 : -1}
      className={cn("outline-none [&:focus-visible>circle]:stroke-white", onChange && "cursor-grab active:cursor-grabbing")}
      style={{ transform: `translateX(${x}px)`, transition: dragging ? "none" : "transform .2s ease", touchAction: "none" }}
      onPointerDown={(e) => { if (!onChange) return; setDragging(true); (e.currentTarget as Element).setPointerCapture(e.pointerId); }}
      onPointerMove={(e) => { if (dragging) set(toValue(e.clientX)); }}
      onPointerUp={() => setDragging(false)}
      onPointerCancel={() => setDragging(false)}
      onKeyDown={(e) => { if (e.key === "ArrowLeft" || e.key === "ArrowDown") { e.preventDefault(); set(value - 1); } if (e.key === "ArrowRight" || e.key === "ArrowUp") { e.preventDefault(); set(value + 1); } }}
    >
      <rect x="-1.5" y="252" width="3" height="34" fill={color} />
      <path d="M1.5 254 h30 l-6 7 l6 7 h-30 z" fill={color} />
      <text x="4" y="264.5" fontSize="9" fontWeight="800" fill="#0f172a">{short}</text>
      <circle cy="292" r="11" fill={color} stroke="transparent" strokeWidth="2" />
      <text y="296" textAnchor="middle" fontSize="11" fontWeight="800" fill="#0f172a">{value}</text>
    </g>
  );
}

interface BeltProps {
  seq: number[];
  /** số hộp đã đặt (theo hoạt ảnh) */
  done: number;
  start: number;
  stop: number;
  target?: number[];
  /** tô đỏ hộp sai và nhấp nháy ô đích còn trống */
  marks?: { wrong: number[]; missing: number[] };
  predict?: Set<number>;
  onTogglePredict?: (k: number) => void;
  onStart?: (v: number) => void;
  onStop?: (v: number) => void;
}

/** Nhà xưởng 2.5D: tường, ray cẩu trục, băng chuyền có chiều sâu, hộp rơi, cờ start/stop kéo được. */
function Belt({ seq, done, start, stop, target, marks, predict, onTogglePredict, onStart, onStop }: BeltProps) {
  const svg = useRef<SVGSVGElement>(null);
  const placed = seq.slice(0, done);
  const cur = done > 0 ? seq[done - 1] : undefined;
  const armX = cur !== undefined && cur >= 0 && cur < SLOTS ? cx(cur) : cx(start >= 0 && start < SLOTS ? start : 0);
  const toUnits = (clientX: number) => {
    const r = svg.current?.getBoundingClientRect();
    return r ? ((clientX - r.left) / r.width) * W : 0;
  };
  const wrong = new Set(marks?.wrong ?? []);
  const finished = done > 0 && done >= seq.length;
  return (
    <svg ref={svg} viewBox={`0 0 ${W} ${H}`} className="h-auto w-full select-none" role="img" aria-label={`Băng chuyền: hộp ở vị trí ${placed.join(", ") || "chưa có"}${target ? `; ô đích ${target.join(", ")}` : ""}`}>
      <defs>
        <linearGradient id="rf-wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#0b1324" /><stop offset="1" stopColor="#1a2a47" /></linearGradient>
        <linearGradient id="rf-belt" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#475569" /><stop offset="1" stopColor="#334155" /></linearGradient>
        <radialGradient id="rf-lamp" cx="0.5" cy="0" r="0.9"><stop offset="0" stopColor="#38bdf8" stopOpacity="0.28" /><stop offset="1" stopColor="#38bdf8" stopOpacity="0" /></radialGradient>
      </defs>
      <rect width={W} height={H} fill="url(#rf-wall)" />
      <g transform={`translate(0 ${TOP})`}>
      {Array.from({ length: 9 }, (_, k) => <rect key={k} x={k * 82 + 6} y="58" width="70" height="92" rx="4" fill="#ffffff" opacity="0.025" />)}
      <g style={{ transform: `translateX(${armX}px)`, transition: "transform .35s ease" }}><ellipse cy="70" rx="120" ry="130" fill="url(#rf-lamp)" /></g>
      {/* ray cẩu trục */}
      <rect x="16" y="26" width={W - 32} height="10" rx="3" fill="#64748b" />
      <rect x="16" y="36" width={W - 32} height="3" fill="#1e293b" />
      {Array.from({ length: 12 }, (_, k) => <circle key={k} cx={30 + k * 60} cy="31" r="1.8" fill="#cbd5e1" />)}
      {/* sàn + băng chuyền */}
      <rect y="248" width={W} height="62" fill="#0f172a" />
      <path d={`M${X0 - 14} ${BELT_Y - 10} H${W - X0 + 14} l-12 22 H${X0 - 26} z`} fill="url(#rf-belt)" />
      <rect x={X0 - 26} y={BELT_Y + 12} width={W - 2 * X0 + 28} height="16" rx="3" fill="#1e293b" />
      {Array.from({ length: SLOTS + 1 }, (_, k) => <circle key={k} cx={X0 - 18 + k * SW} cy={BELT_Y + 20} r="5" fill="#64748b" stroke="#0f172a" strokeWidth="2" />)}
      {Array.from({ length: SLOTS }, (_, k) => (
        <g key={k}>
          <path d={`M${X0 + k * SW + 2} ${BELT_Y - 8} h${SW - 4} l-6 18 h-${SW - 4} z`} fill="#000" opacity={k % 2 ? 0.1 : 0.04} />
          <text x={cx(k) - 4} y={BELT_Y + 46} textAnchor="middle" fontSize="12" fontFamily="ui-monospace,monospace" fill="#94a3b8">{k}</text>
        </g>
      ))}
      {target?.filter((k) => !placed.includes(k)).map((k) => <Ghost key={`g${k}`} k={k} pulse={marks?.missing.includes(k)} />)}
      {placed.filter((k) => k >= 0 && k < SLOTS).map((k, i) => <Crate key={`${k}-${i}`} k={k} drop tone={wrong.has(k) ? "rose" : k === cur && !finished ? "cur" : "amber"} label={k} />)}
      {[...(predict ?? [])].map((k) => {
        const hit = finished ? seq.includes(k) : undefined;
        return <circle key={`p${k}`} cx={cx(k)} cy={BELT_Y - 72} r="7" fill={hit === undefined ? "#22d3ee" : hit ? "#22c55e" : "#f43f5e"} stroke="#0f172a" strokeWidth="2" className="sim-pop pointer-events-none" />;
      })}
      {/* cánh tay robot */}
      <g style={{ transform: `translateX(${armX}px)`, transition: "transform .35s cubic-bezier(.4,0,.2,1)" }} aria-hidden>
        <rect x="-20" y="20" width="40" height="22" rx="5" fill="#2563eb" />
        <rect x="-14" y="24" width="10" height="4" rx="2" fill="#93c5fd" />
        <rect x="-4" y="42" width="8" height="62" fill="#94a3b8" />
        <g style={{ transform: `translateY(${cur !== undefined && !finished ? 14 : 0}px)`, transition: "transform .2s" }}>
          <rect x="-4" y="98" width="8" height="10" fill="#94a3b8" />
          <rect x="-22" y="104" width="44" height="10" rx="3" fill="#1d4ed8" />
          <path d="M-18 114 l-5 16 M18 114 l5 16" stroke="#1d4ed8" strokeWidth="5" strokeLinecap="round" />
        </g>
      </g>
      {/* vùng bấm để dự đoán */}
      {onTogglePredict && Array.from({ length: SLOTS }, (_, k) => (
        <rect key={k} x={X0 + k * SW} y={BELT_Y - 84} width={SW} height="104" fill="transparent" className="cursor-pointer outline-none focus-visible:fill-white/10" role="button" aria-label={`Dự đoán có hộp ở ô ${k}`} aria-pressed={predict?.has(k)} tabIndex={0} onClick={() => onTogglePredict(k)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onTogglePredict(k); } }} />
      ))}
      {/* cờ start / stop */}
      <FlagHandle x={cx(Math.max(0, Math.min(SLOTS - 1, start)))} value={start} min={0} max={12} color="#4ade80" label="Cờ start" short="start" onChange={onStart} toValue={(x) => Math.round((toUnits(x) - X0) / SW - 0.5)} />
      <FlagHandle x={stopX(Math.max(0, Math.min(SLOTS, stop)))} value={stop} min={0} max={13} color="#fb7185" label="Cờ stop" short="stop" onChange={onStop} toValue={(x) => Math.round((toUnits(x) - X0) / SW)} />
      </g>
    </svg>
  );
}

function Code({ a, b, s, body, line }: { a: number; b: number; s: number; body: "dat" | "cong"; line: number }) {
  const L = (n: number, t: string) => <div className={cn("rounded px-2 transition-colors", line === n && "bg-amber-400/25")}><span className="mr-3 select-none text-slate-500">{n}</span>{t}</div>;
  return (
    <pre className="rounded-xl bg-[#0f172a] p-3 font-mono text-sm leading-7 text-slate-100 [font-variant-ligatures:none]">
      {body === "cong" && L(1, "tong = 0")}
      {L(body === "cong" ? 2 : 1, `for i in ${rangeText(a, b, s)}:`)}
      {L(body === "cong" ? 3 : 2, body === "dat" ? "    dat_hop(vi_tri=i)" : "    tong = tong + i")}
      {body === "cong" && L(4, "    dat_hop(vi_tri=i)")}
    </pre>
  );
}

function usePlayer(len: number, speed = 650) {
  const [done, setDone] = useState(0);
  const [playing, setPlaying] = useState(false);
  const active = playing && done < len;
  useEffect(() => {
    if (!active) return;
    const t = window.setTimeout(() => setDone((d) => d + 1), speed);
    return () => window.clearTimeout(t);
  }, [active, done, speed]);
  return { done, playing: active, setPlaying, step: () => setDone((d) => Math.min(len, d + 1)), reset: () => { setDone(0); setPlaying(false); }, play: () => { setDone(0); setPlaying(true); } };
}

const STEP_MIN = -4, STEP_MAX = 4;
/** step không được bằng 0 (Python báo lỗi): kéo qua 0 thì nhảy sang phía bên kia. */
const fixStep = (v: number, prev: number) => (v === 0 ? (prev > 0 ? -1 : 1) : v);

function Explore() {
  const [a, setA] = useState(0);
  const [b, setB] = useState(5);
  const [s, setS] = useState(1);
  const [body, setBody] = useState<"dat" | "cong">("dat");
  const [predicting, setPredicting] = useState(false);
  const [predict, setPredict] = useState<Set<number>>(new Set());
  const seq = pyRange(a, b, s);
  const p = usePlayer(seq.length);
  const cur = p.done > 0 ? seq[p.done - 1] : undefined;
  const tong = seq.slice(0, p.done).reduce((x, y) => x + y, 0);
  const finished = p.done >= seq.length && p.done > 0;
  const touch = useTutorActivity("simulation", () => ({ kind: "simulation", sim: "Nhà máy robot (range)", summary: `Đang khám phá ${rangeText(a, b, s)} → [${seq.join(", ")}].`, problems: seq.length ? [] : ["range rỗng"], facts: { start: a, stop: b, step: s, lap: seq.length } }), { title: "Nhà máy robot · Tin 10", topic: "loop", level: "free" });
  const change = (f: () => void) => { f(); p.reset(); touch(); };
  const hits = [...predict].filter((k) => seq.includes(k)).length;
  const toggle = (k: number) => setPredict((x) => { const n = new Set(x); if (n.has(k)) n.delete(k); else n.add(k); return n; });
  return (
    <div className="space-y-3">
      <Stage dark className="p-0">
        <Belt seq={seq} done={p.done} start={a} stop={b} predict={predicting ? predict : undefined} onTogglePredict={predicting && p.done === 0 ? toggle : undefined} onStart={(v) => change(() => setA(v))} onStop={(v) => change(() => setB(v))} />
        <div className="pointer-events-none absolute left-3 top-3 flex flex-wrap gap-2 text-xs font-semibold">
          <span className="rounded-full bg-white/10 px-2.5 py-1 font-mono text-white">i = {cur ?? "—"}</span>
          <span className="rounded-full bg-white/10 px-2.5 py-1 text-white">lần lặp {p.done}/{seq.length}</span>
          {body === "cong" && <span className="rounded-full bg-amber-400/20 px-2.5 py-1 font-mono text-amber-200">tong = {tong}</span>}
        </div>
        {predicting && <p role="status" className="pointer-events-none absolute right-3 top-3 rounded-full bg-cyan-400/15 px-2.5 py-1 text-xs font-semibold text-cyan-200">{p.done === 0 ? "Bấm các ô em đoán sẽ có hộp, rồi Chạy" : finished ? `Đoán đúng ${hits}/${seq.length} ô${predict.size > hits ? `, ${predict.size - hits} ô thừa` : ""}` : "Đang chạy…"}</p>}
      </Stage>
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_16rem]">
        <div className="space-y-2">
          <Code a={a} b={b} s={s} body={body} line={p.done === 0 ? 0 : body === "cong" ? 3 : 2} />
          <p className="text-sm text-muted">Dãy giá trị của i: <span className="font-mono text-fg">[{seq.map((x, k) => <span key={k} className={cn(k < p.done && "font-bold text-blue-fg")}>{k ? ", " : ""}{x}</span>)}]</span>{seq.length === 0 && " — range rỗng, vòng lặp không chạy lần nào."}</p>
        </div>
        <Panel title="range(start, stop, step)">
          <SimSlider label="start" value={a} min={0} max={12} onChange={(v) => change(() => setA(v))} />
          <SimSlider label="stop (không lấy)" value={b} min={0} max={13} onChange={(v) => change(() => setB(v))} />
          <SimSlider label="step" value={s} min={STEP_MIN} max={STEP_MAX} onChange={(v) => change(() => setS(fixStep(v, s)))} />
        </Panel>
        <div className="flex flex-col gap-2.5">
          <div className="flex gap-2">
            <Button size="sm" onClick={() => { touch(); if (p.done >= seq.length) p.play(); else p.setPlaying(!p.playing); }}>{p.playing ? <><Pause /> Dừng</> : <><Play /> Chạy</>}</Button>
            <Button size="sm" variant="secondary" disabled={p.done >= seq.length} onClick={p.step}><SkipForward /> Từng bước</Button>
          </div>
          <SimToggle label="Dự đoán trước khi chạy" checked={predicting} onChange={(v) => { setPredicting(v); setPredict(new Set()); p.reset(); }} />
          <Segmented label="Mỗi lần lặp" value={body} options={[{ value: "dat", label: "Đặt hộp" }, { value: "cong", label: "Cộng dồn" }]} onChange={(v) => change(() => setBody(v))} />
          <ResetAll onClick={() => { setA(0); setB(5); setS(1); setBody("dat"); setPredict(new Set()); p.reset(); }} />
        </div>
      </div>
    </div>
  );
}

const LABELS = RANGE_TASKS.map((_, i) => `Thử thách ${i + 1}`);

function Game() {
  const c = useChallenge(RANGE_TASKS.length, LABELS);
  const t = RANGE_TASKS[Math.min(c.idx, RANGE_TASKS.length - 1)];
  const [a, setA] = useState(0);
  const [b, setB] = useState(1);
  const [s, setS] = useState(1);
  /** Dãy của lần kiểm tra gần nhất: hộp chỉ rơi sau khi bấm Kiểm tra, để em tự nhẩm trước. */
  const [shown, setShown] = useState<{ seq: number[]; wrong: number[]; missing: number[] } | null>(null);
  const [peek, setPeek] = useState(false);
  const key = `${c.run}-${c.idx}`;
  const [seen, setSeen] = useState(key);
  const p = usePlayer(shown?.seq.length ?? 0, 380);
  if (seen !== key) { setSeen(key); setA(0); setB(1); setS(1); setShown(null); setPeek(false); }
  const diag = diagnoseRange(a, b, s, t.target);
  const touch = useTutorActivity("simulation", () => ({ kind: "simulation", sim: "Nhà máy robot (range)", summary: `Thử thách ${c.idx + 1}: ${t.prompt} Đang chọn ${rangeText(a, b, s)}.`, problems: diag.error ? [RANGE_ERROR_LABEL[diag.error]] : [], facts: { start: a, stop: b, step: s, sai: c.mistakes } }), { title: "Nhà máy robot · Tin 10", topic: "loop", level: "guided" });
  const edit = (f: () => void) => { f(); setShown(null); setPeek(false); p.reset(); touch(); };
  const check = () => {
    const seq = pyRange(a, b, s);
    setShown({ seq, wrong: diag.wrong, missing: diag.missing });
    p.play();
    touch();
    const text = diag.ok ? `Đúng: ${rangeText(a, b, s)}. ${t.why}` : `${rangeText(a, b, s)} cho [${seq.join(", ")}] — ${RANGE_ERROR_LABEL[diag.error!]}.`;
    c.check(diag.ok, text, { answer: rangeText(a, b, s), error: diag.error && RANGE_ERROR_LABEL[diag.error] });
  };
  const seq = shown?.seq ?? (peek ? pyRange(a, b, s) : []);
  const settled = !!shown && p.done >= shown.seq.length;
  return (
    <ChallengeFrame c={c} prompt={t.prompt} onCheck={check} hints={diag.hints}
      summary={["range(start, stop, step) bắt đầu từ start, dừng TRƯỚC stop.", "step là bước nhảy; step âm thì đếm ngược.", "Số lần lặp bằng số phần tử của range."]}
      next="Robot tìm đường thoát (Bài 21) — vòng lặp while, khi không biết trước số lần lặp.">
      <div className="space-y-3">
        <Stage dark className="p-0">
          <Belt seq={seq} done={shown ? p.done : seq.length} start={a} stop={b} target={t.target} marks={settled && !c.feedback?.ok ? { wrong: shown.wrong, missing: shown.missing } : undefined} onStart={(v) => edit(() => setA(v))} onStop={(v) => edit(() => setB(v))} />
          <span className="pointer-events-none absolute left-3 top-3 rounded-full bg-white/10 px-2.5 py-1 font-mono text-sm font-semibold text-white">for i in {rangeText(a, b, s)}</span>
        </Stage>
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
          <Panel title="Chỉnh range, hoặc kéo cờ xanh / đỏ trên băng chuyền">
            <div className="grid gap-3 sm:grid-cols-3">
              <SimSlider label="start" value={a} min={0} max={12} onChange={(v) => edit(() => setA(v))} />
              <SimSlider label="stop" value={b} min={0} max={13} onChange={(v) => edit(() => setB(v))} />
              <SimSlider label="step" value={s} min={STEP_MIN} max={STEP_MAX} onChange={(v) => edit(() => setS(fixStep(v, s)))} />
            </div>
          </Panel>
          <div className="flex flex-col gap-2">
            <Readout label="Ô đích" value={t.target.length} tone="amber" />
            {c.hintLevel >= 2 && !shown && <Button size="sm" variant="ghost" onClick={() => setPeek(!peek)}><Eye /> {peek ? "Ẩn" : "Xem"} hộp rơi</Button>}
          </div>
        </div>
      </div>
    </ChallengeFrame>
  );
}

export function RobotFactoryLab() {
  return (
    <SimShell
      title="Nhà máy robot tự động"
      intro={{ story: "Dây chuyền đóng gói chạy theo lệnh for i in range(...): mỗi lần lặp, cánh tay đặt một hộp vào ô i.", goal: "Chọn start, stop, step để hộp rơi đúng các ô đích." }}
      screens={[{ id: "kham-pha", label: "Khám phá", render: () => <Explore /> }, { id: "thu-thach", label: "Thử thách", render: () => <Game /> }]}
    />
  );
}
