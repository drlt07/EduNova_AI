"use client";
/** Thang máy thông minh: phục vụ yêu cầu theo thứ tự bấm hay đi hết một chiều rồi quay lại — so quãng đường. */
import { useEffect, useState } from "react";
import { Building2, Play, RotateCcw, Route } from "lucide-react";
import { cn } from "@/lib/utils";
import { bestTravel, diagnoseRoute, diagnoseTravel, parseNum, scanOrder, travel } from "@/lib/sim/life-computer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form";
import { ChallengeFrame, Panel, Readout, ResetAll, Segmented, SimLayout, SimShell, SimSlider, Stage, useChallenge } from "@/components/phet/kit";

const FLOORS = 10;

/** Tòa nhà cắt dọc: buồng thang chạy theo từng điểm dừng, tầng có người chờ sáng đèn. */
function Shaft({ at, requests, served, onFloor }: { at: number; requests: number[]; served: number[]; onFloor?: (f: number) => void }) {
  const H = 34;
  return (
    <svg viewBox={`0 0 260 ${FLOORS * H + 20}`} className="mx-auto h-auto w-full max-w-xs" role="img" aria-label={`Thang máy đang ở tầng ${at}`}>
      <rect x="20" y="10" width="220" height={FLOORS * H} rx="6" fill="#e2e8f0" />
      <rect x="110" y="10" width="56" height={FLOORS * H} fill="#cbd5e1" />
      {Array.from({ length: FLOORS }, (_, i) => {
        const f = FLOORS - i, y = 10 + i * H;
        const wait = requests.includes(f) && !served.includes(f);
        return (
          <g key={f}>
            <line x1="20" x2="240" y1={y + H} y2={y + H} stroke="#94a3b8" strokeWidth="1" />
            <text x="34" y={y + 22} fontSize="13" fontWeight="700" fill="#334155">{f}</text>
            <rect x="56" y={y + 8} width="36" height="18" rx="3" fill="#bfdbfe" />
            <rect x="184" y={y + 8} width="36" height="18" rx="3" fill="#bfdbfe" />
            <g role={onFloor ? "button" : undefined} tabIndex={onFloor ? 0 : undefined} aria-label={onFloor ? `Gọi thang ở tầng ${f}` : undefined} className={cn(onFloor && "cursor-pointer")} onClick={() => onFloor?.(f)} onKeyDown={(e) => { if (onFloor && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); onFloor(f); } }}>
              <rect x="52" y={y + 2} width="56" height={H - 4} rx="6" fill="transparent" />
              <circle cx="96" cy={y + 17} r="8" fill={wait ? "#f59e0b" : served.includes(f) ? "#22c55e" : "#f8fafc"} stroke="#64748b" className={cn(wait && "sim-blink")} />
            </g>
            {wait && <text x="232" y={y + 22} textAnchor="end" fontSize="14" aria-hidden>🙋</text>}
          </g>
        );
      })}
      <g style={{ transform: `translateY(${10 + (FLOORS - at) * H}px)`, transition: "transform .45s cubic-bezier(.4,0,.2,1)" }}>
        <rect x="113" y="2" width="50" height={H - 4} rx="4" fill="#2563eb" />
        <rect x="119" y="7" width="17" height={H - 14} rx="2" fill="#93c5fd" /><rect x="140" y="7" width="17" height={H - 14} rx="2" fill="#93c5fd" />
      </g>
    </svg>
  );
}

