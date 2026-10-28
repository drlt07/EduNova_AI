"use client";
import { useState } from "react";
import { Shuffle } from "lucide-react";
import type { AlgoId } from "@/lib/data/hsg";
import { ALGOS } from "@/lib/data/hsg";
import { parseNumbers, randomArray, SORT_CODE, sortFrames, type SortKind } from "@/lib/algo/sorting";
import { SEARCH_CODE, searchFrames } from "@/lib/algo/search";
import { DEFAULT_MAP, GRID_CODE, gridFrames, toggleWall } from "@/lib/algo/grid";
import { CITY, DIJKSTRA_CODE, dijkstraFrames } from "@/lib/algo/dijkstra";
import { BAG_ITEMS, KNAPSACK_CODE, knapsackFrames } from "@/lib/algo/knapsack";
import { SIEVE_CODE, sieveFrames } from "@/lib/algo/sieve";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/form";
import { AlgoPlayer } from "./player";
import { DpView, GraphView, GridView, SearchView, SieveView, SortView } from "./views";

const START = [38, 12, 77, 5, 61, 24, 90, 45, 18, 53];

function Toolbar({ children }: { children: React.ReactNode }) {
  return <div className="mb-3 flex flex-wrap items-end gap-2 rounded-2xl border border-dashed border-line bg-surface-2/40 p-3 text-sm">{children}</div>;
}

/** Ô nhập dãy số + nút ngẫu nhiên, dùng chung cho sắp xếp và tìm kiếm. */
function ArrayInput({ value, onChange }: { value: number[]; onChange: (a: number[]) => void }) {
  const [text, setText] = useState(value.join(", "));
  const [err, setErr] = useState("");
  const apply = (a: number[]) => { onChange(a); setText(a.join(", ")); setErr(""); };
  return (
    <>
      <label className="min-w-0 flex-1 basis-60">
        <span className="mb-1 block text-xs font-medium text-muted">Dãy số (2–16 số)</span>
        <span className="flex gap-1.5">
          <Input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { const r = parseNumbers(text); if (r.ok) apply(r.values); else setErr(r.error); } }} aria-invalid={!!err} />
          <Button variant="secondary" onClick={() => { const r = parseNumbers(text); if (r.ok) apply(r.values); else setErr(r.error); }}>Dùng</Button>
        </span>
      </label>
      <Button variant="ghost" onClick={() => apply(randomArray(value.length >= 6 ? value.length : 10))}><Shuffle /> Ngẫu nhiên</Button>
      <Button variant="ghost" onClick={() => apply([...value].sort((a, b) => a - b).map((x, k, s) => (k === s.length - 2 ? s[k + 1] : k === s.length - 1 ? s[k - 1] : x)))}>Gần như đã sắp</Button>
      <Button variant="ghost" onClick={() => apply([...value].sort((a, b) => b - a))}>Đảo ngược</Button>
      {err && <p className="w-full text-xs font-medium text-danger-fg" role="alert">{err}</p>}
    </>
  );
}

function SortLab({ kind }: { kind: SortKind }) {
  const [a, setA] = useState(START);
  return (
    <>
      <Toolbar><ArrayInput value={a} onChange={setA} /></Toolbar>
      <AlgoPlayer key={`${kind}:${a.join()}`} title={ALGOS[kind].title} frames={sortFrames(kind, a)} code={SORT_CODE[kind]} view={(f) => <SortView f={f} />} counters={(f) => ({ "Phép so sánh": f.compares, "Lần ghi": f.writes, "Đã đúng chỗ": f.sorted.length })} />
    </>
  );
}

function SearchLab({ kind }: { kind: "linear" | "binary" }) {
  const [a, setA] = useState(START);
  const [x, setX] = useState(61);
  return (
    <>
      <Toolbar>
        <ArrayInput value={a} onChange={setA} />
        <label>
          <span className="mb-1 block text-xs font-medium text-muted">Cần tìm x</span>
          <Input type="number" className="w-24" value={x} onChange={(e) => setX(Number(e.target.value) || 0)} />
        </label>
        {kind === "binary" && <p className="w-full text-xs text-muted">Tìm nhị phân cần mảng đã sắp, nên dãy được sắp tăng dần trước khi tìm.</p>}
      </Toolbar>
      <AlgoPlayer key={`${kind}:${a.join()}:${x}`} title={ALGOS[kind].title} frames={searchFrames(kind, a, x)} code={SEARCH_CODE[kind]} view={(f) => <SearchView f={f} />} counters={(f) => ({ "Phép so sánh": f.steps, "Số phần tử": f.a.length, ...(kind === "binary" ? { "Còn lại trong đoạn": f.lo !== undefined && f.found === undefined ? Math.max(0, f.hi! - f.lo + 1) : 0 } : {}) })} />
    </>
  );
}

