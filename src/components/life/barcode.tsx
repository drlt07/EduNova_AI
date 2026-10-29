"use client";
/** Mã vạch EAN-13: 12 chữ số sản phẩm + 1 chữ số kiểm tra; máy quét tính lại để phát hiện đọc sai. */
import { useState } from "react";
import { Barcode, Minus, Plus, ScanLine } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/form";
import { ChallengeFrame, Panel, Readout, ResetAll, SimLayout, SimShell, SimToggle, Stage, useChallenge } from "@/components/phet/kit";

/** Chữ số kiểm tra EAN-13: vị trí lẻ nhân 1, chẵn nhân 3, lấy số bù để tròn chục. */
export function checkDigit(d12: number[]) {
  const sum = d12.reduce((s, d, i) => s + d * (i % 2 ? 3 : 1), 0);
  return (10 - (sum % 10)) % 10;
}
const L = ["0001101", "0011001", "0010011", "0111101", "0100011", "0110001", "0101111", "0111011", "0110111", "0001011"];
const G = ["0100111", "0110011", "0011011", "0100001", "0011101", "0111001", "0000101", "0010001", "0001001", "0010111"];
const R = L.map((p) => p.split("").map((b) => (b === "1" ? "0" : "1")).join(""));
const FIRST = ["LLLLLL", "LLGLGG", "LLGGLG", "LLGGGL", "LGLLGG", "LGGLLG", "LGGGLL", "LGLGLG", "LGLGGL", "LGGLGL"];
function bars(d: number[]) {
  const par = FIRST[d[0]];
  let s = "101";
  for (let i = 1; i <= 6; i++) s += (par[i - 1] === "L" ? L : G)[d[i]];
  s += "01010";
  for (let i = 7; i <= 12; i++) s += R[d[i]];
  return s + "101";
}

function Bars({ d, hi }: { d: number[]; hi?: number }) {
  const b = bars(d);
  return (
    <svg viewBox={`0 0 ${b.length + 14} 70`} className="mx-auto w-full max-w-md" role="img" aria-label={`Mã vạch ${d.join("")}`}>
      <rect width={b.length + 14} height={70} fill="white" />
      {b.split("").map((x, i) => x === "1" && <rect key={i} x={7 + i} y={4} width={1} height={i < 3 || (i >= 45 && i < 50) || i >= b.length - 3 ? 56 : 50} fill="#0f172a" />)}
      <text x={3} y={66} className="text-[8px]" fill="#0f172a">{d[0]}</text>
      {d.slice(1).map((x, i) => <text key={i} x={7 + 3 + (i < 6 ? i * 7 + 3 : i * 7 + 8)} y={66} className="text-[8px]" fill={hi === i + 1 ? "#e11d48" : "#0f172a"} fontWeight={i === 11 ? 700 : 400}>{x}</text>)}
    </svg>
  );
}

