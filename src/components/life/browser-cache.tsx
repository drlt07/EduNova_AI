"use client";
/** Bộ nhớ đệm trình duyệt: trang đã lưu mở ngay, trang chưa lưu phải tải từ máy chủ; đầy thì bỏ trang lâu nhất chưa mở lại (LRU). */
import { useState } from "react";
import { Database, Timer, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { cacheMisses, diagnoseMisses, parseNum, runCache } from "@/lib/sim/life-computer";
import { Input } from "@/components/ui/form";
import { ChallengeFrame, Panel, Readout, ResetAll, SimLayout, SimShell, SimSlider, Stage, useChallenge } from "@/components/phet/kit";

export const SITES: Record<string, { label: string; icon: string; color: string }> = {
  truong: { label: "Trang trường", icon: "🏫", color: "#0ea5e9" },
  tkb: { label: "Thời khóa biểu", icon: "📅", color: "#f59e0b" },
  tudien: { label: "Từ điển", icon: "📖", color: "#10b981" },
  bando: { label: "Bản đồ", icon: "🗺️", color: "#ec4899" },
  video: { label: "Video bài giảng", icon: "🎬", color: "#8b5cf6" },
};
const HIT_S = 0.1, MISS_S = 1.5;
const fmtS = (s: number) => s.toLocaleString("vi-VN", { maximumFractionDigits: 1 });

function Chip({ id, small, dim }: { id: string; small?: boolean; dim?: boolean }) {
  const s = SITES[id];
  return <span className={cn("inline-flex items-center gap-1.5 rounded-xl font-semibold text-white shadow-sm", small ? "px-2 py-1 text-xs" : "px-3 py-2 text-sm", dim && "opacity-40")} style={{ background: s.color }}><span aria-hidden>{s.icon}</span>{s.label}</span>;
}

/** Kệ bộ nhớ đệm: trái = lâu chưa dùng nhất (sẽ bị bỏ trước), phải = vừa dùng. */
function Shelf({ cache, size, evicted }: { cache: string[]; size: number; evicted?: string }) {
  return (
    <div>
      <div className="flex items-stretch gap-2 rounded-2xl border-2 border-dashed border-line bg-surface/70 p-2">
        {Array.from({ length: size }, (_, i) => <div key={i} className="grid min-h-12 flex-1 place-items-center rounded-xl bg-surface-2/70">{cache[i] && <span key={cache[i] + cache.length} className="sim-pop"><Chip id={cache[i]} small /></span>}</div>)}
      </div>
      <div className="mt-1 flex justify-between text-[11px] text-muted"><span>← lâu chưa mở nhất (bị bỏ trước)</span><span>vừa mở →</span></div>
      {evicted && <p className="mt-1 text-xs text-danger-fg">Bộ nhớ đệm đầy: bỏ <b>{SITES[evicted].label}</b> ra.</p>}
    </div>
  );
}

function Explore() {
  const [size, setSize] = useState(2);
  const [seq, setSeq] = useState<string[]>([]);
  const steps = runCache(seq, size);
  const last = steps.at(-1);
  const hits = steps.filter((s) => s.hit).length;
  const time = steps.reduce((t, s) => t + (s.hit ? HIT_S : MISS_S), 0);
  return (
    <SimLayout
      stage={
        <Stage className="space-y-4 p-4">
          <div className="grid items-center gap-3 sm:grid-cols-[1fr_auto_1fr]">
            <div className="rounded-2xl bg-slate-900 p-3 text-center text-white"><p className="text-xs uppercase tracking-widest text-slate-400">Máy chủ ở xa</p><p className="text-3xl">🖥️</p></div>
            <div className="relative h-3 w-full rounded-full bg-line sm:w-32">
              {last && !last.hit && <span key={seq.length} className="sim-drive absolute -top-1.5 left-0 size-6 rounded-full" style={{ background: SITES[last.site].color, animationIterationCount: 1, animationDuration: "1.2s" }} />}
            </div>
            <div className="rounded-2xl border border-line bg-white p-3 text-center text-slate-900">
              <p className="text-xs uppercase tracking-widest text-slate-500">Trình duyệt</p>
              {last ? (
                <p key={seq.length} className="sim-pop mt-1 text-lg font-bold">{SITES[last.site].icon} {SITES[last.site].label}<span className={cn("block text-sm font-semibold", last.hit ? "text-emerald-600" : "text-amber-600")}>{last.hit ? <><Zap className="inline size-4" /> {fmtS(HIT_S)} giây · lấy từ bộ nhớ đệm</> : <><Timer className="inline size-4" /> {fmtS(MISS_S)} giây · tải từ máy chủ</>}</span></p>
              ) : <p className="mt-1 text-sm text-slate-500">Bấm một trang bên phải để mở</p>}
            </div>
          </div>
          <Shelf cache={last?.cache ?? []} size={size} evicted={last?.evicted} />
          <ol className="flex flex-wrap gap-1">{steps.map((s, i) => <li key={i} className={cn("rounded-md px-1.5 py-0.5 text-xs font-semibold", s.hit ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200" : "bg-amber-100 text-amber-900 dark:bg-amber-500/20 dark:text-amber-100")}>{SITES[s.site].icon} {s.hit ? "nhanh" : "chậm"}</li>)}</ol>
        </Stage>
      }
      controls={
        <>
          <Panel title="Mở trang"><div className="flex flex-wrap gap-1.5">{Object.keys(SITES).map((id) => <button key={id} type="button" onClick={() => setSeq((x) => [...x, id])} className="transition-transform hover:-translate-y-0.5"><Chip id={id} small /></button>)}</div></Panel>
          <Panel title="Bộ nhớ đệm"><SimSlider label="Số trang giữ được" value={size} min={1} max={4} onChange={(v) => setSize(v)} /></Panel>
          <div className="grid grid-cols-2 gap-2"><Readout label="Mở nhanh" value={hits} tone="green" /><Readout label="Tải chậm" value={steps.length - hits} tone="amber" /></div>
          <Readout label="Tổng thời gian chờ" value={`${fmtS(time)} giây`} />
          <ResetAll onClick={() => { setSeq([]); setSize(2); }} />
        </>
      }
    />
  );
}

type Task = { kind: "count"; seq: string[]; size: number; prompt: string } | { kind: "evict"; seq: string[]; size: number; prompt: string } | { kind: "size"; seq: string[]; max: number; prompt: string };
const TASKS: Task[] = [
  { kind: "count", seq: ["truong", "tkb", "truong", "tudien", "tkb"], size: 2, prompt: "Bộ nhớ đệm giữ được 2 trang. Mở lần lượt các trang dưới đây: có bao nhiêu lần phải tải chậm từ máy chủ?" },
  { kind: "evict", seq: ["truong", "tkb", "tudien", "truong", "bando"], size: 3, prompt: "Bộ nhớ đệm giữ 3 trang. Khi mở Bản đồ ở lượt cuối, trang nào bị bỏ ra? Bấm vào trang đó." },
  { kind: "count", seq: ["video", "tudien", "video", "bando", "tudien", "video"], size: 2, prompt: "Bộ nhớ đệm giữ 2 trang. Đếm số lần tải chậm." },
  { kind: "size", seq: ["truong", "tkb", "tudien", "truong", "tkb", "tudien", "truong"], max: 4, prompt: "Chọn bộ nhớ đệm NHỎ NHẤT sao cho dãy mở trang này tải chậm không quá 4 lần." },
];

function Game() {
  const c = useChallenge(TASKS.length);
  const t = TASKS[Math.min(c.idx, TASKS.length - 1)];
  const [typed, setTyped] = useState("");
  const [pick, setPick] = useState<string | null>(null);
  const [size, setSize] = useState(1);
  const key = `${c.run}-${c.idx}`; const [seen, setSeen] = useState(key);
  if (seen !== key) { setSeen(key); setTyped(""); setPick(null); setSize(1); }
  const evictHints: [string, string, string] = ["Đầy rồi thì bỏ trang LÂU NHẤT chưa được mở lại — không phải trang vào sớm nhất.", "Trang trường được mở lại ở lượt 4 nên nó thành trang “vừa dùng”.", "Xếp lại thứ tự “lâu chưa dùng” sau lượt 4 rồi xem trang nào đứng đầu."];
  const minSize = [1, 2, 3, 4].find((s) => cacheMisses(t.seq, s) <= (t.kind === "size" ? t.max : 0));
  const sizeHints: [string, string, string] = ["Thử từng cỡ bộ nhớ đệm, đếm số lần tải chậm.", "Dãy này lặp lại 3 trang liên tục: giữ ít hơn 3 trang thì trang cần mở luôn vừa bị bỏ.", "Cần đủ chỗ cho cả 3 trang hay không?"];
  const diag = t.kind === "count" ? diagnoseMisses(parseNum(typed), t.seq, t.size) : null;
  const check = () => {
    if (t.kind === "count") return c.check(diag!.ok, diag!.ok ? `Đúng: ${cacheMisses(t.seq, t.size)} lần tải chậm.` : `Chưa đúng — ${diag!.error}.`, { answer: typed.trim(), error: diag!.error });
    if (t.kind === "evict") {
      const right = runCache(t.seq, t.size).at(-1)!.evicted!;
      const fifo = runCache(t.seq, t.size, "fifo").at(-1)!.evicted;
      const ok = pick === right;
      const error = ok ? undefined : !pick ? "chưa chọn" : pick === fifo ? "bỏ trang vào sớm nhất thay vì trang lâu chưa dùng nhất" : "chọn sai trang bị bỏ";
      return c.check(ok, ok ? `Đúng: ${SITES[right].label} lâu nhất chưa được mở lại.` : `Chưa đúng — ${error}.`, { answer: pick ?? "", error });
    }
    const misses = cacheMisses(t.seq, size);
    const ok = size === minSize;
    const error = ok ? undefined : misses > t.max ? "bộ nhớ đệm quá nhỏ" : "đủ nhưng chưa nhỏ nhất";
    c.check(ok, ok ? `Đúng: giữ ${size} trang thì chỉ ${misses} lần tải chậm.` : `Giữ ${size} trang → ${misses} lần tải chậm — ${error}.`, { answer: String(size), error });
  };
  return (
    <ChallengeFrame c={c} prompt={t.prompt} onCheck={check} hints={t.kind === "count" ? diag!.hints : t.kind === "evict" ? evictHints : sizeHints} summary={SUMMARY} next="Hàng đợi máy in — vào trước ra trước.">
      <Stage className="space-y-4 p-4">
        <ol className="flex flex-wrap items-center gap-1.5">{t.seq.map((s, i) => <li key={i} className="flex items-center gap-1"><span className="text-xs text-muted">{i + 1}.</span><Chip id={s} small /></li>)}</ol>
        {t.kind === "count" && <div className="mx-auto flex max-w-xs items-center gap-2"><Input aria-label="Số lần tải chậm" inputMode="numeric" className="text-center font-mono text-xl" placeholder="?" value={typed} onChange={(e) => setTyped(e.target.value.replace(/\D/g, ""))} /><span className="font-semibold text-fg">lần</span></div>}
        {t.kind === "evict" && <div className="flex flex-wrap justify-center gap-2">{[...new Set(t.seq.slice(0, -1))].map((s) => <button key={s} type="button" aria-pressed={pick === s} onClick={() => setPick(s)} className={cn("rounded-2xl p-1 ring-offset-2 ring-offset-surface", pick === s && "ring-4 ring-brand")}><Chip id={s} /></button>)}</div>}
        {t.kind === "size" && <div className="mx-auto max-w-sm"><SimSlider label="Bộ nhớ đệm giữ được" value={size} min={1} max={4} onChange={setSize} unit=" trang" /></div>}
      </Stage>
    </ChallengeFrame>
  );
}
const SUMMARY = ["Bộ nhớ đệm (cache) lưu bản sao trang đã mở để lần sau mở ngay, không phải tải lại.", "Bộ nhớ đệm có hạn: đầy thì bỏ trang lâu nhất chưa dùng (LRU).", "Bộ nhớ đệm cũng có trong CPU, ổ cứng, ứng dụng — cùng một ý tưởng: giữ gần thứ hay dùng."];

export function BrowserCacheLab() {
  return <SimShell title="Bộ nhớ đệm trình duyệt" intro={{ story: "Lần đầu mở trang trường mất vài giây, lần sau mở gần như ngay lập tức. Trình duyệt đã giấu gì?", goal: "Dò bộ nhớ đệm và dự đoán lúc nào trang mở nhanh, lúc nào phải tải lại." }} screens={[{ id: "kham-pha", label: "Khám phá", icon: Database, render: () => <Explore /> }, { id: "thu-thach", label: "Thử thách", icon: Zap, render: () => <Game /> }]} />;
}
