import { describe, expect, it } from "vitest";
import { parseNumbers, randomArray, SORT_CODE, sortFrames, type SortKind } from "@/lib/algo/sorting";
import { SEARCH_CODE, searchFrames } from "@/lib/algo/search";
import { DEFAULT_MAP, GRID_CODE, gridFrames, neighbors, toggleWall, unkey } from "@/lib/algo/grid";
import { CITY, DIJKSTRA_CODE, dijkstraFrames } from "@/lib/algo/dijkstra";
import { BAG_ITEMS, KNAPSACK_CODE, knapsackFrames } from "@/lib/algo/knapsack";
import { SIEVE_CODE, sieveFrames } from "@/lib/algo/sieve";
import { ALGOS, HSG_TOPICS } from "@/lib/data/hsg";
import type { FrameBase } from "@/lib/algo/types";

const seeded = (s: number) => () => ((s = (s * 16807) % 2147483647) / 2147483647);
const KINDS: SortKind[] = ["bubble", "selection", "insertion", "merge", "quick"];

/** Mọi khung đều trỏ vào dòng code có thật và câu hỏi dự đoán hợp lệ. */
function wellFormed(frames: FrameBase[], code: string[]) {
  expect(frames.length).toBeGreaterThan(1);
  // Vừa khung code bên cạnh mô phỏng, không phải cuộn ngang.
  for (const l of code) expect(l.length, l).toBeLessThanOrEqual(50);
  for (const f of frames) {
    expect(f.line).toBeGreaterThanOrEqual(0);
    expect(f.line).toBeLessThan(code.length);
    expect(f.note.length).toBeGreaterThan(0);
    if (f.ask) {
      expect(f.ask.options.length).toBeGreaterThan(1);
      expect(f.ask.answer).toBeGreaterThanOrEqual(0);
      expect(f.ask.answer).toBeLessThan(f.ask.options.length);
      expect(new Set(f.ask.options).size).toBe(f.ask.options.length);
    }
  }
}

describe("sắp xếp", () => {
  it.each(KINDS)("%s sắp đúng nhiều mảng ngẫu nhiên, có trùng và đã sắp", (kind) => {
    const rand = seeded(7);
    const cases = [[1], [2, 1], [3, 3, 1, 3], [1, 2, 3, 4, 5], [5, 4, 3, 2, 1], ...Array.from({ length: 30 }, (_, i) => Array.from({ length: 2 + (i % 11) }, () => Math.floor(rand() * 20)))];
    for (const a of cases) {
      const frames = sortFrames(kind, a);
      const last = frames.at(-1)!;
      expect(last.a).toEqual([...a].sort((x, y) => x - y));
      expect(last.sorted).toHaveLength(a.length);
      wellFormed(frames, SORT_CODE[kind]);
      // Mỗi khung là một hoán vị của mảng ban đầu (không mất phần tử), trừ khung đang dời/trộn dở.
      if (kind !== "insertion" && kind !== "merge") for (const f of frames) expect([...f.a].sort()).toEqual([...a].sort());
    }
  });

  it("đáp án câu hỏi dự đoán khớp với bước ngay sau", () => {
    const frames = sortFrames("bubble", [4, 1, 3]);
    frames.forEach((f, k) => {
      if (!f.ask) return;
      const swapped = !!frames[k + 1]?.swap;
      expect(f.ask.answer === 0).toBe(swapped);
    });
  });

  it("đếm phép so sánh: nổi bọt luôn n(n-1)/2, chèn trên mảng đã sắp chỉ n-1", () => {
    expect(sortFrames("bubble", [1, 2, 3, 4, 5, 6]).at(-1)!.compares).toBe(15);
    expect(sortFrames("insertion", [1, 2, 3, 4, 5, 6]).at(-1)!.compares).toBe(5);
    expect(sortFrames("selection", [6, 5, 4, 3, 2, 1]).at(-1)!.compares).toBe(15);
  });

  it("sắp xếp nhanh: sau khung đưa chốt về chỗ, bên trái nhỏ hơn và bên phải không nhỏ hơn", () => {
    for (const f of sortFrames("quick", [7, 2, 9, 4, 1, 8, 3]).filter((x) => x.line === 6)) {
      const [lo, hi] = f.range!;
      const p = f.a[f.pivot!];
      for (let k = lo; k < f.pivot!; k++) expect(f.a[k]).toBeLessThan(p);
      for (let k = f.pivot! + 1; k <= hi; k++) expect(f.a[k]).toBeGreaterThanOrEqual(p);
    }
  });

  it("randomArray cho số khác nhau trong 1..99; parseNumbers báo lỗi tiếng Việt", () => {
    const a = randomArray(12, seeded(3));
    expect(new Set(a).size).toBe(12);
    expect(a.every((x) => x >= 1 && x <= 99)).toBe(true);
    expect(parseNumbers("5, 3 8;1")).toEqual({ ok: true, values: [5, 3, 8, 1] });
    expect(parseNumbers("5, a").ok).toBe(false);
    expect(parseNumbers("5").ok).toBe(false);
  });
});

