"use client";
/** Tải xuống mất bao lâu: dung lượng (byte) và tốc độ mạng (bit/giây) — vì sao mạng 100 Mbps không tải được 100 MB mỗi giây. */
import { useEffect, useState } from "react";
import { Download, Gauge, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { diagnoseDownload, downloadSeconds, MB_PER_GB, parseNum } from "@/lib/sim/life-computer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form";
import { ChallengeFrame, Panel, Readout, ResetAll, Segmented, SimLayout, SimShell, Stage, useChallenge } from "@/components/phet/kit";

const FILES = [
  { id: "anh", label: "Ảnh chụp", mb: 3 },
  { id: "nhac", label: "Bài hát", mb: 8 },
  { id: "phim", label: "Phim 1,5 GB", mb: 1.5 * MB_PER_GB },
  { id: "game", label: "Trò chơi 40 GB", mb: 40 * MB_PER_GB },
];
const NETS = [
  { value: 2, label: "3G · 2 Mbps" },
  { value: 30, label: "4G · 30 Mbps" },
  { value: 100, label: "Wi-Fi · 100 Mbps" },
  { value: 300, label: "Cáp quang · 300 Mbps" },
];

const fmt = (x: number, d = 1) => (Number.isInteger(x) ? x.toLocaleString("vi-VN") : x.toLocaleString("vi-VN", { maximumFractionDigits: d }));
export function humanSeconds(s: number) {
  if (s < 60) return `${fmt(s)} giây`;
  if (s < 3600) return `${Math.floor(s / 60)} phút ${Math.round(s % 60)} giây`;
  return `${Math.floor(s / 3600)} giờ ${Math.round((s % 3600) / 60)} phút`;
}
const sizeText = (mb: number) => (mb >= MB_PER_GB ? `${fmt(mb / MB_PER_GB)} GB` : `${fmt(mb)} MB`);

/** Máy chủ → dòng gói tin → máy tính; thanh tiến trình chạy rút gọn tối đa 4 giây. */
function Pipe({ progress, mbps, running }: { progress: number; mbps: number; running: boolean }) {
  const dots = Math.min(10, Math.max(2, Math.round(Math.log2(mbps) * 1.4)));
  return (
    <svg viewBox="0 0 640 200" className="h-auto w-full" role="img" aria-label={`Đang tải ${Math.round(progress * 100)}%`}>
      <rect x="24" y="44" width="110" height="112" rx="14" fill="#1e293b" />
      {[0, 1, 2].map((i) => <g key={i}><rect x="38" y={58 + i * 32} width="82" height="22" rx="5" fill="#334155" /><circle cx="108" cy={69 + i * 32} r="4" fill={running ? "#22c55e" : "#64748b"} className={cn(running && "sim-blink")} /></g>)}
      <text x="79" y="178" textAnchor="middle" fontSize="13" fill="#64748b">Máy chủ</text>
      <path d="M140 100 H470" stroke="#cbd5e1" strokeWidth="14" strokeLinecap="round" />
      <path d="M140 100 H470" stroke="#38bdf8" strokeWidth="4" strokeDasharray="10 14" className={cn(running && "sim-flow")} />
      {running && Array.from({ length: dots }, (_, i) => <circle key={i} cx={150 + ((i * 320) / dots)} cy="100" r="5" fill="#0ea5e9" className="sim-drive" style={{ animationDuration: `${1.4 + (i % 3) * 0.2}s` }} />)}
      <text x="305" y="80" textAnchor="middle" fontSize="13" fontWeight="700" fill="#0369a1">{mbps} Mbps = {fmt(mbps / 8, 2)} MB/giây</text>
      <rect x="486" y="52" width="130" height="82" rx="8" fill="#0f172a" />
      <rect x="494" y="60" width="114" height="66" rx="4" fill="#e0f2fe" />
      <rect x="470" y="134" width="162" height="10" rx="4" fill="#334155" />
      <rect x="504" y="98" width="94" height="10" rx="5" fill="#bae6fd" />
      <rect x="504" y="98" width={94 * progress} height="10" rx="5" fill="#0284c7" />
      <text x="551" y="86" textAnchor="middle" fontSize="15" fontWeight="800" fill="#0f172a">{Math.round(progress * 100)}%</text>
      <text x="551" y="178" textAnchor="middle" fontSize="13" fill="#64748b">Máy của em</text>
    </svg>
  );
}

function useFakeDownload(seconds: number) {
  const [p, setP] = useState(0);
  const [running, setRunning] = useState(false);
  useEffect(() => {
    if (!running) return;
    const dur = Math.min(4000, Math.max(600, seconds * 40)); // rút gọn thời gian thật
    const t0 = performance.now();
    let raf = 0;
    const tick = () => { const x = Math.min(1, (performance.now() - t0) / dur); setP(x); if (x < 1) raf = requestAnimationFrame(tick); else setRunning(false); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [running, seconds]);
  return { p, running, start: () => { setP(0); setRunning(true); }, reset: () => { setP(0); setRunning(false); } };
}

function Explore() {
  const [file, setFile] = useState(FILES[2].id);
  const [mbps, setMbps] = useState(100);
  const f = FILES.find((x) => x.id === file)!;
  const sec = downloadSeconds(f.mb, mbps);
  const dl = useFakeDownload(sec);
  return (
    <SimLayout
      stage={
        <Stage className="space-y-4 p-4">
          <Pipe progress={dl.p} mbps={mbps} running={dl.running} />
          <div className="rounded-2xl bg-slate-900 px-4 py-3 text-center text-white">
            <p className="font-mono text-sm text-slate-300 [font-variant-ligatures:none]">
              {f.mb >= MB_PER_GB && <>{sizeText(f.mb)} × 1024 = </>}{fmt(f.mb)} MB × 8 = {fmt(f.mb * 8)} Mb ÷ {mbps} Mb/giây
            </p>
            <p className="mt-1 text-3xl font-extrabold text-sky-300">{humanSeconds(sec)}</p>
          </div>
        </Stage>
      }
      controls={
        <>
          <Panel title="Tệp cần tải">
            <div className="grid grid-cols-2 gap-1.5">{FILES.map((x) => <button key={x.id} type="button" aria-pressed={file === x.id} onClick={() => { setFile(x.id); dl.reset(); }} className={cn("rounded-xl border-2 px-2 py-2 text-left text-sm transition-colors", file === x.id ? "border-brand bg-brand/10 font-semibold" : "border-line bg-surface hover:border-brand/50")}>{x.label}<span className="block text-xs text-muted">{sizeText(x.mb)}</span></button>)}</div>
          </Panel>
          <Panel title="Mạng"><Segmented label="Tốc độ" value={mbps} options={NETS} onChange={(v) => { setMbps(v); dl.reset(); }} /></Panel>
          <div className="grid grid-cols-2 gap-2"><Readout label="Dung lượng" value={sizeText(f.mb)} /><Readout label="MB mỗi giây" value={fmt(mbps / 8, 2)} tone="green" /></div>
          <Button onClick={dl.start} disabled={dl.running}><Play /> Tải thử</Button>
          <ResetAll onClick={() => { setFile(FILES[2].id); setMbps(100); dl.reset(); }} />
        </>
      }
    />
  );
}

type Task = { kind: "time"; prompt: string; mb: number; gb?: boolean; mbps: number } | { kind: "pick"; prompt: string; mb: number; limit: number };
const TASKS: Task[] = [
  { kind: "time", prompt: "Tải một bài hát 8 MB qua mạng 4G tốc độ 32 Mbps mất bao nhiêu giây?", mb: 8, mbps: 32 },
  { kind: "time", prompt: "Gửi một ảnh 3 MB khi điện thoại chỉ bắt được 3G (2 Mbps) mất bao nhiêu giây?", mb: 3, mbps: 2 },
  { kind: "time", prompt: "Tải bộ phim 1 GB qua Wi-Fi 100 Mbps mất khoảng bao nhiêu giây?", mb: MB_PER_GB, gb: true, mbps: 100 },
  { kind: "pick", prompt: "Cần tải trò chơi 4 GB trong dưới 10 phút. Chọn gói mạng RẺ nhất (chậm nhất) mà vẫn kịp.", mb: 4 * MB_PER_GB, limit: 600 },
];

function Game() {
  const c = useChallenge(TASKS.length);
  const t = TASKS[Math.min(c.idx, TASKS.length - 1)];
  const [typed, setTyped] = useState("");
  const [net, setNet] = useState(2);
  const key = `${c.run}-${c.idx}`; const [seen, setSeen] = useState(key);
  if (seen !== key) { setSeen(key); setTyped(""); setNet(2); }
  const fits = (m: number) => downloadSeconds(t.mb, m) < (t.kind === "pick" ? t.limit : 0);
  const cheapest = NETS.find((n) => fits(n.value))?.value;
  const diag = t.kind === "time" ? diagnoseDownload(parseNum(typed), t.mb, t.mbps, !!t.gb) : null;
  const pickHints: [string, string, string] = ["4 GB = 4 × 1024 MB, rồi × 8 để ra megabit.", "10 phút = 600 giây. Tính thời gian tải với từng gói mạng.", "Gói chậm nhất mà thời gian vẫn dưới 600 giây là đáp án."];
  const check = () => {
    if (t.kind === "time") {
      const right = downloadSeconds(t.mb, t.mbps);
      return c.check(diag!.ok, diag!.ok ? `Đúng: ${fmt(t.mb)} MB × 8 ÷ ${t.mbps} ≈ ${fmt(right)} giây.` : `Chưa đúng — ${diag!.error}.`, { answer: typed.trim(), error: diag!.error });
    }
    const ok = net === cheapest;
    const sec = downloadSeconds(t.mb, net);
    const error = !fits(net) ? "gói mạng quá chậm" : ok ? undefined : "kịp nhưng chưa phải gói rẻ nhất";
    c.check(ok, ok ? `Đúng: ${net} Mbps tải xong trong ${humanSeconds(sec)}, dưới 10 phút.` : `${net} Mbps cần ${humanSeconds(sec)} — ${error}.`, { answer: String(net), error });
  };
  return (
    <ChallengeFrame c={c} prompt={t.prompt} onCheck={check} hints={t.kind === "time" ? diag!.hints : pickHints} summary={SUMMARY} next="Thẻ nhớ chứa được bao nhiêu? — đổi đơn vị KB, MB, GB.">
      <Stage className="p-5">
        {t.kind === "time" ? (
          <div className="mx-auto flex max-w-sm items-center gap-2">
            <Input aria-label="Số giây" inputMode="decimal" className="text-center font-mono text-xl" placeholder="?" value={typed} onChange={(e) => setTyped(e.target.value.replace(/[^\d.,]/g, ""))} />
            <span className="font-semibold text-fg">giây</span>
          </div>
        ) : (
          <div className="space-y-3">
            <Segmented label="Gói mạng" value={net} options={NETS} onChange={setNet} />
            <p className="text-center text-sm text-muted">Bấm Kiểm tra để xem thời gian tải với gói đã chọn.</p>
          </div>
        )}
      </Stage>
    </ChallengeFrame>
  );
}
const SUMMARY = ["Tốc độ mạng tính bằng bit/giây (Mbps), dung lượng tệp tính bằng byte (MB): 1 byte = 8 bit.", "Mạng 100 Mbps chỉ tải được khoảng 12,5 MB mỗi giây.", "Thời gian tải = dung lượng × 8 ÷ tốc độ; 1 GB = 1024 MB."];

export function DownloadTimeLab() {
  return <SimShell title="Tải xuống mất bao lâu?" intro={{ story: "Mạng nhà em ghi 100 Mbps, sao bộ phim 1,5 GB không tải xong trong 15 giây?", goal: "Tính đúng thời gian tải từ dung lượng và tốc độ mạng." }} screens={[{ id: "kham-pha", label: "Khám phá", icon: Download, render: () => <Explore /> }, { id: "thu-thach", label: "Thử thách", icon: Gauge, render: () => <Game /> }]} />;
}
