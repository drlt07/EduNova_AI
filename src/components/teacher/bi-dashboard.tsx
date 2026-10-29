"use client";
/**
 * Bảng điều khiển kết quả học tập kiểu BI: một hàng bộ lọc phía trên, thẻ chỉ số, biểu đồ xu hướng, theo bài,
 * ma trận học sinh × bài, phân bố điểm, mô phỏng, thời điểm học và bảng học sinh. Bấm vào cột/ô/dòng để lọc chéo
 * toàn bộ bảng. Mọi biểu đồ vẽ bằng SVG, có chú thích khi rê chuột, giá trị luôn có trong bảng.
 */
import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { AlertTriangle, ArrowDownRight, ArrowUpRight, CheckCircle2, Eye, FlaskConical, Gauge, ListChecks, Minus, Target, Users, X } from "lucide-react";
import { dashboard, lessonLabel, WEEKS, type DashFilter, type StudentRow, type StudentStatus } from "@/lib/analytics/dashboard";
import { teacherClasses } from "@/lib/store/scoped";
import { useSessionData } from "@/lib/store/use-role";
import { cn } from "@/lib/utils";
import { fmtScore } from "@/lib/sim/lab-score";

const SERIES = ["var(--s1)", "var(--s2)", "var(--s3)"];
const RANGES = [{ v: 7, l: "7 ngày" }, { v: 14, l: "14 ngày" }, { v: 28, l: "4 tuần" }, { v: 42, l: "6 tuần" }];
const STATUS: Record<StudentStatus, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  good: { label: "Ổn định", color: "var(--good)", icon: CheckCircle2 },
  watch: { label: "Theo dõi", color: "var(--warn)", icon: Eye },
  risk: { label: "Cần hỗ trợ", color: "var(--crit)", icon: AlertTriangle },
};
/** Bậc màu tuần tự (một sắc xanh) cho tỉ lệ đúng 0–100. */
const seq = (v: number) => `var(--seq-${Math.min(7, Math.max(1, Math.ceil(v / 100 * 7)))})`;
const inkOn = (v: number) => (Math.ceil(v / 100 * 7) >= 4 ? "#ffffff" : "#0b0b0b");

interface Tip { x: number; y: number; title: string; rows: { label: string; value: string; color?: string }[] }
function useTip() {
  const ref = useRef<HTMLDivElement>(null);
  const [tip, setTip] = useState<Tip | null>(null);
  const show = (e: React.PointerEvent | React.FocusEvent, t: Omit<Tip, "x" | "y">) => {
    const box = ref.current?.getBoundingClientRect();
    const tgt = (e.target as Element).getBoundingClientRect();
    const cx = "clientX" in e ? e.clientX : tgt.left + tgt.width / 2;
    const cy = "clientY" in e ? e.clientY : tgt.top;
    if (box) setTip({ ...t, x: cx - box.left, y: cy - box.top });
  };
  const hide = () => setTip(null);
  return [ref, tip, show, hide] as const;
}

function TipBox({ tip }: { tip: Tip | null }) {
  if (!tip) return null;
  return (
    <div role="tooltip" className="pointer-events-none absolute z-20 min-w-36 -translate-x-1/2 -translate-y-[calc(100%+12px)] rounded-xl border border-line bg-surface px-3 py-2 text-xs shadow-lg" style={{ left: tip.x, top: tip.y }}>
      <p className="mb-1 font-medium text-muted">{tip.title}</p>
      {tip.rows.map((r) => <p key={r.label} className="flex items-center gap-2"><span className="h-0.5 w-3 rounded" style={{ background: r.color ?? "var(--axis)" }} /><b className="tabular-nums text-fg">{r.value}</b><span className="text-muted">{r.label}</span></p>)}
    </div>
  );
}

function Card({ title, sub, children, className, action }: { title: string; sub?: string; children: React.ReactNode; className?: string; action?: React.ReactNode }) {
  return (
    <section className={cn("min-w-0 rounded-2xl border border-line bg-surface p-4", className)}>
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="min-w-0"><h3 className="text-sm font-semibold text-fg">{title}</h3>{sub && <p className="text-xs text-muted">{sub}</p>}</div>
        {action}
      </div>
      {children}
    </section>
  );
}

