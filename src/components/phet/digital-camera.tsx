"use client";
/** Tin 10 Bài 6 – Phòng thí nghiệm máy ảnh số: độ phân giải, số bit màu → ảnh và dung lượng; lấy mẫu âm thanh → sóng khôi phục và dung lượng. */
import { useEffect, useRef, useState } from "react";
import { Image as ImageIcon, Music, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/form";
import { ChallengeFrame, Panel, Readout, ResetAll, Segmented, SimLayout, SimShell, SimSlider, Stage, useChallenge } from "./kit";

type Rgb = [number, number, number];
/** Cảnh vẽ bằng công thức (bầu trời, mặt trời, núi, hồ, cây) để lấy mẫu ở mọi độ phân giải. */
function scene(x: number, y: number): Rgb {
  const sun = Math.hypot(x - 0.75, y - 0.22);
  if (sun < 0.1) return [255, 214, 64];
  const mountain = 0.62 - 0.28 * Math.max(0, 1 - Math.abs(x - 0.35) / 0.35) - 0.16 * Math.max(0, 1 - Math.abs(x - 0.8) / 0.25);
  const tree = Math.abs(x - 0.15) < 0.06 - (y - 0.55) * 0.25 && y > 0.5 && y < 0.78;
  if (tree) return [22, 101, 52];
  if (y > 0.78) return [34 + 40 * Math.sin(x * 30), 120, 200];
  if (y > mountain) return [80 + 60 * (y - mountain), 110 - 40 * (y - mountain), 90];
  const t = y / 0.6;
  return [120 + 80 * t, 180 + 50 * t, 250];
}
export const COLOR_BITS = [1, 2, 4, 8, 24] as const;
function quantize([r, g, b]: Rgb, bits: number): Rgb {
  if (bits === 24) return [r, g, b];
  const gray = 0.3 * r + 0.59 * g + 0.11 * b;
  const levels = 2 ** bits;
  const q = Math.round((gray / 255) * (levels - 1)) * (255 / (levels - 1));
  return [q, q, q];
}
export const imageBytes = (n: number, bits: number) => (n * n * bits) / 8;
const fmtBytes = (b: number) => (b >= 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(2)} MB` : b >= 1024 ? `${(b / 1024).toFixed(1)} KB` : `${Math.round(b)} byte`);

function Picture({ n, bits, grid, pick, onPick }: { n: number; bits: number; grid?: boolean; pick?: [number, number] | null; onPick?: (p: [number, number]) => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    cv.width = n; cv.height = n;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const img = ctx.createImageData(n, n);
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
      const [r, g, b] = quantize(scene((i + 0.5) / n, (j + 0.5) / n), bits);
      const k = (j * n + i) * 4;
      img.data[k] = r; img.data[k + 1] = g; img.data[k + 2] = b; img.data[k + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
  }, [n, bits]);
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[420px]">
      <canvas ref={ref} aria-label={`Ảnh ${n}×${n} điểm, ${bits} bit mỗi điểm`} className="size-full rounded-xl [image-rendering:pixelated]" onClick={(e) => { if (!onPick) return; const r = e.currentTarget.getBoundingClientRect(); onPick([Math.floor(((e.clientX - r.left) / r.width) * n), Math.floor(((e.clientY - r.top) / r.height) * n)]); }} />
      {grid && n <= 32 && <div aria-hidden className="pointer-events-none absolute inset-0 rounded-xl" style={{ backgroundImage: "linear-gradient(rgba(15,23,42,.35) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,.35) 1px, transparent 1px)", backgroundSize: `${100 / n}% ${100 / n}%` }} />}
      {pick && <div aria-hidden className="pointer-events-none absolute rounded-sm ring-2 ring-rose-500" style={{ left: `${(pick[0] / n) * 100}%`, top: `${(pick[1] / n) * 100}%`, width: `${100 / n}%`, height: `${100 / n}%` }} />}
    </div>
  );
}

function pixelCode(n: number, bits: number, [i, j]: [number, number]) {
  const c = quantize(scene((i + 0.5) / n, (j + 0.5) / n), bits);
  if (bits === 24) return c.map((v) => Math.round(v).toString(2).padStart(8, "0")).join(" ");
  const levels = 2 ** bits;
  return Math.round((c[0] / 255) * (levels - 1)).toString(2).padStart(bits, "0");
}

function ImageScreen() {
  const [n, setN] = useState(16);
  const [bits, setBits] = useState<number>(24);
  const [grid, setGrid] = useState(true);
  const [pick, setPick] = useState<[number, number] | null>([12, 3]);
  const bytes = imageBytes(n, bits);
  const p = pick && pick[0] < n && pick[1] < n ? pick : null;
  return (
    <SimLayout
      stage={
        <Stage className="p-4">
          <Picture n={n} bits={bits} grid={grid} pick={p} onPick={setPick} />
          {p && <p className="mt-3 text-center text-sm text-fg">Điểm ảnh ({p[0]}, {p[1]}) được lưu bằng mã: <code className="rounded bg-[#0f172a] px-2 py-0.5 font-mono text-xs text-cyan-200">{pixelCode(n, bits, p)}</code></p>}
          <p className="mt-1 text-center text-xs text-muted">Bấm vào một điểm ảnh để xem mã nhị phân của nó.</p>
        </Stage>
      }
      controls={
        <>
          <Panel title="Máy ảnh">
            <SimSlider label="Độ phân giải" value={n} min={4} max={128} step={4} onChange={setN} format={(v) => `${v}×${v}`} />
            <Segmented label="Số bit mỗi điểm ảnh" value={bits} options={COLOR_BITS.map((b) => ({ value: b, label: String(b) }))} onChange={setBits} />
            <p className="text-xs text-muted">{bits === 24 ? "24 bit: 8 bit đỏ + 8 bit lục + 8 bit lam, khoảng 16,7 triệu màu." : `${bits} bit: ${2 ** bits} mức xám.`}</p>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={grid} onChange={(e) => setGrid(e.target.checked)} className="accent-[var(--brand)]" /> Hiện lưới điểm ảnh</label>
          </Panel>
          <Panel title="Dung lượng ảnh">
            <p className="font-mono text-xs text-muted [font-variant-ligatures:none]">{n} × {n} × {bits} bit ÷ 8</p>
            <Readout label="Kích thước" value={fmtBytes(bytes)} tone={bytes > 20000 ? "amber" : "green"} />
            <Readout label="Số điểm ảnh" value={(n * n).toLocaleString("vi-VN")} />
          </Panel>
          <ResetAll onClick={() => { setN(16); setBits(24); setGrid(true); setPick([12, 3]); }} />
        </>
      }
    />
  );
}

const wave = (t: number) => 0.62 * Math.sin(2 * Math.PI * t) + 0.3 * Math.sin(6 * Math.PI * t + 0.6);
export function sampleError(rate: number, bits: number) {
  const levels = 2 ** bits;
  let err = 0;
  const N = 400;
  for (let k = 0; k < N; k++) {
    const t = k / N;
    const ts = Math.floor(t * rate) / rate;
    const q = Math.round(((wave(ts) + 1) / 2) * (levels - 1)) / (levels - 1) * 2 - 1;
    err += Math.abs(q - wave(t));
  }
  return err / N / 2;
}

function Waveform({ rate, bits }: { rate: number; bits: number }) {
  const W = 600, H = 220, y = (v: number) => H / 2 - v * (H / 2 - 14);
  const levels = 2 ** bits;
  const samples = Array.from({ length: rate }, (_, k) => { const t = k / rate; const v = Math.round(((wave(t) + 1) / 2) * (levels - 1)) / (levels - 1) * 2 - 1; return { t, v }; });
  const orig = Array.from({ length: 201 }, (_, k) => `${(k / 200) * W},${y(wave(k / 200))}`).join(" ");
  const steps = samples.map((s, k) => `${s.t * W},${y(s.v)} ${((k + 1) / rate) * W},${y(s.v)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={`Sóng âm lấy ${rate} mẫu, ${bits} bit mỗi mẫu`}>
      {bits <= 4 && Array.from({ length: levels }, (_, k) => <line key={k} x1="0" x2={W} y1={y((k / (levels - 1)) * 2 - 1)} y2={y((k / (levels - 1)) * 2 - 1)} stroke="#94a3b8" strokeOpacity="0.3" />)}
      <line x1="0" x2={W} y1={H / 2} y2={H / 2} stroke="#94a3b8" strokeOpacity="0.6" />
      <polyline points={orig} fill="none" stroke="#38bdf8" strokeWidth="2.5" />
      <polyline points={steps} fill="none" stroke="#f97316" strokeWidth="2.5" />
      {samples.map((s, k) => <circle key={k} cx={s.t * W} cy={y(s.v)} r="4" fill="#f97316" />)}
    </svg>
  );
}

