"use client";
/** Khu làm việc Python: soạn, chạy, nhập dữ liệu, xem biến, chạy từng bước, kiểm thử. */
import { useMemo, useState } from "react";
import { Bug, CheckCircle2, ListChecks, Play, Save, Terminal, Variable, XCircle } from "lucide-react";
import type { CodingExercise } from "@/lib/data/coding-exercises";
import { normalizeOutput, runPython, type RunResult } from "@/lib/py/interpreter";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label, Textarea } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CodeEditor } from "@/components/labs/code-editor";
import { CodeVisualizer } from "./visualizer";

export interface TestRow {
  name: string;
  stdin: string[];
  expected: string;
  actual: string;
  pass: boolean;
  error?: string;
}

export function runExerciseTests(ex: CodingExercise, code: string): TestRow[] {
  return ex.tests.map((t) => {
    const ref = runPython(ex.solution, { stdin: t.stdin, echoInput: false, trace: false });
    const got = runPython(code, { stdin: t.stdin, echoInput: false, trace: false, maxSteps: 100_000 });
    const expected = normalizeOutput(ref.output);
    const actual = got.ok ? normalizeOutput(got.output) : "";
    return { name: t.name, stdin: t.stdin, expected, actual, pass: got.ok && actual === expected, error: got.ok ? undefined : `${got.error!.type}: ${got.error!.explain}` };
  });
}

export interface WorkspaceEvent {
  kind: "run" | "test" | "save";
  result?: RunResult;
  tests?: TestRow[];
}