function Spark({ values, color = "var(--s1)" }: { values: (number | null)[]; color?: string }) {
  const pts = values.map((v, i) => (v === null ? null : [i * (80 / (values.length - 1)), 22 - (v / Math.max(1, ...values.map((x) => x ?? 0))) * 18] as const));
  const d = pts.filter(Boolean).map((p, i) => `${i ? "L" : "M"}${p![0]},${p![1]}`).join(" ");
  const last = [...pts].reverse().find(Boolean);
  return <svg viewBox="-2 0 86 26" className="h-7 w-24" aria-hidden><path d={d} fill="none" stroke="var(--axis)" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />{last && <circle cx={last[0]} cy={last[1]} r={3} fill={color} />}</svg>;
}

function Delta({ v, unit = "", goodUp = true }: { v: number | null; unit?: string; goodUp?: boolean }) {
  if (v === null) return <span className="text-xs text-muted">chưa có kỳ trước</span>;
  const good = v === 0 ? null : (v > 0) === goodUp;
  const I = v > 0 ? ArrowUpRight : v < 0 ? ArrowDownRight : Minus;
  return <span className={cn("inline-flex items-center gap-0.5 text-xs font-semibold", good === null ? "text-muted" : good ? "text-success-fg" : "text-danger-fg")}><I className="size-3.5" aria-hidden />{v > 0 ? "+" : ""}{v}{unit} <span className="font-normal text-muted">so kỳ trước</span></span>;
}

function Tile({ icon: I, label, value, children, hero }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; children?: React.ReactNode; hero?: boolean }) {
  return (
    <div className={cn("flex min-w-0 flex-col rounded-2xl border border-line bg-surface p-4", hero && "bg-gradient-to-br from-brand/10 via-surface to-surface sm:col-span-2 lg:col-span-1 lg:row-span-1")}>
      <p className="flex items-center gap-1.5 text-xs font-medium text-muted"><I className="size-4" aria-hidden />{label}</p>
      <p className={cn("mt-1 font-semibold text-fg", hero ? "text-5xl" : "text-3xl")}>{value}</p>
      <div className="mt-auto flex flex-wrap items-end justify-between gap-2 pt-2">{children}</div>
    </div>
  );
}

/** Đường xu hướng % đúng theo tuần, mỗi lớp một đường; con trỏ dọc bắt tuần gần nhất. */
function TrendChart({ series, labels }: { series: { id: string; name: string; values: (number | null)[] }[]; labels: string[] }) {
  const [tipRef, tip, show, hide] = useTip();
  const [hover, setHover] = useState<number | null>(null);
  const W = 560, H = 220, L = 34, R = 70, T = 12, B = 26;
  const x = (i: number) => L + (i * (W - L - R)) / (WEEKS - 1);
  const y = (v: number) => T + (1 - v / 100) * (H - T - B);
  const move = (e: React.PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * W;
    const i = Math.max(0, Math.min(WEEKS - 1, Math.round(((px - L) / (W - L - R)) * (WEEKS - 1))));
    setHover(i);
    show(e, { title: labels[i], rows: series.map((s, k) => ({ label: s.name, value: s.values[i] === null ? "—" : `${s.values[i]}%`, color: SERIES[k] })) });
  };
  return (
    <div ref={tipRef} className="relative">
      {series.length > 1 && <ul className="mb-2 flex flex-wrap gap-3 text-xs text-muted" aria-label="Chú giải">{series.map((s, k) => <li key={s.id} className="flex items-center gap-1.5"><span className="h-0.5 w-4 rounded" style={{ background: SERIES[k] }} />{s.name}</li>)}</ul>}
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full touch-none" onPointerMove={move} onPointerLeave={() => { setHover(null); hide(); }} role="img" aria-label="Tỉ lệ đúng trung bình theo tuần của từng lớp">
        {[0, 25, 50, 75, 100].map((v) => <g key={v}><line x1={L} x2={W - R} y1={y(v)} y2={y(v)} stroke="var(--grid)" /><text x={L - 6} y={y(v) + 4} textAnchor="end" className="fill-muted text-[10px] tabular-nums">{v}%</text></g>)}
        <line x1={L} x2={W - R} y1={y(70)} y2={y(70)} stroke="var(--axis)" strokeDasharray="0" opacity={0.6} />
        <text x={L + 4} y={y(70) - 4} className="fill-muted text-[9px]">mục tiêu 70%</text>
        {labels.map((l, i) => <text key={i} x={x(i)} y={H - 8} textAnchor="middle" className="fill-muted text-[10px]">{l}</text>)}
        {hover !== null && <line x1={x(hover)} x2={x(hover)} y1={T} y2={H - B} stroke="var(--axis)" />}
        {series.map((s, k) => {
          const pts = s.values.map((v, i) => (v === null ? null : [x(i), y(v)] as const));
          let seg = "";
          const segs: string[] = [];
          for (const p of pts) { if (!p) { if (seg) segs.push(seg); seg = ""; } else seg += `${seg ? "L" : "M"}${p[0]},${p[1]} `; }
          if (seg) segs.push(seg);
          const lastI = s.values.map((v, i) => (v === null ? -1 : i)).reduce((a, b) => Math.max(a, b), -1);
          return (
            <g key={s.id}>
              <path d={segs.join(" ")} fill="none" stroke={SERIES[k]} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
              {pts.map((p, i) => p && (hover === i || i === lastI) && <circle key={i} cx={p[0]} cy={p[1]} r={4} fill={SERIES[k]} stroke="var(--surface)" strokeWidth={2} />)}
              {lastI >= 0 && <text x={x(lastI) + 8} y={y(s.values[lastI]!) + 4} className="fill-fg text-[11px] font-semibold">{s.name} {s.values[lastI]}%</text>}
            </g>
          );
        })}
      </svg>
      <TipBox tip={tip} />
    </div>
  );
}

