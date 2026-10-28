"use client";
import type { SortFrame } from "@/lib/algo/sorting";
import type { SearchFrame } from "@/lib/algo/search";
import { key, type GridFrame, type GridMap } from "@/lib/algo/grid";
import type { DijkstraFrame, Graph } from "@/lib/algo/dijkstra";
import type { Item, KnapsackFrame } from "@/lib/algo/knapsack";
import type { SieveFrame } from "@/lib/algo/sieve";
import { cn } from "@/lib/utils";

function Legend({ items }: { items: [string, string][] }) {
  return (
    <ul className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted">
      {items.map(([cls, label]) => <li key={label} className="flex items-center gap-1"><span className={cn("size-3 rounded-sm", cls)} aria-hidden /> {label}</li>)}
    </ul>
  );
}

/* ---------- Sắp xếp: cột cao theo giá trị ---------- */
export function SortView({ f }: { f: SortFrame }) {
  const max = Math.max(...f.a, 1);
  const tone = (k: number) =>
    f.swap?.includes(k) ? "bg-danger" : f.cmp?.includes(k) ? "bg-warning" : f.set === k ? "bg-violet" : f.pivot === k ? "bg-violet/70" : f.min === k ? "bg-cyan" : f.sorted.includes(k) ? "bg-success/70" : "bg-blue/45";
  const out = (k: number) => f.range && (k < f.range[0] || k > f.range[1]);
  return (
    <div>
      <div className="flex h-56 items-end gap-1 sm:gap-1.5" role="img" aria-label={`Mảng: ${f.a.join(", ")}`}>
        {f.a.map((v, k) => (
          <div key={k} className={cn("flex min-w-0 flex-1 flex-col items-center justify-end transition-opacity", out(k) && "opacity-35")}>
            <span className="mb-1 text-[11px] font-bold tabular-nums text-fg sm:text-xs">{v}</span>
            <div className={cn("w-full rounded-t-md transition-all duration-300", tone(k))} style={{ height: `${Math.max(6, (v / max) * 180)}px` }} />
            <span className="mt-1 text-[10px] tabular-nums text-muted">{k}</span>
          </div>
        ))}
      </div>
      {f.merge && (
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {(["left", "right"] as const).map((side) => {
            const arr = f.merge![side];
            const head = side === "left" ? f.merge!.i : f.merge!.j;
            return (
              <div key={side}>
                <p className="mb-1 text-[11px] font-semibold text-muted">{side === "left" ? "Nửa trái" : "Nửa phải"}</p>
                <div className="flex flex-wrap gap-1">
                  {arr.map((v, k) => <span key={k} className={cn("grid h-7 min-w-7 place-items-center rounded-md border px-1 text-xs font-bold tabular-nums", k < head ? "border-line text-muted line-through opacity-50" : k === head ? "border-warning bg-warning/20 text-fg" : "border-line text-fg")}>{v}</span>)}
                </div>
              </div>
            );
          })}
        </div>
      )}
      <Legend items={[["bg-warning", "đang so sánh"], ["bg-danger", "vừa đổi chỗ"], ["bg-violet", "vừa ghi / chốt"], ["bg-cyan", "nhỏ nhất tạm thời"], ["bg-success/70", "đã đúng chỗ"]]} />
    </div>
  );
}

