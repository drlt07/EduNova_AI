"use client";
/**
 * Tin 10 Bài 26–27 – Máy hàm (kiểu PhET).
 * Hàm vẽ thành cỗ máy: đối số đi vào phễu, rơi vào các ô tham số bên trong máy, máy chạy thân hàm,
 * giá trị return rơi ra khay. Bật "vùng nhớ" để thấy biến cục bộ chỉ sống trong lúc hàm chạy;
 * bật "quên return" để thấy máy chạy mà khay ra None. Mọi phép tính chạy bằng trình thông dịch Python thật.
 * Thử thách: dự đoán kết quả lời gọi, chọn lời gọi hợp lệ, phạm vi biến, sửa hàm thiếu return.
 */
import { useState } from "react";
import { Cog, Sigma } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/form";
import { runPython } from "@/lib/py/interpreter";
import { ChallengeFrame, Panel, Readout, ResetAll, Segmented, SimLayout, SimShell, SimSlider, SimToggle, Stage, useChallenge } from "./kit";

interface Fn { name: string; params: string[]; body: string[]; label: string }
const FNS: Record<string, Fn> = {
  bp: { name: "binh_phuong", params: ["x"], body: ["kq = x * x", "return kq"], label: "Bình phương" },
  tong: { name: "tong", params: ["a", "b"], body: ["kq = a + b", "return kq"], label: "Tổng hai số" },
  f: { name: "doi_do", params: ["c"], body: ["f = c * 9 / 5 + 32", "return f"], label: "Độ C → độ F" },
  max: { name: "lon_hon", params: ["a", "b"], body: ["if a > b:", "    return a", "return b"], label: "Số lớn hơn" },
};
const src = (f: Fn, forget = false) => [`def ${f.name}(${f.params.join(", ")}):`, ...f.body.map((l) => `    ${forget ? l.replace(/return (\w+)/, "print($1)") : l}`)].join("\n");

function call(f: Fn, args: number[], forget: boolean) {
  const code = `${src(f, forget)}\nketqua = ${f.name}(${args.join(", ")})`;
  const r = runPython(code, { trace: true, echoInput: false });
  const inside = r.trace.filter((s) => s.scope !== "global");
  const local = (inside[inside.length - 1]?.vars ?? []).filter((v) => v.type !== "function").map((v) => ({ ...v, name: v.name.split(".").pop()! }));
  const ret = r.trace[r.trace.length - 1]?.vars.find((v) => v.name === "ketqua")?.value ?? "?";
  return { ok: r.ok, ret, local, out: r.output.trim(), globals: r.trace[r.trace.length - 1]?.vars.filter((v) => v.name !== "ketqua" && !v.name.includes(".") && v.type !== "function") ?? [], error: r.error?.explain };
}

function Machine({ f, args, res, forget, showMem }: { f: Fn; args: number[]; res: ReturnType<typeof call>; forget: boolean; showMem: boolean }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex gap-2">{args.map((a, i) => <span key={i} className="grid size-11 place-items-center rounded-full bg-amber-300 font-mono text-lg font-bold text-slate-900 shadow">{a}</span>)}</div>
      <div className="h-6 w-28 bg-gradient-to-b from-slate-500 to-slate-700 [clip-path:polygon(0_0,100%_0,70%_100%,30%_100%)]" aria-hidden />
      <div className="relative w-full max-w-md rounded-3xl border-4 border-slate-500 bg-gradient-to-b from-slate-700 to-slate-800 p-4 shadow-xl">
        <Cog className="absolute -right-3 -top-3 size-9 animate-spin text-slate-400 [animation-duration:6s]" aria-hidden />
        <p className="mb-2 text-center font-mono text-sm font-bold text-cyan-300">{f.name}({f.params.join(", ")})</p>
        <div className="mb-2 flex justify-center gap-2">{f.params.map((p, i) => <span key={p} className="flex flex-col items-center"><span className="font-mono text-[11px] text-slate-300">{p}</span><span className="grid h-10 min-w-12 place-items-center rounded-lg border-2 border-cyan-400 bg-slate-900 px-2 font-mono font-bold text-white">{args[i]}</span></span>)}</div>
        <pre className="rounded-xl bg-black/40 p-2 font-mono text-xs leading-5 text-slate-200">{src(f, forget)}</pre>
        {showMem && <div className="mt-2 rounded-xl border border-dashed border-cyan-500/60 p-2"><p className="text-[10px] font-bold uppercase tracking-wide text-cyan-300">Vùng nhớ của hàm (mất khi hàm xong)</p><p className="font-mono text-xs text-slate-200">{res.local.map((v) => `${v.name} = ${v.value}`).join(" · ") || "—"}</p></div>}
      </div>
      <div className="h-5 w-3 bg-slate-600" aria-hidden />
      <div className={cn("flex min-w-40 flex-col items-center rounded-2xl border-4 px-6 py-2", res.ret === "None" ? "border-rose-400 bg-rose-500/15" : "border-emerald-400 bg-emerald-500/15")}>
        <span className="text-[11px] font-bold uppercase text-slate-300">Giá trị trả về</span>
        <span className="font-mono text-2xl font-bold text-white" aria-live="polite">{res.ret}</span>
      </div>
      {res.out && <p className="font-mono text-xs text-amber-200">Màn hình in: {res.out}</p>}
    </div>
  );
}

