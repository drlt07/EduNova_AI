"use client";
import { useMemo, useState } from "react";
import { Bug, BusFront, CheckCircle2, FlaskConical, Play, Wrench, XCircle } from "lucide-react";
import {
  BUG_AGES, BUG_LINES, ERROR_KIND_LABEL, FARE_RULES, REGRESSION_AGES, SNIPPETS, fareProgram, runFare, runSnippet, testAdvice,
  type ErrorKind, type FareTest,
} from "@/lib/sim/debug-detective";
import { useTutorActivity } from "@/components/tutor/tutor-provider";
import { MissionDone, MissionLayout, type Feedback, type MissionStage } from "@/components/sim/mission";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form";
import { cn } from "@/lib/utils";

const STAGES: MissionStage[] = [
  { id: "kinds", label: "Nhận dạng lỗi", icon: Bug },
  { id: "tests", label: "Thiết kế test", icon: FlaskConical },
  { id: "fix", label: "Sửa & kiểm thử lại", icon: Wrench },
];
const money = (n: number | string) => (String(n).match(/^\d+$/) ? `${Number(n).toLocaleString("vi-VN")}đ` : String(n));

function CodeView({ code, bad = [], good = [] }: { code: string; bad?: number[]; good?: number[] }) {
  return (
    <pre className="overflow-x-auto rounded-xl bg-[#0b1220] py-2 font-mono text-[12.5px] leading-6 text-slate-100">
      {code.split("\n").map((l, i) => (
        <div key={i} className={cn("flex px-3", bad.includes(i + 1) && "bg-red-500/25", good.includes(i + 1) && "bg-emerald-500/25")}>
          <span className="w-6 shrink-0 select-none text-right text-slate-500">{i + 1}</span>
          <span className="ml-3 whitespace-pre">{l}</span>
        </div>
      ))}
    </pre>
  );
}

