"use client";
import { useMemo, useState } from "react";
import { Database, Fingerprint, Pin, Play, Plus, Search, Send, Trash2, UserRoundSearch } from "lucide-react";
import { OPS, availableColumns, runQuery, toSql, type Cond, type Op, type Query, type QueryResult } from "@/lib/sim/sql-engine";
import { CASE_TABLES, CLUES, CULPRIT, SUSPECTS, TABLE_NOTE, TODAY } from "@/lib/sim/sql-detective";
import { useTutorActivity } from "@/components/tutor/tutor-provider";
import { MissionDone, MissionLayout, type Feedback, type MissionStage } from "@/components/sim/mission";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const STAGES: MissionStage[] = CLUES.map((c, i) => ({ id: c.id, label: `Manh mối ${i + 1}`, icon: Search }));
const JOINS: Record<string, { table: string; left: string; right: string }[]> = {
  phieu_muon: [{ table: "hoc_sinh", left: "ma_hs", right: "ma_hs" }, { table: "sach", left: "ma_sach", right: "ma_sach" }],
  hoc_sinh: [],
  sach: [],
};
const selectCls = "h-8 rounded-lg border border-line bg-surface-2 px-2 text-xs text-fg";

/**
 * Thám tử SQL (Tin 11 – Bài 14): lần theo cuốn sách quá hạn bằng truy vấn thật trên CSDL thư viện —
 * WHERE, IS NULL, so sánh ngày, JOIN — rồi chỉ ra người đang giữ sách.
 */
