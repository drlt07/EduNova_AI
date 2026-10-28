"use client";
import Link from "next/link";
import { Suspense, useState } from "react";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, CheckCircle2, Copy, FlaskConical, MonitorPlay, Pencil, RefreshCw, Send, Trash2, UserMinus, UserPlus, Users } from "lucide-react";
import { toast } from "sonner";
import { classNotes } from "@/lib/analytics/class-notes";
import { objectiveMastery } from "@/lib/analytics/compute";
import { TEXTBOOKS } from "@/lib/data/curriculum";
import { getLabBySlug } from "@/lib/data/labs";
import { bookEntry, bookLessons, bookOf, lessonSimSlugs } from "@/lib/sgk/book";
import { fmtScore, labSummary } from "@/lib/sim/lab-score";
import { classStudents, teacherClasses } from "@/lib/store/scoped";
import { useSessionData } from "@/lib/store/use-role";
import { CELL_LABEL, cellStatus, refForObjective, studentProfile, teachingProgress, type CellStatus } from "@/lib/teacher/class-view";
import { nextLesson } from "@/lib/teacher/today";
import { cn, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { EmptyState, PageSkeleton } from "@/components/ui/feedback";
import { Field, Input } from "@/components/ui/form";
import { Avatar } from "@/components/ui/misc";
import { BookCover } from "@/components/sgk/book-cover";
import { lessonAssignables } from "@/components/sgk/reader";
import { AssignDialog, type AssignPreset } from "@/components/teacher/assign-dialog";
import { ClassFormDialog } from "@/components/teacher/class-form-dialog";
import { ClassInsights } from "@/components/teacher/dashboard-panels";

const TABS = [["tong-quan", "Tổng quan"], ["bai-hoc", "Bài học"], ["nhiem-vu", "Nhiệm vụ"], ["hoc-sinh", "Học sinh"], ["ket-qua", "Kết quả"]] as const;
type Tab = (typeof TABS)[number][0];
const CELL_STYLE: Record<CellStatus, string> = {
  "not-joined": "bg-surface-2 text-muted",
  "not-assigned": "text-muted/60",
  done: "bg-success/15 text-success-fg",
  working: "bg-cyan/15 text-cyan-fg",
  late: "bg-danger/15 text-danger-fg",
  todo: "bg-warning/15 text-warning-fg",
};
const CELL_SHORT: Record<CellStatus, string> = { "not-joined": "chưa vào lớp", "not-assigned": "—", done: "xong", working: "đang làm", late: "quá hạn", todo: "chưa nộp" };

interface AssignState { preset?: AssignPreset; ref?: string; suggest?: AssignPreset[]; studentIds?: string[]; title?: string }

function ClassDetail() {
  const { id } = useParams<{ id: string }>();
  const { d, user } = useSessionData();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const tab = (TABS.find(([t]) => t === params.get("tab"))?.[0] ?? "tong-quan") as Tab;
  const [dialog, setDialog] = useState<"edit" | "student" | "delete" | null>(null);
  const [name, setName] = useState("");
  const [assign, setAssign] = useState<AssignState | null>(null);
  const [studentId, setStudentId] = useState<string | null>(null);
  const cls = teacherClasses(d, user.id).find((c) => c.id === id);
  if (!cls) return <EmptyState icon={Users} title="Không tìm thấy lớp" description="Lớp không tồn tại hoặc không do thầy cô phụ trách." action={<Button asChild><Link href="/teacher/classes">Về danh sách lớp</Link></Button>} />;

  const students = classStudents(d, cls.id);
  const asg = d.assignments.filter((a) => a.classId === cls.id && a.status !== "draft").sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  const progress = teachingProgress(d, user.id, cls);
  const next = nextLesson(d, user.id, cls);
  const notes = classNotes(d, user.id).filter((n) => n.className === cls.name);
  const go = (t: Tab) => router.replace(`${pathname}?tab=${t}`, { scroll: false });
  const assignFromLesson = (ref: string, studentIds?: string[]) => { const e = bookEntry(ref); if (e) setAssign({ ref, suggest: lessonAssignables(d, user.id, e), studentIds, title: studentIds ? "Giao bài củng cố" : undefined }); };

  return (
    <>
      <nav aria-label="Chuyển lớp" className="mb-4 flex flex-wrap items-center gap-2">
        <Link href="/teacher/classes" className="mr-1 inline-flex items-center gap-1 text-sm font-medium text-muted hover:text-fg"><ArrowLeft className="size-4" aria-hidden /> Lớp học của tôi</Link>
        {teacherClasses(d, user.id).map((c) => (
          <Link key={c.id} href={`/teacher/classes/${c.id}${tab === "tong-quan" ? "" : `?tab=${tab}`}`} aria-current={c.id === cls.id ? "page" : undefined} className={cn("inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-sm font-semibold transition-colors", c.id === cls.id ? "border-brand bg-brand text-brand-ink" : "border-line bg-surface text-fg hover:border-cyan/40")}>
            {c.name}<span className={cn("rounded-full px-1.5 text-xs tabular-nums", c.id === cls.id ? "bg-white/20" : "bg-surface-2 text-muted")}>{classStudents(d, c.id).length}</span>
          </Link>
        ))}
      </nav>
      <header className="mb-5 flex flex-wrap items-start gap-4">
        <BookCover grade={cls.grade} className="h-24 w-auto shrink-0" />
        <div className="min-w-0 flex-1">
          <h1 className="text-3xl font-bold tracking-tight text-fg">Lớp {cls.name}</h1>
          <p className="text-muted">{bookOf(cls.grade).title} · {TEXTBOOKS.find((t) => t.id === cls.textbookId)?.name} · {cls.pathway === "chung" ? "nội dung chung" : cls.pathway} · {cls.schoolYear}</p>
          <p className="text-sm text-muted">{students.length} học sinh · lịch {cls.schedule.map((s) => `${["", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"][s.weekday]} ${s.period.toLowerCase()} (${s.room})`).join(", ") || "chưa có"}</p>
        </div>
        <div className="flex flex-col items-start gap-2 sm:items-end">
          <div className="flex items-center gap-1 rounded-xl border border-line bg-surface px-3 py-1.5">
            <span className="text-xs text-muted">Mã mời</span>
            <code className="font-mono text-sm font-semibold text-cyan-fg">{cls.inviteCode}</code>
            <Button size="icon" variant="ghost" aria-label="Sao chép mã mời" onClick={async () => { try { await navigator.clipboard.writeText(cls.inviteCode); toast.success("Đã sao chép mã mời"); } catch { toast.error("Trình duyệt chặn sao chép"); } }}><Copy /></Button>
            <Button size="icon" variant="ghost" aria-label="Tạo mã mới" onClick={() => { d.regenerateInvite(cls.id); toast.success("Đã tạo mã mới, mã cũ hết hiệu lực"); }}><RefreshCw /></Button>
          </div>
          <div className="flex gap-1.5">
            <Button size="sm" onClick={() => setAssign({})}><Send /> Giao nhiệm vụ</Button>
            <Button size="sm" variant="secondary" onClick={() => setDialog("edit")}><Pencil /> Sửa lớp</Button>
            <Button size="icon" variant="ghost" aria-label="Xóa lớp" onClick={() => setDialog("delete")}><Trash2 /></Button>
          </div>
        </div>
      </header>

      <nav className="mb-5 overflow-x-auto border-b border-line" aria-label="Mục của lớp">
        <ul className="flex w-max gap-1">
          {TABS.map(([t, label]) => (
            <li key={t}><button type="button" aria-current={tab === t ? "page" : undefined} onClick={() => go(t)} className={cn("border-b-2 px-3 py-2 text-sm font-medium", tab === t ? "border-fg text-fg" : "border-transparent text-muted hover:text-fg")}>{label}{t === "nhiem-vu" && asg.length ? <span className="ml-1 text-xs text-muted">{asg.length}</span> : null}</button></li>
          ))}
        </ul>
      </nav>

      {tab === "tong-quan" && (
        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="min-w-0 space-y-6">
            <section className="rounded-2xl border border-line bg-surface p-5">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Bài dạy tiếp</h2>
              {next ? (
                <>
                  <p className="mt-1 text-xl font-bold text-fg">Bài {next.lesson.no}. {next.lesson.title}</p>
                  <p className="text-sm text-muted">Chủ đề {next.topic.no}. {next.topic.title}{next.content ? ` · ${next.content.periods} tiết` : " · chưa có nội dung số"}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button asChild size="sm"><Link href={`/teacher/sgk/${next.ref}`}><MonitorPlay /> Mở bài, trình chiếu</Link></Button>
                    <Button size="sm" variant="secondary" onClick={() => assignFromLesson(next.ref)}><Send /> Giao nhiệm vụ của bài</Button>
                    <Button size="sm" variant="ghost" onClick={() => { d.toggleTaught(user.id, cls.id, next.ref); toast.success(`Đã đánh dấu dạy xong Bài ${next.lesson.no}`); }}><CheckCircle2 /> Đánh dấu đã dạy</Button>
                  </div>
                </>
              ) : <p className="mt-1 text-fg">Lớp đã học hết sách.</p>}
            </section>
            <section className="rounded-2xl border border-line bg-surface p-5">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Tiến độ theo chủ đề · {progress.taught}/{progress.total} bài</h2>
              <ul className="mt-3 space-y-2.5">
                {progress.topics.map((t) => (
                  <li key={t.topic.no}>
                    <div className="mb-1 flex justify-between gap-2 text-sm"><span className="min-w-0 truncate text-fg">Chủ đề {t.topic.no}. {t.topic.title}</span><span className="shrink-0 tabular-nums text-muted">{t.taught}/{t.total}</span></div>
                    <div className="h-1.5 rounded-full bg-surface-2"><div className="h-full rounded-full bg-cyan" style={{ width: `${(t.taught / t.total) * 100}%` }} /></div>
                  </li>
                ))}
              </ul>
            </section>
          </div>
          <ClassInsights notes={notes} onRemedy={(objectiveId) => { const ref = refForObjective(objectiveId); if (ref) assignFromLesson(ref); else setAssign({}); }} />
        </div>
      )}

      {tab === "bai-hoc" && (
        <div className="space-y-6">
          {[...new Map(bookLessons(cls.grade).map((e) => [e.topic.no, e.topic])).values()].map((t) => (
            <section key={t.no}>
              <h2 className="border-b-2 border-fg pb-1 font-bold text-fg">Chủ đề {t.no}. {t.title}</h2>
              <ul className="divide-y divide-line">
                {bookLessons(cls.grade).filter((e) => e.topic.no === t.no).map((e) => {
                  const taught = d.taughtLessons.find((x) => x.teacherId === user.id && x.classId === cls.id && x.ref === e.ref);
                  const items = lessonAssignables(d, user.id, e);
                  const given = asg.filter((a) => a.sgkRef === e.ref || (a.task && items.some((i) => i.kind === a.task!.kind && i.ref === a.task!.ref)));
                  return (
                    <li key={e.ref} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5">
                      <label className="flex items-center gap-2" title="Đánh dấu đã dạy">
                        <input type="checkbox" checked={!!taught} onChange={() => d.toggleTaught(user.id, cls.id, e.ref)} aria-label={`Đã dạy Bài ${e.lesson.no}`} />
                        <span className="w-12 text-sm font-semibold tabular-nums text-muted">Bài {e.lesson.no}</span>
                      </label>
                      <Link href={`/teacher/sgk/${e.ref}`} className={cn("min-w-0 flex-1 basis-48 font-medium hover:text-cyan-fg", e.content ? "text-fg" : "text-fg/60")}>{e.lesson.title}</Link>
                      <span className="flex flex-wrap items-center gap-2 text-xs text-muted">
                        {taught && <span className="text-success-fg">dạy {formatDate(taught.at)}</span>}
                        {lessonSimSlugs(e).length > 0 && <span className="inline-flex items-center gap-1"><FlaskConical className="size-3.5" aria-hidden /> {lessonSimSlugs(e).length}</span>}
                        {given.length > 0 && <span className="rounded bg-cyan/15 px-1.5 font-semibold text-cyan-fg">{given.length} nhiệm vụ</span>}
                      </span>
                      {items.length > 0 && <Button size="sm" variant="ghost" onClick={() => assignFromLesson(e.ref)}><Send /> Giao</Button>}
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}

      {tab === "nhiem-vu" && (
        asg.length === 0 ? <EmptyState icon={Send} title="Lớp chưa có nhiệm vụ" action={<Button onClick={() => setAssign({})}><Send /> Giao nhiệm vụ</Button>} /> : (
          <ul className="divide-y divide-line rounded-2xl border border-line bg-surface">
            {asg.map((a) => {
              const cells = students.map((u) => cellStatus(d, a, u.id).status);
              const target = cells.filter((s) => s !== "not-assigned" && s !== "not-joined").length;
              const done = cells.filter((s) => s === "done").length;
              const late = cells.filter((s) => s === "late").length;
              const e = a.sgkRef ? bookEntry(a.sgkRef) : undefined;
              return (
                <li key={a.id} className="flex flex-wrap items-center gap-3 p-4">
                  <div className="min-w-0 flex-1 basis-64">
                    <p className="font-semibold text-fg">{a.title}</p>
                    <p className="text-xs text-muted">{a.task ? { lab: "Mô phỏng", quiz: "Bộ câu hỏi", code: "Bài code" }[a.task.kind] + " · máy chấm" : "Chấm theo tiêu chí"}{e ? ` · Bài ${e.lesson.no}` : ""}{a.studentIds ? ` · giao riêng ${a.studentIds.length} em` : ""} · hạn {formatDate(a.dueAt, true)}{a.status === "closed" ? " · đã đóng" : ""}</p>
                  </div>
                  <div className="w-48">
                    <div className="mb-1 flex justify-between text-xs"><span className="text-fg"><b>{done}</b>/{target} xong</span>{late > 0 && <span className="text-danger-fg">{late} quá hạn</span>}</div>
                    <div className="h-1.5 rounded-full bg-surface-2"><div className="h-full rounded-full bg-success" style={{ width: `${(done / Math.max(1, target)) * 100}%` }} /></div>
                  </div>
                  <Button asChild size="sm" variant="ghost"><Link href={a.task ? "/teacher/assignments" : `/teacher/assessment?assignment=${a.id}`}>{a.task ? "Kết quả" : "Chấm bài"}</Link></Button>
                </li>
              );
            })}
          </ul>
        )
      )}

      {tab === "hoc-sinh" && (
        <section>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <ul className="flex flex-wrap gap-2 text-xs" aria-label="Chú thích">
              {(["done", "working", "todo", "late", "not-joined", "not-assigned"] as CellStatus[]).map((s) => <li key={s} className={cn("rounded px-1.5 py-0.5", CELL_STYLE[s])}>{CELL_LABEL[s]}</li>)}
            </ul>
            <Button size="sm" variant="secondary" onClick={() => { setName(""); setDialog("student"); }}><UserPlus /> Thêm học sinh</Button>
          </div>
          {students.length === 0 ? <EmptyState title="Lớp chưa có học sinh" description="Chia sẻ mã mời hoặc thêm học sinh." /> : (
            <div className="overflow-x-auto rounded-2xl border border-line bg-surface" tabIndex={0}>
              <table className="w-full min-w-[640px] text-left text-sm">
                <caption className="sr-only">Tình trạng từng học sinh lớp {cls.name} với từng nhiệm vụ</caption>
                <thead className="text-xs text-muted">
                  <tr><th className="sticky left-0 bg-surface px-3 py-2 font-medium">Học sinh</th>{asg.map((a) => <th key={a.id} className="max-w-[120px] px-2 py-2 font-medium" title={a.title}><span className="line-clamp-2">{a.title}</span></th>)}<th className="px-2 py-2"><span className="sr-only">Thao tác</span></th></tr>
                </thead>
                <tbody>
                  {students.map((u) => {
                    const en = d.enrollments.find((e) => e.classId === cls.id && e.studentId === u.id)!;
                    return (
                      <tr key={u.id} className="border-t border-line">
                        <td className="sticky left-0 bg-surface px-3 py-2"><button type="button" onClick={() => setStudentId(u.id)} className="flex items-center gap-2 text-left hover:text-cyan-fg"><Avatar user={u} size={26} /><span className="font-medium text-fg">{u.name}</span>{en.status === "invited" && <span className="text-xs text-muted">(chưa vào lớp)</span>}</button></td>
                        {asg.map((a) => { const c = cellStatus(d, a, u.id); return <td key={a.id} className="px-2 py-2"><span className={cn("inline-block rounded px-1.5 py-0.5 text-xs font-medium", CELL_STYLE[c.status])} title={CELL_LABEL[c.status]}>{c.text ?? CELL_SHORT[c.status]}</span></td>; })}
                        <td className="px-2 py-2 text-right"><Button size="icon" variant="ghost" aria-label={`Xóa ${u.name} khỏi lớp`} onClick={() => { if (window.confirm(`Xóa ${u.name} khỏi lớp ${cls.name}?`)) { d.removeEnrollment(en.id); toast.success("Đã xóa khỏi lớp"); } }}><UserMinus /></Button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <p className="mt-2 text-xs text-muted">Bấm tên một em để xem lịch sử học tập và những điều cần củng cố.</p>
        </section>
      )}

      {tab === "ket-qua" && (
        <div className="grid items-start gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-line bg-surface p-5">
            <h2 className="font-bold text-fg">Mức đạt theo yêu cầu cần đạt</h2>
            <p className="text-xs text-muted">Từ các bài đã chấm chính thức của lớp (điểm đạt / điểm tối đa theo tiêu chí).</p>
            {objectiveMastery(d, user.id, { classId: cls.id }).length === 0 ? <p className="mt-3 text-sm text-muted">Chưa có bài chấm chính thức.</p> : (
              <ul className="mt-3 space-y-3">
                {objectiveMastery(d, user.id, { classId: cls.id }).map((m) => (
                  <li key={m.objectiveId}>
                    <div className="mb-1 flex justify-between gap-3 text-sm"><span className="text-fg">{m.description}</span><span className={cn("shrink-0 font-semibold tabular-nums", m.mastery < 70 ? "text-warning-fg" : "text-success-fg")}>{m.mastery}%</span></div>
                    <div className="h-1.5 rounded-full bg-surface-2"><div className={cn("h-full rounded-full", m.mastery < 70 ? "bg-warning" : "bg-success")} style={{ width: `${m.mastery}%` }} /></div>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section className="rounded-2xl border border-line bg-surface p-5">
            <h2 className="font-bold text-fg">Mô phỏng</h2>
            <p className="text-xs text-muted">Điểm cao nhất của mỗi em, trung bình theo lớp.</p>
            {(() => {
              const slugs = [...new Set(d.labResults.filter((r) => students.some((u) => u.id === r.studentId)).map((r) => r.labSlug))];
              if (!slugs.length) return <p className="mt-3 text-sm text-muted">Chưa em nào làm mô phỏng có chấm điểm.</p>;
              return (
                <ul className="mt-3 divide-y divide-line text-sm">
                  {slugs.map((slug) => { const s = labSummary(d.labResults, students.map((u) => u.id), slug); return <li key={slug} className="flex justify-between gap-3 py-2"><span className="text-fg">{getLabBySlug(slug)?.title}</span><span className="text-muted">{s.done}/{students.length} em · TB <b className="text-fg">{fmtScore(s.avg)}</b></span></li>; })}
                </ul>
              );
            })()}
            <Link href={`/teacher/analytics?class=${cls.id}`} className="mt-4 inline-block text-sm font-semibold text-cyan-fg hover:underline">Báo cáo chi tiết của lớp →</Link>
          </section>
        </div>
      )}

      <StudentSheet classId={cls.id} studentId={studentId} onClose={() => setStudentId(null)} onRemedy={(ref, sid) => { setStudentId(null); assignFromLesson(ref, [sid]); }} />
      <AssignDialog open={!!assign} onOpenChange={(o) => !o && setAssign(null)} classId={cls.id} preset={assign?.preset} sgkRef={assign?.ref} suggest={assign?.suggest} studentIds={assign?.studentIds} title={assign?.title} />
      <ClassFormDialog open={dialog === "edit"} onOpenChange={(o) => !o && setDialog(null)} editing={cls} />
      <Dialog open={dialog === "student"} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent title="Thêm học sinh" description="Em sẽ ở trạng thái “chưa vào lớp” cho đến khi đăng nhập. Học sinh cũng có thể tự vào lớp bằng mã mời.">
          <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); if (name.trim().length < 2) return toast.error("Nhập họ tên"); d.addStudentToClass(cls.id, name.trim()); setDialog(null); toast.success("Đã thêm học sinh"); }}>
            <Field label="Họ tên" htmlFor="st-name"><Input id="st-name" value={name} onChange={(e) => setName(e.target.value)} autoFocus /></Field>
            <Button type="submit" className="w-full">Thêm</Button>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={dialog === "delete"} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent title={`Xóa lớp ${cls.name}?`} description="Chỉ xóa được lớp chưa có nhiệm vụ nào, để không mất bài làm của học sinh.">
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setDialog(null)}>Hủy</Button>
            <Button variant="danger" onClick={() => { if (d.deleteClass(cls.id)) { toast.success("Đã xóa lớp"); router.push("/teacher/classes"); } else toast.error("Lớp đã có nhiệm vụ, không thể xóa. Hãy đóng các nhiệm vụ thay vì xóa."); setDialog(null); }}>Xóa lớp</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

/** Hồ sơ một em: nhiệm vụ, điểm mô phỏng, bài đã đọc, điều cần củng cố kèm nút giao bài củng cố riêng. */
function StudentSheet({ classId, studentId, onClose, onRemedy }: { classId: string; studentId: string | null; onClose: () => void; onRemedy: (ref: string, studentId: string) => void }) {
  const { d } = useSessionData();
  const u = studentId ? d.users.find((x) => x.id === studentId) : undefined;
  const p = u ? studentProfile(d, u.id, classId) : undefined;
  return (
    <Dialog open={!!u} onOpenChange={(o) => !o && onClose()}>
      {u && p && (
        <DialogContent title={u.name} description={`${p.done} nhiệm vụ đã xong · ${p.open} còn mở · đã mở ${p.read.length} bài SGK`} className="max-w-2xl">
          <div className="space-y-5">
            <section>
              <h3 className="mb-2 text-sm font-semibold text-fg">Cần củng cố</h3>
              {p.weak.length === 0 ? <p className="text-sm text-muted">Chưa thấy điểm yếu rõ ràng từ bài nộp và mô phỏng.</p> : (
                <ul className="space-y-2">
                  {p.weak.map((w) => (
                    <li key={w.label} className="flex flex-wrap items-center gap-2 rounded-xl border border-warning/40 bg-warning/5 px-3 py-2 text-sm">
                      <span className="min-w-0 flex-1"><span className="font-medium text-fg">{w.label}</span> <span className="text-muted">· {w.why}</span></span>
                      {w.ref && <Button size="sm" variant="secondary" onClick={() => onRemedy(w.ref!, u.id)}><Send /> Giao bài củng cố riêng</Button>}
                    </li>
                  ))}
                </ul>
              )}
            </section>
            <section>
              <h3 className="mb-2 text-sm font-semibold text-fg">Nhiệm vụ</h3>
              <ul className="divide-y divide-line text-sm">
                {p.tasks.map((t) => <li key={t.a.id} className="flex justify-between gap-3 py-1.5"><span className="min-w-0 truncate text-fg">{t.a.title}</span><span className={cn("shrink-0 rounded px-1.5 text-xs font-medium", CELL_STYLE[t.status])}>{t.text ?? CELL_LABEL[t.status]}</span></li>)}
              </ul>
            </section>
            {p.labs.length > 0 && (
              <section>
                <h3 className="mb-2 text-sm font-semibold text-fg">Lịch sử làm mô phỏng</h3>
                <ul className="divide-y divide-line text-sm">{p.labs.slice(0, 8).map((r) => <li key={r.id} className="flex justify-between gap-3 py-1.5"><span className="text-fg">{getLabBySlug(r.labSlug)?.title}</span><span className="text-muted">{fmtScore(r.score)} điểm · {r.mistakes} lần sai · {formatDate(r.finishedAt, true)}</span></li>)}</ul>
              </section>
            )}
          </div>
        </DialogContent>
      )}
    </Dialog>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <ClassDetail />
    </Suspense>
  );
}
