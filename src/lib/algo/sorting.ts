import type { FrameBase } from "./types";

export type SortKind = "bubble" | "selection" | "insertion" | "merge" | "quick";

export interface SortFrame extends FrameBase {
  a: number[];
  /** Hai vị trí đang so sánh. */
  cmp?: [number, number];
  /** Hai vị trí vừa đổi chỗ. */
  swap?: [number, number];
  /** Vị trí vừa được ghi giá trị (chèn, trộn). */
  set?: number;
  /** Các vị trí đã nằm đúng chỗ cuối cùng. */
  sorted: number[];
  /** Đoạn đang xử lí [lo, hi] (gồm cả hai đầu). */
  range?: [number, number];
  pivot?: number;
  /** Vị trí nhỏ nhất đang giữ (sắp xếp chọn). */
  min?: number;
  /** Hai nửa đang trộn (sắp xếp trộn), i/j là phần tử đầu chưa lấy. */
  merge?: { left: number[]; right: number[]; i: number; j: number };
  compares: number;
  writes: number;
}

export const SORT_CODE: Record<SortKind, string[]> = {
  bubble: [
    "for i in range(n - 1):",
    "    for j in range(n - 1 - i):",
    "        if a[j] > a[j + 1]:",
    "            a[j], a[j + 1] = a[j + 1], a[j]",
  ],
  selection: [
    "for i in range(n - 1):",
    "    m = i",
    "    for j in range(i + 1, n):",
    "        if a[j] < a[m]:",
    "            m = j",
    "    a[i], a[m] = a[m], a[i]",
  ],
  insertion: [
    "for i in range(1, n):",
    "    x = a[i]; j = i - 1",
    "    while j >= 0 and a[j] > x:",
    "        a[j + 1] = a[j]; j -= 1",
    "    a[j + 1] = x",
  ],
  merge: [
    "def msort(lo, hi):          # sắp đoạn a[lo..hi]",
    "    if lo >= hi: return",
    "    mid = (lo + hi) // 2",
    "    msort(lo, mid); msort(mid + 1, hi)",
    "    while i <= mid and j <= hi:  # trộn",
    "        lấy số nhỏ hơn ở đầu hai nửa",
    "    chép phần còn lại vào cuối",
  ],
  quick: [
    "def qsort(lo, hi):",
    "    if lo >= hi: return",
    "    p = a[hi]; i = lo     # chốt là số cuối",
    "    for j in range(lo, hi):",
    "        if a[j] < p:",
    "            a[i], a[j] = a[j], a[i]; i += 1",
    "    a[i], a[hi] = a[hi], a[i]   # chốt về chỗ",
    "    qsort(lo, i - 1); qsort(i + 1, hi)",
  ],
};

const range = (lo: number, hi: number) => Array.from({ length: Math.max(0, hi - lo + 1) }, (_, k) => lo + k);
const SWAP_ASK = ["Đổi chỗ", "Giữ nguyên"];

