"use client";
import Link from "next/link";
import { Suspense, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, ArrowRight, LayoutDashboard, BookOpen, CheckCheck, Copy, Download, Eye, Info, Lightbulb, ListChecks, NotebookPen, Send, Sparkles, ThumbsUp, X } from "lucide-react";
import { toast } from "sonner";
import { exportAssessmentsCsv, refinementInput, type RefinementSuggestion } from "@/lib/analytics/compute";
import { completionRows, errorRows, insights, insightsText, labRetries, METRIC_HELP, metrics, objectiveRows, supportGroups, type Insight, type Row } from "@/lib/analytics/report";
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
import { BiDashboard } from "@/components/teacher/bi-dashboard";
import { AssignDialog, type AssignPreset } from "@/components/teacher/assign-dialog";
import { lessonAssignables } from "@/components/sgk/reader";

type MetricKey = "complete" | "submit" | "graded";
const TONE: Record<Insight["tone"], { label: string; icon: React.ComponentType<{ className?: string }>; text: string; border: string }> = {
  risk: { label: "Cần xử lý", icon: AlertTriangle, text: "text-[#fda4af]", border: "border-[#fb7185]/40" },
  watch: { label: "Theo dõi", icon: Eye, text: "text-[#fcd34d]", border: "border-[#fbbf24]/30" },
  good: { label: "Điểm sáng", icon: ThumbsUp, text: "text-[#6ee7b7]", border: "border-[#34d399]/30" },
};
const ROW_STATE: Record<Row["state"], { label: string; cls: string }> = { done: { label: "xong", cls: "bg-success/15 text-success-fg" }, submitted: { label: "chờ chấm", cls: "bg-violet/15 text-violet-fg" }, missing: { label: "chưa xong", cls: "bg-warning/15 text-warning-fg" } };

