"use client";
/**
 * Tin 11 Bài 10–13 – Thành phố dữ liệu (kiểu PhET).
 * Màn Liên kết bảng: ba bảng HỌC SINH – SÁCH – PHIẾU MƯỢN, bấm một phiếu thì đường khóa ngoài sáng lên tới đúng dòng;
 * thêm phiếu mượn, bật/tắt ràng buộc khóa ngoài để thấy phiếu "trỏ vào hư không"; sửa tên sách và so với sổ ghi chép cũ.
 * Thử thách: xếp cột vào bảng, chọn khóa chính (có phản ví dụ), dự đoán thao tác được phép hay bị từ chối.
 */
import { useState } from "react";
import { KeyRound, Link2, Table2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { assignColumn, BOOKS, checkKey, COLUMN_LABEL, DB_OPS, initialDb, KEY_QUESTIONS, LOANS, MESSY_LOG, STUDENTS, TABLE_LABEL, type Db, type InfoColumn, type Loan, type TableId } from "@/lib/sim/library-db";
import { ChallengeFrame, Panel, Readout, ResetAll, Segmented, SimLayout, SimShell, SimToggle, Stage, useChallenge } from "./kit";

const TONE: Record<TableId, string> = { hoc_sinh: "#2563eb", sach: "#16a34a", phieu_muon: "#ea580c" };

function Table({ id, cols, rows, hi, onRow, keyCol, fkCols = [], bad }: { id: TableId; cols: string[]; rows: Record<string, string | null>[]; hi?: (r: Record<string, string | null>) => boolean; onRow?: (i: number) => void; keyCol: string; fkCols?: string[]; bad?: (r: Record<string, string | null>) => boolean }) {
  return (
    <div className="min-w-0 overflow-hidden rounded-xl border-2 bg-white shadow-sm dark:bg-slate-900" style={{ borderColor: TONE[id] }}>
      <p className="px-3 py-1.5 text-xs font-extrabold tracking-wide text-white" style={{ background: TONE[id] }}>{TABLE_LABEL[id]}</p>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead><tr>{cols.map((c) => <th key={c} className="whitespace-nowrap px-2 py-1 text-left font-semibold text-slate-500">{c === keyCol && <KeyRound className="mr-0.5 inline size-3 text-amber-500" aria-label="khóa chính" />}{fkCols.includes(c) && <Link2 className="mr-0.5 inline size-3 text-orange-500" aria-label="khóa ngoài" />}{COLUMN_LABEL[c] ?? c}</th>)}</tr></thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} onClick={onRow ? () => onRow(i) : undefined} className={cn("border-t border-slate-100 transition-colors dark:border-slate-800", onRow && "cursor-pointer hover:bg-orange-50 dark:hover:bg-slate-800", hi?.(r) && "bg-yellow-100 font-semibold dark:bg-yellow-500/20", bad?.(r) && "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-200")}>
                {cols.map((c) => <td key={c} className="whitespace-nowrap px-2 py-1 text-slate-800 dark:text-slate-100">{r[c] ?? "—"}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Explore() {
  const [db, setDb] = useState<Db>(initialDb);
  const [pick, setPick] = useState<number | null>(1);
  const [fk, setFk] = useState(true);
  const [view, setView] = useState<"csdl" | "so">("csdl");
  const [hs, setHs] = useState("HS02");
  const [bk, setBk] = useState("S03");
  const [rename, setRename] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const loan = pick !== null ? db.loans[pick] : undefined;
  const orphan = (l: Record<string, string | null>) => !db.books.some((b) => b.ma_sach === l.ma_sach) || !db.students.some((s) => s.ma_hs === l.ma_hs);
  const addLoan = () => {
    const exists = db.books.some((b) => b.ma_sach === bk) && db.students.some((s) => s.ma_hs === hs);
    if (!exists && fk) return setMsg({ ok: false, text: `Bị từ chối: ${bk} hoặc ${hs} không có trong bảng. Khóa ngoài chỉ nhận mã có thật.` });
    const l: Loan = { ma_phieu: `P${String(db.loans.length + 1).padStart(3, "0")}`, ma_hs: hs, ma_sach: bk, ngay_muon: "28/10", ngay_tra: null };
    setDb({ ...db, loans: [...db.loans, l] }); setPick(db.loans.length);
    setMsg(exists ? { ok: true, text: `Đã thêm ${l.ma_phieu}. Phiếu chỉ lưu hai mã; tên học sinh, tên sách tra ở bảng kia.` } : { ok: false, text: `Đã thêm ${l.ma_phieu} vì ràng buộc đang tắt — phiếu trỏ tới mã không tồn tại, không biết ai mượn sách gì!` });
  };
  const doRename = () => {
    if (!rename.trim() || !loan) return;
    setDb({ ...db, books: db.books.map((b) => (b.ma_sach === loan.ma_sach ? { ...b, ten_sach: rename.trim() } : b)) });
    const n = db.loans.filter((l) => l.ma_sach === loan.ma_sach).length;
    setMsg({ ok: true, text: `Chỉ sửa 1 dòng ở bảng SÁCH, cả ${n} phiếu mượn ${loan.ma_sach} đều thấy tên mới. Sổ cũ phải sửa ${n} chỗ.` });
  };
  const bookName = (id: string) => db.books.find((b) => b.ma_sach === id)?.ten_sach;
  return (
    <SimLayout
      stage={
        <Stage className="space-y-3 p-3 sm:p-4">
          {view === "csdl" ? (
            <>
              <div className="grid gap-3 md:grid-cols-2">
                <Table id="hoc_sinh" cols={["ma_hs", "ho_ten", "lop"]} rows={db.students as never} keyCol="ma_hs" hi={(r) => r.ma_hs === loan?.ma_hs} />
                <Table id="sach" cols={["ma_sach", "ten_sach", "tac_gia"]} rows={db.books as never} keyCol="ma_sach" hi={(r) => r.ma_sach === loan?.ma_sach} />
              </div>
              <div className="flex items-center justify-center gap-6 text-xs font-semibold text-orange-600" aria-hidden><span>↑ ma_hs</span><span>↑ ma_sach</span></div>
              <Table id="phieu_muon" cols={["ma_phieu", "ma_hs", "ma_sach", "ngay_muon", "ngay_tra"]} rows={db.loans as never} keyCol="ma_phieu" fkCols={["ma_hs", "ma_sach"]} hi={(r) => r.ma_phieu === loan?.ma_phieu} bad={orphan} onRow={setPick} />
              {loan && <p className="rounded-xl bg-white px-3 py-2 text-sm text-slate-700 shadow-sm dark:bg-slate-900 dark:text-slate-200" aria-live="polite">Phiếu <b>{loan.ma_phieu}</b>: {db.students.find((s) => s.ma_hs === loan.ma_hs)?.ho_ten ?? <b className="text-rose-600">không rõ học sinh</b>} mượn “{bookName(loan.ma_sach) ?? <b className="text-rose-600">không rõ sách</b>}”.</p>}
            </>
          ) : (
            <div className="overflow-x-auto rounded-xl border-2 border-amber-700/40 bg-[#fdf6e3] p-2 font-[cursive] text-slate-800">
              <p className="px-2 pb-1 text-xs font-bold uppercase tracking-wide text-amber-800">Sổ mượn sách viết tay</p>
              <table className="w-full text-xs"><tbody>{MESSY_LOG.map((r, i) => <tr key={i} className="border-t border-amber-800/20">{Object.values(r).map((v, j) => <td key={j} className={cn("whitespace-nowrap px-2 py-1", v === "De Men phieu luu ki" && "bg-rose-200 font-bold")}>{v}</td>)}</tr>)}</tbody></table>
              <p className="px-2 pt-2 text-xs text-amber-900">Tên sách, tên học sinh chép lại mỗi lần mượn — lần thứ ba đã chép sai.</p>
            </div>
          )}
          {msg && <p role="status" className={cn("rounded-xl px-3 py-2 text-sm", msg.ok ? "bg-emerald-500/10 text-success-fg" : "bg-rose-500/10 text-danger-fg")}>{msg.text}</p>}
        </Stage>
      }
      controls={
        <>
          <Panel title="Xem">
            <Segmented label="Cách lưu" value={view} options={[{ value: "csdl", label: "CSDL 3 bảng" }, { value: "so", label: "Sổ ghi chép" }]} onChange={setView} />
          </Panel>
          <Panel title="Thêm phiếu mượn">
            <div className="grid grid-cols-2 gap-2">
              <select aria-label="Mã học sinh" value={hs} onChange={(e) => setHs(e.target.value)} className="rounded-lg border border-line bg-surface px-2 py-1.5">{[...STUDENTS.map((s) => s.ma_hs), "HS99"].map((x) => <option key={x}>{x}</option>)}</select>
              <select aria-label="Mã sách" value={bk} onChange={(e) => setBk(e.target.value)} className="rounded-lg border border-line bg-surface px-2 py-1.5">{[...BOOKS.map((b) => b.ma_sach), "S99"].map((x) => <option key={x}>{x}</option>)}</select>
            </div>
            <Button size="sm" className="w-full" onClick={addLoan}>Thêm phiếu</Button>
            <SimToggle label="Ràng buộc khóa ngoài" checked={fk} onChange={setFk} />
          </Panel>
          <Panel title="Sửa tên sách của phiếu đang chọn">
            <Input aria-label="Tên sách mới" placeholder={loan ? bookName(loan.ma_sach) ?? "" : ""} value={rename} onChange={(e) => setRename(e.target.value)} />
            <Button size="sm" variant="secondary" className="w-full" onClick={doRename}>Sửa 1 dòng ở bảng SÁCH</Button>
          </Panel>
          <div className="grid grid-cols-2 gap-2"><Readout label="Phiếu" value={db.loans.length} /><Readout label="Phiếu lỗi" value={db.loans.filter((l) => orphan(l as never)).length} tone="rose" /></div>
          <ResetAll onClick={() => { setDb(initialDb()); setPick(1); setFk(true); setView("csdl"); setMsg(null); setRename(""); }} />
        </>
      }
    />
  );
}

type Task = { kind: "col"; col: InfoColumn } | { kind: "key"; q: number } | { kind: "op"; op: number };
const TASKS: Task[] = [{ kind: "col", col: "ten_sach" }, { kind: "col", col: "ngay_muon" }, { kind: "key", q: 0 }, { kind: "key", q: 2 }, { kind: "op", op: 0 }, { kind: "op", op: 3 }];

function Game() {
  const c = useChallenge(TASKS.length);
  const t = TASKS[Math.min(c.idx, TASKS.length - 1)];
  const [choice, setChoice] = useState<string | null>(null);
  const [clash, setClash] = useState<[number, number] | null>(null);
  const key = `${c.run}-${c.idx}`;
  const [seen, setSeen] = useState(key);
  if (seen !== key) { setSeen(key); setChoice(null); setClash(null); }
  const op = t.kind === "op" ? DB_OPS[t.op] : undefined;
  const kq = t.kind === "key" ? KEY_QUESTIONS[t.q] : undefined;
  const prompt = t.kind === "col" ? `Cột “${COLUMN_LABEL[t.col]}” nên nằm ở bảng nào để không phải chép lại nhiều lần?` : t.kind === "key" ? `Chọn khóa chính cho bảng ${TABLE_LABEL[kq!.table]}.` : `Hệ quản trị CSDL sẽ cho phép hay từ chối? ${op!.text}`;
  const options: { id: string; label: string }[] = t.kind === "col" ? (Object.keys(TABLE_LABEL) as TableId[]).map((id) => ({ id, label: TABLE_LABEL[id] })) : t.kind === "key" ? kq!.options.map((o) => ({ id: o.id, label: o.label })) : [{ id: "ok", label: "Cho phép" }, { id: "no", label: "Từ chối" }];
  const check = () => {
    if (!choice) return c.check(false, "Chọn một phương án trước.");
    if (t.kind === "col") { const r = assignColumn(t.col, choice as TableId); return c.check(r.ok, r.message); }
    if (t.kind === "key") { const o = kq!.options.find((x) => x.id === choice)!; const r = checkKey(kq!.table, o.cols); setClash(r.clash ?? null); return c.check(r.ok, r.message); }
    const r = op!.run(initialDb()); const ok = (choice === "ok") === r.ok;
    return c.check(ok, r.message || (r.ok ? "Được phép." : "Bị từ chối."));
  };
  const rows = kq ? (kq.table === "hoc_sinh" ? STUDENTS : kq.table === "sach" ? BOOKS : LOANS) as unknown as Record<string, string | null>[] : [];
  return (
    <ChallengeFrame c={c} prompt={prompt} onCheck={check} summary={["Mỗi bảng lưu thông tin về một loại đối tượng; mỗi thông tin chỉ lưu một lần.", "Khóa chính xác định duy nhất mỗi dòng; khóa ngoài trỏ tới khóa chính của bảng khác.", "Hệ quản trị CSDL từ chối thao tác làm hỏng ràng buộc (trùng khóa, trỏ tới dòng không có)."]}>
      <Stage className="space-y-3 p-4">
        {op && <pre className="overflow-x-auto rounded-lg bg-slate-900 p-3 font-mono text-xs text-emerald-300">{op.sql}</pre>}
        {kq && <Table id={kq.table} cols={Object.keys(rows[0])} rows={rows} keyCol={choice && kq.options.find((o) => o.id === choice)?.cols.length === 1 ? kq.options.find((o) => o.id === choice)!.cols[0] : ""} bad={(r) => !!clash && (r === rows[clash[0]] || r === rows[clash[1]])} />}
        <div className="flex flex-wrap gap-2">{options.map((o) => <button key={o.id} type="button" aria-pressed={choice === o.id} onClick={() => setChoice(o.id)} className={cn("rounded-xl border-2 px-4 py-2 text-sm font-semibold", choice === o.id ? "border-brand bg-brand text-brand-ink" : "border-line bg-surface text-fg hover:border-brand/40")}>{o.label}</button>)}</div>
      </Stage>
    </ChallengeFrame>
  );
}

export function DatabaseCityLab() {
  return <SimShell title="Thành phố dữ liệu" screens={[{ id: "kham-pha", label: "Liên kết bảng", icon: Table2, render: () => <Explore /> }, { id: "thu-thach", label: "Thử thách", render: () => <Game /> }]} />;
}
