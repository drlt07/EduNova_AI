"use client";
import Link from "next/link";
import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useFieldArray, useForm, useWatch, type FieldPath } from "react-hook-form";
import { Bot, Check, ChevronLeft, ChevronRight, FileClock, Plus, Rocket, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { LAB_TEMPLATES, getLab } from "@/lib/data/labs";
import { getObjective } from "@/lib/data/curriculum";
import { DEFAULT_GARDEN_PARAMS, gardenTestCases } from "@/lib/sim/smart-garden";
import { STEP_FIELDS, STEP_SCHEMAS, activityBuilderSchema, type ActivityBuilderForm } from "@/lib/validation/schemas";
import { callAgent } from "@/lib/ai/client";
import { teacherClasses } from "@/lib/store/scoped";
import { useSessionData } from "@/lib/store/use-role";
import { cn, formatDate, uid } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState, Notice, PageSkeleton } from "@/components/ui/feedback";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/form";
import { AssessTabs } from "@/components/teacher/assess-tabs";
import { StatusBadge } from "@/components/ui/status-badge";
import { CASE_LABEL, HINT_LABEL, MODE_LABEL } from "@/lib/labels";
import { LabIcon } from "@/components/labs/lab-card";
import { SmartGardenLab } from "@/components/labs/smart-garden/smart-garden-lab";

const LEVEL_4 = ["Mới bắt đầu — chưa đáp ứng yêu cầu", "Đang phát triển — đúng một phần", "Đạt — đúng với đa số trường hợp", "Thành thạo — đúng mọi trường hợp, giải thích được"];
function rubricLevels(max: number) {
  return Array.from({ length: max }, (_, i) => ({ score: i + 1, descriptor: max === 4 ? LEVEL_4[i] : i === 0 ? "Mới bắt đầu" : i + 1 === max ? "Thành thạo" : `Mức ${i + 1}/${max}` }));
}

const STEPS = ["Chọn KHBD", "Chọn thí nghiệm", "Thiết lập", "Câu hỏi & tiêu chí chấm", "Giao bài"];

