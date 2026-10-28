"use client";
/** Tin 10 Bài 5 – Ngôi nhà thông minh: cảm biến (đúng/sai) → biểu thức lôgic AND, OR, NOT → thiết bị, kèm bảng chân trị. */
import { useState } from "react";
import { cn } from "@/lib/utils";
import { ChallengeFrame, Panel, ResetAll, SimLayout, SimShell, SimToggle, Stage, useChallenge } from "./kit";

const SENSORS = [
  { id: "toi", label: "Trời tối" },
  { id: "nguoi", label: "Có người ở cửa" },
  { id: "cua", label: "Cửa mở" },
  { id: "vang", label: "Cả nhà đi vắng" },
  { id: "mua", label: "Trời mưa" },
] as const;
type Sensor = (typeof SENSORS)[number]["id"];
type State = Record<Sensor, boolean>;
export interface Expr { a: Sensor; na: boolean; op: "and" | "or"; b: Sensor; nb: boolean }
const label = (s: Sensor) => SENSORS.find((x) => x.id === s)!.label.toLowerCase();
const evalExpr = (e: Expr, s: State) => { const x = e.na ? !s[e.a] : s[e.a]; const y = e.nb ? !s[e.b] : s[e.b]; return e.op === "and" ? x && y : x || y; };
const exprText = (e: Expr) => `${e.na ? "not " : ""}${e.a} ${e.op} ${e.nb ? "not " : ""}${e.b}`;
const ALL_STATES: State[] = Array.from({ length: 32 }, (_, i) => Object.fromEntries(SENSORS.map((s, k) => [s.id, !!(i & (1 << k))])) as State);
const same = (x: Expr, y: Expr) => ALL_STATES.every((s) => evalExpr(x, s) === evalExpr(y, s));

const DEVICES = [
  { id: "den", label: "Đèn hiên" },
  { id: "bao", label: "Còi báo trộm" },
  { id: "tuoi", label: "Vòi tưới vườn" },
] as const;
type Device = (typeof DEVICES)[number]["id"];
const START: Record<Device, Expr> = {
  den: { a: "toi", na: false, op: "and", b: "nguoi", nb: false },
  bao: { a: "vang", na: false, op: "and", b: "cua", nb: false },
  tuoi: { a: "mua", na: true, op: "and", b: "toi", nb: true },
};

