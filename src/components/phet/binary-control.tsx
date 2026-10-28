"use client";
/** Tin 10 Bài 4 – Phòng điều khiển mã nhị phân: công tắc bit ↔ đèn ↔ số thập phân ↔ thanh số, tràn số khi cộng 1. */
import { useMemo, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/form";
import { ChallengeFrame, Panel, Readout, ResetAll, Segmented, SimLayout, SimShell, SimToggle, Stage, useChallenge } from "./kit";

const toBits = (n: number, w: number) => n.toString(2).padStart(w, "0").slice(-w);

function BitBoard({ value, width, onChange, showWeights = true, showLamps = true, disabled }: { value: number; width: number; onChange?: (n: number) => void; showWeights?: boolean; showLamps?: boolean; disabled?: boolean }) {
  const bits = toBits(value, width);
  return (
    <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
      {bits.split("").map((b, i) => {
        const weight = 2 ** (width - 1 - i);
        const on = b === "1";
        return (
          <div key={i} className="flex w-12 flex-col items-center gap-1.5 sm:w-14">
            {showLamps && <span aria-hidden className={cn("size-9 rounded-full border-4 transition-all sm:size-11", on ? "border-yellow-200 bg-yellow-300 shadow-[0_0_24px_6px_rgba(253,224,71,0.55)]" : "border-slate-600 bg-slate-700")} />}
            <button type="button" disabled={disabled || !onChange} aria-pressed={on} aria-label={`Công tắc bit giá trị ${weight}`} onClick={() => onChange?.(value ^ weight)} className={cn("relative h-16 w-9 rounded-lg border-2 transition-colors sm:w-10", on ? "border-emerald-300 bg-emerald-500" : "border-slate-500 bg-slate-600", onChange && !disabled && "hover:brightness-110")}>
              <span className={cn("absolute left-1/2 size-6 -translate-x-1/2 rounded-md bg-white shadow transition-all", on ? "top-1" : "bottom-1")} />
            </button>
            <span className="font-mono text-xl font-bold text-white">{b}</span>
            {showWeights && <span className="font-mono text-[11px] text-cyan-300">{weight}</span>}
          </div>
        );
      })}
    </div>
  );
}

function Explore() {
  const [width, setWidth] = useState(8);
  const [value, setValue] = useState(0);
  const [weights, setWeights] = useState(true);
  const [sum, setSum] = useState(true);
  const [overflow, setOverflow] = useState(false);
  const max = 2 ** width - 1;
  const bits = toBits(value, width);
  const parts = bits.split("").flatMap((b, i) => (b === "1" ? [2 ** (width - 1 - i)] : []));
  const step = (d: number) => {
    const n = value + d;
    setOverflow(n > max || n < 0);
    setValue(((n % (max + 1)) + max + 1) % (max + 1));
  };
  return (
    <SimLayout
      stage={
        <Stage dark className="p-4 sm:p-6">
          <p className="mb-4 text-center text-xs font-semibold uppercase tracking-widest text-slate-400">Bảng điều khiển {width} bit</p>
          <BitBoard value={value} width={width} onChange={(n) => { setValue(n); setOverflow(false); }} showWeights={weights} />
          {sum && (
            <p className="mt-5 text-center font-mono text-sm text-slate-300 [font-variant-ligatures:none]">
              {parts.length ? parts.join(" + ") : "0"} = <b className="text-2xl text-white">{value}</b>
            </p>
          )}
          <div className="mx-auto mt-5 max-w-xl">
            <div className="relative h-3 rounded-full bg-slate-700"><div className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500" style={{ width: `${(value / max) * 100}%` }} /></div>
            <div className="mt-1 flex justify-between font-mono text-[11px] text-slate-400"><span>0</span><span>{max}</span></div>
          </div>
          {overflow && <p role="status" className="mt-3 text-center text-sm font-semibold text-amber-300">Tràn số! {width} bit chỉ chứa được từ 0 đến {max}, nên số quay vòng.</p>}
        </Stage>
      }
      controls={
        <>
          <Panel title="Thập phân">
            <div className="flex items-center gap-2">
              <button type="button" aria-label="Bớt 1" onClick={() => step(-1)} className="grid size-9 place-items-center rounded-xl bg-surface shadow-sm hover:bg-line"><Minus className="size-4" /></button>
              <Input aria-label="Giá trị thập phân" inputMode="numeric" className="text-center font-mono text-lg" value={value} onChange={(e) => { const n = Number(e.target.value.replace(/\D/g, "")) || 0; setOverflow(n > max); setValue(Math.min(max, n)); }} />
              <button type="button" aria-label="Thêm 1" onClick={() => step(1)} className="grid size-9 place-items-center rounded-xl bg-surface shadow-sm hover:bg-line"><Plus className="size-4" /></button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Readout label="Nhị phân" value={bits} />
              <Readout label="Bộ nhớ" value={`${width} bit`} tone="green" />
            </div>
          </Panel>
          <Panel title="Độ dài">
            <Segmented label="Số bit" value={width} options={[{ value: 4, label: "4 bit" }, { value: 8, label: "8 bit (1 byte)" }]} onChange={(w) => { setWidth(w); setValue((v) => Math.min(v, 2 ** w - 1)); setOverflow(false); }} />
            <p className="text-xs text-muted">Số lớn nhất: 2<sup>{width}</sup> − 1 = <b className="text-fg">{max}</b></p>
          </Panel>
          <Panel title="Hiển thị">
            <SimToggle label="Giá trị mỗi bit" checked={weights} onChange={setWeights} />
            <SimToggle label="Phép cộng" checked={sum} onChange={setSum} />
          </Panel>
          <ResetAll onClick={() => { setWidth(8); setValue(0); setWeights(true); setSum(true); setOverflow(false); }} />
        </>
      }
    />
  );
}

type Task = { kind: "make"; target: number; width: number; hideWeights?: boolean } | { kind: "read"; value: number; width: number } | { kind: "max"; width: number };
const TASKS: Task[] = [
  { kind: "make", target: 13, width: 4 },
  { kind: "read", value: 0b10110, width: 8 },
  { kind: "make", target: 100, width: 8 },
  { kind: "max", width: 8 },
  { kind: "make", target: 37, width: 8, hideWeights: true },
];

function Game() {
  const c = useChallenge(TASKS.length);
  const t = TASKS[Math.min(c.idx, TASKS.length - 1)];
  const [value, setValue] = useState(0);
  const [typed, setTyped] = useState("");
  const key = `${c.run}-${c.idx}`;
  const [seen, setSeen] = useState(key);
  if (seen !== key) { setSeen(key); setValue(0); setTyped(""); }
  const prompt = useMemo(() => {
    if (t.kind === "make") return `Bật đúng các công tắc để tạo số ${t.target}${t.hideWeights ? " (đã ẩn giá trị mỗi bit)" : ""}.`;
    if (t.kind === "read") return "Dãy bit trên bảng biểu diễn số thập phân nào?";
    return `Với ${t.width} bit, số lớn nhất biểu diễn được là bao nhiêu? Bật công tắc để kiểm chứng rồi nhập số.`;
  }, [t]);
  const check = () => {
    if (t.kind === "make") return c.check(value === t.target, value === t.target ? `Đúng: ${toBits(value, t.width)} = ${t.target}.` : `Bảng đang là ${value}. Thử bật bit có giá trị lớn nhất mà không vượt quá ${t.target} trước.`);
    if (t.kind === "read") { const ok = Number(typed) === t.value; return c.check(ok, ok ? `Đúng: 16 + 4 + 2 = ${t.value}.` : "Cộng giá trị của các bit đang bật (bit 1)."); }
    const ok = Number(typed) === 2 ** t.width - 1;
    return c.check(ok, ok ? "Đúng: bật cả 8 bit được 255 = 2⁸ − 1." : "Bật tất cả công tắc rồi đọc giá trị.");
  };
  return (
    <ChallengeFrame c={c} prompt={prompt} onCheck={check} summary={["Mỗi bit có giá trị gấp đôi bit bên phải nó: 1, 2, 4, 8, 16…", "Số thập phân = tổng giá trị các bit 1.", "n bit biểu diễn được các số từ 0 đến 2ⁿ − 1; vượt quá thì tràn số."]}>
      <Stage dark className="p-5">
        {t.kind === "read" ? <BitBoard value={t.value} width={t.width} /> : <BitBoard value={value} width={t.width} onChange={setValue} showWeights={!(t.kind === "make" && t.hideWeights)} />}
        {t.kind !== "make" && <div className="mx-auto mt-4 max-w-xs"><Input aria-label="Câu trả lời" inputMode="numeric" className="text-center font-mono text-lg" placeholder="Nhập số thập phân" value={typed} onChange={(e) => setTyped(e.target.value.replace(/\D/g, ""))} /></div>}
      </Stage>
    </ChallengeFrame>
  );
}

export function BinaryControlLab() {
  return <SimShell title="Phòng điều khiển mã nhị phân" screens={[{ id: "kham-pha", label: "Khám phá", render: () => <Explore /> }, { id: "thu-thach", label: "Thử thách", render: () => <Game /> }]} />;
}
