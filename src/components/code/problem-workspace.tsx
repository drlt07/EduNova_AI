"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowLeft, Bot, CheckCircle2, ChevronLeft, ChevronRight, History, Lightbulb, Play, RotateCcw, Save, Send, XCircle } from "lucide-react";
import { toast } from "sonner";
import { CODING_EXERCISES, type CodingExercise } from "@/lib/data/coding-exercises";
import { DIFFICULTY_LABEL } from "@/lib/data/curriculum";
import { normalizeOutput, runPython, type RunResult } from "@/lib/py/interpreter";
import type { CodeWork } from "@/lib/domain/types";
import { cn, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/form";
import { CodeEditor } from "@/components/labs/code-editor";
import { useTutor, useTutorActivity } from "@/components/tutor/tutor-provider";
import { CodeVisualizer } from "./visualizer";
import { runExerciseTests, type TestRow } from "./python-workspace";

type LeftTab = "task" | "hints" | "subs";
type ConsoleTab = "input" | "output" | "steps" | "verdict";
const DIFF_TONE = { "co-ban": "success", "trung-binh": "warning", "nang-cao": "danger" } as const;

function TabBtn({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" aria-pressed={on} onClick={onClick} className={cn("flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium transition-colors", on ? "border-cyan text-fg" : "border-transparent text-muted hover:text-fg")}>{children}</button>;
}

/** Kết luận khi nộp bài, như các trang chấm code: đạt hết, sai ở test nào, hay lỗi khi chạy. */
function verdictOf(rows: TestRow[]): { ok: boolean; title: string; detail: string } {
  const failIdx = rows.findIndex((r) => !r.pass);
  if (failIdx < 0) return { ok: true, title: `Đạt ${rows.length}/${rows.length}`, detail: "Chương trình cho kết quả đúng ở mọi bộ dữ liệu kiểm thử." };
  const f = rows[failIdx];
  if (f.error) return { ok: false, title: `Lỗi khi chạy ở test ${failIdx + 1}`, detail: f.error };
  return { ok: false, title: `Sai kết quả ở test ${failIdx + 1}`, detail: `Đạt ${rows.filter((r) => r.pass).length}/${rows.length}. Trường hợp “${f.name}” in ra khác kết quả cần có.` };
}

/**
 * Trang làm bài lập trình kiểu trang chấm code: đề + ví dụ + gợi ý bên trái, code bên phải,
 * bảng dữ liệu thử / kết quả / từng bước / kết quả nộp ở dưới; Chạy để thử, Nộp bài để chấm toàn bộ test.
 */
export function ProblemWorkspace({ ex, work, onSave, onSubmit }: { ex: CodingExercise; work?: CodeWork; onSave: (code: string, note?: string) => void; onSubmit: (code: string, rows: TestRow[]) => void }) {
  const tutor = useTutor();
  const [code, setCode] = useState(work?.code ?? ex.starter);
  const [left, setLeft] = useState<LeftTab>("task");
  const [hintsShown, setHintsShown] = useState(0);
  const [consoleTab, setConsoleTab] = useState<ConsoleTab>("input");
  const [sample, setSample] = useState(0);
  const [custom, setCustom] = useState("");
  const [result, setResult] = useState<RunResult | null>(null);
  const [rows, setRows] = useState<TestRow[] | null>(null);
  const [openRow, setOpenRow] = useState<number | null>(null);
  const [plain, setPlain] = useState(false);

  const idx = CODING_EXERCISES.findIndex((e) => e.id === ex.id);
  const prev = CODING_EXERCISES[idx - 1];
  const next = CODING_EXERCISES[idx + 1];
  const examples = useMemo(() => ex.tests.slice(0, 2).map((t) => ({ ...t, out: normalizeOutput(runPython(ex.solution, { stdin: t.stdin, echoInput: false, trace: false }).output) })), [ex]);
  const stdin = sample < examples.length ? examples[sample].stdin : custom.split("\n");
  const verdict = rows ? verdictOf(rows) : null;

  const touchTutor = useTutorActivity("code", () => ({
    kind: "code",
    task: ex.task,
    exerciseId: ex.id,
    code,
    runError: result?.error ? { type: result.error.type, line: result.error.line, explain: result.error.explain } : undefined,
    tests: rows?.map((t) => ({ name: t.name, stdin: t.stdin, expected: t.expected, actual: t.actual, pass: t.pass, error: t.error })),
  }));

  const run = (visual = false) => {
    const r = runPython(code, { stdin: stdin.filter((l, i, a) => l !== "" || i < a.length - 1) });
    setResult(r);
    setConsoleTab(visual ? "steps" : "output");
    touchTutor();
    onSave(code);
  };
  const submit = () => {
    const r = runExerciseTests(ex, code);
    setRows(r);
    setOpenRow(r.findIndex((x) => !x.pass));
    setConsoleTab("verdict");
    touchTutor();
    onSubmit(code, r);
  };
  const askTutor = () => tutor.open({ title: `Bài lập trình: ${ex.title}`, topic: ex.topic === "Vòng lặp" || ex.topic === "Danh sách" ? "loop" : ex.topic === "Biểu thức logic" ? "logic" : "if", ...(result?.error ? { error: result.error } : {}), ...(rows && !rows.every((x) => x.pass) ? { failing: rows.filter((x) => !x.pass).map((x) => `${x.name}: cần "${x.expected}", em in "${x.actual}"`) } : {}), ref: `Code:${ex.id}` });

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button asChild variant="ghost" size="sm"><Link href="/student/practice"><ArrowLeft /> Danh sách bài</Link></Button>
        <span className="hidden h-5 w-px bg-line sm:block" />
        <h1 className="min-w-0 flex-1 truncate text-lg font-bold text-fg">{idx + 1}. {ex.title}</h1>
        <Button asChild={!!prev} variant="ghost" size="icon" disabled={!prev} aria-label="Bài trước">{prev ? <Link href={`/student/code?bai=${prev.id}`}><ChevronLeft /></Link> : <ChevronLeft />}</Button>
        <Button asChild={!!next} variant="ghost" size="icon" disabled={!next} aria-label="Bài sau">{next ? <Link href={`/student/code?bai=${next.id}`}><ChevronRight /></Link> : <ChevronRight />}</Button>
      </div>

      <div className="grid gap-3 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        {/* Đề bài */}
        <section className="flex min-h-[420px] flex-col overflow-hidden rounded-2xl border border-line bg-surface" aria-label="Đề bài">
          <div className="flex border-b border-line px-2">
            <TabBtn on={left === "task"} onClick={() => setLeft("task")}>Đề bài</TabBtn>
            <TabBtn on={left === "hints"} onClick={() => setLeft("hints")}><Lightbulb className="size-3.5" aria-hidden /> Gợi ý</TabBtn>
            <TabBtn on={left === "subs"} onClick={() => setLeft("subs")}><History className="size-3.5" aria-hidden /> Bài đã nộp</TabBtn>
          </div>
          <div className="flex-1 overflow-auto p-4 text-sm">
            {left === "task" && (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-1.5"><Badge tone={DIFF_TONE[ex.difficulty]}>{DIFFICULTY_LABEL[ex.difficulty]}</Badge><Badge>{ex.topic}</Badge><Badge tone="blue">Tin {ex.grade}</Badge>{work?.lastRun && work.lastRun.passed === work.lastRun.total && <Badge tone="success"><CheckCircle2 className="size-3" aria-hidden /> Đã giải</Badge>}</div>
                <p className="leading-relaxed text-fg">{ex.task}</p>
                {examples.map((e, i) => (
                  <div key={e.name}>
                    <p className="mb-1 font-semibold text-fg">Ví dụ {i + 1}</p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <div><p className="text-xs text-muted">Dữ liệu vào</p><pre className="mt-0.5 rounded-lg bg-surface-2 p-2 font-mono text-[13px] text-fg">{e.stdin.join("\n")}</pre></div>
                      <div><p className="text-xs text-muted">Kết quả cần in</p><pre className="mt-0.5 rounded-lg bg-surface-2 p-2 font-mono text-[13px] text-fg">{e.out}</pre></div>
                    </div>
                  </div>
                ))}
                <p className="text-xs text-muted">Bài được chấm với {ex.tests.length} bộ dữ liệu, gồm cả các trường hợp biên. Mỗi lần gọi input() đọc một dòng.</p>
              </div>
            )}
            {left === "hints" && (
              <div className="space-y-2">
                {ex.hints.slice(0, hintsShown).map((h, i) => <p key={i} className="rounded-xl border border-warning/30 bg-warning/5 p-3 text-fg"><b>Gợi ý {i + 1}.</b> {h}</p>)}
                {hintsShown < ex.hints.length ? <Button size="sm" variant="secondary" onClick={() => setHintsShown((n) => n + 1)}><Lightbulb /> Mở gợi ý {hintsShown + 1}/{ex.hints.length}</Button> : <p className="text-xs text-muted">Đã mở hết gợi ý.</p>}
                <div className="pt-2"><Button size="sm" variant="ghost" onClick={askTutor}><Bot /> Hỏi AI Gia sư về bài làm của em</Button></div>
              </div>
            )}
            {left === "subs" && (
              <div className="space-y-2">
                {work?.lastRun ? <p className={cn("rounded-xl p-3 font-medium", work.lastRun.passed === work.lastRun.total ? "bg-success/10 text-success-fg" : "bg-warning/10 text-warning-fg")}>Lần nộp gần nhất: đạt {work.lastRun.passed}/{work.lastRun.total} test · {formatDate(work.lastRun.at, true)}</p> : <p className="text-muted">Chưa nộp lần nào.</p>}
                <p className="pt-2 text-xs font-semibold text-muted">Phiên bản đã lưu ({work?.versions.length ?? 0})</p>
                {[...(work?.versions ?? [])].reverse().map((v, k) => (
                  <div key={v.savedAt + k} className="flex items-center justify-between gap-2 rounded-lg bg-surface-2 px-3 py-2">
                    <span className="text-fg">{v.note} <span className="text-xs text-muted">· {formatDate(v.savedAt, true)}</span></span>
                    <Button size="sm" variant="ghost" onClick={() => { setCode(v.code); toast.info("Đã khôi phục phiên bản"); }}><RotateCcw /> Dùng lại</Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Code + bảng điều khiển */}
        <section className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-line bg-surface" aria-label="Bài làm">
          <div className="flex flex-wrap items-center gap-2 border-b border-line px-3 py-2 text-xs">
            <Badge tone="cyan">Python 3</Badge>
            <label className="flex items-center gap-1.5 text-muted"><input type="checkbox" checked={plain} onChange={(e) => setPlain(e.target.checked)} className="accent-[var(--cyan)]" />Dùng trình soạn thảo đơn giản</label>
            <span className="ml-auto flex gap-1">
              <Button size="sm" variant="ghost" onClick={() => { if (window.confirm("Khôi phục code mẫu ban đầu? Code hiện tại sẽ bị thay.")) setCode(ex.starter); }}><RotateCcw /> Code mẫu</Button>
              <Button size="sm" variant="ghost" onClick={() => { onSave(code, `Phiên bản ${(work?.versions.length ?? 0) + 1}`); toast.success("Đã lưu phiên bản"); }}><Save /> Lưu</Button>
            </span>
          </div>
          <div onKeyDown={(e) => { if ((e.ctrlKey || e.metaKey) && e.key === "Enter") { e.preventDefault(); run(); } }}>
            <CodeEditor value={code} onChange={setCode} forcePlain={plain} height={300} />
          </div>

          <div className="border-t border-line">
            <div className="flex flex-wrap border-b border-line px-2">
              <TabBtn on={consoleTab === "input"} onClick={() => setConsoleTab("input")}>Dữ liệu thử</TabBtn>
              <TabBtn on={consoleTab === "output"} onClick={() => setConsoleTab("output")}>Kết quả</TabBtn>
              <TabBtn on={consoleTab === "steps"} onClick={() => setConsoleTab("steps")}>Từng bước</TabBtn>
              <TabBtn on={consoleTab === "verdict"} onClick={() => setConsoleTab("verdict")}>Kết quả nộp {rows && (verdict!.ok ? <CheckCircle2 className="size-3.5 text-success-fg" aria-hidden /> : <XCircle className="size-3.5 text-danger-fg" aria-hidden />)}</TabBtn>
            </div>
            <div className="max-h-72 min-h-36 overflow-auto p-3 text-sm">
              {consoleTab === "input" && (
                <div>
                  <div className="flex flex-wrap gap-1.5">
                    {examples.map((e, i) => <button key={e.name} type="button" aria-pressed={sample === i} onClick={() => setSample(i)} className={cn("rounded-lg border px-2.5 py-1 text-xs font-medium", sample === i ? "border-cyan bg-cyan/10 text-cyan-fg" : "border-line text-muted")}>Ví dụ {i + 1}</button>)}
                    <button type="button" aria-pressed={sample === examples.length} onClick={() => setSample(examples.length)} className={cn("rounded-lg border px-2.5 py-1 text-xs font-medium", sample === examples.length ? "border-cyan bg-cyan/10 text-cyan-fg" : "border-line text-muted")}>Tự nhập</button>
                  </div>
                  {sample < examples.length ? <pre className="mt-2 rounded-lg bg-surface-2 p-2 font-mono text-[13px] text-fg">{examples[sample].stdin.join("\n")}</pre> : <Textarea aria-label="Dữ liệu vào tự nhập" value={custom} onChange={(e) => setCustom(e.target.value)} className="mt-2 min-h-[64px] font-mono text-[13px]" placeholder={"Mỗi dòng ứng với một lần input()"} />}
                </div>
              )}
              {consoleTab === "output" && (!result ? <p className="text-muted">Bấm Chạy để xem chương trình in ra gì.</p> : (
                <div className="space-y-2">
                  <pre tabIndex={0} aria-label="Kết quả chạy" className="min-h-[3rem] whitespace-pre-wrap rounded-xl bg-[#0B1220] p-3 font-mono text-[13px] leading-6 text-slate-200">{result.output || (result.ok ? "(chương trình không in gì)" : "")}</pre>
                  {sample < examples.length && result.ok && <p className={cn("text-xs font-medium", normalizeOutput(result.output) === examples[sample].out ? "text-success-fg" : "text-warning-fg")}>{normalizeOutput(result.output) === examples[sample].out ? "Khớp kết quả của ví dụ." : `Chưa khớp ví dụ — cần in: ${examples[sample].out}`}</p>}
                  {result.error && (
                    <div className="rounded-xl border border-danger/40 bg-danger/5 p-3" role="alert">
                      <p className="font-mono font-semibold text-danger-fg">Dòng {result.error.line}: {result.error.type}: {result.error.message}</p>
                      <p className="mt-1 text-fg">{result.error.explain}</p>
                      <Button size="sm" variant="secondary" className="mt-2" onClick={askTutor}><Bot /> Nhờ gia sư giải thích lỗi</Button>
                    </div>
                  )}
                </div>
              ))}
              {consoleTab === "steps" && (result ? <CodeVisualizer key={result.trace.length + result.output} code={code} result={result} /> : <p className="text-muted">Bấm “Chạy từng bước” để xem chương trình thực hiện từng dòng và giá trị các biến.</p>)}
              {consoleTab === "verdict" && (!rows ? <p className="text-muted">Bấm Nộp bài để chấm với toàn bộ {ex.tests.length} bộ dữ liệu.</p> : (
                <div className="space-y-2">
                  <div className={cn("rounded-xl p-3", verdict!.ok ? "bg-success/10" : "bg-danger/10")}>
                    <p className={cn("text-lg font-bold", verdict!.ok ? "text-success-fg" : "text-danger-fg")}>{verdict!.title}</p>
                    <p className="text-xs text-fg">{verdict!.detail}</p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {rows.map((r, i) => (
                      <button key={r.name} type="button" aria-pressed={openRow === i} onClick={() => setOpenRow(openRow === i ? null : i)} className={cn("flex items-center gap-1 rounded-lg border px-2 py-1 text-xs font-medium", r.pass ? "border-success/40 text-success-fg" : "border-danger/50 text-danger-fg", openRow === i && "ring-2 ring-cyan/40")}>
                        {r.pass ? <CheckCircle2 className="size-3.5" aria-hidden /> : <XCircle className="size-3.5" aria-hidden />} Test {i + 1}
                      </button>
                    ))}
                  </div>
                  {openRow !== null && rows[openRow] && (
                    <div className="grid gap-2 rounded-xl border border-line p-2 text-xs sm:grid-cols-3">
                      <div><p className="text-muted">{rows[openRow].name} — dữ liệu vào</p><pre className="mt-0.5 rounded bg-surface-2 p-1.5 font-mono">{rows[openRow].stdin.join("\n")}</pre></div>
                      <div><p className="text-muted">Cần in</p><pre className="mt-0.5 whitespace-pre-wrap rounded bg-surface-2 p-1.5 font-mono">{rows[openRow].expected}</pre></div>
                      <div><p className="text-muted">Em in</p><pre className={cn("mt-0.5 whitespace-pre-wrap rounded p-1.5 font-mono", rows[openRow].pass ? "bg-surface-2" : "bg-danger/10")}>{rows[openRow].error ?? (rows[openRow].actual || "(không in gì)")}</pre></div>
                    </div>
                  )}
                  {!verdict!.ok && <Button size="sm" variant="ghost" onClick={askTutor}><Bot /> Nhờ gia sư gợi ý (không cho đáp án)</Button>}
                </div>
              ))}
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line px-3 py-2">
              <span className="mr-auto text-xs text-muted">Ctrl + Enter để chạy</span>
              <Button size="sm" variant="ghost" onClick={() => run(true)}>Chạy từng bước</Button>
              <Button size="sm" variant="secondary" onClick={() => run()}><Play /> Chạy</Button>
              <Button size="sm" onClick={submit}><Send /> Nộp bài</Button>
            </div>
          </div>
        </section>
      </div>
      {verdict?.ok && next && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-success/40 bg-success/10 px-4 py-3 text-sm">
          <span className="font-medium text-fg">Giỏi lắm! Bài tiếp theo: <b>{next.title}</b> ({DIFFICULTY_LABEL[next.difficulty]})</span>
          <Button asChild size="sm"><Link href={`/student/code?bai=${next.id}`}>Làm bài tiếp <ChevronRight /></Link></Button>
        </div>
      )}
    </div>
  );
}