function Explore() {
  const [start, setStart] = useState(5);
  const [reqs, setReqs] = useState<number[]>([8, 2, 9, 4]);
  const [mode, setMode] = useState<"fifo" | "scan">("fifo");
  const [step, setStep] = useState<number | null>(null);
  const order = mode === "fifo" ? reqs : scanOrder(start, reqs, "up");
  useEffect(() => {
    if (step === null || step >= order.length) return;
    const id = window.setTimeout(() => setStep((s) => (s ?? 0) + 1), 650);
    return () => window.clearTimeout(id);
  }, [step, order.length]);
  const served = step === null ? [] : order.slice(0, step);
  const at = served.at(-1) ?? start;
  const toggle = (f: number) => { if (f === start) return; setStep(null); setReqs((r) => (r.includes(f) ? r.filter((x) => x !== f) : r.length >= 7 ? r : [...r, f])); };
  return (
    <SimLayout
      stage={
        <Stage className="grid gap-4 p-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:items-center">
          <Shaft at={at} requests={reqs} served={served} onFloor={toggle} />
          <div className="space-y-3 text-sm">
            <p className="text-muted">Bấm vào nút tầng để thêm hoặc bỏ người chờ (theo thứ tự bấm).</p>
            <div><p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">Thứ tự phục vụ</p>
              <ol className="flex flex-wrap items-center gap-1 font-mono">
                <li className="rounded-md bg-surface-2 px-2 py-1">{start}</li>
                {order.map((f, i) => <li key={i} className="flex items-center gap-1"><span className="text-muted">→</span><span className={cn("rounded-md px-2 py-1", i < served.length ? "bg-success/20 text-success-fg" : "bg-surface-2 text-fg")}>{f}</span></li>)}
              </ol>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Readout label="Theo thứ tự bấm" value={`${travel(start, reqs)} tầng`} tone={mode === "fifo" ? "amber" : "blue"} />
              <Readout label="Đi một chiều" value={`${travel(start, scanOrder(start, reqs, "up"))} tầng`} tone={mode === "scan" ? "green" : "blue"} />
            </div>
            <p className="text-xs text-muted">Ngắn nhất có thể: <b className="text-fg">{reqs.length ? bestTravel(start, reqs) : 0} tầng</b></p>
          </div>
        </Stage>
      }
      controls={
        <>
          <Panel title="Cách phục vụ"><Segmented label="Thang máy đi" value={mode} options={[{ value: "fifo", label: "Theo thứ tự bấm" }, { value: "scan", label: "Hết một chiều" }]} onChange={(v) => { setMode(v); setStep(null); }} /></Panel>
          <Panel title="Xuất phát"><SimSlider label="Thang đang ở tầng" value={start} min={1} max={FLOORS} onChange={(v) => { setStart(v); setReqs((r) => r.filter((x) => x !== v)); setStep(null); }} /></Panel>
          <div className="flex gap-2"><Button size="sm" onClick={() => setStep(0)} disabled={!reqs.length}><Play /> Chạy</Button><Button size="sm" variant="ghost" onClick={() => { setReqs([]); setStep(null); }}>Xóa yêu cầu</Button></div>
          <ResetAll onClick={() => { setStart(5); setReqs([8, 2, 9, 4]); setMode("fifo"); setStep(null); }} />
        </>
      }
    />
  );
}

type Task = { kind: "travel"; start: number; order: number[]; prompt: string } | { kind: "route"; start: number; reqs: number[]; prompt: string };
const TASKS: Task[] = [
  { kind: "travel", start: 1, order: [7, 2, 9, 3], prompt: "Thang ở tầng 1, phục vụ đúng theo thứ tự bấm: 7 → 2 → 9 → 3. Thang đi tất cả bao nhiêu tầng?" },
  { kind: "route", start: 5, reqs: [8, 2, 9, 4], prompt: "Thang ở tầng 5, có người chờ ở các tầng 8, 2, 9, 4. Bấm các tầng theo thứ tự phục vụ để quãng đường ngắn nhất." },
  { kind: "travel", start: 6, order: scanOrder(6, [3, 8, 10, 1], "up"), prompt: "Thang ở tầng 6 đang đi lên, kiểu “hết một chiều” với yêu cầu 3, 8, 10, 1: thang đi 8 → 10 → 3 → 1. Tổng bao nhiêu tầng?" },
  { kind: "route", start: 3, reqs: [1, 4, 7, 2, 6], prompt: "Thang ở tầng 3, chờ ở 1, 4, 7, 2, 6. Xếp thứ tự phục vụ ngắn nhất." },
];

