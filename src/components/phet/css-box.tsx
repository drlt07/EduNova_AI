"use client";
/** Tin 12 Bài 16 – Phòng thiết kế những chiếc hộp: mô hình hộp CSS (content, padding, border, margin), box-sizing, tổng kích thước. */
import { useState } from "react";
import { cn } from "@/lib/utils";
import { ChallengeFrame, Panel, Readout, ResetAll, Segmented, SimLayout, SimShell, SimSlider, Stage, useChallenge } from "./kit";

export interface Box { width: number; height: number; padding: number; border: number; margin: number; sizing: "content-box" | "border-box"; style: "solid" | "dashed" | "dotted"; radius: number }
const START: Box = { width: 200, height: 90, padding: 20, border: 6, margin: 16, sizing: "content-box", style: "solid", radius: 0 };
/** Chiều rộng chiếm chỗ (tính cả margin) và chiều rộng nhìn thấy (đến hết viền). */
export function boxSize(b: Box) {
  const inner = b.sizing === "content-box" ? b.width : Math.max(0, b.width - 2 * b.padding - 2 * b.border);
  const visible = b.sizing === "content-box" ? b.width + 2 * b.padding + 2 * b.border : b.width;
  const vH = b.sizing === "content-box" ? b.height + 2 * b.padding + 2 * b.border : b.height;
  return { content: inner, visible, total: visible + 2 * b.margin, visibleH: vH, totalH: vH + 2 * b.margin };
}
const css = (b: Box) => [`.hop {`, `  box-sizing: ${b.sizing};`, `  width: ${b.width}px;`, `  height: ${b.height}px;`, `  padding: ${b.padding}px;`, `  border: ${b.border}px ${b.style} #f59e0b;`, `  margin: ${b.margin}px;`, ...(b.radius ? [`  border-radius: ${b.radius}px;`] : []), `}`].join("\n");

