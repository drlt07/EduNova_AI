/**
 * Trình thông dịch Python THU GỌN (tập con dùng trong Tin học 10–11), viết bằng TypeScript.
 * Không dùng eval; có giới hạn số bước để tránh vòng lặp vô hạn; ghi lại từng bước (trace)
 * để trực quan hóa quá trình chạy. Không có import, file, mạng hay thư viện ngoài.
 */
import type { Expr, Stmt } from "./ast";
import { PyError } from "./errors";
import { parse } from "./parser";
import {
  float, int, isIntLike, isNum, list, numVal, pyEquals, rangeLen, repr, str, truthy, typeName,
  type PyBuiltin, type PyFunc, type PyList, type PyValue,
} from "./values";

export interface TraceVar {
  name: string;
  type: string;
  value: string;
  changed: boolean;
}

export interface TraceStep {
  line: number;
  note: string;
  branch?: "taken" | "skipped";
  vars: TraceVar[];
  scope: string;
  output: string;
}

export interface RunResult {
  ok: boolean;
  output: string;
  error?: { type: string; message: string; line: number; explain: string };
  trace: TraceStep[];
  traceTruncated: boolean;
  /** các lời gọi hàm "phần cứng" do bài (game) cung cấp, ví dụ pump_on/pump_off */
  events: { name: string; args: string[]; line: number }[];
  steps: number;
}

export interface RunOptions {
  stdin?: string[];
  globals?: Record<string, PyValue>;
  /** hàm phần cứng ảo được ghi lại vào events */
  hooks?: string[];
  maxSteps?: number;
  maxTrace?: number;
  trace?: boolean;
  /** true: in lời nhắc của input() và giá trị đã nhập (hiển thị console); false: khi chấm bài */
  echoInput?: boolean;
}

class BreakSig {}
class ContinueSig {}
class ReturnSig {
  constructor(public value: PyValue) {}
}

const MAX_OUTPUT = 20_000;

type Frame = { name: string; vars: Map<string, PyValue> };

