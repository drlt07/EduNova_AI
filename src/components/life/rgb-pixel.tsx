"use client";
/** Màn hình trộn màu RGB: mỗi điểm ảnh gồm ba đèn đỏ, xanh lá, xanh dương; mỗi đèn 8 bit (0–255) → 24 bit một điểm ảnh. */
import { useState } from "react";
import { Palette, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { ChallengeFrame, Panel, Readout, ResetAll, SimLayout, SimShell, SimSlider, Stage, useChallenge } from "@/components/phet/kit";

export const hex = (r: number, g: number, b: number) => `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("").toUpperCase()}`;
/** Khoảng cách giữa hai màu (0 = trùng). */
export const colorDist = (a: number[], b: number[]) => Math.round(Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]));
const bits = (v: number) => v.toString(2).padStart(8, "0");

function Pixel({ r, g, b, size = "lg" }: { r: number; g: number; b: number; size?: "lg" | "sm" }) {
  return (
    <div className={cn("grid grid-cols-3 gap-1 rounded-xl bg-black p-1.5", size === "lg" ? "h-40 w-32" : "h-16 w-14")} aria-hidden>
      {[["#ff2a2a", r], ["#22ff55", g], ["#3a6bff", b]].map(([c, v]) => <span key={c as string} className="rounded-md" style={{ background: c as string, opacity: 0.08 + ((v as number) / 255) * 0.92, boxShadow: `0 0 ${((v as number) / 255) * 18}px ${c}` }} />)}
    </div>
  );
}

function Explore() {
  const [r, setR] = useState(255);
  const [g, setG] = useState(140);
  const [b, setB] = useState(0);
  return (
    <SimLayout
      stage={
        <Stage dark className="flex flex-col items-center gap-6 p-6 sm:flex-row sm:justify-center">
          <div className="text-center"><Pixel r={r} g={g} b={b} /><p className="mt-2 text-xs text-slate-400">Phóng to 1 điểm ảnh</p></div>
          <div className="text-4xl text-slate-500" aria-hidden>→</div>
          <div className="text-center">
            <div className="size-40 rounded-3xl shadow-2xl ring-4 ring-white/10 transition-colors" style={{ background: `rgb(${r},${g},${b})` }} />
            <p className="mt-2 font-mono text-lg font-bold text-white">{hex(r, g, b)}</p>
          </div>
          <div className="space-y-1 font-mono text-sm">
            {[["R", r, "text-rose-400"], ["G", g, "text-emerald-400"], ["B", b, "text-blue-400"]].map(([n, v, c]) => <p key={n as string} className={c as string}>{n} = {String(v).padStart(3, " ")} = {bits(v as number)}</p>)}
            <p className="pt-1 text-xs text-slate-400">3 × 8 = 24 bit cho một điểm ảnh</p>
          </div>
        </Stage>
      }
      controls={
        <>
          <Panel title="Độ sáng từng đèn">
            <SimSlider label="Đỏ (R)" value={r} min={0} max={255} onChange={setR} />
            <SimSlider label="Xanh lá (G)" value={g} min={0} max={255} onChange={setG} />
            <SimSlider label="Xanh dương (B)" value={b} min={0} max={255} onChange={setB} />
          </Panel>
          <Panel title="Thử nhanh">
            <div className="flex flex-wrap gap-1">{[["Trắng", 255, 255, 255], ["Vàng", 255, 255, 0], ["Hồng", 255, 0, 255], ["Xám", 128, 128, 128], ["Đen", 0, 0, 0]].map(([n, ...v]) => <button key={n as string} type="button" onClick={() => { setR(v[0] as number); setG(v[1] as number); setB(v[2] as number); }} className="rounded-lg bg-surface px-2 py-1 text-xs hover:bg-line">{n}</button>)}</div>
          </Panel>
          <div className="grid grid-cols-2 gap-2"><Readout label="Số màu hiển thị được" value="16,7 triệu" tone="green" /><Readout label="Ảnh Full HD" value="≈ 6 MB" /></div>
          <p className="text-xs text-muted">Ảnh Full HD có 1920 × 1080 ≈ 2 triệu điểm ảnh, mỗi điểm 3 byte → khoảng 6 MB khi chưa nén.</p>
          <ResetAll onClick={() => { setR(255); setG(140); setB(0); }} />
        </>
      }
    />
  );
}

