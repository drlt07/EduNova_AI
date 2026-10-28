"use client";
/**
 * Tin 10 Bài 29–30 – Thám tử gỡ lỗi (kiểu PhET).
 * Màn Máy bán vé: kéo thanh tuổi, chạy chương trình thật, mỗi lần chạy thành một chấm trên trục tuổi
 * (xanh = đúng quy định, đỏ = sai); dải màu phía sau là giá vé đúng. Sửa từng dòng lỗi và chạy bộ test biên.
 * Thử thách: phân loại lỗi cú pháp / khi chạy / logic, tìm tuổi làm lộ lỗi, sửa và kiểm thử lại.
 */
import { useState } from "react";
import { Bug, Play, TicketCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { BUG_AGES, BUG_LINES, ERROR_KIND_LABEL, FARE_RULES, fareProgram, REGRESSION_AGES, runFare, runSnippet, SNIPPETS, testAdvice, type ErrorKind, type FareTest } from "@/lib/sim/debug-detective";
import { ChallengeFrame, Panel, Readout, ResetAll, SimLayout, SimShell, SimSlider, Stage, useChallenge } from "./kit";

const MAXAGE = 90;
const BANDS = [{ from: 0, to: 6, fare: 0 }, { from: 6, to: 18, fare: 3000 }, { from: 18, to: 60, fare: 7000 }, { from: 60, to: MAXAGE + 1, fare: 0 }];
const FARE_COLOR: Record<number, string> = { 0: "#22c55e", 3000: "#3b82f6", 7000: "#f59e0b" };

function Code({ code, hi }: { code: string; hi?: number[] }) {
  return (
    <pre className="overflow-x-auto rounded-xl bg-[#0b1220] py-2 font-mono text-[13px] leading-6 text-slate-200">
      {code.split("\n").map((l, i) => <div key={i} className={cn("flex gap-3 px-3", hi?.includes(i + 1) && "bg-amber-400/15")}><span className="w-4 select-none text-right text-slate-500">{i + 1}</span><span className="whitespace-pre">{l}</span></div>)}
    </pre>
  );
}

/** Trục tuổi: dải giá đúng, chấm các lần chạy. */
function AgeAxis({ tests, age }: { tests: FareTest[]; age?: number }) {
  const x = (a: number) => 20 + (a / MAXAGE) * 560;
  const y = (fare: number) => 120 - (fare / 7000) * 90;
  return (
    <svg viewBox="0 0 600 160" className="w-full" role="img" aria-label="Trục tuổi và giá vé">
      {BANDS.map((b) => <rect key={b.from} x={x(b.from)} y={y(b.fare) - 4} width={x(Math.min(b.to, MAXAGE)) - x(b.from)} height={8} rx={4} fill={FARE_COLOR[b.fare]} opacity={0.35} />)}
      {[0, 3000, 7000].map((f) => <text key={f} x={4} y={y(f) + 4} className="fill-slate-400 text-[10px]">{f / 1000}k</text>)}
      <line x1={20} y1={135} x2={580} y2={135} stroke="#94a3b8" />
      {[0, 6, 18, 60, 90].map((a) => <g key={a}><line x1={x(a)} y1={131} x2={x(a)} y2={139} stroke="#94a3b8" /><text x={x(a)} y={152} textAnchor="middle" className="fill-slate-500 text-[11px] font-semibold">{a}</text></g>)}
      {[17, 59].map((a) => <line key={a} x1={x(a + 0.5)} y1={20} x2={x(a + 0.5)} y2={130} stroke="#f43f5e" strokeDasharray="3 4" opacity={0.5} />)}
      {age !== undefined && <line x1={x(age)} y1={14} x2={x(age)} y2={135} stroke="#0ea5e9" strokeWidth={2} />}
      {tests.map((t, i) => { const v = Number(t.actual); const ok = t.pass; return <g key={i}><circle cx={x(t.age)} cy={Number.isFinite(v) ? y(v) : 20} r={7} fill={ok ? "#16a34a" : "#e11d48"} stroke="white" strokeWidth={2} /><title>{`${t.age} tuổi: máy in ${t.actual}, đúng là ${t.expected}`}</title></g>; })}
    </svg>
  );
}

function Explore() {
  const [age, setAge] = useState(30);
  const [fix, setFix] = useState<(number | null)[]>([null, null]);
  const [tests, setTests] = useState<FareTest[]>([]);
  const code = fareProgram(fix);
  const last = tests[tests.length - 1];
  const advice = testAdvice(tests.map((t) => t.age));
  const runOne = () => setTests((ts) => [...ts.filter((t) => t.age !== age), runFare(code, age)]);
  const setFixAt = (i: number, v: number | null) => { const f = [...fix]; f[i] = v; setFix(f); setTests([]); };
  return (
    <SimLayout
      stage={
        <Stage className="space-y-3 p-3 sm:p-4">
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_200px]">
            <Code code={code} hi={BUG_LINES.map((b) => b.line)} />
            <div className="rounded-2xl bg-gradient-to-b from-amber-300 to-amber-500 p-3 text-center text-slate-900 shadow-inner">
              <TicketCheck className="mx-auto size-6" aria-hidden />
              <p className="text-xs font-bold uppercase">Máy bán vé</p>
              <p className="mt-1 text-sm">Hành khách {age} tuổi</p>
              <p className="my-2 rounded-lg bg-slate-900 py-2 font-mono text-2xl font-bold text-emerald-300" aria-live="polite">{last && last.age === age ? last.actual : "…"}</p>
              {last && last.age === age && <p className={cn("text-xs font-bold", last.pass ? "text-emerald-900" : "text-rose-800")}>{last.pass ? "Đúng quy định" : `Sai! Đúng là ${last.expected}`}</p>}
            </div>
          </div>
          <AgeAxis tests={tests} age={age} />
          {advice && <p role="status" className="rounded-xl bg-amber-400/15 px-3 py-2 text-sm text-warning-fg">{advice}</p>}
        </Stage>
      }
      controls={
        <>
          <Panel title="Hành khách">
            <SimSlider label="Tuổi" value={age} min={0} max={MAXAGE} onChange={setAge} unit=" tuổi" />
            <div className="grid grid-cols-2 gap-2">
              <Button size="sm" onClick={runOne}><Play /> Chạy</Button>
              <Button size="sm" variant="secondary" onClick={() => setTests(REGRESSION_AGES.map((a) => runFare(code, a)))}>Bộ test biên</Button>
            </div>
          </Panel>
          <Panel title="Quy định giá vé">
            <ul className="space-y-1 text-xs">{FARE_RULES.map((r, i) => <li key={r} className="flex items-center gap-2"><span className="size-2.5 shrink-0 rounded-full" style={{ background: FARE_COLOR[BANDS[i].fare] }} />{r}</li>)}</ul>
          </Panel>
          <Panel title="Sửa dòng lỗi">
            {BUG_LINES.map((b, i) => (
              <label key={b.line} className="block text-xs"><span className="text-muted">Dòng {b.line}</span>
                <select value={fix[i] ?? ""} onChange={(e) => setFixAt(i, e.target.value === "" ? null : Number(e.target.value))} className="mt-0.5 w-full rounded-lg border border-line bg-surface px-2 py-1 font-mono">
                  <option value="">{b.buggy} (gốc)</option>
                  {b.options.map((o, k) => <option key={o} value={k}>{o}</option>)}
                </select>
              </label>
            ))}
          </Panel>
          <div className="grid grid-cols-2 gap-2"><Readout label="Đã thử" value={tests.length} /><Readout label="Sai" value={tests.filter((t) => !t.pass).length} tone="rose" /></div>
          <ResetAll onClick={() => { setAge(30); setFix([null, null]); setTests([]); }} />
        </>
      }
    />
  );
}

