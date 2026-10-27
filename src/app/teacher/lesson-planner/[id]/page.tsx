"use client";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useFieldArray, useForm, useWatch, type Control } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, ArrowLeft, Bot, CheckCircle2, History, Info, Plus, Save, Send, Trash2, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { LESSONS, OBJECTIVES, TEXTBOOKS, getLesson, getObjective, getTextbook } from "@/lib/data/curriculum";
import { LAB_TEMPLATES, getLab } from "@/lib/data/labs";
import type { LessonPhase, LessonPlan } from "@/lib/domain/types";
import { PHASES, checkLessonPlan } from "@/lib/analytics/lesson-plan-check";
import { lessonPlanSchema, type LessonPlanForm } from "@/lib/validation/schemas";
import { callAgent } from "@/lib/ai/client";
import { useSessionData } from "@/lib/store/use-role";
import { cn, formatDate, uid } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { EmptyState, ErrorState, Notice } from "@/components/ui/feedback";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function toForm(p: LessonPlan): LessonPlanForm {
  return {
    title: p.title,
    grade: p.grade,
    textbookId: p.textbookId,
    lessonId: p.lessonId,
    objectiveIds: p.objectiveIds,
    durationMinutes: p.durationMinutes,
    notes: p.notes,
    status: p.status,
    visibility: p.visibility,
    activities: p.activities.map((a) => ({ ...a, labTemplateId: a.labTemplateId ?? "" })),
  };
}

function clean(v: LessonPlanForm) {
  return { ...v, activities: v.activities.map((a) => ({ ...a, labTemplateId: a.labTemplateId || undefined })) };
}

export default function LessonPlanEditorPage() {
  const { id } = useParams<{ id: string }>();
  const { d, user } = useSessionData();
  const plan = d.lessonPlans.find((p) => p.id === id);
  if (!plan) return <ErrorState page title="Không tìm thấy KHBD" description="KHBD không tồn tại hoặc đã bị xóa." action={<Button asChild><Link href="/teacher/lesson-planner">Về danh sách</Link></Button>} />;
  if (plan.ownerId !== user.id) return <ErrorState page title="Không có quyền chỉnh sửa" description="KHBD này thuộc giáo viên khác. Bạn có thể nhân bản từ Thư viện chia sẻ nếu được chia sẻ." />;
  return <Editor key={plan.id} plan={plan} />;
}

