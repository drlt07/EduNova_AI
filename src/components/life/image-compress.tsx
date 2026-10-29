"use client";
/** Nén ảnh: nén mất dữ liệu (gộp khối, làm tròn màu) và nén không mất dữ liệu (mã hóa loạt điểm giống nhau — RLE). */
import { useState } from "react";
import { Image as ImageIcon, Rows3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ChallengeFrame, Panel, Readout, ResetAll, Segmented, SimLayout, SimShell, SimSlider, Stage, useChallenge } from "@/components/phet/kit";

const N = 32;
type Pic = "phong-canh" | "logo";
/** Ảnh mẫu vẽ bằng công thức: phong cảnh (chuyển màu mượt) và logo (mảng màu phẳng). */
function pixel(pic: Pic, x: number, y: number): [number, number, number] {
  if (pic === "logo") {
    const cx = x - 16, cy = y - 16;
    if (cx * cx + cy * cy < 100) return [37, 99, 235];
    if (y > 24) return [250, 204, 21];
    return [255, 255, 255];
  }
  const sky = y < 18;
  if (sky) return [120 + y * 4, 180 + y * 2, 250];
  const hill = y > 18 + 4 * Math.sin(x / 5);
  return hill ? [40 + ((x * 7 + y * 3) % 30), 140 + ((x * 3) % 40) - y, 60] : [200, 210, 230];
}
function compress(pic: Pic, block: number, levels: number) {
  const out: [number, number, number][][] = [];
  const q = (v: number) => Math.round(Math.round((v / 255) * (levels - 1)) * (255 / (levels - 1)));
  for (let y = 0; y < N; y++) {
    out.push([]);
    for (let x = 0; x < N; x++) {
      const bx = Math.floor(x / block) * block, by = Math.floor(y / block) * block;
      let r = 0, g = 0, b = 0, n = 0;
      for (let yy = by; yy < Math.min(N, by + block); yy++) for (let xx = bx; xx < Math.min(N, bx + block); xx++) { const p = pixel(pic, xx, yy); r += p[0]; g += p[1]; b += p[2]; n++; }
      out[y].push([q(r / n), q(g / n), q(b / n)]);
    }
  }
  return out;
}
/** Dung lượng ước lượng (KB) cho ảnh 1000×1000 theo chất lượng; ảnh mảng phẳng nén tốt hơn. */
function sizeKb(pic: Pic, quality: number) { const base = pic === "logo" ? 0.35 : 1; return Math.round((40 + 2900 * (quality / 100) ** 2.2) * base); }
const qualityToParams = (q: number) => ({ block: q >= 80 ? 1 : q >= 55 ? 2 : q >= 30 ? 4 : 8, levels: q >= 80 ? 64 : q >= 55 ? 24 : q >= 30 ? 10 : 5 });

function Canvas({ img, size = 256 }: { img: [number, number, number][][]; size?: number }) {
  return <svg viewBox={`0 0 ${N} ${N}`} width={size} height={size} className="rounded-lg shadow" shapeRendering="crispEdges" role="img" aria-label="Ảnh">{img.flatMap((row, y) => row.map((p, x) => <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={`rgb(${p[0]},${p[1]},${p[2]})`} />))}</svg>;
}

