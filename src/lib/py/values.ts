/** Giá trị trong trình thông dịch Python thu gọn. */
export type PyInt = { k: "int"; v: number };
export type PyFloat = { k: "float"; v: number };
export type PyList = { k: "list"; items: PyValue[] };
export type PyFunc = { k: "func"; name: string; params: string[]; body: import("./ast").Stmt[] };
export type PyBuiltin = { k: "builtin"; name: string; fn: (args: PyValue[], kwargs: Record<string, PyValue>, line: number) => PyValue };
export type PyRange = { k: "range"; start: number; stop: number; step: number };
export type PyValue = PyInt | PyFloat | string | boolean | null | PyList | PyFunc | PyBuiltin | PyRange;

export const int = (v: number): PyInt => ({ k: "int", v });
export const float = (v: number): PyFloat => ({ k: "float", v });
export const list = (items: PyValue[]): PyList => ({ k: "list", items });

export function typeName(x: PyValue): string {
  if (x === null) return "NoneType";
  if (typeof x === "string") return "str";
  if (typeof x === "boolean") return "bool";
  switch (x.k) {
    case "int": return "int";
    case "float": return "float";
    case "list": return "list";
    case "func": return "function";
    case "builtin": return "builtin_function";
    case "range": return "range";
  }
}

export function isNum(x: PyValue): x is PyInt | PyFloat | boolean {
  return typeof x === "boolean" || (x !== null && typeof x === "object" && (x.k === "int" || x.k === "float"));
}

export function numVal(x: PyInt | PyFloat | boolean): number {
  return typeof x === "boolean" ? (x ? 1 : 0) : x.v;
}

export function isIntLike(x: PyValue): x is PyInt | boolean {
  return typeof x === "boolean" || (x !== null && typeof x === "object" && x.k === "int");
}

export function truthy(x: PyValue): boolean {
  if (x === null) return false;
  if (typeof x === "boolean") return x;
  if (typeof x === "string") return x.length > 0;
  switch (x.k) {
    case "int":
    case "float":
      return x.v !== 0;
    case "list":
      return x.items.length > 0;
    case "range":
      return rangeLen(x) > 0;
    default:
      return true;
  }
}

export function rangeLen(r: PyRange): number {
  const n = Math.ceil((r.stop - r.start) / r.step);
  return Math.max(0, n);
}

function floatStr(v: number): string {
  if (Number.isNaN(v)) return "nan";
  if (!Number.isFinite(v)) return v > 0 ? "inf" : "-inf";
  if (Number.isInteger(v) && Math.abs(v) < 1e16) return v.toFixed(1);
  const s = String(v);
  return s.includes("e") ? s.replace(/e\+?/, "e+").replace("e+-", "e-") : s;
}

export function str(x: PyValue): string {
  if (typeof x === "string") return x;
  return repr(x);
}

export function repr(x: PyValue): string {
  if (x === null) return "None";
  if (typeof x === "boolean") return x ? "True" : "False";
  if (typeof x === "string") return x.includes("'") && !x.includes('"') ? `"${x}"` : `'${x.replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/\n/g, "\\n")}'`;
  switch (x.k) {
    case "int": return String(x.v);
    case "float": return floatStr(x.v);
    case "list": return `[${x.items.map(repr).join(", ")}]`;
    case "func": return `<function ${x.name}>`;
    case "builtin": return `<built-in function ${x.name}>`;
    case "range": return x.step === 1 ? `range(${x.start}, ${x.stop})` : `range(${x.start}, ${x.stop}, ${x.step})`;
  }
}

export function pyEquals(a: PyValue, b: PyValue): boolean {
  if (isNum(a) && isNum(b)) return numVal(a) === numVal(b);
  if (typeof a === "string" || typeof b === "string") return a === b;
  if (a === null || b === null) return a === b;
  if (typeof a === "object" && typeof b === "object" && a.k === "list" && b.k === "list")
    return a.items.length === b.items.length && a.items.every((x, i) => pyEquals(x, b.items[i]));
  return a === b;
}
