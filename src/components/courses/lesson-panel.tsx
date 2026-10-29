"use client";
import Link from "next/link";
import { useState } from "react";
import { CheckCircle2, Pencil, Play, Plus, Send, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { CODING_EXERCISES } from "@/lib/data/coding-exercises";
import { getLesson } from "@/lib/data/curriculum";
import { LAB_TEMPLATES } from "@/lib/data/labs";
import { KIND_LABEL, LEVEL_LABEL, levelOf, getQuestion, setsForLesson, type PracticeQuestion, type TeacherQuiz } from "@/lib/data/practice";
import { findSgk, sgkLabs, sgkLessonId } from "@/lib/data/sgk-kntt";
import { teacherClasses } from "@/lib/store/scoped";
import { useSessionData } from "@/lib/store/use-role";
import { cn, uid } from "@/lib/utils";
import { LabArt } from "@/components/labs/lab-art";
import { LabClassResults } from "@/components/teacher/lab-results";
import { AssignDialog, type AssignPreset } from "@/components/teacher/assign-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/form";

export type QuizDraft = { id?: string; title: string; questions: PracticeQuestion[]; classIds: string[] };
type Draft = QuizDraft;
type NewQ = { kind: "mcq" | "truefalse"; prompt: string; options: string[]; correct: number; answer: boolean; explanation: string };
const EMPTY_Q: NewQ = { kind: "mcq", prompt: "", options: ["", "", "", ""], correct: 0, answer: true, explanation: "" };

/** Soạn câu hỏi mới + chọn từ ngân hàng + chọn lớp để giao. */
export function QuizEditor({ draft, setDraft, bank, objectiveId, grade, onSave, onCancel }: { draft: Draft; setDraft: (d: Draft) => void; bank: PracticeQuestion[]; objectiveId: string; grade: number; onSave: (publish: boolean) => void; onCancel: () => void }) {
  const { d, user } = useSessionData();
  const [q, setQ] = useState<NewQ>(EMPTY_Q);
  const [err, setErr] = useState("");
  const classes = teacherClasses(d, user.id).sort((a, b) => Number(b.grade === grade) - Number(a.grade === grade));
  const inDraft = new Set(draft.questions.map((x) => x.id));

  const addNew = () => {
    if (q.prompt.trim().length < 5) return setErr("Nhập nội dung câu hỏi (ít nhất 5 kí tự).");
    if (q.kind === "mcq" && q.options.some((o) => !o.trim())) return setErr("Điền đủ 4 phương án.");
    if (q.kind === "mcq" && new Set(q.options.map((o) => o.trim().toLowerCase())).size < 4) return setErr("Các phương án không được trùng nhau.");
    const base = { id: uid("tqq"), objectiveId, prompt: q.prompt.trim(), explanation: q.explanation.trim() || "Giáo viên chưa thêm lời giải thích." };
    const nq: PracticeQuestion = q.kind === "mcq" ? { ...base, kind: "mcq", options: q.options.map((o) => o.trim()), correctIndex: q.correct } : { ...base, kind: "truefalse", answer: q.answer };
    setDraft({ ...draft, questions: [...draft.questions, nq] });
    setQ(EMPTY_Q);
    setErr("");
  };

  return (
    <div className="space-y-4">
      <Field label="Tên bộ câu hỏi" htmlFor="tq-title"><Input id="tq-title" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} /></Field>

      <div>
        <p className="text-sm font-semibold text-fg">Câu hỏi trong bộ ({draft.questions.length})</p>
        {draft.questions.length === 0 ? <p className="mt-1 text-xs text-muted">Chưa có câu nào — chọn từ ngân hàng hoặc soạn câu mới bên dưới.</p> : (
          <ol className="mt-2 space-y-1.5">
            {draft.questions.map((x, i) => (
              <li key={x.id} className="flex items-start gap-2 rounded-lg border border-line px-3 py-2 text-sm">
                <span className="font-mono text-xs text-muted">{i + 1}.</span>
                <span className="min-w-0 flex-1"><Badge className="mr-1.5">{KIND_LABEL[x.kind]} · {LEVEL_LABEL[levelOf(x)]}</Badge>{x.prompt}</span>
                <button type="button" aria-label="Bỏ câu này" onClick={() => setDraft({ ...draft, questions: draft.questions.filter((y) => y.id !== x.id) })} className="text-muted hover:text-danger-fg"><X className="size-4" /></button>
              </li>
            ))}
          </ol>
        )}
      </div>

      {bank.length > 0 && (
        <details className="rounded-xl border border-line p-3" open={draft.questions.length === 0}>
          <summary className="cursor-pointer text-sm font-semibold text-fg">Ngân hàng câu hỏi của bài ({bank.length})</summary>
          <ul className="mt-2 space-y-1.5">
            {bank.map((x) => (
              <li key={x.id} className="flex items-start gap-2 text-sm">
                <Button size="sm" variant={inDraft.has(x.id) ? "ghost" : "secondary"} disabled={inDraft.has(x.id)} onClick={() => setDraft({ ...draft, questions: [...draft.questions, x] })} aria-label={`Thêm câu: ${x.prompt}`}>{inDraft.has(x.id) ? <CheckCircle2 /> : <Plus />}</Button>
                <span className="min-w-0 flex-1 pt-1"><Badge className="mr-1.5">{KIND_LABEL[x.kind]} · {LEVEL_LABEL[levelOf(x)]}</Badge>{x.prompt}</span>
              </li>
            ))}
          </ul>
        </details>
      )}

      <div className="rounded-xl border border-dashed border-cyan/40 bg-cyan/5 p-3">
        <p className="text-sm font-semibold text-fg">Soạn câu mới</p>
        <div className="mt-2 grid gap-2 sm:grid-cols-[180px_1fr]">
          <Select aria-label="Dạng câu" value={q.kind} onChange={(e) => setQ({ ...q, kind: e.target.value as NewQ["kind"] })}><option value="mcq">Trắc nghiệm 4 đáp án</option><option value="truefalse">Đúng / Sai</option></Select>
          <Input aria-label="Nội dung câu hỏi" placeholder="Nội dung câu hỏi…" value={q.prompt} onChange={(e) => setQ({ ...q, prompt: e.target.value })} />
        </div>
        {q.kind === "mcq" ? (
          <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
            {q.options.map((o, i) => (
              <label key={i} className={cn("flex items-center gap-2 rounded-lg border px-2 py-1", q.correct === i ? "border-success bg-success/5" : "border-line")}>
                <input type="radio" name="tq-correct" checked={q.correct === i} onChange={() => setQ({ ...q, correct: i })} aria-label={`Đáp án đúng là ${"ABCD"[i]}`} />
                <span className="text-xs font-bold text-muted">{"ABCD"[i]}</span>
                <input className="min-w-0 flex-1 bg-transparent py-1 text-sm text-fg outline-none" placeholder={`Phương án ${"ABCD"[i]}`} value={o} onChange={(e) => setQ({ ...q, options: q.options.map((x, k) => (k === i ? e.target.value : x)) })} />
              </label>
            ))}
            <p className="text-xs text-muted sm:col-span-2">Chọn nút tròn ở phương án đúng.</p>
          </div>
        ) : (
          <div className="mt-2 flex gap-2 text-sm">
            {[true, false].map((v) => <label key={String(v)} className={cn("flex items-center gap-2 rounded-lg border px-3 py-1.5", q.answer === v ? "border-success bg-success/5" : "border-line")}><input type="radio" name="tq-tf" checked={q.answer === v} onChange={() => setQ({ ...q, answer: v })} /> Đáp án: {v ? "Đúng" : "Sai"}</label>)}
          </div>
        )}
        <Textarea aria-label="Giải thích" className="mt-2 min-h-[52px]" placeholder="Giải thích hiện cho học sinh sau khi trả lời (nên có)" value={q.explanation} onChange={(e) => setQ({ ...q, explanation: e.target.value })} />
        {err && <p className="mt-1 text-xs font-medium text-danger-fg" role="alert">{err}</p>}
        <Button size="sm" variant="secondary" className="mt-2" onClick={addNew}><Plus /> Thêm vào bộ câu hỏi</Button>
      </div>

      <fieldset>
        <legend className="text-sm font-semibold text-fg">Giao cho lớp</legend>
        <div className="mt-1.5 flex flex-wrap gap-2">
          {classes.map((c) => (
            <label key={c.id} className={cn("flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm", draft.classIds.includes(c.id) ? "border-cyan bg-cyan/10" : "border-line")}>
              <input type="checkbox" checked={draft.classIds.includes(c.id)} onChange={(e) => setDraft({ ...draft, classIds: e.target.checked ? [...draft.classIds, c.id] : draft.classIds.filter((x) => x !== c.id) })} /> {c.name}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="flex flex-wrap justify-end gap-2 border-t border-line pt-3">
        <Button variant="ghost" onClick={onCancel}>Hủy</Button>
        <Button variant="secondary" onClick={() => onSave(false)}>Lưu nháp</Button>
        <Button onClick={() => onSave(true)}><Send /> Giao cho lớp</Button>
      </div>
    </div>
  );
}

function useLessonData(refId: string) {
  const { d, user } = useSessionData();
  const found = findSgk(refId);
  const lesson = found?.lesson;
  const id = lesson ? sgkLessonId(lesson) : undefined;
  const linked = lesson ? sgkLabs(lesson) : [];
  const attached = d.lessonLabs.filter((l) => l.ownerId === user.id && l.sgkRef === refId).map((l) => LAB_TEMPLATES.find((x) => x.slug === l.slug)).filter((x): x is (typeof LAB_TEMPLATES)[number] => !!x);
  return { d, user, found, lesson, id, linked, attached };
}

/** Tab Mô phỏng của một bài (giáo viên): mô phỏng theo chương trình và tự gắn, giao cho lớp, kết quả từng lớp, gắn thêm từ kho. */
export function LessonLabsTab({ refId, inline = [] }: { refId: string; inline?: string[] }) {
  const { d, user, found, linked, attached } = useLessonData(refId);
  const [assign, setAssign] = useState<AssignPreset | undefined>();
  if (!found) return null;
  const inlineLabs = inline.map((s) => LAB_TEMPLATES.find((l) => l.slug === s)).filter((l): l is (typeof LAB_TEMPLATES)[number] => !!l);
  const base = [...inlineLabs, ...linked.filter((l) => !inline.includes(l.slug))];
  const shownLabs = [...base, ...attached.filter((a) => !base.some((l) => l.slug === a.slug))];
  const others = LAB_TEMPLATES.filter((l) => l.status !== "planned" && !shownLabs.some((x) => x.slug === l.slug)).sort((a, b) => Number(b.grades.includes(found.grade)) - Number(a.grades.includes(found.grade)));
  return (
    <div className="space-y-6">
      {shownLabs.length === 0 ? <p className="text-sm text-muted">Bài này chưa có mô phỏng. Gắn thêm từ kho bên dưới.</p> : (
        <ul className="space-y-3">
          {shownLabs.map((l) => {
            const mine = attached.some((a) => a.slug === l.slug) && !base.some((x) => x.slug === l.slug);
            return (
              <li key={l.slug} className="overflow-hidden rounded-2xl border border-line bg-surface">
                <div className="flex flex-wrap items-center gap-3 p-3">
                  <LabArt slug={l.slug} className="h-16 w-28 shrink-0 rounded-lg" />
                  <span className="min-w-0 flex-1 basis-48"><span className="block font-semibold text-fg">{l.title}</span><span className="block text-xs text-muted">{inline.includes(l.slug) ? "Có trong nội dung bài" : mine ? "Thầy cô gắn thêm" : "Gắn theo chương trình"} · {l.tagline}</span></span>
                  <Button asChild size="sm" variant="ghost"><Link href={`/labs/${l.slug}`}><Play /> Chơi thử</Link></Button>
                  <Button size="sm" onClick={() => setAssign({ kind: "lab", ref: l.slug })}><Send /> Giao</Button>
                  {mine && <Button size="icon" variant="ghost" aria-label={`Bỏ gắn ${l.title}`} onClick={() => d.toggleLessonLab(user.id, refId, l.slug)}><Trash2 /></Button>}
                </div>
                <LabClassResults slug={l.slug} grades={[found.grade]} />
              </li>
            );
          })}
        </ul>
      )}
      <details className="rounded-2xl border border-dashed border-line p-3">
        <summary className="cursor-pointer text-sm font-semibold text-fg">Gắn thêm mô phỏng từ kho ({others.length})</summary>
        <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
          {others.map((l) => (
            <li key={l.slug} className="flex items-center gap-2 rounded-lg border border-line px-3 py-1.5 text-sm">
              <span className="min-w-0 flex-1 truncate text-fg">{l.title}</span>
              <span className="text-xs text-muted">Tin {l.grades.join(", ")}</span>
              <Button size="sm" variant="ghost" onClick={() => { d.toggleLessonLab(user.id, refId, l.slug); toast.success(`Đã gắn “${l.title}” vào bài`); }}><Plus /> Gắn</Button>
            </li>
          ))}
        </ul>
      </details>
      <AssignDialog open={!!assign} onOpenChange={(o) => !o && setAssign(undefined)} preset={assign} sgkRef={refId} />
    </div>
  );
}

/** Tab Câu hỏi của một bài (giáo viên): bộ câu hỏi giao lớp, soạn từ ngân hàng của bài hoặc tự soạn. */
export function LessonQuizTab({ refId }: { refId: string }) {
  const { d, user, found, lesson, id } = useLessonData(refId);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [assign, setAssign] = useState<AssignPreset | undefined>();
  if (!found || !lesson) return null;
  const quizzes = d.teacherQuizzes.filter((q) => q.ownerId === user.id && q.sgkRef === refId);
  const sets = setsForLesson(refId, lesson.key);
  const bank = [...new Set(sets.flatMap((s) => s.questionIds))].map(getQuestion).filter((q): q is PracticeQuestion => !!q && q.kind !== "sim");
  const objectiveId = (id && getLesson(id)?.objectiveIds[0]) || `SGK-${refId}`;
  const className = (cid: string) => d.classes.find((c) => c.id === cid)?.name ?? cid;
  const save = (publish: boolean) => {
    if (!draft) return;
    if (draft.title.trim().length < 3) return toast.error("Đặt tên bộ câu hỏi (ít nhất 3 kí tự)");
    if (!draft.questions.length) return toast.error("Bộ câu hỏi cần ít nhất 1 câu");
    if (publish && !draft.classIds.length) return toast.error("Chọn ít nhất một lớp để giao");
    d.saveTeacherQuiz({ id: draft.id, ownerId: user.id, sgkRef: refId, grade: found.grade, title: draft.title.trim(), questions: draft.questions, classIds: draft.classIds, status: publish ? "published" : "draft" });
    toast.success(publish ? `Đã giao cho ${draft.classIds.map(className).join(", ")}` : "Đã lưu nháp");
    setDraft(null);
  };
  if (draft) return <QuizEditor draft={draft} setDraft={setDraft} bank={bank} objectiveId={objectiveId} grade={found.grade} onSave={save} onCancel={() => setDraft(null)} />;
  return (
    <div className="space-y-6">
      <section>
        <div className="mb-2 flex items-center justify-between gap-2">
          <h3 className="font-semibold text-fg">Bộ câu hỏi của thầy cô</h3>
          <Button size="sm" onClick={() => setDraft({ title: `Kiểm tra nhanh – Bài ${lesson.no}. ${lesson.title}`, questions: [], classIds: [] })}><Plus /> Tạo bộ câu hỏi</Button>
        </div>
        {quizzes.length === 0 ? <p className="text-sm text-muted">Chưa có. Tạo bộ câu hỏi từ ngân hàng của bài hoặc tự soạn câu mới.</p> : (
          <ul className="space-y-2">
            {quizzes.map((qz: TeacherQuiz) => (
              <li key={qz.id} className="flex flex-wrap items-center gap-2 rounded-xl border border-line bg-surface p-3">
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-fg">{qz.title}</span>
                  <span className="block text-xs text-muted">{qz.questions.length} câu · {qz.status === "published" ? `đã giao ${qz.classIds.map(className).join(", ")}` : "bản nháp"}</span>
                </span>
                {qz.status === "published" ? <Badge tone="success">Đã giao</Badge> : <Badge>Nháp</Badge>}
                <Button size="sm" variant="ghost" onClick={() => setDraft({ id: qz.id, title: qz.title, questions: qz.questions, classIds: qz.classIds })}><Pencil /> Sửa</Button>
                <Button size="icon" variant="ghost" aria-label={`Xóa ${qz.title}`} onClick={() => { if (window.confirm(`Xóa bộ câu hỏi “${qz.title}”?`)) d.deleteTeacherQuiz(qz.id, user.id); }}><Trash2 /></Button>
              </li>
            ))}
          </ul>
        )}
      </section>
      {sets.length > 0 && (
        <section>
          <h3 className="mb-2 font-semibold text-fg">Bộ câu hỏi có sẵn của bài</h3>
          <ul className="space-y-2">
            {sets.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center gap-2 rounded-xl border border-line bg-surface p-3">
                <span className="min-w-0 flex-1"><span className="block font-medium text-fg">{s.title}</span><span className="block text-xs text-muted">{s.questionIds.length} câu · {s.description}</span></span>
                <Button size="sm" variant="secondary" onClick={() => setAssign({ kind: "quiz", ref: s.id })}><Send /> Giao</Button>
              </li>
            ))}
          </ul>
        </section>
      )}
      <AssignDialog open={!!assign} onOpenChange={(o) => !o && setAssign(undefined)} preset={assign} sgkRef={refId} />
    </div>
  );
}

/** Tab Bài lập trình của một bài (giáo viên): bài code chấm tự động liên quan, giao cho lớp. */
export function LessonCodeTab({ refId }: { refId: string }) {
  const { lesson } = useLessonData(refId);
  const [assign, setAssign] = useState<AssignPreset | undefined>();
  const exercises = lesson?.key ? CODING_EXERCISES.filter((e) => e.lessonKey === lesson.key) : [];
  if (!exercises.length) return <p className="text-sm text-muted">Bài này chưa có bài lập trình chấm tự động.</p>;
  return (
    <>
      <ul className="space-y-2">
        {exercises.map((e) => (
          <li key={e.id} className="flex flex-wrap items-start gap-3 rounded-xl border border-line bg-surface p-3">
            <span className="min-w-0 flex-1 basis-64">
              <span className="block font-semibold text-fg">{e.title} <Badge className="ml-1">{e.topic}</Badge></span>
              <span className="mt-1 block text-sm text-muted">{e.task}</span>
              <span className="mt-1 block text-xs text-muted">{e.tests.length} test chấm tự động</span>
            </span>
            <Button size="sm" variant="secondary" onClick={() => setAssign({ kind: "code", ref: e.id })}><Send /> Giao cho lớp</Button>
          </li>
        ))}
      </ul>
      <AssignDialog open={!!assign} onOpenChange={(o) => !o && setAssign(undefined)} preset={assign} sgkRef={refId} />
    </>
  );
}
