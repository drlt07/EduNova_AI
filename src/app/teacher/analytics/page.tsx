"use client";
import Link from "next/link";
import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { BookOpen, CheckCheck, Copy, Download, Info, Lightbulb, Send, X } from "lucide-react";
import { toast } from "sonner";
import { exportAssessmentsCsv, refinementInput, type RefinementSuggestion } from "@/lib/analytics/compute";
import { completionRows, errorRows, labRetries, METRIC_HELP, metrics, objectiveRows, shortReport, supportGroups, type Row } from "@/lib/analytics/report";
import { beforeAfter } from "@/lib/analytics/compute";
import { callAgent } from "@/lib/ai/client";
import { bookEntry } from "@/lib/sgk/book";
import { teacherClasses } from "@/lib/store/scoped";
import { useSessionData } from "@/lib/store/use-role";
import { cn, downloadText } from "@/lib/utils";
import { fmtScore } from "@/lib/sim/lab-score";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ErrorState, Notice, PageSkeleton } from "@/components/ui/feedback";
import { Select } from "@/components/ui/form";
import { TutorInsightsCard } from "@/components/teacher/tutor-insights";
import { AssignDialog, type AssignPreset } from "@/components/teacher/assign-dialog";
import { lessonAssignables } from "@/components/sgk/reader";

type MetricKey = "complete" | "submit" | "graded";
const ROW_STATE: Record<Row["state"], { label: string; cls: string }> = { done: { label: "xong", cls: "bg-success/15 text-success-fg" }, submitted: { label: "chờ chấm", cls: "bg-violet/15 text-violet-fg" }, missing: { label: "chưa xong", cls: "bg-warning/15 text-warning-fg" } };

