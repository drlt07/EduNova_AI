"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Copy, Pencil, Plus, RefreshCw, Trash2, UserMinus, UserPlus, Users } from "lucide-react";
import { toast } from "sonner";
import { TEXTBOOKS } from "@/lib/data/curriculum";
import { classSchema, type ClassForm } from "@/lib/validation/schemas";
import { classStudents, teacherClasses } from "@/lib/store/scoped";
import { useSessionData } from "@/lib/store/use-role";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/feedback";
import { Field, Input, Select } from "@/components/ui/form";
import { Avatar, PageHeader } from "@/components/ui/misc";
import { cn } from "@/lib/utils";

export default function ClassesPage() {
  const { d, user } = useSessionData();
  const classes = teacherClasses(d, user.id);
  const [selectedId, setSelectedId] = useState(classes[0]?.id ?? "");
  const [dialog, setDialog] = useState<"create" | "edit" | "student" | "delete" | null>(null);
  const [studentName, setStudentName] = useState("");
  const selected = classes.find((c) => c.id === selectedId) ?? classes[0];

  const roster = (() => {
    if (!selected) return [];
    const asg = d.assignments.filter((a) => a.classId === selected.id);
    return classStudents(d, selected.id).map((s) => {
      const subs = d.submissions.filter((x) => x.studentId === s.id && asg.some((a) => a.id === x.assignmentId));
      const attempts = d.attempts.filter((a) => a.studentId === s.id && asg.some((x) => x.id === a.assignmentId));
      const last = [...attempts.map((a) => a.updatedAt), ...subs.map((x) => x.submittedAt)].sort().pop();
      const missing = asg.filter((a) => a.status === "open" && !subs.some((x) => x.assignmentId === a.id)).length;
      return { s, submitted: subs.length, total: asg.length, last, missing, inProgress: attempts.some((a) => a.status !== "submitted"), enrollment: d.enrollments.find((e) => e.classId === selected.id && e.studentId === s.id)! };
    });
  })();

  const form = useForm<ClassForm>({ resolver: zodResolver(classSchema), defaultValues: { name: "", grade: 10, textbookId: "kntt", pathway: "chung", schoolYear: "2026–2027" } });
  const submitClass = form.handleSubmit((v) => {
    if (dialog === "edit" && selected) {
      d.updateClass(selected.id, v);
      toast.success("Đã cập nhật lớp");
    } else {
      if (d.classes.some((c) => c.teacherId === user.id && c.name.toLowerCase() === v.name.toLowerCase())) return form.setError("name", { message: "Bạn đã có lớp trùng tên" });
      const id = d.createClass({ ...v, teacherId: user.id, schedule: [] });
      setSelectedId(id);
      toast.success(`Đã tạo lớp ${v.name}`);
    }
    setDialog(null);
  });

  return (
    <>
      <PageHeader title="Lớp học" description="Quản lý lớp, mã mời, danh sách học sinh và trạng thái học tập. Bạn chỉ thấy lớp mình phụ trách." actions={<Button onClick={() => { form.reset({ name: "", grade: 10, textbookId: "kntt", pathway: "chung", schoolYear: "2026–2027" }); setDialog("create"); }}><Plus /> Lớp mới</Button>} />
      {classes.length === 0 ? <EmptyState icon={Users} title="Chưa có lớp nào" /> : (
        <div className="grid gap-6 xl:grid-cols-[300px_minmax(0,1fr)]">
          <ul className="space-y-2" aria-label="Danh sách lớp">
            {classes.map((c) => (
              <li key={c.id}>
                <button type="button" aria-pressed={selected?.id === c.id} onClick={() => setSelectedId(c.id)} className={cn("w-full rounded-2xl border p-4 text-left transition-colors", selected?.id === c.id ? "border-cyan/60 bg-cyan/10" : "border-line bg-surface hover:border-cyan/30")}>
                  <span className="flex items-center justify-between"><span className="text-lg font-bold text-fg">{c.name}</span><Badge tone="blue">Tin {c.grade}</Badge></span>
                  <span className="mt-1 block text-xs text-muted">{d.enrollments.filter((e) => e.classId === c.id).length} học sinh · {d.assignments.filter((a) => a.classId === c.id).length} nhiệm vụ</span>
                </button>
              </li>
            ))}
          </ul>
          {selected && (
            <div className="space-y-5">
              <Card>
                <CardContent className="flex flex-col gap-4 pt-5 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-fg">Lớp {selected.name}</h2>
                    <p className="text-sm text-muted">{TEXTBOOKS.find((t) => t.id === selected.textbookId)?.name} · {selected.pathway === "chung" ? "Nội dung chung" : selected.pathway} · {selected.schoolYear}</p>
                    <p className="mt-1 text-xs text-muted">Lịch: {selected.schedule.map((s) => `T${s.weekday + 1} ${s.period}`).join(", ") || "chưa có"}</p>
                  </div>
                  <div className="flex flex-col items-start gap-2 md:items-end">
                    <div className="flex items-center gap-2 rounded-xl border border-line bg-surface-2 px-3 py-2">
                      <span className="text-xs text-muted">Mã mời</span>
                      <code className="font-mono font-semibold text-cyan-fg">{selected.inviteCode}</code>
                      <Button size="icon" variant="ghost" aria-label="Sao chép mã mời" onClick={async () => { try { await navigator.clipboard.writeText(selected.inviteCode); toast.success("Đã sao chép"); } catch { toast.error("Trình duyệt chặn clipboard"); } }}><Copy /></Button>
                      <Button size="icon" variant="ghost" aria-label="Tạo mã mới" onClick={() => { d.regenerateInvite(selected.id); toast.success("Đã tạo mã mới — mã cũ hết hiệu lực"); }}><RefreshCw /></Button>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="secondary" onClick={() => { form.reset({ name: selected.name, grade: selected.grade, textbookId: selected.textbookId, pathway: selected.pathway, schoolYear: selected.schoolYear }); setDialog("edit"); }}><Pencil /> Sửa</Button>
                      <Button size="sm" variant="ghost" onClick={() => setDialog("delete")}><Trash2 /> Xóa</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex-row items-center justify-between">
                  <CardTitle as="h2">Danh sách học sinh ({roster.length})</CardTitle>
                  <Button size="sm" variant="secondary" onClick={() => { setStudentName(""); setDialog("student"); }}><UserPlus /> Thêm học sinh</Button>
                </CardHeader>
                <CardContent tabIndex={0} className="overflow-x-auto">
                  {roster.length === 0 ? <EmptyState title="Lớp chưa có học sinh" description="Chia sẻ mã mời hoặc thêm học sinh." /> : (
                    <table className="w-full min-w-[620px] text-left text-sm">
                      <caption className="sr-only">Trạng thái học sinh lớp {selected.name}</caption>
                      <thead className="text-xs text-muted"><tr><th className="pb-2 font-medium">Học sinh</th><th className="pb-2 font-medium">Đã nộp</th><th className="pb-2 font-medium">Trạng thái</th><th className="pb-2 font-medium">Hoạt động gần nhất</th><th className="pb-2"><span className="sr-only">Thao tác</span></th></tr></thead>
                      <tbody>
                        {roster.map((r) => (
                          <tr key={r.s.id} className="border-t border-line">
                            <td className="py-2.5"><span className="flex items-center gap-2"><Avatar user={r.s} size={28} /><span className="text-fg">{r.s.name}</span></span></td>
                            <td className="py-2.5 tabular-nums text-fg">{r.submitted}/{r.total}</td>
                            <td className="py-2.5">{r.missing > 0 ? (r.inProgress ? <Badge tone="cyan">Đang làm</Badge> : <Badge tone="warning">Chưa nộp {r.missing}</Badge>) : <Badge tone="success">Đủ bài</Badge>}</td>
                            <td className="py-2.5 text-muted">{r.last ? formatDate(r.last, true) : "—"}</td>
                            <td className="py-2.5 text-right"><Button size="icon" variant="ghost" aria-label={`Xóa ${r.s.name} khỏi lớp`} onClick={() => { d.removeEnrollment(r.enrollment.id); toast.success("Đã xóa khỏi lớp"); }}><UserMinus /></Button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                  <p className="mt-3 text-xs text-muted">Chỉ giáo viên phụ trách và học sinh trong lớp thấy dữ liệu của lớp này.</p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}

      <Dialog open={dialog === "create" || dialog === "edit"} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent title={dialog === "edit" ? "Sửa lớp" : "Tạo lớp mới"}>
          <form onSubmit={submitClass} noValidate className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Tên lớp" htmlFor="c-name" error={form.formState.errors.name?.message}><Input id="c-name" {...form.register("name")} aria-invalid={!!form.formState.errors.name} /></Field>
              <Field label="Khối" htmlFor="c-grade"><Select id="c-grade" {...form.register("grade", { setValueAs: Number })}>{[10, 11, 12].map((g) => <option key={g} value={g}>{g}</option>)}</Select></Field>
              <Field label="Bộ sách" htmlFor="c-book"><Select id="c-book" {...form.register("textbookId")}>{TEXTBOOKS.map((t) => <option key={t.id} value={t.id}>{t.short}</option>)}</Select></Field>
              <Field label="Định hướng" htmlFor="c-path"><Select id="c-path" {...form.register("pathway")}><option value="chung">Chung</option><option value="ICT">ICT</option><option value="CS">CS</option></Select></Field>
              <Field label="Năm học" htmlFor="c-year" error={form.formState.errors.schoolYear?.message} className="col-span-2"><Input id="c-year" {...form.register("schoolYear")} /></Field>
            </div>
            <Button type="submit" className="w-full">{dialog === "edit" ? "Lưu" : "Tạo lớp"}</Button>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={dialog === "student"} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent title="Thêm học sinh" description="Học sinh cũng có thể tự vào lớp bằng mã mời.">
          <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); if (studentName.trim().length < 2 || !selected) return toast.error("Nhập họ tên"); d.addStudentToClass(selected.id, studentName.trim()); setDialog(null); toast.success("Đã thêm học sinh"); }}>
            <Field label="Họ và tên" htmlFor="st-name"><Input id="st-name" value={studentName} onChange={(e) => setStudentName(e.target.value)} maxLength={60} /></Field>
            <Button type="submit" className="w-full">Thêm</Button>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={dialog === "delete"} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent title={`Xóa lớp ${selected?.name}?`} description="Chỉ xóa được lớp chưa có nhiệm vụ nào, để không mất bài làm của học sinh.">
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setDialog(null)}>Hủy</Button>
            <Button variant="danger" onClick={() => { if (!selected) return; if (d.deleteClass(selected.id)) { toast.success("Đã xóa lớp"); setSelectedId(""); } else toast.error("Lớp đã có nhiệm vụ — không thể xóa. Hãy đóng các nhiệm vụ thay vì xóa."); setDialog(null); }}>Xóa lớp</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
