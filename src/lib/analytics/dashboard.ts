/**
 * Số liệu cho bảng điều khiển kết quả học tập (kiểu BI): chỉ số tổng, xu hướng theo tuần, theo bài, theo học sinh,
 * phân bố điểm, mô phỏng, thời điểm học. Mọi hàm thuần, cùng một bộ lọc nên các biểu đồ luôn khớp nhau.
 */
import type { DemoData } from "@/lib/data/seed";
import type { ClassRoom, PracticeAttempt, User } from "@/lib/domain/types";
import { getSet } from "@/lib/data/practice";
import { findSgk, sgkRefForKey } from "@/lib/data/sgk-kntt";
import { getLabBySlug } from "@/lib/data/labs";
import { classStudents, teacherClasses } from "@/lib/store/scoped";
import { completionRows } from "./report";

type D = DemoData;
const DAY = 86_400_000;
export const WEEKS = 6;

export interface DashFilter {
  classId?: string;
  /** Khoảng thời gian tính số liệu: 7, 14, 28, 42 ngày gần nhất. */
  days: number;
  /** Lọc chéo: bấm vào một bài hoặc một học sinh trên biểu đồ. */
  lessonRef?: string;
  studentId?: string;
}

export interface Scored { a: PracticeAttempt; pct: number; t: number; ref?: string; classId?: string }

const pctOf = (a: PracticeAttempt) => { const s = a.items.filter((i) => i.status !== "self"); return s.length ? Math.round((s.filter((i) => i.status === "correct").length / s.length) * 100) : null; };
const refOfSet = (setId: string) => { const s = getSet(setId); return s?.sgkRef ?? (s?.lessonKey ? sgkRefForKey(s.lessonKey) : undefined); };
const avg = (xs: number[]) => (xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : null);
const avg1 = (xs: number[]) => (xs.length ? Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 10) / 10 : null);
export const lessonLabel = (ref: string) => { const f = findSgk(ref); return f ? `Bài ${f.lesson.no}. ${f.lesson.title}` : ref; };
export const lessonShort = (ref: string) => { const f = findSgk(ref); return f ? `Tin ${f.grade} B${f.lesson.no}` : ref; };

export type StudentStatus = "good" | "watch" | "risk";
export interface StudentRow { student: User; cls?: ClassRoom; attempts: number; avg: number | null; trend: (number | null)[]; lab: number | null; missing: number; status: StudentStatus; delta: number | null }

