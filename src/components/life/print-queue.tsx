"use client";
/** Hàng đợi máy in: ai gửi trước in trước (queue); đổi thứ tự in để thời gian chờ trung bình nhỏ nhất. */
import { useEffect, useState } from "react";
import { ListOrdered, Play, Printer, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { avgWait, diagnosePrintOrder, diagnosePrintWait, parseNum, printOrder, printWaits, SEC_PER_PAGE, type PrintJob } from "@/lib/sim/life-computer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form";
import { ChallengeFrame, Panel, Readout, ResetAll, Segmented, SimLayout, SimShell, SimSlider, Stage, useChallenge } from "@/components/phet/kit";

const COLORS = ["#6366f1", "#f59e0b", "#10b981", "#ec4899", "#0ea5e9"];
export const PRINT_JOBS: PrintJob[] = [
  { id: "minh", name: "Minh", pages: 12 },
  { id: "lan", name: "Lan", pages: 2 },
  { id: "huy", name: "Huy", pages: 5 },
  { id: "vy", name: "Vy", pages: 1 },
];
const color = (id: string) => COLORS[PRINT_JOBS.findIndex((j) => j.id === id) % COLORS.length] ?? COLORS[4];

/** Biểu đồ thời gian: phần chờ (nhạt) và phần in (đậm) của từng tài liệu. */
function Timeline({ order, now, hide }: { order: PrintJob[]; now?: number; hide?: boolean }) {
  const ws = printWaits(order);
  const total = ws.at(-1)?.end ?? 1;
  return (
    <div className="space-y-1.5">
      {ws.map((w) => (
        <div key={w.job.id} className="flex items-center gap-2 text-sm">
          <span className="w-12 shrink-0 font-semibold text-fg">{w.job.name}</span>
          <div className="relative h-6 flex-1 rounded-md bg-surface-2">
            <div className="absolute inset-y-0 left-0 rounded-l-md opacity-25" style={{ width: `${(w.start / total) * 100}%`, background: color(w.job.id) }} />
            <div className="absolute inset-y-0 rounded-md transition-all" style={{ left: `${(w.start / total) * 100}%`, width: `${((w.end - w.start) / total) * 100}%`, background: color(w.job.id), opacity: now === undefined || now >= w.start ? 1 : 0.45 }} />
          </div>
          <span className="w-24 shrink-0 text-right font-mono text-xs text-muted">{hide ? `${w.job.pages} trang` : `chờ ${w.start} giây`}</span>
        </div>
      ))}
      {now !== undefined && <div className="ml-14 mr-[6.5rem] h-1 rounded-full bg-line"><div className="h-full rounded-full bg-fg transition-[width] duration-200" style={{ width: `${Math.min(100, (now / total) * 100)}%` }} /></div>}
    </div>
  );
}

function PrinterArt({ job, page, of }: { job?: PrintJob; page: number; of: number }) {
  return (
    <svg viewBox="0 0 220 150" className="h-36 w-auto" role="img" aria-label={job ? `Đang in tài liệu của ${job.name}, trang ${page}/${of}` : "Máy in đang rảnh"}>
      <rect x="40" y="20" width="140" height="22" rx="4" fill="#e2e8f0" />
      {job && <rect key={`${job.id}-${page}`} x="62" y="44" width="96" height="70" rx="3" fill="#fff" stroke={color(job.id)} strokeWidth="2" className="sim-drop" />}
      <rect x="20" y="40" width="180" height="56" rx="12" fill="#334155" />
      <rect x="34" y="52" width="40" height="8" rx="4" fill={job ? "#22c55e" : "#64748b"} className={cn(job && "sim-blink")} />
      <rect x="50" y="96" width="120" height="8" rx="3" fill="#1e293b" />
      {job && <text x="110" y="134" textAnchor="middle" fontSize="13" fontWeight="700" fill={color(job.id)}>{job.name} · trang {page}/{of}</text>}
    </svg>
  );
}

function Explore() {
  const [jobs, setJobs] = useState(PRINT_JOBS);
  const [policy, setPolicy] = useState<"fifo" | "sjf">("fifo");
  const [t, setT] = useState<number | null>(null);
  const order = printOrder(jobs, policy);
  const ws = printWaits(order);
  const total = ws.at(-1)?.end ?? 0;
  useEffect(() => {
    if (t === null || t >= total) return;
    const id = window.setTimeout(() => setT((x) => (x ?? 0) + SEC_PER_PAGE), 260);
    return () => window.clearTimeout(id);
  }, [t, total]);
  const cur = t === null ? undefined : ws.find((w) => t >= w.start && t < w.end);
  const queue = t === null ? order : order.filter((j) => (ws.find((w) => w.job.id === j.id)!.start) > t);
  const setPages = (id: string, pages: number) => { setJobs((js) => js.map((j) => (j.id === id ? { ...j, pages } : j))); setT(null); };
  return (
    <SimLayout
      stage={
        <Stage className="space-y-4 p-4">
          <div className="flex flex-wrap items-center gap-4">
            <PrinterArt job={cur?.job} page={cur ? (t! - cur.start) / SEC_PER_PAGE + 1 : 0} of={cur?.job.pages ?? 0} />
            <div className="min-w-0 flex-1">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">Hàng đợi (đầu hàng bên trái)</p>
              <ol className="flex min-h-14 flex-wrap gap-2">
                {queue.map((j, i) => <li key={j.id} className="sim-pop flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-white shadow" style={{ background: color(j.id) }}><span className="grid size-5 place-items-center rounded-full bg-white/25 text-xs">{i + 1}</span>{j.name} · {j.pages} tr</li>)}
                {queue.length === 0 && <li className="text-sm text-muted">{t === null ? "" : "In xong hết!"}</li>}
              </ol>
            </div>
          </div>
          <Timeline order={order} now={t ?? undefined} />
        </Stage>
      }
      controls={
        <>
          <Panel title="Cách xếp hàng"><Segmented label="Máy in phục vụ" value={policy} options={[{ value: "fifo", label: "Gửi trước in trước" }, { value: "sjf", label: "Tài liệu ngắn trước" }]} onChange={(v) => { setPolicy(v); setT(null); }} /></Panel>
          <Panel title="Số trang (theo thứ tự gửi)">{jobs.map((j) => <SimSlider key={j.id} label={j.name} value={j.pages} min={1} max={20} onChange={(v) => setPages(j.id, v)} unit=" tr" />)}</Panel>
          <div className="grid grid-cols-2 gap-2"><Readout label="Chờ trung bình" value={`${Math.round(avgWait(order))} giây`} tone="amber" /><Readout label="In xong sau" value={`${total} giây`} /></div>
          <div className="flex gap-2"><Button size="sm" onClick={() => setT(0)}><Play /> In</Button><span className="self-center text-xs text-muted">10 trang/phút</span></div>
          <ResetAll onClick={() => { setJobs(PRINT_JOBS); setPolicy("fifo"); setT(null); }} />
        </>
      }
    />
  );
}

type Task = { kind: "order"; want: "fifo" | "sjf"; prompt: string } | { kind: "wait"; policy: "fifo" | "sjf"; target: string; prompt: string };
const TASKS: Task[] = [
  { kind: "order", want: "fifo", prompt: "Máy in phòng Tin xếp hàng theo kiểu “gửi trước in trước”. Bấm tên theo đúng thứ tự tài liệu được in." },
  { kind: "wait", policy: "fifo", target: "vy", prompt: "Vy chỉ in 1 trang nhưng gửi sau cùng. Vy phải chờ bao nhiêu giây thì máy mới bắt đầu in cho Vy?" },
  { kind: "order", want: "sjf", prompt: "Cô giáo muốn cả lớp chờ trung bình ít nhất. Bấm tên theo thứ tự in tốt nhất." },
  { kind: "wait", policy: "sjf", target: "minh", prompt: "Với cách xếp tài liệu ngắn trước, Minh (12 trang) phải chờ bao nhiêu giây?" },
];

function Game() {
  const c = useChallenge(TASKS.length);
  const t = TASKS[Math.min(c.idx, TASKS.length - 1)];
  const [picked, setPicked] = useState<string[]>([]);
  const [typed, setTyped] = useState("");
  const key = `${c.run}-${c.idx}`; const [seen, setSeen] = useState(key);
  if (seen !== key) { setSeen(key); setPicked([]); setTyped(""); }
  const diag = t.kind === "order" ? diagnosePrintOrder(picked, PRINT_JOBS, t.want) : diagnosePrintWait(parseNum(typed), PRINT_JOBS, t.policy, t.target);
  const byId = (id: string) => PRINT_JOBS.find((j) => j.id === id)!;
  const check = () => {
    const answer = t.kind === "order" ? picked.join(",") : typed.trim();
    const text = diag.ok
      ? t.kind === "order" ? `Đúng! Thời gian chờ trung bình: ${Math.round(avgWait(picked.map(byId)))} giây.` : `Đúng: cộng số trang của các tài liệu in trước rồi nhân ${SEC_PER_PAGE} giây.`
      : `Chưa đúng — ${diag.error}.`;
    c.check(diag.ok, text, { answer, error: diag.error });
  };
  return (
    <ChallengeFrame c={c} prompt={t.prompt} onCheck={check} hints={diag.hints} summary={SUMMARY} next="Hoàn tác Ctrl+Z — ngăn xếp, “người đến sau ra trước”.">
      <Stage className="space-y-4 p-4">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">Thứ tự gửi lên máy in</p>
          <div className="flex flex-wrap gap-2">
            {PRINT_JOBS.map((j, i) => {
              const n = picked.indexOf(j.id);
              return (
                <button key={j.id} type="button" disabled={t.kind !== "order" || n >= 0} onClick={() => setPicked([...picked, j.id])} className={cn("flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-white shadow transition-transform", t.kind === "order" && n < 0 && "hover:-translate-y-0.5", n >= 0 && "opacity-40")} style={{ background: color(j.id) }}>
                  <span className="text-xs opacity-80">#{i + 1}</span> {j.name} · {j.pages} trang
                </button>
              );
            })}
          </div>
        </div>
        {t.kind === "order" ? (
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">Thứ tự in của em</p>
            <ol className="flex min-h-11 flex-wrap items-center gap-2 rounded-xl border-2 border-dashed border-line p-2">
              {picked.map((id, i) => <li key={id} className="sim-pop rounded-lg px-3 py-1.5 text-sm font-semibold text-white" style={{ background: color(id) }}>{i + 1}. {byId(id).name}</li>)}
              {picked.length > 0 && <li><Button size="sm" variant="ghost" onClick={() => setPicked([])}><RotateCcw /> Xếp lại</Button></li>}
            </ol>
          </div>
        ) : (
          <div className="space-y-3">
            <Timeline order={printOrder(PRINT_JOBS, t.policy)} hide />
            <div className="mx-auto flex max-w-xs items-center gap-2"><Input aria-label="Số giây chờ" inputMode="numeric" className="text-center font-mono text-xl" placeholder="?" value={typed} onChange={(e) => setTyped(e.target.value.replace(/\D/g, ""))} /><span className="font-semibold text-fg">giây</span></div>
            <p className="text-center text-xs text-muted">Máy in 10 trang mỗi phút: mỗi trang {SEC_PER_PAGE} giây. Biểu đồ cho biết thứ tự in; số giây em tự tính nhé.</p>
          </div>
        )}
      </Stage>
    </ChallengeFrame>
  );
}
const SUMMARY = ["Hàng đợi (queue): vào trước ra trước — máy in, tổng đài, xếp hàng mua vé.", "Thời gian chờ = tổng thời gian phục vụ những người đứng trước.", "Phục vụ việc ngắn trước làm thời gian chờ trung bình nhỏ nhất, nhưng việc dài có thể phải chờ rất lâu."];

export function PrintQueueLab() {
  return <SimShell title="Hàng đợi máy in" intro={{ story: "Bốn bạn cùng bấm In lên một máy in của phòng Tin. Máy in mỗi lúc chỉ in được một tài liệu.", goal: "Hiểu hàng đợi và tính thời gian mỗi bạn phải chờ." }} screens={[{ id: "kham-pha", label: "Khám phá", icon: Printer, render: () => <Explore /> }, { id: "thu-thach", label: "Thử thách", icon: ListOrdered, render: () => <Game /> }]} />;
}
