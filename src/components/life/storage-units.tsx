"use client";
/** Thẻ nhớ chứa được bao nhiêu: ảnh, bài hát, video, ứng dụng chiếm chỗ thế nào; đổi KB → MB → GB theo 1024. */
import { useState } from "react";
import { HardDrive, Calculator } from "lucide-react";
import { cn } from "@/lib/utils";
import { diagnoseFit, ITEM_MB, MB_PER_GB, parseNum, usedMB, type Item } from "@/lib/sim/life-computer";
import { Input } from "@/components/ui/form";
import { ChallengeFrame, Panel, Readout, ResetAll, Segmented, SimLayout, SimShell, SimSlider, Stage, useChallenge } from "@/components/phet/kit";

const ITEMS: { id: Item; label: string; unit: string; max: number; color: string }[] = [
  { id: "anh", label: "Ảnh chụp", unit: "ảnh", max: 5000, color: "#0ea5e9" },
  { id: "bai_hat", label: "Bài hát", unit: "bài", max: 2000, color: "#a855f7" },
  { id: "phut_video", label: "Video Full HD", unit: "phút", max: 300, color: "#f97316" },
  { id: "ung_dung", label: "Ứng dụng", unit: "ứng dụng", max: 40, color: "#10b981" },
];
const fmt = (x: number) => x.toLocaleString("vi-VN", { maximumFractionDigits: 1 });

function Card({ capGB, counts }: { capGB: number; counts: Record<Item, number> }) {
  const cap = capGB * MB_PER_GB;
  const used = usedMB(counts);
  const over = used > cap;
  const segs = ITEMS.reduce<{ id: Item; color: string; x: number; w: number }[]>((out, it) => {
    const x = 64 + Math.min(320, out.reduce((s, g) => s + g.w, 0));
    const w = Math.min((counts[it.id] * ITEM_MB[it.id] / cap) * 320, 384 - x);
    return [...out, { id: it.id, color: it.color, x, w: Math.max(0, w) }];
  }, []);
  return (
    <svg viewBox="0 0 520 260" className="h-auto w-full" role="img" aria-label={`Thẻ ${capGB} GB, đã dùng ${fmt(used / MB_PER_GB)} GB`}>
      <path d="M60 20 h300 l40 40 v180 a12 12 0 0 1 -12 12 h-328 a12 12 0 0 1 -12 -12 v-208 a12 12 0 0 1 12 -12z" fill="#1e293b" />
      {[0, 1, 2, 3, 4, 5, 6].map((i) => <rect key={i} x={78 + i * 34} y="32" width="22" height="34" rx="3" fill="#fbbf24" />)}
      <text x="90" y="104" fontSize="30" fontWeight="800" fill="#fff">{capGB} GB</text>
      <rect x="64" y="130" width="320" height="44" rx="8" fill="#334155" />
      {segs.filter((g) => g.w > 0).map((g) => <rect key={g.id} x={g.x} y="130" width={g.w} height="44" fill={g.color} style={{ transition: "all .3s" }} />)}
      {over && <rect x="64" y="130" width="320" height="44" rx="8" fill="none" stroke="#f43f5e" strokeWidth="4" className="sim-blink" />}
      <text x="64" y="204" fontSize="15" fill="#cbd5e1">Đã dùng {fmt(used / MB_PER_GB)} / {capGB} GB</text>
      <text x="384" y="204" textAnchor="end" fontSize="15" fontWeight="700" fill={over ? "#fb7185" : "#86efac"}>{over ? "Thẻ đầy!" : `Còn ${fmt((cap - used) / MB_PER_GB)} GB`}</text>
      <g transform="translate(420 70)">
        {["B", "KB", "MB", "GB"].map((u, i) => (
          <g key={u} transform={`translate(0 ${i * 44})`}>
            <rect width="80" height="30" rx="8" fill={u === "MB" || u === "GB" ? "#0ea5e9" : "#475569"} />
            <text x="40" y="20" textAnchor="middle" fontSize="14" fontWeight="800" fill="#fff">1 {u}</text>
            {i < 3 && <text x="40" y="42" textAnchor="middle" fontSize="11" fill="#94a3b8">×1024 ↓</text>}
          </g>
        ))}
      </g>
    </svg>
  );
}

const START: Record<Item, number> = { anh: 800, bai_hat: 300, phut_video: 30, ung_dung: 12 };