export function dashboard(d: D, teacherId: string, f: DashFilter, now = Date.now()) {
  const classes = teacherClasses(d, teacherId).filter((c) => !f.classId || c.id === f.classId);
  const classOf = new Map<string, ClassRoom>();
  for (const c of classes) for (const u of classStudents(d, c.id)) if (!classOf.has(u.id)) classOf.set(u.id, c);
  const students = [...classOf.keys()].map((id) => d.users.find((u) => u.id === id)!).filter(Boolean);
  const inScope = (sid: string) => classOf.has(sid) && (!f.studentId || sid === f.studentId);

  const all: Scored[] = d.practiceAttempts.filter((a) => inScope(a.studentId)).flatMap((a) => {
    const pct = pctOf(a);
    if (pct === null) return [];
    return [{ a, pct, t: new Date(a.finishedAt).getTime(), ref: refOfSet(a.setId), classId: classOf.get(a.studentId)?.id }];
  }).filter((x) => !f.lessonRef || x.ref === f.lessonRef);
  const cur = all.filter((x) => x.t > now - f.days * DAY);
  const prev = all.filter((x) => x.t <= now - f.days * DAY && x.t > now - 2 * f.days * DAY);
  const labsAll = d.labResults.filter((r) => inScope(r.studentId));
  const labsCur = labsAll.filter((r) => new Date(r.finishedAt).getTime() > now - f.days * DAY);
  const labsPrev = labsAll.filter((r) => { const t = new Date(r.finishedAt).getTime(); return t <= now - f.days * DAY && t > now - 2 * f.days * DAY; });
  const week = (t: number) => WEEKS - 1 - Math.floor((now - t) / (7 * DAY));
  const weekly = (xs: Scored[]) => Array.from({ length: WEEKS }, (_, w) => avg(xs.filter((x) => week(x.t) === w).map((x) => x.pct)));

  // Hoàn thành nhiệm vụ (theo lớp đã lọc)
  const rows = completionRows(d, teacherId, { classId: f.classId }).filter((r) => inScope(r.student.id));
  const doneRows = rows.filter((r) => r.state !== "missing").length;

  // Học sinh
  const studentRows: StudentRow[] = students.filter((u) => !f.studentId || u.id === f.studentId).map((u) => {
    const mine = cur.filter((x) => x.a.studentId === u.id);
    const minePrev = prev.filter((x) => x.a.studentId === u.id);
    const a = avg(mine.map((x) => x.pct));
    const p = avg(minePrev.map((x) => x.pct));
    const lab = avg1(labsCur.filter((r) => r.studentId === u.id).map((r) => r.score));
    const missing = rows.filter((r) => r.student.id === u.id && r.state === "missing").length;
    const status: StudentStatus = (a !== null && a < 55) || missing >= 2 || (lab !== null && lab < 6) ? "risk" : (a !== null && a < 70) || missing === 1 || a === null ? "watch" : "good";
    return { student: u, cls: classOf.get(u.id), attempts: mine.length, avg: a, trend: weekly(all.filter((x) => x.a.studentId === u.id)), lab, missing, status, delta: a !== null && p !== null ? a - p : null };
  }).sort((x, y) => (x.avg ?? -1) - (y.avg ?? -1));

  // Theo bài
  const refs = [...new Set(cur.map((x) => x.ref).filter((r): r is string => !!r))];
  const byLesson = refs.map((ref) => {
    const xs = cur.filter((x) => x.ref === ref);
    return { ref, label: lessonLabel(ref), short: lessonShort(ref), avg: avg(xs.map((x) => x.pct))!, attempts: xs.length, students: new Set(xs.map((x) => x.a.studentId)).size, last: Math.max(...xs.map((x) => x.t)) };
  }).sort((a, b) => a.avg - b.avg);

  // Ma trận học sinh × bài (lần làm tốt nhất), các bài gần nhất
  const heatRefs = [...byLesson].sort((a, b) => b.last - a.last).slice(0, 10).sort((a, b) => a.ref.localeCompare(b.ref, undefined, { numeric: true })).map((x) => x.ref);
  const heat = studentRows.map((r) => ({ student: r.student, cells: heatRefs.map((ref) => { const xs = cur.filter((x) => x.a.studentId === r.student.id && x.ref === ref); return xs.length ? Math.max(...xs.map((x) => x.pct)) : null; }) }));

  // Phân bố điểm (10 khoảng)
  const hist = Array.from({ length: 10 }, (_, i) => ({ from: i * 10, to: i * 10 + 10, n: cur.filter((x) => (i === 9 ? x.pct >= 90 : x.pct >= i * 10 && x.pct < i * 10 + 10)).length }));

  // Mô phỏng
  const slugs = [...new Set(labsCur.map((r) => r.labSlug))];
  const labs = slugs.map((slug) => { const xs = labsCur.filter((r) => r.labSlug === slug); return { slug, title: getLabBySlug(slug)?.title ?? slug, avg: avg1(xs.map((r) => r.score))!, n: xs.length }; }).sort((a, b) => a.avg - b.avg);

  // Thời điểm học: thứ × buổi
  const bands = [{ label: "Sáng", from: 5, to: 12 }, { label: "Chiều", from: 12, to: 18 }, { label: "Tối", from: 18, to: 24 }];
  const when = bands.map((b) => ({ label: b.label, days: Array.from({ length: 7 }, (_, wd) => cur.filter((x) => { const dt = new Date(x.t); const h = dt.getHours(); return (dt.getDay() + 6) % 7 === wd && h >= b.from && h < b.to; }).length) }));

  // Xu hướng theo lớp
  const series = classes.map((c) => ({ id: c.id, name: c.name, values: weekly(all.filter((x) => x.classId === c.id)) })).filter((s) => s.values.some((v) => v !== null));

  const avgCur = avg(cur.map((x) => x.pct));
  const avgPrev = avg(prev.map((x) => x.pct));
  const labCur = avg1(labsCur.map((r) => r.score));
  const labPrev = avg1(labsPrev.map((r) => r.score));
  return {
    students: studentRows,
    kpi: {
      avg: { value: avgCur, delta: avgCur !== null && avgPrev !== null ? avgCur - avgPrev : null, trend: weekly(all) },
      attempts: { value: cur.length, delta: prev.length ? cur.length - prev.length : null, trend: Array.from({ length: WEEKS }, (_, w) => all.filter((x) => week(x.t) === w).length) },
      completion: { value: rows.length ? Math.round((doneRows / rows.length) * 100) : null, of: `${doneRows}/${rows.length}` },
      lab: { value: labCur, delta: labCur !== null && labPrev !== null ? Math.round((labCur - labPrev) * 10) / 10 : null, n: labsCur.length },
      risk: { value: studentRows.filter((r) => r.status === "risk").length, of: studentRows.length },
    },
    series, byLesson, heat, heatRefs, hist, labs, when,
    weekLabels: Array.from({ length: WEEKS }, (_, w) => { const end = new Date(now - (WEEKS - 1 - w) * 7 * DAY); return w === WEEKS - 1 ? "Tuần này" : `${end.getDate()}/${end.getMonth() + 1}`; }),
  };
}
export type Dashboard = ReturnType<typeof dashboard>;
