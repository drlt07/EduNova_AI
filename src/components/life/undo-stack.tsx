"use client";
/** Hoàn tác Ctrl+Z: mỗi thao tác đẩy vào ngăn xếp; Ctrl+Z lấy thao tác mới nhất ra, Ctrl+Y đưa lại; thao tác mới xóa ngăn Làm lại. */
import { useState } from "react";
import { Layers, Redo2, Trash2, Undo2, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { actLabel, diagnoseEdits, runEdits, type EditAct } from "@/lib/sim/life-computer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form";
import { ChallengeFrame, Panel, ResetAll, SimLayout, SimShell, Stage, useChallenge } from "@/components/phet/kit";

const WORDS = ["Hôm ", "nay ", "em ", "học ", "Tin ", "rất ", "vui "];

/** Một chồng đĩa: phần tử trên cùng là thao tác sẽ bị lấy ra trước. */
function Stack({ title, items, tone }: { title: string; items: EditAct[]; tone: "violet" | "amber" }) {
  const c = tone === "violet" ? "bg-violet-500 text-white" : "bg-amber-400 text-amber-950";
  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <p className="mb-1 text-center text-xs font-semibold uppercase tracking-wide text-muted">{title}</p>
      <div className="flex min-h-56 flex-col-reverse items-stretch gap-1 rounded-b-2xl border-x-4 border-b-4 border-slate-300 px-2 pb-2 pt-6 dark:border-slate-600">
        {items.map((a, i) => (
          <div key={`${i}-${actLabel(a)}`} className={cn("sim-pop truncate rounded-lg px-2 py-1.5 text-center text-xs font-semibold shadow-sm", c, i === items.length - 1 && "ring-2 ring-offset-2 ring-offset-surface " + (tone === "violet" ? "ring-violet-300" : "ring-amber-300"))}>
            {actLabel(a)}{i === items.length - 1 && <span className="ml-1 opacity-70">← trên cùng</span>}
          </div>
        ))}
        {items.length === 0 && <p className="text-center text-xs text-muted">trống</p>}
      </div>
    </div>
  );
}

function Explore() {
  const [acts, setActs] = useState<EditAct[]>([]);
  const st = runEdits(acts);
  const push = (a: EditAct) => setActs((x) => [...x, a]);
  const text = st.words.join("");
  return (
    <SimLayout
      stage={
        <Stage className="space-y-4 p-4">
          <div
            tabIndex={0}
            aria-label="Trang soạn thảo. Dùng Ctrl+Z để hoàn tác, Ctrl+Y để làm lại."
            onKeyDown={(e) => { if (e.ctrlKey || e.metaKey) { const k = e.key.toLowerCase(); if (k === "z") { e.preventDefault(); push({ kind: "undo" }); } if (k === "y") { e.preventDefault(); push({ kind: "redo" }); } } }}
            className="min-h-24 rounded-2xl border-2 border-line bg-white p-4 font-serif text-2xl text-slate-900 shadow-inner outline-none focus-visible:border-brand"
          >
            {text || <span className="text-slate-400">Trang trống…</span>}<span className="ml-0.5 inline-block h-7 w-0.5 translate-y-1 animate-pulse bg-slate-900" />
          </div>
          <div className="flex gap-3">
            <Stack title="Ngăn Hoàn tác (Ctrl+Z)" items={st.undo} tone="violet" />
            <Stack title="Ngăn Làm lại (Ctrl+Y)" items={st.redo} tone="amber" />
          </div>
        </Stage>
      }
      controls={
        <>
          <Panel title="Gõ thêm một từ">
            <div className="flex flex-wrap gap-1.5">{WORDS.map((w) => <button key={w} type="button" onClick={() => push({ kind: "type", word: w })} className="rounded-lg border border-line bg-surface px-2.5 py-1 text-sm font-medium hover:border-brand hover:bg-brand/10">{w.trim()}</button>)}</div>
            <Button size="sm" variant="secondary" onClick={() => push({ kind: "del" })} disabled={!st.words.length}><Trash2 /> Xóa từ cuối</Button>
          </Panel>
          <Panel title="Hoàn tác / làm lại">
            <div className="flex gap-2">
              <Button size="sm" onClick={() => push({ kind: "undo" })} disabled={!st.undo.length}><Undo2 /> Ctrl+Z</Button>
              <Button size="sm" variant="secondary" onClick={() => push({ kind: "redo" })} disabled={!st.redo.length}><Redo2 /> Ctrl+Y</Button>
            </div>
            <p className="text-xs text-muted">Bấm vào trang soạn thảo rồi dùng phím Ctrl+Z, Ctrl+Y thật cũng được.</p>
          </Panel>
          <Panel title="Đã thao tác">
            <ol className="max-h-32 space-y-0.5 overflow-auto font-mono text-xs text-muted">{acts.map((a, i) => <li key={i}>{i + 1}. {actLabel(a)}</li>)}</ol>
          </Panel>
          <ResetAll onClick={() => setActs([])} />
        </>
      }
    />
  );
}