function defaults(planId = "", objectiveIds: string[] = []): ActivityBuilderForm {
  const due = new Date(Date.now() + 7 * 86_400_000);
  due.setHours(21, 0, 0, 0);
  const local = new Date(due.getTime() - due.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
  return {
    lessonPlanId: planId,
    objectiveIds: [...objectiveIds],
    format: "lab",
    labTemplateId: "",
    config: { mode: "challenge", hintMode: "guided", params: { ...DEFAULT_GARDEN_PARAMS }, testCaseIds: gardenTestCases(40).map((c) => c.id) },
    title: "",
    instructions: "",
    questions: [],
    rubricTitle: "",
    criteria: [],
    classIds: [],
    dueAt: local,
  };
}

function Builder() {
  const { d, user } = useSessionData();
  const router = useRouter();
  const params = useSearchParams();
  const draft = params.get("draft") ? d.activityDrafts.find((x) => x.id === params.get("draft") && x.ownerId === user.id) : undefined;
  const [step, setStep] = useState(draft?.step ?? 0);
  const [draftId, setDraftId] = useState<string | undefined>(draft?.id);
  const [published, setPublished] = useState<{ title: string; classes: string[] } | null>(null);
  const [designing, setDesigning] = useState(false);
  const plans = d.lessonPlans.filter((p) => p.ownerId === user.id);
  const initialPlan = plans.find((p) => p.id === params.get("plan"));
  const form = useForm<ActivityBuilderForm>({ defaultValues: (draft?.values as ActivityBuilderForm | undefined) ?? defaults(initialPlan?.id, initialPlan?.objectiveIds) });
  const { register, control, setValue, getValues, setError, clearErrors, formState: { errors } } = form;
  const v = useWatch({ control }) as ActivityBuilderForm;
  const questions = useFieldArray({ control, name: "questions" });
  const criteria = useFieldArray({ control, name: "criteria" });
  const plan = plans.find((p) => p.id === v.lessonPlanId);
  const classes = teacherClasses(d, user.id);
  const threshold = Math.min(90, Math.max(10, Math.round(Number(v.config?.params?.threshold) || 40))); // xem trước luôn dùng giá trị hợp lệ
  const cases = useMemo(() => gardenTestCases(threshold), [threshold]);

  function applyIssues(issues: { path: PropertyKey[]; message: string }[]) {
    for (const i of issues) setError(i.path.map(String).join(".") as FieldPath<ActivityBuilderForm>, { type: "custom", message: i.message });
  }

  function validateStep(s: number): boolean {
    clearErrors(STEP_FIELDS[s] as unknown as FieldPath<ActivityBuilderForm>[]);
    const r = STEP_SCHEMAS[s].safeParse(getValues());
    if (r.success) return true;
    applyIssues(r.error.issues);
    toast.error(r.error.issues[0]?.message ?? "Kiểm tra lại thông tin");
    return false;
  }

  function next() {
    if (!validateStep(step)) return;
    // khi sang bước 4 lần đầu: tạo khung rubric từ mục tiêu
    if (step === 2 && getValues("criteria").length === 0) prefillContent(false);
    setStep((s) => Math.min(4, s + 1));
  }

  function saveDraft() {
    const id = d.saveActivityDraft(user.id, step, getValues(), draftId);
    setDraftId(id);
    toast.success("Đã lưu nháp hoạt động");
  }

  function prefillContent(overwrite: boolean) {
    const objs = getValues("objectiveIds");
    if (!overwrite && getValues("criteria").length) return;
    setValue("rubricTitle", `Tiêu chí chấm — ${plan?.title ?? "Vườn tưới thông minh"}`);
    setValue("criteria", objs.map((o) => ({ title: getObjective(o)?.description.slice(0, 60) ?? o, objectiveId: o, maxScore: 4 })));
  }

  async function runDesigner() {
    setDesigning(true);
    try {
      const out = await callAgent<{ title: string; instructions: string; questions: { kind: "mcq" | "short"; prompt: string; options: string[]; correctIndex?: number }[]; criteria: { title: string; objectiveId: string; maxScore: number }[]; flags: string[] }>("activity-designer", {
        labTemplateId: getValues("labTemplateId"),
        objectiveIds: getValues("objectiveIds"),
        mode: getValues("config.mode"),
        threshold: Number(getValues("config.params.threshold")),
      });
      if (out.flags.includes("template-unavailable")) return toast.error("Phòng thí nghiệm này chưa hỗ trợ gợi ý nội dung");
      setValue("title", out.title);
      setValue("instructions", out.instructions);
      setValue("questions", out.questions.map((q) => ({ ...q, id: uid("aq") })));
      setValue("criteria", out.criteria);
      setValue("rubricTitle", `Tiêu chí chấm — ${out.title}`);
      d.logAI({ agent: "activity-designer", userId: user.id, contextRef: `LessonPlan:${getValues("lessonPlanId")}`, inputSummary: "Gợi ý nhiệm vụ & tiêu chí chấm", output: out, flags: out.flags });
      toast.success("Đã điền nội dung gợi ý — hãy xem lại và chỉnh sửa");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Chưa gợi ý được nội dung, hãy thử lại");
    } finally {
      setDesigning(false);
    }
  }

  function publish() {
    for (let s = 0; s < 5; s++) {
      if (!validateStep(s)) return setStep(s);
    }
    const full = activityBuilderSchema.safeParse(getValues());
    if (!full.success) {
      applyIssues(full.error.issues);
      return toast.error(full.error.issues[0].message);
    }
    const x = full.data;
    d.publishActivity({
      ownerId: user.id,
      lessonPlanId: x.lessonPlanId,
      objectiveIds: x.objectiveIds,
      labTemplateId: x.labTemplateId,
      title: x.title,
      instructions: x.instructions,
      mode: x.config.mode,
      hintMode: x.config.hintMode,
      params: x.config.params,
      testCaseIds: x.config.testCaseIds,
      questions: x.questions,
      rubricTitle: x.rubricTitle,
      criteria: x.criteria.map((c) => ({ ...c, levels: rubricLevels(c.maxScore) })),
      classIds: x.classIds,
      dueAt: new Date(x.dueAt).toISOString(),
      draftId,
    });
    setPublished({ title: x.title, classes: x.classIds.map((c) => d.classes.find((k) => k.id === c)?.name ?? c) });
    toast.success("Đã giao nhiệm vụ");
  }

  if (published)
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-success/30 bg-success/5 p-8 text-center">
        <Check className="mx-auto size-12 rounded-full bg-success/15 p-2 text-success-fg" aria-hidden />
        <h1 className="mt-4 text-2xl font-bold text-fg">Đã giao nhiệm vụ</h1>
        <p className="mt-2 text-muted">“{published.title}” đã được giao cho {published.classes.join(", ")}. Học sinh sẽ thấy nhiệm vụ trong mục Nhiệm vụ.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Button asChild><Link href="/teacher/assignments">Theo dõi tiến độ</Link></Button>
          <Button variant="secondary" onClick={() => { form.reset(defaults()); setStep(0); setDraftId(undefined); setPublished(null); router.replace("/teacher/activity-builder"); }}>Tạo hoạt động khác</Button>
        </div>
      </div>
    );

  const myDrafts = d.activityDrafts.filter((x) => x.ownerId === user.id);

  return (
    <>
      <AssessTabs subtitle="Thư viện bài tập › Thiết kế hoạt động chấm theo tiêu chí từ mục tiêu trong KHBD." actions={<Button variant="secondary" onClick={saveDraft}><Save /> Lưu nháp</Button>} />
      {myDrafts.length > 0 && !draftId && (
        <Notice tone="info" className="mb-4 flex flex-wrap items-center gap-2">
          <FileClock className="size-4 text-cyan-fg" aria-hidden /> Bạn có {myDrafts.length} bản nháp:
          {myDrafts.slice(0, 3).map((x) => (
            <Link key={x.id} className="font-medium text-cyan-fg underline-offset-2 hover:underline" href={`/teacher/activity-builder?draft=${x.id}`}>
              nháp {formatDate(x.updatedAt, true)} (bước {x.step + 1})
            </Link>
          ))}
        </Notice>
      )}
      <ol className="mb-6 grid grid-cols-5 gap-2" aria-label="Các bước">
        {STEPS.map((s, i) => (
          <li key={s}>
            <button
              type="button"
              onClick={() => { if (i < step || (i === step + 1 && validateStep(step))) setStep(i); }}
              aria-current={i === step ? "step" : undefined}
              className={cn("flex w-full flex-col items-start gap-1 rounded-xl border p-3 text-left transition-colors", i === step ? "border-cyan/60 bg-cyan/10" : i < step ? "border-success/40 bg-success/5" : "border-line bg-surface")}
            >
              <span className={cn("grid size-6 place-items-center rounded-full text-xs font-bold", i < step ? "bg-success text-[#04111f]" : i === step ? "bg-cyan text-[#04111f]" : "bg-surface-2 text-muted")}>{i < step ? <Check className="size-3.5" /> : i + 1}</span>
              <span className="hidden text-xs font-medium text-fg sm:block">{s}</span>
            </button>
          </li>
        ))}
      </ol>

      <form onSubmit={(e) => e.preventDefault()} noValidate>
        {step === 0 && (
          <Card>
            <CardHeader><CardTitle as="h2">Bước 1 · Chọn KHBD và mục tiêu</CardTitle><CardDescription>Hoạt động gắn với mục tiêu cụ thể trong KHBD.</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              {plans.length === 0 ? <EmptyState title="Chưa có KHBD" action={<Button asChild size="sm"><Link href="/teacher/lesson-planner?new=1">Tạo KHBD</Link></Button>} /> : (
                <Field label="Kế hoạch bài dạy" htmlFor="lessonPlanId" error={errors.lessonPlanId?.message}>
                  <Select id="lessonPlanId" {...register("lessonPlanId")} onChange={(e) => { setValue("lessonPlanId", e.target.value); const p = plans.find((x) => x.id === e.target.value); setValue("objectiveIds", p ? [...p.objectiveIds] : []); setValue("criteria", []); }} aria-invalid={!!errors.lessonPlanId}>
                    <option value="">— Chọn KHBD —</option>
                    {plans.map((p) => <option key={p.id} value={p.id}>Tin {p.grade} · {p.title}</option>)}
                  </Select>
                </Field>
              )}
              {plan && (
                <fieldset>
                  <legend className="text-sm font-medium text-fg">Mục tiêu sẽ đánh giá</legend>
                  {errors.objectiveIds && <p className="text-xs font-medium text-danger-fg" role="alert">{errors.objectiveIds.message}</p>}
                  <div className="mt-2 space-y-2">
                    {plan.objectiveIds.map((o) => (
                      <Checkbox key={o} checked={v.objectiveIds?.includes(o) ?? false} onChange={(e) => setValue("objectiveIds", e.target.checked ? [...getValues("objectiveIds"), o] : getValues("objectiveIds").filter((x) => x !== o))} label={<><span className="font-mono text-xs text-cyan-fg">{o}</span> {getObjective(o)?.description}</>} />
                    ))}
                  </div>
                </fieldset>
              )}
            </CardContent>
          </Card>
        )}

        {step === 1 && (
          <Card>
            <CardHeader><CardTitle as="h2">Bước 2 · Chọn phòng thí nghiệm</CardTitle><CardDescription>Hiện có thể giao bài với Vườn tưới thông minh. Các phòng thí nghiệm khác sẽ được bổ sung.</CardDescription></CardHeader>
            <CardContent className="space-y-5">
              {errors.labTemplateId && <p className="text-sm font-medium text-danger-fg" role="alert">{errors.labTemplateId.message}</p>}
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3" role="radiogroup" aria-label="Phòng thí nghiệm">
                {LAB_TEMPLATES.filter((l) => l.featureStatus !== "PLANNED" && (!plan || l.grades.includes(plan.grade))).map((l) => {
                  const selected = v.labTemplateId === l.id;
                  return (
                    <button key={l.id} type="button" role="radio" aria-checked={selected} onClick={() => setValue("labTemplateId", l.id)} className={cn("flex items-start gap-3 rounded-xl border p-4 text-left transition-colors", selected ? "border-cyan/60 bg-cyan/10" : "border-line bg-surface hover:border-cyan/30")}>
                      <LabIcon slug={l.slug} className="mt-0.5 size-5 shrink-0 text-cyan-fg" />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2"><span className="font-medium text-fg">{l.title}</span><StatusBadge status={l.featureStatus} /></span>
                        <span className="mt-1 block text-xs text-muted">{l.tagline}</span>
                        {l.id !== "lab-smart-garden" && <span className="mt-1 block text-xs text-warning-fg">Chưa giao bài được, chỉ dùng để học sinh tự khám phá</span>}
                      </span>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <Card>
              <CardHeader><CardTitle as="h2">Bước 3 · Thiết lập Vườn tưới thông minh</CardTitle><CardDescription>Đáp án đúng: bơm bật khi độ ẩm dưới ngưỡng{v.config?.params?.requireWater ? " và bình còn nước" : ""}.</CardDescription></CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <Field label="Chế độ" htmlFor="mode">
                  <Select id="mode" {...register("config.mode")}>
                    <option value="explore">Khám phá</option>
                    <option value="challenge">Thử thách</option>
                    <option value="assessment">Kiểm tra</option>
                  </Select>
                </Field>
                <Field label="Trợ lý gợi ý cho học sinh" htmlFor="hintMode" error={errors.config?.hintMode?.message}>
                  <Select id="hintMode" {...register("config.hintMode")} aria-invalid={!!errors.config?.hintMode}>
                    <option value="off">Không gợi ý</option>
                    <option value="guided">Gợi ý từng bước</option>
                    <option value="full">Gợi ý chi tiết</option>
                  </Select>
                </Field>
                <Field label="Ngưỡng độ ẩm (%)" htmlFor="threshold" error={errors.config?.params?.threshold?.message} hint="Từ 10 đến 90">
                  <Input id="threshold" type="number" {...register("config.params.threshold", { valueAsNumber: true })} aria-invalid={!!errors.config?.params?.threshold} />
                </Field>
                <Field label="Độ ẩm ban đầu (%)" htmlFor="initH" error={errors.config?.params?.initialHumidity?.message}>
                  <Input id="initH" type="number" {...register("config.params.initialHumidity", { valueAsNumber: true })} />
                </Field>
                <div className="space-y-2 pt-6">
                  <Checkbox label="Bắt buộc kiểm tra bình nước" {...register("config.params.requireWater")} />
                  <Checkbox label="Bình còn nước lúc đầu" {...register("config.params.initialHasWater")} />
                  <Checkbox label="Cho phép tự gõ điều kiện" {...register("config.params.allowRuleEditor")} />
                </div>
                <fieldset className="md:col-span-2 xl:col-span-3">
                  <legend className="text-sm font-medium text-fg">Các trường hợp máy dùng để kiểm tra bài</legend>
                  {errors.config?.testCaseIds && <p className="text-xs font-medium text-danger-fg" role="alert">{errors.config.testCaseIds.message}</p>}
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    {cases.map((c) => (
                      <Checkbox key={c.id} checked={v.config?.testCaseIds?.includes(c.id) ?? false} onChange={(e) => { const cur = getValues("config.testCaseIds"); setValue("config.testCaseIds", e.target.checked ? [...cur, c.id] : cur.filter((x) => x !== c.id)); }} label={<>{c.name} <Badge tone={c.category === "boundary" ? "warning" : "neutral"} className="ml-1">{CASE_LABEL[c.category]}</Badge></>} />
                    ))}
                  </div>
                </fieldset>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle as="h3">Học sinh sẽ thấy</CardTitle></CardHeader>
              <CardContent>
                <SmartGardenLab
                  key={JSON.stringify(v.config?.params) + v.config?.mode}
                  params={{ ...DEFAULT_GARDEN_PARAMS, ...v.config?.params, threshold }}
                  testCases={cases.filter((c) => v.config?.testCaseIds?.includes(c.id))}
                  mode={v.config?.mode ?? "challenge"}
                />
              </CardContent>
            </Card>
          </div>
        )}

        {step === 3 && (
          <Card>
            <CardHeader className="flex-row flex-wrap items-start justify-between gap-3">
              <div><CardTitle as="h2">Bước 4 · Nhiệm vụ, câu hỏi và tiêu chí chấm</CardTitle><CardDescription>Mỗi mục tiêu cần ít nhất một tiêu chí chấm.</CardDescription></div>
              <Button type="button" variant="violet" size="sm" onClick={runDesigner} disabled={designing}><Bot /> {designing ? "Đang gợi ý…" : "Gợi ý nội dung"}</Button>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Tên nhiệm vụ" htmlFor="title" error={errors.title?.message}><Input id="title" {...register("title")} aria-invalid={!!errors.title} /></Field>
                <Field label="Tên bộ tiêu chí chấm" htmlFor="rubricTitle" error={errors.rubricTitle?.message}><Input id="rubricTitle" {...register("rubricTitle")} /></Field>
                <Field label="Hướng dẫn cho học sinh" htmlFor="instructions" error={errors.instructions?.message} className="md:col-span-2"><Textarea id="instructions" {...register("instructions")} aria-invalid={!!errors.instructions} /></Field>
              </div>
              <section aria-labelledby="q-h">
                <div className="mb-2 flex items-center justify-between">
                  <h3 id="q-h" className="font-semibold text-fg">Câu hỏi ({questions.fields.length})</h3>
                  <div className="flex gap-2">
                    <Button type="button" size="sm" variant="secondary" onClick={() => questions.append({ id: uid("aq"), kind: "mcq", prompt: "", options: ["", ""], correctIndex: 0 })}><Plus /> Trắc nghiệm</Button>
                    <Button type="button" size="sm" variant="secondary" onClick={() => questions.append({ id: uid("aq"), kind: "short", prompt: "", options: [] })}><Plus /> Tự luận ngắn</Button>
                  </div>
                </div>
                {errors.questions?.message && <p className="text-xs font-medium text-danger-fg" role="alert">{errors.questions.message}</p>}
                <div className="space-y-3">
                  {questions.fields.map((q, i) => (
                    <div key={q.id} className="rounded-xl border border-line bg-surface-2/40 p-4">
                      <div className="flex items-start gap-2">
                        <Badge className="mt-2">{v.questions?.[i]?.kind === "mcq" ? "Trắc nghiệm" : "Tự luận"}</Badge>
                        <Field label={`Câu ${i + 1}`} htmlFor={`q-${i}`} error={errors.questions?.[i]?.prompt?.message} className="flex-1"><Input id={`q-${i}`} {...register(`questions.${i}.prompt`)} /></Field>
                        <Button type="button" size="icon" variant="ghost" aria-label={`Xóa câu ${i + 1}`} className="mt-6" onClick={() => questions.remove(i)}><Trash2 /></Button>
                      </div>
                      {v.questions?.[i]?.kind === "mcq" && (
                        <fieldset className="mt-3 space-y-2">
                          <legend className="text-xs text-muted">Phương án (chọn đáp án đúng)</legend>
                          {(v.questions[i].options ?? []).map((_, k) => (
                            <div key={k} className="flex items-center gap-2">
                              <input type="radio" name={`correct-${i}`} aria-label={`Đáp án đúng là phương án ${k + 1}`} checked={v.questions[i].correctIndex === k} onChange={() => setValue(`questions.${i}.correctIndex`, k)} className="size-4 accent-[var(--cyan)]" />
                              <Input aria-label={`Phương án ${k + 1}`} {...register(`questions.${i}.options.${k}`)} />
                            </div>
                          ))}
                          <Button type="button" size="sm" variant="ghost" onClick={() => setValue(`questions.${i}.options`, [...getValues(`questions.${i}.options`), ""])}><Plus /> Phương án</Button>
                          {(errors.questions?.[i]?.options?.message || errors.questions?.[i]?.correctIndex?.message) && <p className="text-xs font-medium text-danger-fg" role="alert">{errors.questions?.[i]?.options?.message ?? errors.questions?.[i]?.correctIndex?.message}</p>}
                        </fieldset>
                      )}
                    </div>
                  ))}
                </div>
              </section>
              <section aria-labelledby="r-h">
                <div className="mb-2 flex items-center justify-between">
                  <h3 id="r-h" className="font-semibold text-fg">Tiêu chí chấm ({criteria.fields.length})</h3>
                  <Button type="button" size="sm" variant="secondary" onClick={() => criteria.append({ title: "", objectiveId: v.objectiveIds?.[0] ?? "", maxScore: 4 })}><Plus /> Tiêu chí</Button>
                </div>
                {errors.criteria?.message && <p className="mb-2 text-xs font-medium text-danger-fg" role="alert">{errors.criteria.message}</p>}
                {errors.criteria?.root?.message && <p className="mb-2 text-xs font-medium text-danger-fg" role="alert">{errors.criteria.root.message}</p>}
                <div className="space-y-2">
                  {criteria.fields.map((c, i) => (
                    <div key={c.id} className="grid items-start gap-2 rounded-xl border border-line bg-surface-2/40 p-3 md:grid-cols-[1fr_200px_110px_auto]">
                      <Field label="Tiêu chí" htmlFor={`c-${i}`} error={errors.criteria?.[i]?.title?.message}><Input id={`c-${i}`} {...register(`criteria.${i}.title`)} /></Field>
                      <Field label="Gắn mục tiêu" htmlFor={`co-${i}`} error={errors.criteria?.[i]?.objectiveId?.message}>
                        <Select id={`co-${i}`} {...register(`criteria.${i}.objectiveId`)}>
                          <option value="">—</option>
                          {(v.objectiveIds ?? []).map((o) => <option key={o} value={o}>{o}</option>)}
                        </Select>
                      </Field>
                      <Field label="Điểm tối đa" htmlFor={`cm-${i}`} error={errors.criteria?.[i]?.maxScore?.message}><Input id={`cm-${i}`} type="number" {...register(`criteria.${i}.maxScore`, { valueAsNumber: true })} /></Field>
                      <Button type="button" size="icon" variant="ghost" className="mt-6" aria-label={`Xóa tiêu chí ${i + 1}`} onClick={() => criteria.remove(i)}><Trash2 /></Button>
                    </div>
                  ))}
                </div>
              </section>
            </CardContent>
          </Card>
        )}

        {step === 4 && (
          <div className="grid gap-5 xl:grid-cols-[1.3fr_1fr]">
            <Card>
              <CardHeader><CardTitle as="h2">Bước 5 · Xem lại</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p className="text-lg font-semibold text-fg">{v.title || "(chưa đặt tên)"}</p>
                <p className="text-muted">{v.instructions}</p>
                <dl className="grid grid-cols-[140px_1fr] gap-x-3 gap-y-2">
                  <dt className="text-muted">KHBD</dt><dd className="text-fg">{plan?.title}</dd>
                  <dt className="text-muted">Mục tiêu</dt><dd className="font-mono text-xs text-cyan-fg">{v.objectiveIds?.join(", ")}</dd>
                  <dt className="text-muted">Thí nghiệm</dt><dd className="text-fg">{getLab(v.labTemplateId)?.title}</dd>
                  <dt className="text-muted">Chế độ / gợi ý</dt><dd className="text-fg">{v.config && MODE_LABEL[v.config.mode]} / {v.config && HINT_LABEL[v.config.hintMode]}</dd>
                  <dt className="text-muted">Ngưỡng</dt><dd className="text-fg">{threshold}% {v.config?.params?.requireWater ? "+ còn nước" : ""}</dd>
                  <dt className="text-muted">Máy kiểm tra</dt><dd className="text-fg">{v.config?.testCaseIds?.length} trường hợp</dd>
                  <dt className="text-muted">Câu hỏi</dt><dd className="text-fg">{v.questions?.length}</dd>
                  <dt className="text-muted">Tiêu chí chấm</dt><dd className="text-fg">{v.criteria?.map((c) => `${c.title} (${c.maxScore} điểm)`).join("; ")}</dd>
                </dl>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle as="h2">Giao cho lớp</CardTitle><CardDescription>Chỉ hiển thị lớp bạn phụ trách.</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                <fieldset>
                  <legend className="sr-only">Chọn lớp</legend>
                  {errors.classIds && <p className="text-xs font-medium text-danger-fg" role="alert">{errors.classIds.message}</p>}
                  <div className="space-y-2">
                    {classes.map((c) => (
                      <Checkbox key={c.id} data-testid={`class-${c.name}`} checked={v.classIds?.includes(c.id) ?? false} onChange={(e) => setValue("classIds", e.target.checked ? [...getValues("classIds"), c.id] : getValues("classIds").filter((x) => x !== c.id))} label={<>{c.name} <span className="text-muted">· Tin {c.grade} · {d.enrollments.filter((e) => e.classId === c.id).length} HS</span>{plan && plan.grade !== c.grade && <Badge tone="warning" className="ml-1">khác khối</Badge>}</>} />
                    ))}
                  </div>
                </fieldset>
                <Field label="Hạn nộp" htmlFor="dueAt" error={errors.dueAt?.message}><Input id="dueAt" type="datetime-local" {...register("dueAt")} aria-invalid={!!errors.dueAt} /></Field>
                <Button type="button" className="w-full" onClick={publish}><Rocket /> Giao nhiệm vụ</Button>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="mt-6 flex justify-between">
          <Button type="button" variant="ghost" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}><ChevronLeft /> Quay lại</Button>
          {step < 4 && <Button type="button" onClick={next}>Tiếp tục <ChevronRight /></Button>}
        </div>
      </form>
    </>
  );
}

function KeyedBuilder() {
  const params = useSearchParams();
  // đổi bản nháp → remount để form nạp lại giá trị
  return <Builder key={`${params.get("draft") ?? "new"}-${params.get("plan") ?? ""}`} />;
}

export default function Page() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <KeyedBuilder />
    </Suspense>
  );
}
