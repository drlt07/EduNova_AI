"use client";
/**
 * Tin 12 Bài 1–2 – Dạy robot phân loại xoài (kiểu PhET).
 * Màn Huấn luyện: biểu đồ màu vỏ × độ mềm; bấm vào biểu đồ để thêm một quả có nhãn đang chọn, bấm vào quả để bỏ.
 * Nền tô màu theo vùng quyết định của mô hình k láng giềng gần nhất (chỉnh k), lô xoài mới hiện độ chính xác ngay.
 * Thử thách: phân biệt AI với chương trình thường, giải thích thiên lệch, sửa dữ liệu cho mô hình đủ tốt.
 */
import { useState } from "react";
import { Brain, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { AI_OR_NOT, BIAS_ANSWER, BIAS_OPTIONS, EXTRA_KEO, LABEL_TEXT, TEST, TRAIN, type Label, type Mango } from "@/lib/sim/ai-mango";
import { ChallengeFrame, Panel, Readout, ResetAll, Segmented, SimLayout, SimShell, SimToggle, Stage, useChallenge } from "./kit";

const W = 360, PAD = 34;
const COLOR: Record<Label, string> = { chin: "#f59e0b", xanh: "#16a34a" };

function predictK(train: Mango[], color: number, soft: number, k: number): Label {
  if (!train.length) return "xanh";
  const near = [...train].sort((a, b) => Math.hypot(a.color - color, a.soft - soft) - Math.hypot(b.color - color, b.soft - soft)).slice(0, k);
  return near.filter((x) => x.label === "chin").length * 2 > near.length ? "chin" : "xanh";
}
const accuracy = (train: Mango[], k: number) => { const ok = TEST.filter((t) => predictK(train, t.color, t.soft, k) === t.label).length; return Math.round((ok / TEST.length) * 100); };

function Chart({ train, k, regions, test, onAdd, onRemove }: { train: Mango[]; k: number; regions: boolean; test: boolean; onAdd?: (c: number, s: number) => void; onRemove?: (id: string) => void }) {
  const n = 18;
  const px = (v: number) => PAD + v * (W - PAD - 8);
  const py = (v: number) => W - PAD - v * (W - PAD - 8);
  const click = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!onAdd) return;
    const r = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * W, y = ((e.clientY - r.top) / r.height) * W;
    const c = (x - PAD) / (W - PAD - 8), s = (W - PAD - y) / (W - PAD - 8);
    if (c >= 0 && c <= 1 && s >= 0 && s <= 1) onAdd(Math.round(c * 100) / 100, Math.round(s * 100) / 100);
  };
  return (
    <svg viewBox={`0 0 ${W} ${W}`} className="mx-auto w-full max-w-[460px] cursor-crosshair touch-none select-none" onClick={click} role="img" aria-label="Biểu đồ màu vỏ và độ mềm">
      {regions && Array.from({ length: n }, (_, r) => Array.from({ length: n }, (_, c) => { const l = predictK(train, (c + 0.5) / n, 1 - (r + 0.5) / n, k); return <rect key={`${r}-${c}`} x={px(c / n)} y={py(1 - r / n)} width={(W - PAD - 8) / n + 0.5} height={(W - PAD - 8) / n + 0.5} fill={COLOR[l]} opacity={0.16} />; }))}
      <rect x={PAD} y={8} width={W - PAD - 8} height={W - PAD - 8} fill="none" stroke="#94a3b8" />
      <text x={W / 2 + PAD / 2} y={W - 8} textAnchor="middle" className="fill-slate-500 text-[11px]">Màu vỏ: xanh lá → vàng</text>
      <text x={12} y={W / 2} textAnchor="middle" transform={`rotate(-90 12 ${W / 2})`} className="fill-slate-500 text-[11px]">Độ mềm: cứng → mềm</text>
      {test && TEST.map((t) => { const g = predictK(train, t.color, t.soft, k); const ok = g === t.label; return <g key={t.id}><rect x={px(t.color) - 7} y={py(t.soft) - 7} width={14} height={14} rx={3} fill="white" stroke={ok ? "#16a34a" : "#e11d48"} strokeWidth={2.5} /><text x={px(t.color)} y={py(t.soft) + 4} textAnchor="middle" className={cn("text-[10px] font-bold", ok ? "fill-emerald-700" : "fill-rose-600")}>{ok ? "✓" : "✗"}</text><title>{`${t.variety}: thật là ${LABEL_TEXT[t.label]}, máy đoán ${LABEL_TEXT[g]}`}</title></g>; })}
      {train.map((t) => <g key={t.id} onClick={(e) => { if (onRemove) { e.stopPropagation(); onRemove(t.id); } }} className={onRemove ? "cursor-pointer" : undefined}><ellipse cx={px(t.color)} cy={py(t.soft)} rx={9} ry={7} fill={COLOR[t.label]} stroke={t.variety === "Xoài keo" ? "#1e293b" : "white"} strokeWidth={2} /><title>{`${t.variety} – ${LABEL_TEXT[t.label]}`}</title></g>)}
    </svg>
  );
}

