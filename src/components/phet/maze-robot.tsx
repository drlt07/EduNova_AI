"use client";
/** Tin 10 Bài 21 – Robot tìm đường thoát: lắp vòng lặp while (điều kiện + thân, có thể có if), chạy từng bước, phát hiện lặp vô hạn. */
import { useEffect, useState } from "react";
import { Pause, Play, SkipForward } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ChallengeFrame, Panel, Readout, ResetAll, SimLayout, SimShell, SimSlider, Stage, useChallenge } from "./kit";

type Dir = 0 | 1 | 2 | 3; // 0 đông, 1 bắc, 2 tây, 3 nam
const DX = [1, 0, -1, 0], DY = [0, -1, 0, 1];
type Action = "di" | "trai" | "phai";
export interface Program { cond: "chuaDich" | "khongTuong" | "dem"; n: number; mode: "don" | "neu"; action: Action; test: "tuong" | "phaiTrong"; then: Action; else: Action }
const ACTION_TEXT: Record<Action, string> = { di: "di_thang()", trai: "re_trai()", phai: "re_phai()" };
const COND_TEXT = (p: Program) => (p.cond === "chuaDich" ? "not o_dich()" : p.cond === "khongTuong" ? "not truoc_mat_co_tuong()" : `so_buoc < ${p.n}`);
const TEST_TEXT = { tuong: "truoc_mat_co_tuong()", phaiTrong: "ben_phai_trong()" } as const;

interface Maze { rows: string[]; dir: Dir; name: string }
const MAZES: Record<string, Maze> = {
  thang: { name: "Hành lang thẳng", dir: 0, rows: ["#########", "#S.....G#", "#########"] },
  trai: { name: "Rẽ trái", dir: 0, rows: ["#########", "#G......#", "#######.#", "#######.#", "#S......#", "#########"] },
  phai: { name: "Rẽ phải", dir: 0, rows: ["#########", "#S......#", "#######.#", "#######.#", "#G......#", "#########"] },
  dem: { name: "Dừng đúng chỗ", dir: 0, rows: ["##########", "#S...G...#", "##########"] },
};
function find(m: Maze, ch: string) { for (let y = 0; y < m.rows.length; y++) { const x = m.rows[y].indexOf(ch); if (x >= 0) return { x, y }; } return { x: 1, y: 1 }; }
const wall = (m: Maze, x: number, y: number) => (m.rows[y]?.[x] ?? "#") === "#";

export interface RobotState { x: number; y: number; d: Dir; steps: number; iter: number; ended: boolean; bump: boolean; log: string[] }
export const LIMIT = 120;
function start(m: Maze): RobotState { const s = find(m, "S"); return { ...s, d: m.dir, steps: 0, iter: 0, ended: false, bump: false, log: [] }; }
function doAction(m: Maze, r: RobotState, a: Action): RobotState {
  if (a === "trai") return { ...r, d: ((r.d + 1) % 4) as Dir };
  if (a === "phai") return { ...r, d: ((r.d + 3) % 4) as Dir };
  const nx = r.x + DX[r.d], ny = r.y + DY[r.d];
  if (wall(m, nx, ny)) return { ...r, bump: true };
  return { ...r, x: nx, y: ny, steps: r.steps + 1 };
}
/** Một lần kiểm tra điều kiện + chạy thân vòng lặp. */
export function tick(m: Maze, p: Program, r: RobotState): RobotState {
  if (r.ended) return r;
  const goal = find(m, "G");
  const ahead = wall(m, r.x + DX[r.d], r.y + DY[r.d]);
  const c = p.cond === "chuaDich" ? !(r.x === goal.x && r.y === goal.y) : p.cond === "khongTuong" ? !ahead : r.steps < p.n;
  if (!c) return { ...r, ended: true, log: [...r.log, `${COND_TEXT(p)} → False: thoát vòng lặp`] };
  if (r.iter >= LIMIT) return { ...r, ended: true, log: [...r.log, "Quá 120 lần lặp: có thể là lặp vô hạn!"] };
  const right = (r.d + 3) % 4;
  const testVal = p.test === "tuong" ? ahead : !wall(m, r.x + DX[right], r.y + DY[right]);
  const a = p.mode === "don" ? p.action : testVal ? p.then : p.else;
  const next = doAction(m, { ...r, bump: false }, a);
  return { ...next, iter: r.iter + 1, log: [...r.log, `Lần ${r.iter + 1}: ${COND_TEXT(p)} → True, ${p.mode === "neu" ? `${TEST_TEXT[p.test]} → ${testVal ? "True" : "False"}, ` : ""}${ACTION_TEXT[a]}${next.bump ? " (đụng tường)" : ""}`].slice(-6) };
}
export function runAll(m: Maze, p: Program) { let r = start(m); while (!r.ended) r = tick(m, p, r); return r; }