function Report() {
  const { d, user } = useSessionData();
  const params = useSearchParams();
  const classes = teacherClasses(d, user.id);
  const [classId, setClassId] = useState(classes.some((c) => c.id === params.get("class")) ? params.get("class")! : "");
  const [drill, setDrill] = useState<MetricKey | null>(null);
  const [openObj, setOpenObj] = useState<string | null>(null);
  const [assign, setAssign] = useState<{ ref?: string; suggest?: AssignPreset[]; classId?: string; studentIds?: string[] } | null>(null);
  const s = { classId: classId || undefined };
  const r = useMemo(() => ({
    m: metrics(d, user.id, s), objs: objectiveRows(d, user.id, s), errs: errorRows(d, user.id, s), groups: supportGroups(d, user.id, s),
    retry: labRetries(d, user.id, s), ba: beforeAfter(d, user.id, s), report: shortReport(d, user.id, s), rows: completionRows(d, user.id, s),
  }), [d, user.id, classId]); // eslint-disable-line react-hooks/exhaustive-deps

  const [suggestions, setSuggestions] = useState<RefinementSuggestion[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [decided, setDecided] = useState<Record<string, "approved" | "rejected">>({});
  const plans = d.lessonPlans.filter((p) => p.ownerId === user.id);
  const [targetPlan, setTargetPlan] = useState("");
  const planForApply = targetPlan || plans[0]?.id || "";

  /** Mở hộp thoại giao bài củng cố cho các em đã chọn, gợi ý nội dung của bài SGK liên quan. */
  const remedy = (studentIds: string[], ref?: string) => {
    const cls = classId || d.enrollments.find((e) => e.studentId === studentIds[0] && classes.some((c) => c.id === e.classId))?.classId;
    const e = ref ? bookEntry(ref) : undefined;
    setAssign({ ref, suggest: e ? lessonAssignables(d, user.id, e) : undefined, classId: cls, studentIds: cls ? studentIds.filter((id) => d.enrollments.some((x) => x.classId === cls && x.studentId === id)) : undefined });
  };

  async function analyse() {
    setLoading(true); setErr(null);
    try { const out = await callAgent<{ suggestions: RefinementSuggestion[] }>("learning-analyst", refinementInput(d, user.id, s)); setSuggestions(out.suggestions); setDecided({}); }
    catch (e) { setErr(e instanceof Error ? e.message : "Lỗi"); }
    finally { setLoading(false); }
  }
  function decide(x: RefinementSuggestion, decision: "approved" | "rejected") {
    const id = d.logAI({ agent: "learning-analyst", userId: user.id, contextRef: `Analytics:${classId || "all"}`, inputSummary: x.trigger, output: x, flags: [] });
    d.reviewAI(id, decision);
    if (decision === "approved") {
      const plan = d.lessonPlans.find((p) => p.id === planForApply);
      if (!plan) return toast.error("Chọn KHBD để ghi cải tiến");
      d.updateLessonPlan(plan.id, { notes: `${plan.notes}\n[Cải tiến từ phân tích] ${x.suggestion} (minh chứng: ${x.trigger})`.trim() });
      d.saveLessonPlanVersion(plan.id, `Cải tiến từ phân tích: ${x.trigger}`, user.id);
      toast.success(`Đã ghi vào KHBD "${plan.title}" thành phiên bản mới`);
    } else toast.info("Đã bỏ qua đề xuất");
    setDecided((v) => ({ ...v, [x.id]: decision }));
  }

  const KPIS: { key: MetricKey | "mastery"; label: string; value: string; of?: string }[] = [
    { key: "complete", label: "Hoàn thành nhiệm vụ", value: `${r.m.complete.value}%`, of: `${r.m.complete.of} lượt` },
    { key: "submit", label: "Nộp bài (chấm tay)", value: `${r.m.submit.value}%`, of: `${r.m.submit.of} lượt` },
    { key: "graded", label: "Đã chấm", value: `${r.m.graded.value}%`, of: `${r.m.graded.of} bài` },
    { key: "mastery", label: "Đạt yêu cầu cần đạt", value: r.objs.length ? `${Math.round(r.objs.reduce((a, o) => a + o.mastery, 0) / r.objs.length)}%` : "—", of: `${r.objs.length} yêu cầu` },
  ];
  const drillRows = drill === "complete" ? r.rows : drill === "submit" ? r.rows.filter((x) => x.detail === "đã chấm" || x.detail === "chờ chấm" || (x.state === "missing" && !x.detail)) : drill === "graded" ? r.rows.filter((x) => x.state === "submitted" || x.detail === "đã chấm") : [];

  return (
    <>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-fg">Kết quả học tập</h1>
          <p className="mt-1 text-muted">Lớp nào, bài nào, yêu cầu nào đang yếu; em nào cần hỗ trợ; giao bài củng cố ngay tại đây.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Select aria-label="Chọn lớp" className="w-40" value={classId} onChange={(e) => setClassId(e.target.value)}>
            <option value="">Tất cả lớp</option>
            {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
          <Button variant="secondary" onClick={() => { downloadText(`edunova-bao-cao-${new Date().toISOString().slice(0, 10)}.csv`, exportAssessmentsCsv(d, user.id, s)); toast.success("Đã xuất CSV"); }}><Download /> CSV điểm</Button>
        </div>
      </div>

      <section className="mb-6 rounded-2xl border border-line bg-surface p-5" aria-labelledby="tt-h">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="tt-h" className="text-lg font-bold text-fg">Báo cáo ngắn</h2>
          <span className="flex gap-1.5">
            <Button size="sm" variant="ghost" onClick={async () => { try { await navigator.clipboard.writeText(r.report.join("\n")); toast.success("Đã sao chép báo cáo"); } catch { toast.error("Trình duyệt chặn sao chép"); } }}><Copy /> Sao chép</Button>
            <Button size="sm" variant="ghost" onClick={() => downloadText(`bao-cao-ngan-${classId || "cac-lop"}.txt`, r.report.join("\n"))}><Download /> Tải về</Button>
          </span>
        </div>
        <ul className="mt-2 space-y-1.5 text-fg">{r.report.map((l) => <li key={l} className="flex gap-2"><span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-cyan" aria-hidden />{l}</li>)}</ul>
      </section>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {KPIS.map((k) => (
          <div key={k.key} className="rounded-2xl border border-line bg-surface p-4">
            <p className="text-sm text-muted">{k.label}</p>
            <p className="mt-1 text-3xl font-bold tabular-nums text-fg">{k.value}</p>
            <p className="text-xs text-muted">{k.of}</p>
            <p className="mt-2 flex gap-1 text-[11px] leading-snug text-muted"><Info className="mt-px size-3 shrink-0" aria-hidden /> {METRIC_HELP[k.key]}</p>
            {k.key !== "mastery" ? <button type="button" onClick={() => setDrill(k.key as MetricKey)} className="mt-2 text-xs font-semibold text-cyan-fg hover:underline">Xem danh sách →</button> : <a href="#muc-tieu" className="mt-2 inline-block text-xs font-semibold text-cyan-fg hover:underline">Xem theo yêu cầu →</a>}
          </div>
        ))}
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <section id="muc-tieu" className="min-w-0 scroll-mt-24 rounded-2xl border border-line bg-surface p-5" aria-labelledby="mt-h">
          <h2 id="mt-h" className="text-lg font-bold text-fg">Theo bài học và yêu cầu cần đạt</h2>
          {r.objs.length === 0 ? <p className="mt-2 text-sm text-muted">Chưa có bài chấm chính thức trong phạm vi này.</p> : (
            <ul className="mt-3 divide-y divide-line">
              {r.objs.map((o) => {
                const weak = o.students.filter((x) => x.pct < 70);
                const isOpen = openObj === o.objectiveId;
                return (
                  <li key={o.objectiveId} className="py-3">
                    <p className="text-xs text-muted">{o.lessonRef ? <Link href={`/teacher/sgk/${o.lessonRef}`} className="inline-flex items-center gap-1 hover:text-cyan-fg"><BookOpen className="size-3" aria-hidden /> {o.lessonTitle}</Link> : "Ngoài SGK số"}</p>
                    <div className="mt-0.5 flex items-start gap-3">
                      <p className="min-w-0 flex-1 text-sm font-medium text-fg">{o.description}</p>
                      <span className={cn("shrink-0 font-bold tabular-nums", o.mastery < 70 ? "text-warning-fg" : "text-success-fg")}>{o.mastery}%</span>
                    </div>
                    <div className="mt-1 h-1.5 rounded-full bg-surface-2"><div className={cn("h-full rounded-full", o.mastery < 70 ? "bg-warning" : "bg-success")} style={{ width: `${o.mastery}%` }} /></div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs">
                      <button type="button" onClick={() => setOpenObj(isOpen ? null : o.objectiveId)} className="font-semibold text-cyan-fg hover:underline" aria-expanded={isOpen}>{isOpen ? "Ẩn" : `Xem ${o.samples} em`}</button>
                      {weak.length > 0 && <button type="button" onClick={() => remedy(weak.map((x) => x.student.id), o.lessonRef)} className="inline-flex items-center gap-1 font-semibold text-cyan-fg hover:underline"><Send className="size-3" aria-hidden /> Củng cố {weak.length} em dưới 70%</button>}
                    </div>
                    {isOpen && <ul className="mt-2 grid gap-1 sm:grid-cols-2">{o.students.map((x) => <li key={x.student.id} className="flex justify-between gap-2 rounded-lg bg-surface-2/60 px-2 py-1 text-xs"><span className="truncate text-fg">{x.student.name}</span><span className={cn("font-semibold tabular-nums", x.pct < 70 ? "text-warning-fg" : "text-success-fg")}>{x.pct}%</span></li>)}</ul>}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <div className="min-w-0 space-y-6">
          <section className="rounded-2xl border border-line bg-surface p-5" aria-labelledby="ht-h">
            <h2 id="ht-h" className="text-lg font-bold text-fg">Nhóm cần hỗ trợ</h2>
            {r.groups.length === 0 ? <p className="mt-2 text-sm text-muted">Chưa có em nào cần hỗ trợ riêng.</p> : (
              <ul className="mt-3 space-y-4">
                {r.groups.map((g) => (
                  <li key={g.id}>
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-fg">{g.title} <span className="font-normal text-muted">({g.students.length} em)</span></p>
                      <Button size="sm" variant="ghost" onClick={() => remedy(g.students.map((x) => x.student.id))}><Send /> Giao củng cố</Button>
                    </div>
                    <p className="text-xs text-muted">{g.why}</p>
                    <p className="mt-1 text-sm text-fg">{g.students.map((x) => `${x.student.name} (${x.note})`).join(", ")}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-2xl border border-line bg-surface p-5" aria-labelledby="loi-h">
            <h2 id="loi-h" className="text-lg font-bold text-fg">Lỗi phổ biến</h2>
            <p className="text-xs text-muted">Từ các ca kiểm thử bị sai trong bài nộp, kèm phần SGK nên ôn lại.</p>
            {r.errs.length === 0 ? <p className="mt-2 text-sm text-muted">Chưa có lỗi nào lặp lại.</p> : (
              <ul className="mt-3 space-y-3">
                {r.errs.map((e) => (
                  <li key={e.key} className="rounded-xl border border-line p-3">
                    <p className="font-medium text-fg">{e.label} <span className="text-sm font-normal text-muted">· {e.students.length} bài</span></p>
                    <p className="text-sm text-muted">{e.students.map((u) => u.name).join(", ")}</p>
                    <div className="mt-1.5 flex flex-wrap gap-3 text-xs font-semibold">
                      {e.sgk && <Link href={`/teacher/sgk/${e.sgk.ref}#muc-${e.sgk.section}`} className="inline-flex items-center gap-1 text-cyan-fg hover:underline"><BookOpen className="size-3" aria-hidden /> {e.sgk.title}</Link>}
                      <button type="button" onClick={() => remedy(e.students.map((u) => u.id), e.sgk?.ref)} className="inline-flex items-center gap-1 text-cyan-fg hover:underline"><Send className="size-3" aria-hidden /> Giao bài củng cố</button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-2xl border border-line bg-surface p-5" aria-labelledby="tb-h">
            <h2 id="tb-h" className="text-lg font-bold text-fg">Trước và sau khi hỗ trợ</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-surface-2/60 p-3">
                <p className="text-xs text-muted">Bài chấm theo tiêu chí (lần đầu → lần gần nhất, cùng em, cùng yêu cầu)</p>
                {r.ba ? <p className="mt-1 text-2xl font-bold text-fg">{r.ba.before}% → <span className="text-success-fg">{r.ba.after}%</span></p> : <p className="mt-1 text-sm text-muted">Cần ít nhất 2 lần chấm trên cùng yêu cầu.</p>}
              </div>
              <div className="rounded-xl bg-surface-2/60 p-3">
                <p className="text-xs text-muted">Mô phỏng (lần đầu → lần tốt nhất, cùng em, cùng mô phỏng)</p>
                {r.retry ? <p className="mt-1 text-2xl font-bold text-fg">{fmtScore(r.retry.before)} → <span className="text-success-fg">{fmtScore(r.retry.after)}</span> <span className="text-xs font-normal text-muted">{r.retry.pairs} lượt làm lại</span></p> : <p className="mt-1 text-sm text-muted">Chưa em nào làm lại mô phỏng.</p>}
              </div>
            </div>
          </section>
        </div>
      </div>

      <TutorInsightsCard classId={classId || undefined} />

      <section className="mt-6 rounded-2xl border border-violet/30 bg-surface p-5" aria-labelledby="ai-h">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 id="ai-h" className="flex items-center gap-2 text-lg font-bold text-fg"><Lightbulb className="size-5 text-violet-fg" aria-hidden /> AI đề xuất hoạt động khắc phục</h2>
            <p className="text-sm text-muted">AI đọc số liệu ở trên và đề xuất hoạt động cho KHBD. Thầy cô duyệt thì đề xuất được ghi vào KHBD thành phiên bản mới.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select aria-label="KHBD nhận cải tiến" className="w-64" value={planForApply} onChange={(e) => setTargetPlan(e.target.value)}>{plans.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}</Select>
            <Button variant="violet" onClick={analyse} disabled={loading}>{loading ? "Đang phân tích…" : "Đề xuất"}</Button>
          </div>
        </div>
        {err && <ErrorState title="Không phân tích được" description={err} />}
        {suggestions?.length === 0 && <Notice tone="info">Số liệu hiện tại chưa cho thấy vấn đề cần điều chỉnh.</Notice>}
        <ul className="mt-3 space-y-3">
          {suggestions?.map((x) => (
            <li key={x.id} className="rounded-xl border border-line bg-surface-2/40 p-4">
              <p className="text-xs font-semibold text-warning-fg">Vì: {x.trigger}</p>
              <p className="mt-1 text-sm text-fg">{x.suggestion}</p>
              <div className="mt-3 flex gap-2">
                {decided[x.id] ? <Badge tone={decided[x.id] === "approved" ? "success" : "neutral"}>{decided[x.id] === "approved" ? "Đã duyệt & ghi vào KHBD" : "Đã bỏ qua"}</Badge> : (
                  <>
                    <Button size="sm" onClick={() => decide(x, "approved")}><CheckCheck /> Duyệt & ghi vào KHBD</Button>
                    <Button size="sm" variant="ghost" onClick={() => decide(x, "rejected")}><X /> Bỏ qua</Button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>

      <Dialog open={!!drill} onOpenChange={(o) => !o && setDrill(null)}>
        {drill && (
          <DialogContent title={KPIS.find((k) => k.key === drill)!.label} description={METRIC_HELP[drill]} className="max-w-2xl">
            {drillRows.length === 0 ? <p className="text-sm text-muted">Không có lượt nào.</p> : (
              <ul className="max-h-[60vh] divide-y divide-line overflow-y-auto text-sm">
                {drillRows.sort((a, b) => a.state.localeCompare(b.state)).map((x, i) => (
                  <li key={i} className="flex items-center gap-3 py-1.5">
                    <span className="w-40 shrink-0 truncate text-fg">{x.student.name}</span>
                    <span className="min-w-0 flex-1 truncate text-muted">{x.assignment}</span>
                    <span className={cn("rounded px-1.5 text-xs font-medium", ROW_STATE[x.state].cls)}>{x.detail ?? ROW_STATE[x.state].label}</span>
                  </li>
                ))}
              </ul>
            )}
          </DialogContent>
        )}
      </Dialog>
      <AssignDialog open={!!assign} onOpenChange={(o) => !o && setAssign(null)} title="Giao bài củng cố" classId={assign?.classId} studentIds={assign?.studentIds} sgkRef={assign?.ref} suggest={assign?.suggest} />
    </>
  );
}

export default function AnalyticsPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Report />
    </Suspense>
  );
}
