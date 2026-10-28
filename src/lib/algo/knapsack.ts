import type { FrameBase } from "./types";

export interface Item { name: string; w: number; v: number }

export interface KnapsackFrame extends FrameBase {
  /** dp[i][c], null = chưa tính. Hàng 0 là "chưa xét món nào". */
  dp: (number | null)[][];
  cell?: [number, number];
  /** Các ô dùng để tính ô hiện tại. */
  from?: [number, number][];
  take?: boolean;
  /** Món được chọn (chỉ số 0..n-1) khi lần ngược. */
  chosen?: number[];
  trace?: [number, number][];
}

export const KNAPSACK_CODE = [
  "dp = [[0] * (W + 1) for _ in range(n + 1)]",
  "for i in range(1, n + 1):",
  "    for c in range(W + 1):",
  "        dp[i][c] = dp[i-1][c]      # không lấy",
  "        if w[i] <= c:              # bỏ vừa túi",
  "            lay = dp[i-1][c - w[i]] + v[i]",
  "            dp[i][c] = max(dp[i][c], lay)",
  "lần ngược từ dp[n][W] để biết lấy món nào",
];

export const BAG_ITEMS: Item[] = [
  { name: "Laptop", w: 4, v: 9 },
  { name: "Máy ảnh", w: 2, v: 5 },
  { name: "Sách", w: 3, v: 4 },
  { name: "Tai nghe", w: 1, v: 3 },
];

/** Cái túi 0/1: chọn món sao cho tổng khối lượng ≤ W và tổng giá trị lớn nhất. */
export function knapsackFrames(items: Item[], W: number): KnapsackFrame[] {
  const n = items.length;
  const dp: (number | null)[][] = Array.from({ length: n + 1 }, (_, i) => Array.from({ length: W + 1 }, () => (i === 0 ? 0 : null)));
  const frames: KnapsackFrame[] = [];
  const push = (f: Omit<KnapsackFrame, "dp">) => frames.push({ ...f, dp: dp.map((r) => [...r]) });
  push({ line: 0, note: `Bảng dp[i][c] = giá trị lớn nhất khi chỉ xét ${n > 0 ? "các món 1..i" : ""} với túi sức chứa c. Hàng 0 toàn 0 (chưa có món nào).` });

  for (let i = 1; i <= n; i++) {
    const it = items[i - 1];
    for (let c = 0; c <= W; c++) {
      const skip = dp[i - 1][c]!;
      if (it.w > c) {
        dp[i][c] = skip;
        push({ line: 3, cell: [i, c], from: [[i - 1, c]], take: false, note: `${it.name} nặng ${it.w} > ${c}: không bỏ vừa túi, dp[${i}][${c}] = dp[${i - 1}][${c}] = ${skip}.` });
        continue;
      }
      const takeVal = dp[i - 1][c - it.w]! + it.v;
      const take = takeVal > skip;
      push({
        line: 5, cell: [i, c], from: [[i - 1, c], [i - 1, c - it.w]],
        note: `Túi ${c}: ${it.name} nặng ${it.w} ≤ ${c}, bỏ vừa túi. So sánh không lấy (ô trên) với lấy (ô trên, lùi ${it.w} cột, cộng ${it.v}).`,
        ask: { q: `Túi sức chứa ${c}: có nên lấy ${it.name} (nặng ${it.w}, giá trị ${it.v})?`, options: [`Lấy (được ${takeVal})`, `Không lấy (giữ ${skip})`], answer: take ? 0 : 1 },
      });
      dp[i][c] = Math.max(skip, takeVal);
      push({ line: 6, cell: [i, c], from: [[i - 1, c], [i - 1, c - it.w]], take, note: `Không lấy ${it.name} → ${skip}; lấy → dp[${i - 1}][${c - it.w}] + ${it.v} = ${takeVal}. dp[${i}][${c}] = ${dp[i][c]}.` });
    }
  }

  const chosen: number[] = [];
  const traceCells: [number, number][] = [];
  let c = W;
  for (let i = n; i >= 1; i--) {
    traceCells.push([i, c]);
    if (dp[i][c] !== dp[i - 1][c]) { chosen.unshift(i - 1); c -= items[i - 1].w; }
  }
  push({ line: 7, chosen, trace: traceCells, note: `Giá trị lớn nhất là ${dp[n][W]}. Lần ngược: ô nào khác ô ngay trên nghĩa là có lấy món đó → ${chosen.map((k) => items[k].name).join(", ") || "không món nào"}.` });
  return frames;
}
