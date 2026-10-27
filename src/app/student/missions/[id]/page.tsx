"use client";
import { LEVEL_FROM_HINT } from "@/lib/ai/tutor-core";
import { TutorScope } from "@/components/tutor/tutor-provider";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, Bot, CheckCircle2, Clock, Pause, Play, RotateCcw, Send, XCircle } from "lucide-react";
import { toast } from "sonner";
import type { TestResult } from "@/lib/domain/types";
import { getObjective } from "@/lib/data/curriculum";
import { compileRule, diagnose, gardenTestCases, runTests } from "@/lib/sim/smart-garden";
import { callAgent } from "@/lib/ai/client";
import { assignmentBundle, canStudentViewAssignment } from "@/lib/store/scoped";
import { MISSION_STATUS_LABEL, missionStatus } from "@/lib/store/student";
import { useSessionData } from "@/lib/store/use-role";
import { formatDate, relativeDays } from "@/lib/utils";
import { MODE_LABEL } from "@/lib/labels";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ErrorState, Notice } from "@/components/ui/feedback";
import { Field, Input, Textarea } from "@/components/ui/form";
import { PageHeader } from "@/components/ui/misc";
import { DEFAULT_RULE_TEXT, SmartGardenLab } from "@/components/labs/smart-garden/smart-garden-lab";

const MODE = MODE_LABEL;

export default function MissionPage() {
  const { id } = useParams<{ id: string }>();
  const { d, user } = useSessionData();
  if (!canStudentViewAssignment(d, user.id, id))
    return <ErrorState page title="Không truy cập được nhiệm vụ" description="Nhiệm vụ không tồn tại hoặc không thuộc lớp của em." action={<Button asChild><Link href="/student/missions">Về danh sách nhiệm vụ</Link></Button>} />;
  return <Mission key={id} assignmentId={id} />;
}