/** Cột ngang: mức đạt theo bài, bấm để lọc chéo. */
function LessonBars({ rows, selected, onPick }: { rows: { ref: string; label: string; short: string; avg: number; attempts: number; students: number }[]; selected?: string; onPick: (ref: string) => void }) {
  const [tipRef, tip, show, hide] = useTip();
  const shown = rows.slice(0, 10);
  return (
    <div ref={tipRef} className="relative space-y-1.5">
      {shown.map((r) => (
        <button key={r.ref} type="button" onClick={() => onPick(r.ref)} onPointerMove={(e) => show(e, { title: r.label, rows: [{ label: "đúng trung bình", value: `${r.avg}%`, color: "var(--s1)" }, { label: "lượt làm", value: String(r.attempts) }, { label: "học sinh", value: String(r.students) }] })} onPointerLeave={hide} onFocus={(e) => show(e, { title: r.label, rows: [{ label: "đúng trung bình", value: `${r.avg}%` }] })} onBlur={hide}
          aria-pressed={selected === r.ref} className={cn("grid w-full grid-cols-[92px_minmax(0,1fr)_40px] items-center gap-2 rounded-lg px-1 py-0.5 text-left text-xs transition-colors hover:bg-surface-2", selected && selected !== r.ref && "opacity-40")}>
          <span className="truncate text-muted" title={r.label}>{r.short}</span>
          <span className="relative h-4 rounded-r bg-surface-2"><span className="absolute inset-y-0 left-0 rounded-r-[4px]" style={{ width: `${r.avg}%`, background: r.avg < 60 ? "var(--crit)" : "var(--s1)" }} /><span className="absolute inset-y-0 border-l border-dashed border-fg/40" style={{ left: "70%" }} /></span>
          <b className="text-right tabular-nums text-fg">{r.avg}%</b>
        </button>
      ))}
      {rows.length === 0 && <p className="py-6 text-center text-sm text-muted">Chưa có lượt luyện tập trong khoảng này.</p>}
      <p className="pt-1 text-[11px] text-muted">Đỏ: dưới 60%. Vạch đứt: mục tiêu 70%. Bấm một bài để lọc cả bảng.</p>
      <TipBox tip={tip} />
    </div>
  );
}