const T = (w: string): EditAct => ({ kind: "type", word: `${w} ` });
const Z: EditAct = { kind: "undo" }, Y: EditAct = { kind: "redo" }, D: EditAct = { kind: "del" };
const TASKS: { prompt: string; acts: EditAct[] }[] = [
  { prompt: "Sau chuỗi thao tác này, trên trang còn chữ gì?", acts: [T("Hôm"), T("nay"), T("trời"), Z] },
  { prompt: "Ctrl+Z hai lần rồi Ctrl+Y một lần. Trang còn chữ gì?", acts: [T("A"), T("B"), T("C"), Z, Z, Y] },
  { prompt: "Lần này có một thao tác mới chen giữa. Trang còn chữ gì?", acts: [T("Tin"), T("học"), Z, T("hay"), Y] },
  { prompt: "Hoàn tác cả lệnh xóa. Trang còn chữ gì?", acts: [T("Em"), T("thích"), D, T("yêu"), Z, Z] },
];

function Game() {
  const c = useChallenge(TASKS.length);
  const t = TASKS[Math.min(c.idx, TASKS.length - 1)];
  const [typed, setTyped] = useState("");
  const key = `${c.run}-${c.idx}`; const [seen, setSeen] = useState(key);
  if (seen !== key) { setSeen(key); setTyped(""); }
  const diag = diagnoseEdits(typed, t.acts);
  const result = runEdits(t.acts).words.join("").trim();
  const check = () => c.check(diag.ok, diag.ok ? `Đúng: “${result}”.` : `Chưa đúng — ${diag.error}. Mở màn Khám phá và làm lại đúng các thao tác để kiểm chứng.`, { answer: typed.trim().toLowerCase(), error: diag.error });
  return (
    <ChallengeFrame c={c} prompt={t.prompt} onCheck={check} hints={diag.hints} summary={SUMMARY} next="Bộ nhớ đệm trình duyệt — vì sao trang web lần sau mở nhanh hơn.">
      <Stage className="space-y-4 p-4">
        <ol className="flex flex-wrap items-center gap-1.5">
          {t.acts.map((a, i) => <li key={i} className={cn("rounded-lg px-2.5 py-1.5 text-sm font-semibold", a.kind === "type" ? "bg-surface text-fg shadow-sm" : a.kind === "del" ? "bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-200" : a.kind === "undo" ? "bg-violet-500 text-white" : "bg-amber-400 text-amber-950")}>{i + 1}. {actLabel(a)}</li>)}
        </ol>
        <label className="mx-auto block max-w-md">
          <span className="mb-1 block text-sm font-semibold text-fg">Chữ còn lại trên trang</span>
          <Input value={typed} onChange={(e) => setTyped(e.target.value)} placeholder="Gõ đúng các từ còn lại" className="font-serif text-xl" />
        </label>
      </Stage>
    </ChallengeFrame>
  );
}
const SUMMARY = ["Ngăn xếp (stack): vào sau ra trước, như chồng đĩa — Ctrl+Z lấy thao tác MỚI NHẤT.", "Thao tác bị hoàn tác nằm ở ngăn Làm lại; Ctrl+Y đưa nó trở lại.", "Làm một thao tác mới thì ngăn Làm lại bị xóa: không “làm lại” được nữa."];

export function UndoStackLab() {
  return <SimShell title="Hoàn tác Ctrl+Z" intro={{ story: "Gõ nhầm thì bấm Ctrl+Z. Nhưng máy nhớ các thao tác của em theo thứ tự nào?", goal: "Hiểu hai ngăn xếp Hoàn tác và Làm lại, đoán đúng chữ còn lại trên trang." }} screens={[{ id: "kham-pha", label: "Khám phá", icon: Layers, render: () => <Explore /> }, { id: "thu-thach", label: "Thử thách", icon: Wand2, render: () => <Game /> }]} />;
}