function Explore() {
  const [cap, setCap] = useState(16);
  const [n, setN] = useState(START);
  const used = usedMB(n);
  return (
    <SimLayout
      stage={
        <Stage dark className="space-y-3 p-4">
          <Card capGB={cap} counts={n} />
          <ul className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
            {ITEMS.map((it) => <li key={it.id} className="rounded-xl bg-white/5 px-3 py-2 text-slate-200"><span className="mr-1.5 inline-block size-2.5 rounded-full" style={{ background: it.color }} />{it.label}<b className="block font-mono text-white">{fmt(n[it.id] * ITEM_MB[it.id])} MB</b><span className="text-xs text-slate-400">{ITEM_MB[it.id]} MB / {it.unit === "ứng dụng" ? "ứng dụng" : it.unit}</span></li>)}
          </ul>
        </Stage>
      }
      controls={
        <>
          <Panel title="Thẻ nhớ"><Segmented label="Dung lượng" value={cap} options={[8, 16, 32, 64].map((v) => ({ value: v, label: `${v} GB` }))} onChange={setCap} /></Panel>
          <Panel title="Em lưu gì?">{ITEMS.map((it) => <SimSlider key={it.id} label={it.label} value={n[it.id]} min={0} max={it.max} step={it.max >= 1000 ? 50 : it.max >= 100 ? 5 : 1} onChange={(v) => setN({ ...n, [it.id]: v })} unit={` ${it.unit}`} />)}</Panel>
          <div className="grid grid-cols-2 gap-2"><Readout label="Đã dùng" value={`${fmt(used)} MB`} tone={used > cap * MB_PER_GB ? "rose" : "blue"} /><Readout label="Còn trống" value={`${fmt(Math.max(0, cap * MB_PER_GB - used))} MB`} tone="green" /></div>
          <ResetAll onClick={() => { setCap(16); setN(START); }} />
        </>
      }
    />
  );
}

const TASKS: { prompt: string; freeGB: number; unit: number; unitLabel: string; note: string }[] = [
  { prompt: "Thẻ nhớ còn trống 8 GB. Chụp được tối đa bao nhiêu ảnh, mỗi ảnh 4 MB?", freeGB: 8, unit: ITEM_MB.anh, unitLabel: "ảnh", note: "8 GB trống · ảnh 4 MB" },
  { prompt: "Thẻ 16 GB đã dùng 9 GB. Quay được tối đa bao nhiêu phút video Full HD (100 MB mỗi phút)?", freeGB: 7, unit: ITEM_MB.phut_video, unitLabel: "phút", note: "16 GB − 9 GB · video 100 MB/phút" },
  { prompt: "Điện thoại còn 2 GB. Tải được tối đa bao nhiêu bài hát, mỗi bài 5 MB?", freeGB: 2, unit: ITEM_MB.bai_hat, unitLabel: "bài", note: "2 GB trống · bài hát 5 MB" },
  { prompt: "Chuyến dã ngoại: thẻ 32 GB phải chứa 2 giờ video (100 MB/phút) và 1000 bài hát (5 MB). Chỗ còn lại chụp được tối đa bao nhiêu ảnh 4 MB?", freeGB: (32 * MB_PER_GB - 120 * 100 - 1000 * 5) / MB_PER_GB, unit: ITEM_MB.anh, unitLabel: "ảnh", note: "32 GB · 120 phút video · 1000 bài hát · ảnh 4 MB" },
];

function Game() {
  const c = useChallenge(TASKS.length);
  const t = TASKS[Math.min(c.idx, TASKS.length - 1)];
  const [typed, setTyped] = useState("");
  const key = `${c.run}-${c.idx}`; const [seen, setSeen] = useState(key);
  if (seen !== key) { setSeen(key); setTyped(""); }
  const diag = diagnoseFit(parseNum(typed), t.freeGB, t.unit);
  const right = Math.floor((t.freeGB * MB_PER_GB) / t.unit);
  const check = () => c.check(diag.ok, diag.ok ? `Đúng: ${fmt(t.freeGB * MB_PER_GB)} MB ÷ ${t.unit} MB = ${fmt((t.freeGB * MB_PER_GB) / t.unit)} → ${right} ${t.unitLabel}.` : `Chưa đúng — ${diag.error}.`, { answer: typed.trim(), error: diag.error });
  return (
    <ChallengeFrame c={c} prompt={t.prompt} onCheck={check} hints={diag.hints} summary={SUMMARY} next="Tải xuống mất bao lâu? — byte, bit và tốc độ mạng.">
      <Stage className="p-5">
        <p className="mb-3 text-center font-mono text-sm text-muted">{t.note}</p>
        <div className="mx-auto flex max-w-xs items-center gap-2">
          <Input aria-label="Số lượng tối đa" inputMode="numeric" className={cn("text-center font-mono text-xl")} placeholder="?" value={typed} onChange={(e) => setTyped(e.target.value.replace(/\D/g, ""))} />
          <span className="font-semibold text-fg">{t.unitLabel}</span>
        </div>
      </Stage>
    </ChallengeFrame>
  );
}
const SUMMARY = ["1 KB = 1024 byte, 1 MB = 1024 KB, 1 GB = 1024 MB.", "Muốn biết chứa được bao nhiêu: đổi về cùng đơn vị rồi chia.", "Kết quả lẻ thì làm tròn xuống — tệp cuối không đủ chỗ sẽ không lưu được."];

export function StorageUnitsLab() {
  return <SimShell title="Thẻ nhớ chứa được bao nhiêu?" intro={{ story: "Điện thoại báo “Bộ nhớ sắp đầy” giữa chuyến đi. Ảnh, nhạc, video, ứng dụng chiếm bao nhiêu chỗ?", goal: "Đổi đơn vị dung lượng và tính số tệp tối đa còn lưu được." }} screens={[{ id: "kham-pha", label: "Khám phá", icon: HardDrive, render: () => <Explore /> }, { id: "thu-thach", label: "Thử thách", icon: Calculator, render: () => <Game /> }]} />;
}