function Grid({ m, r }: { m: Maze; r: RobotState }) {
  const cs = 44, W = m.rows[0].length * cs, H = m.rows.length * cs;
  const g = find(m, "G");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="mx-auto h-auto w-full max-w-[560px]" role="img" aria-label={`Mê cung ${m.name}, robot ở ô (${r.x}, ${r.y})`}>
      {m.rows.map((row, y) => row.split("").map((ch, x) => <rect key={`${x}-${y}`} x={x * cs} y={y * cs} width={cs} height={cs} fill={ch === "#" ? "#334155" : (x + y) % 2 ? "#f1f5f9" : "#e2e8f0"} stroke="#cbd5e1" strokeWidth="0.5" />))}
      <g transform={`translate(${g.x * cs + cs / 2} ${g.y * cs + cs / 2})`}><rect x="-14" y="-14" width="28" height="28" rx="4" fill="#10b981" /><text y="5" textAnchor="middle" fontSize="13" fontWeight="800" fill="#fff">ĐÍCH</text></g>
      <g style={{ transition: "transform .25s" }} transform={`translate(${r.x * cs + cs / 2} ${r.y * cs + cs / 2}) rotate(${-r.d * 90})`}>
        <rect x="-15" y="-13" width="30" height="26" rx="7" fill={r.bump ? "#ef4444" : "#2563eb"} />
        <circle cx="7" cy="-5" r="3.5" fill="#fff" /><circle cx="7" cy="5" r="3.5" fill="#fff" />
        <path d="M15 -6 L23 0 L15 6 Z" fill="#fbbf24" />
      </g>
    </svg>
  );
}

function ProgramEditor({ p, onChange, lockCond }: { p: Program; onChange: (p: Program) => void; lockCond?: boolean }) {
  const sel = "h-8 rounded-lg border border-line bg-surface px-1 font-mono text-xs text-fg";
  const act = (v: Action, set: (a: Action) => void, name: string) => <select aria-label={name} className={sel} value={v} onChange={(e) => set(e.target.value as Action)}>{(Object.keys(ACTION_TEXT) as Action[]).map((a) => <option key={a} value={a}>{ACTION_TEXT[a]}</option>)}</select>;
  return (
    <div className="space-y-2 font-mono text-xs">
      <div className="flex flex-wrap items-center gap-1">while
        <select aria-label="Điều kiện lặp" disabled={lockCond} className={sel} value={p.cond} onChange={(e) => onChange({ ...p, cond: e.target.value as Program["cond"] })}>
          <option value="chuaDich">not o_dich()</option><option value="khongTuong">not truoc_mat_co_tuong()</option><option value="dem">so_buoc &lt; n</option>
        </select>:</div>
      {p.cond === "dem" && <SimSlider label="n" value={p.n} min={1} max={10} onChange={(n) => onChange({ ...p, n })} />}
      <div className="flex gap-1 pl-4">
        {(["don", "neu"] as const).map((md) => <button key={md} type="button" aria-pressed={p.mode === md} onClick={() => onChange({ ...p, mode: md })} className={cn("rounded-lg px-2 py-1 font-sans text-[11px] font-semibold", p.mode === md ? "bg-brand text-brand-ink" : "bg-surface text-muted ring-1 ring-line")}>{md === "don" ? "Một lệnh" : "Có if / else"}</button>)}
      </div>
      {p.mode === "don" ? <div className="pl-4">{act(p.action, (action) => onChange({ ...p, action }), "Lệnh trong vòng lặp")}</div> : (
        <div className="space-y-1 pl-4">
          <div className="flex flex-wrap items-center gap-1">if <select aria-label="Điều kiện if" className={sel} value={p.test} onChange={(e) => onChange({ ...p, test: e.target.value as Program["test"] })}><option value="tuong">truoc_mat_co_tuong()</option><option value="phaiTrong">ben_phai_trong()</option></select>:</div>
          <div className="pl-4">{act(p.then, (then) => onChange({ ...p, then }), "Lệnh khi đúng")}</div>
          <div>else:</div>
          <div className="pl-4">{act(p.else, (e) => onChange({ ...p, else: e }), "Lệnh khi sai")}</div>
        </div>
      )}
    </div>
  );
}

const DEFAULT: Program = { cond: "khongTuong", n: 4, mode: "don", action: "di", test: "tuong", then: "trai", else: "di" };

function useRunner(m: Maze, p: Program) {
  const [r, setR] = useState(() => start(m));
  const [playing, setPlaying] = useState(false);
  const active = playing && !r.ended;
  useEffect(() => {
    if (!active) return;
    const t = window.setTimeout(() => setR((x) => tick(m, p, x)), 320);
    return () => window.clearTimeout(t);
  }, [active, r, m, p]);
  return { r, playing: active, setPlaying, step: () => setR((x) => tick(m, p, x)), reset: () => { setR(start(m)); setPlaying(false); } };
}