function Game() {
  const c = useChallenge(TASKS.length);
  const t = TASKS[Math.min(c.idx, TASKS.length - 1)];
  const [typed, setTyped] = useState("");
  const [order, setOrder] = useState<number[]>([]);
  const key = `${c.run}-${c.idx}`; const [seen, setSeen] = useState(key);
  if (seen !== key) { setSeen(key); setTyped(""); setOrder([]); }
  const diag = t.kind === "travel" ? diagnoseTravel(parseNum(typed), t.start, t.order) : diagnoseRoute(order, t.start, t.reqs);
  const check = () => {
    const answer = t.kind === "travel" ? typed.trim() : order.join(",");
    const text = diag.ok
      ? t.kind === "travel" ? `Đúng: ${travel(t.start, t.order)} tầng.` : `Đúng: ${t.start} → ${order.join(" → ")} chỉ đi ${travel(t.start, order)} tầng.`
      : t.kind === "route" ? `${t.start} → ${order.join(" → ")} đi ${travel(t.start, order)} tầng — ${diag.error}.` : `Chưa đúng — ${diag.error}.`;
    c.check(diag.ok, text, { answer, error: diag.error });
  };
  const reqs = t.kind === "route" ? t.reqs : t.order;
  return (
    <ChallengeFrame c={c} prompt={t.prompt} onCheck={check} hints={diag.hints} summary={SUMMARY} next="Hàng đợi máy in — thứ tự phục vụ ảnh hưởng thời gian chờ.">
      <Stage className="grid gap-4 p-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:items-center">
        <Shaft at={t.kind === "route" ? order.at(-1) ?? t.start : t.start} requests={reqs} served={t.kind === "route" ? order : []} onFloor={t.kind === "route" ? (f) => { if (t.reqs.includes(f) && !order.includes(f)) setOrder([...order, f]); } : undefined} />
        <div className="space-y-3">
          {t.kind === "route" ? (
            <>
              <p className="text-sm text-muted">Bấm vào nút tầng có người chờ (🙋) theo thứ tự em muốn thang dừng.</p>
              <ol className="flex flex-wrap items-center gap-1 font-mono text-sm"><li className="rounded-md bg-surface-2 px-2 py-1">{t.start}</li>{order.map((f, i) => <li key={i} className="sim-pop flex items-center gap-1"><span className="text-muted">→</span><span className="rounded-md bg-brand/15 px-2 py-1 text-fg">{f}</span></li>)}</ol>
              {order.length > 0 && <Button size="sm" variant="ghost" onClick={() => setOrder([])}><RotateCcw /> Xếp lại</Button>}
            </>
          ) : (
            <div className="flex items-center gap-2"><Input aria-label="Số tầng" inputMode="numeric" className="text-center font-mono text-xl" placeholder="?" value={typed} onChange={(e) => setTyped(e.target.value.replace(/\D/g, ""))} /><span className="font-semibold text-fg">tầng</span></div>
          )}
        </div>
      </Stage>
    </ChallengeFrame>
  );
}
const SUMMARY = ["Thứ tự phục vụ quyết định quãng đường: chạy theo thứ tự bấm thì thang chạy qua lại nhiều.", "Thuật toán “thang máy”: đi hết một chiều, đón mọi tầng trên đường, rồi mới quay đầu.", "Ý tưởng này cũng dùng để xếp lịch đọc ổ đĩa và giao hàng."];

export function ElevatorLab() {
  return <SimShell title="Thang máy thông minh" intro={{ story: "Giờ tan học, người chờ thang máy ở khắp các tầng. Thang nên dừng tầng nào trước?", goal: "So sánh cách phục vụ và tìm lộ trình ngắn nhất." }} screens={[{ id: "kham-pha", label: "Khám phá", icon: Building2, render: () => <Explore /> }, { id: "thu-thach", label: "Thử thách", icon: Route, render: () => <Game /> }]} />;
}
