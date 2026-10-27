import type { Expr, Stmt } from "./ast";
import { PyError, syntaxError } from "./errors";
import { tokenize, type Tok } from "./tokenizer";

const KEYWORDS = new Set(["if", "elif", "else", "while", "for", "in", "def", "return", "break", "continue", "pass", "and", "or", "not", "True", "False", "None", "is", "import", "from", "class", "lambda", "try", "except", "with", "global"]);
const UNSUPPORTED = new Set(["import", "from", "class", "lambda", "try", "except", "with", "global"]);
const CMP = new Set(["<", "<=", ">", ">=", "==", "!="]);
const AUG = new Set(["=", "+=", "-=", "*=", "/=", "//=", "%=", "**="]);

export function parse(src: string): Stmt[] {
  const toks = tokenize(src);
  let p = 0;
  const peek = (o = 0) => toks[p + o];
  const next = () => toks[p++];
  const isOp = (v: string, o = 0) => peek(o).t === "op" && peek(o).v === v;
  const isKw = (v: string, o = 0) => peek(o).t === "name" && peek(o).v === v;
  const expectOp = (v: string, explain: string) => {
    const t = next();
    if (t.t !== "op" || t.v !== v) throw syntaxError(t.line, `expected '${v}'`, explain);
    return t;
  };

  function block(): Stmt[] {
    // thân lệnh: cùng dòng (if x: print(1)) hoặc khối thụt lề
    if (peek().t !== "newline") {
      const s = simpleStmt();
      endLine();
      return [s];
    }
    next();
    if (peek().t !== "indent") throw new PyError("IndentationError", "expected an indented block", peek().line, "Sau dấu hai chấm cần có các lệnh được thụt lề vào trong.");
    next();
    const body: Stmt[] = [];
    while (peek().t !== "dedent" && peek().t !== "eof") body.push(statement());
    if (peek().t === "dedent") next();
    return body;
  }

  function endLine() {
    const t = peek();
    if (t.t === "newline") return void next();
    if (t.t === "eof" || t.t === "dedent") return;
    throw syntaxError(t.line, "invalid syntax", explainUnexpected(t));
  }

  function colon(line: number) {
    if (isOp("=")) throw syntaxError(line, "invalid syntax. Maybe you meant '==' instead of '='?", 'Dấu "=" là phép gán. Để so sánh bằng trong điều kiện, hãy dùng "==".');
    if (!isOp(":")) throw syntaxError(line, "expected ':'", "Thiếu dấu hai chấm ':' ở cuối dòng.");
    next();
  }

  function statement(): Stmt {
    const t = peek();
    if (t.t === "indent") throw new PyError("IndentationError", "unexpected indent", t.line, "Dòng này bị thụt lề thừa. Chỉ thụt lề cho các lệnh nằm trong if, for, while, def.");
    if (t.t === "name" && UNSUPPORTED.has(t.v)) throw syntaxError(t.line, `'${t.v}' is not supported`, `Trình chạy thu gọn chưa hỗ trợ "${t.v}". Hãy dùng các lệnh cơ bản của chương trình Tin học.`);
    if (t.t === "name") {
      if (t.v === "if") {
        next();
        const branches: { cond: Expr; body: Stmt[]; line: number }[] = [];
        const cond = expr();
        colon(t.line);
        branches.push({ cond, body: block(), line: t.line });
        let orelse: { body: Stmt[]; line: number } | undefined;
        while (isKw("elif")) {
          const lt = next();
          const c = expr();
          colon(lt.line);
          branches.push({ cond: c, body: block(), line: lt.line });
        }
        if (isKw("else")) {
          const et = next();
          colon(et.line);
          orelse = { body: block(), line: et.line };
        }
        return { type: "if", branches, orelse, line: t.line };
      }
      if (t.v === "elif" || t.v === "else") throw syntaxError(t.line, "invalid syntax", `"${t.v}" phải đi ngay sau khối lệnh if (cùng mức thụt lề với if).`);
      if (t.v === "while") {
        next();
        const cond = expr();
        colon(t.line);
        return { type: "while", cond, body: block(), line: t.line };
      }
      if (t.v === "for") {
        next();
        const target = next();
        if (target.t !== "name" || KEYWORDS.has(target.v)) throw syntaxError(t.line, "invalid syntax", "Sau for cần một tên biến, ví dụ: for i in range(5):");
        if (!isKw("in")) throw syntaxError(t.line, "invalid syntax", "Thiếu từ khóa in: for i in range(5):");
        next();
        const iter = expr();
        colon(t.line);
        return { type: "for", target: target.v, iter, body: block(), line: t.line };
      }
      if (t.v === "def") {
        next();
        const name = next();
        if (name.t !== "name") throw syntaxError(t.line, "invalid syntax", "Sau def cần tên hàm.");
        expectOp("(", "Thiếu dấu ngoặc mở sau tên hàm.");
        const params: string[] = [];
        while (!isOp(")")) {
          const pn = next();
          if (pn.t !== "name") throw syntaxError(t.line, "invalid syntax", "Tham số của hàm phải là tên biến.");
          params.push(pn.v);
          if (isOp(",")) next();
        }
        next();
        colon(t.line);
        return { type: "def", name: name.v, params, body: block(), line: t.line };
      }
    }
    const s = simpleStmt();
    endLine();
    return s;
  }

  function simpleStmt(): Stmt {
    const t = peek();
    if (t.t === "name") {
      if (t.v === "pass" || t.v === "break" || t.v === "continue") {
        next();
        return { type: t.v, line: t.line };
      }
      if (t.v === "return") {
        next();
        const value = peek().t === "newline" || peek().t === "eof" ? undefined : expr();
        return { type: "return", value, line: t.line };
      }
    }
    const e = expr();
    if (peek().t === "op" && AUG.has(peek().v)) {
      const op = next().v;
      if (e.type !== "name" && e.type !== "index") throw syntaxError(t.line, "cannot assign to expression", "Vế trái của phép gán phải là tên biến (hoặc phần tử danh sách).");
      return { type: "assign", target: e, op, value: expr(), line: t.line };
    }
    return { type: "expr", expr: e, line: t.line };
  }

  function expr(): Expr {
    return orExpr();
  }
  function orExpr(): Expr {
    let l = andExpr();
    while (isKw("or")) {
      const t = next();
      l = { type: "boolop", op: "or", left: l, right: andExpr(), line: t.line };
    }
    return l;
  }
  function andExpr(): Expr {
    let l = notExpr();
    while (isKw("and")) {
      const t = next();
      l = { type: "boolop", op: "and", left: l, right: notExpr(), line: t.line };
    }
    return l;
  }
  function notExpr(): Expr {
    if (isKw("not")) {
      const t = next();
      return { type: "not", operand: notExpr(), line: t.line };
    }
    return compare();
  }
  function compare(): Expr {
    const left = arith();
    const ops: string[] = [];
    const rights: Expr[] = [];
    for (;;) {
      const t = peek();
      if (t.t === "op" && CMP.has(t.v)) ops.push(next().v);
      else if (isKw("in")) { next(); ops.push("in"); }
      else if (isKw("not") && isKw("in", 1)) { next(); next(); ops.push("not in"); }
      else if (isKw("is")) { next(); if (isKw("not")) { next(); ops.push("!="); } else ops.push("=="); }
      else break;
      rights.push(arith());
    }
    return ops.length ? { type: "compare", left, ops, rights, line: left.line } : left;
  }
  function arith(): Expr {
    let l = term();
    while (isOp("+") || isOp("-")) {
      const t = next();
      l = { type: "binop", op: t.v, left: l, right: term(), line: t.line };
    }
    return l;
  }
  function term(): Expr {
    let l = unary();
    while (isOp("*") || isOp("/") || isOp("//") || isOp("%")) {
      const t = next();
      l = { type: "binop", op: t.v, left: l, right: unary(), line: t.line };
    }
    return l;
  }
  function unary(): Expr {
    if (isOp("-") || isOp("+")) {
      const t = next();
      return { type: "unary", op: t.v as "-" | "+", operand: unary(), line: t.line };
    }
    return power();
  }
  function power(): Expr {
    const base = postfix();
    if (isOp("**")) {
      const t = next();
      return { type: "binop", op: "**", left: base, right: unary(), line: t.line };
    }
    return base;
  }
  function postfix(): Expr {
    let e = atom();
    for (;;) {
      if (isOp("(")) {
        const t = next();
        const args: Expr[] = [];
        const kwargs: Record<string, Expr> = {};
        while (!isOp(")")) {
          if (peek().t === "eof" || peek().t === "newline") throw syntaxError(t.line, "'(' was never closed", "Thiếu dấu ngoặc đóng ')'.");
          if (peek().t === "name" && isOp("=", 1)) {
            const k = next().v;
            next();
            kwargs[k] = expr();
          } else args.push(expr());
          if (isOp(",")) next();
          else if (!isOp(")")) throw syntaxError(peek().line, "invalid syntax", "Các đối số cần được ngăn cách bằng dấu phẩy.");
        }
        next();
        e = { type: "call", func: e, args, kwargs, line: t.line };
      } else if (isOp("[")) {
        const t = next();
        let lo: Expr | undefined;
        let hi: Expr | undefined;
        if (!isOp(":")) lo = expr();
        if (isOp(":")) {
          next();
          if (!isOp("]")) hi = expr();
          expectOp("]", "Thiếu dấu ngoặc vuông đóng ']'.");
          e = { type: "slice", obj: e, lo, hi, line: t.line };
        } else {
          expectOp("]", "Thiếu dấu ngoặc vuông đóng ']'.");
          e = { type: "index", obj: e, index: lo!, line: t.line };
        }
      } else if (isOp(".")) {
        const t = next();
        const name = next();
        if (name.t !== "name") throw syntaxError(t.line, "invalid syntax", "Sau dấu chấm cần tên phương thức.");
        expectOp("(", `Hãy gọi phương thức có ngoặc: .${name.v}()`);
        const args: Expr[] = [];
        while (!isOp(")")) {
          args.push(expr());
          if (isOp(",")) next();
          else if (!isOp(")")) throw syntaxError(peek().line, "invalid syntax", "Thiếu dấu ngoặc đóng ')'.");
        }
        next();
        e = { type: "method", obj: e, name: name.v, args, line: t.line };
      } else break;
    }
    return e;
  }
  function atom(): Expr {
    const t = next();
    switch (t.t) {
      case "num": {
        const isFloat = /[.eE]/.test(t.v);
        const value = Number(t.v);
        if (!Number.isFinite(value)) throw syntaxError(t.line, "invalid decimal literal", `Số "${t.v}" không hợp lệ.`);
        return { type: "num", value, isFloat, line: t.line };
      }
      case "str":
        if (t.fstr) return { type: "fstr", parts: parseFString(t.v, t.line), line: t.line };
        // nối các xâu liền nhau "a" "b"
        {
          let v = t.v;
          while (peek().t === "str" && !(peek() as { fstr?: boolean }).fstr) v += next().v;
          return { type: "str", value: v, line: t.line };
        }
      case "name":
        if (t.v === "True" || t.v === "False") return { type: "const", value: t.v === "True", line: t.line };
        if (t.v === "None") return { type: "const", value: null, line: t.line };
        if (KEYWORDS.has(t.v)) throw syntaxError(t.line, "invalid syntax", `Không thể dùng từ khóa "${t.v}" ở vị trí này.`);
        return { type: "name", id: t.v, line: t.line };
      case "op":
        if (t.v === "(") {
          const e = expr();
          expectOp(")", "Thiếu dấu ngoặc đóng ')'.");
          return e;
        }
        if (t.v === "[") {
          const items: Expr[] = [];
          while (!isOp("]")) {
            if (peek().t === "eof") throw syntaxError(t.line, "'[' was never closed", "Thiếu dấu ngoặc vuông đóng ']'.");
            items.push(expr());
            if (isOp(",")) next();
            else if (!isOp("]")) throw syntaxError(peek().line, "invalid syntax", "Các phần tử danh sách cần ngăn cách bằng dấu phẩy.");
          }
          next();
          return { type: "list", items, line: t.line };
        }
        if (t.v === "=") throw syntaxError(t.line, "invalid syntax", 'Dấu "=" là phép gán. Để so sánh bằng, hãy dùng "==".');
        throw syntaxError(t.line, "invalid syntax", explainUnexpected(t));
      default:
        throw syntaxError(t.line, "invalid syntax", t.t === "newline" || t.t === "eof" ? "Câu lệnh chưa viết xong." : "Cú pháp chưa đúng.");
    }
  }

  const body: Stmt[] = [];
  while (peek().t !== "eof") {
    if (peek().t === "newline") { next(); continue; }
    body.push(statement());
  }
  return body;
}

