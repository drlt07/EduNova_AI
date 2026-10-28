"use client";
/**
 * Tin 10 Bài 22–23 – Toa tàu danh sách (kiểu PhET).
 * Danh sách vẽ thành đoàn toa: mỗi toa một phần tử, chỉ số dương ở trên, chỉ số âm ở dưới.
 * Bảng lệnh: append, insert, remove, pop, gán a[i], del, kiểm tra in, len; mỗi lệnh hiện câu Python và kết quả ngay.
 * Thử thách: dự đoán danh sách sau một chuỗi lệnh, biến danh sách đầu thành danh sách đích.
 */
import { useState } from "react";
import { ListOrdered, TrainFront } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { ChallengeFrame, Panel, Readout, ResetAll, SimLayout, SimShell, SimToggle, Stage, useChallenge } from "./kit";

type V = string;
const START: V[] = ["Toán", "Văn", "Tin", "Anh"];
const show = (a: V[]) => `[${a.map((x) => (isNaN(Number(x)) ? `'${x}'` : x)).join(", ")}]`;
type Op = { kind: "append"; x: V } | { kind: "insert"; i: number; x: V } | { kind: "remove"; x: V } | { kind: "pop" } | { kind: "set"; i: number; x: V } | { kind: "del"; i: number };
const lit = (x: V) => (isNaN(Number(x)) ? `'${x}'` : x);
const opCode = (o: Op) => o.kind === "append" ? `a.append(${lit(o.x)})` : o.kind === "insert" ? `a.insert(${o.i}, ${lit(o.x)})` : o.kind === "remove" ? `a.remove(${lit(o.x)})` : o.kind === "pop" ? "a.pop()" : o.kind === "set" ? `a[${o.i}] = ${lit(o.x)}` : `del a[${o.i}]`;
function apply(a: V[], o: Op): { a: V[]; err?: string; note: string } {
  const n = a.length;
  const idx = (i: number) => (i < 0 ? n + i : i);
  switch (o.kind) {
    case "append": return { a: [...a, o.x], note: `Thêm ${o.x} vào cuối.` };
    case "insert": { const k = Math.max(0, Math.min(n, idx(o.i))); return { a: [...a.slice(0, k), o.x, ...a.slice(k)], note: `Chèn ${o.x} vào vị trí ${k}, các phần tử sau dịch phải.` }; }
    case "remove": { const k = a.indexOf(o.x); return k < 0 ? { a, err: `ValueError: không có ${o.x} trong danh sách.`, note: "" } : { a: [...a.slice(0, k), ...a.slice(k + 1)], note: `Xóa ${o.x} đầu tiên tìm thấy (vị trí ${k}).` }; }
    case "pop": return n ? { a: a.slice(0, -1), note: `Lấy ra phần tử cuối: ${a[n - 1]}.` } : { a, err: "IndexError: danh sách rỗng.", note: "" };
    case "set": { const k = idx(o.i); return k < 0 || k >= n ? { a, err: `IndexError: chỉ số ${o.i} nằm ngoài 0…${n - 1}.`, note: "" } : { a: a.map((x, j) => (j === k ? o.x : x)), note: `Thay phần tử vị trí ${k}.` }; }
    case "del": { const k = idx(o.i); return k < 0 || k >= n ? { a, err: `IndexError: chỉ số ${o.i} nằm ngoài 0…${n - 1}.`, note: "" } : { a: [...a.slice(0, k), ...a.slice(k + 1)], note: `Xóa phần tử vị trí ${k}.` }; }
  }
}

function Train({ a, hi, neg }: { a: V[]; hi?: number; neg: boolean }) {
  return (
    <div className="flex items-end justify-center gap-1 overflow-x-auto pb-2">
      <span className="grid h-16 w-10 shrink-0 place-items-center rounded-l-2xl rounded-r-md bg-rose-500 text-white" aria-hidden><TrainFront className="size-5" /></span>
      {a.map((x, i) => (
        <div key={`${i}-${x}`} className="flex shrink-0 flex-col items-center">
          <span className="font-mono text-xs font-bold text-cyan-300">{i}</span>
          <span className={cn("grid h-14 min-w-16 place-items-center rounded-lg border-b-4 px-2 font-semibold transition-all duration-300", i === hi ? "border-amber-500 bg-amber-300 text-slate-900" : "border-blue-800 bg-blue-500 text-white")}>{x}</span>
          <span className="mt-0.5 flex gap-3" aria-hidden><span className="size-3 rounded-full bg-slate-500" /><span className="size-3 rounded-full bg-slate-500" /></span>
          {neg && <span className="font-mono text-[11px] text-pink-300">{i - a.length}</span>}
        </div>
      ))}
      {a.length === 0 && <span className="px-4 py-5 text-sm text-slate-400">[ ] danh sách rỗng</span>}
    </div>
  );
}