function House({ s, on, onToggle }: { s: State; on: Record<Device, boolean>; onToggle?: (k: Sensor) => void }) {
  const t = (k: Sensor) => onToggle && (() => onToggle(k));
  const btn = (k: Sensor) => (onToggle ? { role: "button", tabIndex: 0, "aria-label": `${SENSORS.find((x) => x.id === k)!.label}: ${s[k] ? "đúng" : "sai"}`, onClick: t(k), onKeyDown: (e: React.KeyboardEvent) => { if (e.key === "Enter" || e.key === " ") onToggle(k); }, className: "cursor-pointer" } : {});
  return (
    <svg viewBox="0 0 640 360" className="h-auto w-full" role="img" aria-label="Ngôi nhà thông minh">
      <rect width="640" height="360" fill={s.toi ? "#1e293b" : "#bae6fd"} />
      <g {...btn("toi")}>
        {s.toi ? <><circle cx="560" cy="60" r="26" fill="#f1f5f9" /><circle cx="572" cy="52" r="24" fill="#1e293b" /></> : <circle cx="560" cy="60" r="28" fill="#facc15" />}
        <rect x="520" y="22" width="80" height="80" fill="transparent" />
      </g>
      <g {...btn("mua")}>
        <ellipse cx="120" cy="56" rx="62" ry="24" fill={s.mua ? "#64748b" : "#ffffff"} opacity={s.mua ? 1 : 0.8} />
        {s.mua && Array.from({ length: 12 }, (_, i) => <line key={i} x1={70 + i * 9} y1={84 + (i % 3) * 8} x2={64 + i * 9} y2={100 + (i % 3) * 8} stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />)}
      </g>
      <rect y="300" width="640" height="60" fill={s.toi ? "#14532d" : "#4ade80"} />
      <path d="M200 160 L340 70 L480 160 Z" fill="#b91c1c" />
      <rect x="215" y="160" width="250" height="140" fill="#fde68a" />
      <rect x="240" y="190" width="56" height="44" fill={s.toi ? "#fef08a" : "#e0f2fe"} stroke="#78350f" strokeWidth="3" />
      <rect x="384" y="190" width="56" height="44" fill={s.toi ? "#fef08a" : "#e0f2fe"} stroke="#78350f" strokeWidth="3" />
      <g {...btn("cua")}>
        <rect x="318" y="222" width="44" height="78" fill="#422006" />
        <rect x="318" y="222" width={s.cua ? 14 : 44} height="78" fill="#92400e" stroke="#451a03" strokeWidth="2" />
      </g>
      <circle cx="340" cy="208" r="9" fill={on.den ? "#fde047" : "#64748b"} />
      {on.den && <circle cx="340" cy="208" r="40" fill="#fde047" opacity="0.28" />}
      <g {...btn("nguoi")} opacity={s.nguoi ? 1 : 0.25}>
        <circle cx="398" cy="252" r="10" fill="#f59e0b" />
        <rect x="390" y="263" width="16" height="30" rx="6" fill="#2563eb" />
        <rect x="378" y="238" width="40" height="62" fill="transparent" />
      </g>
      <g {...btn("vang")}>
        <rect x="470" y="236" width="94" height="30" rx="6" fill={s.vang ? "#ef4444" : "#e2e8f0"} />
        <text x="517" y="256" textAnchor="middle" fontSize="13" fontWeight="700" fill={s.vang ? "#fff" : "#64748b"}>{s.vang ? "ĐI VẮNG" : "CÓ NHÀ"}</text>
      </g>
      <g transform="translate(470 120)">
        <rect width="36" height="22" rx="4" fill={on.bao ? "#ef4444" : "#475569"} />
        {on.bao && <><circle cx="18" cy="11" r="26" fill="#ef4444" opacity="0.25" className="animate-pulse" /><text x="18" y="-8" textAnchor="middle" fontSize="12" fontWeight="800" fill="#ef4444">BÁO ĐỘNG</text></>}
      </g>
      <g transform="translate(110 296)">
        <rect x="-6" y="-18" width="12" height="18" fill="#334155" />
        {on.tuoi && [-40, -20, 0, 20, 40].map((dx) => <path key={dx} d={`M0 -18 Q ${dx / 2} -60 ${dx} -10`} stroke="#38bdf8" strokeWidth="2.5" fill="none" />)}
        <text y="22" textAnchor="middle" fontSize="12" fill={s.toi ? "#e2e8f0" : "#14532d"}>vòi tưới</text>
      </g>
    </svg>
  );
}