/* ---------- Tìm kiếm: dãy ô, đoạn [lo..hi] ---------- */
export function SearchView({ f }: { f: SearchFrame }) {
  const inRange = (k: number) => f.lo === undefined || (k >= f.lo && k <= f.hi!);
  return (
    <div>
      <p className="mb-3 text-sm text-fg">Cần tìm <span className="rounded-md bg-violet/15 px-2 py-0.5 font-bold text-violet-fg">x = {f.x}</span></p>
      <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${f.a.length}, minmax(0, 1fr))` }} role="img" aria-label={`Mảng: ${f.a.join(", ")}`}>
        {f.a.map((v, k) => (
          <div key={k} className="flex min-w-0 flex-col items-center">
            <span className={cn("grid h-11 w-full place-items-center rounded-lg border text-xs font-bold tabular-nums transition-all sm:text-sm",
              f.found === k ? "border-success bg-success/25 text-fg" : f.i === k ? "border-warning bg-warning/25 text-fg" : inRange(k) ? "border-blue/40 bg-blue/10 text-fg" : "border-line bg-surface-2 text-muted opacity-40")}>{v}</span>
            <span className="mt-0.5 text-[10px] tabular-nums text-muted">{k}</span>
            <span className="h-4 text-[10px] font-bold leading-4">
              {[f.lo === k && "lo", f.i === k && (f.lo !== undefined ? "mid" : "i"), f.hi === k && "hi"].filter(Boolean).map((t) => <span key={String(t)} className={t === "mid" || t === "i" ? "text-warning-fg" : "text-blue-fg"}>{t} </span>)}
            </span>
          </div>
        ))}
      </div>
      <Legend items={[["bg-warning/60", "đang xét"], ["bg-blue/30", "còn trong đoạn tìm"], ["bg-surface-2", "đã loại"], ["bg-success/60", "tìm thấy"]]} />
    </div>
  );
}

/* ---------- Lưới BFS/DFS ---------- */
export function GridView({ map, f, onToggle }: { map: GridMap; f: GridFrame; onToggle?: (r: number, c: number) => void }) {
  const visited = new Set(f.visited);
  const frontier = new Set(f.frontier);
  const path = new Set(f.path ?? []);
  const cols = map[0].length;
  return (
    <div>
      <div className="mx-auto grid max-w-xl gap-0.5" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
        {map.flatMap((row, r) => [...row].map((ch, c) => {
          const k = key(r, c);
          const wall = ch === "#";
          const cls = wall ? "bg-fg/80" : ch === "S" ? "bg-cyan text-[#04111f]" : ch === "T" ? "bg-violet text-white" : path.has(k) ? "bg-success/70 text-fg" : f.current === k ? "bg-warning text-fg" : frontier.has(k) ? "bg-warning/35 text-fg" : visited.has(k) ? "bg-blue/25 text-fg" : "bg-surface-2 text-muted";
          const label = ch === "S" ? "S" : ch === "T" ? "T" : f.label[k] ?? "";
          const Cell = onToggle ? "button" : "span";
          return (
            <Cell
              key={k}
              {...(onToggle ? { type: "button" as const, onClick: () => onToggle(r, c), "aria-label": `Ô hàng ${r + 1} cột ${c + 1}${wall ? ", tường" : ""}` } : {})}
              className={cn("grid aspect-square place-items-center rounded-[4px] text-[10px] font-bold tabular-nums transition-colors sm:text-xs", cls, path.has(k) && (ch === "S" || ch === "T") && "ring-2 ring-success", onToggle && ch !== "S" && ch !== "T" && "hover:ring-2 hover:ring-cyan")}
            >
              {label}
            </Cell>
          );
        }))}
      </div>
      <div className="mt-3 text-xs text-muted">
        <span className="font-semibold text-fg">{f.frontier.length ? "Thứ tự lấy ra: " : ""}</span>
        <span className="font-mono">{f.frontier.slice(0, 8).map((k) => `(${k})`).join(" ")}{f.frontier.length > 8 ? " …" : ""}</span>
      </div>
      <Legend items={[["bg-cyan", "xuất phát S"], ["bg-violet", "đích T"], ["bg-warning", "đang xét"], ["bg-warning/35", "đang chờ"], ["bg-blue/25", "đã thăm"], ["bg-success/70", "đường đi"], ["bg-fg/80", "tường"]]} />
    </div>
  );
}

/* ---------- Đồ thị Dijkstra ---------- */
export function GraphView({ g, f }: { g: Graph; f: DijkstraFrame }) {
  const pos = Object.fromEntries(g.nodes.map((n) => [n.id, n]));
  const done = new Set(f.done);
  const onPath = (u: string, v: string) => !!f.path && f.path.some((x, k) => k > 0 && ((f.path![k - 1] === u && x === v) || (f.path![k - 1] === v && x === u)));
  const inTree = (u: string, v: string) => f.prev[v] === u || f.prev[u] === v;
  return (
    <div>
      <svg viewBox="0 0 640 330" className="w-full" role="img" aria-label="Bản đồ đường đi giữa các điểm">
        {g.edges.map(([u, v, w]) => {
          const a = pos[u], b = pos[v];
          const active = f.edge && ((f.edge[0] === u && f.edge[1] === v) || (f.edge[0] === v && f.edge[1] === u));
          const stroke = onPath(u, v) ? "var(--success)" : active ? (f.improved ? "var(--success)" : "var(--warning)") : inTree(u, v) ? "var(--blue)" : "var(--line)";
          return (
            <g key={`${u}${v}`}>
              <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={stroke} strokeWidth={onPath(u, v) || active ? 5 : inTree(u, v) ? 3 : 2} strokeLinecap="round" />
              <rect x={(a.x + b.x) / 2 - 11} y={(a.y + b.y) / 2 - 10} width={22} height={18} rx={5} fill="var(--surface)" stroke="var(--line)" />
              <text x={(a.x + b.x) / 2} y={(a.y + b.y) / 2 + 3.5} textAnchor="middle" fontSize={11} fontWeight={700} fill="var(--fg)">{w}</text>
            </g>
          );
        })}
        {g.nodes.map((n) => {
          const d = f.dist[n.id];
          const fill = f.current === n.id ? "var(--warning)" : done.has(n.id) ? "var(--success)" : d !== null ? "var(--blue)" : "var(--surface-2)";
          return (
            <g key={n.id}>
              <circle cx={n.x} cy={n.y} r={20} fill={fill} stroke="var(--fg)" strokeOpacity={0.25} strokeWidth={2} />
              <text x={n.x} y={n.y + 5} textAnchor="middle" fontSize={15} fontWeight={800} fill={d !== null || done.has(n.id) ? "#fff" : "var(--fg)"}>{n.id}</text>
              <text x={n.x} y={n.y - 27} textAnchor="middle" fontSize={12} fontWeight={700} fill="var(--fg)">{d === null ? "∞" : d}</text>
            </g>
          );
        })}
      </svg>
      <Legend items={[["bg-warning", "đang chốt / cạnh đang xét"], ["bg-success", "đã chốt"], ["bg-blue", "đã có khoảng cách tạm"], ["bg-surface-2", "chưa tới (∞)"]]} />
    </div>
  );
}

/* ---------- Bảng quy hoạch động cái túi ---------- */
export function DpView({ items, W, f }: { items: Item[]; W: number; f: KnapsackFrame }) {
  const isFrom = (i: number, c: number) => f.from?.some(([a, b]) => a === i && b === c);
  const isTrace = (i: number, c: number) => f.trace?.some(([a, b]) => a === i && b === c);
  return (
    <div>
      <ul className="mb-3 flex flex-wrap gap-1.5 text-xs">
        {items.map((it, k) => (
          <li key={it.name} className={cn("rounded-lg border px-2 py-1", f.chosen?.includes(k) ? "border-success bg-success/15" : f.cell?.[0] === k + 1 ? "border-cyan bg-cyan/10" : "border-line")}>
            <span className="font-semibold text-fg">{k + 1}. {it.name}</span> <span className="text-muted">nặng {it.w} · giá trị {it.v}</span>
          </li>
        ))}
        <li className="rounded-lg bg-surface-2 px-2 py-1 font-semibold text-fg">Sức chứa W = {W}</li>
      </ul>
      <div className="overflow-x-auto">
        <table className="w-full border-separate border-spacing-0.5 text-center text-xs tabular-nums">
          <thead>
            <tr><th className="px-1 text-left font-medium text-muted">i \ c</th>{Array.from({ length: W + 1 }, (_, c) => <th key={c} className="min-w-7 font-semibold text-muted">{c}</th>)}</tr>
          </thead>
          <tbody>
            {f.dp.map((row, i) => (
              <tr key={i}>
                <th className="whitespace-nowrap px-1 text-left font-medium text-muted">{i === 0 ? "0 (trống)" : `${i}. ${items[i - 1].name}`}</th>
                {row.map((v, c) => {
                  const cur = f.cell?.[0] === i && f.cell?.[1] === c;
                  return (
                    <td key={c} className={cn("h-7 rounded-md font-bold transition-colors", cur ? (v === null ? "bg-warning/40 text-fg ring-2 ring-warning" : f.take ? "bg-success/40 text-fg ring-2 ring-success" : "bg-blue/35 text-fg ring-2 ring-blue") : isTrace(i, c) ? "bg-success/30 text-fg" : isFrom(i, c) ? "bg-warning/30 text-fg" : v === null ? "bg-surface-2 text-transparent" : "bg-surface-2 text-fg")}>
                      {v ?? "·"}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Legend items={[["bg-warning/50", "ô đang tính"], ["bg-warning/30", "ô dùng để tính"], ["bg-success/40", "có lấy món"], ["bg-blue/35", "không lấy"], ["bg-success/30", "lần ngược"]]} />
    </div>
  );
}

/* ---------- Sàng Eratosthenes ---------- */
export function SieveView({ f }: { f: SieveFrame }) {
  const n = f.state.length - 1;
  return (
    <div>
      <div className="grid grid-cols-10 gap-1">
        {Array.from({ length: n - 1 }, (_, k) => k + 2).map((x) => {
          const s = f.state[x];
          return (
            <span key={x} className={cn("grid h-8 place-items-center rounded-md text-xs font-bold tabular-nums transition-colors",
              f.j === x ? "bg-danger text-white" : f.p === x ? "bg-warning text-fg ring-2 ring-warning" : s === "prime" ? "bg-success/70 text-fg" : s === "composite" ? "bg-surface-2 text-muted line-through opacity-60" : "bg-blue/15 text-fg",
              f.p && f.state[f.p] === "prime" && x % f.p === 0 && x !== f.p && s !== "composite" && f.j === undefined && "ring-1 ring-warning/60")}>
              {x}
            </span>
          );
        })}
      </div>
      <Legend items={[["bg-warning", "p đang xét"], ["bg-danger", "vừa gạch"], ["bg-success/70", "số nguyên tố"], ["bg-surface-2", "hợp số"], ["bg-blue/15", "chưa biết"]]} />
    </div>
  );
}