function Mission({ assignmentId }: { assignmentId: string }) {
  const { d, user } = useSessionData();
  const { assignment, activity, labConfig, rubric, klass, lessonPlan } = assignmentBundle(d, assignmentId);
  const status = missionStatus(d, user.id, assignment!);
  const attempt = d.attempts.find((a) => a.assignmentId === assignmentId && a.studentId === user.id && a.status !== "submitted");
  const submission = d.submissions.find((s) => s.assignmentId === assignmentId && s.studentId === user.id);
  const assessment = submission && d.assessments.find((a) => a.submissionId === submission.id && a.status === "final");
  const cases = labConfig ? gardenTestCases(labConfig.params.threshold).filter((c) => labConfig.testCaseIds.includes(c.id)) : [];

  const [ruleEdit, setRule] = useState<string | null>(null);
  const rule = ruleEdit ?? attempt?.draftRule ?? DEFAULT_RULE_TEXT;
  const [lastTests, setLastTests] = useState<TestResult[] | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [explanation, setExplanation] = useState("");
  const [confirm, setConfirm] = useState<null | { passed: number; total: number; results: TestResult[] }>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [asking, setAsking] = useState(false);

  if (!assignment || !activity || !labConfig) return <ErrorState page title="Nhiệm vụ chưa được thiết lập đầy đủ" />;
  const st = MISSION_STATUS_LABEL[status];
  const canWork = assignment.status === "open" && (status === "not_started" || status === "in_progress" || status === "paused" || status === "overdue");

  function start() {
    d.startAttempt({ studentId: user.id, labTemplateId: labConfig!.labTemplateId, assignmentId, labConfigId: labConfig!.id });
    toast.success("Bắt đầu làm bài");
  }

  function prepareSubmit() {
    const c = compileRule(rule);
    if (!c.ok) return toast.error(`Điều kiện chưa đúng cú pháp: ${c.error.message}`);
    const missing = activity!.questions.filter((q) => !(answers[q.id] ?? "").trim());
    if (missing.length) return toast.error(`Còn ${missing.length} câu hỏi chưa trả lời`);
    if (explanation.trim().length < 15) return toast.error("Viết giải thích ít nhất 15 ký tự");
    const results = runTests(c.ast, cases, labConfig!.params);
    setConfirm({ passed: results.filter((r) => r.pass).length, total: results.length, results });
  }

  function doSubmit() {
    if (!confirm || !attempt) return;
    d.submit({ assignmentId, attemptId: attempt.id, studentId: user.id, rule, explanation: explanation.trim(), answers: activity!.questions.map((q) => ({ questionId: q.id, answer: answers[q.id] ?? "" })), testResults: confirm.results });
    setConfirm(null);
    toast.success("Đã nộp bài");
  }

  async function askMentor() {
    setAsking(true);
    try {
      const failed = lastTests ? diagnose(lastTests) : [];
      const out = await callAgent<{ reply: string; flags: string[] }>("learning-mentor", { message: "Em đang gặp khó, gợi ý giúp em bước tiếp theo", hintMode: assignment!.hintMode, context: { labTemplateId: labConfig!.labTemplateId, lastRule: rule || undefined, failedCategories: failed, threshold: labConfig!.params.threshold } });
      setHint(out.reply);
      d.logAI({ agent: "learning-mentor", userId: user.id, contextRef: `Attempt:${attempt?.id}`, inputSummary: "Hỏi gợi ý trong nhiệm vụ", output: out, flags: out.flags });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Trợ lý chưa trả lời được, hãy thử lại");
    } finally {
      setAsking(false);
    }
  }

  return (
    <TutorScope title={assignment.title} topic="logic" level={LEVEL_FROM_HINT[assignment.hintMode]} objectiveId={activity?.objectiveIds?.[0]}>
    <>
      <Button asChild variant="ghost" size="sm" className="mb-3"><Link href="/student/missions"><ArrowLeft /> Nhiệm vụ</Link></Button>
      <PageHeader
        title={assignment.title}
        description={`${klass?.name} · Hạn ${formatDate(assignment.dueAt, true)} (${relativeDays(assignment.dueAt)})`}
        badge={<><Badge tone={st.tone}>{st.label}</Badge><Badge tone="cyan">{MODE[labConfig.mode]}</Badge></>}
        actions={attempt && canWork ? (
          attempt.status === "paused" ? <Button onClick={() => d.setAttemptStatus(attempt.id, "in_progress")}><Play /> Tiếp tục</Button> : <Button variant="secondary" onClick={() => { d.setAttemptStatus(attempt.id, "paused"); toast.info("Đã tạm dừng, bài làm được lưu"); }}><Pause /> Tạm dừng</Button>
        ) : null}
      />

      <div className="mb-5 grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader><CardTitle as="h2">Yêu cầu</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="text-fg">{activity.instructions}</p>
            <p className="text-xs text-muted">Bài học: {lessonPlan?.title}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle as="h2">Tiêu chí chấm</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {rubric?.criteria.map((c) => <li key={c.id}><span className="font-mono text-xs text-cyan-fg">{c.objectiveId}</span> <span className="text-fg">{c.title}</span> <span className="text-muted">({c.maxScore}đ)</span><p className="text-xs text-muted">{getObjective(c.objectiveId)?.description}</p></li>)}
            </ul>
          </CardContent>
        </Card>
      </div>

      {(status === "submitted" || status === "graded") && submission ? (
        <Results submission={submission} assessment={assessment} rubric={rubric!} cases={cases} hideCases={labConfig.mode === "assessment" && !assessment} canRedo={status === "submitted" && assignment.status === "open"} onRedo={() => { d.startAttempt({ studentId: user.id, labTemplateId: labConfig.labTemplateId, assignmentId, labConfigId: labConfig.id }); toast.info("Em có thể làm lại; bài mới sẽ thay bài cũ khi nộp"); }} />
      ) : !attempt ? (
        <Card className="text-center">
          <CardContent className="py-10">
            <Clock className="mx-auto size-10 text-cyan-fg" aria-hidden />
            <p className="mt-3 text-lg font-semibold text-fg">{canWork ? "Sẵn sàng bắt đầu?" : "Nhiệm vụ đã đóng"}</p>
            <p className="mx-auto mt-1 max-w-md text-sm text-muted">Quá trình làm bài của em (các lần thử, kiểm thử) sẽ được lưu để giáo viên xem.</p>
            {canWork && <Button className="mt-5" onClick={start} data-testid="start-mission"><Play /> Bắt đầu nhiệm vụ</Button>}
          </CardContent>
        </Card>
      ) : attempt.status === "paused" ? (
        <Notice tone="warning" className="flex flex-wrap items-center gap-3"><Pause className="size-4" /> Nhiệm vụ đang tạm dừng. <Button size="sm" onClick={() => d.setAttemptStatus(attempt.id, "in_progress")}><Play /> Tiếp tục</Button></Notice>
      ) : (
        <div className="space-y-5">
          <SmartGardenLab
            params={labConfig.params}
            testCases={cases}
            mode={labConfig.mode}
            hintMode={assignment.hintMode}
            attemptId={attempt.id}
            initialRule={attempt.draftRule}
            onRuleChange={setRule}
            onTestResults={(r) => setLastTests(r)}
          />
          {assignment.hintMode !== "off" && (
            <Card className="border-violet/30">
              <CardHeader className="flex-row flex-wrap items-center justify-between gap-2">
                <div><CardTitle as="h3" className="flex items-center gap-2"><Bot className="size-4 text-violet-fg" /> Trợ lý học tập</CardTitle><CardDescription>Gợi ý hướng suy nghĩ, không đưa đáp án.</CardDescription></div>
                <Button size="sm" variant="violet" onClick={askMentor} disabled={asking}>{asking ? "Đang nghĩ…" : "Xin gợi ý"}</Button>
              </CardHeader>
              {hint && <CardContent><p className="rounded-xl bg-violet/10 p-3 text-sm text-fg">{hint}</p></CardContent>}
            </Card>
          )}
          <Card>
            <CardHeader><CardTitle as="h2">Trả lời & giải thích</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {activity.questions.map((q, i) => (
                <fieldset key={q.id} className="rounded-xl border border-line p-4">
                  <legend className="px-1 text-sm font-medium text-fg">Câu {i + 1}. {q.prompt}</legend>
                  {q.kind === "mcq" ? (
                    <div className="mt-1 flex flex-wrap gap-3">
                      {q.options.map((o) => (
                        <label key={o} className="flex cursor-pointer items-center gap-2 text-sm text-fg">
                          <input type="radio" name={q.id} value={o} checked={answers[q.id] === o} onChange={() => setAnswers({ ...answers, [q.id]: o })} className="size-4 accent-[var(--cyan)]" /> {o}
                        </label>
                      ))}
                    </div>
                  ) : (
                    <>
                      <label htmlFor={`ans-${q.id}`} className="sr-only">Trả lời câu {i + 1}</label>
                      <Textarea id={`ans-${q.id}`} value={answers[q.id] ?? ""} onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })} className="mt-1" />
                    </>
                  )}
                </fieldset>
              ))}
              <Field label="Giải thích điều kiện của em (vì sao chọn toán tử và ngưỡng đó?)" htmlFor="explain" hint="Ít nhất 15 ký tự"><Textarea id="explain" value={explanation} onChange={(e) => setExplanation(e.target.value)} /></Field>
              <Field label="Điều kiện sẽ nộp" htmlFor="final-rule"><Input id="final-rule" value={rule} readOnly className="font-mono" /></Field>
              {lastTests ? <p className="text-sm text-muted">Lần kiểm thử gần nhất: đạt {lastTests.filter((r) => r.pass).length}/{lastTests.length}.</p> : <Notice tone="info">Gợi ý: bấm Kiểm thử trước khi nộp để tự kiểm tra.</Notice>}
              <div className="flex justify-end"><Button onClick={prepareSubmit} data-testid="submit-mission"><Send /> Nộp bài</Button></div>
            </CardContent>
          </Card>
        </div>
      )}

      <Dialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <DialogContent title="Xác nhận nộp bài" description="Sau khi nộp, giáo viên sẽ xem điều kiện, câu trả lời và quá trình làm bài của em.">
          {confirm && (
            <div className="space-y-4">
              <p className="rounded-xl bg-surface-2 p-3 text-sm text-fg">Máy kiểm tra: đạt <strong>{confirm.passed}/{confirm.total}</strong> trường hợp.</p>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setConfirm(null)}>Xem lại</Button>
                <Button onClick={doSubmit} data-testid="confirm-submit"><Send /> Nộp</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
    </TutorScope>
  );
}