function LossyScreen() {
  const [pic, setPic] = useState<Pic>("phong-canh");
  const [q, setQ] = useState(60);
  const p = qualityToParams(q);
  const orig = compress(pic, 1, 256);
  const img = compress(pic, p.block, p.levels);
  const full = 1000 * 1000 * 3 / 1024;
  const kb = sizeKb(pic, q);
  return (
    <SimLayout
      stage={
        <Stage className="space-y-4 p-4">
          <div className="flex flex-wrap items-end justify-center gap-6">
            <figure className="text-center"><Canvas img={orig} size={200} /><figcaption className="mt-1 text-xs text-muted">Ảnh gốc · {Math.round(full).toLocaleString("vi-VN")} KB</figcaption></figure>
            <figure className="text-center"><Canvas img={img} size={200} /><figcaption className="mt-1 text-xs font-semibold text-fg">Sau khi nén · {kb.toLocaleString("vi-VN")} KB</figcaption></figure>
          </div>
          <svg viewBox="0 0 300 110" className="mx-auto w-full max-w-md" role="img" aria-label="Dung lượng theo chất lượng">
            <line x1={30} y1={90} x2={290} y2={90} stroke="var(--line)" /><line x1={30} y1={10} x2={30} y2={90} stroke="var(--line)" />
            <path d={Array.from({ length: 21 }, (_, i) => { const qq = i * 5; return `${i ? "L" : "M"}${30 + qq * 2.6},${90 - (sizeKb(pic, qq) / sizeKb(pic, 100)) * 78}`; }).join(" ")} fill="none" stroke="#2563eb" strokeWidth={2} />
            <circle cx={30 + q * 2.6} cy={90 - (kb / sizeKb(pic, 100)) * 78} r={5} fill="#2563eb" stroke="white" strokeWidth={2} />
            <text x={160} y={106} textAnchor="middle" className="fill-muted text-[9px]">chất lượng →</text><text x={4} y={14} className="fill-muted text-[9px]">KB</text>
          </svg>
        </Stage>
      }
      controls={
        <>
          <Panel title="Ảnh"><Segmented label="Loại ảnh" value={pic} options={[{ value: "phong-canh", label: "Ảnh chụp" }, { value: "logo", label: "Logo, hình vẽ" }]} onChange={setPic} /></Panel>
          <Panel title="Nén"><SimSlider label="Chất lượng" value={q} min={5} max={100} step={5} onChange={setQ} unit="%" /><p className="text-xs text-muted">Gộp khối {p.block}×{p.block} điểm ảnh, mỗi kênh màu còn {p.levels} mức.</p></Panel>
          <div className="grid grid-cols-2 gap-2"><Readout label="Dung lượng" value={`${kb} KB`} tone="blue" /><Readout label="Nhẹ hơn" value={`${Math.round(full / kb)} lần`} tone="green" /></div>
          <ResetAll onClick={() => { setPic("phong-canh"); setQ(60); }} />
        </>
      }
    />
  );
}

