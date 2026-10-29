"use client";
/**
 * Ngân hàng bài tập: mọi thứ thầy cô có thể giao, ở một chỗ. Bộ câu hỏi của thầy cô (tạo / sửa / xóa), bộ câu hỏi
 * theo bài SGK, mô phỏng chấm tự động, bài lập trình và hoạt động chấm theo tiêu chí. Giao được cho cả lớp hoặc
 * gắn vào khóa học.
 */
import Link from "next/link";
import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Code2, FlaskConical, ListChecks, Pencil, Plus, Search, Send, Trash2, Wand2 } from "lucide-react";
import { toast } from "sonner";
import type { Grade } from "@/lib/domain/types";
import { CODING_EXERCISES } from "@/lib/data/coding-exercises";
import { getLesson } from "@/lib/data/curriculum";
import { LAB_TEMPLATES } from "@/lib/data/labs";
import { SGK_SIMS } from "@/lib/data/lab-catalog";
import { PRACTICE_SETS, getQuestion, setsForLesson, type PracticeQuestion } from "@/lib/data/practice";
import { findSgk, sgkLessonId } from "@/lib/data/sgk-kntt";
import { gradeLessons } from "@/lib/access/unlocks";
import { SCORED_LABS } from "@/lib/sim/lab-score";
import { teacherAssignments } from "@/lib/store/scoped";
import { useSessionData } from "@/lib/store/use-role";
import { cn, matchesQuery } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { EmptyState, PageSkeleton } from "@/components/ui/feedback";
import { Field, Input, Select } from "@/components/ui/form";
import { LabArt } from "@/components/labs/lab-art";
import { AssessTabs } from "@/components/teacher/assess-tabs";
import { AssignDialog, type AssignPreset } from "@/components/teacher/assign-dialog";
import { QuizEditor, type QuizDraft } from "@/components/courses/lesson-panel";

type Kind = "mine" | "quiz" | "lab" | "code" | "activity";
const KINDS: { id: Kind; label: string; icon: typeof ListChecks; tone: string }[] = [
  { id: "mine", label: "Bộ câu hỏi của tôi", icon: Pencil, tone: "bg-violet/15 text-violet-fg" },
  { id: "quiz", label: "Câu hỏi theo bài SGK", icon: ListChecks, tone: "bg-blue/15 text-blue-fg" },
  { id: "lab", label: "Mô phỏng", icon: FlaskConical, tone: "bg-cyan/15 text-cyan-fg" },
  { id: "code", label: "Lập trình", icon: Code2, tone: "bg-success/15 text-success-fg" },
  { id: "activity", label: "Hoạt động chấm tay", icon: Wand2, tone: "bg-warning/15 text-warning-fg" },
];
interface Item { kind: Kind; ref: string; title: string; grade: number; sgkRef?: string; meta: string; preset: AssignPreset; editable?: boolean }

const labRefs = (() => {
  const m = new Map<string, string>();
  for (const [ref, slugs] of Object.entries(SGK_SIMS)) for (const s of slugs) if (!m.has(s)) m.set(s, ref);
  return m;
})();
const lessonName = (ref?: string) => { const f = ref ? findSgk(ref) : undefined; return f ? `Bài ${f.lesson.no}. ${f.lesson.title}` : undefined; };
const PAGE = 24;

export default function BankPage() {
  return <Suspense fallback={<PageSkeleton />}><Bank /></Suspense>;
}