function Results({ submission, assessment, rubric, cases, hideCases, canRedo, onRedo }: {
  submission: NonNullable<ReturnType<typeof useSessionData>["d"]["submissions"][number]>;
  assessment?: ReturnType<typeof useSessionData>["d"]["assessments"][number];
  rubric: ReturnType<typeof useSessionData>["d"]["rubrics"][number];
  cases: ReturnType<typeof gardenTestCases>;
  hideCases: boolean;
  canRedo: boolean;
  onRedo: () => void;
}) {
  const passed = submission.testResults.filter((r) => r.pass).length;
  const total = assessment ? assessment.scores.reduce((a, s) => a + s.score, 0) : null;
  const max = rubric.criteria.reduce((a, c) => a + c.maxScore, 0);
  return (
    <div className="grid gap-5 lg:grid-cols-2" data-testid="mission-results">
      <Card>
        <CardHeader><CardTitle as="h2">Bài đã nộp</CardTitle><CardDescription>{formatDate(submission.submittedAt, true)}</CardDescription></CardHeader>
        <CardContent className="space-y-3 text-sm">
          <pre className="overflow-x-auto rounded-xl bg-[#0B1220] p-3 font-mono text-[13px] text-slate-200"><span className="text-violet-300">if</span> {submission.rule}:{"\n"}    pump_on()</pre>
          <p className="text-fg">Máy kiểm tra: đạt <strong>{passed}/{submission.testResults.length}</strong></p>
          {!hideCases && (
            <ul className="grid gap-1">
              {submission.testResults.map((r) => (
                <li key={r.caseId} className="flex items-center justify-between rounded-lg bg-surface-2 px-3 py-1.5"><span className="text-fg">{cases.find((c) => c.id === r.caseId)?.name}</span>{r.pass ? <CheckCircle2 className="size-4 text-success-fg" aria-label="đạt" /> : <XCircle className="size-4 text-danger-fg" aria-label="không đạt" />}</li>
              ))}
            </ul>
          )}
          {canRedo && <Button variant="secondary" size="sm" onClick={onRedo}><RotateCcw /> Làm lại & nộp lại</Button>}
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle as="h2">Kết quả chấm của giáo viên</CardTitle></CardHeader>
        <CardContent>
          {!assessment ? <p className="text-sm text-muted">Bài đang chờ giáo viên chấm.</p> : (
            <div className="space-y-3 text-sm">
              <p className="text-3xl font-bold text-fg">{total}<span className="text-lg text-muted">/{max}</span></p>
              <ul className="space-y-2">
                {rubric.criteria.map((c) => {
                  const s = assessment.scores.find((x) => x.criterionId === c.id);
                  return <li key={c.id} className="rounded-lg bg-surface-2 p-2"><div className="flex justify-between"><span className="text-fg">{c.title}</span><span className="font-semibold text-fg">{s?.score}/{c.maxScore}</span></div>{s?.comment && <p className="text-xs text-muted">{s.comment}</p>}</li>;
                })}
              </ul>
              {assessment.feedback && <p className="rounded-xl border border-line p-3 text-fg">💬 {assessment.feedback}</p>}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
