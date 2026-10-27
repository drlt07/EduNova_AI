/**
 * Parser biểu thức logic an toàn (cú pháp giống Python) cho các lab rẽ nhánh.
 * KHÔNG dùng eval/Function. Chỉ hỗ trợ: số, True/False, định danh trong whitelist,
 * so sánh (< <= > >= == !=), and/or/not, ngoặc đơn.
 */

export type Value = number | boolean;

export type Node =
  | { kind: "num"; value: number }
  | { kind: "bool"; value: boolean }
  | { kind: "ident"; name: string }
  | { kind: "not"; operand: Node }
  | { kind: "logic"; op: "and" | "or"; left: Node; right: Node }
  | { kind: "cmp"; op: CmpOp; left: Node; right: Node };

export type CmpOp = "<" | "<=" | ">" | ">=" | "==" | "!=";

export class ExpressionError extends Error {
  constructor(
    message: string,
    public position: number,
    public hint?: string,
  ) {
    super(message);
    this.name = "ExpressionError";
  }
}

type Token =
  | { t: "num"; v: number; p: number }
  | { t: "ident"; v: string; p: number }
  | { t: "op"; v: string; p: number }
  | { t: "lparen"; p: number }
  | { t: "rparen"; p: number }
  | { t: "eof"; p: number };

export const MAX_EXPRESSION_LENGTH = 200;
const MAX_DEPTH = 20;

function tokenize(src: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (c === " " || c === "\t") {
      i++;
      continue;
    }
    if (/[0-9]/.test(c)) {
      const start = i;
      while (i < src.length && /[0-9.]/.test(src[i])) i++;
      const raw = src.slice(start, i);
      const v = Number(raw);
      if (!Number.isFinite(v)) throw new ExpressionError(`Số không hợp lệ "${raw}"`, start);
      tokens.push({ t: "num", v, p: start });
      continue;
    }
    if (/[A-Za-z_]/.test(c)) {
      const start = i;
      while (i < src.length && /[A-Za-z0-9_]/.test(src[i])) i++;
      tokens.push({ t: "ident", v: src.slice(start, i), p: start });
      continue;
    }
    if (c === "(") {
      tokens.push({ t: "lparen", p: i++ });
      continue;
    }
    if (c === ")") {
      tokens.push({ t: "rparen", p: i++ });
      continue;
    }
    const two = src.slice(i, i + 2);
    if (["<=", ">=", "==", "!="].includes(two)) {
      tokens.push({ t: "op", v: two, p: i });
      i += 2;
      continue;
    }
    if (two === "&&" || two === "||") {
      throw new ExpressionError(`Python không dùng "${two}"`, i, two === "&&" ? 'Dùng từ khóa "and".' : 'Dùng từ khóa "or".');
    }
    if (c === "<" || c === ">") {
      tokens.push({ t: "op", v: c, p: i++ });
      continue;
    }
    if (c === "=") {
      throw new ExpressionError('Dấu "=" là phép gán, không phải so sánh', i, 'Để so sánh bằng, dùng "==".');
    }
    if (c === "!") {
      throw new ExpressionError('Python không dùng "!" để phủ định', i, 'Dùng từ khóa "not".');
    }
    throw new ExpressionError(`Ký tự không được hỗ trợ "${c}"`, i);
  }
  tokens.push({ t: "eof", p: src.length });
  return tokens;
}