function Editor({ plan }: { plan: LessonPlan }) {
  const { d, user } = useSessionData();
  const router = useRouter();
  const form = useForm<LessonPlanForm>({ resolver: zodResolver(lessonPlanSchema), defaultValues: toForm(plan), mode: "onBlur" });
  const { register, control, handleSubmit, setValue, getValues, reset, trigger, formState: { errors, isDirty } } = form;
  const { fields, append, remove } = useFieldArray({ control, name: "activities" });
  const values = useWatch({ control }) as LessonPlanForm;
  const issues = useMemo(() => checkLessonPlan({ title: values.title ?? "", objectiveIds: values.objectiveIds ?? [], activities: (values.activities ?? []) as LessonPlan["activities"], durationMinutes: Number(values.durationMinutes) || 0 }), [values]);
  const versions = d.lessonPlanVersions.filter((v) => v.lessonPlanId === plan.id);
  const [versionOpen, setVersionOpen] = useState(false);
  const [versionNote, setVersionNote] = useState("");
  const [restoreId, setRestoreId] = useState<string | null>(null);
  const lessonOptions = LESSONS.filter((l) => l.grade === Number(values.grade) && l.textbookId === values.textbookId);
  const gradeObjectives = OBJECTIVES.filter((o) => o.grade === Number(values.grade));
  const lesson = getLesson(values.lessonId);

  async function saveDraft() {
    if (!(await trigger("title"))) return toast.error("Cần tiêu đề hợp lệ để lưu nháp");
    d.updateLessonPlan(plan.id, clean(getValues()));
    reset(getValues());
    toast.success("Đã lưu nháp");
  }

  const saveVersion = handleSubmit((v) => {
    d.updateLessonPlan(plan.id, clean(v));
    const n = d.saveLessonPlanVersion(plan.id, versionNote.trim() || "Không ghi chú", user.id);
    reset(v);
    setVersionOpen(false);
    setVersionNote("");
    toast.success(`Đã lưu phiên bản v${n}`);
  }, () => {
    setVersionOpen(false);
    toast.error("KHBD còn lỗi — kiểm tra các trường được đánh dấu");
  });

  const publish = handleSubmit((v) => {
    const blocking = checkLessonPlan(clean(v) as LessonPlan).filter((i) => i.severity === "error");
    if (blocking.length) return toast.error(`Chưa thể xuất bản: ${blocking[0].message}`);
    const next = { ...clean(v), status: "published" as const };
    d.updateLessonPlan(plan.id, next);
    d.saveLessonPlanVersion(plan.id, "Xuất bản", user.id);
    reset(next);
    toast.success("Đã xuất bản KHBD");
  }, () => toast.error("KHBD còn lỗi — kiểm tra các trường được đánh dấu"));

  function toggleObjective(id: string, on: boolean) {
    const cur = getValues("objectiveIds");
    setValue("objectiveIds", on ? [...cur, id] : cur.filter((x) => x !== id), { shouldDirty: true, shouldValidate: true });
  }

  function addActivity(phase: LessonPhase) {
    append({ id: uid("pa"), phase, title: "", objectiveIds: [], content: "", product: "", organization: "", labTemplateId: "", evidence: "" });
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Button asChild variant="ghost" size="sm"><Link href="/teacher/lesson-planner"><ArrowLeft /> Danh sách KHBD</Link></Button>
        {isDirty && <Badge tone="warning">Có thay đổi chưa lưu</Badge>}
      </div>
      <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-fg">{values.title || "KHBD chưa đặt tên"}</h1>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Badge tone="blue">Tin {values.grade}</Badge>
            <Badge>{getTextbook(values.textbookId).name}</Badge>
            <Badge tone={plan.status === "published" ? "success" : "neutral"}>{plan.status === "published" ? "Đã xuất bản" : "Nháp"}</Badge>
            <Badge>v{plan.currentVersion}</Badge>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={saveDraft}><Save /> Lưu nháp</Button>
          <Button variant="secondary" onClick={() => setVersionOpen(true)}><History /> Lưu phiên bản</Button>
          <Button variant="outline" onClick={publish}><Send /> Xuất bản</Button>
          <Button onClick={async () => { await saveDraft(); router.push(`/teacher/activity-builder?plan=${plan.id}`); }}><Wand2 /> Tạo hoạt động thí nghiệm</Button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <Tabs defaultValue="edit">
          <TabsList>
            <TabsTrigger value="edit">Soạn thảo</TabsTrigger>
            <TabsTrigger value="preview">Xem trước</TabsTrigger>
            <TabsTrigger value="versions">Phiên bản ({versions.length})</TabsTrigger>
            <TabsTrigger value="ai">Trợ lý</TabsTrigger>
          </TabsList>

          <TabsContent value="edit" className="space-y-5">
            <Card>
              <CardHeader><CardTitle as="h2">Thông tin chung</CardTitle></CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <Field label="Tiêu đề" htmlFor="title" error={errors.title?.message} className="md:col-span-2">
                  <Input id="title" {...register("title")} aria-invalid={!!errors.title} />
                </Field>
                <Field label="Lớp" htmlFor="grade">
                  <Select id="grade" {...register("grade", { setValueAs: (v) => Number(v) })} onChange={(e) => { setValue("grade", Number(e.target.value) as 10 | 11 | 12, { shouldDirty: true }); setValue("lessonId", ""); setValue("objectiveIds", []); }}>
                    {[10, 11, 12].map((g) => <option key={g} value={g}>Lớp {g}</option>)}
                  </Select>
                </Field>
                <Field label="Bộ sách" htmlFor="textbookId">
                  <Select id="textbookId" {...register("textbookId")} onChange={(e) => { setValue("textbookId", e.target.value as LessonPlanForm["textbookId"], { shouldDirty: true }); setValue("lessonId", ""); }}>
                    {TEXTBOOKS.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </Select>
                </Field>
                <Field label="Bài học" htmlFor="lessonId" error={errors.lessonId?.message}>
                  <Select id="lessonId" {...register("lessonId")} onChange={(e) => { const l = getLesson(e.target.value); setValue("lessonId", e.target.value, { shouldDirty: true, shouldValidate: true }); if (l) setValue("objectiveIds", [...l.objectiveIds], { shouldDirty: true }); }}>
                    <option value="">— Chọn bài —</option>
                    {lessonOptions.map((l) => <option key={l.id} value={l.id}>{l.title}</option>)}
                  </Select>
                </Field>
                <Field label="Thời lượng (phút)" htmlFor="durationMinutes" error={errors.durationMinutes?.message}>
                  <Input id="durationMinutes" type="number" {...register("durationMinutes", { valueAsNumber: true })} />
                </Field>
                <Field label="Chia sẻ" htmlFor="visibility">
                  <Select id="visibility" {...register("visibility")}>
                    <option value="private">Riêng tư</option>
                    <option value="class">Lớp</option>
                    <option value="school">Trường</option>
                    <option value="public">Công khai</option>
                  </Select>
                </Field>
                <fieldset className="md:col-span-2">
                  <legend className="text-sm font-medium text-fg">Mục tiêu (yêu cầu cần đạt)</legend>
                  {errors.objectiveIds && <p className="mt-1 text-xs font-medium text-danger-fg" role="alert">{errors.objectiveIds.message}</p>}
                  <div className="mt-2 grid gap-2">
                    {gradeObjectives.map((o) => (
                      <Checkbox
                        key={o.id}
                        checked={values.objectiveIds?.includes(o.id) ?? false}
                        onChange={(e) => toggleObjective(o.id, e.target.checked)}
                        label={<><span className="font-mono text-xs text-cyan-fg">{o.id}</span> {o.description} {lesson?.objectiveIds.includes(o.id) && <Badge tone="cyan" className="ml-1">của bài</Badge>}</>}
                      />
                    ))}
                  </div>
                </fieldset>
                <Field label="Ghi chú" htmlFor="notes" className="md:col-span-2"><Textarea id="notes" {...register("notes")} /></Field>
              </CardContent>
            </Card>

            {PHASES.map((ph) => {
              const items = fields.map((f, i) => ({ f, i })).filter(({ i }) => values.activities?.[i]?.phase === ph.id);
              return (
                <Card key={ph.id}>
                  <CardHeader className="flex-row items-center justify-between">
                    <div>
                      <CardTitle as="h2">{ph.label}</CardTitle>
                      <CardDescription>{items.length} hoạt động</CardDescription>
                    </div>
                    <Button size="sm" variant="secondary" onClick={() => addActivity(ph.id)}><Plus /> Thêm</Button>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {items.length === 0 && <p className="rounded-xl border border-dashed border-line p-4 text-center text-sm text-muted">Chưa có hoạt động ở pha này.</p>}
                    {items.map(({ f, i }) => (
                      <ActivityEditor key={f.id} index={i} control={control} register={register} setValue={setValue} errors={errors} objectiveIds={values.objectiveIds ?? []} onRemove={() => remove(i)} />
                    ))}
                  </CardContent>
                </Card>
              );
            })}

          </TabsContent>

          <TabsContent value="preview">
            <Preview v={values} />
          </TabsContent>

          <TabsContent value="versions">
            {versions.length === 0 ? <EmptyState icon={History} title="Chưa có phiên bản" description="Dùng 'Lưu phiên bản' để chụp lại nội dung KHBD tại thời điểm hiện tại." /> : (
              <ol className="space-y-3">
                {versions.map((v) => (
                  <li key={v.id} className="flex flex-col gap-2 rounded-2xl border border-line bg-surface p-4 sm:flex-row sm:items-center">
                    <Badge tone="violet" className="w-fit">v{v.version}</Badge>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-fg">{v.note}</p>
                      <p className="text-xs text-muted">{formatDate(v.createdAt, true)} · {v.snapshot.activities.length} hoạt động · {v.snapshot.objectiveIds.length} mục tiêu</p>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => setRestoreId(v.id)}>Khôi phục nội dung</Button>
                  </li>
                ))}
              </ol>
            )}
          </TabsContent>

          <TabsContent value="ai">
            <AgentPanel planId={plan.id} values={values} />
          </TabsContent>
        </Tabs>

        <aside className="h-fit space-y-4 xl:sticky xl:top-20" aria-label="Kiểm tra KHBD">
          <Card>
            <CardHeader>
              <CardTitle as="h2">Kiểm tra KHBD</CardTitle>
              <CardDescription>Mỗi mục tiêu cần có hoạt động và cách đánh giá</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2" aria-live="polite">
                {issues.map((it, k) => (
                  <li key={k} className="flex gap-2 text-sm">
                    {it.severity === "error" ? <AlertCircle className="mt-0.5 size-4 shrink-0 text-danger-fg" aria-label="Lỗi" /> : it.severity === "warning" ? <Info className="mt-0.5 size-4 shrink-0 text-warning-fg" aria-label="Cảnh báo" /> : <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success-fg" aria-label="Đạt" />}
                    <span className="text-fg">{it.message}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle as="h2">Mục tiêu theo hoạt động</CardTitle></CardHeader>
            <CardContent>
              <table className="w-full text-xs">
                <thead className="text-muted"><tr><th className="text-left font-medium">Mục tiêu</th>{PHASES.map((p) => <th key={p.id} className="font-medium" title={p.label}>{p.label.split(" ")[0]}</th>)}</tr></thead>
                <tbody>
                  {(values.objectiveIds ?? []).map((o) => (
                    <tr key={o} className="border-t border-line">
                      <td className="py-1.5 font-mono text-cyan-fg">{o}</td>
                      {PHASES.map((p) => {
                        const hit = (values.activities ?? []).some((a) => a.phase === p.id && a.objectiveIds?.includes(o));
                        return <td key={p.id} className="text-center">{hit ? <span className="text-success-fg" aria-label="có">●</span> : <span className="text-muted" aria-label="không">·</span>}</td>;
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </aside>
      </div>

      <Dialog open={versionOpen} onOpenChange={setVersionOpen}>
        <DialogContent title="Lưu phiên bản" description="Phiên bản là ảnh chụp nội dung để so sánh hoặc khôi phục sau này.">
          <form onSubmit={(e) => { e.preventDefault(); void saveVersion(); }} className="space-y-3">
            <Field label="Ghi chú thay đổi" htmlFor="vnote"><Input id="vnote" value={versionNote} onChange={(e) => setVersionNote(e.target.value)} placeholder="vd: Thêm hoạt động kiểm thử biên" /></Field>
            <Button type="submit" className="w-full">Lưu phiên bản v{plan.currentVersion + 1}</Button>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={!!restoreId} onOpenChange={(o) => !o && setRestoreId(null)}>
        <DialogContent title="Khôi phục phiên bản?" description="Nội dung hiện tại sẽ được thay bằng nội dung phiên bản đã chọn. Lưu phiên bản trước nếu cần giữ lại.">
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setRestoreId(null)}>Hủy</Button>
            <Button onClick={() => {
              if (!restoreId) return;
              d.restoreLessonPlanVersion(restoreId, user.id);
              const v = d.lessonPlanVersions.find((x) => x.id === restoreId);
              if (v) reset(toForm({ ...v.snapshot, currentVersion: plan.currentVersion }));
              setRestoreId(null);
              toast.success("Đã khôi phục nội dung");
            }}>Khôi phục</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

type FormApi = ReturnType<typeof useForm<LessonPlanForm>>;

function ActivityEditor({ index, control, register, setValue, errors, objectiveIds, onRemove }: { index: number; control: Control<LessonPlanForm>; register: FormApi["register"]; setValue: FormApi["setValue"]; errors: ReturnType<typeof useForm<LessonPlanForm>>["formState"]["errors"]; objectiveIds: string[]; onRemove: () => void }) {
  const selected = (useWatch({ control, name: `activities.${index}.objectiveIds` }) ?? []) as string[];
  const e = errors.activities?.[index];
  const p = `act-${index}`;
  return (
    <div className="rounded-xl border border-line bg-surface-2/40 p-4">
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Tên hoạt động" htmlFor={`${p}-title`} error={e?.title?.message}><Input id={`${p}-title`} {...register(`activities.${index}.title`)} /></Field>
        <Field label="Phòng thí nghiệm (nếu có)" htmlFor={`${p}-lab`}>
          <Select id={`${p}-lab`} {...register(`activities.${index}.labTemplateId`)}>
            <option value="">— Không dùng —</option>
            {LAB_TEMPLATES.map((l) => <option key={l.id} value={l.id}>{l.title}{l.featureStatus === "PLANNED" ? " (sắp có)" : ""}</option>)}
          </Select>
        </Field>
        <fieldset className="md:col-span-2">
          <legend className="text-sm font-medium text-fg">Mục tiêu của hoạt động</legend>
          <div className="mt-1 flex flex-wrap gap-3">
            {objectiveIds.length === 0 && <span className="text-xs text-muted">Chọn mục tiêu của KHBD trước.</span>}
            {objectiveIds.map((o) => (
              <Checkbox
                key={o}
                label={<span className="font-mono text-xs">{o}</span>}
                checked={selected.includes(o)}
                onChange={(ev) => setValue(`activities.${index}.objectiveIds`, ev.target.checked ? [...selected, o] : selected.filter((x) => x !== o), { shouldDirty: true })}
              />
            ))}
          </div>
        </fieldset>
        <Field label="Nội dung" htmlFor={`${p}-content`}><Textarea id={`${p}-content`} {...register(`activities.${index}.content`)} /></Field>
        <Field label="Sản phẩm học tập" htmlFor={`${p}-product`}><Textarea id={`${p}-product`} {...register(`activities.${index}.product`)} /></Field>
        <Field label="Tổ chức thực hiện" htmlFor={`${p}-org`}><Input id={`${p}-org`} {...register(`activities.${index}.organization`)} /></Field>
        <Field label="Cách đánh giá" htmlFor={`${p}-ev`} hint="Ví dụ: phiếu học tập, kết quả thí nghiệm, câu hỏi"><Input id={`${p}-ev`} {...register(`activities.${index}.evidence`)} /></Field>
      </div>
      <div className="mt-3 flex justify-end"><Button size="sm" variant="ghost" onClick={onRemove}><Trash2 /> Xóa hoạt động</Button></div>
    </div>
  );
}

function Preview({ v }: { v: LessonPlanForm }) {
  const lesson = getLesson(v.lessonId);
  return (
    <article className="rounded-2xl border border-line bg-surface p-6 text-sm leading-relaxed">
      <p className="text-center text-xs uppercase tracking-widest text-muted">Kế hoạch bài dạy · Tin học {v.grade}</p>
      <h2 className="mt-1 text-center text-xl font-bold text-fg">{v.title}</h2>
      <p className="text-center text-muted">{lesson?.title} · {getTextbook(v.textbookId).name} · {v.durationMinutes} phút</p>
      <h3 className="mt-6 font-semibold text-fg">I. Mục tiêu</h3>
      <ul className="mt-1 list-disc pl-5 text-fg">{v.objectiveIds.map((o) => <li key={o}><span className="font-mono text-xs text-cyan-fg">{o}</span> {getObjective(o)?.description}</li>)}</ul>
      <h3 className="mt-6 font-semibold text-fg">II. Tiến trình dạy học</h3>
      {PHASES.map((ph, k) => (
        <section key={ph.id} className="mt-3">
          <h4 className="font-semibold text-fg">Hoạt động {k + 1}. {ph.label}</h4>
          {v.activities.filter((a) => a.phase === ph.id).length === 0 && <p className="text-muted">(chưa có)</p>}
          {v.activities.filter((a) => a.phase === ph.id).map((a) => (
            <div key={a.id} className="mt-2 rounded-xl border border-line p-3">
              <p className="font-medium text-fg">{a.title || "(chưa đặt tên)"} {a.labTemplateId && <Badge tone="cyan" className="ml-1">{getLab(a.labTemplateId)?.title}</Badge>}</p>
              <dl className="mt-1 grid grid-cols-[110px_1fr] gap-x-3 gap-y-1 text-fg">
                <dt className="text-muted">a) Mục tiêu</dt><dd>{a.objectiveIds.join(", ") || "—"}</dd>
                <dt className="text-muted">b) Nội dung</dt><dd>{a.content || "—"}</dd>
                <dt className="text-muted">c) Sản phẩm</dt><dd>{a.product || "—"}</dd>
                <dt className="text-muted">d) Tổ chức</dt><dd>{a.organization || "—"}</dd>
                <dt className="text-muted">Đánh giá</dt><dd>{a.evidence || "—"}</dd>
              </dl>
            </div>
          ))}
        </section>
      ))}
      {v.notes && (<><h3 className="mt-6 font-semibold text-fg">Ghi chú</h3><p className="whitespace-pre-wrap text-fg">{v.notes}</p></>)}
    </article>
  );
}


interface PlannerOut { issues: { severity: string; message: string }[]; flags: string[]; uploadedAnalysis: { phasesMentioned: string[]; objectiveCodes: string[]; truncated: boolean } | null }
interface CurriculumOut { lessonFound: boolean; results: { objectiveId: string; inDatabase: boolean; verified: boolean; belongsToLesson: boolean }[]; notes: string[] }

function AgentPanel({ planId, values }: { planId: string; values: LessonPlanForm }) {
  const { d, user } = useSessionData();
  const [text, setText] = useState("");
  const [loading, setLoading] = useState<string | null>(null);
  const [planner, setPlanner] = useState<PlannerOut | null>(null);
  const [curr, setCurr] = useState<CurriculumOut | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(kind: "planner" | "curriculum") {
    setLoading(kind);
    setError(null);
    try {
      if (kind === "planner") {
        const input = { plan: { title: values.title, objectiveIds: values.objectiveIds, durationMinutes: Number(values.durationMinutes) || 0, activities: values.activities.map((a) => ({ ...a, labTemplateId: a.labTemplateId || undefined })) }, uploadedText: text.trim() || undefined };
        const out = await callAgent<PlannerOut>("lesson-planner", input);
        setPlanner(out);
        d.logAI({ agent: "lesson-planner", userId: user.id, contextRef: `LessonPlan:${planId}`, inputSummary: `Kiểm tra KHBD${text ? " + văn bản dán" : ""}`, output: out, flags: out.flags });
      } else {
        const out = await callAgent<CurriculumOut>("curriculum-analyst", { lessonId: values.lessonId, objectiveIds: values.objectiveIds });
        setCurr(out);
        d.logAI({ agent: "curriculum-analyst", userId: user.id, contextRef: `LessonPlan:${planId}`, inputSummary: "Đối chiếu mục tiêu", output: out, flags: [] });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi không xác định");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted">Trợ lý chỉ đưa gợi ý; bạn quyết định mọi thay đổi.</p>
      {error && <ErrorState page title="Trợ lý gặp lỗi" description={error} action={<Button size="sm" onClick={() => setError(null)}>Đóng</Button>} />}
      <Card>
        <CardHeader><CardTitle as="h3" className="flex items-center gap-2"><Bot className="size-4 text-violet-fg" /> Đối chiếu chương trình</CardTitle><CardDescription>Kiểm tra mục tiêu đã chọn có thuộc bài học không.</CardDescription></CardHeader>
        <CardContent>
          <Button size="sm" onClick={() => run("curriculum")} disabled={loading !== null}>{loading === "curriculum" ? "Đang đối chiếu…" : "Đối chiếu"}</Button>
          {curr && (
            <div className="mt-3 space-y-2 text-sm">
              <ul className="space-y-1">{curr.results.map((r) => <li key={r.objectiveId} className="flex flex-wrap gap-1.5"><span className="font-mono text-cyan-fg">{r.objectiveId}</span><Badge tone={r.belongsToLesson ? "success" : "warning"}>{r.belongsToLesson ? "thuộc bài học" : "không thuộc bài học đã chọn"}</Badge></li>)}</ul>
              {curr.notes.filter((n) => !n.includes("curriculumVerified")).map((n) => <p key={n} className="text-muted">• {n}</p>)}
            </div>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle as="h3" className="flex items-center gap-2"><Bot className="size-4 text-violet-fg" /> Rà soát KHBD</CardTitle><CardDescription>Tìm mục tiêu còn thiếu hoạt động hoặc cách đánh giá. Có thể dán thêm nội dung KHBD từ Word.</CardDescription></CardHeader>
        <CardContent className="space-y-3">
          <Field label="Dán nội dung KHBD (không bắt buộc)" htmlFor="paste"><Textarea id="paste" value={text} onChange={(e) => setText(e.target.value)} maxLength={20000} placeholder="Dán văn bản KHBD từ Word…" /></Field>
          <Button size="sm" onClick={() => run("planner")} disabled={loading !== null}>{loading === "planner" ? "Đang phân tích…" : "Phân tích KHBD"}</Button>
          {planner && (
            <div className="space-y-2 text-sm">
              {planner.flags.length > 0 && <Notice tone="danger">Văn bản dán vào có câu lệnh lạ nhắm vào trợ lý; trợ lý đã bỏ qua các câu đó.</Notice>}
              <ul className="space-y-1">{planner.issues.map((i, k) => <li key={k} className={cn("text-fg", i.severity === "error" && "text-danger-fg")}>• {i.message}</li>)}</ul>
              {planner.uploadedAnalysis && <p className="text-muted">Văn bản có nhắc tới: {planner.uploadedAnalysis.phasesMentioned.join(", ") || "chưa thấy hoạt động nào"}.</p>}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