function SoundScreen() {
  const [rate, setRate] = useState(12);
  const [bits, setBits] = useState(3);
  const [hz, setHz] = useState(8000);
  const [sec, setSec] = useState(10);
  const err = sampleError(rate, bits);
  return (
    <SimLayout
      stage={
        <Stage dark className="p-4">
          <Waveform rate={rate} bits={bits} />
          <p className="mt-2 flex flex-wrap justify-center gap-4 text-xs text-slate-300"><span className="flex items-center gap-1.5"><span className="h-1 w-5 rounded bg-sky-400" /> Âm thanh gốc</span><span className="flex items-center gap-1.5"><span className="h-1 w-5 rounded bg-orange-500" /> Âm thanh số khôi phục từ các mẫu</span></p>
          <p className="mt-2 text-center text-sm text-white">Độ lệch so với âm gốc: <b className={cn(err < 0.05 ? "text-emerald-300" : err < 0.12 ? "text-amber-300" : "text-rose-300")}>{Math.round(err * 100)}%</b></p>
        </Stage>
      }
      controls={
        <>
          <Panel title="Lấy mẫu (một chu kì sóng)">
            <SimSlider label="Số mẫu" value={rate} min={3} max={48} onChange={setRate} />
            <SimSlider label="Số bit mỗi mẫu" value={bits} min={1} max={8} onChange={setBits} format={(v) => `${v} bit (${2 ** v} mức)`} />
          </Panel>
          <Panel title="Tính dung lượng tệp">
            <SimSlider label="Tần số lấy mẫu" value={hz} min={4000} max={48000} step={4000} onChange={setHz} format={(v) => `${v.toLocaleString("vi-VN")} mẫu/giây`} />
            <SimSlider label="Thời lượng" value={sec} min={1} max={60} onChange={setSec} unit=" giây" />
            <p className="font-mono text-xs text-muted [font-variant-ligatures:none]">{hz} × {bits} bit × {sec} s ÷ 8</p>
            <Readout label="Kích thước (1 kênh)" value={fmtBytes((hz * bits * sec) / 8)} tone="green" />
          </Panel>
          <ResetAll onClick={() => { setRate(12); setBits(3); setHz(8000); setSec(10); }} />
        </>
      }
    />
  );
}