describe("tìm kiếm", () => {
  it("tuần tự và nhị phân cho cùng kết luận có/không", () => {
    const a = [12, 5, 40, 33, 8, 21, 17];
    for (const x of [...a, 0, 100, 18]) {
      const lin = searchFrames("linear", a, x).at(-1)!;
      const bin = searchFrames("binary", a, x).at(-1)!;
      expect(lin.found! >= 0).toBe(a.includes(x));
      expect(bin.found! >= 0).toBe(a.includes(x));
      if (lin.found! >= 0) expect(lin.a[lin.found!]).toBe(x);
      if (bin.found! >= 0) expect(bin.a[bin.found!]).toBe(x);
    }
  });

  it("nhị phân không quá ⌊log₂ n⌋ + 1 bước", () => {
    const a = Array.from({ length: 100 }, (_, i) => i * 2);
    for (const x of [0, 99, 198, 57, 1000]) expect(searchFrames("binary", a, x).at(-1)!.steps).toBeLessThanOrEqual(7);
    wellFormed(searchFrames("binary", a, 57), SEARCH_CODE.binary);
    wellFormed(searchFrames("linear", [3, 1, 2], 2), SEARCH_CODE.linear);
  });
});

describe("loang trên lưới", () => {
  it("BFS tìm đường ngắn nhất hợp lệ trên bản đồ mẫu", () => {
    const frames = gridFrames("bfs", DEFAULT_MAP);
    wellFormed(frames, GRID_CODE.bfs);
    const path = frames.at(-1)!.path!;
    expect(DEFAULT_MAP[unkey(path[0])[0]][unkey(path[0])[1]]).toBe("S");
    expect(DEFAULT_MAP[unkey(path.at(-1)!)[0]][unkey(path.at(-1)!)[1]]).toBe("T");
    for (let k = 1; k < path.length; k++) expect(neighbors(DEFAULT_MAP, path[k - 1])).toContain(path[k]);
    expect(path.length - 1).toBe(frames.at(-1)!.label[path.at(-1)!]);
  });

  it("DFS cũng tới đích, đường không ngắn hơn BFS", () => {
    const bfs = gridFrames("bfs", DEFAULT_MAP).at(-1)!.path!;
    const frames = gridFrames("dfs", DEFAULT_MAP);
    wellFormed(frames, GRID_CODE.dfs);
    const dfs = frames.at(-1)!.path!;
    expect(dfs.length).toBeGreaterThanOrEqual(bfs.length);
    for (let k = 1; k < dfs.length; k++) expect(neighbors(DEFAULT_MAP, dfs[k - 1])).toContain(dfs[k]);
  });

  it("chặn hết lối thì báo không có đường; không xoá được S/T", () => {
    const blocked = toggleWall(toggleWall(DEFAULT_MAP, 0, 1), 1, 0);
    expect(gridFrames("bfs", blocked).at(-1)!.path).toBeUndefined();
    expect(gridFrames("dfs", blocked).at(-1)!.note).toMatch(/không có đường/);
    expect(toggleWall(DEFAULT_MAP, 0, 0)).toBe(DEFAULT_MAP);
  });
});

