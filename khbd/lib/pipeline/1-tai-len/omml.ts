/** Chuyển công thức Word (OMML, thẻ m:...) sang LaTeX. */

type Nut = Element;

const KI_HIEU: Record<string, string> = {
  "≤": "\\le ", "≥": "\\ge ", "≠": "\\ne ", "±": "\\pm ", "∓": "\\mp ", "×": "\\times ",
  "·": "\\cdot ", "⋅": "\\cdot ", "÷": "\\div ", "∞": "\\infty ", "→": "\\to ", "⇒": "\\Rightarrow ",
  "⇔": "\\Leftrightarrow ", "↔": "\\leftrightarrow ", "⇌": "\\rightleftharpoons ", "∈": "\\in ",
  "∉": "\\notin ", "⊂": "\\subset ", "⊃": "\\supset ", "⊆": "\\subseteq ", "∪": "\\cup ",
  "∩": "\\cap ", "∅": "\\varnothing ", "∀": "\\forall ", "∃": "\\exists ", "≈": "\\approx ",
  "≡": "\\equiv ", "∥": "\\parallel ", "⊥": "\\perp ", "∠": "\\angle ", "°": "^{\\circ}",
  "′": "'", "…": "\\ldots ", "⋯": "\\cdots ", "−": "-", "∗": "*", "∆": "\\Delta ",
  "ℝ": "\\mathbb{R}", "ℕ": "\\mathbb{N}", "ℤ": "\\mathbb{Z}", "ℚ": "\\mathbb{Q}", "ℂ": "\\mathbb{C}",
  "α": "\\alpha ", "β": "\\beta ", "γ": "\\gamma ", "δ": "\\delta ", "ε": "\\varepsilon ",
  "θ": "\\theta ", "λ": "\\lambda ", "μ": "\\mu ", "π": "\\pi ", "ρ": "\\rho ", "σ": "\\sigma ",
  "τ": "\\tau ", "φ": "\\varphi ", "ω": "\\omega ", "Δ": "\\Delta ", "Ω": "\\Omega ", "Σ": "\\Sigma ",
  "Φ": "\\Phi ", "Π": "\\Pi ", "Λ": "\\Lambda ", "Γ": "\\Gamma ",
  "{": "\\{", "}": "\\}", "%": "\\%", "#": "\\#", "&": "\\&", "_": "\\_",
};

const HAM = new Set(["sin", "cos", "tan", "cot", "log", "ln", "lg", "exp", "lim", "max", "min", "arcsin", "arccos", "arctan"]);

const NARY: Record<string, string> = {
  "∑": "\\sum", "∏": "\\prod", "∫": "\\int", "∬": "\\iint", "∭": "\\iiint", "∮": "\\oint",
  "⋃": "\\bigcup", "⋂": "\\bigcap",
};

const DAU_NHAN: Record<string, string> = {
  "̂": "\\hat", "^": "\\hat", "̄": "\\bar", "¯": "\\bar", "⃗": "\\vec", "→": "\\vec",
  "̇": "\\dot", "̃": "\\tilde", "~": "\\tilde", "̆": "\\breve", "̌": "\\check",
};

function ten(n: Node): string {
  return (n as Element).localName ?? n.nodeName.replace(/^.*:/, "");
}

function con(n: Nut, tenCon?: string): Nut[] {
  const kq: Nut[] = [];
  for (let c = n.firstChild; c; c = c.nextSibling) {
    if (c.nodeType === 1 && (!tenCon || ten(c) === tenCon)) kq.push(c as Nut);
  }
  return kq;
}

function mot(n: Nut, tenCon: string): Nut | undefined {
  return con(n, tenCon)[0];
}

function giaTri(n: Nut | undefined, tenPr: string, tenThuocTinh: string): string | undefined {
  if (!n) return undefined;
  const pr = mot(n, tenPr);
  const el = pr && mot(pr, tenThuocTinh);
  if (!el) return undefined;
  return el.getAttribute("m:val") ?? el.getAttribute("val") ?? "";
}

function boc(s: string): string {
  const t = s.trim();
  if (/^[A-Za-z0-9]$/.test(t) || /^\\[A-Za-z]+\s*$/.test(t)) return t;
  return `{${t}}`;
}

function vanBan(s: string): string {
  let kq = "";
  for (const c of s) kq += KI_HIEU[c] ?? c;
  return kq;
}

function cacCon(n: Nut): string {
  return con(n).map(chuyen).join("");
}

function dau(c: string | undefined, macDinh: string, trai: boolean): string {
  const k = c === undefined ? macDinh : c;
  if (k === "") return ".";
  const bang: Record<string, string> = {
    "{": "\\{", "}": "\\}", "⟨": "\\langle", "⟩": "\\rangle", "‖": "\\|", "⌊": "\\lfloor",
    "⌋": "\\rfloor", "⌈": "\\lceil", "⌉": "\\rceil", "[": "[", "]": "]", "(": "(", ")": ")", "|": "|",
  };
  return bang[k] ?? (trai ? "(" : ")");
}