export function parseExpression(source: string, allowedIdents: readonly string[]): Node {
  const src = normalizeCondition(source);
  if (src.length === 0) throw new ExpressionError("Điều kiện đang trống", 0, "Ví dụ: humidity < 40 and has_water");
  if (src.length > MAX_EXPRESSION_LENGTH) throw new ExpressionError(`Điều kiện dài quá ${MAX_EXPRESSION_LENGTH} ký tự`, MAX_EXPRESSION_LENGTH);
  const tokens = tokenize(src);
  let pos = 0;
  let depth = 0;
  const peek = () => tokens[pos];
  const next = () => tokens[pos++];
  const isWord = (tok: Token, w: string) => tok.t === "ident" && tok.v === w;

  function enter(p: number) {
    depth++;
    if (depth > MAX_DEPTH) throw new ExpressionError("Biểu thức lồng quá sâu", p);
  }

  function parseOr(): Node {
    let left = parseAnd();
    while (isWord(peek(), "or")) {
      next();
      left = { kind: "logic", op: "or", left, right: parseAnd() };
    }
    return left;
  }
  function parseAnd(): Node {
    let left = parseNot();
    while (isWord(peek(), "and")) {
      next();
      left = { kind: "logic", op: "and", left, right: parseNot() };
    }
    return left;
  }
  function parseNot(): Node {
    const tok = peek();
    if (isWord(tok, "not")) {
      next();
      enter(tok.p);
      const operand = parseNot();
      depth--;
      return { kind: "not", operand };
    }
    return parseCmp();
  }
  function parseCmp(): Node {
    const left = parsePrimary();
    const tok = peek();
    if (tok.t === "op") {
      next();
      const right = parsePrimary();
      return { kind: "cmp", op: tok.v as CmpOp, left, right };
    }
    return left;
  }
  function parsePrimary(): Node {
    const tok = next();
    switch (tok.t) {
      case "num":
        return { kind: "num", value: tok.v };
      case "lparen": {
        enter(tok.p);
        const inner = parseOr();
        depth--;
        const close = next();
        if (close.t !== "rparen") throw new ExpressionError("Thiếu dấu ngoặc đóng )", close.p);
        return inner;
      }
      case "ident": {
        if (tok.v === "True") return { kind: "bool", value: true };
        if (tok.v === "False") return { kind: "bool", value: false };
        if (tok.v === "true" || tok.v === "false")
          throw new ExpressionError(`"${tok.v}" chưa đúng chính tả Python`, tok.p, 'Python viết hoa: True / False.');
        if (["and", "or", "not"].includes(tok.v)) throw new ExpressionError(`Thiếu toán hạng trước "${tok.v}"`, tok.p);
        if (!allowedIdents.includes(tok.v))
          throw new ExpressionError(`Biến "${tok.v}" không tồn tại trong bài`, tok.p, `Các biến có sẵn: ${allowedIdents.join(", ")}.`);
        return { kind: "ident", name: tok.v };
      }
      case "eof":
        throw new ExpressionError("Điều kiện kết thúc đột ngột", tok.p);
      default:
        throw new ExpressionError("Cú pháp không hợp lệ", tok.p);
    }
  }

  const ast = parseOr();
  const rest = peek();
  if (rest.t !== "eof") {
    throw new ExpressionError("Có phần thừa sau điều kiện", rest.p, "Kiểm tra lại toán tử and / or giữa các vế.");
  }
  return ast;
}

/** Cho phép học sinh gõ cả dòng `if ...:` — tách lấy điều kiện. */
export function normalizeCondition(source: string): string {
  let s = source.trim();
  if (s.startsWith("if ")) s = s.slice(3);
  if (s.endsWith(":")) s = s.slice(0, -1);
  return s.trim();
}

export type Env = Record<string, Value>;

export interface TraceStep {
  text: string;
  value: Value;
}

export function evaluate(node: Node, env: Env, trace?: TraceStep[]): Value {
  switch (node.kind) {
    case "num":
    case "bool":
      return node.value;
    case "ident": {
      const v = env[node.name];
      if (v === undefined) throw new ExpressionError(`Thiếu giá trị cho "${node.name}"`, 0);
      return v;
    }
    case "not": {
      const v = truthy(evaluate(node.operand, env, trace));
      trace?.push({ text: `not ${toText(node.operand)}`, value: !v });
      return !v;
    }
    case "logic": {
      const l = truthy(evaluate(node.left, env, trace));
      // đánh giá ngắn mạch giống Python
      if (node.op === "and" && !l) {
        trace?.push({ text: `${toText(node)} (dừng sớm vì vế trái False)`, value: false });
        return false;
      }
      if (node.op === "or" && l) {
        trace?.push({ text: `${toText(node)} (dừng sớm vì vế trái True)`, value: true });
        return true;
      }
      const r = truthy(evaluate(node.right, env, trace));
      trace?.push({ text: toText(node), value: r });
      return r;
    }
    case "cmp": {
      const l = evaluate(node.left, env, trace);
      const r = evaluate(node.right, env, trace);
      const a = typeof l === "boolean" ? Number(l) : l;
      const b = typeof r === "boolean" ? Number(r) : r;
      let out: boolean;
      switch (node.op) {
        case "<": out = a < b; break;
        case "<=": out = a <= b; break;
        case ">": out = a > b; break;
        case ">=": out = a >= b; break;
        case "==": out = a === b; break;
        case "!=": out = a !== b; break;
      }
      trace?.push({ text: `${toText(node)} → ${fmt(l)} ${node.op} ${fmt(r)}`, value: out });
      return out;
    }
  }
}

function truthy(v: Value): boolean {
  return typeof v === "boolean" ? v : v !== 0;
}

function fmt(v: Value): string {
  return typeof v === "boolean" ? (v ? "True" : "False") : String(v);
}

export function toText(node: Node): string {
  switch (node.kind) {
    case "num": return String(node.value);
    case "bool": return node.value ? "True" : "False";
    case "ident": return node.name;
    case "not": return `not ${wrap(node.operand)}`;
    case "logic": return `${wrap(node.left)} ${node.op} ${wrap(node.right)}`;
    case "cmp": return `${toText(node.left)} ${node.op} ${toText(node.right)}`;
  }
}

function wrap(node: Node): string {
  return node.kind === "logic" ? `(${toText(node)})` : toText(node);
}
