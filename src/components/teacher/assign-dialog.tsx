"use client";
import Link from "next/link";
import { useState } from "react";
import { BookOpen, CalendarClock, Code2, FlaskConical, ListChecks, Search, Send, UserRound, Wand2 } from "lucide-react";
import { toast } from "sonner";
import type { Assignment, Grade, HintMode } from "@/lib/domain/types";
import { findSgk } from "@/lib/data/sgk-kntt";
import { gradeLessons, lessonKey } from "@/lib/access/unlocks";
import { TEXTBOOKS } from "@/lib/data/curriculum";
import { bookEntry } from "@/lib/sgk/book";
import { lessonAssignables } from "@/lib/teacher/lesson-items";
import { LAB_TEMPLATES } from "@/lib/data/labs";
import { PRACTICE_SETS } from "@/lib/data/practice";
import { CODING_EXERCISES } from "@/lib/data/coding-exercises";
import { SCORED_LABS } from "@/lib/sim/lab-score";
import { SCORING_LABEL, dueFor, fmtDue, type DueChoice, type TaskKind } from "@/lib/teacher/assign";
import { classStudents, teacherClasses } from "@/lib/store/scoped";
import { nextLesson } from "@/lib/teacher/today";
import { useSessionData } from "@/lib/store/use-role";
import { cn, matchesQuery } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input, Textarea } from "@/components/ui/form";
import { LabArt } from "@/components/labs/lab-art";

type Kind = TaskKind | "activity";
export interface AssignPreset { kind: Kind; ref: string }

interface Item { kind: Kind; ref: string; title: string; grades: number[]; meta: string; auto: boolean }

const KINDS: { id: Kind; label: string; icon: typeof FlaskConical }[] = [
  { id: "lab", label: "Mô phỏng", icon: FlaskConical },
  { id: "quiz", label: "Bộ câu hỏi", icon: ListChecks },
  { id: "code", label: "Bài code", icon: Code2 },
  { id: "activity", label: "Hoạt động tự thiết kế", icon: Wand2 },
];

/** Lần giao trước (hạn, số lần làm, cách tính điểm, AI Gia sư): nhớ trên trình duyệt để lần sau khỏi chọn lại. */
const PREFS_KEY = "edunova-assign-prefs";
interface AssignPrefs { due: DueChoice; maxAttempts: number; scoring: "best" | "last" | "first"; tutor: boolean }
function loadPrefs(): Partial<AssignPrefs> {
  try { return JSON.parse(localStorage.getItem(PREFS_KEY) ?? "{}") as Partial<AssignPrefs>; } catch { return {}; }
}
function savePrefs(p: AssignPrefs) {
  try { localStorage.setItem(PREFS_KEY, JSON.stringify(p)); } catch { /* bộ nhớ trình duyệt bị chặn: bỏ qua */ }
}

const DUE: { id: DueChoice; label: string }[] = [
  { id: "next", label: "Trước tiết sau" },
  { id: "tonight", label: "21:00 tối nay" },
  { id: "sunday", label: "21:00 Chủ nhật" },
  { id: "custom", label: "Chọn ngày giờ" },
];

/**
 * Giao nhiệm vụ trong một hộp thoại: chọn nội dung có sẵn (mô phỏng, câu hỏi, bài code), chọn một hay nhiều lớp,
 * hạn nộp tính theo thời khóa biểu từng lớp, lời dặn, và xem trước thẻ học sinh sẽ thấy.
 */
export function AssignDialog({ open, onOpenChange, preset, sgkRef, suggest, classId, studentIds, courseId, title = "Giao nhiệm vụ" }: { open: boolean; onOpenChange: (o: boolean) => void; preset?: AssignPreset; sgkRef?: string; suggest?: AssignPreset[]; classId?: string; studentIds?: string[]; courseId?: string; title?: string }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open && (
        <DialogContent title={title} description="Chọn nội dung, lớp và hạn nộp. Mô phỏng, câu hỏi và bài code được máy chấm, thầy cô xem kết quả ngay." className="max-w-3xl">
          <AssignForm key={preset ? `${preset.kind}:${preset.ref}` : "new"} preset={preset} sgkRef={sgkRef} suggest={suggest} classId={classId} studentIds={studentIds} courseId={courseId} onDone={() => onOpenChange(false)} />
        </DialogContent>
      )}
    </Dialog>
  );
}

