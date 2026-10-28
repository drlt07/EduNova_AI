"use client";
/**
 * Tin 10 Bài 17 – Hộp biến (kiểu PhET).
 * Chọn hoặc viết vài lệnh gán, kéo thanh bước để chạy từng dòng (trình thông dịch Python thật của EduNova);
 * mỗi biến là một hộp có nhãn tên, giá trị và kiểu; hộp vừa đổi sáng lên, dòng đang chạy được tô.
 * Thử thách: dự đoán giá trị cuối, chọn cách đổi chỗ hai biến đúng, nhận ra kiểu dữ liệu.
 */
import { useMemo, useState } from "react";
import { Boxes, SkipBack, SkipForward } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input, Textarea } from "@/components/ui/form";
import { runPython, type TraceStep } from "@/lib/py/interpreter";
import { ChallengeFrame, Panel, ResetAll, Segmented, SimLayout, SimShell, SimSlider, Stage, useChallenge } from "./kit";

const PRESETS: Record<string, { label: string; code: string }> = {
  gan: { label: "Gán và gán lại", code: "a = 5\nb = a\na = a + 3\nb = b * 2" },
  dem: { label: "Đếm tăng dần", code: "dem = 0\ndem = dem + 1\ndem = dem + 1\ndem += 5" },
  doi: { label: "Đổi chỗ", code: "x = 3\ny = 8\ntam = x\nx = y\ny = tam" },
  kieu: { label: "Các kiểu", code: "ten = 'An'\ntuoi = 16\ncao = 1.65\nloi_chao = 'Chào ' + ten" },
};
const TYPE_TONE: Record<string, string> = { int: "bg-blue-600", float: "bg-violet-600", str: "bg-emerald-600", bool: "bg-amber-500", list: "bg-rose-500" };

function useTrace(code: string) {
  return useMemo(() => {
    const r = runPython(code, { trace: true, echoInput: false });
    return { steps: r.trace, error: r.ok ? null : `Dòng ${r.error!.line}: ${r.error!.explain}` };
  }, [code]);
}

function MemoryBoxes({ step }: { step?: TraceStep }) {
  const vars = step?.vars ?? [];
  if (!vars.length) return <p className="py-8 text-center text-sm text-slate-400">Bộ nhớ chưa có biến nào.</p>;
  return (
    <div className="flex flex-wrap justify-center gap-4">
      {vars.map((v) => (
        <div key={v.name} className="flex flex-col items-center">
          <span className="rounded-t-lg bg-slate-700 px-3 py-0.5 font-mono text-sm font-bold text-white">{v.name}</span>
          <span className={cn("grid min-h-16 min-w-24 place-items-center rounded-xl border-4 bg-white px-3 font-mono text-xl font-bold text-slate-900 shadow transition-all duration-300", v.changed ? "scale-105 border-amber-400 shadow-[0_0_24px_rgba(251,191,36,.6)]" : "border-slate-300")}>{v.value}</span>
          <span className={cn("mt-1 rounded-full px-2 text-[10px] font-bold text-white", TYPE_TONE[v.type] ?? "bg-slate-500")}>{v.type}</span>
        </div>
      ))}
    </div>
  );
}

function CodeView({ code, line }: { code: string; line?: number }) {
  return <pre className="rounded-xl bg-[#0b1220] py-2 font-mono text-[13px] leading-6 text-slate-200">{code.split("\n").map((l, i) => <div key={i} className={cn("flex gap-3 px-3", line === i + 1 && "bg-cyan-400/20")}><span className="w-4 text-right text-slate-500">{i + 1}</span><span className="whitespace-pre">{l}</span></div>)}</pre>;
}

function Explore() {
  const [preset, setPreset] = useState("gan");
  const [code, setCode] = useState(PRESETS.gan.code);
  const { steps, error } = useTrace(code);
  const [i, setI] = useState(1);
  const n = steps.length;
  const cur = Math.min(i, n);
  const step = cur > 0 ? steps[cur - 1] : undefined;
  return (
    <SimLayout
      stage={
        <Stage dark className="space-y-4 p-4 sm:p-6">
          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
            <CodeView code={code} line={step?.line} />
            <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-4">
              <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">Bộ nhớ</p>
              <MemoryBoxes step={step} />
            </div>
          </div>
          {step && <p className="text-center text-sm text-cyan-200" aria-live="polite">Dòng {step.line}: {step.note}</p>}
          {error && <p className="rounded-xl bg-rose-500/20 px-3 py-2 text-sm text-rose-200">{error}</p>}
        </Stage>
      }
      controls={
        <>
          <Panel title="Chạy từng dòng">
            <SimSlider label="Bước" value={cur} min={0} max={n} onChange={setI} format={(v) => `${v}/${n}`} />
            <div className="grid grid-cols-2 gap-2">
              <button type="button" aria-label="Lùi một bước" onClick={() => setI(Math.max(0, cur - 1))} className="flex items-center justify-center rounded-xl bg-surface py-2 hover:bg-line"><SkipBack className="size-4" /></button>
              <button type="button" aria-label="Chạy một bước" onClick={() => setI(Math.min(n, cur + 1))} className="flex items-center justify-center rounded-xl bg-brand py-2 text-brand-ink"><SkipForward className="size-4" /></button>
            </div>
          </Panel>
          <Panel title="Chương trình">
            <Segmented label="Mẫu" value={preset} options={Object.entries(PRESETS).map(([k, v]) => ({ value: k, label: v.label }))} onChange={(k) => { setPreset(k); setCode(PRESETS[k].code); setI(1); }} />
            <Textarea aria-label="Sửa chương trình" className="min-h-28 font-mono text-xs" value={code} onChange={(e) => { setCode(e.target.value); setI(0); }} />
          </Panel>
          <ResetAll onClick={() => { setPreset("gan"); setCode(PRESETS.gan.code); setI(1); }} />
        </>
      }
    />
  );
}

