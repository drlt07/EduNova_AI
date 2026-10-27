import { PyError, syntaxError } from "./errors";

export type Tok =
  | { t: "name" | "num" | "str" | "op"; v: string; line: number; fstr?: boolean }
  | { t: "newline" | "indent" | "dedent" | "eof"; v: string; line: number };

const KEYWORD_OPS = ["**=", "//=", "==", "!=", "<=", ">=", "+=", "-=", "*=", "/=", "%=", "**", "//"];
const SINGLE = "+-*/%<>=()[],:.{}";

export const MAX_SOURCE = 20_000;

export function tokenize(src: string): Tok[] {
  if (src.length > MAX_SOURCE) throw syntaxError(1, "source too long", `Chương trình quá dài (tối đa ${MAX_SOURCE} ký tự).`);
  const out: Tok[] = [];
  const indents = [0];
  const lines = src.replace(/\r\n?/g, "\n").split("\n");
  let depth = 0; // độ sâu ngoặc: trong ngoặc thì bỏ qua xuống dòng/thụt lề
  for (let li = 0; li < lines.length; li++) {
    const lineNo = li + 1;
    const raw = lines[li].replace(/\t/g, "    ");
    let i = 0;
    if (depth === 0) {
      const trimmed = raw.trim();
      if (trimmed === "" || trimmed.startsWith("#")) continue;
      const ind = raw.length - raw.trimStart().length;
      const top = indents[indents.length - 1];
      if (ind > top) {
        indents.push(ind);
        out.push({ t: "indent", v: "", line: lineNo });
      } else if (ind < top) {
        while (indents[indents.length - 1] > ind) {
          indents.pop();
          out.push({ t: "dedent", v: "", line: lineNo });
        }
        if (indents[indents.length - 1] !== ind)
          throw new PyError("IndentationError", "unindent does not match any outer indentation level", lineNo, "Dòng này thụt lề không khớp với các dòng phía trên. Hãy thụt lề đều nhau (thường là 4 dấu cách).");
      }
      i = ind;
    }
    while (i < raw.length) {
      const c = raw[i];
      if (c === " ") { i++; continue; }
      if (c === "#") break;
      // xâu (có thể là f-string)
      const isF = (c === "f" || c === "F") && (raw[i + 1] === '"' || raw[i + 1] === "'");
      if (c === '"' || c === "'" || isF) {
        const q = isF ? raw[i + 1] : c;
        let j = isF ? i + 2 : i + 1;
        let s = "";
        while (j < raw.length && raw[j] !== q) {
          if (raw[j] === "\\" && j + 1 < raw.length) {
            const e = raw[j + 1];
            s += e === "n" ? "\n" : e === "t" ? "\t" : e;
            j += 2;
          } else s += raw[j++];
        }
        if (j >= raw.length) throw syntaxError(lineNo, "unterminated string literal", "Xâu chưa được đóng: thiếu dấu nháy ở cuối.");
        out.push({ t: "str", v: s, line: lineNo, fstr: isF });
        i = j + 1;
        continue;
      }
      if (/[0-9]/.test(c) || (c === "." && /[0-9]/.test(raw[i + 1] ?? ""))) {
        let j = i;
        while (j < raw.length && /[0-9._eE]/.test(raw[j])) {
          if ((raw[j] === "e" || raw[j] === "E") && (raw[j + 1] === "-" || raw[j + 1] === "+")) j++;
          j++;
        }
        out.push({ t: "num", v: raw.slice(i, j).replace(/_/g, ""), line: lineNo });
        i = j;
        continue;
      }
      if (/[A-Za-z_À-ỹ]/.test(c)) {
        let j = i;
        while (j < raw.length && /[A-Za-z0-9_À-ỹ]/.test(raw[j])) j++;
        out.push({ t: "name", v: raw.slice(i, j), line: lineNo });
        i = j;
        continue;
      }
      const three = raw.slice(i, i + 3);
      const two = raw.slice(i, i + 2);
      const op = KEYWORD_OPS.find((o) => o === three) ?? KEYWORD_OPS.find((o) => o === two);
      if (op) {
        out.push({ t: "op", v: op, line: lineNo });
        i += op.length;
        continue;
      }
      if (two === "&&" || two === "||") throw syntaxError(lineNo, "invalid syntax", two === "&&" ? 'Python dùng từ khóa "and" thay cho &&.' : 'Python dùng từ khóa "or" thay cho ||.');
      if (c === "!") throw syntaxError(lineNo, "invalid syntax", 'Python dùng "not" để phủ định, và "!=" để so sánh khác.');
      if (SINGLE.includes(c)) {
        if (c === "(" || c === "[" || c === "{") depth++;
        if (c === ")" || c === "]" || c === "}") depth = Math.max(0, depth - 1);
        out.push({ t: "op", v: c, line: lineNo });
        i++;
        continue;
      }
      throw syntaxError(lineNo, `invalid character '${c}'`, `Ký tự "${c}" không hợp lệ trong Python.`);
    }
    if (depth === 0) out.push({ t: "newline", v: "", line: lineNo });
  }
  const last = lines.length;
  while (indents.length > 1) {
    indents.pop();
    out.push({ t: "dedent", v: "", line: last });
  }
  out.push({ t: "eof", v: "", line: last });
  return out;
}