function TestLog({ tests }: { tests: FareTest[] }) {
  if (!tests.length) return <p className="rounded-xl border border-dashed border-slate-300 p-3 text-xs text-slate-500">Chưa có test nào. Nhập tuổi hành khách để thử máy bán vé.</p>;
  return (
    <div className="max-h-56 overflow-auto rounded-xl border border-slate-200 bg-white">
      <table className="w-full text-xs">
        <thead className="sticky top-0 bg-slate-100 text-left text-slate-600"><tr><th className="px-2 py-1">Tuổi</th><th className="px-2 py-1">Quy định</th><th className="px-2 py-1">Máy in ra</th><th className="px-2 py-1" /></tr></thead>
        <tbody>
          {tests.map((t, i) => (
            <tr key={i} className={cn("border-t border-slate-100", !t.pass && "bg-red-50")}>
              <td className="px-2 py-1 font-mono">{t.age}</td>
              <td className="px-2 py-1">{money(t.expected)}</td>
              <td className="px-2 py-1">{money(t.actual)}</td>
              <td className="px-2 py-1">{t.pass ? <CheckCircle2 className="size-4 text-emerald-600" aria-label="đạt" /> : <XCircle className="size-4 text-red-600" aria-label="sai" />}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Thám tử gỡ lỗi (Tin 10 – Bài 29, 30): ứng dụng bán vé xe buýt tính sai tiền với vài hành khách.
 * Phân loại lỗi trên code chạy thật, tự thiết kế test để lộ lỗi ở giá trị biên, chọn cách sửa và kiểm thử lại.
 */
export function DebugDetectiveLab() {
  const [stage, setStage] = useState("kinds");
  const [snipIdx, setSnipIdx] = useState(0);
  const [kindAns, setKindAns] = useState<ErrorKind | null>(null);
  const [ageInput, setAgeInput] = useState("");
  const [tests, setTests] = useState<FareTest[]>([]);
  const [fix, setFix] = useState<(number | null)[]>([null, null]);
  const [regression, setRegression] = useState<FareTest[] | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const snip = SNIPPETS[snipIdx];
  const snipRun = useMemo(() => (kindAns ? runSnippet(snip) : null), [kindAns, snip]);
  const bugsFound = [...new Set(tests.filter((t) => !t.pass && t.age in BUG_AGES).map((t) => BUG_AGES[t.age]))];
  const program = stage === "fix" ? fareProgram(fix) : fareProgram();
  const advice = testAdvice(tests.map((t) => t.age));

  const touchTutor = useTutorActivity("code", () => ({
    kind: "code",
    task: stage === "kinds" ? `Phân loại lỗi trong đoạn "${snip.title}"` : "Ứng dụng bán vé xe buýt: tìm và sửa lỗi theo quy định giá vé " + FARE_RULES.join("; "),
    code: stage === "kinds" ? snip.code : program,
    tests: (regression ?? tests).map((t) => ({ name: `Tuổi ${t.age}`, stdin: [String(t.age)], expected: String(t.expected), actual: t.actual, pass: t.pass })),
  }), { title: "Thám tử gỡ lỗi · Tin 10", topic: "test", level: "guided" });

  const answerKind = (k: ErrorKind) => {
    if (kindAns) return;
    touchTutor();
    setKindAns(k);
    if (k !== snip.kind) setMistakes((m) => m + 1);
    setFeedback({ ok: k === snip.kind, text: (k === snip.kind ? "Đúng. " : `Chưa đúng — đây là ${ERROR_KIND_LABEL[snip.kind].toLowerCase()}. `) + snip.why });
  };

  const tryAge = () => {
    const age = Number(ageInput);
    if (!Number.isInteger(age) || age < 0 || age > 120) return setFeedback({ ok: false, text: "Nhập tuổi là số nguyên từ 0 đến 120." });
    touchTutor();
    const t = runFare(fareProgram(), age);
    setTests((x) => [...x, t]);
    setAgeInput("");
    if (t.pass) setFeedback({ ok: true, text: `Tuổi ${age}: máy tính đúng (${money(t.expected)}).` });
    else setFeedback({ ok: true, text: `Bắt được lỗi! Hành khách ${age} tuổi phải trả ${money(t.expected)} nhưng máy thu ${money(t.actual)}.` });
  };

  const retest = () => {
    if (fix.some((f) => f === null)) return setFeedback({ ok: false, text: "Hãy chọn cách sửa cho cả hai dòng lỗi." });
    touchTutor();
    const ages = [...new Set([...REGRESSION_AGES, ...tests.map((t) => t.age)])].sort((a, b) => a - b);
    const rows = ages.map((a) => runFare(fareProgram(fix), a));
    setRegression(rows);
    const failed = rows.filter((r) => !r.pass);
    if (failed.length) {
      setMistakes((m) => m + 1);
      setFeedback({ ok: false, text: `Còn ${failed.length} test sai (tuổi ${failed.map((f) => f.age).join(", ")}). Xem lại cách sửa: sửa một lỗi có thể sinh lỗi mới.` });
    } else {
      setFeedback({ ok: true, text: `Đạt cả ${rows.length} test, kể cả mọi mốc biên. ${BUG_LINES.map((b) => b.why).join(" ")}` });
      setStage("done");
    }
  };

  const restart = () => {
    setStage("kinds"); setSnipIdx(0); setKindAns(null); setAgeInput(""); setTests([]); setFix([null, null]); setRegression(null); setMistakes(0); setFeedback(null);
  };

  const scene = (
    <div className="space-y-3 rounded-2xl border border-line bg-gradient-to-br from-[#fef9c3] to-[#dcfce7] p-3 text-slate-900">
      <div className="flex items-center gap-3 rounded-xl bg-white/80 p-3 shadow-sm">
        <span className="grid size-11 place-items-center rounded-xl bg-emerald-600 text-white"><BusFront className="size-6" aria-hidden /></span>
        <div className="min-w-0">
          <p className="text-sm font-bold">{stage === "kinds" ? `Đoạn code: ${snip.title}` : "Máy bán vé xe buýt thông minh"}</p>
          <p className="text-xs text-slate-600">{stage === "kinds" ? "Bấm chọn loại lỗi — đoạn code sẽ được chạy thật để em đối chiếu." : "Hành khách phản ánh: vài người bị thu sai tiền. Bảng giá: " + FARE_RULES.join(" · ")}</p>
        </div>
      </div>
      {stage === "kinds" ? (
        <>
          <CodeView code={snip.code} bad={snipRun?.error ? [Number(/Dòng (\d+)/.exec(snipRun.error)?.[1] ?? 0)] : []} />
          <div className="rounded-xl bg-[#0b1220] p-3 font-mono text-xs text-slate-100" aria-live="polite">
            <p className="text-slate-400">&gt; chạy với dữ liệu vào: {snip.stdin.length ? snip.stdin.join(", ") : "(không)"}</p>
            {snipRun ? (
              <>
                {snipRun.output && <p>{snipRun.output}</p>}
                {snipRun.error && <p className="text-red-400">{snipRun.error}</p>}
                {snip.expected && <p className="text-amber-300">Kết quả đúng phải là: {snip.expected}</p>}
              </>
            ) : <p className="text-slate-500">(chọn loại lỗi để chạy)</p>}
          </div>
        </>
      ) : (
        <>
          <CodeView code={program} bad={stage === "tests" ? bugsFound.map((b) => BUG_LINES[b].line) : []} good={stage === "fix" || stage === "done" ? fix.flatMap((f, i) => (f !== null ? [BUG_LINES[i].line] : [])) : []} />
          <TestLog tests={regression ?? tests} />
        </>
      )}
    </div>
  );

  return (
    <MissionLayout scene={scene} stages={STAGES} current={stage} feedback={feedback} mistakes={mistakes}>
      {stage === "kinds" && (
        <>
          <h3 className="font-semibold text-fg">Nhiệm vụ 1 · Đây là loại lỗi gì? ({snipIdx + 1}/{SNIPPETS.length})</h3>
          <div className="mt-3 space-y-1.5">
            {(Object.keys(ERROR_KIND_LABEL) as ErrorKind[]).map((k) => (
              <Button key={k} size="sm" variant={kindAns === k ? "primary" : "secondary"} className="w-full justify-start" disabled={!!kindAns} onClick={() => answerKind(k)}>{ERROR_KIND_LABEL[k]}</Button>
            ))}
          </div>
          {kindAns && <Button size="sm" className="mt-3" onClick={() => { setKindAns(null); setFeedback(null); if (snipIdx + 1 < SNIPPETS.length) setSnipIdx(snipIdx + 1); else setStage("tests"); }}>{snipIdx + 1 < SNIPPETS.length ? "Đoạn tiếp theo →" : "Nhiệm vụ tiếp theo →"}</Button>}
        </>
      )}
      {stage === "tests" && (
        <>
          <h3 className="font-semibold text-fg">Nhiệm vụ 2 · Bắt lỗi bằng test ({bugsFound.length}/2 lỗi)</h3>
          <p className="mt-1 text-sm text-muted">Máy có 2 lỗi. Nhập tuổi hành khách để thử; test nào máy thu sai tiền là em đã bắt được lỗi.</p>
          <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); tryAge(); }}>
            <Input aria-label="Tuổi hành khách" inputMode="numeric" placeholder="Tuổi, vd 25" value={ageInput} onChange={(e) => setAgeInput(e.target.value)} />
            <Button type="submit" size="sm"><Play /> Thử</Button>
          </form>
          {advice && <p className="mt-2 rounded-lg bg-warning/10 p-2 text-xs text-fg">💡 {advice}</p>}
          <p className="mt-2 text-xs text-muted">Đã chạy {tests.length} test.</p>
          {bugsFound.length === 2 && <Button size="sm" className="mt-3" onClick={() => { setStage("fix"); setFeedback(null); }}>Nhiệm vụ tiếp theo →</Button>}
        </>
      )}
      {stage === "fix" && (
        <>
          <h3 className="font-semibold text-fg">Nhiệm vụ 3 · Sửa lỗi rồi kiểm thử lại</h3>
          {BUG_LINES.map((b, i) => (
            <fieldset key={b.line} className="mt-3">
              <legend className="text-xs font-semibold text-muted">Dòng {b.line}: <code className="text-danger-fg">{b.buggy}</code></legend>
              <div className="mt-1 space-y-1">
                {b.options.map((o, k) => (
                  <label key={o} className={cn("flex cursor-pointer items-center gap-2 rounded-lg border px-2 py-1.5 font-mono text-xs", fix[i] === k ? "border-cyan bg-cyan/10" : "border-line")}>
                    <input type="radio" name={`fix-${i}`} checked={fix[i] === k} onChange={() => { setFix((f) => f.map((x, j) => (j === i ? k : x))); setRegression(null); }} /> {o}
                  </label>
                ))}
              </div>
            </fieldset>
          ))}
          <Button size="sm" className="mt-3" onClick={retest}><FlaskConical /> Chạy lại toàn bộ test</Button>
        </>
      )}
      {stage === "done" && (
        <MissionDone
          mistakes={mistakes}
          title="Máy bán vé đã tính đúng cho mọi hành khách!"
          onRestart={restart}
          points={[
            <><b>Lỗi cú pháp</b> chặn chương trình chạy; <b>lỗi khi chạy</b> xuất hiện với một số dữ liệu; <b>lỗi logic</b> chạy được nhưng sai kết quả.</>,
            <>Lỗi hay nằm ở <b>giá trị biên</b> (17, 18, 59, 60): luôn thử đúng các mốc trong yêu cầu.</>,
            <>Sửa xong phải <b>chạy lại toàn bộ test</b>, vì sửa một chỗ có thể làm sai chỗ khác.</>,
          ]}
        />
      )}
    </MissionLayout>
  );
}
