"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Beaker, CheckCircle2, Droplets, ListChecks, Play, RotateCcw, TimerReset, XCircle } from "lucide-react";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { HintMode, LabMode, LabTestCase, SmartGardenParams, TestResult } from "@/lib/domain/types";
import {
  builderToText,
  clampHumidity,
  compileRule,
  runRule,
  runTests,
  simulateTimeline,
  type BuilderRule,
  type RunOutput,
  type TimelinePoint,
} from "@/lib/sim/smart-garden";
import { useApp } from "@/lib/store/app-store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox, Input, Label, Select } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GardenScene } from "./garden-scene";

export interface SmartGardenLabProps {
  params: SmartGardenParams;
  testCases: LabTestCase[];
  mode: LabMode;
  hintMode?: HintMode;
  /** Có attemptId → ghi ExperimentEvent vào repository */
  attemptId?: string;
  initialRule?: string;
  readOnly?: boolean;
  compact?: boolean;
  onRuleChange?: (rule: string) => void;
  onTestResults?: (results: TestResult[], rule: string) => void;
}

const DEFAULT_BUILDER: BuilderRule = { comparator: ">", threshold: 40, connector: "none", water: "has_water" };
/** Luật khởi đầu (cố ý chưa đúng) để học sinh tự điều chỉnh. */
export const DEFAULT_RULE_TEXT = builderToText(DEFAULT_BUILDER);