function Explore() {
  const [mz, setMz] = useState("trai");
  const [p, setP] = useState<Program>(DEFAULT);
  const m = MAZES[mz];
  const run = useRunner(m, p);
  const g = find(m, "G");
  const atGoal = run.r.x === g.x && run.r.y === g.y;
  const edit = (f: () => void) => { f(); run.reset(); };
  return (
    <SimLayout
      stage={
        <div className="space-y-3">
          <Stage className="p-3"><Grid m={m} r={run.r} /></Stage>
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_200px]">
            <ol className="min-h-[120px] rounded-xl bg-[#0f172a] p-3 font-mono text-xs leading-6 text-slate-200" aria-live="polite">{run.r.log.length ? run.r.log.map((l, i) => <li key={i} className={cn(l.includes("vô hạn") && "text-rose-300", l.includes("thoát") && "text-emerald-300")}>{l}</li>) : <li className="text-slate-500">Bấm Chạy hoặc Từng bước.</li>}</ol>
            <div className="grid grid-cols-3 gap-2 md:grid-cols-1">
              <Readout label="Số lần lặp" value={run.r.iter} />
              <Readout label="so_buoc" value={run.r.steps} tone="green" />
              <Readout label="Đã tới đích?" value={atGoal ? "Có" : "Chưa"} tone={atGoal ? "green" : "amber"} />
            </div>
          </div>
        </div>
      }
      controls={
        <>
          <Panel title="Mê cung">
            <select aria-label="Chọn mê cung" className="h-9 w-full rounded-lg border border-line bg-surface px-2 text-sm" value={mz} onChange={(e) => edit(() => setMz(e.target.value))}>{Object.entries(MAZES).map(([k, v]) => <option key={k} value={k}>{v.name}</option>)}</select>
          </Panel>
          <Panel title="Chương trình"><ProgramEditor p={p} onChange={(x) => edit(() => setP(x))} /></Panel>
          <Panel title="Chạy">
            <div className="flex gap-2">
              <Button size="sm" onClick={() => (run.r.ended ? (run.reset(), run.setPlaying(true)) : run.setPlaying(!run.playing))}>{run.playing ? <><Pause /> Dừng</> : <><Play /> Chạy</>}</Button>
              <Button size="sm" variant="secondary" disabled={run.r.ended} onClick={run.step}><SkipForward /> Từng bước</Button>
            </div>
          </Panel>
          <ResetAll onClick={() => { setMz("trai"); setP(DEFAULT); run.reset(); }} />
        </>
      }
    />
  );
}

const TASKS: { maze: string; prompt: string; why: string }[] = [
  { maze: "thang", prompt: "Viết vòng lặp đưa robot đi hết hành lang tới đích rồi dừng.", why: "Lặp khi trước mặt chưa có tường (hoặc khi chưa tới đích), mỗi lần đi thẳng." },
  { maze: "dem", prompt: "Đích ở giữa hành lang. Robot phải dừng đúng ở đích.", why: "Dùng so_buoc < 4 hoặc not o_dich(): dừng khi điều kiện thành False." },
  { maze: "trai", prompt: "Đưa robot tới đích trong mê cung có hai khúc rẽ trái.", why: "while not o_dich(): if có tường trước mặt: rẽ trái, else: đi thẳng." },
  { maze: "phai", prompt: "Mê cung này rẽ phải. Sửa chương trình để robot tới đích.", why: "Đổi nhánh if thành re_phai()." },
];

function Game() {
  const c = useChallenge(TASKS.length);
  const t = TASKS[Math.min(c.idx, TASKS.length - 1)];
  const m = MAZES[t.maze];
  const [p, setP] = useState<Program>({ ...DEFAULT, cond: "chuaDich", action: "trai" });
  const run = useRunner(m, p);
  const key = `${c.run}-${c.idx}`;
  const [seen, setSeen] = useState(key);
  if (seen !== key) { setSeen(key); setP({ ...DEFAULT, cond: "chuaDich", action: "trai" }); run.reset(); }
  const check = () => {
    const r = runAll(m, p);
    const g = find(m, "G");
    const ok = r.x === g.x && r.y === g.y && r.iter < LIMIT;
    c.check(ok, ok ? `Robot tới đích sau ${r.iter} lần lặp. ${t.why}` : r.iter >= LIMIT ? "Vòng lặp không dừng: điều kiện luôn đúng mà robot không tới được đích." : `Robot dừng ở ô (${r.x}, ${r.y}), chưa tới đích.`);
    run.reset(); run.setPlaying(true);
  };
  return (
    <ChallengeFrame c={c} prompt={t.prompt} onCheck={check} summary={["while lặp khi điều kiện còn đúng và dừng khi điều kiện thành False.", "Thân vòng lặp phải làm thay đổi trạng thái, nếu không vòng lặp chạy mãi.", "Kết hợp while với if để robot quyết định ở mỗi bước."]}>
      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_280px]">
        <Stage className="p-3"><Grid m={m} r={run.r} /></Stage>
        <Panel title="Chương trình"><ProgramEditor p={p} onChange={(x) => { setP(x); run.reset(); }} /></Panel>
      </div>
    </ChallengeFrame>
  );
}

export function MazeRobotLab() {
  return <SimShell title="Robot tìm đường thoát" screens={[{ id: "kham-pha", label: "Khám phá", render: () => <Explore /> }, { id: "thu-thach", label: "Thử thách", render: () => <Game /> }]} />;
}

export { MAZES };
