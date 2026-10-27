/**
 * Đọc biểu thức hàm số một biến x (dạng viết tay "x^3 - 3x + 1", "(2x+1)/(x-1)", hoặc LaTeX "\frac{2x+1}{x-1}")
 * thành cây biểu thức để tính giá trị. Không dùng eval. Biểu thức không đọc được thì báo lỗi, không đoán.
 */

export type Nut =
  | { k: "so"; v: number }
  | { k: "x" }
  | { k: "op"; op: "+" | "-" | "*" | "/" | "^"; a: Nut; b: Nut }
  | { k: "am"; a: Nut }
  | { k: "ham"; ten: TenHam; a: Nut };

const HAM = ["sqrt", "cbrt", "sin", "cos", "tan", "cot", "exp", "ln", "log", "abs"] as const;
type TenHam = (typeof HAM)[number];

export class LoiBieuThuc extends Error {}

/** Đổi cách viết LaTeX và kí hiệu Unicode thường gặp sang cú pháp thường. */
export function chuanHoaBieuThuc(s: string): string {
  let t = s.trim()
    .replace(/^\$+|\$+$/g, "")
    .replace(/^\s*(y|f\s*\(\s*x\s*\))\s*=\s*/i, "")
    .replace(/\\left|\\right|\\,|\\;|\\!/g, "")
    .replace(/\\cdot|\\times|·|×/g, "*")
    .replace(/÷/g, "/")
    .replace(/[−–]/g, "-")
    .replace(/π|\\pi/g, "(pi)")
    .replace(/√/g, "sqrt")
    .replace(/²/g, "^2").replace(/³/g, "^3");
  // \frac{a}{b} → ((a)/(b)); \sqrt[3]{a} → cbrt(a); \sqrt{a} → sqrt(a); lặp cho ngoặc lồng nhau.
  const nhom = String.raw`\{((?:[^{}]|\{[^{}]*\})*)\}`;
  for (let i = 0; i < 6; i++) {
    t = t.replace(new RegExp(String.raw`\\[dt]?frac\s*${nhom}\s*${nhom}`, "g"), "(($1)/($2))")
      .replace(new RegExp(String.raw`\\sqrt\s*\[3\]\s*${nhom}`, "g"), "cbrt($1)")
      .replace(new RegExp(String.raw`\\sqrt\s*${nhom}`, "g"), "sqrt($1)");
  }
  t = t.replace(/\\(sin|cos|tan|cot|ln|log|exp)/g, "$1").replace(/\btg\b/g, "tan").replace(/\bcotg\b/g, "cot")
    .replace(/\{/g, "(").replace(/\}/g, ")")
    .replace(/(\d),(\d)/g, "$1.$2");
  return t.replace(/\s+/g, "");
}

type Token = { t: "so"; v: number } | { t: "ten"; v: string } | { t: "dau"; v: string };

function tachToken(s: string): Token[] {
  const kq: Token[] = [];
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (/[0-9.]/.test(c)) {
      const m = /^\d*\.?\d+(e[+-]?\d+)?/i.exec(s.slice(i))!;
      if (!m) throw new LoiBieuThuc(`Không đọc được số tại “${s.slice(i, i + 5)}”.`);
      kq.push({ t: "so", v: Number(m[0]) });
      i += m[0].length;
    } else if (/[a-z]/i.test(c)) {
      const m = /^[a-z]+/i.exec(s.slice(i))![0].toLowerCase();
      // Tách "xsin" thành "x", "sin"; "pi", "e" là hằng số.
      let j = 0;
      while (j < m.length) {
        const ham = [...HAM, "pi"].find((h) => m.startsWith(h, j));
        if (ham) { kq.push({ t: "ten", v: ham }); j += ham.length; }
        else if (m[j] === "x" || m[j] === "e") { kq.push({ t: "ten", v: m[j] }); j++; }
        else throw new LoiBieuThuc(`Không hiểu kí hiệu “${m}”.`);
      }
      i += m.length;
    } else if ("+-*/^()|".includes(c)) {
      kq.push({ t: "dau", v: c });
      i++;
    } else throw new LoiBieuThuc(`Kí tự không hợp lệ “${c}”.`);
  }
  return kq;
}