export function rle(row: string) { const out: [string, number][] = []; for (const ch of row) { const l = out[out.length - 1]; if (l && l[0] === ch) l[1]++; else out.push([ch, 1]); } return out; }
const ROWS: Record<string, string> = { "Lá cờ": "TTTTTTTTRRRRRRRRRRRRTTTTTTTT", "Ảnh chụp": "ABACDBBACADBCABDACBDABCADBCA", "Chữ cái": "TTTTTDDDDDTTTTTTDDDDDTTTTTTT" };
const COLOR: Record<string, string> = { T: "#ffffff", R: "#dc2626", D: "#0f172a", A: "#60a5fa", B: "#34d399", C: "#fbbf24" };
function RleScreen() {
  const [name, setName] = useState("Lá cờ");
  const row = ROWS[name];
  const enc = rle(row);
  return (
    <SimLayout
      stage={
        <Stage className="space-y-4 p-4">
          <div className="flex overflow-hidden rounded-lg border border-line">{row.split("").map((ch, i) => <span key={i} className="h-10 flex-1 border-r border-black/5" style={{ background: COLOR[ch] ?? "#e2e8f0" }} />)}</div>
          <p className="font-mono text-sm text-fg">Lưu từng điểm: <span className="break-all text-muted">{row}</span> → <b>{row.length}</b> kí hiệu</p>
          <p className="font-mono text-sm text-fg">Lưu theo loạt: {enc.map(([c, n], i) => <span key={i} className="mr-1 inline-block rounded px-1 text-xs font-bold" style={{ background: COLOR[c], color: c === "D" || c === "R" ? "white" : "#0f172a" }}>{n}{c}</span>)} → <b>{enc.length * 2}</b> kí hiệu</p>
          <p className={cn("rounded-xl px-3 py-2 text-sm font-semibold", enc.length * 2 < row.length ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-200" : "bg-rose-50 text-rose-800 dark:bg-rose-500/10 dark:text-rose-200")}>{enc.length * 2 < row.length ? `Nén còn ${Math.round((enc.length * 2 / row.length) * 100)}% — giải nén ra đúng y hệt ảnh gốc.` : "Ảnh ít mảng giống nhau: lưu theo loạt còn dài hơn! Kiểu nén này không hợp với ảnh chụp."}</p>
        </Stage>
      }
      controls={
        <>
          <Panel title="Dòng điểm ảnh"><Segmented label="Mẫu" value={name} options={Object.keys(ROWS).map((k) => ({ value: k, label: k }))} onChange={setName} /></Panel>
          <div className="grid grid-cols-2 gap-2"><Readout label="Gốc" value={row.length} /><Readout label="Sau nén" value={enc.length * 2} tone={enc.length * 2 < row.length ? "green" : "rose"} /></div>
          <ResetAll onClick={() => setName("Lá cờ")} />
        </>
      }
    />
  );
}

const TASKS = [{ kind: "rle" as const, row: "TTTTRRRRRRTT" }, { kind: "type" as const }, { kind: "lossless" as const }];
function Game() {
  const c = useChallenge(TASKS.length);
  const t = TASKS[Math.min(c.idx, TASKS.length - 1)];
  const [typed, setTyped] = useState("");
  const [ans, setAns] = useState<string | null>(null);
  const key = `${c.run}-${c.idx}`; const [seen, setSeen] = useState(key);
  if (seen !== key) { setSeen(key); setTyped(""); setAns(null); }
  const opts = t.kind === "type" ? [["logo", "Logo trường nhiều mảng màu phẳng"], ["anh", "Ảnh chụp phong cảnh"], ["nhu-nhau", "Như nhau"]] : [["van-ban", "Tệp văn bản bài làm, tệp chương trình"], ["anh", "Ảnh gửi qua tin nhắn"], ["video", "Video xem trực tuyến"]];
  const prompt = t.kind === "rle" ? <>Viết dòng <span className="font-mono">{t.row}</span> theo kiểu loạt (vd 4T…).</> : t.kind === "type" ? "Cùng chất lượng, loại ảnh nào nén được nhỏ hơn?" : "Loại tệp nào BẮT BUỘC dùng nén không mất dữ liệu?";
  const check = () => {
    if (t.kind === "rle") { const want = rle(t.row).map(([ch, n]) => `${n}${ch}`).join(""); const ok = typed.replace(/\s/g, "").toUpperCase() === want; return c.check(ok, ok ? `Đúng: ${want} — 6 kí hiệu thay vì 12.` : "Đếm từng loạt chữ giống nhau liên tiếp: số lượng rồi đến chữ."); }
    if (t.kind === "type") return c.check(ans === "logo", ans === "logo" ? "Đúng: mảng màu phẳng lặp lại nhiều nên nén tốt; ảnh chụp chi tiết thay đổi liên tục." : "Thử đổi loại ảnh ở màn Nén mất dữ liệu.");
    return c.check(ans === "van-ban", ans === "van-ban" ? "Đúng: sai một kí tự là chương trình chạy sai — phải giải nén ra y hệt (ZIP, PNG)." : "Loại nào sai một chút là hỏng hẳn?");
  };
  return (
    <ChallengeFrame c={c} prompt={prompt} onCheck={check} summary={["Nén mất dữ liệu (JPEG, video) bỏ chi tiết mắt khó thấy để giảm dung lượng nhiều lần.", "Nén không mất dữ liệu (ZIP, PNG) tìm phần lặp lại, giải nén ra y hệt bản gốc.", "Ảnh nhiều mảng màu phẳng nén tốt hơn ảnh chụp chi tiết."]}>
      <Stage className="p-4">{t.kind === "rle" ? <input aria-label="Chuỗi đã nén" value={typed} onChange={(e) => setTyped(e.target.value)} className="h-11 w-full max-w-72 rounded-xl border border-line bg-surface px-3 font-mono uppercase text-fg" placeholder="vd 4T…" />
        : <div className="grid gap-2 sm:grid-cols-3">{opts.map(([id, l]) => <button key={id} type="button" aria-pressed={ans === id} onClick={() => setAns(id)} className={cn("rounded-xl border-2 px-4 py-3 text-left font-semibold", ans === id ? "border-brand bg-brand/10" : "border-line bg-surface")}>{l}</button>)}</div>}</Stage>
    </ChallengeFrame>
  );
}

export function ImageCompressLab() {
  return <SimShell title="Nén ảnh khi gửi qua mạng" screens={[{ id: "mat", label: "Nén mất dữ liệu", icon: ImageIcon, render: () => <LossyScreen /> }, { id: "rle", label: "Nén theo loạt", icon: Rows3, render: () => <RleScreen /> }, { id: "thu-thach", label: "Thử thách", render: () => <Game /> }]} />;
}
