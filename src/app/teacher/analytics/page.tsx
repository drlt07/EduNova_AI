"use client";
import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Activity, CheckCheck, Download, FlaskConical, Lightbulb, Users, X } from "lucide-react";
import { toast } from "sonner";
import { attemptStats, beforeAfter, completion, errorPatterns, exportAssessmentsCsv, objectiveMastery, refinementInput, type RefinementSuggestion } from "@/lib/analytics/compute";
import { callAgent } from "@/lib/ai/client";
import { teacherAssignments, teacherClasses } from "@/lib/store/scoped";
import { useSessionData } from "@/lib/store/use-role";
import { downloadText } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState, ErrorState, Notice } from "@/components/ui/feedback";
import { Select } from "@/components/ui/form";
import { PageHeader, StatCard } from "@/components/ui/misc";

const tooltipStyle = { background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 12, color: "var(--fg)", fontSize: 12 };

export default function AnalyticsPage() {
  const { d, user } = useSessionData();
  const [classId, setClassId] = useState("");
  const [assignmentId, setAssignmentId] = useState("");
  const f = { classId: classId || undefined, assignmentId: assignmentId || undefined };
  const a = useMemo(() => ({
    mastery: objectiveMastery(d, user.id, f),
    comp: completion(d, user.id, f),
    patterns: errorPatterns(d, user.id, f),
    stats: attemptStats(d, user.id, f),
    ba: beforeAfter(d, user.id, f),
  }), [d, user.id, classId, assignmentId]); // eslint-disable-line react-hooks/exhaustive-deps
  const [suggestions, setSuggestions] = useState<RefinementSuggestion[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [decided, setDecided] = useState<Record<string, "approved" | "rejected">>({});
  const assignments = teacherAssignments(d, user.id).filter((x) => !classId || x.classId === classId);
  const plans = d.lessonPlans.filter((p) => p.ownerId === user.id);
  const linkedPlanId = assignmentId ? d.activities.find((x) => x.id === d.assignments.find((y) => y.id === assignmentId)?.activityId)?.lessonPlanId : undefined;
  const [targetPlan, setTargetPlan] = useState<string>("");
  const planForApply = targetPlan || linkedPlanId || plans[0]?.id || "";

  async function analyse() {
    setLoading(true);
    setErr(null);
    try {
      const out = await callAgent<{ suggestions: RefinementSuggestion[] }>("learning-analyst", refinementInput(d, user.id, f));
      setSuggestions(out.suggestions);
      setDecided({});
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Lỗi");
    } finally {
      setLoading(false);
    }
  }

  function decide(s: RefinementSuggestion, decision: "approved" | "rejected") {
    const id = d.logAI({ agent: "learning-analyst", userId: user.id, contextRef: `Analytics:${classId || "all"}:${assignmentId || "all"}`, inputSummary: s.trigger, output: s, flags: [] });
    d.reviewAI(id, decision);
    if (decision === "approved") {
      const plan = d.lessonPlans.find((p) => p.id === planForApply);
      if (!plan) return toast.error("Chọn KHBD để ghi cải tiến");
      d.updateLessonPlan(plan.id, { notes: `${plan.notes}\n[Cải tiến từ phân tích] ${s.suggestion} (minh chứng: ${s.trigger})`.trim() });
      d.saveLessonPlanVersion(plan.id, `Cải tiến từ phân tích: ${s.trigger}`, user.id);
      toast.success(`Đã ghi vào KHBD "${plan.title}" thành phiên bản mới`);
    } else toast.info("Đã bỏ qua đề xuất");
    setDecided((x) => ({ ...x, [s.id]: decision }));
  }

  const masteryData = a.mastery.map((m) => ({ name: m.objectiveId, value: m.mastery }));
  const patternData = a.patterns.map((p) => ({ name: p.label, value: p.count }));

  return (
    <>
      <PageHeader
        title="Thống kê học tập"
        description="Mức đạt theo mục tiêu, tỉ lệ nộp bài, lỗi thường gặp và số lần thử của học sinh."
        actions={<Button variant="secondary" onClick={() => { downloadText(`edunova-bao-cao-${new Date().toISOString().slice(0, 10)}.csv`, exportAssessmentsCsv(d, user.id, f)); toast.success("Đã xuất CSV"); }}><Download /> Xuất báo cáo (CSV)</Button>}
      />
      <div className="mb-5 flex flex-wrap gap-3">
        <Select aria-label="Lọc lớp" className="w-44" value={classId} onChange={(e) => { setClassId(e.target.value); setAssignmentId(""); }}>
          <option value="">Mọi lớp</option>
          {teacherClasses(d, user.id).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </Select>
        <Select aria-label="Lọc nhiệm vụ" className="w-72" value={assignmentId} onChange={(e) => setAssignmentId(e.target.value)}>
          <option value="">Mọi nhiệm vụ</option>
          {assignments.map((x) => <option key={x.id} value={x.id}>{d.classes.find((c) => c.id === x.classId)?.name} · {x.title}</option>)}
        </Select>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Đã nộp bài" value={`${a.comp.rate}%`} hint={`${a.comp.submitted}/${a.comp.expected} lượt`} icon={Users} />
        <StatCard label="Đã chấm" value={`${a.comp.gradedRate}%`} hint={`${a.comp.graded} bài đã có điểm`} icon={CheckCheck} tone="success" />
        <StatCard label="Số lần thử trung bình" value={a.stats.avgRuns} hint={`trên ${a.stats.attempts} lượt làm`} icon={Activity} tone="blue" />
        <StatCard label="Có tự kiểm thử" value={`${a.stats.testedShare}%`} hint="số lượt làm có kiểm thử" icon={FlaskConical} tone="violet" />
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader><CardTitle as="h2">Mức đạt theo mục tiêu</CardTitle><CardDescription>Tỉ lệ điểm đạt được trên điểm tối đa của các tiêu chí gắn với mục tiêu.</CardDescription></CardHeader>
          <CardContent>
            {masteryData.length === 0 ? <EmptyState title="Chưa có bài được chấm" description="Chấm bài ở mục Chấm bài để thấy số liệu." /> : (
              <div className="h-64" role="img" aria-label={`Mức đạt: ${masteryData.map((m) => `${m.name} ${m.value}%`).join(", ")}`}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={masteryData} margin={{ left: -16, right: 8 }}>
                    <CartesianGrid stroke="var(--line)" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" stroke="var(--muted)" fontSize={11} />
                    <YAxis domain={[0, 100]} stroke="var(--muted)" fontSize={11} unit="%" />
                    <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--surface-2)" }} formatter={(v) => [`${v}%`, "Mức đạt"]} />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]} isAnimationActive={false}>
                      {masteryData.map((m) => <Cell key={m.name} fill={m.value < 70 ? "var(--warning)" : "var(--cyan)"} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
            <ul className="mt-3 space-y-1 text-xs text-muted">{a.mastery.map((m) => <li key={m.objectiveId}><span className="font-mono text-cyan-fg">{m.objectiveId}</span> {m.description} — <span className="text-fg">{m.mastery}%</span> ({m.samples} bài)</li>)}</ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle as="h2">Lỗi thường gặp</CardTitle><CardDescription>Theo các trường hợp máy kiểm tra báo sai.</CardDescription></CardHeader>
          <CardContent>
            {a.comp.submitted === 0 ? <EmptyState title="Chưa có bài nộp" /> : (
              <div className="h-64" role="img" aria-label={`Mẫu lỗi: ${patternData.map((p) => `${p.name} ${p.value}`).join(", ")}`}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={patternData} layout="vertical" margin={{ left: 40, right: 16 }}>
                    <CartesianGrid stroke="var(--line)" strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" allowDecimals={false} stroke="var(--muted)" fontSize={11} />
                    <YAxis type="category" dataKey="name" width={150} stroke="var(--muted)" fontSize={11} />
                    <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--surface-2)" }} formatter={(v) => [v, "Bài nộp"]} />
                    <Bar dataKey="value" fill="var(--violet)" radius={[0, 8, 8, 0]} isAnimationActive={false} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle as="h2">Số lần chạy thử</CardTitle></CardHeader>
          <CardContent>
            {a.stats.attempts === 0 ? <EmptyState title="Chưa có lượt làm" /> : (
              <ul className="space-y-3">
                {a.stats.buckets.map((b) => (
                  <li key={b.label}>
                    <div className="mb-1 flex justify-between text-sm"><span className="text-fg">{b.label}</span><span className="text-muted">{b.count} lượt</span></div>
                    <div className="h-2 overflow-hidden rounded-full bg-surface-2"><div className="h-full rounded-full bg-gradient-to-r from-cyan to-blue" style={{ width: `${(b.count / Math.max(1, a.stats.attempts)) * 100}%` }} /></div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle as="h2">Tiến bộ</CardTitle><CardDescription>So sánh lần chấm đầu và lần gần nhất của cùng học sinh, cùng mục tiêu.</CardDescription></CardHeader>
          <CardContent>
            {a.ba ? (
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="rounded-xl bg-surface-2 p-4"><p className="text-xs text-muted">Lần đầu</p><p className="text-3xl font-bold text-fg">{a.ba.before}%</p></div>
                <div className="rounded-xl bg-surface-2 p-4"><p className="text-xs text-muted">Lần gần nhất</p><p className="text-3xl font-bold text-cyan-fg">{a.ba.after}%</p></div>
                <p className="col-span-2 text-xs text-muted">Dựa trên {a.ba.pairs} kết quả</p>
              </div>
            ) : (
              <EmptyState title="Chưa đủ dữ liệu" description="Cần học sinh được chấm ít nhất 2 lần trên cùng mục tiêu." />
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6 border-violet/30">
        <CardHeader className="flex-row flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle as="h2" className="flex items-center gap-2"><Lightbulb className="size-4 text-violet-fg" /> Gợi ý cải tiến KHBD</CardTitle>
            <CardDescription>Bạn duyệt gợi ý nào thì gợi ý đó được ghi vào KHBD thành phiên bản mới.</CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select aria-label="KHBD nhận cải tiến" className="w-64" value={planForApply} onChange={(e) => setTargetPlan(e.target.value)}>
              {plans.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
            </Select>
            <Button variant="violet" onClick={analyse} disabled={loading}>{loading ? "Đang phân tích…" : "Phân tích & đề xuất"}</Button>
          </div>
        </CardHeader>
        <CardContent>
          {err && <ErrorState title="Không phân tích được" description={err} />}
          {!suggestions && !err && <p className="text-sm text-muted">Nhấn “Phân tích & đề xuất” để nhận gợi ý từ kết quả hiện có.</p>}
          {suggestions?.length === 0 && <Notice tone="info">Chưa có gợi ý — kết quả hiện tại chưa cho thấy vấn đề nổi bật.</Notice>}
          <ul className="space-y-3">
            {suggestions?.map((s) => (
              <li key={s.id} className="rounded-xl border border-line bg-surface-2/40 p-4">
                <p className="text-xs font-semibold text-warning-fg">{s.trigger}{s.objectiveId && <span className="ml-2 font-mono text-cyan-fg">{s.objectiveId}</span>}</p>
                <p className="mt-1 text-sm text-fg">{s.suggestion}</p>
                <div className="mt-3 flex gap-2">
                  {decided[s.id] ? <Badge tone={decided[s.id] === "approved" ? "success" : "neutral"}>{decided[s.id] === "approved" ? "Đã duyệt & ghi vào KHBD" : "Đã bỏ qua"}</Badge> : (
                    <>
                      <Button size="sm" onClick={() => decide(s, "approved")}><CheckCheck /> Duyệt & ghi vào KHBD</Button>
                      <Button size="sm" variant="ghost" onClick={() => decide(s, "rejected")}><X /> Bỏ qua</Button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </>
  );
}