function Explore() {
  const [a, setA] = useState<V[]>(START);
  const [x, setX] = useState("Sử");
  const [i, setI] = useState(1);
  const [neg, setNeg] = useState(true);
  const [log, setLog] = useState<{ code: string; out: string; err?: boolean }[]>([]);
  const [hi, setHi] = useState<number | undefined>();
  const run = (o: Op) => {
    const r = apply(a, o);
    setLog((l) => [...l.slice(-5), { code: opCode(o), out: r.err ?? `${show(r.a)}  # ${r.note}`, err: !!r.err }]);
    if (!r.err) { setA(r.a); setHi(o.kind === "append" ? r.a.length - 1 : o.kind === "insert" || o.kind === "set" ? Math.max(0, Math.min(r.a.length - 1, o.i < 0 ? a.length + o.i : o.i)) : undefined); }
  };
  return (
    <SimLayout
      stage={
        <Stage dark className="space-y-4 p-4 sm:p-6">
          <p className="text-center font-mono text-sm text-slate-300">a = {show(a)}</p>
          <Train a={a} hi={hi} neg={neg} />
          <pre className="min-h-24 rounded-xl bg-black/40 p-3 font-mono text-xs leading-6" aria-live="polite">{log.length ? log.map((l, k) => <div key={k}><span className="text-slate-400">&gt;&gt;&gt; </span><span className="text-emerald-300">{l.code}</span><div className={l.err ? "text-rose-300" : "text-slate-200"}>{l.out}</div></div>) : <span className="text-slate-500">Bấm một lệnh ở bảng bên phải.</span>}</pre>
        </Stage>
      }
      controls={
        <>
          <Panel title="Giá trị và vị trí">
            <div className="grid grid-cols-2 gap-2">
              <Input aria-label="Giá trị x" value={x} onChange={(e) => setX(e.target.value.trim() || "x")} />
              <Input aria-label="Chỉ số i" inputMode="numeric" value={i} onChange={(e) => setI(Number(e.target.value.replace(/[^-\d]/g, "")) || 0)} />
            </div>
          </Panel>
          <Panel title="Lệnh">
            <div className="grid grid-cols-2 gap-1.5 font-mono text-xs">
              {([[`append(x)`, { kind: "append", x }], [`insert(i, x)`, { kind: "insert", i, x }], [`remove(x)`, { kind: "remove", x }], [`pop()`, { kind: "pop" }], [`a[i] = x`, { kind: "set", i, x }], [`del a[i]`, { kind: "del", i }]] as [string, Op][]).map(([l, o]) => <Button key={l} size="sm" variant="secondary" className="font-mono" onClick={() => run(o)}>{l}</Button>)}
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <Button size="sm" variant="ghost" className="font-mono text-xs" onClick={() => setLog((l) => [...l.slice(-5), { code: `${lit(x)} in a`, out: String(a.includes(x) ? "True" : "False") }])}>x in a</Button>
              <Button size="sm" variant="ghost" className="font-mono text-xs" onClick={() => setLog((l) => [...l.slice(-5), { code: `a[${i}]`, out: a[i < 0 ? a.length + i : i] !== undefined ? lit(a[i < 0 ? a.length + i : i]) : "IndexError", err: a[i < 0 ? a.length + i : i] === undefined }])}>a[i]</Button>
            </div>
          </Panel>
          <Panel title="Hiển thị"><SimToggle label="Chỉ số âm" checked={neg} onChange={setNeg} /></Panel>
          <div className="grid grid-cols-2 gap-2"><Readout label="len(a)" value={a.length} /><Readout label="Chỉ số cuối" value={a.length - 1} tone="green" /></div>
          <ResetAll onClick={() => { setA(START); setX("Sử"); setI(1); setLog([]); setHi(undefined); setNeg(true); }} />
        </>
      }
    />
  );
}

type Task = { kind: "predict"; start: V[]; ops: Op[] } | { kind: "build"; start: V[]; goal: V[] } | { kind: "index"; start: V[]; want: V };
const TASKS: Task[] = [
  { kind: "predict", start: ["1", "2", "3"], ops: [{ kind: "append", x: "4" }, { kind: "insert", i: 0, x: "0" }] },
  { kind: "index", start: ["Toán", "Văn", "Tin", "Anh"], want: "Anh" },
  { kind: "predict", start: ["5", "7", "5", "9"], ops: [{ kind: "remove", x: "5" }, { kind: "pop" }] },
  { kind: "build", start: ["A", "C", "D"], goal: ["A", "B", "C"] },
  { kind: "predict", start: ["2", "4", "6"], ops: [{ kind: "set", i: -1, x: "8" }, { kind: "del", i: 0 }] },
];