function BoxView({ b, layers, target }: { b: Box; layers: boolean; target?: { w: number; h: number } }) {
  const s = boxSize(b);
  const scale = Math.min(1, 460 / Math.max(s.total, target?.w ?? 0, 1));
  return (
    <div className="relative mx-auto flex min-h-[300px] items-center justify-center overflow-auto rounded-xl bg-[repeating-conic-gradient(#f1f5f9_0_25%,#ffffff_0_50%)] bg-[length:20px_20px] p-4 dark:bg-[repeating-conic-gradient(#0f172a_0_25%,#111827_0_50%)]">
      <div style={{ transform: `scale(${scale})` }} className="relative">
        {target && <div aria-hidden className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded border-2 border-dashed border-violet-500" style={{ width: target.w, height: target.h }} />}
        <div style={{ padding: b.margin, background: layers ? "rgba(249,115,22,.18)" : "transparent" }} className="relative">
          {layers && b.margin > 10 && <span className="absolute left-1 top-0 text-[10px] font-semibold text-orange-600">margin {b.margin}</span>}
          <div style={{ boxSizing: b.sizing, width: b.width, height: b.height, padding: b.padding, borderWidth: b.border, borderStyle: b.style, borderColor: "#f59e0b", borderRadius: b.radius, background: layers ? "rgba(34,197,94,.25)" : "#fff" }} className="relative">
            {layers && b.padding > 10 && <span className="absolute left-1 top-0 text-[10px] font-semibold text-green-700">padding {b.padding}</span>}
            <div className="flex size-full items-center justify-center overflow-hidden text-center text-xs font-semibold text-slate-800" style={{ background: layers ? "rgba(59,130,246,.35)" : "transparent" }}>
              Nội dung<br />{Math.round(s.content)} × {Math.round(b.sizing === "content-box" ? b.height : Math.max(0, b.height - 2 * b.padding - 2 * b.border))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Legend() {
  return (
    <div className="flex flex-wrap gap-3 text-xs">
      {[["bg-blue-500/40", "content (nội dung)"], ["bg-green-500/30", "padding (đệm)"], ["bg-amber-400", "border (viền)"], ["bg-orange-500/20", "margin (lề ngoài)"]].map(([c, l]) => <span key={l} className="flex items-center gap-1.5"><span className={cn("size-3 rounded", c)} />{l}</span>)}
    </div>
  );
}

function Controls({ b, set }: { b: Box; set: (b: Box) => void }) {
  return (
    <>
      <SimSlider label="width" value={b.width} min={40} max={320} step={10} unit="px" onChange={(width) => set({ ...b, width })} />
      <SimSlider label="height" value={b.height} min={30} max={200} step={10} unit="px" onChange={(height) => set({ ...b, height })} />
      <SimSlider label="padding" value={b.padding} min={0} max={50} unit="px" onChange={(padding) => set({ ...b, padding })} />
      <SimSlider label="border" value={b.border} min={0} max={20} unit="px" onChange={(border) => set({ ...b, border })} />
      <SimSlider label="margin" value={b.margin} min={0} max={50} unit="px" onChange={(margin) => set({ ...b, margin })} />
      <Segmented label="box-sizing" value={b.sizing} options={[{ value: "content-box", label: "content-box" }, { value: "border-box", label: "border-box" }]} onChange={(sizing) => set({ ...b, sizing })} />
    </>
  );
}

function Explore() {
  const [b, setB] = useState<Box>(START);
  const [layers, setLayers] = useState(true);
  const s = boxSize(b);
  return (
    <SimLayout
      stage={
        <div className="space-y-3">
          <Stage className="p-3"><BoxView b={b} layers={layers} /></Stage>
          <Legend />
          <div className="grid gap-3 md:grid-cols-2">
            <pre className="rounded-xl bg-[#0f172a] p-3 font-mono text-xs leading-6 text-cyan-100 [font-variant-ligatures:none]">{css(b)}</pre>
            <div className="space-y-2">
              <p className="rounded-xl bg-surface-2 p-3 font-mono text-xs text-fg [font-variant-ligatures:none]">{b.sizing === "content-box" ? `Rộng nhìn thấy = ${b.width} + 2×${b.padding} + 2×${b.border} = ${s.visible}px` : `border-box: width ${b.width}px đã gồm padding và border → nội dung còn ${s.content}px`}</p>
              <div className="grid grid-cols-2 gap-2"><Readout label="Rộng nhìn thấy" value={`${s.visible}px`} /><Readout label="Chiếm chỗ (cả margin)" value={`${s.total}px`} tone="amber" /></div>
            </div>
          </div>
        </div>
      }
      controls={
        <>
          <Panel title="Thuộc tính hộp"><Controls b={b} set={setB} /></Panel>
          <Panel title="Kiểu viền">
            <Segmented label="border-style" value={b.style} options={[{ value: "solid", label: "solid" }, { value: "dashed", label: "dashed" }, { value: "dotted", label: "dotted" }]} onChange={(style) => setB({ ...b, style })} />
            <SimSlider label="border-radius" value={b.radius} min={0} max={60} unit="px" onChange={(radius) => setB({ ...b, radius })} />
            <label className="flex items-center gap-2"><input type="checkbox" checked={layers} onChange={(e) => setLayers(e.target.checked)} className="accent-[var(--brand)]" /> Tô màu từng lớp</label>
          </Panel>
          <ResetAll onClick={() => { setB(START); setLayers(true); }} />
        </>
      }
    />
  );
}

const TASKS: { prompt: string; ok: (b: Box) => boolean; target?: (b: Box) => { w: number; h: number }; hint: (b: Box) => string; why: string }[] = [
  { prompt: "Với content-box, làm cho hộp nhìn thấy rộng đúng 300px khi padding 20px, border 5px.", ok: (b) => b.sizing === "content-box" && b.padding === 20 && b.border === 5 && boxSize(b).visible === 300, target: () => ({ w: 300, h: 120 }), hint: (b) => `Đang rộng ${boxSize(b).visible}px. width = 300 − 2×20 − 2×5.`, why: "width 250 + 2×20 + 2×5 = 300px." },
  { prompt: "Chuyển sang border-box và giữ hộp nhìn thấy rộng 300px với padding 20, border 5.", ok: (b) => b.sizing === "border-box" && b.padding === 20 && b.border === 5 && boxSize(b).visible === 300, target: () => ({ w: 300, h: 120 }), hint: () => "Với border-box, width đã gồm cả padding và border.", why: "border-box: width 300px là cả hộp, nội dung tự co còn 250px." },
  { prompt: "Hai hộp đặt cạnh nhau trong khung 400px. Mỗi hộp phải chiếm đúng 200px kể cả margin 10px (border-box).", ok: (b) => b.sizing === "border-box" && b.margin === 10 && boxSize(b).total === 200, hint: (b) => `Đang chiếm ${boxSize(b).total}px. Chiếm chỗ = width + 2 × margin.`, why: "width 180 + 2×10 = 200px." },
  { prompt: "Tạo nút bo tròn: viền nét đứt 3px, đệm 12px, bo góc từ 20px trở lên.", ok: (b) => b.style === "dashed" && b.border === 3 && b.padding === 12 && b.radius >= 20, hint: () => "Dùng border-style, border, padding và border-radius.", why: "border: 3px dashed; padding: 12px; border-radius: 20px." },
];

function Game() {
  const c = useChallenge(TASKS.length);
  const t = TASKS[Math.min(c.idx, TASKS.length - 1)];
  const [b, setB] = useState<Box>(START);
  const key = `${c.run}-${c.idx}`;
  const [seen, setSeen] = useState(key);
  if (seen !== key) { setSeen(key); setB(c.idx === 1 ? { ...START, width: 250, padding: 20, border: 5 } : START); }
  return (
    <ChallengeFrame c={c} prompt={t.prompt} onCheck={() => c.check(t.ok(b), t.ok(b) ? t.why : t.hint(b))} summary={["Mỗi phần tử là một hộp: content → padding → border → margin.", "content-box: width chỉ là phần nội dung; border-box: width gồm cả padding và border.", "Chỗ chiếm trên trang còn cộng thêm margin hai bên."]}>
      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_280px]">
        <div className="space-y-2">
          <Stage className="p-3"><BoxView b={b} layers target={t.target?.(b)} /></Stage>
          <div className="grid grid-cols-2 gap-2"><Readout label="Rộng nhìn thấy" value={`${boxSize(b).visible}px`} /><Readout label="Chiếm chỗ" value={`${boxSize(b).total}px`} tone="amber" /></div>
        </div>
        <Panel>
          <Controls b={b} set={setB} />
          {c.idx === 3 && <>
            <Segmented label="border-style" value={b.style} options={[{ value: "solid", label: "solid" }, { value: "dashed", label: "dashed" }, { value: "dotted", label: "dotted" }]} onChange={(style) => setB({ ...b, style })} />
            <SimSlider label="border-radius" value={b.radius} min={0} max={60} unit="px" onChange={(radius) => setB({ ...b, radius })} />
          </>}
        </Panel>
      </div>
    </ChallengeFrame>
  );
}

export function CssBoxLab() {
  return <SimShell title="Phòng thiết kế những chiếc hộp" screens={[{ id: "kham-pha", label: "Khám phá", render: () => <Explore /> }, { id: "thu-thach", label: "Thử thách", render: () => <Game /> }]} />;
}