function Explore() {
  const [train, setTrain] = useState<Mango[]>(TRAIN);
  const [label, setLabel] = useState<Label>("chin");
  const [k, setK] = useState(3);
  const [regions, setRegions] = useState(true);
  const [test, setTest] = useState(true);
  const acc = accuracy(train, k);
  const keo = train.some((t) => t.variety === "Xoài keo");
  return (
    <SimLayout
      stage={
        <Stage className="p-3 sm:p-4">
          <Chart train={train} k={k} regions={regions} test={test} onAdd={(c, s) => setTrain([...train, { id: `u${Date.now()}`, variety: "Xoài cát", color: c, soft: s, label }])} onRemove={(id) => setTrain(train.filter((t) => t.id !== id))} />
          <p className="mt-2 text-center text-xs text-muted">Bấm vào biểu đồ để thêm một quả có nhãn “{LABEL_TEXT[label]}”; bấm vào quả để bỏ. Ô vuông là lô xoài mới về chợ.</p>
        </Stage>
      }
      controls={
        <>
          <Panel title="Độ chính xác trên lô mới">
            <div className="grid grid-cols-2 gap-2"><Readout label="Đúng" value={`${acc}%`} tone={acc >= 90 ? "green" : acc >= 70 ? "amber" : "rose"} /><Readout label="Dữ liệu" value={`${train.length} quả`} /></div>
            {!keo && acc < 90 && <p className="text-xs text-warning-fg">Máy hay đoán sai xoài keo: chín mà vỏ vẫn xanh. Dữ liệu dạy máy có loại này chưa?</p>}
          </Panel>
          <Panel title="Gán nhãn khi thêm">
            <Segmented label="Nhãn" value={label} options={[{ value: "chin", label: "Chín" }, { value: "xanh", label: "Còn xanh" }]} onChange={setLabel} />
            <button type="button" disabled={keo} onClick={() => setTrain([...train, ...EXTRA_KEO])} className="w-full rounded-lg bg-surface py-1.5 text-xs font-semibold text-fg hover:bg-line disabled:opacity-50">+ Thêm 4 quả xoài keo chín đã gán nhãn</button>
          </Panel>
          <Panel title="Mô hình">
            <Segmented label="Số láng giềng k" value={k} options={[1, 3, 5, 7].map((v) => ({ value: v, label: String(v) }))} onChange={setK} />
            <SimToggle label="Tô vùng quyết định" checked={regions} onChange={setRegions} />
            <SimToggle label="Hiện lô xoài mới" checked={test} onChange={setTest} />
          </Panel>
          <ResetAll onClick={() => { setTrain(TRAIN); setLabel("chin"); setK(3); setRegions(true); setTest(true); }} />
        </>
      }
    />
  );
}

type Task = { kind: "ai"; i: number } | { kind: "bias" } | { kind: "fix" };
const TASKS: Task[] = [{ kind: "ai", i: 0 }, { kind: "ai", i: 1 }, { kind: "ai", i: 3 }, { kind: "bias" }, { kind: "fix" }];