function chuyen(n: Nut): string {
  switch (ten(n)) {
    case "oMathPara":
      return con(n, "oMath").map(chuyen).join(" \\\\ ");
    case "oMath": case "e": case "num": case "den": case "sub": case "sup": case "deg":
    case "lim": case "fName": case "box": case "borderBox": case "phant":
      return cacCon(n);
    case "r": {
      const t = con(n, "t").map((x) => x.textContent ?? "").join("");
      const sty = giaTri(n, "rPr", "sty");
      const nor = n.getElementsByTagName("m:nor").length > 0;
      if ((nor || sty === "p") && /[A-Za-zÀ-ỹ]{2,}/.test(t) && !HAM.has(t.trim())) {
        return `\\text{${t}}`;
      }
      if (HAM.has(t.trim())) return `\\${t.trim()} `;
      return vanBan(t);
    }
    case "f": {
      const loai = giaTri(n, "fPr", "type");
      const tu = chuyen(mot(n, "num")!), mau = chuyen(mot(n, "den")!);
      if (loai === "lin") return `${boc(tu)}/${boc(mau)}`;
      if (loai === "noBar") return `\\binom{${tu}}{${mau}}`;
      return `\\frac{${tu}}{${mau}}`;
    }
    case "sSup":
      return `${boc(chuyen(mot(n, "e")!))}^{${chuyen(mot(n, "sup")!)}}`;
    case "sSub":
      return `${boc(chuyen(mot(n, "e")!))}_{${chuyen(mot(n, "sub")!)}}`;
    case "sSubSup":
      return `${boc(chuyen(mot(n, "e")!))}_{${chuyen(mot(n, "sub")!)}}^{${chuyen(mot(n, "sup")!)}}`;
    case "sPre":
      return `{}_{${chuyen(mot(n, "sub")!)}}^{${chuyen(mot(n, "sup")!)}}${boc(chuyen(mot(n, "e")!))}`;
    case "rad": {
      const an = giaTri(n, "radPr", "degHide");
      const bac = mot(n, "deg");
      const bacTex = bac ? chuyen(bac).trim() : "";
      const trong = chuyen(mot(n, "e")!);
      return an === "1" || an === "on" || an === "true" || !bacTex ? `\\sqrt{${trong}}` : `\\sqrt[${bacTex}]{${trong}}`;
    }
    case "d": {
      const beg = giaTri(n, "dPr", "begChr");
      const end = giaTri(n, "dPr", "endChr");
      const sep = giaTri(n, "dPr", "sepChr") ?? "|";
      const cacE = con(n, "e");
      // Hệ phương trình: dấu { bên trái, không có dấu bên phải, bên trong là mảng phương trình.
      if (beg === "{" && end === "" && cacE.length === 1) {
        const mang = mot(cacE[0], "eqArr");
        if (mang) return `\\begin{cases} ${con(mang, "e").map(chuyen).join(" \\\\ ")} \\end{cases}`;
      }
      if (beg === "[" && end === "" && cacE.length === 1) {
        const mang = mot(cacE[0], "eqArr");
        if (mang) return `\\left[\\begin{array}{l} ${con(mang, "e").map(chuyen).join(" \\\\ ")} \\end{array}\\right.`;
      }
      const trong = cacE.map(chuyen).join(sep === "|" ? "|" : vanBan(sep));
      return `\\left${dau(beg, "(", true)}${trong}\\right${dau(end, ")", false)}`;
    }
    case "eqArr":
      return `\\begin{array}{l} ${con(n, "e").map(chuyen).join(" \\\\ ")} \\end{array}`;
    case "m": {
      const hang = con(n, "mr").map((mr) => con(mr, "e").map(chuyen).join(" & "));
      return `\\begin{matrix} ${hang.join(" \\\\ ")} \\end{matrix}`;
    }
    case "nary": {
      const chr = giaTri(n, "naryPr", "chr") ?? "∫";
      const lenh = NARY[chr] ?? vanBan(chr);
      const sub = mot(n, "sub"), sup = mot(n, "sup");
      const subTex = sub ? chuyen(sub).trim() : "", supTex = sup ? chuyen(sup).trim() : "";
      return `${lenh}${subTex ? `_{${subTex}}` : ""}${supTex ? `^{${supTex}}` : ""} ${chuyen(mot(n, "e")!)}`;
    }
    case "func": {
      const tenHam = chuyen(mot(n, "fName")!).trim();
      return `${tenHam}${/\s$|}$/.test(tenHam) ? "" : " "}${chuyen(mot(n, "e")!)}`;
    }
    case "limLow": {
      const e = chuyen(mot(n, "e")!).trim();
      const gh = chuyen(mot(n, "lim")!);
      if (/^\\(lim|max|min)$/.test(e)) return `${e}_{${gh}} `;
      return `\\underset{${gh}}{${e}}`;
    }
    case "limUpp":
      return `\\overset{${chuyen(mot(n, "lim")!)}}{${chuyen(mot(n, "e")!)}}`;
    case "acc": {
      const chr = giaTri(n, "accPr", "chr") ?? "̂";
      return `${DAU_NHAN[chr] ?? "\\hat"}{${chuyen(mot(n, "e")!)}}`;
    }
    case "bar":
      return giaTri(n, "barPr", "pos") === "bot"
        ? `\\underline{${chuyen(mot(n, "e")!)}}`
        : `\\overline{${chuyen(mot(n, "e")!)}}`;
    case "groupChr": {
      const tren = giaTri(n, "groupChrPr", "pos") === "top";
      return `${tren ? "\\overbrace" : "\\underbrace"}{${chuyen(mot(n, "e")!)}}`;
    }
    default:
      // Các thẻ thuộc tính (...Pr, ctrlPr) không có nội dung hiển thị.
      return /Pr$/.test(ten(n)) ? "" : cacCon(n);
  }
}

export function ommlSangLatex(n: Element): string {
  return chuyen(n).replace(/\s+/g, " ").replace(/\s+([}^_])/g, "$1").trim();
}
