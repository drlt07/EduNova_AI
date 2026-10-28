"use client";
/**
 * Tin 10 Bài 24–25 – Kính lúp xâu kí tự (kiểu PhET).
 * Xâu vẽ thành dãy ô kí tự có chỉ số; ba thanh trượt start, stop, step tô các ô được cắt s[start:stop:step]
 * (ô stop có viền đứt để nhớ "không lấy"). Bảng lệnh: find, count, replace, upper, lower, split — kết quả hiện ngay.
 * Thử thách: dự đoán kết quả cắt, viết lát cắt lấy đúng đoạn, dùng lệnh xâu.
 */
import { useState } from "react";
import { Scissors, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/form";
import { ChallengeFrame, Panel, Readout, ResetAll, Segmented, SimLayout, SimShell, SimSlider, SimToggle, Stage, useChallenge } from "./kit";

/** Chỉ số được lấy bởi s[a:b:c] (c ≠ 0), giống Python. */
export function sliceIdx(n: number, a: number | null, b: number | null, c: number) {
  const norm = (v: number) => (v < 0 ? Math.max(c > 0 ? 0 : -1, n + v) : Math.min(v, c > 0 ? n : n - 1));
  const start = a === null ? (c > 0 ? 0 : n - 1) : norm(a);
  const stop = b === null ? (c > 0 ? n : -1) : norm(b);
  const out: number[] = [];
  for (let i = start; c > 0 ? i < stop : i > stop; i += c) out.push(i);
  return out;
}
const pyStr = (s: string) => `'${s}'`;

function Chars({ s, picked, stop, found, neg }: { s: string; picked: number[]; stop?: number; found?: number[]; neg: boolean }) {
  return (
    <div className="flex flex-wrap justify-center gap-1">
      {[...s].map((ch, i) => {
        const k = picked.indexOf(i);
        return (
          <div key={i} className="flex flex-col items-center">
            <span className="font-mono text-[11px] font-bold text-cyan-300">{i}</span>
            <span className={cn("relative grid size-11 place-items-center rounded-lg border-2 font-mono text-xl font-bold transition-all", k >= 0 ? "border-amber-300 bg-amber-300 text-slate-900 shadow-[0_0_14px_rgba(252,211,77,.5)]" : found?.includes(i) ? "border-emerald-300 bg-emerald-500/30 text-white" : "border-slate-600 bg-slate-800 text-slate-200", stop === i && "outline-2 outline-dashed outline-offset-2 outline-rose-400")}>
              {ch === " " ? "␣" : ch}
              {k >= 0 && <span className="absolute -top-2 -right-2 grid size-5 place-items-center rounded-full bg-slate-900 text-[10px] text-amber-300">{k + 1}</span>}
            </span>
            {neg && <span className="font-mono text-[10px] text-pink-300">{i - s.length}</span>}
          </div>
        );
      })}
    </div>
  );
}

function Explore() {
  const [s, setS] = useState("Ha Noi mua thu");
  const [a, setA] = useState(0);
  const [b, setB] = useState(6);
  const [step, setStep] = useState(1);
  const [neg, setNeg] = useState(false);
  const [sub, setSub] = useState("u");
  const [method, setMethod] = useState<"none" | "find" | "count" | "replace" | "upper" | "split">("none");
  const n = s.length;
  const picked = sliceIdx(n, a, b, step);
  const result = picked.map((i) => s[i]).join("");
  const idx = s.indexOf(sub);
  const found = method === "find" || method === "count" ? [...s].flatMap((_, i) => (sub && s.startsWith(sub, i) ? Array.from({ length: sub.length }, (_, j) => i + j) : [])) : [];
  const methodOut = method === "find" ? `${idx}${idx < 0 ? "  # không tìm thấy" : ""}` : method === "count" ? String(sub ? s.split(sub).length - 1 : 0) : method === "replace" ? pyStr(s.split(sub).join("*")) : method === "upper" ? pyStr(s.toUpperCase()) : method === "split" ? `[${s.split(/\s+/).filter(Boolean).map(pyStr).join(", ")}]` : "";
  const methodCode = method === "find" ? `s.find(${pyStr(sub)})` : method === "count" ? `s.count(${pyStr(sub)})` : method === "replace" ? `s.replace(${pyStr(sub)}, '*')` : method === "upper" ? "s.upper()" : method === "split" ? "s.split()" : "";
  return (
    <SimLayout
      stage={
        <Stage dark className="space-y-4 p-4 sm:p-6">
          <Chars s={s} picked={method === "none" ? picked : []} stop={method === "none" && step > 0 ? b : undefined} found={found} neg={neg} />
          <pre className="rounded-xl bg-black/40 p-3 font-mono text-sm leading-7" aria-live="polite">
            <span className="text-slate-400">&gt;&gt;&gt; </span><span className="text-emerald-300">s[{a}:{b}{step !== 1 ? `:${step}` : ""}]</span>{"\n"}<span className="text-amber-200">{pyStr(result)}</span>
            {method !== "none" && <>{"\n"}<span className="text-slate-400">&gt;&gt;&gt; </span><span className="text-emerald-300">{methodCode}</span>{"\n"}<span className="text-cyan-200">{methodOut}</span></>}
          </pre>
          <p className="text-center text-xs text-slate-400">Lấy từ vị trí start, dừng TRƯỚC vị trí stop (ô viền đứt), mỗi lần nhảy step ô.</p>
        </Stage>
      }
      controls={
        <>
          <Panel title="Xâu s">
            <Input aria-label="Xâu" value={s} onChange={(e) => { const v = e.target.value.slice(0, 20) || "a"; setS(v); setA((x) => Math.min(x, v.length)); setB((x) => Math.min(x, v.length)); }} />
          </Panel>
          <Panel title="Cắt xâu s[start:stop:step]">
            <SimSlider label="start" value={a} min={-n} max={n} onChange={setA} />
            <SimSlider label="stop" value={b} min={-n} max={n} onChange={setB} />
            <Segmented label="step" value={step} options={[-1, 1, 2, 3].map((v) => ({ value: v, label: String(v) }))} onChange={setStep} />
            <SimToggle label="Chỉ số âm" checked={neg} onChange={setNeg} />
          </Panel>
          <Panel title="Lệnh với xâu">
            <Segmented label="Lệnh" value={method} options={[{ value: "none", label: "—" }, { value: "find", label: "find" }, { value: "count", label: "count" }, { value: "replace", label: "replace" }, { value: "upper", label: "upper" }, { value: "split", label: "split" }]} onChange={setMethod} />
            {(method === "find" || method === "count" || method === "replace") && <Input aria-label="Xâu con" value={sub} onChange={(e) => setSub(e.target.value)} />}
          </Panel>
          <div className="grid grid-cols-2 gap-2"><Readout label="len(s)" value={n} /><Readout label="Lấy được" value={`${result.length} kí tự`} tone="amber" /></div>
          <ResetAll onClick={() => { setS("Ha Noi mua thu"); setA(0); setB(6); setStep(1); setNeg(false); setSub("u"); setMethod("none"); }} />
        </>
      }
    />
  );
}

type Task = { kind: "predict"; s: string; code: string; ans: string } | { kind: "write"; s: string; want: string };
const TASKS: Task[] = [
  { kind: "predict", s: "PYTHON", code: "s[1:4]", ans: "YTH" },
  { kind: "write", s: "THPT Le Loi", want: "Le" },
  { kind: "predict", s: "abcdef", code: "s[::2]", ans: "ace" },
  { kind: "predict", s: "Tin hoc", code: "s[-3:]", ans: "hoc" },
  { kind: "predict", s: "banana", code: "s.find('na')", ans: "2" },
];
function evalTask(s: string, code: string): string | null {
  const m = code.match(/^s\[(-?\d*):(-?\d*)(?::(-?\d+))?\]$/);
  if (m) { const st = m[3] ? Number(m[3]) : 1; if (!st) return null; return sliceIdx(s.length, m[1] === "" ? null : Number(m[1]), m[2] === "" ? null : Number(m[2]), st).map((i) => s[i]).join(""); }
  const f = code.match(/^s\.find\('(.*)'\)$/); if (f) return String(s.indexOf(f[1]));
  return null;
}

function Game() {
  const c = useChallenge(TASKS.length);
  const t = TASKS[Math.min(c.idx, TASKS.length - 1)];
  const [typed, setTyped] = useState("");
  const [shown, setShown] = useState<number[]>([]);
  const key = `${c.run}-${c.idx}`;
  const [seen, setSeen] = useState(key);
  if (seen !== key) { setSeen(key); setTyped(""); setShown([]); }
  const prompt = t.kind === "predict" ? <>s = {pyStr(t.s)}. Kết quả của <code>{t.code}</code> là gì?</> : <>s = {pyStr(t.s)}. Viết lát cắt <code>s[…:…]</code> lấy ra đúng chữ “{t.want}”.</>;
  const check = () => {
    if (t.kind === "predict") { const m = t.code.match(/^s\[(-?\d*):(-?\d*)(?::(-?\d+))?\]$/); if (m) setShown(sliceIdx(t.s.length, m[1] === "" ? null : Number(m[1]), m[2] === "" ? null : Number(m[2]), m[3] ? Number(m[3]) : 1)); const ok = typed.replace(/['"]/g, "") === t.ans; return c.check(ok, ok ? `Đúng: ${t.code} = ${t.kind === "predict" && t.code.includes("find") ? t.ans : pyStr(t.ans)}.` : "Xem lại: chỉ số từ 0, stop không được lấy, step là bước nhảy."); }
    const code = typed.replace(/\s/g, "");
    const r = evalTask(t.s, code);
    const m = code.match(/^s\[(-?\d*):(-?\d*)\]$/);
    if (m) setShown(sliceIdx(t.s.length, m[1] === "" ? null : Number(m[1]), m[2] === "" ? null : Number(m[2]), 1));
    return c.check(r === t.want, r === null ? "Viết dạng s[a:b], ví dụ s[2:5]." : r === t.want ? `Đúng: ${code} = ${pyStr(r)}.` : `${code} cho ${pyStr(r)}.`);
  };
  return (
    <ChallengeFrame c={c} prompt={prompt} onCheck={check} summary={["Xâu là dãy kí tự có chỉ số từ 0; s[-1] là kí tự cuối.", "s[a:b] lấy từ a đến TRƯỚC b; s[::2] nhảy 2 bước; bỏ trống a/b là từ đầu/tới cuối.", "find trả về vị trí đầu tiên (−1 nếu không có); replace, upper, split tạo kết quả mới, không sửa s."]}>
      <Stage dark className="space-y-3 p-4">
        <Chars s={t.s} picked={shown} neg={t.kind === "predict" && t.code.includes("-")} />
        <Input aria-label="Câu trả lời" className="max-w-60 font-mono" placeholder={t.kind === "write" ? "s[ : ]" : "kết quả"} value={typed} onChange={(e) => setTyped(e.target.value)} />
      </Stage>
    </ChallengeFrame>
  );
}

export function StringLab() {
  return <SimShell title="Kính lúp xâu kí tự" screens={[{ id: "kham-pha", label: "Cắt xâu", icon: Scissors, render: () => <Explore /> }, { id: "thu-thach", label: "Thử thách", icon: Search, render: () => <Game /> }]} />;
}
