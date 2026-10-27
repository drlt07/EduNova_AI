"use client";
import { useState } from "react";
import { Database, KeyRound, Link2, ShieldCheck, Table2 } from "lucide-react";
import {
  COLUMN_LABEL, DB_OPS, INFO_COLUMNS, KEY_QUESTIONS, MESSY_LOG, TABLE_LABEL, assignColumn, checkKey, duplicateCount, initialDb,
  type Db, type InfoColumn, type TableId,
} from "@/lib/sim/library-db";
import { useTutorActivity } from "@/components/tutor/tutor-provider";
import { MissionDone, MissionLayout, type Feedback, type MissionStage } from "@/components/sim/mission";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const STAGES: MissionStage[] = [
  { id: "split", label: "Tách sổ thành bảng", icon: Table2 },
  { id: "keys", label: "Chọn khóa chính", icon: KeyRound },
  { id: "rules", label: "Ràng buộc", icon: ShieldCheck },
];
const TABLES: TableId[] = ["hoc_sinh", "sach", "phieu_muon"];
const KEYS: Record<TableId, string[]> = { hoc_sinh: ["ma_hs"], sach: ["ma_sach"], phieu_muon: ["ma_phieu", "ma_hs", "ma_sach"] };

function DataTable({ title, cols, rows, pk, fk = [], bad = [], flash = [] }: { title: string; cols: string[]; rows: Record<string, string | null>[]; pk?: string; fk?: string[]; bad?: number[]; flash?: number[] }) {
  return (
    <div className="min-w-0 overflow-hidden rounded-xl border border-slate-300 bg-white text-slate-900 shadow-sm">
      <p className="flex items-center gap-1.5 bg-slate-800 px-3 py-1.5 text-xs font-bold tracking-wide text-white"><Database className="size-3.5" aria-hidden /> {title}</p>
      <div className="overflow-x-auto">
        <table className="w-full text-[11px]">
          <thead className="bg-slate-100 text-left">
            <tr>{cols.map((c) => <th key={c} className="whitespace-nowrap px-2 py-1 font-semibold">{c === pk && "🔑 "}{fk.includes(c) && "🔗 "}{COLUMN_LABEL[c] ?? c}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className={cn("border-t border-slate-100 transition-colors", bad.includes(i) && "bg-red-100", flash.includes(i) && "bg-emerald-200 font-semibold")}>
                {cols.map((c) => <td key={c} className={cn("whitespace-nowrap px-2 py-1", (c === pk || fk.includes(c)) && "font-mono", c.endsWith("_tra_cuu") && "italic text-slate-500")}>{r[c] ?? <span className="text-slate-400">—</span>}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * Thành phố dữ liệu (Tin 11 – Bài 10–13): thư viện trường bỏ sổ ghi chép lộn xộn, dựng CSDL quan hệ —
 * tách cột thành bảng, chọn khóa chính bằng phản ví dụ, dự đoán thao tác nào bị ràng buộc chặn.
 */
export function DatabaseCityLab() {
  const [stage, setStage] = useState("split");
  const [placed, setPlaced] = useState<Partial<Record<InfoColumn, TableId>>>({});
  const [keyIdx, setKeyIdx] = useState(0);
  const [keyClash, setKeyClash] = useState<{ table: TableId; rows: number[] } | null>(null);
  const [keyDone, setKeyDone] = useState(false);
  const [db, setDb] = useState<Db>(initialDb);
  const [opIdx, setOpIdx] = useState(0);
  const [opResult, setOpResult] = useState<{ ok: boolean; predicted: boolean } | null>(null);
  const [flash, setFlash] = useState<Partial<Record<TableId, number[]>>>({});
  const [mistakes, setMistakes] = useState(0);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const nextCol = INFO_COLUMNS.find((c) => !placed[c]);
  const q = KEY_QUESTIONS[keyIdx];
  const op = DB_OPS[opIdx];

  const touchTutor = useTutorActivity("simulation", () => ({
    kind: "simulation",
    sim: "mô phỏng Thành phố dữ liệu (CSDL thư viện trường)",
    summary: stage === "split" ? `Đang tách sổ mượn thành bảng; cột đang xếp: ${nextCol ? COLUMN_LABEL[nextCol] : "xong"}.` : stage === "keys" ? `Đang chọn khóa chính cho bảng ${TABLE_LABEL[q.table]}.` : stage === "rules" ? `Thao tác: ${op.text}` : "Đã hoàn thành.",
    problems: feedback && !feedback.ok ? [feedback.text] : [],
    facts: { stage, mistakes },
  }), { title: "Thành phố dữ liệu · Tin 11", topic: "general", level: "free" });

  const wrong = (text: string) => { setMistakes((m) => m + 1); setFeedback({ ok: false, text }); };

  const place = (t: TableId) => {
    if (!nextCol) return;
    touchTutor();
    const r = assignColumn(nextCol, t);
    if (!r.ok) return wrong(r.message);
    setPlaced((p) => ({ ...p, [nextCol]: t }));
    setFeedback({ ok: true, text: r.message });
  };

  const pickKey = (cols: string[]) => {
    if (keyDone) return;
    touchTutor();
    const r = checkKey(q.table, cols);
    if (!r.ok) {
      setKeyClash(r.clash ? { table: q.table, rows: r.clash } : null);
      return wrong(r.message);
    }
    setKeyClash(null);
    setKeyDone(true);
    setFeedback({ ok: true, text: r.message });
  };

  const predict = (allowed: boolean) => {
    if (opResult) return;
    touchTutor();
    const r = op.run(db);
    if (r.ok !== allowed) setMistakes((m) => m + 1);
    setDb(r.db);
    // tô sáng chỗ thay đổi: sửa tên sách → dòng sách và mọi phiếu mượn tra tới nó; thêm học sinh → dòng mới
    if (op.id === "rename-book") setFlash({ sach: [r.db.books.findIndex((b) => b.ma_sach === "S01")], phieu_muon: r.db.loans.flatMap((l, i) => (l.ma_sach === "S01" ? [i] : [])) });
    else if (op.id === "new-student" && r.ok) setFlash({ hoc_sinh: [r.db.students.length - 1] });
    else setFlash({});
    setOpResult({ ok: r.ok, predicted: allowed });
    setFeedback({ ok: r.ok === allowed, text: (r.ok === allowed ? "Dự đoán đúng. " : "Dự đoán chưa đúng. ") + r.message });
  };

  const restart = () => {
    setStage("split"); setPlaced({}); setKeyIdx(0); setKeyClash(null); setKeyDone(false); setDb(initialDb()); setOpIdx(0); setOpResult(null); setFlash({}); setMistakes(0); setFeedback(null);
  };

  // dữ liệu hiển thị: bảng phiếu mượn kèm tên sách tra từ bảng SÁCH (để thấy lợi ích của việc sửa một chỗ)
  const tableRows = (t: TableId): Record<string, string | null>[] =>
    t === "hoc_sinh" ? db.students.map((x) => ({ ...x })) : t === "sach" ? db.books.map((x) => ({ ...x })) : db.loans.map((l) => ({ ...l, ten_sach_tra_cuu: db.books.find((b) => b.ma_sach === l.ma_sach)?.ten_sach ?? null }));
  /** Khóa chính của bảng đã được chọn xong (ở nhiệm vụ 2) hay chưa. */
  const keyShown = (t: TableId) => {
    if (stage === "split") return false;
    if (stage !== "keys") return true;
    const i = KEY_QUESTIONS.findIndex((x) => x.table === t);
    return i < keyIdx || (i === keyIdx && keyDone);
  };
  const colsOf = (t: TableId) => [
    ...KEYS[t].filter((k) => !(t === "phieu_muon" && k === "ma_phieu" && !keyShown(t))),
    ...INFO_COLUMNS.filter((c) => (stage === "split" ? placed[c] === t : assignColumn(c, t).ok)),
    // nhiệm vụ 3: phiếu mượn hiện tên sách tra từ bảng SÁCH (không lưu lại) để thấy lợi ích của việc sửa một chỗ
    ...(t === "phieu_muon" && stage !== "split" && stage !== "keys" ? ["ten_sach_tra_cuu"] : []),
  ];

  const scene = (
    <div className="space-y-3 rounded-2xl border border-line bg-gradient-to-br from-[#ecfeff] to-[#eef2ff] p-3">
      {stage === "split" && (
        <>
          <div>
            <p className="mb-1.5 text-xs font-semibold text-slate-600">📒 Sổ mượn sách cũ — mỗi lần mượn chép lại toàn bộ thông tin ({duplicateCount()} lần chép lặp tên sách, 1 lần chép sai)</p>
            <DataTable
              title="SỔ MƯỢN (bảng tính cũ)"
              cols={["ma_hs", "ho_ten", "lop", "ma_sach", "ten_sach", "tac_gia", "ngay_muon", "ngay_tra"]}
              rows={MESSY_LOG}
              bad={MESSY_LOG.map((r, i) => (r.ten_sach !== "Dế Mèn phiêu lưu ký" && r.ma_sach === "S01" ? i : -1)).filter((i) => i >= 0)}
            />
          </div>
          <div className="grid gap-2 md:grid-cols-3">
            {TABLES.map((t) => (
              <div key={t} className="rounded-xl border-2 border-dashed border-slate-300 bg-white/70 p-2">
                <p className="text-xs font-bold text-slate-700">{TABLE_LABEL[t]}</p>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {colsOf(t).map((c) => <span key={c} className={cn("rounded-md px-1.5 py-0.5 text-[11px] font-medium", KEYS[t].includes(c) ? "bg-amber-100 text-amber-800" : "bg-cyan-100 text-cyan-800")}>{COLUMN_LABEL[c]}</span>)}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
      {stage !== "split" && (
        <div className="grid gap-3 xl:grid-cols-2">
          {TABLES.map((t) => (
            <div key={t} className={cn(t === "phieu_muon" && "xl:col-span-2")}>
              <DataTable
                title={TABLE_LABEL[t]}
                cols={colsOf(t)}
                rows={tableRows(t)}
                pk={keyShown(t) ? KEYS[t][0] : undefined}
                fk={t === "phieu_muon" && stage !== "keys" ? ["ma_hs", "ma_sach"] : []}
                bad={keyClash?.table === t ? keyClash.rows : []}
                flash={flash[t] ?? []}
              />
            </div>
          ))}
          {stage !== "keys" && <p className="flex items-center gap-1.5 text-xs text-slate-600 xl:col-span-2"><Link2 className="size-3.5" aria-hidden /> 🔗 Khóa ngoài: phieu_muon.ma_hs → hoc_sinh.ma_hs · phieu_muon.ma_sach → sach.ma_sach</p>}
        </div>
      )}
    </div>
  );

  return (
    <MissionLayout scene={scene} stages={STAGES} current={stage} feedback={feedback} mistakes={mistakes}>
      {stage === "split" && (
        <>
          <h3 className="font-semibold text-fg">Nhiệm vụ 1 · Bỏ sổ, lập bảng</h3>
          <p className="mt-1 text-sm text-muted">Sổ cũ chép tên sách nhiều lần nên có lần viết sai. Hãy xếp mỗi cột thông tin vào đúng bảng để mỗi thông tin chỉ lưu <b>một lần</b>. Mã HS, mã sách đã có sẵn làm cầu nối.</p>
          {nextCol ? (
            <>
              <p className="mt-3 text-sm">Cột <b className="rounded bg-cyan/15 px-1.5 text-cyan-fg">{COLUMN_LABEL[nextCol]}</b> thuộc bảng nào?</p>
              <div className="mt-2 grid grid-cols-3 gap-1.5">{TABLES.map((t) => <Button key={t} size="sm" variant="secondary" onClick={() => place(t)}>{TABLE_LABEL[t]}</Button>)}</div>
            </>
          ) : (
            <Button size="sm" className="mt-3" onClick={() => { setStage("keys"); setFeedback(null); }}>Nhiệm vụ tiếp theo →</Button>
          )}
        </>
      )}
      {stage === "keys" && (
        <>
          <h3 className="font-semibold text-fg">Nhiệm vụ 2 · Khóa chính của bảng {TABLE_LABEL[q.table]}</h3>
          <p className="mt-1 text-sm text-muted">Khóa chính phải phân biệt được mọi dòng. Thử một lựa chọn — nếu sai, hai dòng trùng sẽ được tô đỏ.</p>
          <div className="mt-3 space-y-1.5">{q.options.map((o) => <Button key={o.id} size="sm" variant="secondary" className="w-full justify-start" disabled={keyDone} onClick={() => pickKey(o.cols)}>{o.label}</Button>)}</div>
          {keyDone && (
            <Button size="sm" className="mt-3" onClick={() => { setKeyDone(false); setFeedback(null); if (keyIdx + 1 < KEY_QUESTIONS.length) setKeyIdx(keyIdx + 1); else setStage("rules"); }}>
              {keyIdx + 1 < KEY_QUESTIONS.length ? "Bảng tiếp theo →" : "Nhiệm vụ tiếp theo →"}
            </Button>
          )}
        </>
      )}
      {stage === "rules" && (
        <>
          <h3 className="font-semibold text-fg">Nhiệm vụ 3 · Hệ quản trị CSDL có cho phép? ({opIdx + 1}/{DB_OPS.length})</h3>
          <p className="mt-2 text-sm text-fg">{op.text}</p>
          <pre className="mt-2 overflow-x-auto rounded-lg bg-[#0b1220] p-2 font-mono text-[11px] text-slate-200">{op.sql}</pre>
          <div className="mt-3 grid grid-cols-2 gap-1.5">
            <Button size="sm" variant={opResult?.predicted === true ? "primary" : "secondary"} disabled={!!opResult} onClick={() => predict(true)}>Được phép</Button>
            <Button size="sm" variant={opResult?.predicted === false ? "primary" : "secondary"} disabled={!!opResult} onClick={() => predict(false)}>Bị từ chối</Button>
          </div>
          {opResult && <Button size="sm" className="mt-3" onClick={() => { setOpResult(null); setFlash({}); setFeedback(null); if (opIdx + 1 < DB_OPS.length) setOpIdx(opIdx + 1); else setStage("done"); }}>{opIdx + 1 < DB_OPS.length ? "Thao tác tiếp →" : "Xem kết quả"}</Button>}
        </>
      )}
      {stage === "done" && (
        <MissionDone
          mistakes={mistakes}
          title="Thư viện đã có CSDL gọn gàng!"
          onRestart={restart}
          points={[
            <>Tách bảng để mỗi thông tin chỉ lưu một lần: sửa một chỗ, mọi nơi đều đúng.</>,
            <><b>Khóa chính</b> phân biệt mọi dòng (mã HS, mã sách, mã phiếu) — họ tên hay tên sách có thể trùng.</>,
            <><b>Khóa ngoài</b> chỉ nhận giá trị có thật ở bảng kia; không xóa được dòng đang được tham chiếu.</>,
          ]}
        />
      )}
    </MissionLayout>
  );
}
