import type { FrameBase } from "./types";

export type SieveMark = "unknown" | "prime" | "composite";

export interface SieveFrame extends FrameBase {
  /** state[k] cho số k (0..n). */
  state: SieveMark[];
  p?: number;
  j?: number;
  marks: number;
}

export const SIEVE_CODE = [
  "nt = [True] * (n + 1); nt[0] = nt[1] = False",
  "p = 2",
  "while p * p <= n:",
  "    if nt[p]:              # p là số nguyên tố",
  "        for j in range(p * p, n + 1, p):",
  "            nt[j] = False  # bội của p: hợp số",
  "    p += 1",
  "các số còn True là số nguyên tố",
];

/** Sàng Eratosthenes đến n (2 ≤ n ≤ 200). */
export function sieveFrames(n: number): SieveFrame[] {
  const state: SieveMark[] = Array.from({ length: n + 1 }, (_, k) => (k < 2 ? "composite" : "unknown"));
  const frames: SieveFrame[] = [];
  let marks = 0;
  const push = (f: Omit<SieveFrame, "state" | "marks">) => frames.push({ ...f, state: [...state], marks });
  push({ line: 0, note: `Viết các số từ 2 đến ${n}, ban đầu coi tất cả là số nguyên tố.` });
  for (let p = 2; p * p <= n; p++) {
    if (state[p] === "composite") {
      push({ line: 3, p, note: `${p} đã bị gạch (là bội của số nhỏ hơn): bỏ qua.`, ask: { q: `${p} có phải số nguyên tố không?`, options: ["Có", "Không, đã bị gạch"], answer: 1 } });
      continue;
    }
    push({ line: 2, p, note: `Xét p = ${p} (${p}² = ${p * p} ≤ ${n}).`, ask: { q: `${p} có phải số nguyên tố không?`, options: ["Có", "Không, đã bị gạch"], answer: 0 } });
    state[p] = "prime";
    push({ line: 3, p, note: `${p} chưa bị gạch nên là số nguyên tố. Gạch các bội của ${p} bắt đầu từ ${p}² = ${p * p} (bội nhỏ hơn đã bị gạch trước đó).` });
    for (let j = p * p; j <= n; j += p) {
      const was = state[j];
      state[j] = "composite";
      if (was !== "composite") marks++;
      push({ line: 5, p, j, note: was === "composite" ? `${j} đã bị gạch từ trước.` : `Gạch ${j} = ${p} × ${j / p}.` });
    }
  }
  for (let k = 2; k <= n; k++) if (state[k] === "unknown") state[k] = "prime";
  const primes = state.flatMap((s, k) => (s === "prime" ? [k] : []));
  push({ line: 7, note: `Dừng khi p² > ${n}. Có ${primes.length} số nguyên tố ≤ ${n}: ${primes.join(", ")}.` });
  return frames;
}