function explainUnexpected(t: Tok): string {
  if (t.t === "op" && t.v === "=") return 'Dấu "=" là phép gán. Để so sánh bằng, hãy dùng "==".';
  if (t.t === "op" && t.v === ":") return "Dấu hai chấm chỉ dùng ở cuối dòng if, elif, else, for, while, def.";
  if (t.t === "name") return `Thiếu toán tử hoặc dấu phẩy trước "${t.v}". Kiểm tra lại cách viết câu lệnh.`;
  return "Cú pháp chưa đúng. Kiểm tra dấu ngoặc, dấu hai chấm và dấu phẩy.";
}

function parseFString(s: string, line: number): (string | { expr: Expr; spec?: string })[] {
  const parts: (string | { expr: Expr; spec?: string })[] = [];
  let buf = "";
  for (let i = 0; i < s.length; i++) {
    if (s[i] === "{" && s[i + 1] === "{") { buf += "{"; i++; continue; }
    if (s[i] === "}" && s[i + 1] === "}") { buf += "}"; i++; continue; }
    if (s[i] === "{") {
      const end = s.indexOf("}", i);
      if (end < 0) throw syntaxError(line, "f-string: expecting '}'", "Thiếu dấu } trong f-string.");
      if (buf) parts.push(buf);
      buf = "";
      const inner = s.slice(i + 1, end);
      const [code, spec] = inner.split(":");
      const stmts = parse(code);
      const first = stmts[0];
      if (!first || first.type !== "expr") throw syntaxError(line, "f-string: invalid expression", "Biểu thức trong {} của f-string không hợp lệ.");
      parts.push({ expr: { ...first.expr, line } as Expr, spec });
      i = end;
    } else buf += s[i];
  }
  if (buf) parts.push(buf);
  return parts;
}
