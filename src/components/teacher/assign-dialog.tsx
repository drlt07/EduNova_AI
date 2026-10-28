"use client";
import Link from "next/link";
import { useState } from "react";
import { CalendarClock, Code2, FlaskConical, ListChecks, Search, Send, UserRound, Wand2 } from "lucide-react";
import { toast } from "sonner";
import type { Assignment, HintMode } from "@/lib/domain/types";
import { LAB_TEMPLATES } from "@/lib/data/labs";
import { PRACTICE_SETS } from "@/lib/data/practice";
import { CODING_EXERCISES } from "@/lib/data/coding-exercises";
import { SCORED_LABS } from "@/lib/sim/lab-score";
import { dueFor, fmtDue, type DueChoice, type TaskKind } from "@/lib/teacher/assign";
import { teacherClasses } from "@/lib/store/scoped";
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
export function AssignDialog({ open, onOpenChange, preset, sgkRef, suggest }: { open: boolean; onOpenChange: (o: boolean) => void; preset?: AssignPreset; sgkRef?: string; suggest?: AssignPreset[] }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open && (
        <DialogContent title="Giao nhiệm vụ" description="Chọn nội dung, lớp và hạn nộp. Mô phỏng, câu hỏi và bài code được máy chấm, thầy cô xem kết quả ngay." className="max-w-3xl">
          <AssignForm key={preset ? `${preset.kind}:${preset.ref}` : "new"} preset={preset} sgkRef={sgkRef} suggest={suggest} onDone={() => onOpenChange(false)} />
        </DialogContent>
      )}
    </Dialog>
  );
}

