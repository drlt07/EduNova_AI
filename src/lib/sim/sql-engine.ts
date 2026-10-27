/**
 * Bộ máy truy vấn SQL thu nhỏ cho Thám tử SQL (Tin 11 – Bài 14): SELECT … FROM … [JOIN … ON …] [WHERE …] [ORDER BY …].
 * Chỉ dùng trong trình duyệt trên dữ liệu mẫu; câu SQL hiển thị được sinh từ cùng cấu trúc truy vấn.
 */

export type Cell = string | number | null;
export type Row = Record<string, Cell>;
export type Tables = Record<string, Row[]>;

export type Op = "=" | "<>" | ">" | "<" | ">=" | "<=" | "LIKE" | "IS NULL" | "IS NOT NULL";
export const OPS: Op[] = ["=", "<>", ">", "<", ">=", "<=", "LIKE", "IS NULL", "IS NOT NULL"];

export interface Cond {
  col: string;
  op: Op;
  value?: string;
}

export interface Query {
  from: string;
  join?: { table: string; left: string; right: string };
  columns: string[] | "*";
  where: Cond[];
  orderBy?: { col: string; desc: boolean };
}

export interface QueryResult {
  ok: boolean;
  columns: string[];
  rows: Row[];
  error?: string;
}

const isNum = (s: string) => /^-?\d+(\.\d+)?$/.test(s.trim());

function cmp(a: Cell, b: string, op: Op): boolean {
  if (op === "IS NULL") return a === null;
  if (op === "IS NOT NULL") return a !== null;
  if (a === null) return false; // so sánh với NULL luôn không đúng, như SQL thật
  if (op === "LIKE") {
    const re = new RegExp(`^${b.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/%/g, ".*").replace(/_/g, ".")}$`, "i");
    return re.test(String(a));
  }
  const x = typeof a === "number" && isNum(b) ? a : String(a);
  const y = typeof a === "number" && isNum(b) ? Number(b) : b;
  switch (op) {
    case "=": return x === y;
    case "<>": return x !== y;
    case ">": return x > y;
    case "<": return x < y;
    case ">=": return x >= y;
    case "<=": return x <= y;
  }
  return false;
}

/** Cột có thể dùng của một truy vấn (bảng chính, rồi cột bảng nối chưa trùng tên). */
export function availableColumns(tables: Tables, q: Pick<Query, "from" | "join">): string[] {
  const base = Object.keys(tables[q.from]?.[0] ?? {});
  if (!q.join) return base;
  const extra = Object.keys(tables[q.join.table]?.[0] ?? {}).filter((c) => !base.includes(c));
  return [...base, ...extra];
}

export function runQuery(tables: Tables, q: Query): QueryResult {
  const base = tables[q.from];
  if (!base) return { ok: false, columns: [], rows: [], error: `Không có bảng ${q.from}.` };
  let rows: Row[] = base.map((r) => ({ ...r }));
  if (q.join) {
    const other = tables[q.join.table];
    if (!other) return { ok: false, columns: [], rows: [], error: `Không có bảng ${q.join.table}.` };
    const { left, right } = q.join;
    rows = rows.flatMap((r) => other.filter((o) => o[right] !== null && o[right] === r[left]).map((o) => ({ ...o, ...r })));
  }
  const cols = availableColumns(tables, q);
  for (const c of q.where) {
    if (!cols.includes(c.col)) return { ok: false, columns: [], rows: [], error: `Không có cột ${c.col} trong ${q.from}${q.join ? ` và ${q.join.table}` : ""}.` };
    if (c.op !== "IS NULL" && c.op !== "IS NOT NULL" && (c.value ?? "") === "") return { ok: false, columns: [], rows: [], error: `Điều kiện trên cột ${c.col} còn thiếu giá trị.` };
  }
  rows = rows.filter((r) => q.where.every((c) => cmp(r[c.col] ?? null, c.value ?? "", c.op)));
  if (q.orderBy) {
    const { col, desc } = q.orderBy;
    rows.sort((a, b) => {
      const x = a[col], y = b[col];
      if (x === y) return 0;
      if (x === null) return 1;
      if (y === null) return -1;
      return (x < y ? -1 : 1) * (desc ? -1 : 1);
    });
  }
  const columns = q.columns === "*" ? cols : q.columns.filter((c) => cols.includes(c));
  if (!columns.length) return { ok: false, columns: [], rows: [], error: "Hãy chọn ít nhất một cột để hiển thị." };
  return { ok: true, columns, rows: rows.map((r) => Object.fromEntries(columns.map((c) => [c, r[c] ?? null]))) };
}

const lit = (v: string) => (isNum(v) ? v : `'${v.replace(/'/g, "''")}'`);

export function toSql(q: Query): string {
  const lines = [`SELECT ${q.columns === "*" ? "*" : q.columns.join(", ") || "…"}`, `FROM ${q.from}`];
  if (q.join) lines.push(`JOIN ${q.join.table} ON ${q.from}.${q.join.left} = ${q.join.table}.${q.join.right}`);
  if (q.where.length) lines.push(`WHERE ${q.where.map((c) => (c.op === "IS NULL" || c.op === "IS NOT NULL" ? `${c.col} ${c.op}` : `${c.col} ${c.op} ${lit(c.value ?? "")}`)).join("\n  AND ")}`);
  if (q.orderBy) lines.push(`ORDER BY ${q.orderBy.col}${q.orderBy.desc ? " DESC" : ""}`);
  return lines.join("\n") + ";";
}