function ExprEditor({ e, onChange }: { e: Expr; onChange: (e: Expr) => void }) {
  const sel = "h-9 rounded-lg border border-line bg-surface px-1.5 text-sm text-fg";
  const sensorSel = (v: Sensor, set: (v: Sensor) => void, name: string) => <select aria-label={name} className={cn(sel, "min-w-0 flex-1")} value={v} onChange={(x) => set(x.target.value as Sensor)}>{SENSORS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}</select>;
  const notBtn = (v: boolean, set: (v: boolean) => void, name: string) => <button type="button" aria-pressed={v} aria-label={`NOT trước ${name}`} onClick={() => set(!v)} className={cn("h-9 rounded-lg px-2 font-mono text-xs font-bold", v ? "bg-violet-600 text-white" : "bg-surface text-muted ring-1 ring-line")}>NOT</button>;
  return (
    <div className="space-y-1.5">
      <div className="flex gap-1.5">{notBtn(e.na, (na) => onChange({ ...e, na }), "vế 1")}{sensorSel(e.a, (a) => onChange({ ...e, a }), "Vế 1")}</div>
      <div className="flex justify-center gap-1">
        {(["and", "or"] as const).map((op) => <button key={op} type="button" aria-pressed={e.op === op} onClick={() => onChange({ ...e, op })} className={cn("rounded-lg px-4 py-1 font-mono text-sm font-bold", e.op === op ? "bg-brand text-brand-ink" : "bg-surface text-muted ring-1 ring-line")}>{op.toUpperCase()}</button>)}
      </div>
      <div className="flex gap-1.5">{notBtn(e.nb, (nb) => onChange({ ...e, nb }), "vế 2")}{sensorSel(e.b, (b) => onChange({ ...e, b }), "Vế 2")}</div>
      <p className="rounded-lg bg-[#0f172a] px-2 py-1.5 font-mono text-xs text-cyan-200">{exprText(e)}</p>
    </div>
  );
}

function TruthTable({ e }: { e: Expr }) {
  const keys = [...new Set([e.a, e.b])];
  const rows = Array.from({ length: 2 ** keys.length }, (_, i) => Object.fromEntries(keys.map((k, j) => [k, !!(i & (1 << (keys.length - 1 - j)))])) as Partial<State>);
  return (
    <table className="w-full text-center font-mono text-xs">
      <thead className="text-muted"><tr>{keys.map((k) => <th key={k} className="py-1 font-semibold">{k}</th>)}<th className="font-semibold">kết quả</th></tr></thead>
      <tbody>{rows.map((r, i) => { const v = evalExpr(e, { toi: false, nguoi: false, cua: false, vang: false, mua: false, ...r }); return <tr key={i} className="border-t border-line">{keys.map((k) => <td key={k} className="py-1">{r[k] ? "True" : "False"}</td>)}<td className={cn("font-bold", v ? "text-success-fg" : "text-muted")}>{v ? "True" : "False"}</td></tr>; })}</tbody>
    </table>
  );
}

const BLANK: State = { toi: false, nguoi: false, cua: false, vang: false, mua: false };

function Explore() {
  const [s, setS] = useState<State>({ ...BLANK, toi: true });
  const [ex, setEx] = useState(START);
  const [dev, setDev] = useState<Device>("den");
  const on = Object.fromEntries(DEVICES.map((d) => [d.id, evalExpr(ex[d.id], s)])) as Record<Device, boolean>;
  return (
    <SimLayout
      stage={
        <div className="space-y-3">
          <Stage><House s={s} on={on} onToggle={(k) => setS((x) => ({ ...x, [k]: !x[k] }))} /></Stage>
          <div className="grid gap-2 sm:grid-cols-3">
            {DEVICES.map((d) => (
              <button key={d.id} type="button" aria-pressed={dev === d.id} onClick={() => setDev(d.id)} className={cn("rounded-xl border p-2.5 text-left transition-colors", dev === d.id ? "border-brand bg-brand/10" : "border-line bg-surface hover:border-brand/40")}>
                <span className="flex items-center justify-between text-sm font-semibold text-fg">{d.label}<span className={cn("rounded px-1.5 font-mono text-xs", on[d.id] ? "bg-success/20 text-success-fg" : "bg-surface-2 text-muted")}>{on[d.id] ? "True" : "False"}</span></span>
                <span className="mt-1 block font-mono text-[11px] text-muted">{exprText(ex[d.id])}</span>
              </button>
            ))}
          </div>
        </div>
      }
      controls={
        <>
          <Panel title="Cảm biến (bấm trong nhà hoặc ở đây)">{SENSORS.map((x) => <SimToggle key={x.id} label={`${x.label} (${x.id})`} checked={s[x.id]} onChange={(v) => setS((y) => ({ ...y, [x.id]: v }))} />)}</Panel>
          <Panel title={`Luật cho ${DEVICES.find((d) => d.id === dev)!.label.toLowerCase()}`}><ExprEditor e={ex[dev]} onChange={(e) => setEx((x) => ({ ...x, [dev]: e }))} /></Panel>
          <Panel title="Bảng chân trị"><TruthTable e={ex[dev]} /></Panel>
          <ResetAll onClick={() => { setS({ ...BLANK, toi: true }); setEx(START); setDev("den"); }} />
        </>
      }
    />
  );
}