function AssignForm({ preset, sgkRef, suggest, onDone }: { preset?: AssignPreset; sgkRef?: string; suggest?: AssignPreset[]; onDone: () => void }) {
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
  const [kind, setKind] = useState<Kind>(preset?.kind ?? "lab");
  const [pick, setPick] = useState<Item | undefined>(presetItem);
  const [q, setQ] = useState("");
  const [classIds, setClassIds] = useState<string[]>(() => {
    const g = presetItem?.grades;
    const match = classes.filter((c) => !g || g.includes(c.grade)).map((c) => c.id);
    return match.length ? [match[0]] : classes.slice(0, 1).map((c) => c.id);
  });
  const [due, setDue] = useState<DueChoice>("next");
  const [custom, setCustom] = useState("");
  const [note, setNote] = useState("");
  const [tutor, setTutor] = useState(true);
  const [now] = useState(() => new Date());

  const chosen = classes.filter((c) => classIds.includes(c.id));
  const grades = [...new Set(chosen.map((c) => c.grade))];
  const shown = items.filter((i) => i.kind === kind && (!grades.length || i.grades.some((g) => grades.includes(g as 10 | 11 | 12))) && matchesQuery(q, i.title, i.meta));
  const dueOf = (c: (typeof classes)[number]) => (due === "custom" ? (custom ? new Date(custom) : undefined) : dueFor(due, c, now));

  function submit() {
    if (!pick) return toast.error("Chọn nội dung cần giao");
    if (!chosen.length) return toast.error("Chọn ít nhất một lớp");
    const missingDue = chosen.find((c) => { const t = dueOf(c); return !t || Number.isNaN(t.getTime()) || t.getTime() < Date.now() + 3_600_000; });
    if (missingDue) return toast.error("Hạn nộp phải sau hiện tại ít nhất 1 giờ");
    let made = 0;
    for (const c of chosen) {
      const dup = d.assignments.some((a) => a.classId === c.id && a.status === "open" && (pick.kind === "activity" ? a.activityId === pick.ref : a.task?.kind === pick.kind && a.task.ref === pick.ref));
      if (dup) { toast.warning(`${c.name} đã có nhiệm vụ này đang mở, bỏ qua`); continue; }
      const base = { ownerId: user.id, ...(sgkRef ? { sgkRef } : {}), classId: c.id, title: pick.title, dueAt: dueOf(c)!.toISOString(), hintMode: (tutor ? "guided" : "off") as HintMode, ...(note.trim() ? { note: note.trim() } : {}) };
      if (pick.kind === "activity") {
        const act = activities.find((a) => a.id === pick.ref);
        const cfg = act && d.labConfigs.find((x) => x.id === act.labConfigId);
        d.createAssignment({ ...base, activityId: pick.ref, hintMode: cfg?.mode === "assessment" ? "off" : base.hintMode });
      } else {
        d.createAssignment({ ...base, activityId: "", task: { kind: pick.kind, ref: pick.ref } } satisfies Omit<Assignment, "id" | "publishedAt" | "status">);
      }
      made++;
    }
    const tq = pick.kind === "quiz" && d.teacherQuizzes.find((x) => x.id === pick.ref);
    if (tq && made) d.saveTeacherQuiz({ ...tq, status: "published", classIds: [...new Set([...tq.classIds, ...classIds])] });
    if (made) { toast.success(`Đã giao “${pick.title}” cho ${made} lớp`); onDone(); }
  }

  const firstDue = chosen[0] && dueOf(chosen[0]);
  return (
    <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_260px]">
      <div className="min-w-0 space-y-4">
        <section>
          <h3 className="mb-2 text-sm font-semibold text-fg">1. Giao gì?</h3>
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
                  <button key={`${i.kind}:${i.ref}`} type="button" onClick={() => { setKind(i.kind); setPick(i); }} aria-pressed={pick?.kind === i.kind && pick.ref === i.ref} className={cn("rounded-lg border px-2.5 py-1 text-xs font-medium", pick?.kind === i.kind && pick.ref === i.ref ? "border-cyan bg-cyan/15 text-fg" : "border-line bg-surface text-fg hover:border-cyan/40")}>
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
          <ul className="mt-2 max-h-64 space-y-1 overflow-y-auto pr-1" role="radiogroup" aria-label="Nội dung">
            {shown.length === 0 && (
              <li className="rounded-lg border border-dashed border-line p-3 text-sm text-muted">
                {kind === "activity" ? <>Chưa có hoạt động tự thiết kế. <Link href="/teacher/activity-builder" className="font-medium text-cyan-fg hover:underline">Thiết kế hoạt động</Link></> : kind === "quiz" ? "Chưa có bộ câu hỏi cho khối lớp này. Soạn ở Khóa học → chọn bài → Câu hỏi trắc nghiệm." : "Không có nội dung phù hợp với khối lớp đã chọn."}
              </li>
            )}
            {shown.map((i) => {
              const on = pick?.kind === i.kind && pick.ref === i.ref;
              return (
                <li key={`${i.kind}:${i.ref}`}>
                  <button type="button" role="radio" aria-checked={on} onClick={() => setPick(i)} className={cn("flex w-full items-center gap-3 rounded-xl border px-3 py-2 text-left transition-colors", on ? "border-cyan bg-cyan/10" : "border-line hover:border-cyan/40")}>
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
        </section>

        <section>
          <h3 className="mb-2 text-sm font-semibold text-fg">2. Cho lớp nào?</h3>
          <div className="flex flex-wrap gap-2">
            {classes.map((c) => (
              <label key={c.id} className={cn("flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-1.5 text-sm", classIds.includes(c.id) ? "border-cyan bg-cyan/10 text-fg" : "border-line text-muted")}>
                <input type="checkbox" checked={classIds.includes(c.id)} onChange={(e) => setClassIds(e.target.checked ? [...classIds, c.id] : classIds.filter((x) => x !== c.id))} /> {c.name}
              </label>
            ))}
          </div>
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
          {note.trim() && <p className="mt-1 text-sm text-fg">“{note.trim()}”</p>}
          <p className="mt-2 flex items-center gap-1 text-xs text-muted"><UserRound className="size-3.5" aria-hidden /> {user.name}</p>
          {firstDue && !Number.isNaN(firstDue.getTime()) && <p className="mt-1 flex items-center gap-1 text-xs text-muted"><CalendarClock className="size-3.5" aria-hidden /> Hạn {fmtDue(firstDue)}</p>}
          {pick && <p className="mt-2 text-xs text-muted">{pick.auto ? "Làm xong là có kết quả ngay, thầy cô không cần chấm." : "Nộp bài để thầy cô chấm theo tiêu chí."}{tutor ? "" : " Không dùng AI Gia sư."}</p>}
        </div>
        <Button className="w-full" onClick={submit} disabled={!pick || !chosen.length}><Send /> Giao cho {chosen.length || ""} lớp</Button>
      </aside>
    </div>
  );
}