const START = [8, 9, 3, 5, 0, 0, 1, 2, 3, 4, 5, 6];
function Explore() {
  const [d, setD] = useState<number[]>(START);
  const [sel, setSel] = useState(11);
  const [misread, setMisread] = useState(false);
  const cd = checkDigit(d);
  const full = [...d, cd];
  const scanned = misread ? full.map((x, i) => (i === 5 ? (x + 3) % 10 : x)) : full;
  const ok = checkDigit(scanned.slice(0, 12)) === scanned[12];
  const sum = d.reduce((s, x, i) => s + x * (i % 2 ? 3 : 1), 0);
  return (
    <SimLayout
      stage={
        <Stage className="space-y-4 p-4">
          <div className="rounded-2xl bg-white p-4 shadow"><Bars d={full} hi={sel} /></div>
          <div className="flex flex-wrap justify-center gap-1">
            {full.map((x, i) => <button key={i} type="button" disabled={i === 12} onClick={() => setSel(i)} aria-pressed={sel === i} className={cn("w-9 rounded-lg border-2 py-1 text-center font-mono text-lg font-bold", i === 12 ? "border-emerald-500 bg-emerald-50 text-emerald-700" : sel === i ? "border-brand bg-brand/10 text-fg" : "border-line bg-surface text-fg")}><span className="block text-[9px] font-normal text-muted">×{i === 12 ? "?" : i % 2 ? 3 : 1}</span>{x}</button>)}
          </div>
          <p className="text-center font-mono text-sm text-fg">Tổng có trọng số = <b>{sum}</b> → chữ số kiểm tra = (10 − {sum % 10}) mod 10 = <b className="text-emerald-600">{cd}</b></p>
          <div className={cn("mx-auto flex max-w-md items-center gap-3 rounded-2xl border-2 p-3", ok ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-500/10" : "border-rose-400 bg-rose-50 dark:bg-rose-500/10")} role="status">
            <ScanLine className={cn("size-7", ok ? "text-emerald-600" : "text-rose-600")} aria-hidden />
            <p className="text-sm text-fg">Máy quét đọc: <b className="font-mono">{scanned.join("")}</b> — {ok ? "hợp lệ, cộng tiền sản phẩm." : "chữ số kiểm tra không khớp, kêu bíp, yêu cầu quét lại."}</p>
          </div>
        </Stage>
      }
      controls={
        <>
          <Panel title={`Chữ số thứ ${sel + 1}`}>
            <div className="flex items-center justify-center gap-3">
              <button type="button" aria-label="Giảm" onClick={() => setD(d.map((x, i) => (i === sel ? (x + 9) % 10 : x)))} className="grid size-10 place-items-center rounded-xl bg-surface shadow-sm hover:bg-line"><Minus className="size-4" /></button>
              <span className="w-10 text-center font-mono text-3xl font-bold text-fg">{d[sel]}</span>
              <button type="button" aria-label="Tăng" onClick={() => setD(d.map((x, i) => (i === sel ? (x + 1) % 10 : x)))} className="grid size-10 place-items-center rounded-xl bg-surface shadow-sm hover:bg-line"><Plus className="size-4" /></button>
            </div>
            <p className="text-xs text-muted">3 chữ số đầu (893) là mã quốc gia Việt Nam, tiếp theo là mã doanh nghiệp và mã sản phẩm.</p>
          </Panel>
          <Panel title="Máy quét"><SimToggle label="Đọc nhầm chữ số thứ 6" checked={misread} onChange={setMisread} /></Panel>
          <div className="grid grid-cols-2 gap-2"><Readout label="Kiểm tra" value={cd} tone="green" /><Readout label="Quét" value={ok ? "Hợp lệ" : "Lỗi"} tone={ok ? "green" : "rose"} /></div>
          <ResetAll onClick={() => { setD(START); setSel(11); setMisread(false); }} />
        </>
      }
    />
  );
}

const TASKS = [
  { kind: "compute" as const, d: [8, 9, 3, 1, 2, 3, 4, 5, 6, 7, 8, 9] },
  { kind: "find" as const, codes: ["8935001234569", "8935001234562", "8935001234560"] },
  { kind: "compute" as const, d: [8, 9, 3, 6, 0, 0, 0, 0, 1, 1, 1, 0] },
];
function Game() {
  const c = useChallenge(TASKS.length);
  const t = TASKS[Math.min(c.idx, TASKS.length - 1)];
  const [typed, setTyped] = useState("");
  const [pick, setPick] = useState<string | null>(null);
  const key = `${c.run}-${c.idx}`; const [seen, setSeen] = useState(key);
  if (seen !== key) { setSeen(key); setTyped(""); setPick(null); }
  const valid = (s: string) => { const n = s.split("").map(Number); return checkDigit(n.slice(0, 12)) === n[12]; };
  const prompt = t.kind === "compute" ? <>Tính chữ số kiểm tra cho <span className="font-mono">{t.d.join("")}</span>_ (vị trí lẻ ×1, chẵn ×3).</> : "Chỉ một mã dưới đây hợp lệ. Mã nào?";
  const check = () => {
    if (t.kind === "compute") { const cd = checkDigit(t.d); return c.check(Number(typed) === cd && typed !== "", Number(typed) === cd ? `Đúng: chữ số kiểm tra là ${cd}.` : "Cộng các chữ số ở vị trí 1, 3, 5… với 3 lần các chữ số ở vị trí 2, 4, 6…, rồi lấy số bù cho tròn chục."); }
    return c.check(!!pick && valid(pick), pick && valid(pick) ? "Đúng: chữ số cuối khớp với 12 chữ số đầu." : "Tính chữ số kiểm tra của 12 chữ số đầu rồi so với chữ số cuối.");
  };
  return (
    <ChallengeFrame c={c} prompt={prompt} onCheck={check} summary={["Mã vạch EAN-13 là 13 chữ số vẽ thành vạch đen trắng (bit 1 và 0).", "Chữ số cuối tính từ 12 chữ số đầu để máy quét tự phát hiện đọc nhầm.", "Đây là một thuật toán nhỏ chạy hàng tỉ lần mỗi ngày ở quầy thu ngân."]}>
      <Stage className="space-y-3 p-4">
        {t.kind === "compute" ? <><div className="rounded-xl bg-white p-3"><Bars d={[...t.d, 0]} /></div><Input aria-label="Chữ số kiểm tra" inputMode="numeric" className="max-w-24 text-center font-mono text-xl" value={typed} onChange={(e) => setTyped(e.target.value.replace(/\D/g, "").slice(0, 1))} /></>
          : <div className="grid gap-2 sm:grid-cols-3">{t.codes.map((s) => <button key={s} type="button" aria-pressed={pick === s} onClick={() => setPick(s)} className={cn("rounded-xl border-2 bg-white p-2 font-mono text-sm", pick === s ? "border-brand" : "border-line")}><Bars d={s.split("").map(Number)} /></button>)}</div>}
      </Stage>
    </ChallengeFrame>
  );
}

export function BarcodeLab() {
  return <SimShell title="Mã vạch siêu thị" screens={[{ id: "kham-pha", label: "Khám phá", icon: Barcode, render: () => <Explore /> }, { id: "thu-thach", label: "Thử thách", render: () => <Game /> }]} />;
}