function Explore() {
  const [fid, setFid] = useState("tong");
  const [x, setX] = useState(3);
  const [y, setY] = useState(5);
  const [forget, setForget] = useState(false);
  const [mem, setMem] = useState(true);
  const f = FNS[fid];
  const args = [x, y].slice(0, f.params.length);
  const res = call(f, args, forget);
  return (
    <SimLayout
      stage={
        <Stage dark className="space-y-3 p-4 sm:p-6">
          <Machine f={f} args={args} res={res} forget={forget} showMem={mem} />
          <pre className="rounded-xl bg-black/40 p-3 font-mono text-xs text-emerald-300">ketqua = {f.name}({args.join(", ")}){"\n"}<span className="text-slate-400"># ketqua = {res.ret}</span>{mem && <>{"\n"}<span className="text-slate-400"># ngoài hàm chỉ còn: ketqua{res.globals.length ? `, ${res.globals.map((v) => v.name).join(", ")}` : ""} — không thấy {f.params.join(", ")}</span></>}</pre>
          {forget && <p role="status" className="rounded-xl bg-rose-500/15 px-3 py-2 text-sm text-rose-200">Hàm chỉ in ra màn hình mà không return, nên giá trị trả về là None — không dùng tiếp được trong phép tính.</p>}
        </Stage>
      }
      controls={
        <>
          <Panel title="Hàm">
            <Segmented label="Chọn máy" value={fid} options={Object.entries(FNS).map(([k, v]) => ({ value: k, label: v.label }))} onChange={setFid} />
          </Panel>
          <Panel title="Đối số">
            <SimSlider label={f.params[0]} value={x} min={-10} max={40} onChange={setX} />
            {f.params.length > 1 && <SimSlider label={f.params[1]} value={y} min={-10} max={40} onChange={setY} />}
          </Panel>
          <Panel title="Thử">
            <SimToggle label="Vùng nhớ của hàm" checked={mem} onChange={setMem} />
            <SimToggle label="Quên return (dùng print)" checked={forget} onChange={setForget} />
          </Panel>
          <div className="grid grid-cols-2 gap-2"><Readout label="Tham số" value={f.params.length} /><Readout label="Trả về" value={res.ret} tone={res.ret === "None" ? "rose" : "green"} /></div>
          <ResetAll onClick={() => { setFid("tong"); setX(3); setY(5); setForget(false); setMem(true); }} />
        </>
      }
    />
  );
}

type Task = { kind: "predict"; code: string } | { kind: "valid" } | { kind: "scope" } | { kind: "fix" };
const TASKS: Task[] = [
  { kind: "predict", code: "def tang(n):\n    return n + 1\n\nprint(tang(tang(3)))" },
  { kind: "valid" },
  { kind: "predict", code: "def dien_tich(d, r):\n    return d * r\n\nprint(dien_tich(4, 2) + dien_tich(1, 3))" },
  { kind: "scope" },
  { kind: "fix" },
];
const CALLS = ["tong(5)", "tong(2, 7)", "tong(1, 2, 3)", "tong[2, 7]"];
const SCOPE = "x = 10\ndef doi():\n    x = 99\n    return x\n\ndoi()\nprint(x)";
const FIXES = ["print(a * b)", "return a * b", "a * b", "nhan = a * b"];