/** Đọc biểu thức → cây. Hỗ trợ nhân ngầm (2x, 3(x+1), x(x-1)), lũy thừa phải kết hợp, |x|. */
export function docBieuThuc(vao: string): Nut {
  const tk = tachToken(chuanHoaBieuThuc(vao));
  if (!tk.length) throw new LoiBieuThuc("Biểu thức rỗng.");
  let i = 0;
  const xem = () => tk[i];
  const la = (v: string) => xem()?.t === "dau" && xem()!.v === v;
  const batDauThuaSo = () => { const t = xem(); return !!t && (t.t === "so" || t.t === "ten" || (t.t === "dau" && (t.v === "(" || t.v === "|"))); };

  function tong(): Nut {
    let a = tich();
    while (la("+") || la("-")) { const op = tk[i++].v as "+" | "-"; a = { k: "op", op, a, b: tich() }; }
    return a;
  }
  function tich(): Nut {
    let a = dau();
    for (;;) {
      if (la("*") || la("/")) { const op = tk[i++].v as "*" | "/"; a = { k: "op", op, a, b: dau() }; }
      else if (batDauThuaSo() && !la("|")) a = { k: "op", op: "*", a, b: luyThua() }; // nhân ngầm
      else return a;
    }
  }
  function dau(): Nut {
    if (la("-")) { i++; return { k: "am", a: dau() }; }
    if (la("+")) { i++; return dau(); }
    return luyThua();
  }
  function luyThua(): Nut {
    const a = coBan();
    if (la("^")) { i++; return { k: "op", op: "^", a, b: dau() }; }
    return a;
  }
  function coBan(): Nut {
    const t = tk[i++];
    if (!t) throw new LoiBieuThuc("Biểu thức chưa đủ.");
    if (t.t === "so") return { k: "so", v: t.v };
    if (t.t === "dau" && t.v === "(") { const a = tong(); if (!la(")")) throw new LoiBieuThuc("Thiếu dấu “)”."); i++; return a; }
    if (t.t === "dau" && t.v === "|") { const a = tong(); if (!la("|")) throw new LoiBieuThuc("Thiếu dấu “|”."); i++; return { k: "ham", ten: "abs", a }; }
    if (t.t === "ten") {
      if (t.v === "x") return { k: "x" };
      if (t.v === "e") return { k: "so", v: Math.E };
      if (t.v === "pi") return { k: "so", v: Math.PI };
      // Hàm: sin x, sin(x), sin^2 x không hỗ trợ (báo lỗi để không hiểu sai).
      if (la("^")) throw new LoiBieuThuc(`Viết lũy thừa của hàm ${t.v} dạng (${t.v}(x))^n.`);
      return { k: "ham", ten: t.v as TenHam, a: luyThua() };
    }
    throw new LoiBieuThuc(`Không đọc được “${t.v}”.`);
  }
  const goc = tong();
  if (i < tk.length) throw new LoiBieuThuc(`Thừa “${tk.slice(i).map((t) => String(t.v)).join("")}”.`);
  return goc;
}

export function tinh(n: Nut, x: number): number {
  switch (n.k) {
    case "so": return n.v;
    case "x": return x;
    case "am": return -tinh(n.a, x);
    case "op": {
      const a = tinh(n.a, x), b = tinh(n.b, x);
      if (n.op === "+") return a + b;
      if (n.op === "-") return a - b;
      if (n.op === "*") return a * b;
      if (n.op === "/") return b === 0 ? NaN : a / b;
      // Lũy thừa: cơ số âm với số mũ phân số có mẫu lẻ (vd x^(1/3)) vẫn tính được.
      if (a < 0 && !Number.isInteger(b)) {
        const mau = Math.round(1 / Math.abs(b - Math.trunc(b)));
        return mau % 2 === 1 && Math.abs(b * mau - Math.round(b * mau)) < 1e-9 ? -Math.pow(-a, b) : NaN;
      }
      return Math.pow(a, b);
    }
    case "ham": {
      const a = tinh(n.a, x);
      switch (n.ten) {
        case "sqrt": return a < 0 ? NaN : Math.sqrt(a);
        case "cbrt": return Math.cbrt(a);
        case "sin": return Math.sin(a);
        case "cos": return Math.cos(a);
        case "tan": return Math.abs(Math.cos(a)) < 1e-12 ? NaN : Math.tan(a);
        case "cot": return Math.abs(Math.sin(a)) < 1e-12 ? NaN : Math.cos(a) / Math.sin(a);
        case "exp": return Math.exp(a);
        case "ln": return a <= 0 ? NaN : Math.log(a);
        case "log": return a <= 0 ? NaN : Math.log10(a);
        case "abs": return Math.abs(a);
      }
    }
  }
}

/** Hàm số x ↦ y từ chuỗi; giá trị không xác định trả NaN. */
export function hamSo(vao: string): (x: number) => number {
  const cay = docBieuThuc(vao);
  return (x) => { const y = tinh(cay, x); return Number.isFinite(y) ? y : NaN; };
}

/** Như hamSo nhưng giữ ±Infinity (dùng khi tính giới hạn); NaN khi không xác định. */
export function hamSoTho(vao: string): (x: number) => number {
  const cay = docBieuThuc(vao);
  return (x) => tinh(cay, x);
}

/** Giá trị số của một nhãn (vd "1-\sqrt{2}", "-\frac{1}{2}", "+\infty"); không đọc được thì NaN. */
export function giaTriNhan(nhan: string): number {
  const t = nhan.trim().replace(/^\$+|\$+$/g, "");
  if (/^\+?\s*(\\infty|∞|\+∞)$/.test(t)) return Infinity;
  if (/^-\s*(\\infty|∞)$/.test(t) || t === "−∞") return -Infinity;
  try { return hamSo(t)(0); } catch { return NaN; }
}