function AssignForm({ preset, sgkRef, suggest, classId, studentIds, courseId, onDone }: { preset?: AssignPreset; sgkRef?: string; suggest?: AssignPreset[]; classId?: string; studentIds?: string[]; courseId?: string; onDone: () => void }) {
  const { d, user } = useSessionData();
  const classes = teacherClasses(d, user.id);
  const activities = d.activities.filter((a) => a.ownerId === user.id && a.status === "published");
  const items: Item[] = [
    ...LAB_TEMPLATES.filter((l) => l.status !== "planned").map((l) => ({ kind: "lab" as const, ref: l.slug, title: l.title, grades: l.grades, meta: SCORED_LABS.has(l.slug) ? "Tự chấm điểm theo số lần chọn sai" : "Khám phá tự do, ghi nhận đã làm", auto: SCORED_LABS.has(l.slug) })),
    ...d.teacherQuizzes.filter((q) => q.ownerId === user.id && q.questions.length).map((q) => ({ kind: "quiz" as const, ref: q.id, title: q.title, grades: [q.grade], meta: `${q.questions.length} câu · bộ của thầy cô`, auto: true })),
    ...PRACTICE_SETS.map((s) => ({ kind: "quiz" as const, ref: s.id, title: s.title, grades: [s.grade], meta: `${s.questionIds.length} câu · ngân hàng câu hỏi`, auto: true })),
    ...CODING_EXERCISES.map((e) => ({ kind: "code" as const, ref: e.id, title: e.title, grades: [e.grade], meta: `${e.tests.length} test chấm tự động · ${e.topic}`, auto: true })),
    ...activities.map((a) => ({ kind: "activity" as const, ref: a.id, title: a.title, grades: [d.lessonPlans.find((p) => p.id === a.lessonPlanId)?.grade ?? 10], meta: "Chấm theo tiêu chí, thầy cô chấm tay", auto: false })),
  ];

  const suggested = (suggest ?? []).flatMap((s) => items.filter((i) => i.kind === s.kind && i.ref === s.ref));
  const presetItem = preset && items.find((i) => i.kind === preset.kind && i.ref === preset.ref);
  type Source = "lesson" | "library" | "new";
  const [source, setSource] = useState<Source>(preset && !sgkRef ? "library" : "lesson");
  const [lessonGrade, setLessonGrade] = useState<Grade>(() => (sgkRef ? findSgk(sgkRef)?.grade : undefined) ?? classes.find((c) => c.id === classId)?.grade ?? classes[0]?.grade ?? 10);
  /** Mặc định: bài lớp vừa học (đã dạy gần nhất), chưa dạy bài nào thì bài dạy tiếp theo. */
  const [lessonRef, setLessonRef] = useState<string>(() => {
    if (sgkRef) return sgkRef;
    const cls = classes.find((c) => c.id === classId) ?? classes.find((c) => c.grade === lessonGrade);
    const taught = cls && d.taughtLessons.filter((t) => t.teacherId === user.id && t.classId === cls.id).sort((a, b) => b.at.localeCompare(a.at))[0]?.ref;
    return taught ?? (cls && nextLesson(d, user.id, cls)?.ref) ?? gradeLessons(lessonGrade)[0]?.ref ?? "";
  });
  /** Hoạt động giao được của bài đang chọn. */
  const itemsOf = (ref: string) => { const e = ref ? bookEntry(ref) : undefined; return e ? lessonAssignables(d, user.id, e).flatMap((x) => items.filter((i) => i.kind === x.kind && i.ref === x.ref)) : []; };
  const lessonList = itemsOf(lessonRef);
  /** Gợi ý mặc định: một bộ luyện tập và một mô phỏng chính của bài (đủ cho một buổi, không giao dồn). */
  const starter = (list: Item[]) => [list.find((i) => i.kind === "quiz") ?? list.find((i) => i.kind === "code"), list.find((i) => i.kind === "lab")].filter((i): i is Item => !!i);
  const [kind, setKind] = useState<Kind>(preset?.kind ?? "lab");
  // Mặc định chọn sẵn phần gợi ý của bài (thầy cô tick thêm/bớt) — ít thao tác nhất cho trường hợp phổ biến.
  const [picks, setPicks] = useState<Item[]>(() => (presetItem ? [presetItem] : source === "lesson" ? starter(lessonList) : []));
  const pick = picks[0];
  /** Phần Kiến thức: mở bài cho lớp đọc (không chấm điểm). Mặc định bật khi giao từ bài học. */
  const [read, setRead] = useState(!preset);
  const isOn = (i: Item) => picks.some((p) => p.kind === i.kind && p.ref === i.ref);
  const toggle = (i: Item) => setPicks(isOn(i) ? picks.filter((p) => !(p.kind === i.kind && p.ref === i.ref)) : [...picks, i]);
  const [q, setQ] = useState("");
  /** Lớp đang học tới bài này (bài dạy tiếp theo, hoặc vừa đánh dấu đã dạy). */
  const learning = (ref: string) => classes.filter((c) => nextLesson(d, user.id, c)?.ref === ref || d.taughtLessons.some((t) => t.teacherId === user.id && t.classId === c.id && t.ref === ref)).map((c) => c.id);
  const [classIds, setClassIds] = useState<string[]>(() => {
    if (classId) return [classId];
    if (sgkRef && learning(sgkRef).length) return learning(sgkRef);
    const g = presetItem?.grades;
    const match = classes.filter((c) => !g || g.includes(c.grade)).map((c) => c.id);
    return match.length ? [match[0]] : classes.slice(0, 1).map((c) => c.id);
  });
  const [prefs] = useState(loadPrefs);
  const [due, setDue] = useState<DueChoice>(prefs.due && prefs.due !== "custom" ? prefs.due : "next");
  const [custom, setCustom] = useState("");
  const [note, setNote] = useState("");
  const [tutor, setTutor] = useState(prefs.tutor ?? true);
  const [maxAttempts, setMaxAttempts] = useState(prefs.maxAttempts ?? 0);
  const [scoring, setScoring] = useState<"best" | "last" | "first">(prefs.scoring ?? "best");
  /** undefined = cả lớp; mảng = chỉ các em được chọn (khi giao cho đúng một lớp). */
  const [only, setOnly] = useState<string[] | undefined>(studentIds);
  const [now] = useState(() => new Date());

  const chosen = classes.filter((c) => classIds.includes(c.id));
  const grades = [...new Set(chosen.map((c) => c.grade))];
  const shown = items.filter((i) => i.kind === kind && (!grades.length || i.grades.some((g) => grades.includes(g as 10 | 11 | 12))) && matchesQuery(q, i.title, i.meta));
  /** Bài vừa dạy / dạy tiếp của các lớp đang chọn (đánh dấu trong danh sách bài). */
  const lessonMarks: Record<string, string> = {};
  for (const c of chosen) {
    const n = nextLesson(d, user.id, c)?.ref;
    if (n) lessonMarks[n] ??= `${c.name} dạy tiếp`;
    const t = d.taughtLessons.filter((x) => x.teacherId === user.id && x.classId === c.id).sort((x, y) => y.at.localeCompare(x.at))[0]?.ref;
    if (t) lessonMarks[t] = `${c.name} vừa học`;
  }
  const bookName = chosen.length ? [...new Set(chosen.map((c) => TEXTBOOKS.find((t) => t.id === c.textbookId)?.short ?? c.textbookId))].join(", ") : "KNTT";
  const dueOf = (c: (typeof classes)[number]) => (due === "custom" ? (custom ? new Date(custom) : undefined) : dueFor(due, c, now));

  function submit(draft = false) {
    const unlockRead = source === "lesson" && read && !!lessonRef;
    if (!picks.length && !unlockRead) return toast.error("Chọn nội dung cần giao");
    if (!chosen.length) return toast.error("Chọn ít nhất một lớp");
    const missingDue = chosen.find((c) => { const t = dueOf(c); return !t || Number.isNaN(t.getTime()) || t.getTime() < Date.now() + 3_600_000; });
    if (missingDue) return toast.error("Hạn nộp phải sau hiện tại ít nhất 1 giờ");
    savePrefs({ due, maxAttempts, scoring, tutor });
    let made = 0;
    for (const it of picks) {
      for (const c of chosen) {
        const dup = !(chosen.length === 1 && only?.length) && d.assignments.some((a) => a.classId === c.id && a.status === "open" && !a.studentIds && (it.kind === "activity" ? a.activityId === it.ref : a.task?.kind === it.kind && a.task.ref === it.ref));
        if (dup) { toast.warning(`${c.name} đã có “${it.title}” đang mở, bỏ qua`); continue; }
        const target = chosen.length === 1 && only?.length ? { studentIds: only } : {};
        const effSgk = source === "lesson" ? lessonRef : sgkRef;
        const base = { ownerId: user.id, ...(effSgk ? { sgkRef: effSgk } : {}), ...(courseId ? { courseId } : {}), ...(it.kind !== "activity" && maxAttempts ? { maxAttempts } : {}), ...(it.kind !== "activity" && scoring !== "best" ? { scoring } : {}), ...target, classId: c.id, title: it.title, dueAt: dueOf(c)!.toISOString(), hintMode: (tutor ? "guided" : "off") as HintMode, ...(note.trim() ? { note: note.trim() } : {}) };
        let id: string;
        if (it.kind === "activity") {
          const act = activities.find((a) => a.id === it.ref);
          const cfg = act && d.labConfigs.find((x) => x.id === act.labConfigId);
          id = d.createAssignment({ ...base, activityId: it.ref, hintMode: cfg?.mode === "assessment" ? "off" : base.hintMode });
        } else {
          id = d.createAssignment({ ...base, activityId: "", task: { kind: it.kind, ref: it.ref } } satisfies Omit<Assignment, "id" | "publishedAt" | "status">);
        }
        if (draft) d.updateAssignment(id, { status: "draft" });
        made++;
      }
      const tq = it.kind === "quiz" && d.teacherQuizzes.find((x) => x.id === it.ref);
      if (tq && !draft) d.saveTeacherQuiz({ ...tq, status: "published", classIds: [...new Set([...tq.classIds, ...classIds])] });
    }
    if (unlockRead && !draft) for (const c of chosen) d.setUnlocked(user.id, c.id, [lessonKey(lessonRef)], true);
    if (!made && !unlockRead) return;
    if (!made) { toast.success(`Đã mở phần kiến thức bài cho ${chosen.length} lớp`); onDone(); return; }
    if (draft) toast.success("Đã lưu nháp. Học sinh chưa thấy cho đến khi thầy cô bấm Giao.");
    else toast.success(chosen.length === 1 && only?.length ? `Đã giao ${picks.length} mục cho ${only.length} em` : `Đã giao ${picks.length} mục cho ${chosen.length} lớp (${made} nhiệm vụ)`);
    onDone();
  }

  const firstDue = chosen[0] && dueOf(chosen[0]);
  return (
    <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_260px]">
      <div className="min-w-0 space-y-4">
        <section>
          <h3 className="mb-2 text-sm font-semibold text-fg">1. Giao cho lớp</h3>
          <div className="flex flex-wrap gap-2">
            {classes.map((c) => (
              <label key={c.id} className={cn("flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-1.5 text-sm", classIds.includes(c.id) ? "border-cyan bg-cyan/10 text-fg" : "border-line text-muted")}>
                <input type="checkbox" checked={classIds.includes(c.id)} onChange={(e) => { setClassIds(e.target.checked ? [...classIds, c.id] : classIds.filter((x) => x !== c.id)); setOnly(undefined); }} /> {c.name}
                <span className="text-xs text-muted">{classStudents(d, c.id).length} em</span>
                {lessonRef && source === "lesson" && learning(lessonRef).includes(c.id) && <span className="rounded-full bg-success/15 px-1.5 text-[11px] font-semibold text-success-fg">đang học bài này</span>}
              </label>
            ))}
          </div>
          {chosen.length === 1 && (
            <div className="mt-2 rounded-xl border border-line p-2">
              <div className="flex flex-wrap gap-3 text-sm" role="radiogroup" aria-label="Giao cho">
                <label className="flex items-center gap-1.5"><input type="radio" checked={!only} onChange={() => setOnly(undefined)} /> Cả lớp</label>
                <label className="flex items-center gap-1.5"><input type="radio" checked={!!only} onChange={() => setOnly([])} /> Chọn học sinh</label>
              </div>
              {only && (
                <div className="mt-2 flex max-h-32 flex-wrap gap-1.5 overflow-y-auto">
                  {classStudents(d, chosen[0].id).map((u) => (
                    <label key={u.id} className={cn("flex cursor-pointer items-center gap-1.5 rounded-lg border px-2 py-1 text-xs", only.includes(u.id) ? "border-cyan bg-cyan/10 text-fg" : "border-line text-muted")}>
                      <input type="checkbox" checked={only.includes(u.id)} onChange={(e) => setOnly(e.target.checked ? [...only, u.id] : only.filter((x) => x !== u.id))} /> {u.name}
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        <section>
          <h3 className="mb-2 text-sm font-semibold text-fg">2. Chọn bài và nội dung</h3>
          <div className="mb-3 grid grid-cols-3 gap-1 rounded-xl border border-line bg-surface-2/50 p-1" role="tablist" aria-label="Nguồn bài tập">
            {([["lesson", "Từ bài học"], ["library", "Từ thư viện"], ["new", "Tạo bài mới"]] as const).map(([id, l]) => (
              <button key={id} type="button" role="tab" aria-selected={source === id} onClick={() => { setSource(id); setPicks(id === "lesson" ? starter(lessonList) : []); }} className={cn("rounded-lg px-2 py-1.5 text-sm font-semibold", source === id ? "bg-surface text-fg shadow-sm" : "text-muted hover:text-fg")}>{l}</button>
            ))}
          </div>
          {source === "new" && (
            <div className="grid gap-2 sm:grid-cols-2">
              <Link href="/teacher/bank?tao=1" className="rounded-xl border border-line p-3 hover:border-cyan/40"><ListChecks className="mb-1 size-5 text-blue-fg" aria-hidden /><p className="font-semibold text-fg">Bộ câu hỏi mới</p><p className="text-xs text-muted">Soạn trong Thư viện › Ngân hàng luyện tập, lưu xong quay lại giao.</p></Link>
              <Link href="/teacher/activity-builder" className="rounded-xl border border-line p-3 hover:border-cyan/40"><Wand2 className="mb-1 size-5 text-violet-fg" aria-hidden /><p className="font-semibold text-fg">Hoạt động chấm tay</p><p className="text-xs text-muted">Nhiệm vụ có tiêu chí chấm, thầy cô chấm.</p></Link>
            </div>
          )}
          {source === "lesson" && (
            <LessonSource
              grade={lessonGrade}
              gradeLocked={grades.length === 1}
              onGrade={(g) => { setLessonGrade(g); const r = gradeLessons(g)[0]?.ref ?? ""; setLessonRef(r); setPicks(starter(itemsOf(r))); }}
              lessonRef={lessonRef}
              onLesson={(r) => { setLessonRef(r); setPicks(starter(itemsOf(r))); const sug = learning(r); if (sug.length && !classId) setClassIds(sug); }}
              marks={lessonMarks}
              items={lessonList}
              isOn={isOn}
              toggle={toggle}
              setAll={(on) => setPicks(on ? lessonList : [])}
              read={read}
              setRead={setRead}
              bookName={bookName}
            />
          )}
          {source === "library" && <>
          <div className="mb-2 flex flex-wrap gap-1" role="tablist" aria-label="Loại nội dung">
            {KINDS.map((k) => (
              <button key={k.id} type="button" role="tab" aria-selected={kind === k.id} onClick={() => setKind(k.id)} className={cn("flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium", kind === k.id ? "bg-fg text-bg" : "text-muted hover:bg-surface-2 hover:text-fg")}>
                <k.icon className="size-4" aria-hidden /> {k.label}
              </button>
            ))}
          </div>
          {suggested.length > 0 && (
            <div className="mb-2 rounded-xl bg-cyan/5 p-2">
              <p className="mb-1.5 text-xs font-semibold text-cyan-fg">Có trong bài này</p>
              <div className="flex flex-wrap gap-1.5">
                {suggested.map((i) => (
                  <button key={`${i.kind}:${i.ref}`} type="button" onClick={() => { setKind(i.kind); toggle(i); }} aria-pressed={isOn(i)} className={cn("rounded-lg border px-2.5 py-1 text-xs font-medium", isOn(i) ? "border-cyan bg-cyan/15 text-fg" : "border-line bg-surface text-fg hover:border-cyan/40")}>
                    {KINDS.find((k) => k.id === i.kind)?.label}: {i.title}
                  </button>
                ))}
              </div>
            </div>
          )}
          <label className="relative block">
            <span className="sr-only">Tìm nội dung</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
            <Input className="pl-9" placeholder={grades.length ? `Tìm trong nội dung Tin ${grades.join(", ")}…` : "Tìm…"} value={q} onChange={(e) => setQ(e.target.value)} />
          </label>
          <ul className="mt-2 max-h-64 space-y-1 overflow-y-auto pr-1" aria-label="Nội dung">
            {shown.length === 0 && (
              <li className="rounded-lg border border-dashed border-line p-3 text-sm text-muted">
                {kind === "activity" ? <>Chưa có hoạt động tự thiết kế. <Link href="/teacher/activity-builder" className="font-medium text-cyan-fg hover:underline">Thiết kế hoạt động</Link></> : kind === "quiz" ? "Chưa có bộ câu hỏi cho khối lớp này. Tạo ở Thư viện bài tập." : "Không có nội dung phù hợp với khối lớp đã chọn."}
              </li>
            )}
            {shown.map((i) => {
              const on = isOn(i);
              return (
                <li key={`${i.kind}:${i.ref}`}>
                  <button type="button" role="checkbox" aria-checked={on} onClick={() => toggle(i)} className={cn("flex w-full items-center gap-3 rounded-xl border px-3 py-2 text-left transition-colors", on ? "border-cyan bg-cyan/10" : "border-line hover:border-cyan/40")}>
                    {i.kind === "lab" ? <LabArt slug={i.ref} className="h-9 w-14 shrink-0 rounded-md" /> : <span className="grid h-9 w-14 shrink-0 place-items-center rounded-md bg-surface-2 text-muted">{i.kind === "quiz" ? <ListChecks className="size-4" aria-hidden /> : i.kind === "code" ? <Code2 className="size-4" aria-hidden /> : <Wand2 className="size-4" aria-hidden />}</span>}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-fg">{i.title}</span>
                      <span className="block truncate text-xs text-muted">Tin {i.grades.join(", ")} · {i.meta}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          </>}
        </section>

        <section>
          <h3 className="mb-2 text-sm font-semibold text-fg">3. Hạn nộp</h3>
          <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Hạn nộp">
            {DUE.map((x) => (
              <button key={x.id} type="button" role="radio" aria-checked={due === x.id} onClick={() => setDue(x.id)} className={cn("rounded-lg border px-3 py-1.5 text-sm", due === x.id ? "border-cyan bg-cyan/10 font-medium text-fg" : "border-line text-muted hover:text-fg")}>{x.label}</button>
            ))}
          </div>
          {due === "custom" ? (
            <Input type="datetime-local" className="mt-2 w-60" aria-label="Ngày giờ hạn nộp" value={custom} onChange={(e) => setCustom(e.target.value)} />
          ) : (
            <p className="mt-2 text-xs text-muted">{chosen.map((c) => `${c.name}: ${fmtDue(dueOf(c)!)}`).join(" · ") || "Chọn lớp để xem hạn"}</p>
          )}
        </section>

        {picks.some((p) => p.kind !== "activity") && (
          <section>
            <h3 className="mb-2 text-sm font-semibold text-fg">4. Số lần làm và cách tính điểm</h3>
            <div className="grid gap-2 sm:grid-cols-2">
              <select aria-label="Số lần làm" className="h-10 rounded-xl border border-line bg-surface px-3 text-sm text-fg" value={maxAttempts} onChange={(e) => setMaxAttempts(Number(e.target.value))}>
                <option value={0}>Không giới hạn số lần</option>
                {[1, 2, 3, 5].map((n) => <option key={n} value={n}>Tối đa {n} lần</option>)}
              </select>
              <select aria-label="Cách tính điểm" className="h-10 rounded-xl border border-line bg-surface px-3 text-sm text-fg" value={scoring} onChange={(e) => setScoring(e.target.value as typeof scoring)}>
                {(Object.keys(SCORING_LABEL) as (keyof typeof SCORING_LABEL)[]).map((k) => <option key={k} value={k}>Tính {SCORING_LABEL[k].toLowerCase()}</option>)}
              </select>
            </div>
          </section>
        )}

        <section className="space-y-2">
          <Textarea aria-label="Lời dặn cho học sinh" className="min-h-[60px]" placeholder="Lời dặn (không bắt buộc), ví dụ: Làm xong rồi chụp màn hình kết quả ping dán vào vở." value={note} onChange={(e) => setNote(e.target.value)} />
          <label className="flex items-center gap-2 text-sm text-fg"><input type="checkbox" checked={tutor} onChange={(e) => setTutor(e.target.checked)} /> Cho phép hỏi AI Gia sư khi làm</label>
        </section>
      </div>

      <aside className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">Học sinh sẽ thấy</p>
        <div className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
          {pick?.kind === "lab" && <LabArt slug={pick.ref} className="mb-3 aspect-[16/8] w-full rounded-lg" />}
          <p className="font-semibold text-fg">{pick?.title ?? "Chưa chọn nội dung"}</p>
          {picks.length > 1 && <p className="mt-1 text-xs text-muted">và {picks.length - 1} mục khác: {picks.slice(1).map((p) => p.title).join(", ")}</p>}
          {note.trim() && <p className="mt-1 text-sm text-fg">“{note.trim()}”</p>}
          <p className="mt-2 flex items-center gap-1 text-xs text-muted"><UserRound className="size-3.5" aria-hidden /> {user.name}</p>
          {firstDue && !Number.isNaN(firstDue.getTime()) && <p className="mt-1 flex items-center gap-1 text-xs text-muted"><CalendarClock className="size-3.5" aria-hidden /> Hạn {fmtDue(firstDue)}</p>}
          {pick && <p className="mt-2 text-xs text-muted">{picks.every((p) => p.auto) ? "Làm xong là có kết quả ngay, thầy cô không cần chấm." : "Nộp bài để thầy cô chấm theo tiêu chí."}{tutor ? "" : " Không dùng AI Gia sư."}</p>}
        </div>
        {(picks.length > 0 || (source === "lesson" && read)) && chosen.length > 0 && <p className="text-xs text-muted">{source === "lesson" && read ? "Mở phần kiến thức và giao " : "Sẽ giao "}<b className="text-fg">{picks.length} mục</b> cho <b className="text-fg">{chosen.length === 1 && only?.length ? `${only.length} em` : `${chosen.length} lớp · ${chosen.reduce((n, c) => n + classStudents(d, c.id).length, 0)} em`}</b>.</p>}
        <Button className="w-full" onClick={() => submit()} disabled={(!picks.length && !(source === "lesson" && read)) || !chosen.length || (chosen.length === 1 && !!only && only.length === 0)}><Send /> {chosen.length === 1 && only?.length ? `Giao cho ${only.length} em` : `Giao cho ${chosen.length || ""} lớp`}</Button>
        <Button className="w-full" variant="ghost" onClick={() => submit(true)} disabled={!picks.length || !chosen.length}>Lưu nháp, giao sau</Button>
      </aside>
    </div>
  );
}

/**
 * Giao từ bài học: sách đã gắn với lớp nên chỉ cần chọn bài (tìm nhanh, bài vừa học/dạy tiếp nổi lên đầu),
 * rồi bài hiện ngay ba phần Kiến thức · Luyện tập · Mô phỏng để tick chọn.
 */
function LessonSource({ grade, gradeLocked, onGrade, lessonRef, onLesson, marks, items, isOn, toggle, setAll, read, setRead, bookName }: {
  grade: Grade; gradeLocked: boolean; onGrade: (g: Grade) => void; lessonRef: string; onLesson: (ref: string) => void; marks: Record<string, string>;
  items: Item[]; isOn: (i: Item) => boolean; toggle: (i: Item) => void; setAll: (on: boolean) => void; read: boolean; setRead: (v: boolean) => void; bookName: string;
}) {
  const [choosing, setChoosing] = useState(!lessonRef);
  const [q, setQ] = useState("");
  const e = lessonRef ? bookEntry(lessonRef) : undefined;
  const all = gradeLessons(grade);
  const quick = all.filter((x) => marks[x.ref]);
  const found = all.filter((x) => matchesQuery(q, `bài ${x.lesson.no}`, x.lesson.title, x.topic.title));
  const sims = items.filter((i) => i.kind === "lab");
  const practice = items.filter((i) => i.kind !== "lab");
  const row = (it: Item) => {
    const on = isOn(it);
    return (
      <li key={`${it.kind}:${it.ref}`}>
        <button type="button" role="checkbox" aria-checked={on} onClick={() => toggle(it)} className={cn("flex w-full items-center gap-2.5 rounded-lg border px-2.5 py-2 text-left text-sm", on ? "border-cyan bg-cyan/10" : "border-line hover:border-cyan/40")}>
          <span aria-hidden className={cn("grid size-4 shrink-0 place-items-center rounded border text-[10px] font-bold", on ? "border-cyan bg-cyan text-white" : "border-line")}>{on ? "✓" : ""}</span>
          {it.kind === "lab" && <LabArt slug={it.ref} className="h-8 w-12 shrink-0 rounded" />}
          <span className="min-w-0 flex-1"><span className="block truncate font-medium text-fg">{it.title}</span><span className="block truncate text-xs text-muted">{it.meta}</span></span>
        </button>
      </li>
    );
  };

  if (choosing || !e)
    return (
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          {gradeLocked ? <span className="rounded-lg bg-surface-2 px-2.5 py-1.5 text-sm font-semibold text-fg">Tin học {grade} · {bookName}</span> : (
            <select aria-label="Khối lớp" className="h-10 rounded-xl border border-line bg-surface px-3 text-sm text-fg" value={grade} onChange={(ev) => onGrade(Number(ev.target.value) as Grade)}>
              {[10, 11, 12].map((g) => <option key={g} value={g}>Tin học {g}</option>)}
            </select>
          )}
          <label className="relative min-w-0 flex-1">
            <span className="sr-only">Tìm bài</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
            <Input className="h-10 pl-9" placeholder="Gõ số bài hoặc tên bài, ví dụ 19 hoặc rẽ nhánh" value={q} onChange={(ev) => setQ(ev.target.value)} autoFocus />
          </label>
        </div>
        {!q && quick.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {quick.map((x) => <button key={x.ref} type="button" onClick={() => { onLesson(x.ref); setChoosing(false); }} className="rounded-lg border border-success/40 bg-success/10 px-2.5 py-1 text-xs font-semibold text-success-fg hover:bg-success/20">Bài {x.lesson.no} · {marks[x.ref]}</button>)}
          </div>
        )}
        <ul className="max-h-72 space-y-0.5 overflow-y-auto rounded-xl border border-line p-1" aria-label="Bài trong sách">
          {found.length === 0 && <li className="p-3 text-sm text-muted">Không có bài khớp “{q}”.</li>}
          {found.map((x, i) => (
            <li key={x.ref}>
              {(i === 0 || found[i - 1].topic.no !== x.topic.no) && <p className="px-2 pb-1 pt-2 text-[11px] font-bold uppercase tracking-wide text-muted">Chủ đề {x.topic.no}. {x.topic.title}</p>}
              <button type="button" onClick={() => { onLesson(x.ref); setChoosing(false); }} className={cn("flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-surface-2", x.ref === lessonRef && "bg-brand/10")}>
                <span className="w-12 shrink-0 font-semibold text-muted">Bài {x.lesson.no}</span>
                <span className="min-w-0 flex-1 truncate text-fg">{x.lesson.title}</span>
                {marks[x.ref] && <span className="shrink-0 rounded-full bg-success/15 px-1.5 text-[11px] font-semibold text-success-fg">{marks[x.ref]}</span>}
              </button>
            </li>
          ))}
        </ul>
      </div>
    );

  const sections = e.content?.sections ?? [];
  const allOn = items.length > 0 && items.every(isOn);
  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-2 rounded-xl border border-brand/30 bg-brand/5 p-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-blue-fg">Tin học {e.grade} · {bookName} · Chủ đề {e.topic.no}{marks[e.ref] ? ` · ${marks[e.ref]}` : ""}</p>
          <p className="font-bold text-fg">Bài {e.lesson.no}. {e.lesson.title}</p>
        </div>
        <Button type="button" size="sm" variant="secondary" onClick={() => setChoosing(true)}>Đổi bài</Button>
      </div>

      <section aria-label="Kiến thức">
        <p className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-fg"><BookOpen className="size-4 text-blue-fg" aria-hidden /> Kiến thức</p>
        <button type="button" role="checkbox" aria-checked={read} onClick={() => setRead(!read)} className={cn("flex w-full items-start gap-2.5 rounded-lg border px-2.5 py-2 text-left text-sm", read ? "border-cyan bg-cyan/10" : "border-line hover:border-cyan/40")}>
          <span aria-hidden className={cn("mt-0.5 grid size-4 shrink-0 place-items-center rounded border text-[10px] font-bold", read ? "border-cyan bg-cyan text-white" : "border-line")}>{read ? "✓" : ""}</span>
          <span className="min-w-0 flex-1">
            <span className="block font-medium text-fg">Mở bài cho lớp đọc</span>
            <span className="block text-xs text-muted">{sections.length ? sections.map((x, i) => `${i + 1}. ${x.title}`).join(" · ") : "Nội dung bài theo SGK"}</span>
          </span>
        </button>
      </section>

      <section aria-label="Luyện tập">
        <p className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-fg"><ListChecks className="size-4 text-blue-fg" aria-hidden /> Luyện tập <span className="font-normal text-muted">· máy chấm</span></p>
        {practice.length ? <ul className="space-y-1">{practice.map(row)}</ul> : <p className="rounded-lg border border-dashed border-line p-2.5 text-xs text-muted">Bài này chưa có bộ câu hỏi. Soạn ở Bài tập & Kiểm tra › Tạo bài kiểm tra.</p>}
      </section>

      <section aria-label="Mô phỏng">
        <p className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-fg"><FlaskConical className="size-4 text-blue-fg" aria-hidden /> Mô phỏng</p>
        {sims.length ? <ul className="grid gap-1 sm:grid-cols-2">{sims.map(row)}</ul> : <p className="rounded-lg border border-dashed border-line p-2.5 text-xs text-muted">Bài này chưa có mô phỏng. Chọn ở tab “Từ thư viện”.</p>}
      </section>

      {items.length > 1 && <button type="button" className="text-sm font-semibold text-blue-fg hover:underline" onClick={() => setAll(!allOn)}>{allOn ? "Bỏ chọn luyện tập và mô phỏng" : "Chọn cả luyện tập và mô phỏng"}</button>}
    </div>
  );
}
