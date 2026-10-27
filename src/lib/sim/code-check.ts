/**
 * Code Playground giai đoạn 1 (DEMO): KHÔNG thực thi Python.
 * Chỉ phân tích cấu trúc if/else của chương trình tưới cây và đánh giá điều kiện
 * bằng parser an toàn. Giai đoạn 2 sẽ thay bằng Pyodide trong Web Worker.
 */
import { compileRule, type CompileResult } from "./smart-garden";

export interface CodeAnalysis {
  condition: string | null;
  compiled: CompileResult | null;
  errors: { line: number; message: string }[];
  notes: { line: number; message: string }[];
}

const ALLOWED_PREAMBLE = [/^humidity\s*=\s*read_humidity\(\)$/, /^has_water\s*=\s*tank_has_water\(\)$/];

export function analyzeGardenCode(code: string): CodeAnalysis {
  const errors: CodeAnalysis["errors"] = [];
  const notes: CodeAnalysis["notes"] = [];
  if (code.length > 5000) return { condition: null, compiled: null, errors: [{ line: 1, message: "Chương trình quá dài (tối đa 5.000 ký tự)." }], notes };
  const lines = code.replace(/\t/g, "    ").split("\n");
  let ifLine = -1;
  let elseLine = -1;
  lines.forEach((raw, i) => {
    const t = raw.trim();
    if (!t || t.startsWith("#")) return;
    if (/^if\b/.test(t)) {
      if (ifLine >= 0) notes.push({ line: i + 1, message: "Có nhiều câu lệnh if — chỉ phân tích câu lệnh đầu tiên." });
      else ifLine = i;
      if (!t.endsWith(":")) errors.push({ line: i + 1, message: "Thiếu dấu hai chấm ':' ở cuối dòng if." });
      return;
    }
    if (/^else\b/.test(t)) {
      elseLine = i;
      if (t !== "else:") errors.push({ line: i + 1, message: "Cú pháp else phải là 'else:'." });
      return;
    }
    if (/^(pump_on|pump_off)\(\)$/.test(t)) return;
    if (ALLOWED_PREAMBLE.some((re) => re.test(t))) return;
    notes.push({ line: i + 1, message: `Dòng "${t.slice(0, 40)}" được bỏ qua (bản dùng thử chỉ kiểm tra if/else).` });
  });
  if (ifLine < 0) return { condition: null, compiled: null, errors: [...errors, { line: 1, message: "Không tìm thấy câu lệnh if." }], notes };

  const indentOf = (s: string) => s.length - s.trimStart().length;
  const body = (start: number) => {
    const out: { line: number; text: string; indent: number }[] = [];
    for (let i = start + 1; i < lines.length; i++) {
      const t = lines[i].trim();
      if (!t || t.startsWith("#")) continue;
      if (indentOf(lines[i]) <= indentOf(lines[start])) break;
      out.push({ line: i + 1, text: t, indent: indentOf(lines[i]) });
    }
    return out;
  };
  const ifBody = body(ifLine);
  if (ifBody.length === 0) errors.push({ line: ifLine + 2, message: "Thân if phải được thụt lề (IndentationError)." });
  else if (!ifBody.some((b) => b.text === "pump_on()")) errors.push({ line: ifBody[0].line, message: "Thân if cần gọi pump_on()." });
  if (elseLine < 0) notes.push({ line: ifLine + 1, message: "Không có else: máy bơm sẽ giữ trạng thái cũ khi điều kiện sai." });
  else {
    const eb = body(elseLine);
    if (eb.length === 0) errors.push({ line: elseLine + 2, message: "Thân else phải được thụt lề (IndentationError)." });
    else if (!eb.some((b) => b.text === "pump_off()")) errors.push({ line: eb[0].line, message: "Thân else cần gọi pump_off()." });
  }
  const condition = lines[ifLine].trim().replace(/^if\s+/, "").replace(/:\s*$/, "");
  const compiled = compileRule(condition);
  if (!compiled.ok) errors.push({ line: ifLine + 1, message: `${compiled.error.message}${compiled.error.hint ? ` — ${compiled.error.hint}` : ""}` });
  return { condition, compiled, errors, notes };
}

export const CODE_SAMPLES: { id: string; title: string; code: string }[] = [
  {
    id: "correct",
    title: "Ví dụ: chương trình đúng",
    code: `# Hệ thống tưới cây tự động\nhumidity = read_humidity()\nhas_water = tank_has_water()\n\nif humidity < 40 and has_water:\n    pump_on()\nelse:\n    pump_off()\n`,
  },
  {
    id: "boundary",
    title: "Ví dụ: sai giá trị biên",
    code: `humidity = read_humidity()\nhas_water = tank_has_water()\n\nif humidity <= 40 and has_water:\n    pump_on()\nelse:\n    pump_off()\n`,
  },
  {
    id: "nowater",
    title: "Ví dụ: quên kiểm tra nước",
    code: `humidity = read_humidity()\n\nif humidity < 40:\n    pump_on()\nelse:\n    pump_off()\n`,
  },
  {
    id: "syntax",
    title: "Ví dụ: lỗi cú pháp",
    code: `humidity = read_humidity()\nhas_water = tank_has_water()\n\nif humidity = 40 && has_water\npump_on()\n`,
  },
];