function Game() {
  const c = useChallenge(TASKS.length);
  const t = TASKS[Math.min(c.idx, TASKS.length - 1)];
  const [typed, setTyped] = useState("");
  const [pick, setPick] = useState<number | null>(null);
  const key = `${c.run}-${c.idx}`;
  const [seen, setSeen] = useState(key);
  if (seen !== key) { setSeen(key); setTyped(""); setPick(null); }
  const out = (code: string) => runPython(code, { trace: false, echoInput: false }).output.trim();
  const prompt = t.kind === "predict" ? "Chương trình in ra gì?" : t.kind === "valid" ? "Với def tong(a, b), lời gọi nào đúng?" : t.kind === "scope" ? "Chương trình in ra gì?" : "Hàm nhan(a, b) cần trả về tích để dùng trong phép tính. Dòng thân hàm nào đúng?";
  const check = () => {
    if (t.kind === "predict") { const o = out(t.code); return c.check(typed.trim() === o, typed.trim() === o ? `Đúng: in ${o}.` : "Tính từ lời gọi trong cùng ra ngoài; giá trị return thay vào chỗ lời gọi."); }
    if (t.kind === "valid") return c.check(pick === 1, pick === 1 ? "Đúng: hàm có 2 tham số nên lời gọi cần đúng 2 đối số, đặt trong ngoặc tròn." : "Số đối số phải bằng số tham số, và gọi hàm bằng ngoặc tròn ( ).");
    if (t.kind === "scope") { const o = out(SCOPE); return c.check(typed.trim() === o, typed.trim() === o ? "Đúng: x = 99 trong hàm là biến cục bộ mới, không đổi x bên ngoài." : "Biến gán trong hàm là biến cục bộ, chỉ sống trong hàm."); }
    if (pick === null) return c.check(false, "Chọn một dòng.");
    const o = out(`def nhan(a, b):\n    ${FIXES[pick]}\n\nprint(nhan(3, 4) + 1)`);
    return c.check(pick === 1, pick === 1 ? `Đúng: in ${o}.` : `Với dòng này, nhan(3, 4) trả về None nên phép cộng lỗi.`);
  };
  return (
    <ChallengeFrame c={c} prompt={prompt} onCheck={check} summary={["Hàm nhận đối số vào tham số, chạy thân hàm, return đưa kết quả ra chỗ gọi.", "Số đối số khi gọi phải khớp số tham số.", "Biến tạo trong hàm là cục bộ; thiếu return thì hàm trả về None."]}>
      <Stage dark className="space-y-3 p-4">
        {(t.kind === "predict" || t.kind === "scope") && <><pre className="rounded-xl bg-black/40 p-3 font-mono text-sm text-slate-100">{t.kind === "scope" ? SCOPE : t.code}</pre><Input aria-label="Câu trả lời" className="max-w-40 font-mono" value={typed} onChange={(e) => setTyped(e.target.value)} /></>}
        {t.kind === "valid" && <div className="grid gap-2 sm:grid-cols-2">{CALLS.map((x, i) => <button key={x} type="button" aria-pressed={pick === i} onClick={() => setPick(i)} className={cn("rounded-xl border-2 px-4 py-2 text-left font-mono", pick === i ? "border-cyan-300 bg-cyan-500/20 text-white" : "border-slate-600 text-slate-200")}>{x}</button>)}</div>}
        {t.kind === "fix" && <><pre className="rounded-xl bg-black/40 p-3 font-mono text-sm text-slate-100">{"def nhan(a, b):\n    ???\n\nprint(nhan(3, 4) + 1)"}</pre><div className="grid gap-2 sm:grid-cols-2">{FIXES.map((x, i) => <button key={x} type="button" aria-pressed={pick === i} onClick={() => setPick(i)} className={cn("rounded-xl border-2 px-4 py-2 text-left font-mono", pick === i ? "border-cyan-300 bg-cyan-500/20 text-white" : "border-slate-600 text-slate-200")}>{x}</button>)}</div></>}
      </Stage>
    </ChallengeFrame>
  );
}

export function FunctionMachineLab() {
  return <SimShell title="Máy hàm" screens={[{ id: "kham-pha", label: "Cỗ máy", icon: Cog, render: () => <Explore /> }, { id: "thu-thach", label: "Thử thách", icon: Sigma, render: () => <Game /> }]} />;
}