function Game() {
  const c = useChallenge(TASKS.length);
  const t = TASKS[Math.min(c.idx, TASKS.length - 1)];
  const [ans, setAns] = useState<number | null>(null);
  const [train, setTrain] = useState<Mango[]>(TRAIN);
  const key = `${c.run}-${c.idx}`;
  const [seen, setSeen] = useState(key);
  if (seen !== key) { setSeen(key); setAns(null); setTrain(TRAIN); }
  const q = t.kind === "ai" ? AI_OR_NOT[t.i] : undefined;
  const prompt = q ? `Đây có phải ứng dụng AI (học từ dữ liệu) không? “${q.text}”` : t.kind === "bias" ? `Máy chỉ đúng ${accuracy(TRAIN, 3)}% trên lô xoài mới. Vì sao?` : "Thêm dữ liệu (bấm vào biểu đồ hoặc thêm xoài keo) để độ chính xác trên lô mới đạt ít nhất 90%.";
  const check = () => {
    if (q) { const ok = ans !== null && (ans === 1) === q.ai; return c.check(ok, `${q.ai ? "Có AI" : "Không phải AI"}: ${q.why}`); }
    if (t.kind === "bias") return c.check(ans === BIAS_ANSWER, ans === BIAS_ANSWER ? "Đúng: mô hình chỉ giỏi với loại dữ liệu nó từng thấy. Dữ liệu thiếu đa dạng gây thiên lệch." : "Chưa đúng. Nhìn xem các quả bị đoán sai thuộc loại xoài nào.");
    const acc = accuracy(train, 3);
    return c.check(acc >= 90, acc >= 90 ? `Đạt ${acc}%: dữ liệu đa dạng hơn thì mô hình tốt hơn — không cần sửa “code”.` : `Mới ${acc}%. Máy cần thấy xoài keo chín (vỏ xanh, mềm).`);
  };
  return (
    <ChallengeFrame c={c} prompt={prompt} onCheck={check} summary={["AI (học máy) học quy luật từ dữ liệu có nhãn, không do người viết sẵn từng luật.", "Mô hình chỉ tốt bằng dữ liệu dạy nó; dữ liệu thiếu đa dạng gây thiên lệch.", "Muốn mô hình tốt hơn: thêm dữ liệu đúng, đa dạng và kiểm tra trên dữ liệu mới."]}>
      <Stage className="p-4">
        {q && <div className="flex gap-2">{["Không phải AI", "Có AI"].map((l, i) => <button key={l} type="button" aria-pressed={ans === i} onClick={() => setAns(i)} className={cn("rounded-xl border-2 px-4 py-2 font-semibold", ans === i ? "border-brand bg-brand text-brand-ink" : "border-line bg-surface text-fg")}>{i ? <Sparkles className="mr-1 inline size-4" aria-hidden /> : null}{l}</button>)}</div>}
        {t.kind === "bias" && <div className="grid gap-3 md:grid-cols-2"><Chart train={TRAIN} k={3} regions test /><div className="space-y-2">{BIAS_OPTIONS.map((o, i) => <button key={o} type="button" aria-pressed={ans === i} onClick={() => setAns(i)} className={cn("block w-full rounded-xl border-2 px-3 py-2 text-left text-sm", ans === i ? "border-brand bg-brand/10" : "border-line bg-surface")}>{o}</button>)}</div></div>}
        {t.kind === "fix" && <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]"><Chart train={train} k={3} regions test onAdd={(cl, s) => setTrain([...train, { id: `g${train.length}`, variety: "Xoài keo", color: cl, soft: s, label: s > 0.5 ? "chin" : "xanh" }])} /><div className="space-y-2"><Readout label="Độ chính xác" value={`${accuracy(train, 3)}%`} tone={accuracy(train, 3) >= 90 ? "green" : "rose"} /><button type="button" onClick={() => setTrain([...train, ...EXTRA_KEO])} className="w-full rounded-lg bg-surface py-2 text-sm font-semibold text-fg hover:bg-line">+ 4 quả xoài keo chín</button><p className="text-xs text-muted">Quả em bấm thêm được người bán gán nhãn theo độ mềm.</p></div></div>}
      </Stage>
    </ChallengeFrame>
  );
}

export function AiDiscoveryLab() {
  return <SimShell title="Dạy robot phân loại trái cây" screens={[{ id: "huan-luyen", label: "Huấn luyện", icon: Brain, render: () => <Explore /> }, { id: "thu-thach", label: "Thử thách", render: () => <Game /> }]} />;
}
