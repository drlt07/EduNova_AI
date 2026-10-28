import type { FrameBase } from "./types";

export type GridKind = "bfs" | "dfs";

/** Bản đồ lưới: "#" tường, "S" xuất phát, "T" đích, "." đường đi. */
export type GridMap = string[];

export interface GridFrame extends FrameBase {
  /** Ô đã thăm, khoá "hàng,cột". */
  visited: string[];
  /** Hàng đợi (BFS) hoặc ngăn xếp (DFS), phần tử đầu là phần tử sẽ lấy ra tiếp theo. */
  frontier: string[];
  current?: string;
  /** Số bước từ S (BFS) hoặc thứ tự thăm (DFS). */
  label: Record<string, number>;
  path?: string[];
  expanded: number;
}

export const GRID_CODE: Record<GridKind, string[]> = {
  bfs: [
    "q = deque([S]); tham = {S}",
    "while q:",
    "    u = q.popleft()        # ô vào sớm nhất",
    "    if u == T: break",
    "    for v in ke(u):    # lên, phải, xuống, trái",
    "        if v not in tham:",
    "            tham.add(v); truoc[v] = u; q.append(v)",
    "lần ngược truoc[] từ T → đường đi ngắn nhất",
  ],
  dfs: [
    "st = [S]; tham = set()",
    "while st:",
    "    u = st.pop()           # ô vào muộn nhất",
    "    if u in tham: continue",
    "    tham.add(u)",
    "    if u == T: break",
    "    for v in ke(u):",
    "        if v not in tham: truoc[v]=u; st.append(v)",
    "lần ngược truoc[] từ T → một đường đi",
  ],
};

export const DEFAULT_MAP: GridMap = [
  "S...#.....",
  ".##.#.###.",
  ".#..#...#.",
  ".#.###.#..",
  "...#...#.#",
  ".#.#.###..",
  ".#...#...T",
];

export const key = (r: number, c: number) => `${r},${c}`;
export const unkey = (k: string) => k.split(",").map(Number) as [number, number];

export function findCell(map: GridMap, ch: string): string | undefined {
  for (let r = 0; r < map.length; r++) {
    const c = map[r].indexOf(ch);
    if (c >= 0) return key(r, c);
  }
  return undefined;
}

/** Ô kề đi được theo thứ tự lên, phải, xuống, trái. */
export function neighbors(map: GridMap, k: string): string[] {
  const [r, c] = unkey(k);
  const out: string[] = [];
  for (const [dr, dc] of [[-1, 0], [0, 1], [1, 0], [0, -1]]) {
    const nr = r + dr, nc = c + dc;
    if (nr >= 0 && nr < map.length && nc >= 0 && nc < map[nr].length && map[nr][nc] !== "#") out.push(key(nr, nc));
  }
  return out;
}

/** Bật/tắt tường ở một ô (không đụng S và T). */
export function toggleWall(map: GridMap, r: number, c: number): GridMap {
  const ch = map[r]?.[c];
  if (ch === undefined || ch === "S" || ch === "T") return map;
  return map.map((row, i) => (i === r ? row.slice(0, c) + (ch === "#" ? "." : "#") + row.slice(c + 1) : row));
}

const trace = (prev: Map<string, string>, t: string) => {
  const path = [t];
  while (prev.has(path[0])) path.unshift(prev.get(path[0])!);
  return path;
};

export function gridFrames(kind: GridKind, map: GridMap): GridFrame[] {
  const S = findCell(map, "S");
  const T = findCell(map, "T");
  if (!S || !T) throw new Error("Bản đồ cần có ô S và ô T");
  const frames: GridFrame[] = [];
  const visited = new Set<string>();
  const label: Record<string, number> = {};
  const prev = new Map<string, string>();
  let expanded = 0;
  const frontier: string[] = [S];
  const push = (f: Omit<GridFrame, "visited" | "frontier" | "label" | "expanded">) =>
    frames.push({ ...f, visited: [...visited], frontier: kind === "bfs" ? [...frontier] : [...frontier].reverse(), label: { ...label }, expanded });

  if (kind === "bfs") {
    visited.add(S);
    label[S] = 0;
    push({ line: 0, note: "Cho ô xuất phát S vào hàng đợi. BFS loang ra theo từng lớp: các ô cách S 1 bước, rồi 2 bước…" });
    while (frontier.length) {
      const nextUp = frontier[0];
      push({ line: 2, note: `Hàng đợi có ${frontier.length} ô. Lấy ra ô vào sớm nhất.`, ask: frontier.length > 1 ? { q: "Ô nào được lấy ra tiếp theo?", options: ["Ô đầu hàng đợi (vào sớm nhất)", "Ô cuối hàng đợi (vào muộn nhất)"], answer: 0 } : undefined });
      const u = frontier.shift()!;
      expanded++;
      if (u === T) {
        const path = trace(prev, T);
        push({ line: 7, current: u, path, note: `Đến đích T sau ${label[T]} bước. Đường đi ngắn nhất dài ${path.length - 1} bước; BFS luôn tìm được đường ngắn nhất trên lưới không trọng số.` });
        return frames;
      }
      const added: string[] = [];
      for (const v of neighbors(map, u)) {
        if (visited.has(v)) continue;
        visited.add(v);
        prev.set(v, u);
        label[v] = label[u] + 1;
        frontier.push(v);
        added.push(v);
      }
      push({ line: 6, current: nextUp, note: added.length ? `Từ ô (${u}) cách S ${label[u]} bước: thêm ${added.length} ô kề chưa thăm vào cuối hàng đợi, đánh số ${label[u] + 1}.` : `Ô (${u}) không còn ô kề nào chưa thăm.` });
    }
  } else {
    let order = 0;
    push({ line: 0, note: "Cho S vào ngăn xếp. DFS đi sâu theo một hướng đến khi bế tắc mới quay lui." });
    while (frontier.length) {
      push({ line: 2, note: `Ngăn xếp có ${frontier.length} ô. Lấy ra ô vào muộn nhất (đỉnh ngăn xếp).`, ask: frontier.length > 1 ? { q: "Ô nào được lấy ra tiếp theo?", options: ["Ô vào sớm nhất", "Ô vào muộn nhất (đỉnh ngăn xếp)"], answer: 1 } : undefined });
      const u = frontier.pop()!;
      if (visited.has(u)) {
        push({ line: 3, current: u, note: `Ô (${u}) đã thăm rồi: bỏ qua.` });
        continue;
      }
      visited.add(u);
      label[u] = order++;
      expanded++;
      if (u === T) {
        const path = trace(prev, T);
        push({ line: 8, current: u, path, note: `Đến đích sau khi thăm ${expanded} ô. Đường DFS tìm được dài ${path.length - 1} bước, có thể không phải ngắn nhất.` });
        return frames;
      }
      const ns = neighbors(map, u).filter((v) => !visited.has(v));
      // Đẩy theo thứ tự ngược để ô "lên" được lấy ra trước, giữ thứ tự lên, phải, xuống, trái.
      for (const v of [...ns].reverse()) { prev.set(v, u); frontier.push(v); }
      push({ line: 7, current: u, note: ns.length ? `Thăm ô (${u}), đẩy ${ns.length} ô kề chưa thăm vào ngăn xếp.` : `Ô (${u}) là ngõ cụt: quay lui về ô trên đỉnh ngăn xếp.` });
    }
  }
  push({ line: 1, note: "Đã hết ô để xét mà chưa tới T: không có đường đi." });
  return frames;
}
