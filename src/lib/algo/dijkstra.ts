import type { FrameBase } from "./types";

export interface GraphNode { id: string; x: number; y: number }
/** Cạnh vô hướng [u, v, trọng số]. */
export type GraphEdge = [string, string, number];
export interface Graph { nodes: GraphNode[]; edges: GraphEdge[] }

export interface DijkstraFrame extends FrameBase {
  /** Khoảng cách tạm thời, null = vô cùng. */
  dist: Record<string, number | null>;
  done: string[];
  current?: string;
  /** Cạnh đang xét [u, v]. */
  edge?: [string, string];
  improved?: boolean;
  prev: Record<string, string>;
  path?: string[];
}

export const DIJKSTRA_CODE = [
  "dist = {v: INF for v in G}; dist[s] = 0",
  "while còn đỉnh chưa chốt:",
  "    u = đỉnh chưa chốt có dist nhỏ nhất",
  "    chốt u                 # dist[u] cố định",
  "    for v, w in ke(u):",
  "        if dist[u] + w < dist[v]:",
  "            dist[v] = dist[u] + w; truoc[v] = u",
];

/** Bản đồ thành phố mẫu: trường học A, nhà B…H, trọng số là phút đi xe. */
export const CITY: Graph = {
  nodes: [
    { id: "A", x: 60, y: 150 }, { id: "B", x: 180, y: 60 }, { id: "C", x: 180, y: 240 },
    { id: "D", x: 320, y: 140 }, { id: "E", x: 330, y: 280 }, { id: "F", x: 460, y: 60 },
    { id: "G", x: 470, y: 210 }, { id: "H", x: 580, y: 140 },
  ],
  edges: [
    ["A", "B", 4], ["A", "C", 2], ["B", "C", 1], ["B", "D", 5], ["C", "D", 8], ["C", "E", 10],
    ["D", "E", 2], ["D", "F", 6], ["D", "G", 3], ["E", "G", 1], ["F", "H", 2], ["G", "H", 6], ["F", "G", 2],
  ],
};

export function adjacency(g: Graph, u: string): [string, number][] {
  return g.edges.flatMap(([a, b, w]) => (a === u ? [[b, w] as [string, number]] : b === u ? [[a, w] as [string, number]] : []));
}

export function dijkstraFrames(g: Graph, source: string, target?: string): DijkstraFrame[] {
  const dist: Record<string, number | null> = Object.fromEntries(g.nodes.map((n) => [n.id, null]));
  const prev: Record<string, string> = {};
  const done = new Set<string>();
  const frames: DijkstraFrame[] = [];
  const push = (f: Omit<DijkstraFrame, "dist" | "done" | "prev">) => frames.push({ ...f, dist: { ...dist }, done: [...done], prev: { ...prev } });
  dist[source] = 0;
  push({ line: 0, note: `Khoảng cách từ ${source} đến chính nó là 0, mọi đỉnh khác tạm là ∞.` });

  for (;;) {
    const open = g.nodes.filter((n) => !done.has(n.id) && dist[n.id] !== null).sort((p, q) => dist[p.id]! - dist[q.id]! || p.id.localeCompare(q.id));
    if (!open.length) break;
    const u = open[0].id;
    // Phương án: đỉnh đúng + tối đa 3 đỉnh mở khác, xếp theo tên để không lộ đáp án.
    const choices = [...new Set([u, ...open.slice(1, 4).map((n) => n.id)])].sort();
    push({ line: 2, note: `Các đỉnh chưa chốt đã biết khoảng cách: ${open.map((n) => `${n.id}=${dist[n.id]}`).join(", ")}.`, ask: choices.length > 1 ? { q: "Đỉnh nào được chốt tiếp theo?", options: choices, answer: choices.indexOf(u) } : undefined });
    done.add(u);
    push({ line: 3, current: u, note: `Chốt ${u} với khoảng cách ${dist[u]}: không còn đường nào ngắn hơn vì mọi trọng số đều không âm.` });
    if (u === target) break;
    for (const [v, w] of adjacency(g, u)) {
      if (done.has(v)) continue;
      const cand = dist[u]! + w;
      const better = dist[v] === null || cand < dist[v]!;
      const old = dist[v];
      if (better) { dist[v] = cand; prev[v] = u; }
      push({ line: better ? 6 : 5, current: u, edge: [u, v], improved: better, note: better ? `Đi ${u} → ${v} mất ${dist[u]} + ${w} = ${cand} < ${old ?? "∞"}: cập nhật dist[${v}] = ${cand}.` : `Đi ${u} → ${v} mất ${dist[u]} + ${w} = ${cand}, không tốt hơn ${old}: giữ nguyên.` });
    }
  }
  const t = target ?? g.nodes[g.nodes.length - 1].id;
  const path: string[] = [];
  if (dist[t] !== null) for (let x: string | undefined = t; x; x = prev[x]) path.unshift(x);
  push({ line: 1, path, note: dist[t] === null ? `Không có đường từ ${source} đến ${t}.` : `Đường ngắn nhất ${source} → ${t}: ${path.join(" → ")}, tổng ${dist[t]} phút.` });
  return frames;
}