function Report() {
  const { d, user } = useSessionData();
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const view = params.get("xem") === "chan-doan" ? "chan-doan" : "tong-quan";
  const classes = teacherClasses(d, user.id);
  const [classId, setClassId] = useState(classes.some((c) => c.id === params.get("class")) ? params.get("class")! : "");
  const [drill, setDrill] = useState<MetricKey | null>(null);
  const [openObj, setOpenObj] = useState<string | null>(null);
  const [assign, setAssign] = useState<{ ref?: string; suggest?: AssignPreset[]; classId?: string; studentIds?: string[] } | null>(null);
  const s = { classId: classId || undefined };
  const r = useMemo(() => ({
    m: metrics(d, user.id, s), objs: objectiveRows(d, user.id, s), errs: errorRows(d, user.id, s), groups: supportGroups(d, user.id, s),
    retry: labRetries(d, user.id, s), ba: beforeAfter(d, user.id, s), ins: insights(d, user.id, s), rows: completionRows(d, user.id, s),
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

  const mastery = r.objs.length ? Math.round(r.objs.reduce((a, o) => a + o.mastery, 0) / r.objs.length) : undefined;
  const KPIS: { key: MetricKey | "mastery"; label: string; value: string; pct?: number; of?: string }[] = [
    { key: "complete", label: "Hoàn thành nhiệm vụ", value: `${r.m.complete.value}%`, pct: r.m.complete.value, of: `${r.m.complete.of} lượt` },
    { key: "submit", label: "Nộp bài (chấm tay)", value: `${r.m.submit.value}%`, pct: r.m.submit.value, of: `${r.m.submit.of} lượt` },
    { key: "graded", label: "Đã chấm", value: `${r.m.graded.value}%`, pct: r.m.graded.value, of: `${r.m.graded.of} bài` },
    { key: "mastery", label: "Đạt yêu cầu cần đạt", value: mastery === undefined ? "—" : `${mastery}%`, pct: mastery, of: `${r.objs.length} yêu cầu` },
  ];
  const scopeName = classId ? `lớp ${classes.find((c) => c.id === classId)?.name}` : "các lớp";
  const reportText = insightsText(r.ins, scopeName);
  /** Ghi nhận định vào KHBD của bài (phiên bản mới); chưa có KHBD thì mở trợ lý soạn. */
  const toPlan = (lessonId: string, note: string) => {
    const plan = d.lessonPlans.find((p) => p.ownerId === user.id && p.lessonId === lessonId);
    if (!plan) { toast.info("Bài này chưa có KHBD, mở Trợ lý KHBD để soạn"); router.push(`/teacher/lesson-planner/assistant?lesson=${lessonId}`); return; }
    d.updateLessonPlan(plan.id, { notes: `${plan.notes}\n[Từ báo cáo kết quả] ${note}`.trim() });
    d.saveLessonPlanVersion(plan.id, "Điều chỉnh từ báo cáo kết quả", user.id);
    toast.success(`Đã ghi vào KHBD “${plan.title}” thành phiên bản mới`);
  };
  const drillRows = drill === "complete" ? r.rows : drill === "submit" ? r.rows.filter((x) => x.detail === "đã chấm" || x.detail === "chờ chấm" || (x.state === "missing" && !x.detail)) : drill === "graded" ? r.rows.filter((x) => x.state === "submitted" || x.detail === "đã chấm") : [];

  return (
    <>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-fg">Kết quả học tập</h1>
          <p className="mt-1 text-muted">Bảng tổng quan số liệu các lớp; chuyển sang Chẩn đoán để xem việc cần xử lý và giao bài củng cố.</p>
        </div>
        <nav aria-label="Chế độ xem" className="flex gap-1 rounded-xl border border-line bg-surface p-1">
          {([["tong-quan", "Tổng quan", LayoutDashboard], ["chan-doan", "Chẩn đoán & hành động", Sparkles]] as const).map(([v, l, I]) => (
            <button key={v} type="button" aria-pressed={view === v} onClick={() => router.replace(v === "tong-quan" ? pathname : `${pathname}?xem=${v}`, { scroll: false })} className={cn("flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold", view === v ? "bg-brand text-brand-ink" : "text-muted hover:text-fg")}><I className="size-4" aria-hidden /> {l}</button>
          ))}
        </nav>
      </div>
      {view === "tong-quan" ? <BiDashboard /> : <>
      <div className="mb-5 flex flex-wrap items-end justify-end gap-3">
        <div className="flex flex-wrap gap-2">
          <Select aria-label="Chọn lớp" className="w-40" value={classId} onChange={(e) => setClassId(e.target.value)}>
            <option value="">Tất cả lớp</option>
            {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
          <Button variant="secondary" onClick={() => { downloadText(`edunova-bao-cao-${new Date().toISOString().slice(0, 10)}.csv`, exportAssessmentsCsv(d, user.id, s)); toast.success("Đã xuất CSV"); }}><Download /> CSV điểm</Button>
        </div>
      </div>

      <section className="mb-6 overflow-hidden rounded-3xl bg-[#0f172a] p-5 text-white shadow-lg shadow-slate-900/10 sm:p-6" aria-labelledby="cd-h">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#f59e0b] to-[#ea580c]"><Sparkles className="size-5" aria-hidden /></span>
            <div>
              <h2 id="cd-h" className="text-lg font-bold">Chẩn đoán {scopeName}</h2>
              <p className="text-sm text-slate-300">Đọc chéo yêu cầu cần đạt, lỗi kiểm thử, nhiệm vụ và mô phỏng; việc cần xử lý xếp trước.</p>
            </div>
          </div>
          <span className="flex gap-1.5">
            <button type="button" className="inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold text-slate-200 hover:bg-white/10" onClick={async () => { try { await navigator.clipboard.writeText(reportText); toast.success("Đã sao chép báo cáo"); } catch { toast.error("Trình duyệt chặn sao chép"); } }}><Copy className="size-4" aria-hidden /> Sao chép</button>
            <button type="button" className="inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold text-slate-200 hover:bg-white/10" onClick={() => downloadText(`bao-cao-${classId || "cac-lop"}.txt`, reportText)}><Download className="size-4" aria-hidden /> Tải về</button>
          </span>
        </div>
        {r.ins.length === 0 ? <p className="mt-4 text-sm text-slate-300">Chưa đủ số liệu để chẩn đoán. Khi các em nộp bài và làm mô phỏng, nhận định sẽ hiện ở đây.</p> : (
          <ol className="mt-5 grid gap-3 lg:grid-cols-2">
            {r.ins.map((x, i) => {
              const T = TONE[x.tone];
              return (
                <li key={x.id} className={cn("flex flex-col rounded-2xl border bg-white/[0.04] p-4", T.border)}>
                  <p className={cn("flex items-center gap-1.5 text-xs font-semibold", T.text)}><T.icon className="size-4" aria-hidden /> {i + 1}. {T.label}</p>
                  <h3 className="mt-1 font-semibold leading-snug text-white">{x.title}</h3>
                  <p className="mt-1 text-sm text-slate-300">{x.evidence}</p>
                  {x.advice && <p className="mt-2 rounded-lg bg-white/5 px-3 py-2 text-sm text-slate-200">{x.advice}</p>}
                  {x.actions.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2 pt-1">
                      {x.actions.map((a, j) => {
                        const cls = j === 0 ? "bg-[#22d3ee] text-slate-900 hover:bg-[#67e8f9]" : "border border-white/20 text-white hover:bg-white/10";
                        const inner = <>{a.kind === "remedy" ? <Send className="size-3.5" aria-hidden /> : a.kind === "plan" ? <NotebookPen className="size-3.5" aria-hidden /> : a.kind === "drill" ? <ListChecks className="size-3.5" aria-hidden /> : <ArrowRight className="size-3.5" aria-hidden />}{a.label}</>;
                        const base = cn("inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition-colors", cls);
                        if (a.kind === "link") return <Link key={j} href={a.href} className={base}>{inner}</Link>;
                        return <button key={j} type="button" className={base} onClick={() => a.kind === "remedy" ? remedy(a.studentIds, a.ref) : a.kind === "drill" ? setDrill(a.metric) : toPlan(a.lessonId, a.note)}>{inner}</button>;
                      })}
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
        )}
      </section>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {KPIS.map((k) => {
          const v = k.pct;
          const tone = v === undefined ? "neutral" : v >= 80 ? "good" : v >= 60 ? "mid" : "low";
          const color = { good: "text-success-fg", mid: "text-warning-fg", low: "text-danger-fg", neutral: "text-fg" }[tone];
          const bar = { good: "bg-success", mid: "bg-warning", low: "bg-danger", neutral: "bg-line" }[tone];
          const body = (
            <>
              <span className="flex items-center justify-between gap-2 text-sm text-muted">{k.label}<span title={METRIC_HELP[k.key]} aria-label={`Cách tính: ${METRIC_HELP[k.key]}`}><Info className="size-3.5" /></span></span>
              <span className="mt-1 flex items-baseline gap-2"><span className={cn("text-3xl font-bold tabular-nums", color)}>{k.value}</span><span className="text-xs text-muted">{k.of}</span></span>
              <span className="mt-2 block h-1.5 rounded-full bg-surface-2"><span className={cn("block h-full rounded-full", bar)} style={{ width: `${v ?? 0}%` }} /></span>
              <span className="mt-2 block text-xs text-muted">{tone === "good" ? "Tốt" : tone === "mid" ? "Cần chú ý" : tone === "low" ? "Đáng lo" : "Chưa có số liệu"} · mục tiêu 80%</span>
            </>
          );
          return k.key === "mastery"
            ? <a key={k.key} href="#muc-tieu" className="block rounded-2xl border border-line bg-surface p-4 transition-colors hover:border-brand/40">{body}</a>
            : <button key={k.key} type="button" onClick={() => setDrill(k.key as MetricKey)} className="block rounded-2xl border border-line bg-surface p-4 text-left transition-colors hover:border-brand/40">{body}</button>;
        })}
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
                    <p className="text-xs text-muted">{o.lessonRef ? <Link href={`/teacher/sgk/${o.lessonRef}`} className="inline-flex items-center gap-1 hover:text-cyan-fg"><BookOpen className="size-3" aria-hidden /> {o.lessonTitle}</Link> : "Ngoài khóa học"}</p>
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
      </>}
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