const TASKS: { prompt: string; want: Expr; why: string }[] = [
  { prompt: "Đèn hiên chỉ sáng khi trời tối VÀ có người đứng ở cửa.", want: { a: "toi", na: false, op: "and", b: "nguoi", nb: false }, why: "Cả hai điều kiện cùng đúng → AND." },
  { prompt: "Còi báo trộm kêu khi cả nhà đi vắng mà cửa lại mở.", want: { a: "vang", na: false, op: "and", b: "cua", nb: false }, why: "Đi vắng AND cửa mở." },
  { prompt: "Cửa sổ tự đóng khi trời mưa HOẶC cả nhà đi vắng.", want: { a: "mua", na: false, op: "or", b: "vang", nb: false }, why: "Chỉ cần một trong hai điều kiện → OR." },
  { prompt: "Vòi tưới chỉ chạy khi KHÔNG mưa và trời KHÔNG tối.", want: { a: "mua", na: true, op: "and", b: "toi", nb: true }, why: "not mua and not toi." },
  { prompt: "Đèn hành lang sáng khi trời tối, trừ lúc cả nhà đi vắng.", want: { a: "toi", na: false, op: "and", b: "vang", nb: true }, why: "toi and not vang." },
];

function Game() {
  const c = useChallenge(TASKS.length);
  const t = TASKS[Math.min(c.idx, TASKS.length - 1)];
  const [e, setE] = useState<Expr>({ a: "toi", na: false, op: "or", b: "nguoi", nb: false });
  const key = `${c.run}-${c.idx}`;
  const [seen, setSeen] = useState(key);
  if (seen !== key) { setSeen(key); setE({ a: "toi", na: false, op: "or", b: "nguoi", nb: false }); }
  const check = () => {
    if (same(e, t.want)) return c.check(true, `Đúng. ${t.why}`);
    const bad = ALL_STATES.find((s) => evalExpr(e, s) !== evalExpr(t.want, s))!;
    const desc = SENSORS.filter((x) => x.id === e.a || x.id === e.b || x.id === t.want.a || x.id === t.want.b).map((x) => `${label(x.id)}: ${bad[x.id] ? "có" : "không"}`).join(", ");
    c.check(false, `Chưa đúng. Thử tình huống ${desc}: luật của em cho ${evalExpr(e, bad) ? "True" : "False"}, nhưng cần ${evalExpr(t.want, bad) ? "True" : "False"}.`);
  };
  return (
    <ChallengeFrame c={c} prompt={t.prompt} onCheck={check} summary={["AND đúng khi cả hai vế đều đúng.", "OR đúng khi ít nhất một vế đúng.", "NOT đảo giá trị: True thành False và ngược lại.", "Bảng chân trị liệt kê mọi trường hợp đầu vào để kiểm tra một biểu thức."]}>
      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_260px]">
        <Panel title="Lắp biểu thức"><ExprEditor e={e} onChange={setE} /></Panel>
        <Panel title="Bảng chân trị"><TruthTable e={e} /></Panel>
      </div>
    </ChallengeFrame>
  );
}

export function SmartHomeLab() {
  return <SimShell title="Ngôi nhà thông minh" screens={[{ id: "kham-pha", label: "Khám phá", render: () => <Explore /> }, { id: "thu-thach", label: "Thử thách", render: () => <Game /> }]} />;
}
