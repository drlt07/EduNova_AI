"use client";
/**
 * Tin 10 Bài 3 – Phòng mã hóa văn bản (kiểu PhET).
 * Gõ chữ: mỗi kí tự thành một thẻ có mã (ASCII / Unicode), các byte UTF-8 và các bit.
 * Đổi bảng mã ASCII ↔ UTF-8 để thấy chữ Việt có dấu không có trong ASCII và cần 2–3 byte trong UTF-8.
 * Thử thách: đếm byte, đọc kí tự từ mã, so sánh độ dài.
 */
import { useState } from "react";
import { Binary, Type } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/form";
import { ChallengeFrame, Panel, Readout, ResetAll, Segmented, SimLayout, SimShell, SimToggle, Stage, useChallenge } from "./kit";

const enc = new TextEncoder();
const bytesOf = (ch: string) => [...enc.encode(ch)];
const hex = (n: number) => n.toString(16).toUpperCase().padStart(2, "0");
const BYTE_COLOR = ["#2563eb", "#7c3aed", "#db2777", "#ea580c"];

function CharCard({ ch, mode, bits, sel, onSel }: { ch: string; mode: "ascii" | "utf8"; bits: boolean; sel: boolean; onSel: () => void }) {
  const cp = ch.codePointAt(0)!;
  const bs = bytesOf(ch);
  const inAscii = cp < 128;
  return (
    <button type="button" onClick={onSel} aria-pressed={sel} className={cn("flex min-w-16 flex-col items-center rounded-xl border-2 bg-white p-2 text-slate-900 shadow-sm transition-all dark:bg-slate-900 dark:text-slate-100", sel ? "border-brand ring-4 ring-brand/20" : "border-slate-200 dark:border-slate-700", mode === "ascii" && !inAscii && "border-rose-400 bg-rose-50 dark:bg-rose-500/10")}>
      <span className="text-2xl font-bold">{ch === " " ? "␣" : ch}</span>
      <span className="font-mono text-[11px] text-slate-500">{mode === "ascii" ? (inAscii ? cp : "không có") : `U+${cp.toString(16).toUpperCase().padStart(4, "0")}`}</span>
      {(mode === "utf8" || inAscii) && <span className="mt-1 flex gap-0.5">{(mode === "ascii" ? [cp] : bs).map((b, i) => <span key={i} className="rounded px-1 font-mono text-[10px] font-bold text-white" style={{ background: BYTE_COLOR[i] }}>{hex(b)}</span>)}</span>}
      {bits && (mode === "utf8" || inAscii) && <span className="mt-1 space-y-0.5">{(mode === "ascii" ? [cp] : bs).map((b, i) => <span key={i} className="block font-mono text-[9px] tracking-tight" style={{ color: BYTE_COLOR[i] }}>{b.toString(2).padStart(8, "0")}</span>)}</span>}
    </button>
  );
}

function Explore() {
  const [text, setText] = useState("Tin học");
  const [mode, setMode] = useState<"ascii" | "utf8">("utf8");
  const [bits, setBits] = useState(false);
  const [sel, setSel] = useState(0);
  const chars = [...text].slice(0, 24);
  const total = chars.reduce((s, ch) => s + bytesOf(ch).length, 0);
  const bad = chars.filter((ch) => ch.codePointAt(0)! >= 128).length;
  const cur = chars[Math.min(sel, chars.length - 1)];
  return (
    <SimLayout
      stage={
        <Stage className="space-y-4 p-4">
          <div className="flex flex-wrap justify-center gap-2">{chars.map((ch, i) => <CharCard key={i} ch={ch} mode={mode} bits={bits} sel={i === sel} onSel={() => setSel(i)} />)}</div>
          {cur && (
            <div className="rounded-2xl bg-slate-900 p-4 text-center text-white">
              <p className="text-sm text-slate-300">Kí tự <b className="text-2xl text-white">{cur}</b> có mã Unicode {cur.codePointAt(0)} (U+{cur.codePointAt(0)!.toString(16).toUpperCase().padStart(4, "0")})</p>
              <p className="mt-2 text-sm">{mode === "ascii" ? (cur.codePointAt(0)! < 128 ? "Có trong bảng ASCII: dùng đúng 1 byte (7 bit có nghĩa)." : "ASCII chỉ có 128 kí tự (chữ Latinh không dấu, số, dấu câu): không mã hóa được chữ này!") : `UTF-8 dùng ${bytesOf(cur).length} byte cho kí tự này.`}</p>
            </div>
          )}
          {mode === "ascii" && bad > 0 && <p role="status" className="rounded-xl bg-rose-500/10 px-3 py-2 text-sm text-danger-fg">{bad} kí tự không có trong ASCII — văn bản sẽ hiện thành “?”: {chars.map((ch) => (ch.codePointAt(0)! < 128 ? ch : "?")).join("")}</p>}
        </Stage>
      }
      controls={
        <>
          <Panel title="Văn bản">
            <Input aria-label="Văn bản" value={text} onChange={(e) => { setText(e.target.value); setSel(0); }} placeholder="Gõ chữ bất kì" />
            <div className="flex flex-wrap gap-1">{["Tin học", "ABC 123", "Việt Nam", "😀 ok"].map((x) => <button key={x} type="button" onClick={() => { setText(x); setSel(0); }} className="rounded-lg bg-surface px-2 py-1 text-xs hover:bg-line">{x}</button>)}</div>
          </Panel>
          <Panel title="Bảng mã">
            <Segmented label="Mã hóa bằng" value={mode} options={[{ value: "ascii", label: "ASCII" }, { value: "utf8", label: "Unicode UTF-8" }]} onChange={setMode} />
            <SimToggle label="Hiện các bit" checked={bits} onChange={setBits} />
          </Panel>
          <div className="grid grid-cols-2 gap-2"><Readout label="Kí tự" value={chars.length} /><Readout label="Dung lượng" value={mode === "ascii" ? `${chars.length} B` : `${total} B`} tone="green" /></div>
          <ResetAll onClick={() => { setText("Tin học"); setMode("utf8"); setBits(false); setSel(0); }} />
        </>
      }
    />
  );
}

