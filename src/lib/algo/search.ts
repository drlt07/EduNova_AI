import type { FrameBase } from "./types";

export type SearchKind = "linear" | "binary";

export interface SearchFrame extends FrameBase {
  a: number[];
  x: number;
  /** Vị trí đang xét (tuần tự) hoặc mid (nhị phân). */
  i?: number;
  lo?: number;
  hi?: number;
  /** Vị trí tìm thấy; -1 nếu kết luận không có. */
  found?: number;
  steps: number;
}

export const SEARCH_CODE: Record<SearchKind, string[]> = {
  linear: [
    "for i in range(n):",
    "    if a[i] == x:",
    "        return i",
    "return -1",
  ],
  binary: [
    "lo, hi = 0, n - 1      # a đã sắp tăng dần",
    "while lo <= hi:",
    "    mid = (lo + hi) // 2",
    "    if a[mid] == x: return mid",
    "    elif a[mid] < x: lo = mid + 1",
    "    else: hi = mid - 1",
    "return -1",
  ],
};

const BIN_ASK = ["Tìm thấy", "Bỏ nửa trái, tìm bên phải", "Bỏ nửa phải, tìm bên trái"];

/** Các bước tìm `x` trong `a`. Tìm nhị phân tự sắp xếp `a` trước (thuật toán yêu cầu mảng đã sắp). */
export function searchFrames(kind: SearchKind, input: number[], x: number): SearchFrame[] {
  const a = kind === "binary" ? [...input].sort((p, q) => p - q) : [...input];
  const n = a.length;
  const frames: SearchFrame[] = [];
  let steps = 0;
  const push = (f: Omit<SearchFrame, "a" | "x" | "steps">) => frames.push({ ...f, a, x, steps });

  if (kind === "linear") {
    push({ line: 0, note: `Tìm x = ${x}: duyệt lần lượt từ trái sang phải.` });
    for (let i = 0; i < n; i++) {
      steps++;
      const hit = a[i] === x;
      push({ line: 1, i, note: `So sánh a[${i}] = ${a[i]} với x = ${x}.`, ask: { q: `a[${i}] = ${a[i]} có bằng ${x}?`, options: ["Bằng: dừng", "Khác: xét tiếp"], answer: hit ? 0 : 1 } });
      if (hit) {
        push({ line: 2, i, found: i, note: `Tìm thấy ${x} ở vị trí ${i} sau ${steps} phép so sánh.` });
        return frames;
      }
    }
    push({ line: 3, found: -1, note: `Đã xét hết ${n} phần tử, không có ${x}. Trường hợp xấu nhất: n phép so sánh.` });
    return frames;
  }

  let lo = 0, hi = n - 1;
  push({ line: 0, lo, hi, note: `Mảng đã sắp tăng dần. Tìm x = ${x} trong đoạn a[0..${n - 1}].` });
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    steps++;
    const kindOf = a[mid] === x ? 0 : a[mid] < x ? 1 : 2;
    push({ line: 2, lo, hi, i: mid, note: `Đoạn a[${lo}..${hi}], phần tử giữa là a[${mid}] = ${a[mid]}.`, ask: { q: `a[mid] = ${a[mid]}, x = ${x}. Bước tiếp theo?`, options: BIN_ASK, answer: kindOf } });
    if (kindOf === 0) {
      push({ line: 3, lo, hi, i: mid, found: mid, note: `a[${mid}] = ${x}: tìm thấy sau ${steps} lần chia đôi.` });
      return frames;
    }
    if (kindOf === 1) {
      lo = mid + 1;
      push({ line: 4, lo, hi, i: mid, note: `${a[mid]} < ${x} nên x chỉ có thể ở bên phải: bỏ cả nửa trái, lo = ${lo}.` });
    } else {
      hi = mid - 1;
      push({ line: 5, lo, hi, i: mid, note: `${a[mid]} > ${x} nên x chỉ có thể ở bên trái: bỏ cả nửa phải, hi = ${hi}.` });
    }
  }
  push({ line: 6, lo, hi, found: -1, note: `lo > hi: đoạn tìm kiếm rỗng, không có ${x}. Chỉ mất ${steps} bước (khoảng log₂ n).` });
  return frames;
}