export function runPython(source: string, opts: RunOptions = {}): RunResult {
  const output: string[] = [];
  let outLen = 0;
  const stdin = [...(opts.stdin ?? [])];
  const events: RunResult["events"] = [];
  const trace: TraceStep[] = [];
  const maxSteps = opts.maxSteps ?? 200_000;
  const maxTrace = opts.maxTrace ?? 2_000;
  const doTrace = opts.trace ?? true;
  const echo = opts.echoInput ?? true;
  let steps = 0;
  let traceTruncated = false;
  let curLine = 1;
  let callDepth = 0;
  const globals: Frame = { name: "global", vars: new Map(Object.entries(opts.globals ?? {})) };
  const hiddenNames = new Set(Object.keys(opts.globals ?? {}).filter((k) => {
    const v = opts.globals![k];
    return v !== null && typeof v === "object" && (v.k === "builtin" || v.k === "func");
  }));
  let prevSnapshot = new Map<string, string>();

  const err = (type: string, message: string, explain: string) => new PyError(type, message, curLine, explain);

  function tick() {
    if (++steps > maxSteps) throw err("TimeoutError", "program took too long", "Chương trình chạy quá nhiều bước. Có thể vòng lặp không bao giờ dừng — kiểm tra điều kiện lặp và việc cập nhật biến.");
  }

  function write(s: string) {
    if (outLen > MAX_OUTPUT) return;
    output.push(s);
    outLen += s.length;
  }

  function snapshot(frame: Frame): TraceVar[] {
    const rows: TraceVar[] = [];
    const seen = new Map<string, string>();
    const add = (name: string, v: PyValue, prefix = "") => {
      if (v !== null && typeof v === "object" && (v.k === "builtin")) return;
      if (hiddenNames.has(name)) return;
      const value = v !== null && typeof v === "object" && v.k === "func" ? `hàm ${v.name}()` : repr(v);
      const key = prefix + name;
      seen.set(key, value);
      rows.push({ name: key, type: typeName(v), value: value.length > 80 ? value.slice(0, 77) + "…" : value, changed: prevSnapshot.get(key) !== value });
    };
    globals.vars.forEach((v, k) => add(k, v));
    if (frame !== globals) frame.vars.forEach((v, k) => add(k, v, `${frame.name}.`));
    prevSnapshot = seen;
    return rows;
  }

  function record(frame: Frame, line: number, note: string, branch?: TraceStep["branch"]) {
    if (!doTrace) return;
    if (trace.length >= maxTrace) {
      traceTruncated = true;
      return;
    }
    trace.push({ line, note, branch, vars: snapshot(frame), scope: frame.name, output: output.join("") });
  }

  // ---------- builtins ----------
  const B = (name: string, fn: PyBuiltin["fn"]): PyBuiltin => ({ k: "builtin", name, fn });
  const toNumber = (x: PyValue, fname: string): number => {
    if (isNum(x)) return numVal(x);
    throw err("TypeError", `${fname}() argument must be a number, not '${typeName(x)}'`, `Hàm ${fname}() cần đối số là số.`);
  };
  const iterate = (x: PyValue): PyValue[] => {
    if (typeof x === "string") return [...x];
    if (x !== null && typeof x === "object") {
      if (x.k === "list") return [...x.items];
      if (x.k === "range") {
        const out: PyValue[] = [];
        const n = rangeLen(x);
        if (n > 1_000_000) throw err("MemoryError", "range too large", "Dãy range quá lớn.");
        for (let i = 0; i < n; i++) out.push(int(x.start + i * x.step));
        return out;
      }
    }
    throw err("TypeError", `'${typeName(x)}' object is not iterable`, `Không thể duyệt qua giá trị kiểu ${typeName(x)} bằng vòng lặp for.`);
  };

  const builtins: Record<string, PyBuiltin> = {
    print: B("print", (args, kw) => {
      const sep = kw.sep !== undefined ? str(kw.sep) : " ";
      const end = kw.end !== undefined ? str(kw.end) : "\n";
      write(args.map(str).join(sep) + end);
      return null;
    }),
    input: B("input", (args) => {
      if (stdin.length === 0) throw err("EOFError", "EOF when reading a line", "Chương trình cần nhập thêm dữ liệu. Hãy điền dữ liệu vào ô Dữ liệu vào (mỗi dòng một giá trị).");
      const v = stdin.shift()!;
      if (echo) write((args[0] !== undefined ? str(args[0]) : "") + v + "\n");
      return v;
    }),
    int: B("int", (args) => {
      const x = args[0] ?? int(0);
      if (typeof x === "string") {
        const s = x.trim();
        if (!/^[+-]?\d+$/.test(s)) throw err("ValueError", `invalid literal for int() with base 10: ${repr(x)}`, `Không đổi được "${x}" thành số nguyên. Hãy nhập một số nguyên, ví dụ 7.`);
        return int(parseInt(s, 10));
      }
      return int(Math.trunc(toNumber(x, "int")));
    }),
    float: B("float", (args) => {
      const x = args[0] ?? float(0);
      if (typeof x === "string") {
        const v = Number(x.trim());
        if (x.trim() === "" || Number.isNaN(v)) throw err("ValueError", `could not convert string to float: ${repr(x)}`, `Không đổi được "${x}" thành số thực. Dùng dấu chấm cho phần thập phân, ví dụ 6.5.`);
        return float(v);
      }
      return float(toNumber(x, "float"));
    }),
    str: B("str", (args) => (args[0] === undefined ? "" : str(args[0]))),
    bool: B("bool", (args) => truthy(args[0] ?? false)),
    len: B("len", (args) => {
      const x = args[0];
      if (typeof x === "string") return int(x.length);
      if (x && typeof x === "object" && x.k === "list") return int(x.items.length);
      if (x && typeof x === "object" && x.k === "range") return int(rangeLen(x));
      throw err("TypeError", `object of type '${typeName(x ?? null)}' has no len()`, "Hàm len() dùng cho xâu hoặc danh sách.");
    }),
    range: B("range", (args) => {
      const n = args.map((a) => {
        if (!isIntLike(a)) throw err("TypeError", `'${typeName(a)}' object cannot be interpreted as an integer`, "range() cần các số nguyên.");
        return numVal(a);
      });
      const [start, stop, step] = n.length === 1 ? [0, n[0], 1] : [n[0], n[1], n[2] ?? 1];
      if (step === 0) throw err("ValueError", "range() arg 3 must not be zero", "Bước nhảy của range() không được bằng 0.");
      return { k: "range", start, stop, step };
    }),
    abs: B("abs", (args) => { const x = args[0]; const v = Math.abs(toNumber(x, "abs")); return isIntLike(x) ? int(v) : float(v); }),
    round: B("round", (args) => {
      const v = toNumber(args[0], "round");
      if (args[1] === undefined) {
        const r = Math.round(v);
        return int(Math.abs(v % 1) === 0.5 && r % 2 !== 0 ? r - 1 : r);
      }
      const d = toNumber(args[1], "round");
      return float(Number(v.toFixed(d)));
    }),
    min: B("min", (args) => { const xs = args.length === 1 ? iterate(args[0]) : args; if (!xs.length) throw err("ValueError", "min() arg is an empty sequence", "Danh sách rỗng."); return xs.reduce((a, b) => (compareVals(b, a, "<") ? b : a)); }),
    max: B("max", (args) => { const xs = args.length === 1 ? iterate(args[0]) : args; if (!xs.length) throw err("ValueError", "max() arg is an empty sequence", "Danh sách rỗng."); return xs.reduce((a, b) => (compareVals(b, a, ">") ? b : a)); }),
    sum: B("sum", (args) => iterate(args[0]).reduce<PyValue>((a, b) => binop("+", a, b), int(0))),
    list: B("list", (args) => list(args[0] === undefined ? [] : iterate(args[0]))),
    sorted: B("sorted", (args, kw) => { const xs = iterate(args[0]); xs.sort((a, b) => (compareVals(a, b, "<") ? -1 : compareVals(b, a, "<") ? 1 : 0)); if (kw.reverse && truthy(kw.reverse)) xs.reverse(); return list(xs); }),
    type: B("type", (args) => `<class '${typeName(args[0] ?? null)}'>`),
  };
  for (const h of opts.hooks ?? []) {
    builtins[h] = B(h, (args) => {
      events.push({ name: h, args: args.map(repr), line: curLine });
      return null;
    });
  }

  // ---------- operators ----------
  function binop(op: string, a: PyValue, b: PyValue): PyValue {
    if (isNum(a) && isNum(b)) {
      const x = numVal(a);
      const y = numVal(b);
      const ints = isIntLike(a) && isIntLike(b);
      switch (op) {
        case "+": return ints ? int(x + y) : float(x + y);
        case "-": return ints ? int(x - y) : float(x - y);
        case "*": return ints ? int(x * y) : float(x * y);
        case "/":
          if (y === 0) throw err("ZeroDivisionError", "division by zero", "Không thể chia cho 0. Hãy kiểm tra số chia trước khi chia.");
          return float(x / y);
        case "//":
          if (y === 0) throw err("ZeroDivisionError", "integer division or modulo by zero", "Không thể chia cho 0.");
          return ints ? int(Math.floor(x / y)) : float(Math.floor(x / y));
        case "%":
          if (y === 0) throw err("ZeroDivisionError", "integer modulo by zero", "Không thể chia lấy dư cho 0.");
          { const m = ((x % y) + y) % y; return ints ? int(m) : float(m); }
        case "**": {
          const v = x ** y;
          return ints && y >= 0 ? int(v) : float(v);
        }
      }
    }
    if (op === "+" && typeof a === "string" && typeof b === "string") return a + b;
    if (op === "+" && a && b && typeof a === "object" && typeof b === "object" && a.k === "list" && b.k === "list") return list([...a.items, ...b.items]);
    if (op === "*") {
      const [s, n] = typeof a === "string" || (a && typeof a === "object" && a.k === "list") ? [a, b] : [b, a];
      if (isIntLike(n) && typeof s === "string") return s.repeat(Math.max(0, numVal(n)));
      if (isIntLike(n) && s && typeof s === "object" && s.k === "list") return list(Array.from({ length: Math.max(0, numVal(n)) }, () => s.items).flat());
    }
    if (op === "+" && (typeof a === "string" || typeof b === "string"))
      throw err("TypeError", `can only concatenate str (not "${typeName(typeof a === "string" ? b : a)}") to str`, "Không thể cộng xâu với số. Hãy đổi số thành xâu bằng str(), hoặc dùng dấu phẩy trong print().");
    throw err("TypeError", `unsupported operand type(s) for ${op}: '${typeName(a)}' and '${typeName(b)}'`, `Không thể dùng phép ${op} giữa ${typeName(a)} và ${typeName(b)}. Có thể em quên đổi dữ liệu nhập bằng int() hoặc float().`);
  }

  function compareVals(a: PyValue, b: PyValue, op: string): boolean {
    if (op === "==") return pyEquals(a, b);
    if (op === "!=") return !pyEquals(a, b);
    if (op === "in" || op === "not in") {
      let r: boolean;
      if (typeof b === "string") {
        if (typeof a !== "string") throw err("TypeError", "'in <string>' requires string as left operand", "Toán tử in với xâu cần vế trái là xâu.");
        r = b.includes(a);
      } else r = iterate(b).some((x) => pyEquals(x, a));
      return op === "in" ? r : !r;
    }
    let x: number | string;
    let y: number | string;
    if (isNum(a) && isNum(b)) { x = numVal(a); y = numVal(b); }
    else if (typeof a === "string" && typeof b === "string") { x = a; y = b; }
    else throw err("TypeError", `'${op}' not supported between instances of '${typeName(a)}' and '${typeName(b)}'`, `Không thể so sánh ${typeName(a)} với ${typeName(b)}. Có thể em quên đổi dữ liệu nhập thành số bằng int().`);
    switch (op) {
      case "<": return x < y;
      case "<=": return x <= y;
      case ">": return x > y;
      case ">=": return x >= y;
    }
    return false;
  }

  // ---------- expressions ----------
  function lookup(name: string, frame: Frame): PyValue {
    if (frame.vars.has(name)) return frame.vars.get(name)!;
    if (globals.vars.has(name)) return globals.vars.get(name)!;
    if (name in builtins) return builtins[name];
    throw err("NameError", `name '${name}' is not defined`, `Biến hoặc hàm "${name}" chưa được tạo. Kiểm tra chính tả, hoặc gán giá trị cho ${name} trước khi dùng.`);
  }

  function evalExpr(e: Expr, frame: Frame): PyValue {
    tick();
    switch (e.type) {
      case "num": return e.isFloat ? float(e.value) : int(e.value);
      case "str": return e.value;
      case "fstr":
        return e.parts.map((p) => {
          if (typeof p === "string") return p;
          const v = evalExpr(p.expr, frame);
          const m = p.spec?.match(/^\.(\d+)f$/);
          return m && isNum(v) ? numVal(v).toFixed(Number(m[1])) : str(v);
        }).join("");
      case "const": return e.value;
      case "name": return lookup(e.id, frame);
      case "list": return list(e.items.map((x) => evalExpr(x, frame)));
      case "unary": {
        const v = evalExpr(e.operand, frame);
        if (!isNum(v)) throw err("TypeError", `bad operand type for unary ${e.op}: '${typeName(v)}'`, "Dấu âm chỉ dùng với số.");
        const n = e.op === "-" ? -numVal(v) : numVal(v);
        return isIntLike(v) ? int(n) : float(n);
      }
      case "not": return !truthy(evalExpr(e.operand, frame));
      case "boolop": {
        const l = evalExpr(e.left, frame);
        if (e.op === "and") return truthy(l) ? evalExpr(e.right, frame) : l;
        return truthy(l) ? l : evalExpr(e.right, frame);
      }
      case "binop": return binop(e.op, evalExpr(e.left, frame), evalExpr(e.right, frame));
      case "compare": {
        let left = evalExpr(e.left, frame);
        for (let i = 0; i < e.ops.length; i++) {
          const right = evalExpr(e.rights[i], frame);
          if (!compareVals(left, right, e.ops[i])) return false;
          left = right;
        }
        return true;
      }
      case "index": {
        const obj = evalExpr(e.obj, frame);
        const idx = evalExpr(e.index, frame);
        if (!isIntLike(idx)) throw err("TypeError", "indices must be integers", "Chỉ số phải là số nguyên.");
        const seq = typeof obj === "string" ? [...obj] : obj && typeof obj === "object" && obj.k === "list" ? obj.items : null;
        if (!seq) throw err("TypeError", `'${typeName(obj)}' object is not subscriptable`, "Chỉ lấy phần tử theo chỉ số được với xâu hoặc danh sách.");
        let i = numVal(idx);
        if (i < 0) i += seq.length;
        if (i < 0 || i >= seq.length) throw err("IndexError", `${typeof obj === "string" ? "string" : "list"} index out of range`, `Chỉ số ${numVal(idx)} nằm ngoài phạm vi (độ dài là ${seq.length}, chỉ số từ 0 đến ${seq.length - 1}).`);
        return seq[i];
      }
      case "slice": {
        const obj = evalExpr(e.obj, frame);
        const len = typeof obj === "string" ? obj.length : obj && typeof obj === "object" && obj.k === "list" ? obj.items.length : -1;
        if (len < 0) throw err("TypeError", "object is not subscriptable", "Chỉ cắt được xâu hoặc danh sách.");
        const norm = (x: Expr | undefined, d: number) => {
          if (!x) return d;
          const v = evalExpr(x, frame);
          if (!isIntLike(v)) throw err("TypeError", "slice indices must be integers", "Chỉ số cắt phải là số nguyên.");
          let n = numVal(v);
          if (n < 0) n += len;
          return Math.max(0, Math.min(len, n));
        };
        const lo = norm(e.lo, 0);
        const hi = norm(e.hi, len);
        return typeof obj === "string" ? obj.slice(lo, hi) : list((obj as PyList).items.slice(lo, hi));
      }
      case "call": {
        const fn = evalExpr(e.func, frame);
        const args = e.args.map((a) => evalExpr(a, frame));
        const kwargs = Object.fromEntries(Object.entries(e.kwargs).map(([k, v]) => [k, evalExpr(v, frame)]));
        return callValue(fn, args, kwargs, frame, e.func.type === "name" ? e.func.id : "hàm");
      }
      case "method": return callMethod(evalExpr(e.obj, frame), e.name, e.args.map((a) => evalExpr(a, frame)));
    }
  }

  function callMethod(obj: PyValue, name: string, args: PyValue[]): PyValue {
    if (obj && typeof obj === "object" && obj.k === "list") {
      const it = obj.items;
      switch (name) {
        case "append": it.push(args[0]); return null;
        case "insert": it.splice(numVal(args[0] as never), 0, args[1]); return null;
        case "pop": {
          if (!it.length) throw err("IndexError", "pop from empty list", "Danh sách đang rỗng, không thể lấy phần tử.");
          const i = args[0] === undefined ? it.length - 1 : numVal(args[0] as never);
          return it.splice(i < 0 ? i + it.length : i, 1)[0];
        }
        case "remove": {
          const i = it.findIndex((x) => pyEquals(x, args[0]));
          if (i < 0) throw err("ValueError", "list.remove(x): x not in list", "Giá trị cần xóa không có trong danh sách.");
          it.splice(i, 1);
          return null;
        }
        case "index": {
          const i = it.findIndex((x) => pyEquals(x, args[0]));
          if (i < 0) throw err("ValueError", `${repr(args[0])} is not in list`, "Giá trị không có trong danh sách.");
          return int(i);
        }
        case "count": return int(it.filter((x) => pyEquals(x, args[0])).length);
        case "sort": it.sort((a, b) => (compareVals(a, b, "<") ? -1 : compareVals(b, a, "<") ? 1 : 0)); return null;
        case "reverse": it.reverse(); return null;
      }
    }
    if (typeof obj === "string") {
      switch (name) {
        case "upper": return obj.toUpperCase();
        case "lower": return obj.toLowerCase();
        case "strip": return obj.trim();
        case "title": return obj.replace(/\S+/g, (w) => w[0].toUpperCase() + w.slice(1).toLowerCase());
        case "split": return list((args[0] === undefined ? obj.trim().split(/\s+/).filter(Boolean) : obj.split(str(args[0]))));
        case "replace": return obj.split(str(args[0])).join(str(args[1]));
        case "startswith": return obj.startsWith(str(args[0]));
        case "endswith": return obj.endsWith(str(args[0]));
        case "find": return int(obj.indexOf(str(args[0])));
        case "count": return int(obj.split(str(args[0])).length - 1);
        case "isdigit": return obj.length > 0 && /^\d+$/.test(obj);
        case "join": return iterate(args[0]).map((x) => { if (typeof x !== "string") throw err("TypeError", "sequence item: expected str instance", "join() cần danh sách các xâu."); return x; }).join(obj);
      }
    }
    throw err("AttributeError", `'${typeName(obj)}' object has no attribute '${name}'`, `Kiểu ${typeName(obj)} không có phương thức ${name}().`);
  }

  function callValue(fn: PyValue, args: PyValue[], kwargs: Record<string, PyValue>, frame: Frame, label: string): PyValue {
    if (fn && typeof fn === "object" && fn.k === "builtin") return fn.fn(args, kwargs, curLine);
    if (fn && typeof fn === "object" && fn.k === "func") return callFunc(fn, args, frame);
    throw err("TypeError", `'${typeName(fn)}' object is not callable`, `"${label}" không phải là hàm nên không thể gọi bằng dấu ngoặc ().`);
  }

  function callFunc(fn: PyFunc, args: PyValue[], caller: Frame): PyValue {
    if (args.length !== fn.params.length)
      throw err("TypeError", `${fn.name}() takes ${fn.params.length} positional arguments but ${args.length} were given`, `Hàm ${fn.name} cần ${fn.params.length} đối số nhưng được truyền ${args.length}.`);
    if (++callDepth > 200) throw err("RecursionError", "maximum recursion depth exceeded", "Hàm gọi lại chính nó quá nhiều lần.");
    const frame: Frame = { name: fn.name, vars: new Map(fn.params.map((p, i) => [p, args[i]])) };
    const saved = curLine;
    record(frame, saved, `Gọi hàm ${fn.name}(${args.map(repr).join(", ")})`);
    try {
      execBlock(fn.body, frame);
      return null;
    } catch (s) {
      if (s instanceof ReturnSig) return s.value;
      throw s;
    } finally {
      callDepth--;
      curLine = saved;
      void caller;
    }
  }

  // ---------- mô tả điều kiện cho trực quan hóa ----------
  function text(e: Expr): string {
    switch (e.type) {
      case "num": return String(e.value) + (e.isFloat && Number.isInteger(e.value) ? ".0" : "");
      case "str": return repr(e.value);
      case "fstr": return "f\"…\"";
      case "const": return e.value === null ? "None" : e.value ? "True" : "False";
      case "name": return e.id;
      case "list": return `[${e.items.map(text).join(", ")}]`;
      case "unary": return `${e.op}${text(e.operand)}`;
      case "not": return `not ${text(e.operand)}`;
      case "binop": return `${text(e.left)} ${e.op} ${text(e.right)}`;
      case "boolop": return `${text(e.left)} ${e.op} ${text(e.right)}`;
      case "compare": return [text(e.left), ...e.ops.flatMap((o, i) => [o, text(e.rights[i])])].join(" ");
      case "call": return `${text(e.func)}(${e.args.map(text).join(", ")})`;
      case "method": return `${text(e.obj)}.${e.name}(…)`;
      case "index": return `${text(e.obj)}[${text(e.index)}]`;
      case "slice": return `${text(e.obj)}[…]`;
    }
  }
  /** "a > b" → "8 > 12" (thay giá trị biến cho phép so sánh đơn giản) */
  function substituted(e: Expr, frame: Frame): string | null {
    const val = (x: Expr) => {
      try { return repr(evalQuiet(x, frame)); } catch { return text(x); }
    };
    if (e.type === "compare") return [val(e.left), ...e.ops.flatMap((o, i) => [o, val(e.rights[i])])].join(" ");
    if (e.type === "boolop") {
      const l = substituted(e.left, frame) ?? val(e.left);
      const r = substituted(e.right, frame) ?? val(e.right);
      return `(${l}) ${e.op} (${r})`;
    }
    if (e.type === "not") return `not (${substituted(e.operand, frame) ?? val(e.operand)})`;
    return null;
  }
  function evalQuiet(e: Expr, frame: Frame): PyValue {
    // đánh giá lại các biểu thức đơn giản (không gọi hàm) để hiển thị
    if (e.type === "call" || e.type === "method") throw new Error("skip");
    return evalExpr(e, frame);
  }
  const condNote = (label: string, e: Expr, v: PyValue, frame: Frame) => {
    const sub = substituted(e, frame);
    return `${label} ${text(e)}${sub && sub !== text(e) ? ` → ${sub}` : ""} → ${truthy(v) ? "True" : "False"}`;
  };

  // ---------- statements ----------
  function assignTo(target: Expr, value: PyValue, frame: Frame) {
    if (target.type === "name") frame.vars.set(target.id, value);
    else if (target.type === "index") {
      const obj = evalExpr(target.obj, frame);
      const idx = evalExpr(target.index, frame);
      if (!(obj && typeof obj === "object" && obj.k === "list")) throw err("TypeError", `'${typeName(obj)}' object does not support item assignment`, "Chỉ gán theo chỉ số được với danh sách (xâu không thay đổi được).");
      if (!isIntLike(idx)) throw err("TypeError", "list indices must be integers", "Chỉ số phải là số nguyên.");
      let i = numVal(idx);
      if (i < 0) i += obj.items.length;
      if (i < 0 || i >= obj.items.length) throw err("IndexError", "list assignment index out of range", "Chỉ số nằm ngoài danh sách.");
      obj.items[i] = value;
    }
  }

  function execBlock(body: Stmt[], frame: Frame) {
    for (const s of body) exec(s, frame);
  }

  function exec(s: Stmt, frame: Frame) {
    tick();
    curLine = s.line;
    switch (s.type) {
      case "expr": {
        const before = output.length;
        const v = evalExpr(s.expr, frame);
        const printed = output.slice(before).join("").replace(/\n$/, "");
        const isCall = s.expr.type === "call" || s.expr.type === "method";
        record(frame, s.line, printed ? `In ra: ${printed}` : isCall ? `Thực hiện ${text(s.expr)}` : `Tính ${text(s.expr)} = ${repr(v)}`);
        return;
      }
      case "assign": {
        let value = evalExpr(s.value, frame);
        if (s.op !== "=") {
          const cur = evalExpr(s.target, frame);
          value = binop(s.op.slice(0, -1), cur, value);
        }
        assignTo(s.target, value, frame);
        record(frame, s.line, `Gán ${text(s.target)} = ${repr(value)}`);
        return;
      }
      case "if": {
        for (const br of s.branches) {
          curLine = br.line;
          const v = evalExpr(br.cond, frame);
          const label = br === s.branches[0] ? "Kiểm tra if" : "Kiểm tra elif";
          if (truthy(v)) {
            record(frame, br.line, `${condNote(label, br.cond, v, frame)} → thực hiện khối lệnh bên trong`, "taken");
            execBlock(br.body, frame);
            return;
          }
          record(frame, br.line, `${condNote(label, br.cond, v, frame)} → bỏ qua khối lệnh này`, "skipped");
        }
        if (s.orelse) {
          curLine = s.orelse.line;
          record(frame, s.orelse.line, "Các điều kiện phía trên đều sai → thực hiện nhánh else", "taken");
          execBlock(s.orelse.body, frame);
        }
        return;
      }
      case "while": {
        for (;;) {
          curLine = s.line;
          const v = evalExpr(s.cond, frame);
          if (!truthy(v)) {
            record(frame, s.line, `${condNote("Điều kiện lặp", s.cond, v, frame)} → kết thúc vòng lặp`, "skipped");
            return;
          }
          record(frame, s.line, `${condNote("Điều kiện lặp", s.cond, v, frame)} → lặp tiếp`, "taken");
          try {
            execBlock(s.body, frame);
          } catch (sig) {
            if (sig instanceof BreakSig) { record(frame, s.line, "break → thoát vòng lặp"); return; }
            if (!(sig instanceof ContinueSig)) throw sig;
          }
        }
      }
      case "for": {
        const items = iterate(evalExpr(s.iter, frame));
        for (const it of items) {
          curLine = s.line;
          frame.vars.set(s.target, it);
          record(frame, s.line, `Vòng lặp for: ${s.target} = ${repr(it)}`, "taken");
          try {
            execBlock(s.body, frame);
          } catch (sig) {
            if (sig instanceof BreakSig) { record(frame, s.line, "break → thoát vòng lặp"); return; }
            if (!(sig instanceof ContinueSig)) throw sig;
          }
        }
        record(frame, s.line, `Hết các giá trị → kết thúc vòng lặp for`, "skipped");
        return;
      }
      case "break":
        throw new BreakSig();
      case "continue":
        throw new ContinueSig();
      case "pass":
        return;
      case "def":
        frame.vars.set(s.name, { k: "func", name: s.name, params: s.params, body: s.body });
        record(frame, s.line, `Định nghĩa hàm ${s.name}(${s.params.join(", ")})`);
        return;
      case "return": {
        if (frame === globals) throw err("SyntaxError", "'return' outside function", "return chỉ dùng bên trong hàm (def).");
        const v = s.value ? evalExpr(s.value, frame) : null;
        record(frame, s.line, `Trả về ${repr(v)}`);
        throw new ReturnSig(v);
      }
    }
  }

  try {
    const program = parse(source);
    execBlock(program, globals);
    return { ok: true, output: output.join(""), trace, traceTruncated, events, steps };
  } catch (e) {
    if (e instanceof PyError) {
      return { ok: false, output: output.join(""), error: { type: e.pyType, message: e.message, line: e.line, explain: e.explain }, trace, traceTruncated, events, steps };
    }
    if (e instanceof BreakSig || e instanceof ContinueSig)
      return { ok: false, output: output.join(""), error: { type: "SyntaxError", message: "'break' outside loop", line: curLine, explain: "break/continue chỉ dùng bên trong vòng lặp." }, trace, traceTruncated, events, steps };
    if (e instanceof RangeError)
      return { ok: false, output: output.join(""), error: { type: "RecursionError", message: "maximum recursion depth exceeded", line: curLine, explain: "Chương trình gọi hàm lồng nhau quá sâu." }, trace, traceTruncated, events, steps };
    throw e;
  }
}

/** So sánh đầu ra như các hệ thống chấm bài: bỏ khoảng trắng cuối dòng và dòng trống cuối. */
export function normalizeOutput(s: string): string {
  return s.replace(/\r/g, "").split("\n").map((l) => l.trimEnd()).join("\n").replace(/\n+$/, "");
}
