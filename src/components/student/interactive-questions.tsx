"use client";
import { Droplets, Lightbulb, Power } from "lucide-react";
import type { PracticeQuestion, Widget } from "@/lib/data/practice";
import { shuffled, type Answer } from "@/lib/practice/grade";
import { cn } from "@/lib/utils";

type Props<K extends PracticeQuestion["kind"]> = { q: Extract<PracticeQuestion, { kind: K }>; answer: Answer; onAnswer: (a: Answer) => void; disabled?: boolean };

/** Chọn nhiều đáp án. */
export function MultiQuestion({ q, answer, onAnswer, disabled }: Props<"multi">) {
  const picked = new Set(Array.isArray(answer) ? (answer as number[]) : []);
  return (
    <fieldset disabled={disabled} className="space-y-2">
      <legend className="text-sm text-muted">Chọn tất cả đáp án đúng</legend>
      <div className="grid gap-2 sm:grid-cols-2">
        {q.options.map((o, k) => (
          <label key={o} className={cn("flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2.5 text-sm text-fg transition-colors", picked.has(k) ? "border-brand/60 bg-brand/10" : "border-line hover:border-brand/30")}>
            <input type="checkbox" checked={picked.has(k)} onChange={() => { const n = new Set(picked); if (n.has(k)) n.delete(k); else n.add(k); onAnswer([...n].sort((a, b) => a - b)); }} className="size-4 accent-[var(--brand)]" />
            {o}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/** Ghép nối: mỗi vế trái chọn một vế phải. */
export function MatchQuestion({ q, answer, onAnswer, disabled }: Props<"match">) {
  const got = Array.isArray(answer) ? (answer as string[]) : q.pairs.map(() => "");
  const rights = shuffled([...new Set(q.pairs.map((p) => p[1]))], q.id);
  return (
    <ul className="space-y-2">
      {q.pairs.map(([l], i) => (
        <li key={l} className="grid items-center gap-2 rounded-xl border border-line bg-surface p-2 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
          <span className="px-2 font-medium text-fg">{l}</span>
          <span aria-hidden className="hidden text-muted sm:block">→</span>
          <select aria-label={`Ghép với “${l}”`} disabled={disabled} value={got[i] ?? ""} onChange={(e) => { const n = [...got]; n[i] = e.target.value; onAnswer(n); }} className="h-10 w-full rounded-lg border border-line bg-surface-2 px-2 text-sm text-fg">
            <option value="">— Chọn —</option>
            {rights.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </li>
      ))}
    </ul>
  );
}

/** Điền khuyết: ô nhập ngay trong đoạn mã hoặc câu. */
export function BlankQuestion({ q, answer, onAnswer, disabled }: Props<"blank">) {
  const got = Array.isArray(answer) ? (answer as string[]) : q.answers.map(() => "");
  const parts = q.text.split("___");
  return (
    <div className="overflow-x-auto rounded-xl bg-[#0B1220] p-4 font-mono text-[14px] leading-8 text-slate-200 [font-variant-ligatures:none]">
      <p className="whitespace-pre">
        {parts.map((p, i) => (
          <span key={i}>
            {p}
            {i < parts.length - 1 && <input aria-label={`Chỗ trống ${i + 1}`} disabled={disabled} value={got[i] ?? ""} onChange={(e) => { const n = [...got]; n[i] = e.target.value; onAnswer(n); }} size={Math.max(3, (got[i] ?? "").length + 1)} autoComplete="off" spellCheck={false} className="mx-0.5 rounded-md border border-cyan-400/50 bg-white/10 px-1.5 text-center text-cyan-200 outline-none focus:border-cyan-300" />}
          </span>
        ))}
      </p>
    </div>
  );
}

/** Câu thao tác trực tiếp trên một mô hình nhỏ. Câu trả lời là chuỗi trạng thái. */
export function WidgetQuestion({ q, answer, onAnswer, disabled }: Props<"interactive">) {
  const w = q.widget;
  const a = typeof answer === "string" ? answer : "";
  switch (w.type) {
    case "bits": return <Bits w={w} value={a || "0".repeat(w.width)} onChange={onAnswer} disabled={disabled} />;
    case "gate": return <Gate w={w} value={a || "????"} onChange={onAnswer} disabled={disabled} />;
    case "pump": return <Pump w={w} value={a || "?".repeat(w.readings.length)} onChange={onAnswer} disabled={disabled} />;
    case "sqlrows": return <SqlRows w={w} value={a} onChange={onAnswer} disabled={disabled} />;
    case "flag": return <Flag w={w} value={a} onChange={onAnswer} disabled={disabled} />;
  }
}

type W<T extends Widget["type"]> = { w: Extract<Widget, { type: T }>; value: string; onChange: (a: Answer) => void; disabled?: boolean };
const setAt = (s: string, i: number, c: string) => s.slice(0, i) + c + s.slice(i + 1);
const idxList = (s: string) => (s ? s.split(",").map(Number) : []);

function Bits({ w, value, onChange, disabled }: W<"bits">) {
  const dec = parseInt(value, 2);
  return (
    <div className="rounded-2xl border border-line bg-[#0f172a] p-4 text-white">
      <div className="flex flex-wrap justify-center gap-2">
        {value.split("").map((b, i) => (
          <button key={i} type="button" disabled={disabled} aria-pressed={b === "1"} aria-label={`Bit giá trị ${2 ** (w.width - 1 - i)}: ${b}`} onClick={() => onChange(setAt(value, i, b === "1" ? "0" : "1"))} className="flex w-12 flex-col items-center gap-1 rounded-xl p-1.5 hover:bg-white/5">
            <span className={cn("grid size-10 place-items-center rounded-full font-mono text-lg font-bold transition-colors", b === "1" ? "bg-yellow-300 text-slate-900 shadow-[0_0_18px_rgba(253,224,71,0.6)]" : "bg-slate-700 text-slate-300")}>{b}</span>
            <span className="font-mono text-[11px] text-cyan-300">{2 ** (w.width - 1 - i)}</span>
          </button>
        ))}
      </div>
      <p className="mt-3 text-center font-mono text-sm text-slate-300">{value}₂ = <b className="text-xl text-white">{dec}</b> <span className="text-slate-400">(cần {w.target})</span></p>
    </div>
  );
}

function Gate({ w, value, onChange, disabled }: W<"gate">) {
  return (
    <div className="overflow-hidden rounded-2xl border border-line">
      <p className="bg-[#0f172a] px-4 py-2 font-mono text-sm text-cyan-200">Cổng {w.gate}: đầu vào A, B → đèn Y</p>
      <table className="w-full text-center text-sm">
        <thead className="bg-surface-2 text-muted"><tr><th className="py-2">A</th><th>B</th><th>Y (bấm để đổi)</th></tr></thead>
        <tbody>
          {[[0, 0], [0, 1], [1, 0], [1, 1]].map(([x, y], i) => {
            const v = value[i];
            return (
              <tr key={i} className="border-t border-line">
                <td className="py-2 font-mono font-semibold text-fg">{x}</td>
                <td className="font-mono font-semibold text-fg">{y}</td>
                <td>
                  <button type="button" disabled={disabled} aria-label={`Dòng A=${x}, B=${y}: đèn ${v === "1" ? "sáng" : v === "0" ? "tắt" : "chưa chọn"}`} onClick={() => onChange(setAt(value, i, v === "1" ? "0" : "1"))} className="mx-auto my-1 flex items-center gap-2 rounded-xl px-3 py-1 hover:bg-surface-2">
                    <Lightbulb className={cn("size-6", v === "1" ? "fill-yellow-300 text-yellow-500" : v === "0" ? "text-slate-400" : "text-slate-300")} aria-hidden />
                    <span className="w-4 font-mono font-bold text-fg">{v === "?" ? "?" : v}</span>
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Pump({ w, value, onChange, disabled }: W<"pump">) {
  return (
    <div className="space-y-3">
      <pre className="rounded-xl bg-[#0f172a] px-4 py-2 font-mono text-sm text-slate-200 [font-variant-ligatures:none]">{`if humidity < ${w.threshold}${w.needWater ? " and has_water" : ""}:\n    pump = "BẬT"\nelse:\n    pump = "TẮT"`}</pre>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {w.readings.map((r, i) => {
          const v = value[i];
          return (
            <li key={i} className="rounded-2xl border border-line bg-gradient-to-b from-sky-50 to-amber-50 p-3 dark:from-slate-800 dark:to-slate-900">
              <p className="text-xs font-semibold text-muted">Lần đo {i + 1}</p>
              <div className="mt-2 flex items-end gap-3">
                <div className="flex-1">
                  <p className="text-xs text-muted">Độ ẩm đất</p>
                  <div className="mt-1 h-3 rounded-full bg-amber-200"><div className="h-full rounded-full bg-sky-500" style={{ width: `${r.humidity}%` }} /></div>
                  <p className="mt-1 font-mono text-sm font-bold text-fg">{r.humidity}%</p>
                </div>
                <div className="text-center">
                  <Droplets className={cn("mx-auto size-6", r.water ? "text-sky-500" : "text-slate-300")} aria-hidden />
                  <p className="text-[11px] text-muted">{r.water ? "bình còn nước" : "bình cạn"}</p>
                </div>
              </div>
              <button type="button" disabled={disabled} aria-pressed={v === "1"} onClick={() => onChange(setAt(value, i, v === "1" ? "0" : "1"))} className={cn("mt-3 flex w-full items-center justify-center gap-2 rounded-xl py-2 text-sm font-bold transition-colors", v === "1" ? "bg-[#059669] text-white" : v === "0" ? "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200" : "border border-dashed border-line text-muted")}>
                <Power className="size-4" aria-hidden /> Máy bơm: {v === "1" ? "BẬT" : v === "0" ? "TẮT" : "chưa chọn"}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function SqlRows({ w, value, onChange, disabled }: W<"sqlrows">) {
  const picked = new Set(idxList(value));
  const toggle = (i: number) => { const n = new Set(picked); if (n.has(i)) n.delete(i); else n.add(i); onChange([...n].sort((a, b) => a - b).join(",")); };
  return (
    <div className="space-y-3">
      <pre className="overflow-x-auto rounded-xl bg-[#0f172a] px-4 py-3 font-mono text-sm text-cyan-200 [font-variant-ligatures:none]">{w.query}</pre>
      <div className="overflow-x-auto rounded-xl border border-line">
        <table className="w-full text-sm">
          <thead className="bg-surface-2 text-left text-muted"><tr><th className="w-12 px-3 py-2">Lấy?</th>{w.columns.map((c) => <th key={c} className="px-3 py-2 font-mono">{c}</th>)}</tr></thead>
          <tbody>
            {w.rows.map((r, i) => (
              <tr key={i} className={cn("border-t border-line", picked.has(i) && "bg-brand/10")}>
                <td className="px-3 py-2"><input type="checkbox" disabled={disabled} checked={picked.has(i)} onChange={() => toggle(i)} aria-label={`Dòng ${i + 1}: ${r.join(", ")}`} className="size-4 accent-[var(--brand)]" /></td>
                {r.map((c, j) => <td key={j} className="px-3 py-2 font-mono text-fg">{c}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Flag({ w, value, onChange, disabled }: W<"flag">) {
  const picked = new Set(idxList(value));
  return (
    <div className="rounded-2xl border border-line bg-surface-2 p-4">
      <p className="text-xs text-muted">Bấm vào từng phần để đánh dấu; bấm lại để bỏ.</p>
      <p className="mt-2 rounded-2xl rounded-tl-sm bg-surface p-4 text-[15px] leading-8 text-fg shadow-sm">
        {w.parts.map((p, i) => (
          <button key={i} type="button" disabled={disabled} aria-pressed={picked.has(i)} onClick={() => { const n = new Set(picked); if (n.has(i)) n.delete(i); else n.add(i); onChange([...n].sort((a, b) => a - b).join(",")); }} className={cn("mx-px rounded border-b-2 border-dashed px-1 text-left transition-colors", picked.has(i) ? "border-danger bg-danger/20 text-danger-fg" : "border-line hover:border-warning hover:bg-warning/15")}>
            {p.text}
          </button>
        ))}
      </p>
    </div>
  );
}