function Game() {
  const c = useChallenge(TASKS.length);
  const t = TASKS[Math.min(c.idx, TASKS.length - 1)];
  const [typed, setTyped] = useState("");
  const [a, setA] = useState<V[]>(t.start);
  const [x, setX] = useState("B");
  const [i, setI] = useState(1);
  const [used, setUsed] = useState<string[]>([]);
  const key = `${c.run}-${c.idx}`;
  const [seen, setSeen] = useState(key);
  if (seen !== key) { setSeen(key); setTyped(""); setA(t.start); setUsed([]); setX("B"); setI(1); }
  const norm = (s: string) => s.replace(/['"\s]/g, "");
  const prompt = t.kind === "predict" ? <>a = {show(t.start)}. Sau các lệnh dưới đây, a bằng gì? <span className="block font-mono text-sm font-normal">{t.ops.map(opCode).join("; ")}</span></> : t.kind === "index" ? `Viết chỉ số (dương hoặc âm) để lấy ra phần tử ${t.want}.` : `Biến a = ${show(t.start)} thành ${show(t.goal)} bằng các lệnh.`;
  const check = () => {
    if (t.kind === "predict") { const r = t.ops.reduce((s, o) => apply(s, o).a, t.start); const ok = norm(typed) === norm(show(r)); return c.check(ok, ok ? `Đúng: ${show(r)}.` : "Chạy lần lượt từng lệnh trên toa tàu trong đầu."); }
    if (t.kind === "index") { const k = Number(typed); const v = t.start[k < 0 ? t.start.length + k : k]; return c.check(typed !== "" && v === t.want, v === t.want ? `Đúng: a[${k}] = ${t.want}. Chỉ số bắt đầu từ 0; a[-1] là phần tử cuối.` : `a[${typed}] là ${v ?? "ngoài danh sách"}.`); }
    const ok = a.join() === t.goal.join();
    return c.check(ok, ok ? `Xong với ${used.length} lệnh: ${used.join("; ")}.` : `Hiện a = ${show(a)}.`);
  };
  const run = (o: Op) => { const r = apply(a, o); if (!r.err) { setA(r.a); setUsed([...used, opCode(o)]); } };
  return (
    <ChallengeFrame c={c} prompt={prompt} onCheck={check} summary={["Chỉ số bắt đầu từ 0; chỉ số âm đếm từ cuối (a[-1] là phần tử cuối).", "append thêm cuối, insert chèn tại vị trí, remove xóa theo giá trị, pop lấy phần tử cuối, del xóa theo vị trí.", "Truy cập chỉ số ngoài 0…len−1 gây IndexError."]}>
      <Stage dark className="space-y-3 p-4">
        <Train a={t.kind === "build" ? a : t.start} neg={t.kind !== "index"} />
        {t.kind === "build" ? (
          <div className="flex flex-wrap items-center gap-2">
            <Input aria-label="Giá trị" className="w-20" value={x} onChange={(e) => setX(e.target.value.trim())} />
            <Input aria-label="Chỉ số" className="w-16" value={i} onChange={(e) => setI(Number(e.target.value.replace(/[^-\d]/g, "")) || 0)} />
            {([["insert(i, x)", { kind: "insert", i, x }], ["remove(x)", { kind: "remove", x }], ["append(x)", { kind: "append", x }], ["pop()", { kind: "pop" }]] as [string, Op][]).map(([l, o]) => <Button key={l} size="sm" variant="secondary" className="font-mono text-xs" onClick={() => run(o)}>{l}</Button>)}
            <Button size="sm" variant="ghost" onClick={() => { setA(t.start); setUsed([]); }}><ListOrdered /> Làm lại</Button>
          </div>
        ) : <Input aria-label="Câu trả lời" className="max-w-72 font-mono" placeholder={t.kind === "index" ? "vd 3 hoặc -1" : "vd [0, 1, 2]"} value={typed} onChange={(e) => setTyped(e.target.value)} />}
      </Stage>
    </ChallengeFrame>
  );
}

export function ListLab() {
  return <SimShell title="Toa tàu danh sách" screens={[{ id: "kham-pha", label: "Danh sách", icon: TrainFront, render: () => <Explore /> }, { id: "thu-thach", label: "Thử thách", render: () => <Game /> }]} />;
}