type Task = { prompt: string; kind: "number"; answer: number; why: string } | { prompt: string; kind: "image"; ok: (n: number, b: number) => boolean; hint: string; why: string } | { prompt: string; kind: "sound"; ok: (r: number, b: number) => boolean; hint: string; why: string };
const TASKS: Task[] = [
  { prompt: "Ảnh 100 × 100 điểm, mỗi điểm 24 bit chiếm bao nhiêu byte?", kind: "number", answer: 30000, why: "100 × 100 × 24 ÷ 8 = 30 000 byte." },
  { prompt: "Chỉnh máy ảnh để ảnh có ít nhất 16 mức xám mà dùng ít bit nhất.", kind: "image", ok: (_n, b) => b === 4, hint: "16 mức cần 2ⁿ ≥ 16.", why: "4 bit cho 2⁴ = 16 mức." },
  { prompt: "Chỉnh để ảnh có độ phân giải ít nhất 32×32 nhưng không quá 2 KB (2048 byte).", kind: "image", ok: (n, b) => n >= 32 && imageBytes(n, b) <= 2048, hint: "Thử giảm số bit mỗi điểm ảnh.", why: "Ví dụ 32×32 × 8 bit = 1024 byte." },
  { prompt: "Thu âm 10 giây, 8 000 mẫu/giây, 8 bit mỗi mẫu, một kênh. Tệp bao nhiêu byte?", kind: "number", answer: 80000, why: "8 000 × 8 × 10 ÷ 8 = 80 000 byte." },
  { prompt: "Ở màn Âm thanh, chỉnh để độ lệch dưới 5% mà dùng không quá 24 mẫu.", kind: "sound", ok: (r, b) => r <= 24 && sampleError(r, b) < 0.05, hint: "Tăng số bit mỗi mẫu trước, rồi tăng số mẫu.", why: "Nhiều mẫu hơn và nhiều bit hơn thì âm số càng giống âm gốc, nhưng tệp nặng hơn." },
];