export function SmartGardenLab({ params, testCases, mode, attemptId, initialRule, readOnly, compact, onRuleChange, onTestResults }: SmartGardenLabProps) {
  const logEvent = useApp((s) => s.logEvent);
  const setDraftRule = useApp((s) => s.setDraftRule);
  const [humidity, setHumidity] = useState(clampHumidity(params.initialHumidity));
  const [hasWater, setHasWater] = useState(params.initialHasWater);
  const [editorTab, setEditorTab] = useState<"builder" | "editor">(initialRule ? "editor" : "builder");
  const [builder, setBuilder] = useState<BuilderRule>(DEFAULT_BUILDER);
  const [ruleText, setRuleText] = useState(initialRule ?? builderToText(DEFAULT_BUILDER));
  const [last, setLast] = useState<(RunOutput & { input: { humidity: number; hasWater: boolean } }) | null>(null);
  const [tests, setTests] = useState<TestResult[] | null>(null);
  const [timeline, setTimeline] = useState<TimelinePoint[] | null>(null);
  const [announce, setAnnounce] = useState("");
  const inputTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const compiled = useMemo(() => compileRule(ruleText), [ruleText]);
  const showExpected = mode !== "assessment";
  const ruleLocked = readOnly;

  useEffect(() => () => { if (inputTimer.current) clearTimeout(inputTimer.current); }, []);

  function log(type: Parameters<typeof logEvent>[0]["type"], input: Record<string, unknown>, output: Record<string, unknown> = {}, pass?: boolean) {
    if (attemptId) logEvent({ attemptId, type, input, output, pass });
  }

  function changeInput(h: number, w: boolean) {
    setHumidity(h);
    setHasWater(w);
    setLast(null);
    if (inputTimer.current) clearTimeout(inputTimer.current);
    inputTimer.current = setTimeout(() => log("input_change", { humidity: h, hasWater: w }), 600);
  }

  function updateRule(text: string) {
    setRuleText(text);
    setTests(null);
    setTimeline(null);
    setLast(null);
    onRuleChange?.(text);
    if (attemptId) setDraftRule(attemptId, text);
  }

  function commitRuleEvent() {
    log("rule_change", { rule: ruleText, valid: compiled.ok });
  }

  function updateBuilder(patch: Partial<BuilderRule>) {
    const next = { ...builder, ...patch };
    setBuilder(next);
    const text = builderToText(next);
    updateRule(text);
    log("rule_change", { rule: text, source: "builder" });
  }

  function run() {
    if (!compiled.ok) return;
    const input = { humidity, hasWater };
    const out = runRule(compiled.ast, input, params);
    setLast({ ...out, input });
    log("run", { ...input, rule: ruleText }, { pump: out.pump, expected: out.expected, plant: out.plant }, out.pass);
    setAnnounce(`Máy bơm ${out.pump ? "bật" : "tắt"}. ${showExpected ? (out.pass ? "Đúng yêu cầu." : "Chưa đúng yêu cầu.") : ""}`);
  }

  function runSuite() {
    if (!compiled.ok) return;
    const results = runTests(compiled.ast, testCases, params);
    setTests(results);
    const passed = results.filter((r) => r.pass).length;
    log("test", { rule: ruleText, cases: results.length }, { passed, total: results.length, failed: results.filter((r) => !r.pass).map((r) => r.caseId) }, passed === results.length);
    onTestResults?.(results, ruleText);
    setAnnounce(`Kiểm thử: đạt ${passed} trên ${results.length}.`);
  }

  function reset() {
    setHumidity(clampHumidity(params.initialHumidity));
    setHasWater(params.initialHasWater);
    setBuilder(DEFAULT_BUILDER);
    updateRule(initialRule ?? builderToText(DEFAULT_BUILDER));
    log("reset", {});
    setAnnounce("Đã đặt lại thí nghiệm.");
  }

  function runTimeline() {
    if (!compiled.ok) return;
    setTimeline(simulateTimeline(compiled.ast, { humidity, water: hasWater ? 60 : 0 }));
    log("run", { humidity, hasWater, rule: ruleText, kind: "timeline" }, { steps: 12 });
  }

  const passed = tests?.filter((t) => t.pass).length ?? 0;
  const t = params.threshold;

  return (
    <div className={cn("grid gap-5", !compact && "xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]")}>
      <div aria-live="polite" className="sr-only">
        {announce}
      </div>
      {/* Cảnh + điều khiển */}
      <section aria-label="Mô phỏng hệ thống tưới" className="space-y-4">
        <div className="overflow-hidden rounded-2xl border border-line bg-[#0B1220]">
          <GardenScene humidity={humidity} hasWater={hasWater} pump={last ? last.pump : null} plant={last?.plant ?? null} threshold={t} />
        </div>
        <div className="grid gap-4 rounded-2xl border border-line bg-surface p-4 sm:grid-cols-[1fr_auto]">
          <div>
            <div className="flex items-center justify-between">
              <Label htmlFor="humidity">Độ ẩm đất (humidity)</Label>
              <span className="font-mono text-sm font-semibold text-cyan-fg tabular-nums">{humidity}%</span>
            </div>
            <input
              id="humidity"
              type="range"
              min={0}
              max={100}
              value={humidity}
              disabled={readOnly}
              onChange={(e) => changeInput(Number(e.target.value), hasWater)}
              className="mt-2 w-full cursor-pointer accent-[var(--cyan)]"
              aria-valuetext={`${humidity} phần trăm`}
            />
            {!compact && (
              <div className="mt-2 flex flex-wrap gap-1.5" role="group" aria-label="Thử nhanh giá trị biên">
                {[t - 1, t, t + 1, 0, 100].map((v) => (
                  <Button key={v} size="sm" variant="secondary" disabled={readOnly} onClick={() => changeInput(clampHumidity(v), hasWater)}>
                    {clampHumidity(v)}%
                  </Button>
                ))}
              </div>
            )}
          </div>
          <div className="flex flex-col justify-center gap-2 sm:min-w-[160px]">
            <Checkbox label={<span className="font-medium">Bình còn nước (has_water)</span>} checked={hasWater} disabled={readOnly} onChange={(e) => changeInput(humidity, e.target.checked)} />
            <p className="text-xs text-muted">Yêu cầu: tưới khi độ ẩm dưới {t}%{params.requireWater ? " và bình còn nước" : ""}</p>
          </div>
        </div>
      </section>

      {/* Luật + kết quả */}
      <section aria-label="Luật điều khiển và kết quả" className="space-y-4">
        <div className="rounded-2xl border border-line bg-surface p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h3 className="font-semibold text-fg">Điều kiện bật máy bơm</h3>
          </div>
          <Tabs value={editorTab} onValueChange={(v) => setEditorTab(v as "builder" | "editor")}>
            <TabsList>
              <TabsTrigger value="builder" disabled={ruleLocked}>Chọn khối</TabsTrigger>
              <TabsTrigger value="editor" disabled={!params.allowRuleEditor || ruleLocked}>Gõ biểu thức</TabsTrigger>
            </TabsList>
            <TabsContent value="builder">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <div>
                  <Label htmlFor="b-cmp" className="text-xs text-muted">humidity</Label>
                  <Select id="b-cmp" value={builder.comparator} onChange={(e) => updateBuilder({ comparator: e.target.value as BuilderRule["comparator"] })}>
                    {["<", "<=", ">", ">="].map((c) => <option key={c}>{c}</option>)}
                  </Select>
                </div>
                <div>
                  <Label htmlFor="b-th" className="text-xs text-muted">giá trị</Label>
                  <Input id="b-th" type="number" min={0} max={100} value={builder.threshold} onChange={(e) => updateBuilder({ threshold: clampHumidity(Number(e.target.value)) })} />
                </div>
                <div>
                  <Label htmlFor="b-con" className="text-xs text-muted">nối</Label>
                  <Select id="b-con" value={builder.connector} onChange={(e) => updateBuilder({ connector: e.target.value as BuilderRule["connector"] })}>
                    <option value="none">(không)</option>
                    <option value="and">and</option>
                    <option value="or">or</option>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="b-w" className="text-xs text-muted">bình nước</Label>
                  <Select id="b-w" value={builder.water} disabled={builder.connector === "none"} onChange={(e) => updateBuilder({ water: e.target.value as BuilderRule["water"] })}>
                    <option value="has_water">has_water</option>
                    <option value="not has_water">not has_water</option>
                  </Select>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="editor">
              <Label htmlFor="rule-text" className="text-xs text-muted">
                Viết điều kiện bằng Python, dùng biến humidity (độ ẩm), has_water (còn nước) và các toán tử &lt; &lt;= &gt; &gt;= == and or not
              </Label>
              <Input
                id="rule-text"
                value={ruleText}
                spellCheck={false}
                autoComplete="off"
                readOnly={ruleLocked}
                maxLength={200}
                onChange={(e) => updateRule(e.target.value)}
                onBlur={commitRuleEvent}
                aria-invalid={!compiled.ok}
                aria-describedby="rule-status"
                className="mt-1 font-mono"
              />
            </TabsContent>
          </Tabs>
          <pre className="mt-3 overflow-x-auto rounded-xl bg-[#0B1220] p-3 font-mono text-[13px] leading-6 text-slate-200" aria-label="Chương trình tương ứng">
            <span className="text-violet-300">if</span> {ruleText || "…"}:{"\n"}    pump_on(){"\n"}<span className="text-violet-300">else</span>:{"\n"}    pump_off()
          </pre>
          <p id="rule-status" className={cn("mt-2 text-sm", compiled.ok ? "text-success-fg" : "text-danger-fg")} role={compiled.ok ? undefined : "alert"}>
            {compiled.ok ? "✓ Điều kiện hợp lệ" : `✗ ${compiled.error.message}${compiled.error.hint ? ` — ${compiled.error.hint}` : ""}`}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button onClick={run} disabled={!compiled.ok || readOnly}>
              <Play /> Chạy thử
            </Button>
            <Button variant="secondary" onClick={runSuite} disabled={!compiled.ok || readOnly || testCases.length === 0}>
              <ListChecks /> Kiểm thử ({testCases.length} trường hợp)
            </Button>
            {!compact && mode !== "assessment" && (
              <Button variant="outline" onClick={runTimeline} disabled={!compiled.ok || readOnly}>
                <TimerReset /> Mô phỏng theo thời gian
              </Button>
            )}
            <Button variant="ghost" onClick={reset} disabled={readOnly}>
              <RotateCcw /> Đặt lại
            </Button>
          </div>
        </div>

        {last && (
          <div className={cn("rounded-2xl border p-4", !showExpected ? "border-line bg-surface" : last.pass ? "border-success/40 bg-success/5" : "border-danger/40 bg-danger/5")}>
            <div className="flex flex-wrap items-center gap-2">
              <Droplets className="size-5 text-cyan-fg" aria-hidden />
              <p className="font-semibold text-fg">Kết quả: máy bơm {last.pump ? "BẬT" : "TẮT"}</p>
              {showExpected && (last.pass ? <Badge tone="success"><CheckCircle2 className="size-3" /> Đúng yêu cầu</Badge> : <Badge tone="danger"><XCircle className="size-3" /> Chưa đúng</Badge>)}
            </div>
            <p className="mt-1 text-sm text-muted">{last.message}</p>
            <ol className="mt-3 space-y-1 font-mono text-xs text-fg" aria-label="Máy kiểm tra điều kiện từng bước">
              {last.trace.map((s, i) => (
                <li key={i} className="flex justify-between gap-3 rounded-lg bg-surface-2 px-2 py-1">
                  <span className="truncate">{s.text}</span>
                  <span className={s.value ? "text-success-fg" : "text-danger-fg"}>{String(s.value === true ? "True" : s.value === false ? "False" : s.value)}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {tests && (
          <div className="rounded-2xl border border-line bg-surface p-4">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="flex items-center gap-2 font-semibold text-fg"><Beaker className="size-4 text-violet-fg" aria-hidden /> Kết quả kiểm thử</h3>
              <Badge tone={passed === tests.length ? "success" : "warning"}>Đạt {passed}/{tests.length}</Badge>
            </div>
            {mode === "assessment" ? (
              <p className="text-sm text-muted">Chế độ kiểm tra: chỉ hiển thị số trường hợp đạt.</p>
            ) : (
              <div className="overflow-x-auto" tabIndex={0} aria-label="Bảng kết quả kiểm thử">
                <table className="w-full text-left text-sm">
                  <caption className="sr-only">Kết quả từng trường hợp</caption>
                  <thead className="text-xs text-muted">
                    <tr>
                      <th className="py-1.5 pr-2 font-medium">Trường hợp</th>
                      <th className="py-1.5 pr-2 font-medium">Mong đợi</th>
                      <th className="py-1.5 pr-2 font-medium">Thực tế</th>
                      <th className="py-1.5 font-medium">KQ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tests.map((r) => {
                      const c = testCases.find((x) => x.id === r.caseId);
                      return (
                        <tr key={r.caseId} className="border-t border-line">
                          <td className="py-1.5 pr-2 text-fg">{c?.name}</td>
                          <td className="py-1.5 pr-2 text-muted">{r.expected ? "Bật" : "Tắt"}</td>
                          <td className="py-1.5 pr-2 text-muted">{r.actual ? "Bật" : "Tắt"}</td>
                          <td className="py-1.5">{r.pass ? <CheckCircle2 className="size-4 text-success-fg" aria-label="Đạt" /> : <XCircle className="size-4 text-danger-fg" aria-label="Không đạt" />}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {timeline && (
          <div className="rounded-2xl border border-line bg-surface p-4">
            <h3 className="mb-2 font-semibold text-fg">Mô phỏng theo thời gian</h3>
            <p className="mb-2 text-xs text-muted">Mỗi bước: bơm bật thì độ ẩm tăng 12%, nước giảm 20%; bơm tắt thì độ ẩm giảm 7%. Ô màu là lúc bơm bật.</p>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timeline} margin={{ left: -20, right: 8, top: 4 }}>
                  <CartesianGrid stroke="var(--line)" strokeDasharray="3 3" />
                  <XAxis dataKey="step" stroke="var(--muted)" fontSize={11} />
                  <YAxis domain={[0, 100]} stroke="var(--muted)" fontSize={11} />
                  <Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 12, color: "var(--fg)" }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="humidity" name="Độ ẩm %" stroke="var(--cyan)" strokeWidth={2} dot={false} isAnimationActive={false} />
                  <Line type="stepAfter" dataKey="water" name="Nước %" stroke="var(--violet)" strokeWidth={2} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 flex gap-1" aria-label="Trạng thái bơm theo bước">
              {timeline.map((p) => (
                <span key={p.step} title={`Bước ${p.step}: bơm ${p.pump ? "bật" : "tắt"}`} className={cn("h-3 flex-1 rounded", p.pump ? "bg-cyan" : "bg-surface-2")} />
              ))}
            </div>
          </div>
        )}

      </section>
    </div>
  );
}
