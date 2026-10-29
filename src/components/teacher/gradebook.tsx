"use client";
/**
 * Sổ điểm: sổ điểm của một lớp — mỗi hàng một em, mỗi cột một bài đã giao (thuộc khóa học hoặc độc lập).
 * Điểm quy về thang 10; ô trống ghi rõ "chưa nộp", "chờ chấm" hay "còn hạn" để không nhầm với điểm 0.
 */
import Link from "next/link";
import { useMemo, useState } from "react";
import { AlertTriangle, BookMarked, Download, Users } from "lucide-react";
import { assignedStudents, classStudents, teacherAssignments, teacherClasses } from "@/lib/store/scoped";
import { useSessionData } from "@/lib/store/use-role";
import { assignmentCourse, gradeCell, type GradeCell } from "@/lib/teacher/assign";
import { fmtScore } from "@/lib/sim/lab-score";
import { cn, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/feedback";
import { Select } from "@/components/ui/form";

type Source = "" | "course" | "free";
const ten = (r: number) => Math.round(r * 20) / 2;
const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

function Cell({ c }: { c?: GradeCell }) {
  if (!c) return <span className="text-muted">·</span>;
  if (c.status === "graded" && c.ratio !== undefined) {
    const s = ten(c.ratio);
    return <span title={c.text} className={cn("inline-block min-w-10 rounded-md px-1.5 py-0.5 font-semibold tabular-nums", s >= 8 ? "bg-success/15 text-success-fg" : s >= 5 ? "bg-warning/15 text-warning-fg" : "bg-danger/15 text-danger-fg")}>{fmtScore(s)}</span>;
  }
  if (c.status === "pending" || c.status === "late") return <span className="text-xs font-medium text-violet-fg">chờ chấm</span>;
  if (c.status === "missing") return <span className="text-xs font-medium text-danger-fg">chưa nộp</span>;
  return <span className="text-xs text-muted">còn hạn</span>;
}

/** Sổ điểm một lớp; `courseId` để chỉ lấy bài thuộc một khóa học (tab Kết quả trong khóa học). */
export function Gradebook({ courseId, classIds }: { courseId?: string; classIds?: string[] }) {
  const { d, user } = useSessionData();
  const classes = teacherClasses(d, user.id).filter((c) => !classIds || classIds.includes(c.id));
  const [classId, setClassId] = useState(classes[0]?.id ?? "");
  const [source, setSource] = useState<Source>("");
  const [now] = useState(() => Date.now());
  const klass = classes.find((c) => c.id === classId);

  const { cols, rows } = useMemo(() => {
    const cols = teacherAssignments(d, user.id)
      .filter((a) => a.classId === classId && a.status !== "draft")
      .map((a) => ({ a, src: assignmentCourse(d, a) }))
      .filter((x) => (courseId ? x.src?.course.id === courseId : !source || (source === "course") === !!x.src))
      .sort((x, y) => x.a.dueAt.localeCompare(y.a.dueAt));
    const rows = classStudents(d, classId).map((u) => {
      const cells = new Map(cols.map(({ a }) => [a.id, assignedStudents(d, a).some((s) => s.id === u.id) ? gradeCell(d, u.id, a, now) : undefined]));
      const scores = [...cells.values()].flatMap((c) => (c?.status === "graded" && c.ratio !== undefined ? [ten(c.ratio)] : []));
      const missing = [...cells.values()].filter((c) => c?.status === "missing").length;
      return { u, cells, mean: avg(scores), missing };
    });
    return { cols, rows };
  }, [d, user.id, classId, source, now, courseId]);

  const colStats = cols.map(({ a }) => {
    const cs = rows.map((r) => r.cells.get(a.id)).filter((c): c is GradeCell => !!c);
    const graded = cs.flatMap((c) => (c.status === "graded" && c.ratio !== undefined ? [ten(c.ratio)] : []));
    return { id: a.id, mean: avg(graded), handed: cs.filter((c) => c.status !== "missing" && c.status !== "open").length, total: cs.length, due: cs.filter((c) => c.status !== "open").length };
  });
  const all = rows.flatMap((r) => (r.mean !== null ? [r.mean] : []));
  const classMean = avg(all);
  const handed = colStats.reduce((n, c) => n + c.handed, 0);
  const total = colStats.reduce((n, c) => n + c.due, 0);
  const atRisk = rows.filter((r) => (r.mean !== null && r.mean < 5) || r.missing >= 2);

  function exportCsv() {
    const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const head = ["Học sinh", ...cols.map(({ a }) => a.title), "Điểm TB"].map(esc).join(",");
    const body = rows.map((r) => [r.u.name, ...cols.map(({ a }) => { const c = r.cells.get(a.id); return c?.status === "graded" && c.ratio !== undefined ? fmtScore(ten(c.ratio)) : c?.status === "missing" ? "chưa nộp" : c?.status === "pending" || c?.status === "late" ? "chờ chấm" : ""; }), r.mean !== null ? fmtScore(Math.round(r.mean * 10) / 10) : ""].map((v) => esc(String(v))).join(","));
    const blob = new Blob(["﻿" + [head, ...body].join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `so-diem-${klass?.name ?? "lop"}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex gap-1 rounded-xl border border-line bg-surface p-1" role="radiogroup" aria-label="Lớp">
          {classes.map((c) => <button key={c.id} type="button" role="radio" aria-checked={classId === c.id} onClick={() => setClassId(c.id)} className={cn("rounded-lg px-3 py-1.5 text-sm font-semibold", classId === c.id ? "bg-fg text-bg" : "text-muted hover:text-fg")}>{c.name}</button>)}
        </div>
        {!courseId && (
          <Select aria-label="Nguồn bài" className="w-44" value={source} onChange={(e) => setSource(e.target.value as Source)}>
            <option value="">Mọi nguồn</option>
            <option value="course">Thuộc khóa học</option>
            <option value="free">Giao độc lập</option>
          </Select>
        )}
        <Button variant="secondary" size="sm" className="ml-auto" onClick={exportCsv} disabled={!rows.length || !cols.length}><Download /> Xuất CSV</Button>
      </div>

      <p className="mb-3 text-sm text-muted">
        Điểm TB lớp <b className="text-fg">{classMean !== null ? fmtScore(Math.round(classMean * 10) / 10) : "–"}</b> · nộp bài <b className="text-fg">{total ? `${Math.round((handed / total) * 100)}%` : "–"}</b> · {cols.length} bài
        {atRisk.length > 0 && <> · <span className="font-semibold text-danger-fg">cần hỗ trợ: {atRisk.map((r) => r.u.name.split(" ").pop()).join(", ")}</span></>}
      </p>

      {!klass ? <EmptyState icon={Users} title="Chưa có lớp" /> : cols.length === 0 ? (
        <EmptyState icon={BookMarked} title={`Lớp ${klass.name} chưa có bài nào để chấm điểm`} description="Giao bài từ khóa học hoặc từ ngân hàng bài tập; kết quả sẽ hiện ở đây." action={<Button size="sm" asChild><Link href="/teacher/bank">Mở ngân hàng bài tập</Link></Button>} />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
          <table className="w-full min-w-max border-collapse text-sm">
            <caption className="sr-only">Sổ điểm lớp {klass.name}</caption>
            <thead>
              <tr className="border-b border-line text-left align-bottom">
                <th scope="col" className="sticky left-0 z-10 bg-surface px-3 py-2 font-semibold text-fg">Học sinh</th>
                {cols.map(({ a, src }) => (
                  <th key={a.id} scope="col" className="w-28 px-2 py-2 text-center font-medium">
                    <span className={cn("mb-1 inline-block rounded px-1.5 text-[10px] font-semibold uppercase", src ? "bg-cyan/15 text-cyan-fg" : "bg-surface-2 text-muted")}>{src ? "Khóa học" : "Độc lập"}</span>
                    <span className="line-clamp-2 block text-xs text-fg" title={a.title}>{a.title}</span>
                    <span className="block text-[11px] font-normal text-muted">hạn {formatDate(a.dueAt)}</span>
                  </th>
                ))}
                <th scope="col" className="px-3 py-2 text-center font-semibold text-fg">TB</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.u.id} className="border-b border-line/60 hover:bg-surface-2/50">
                  <th scope="row" className="sticky left-0 z-10 bg-surface px-3 py-2 text-left font-medium text-fg">
                    <span className="flex items-center gap-1.5">{r.u.name}{(r.mean !== null && r.mean < 5) || r.missing >= 2 ? <AlertTriangle className="size-3.5 text-danger-fg" aria-label="Cần hỗ trợ" /> : null}</span>
                  </th>
                  {cols.map(({ a }) => <td key={a.id} className="px-2 py-2 text-center"><Cell c={r.cells.get(a.id)} /></td>)}
                  <td className="px-3 py-2 text-center font-bold tabular-nums text-fg">{r.mean !== null ? fmtScore(Math.round(r.mean * 10) / 10) : "–"}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-surface-2/60 text-xs">
                <th scope="row" className="sticky left-0 z-10 bg-surface-2 px-3 py-2 text-left font-semibold text-fg">TB bài · đã nộp</th>
                {colStats.map((c) => <td key={c.id} className="px-2 py-2 text-center tabular-nums text-muted"><b className="text-fg">{c.mean !== null ? fmtScore(Math.round(c.mean * 10) / 10) : "–"}</b> · {c.handed}/{c.total}</td>)}
                <td className="px-3 py-2 text-center font-bold tabular-nums text-fg">{classMean !== null ? fmtScore(Math.round(classMean * 10) / 10) : "–"}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
      <p className="mt-3 text-xs text-muted">Thang 10: mô phỏng lấy điểm cao nhất; bộ câu hỏi lấy tỉ lệ câu đúng cao nhất; code lấy tỉ lệ test đạt; hoạt động chấm tay lấy phiếu chấm đã chốt. Màu: xanh ≥ 8, vàng 5–7,5, đỏ dưới 5.</p>
    </>
  );
}
