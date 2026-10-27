/** Binary & Logic Lab (bản rút gọn, REAL): chuyển đổi bit và cổng logic. */
export function bitsToNumber(bits: boolean[]): number {
  return bits.reduce((acc, b) => acc * 2 + (b ? 1 : 0), 0);
}

export function numberToBits(n: number, width = 8): boolean[] {
  const v = Math.max(0, Math.min(2 ** width - 1, Math.floor(n)));
  return Array.from({ length: width }, (_, i) => ((v >> (width - 1 - i)) & 1) === 1);
}

export type Gate = "AND" | "OR" | "XOR" | "NAND" | "NOR";

export function applyGate(g: Gate, a: boolean, b: boolean): boolean {
  switch (g) {
    case "AND": return a && b;
    case "OR": return a || b;
    case "XOR": return a !== b;
    case "NAND": return !(a && b);
    case "NOR": return !(a || b);
  }
}