/** Ma trận học sinh × bài, màu tuần tự một sắc xanh; ô trống là chưa làm. */
function Heatmap({ heat, refs, onStudent, onLesson, selStudent }: { heat: { student: { id: string; name: string }; cells: (number | null)[] }[]; refs: string[]; onStudent: (id: string) => void; onLesson: (ref: string) => void; selStudent?: string }) {
  const [tipRef, tip, show, hide] = useTip();
  if (!refs.length) return <p className="py-6 text-center text-sm text-muted">Chưa có dữ liệu.</p>;
  return (
    <div ref={tipRef} className="relative overflow-x-auto">
      <table className="w-full border-separate border-spacing-[2px] text-[11px]">
        <thead><tr><th className="sr-only">Học sinh</th>{refs.map((r) => <th key={r} className="px-0.5 font-medium text-muted"><button type="button" onClick={() => onLesson(r)} className="hover:text-fg" title={lessonLabel(r)}>{r.split("-")[0]}·B{r.split("-")[1]}</button></th>)}</tr></thead>
        <tbody>
          {heat.map((h) => (
            <tr key={h.student.id} className={cn(selStudent && selStudent !== h.student.id && "opacity-40")}>
              <th scope="row" className="max-w-28 truncate pr-2 text-left font-medium text-fg"><button type="button" onClick={() => onStudent(h.student.id)} className="truncate hover:underline">{h.student.name}</button></th>
              {h.cells.map((v, i) => (
                <td key={i} tabIndex={0} onPointerMove={(e) => show(e, { title: `${h.student.name} · ${lessonLabel(refs[i])}`, rows: [{ label: "lần tốt nhất", value: v === null ? "chưa làm" : `${v}%`, color: v === null ? undefined : seq(v) }] })} onPointerLeave={hide} onFocus={(e) => show(e, { title: `${h.student.name} · ${lessonLabel(refs[i])}`, rows: [{ label: "lần tốt nhất", value: v === null ? "chưa làm" : `${v}%` }] })} onBlur={hide}
                  className="h-7 min-w-9 rounded-[4px] text-center font-semibold tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-brand" style={v === null ? { background: "var(--surface-2)", color: "var(--muted)" } : { background: seq(v), color: inkOn(v) }}>
                  {v === null ? "·" : v}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-2 flex items-center gap-1 text-[11px] text-muted" aria-hidden>0%{[1, 2, 3, 4, 5, 6, 7].map((k) => <span key={k} className="h-2.5 w-5 rounded-sm" style={{ background: `var(--seq-${k})` }} />)}100% <span className="ml-2">· = chưa làm</span></div>
      <TipBox tip={tip} />
    </div>
  );
}

/** Cột đứng: phân bố tỉ lệ đúng của các lượt làm. */
function Histogram({ bins }: { bins: { from: number; to: number; n: number }[] }) {
  const [tipRef, tip, show, hide] = useTip();
  const max = Math.max(1, ...bins.map((b) => b.n));
  const W = 300, H = 170, B = 22, T = 14;
  const bw = W / bins.length;
  return (
    <div ref={tipRef} className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Phân bố tỉ lệ đúng của các lượt luyện tập">
        <line x1={0} x2={W} y1={H - B} y2={H - B} stroke="var(--axis)" />
        {bins.map((b, i) => {
          const h = (b.n / max) * (H - B - T);
          const w = Math.min(24, bw - 4);
          const x0 = i * bw + (bw - w) / 2;
          return (
            <g key={i} onPointerMove={(e) => show(e, { title: `${b.from}–${b.to}% đúng`, rows: [{ label: "lượt làm", value: String(b.n), color: b.from < 50 ? "var(--crit)" : "var(--s1)" }] })} onPointerLeave={hide}>
              <rect x={i * bw} y={T} width={bw} height={H - B - T} fill="transparent" />
              {b.n > 0 && <path d={`M${x0},${H - B} V${H - B - h + 4} Q${x0},${H - B - h} ${x0 + 4},${H - B - h} H${x0 + w - 4} Q${x0 + w},${H - B - h} ${x0 + w},${H - B - h + 4} V${H - B} Z`} fill={b.from < 50 ? "var(--crit)" : "var(--s1)"} />}
              {b.n === max && b.n > 0 && <text x={x0 + w / 2} y={H - B - h - 4} textAnchor="middle" className="fill-fg text-[10px] font-semibold">{b.n}</text>}
              {i % 2 === 0 && <text x={i * bw} y={H - 6} className="fill-muted text-[10px]">{b.from}%</text>}
            </g>
          );
        })}
        <text x={W} y={H - 6} textAnchor="end" className="fill-muted text-[10px]">100%</text>
      </svg>
      <TipBox tip={tip} />
    </div>
  );
}

/** Lưới thứ × buổi: số lượt luyện tập (thời điểm học sinh hay học). */
function WhenGrid({ when }: { when: { label: string; days: number[] }[] }) {
  const max = Math.max(1, ...when.flatMap((w) => w.days));
  const DAYS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
  return (
    <table className="w-full border-separate border-spacing-[2px] text-[11px]">
      <thead><tr><th className="sr-only">Buổi</th>{DAYS.map((d) => <th key={d} className="font-medium text-muted">{d}</th>)}</tr></thead>
      <tbody>{when.map((w) => <tr key={w.label}><th scope="row" className="pr-1 text-left font-medium text-muted">{w.label}</th>{w.days.map((n, i) => { const v = (n / max) * 100; return <td key={i} title={`${DAYS[i]} ${w.label.toLowerCase()}: ${n} lượt`} className="h-7 rounded-[4px] text-center font-semibold tabular-nums" style={n ? { background: seq(Math.max(15, v)), color: inkOn(Math.max(15, v)) } : { background: "var(--surface-2)", color: "var(--muted)" }}>{n || ""}</td>; })}</tr>)}</tbody>
    </table>
  );
}

function StatusBar({ rows }: { rows: StudentRow[] }) {
  const counts = (["good", "watch", "risk"] as StudentStatus[]).map((s) => ({ s, n: rows.filter((r) => r.status === s).length }));
  const total = Math.max(1, rows.length);
  return (
    <div>
      <div className="flex h-5 gap-[2px] overflow-hidden rounded-[4px]">{counts.filter((c) => c.n).map((c) => <span key={c.s} style={{ width: `${(c.n / total) * 100}%`, background: STATUS[c.s].color }} title={`${STATUS[c.s].label}: ${c.n}`} />)}</div>
      <ul className="mt-3 space-y-1.5 text-sm">{counts.map((c) => { const I = STATUS[c.s].icon; return <li key={c.s} className="flex items-center gap-2"><span className="size-2.5 rounded-sm" style={{ background: STATUS[c.s].color }} /><I className="size-4 text-muted" aria-hidden /><span className="flex-1 text-fg">{STATUS[c.s].label}</span><b className="tabular-nums text-fg">{c.n}</b></li>; })}</ul>
    </div>
  );
}

type SortKey = "avg" | "attempts" | "lab" | "missing" | "name";

export function BiDashboard() {
  const { d, user } = useSessionData();
  const classes = teacherClasses(d, user.id);
  const [f, setF] = useState<DashFilter>({ days: 28 });
  const [sort, setSort] = useState<{ k: SortKey; asc: boolean }>({ k: "avg", asc: true });
  const r = useMemo(() => dashboard(d, user.id, f), [d, user.id, f]);
  const sel = f.studentId ? d.users.find((u) => u.id === f.studentId) : undefined;
  const sorted = [...r.students].sort((a, b) => {
    const v = (x: StudentRow) => (sort.k === "name" ? x.student.name : sort.k === "avg" ? x.avg ?? -1 : sort.k === "lab" ? x.lab ?? -1 : sort.k === "missing" ? x.missing : x.attempts);
    const c = v(a) < v(b) ? -1 : v(a) > v(b) ? 1 : 0;
    return sort.asc ? c : -c;
  });
  const th = (k: SortKey, label: string, right = true) => <th scope="col" aria-sort={sort.k === k ? (sort.asc ? "ascending" : "descending") : "none"} className={cn("px-3 py-2 font-medium", right && "text-right")}><button type="button" onClick={() => setSort({ k, asc: sort.k === k ? !sort.asc : true })} className="hover:text-fg">{label}{sort.k === k ? (sort.asc ? " ↑" : " ↓") : ""}</button></th>;

  return (
    <div className="viz space-y-4">
      {/* Bộ lọc: một hàng, áp cho mọi biểu đồ bên dưới */}
      <div className="flex flex-wrap items-center gap-2">
        <div role="group" aria-label="Khoảng thời gian" className="flex gap-1 rounded-xl border border-line bg-surface p-1">
          {RANGES.map((x) => <button key={x.v} type="button" aria-pressed={f.days === x.v} onClick={() => setF({ ...f, days: x.v })} className={cn("rounded-lg px-3 py-1.5 text-sm font-medium", f.days === x.v ? "bg-brand text-brand-ink" : "text-muted hover:text-fg")}>{x.l}</button>)}
        </div>
        <select aria-label="Lớp" value={f.classId ?? ""} onChange={(e) => setF({ ...f, classId: e.target.value || undefined, studentId: undefined })} className="h-10 rounded-xl border border-line bg-surface px-3 text-sm text-fg">
          <option value="">Tất cả lớp</option>{classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        {f.lessonRef && <button type="button" onClick={() => setF({ ...f, lessonRef: undefined })} className="inline-flex items-center gap-1 rounded-full bg-brand/10 px-3 py-1.5 text-sm font-medium text-blue-fg">Bài: {lessonLabel(f.lessonRef)} <X className="size-3.5" aria-label="bỏ lọc" /></button>}
        {sel && <button type="button" onClick={() => setF({ ...f, studentId: undefined })} className="inline-flex items-center gap-1 rounded-full bg-brand/10 px-3 py-1.5 text-sm font-medium text-blue-fg">Học sinh: {sel.name} <X className="size-3.5" aria-label="bỏ lọc" /></button>}
        {(f.lessonRef || f.studentId) && <button type="button" onClick={() => setF({ days: f.days, classId: f.classId })} className="text-sm font-medium text-muted hover:text-fg">Xóa lọc chéo</button>}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Tile hero icon={Target} label="Tỉ lệ đúng trung bình" value={r.kpi.avg.value === null ? "—" : `${r.kpi.avg.value}%`}><Delta v={r.kpi.avg.delta} unit=" điểm %" /><Spark values={r.kpi.avg.trend} /></Tile>
        <Tile icon={ListChecks} label="Lượt luyện tập" value={r.kpi.attempts.value.toLocaleString("vi-VN")}><Delta v={r.kpi.attempts.delta} /><Spark values={r.kpi.attempts.trend} /></Tile>
        <Tile icon={Gauge} label="Hoàn thành nhiệm vụ" value={r.kpi.completion.value === null ? "—" : `${r.kpi.completion.value}%`}><span className="text-xs text-muted">{r.kpi.completion.of} lượt giao</span></Tile>
        <Tile icon={FlaskConical} label="Điểm mô phỏng TB" value={r.kpi.lab.value === null ? "—" : fmtScore(r.kpi.lab.value)}><Delta v={r.kpi.lab.delta} /><span className="text-xs text-muted">{r.kpi.lab.n} lượt</span></Tile>
        <Tile icon={Users} label="Học sinh cần hỗ trợ" value={`${r.kpi.risk.value}`}><span className="inline-flex items-center gap-1 text-xs text-muted"><AlertTriangle className="size-3.5" style={{ color: "var(--crit)" }} aria-hidden />trên {r.kpi.risk.of} em</span></Tile>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card title="Xu hướng tỉ lệ đúng theo tuần" sub="Trung bình các lượt luyện tập của từng lớp" className="xl:col-span-2"><TrendChart series={r.series} labels={r.weekLabels} /></Card>
        <Card title="Phân bố điểm" sub="Số lượt làm theo tỉ lệ đúng · đỏ: dưới 50%"><Histogram bins={r.hist} /></Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-5">
        <Card title="Mức đạt theo bài" sub="Bài yếu nhất ở trên" className="xl:col-span-2"><LessonBars rows={r.byLesson} selected={f.lessonRef} onPick={(ref) => setF({ ...f, lessonRef: f.lessonRef === ref ? undefined : ref })} /></Card>
        <Card title="Học sinh × bài" sub="Tỉ lệ đúng lần tốt nhất; bấm tên hoặc cột để lọc" className="xl:col-span-3"><Heatmap heat={f.lessonRef ? r.heat.filter((h) => h.cells.some((v) => v !== null)) : r.heat} refs={r.heatRefs} selStudent={f.studentId} onStudent={(id) => setF({ ...f, studentId: f.studentId === id ? undefined : id })} onLesson={(ref) => setF({ ...f, lessonRef: f.lessonRef === ref ? undefined : ref })} /></Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="Điểm mô phỏng theo bài thực hành" sub="Trung bình thang 10">
          {r.labs.length ? <ul className="space-y-1.5">{r.labs.slice(0, 7).map((l) => <li key={l.slug} className="grid grid-cols-[minmax(0,1fr)_96px_32px] items-center gap-2 text-xs"><span className="truncate text-fg" title={l.title}>{l.title}</span><span className="h-3 rounded-r bg-surface-2"><span className="block h-full rounded-r-[4px]" style={{ width: `${l.avg * 10}%`, background: l.avg < 6 ? "var(--crit)" : "var(--s1)" }} /></span><b className="text-right tabular-nums text-fg">{fmtScore(l.avg)}</b></li>)}</ul> : <p className="py-6 text-center text-sm text-muted">Chưa có lượt mô phỏng.</p>}
        </Card>
        <Card title="Thời điểm học sinh luyện tập" sub="Số lượt theo thứ và buổi"><WhenGrid when={r.when} /></Card>
        <Card title="Tình trạng học sinh" sub="Theo tỉ lệ đúng, nhiệm vụ còn thiếu, điểm mô phỏng"><StatusBar rows={r.students} /></Card>
      </div>

      <Card title="Bảng học sinh" sub={`${r.students.length} em · bấm tiêu đề cột để sắp xếp, bấm tên để lọc cả bảng`}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="border-b border-line text-left text-xs text-muted"><tr>{th("name", "Học sinh", false)}<th className="px-3 py-2 font-medium">Lớp</th>{th("avg", "Tỉ lệ đúng")}<th className="px-3 py-2 font-medium">Xu hướng {WEEKS} tuần</th>{th("attempts", "Lượt")}{th("lab", "Mô phỏng")}{th("missing", "Nhiệm vụ thiếu")}<th className="px-3 py-2 font-medium">Tình trạng</th></tr></thead>
            <tbody>
              {sorted.map((x) => { const S = STATUS[x.status]; return (
                <tr key={x.student.id} className={cn("border-b border-line/60 last:border-0 hover:bg-surface-2/60", f.studentId === x.student.id && "bg-brand/5")}>
                  <td className="px-3 py-2"><button type="button" onClick={() => setF({ ...f, studentId: f.studentId === x.student.id ? undefined : x.student.id })} className="font-medium text-fg hover:underline">{x.student.name}</button></td>
                  <td className="px-3 py-2 text-muted">{x.cls?.name}</td>
                  <td className="px-3 py-2 text-right tabular-nums"><b className="text-fg">{x.avg === null ? "—" : `${x.avg}%`}</b>{x.delta !== null && x.delta !== 0 && <span className={cn("ml-1 text-xs", x.delta > 0 ? "text-success-fg" : "text-danger-fg")}>{x.delta > 0 ? "▲" : "▼"}{Math.abs(x.delta)}</span>}</td>
                  <td className="px-3 py-2"><Spark values={x.trend} /></td>
                  <td className="px-3 py-2 text-right tabular-nums text-fg">{x.attempts}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-fg">{x.lab === null ? "—" : fmtScore(x.lab)}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-fg">{x.missing || "—"}</td>
                  <td className="px-3 py-2"><span className="inline-flex items-center gap-1.5 text-xs font-medium text-fg"><S.icon className="size-4" aria-hidden /><span className="size-2 rounded-full" style={{ background: S.color }} />{S.label}</span></td>
                </tr>
              ); })}
            </tbody>
          </table>
        </div>
        {sel && <StudentLink studentId={sel.id} />}
      </Card>
    </div>
  );
}

/** Lối tắt sang hồ sơ học sinh trong trang lớp. */
function StudentLink({ studentId }: { studentId: string }) {
  const { d, user } = useSessionData();
  const cls = teacherClasses(d, user.id).find((c) => d.enrollments.some((e) => e.classId === c.id && e.studentId === studentId));
  return cls ? <p className="mt-3 text-sm"><Link href={`/teacher/classes/${cls.id}?tab=hoc-sinh`} className="font-medium text-cyan-fg hover:underline">Mở hồ sơ học sinh trong lớp {cls.name} →</Link></p> : null;
}