export function PythonWorkspace({
  code,
  onCodeChange,
  exercise,
  defaultStdin = "",
  onEvent,
  onAskTutor,
  height = 320,
}: {
  code: string;
  onCodeChange: (c: string) => void;
  exercise?: CodingExercise;
  defaultStdin?: string;
  onEvent?: (e: WorkspaceEvent) => void;
  onAskTutor?: (ctx: { error?: { type: string; explain: string; line: number }; failing?: string[] }) => void;
  height?: number;
}) {
  const [stdin, setStdin] = useState(defaultStdin);
  const [result, setResult] = useState<RunResult | null>(null);
  const [tests, setTests] = useState<TestRow[] | null>(null);
  const [tab, setTab] = useState("console");
  const [plain, setPlain] = useState(false);
  const lastVars = useMemo(() => result?.trace[result.trace.length - 1]?.vars ?? [], [result]);

  function run(visual: boolean) {
    const r = runPython(code, { stdin: stdin.split("\n").filter((l, i, a) => l !== "" || i < a.length - 1) });
    setResult(r);
    setTab(visual ? "steps" : "console");
    onEvent?.({ kind: "run", result: r });
  }
  function test() {
    if (!exercise) return;
    const rows = runExerciseTests(exercise, code);
    setTests(rows);
    setTab("tests");
    onEvent?.({ kind: "test", tests: rows });
  }

  return (
    <div className="space-y-3">
      <div onKeyDown={(e) => { if ((e.ctrlKey || e.metaKey) && e.key === "Enter") { e.preventDefault(); run(false); } }}>
        <CodeEditor value={code} onChange={onCodeChange} forcePlain={plain} height={height} />
      </div>
      <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <Label htmlFor="stdin" className="text-xs text-muted">Dữ liệu vào (mỗi dòng ứng với một lần input())</Label>
          <Textarea id="stdin" value={stdin} onChange={(e) => setStdin(e.target.value)} className="mt-1 min-h-[60px] font-mono text-[13px]" placeholder={"Ví dụ:\n8\n12"} />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => run(false)} title="Ctrl + Enter"><Play /> Chạy</Button>
          <Button variant="secondary" onClick={() => run(true)}><Variable /> Chạy từng bước</Button>
          {exercise && <Button variant="secondary" onClick={test}><ListChecks /> Kiểm thử ({exercise.tests.length})</Button>}
          {onEvent && <Button variant="ghost" onClick={() => onEvent({ kind: "save" })}><Save /> Lưu phiên bản</Button>}
        </div>
      </div>
      <label className="flex items-center gap-2 text-xs text-muted"><input type="checkbox" checked={plain} onChange={(e) => setPlain(e.target.checked)} className="accent-[var(--cyan)]" /> Dùng trình soạn thảo đơn giản</label>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="console"><Terminal className="mr-1 inline size-3.5" />Kết quả</TabsTrigger>
          <TabsTrigger value="vars">Biến</TabsTrigger>
          <TabsTrigger value="steps">Từng bước</TabsTrigger>
          {exercise && <TabsTrigger value="tests">Kiểm thử</TabsTrigger>}
        </TabsList>
        <TabsContent value="console">
          {!result ? <p className="text-sm text-muted">Bấm Chạy để xem kết quả.</p> : (
            <div className="space-y-2">
              <pre tabIndex={0} aria-label="Kết quả chạy" className="max-h-72 min-h-[3rem] overflow-auto whitespace-pre-wrap rounded-xl bg-[#0B1220] p-3 font-mono text-[13px] leading-6 text-slate-200">{result.output || (result.ok ? "(chương trình không in gì)" : "")}</pre>
              {result.error && (
                <div className="rounded-xl border border-danger/40 bg-danger/5 p-3 text-sm" role="alert">
                  <p className="font-mono font-semibold text-danger-fg">Dòng {result.error.line}: {result.error.type}: {result.error.message}</p>
                  <p className="mt-1 text-fg">{result.error.explain}</p>
                  {onAskTutor && <Button size="sm" variant="secondary" className="mt-2" onClick={() => onAskTutor({ error: result.error })}><Bug /> Nhờ gia sư giải thích lỗi</Button>}
                </div>
              )}
              {result.ok && <p className="text-xs text-muted">Chạy xong sau {result.steps} bước tính toán.</p>}
            </div>
          )}
        </TabsContent>
        <TabsContent value="vars">
          {!result ? <p className="text-sm text-muted">Chạy chương trình để xem giá trị các biến.</p> : lastVars.length === 0 ? <p className="text-sm text-muted">Chương trình chưa tạo biến nào.</p> : (
            <table className="w-full max-w-lg text-sm">
              <thead className="text-xs text-muted"><tr><th className="pb-1 text-left font-medium">Biến</th><th className="pb-1 text-left font-medium">Giá trị</th><th className="pb-1 text-left font-medium">Kiểu</th></tr></thead>
              <tbody>{lastVars.map((v) => <tr key={v.name} className="border-t border-line"><td className="py-1 font-mono text-fg">{v.name}</td><td className="py-1 font-mono text-cyan-fg">{v.value}</td><td className="py-1 text-muted">{v.type}</td></tr>)}</tbody>
            </table>
          )}
        </TabsContent>
        <TabsContent value="steps">{result ? <CodeVisualizer key={result.trace.length + result.output} code={code} result={result} /> : <p className="text-sm text-muted">Bấm “Chạy từng bước” để xem chương trình thực hiện từng dòng.</p>}</TabsContent>
        {exercise && (
          <TabsContent value="tests">
            {!tests ? <p className="text-sm text-muted">Bấm Kiểm thử để chạy chương trình với các bộ dữ liệu của bài.</p> : (
              <div className="space-y-2">
                <Badge tone={tests.every((t) => t.pass) ? "success" : "warning"}>Đạt {tests.filter((t) => t.pass).length}/{tests.length}</Badge>
                <div className="overflow-x-auto" tabIndex={0}>
                  <table className="w-full min-w-[520px] text-left text-sm">
                    <thead className="text-xs text-muted"><tr><th className="pb-1 font-medium">Trường hợp</th><th className="pb-1 font-medium">Dữ liệu vào</th><th className="pb-1 font-medium">Cần in ra</th><th className="pb-1 font-medium">Em in ra</th><th className="pb-1" /></tr></thead>
                    <tbody>
                      {tests.map((t) => (
                        <tr key={t.name} className={cn("border-t border-line align-top", !t.pass && "bg-danger/5")}>
                          <td className="py-1.5 pr-2 text-fg">{t.name}</td>
                          <td className="py-1.5 pr-2 font-mono text-xs text-muted">{t.stdin.join(" ⏎ ")}</td>
                          <td className="py-1.5 pr-2 whitespace-pre font-mono text-xs text-fg">{t.expected}</td>
                          <td className="py-1.5 pr-2 whitespace-pre font-mono text-xs text-fg">{t.error ?? (t.actual || "(không in gì)")}</td>
                          <td className="py-1.5">{t.pass ? <CheckCircle2 className="size-4 text-success-fg" aria-label="đạt" /> : <XCircle className="size-4 text-danger-fg" aria-label="chưa đạt" />}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {onAskTutor && !tests.every((t) => t.pass) && <Button size="sm" variant="secondary" onClick={() => onAskTutor({ failing: tests.filter((t) => !t.pass).map((t) => `${t.name}: cần "${t.expected}", em in "${t.actual}"`) })}><Bug /> Nhờ gia sư gợi ý</Button>}
              </div>
            )}
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