describe("Dijkstra", () => {
  it("khoảng cách khớp với Bellman-Ford trên bản đồ mẫu", () => {
    const frames = dijkstraFrames(CITY, "A", "H");
    wellFormed(frames, DIJKSTRA_CODE);
    const bf: Record<string, number> = Object.fromEntries(CITY.nodes.map((n) => [n.id, Infinity]));
    bf.A = 0;
    for (let k = 0; k < CITY.nodes.length; k++) for (const [u, v, w] of CITY.edges) { bf[v] = Math.min(bf[v], bf[u] + w); bf[u] = Math.min(bf[u], bf[v] + w); }
    const last = frames.at(-1)!;
    expect(last.dist.H).toBe(bf.H);
    expect(last.path![0]).toBe("A");
    expect(last.path!.at(-1)).toBe("H");
    // Đỉnh được chốt theo thứ tự khoảng cách không giảm.
    const order = frames.filter((f) => f.line === 3).map((f) => f.dist[f.current!]!);
    expect(order).toEqual([...order].sort((x, y) => x - y));
    for (const f of frames.filter((x) => x.ask)) expect(f.ask!.options[f.ask!.answer]).toBe(frames[frames.indexOf(f) + 1].current);
  });
});

describe("cái túi và sàng", () => {
  it("cái túi khớp vét cạn mọi tập con", () => {
    for (const W of [0, 3, 5, 7, 10]) {
      let best = 0;
      for (let m = 0; m < 1 << BAG_ITEMS.length; m++) {
        const pick = BAG_ITEMS.filter((_, k) => m & (1 << k));
        if (pick.reduce((s, x) => s + x.w, 0) <= W) best = Math.max(best, pick.reduce((s, x) => s + x.v, 0));
      }
      const frames = knapsackFrames(BAG_ITEMS, W);
      wellFormed(frames, KNAPSACK_CODE);
      const last = frames.at(-1)!;
      expect(last.dp[BAG_ITEMS.length][W]).toBe(best);
      const chosen = last.chosen!.map((k) => BAG_ITEMS[k]);
      expect(chosen.reduce((s, x) => s + x.v, 0)).toBe(best);
      expect(chosen.reduce((s, x) => s + x.w, 0)).toBeLessThanOrEqual(W);
    }
  });

  it("sàng cho đúng các số nguyên tố", () => {
    const isPrime = (k: number) => k > 1 && Array.from({ length: k - 2 }, (_, i) => i + 2).every((d) => k % d);
    for (const n of [2, 10, 30, 97, 120]) {
      const frames = sieveFrames(n);
      wellFormed(frames, SIEVE_CODE);
      frames.at(-1)!.state.forEach((s, k) => expect(s === "prime").toBe(isPrime(k)));
    }
  });
});

describe("danh mục HSG", () => {
  it("mỗi thuật toán thuộc đúng một chủ đề", () => {
    const listed = HSG_TOPICS.flatMap((t) => t.algos.map((a) => [a, t.id] as const));
    expect(listed.map(([a]) => a).sort()).toEqual(Object.keys(ALGOS).sort());
    for (const [a, t] of listed) expect(ALGOS[a].topic).toBe(t);
  });
});

describe("chấm điểm mô phỏng", () => {
  it("10 điểm, mỗi lần sai trừ 0,5, thấp nhất 5", async () => {
    const { labScore, fmtScore, labSummary } = await import("@/lib/sim/lab-score");
    expect(labScore(0)).toBe(10);
    expect(labScore(3)).toBe(8.5);
    expect(labScore(40)).toBe(5);
    expect(fmtScore(8.5)).toBe("8,5");
    const r = (studentId: string, score: number, at: string) => ({ id: at, studentId, labSlug: "os-explorer", score, mistakes: 0, seconds: 60, finishedAt: at });
    const s = labSummary([r("a", 7, "1"), r("a", 9, "2"), r("b", 8, "3"), r("c", 10, "4")], ["a", "b", "d"], "os-explorer");
    expect(s.done).toBe(2);
    expect(s.missing).toEqual(["d"]);
    expect(s.rows[0]).toMatchObject({ studentId: "a", attempts: 2 });
    expect(s.rows[0].best.score).toBe(9);
    expect(s.avg).toBe(8.5);
  });
});
