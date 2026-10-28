"use client";
/**
 * Tin 11 Bài 14 – Thám tử truy vấn SQL (kiểu PhET).
 * Màn Máy truy vấn: lắp truy vấn bằng nút bấm, câu SQL hiện song song; bảng gốc vẽ cạnh kết quả,
 * dòng qua được WHERE sáng lên, dòng bị loại mờ đi và gạch — thấy tận mắt điều kiện "lọc" dữ liệu.
 * Thử thách: bốn manh mối vụ sách quá hạn, cuối cùng chỉ ra người giữ sách.
 */
import { useState } from "react";
import { Plus, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/form";
import { availableColumns, OPS, runQuery, toSql, type Cell, type Cond, type Op, type Query, type Row } from "@/lib/sim/sql-engine";
import { CASE_TABLES, CLUES, CULPRIT, SUSPECTS, TABLE_NOTE } from "@/lib/sim/sql-detective";
import { ChallengeFrame, Panel, Readout, ResetAll, SimLayout, SimShell, SimToggle, Stage, useChallenge } from "./kit";

const START: Query = { from: "phieu_muon", columns: "*", where: [] };
const show = (v: Cell) => (v === null ? <i className="text-slate-400">NULL</i> : String(v));

function passes(q: Query, r: Row) {
  return runQuery({ t: [r] }, { ...q, from: "t", join: undefined, columns: "*" }).rows.length > 0;
}

/** Trình lắp truy vấn: bảng, nối, cột, điều kiện, sắp xếp. */
function Builder({ q, set }: { q: Query; set: (q: Query) => void }) {
  const cols = availableColumns(CASE_TABLES, q);
  const [draft, setDraft] = useState<Cond>({ col: "ma_sach", op: "=", value: "" });
  const needsValue = draft.op !== "IS NULL" && draft.op !== "IS NOT NULL";
  return (
    <>
      <Panel title="FROM">
        <select aria-label="Bảng" value={q.from} onChange={(e) => set({ from: e.target.value, columns: "*", where: [] })} className="w-full rounded-lg border border-line bg-surface px-2 py-1.5 font-mono text-sm">{Object.keys(CASE_TABLES).map((t) => <option key={t}>{t}</option>)}</select>
        {q.from === "phieu_muon" && <SimToggle label="JOIN hoc_sinh (theo ma_hs)" checked={!!q.join} onChange={(v) => set({ ...q, join: v ? { table: "hoc_sinh", left: "ma_hs", right: "ma_hs" } : undefined, columns: "*" })} />}
      </Panel>
      <Panel title="SELECT">
        <div className="flex flex-wrap gap-1">
          <button type="button" aria-pressed={q.columns === "*"} onClick={() => set({ ...q, columns: "*" })} className={cn("rounded-md px-2 py-0.5 font-mono text-xs", q.columns === "*" ? "bg-brand text-brand-ink" : "bg-surface text-muted")}>*</button>
          {cols.map((c) => { const on = q.columns !== "*" && q.columns.includes(c); return <button key={c} type="button" aria-pressed={on} onClick={() => set({ ...q, columns: on ? (q.columns as string[]).filter((x) => x !== c) : [...(q.columns === "*" ? [] : q.columns), c] })} className={cn("rounded-md px-2 py-0.5 font-mono text-xs", on ? "bg-brand text-brand-ink" : "bg-surface text-muted hover:text-fg")}>{c}</button>; })}
        </div>
      </Panel>
      <Panel title="WHERE">
        {q.where.map((w, i) => <p key={i} className="flex items-center gap-1 font-mono text-xs"><span className="min-w-0 flex-1 truncate rounded bg-surface px-2 py-1">{w.col} {w.op} {w.value ?? ""}</span><button type="button" aria-label="Bỏ điều kiện" onClick={() => set({ ...q, where: q.where.filter((_, j) => j !== i) })}><X className="size-4 text-muted" /></button></p>)}
        <div className="grid grid-cols-2 gap-1">
          <select aria-label="Cột điều kiện" value={draft.col} onChange={(e) => setDraft({ ...draft, col: e.target.value })} className="rounded-lg border border-line bg-surface px-1 py-1 font-mono text-xs">{cols.map((c) => <option key={c}>{c}</option>)}</select>
          <select aria-label="Phép so sánh" value={draft.op} onChange={(e) => setDraft({ ...draft, op: e.target.value as Op })} className="rounded-lg border border-line bg-surface px-1 py-1 font-mono text-xs">{OPS.map((o) => <option key={o}>{o}</option>)}</select>
        </div>
        {needsValue && <Input aria-label="Giá trị" className="h-8 font-mono text-xs" placeholder="giá trị, vd S01" value={draft.value ?? ""} onChange={(e) => setDraft({ ...draft, value: e.target.value })} />}
        <button type="button" onClick={() => set({ ...q, where: [...q.where, needsValue ? draft : { col: draft.col, op: draft.op }] })} className="flex w-full items-center justify-center gap-1 rounded-lg bg-surface py-1.5 text-xs font-semibold text-fg hover:bg-line"><Plus className="size-3.5" /> Thêm điều kiện (AND)</button>
      </Panel>
    </>
  );
}

/** Bảng gốc: dòng thỏa điều kiện sáng, dòng bị loại mờ đi. */
function Sieve({ q }: { q: Query }) {
  const base = runQuery(CASE_TABLES, { ...q, where: [], columns: "*", orderBy: undefined });
  if (!base.ok) return null;
  return (
    <div className="overflow-x-auto rounded-xl border border-sky-200 bg-white dark:border-slate-700 dark:bg-slate-900">
      <table className="w-full text-xs">
        <thead><tr>{base.columns.map((c) => <th key={c} className="px-2 py-1 text-left font-mono text-slate-500">{c}</th>)}</tr></thead>
        <tbody>{base.rows.map((r, i) => { const ok = passes(q, r); return <tr key={i} className={cn("border-t border-slate-100 transition-all duration-300 dark:border-slate-800", ok ? "bg-emerald-50 dark:bg-emerald-500/10" : "opacity-35 line-through")}>{base.columns.map((c) => <td key={c} className="whitespace-nowrap px-2 py-1 text-slate-800 dark:text-slate-100">{show(r[c])}</td>)}</tr>; })}</tbody>
      </table>
    </div>
  );
}

function ResultTable({ q }: { q: Query }) {
  const r = runQuery(CASE_TABLES, q);
  if (!r.ok) return <p className="rounded-xl bg-rose-500/10 px-3 py-2 text-sm text-danger-fg">{r.error}</p>;
  return (
    <div className="overflow-x-auto rounded-xl border-2 border-emerald-400 bg-white dark:bg-slate-900">
      <p className="bg-emerald-500 px-3 py-1 text-xs font-bold text-white">Kết quả: {r.rows.length} dòng</p>
      <table className="w-full text-xs"><thead><tr>{r.columns.map((c) => <th key={c} className="px-2 py-1 text-left font-mono text-slate-500">{c}</th>)}</tr></thead><tbody>{r.rows.map((x, i) => <tr key={i} className="border-t border-slate-100 dark:border-slate-800">{r.columns.map((c) => <td key={c} className="whitespace-nowrap px-2 py-1 text-slate-800 dark:text-slate-100">{show(x[c])}</td>)}</tr>)}</tbody></table>
    </div>
  );
}

function Explore() {
  const [q, setQ] = useState<Query>(START);
  const r = runQuery(CASE_TABLES, q);
  return (
    <SimLayout
      stage={
        <Stage className="space-y-3 p-3 sm:p-4">
          <pre className="overflow-x-auto rounded-xl bg-slate-900 p-3 font-mono text-sm leading-relaxed text-emerald-300" aria-live="polite">{toSql(q)}</pre>
          <p className="text-xs text-muted">{TABLE_NOTE[q.from]}{q.join ? " — đã nối với hoc_sinh" : ""}</p>
          <Sieve q={q} />
          <ResultTable q={q} />
        </Stage>
      }
      controls={
        <>
          <Builder q={q} set={setQ} />
          <div className="grid grid-cols-2 gap-2"><Readout label="Dòng gốc" value={runQuery(CASE_TABLES, { ...q, where: [], columns: "*" }).rows.length} /><Readout label="Còn lại" value={r.ok ? r.rows.length : "—"} tone="green" /></div>
          <ResetAll onClick={() => setQ(START)} />
        </>
      }
    />
  );
}

function Game() {
  const total = CLUES.length + 1;
  const c = useChallenge(total);
  const [q, setQ] = useState<Query>(START);
  const [suspect, setSuspect] = useState<number | null>(null);
  const key = `${c.run}`;
  const [seen, setSeen] = useState(key);
  if (seen !== key) { setSeen(key); setQ(START); setSuspect(null); }
  const clue = CLUES[Math.min(c.idx, CLUES.length - 1)];
  const final = c.idx >= CLUES.length;
  const check = () => {
    if (final) return c.check(suspect === CULPRIT, suspect === CULPRIT ? "Chính xác! Trần Thu Bình (11A1) giữ sách quá hạn — tìm ra nhờ lọc, điều kiện NULL và JOIN." : "Xem lại kết quả truy vấn cuối: chỉ một người thỏa cả ba điều kiện.");
    const r = runQuery(CASE_TABLES, q);
    if (!r.ok) return c.check(false, r.error ?? "Truy vấn lỗi.");
    const why = clue.check(r, q);
    return c.check(!why, why ?? clue.found);
  };
  return (
    <ChallengeFrame c={c} prompt={final ? "Ai đang giữ cuốn Dế Mèn bản quý quá hạn?" : <>{clue.story} <span className="block text-sm font-normal text-muted">Nhiệm vụ: {clue.task}</span></>} onCheck={check} summary={["WHERE giữ lại các dòng thỏa điều kiện; nhiều điều kiện nối bằng AND.", "Kiểm tra ô trống bằng IS NULL, không dùng = NULL.", "JOIN nối hai bảng qua khóa ngoài để lấy thông tin ở bảng kia."]}>
      {final ? (
        <div className="grid gap-2 sm:grid-cols-2">{SUSPECTS.map((s, i) => <button key={s} type="button" aria-pressed={suspect === i} onClick={() => setSuspect(i)} className={cn("flex items-center gap-2 rounded-xl border-2 px-4 py-3 text-left font-semibold", suspect === i ? "border-brand bg-brand/10 text-fg" : "border-line bg-surface text-fg hover:border-brand/40")}><Search className="size-4" aria-hidden />{s}</button>)}</div>
      ) : (
        <SimLayout
          stage={<Stage className="space-y-3 p-3"><pre className="overflow-x-auto rounded-xl bg-slate-900 p-3 font-mono text-sm text-emerald-300">{toSql(q)}</pre><Sieve q={q} /><ResultTable q={q} /><details className="text-sm"><summary className="cursor-pointer font-medium text-cyan-fg">Gợi ý</summary><p className="mt-1 text-fg">{clue.hint}</p></details></Stage>}
          controls={<Builder q={q} set={setQ} />}
        />
      )}
    </ChallengeFrame>
  );
}

export function SqlDetectiveLab() {
  return <SimShell title="Thám tử truy vấn SQL" screens={[{ id: "kham-pha", label: "Máy truy vấn", icon: Search, render: () => <Explore /> }, { id: "thu-thach", label: "Vụ án thư viện", render: () => <Game /> }]} />;
}