function GridLab({ kind }: { kind: "bfs" | "dfs" }) {
  const [map, setMap] = useState(DEFAULT_MAP);
  return (
    <>
      <Toolbar>
        <p className="min-w-0 flex-1 text-xs text-muted">Bấm vào ô để thêm hoặc bỏ tường, mô phỏng chạy lại từ đầu. Thử chạy cùng bản đồ với {kind === "bfs" ? "DFS" : "BFS"} để so sánh.</p>
        <Button variant="ghost" onClick={() => setMap(DEFAULT_MAP)}>Bản đồ mẫu</Button>
        <Button variant="ghost" onClick={() => setMap(map.map((r) => r.replace(/#/g, ".")))}>Xoá hết tường</Button>
      </Toolbar>
      <AlgoPlayer key={`${kind}:${map.join("|")}`} title={ALGOS[kind].title} frames={gridFrames(kind, map)} code={GRID_CODE[kind]} view={(f) => <GridView map={map} f={f} onToggle={(r, c) => setMap(toggleWall(map, r, c))} />} counters={(f) => ({ "Ô đã thăm": f.visited.length, [kind === "bfs" ? "Trong hàng đợi" : "Trong ngăn xếp"]: f.frontier.length, ...(f.path ? { "Độ dài đường": f.path.length - 1 } : {}) })} />
    </>
  );
}

function DijkstraLab() {
  const ids = CITY.nodes.map((n) => n.id);
  const [s, setS] = useState("A");
  const [t, setT] = useState("H");
  return (
    <>
      <Toolbar>
        <p className="min-w-0 flex-1 basis-60 text-xs text-muted">Bản đồ các điểm trong thành phố, số trên đường là số phút đi xe. Tìm đường nhanh nhất.</p>
        <label><span className="mb-1 block text-xs font-medium text-muted">Từ</span><Select value={s} onChange={(e) => setS(e.target.value)}>{ids.map((x) => <option key={x}>{x}</option>)}</Select></label>
        <label><span className="mb-1 block text-xs font-medium text-muted">Đến</span><Select value={t} onChange={(e) => setT(e.target.value)}>{ids.filter((x) => x !== s).map((x) => <option key={x}>{x}</option>)}</Select></label>
      </Toolbar>
      <AlgoPlayer key={`${s}:${t}`} title={ALGOS.dijkstra.title} frames={dijkstraFrames(CITY, s, t === s ? undefined : t)} code={DIJKSTRA_CODE} view={(f) => <GraphView g={CITY} f={f} />} counters={(f) => ({ "Đỉnh đã chốt": f.done.length, [`dist[${t}]`]: f.dist[t] ?? "∞" })} />
    </>
  );
}

function KnapsackLab() {
  const [W, setW] = useState(7);
  return (
    <>
      <Toolbar>
        <p className="min-w-0 flex-1 basis-60 text-xs text-muted">Em đi dã ngoại với chiếc ba lô có sức chứa W. Chọn đồ sao cho tổng giá trị lớn nhất mà không quá nặng.</p>
        <label><span className="mb-1 block text-xs font-medium text-muted">Sức chứa W</span><Select value={W} onChange={(e) => setW(Number(e.target.value))}>{[3, 4, 5, 6, 7, 8, 9, 10].map((x) => <option key={x} value={x}>{x}</option>)}</Select></label>
      </Toolbar>
      <AlgoPlayer key={W} title={ALGOS.knapsack.title} frames={knapsackFrames(BAG_ITEMS, W)} code={KNAPSACK_CODE} view={(f) => <DpView items={BAG_ITEMS} W={W} f={f} />} counters={(f) => ({ "Ô đã tính": f.dp.slice(1).flat().filter((v) => v !== null).length, "Tổng số ô": BAG_ITEMS.length * (W + 1), "Tốt nhất hiện tại": Math.max(0, ...f.dp.flat().filter((v): v is number => v !== null)) })} />
    </>
  );
}

function SieveLab() {
  const [n, setN] = useState(60);
  return (
    <>
      <Toolbar>
        <p className="min-w-0 flex-1 basis-60 text-xs text-muted">Tìm mọi số nguyên tố không vượt quá n bằng cách gạch bỏ bội số.</p>
        <label><span className="mb-1 block text-xs font-medium text-muted">n</span><Select value={n} onChange={(e) => setN(Number(e.target.value))}>{[30, 60, 100].map((x) => <option key={x} value={x}>{x}</option>)}</Select></label>
      </Toolbar>
      <AlgoPlayer key={n} title={ALGOS.sieve.title} frames={sieveFrames(n)} code={SIEVE_CODE} view={(f) => <SieveView f={f} />} counters={(f) => ({ "Số đã gạch": f.marks, "Số nguyên tố đã biết": f.state.filter((s) => s === "prime").length, p: f.p ?? 0 })} />
    </>
  );
}

export function AlgoVisualizer({ id }: { id: AlgoId }) {
  switch (id) {
    case "linear":
    case "binary":
      return <SearchLab key={id} kind={id} />;
    case "bfs":
    case "dfs":
      return <GridLab key={id} kind={id} />;
    case "dijkstra":
      return <DijkstraLab />;
    case "knapsack":
      return <KnapsackLab />;
    case "sieve":
      return <SieveLab />;
    default:
      return <SortLab key={id} kind={id} />;
  }
}