export function SqlDetectiveLab() {
  const [clueIdx, setClueIdx] = useState(0);
  const [q, setQ] = useState<Query>({ from: "phieu_muon", columns: "*", where: [] });
  const [result, setResult] = useState<QueryResult | null>(null);
  const [notes, setNotes] = useState<string[]>([]);
  const [accuse, setAccuse] = useState<number | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const done = clueIdx >= CLUES.length;
  const clue = CLUES[Math.min(clueIdx, CLUES.length - 1)];
  const cols = useMemo(() => availableColumns(CASE_TABLES, q), [q]);
  const sql = toSql(q);
  const stage = done ? (accuse === CULPRIT ? "done" : "accuse") : clue.id;

  const touchTutor = useTutorActivity("simulation", () => ({
    kind: "simulation",
    sim: "mô phỏng Thám tử SQL (truy vấn CSDL thư viện)",
    summary: `Manh mối đang tìm: ${done ? "chỉ ra người giữ sách" : clue.task} Câu truy vấn hiện tại: ${sql.replace(/\n/g, " ")} Kết quả: ${result ? (result.ok ? `${result.rows.length} dòng` : result.error) : "chưa chạy"}.`,
    problems: feedback && !feedback.ok ? [feedback.text] : [],
    facts: { clue: clueIdx + 1, mistakes, rows: result?.rows.length ?? -1 },
  }), { title: "Thám tử SQL · Tin 11", topic: "general", level: "free" });

  const set = (patch: Partial<Query>) => setQ((x) => ({ ...x, ...patch }));
  const setCond = (i: number, patch: Partial<Cond>) => set({ where: q.where.map((c, k) => (k === i ? { ...c, ...patch } : c)) });

  const run = () => {
    touchTutor();
    const r = runQuery(CASE_TABLES, q);
    setResult(r);
    setFeedback(r.ok ? null : { ok: false, text: r.error! });
    return r;
  };
  const submit = () => {
    const r = run();
    if (!r.ok) return;
    const why = clue.check(r, q);
    if (why) {
      setMistakes((m) => m + 1);
      return setFeedback({ ok: false, text: `Chưa phải manh mối cần tìm. ${why}` });
    }
    setNotes((n) => [...n, clue.found]);
    setFeedback({ ok: true, text: `Tìm ra manh mối! ${clue.found}` });
    setClueIdx((i) => i + 1);
  };
  const pickSuspect = (i: number) => {
    touchTutor();
    setAccuse(i);
    if (i !== CULPRIT) {
      setMistakes((m) => m + 1);
      setFeedback({ ok: false, text: "Chưa đúng. Xem lại kết quả truy vấn cuối cùng: có hai bạn trùng tên Nguyễn Văn An, nhưng mã HS mới là thứ phân biệt." });
    } else setFeedback({ ok: true, text: "Phá án thành công! Thủ thư đã liên hệ bạn Bình, cuốn bản quý sẽ về kho ngày mai." });
  };
  const restart = () => {
    setClueIdx(0); setQ({ from: "phieu_muon", columns: "*", where: [] }); setResult(null); setNotes([]); setAccuse(null); setMistakes(0); setFeedback(null);
  };

  const scene = (
    <div className="space-y-3 rounded-2xl border border-line bg-[#f7f1e3] p-3 text-slate-900 dark:bg-[#2a2418] dark:text-amber-50">
      <div className="flex flex-wrap items-start gap-3">
        <div className="min-w-0 flex-1 rounded-xl bg-white/80 p-3 shadow-sm dark:bg-black/30">
          <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-amber-700 dark:text-amber-300"><Fingerprint className="size-4" aria-hidden /> Hồ sơ vụ án · hôm nay {TODAY.split("-").reverse().join("/")}</p>
          <p className="mt-1 text-sm">{done ? "Đủ manh mối. Ai đang giữ cuốn Dế Mèn bản quý?" : clue.story}</p>
        </div>
        <ul className="flex min-w-[220px] flex-1 flex-col gap-1.5">
          {notes.length === 0 && <li className="rounded-lg border border-dashed border-amber-400/60 p-2 text-xs text-amber-800/70 dark:text-amber-200/70">Manh mối tìm được sẽ được ghim ở đây.</li>}
          {notes.map((n, i) => (
            <li key={i} className="flex gap-1.5 rounded-lg bg-yellow-200 p-2 text-xs shadow-sm dark:bg-yellow-900/60" style={{ transform: `rotate(${i % 2 ? 0.8 : -0.8}deg)` }}><Pin className="size-3.5 shrink-0 text-red-500" aria-hidden /> {n}</li>
          ))}
        </ul>
      </div>
      <details className="rounded-xl bg-white/70 p-2 text-xs dark:bg-black/30">
        <summary className="cursor-pointer font-semibold"><Database className="mr-1 inline size-3.5" aria-hidden />Cấu trúc CSDL thư viện</summary>
        <ul className="mt-1 space-y-0.5 font-mono">{Object.entries(TABLE_NOTE).map(([t, d]) => <li key={t}><b>{t}</b>: {d}</li>)}</ul>
      </details>
      <pre aria-label="Câu SQL" className="overflow-x-auto rounded-xl bg-[#0b1220] p-3 font-mono text-[12.5px] leading-5 text-slate-100">{sql}</pre>
      <div className="overflow-hidden rounded-xl border border-slate-300 bg-white dark:border-white/10 dark:bg-black/30">
        <p className="bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white">Kết quả {result?.ok ? `· ${result.rows.length} dòng` : ""}</p>
        {!result ? <p className="p-3 text-xs text-slate-500">Bấm Chạy để xem kết quả truy vấn.</p> : !result.ok ? <p className="p-3 text-xs text-red-600">{result.error}</p> : result.rows.length === 0 ? <p className="p-3 text-xs text-slate-500">(Không có dòng nào thỏa điều kiện)</p> : (
          <div className="max-h-60 overflow-auto">
            <table className="w-full text-[11px]">
              <thead className="sticky top-0 bg-slate-100 text-left dark:bg-slate-800"><tr>{result.columns.map((c) => <th key={c} className="px-2 py-1 font-semibold">{c}</th>)}</tr></thead>
              <tbody>{result.rows.map((r, i) => <tr key={i} className="border-t border-slate-100 dark:border-white/10">{result.columns.map((c) => <td key={c} className="whitespace-nowrap px-2 py-1 font-mono">{r[c] ?? <span className="italic text-slate-400">NULL</span>}</td>)}</tr>)}</tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <MissionLayout scene={scene} stages={STAGES} current={stage} feedback={feedback} mistakes={mistakes}>
      {!done ? (
        <>
          <h3 className="font-semibold text-fg">Manh mối {clueIdx + 1}/{CLUES.length}</h3>
          <p className="mt-1 text-sm text-fg">{clue.task}</p>
          <details className="mt-1 text-xs text-muted"><summary className="cursor-pointer">Gợi ý</summary>{clue.hint}</details>
          <div className="mt-3 space-y-2.5 text-xs">
            <label className="flex items-center gap-2"><span className="w-16 font-mono font-semibold text-cyan-fg">FROM</span>
              <select className={selectCls} value={q.from} onChange={(e) => set({ from: e.target.value, join: undefined, where: [], columns: "*", orderBy: undefined })}>{Object.keys(CASE_TABLES).map((t) => <option key={t}>{t}</option>)}</select>
            </label>
            {JOINS[q.from].length > 0 && (
              <label className="flex items-center gap-2"><span className="w-16 font-mono font-semibold text-cyan-fg">JOIN</span>
                <select className={selectCls} value={q.join?.table ?? ""} onChange={(e) => set({ join: JOINS[q.from].find((j) => j.table === e.target.value), columns: "*" })}>
                  <option value="">(không nối bảng)</option>
                  {JOINS[q.from].map((j) => <option key={j.table} value={j.table}>{j.table} ON {j.left}</option>)}
                </select>
              </label>
            )}
            <fieldset>
              <legend className="font-mono font-semibold text-cyan-fg">SELECT</legend>
              <div className="mt-1 flex flex-wrap gap-1">
                <button type="button" aria-pressed={q.columns === "*"} onClick={() => set({ columns: q.columns === "*" ? [] : "*" })} className={cn("rounded-md border px-1.5 py-0.5 font-mono", q.columns === "*" ? "border-cyan bg-cyan/15 text-cyan-fg" : "border-line")}>*</button>
                {cols.map((c) => {
                  const on = q.columns !== "*" && q.columns.includes(c);
                  return <button key={c} type="button" aria-pressed={on} onClick={() => set({ columns: q.columns === "*" ? [c] : on ? q.columns.filter((x) => x !== c) : [...q.columns, c] })} className={cn("rounded-md border px-1.5 py-0.5 font-mono", on ? "border-cyan bg-cyan/15 text-cyan-fg" : "border-line text-muted")}>{c}</button>;
                })}
              </div>
            </fieldset>
            <fieldset className="space-y-1.5">
              <legend className="font-mono font-semibold text-cyan-fg">WHERE {q.where.length > 1 && <span className="font-sans font-normal text-muted">(các điều kiện nối bằng AND)</span>}</legend>
              {q.where.map((c, i) => (
                <div key={i} className="flex items-center gap-1">
                  <select aria-label="Cột" className={cn(selectCls, "min-w-0 flex-1")} value={c.col} onChange={(e) => setCond(i, { col: e.target.value })}>{cols.map((x) => <option key={x}>{x}</option>)}</select>
                  <select aria-label="Phép so sánh" className={selectCls} value={c.op} onChange={(e) => setCond(i, { op: e.target.value as Op })}>{OPS.map((o) => <option key={o}>{o}</option>)}</select>
                  {c.op !== "IS NULL" && c.op !== "IS NOT NULL" && <input aria-label="Giá trị" className={cn(selectCls, "w-24")} value={c.value ?? ""} onChange={(e) => setCond(i, { value: e.target.value })} placeholder="giá trị" />}
                  <button type="button" aria-label="Bỏ điều kiện" onClick={() => set({ where: q.where.filter((_, k) => k !== i) })} className="grid size-7 place-items-center rounded-md text-muted hover:text-danger-fg"><Trash2 className="size-3.5" /></button>
                </div>
              ))}
              <button type="button" onClick={() => set({ where: [...q.where, { col: cols[0], op: "=", value: "" }] })} className="flex items-center gap-1 rounded-md px-1.5 py-1 text-cyan-fg hover:bg-cyan/10"><Plus className="size-3.5" /> Thêm điều kiện</button>
            </fieldset>
            <label className="flex items-center gap-2"><span className="w-16 font-mono font-semibold text-cyan-fg">ORDER BY</span>
              <select className={selectCls} value={q.orderBy?.col ?? ""} onChange={(e) => set({ orderBy: e.target.value ? { col: e.target.value, desc: q.orderBy?.desc ?? false } : undefined })}>
                <option value="">(không sắp xếp)</option>{cols.map((c) => <option key={c}>{c}</option>)}
              </select>
              {q.orderBy && <label className="flex items-center gap-1"><input type="checkbox" checked={q.orderBy.desc} onChange={(e) => set({ orderBy: { ...q.orderBy!, desc: e.target.checked } })} /> DESC</label>}
            </label>
          </div>
          <div className="mt-3 flex gap-2">
            <Button size="sm" variant="secondary" onClick={run}><Play /> Chạy</Button>
            <Button size="sm" onClick={submit}><Send /> Nộp manh mối</Button>
          </div>
        </>
      ) : accuse === CULPRIT ? (
        <MissionDone
          mistakes={mistakes}
          title="Phá án thành công!"
          onRestart={restart}
          points={[
            <><b>WHERE</b> lọc dòng; nhiều điều kiện nối bằng <b>AND</b> thu hẹp dần kết quả.</>,
            <>Ô trống dùng <b>IS NULL</b>; viết <code>= NULL</code> luôn cho kết quả rỗng.</>,
            <><b>JOIN</b> nối bảng qua khóa (ma_hs) để lấy thông tin ở bảng khác.</>,
          ]}
        />
      ) : (
        <>
          <h3 className="flex items-center gap-1.5 font-semibold text-fg"><UserRoundSearch className="size-4" aria-hidden /> Chỉ ra người giữ sách</h3>
          <div className="mt-3 space-y-1.5">{SUSPECTS.map((s, i) => <Button key={s} size="sm" variant={accuse === i ? "primary" : "secondary"} className="w-full justify-start" onClick={() => pickSuspect(i)}>{s}</Button>)}</div>
        </>
      )}
    </MissionLayout>
  );
}