type Task = { kind: "classify"; s: number } | { kind: "expose" } | { kind: "fix" };
const TASKS: Task[] = [{ kind: "classify", s: 0 }, { kind: "classify", s: 1 }, { kind: "classify", s: 3 }, { kind: "expose" }, { kind: "fix" }];

function Game() {
  const c = useChallenge(TASKS.length);
  const t = TASKS[Math.min(c.idx, TASKS.length - 1)];
  const [kind, setKind] = useState<ErrorKind | null>(null);
  const [ran, setRan] = useState<ReturnType<typeof runSnippet> | null>(null);
  const [typed, setTyped] = useState("");
  const [fix, setFix] = useState<(number | null)[]>([null, null]);
  const [tests, setTests] = useState<FareTest[]>([]);
  const key = `${c.run}-${c.idx}`;
  const [seen, setSeen] = useState(key);
  if (seen !== key) { setSeen(key); setKind(null); setRan(null); setTyped(""); setFix([null, null]); setTests([]); }
  const sn = t.kind === "classify" ? SNIPPETS[t.s] : undefined;
  const prompt = sn ? `Chạy thử “${sn.title}” rồi cho biết đây là loại lỗi gì.` : t.kind === "expose" ? "Chương trình bán vé gốc tính sai với một số tuổi. Tìm MỘT tuổi làm lộ lỗi (máy in khác quy định)." : "Sửa hai dòng lỗi để mọi tuổi trong bộ test biên đều đúng.";
  const check = () => {
    if (sn) return c.check(kind === sn.kind, kind === sn.kind ? sn.why : "Chưa đúng. Chương trình có chạy được không? Nếu chạy được thì kết quả có đúng không?");
    if (t.kind === "expose") { const a = Number(typed); const r = runFare(fareProgram(), a); setTests([r]); return c.check(typed !== "" && !r.pass, !r.pass ? `Bắt được! ${a} tuổi máy in ${r.actual} nhưng đúng là ${r.expected}. ${a in BUG_AGES ? "Đây đúng là một mốc biên." : ""}` : `${a} tuổi máy in đúng (${r.actual}). Thử các mốc ranh giới trong quy định.`); }
    const rs = REGRESSION_AGES.map((a) => runFare(fareProgram(fix), a)); setTests(rs);
    const bad = rs.filter((r) => !r.pass);
    return c.check(!bad.length, bad.length ? `Còn sai ở ${bad.map((r) => `${r.age} tuổi`).join(", ")}.` : "Cả 10 test biên đều đúng. Sửa xong phải kiểm thử lại toàn bộ, không chỉ chỗ vừa sửa.");
  };
  return (
    <ChallengeFrame c={c} prompt={prompt} onCheck={check} summary={["Lỗi cú pháp: viết sai quy tắc, không chạy được.", "Lỗi khi chạy: viết đúng nhưng gặp dữ liệu làm chương trình dừng (chia 0, int('chữ')).", "Lỗi logic: chạy được nhưng kết quả sai; tìm bằng test ở các giá trị biên."]}>
      <Stage className="space-y-3 p-3">
        {sn && (
          <>
            <Code code={sn.code} />
            {sn.stdin.length > 0 && <p className="text-xs text-muted">Dữ liệu nhập: <code>{sn.stdin.join(", ")}</code></p>}
            <Button size="sm" variant="secondary" onClick={() => setRan(runSnippet(sn))}><Play /> Chạy thử</Button>
            {ran && <pre className={cn("rounded-lg p-2 font-mono text-xs", ran.error ? "bg-rose-500/10 text-danger-fg" : "bg-slate-900 text-emerald-300")}>{ran.error ?? (ran.output || "(không in gì)")}</pre>}
            <div className="flex flex-wrap gap-2">{(Object.keys(ERROR_KIND_LABEL) as ErrorKind[]).map((k) => <button key={k} type="button" aria-pressed={kind === k} onClick={() => setKind(k)} className={cn("rounded-xl border-2 px-3 py-1.5 text-sm font-semibold", kind === k ? "border-brand bg-brand text-brand-ink" : "border-line bg-surface text-fg")}>{ERROR_KIND_LABEL[k]}</button>)}</div>
          </>
        )}
        {t.kind === "expose" && <><Code code={fareProgram()} /><Input aria-label="Tuổi" inputMode="numeric" className="max-w-40 text-center font-mono" placeholder="Tuổi" value={typed} onChange={(e) => setTyped(e.target.value.replace(/\D/g, ""))} /><AgeAxis tests={tests} /></>}
        {t.kind === "fix" && (
          <>
            <Code code={fareProgram(fix)} hi={BUG_LINES.map((b) => b.line)} />
            <div className="grid gap-2 sm:grid-cols-2">{BUG_LINES.map((b, i) => <select key={b.line} aria-label={`Dòng ${b.line}`} value={fix[i] ?? ""} onChange={(e) => { const f = [...fix]; f[i] = e.target.value === "" ? null : Number(e.target.value); setFix(f); }} className="rounded-lg border border-line bg-surface px-2 py-1.5 font-mono text-xs"><option value="">Dòng {b.line}: {b.buggy}</option>{b.options.map((o, k) => <option key={o} value={k}>{o}</option>)}</select>)}</div>
            <AgeAxis tests={tests} />
          </>
        )}
      </Stage>
    </ChallengeFrame>
  );
}

export function DebugDetectiveLab() {
  return <SimShell title="Thám tử gỡ lỗi" screens={[{ id: "kham-pha", label: "Máy bán vé", icon: TicketCheck, render: () => <Explore /> }, { id: "thu-thach", label: "Thử thách", icon: Bug, render: () => <Game /> }]} />;
}