type Task = { kind: "predict"; code: string; v: string } | { kind: "swap" } | { kind: "type"; code: string; v: string };
const TASKS: Task[] = [
  { kind: "predict", code: "a = 4\nb = a\na = 10", v: "b" },
  { kind: "predict", code: "s = 1\ns = s * 2\ns = s * 2\ns = s + s", v: "s" },
  { kind: "swap" },
  { kind: "type", code: "x = 7 / 2", v: "x" },
  { kind: "predict", code: "t = '5'\nt = t + '5'", v: "t" },
];
const SWAPS = ["x = y\ny = x", "tam = x\nx = y\ny = tam", "x = x\ny = y", "y = tam\ntam = x\nx = y"];

function Game() {
  const c = useChallenge(TASKS.length);
  const t = TASKS[Math.min(c.idx, TASKS.length - 1)];
  const [typed, setTyped] = useState("");
  const [pick, setPick] = useState<number | null>(null);
  const [shown, setShown] = useState<TraceStep | undefined>(undefined);
  const key = `${c.run}-${c.idx}`;
  const [seen, setSeen] = useState(key);
  if (seen !== key) { setSeen(key); setTyped(""); setPick(null); setShown(undefined); }
  const final = (code: string) => { const r = runPython(code, { trace: true, echoInput: false }); return r.trace[r.trace.length - 1]; };
  const prompt = t.kind === "predict" ? `Sau khi chạy xong, biến ${t.v} chứa giá trị gì?` : t.kind === "swap" ? "Với x = 3, y = 8, đoạn nào đổi được chỗ giá trị của x và y?" : `Biến ${t.v} có kiểu dữ liệu gì?`;
  const check = () => {
    if (t.kind === "swap") {
      if (pick === null) return c.check(false, "Chọn một đoạn code.");
      const r = runPython(`x = 3\ny = 8\n${SWAPS[pick]}`, { trace: true, echoInput: false });
      const last = r.trace[r.trace.length - 1]; setShown(r.ok ? last : undefined);
      const x = last?.vars.find((v) => v.name === "x")?.value, y = last?.vars.find((v) => v.name === "y")?.value;
      const ok = r.ok && x === "8" && y === "3";
      return c.check(ok, ok ? "Đúng: cần biến tạm giữ giá trị cũ của x trước khi ghi đè." : r.ok ? `Sau đoạn này x = ${x}, y = ${y}: giá trị cũ đã bị ghi đè.` : "Đoạn này lỗi: dùng biến tam khi chưa gán.");
    }
    const last = final(t.code); setShown(last);
    const v = last.vars.find((x) => x.name === t.v)!;
    const ans = typed.replace(/^["']|["']$/g, "");
    const ok = t.kind === "type" ? ans.toLowerCase() === v.type : ans === v.value.replace(/^'|'$/g, "");
    return c.check(ok, ok ? `Đúng: ${t.v} = ${v.value} (${v.type}).` : `Chưa đúng. Chạy lại từng dòng trong đầu: mỗi lệnh gán ghi đè giá trị cũ của biến bên trái.`);
  };
  return (
    <ChallengeFrame c={c} prompt={prompt} onCheck={check} summary={["Biến là tên của một vùng nhớ; lệnh gán ghi giá trị mới đè lên giá trị cũ.", "b = a chép giá trị của a vào b lúc đó; sửa a sau này không làm đổi b.", "Đổi chỗ hai biến cần biến tạm; kiểu của biến theo giá trị: int, float, str."]}>
      <Stage dark className="grid gap-4 p-4 md:grid-cols-2">
        <div className="space-y-3">
          {t.kind === "swap" ? <div className="grid gap-2">{SWAPS.map((s, i) => <button key={s} type="button" aria-pressed={pick === i} onClick={() => setPick(i)} className={cn("rounded-xl border-2 text-left", pick === i ? "border-cyan-300" : "border-slate-700")}><CodeView code={s} /></button>)}</div> : <CodeView code={t.code} />}
          {t.kind !== "swap" && <Input aria-label="Câu trả lời" className="max-w-56 font-mono" placeholder={t.kind === "type" ? "int / float / str" : "giá trị"} value={typed} onChange={(e) => setTyped(e.target.value)} />}
        </div>
        <div className="rounded-2xl border border-slate-700 p-4"><p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">Bộ nhớ sau khi chạy</p>{shown ? <MemoryBoxes step={shown} /> : <p className="py-8 text-center text-sm text-slate-400">Bấm Kiểm tra để xem.</p>}</div>
      </Stage>
    </ChallengeFrame>
  );
}

export function VariableBoxesLab() {
  return <SimShell title="Hộp biến" screens={[{ id: "kham-pha", label: "Bộ nhớ", icon: Boxes, render: () => <Explore /> }, { id: "thu-thach", label: "Thử thách", render: () => <Game /> }]} />;
}