function Game() {
  const c = useChallenge(TASKS.length);
  const t = TASKS[Math.min(c.idx, TASKS.length - 1)];
  const [typed, setTyped] = useState("");
  const [n, setN] = useState(64);
  const [bits, setBits] = useState<number>(24);
  const [rate, setRate] = useState(6);
  const [sb, setSb] = useState(2);
  const key = `${c.run}-${c.idx}`;
  const [seen, setSeen] = useState(key);
  if (seen !== key) { setSeen(key); setTyped(""); setN(64); setBits(24); setRate(6); setSb(2); }
  const check = () => {
    if (t.kind === "number") { const ok = Number(typed.replace(/\D/g, "")) === t.answer; return c.check(ok, ok ? t.why : "Nhân các đại lượng rồi chia 8 để đổi bit ra byte."); }
    const ok = t.kind === "image" ? t.ok(n, bits) : t.ok(rate, sb);
    c.check(ok, ok ? t.why : t.hint);
  };
  return (
    <ChallengeFrame c={c} prompt={t.prompt} onCheck={check} summary={["Ảnh số gồm nhiều điểm ảnh; dung lượng = số điểm × số bit mỗi điểm ÷ 8.", "Nhiều bit mỗi điểm → nhiều màu hơn.", "Âm thanh số = các mẫu đo đều đặn; dung lượng = tần số × số bit × thời gian ÷ 8."]}>
      {t.kind === "number" && <div className="max-w-xs"><Input aria-label="Câu trả lời (byte)" inputMode="numeric" className="font-mono text-lg" placeholder="Số byte" value={typed} onChange={(e) => setTyped(e.target.value)} /></div>}
      {t.kind === "image" && (
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_280px]">
          <Stage className="p-3"><Picture n={n} bits={bits} /></Stage>
          <Panel>
            <SimSlider label="Độ phân giải" value={n} min={4} max={128} step={4} onChange={setN} format={(v) => `${v}×${v}`} />
            <Segmented label="Số bit mỗi điểm" value={bits} options={COLOR_BITS.map((b) => ({ value: b, label: String(b) }))} onChange={setBits} />
            <Readout label="Kích thước" value={fmtBytes(imageBytes(n, bits))} />
          </Panel>
        </div>
      )}
      {t.kind === "sound" && (
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_280px]">
          <Stage dark className="p-3"><Waveform rate={rate} bits={sb} /></Stage>
          <Panel>
            <SimSlider label="Số mẫu" value={rate} min={3} max={48} onChange={setRate} />
            <SimSlider label="Số bit mỗi mẫu" value={sb} min={1} max={8} onChange={setSb} />
            <Readout label="Độ lệch" value={`${Math.round(sampleError(rate, sb) * 100)}%`} tone={sampleError(rate, sb) < 0.05 ? "green" : "amber"} />
          </Panel>
        </div>
      )}
    </ChallengeFrame>
  );
}

export function DigitalCameraLab() {
  return <SimShell title="Phòng thí nghiệm máy ảnh số" screens={[{ id: "anh", label: "Hình ảnh", icon: ImageIcon, render: () => <ImageScreen /> }, { id: "am-thanh", label: "Âm thanh", icon: Music, render: () => <SoundScreen /> }, { id: "thu-thach", label: "Thử thách", icon: Trophy, render: () => <Game /> }]} />;
}