/** Sinh toàn bộ các bước sắp xếp tăng dần của mảng `input` (không sửa mảng gốc). */
export function sortFrames(kind: SortKind, input: number[]): SortFrame[] {
  const a = [...input];
  const n = a.length;
  const frames: SortFrame[] = [];
  const sorted = new Set<number>();
  let compares = 0;
  let writes = 0;
  const push = (f: Omit<SortFrame, "a" | "sorted" | "compares" | "writes">) => frames.push({ ...f, a: [...a], sorted: [...sorted].sort((x, y) => x - y), compares, writes });
  const swap = (i: number, j: number) => { [a[i], a[j]] = [a[j], a[i]]; writes += 2; };

  push({ line: 0, note: `Mảng ban đầu có ${n} phần tử. Mục tiêu: sắp xếp tăng dần.` });

  if (kind === "bubble") {
    for (let i = 0; i < n - 1; i++) {
      for (let j = 0; j < n - 1 - i; j++) {
        compares++;
        const big = a[j] > a[j + 1];
        push({ line: 2, cmp: [j, j + 1], note: `So sánh a[${j}] = ${a[j]} với a[${j + 1}] = ${a[j + 1]}.`, ask: { q: `${a[j]} và ${a[j + 1]}: có đổi chỗ không?`, options: SWAP_ASK, answer: big ? 0 : 1 } });
        if (big) {
          swap(j, j + 1);
          push({ line: 3, swap: [j, j + 1], note: `${a[j + 1]} > ${a[j]} nên đổi chỗ: số lớn "nổi" dần về bên phải.` });
        }
      }
      sorted.add(n - 1 - i);
      push({ line: 0, note: `Hết lượt ${i + 1}: số lớn nhất còn lại (${a[n - 1 - i]}) đã về đúng vị trí ${n - 1 - i}.` });
    }
  } else if (kind === "selection") {
    for (let i = 0; i < n - 1; i++) {
      let m = i;
      push({ line: 1, min: m, range: [i, n - 1], note: `Lượt ${i + 1}: tìm số nhỏ nhất trong đoạn a[${i}..${n - 1}], tạm coi a[${i}] = ${a[i]} là nhỏ nhất.` });
      for (let j = i + 1; j < n; j++) {
        compares++;
        const less = a[j] < a[m];
        push({ line: 3, cmp: [j, m], min: m, range: [i, n - 1], note: `So sánh a[${j}] = ${a[j]} với số nhỏ nhất hiện tại ${a[m]}.`, ask: { q: `${a[j]} có nhỏ hơn ${a[m]} không?`, options: ["Nhỏ hơn: đổi số nhỏ nhất", "Không"], answer: less ? 0 : 1 } });
        if (less) {
          m = j;
          push({ line: 4, min: m, range: [i, n - 1], note: `Số nhỏ nhất mới là a[${m}] = ${a[m]}.` });
        }
      }
      if (m !== i) swap(i, m);
      sorted.add(i);
      push({ line: 5, swap: m !== i ? [i, m] : undefined, note: m !== i ? `Đổi a[${i}] với a[${m}]: ${a[i]} về đúng vị trí ${i}.` : `a[${i}] = ${a[i]} đã là nhỏ nhất, không cần đổi.` });
    }
    sorted.add(n - 1);
  } else if (kind === "insertion") {
    sorted.add(0);
    for (let i = 1; i < n; i++) {
      const x = a[i];
      let j = i - 1;
      push({ line: 1, set: i, range: [0, i], note: `Lấy x = a[${i}] = ${x} ra, chèn vào đúng chỗ trong phần đã sắp a[0..${i - 1}].` });
      while (j >= 0) {
        compares++;
        const bigger = a[j] > x;
        push({ line: 2, cmp: [j, j + 1], range: [0, i], note: `So sánh a[${j}] = ${a[j]} với x = ${x}.`, ask: { q: `a[${j}] = ${a[j]} có lớn hơn x = ${x}?`, options: ["Lớn hơn: dời sang phải", "Không: dừng lại"], answer: bigger ? 0 : 1 } });
        if (!bigger) break;
        a[j + 1] = a[j];
        writes++;
        push({ line: 3, set: j + 1, range: [0, i], note: `${a[j]} > ${x} nên dời ${a[j]} sang phải một ô.` });
        j--;
      }
      a[j + 1] = x;
      writes++;
      for (let k = 0; k <= i; k++) sorted.add(k);
      push({ line: 4, set: j + 1, range: [0, i], note: `Đặt x = ${x} vào vị trí ${j + 1}. Đoạn a[0..${i}] đã sắp.` });
    }
  } else if (kind === "merge") {
    const rec = (lo: number, hi: number) => {
      if (lo >= hi) return;
      const mid = (lo + hi) >> 1;
      push({ line: 2, range: [lo, hi], note: `Chia đoạn a[${lo}..${hi}] thành a[${lo}..${mid}] và a[${mid + 1}..${hi}].` });
      rec(lo, mid);
      rec(mid + 1, hi);
      const left = a.slice(lo, mid + 1);
      const right = a.slice(mid + 1, hi + 1);
      let i = 0, j = 0, k = lo;
      push({ line: 4, range: [lo, hi], merge: { left, right, i: 0, j: 0 }, note: `Trộn hai nửa đã sắp [${left.join(", ")}] và [${right.join(", ")}].` });
      while (i < left.length && j < right.length) {
        compares++;
        const takeLeft = left[i] <= right[j];
        push({ line: 5, range: [lo, hi], merge: { left, right, i, j }, note: `So sánh đầu hai nửa: ${left[i]} và ${right[j]}.`, ask: { q: `Lấy số nào trước: ${left[i]} hay ${right[j]}?`, options: [`${left[i]} (nửa trái)`, `${right[j]} (nửa phải)`], answer: takeLeft ? 0 : 1 } });
        a[k] = takeLeft ? left[i++] : right[j++];
        writes++;
        push({ line: 5, range: [lo, hi], set: k, merge: { left, right, i, j }, note: `Ghi ${a[k]} vào vị trí ${k}.` });
        k++;
      }
      while (i < left.length || j < right.length) {
        a[k] = i < left.length ? left[i++] : right[j++];
        writes++;
        push({ line: 6, range: [lo, hi], set: k, merge: { left, right, i, j }, note: `Chép phần còn lại: ${a[k]} vào vị trí ${k}.` });
        k++;
      }
      if (lo === 0 && hi === n - 1) range(0, n - 1).forEach((x) => sorted.add(x));
    };
    rec(0, n - 1);
  } else {
    const rec = (lo: number, hi: number) => {
      if (lo > hi) return;
      if (lo === hi) { sorted.add(lo); push({ line: 1, range: [lo, hi], note: `Đoạn chỉ còn một phần tử (${a[lo]}): đã đúng chỗ.` }); return; }
      const p = a[hi];
      let i = lo;
      push({ line: 2, range: [lo, hi], pivot: hi, note: `Đoạn a[${lo}..${hi}]: chọn chốt p = ${p}. Số nhỏ hơn p dồn sang trái.` });
      for (let j = lo; j < hi; j++) {
        compares++;
        const less = a[j] < p;
        push({ line: 4, range: [lo, hi], pivot: hi, cmp: [j, hi], note: `So sánh a[${j}] = ${a[j]} với chốt ${p}.`, ask: { q: `${a[j]} < ${p}? Có đưa sang nhóm bên trái không?`, options: ["Có", "Không"], answer: less ? 0 : 1 } });
        if (less) {
          if (i !== j) swap(i, j);
          push({ line: 5, range: [lo, hi], pivot: hi, swap: i !== j ? [i, j] : undefined, note: `${a[i]} < ${p}: đặt vào nhóm trái ở vị trí ${i}.` });
          i++;
        }
      }
      if (i !== hi) swap(i, hi);
      sorted.add(i);
      push({ line: 6, range: [lo, hi], pivot: i, swap: i !== hi ? [i, hi] : undefined, note: `Đưa chốt ${p} về vị trí ${i}: bên trái đều nhỏ hơn, bên phải đều không nhỏ hơn.` });
      rec(lo, i - 1);
      rec(i + 1, hi);
    };
    rec(0, n - 1);
  }
  range(0, n - 1).forEach((x) => sorted.add(x));
  push({ line: 0, note: `Xong! Mảng đã sắp xếp: ${a.join(", ")}. ${compares} phép so sánh, ${writes} lần ghi.` });
  return frames;
}

/** Mảng ngẫu nhiên các số 1..99 khác nhau, dùng `rand` để kiểm thử được. */
export function randomArray(n: number, rand: () => number = Math.random): number[] {
  const pool = Array.from({ length: 99 }, (_, i) => i + 1);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, n);
}

/** Đọc dãy số do học sinh nhập ("5, 3 8"); trả lỗi tiếng Việt nếu sai. */
export function parseNumbers(text: string, min = 2, max = 16): { ok: true; values: number[] } | { ok: false; error: string } {
  const parts = text.split(/[\s,;]+/).filter(Boolean);
  const values = parts.map(Number);
  if (values.some((v) => !Number.isInteger(v))) return { ok: false, error: "Chỉ nhập số nguyên, cách nhau bởi dấu phẩy hoặc khoảng trắng." };
  if (values.length < min || values.length > max) return { ok: false, error: `Nhập từ ${min} đến ${max} số.` };
  if (values.some((v) => v < 0 || v > 999)) return { ok: false, error: "Mỗi số trong khoảng 0–999." };
  return { ok: true, values };
}