const TARGETS: { name: string; rgb: number[] }[] = [
  { name: "Vàng chanh", rgb: [255, 230, 0] },
  { name: "Tím", rgb: [130, 0, 200] },
  { name: "Xanh ngọc", rgb: [0, 200, 190] },
];
function Game() {
  const c = useChallenge(TARGETS.length + 1);
  const [v, setV] = useState([128, 128, 128]);
  const [pick, setPick] = useState<number | null>(null);
  const key = `${c.run}-${c.idx}`; const [seen, setSeen] = useState(key);
  if (seen !== key) { setSeen(key); setV([128, 128, 128]); setPick(null); }
  if (c.idx >= TARGETS.length) {
    const opts = ["256 màu", "16 777 216 màu", "24 màu"];
    return (
      <ChallengeFrame c={c} prompt="Mỗi đèn có 256 mức (8 bit). Một điểm ảnh 24 bit hiển thị được bao nhiêu màu?" onCheck={() => c.check(pick === 1, pick === 1 ? "Đúng: 256 × 256 × 256 = 2²⁴ ≈ 16,7 triệu màu." : "Gợi ý: mỗi đèn chọn độc lập, nhân số mức của ba đèn.")} summary={SUMMARY}>
        <div className="grid gap-2 sm:grid-cols-3">{opts.map((o, i) => <button key={o} type="button" aria-pressed={pick === i} onClick={() => setPick(i)} className={cn("rounded-xl border-2 px-4 py-3 font-semibold", pick === i ? "border-brand bg-brand/10" : "border-line bg-surface")}>{o}</button>)}</div>
      </ChallengeFrame>
    );
  }
  const t = TARGETS[c.idx];
  const d = colorDist(v, t.rgb);
  return (
    <ChallengeFrame c={c} prompt={<>Pha đúng màu <b>{t.name}</b> (sai lệch dưới 40).</>} onCheck={() => c.check(d < 40, d < 40 ? `Chuẩn! Màu của em ${hex(v[0], v[1], v[2])}, đích ${hex(t.rgb[0], t.rgb[1], t.rgb[2])}.` : `Còn lệch ${d}. Nhìn hai ô màu và chỉnh từng đèn.`)} summary={SUMMARY}>
      <div className="flex flex-wrap items-center gap-6">
        <div className="text-center"><div className="size-24 rounded-2xl ring-2 ring-line" style={{ background: `rgb(${t.rgb.join(",")})` }} /><p className="mt-1 text-xs text-muted">Màu đích</p></div>
        <div className="text-center"><div className="size-24 rounded-2xl ring-2 ring-line" style={{ background: `rgb(${v.join(",")})` }} /><p className="mt-1 text-xs text-muted">Màu của em · lệch {d}</p></div>
        <div className="min-w-56 flex-1 space-y-1">{["Đỏ (R)", "Xanh lá (G)", "Xanh dương (B)"].map((n, i) => <SimSlider key={n} label={n} value={v[i]} min={0} max={255} step={5} onChange={(x) => setV(v.map((y, k) => (k === i ? x : y)))} />)}</div>
      </div>
    </ChallengeFrame>
  );
}
const SUMMARY = ["Mỗi điểm ảnh trên màn hình là ba đèn đỏ, xanh lá, xanh dương; trộn ánh sáng ra mọi màu.", "Mỗi đèn 8 bit (0–255) → 24 bit một điểm ảnh, khoảng 16,7 triệu màu.", "Mã màu #RRGGBB trong thiết kế web chính là ba số đó viết ở hệ 16."];

export function RgbPixelLab() {
  return <SimShell title="Màn hình trộn màu RGB" screens={[{ id: "kham-pha", label: "Pha màu", icon: Palette, render: () => <Explore /> }, { id: "thu-thach", label: "Thử thách", icon: Sparkles, render: () => <Game /> }]} />;
}
