"use client";
import { fmtDuration, fmtScore, labSummary } from "@/lib/sim/lab-score";
import { classStudents, teacherClasses } from "@/lib/store/scoped";
import { useSessionData } from "@/lib/store/use-role";
import { cn } from "@/lib/utils";

const firstName = (name: string) => name.trim().split(/\s+/).at(-1) ?? name;

/** Kết quả một mô phỏng theo từng lớp của giáo viên: ai đã làm, điểm cao nhất, ai chưa làm. */
export function LabClassResults({ slug, grades }: { slug: string; grades?: number[] }) {
  const { d, user } = useSessionData();
  const classes = teacherClasses(d, user.id).filter((c) => !grades || grades.includes(c.grade));
  if (!classes.length) return null;
  return (
    <ul className="space-y-1.5 border-t border-line px-3 py-2 text-xs">
      {classes.map((c) => {
        const students = classStudents(d, c.id);
        const s = labSummary(d.labResults, students.map((u) => u.id), slug);
        const name = (id: string) => students.find((u) => u.id === id)?.name ?? "Học sinh";
        return (
          <li key={c.id}>
            <details className="group">
              <summary className="flex cursor-pointer list-none items-center gap-2 rounded-md px-1 py-0.5 hover:bg-surface-2">
                <span className="font-semibold text-fg">{c.name}</span>
                <span className="text-muted">{s.done ? `${s.done}/${students.length} em đã làm · TB ${fmtScore(s.avg)}` : "chưa em nào làm"}</span>
                <span className="ml-auto text-cyan-fg group-open:hidden">Xem</span>
              </summary>
              <div className="mt-1 space-y-1 pl-1">
                {s.rows.map((r) => (
                  <p key={r.studentId} className="flex items-center gap-2">
                    <span className={cn("w-9 shrink-0 rounded px-1 text-center font-bold tabular-nums", r.best.score >= 8 ? "bg-success/15 text-success-fg" : r.best.score >= 6.5 ? "bg-warning/15 text-warning-fg" : "bg-danger/15 text-danger-fg")}>{fmtScore(r.best.score)}</span>
                    <span className="min-w-0 flex-1 truncate text-fg">{name(r.studentId)}</span>
                    <span className="shrink-0 text-muted">{r.best.mistakes} lần sai · {fmtDuration(r.best.seconds)}{r.attempts > 1 ? ` · ${r.attempts} lượt` : ""}</span>
                  </p>
                ))}
                {s.missing.length > 0 && <p className="text-muted">Chưa làm: {s.missing.map((id) => firstName(name(id))).join(", ")}</p>}
              </div>
            </details>
          </li>
        );
      })}
    </ul>
  );
}
