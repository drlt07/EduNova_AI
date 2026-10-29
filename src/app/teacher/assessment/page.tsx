"use client";
import { Suspense, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Bot, CheckCircle2, ClipboardCheck, Save, XCircle } from "lucide-react";
import { toast } from "sonner";
import type { Assessment, Rubric, Submission } from "@/lib/domain/types";
import { gardenTestCases } from "@/lib/sim/smart-garden";
import { suggestScores } from "@/lib/analytics/suggest-score";
import { teacherAssignments, teacherClasses, teacherSubmissions } from "@/lib/store/scoped";
import { useSessionData } from "@/lib/store/use-role";
import { cn, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState, Notice, PageSkeleton } from "@/components/ui/feedback";
import { Field, Select, Textarea } from "@/components/ui/form";
import { Avatar } from "@/components/ui/misc";
import { AssessTabs } from "@/components/teacher/assess-tabs";
import { LabReviewQueue } from "@/components/teacher/lab-review";
import { EventTimeline } from "@/components/labs/event-timeline";

function AssessmentInner() {
  const { d, user } = useSessionData();
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const assignmentFilter = params.get("assignment") ?? "";
  const [classId, setClassId] = useState("");
  const [status, setStatus] = useState("submitted");
  const setParam = (k: string, v: string) => {
    const next = new URLSearchParams(params.toString());
    if (v) next.set(k, v); else next.delete(k);
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  };

  const queue = useMemo(() => {
    const asg = new Map(teacherAssignments(d, user.id).map((a) => [a.id, a]));
    return teacherSubmissions(d, user.id)
      .filter((s) => (!assignmentFilter || s.assignmentId === assignmentFilter) && (!classId || asg.get(s.assignmentId)?.classId === classId) && (!status || s.status === status))
      .sort((a, b) => a.submittedAt.localeCompare(b.submittedAt));
  }, [d, user.id, assignmentFilter, classId, status]);

  const selectedId = params.get("submission") ?? queue[0]?.id ?? "";
  // chỉ cho xem bài thuộc lớp của mình (mô phỏng RLS)
  const selected = teacherSubmissions(d, user.id).find((s) => s.id === selectedId);

  return (
    <>
      <AssessTabs />
      <LabReviewQueue />
      <h2 className="mb-3 text-lg font-bold text-fg">Bài nộp chấm theo tiêu chí</h2>
      <div className="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
        <aside aria-label="Hàng đợi bài nộp" className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <Select aria-label="Lọc lớp" value={classId} onChange={(e) => setClassId(e.target.value)}>
              <option value="">Mọi lớp</option>
              {teacherClasses(d, user.id).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
            <Select aria-label="Lọc trạng thái" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">Tất cả</option>
              <option value="submitted">Chờ chấm</option>
              <option value="graded">Đã chấm</option>
            </Select>
            <Select aria-label="Lọc nhiệm vụ" className="col-span-2" value={assignmentFilter} onChange={(e) => setParam("assignment", e.target.value)}>
              <option value="">Mọi nhiệm vụ</option>
              {teacherAssignments(d, user.id).map((a) => <option key={a.id} value={a.id}>{d.classes.find((c) => c.id === a.classId)?.name} · {a.title}</option>)}
            </Select>
          </div>
          {queue.length === 0 ? <EmptyState icon={ClipboardCheck} title="Không có bài nộp" description={status === "submitted" ? "Hết bài chờ chấm 🎉" : "Thử đổi bộ lọc."} /> : (
            <ul className="space-y-2">
              {queue.map((s) => {
                const st = d.users.find((u) => u.id === s.studentId)!;
                const passed = s.testResults.filter((r) => r.pass).length;
                return (
                  <li key={s.id}>
                    <button type="button" data-testid={`queue-${st.id}`} aria-pressed={selected?.id === s.id} onClick={() => setParam("submission", s.id)} className={cn("flex w-full items-center gap-3 rounded-xl border p-3 text-left", selected?.id === s.id ? "border-cyan/60 bg-cyan/10" : "border-line bg-surface hover:border-cyan/30")}>
                      <Avatar user={st} size={32} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium text-fg">{st.name}</span>
                        <span className="block truncate text-xs text-muted">{d.assignments.find((a) => a.id === s.assignmentId)?.title}</span>
                      </span>
                      <span className="flex flex-col items-end gap-1">
                        <Badge tone={passed === s.testResults.length ? "success" : "warning"}>{passed}/{s.testResults.length}</Badge>
                        {s.status === "graded" && <span className="text-[10px] text-success-fg">đã chấm</span>}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </aside>
        <div className="min-w-0">{selected ? <SubmissionDetail key={selected.id} sub={selected} /> : <EmptyState title="Chọn một bài nộp" description="Bài làm và tiêu chí chấm sẽ hiện ở đây." />}</div>
      </div>
    </>
  );
}

function SubmissionDetail({ sub }: { sub: Submission }) {
  const { d, user } = useSessionData();
  const student = d.users.find((u) => u.id === sub.studentId)!;
  const assignment = d.assignments.find((a) => a.id === sub.assignmentId)!;
  const activity = d.activities.find((a) => a.id === assignment.activityId);
  const rubric = activity && d.rubrics.find((r) => r.id === activity.rubricId);
  const cfg = activity?.labConfigId ? d.labConfigs.find((c) => c.id === activity.labConfigId) : undefined;
  const cases = gardenTestCases(cfg?.params.threshold ?? 40);
  const events = d.events.filter((e) => e.attemptId === sub.attemptId);
  const existing = d.assessments.find((a) => a.submissionId === sub.id);
  if (!rubric) return <EmptyState title="Không tìm thấy tiêu chí chấm" />;
  return <Grader sub={sub} rubric={rubric} existing={existing} studentName={student.name} assignmentTitle={assignment.title} cases={cases} events={events} activity={activity!} teacherId={user.id} saveAssessment={d.saveAssessment} logAI={d.logAI} student={student} />;
}

function Grader(props: {
  sub: Submission;
  rubric: Rubric;
  existing?: Assessment;
  studentName: string;
  assignmentTitle: string;
  cases: ReturnType<typeof gardenTestCases>;
  events: ReturnType<typeof useSessionData>["d"]["events"];
  activity: NonNullable<ReturnType<typeof useSessionData>["d"]["activities"][number]>;
  teacherId: string;
  saveAssessment: ReturnType<typeof useSessionData>["d"]["saveAssessment"];
  logAI: ReturnType<typeof useSessionData>["d"]["logAI"];
  student: ReturnType<typeof useSessionData>["d"]["users"][number];
}) {
  const { sub, rubric, existing, cases, events, activity } = props;
  const [scores, setScores] = useState<Record<string, number>>(() => Object.fromEntries(rubric.criteria.map((c) => [c.id, existing?.scores.find((s) => s.criterionId === c.id)?.score ?? 0])));
  const [comments, setComments] = useState<Record<string, string>>(() => Object.fromEntries(rubric.criteria.map((c) => [c.id, existing?.scores.find((s) => s.criterionId === c.id)?.comment ?? ""])));
  const [feedback, setFeedback] = useState(existing?.feedback ?? "");
  const [suggestions, setSuggestions] = useState<ReturnType<typeof suggestScores> | null>(null);
  const [usedAi, setUsedAi] = useState(existing?.usedAiSuggestion ?? false);
  const total = Object.values(scores).reduce((a, b) => a + b, 0);
  const max = rubric.criteria.reduce((a, c) => a + c.maxScore, 0);
  const passed = sub.testResults.filter((r) => r.pass).length;

  function save(status: "draft" | "final") {
    if (status === "final" && rubric.criteria.some((c) => !scores[c.id])) return toast.error("Hãy chấm đủ các tiêu chí trước khi lưu");
    props.saveAssessment({ submissionId: sub.id, teacherId: props.teacherId, rubricId: rubric.id, scores: rubric.criteria.map((c) => ({ criterionId: c.id, score: scores[c.id], comment: comments[c.id] })), feedback, usedAiSuggestion: usedAi, status });
    toast.success(status === "final" ? "Đã lưu kết quả chấm — thống kê đã cập nhật" : "Đã lưu nháp");
  }

  function suggest() {
    const s = suggestScores(sub, rubric, events);
    setSuggestions(s);
    props.logAI({ agent: "learning-analyst", userId: props.teacherId, contextRef: `Submission:${sub.id}`, inputSummary: "Gợi ý điểm", output: s, flags: [] });
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardContent className="flex flex-col gap-4 pt-5 md:flex-row md:items-center">
          <Avatar user={props.student} size={48} />
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-bold text-fg">{props.studentName}</h2>
            <p className="text-sm text-muted">{props.assignmentTitle} · nộp {formatDate(sub.submittedAt, true)}</p>
          </div>
          <div className="flex gap-2">
            <Badge tone={passed === sub.testResults.length ? "success" : "warning"} className="text-sm">Máy kiểm tra: đạt {passed}/{sub.testResults.length}</Badge>
            <Badge tone={existing?.status === "final" ? "success" : "neutral"} className="text-sm">{existing?.status === "final" ? "Đã chấm" : existing ? "Đang chấm dở" : "Chưa chấm"}</Badge>
          </div>
        </CardContent>
      </Card>
      <div className="grid gap-5 2xl:grid-cols-2">
        <Card>
          <CardHeader><CardTitle as="h3">Bài làm</CardTitle></CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Điều kiện học sinh viết</p>
              <pre className="mt-1 overflow-x-auto rounded-xl bg-[#0B1220] p-3 font-mono text-[13px] text-slate-200"><span className="text-violet-300">if</span> {sub.rule}:{"\n"}    pump_on()</pre>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Giải thích của học sinh</p>
              <p className="mt-1 whitespace-pre-wrap rounded-xl bg-surface-2 p-3 text-fg">{sub.explanation || "(trống)"}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Câu hỏi</p>
              <ul className="mt-1 space-y-2">
                {activity.questions.map((q) => {
                  const ans = sub.answers.find((a) => a.questionId === q.id)?.answer ?? "";
                  const correct = q.kind === "mcq" && q.correctIndex !== undefined ? q.options[q.correctIndex] === ans : null;
                  return (
                    <li key={q.id} className="rounded-xl border border-line p-3">
                      <p className="text-fg">{q.prompt}</p>
                      <p className="mt-1 flex items-center gap-1.5 text-muted">→ {ans || "(không trả lời)"} {correct === true && <CheckCircle2 className="size-4 text-success-fg" aria-label="đúng" />}{correct === false && <XCircle className="size-4 text-danger-fg" aria-label="sai" />}</p>
                    </li>
                  );
                })}
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Máy kiểm tra tự động</p>
              <ul className="mt-1 grid gap-1">
                {sub.testResults.map((r) => (
                  <li key={r.caseId} className="flex items-center justify-between gap-2 rounded-lg bg-surface-2 px-3 py-1.5">
                    <span className="text-fg">{cases.find((c) => c.id === r.caseId)?.name ?? r.caseId}</span>
                    <span className="flex items-center gap-2 text-xs text-muted">cần {r.expected ? "bật" : "tắt"} / bài làm {r.actual ? "bật" : "tắt"} {r.pass ? <CheckCircle2 className="size-4 text-success-fg" aria-label="đạt" /> : <XCircle className="size-4 text-danger-fg" aria-label="không đạt" />}</span>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle as="h3">Quá trình làm bài ({events.length} thao tác)</CardTitle></CardHeader>
          <CardContent tabIndex={0} aria-label="Quá trình làm bài (cuộn được)" className="max-h-[520px] overflow-y-auto"><EventTimeline events={events} /></CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader className="flex-row flex-wrap items-start justify-between gap-3">
          <div><CardTitle as="h3">{rubric.title}</CardTitle><CardDescription>Tổng: <span className="font-semibold text-fg" data-testid="total-score">{total}/{max}</span></CardDescription></div>
          <Button variant="violet" size="sm" onClick={suggest}><Bot /> Gợi ý điểm (tham khảo)</Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {suggestions && (
            <Notice tone="warning">
              <p className="mb-2 font-medium">Gợi ý dựa trên kết quả kiểm tra và quá trình làm bài — chỉ để tham khảo.</p>
              <ul className="space-y-1 text-sm">
                {suggestions.map((s) => <li key={s.criterionId}><strong>{rubric.criteria.find((c) => c.id === s.criterionId)?.title}:</strong> {s.score} — {s.reason}</li>)}
              </ul>
              <Button size="sm" variant="secondary" className="mt-2" onClick={() => { setScores(Object.fromEntries(suggestions.map((s) => [s.criterionId, s.score]))); setUsedAi(true); toast.info("Đã điền gợi ý — kiểm tra lại trước khi lưu"); }}>Điền gợi ý vào form</Button>
            </Notice>
          )}
          {rubric.criteria.map((c) => (
            <div key={c.id} className="grid gap-3 rounded-xl border border-line p-4 md:grid-cols-[1fr_200px]">
              <div>
                <p className="font-medium text-fg">{c.title} <span className="font-mono text-xs text-cyan-fg">{c.objectiveId}</span></p>
                <ul className="mt-1 space-y-0.5 text-xs text-muted">{c.levels.map((l) => <li key={l.score}><strong className="text-fg">{l.score}</strong> — {l.descriptor}</li>)}</ul>
                <label htmlFor={`cm-${c.id}`} className="sr-only">Nhận xét tiêu chí {c.title}</label>
                <input id={`cm-${c.id}`} value={comments[c.id]} onChange={(e) => setComments({ ...comments, [c.id]: e.target.value })} placeholder="Nhận xét (tùy chọn)" className="mt-2 h-9 w-full rounded-lg border border-line bg-surface-2 px-3 text-sm text-fg" />
              </div>
              <Field label={`Điểm (tối đa ${c.maxScore})`} htmlFor={`sc-${c.id}`}>
                <Select id={`sc-${c.id}`} data-testid={`score-${c.objectiveId}`} value={scores[c.id]} onChange={(e) => setScores({ ...scores, [c.id]: Number(e.target.value) })}>
                  <option value={0}>— Chưa chấm —</option>
                  {Array.from({ length: c.maxScore }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n}</option>)}
                </Select>
              </Field>
            </div>
          ))}
          <Field label="Nhận xét chung cho học sinh" htmlFor="fb"><Textarea id="fb" value={feedback} onChange={(e) => setFeedback(e.target.value)} /></Field>
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="secondary" onClick={() => save("draft")}><Save /> Lưu nháp</Button>
            <Button onClick={() => save("final")} data-testid="save-final"><CheckCircle2 /> Lưu kết quả chấm</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <AssessmentInner />
    </Suspense>
  );
}