function Bank() {
  const { d, user } = useSessionData();
  const [kind, setKind] = useState<Kind | "">("");
  const [grade, setGrade] = useState<"" | Grade>("");
  const [q, setQ] = useState("");
  const [limit, setLimit] = useState(PAGE);
  const [assign, setAssign] = useState<{ preset: AssignPreset; sgkRef?: string } | null>(null);
  const [edit, setEdit] = useState<{ ref: string; draft: QuizDraft } | null>(null);
  const params = useSearchParams();
  const [picking, setPicking] = useState(() => params.get("tao") === "1");

  const used = useMemo(() => {
    const m = new Map<string, number>();
    for (const a of teacherAssignments(d, user.id)) { const k = a.task ? `${a.task.kind}:${a.task.ref}` : `activity:${a.activityId}`; m.set(k, (m.get(k) ?? 0) + 1); }
    return m;
  }, [d, user.id]);

  const items: Item[] = useMemo(() => [
    ...d.teacherQuizzes.filter((x) => x.ownerId === user.id).map((x) => ({ kind: "mine" as const, ref: x.id, title: x.title, grade: x.grade, sgkRef: x.sgkRef, meta: `${x.questions.length} câu · ${x.status === "published" ? "đã phát hành" : "bản nháp"}`, preset: { kind: "quiz" as const, ref: x.id }, editable: true })),
    ...PRACTICE_SETS.map((s) => ({ kind: "quiz" as const, ref: s.id, title: s.title, grade: s.grade, sgkRef: s.sgkRef, meta: `${s.questionIds.length} câu · chấm tự động`, preset: { kind: "quiz" as const, ref: s.id } })),
    ...LAB_TEMPLATES.filter((l) => l.status !== "planned").map((l) => ({ kind: "lab" as const, ref: l.slug, title: l.title, grade: l.grades[0], sgkRef: labRefs.get(l.slug), meta: SCORED_LABS.has(l.slug) ? "Thang 10, trừ điểm mỗi lần chọn sai" : "Ghi nhận khi hoàn thành", preset: { kind: "lab" as const, ref: l.slug } })),
    ...CODING_EXERCISES.map((e) => ({ kind: "code" as const, ref: e.id, title: e.title, grade: e.grade, meta: `${e.tests.length} test tự động · ${e.topic}`, preset: { kind: "code" as const, ref: e.id } })),
    ...d.activities.filter((a) => a.ownerId === user.id).map((a) => ({ kind: "activity" as const, ref: a.id, title: a.title, grade: d.lessonPlans.find((p) => p.id === a.lessonPlanId)?.grade ?? 10, meta: `Chấm theo tiêu chí · ${a.status === "published" ? "sẵn sàng giao" : "bản nháp"}`, preset: { kind: "activity" as const, ref: a.id } })),
  ], [d.teacherQuizzes, d.activities, d.lessonPlans, user.id]);

  const shown = items.filter((i) => (!kind || i.kind === kind) && (!grade || i.grade === grade) && matchesQuery(q, i.title, i.meta, lessonName(i.sgkRef) ?? ""));
  const count = (k: Kind) => items.filter((i) => i.kind === k && (!grade || i.grade === grade)).length;

  function openEditor(ref: string, draft?: QuizDraft) {
    const f = findSgk(ref);
    if (!f) return;
    setEdit({ ref, draft: draft ?? { title: `Kiểm tra – Bài ${f.lesson.no}. ${f.lesson.title}`, questions: [], classIds: [] } });
    setPicking(false);
  }

  return (
    <>
      <AssessTabs subtitle="Thư viện bài tập: tài nguyên dùng lại cho mọi khóa học và lớp." actions={<><Button variant="secondary" asChild><Link href="/teacher/activity-builder"><Wand2 /> Hoạt động chấm tay</Link></Button><Button variant="secondary" onClick={() => setPicking(true)}><Plus /> Tạo bộ câu hỏi</Button></>} />

      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">Tìm trong ngân hàng</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
          <Input className="pl-9" placeholder="Tìm theo tên, bài SGK…" value={q} onChange={(e) => { setQ(e.target.value); setLimit(PAGE); }} />
        </label>
        <Select aria-label="Loại bài" className="sm:w-56" value={kind} onChange={(e) => { setKind(e.target.value as Kind | ""); setLimit(PAGE); }}>
          <option value="">Mọi loại ({items.filter((i) => !grade || i.grade === grade).length})</option>
          {KINDS.map((k) => <option key={k.id} value={k.id}>{k.label} ({count(k.id)})</option>)}
        </Select>
        <div className="flex gap-1 rounded-xl border border-line bg-surface p-1" role="radiogroup" aria-label="Khối lớp">
          {(["", 10, 11, 12] as const).map((g) => <button key={g} type="button" role="radio" aria-checked={grade === g} onClick={() => { setGrade(g); setLimit(PAGE); }} className={cn("rounded-lg px-3 py-1.5 text-sm font-medium", grade === g ? "bg-fg text-bg" : "text-muted hover:text-fg")}>{g ? `Tin ${g}` : "Mọi khối"}</button>)}
        </div>
      </div>

      {shown.length === 0 ? (
        <EmptyState icon={ListChecks} title={kind === "mine" ? "Chưa có bộ câu hỏi riêng" : "Không có mục nào khớp"} description={kind === "mine" ? "Tạo bộ câu hỏi từ ngân hàng của một bài SGK hoặc tự soạn câu mới." : "Thử đổi bộ lọc."} action={kind === "mine" ? <Button size="sm" onClick={() => setPicking(true)}><Plus /> Tạo bộ câu hỏi</Button> : undefined} />
      ) : (
        <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {shown.slice(0, limit).map((i) => {
            const k = KINDS.find((x) => x.id === i.kind)!;
            const n = used.get(`${i.preset.kind}:${i.ref}`) ?? 0;
            const tq = i.editable ? d.teacherQuizzes.find((x) => x.id === i.ref) : undefined;
            return (
              <li key={`${i.kind}:${i.ref}`} className="flex flex-col rounded-2xl border border-line bg-surface p-4">
                <div className="flex items-start gap-3">
                  {i.kind === "lab" ? <LabArt slug={i.ref} className="h-12 w-20 shrink-0 rounded-lg" /> : <span className={cn("grid size-12 shrink-0 place-items-center rounded-xl", k.tone)}><k.icon className="size-5" aria-hidden /></span>}
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 font-semibold text-fg">{i.title}</p>
                    <p className="mt-0.5 truncate text-xs text-muted">Tin {i.grade}{lessonName(i.sgkRef) ? ` · ${lessonName(i.sgkRef)}` : ""}</p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5 text-xs">
                  <Badge>{k.label}</Badge>
                  <span className="rounded-md bg-surface-2 px-2 py-0.5 text-muted">{i.meta}</span>
                  {n > 0 && <span className="rounded-md bg-blue/10 px-2 py-0.5 font-medium text-blue-fg">đã giao {n} lần</span>}
                </div>
                <div className="mt-auto flex flex-wrap gap-1 pt-3">
                  <Button size="sm" onClick={() => setAssign({ preset: i.preset, sgkRef: i.sgkRef })} disabled={i.kind === "activity" && !d.activities.find((a) => a.id === i.ref && a.status === "published")}><Send /> Giao</Button>
                  {i.kind === "lab" && <Button size="sm" variant="ghost" asChild><Link href={`/labs/${i.ref}`}>Chơi thử</Link></Button>}
                  {i.kind === "activity" && <Button size="sm" variant="ghost" asChild><Link href="/teacher/activity-builder"><Pencil /> Sửa</Link></Button>}
                  {i.kind === "quiz" && i.sgkRef && <Button size="sm" variant="ghost" onClick={() => { const s = PRACTICE_SETS.find((x) => x.id === i.ref)!; openEditor(i.sgkRef!, { title: `${s.title} (bản của tôi)`, questions: s.questionIds.map(getQuestion).filter((x): x is PracticeQuestion => !!x), classIds: [] }); }}><Pencil /> Sao chép để sửa</Button>}
                  {tq && <Button size="sm" variant="ghost" onClick={() => openEditor(tq.sgkRef, { id: tq.id, title: tq.title, questions: tq.questions, classIds: tq.classIds })}><Pencil /> Sửa</Button>}
                  {tq && <Button size="icon" variant="ghost" aria-label={`Xóa ${tq.title}`} onClick={() => { if (window.confirm(`Xóa bộ câu hỏi “${tq.title}”?`)) { d.deleteTeacherQuiz(tq.id, user.id); toast.success("Đã xóa"); } }}><Trash2 /></Button>}
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {shown.length > limit && <div className="mt-4 text-center"><Button variant="secondary" onClick={() => setLimit(limit + PAGE)}>Xem thêm ({shown.length - limit})</Button></div>}

      <AssignDialog open={!!assign} onOpenChange={(o) => !o && setAssign(null)} preset={assign?.preset} sgkRef={assign?.sgkRef} />
      <PickLesson open={picking} onOpenChange={setPicking} onPick={(ref) => openEditor(ref)} />
      <Dialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
        {edit && (
          <DialogContent title={edit.draft.id ? "Sửa bộ câu hỏi" : "Tạo bộ câu hỏi"} description={`${lessonName(edit.ref)} · chọn câu từ ngân hàng của bài hoặc tự soạn câu mới.`} className="max-w-3xl">
            <div className="max-h-[70vh] overflow-y-auto pr-1">
              <QuizBuilder key={edit.draft.id ?? edit.ref} refId={edit.ref} initial={edit.draft} onDone={() => setEdit(null)} />
            </div>
          </DialogContent>
        )}
      </Dialog>
    </>
  );
}

function QuizBuilder({ refId, initial, onDone }: { refId: string; initial: QuizDraft; onDone: () => void }) {
  const { d, user } = useSessionData();
  const [draft, setDraft] = useState(initial);
  const f = findSgk(refId)!;
  const bank = [...new Set(setsForLesson(refId, f.lesson.key).flatMap((s) => s.questionIds))].map(getQuestion).filter((x): x is PracticeQuestion => !!x && x.kind !== "sim");
  const id = sgkLessonId(f.lesson);
  const objectiveId = (id && getLesson(id)?.objectiveIds[0]) || bank[0]?.objectiveId || `SGK-${refId}`;
  const save = (publish: boolean) => {
    if (draft.title.trim().length < 3) return toast.error("Đặt tên bộ câu hỏi (ít nhất 3 kí tự)");
    if (!draft.questions.length) return toast.error("Bộ câu hỏi cần ít nhất 1 câu");
    if (publish && !draft.classIds.length) return toast.error("Chọn ít nhất một lớp để giao");
    d.saveTeacherQuiz({ id: draft.id, ownerId: user.id, sgkRef: refId, grade: f.grade, title: draft.title.trim(), questions: draft.questions, classIds: draft.classIds, status: publish ? "published" : "draft" });
    toast.success(publish ? "Đã lưu và phát hành cho lớp" : "Đã lưu vào ngân hàng");
    onDone();
  };
  return <QuizEditor draft={draft} setDraft={setDraft} bank={bank} objectiveId={objectiveId} grade={f.grade} onSave={save} onCancel={onDone} />;
}

function PickLesson({ open, onOpenChange, onPick }: { open: boolean; onOpenChange: (o: boolean) => void; onPick: (ref: string) => void }) {
  const [grade, setGrade] = useState<Grade>(10);
  const lessons = gradeLessons(grade);
  const [ref, setRef] = useState("");
  const cur = lessons.some((l) => l.ref === ref) ? ref : lessons[0]?.ref ?? "";
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title="Tạo bộ câu hỏi" description="Chọn bài SGK để lấy ngân hàng câu hỏi của bài; có thể soạn thêm câu mới.">
        <div className="space-y-3">
          <Field label="Khối lớp" htmlFor="pk-grade"><Select id="pk-grade" value={grade} onChange={(e) => setGrade(Number(e.target.value) as Grade)}>{[10, 11, 12].map((g) => <option key={g} value={g}>Tin học {g}</option>)}</Select></Field>
          <Field label="Bài" htmlFor="pk-lesson"><Select id="pk-lesson" value={cur} onChange={(e) => setRef(e.target.value)}>{lessons.map((l) => <option key={l.ref} value={l.ref}>Bài {l.lesson.no}. {l.lesson.title}</option>)}</Select></Field>
          <div className="flex justify-end"><Button onClick={() => cur && onPick(cur)}><Plus /> Tiếp tục</Button></div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