type Task = { kind: "bytes"; word: string } | { kind: "read"; code: number } | { kind: "ascii"; word: string };
const TASKS: Task[] = [{ kind: "bytes", word: "Tin" }, { kind: "read", code: 65 }, { kind: "bytes", word: "Hà" }, { kind: "ascii", word: "Toán" }, { kind: "bytes", word: "Việt" }];

function Game() {
  const c = useChallenge(TASKS.length);
  const t = TASKS[Math.min(c.idx, TASKS.length - 1)];
  const [typed, setTyped] = useState("");
  const [peek, setPeek] = useState(false);
  const key = `${c.run}-${c.idx}`;
  const [seen, setSeen] = useState(key);
  if (seen !== key) { setSeen(key); setTyped(""); setPeek(false); }
  const prompt = t.kind === "bytes" ? `Mã hóa “${t.word}” bằng UTF-8 cần bao nhiêu byte?` : t.kind === "read" ? `Kí tự nào có mã ${t.code} trong bảng ASCII? (gợi ý: “a” là 97, “A” đứng trước 32 vị trí)` : `Gửi chữ “${t.word}” bằng ASCII thì chữ nào bị lỗi? Gõ đúng chữ cái đó.`;
  const check = () => {
    if (t.kind === "bytes") { const n = enc.encode(t.word).length; const ok = Number(typed) === n; return c.check(ok, ok ? `Đúng: ${[...t.word].map((ch) => `${ch}→${bytesOf(ch).length}`).join(", ")} = ${n} byte.` : "Chữ Latinh không dấu cần 1 byte; chữ có dấu tiếng Việt cần 2 hoặc 3 byte."); }
    if (t.kind === "read") { const ok = typed === String.fromCharCode(t.code); return c.check(ok, ok ? "Đúng: 65 là “A”." : "97 − 32 = 65. Chữ hoa đứng trước chữ thường 32 vị trí."); }
    const badCh = [...t.word].find((ch) => ch.codePointAt(0)! >= 128)!;
    return c.check(typed === badCh, typed === badCh ? `Đúng: “${badCh}” không có trong 128 kí tự ASCII.` : "Tìm chữ có dấu.");
  };
  return (
    <ChallengeFrame c={c} prompt={prompt} onCheck={check} summary={["Mỗi kí tự được gán một mã số; máy lưu mã số đó dưới dạng bit.", "ASCII có 128 kí tự, mỗi kí tự 1 byte; không có chữ Việt có dấu.", "Unicode chứa chữ của mọi ngôn ngữ; UTF-8 dùng 1–4 byte mỗi kí tự."]}>
      <Stage className="space-y-3 p-4">
        <Input aria-label="Câu trả lời" className="max-w-48 text-center font-mono text-lg" value={typed} onChange={(e) => setTyped(e.target.value.trim())} />
        {t.kind !== "read" && c.feedback && !c.feedback.ok && <button type="button" onClick={() => setPeek(!peek)} className="text-sm font-medium text-cyan-fg hover:underline">{peek ? "Ẩn" : "Xem"} từng kí tự</button>}
        {peek && t.kind !== "read" && <div className="flex flex-wrap gap-2">{[...t.word].map((ch, i) => <CharCard key={i} ch={ch} mode={t.kind === "ascii" ? "ascii" : "utf8"} bits={false} sel={false} onSel={() => {}} />)}</div>}
      </Stage>
    </ChallengeFrame>
  );
}

export function TextEncodingLab() {
  return <SimShell title="Phòng mã hóa văn bản" screens={[{ id: "kham-pha", label: "Mã hóa", icon: Type, render: () => <Explore /> }, { id: "thu-thach", label: "Thử thách", icon: Binary, render: () => <Game /> }]} />;
}
