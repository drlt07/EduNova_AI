/**
 * Tổng hợp tiến độ của học sinh từ minh chứng thật trong kho dữ liệu.
 * Ba loại tiến độ được tách riêng: nội dung (đã học phần nào), mức đạt (câu hỏi/bài kiểm tra),
 * thực hành (trò chơi, bài lập trình, điểm tiêu chí của giáo viên).
 */
import type { DemoData } from "@/lib/data/seed";
import { LESSONS, OBJECTIVES, TOPICS, getLesson } from "@/lib/data/curriculum";
import { getLessonContent } from "@/lib/data/lesson-content";
import { CODING_EXERCISES } from "@/lib/data/coding-exercises";
import { FARM_LEVELS, getGame } from "@/lib/data/games";
import { PRACTICE_SETS, getQuestion, KIND_LABEL } from "@/lib/data/practice";
import { studentAssessments, studentAssignments } from "./scoped";
import { missionStatus } from "./student";

export function lessonSections(lessonId: string): string[] {
  const l = getLesson(lessonId);
  if (!l) return [];
  const c = getLessonContent(l.key);
  return c ? ["muc-tieu", "khoi-dong", "kien-thuc", "quan-sat", "kiem-tra", "van-dung"] : ["muc-tieu", "kien-thuc", ...(l.quiz?.length ? ["kiem-tra"] : [])];
}

export function studentBook(d: DemoData, studentId: string) {
  const e = d.enrollments.find((x) => x.studentId === studentId);
  const c = d.classes.find((x) => x.id === e?.classId);
  return { grade: c?.grade ?? 10, book: c?.textbookId ?? "kntt", klass: c };
}

export interface ObjectiveEvidence {
  objectiveId: string;
  description: string;
  topicId: string;
  /** null = chưa có minh chứng */
  mastery: number | null;
  evidence: number;
  sources: string[];
  practice: number | null;
}

export function objectiveEvidence(d: DemoData, studentId: string, grade: number): ObjectiveEvidence[] {
  const acc = new Map<string, { ok: number; n: number; src: Set<string> }>();
  const add = (o: string, ok: number, n: number, src: string) => {
    const cur = acc.get(o) ?? { ok: 0, n: 0, src: new Set<string>() };
    cur.ok += ok;
    cur.n += n;
    cur.src.add(src);
    acc.set(o, cur);
  };
  for (const a of d.practiceAttempts.filter((x) => x.studentId === studentId))
    for (const it of a.items) if (it.status !== "self") add(it.objectiveId, it.status === "correct" ? 1 : 0, 1, "luyện tập");
  for (const p of d.lessonProgress.filter((x) => x.studentId === studentId && x.quiz)) {
    const l = getLesson(p.lessonId);
    for (const o of l?.objectiveIds ?? []) add(o, p.quiz!.correct / l!.objectiveIds.length, p.quiz!.total / l!.objectiveIds.length, "câu hỏi trong bài");
  }
  for (const asm of studentAssessments(d, studentId)) {
    const r = d.rubrics.find((x) => x.id === asm.rubricId);
    for (const sc of asm.scores) {
      const c = r?.criteria.find((x) => x.id === sc.criterionId);
      // điểm giáo viên chấm được tính gấp đôi trọng số
      if (c) add(c.objectiveId, (sc.score / c.maxScore) * 2, 2, "giáo viên chấm");
    }
  }
  const prac = new Map<string, { ok: number; n: number }>();
  const addP = (o: string, ok: boolean) => {
    const cur = prac.get(o) ?? { ok: 0, n: 0 };
    prac.set(o, { ok: cur.ok + (ok ? 1 : 0), n: cur.n + 1 });
  };
  const farm = d.gameProgress.find((g) => g.studentId === studentId && g.gameSlug === "smart-farm");
  for (const lv of FARM_LEVELS) if (farm?.history.some((h) => h.level === lv.id)) for (const o of lv.objectiveIds) addP(o, farm.passed.includes(lv.id));
  for (const cw of d.codeWorks.filter((c) => c.studentId === studentId && c.lastRun)) {
    const ex = CODING_EXERCISES.find((e) => e.id === cw.exerciseId);
    for (const o of ex?.objectiveIds ?? []) addP(o, cw.lastRun!.passed === cw.lastRun!.total);
  }
  return OBJECTIVES.filter((o) => o.grade === grade).map((o) => {
    const a = acc.get(o.id);
    const p = prac.get(o.id);
    return {
      objectiveId: o.id,
      description: o.description,
      topicId: o.topicId,
      mastery: a && a.n > 0 ? Math.round((a.ok / a.n) * 100) : null,
      evidence: a ? Math.round(a.n) : 0,
      sources: a ? [...a.src] : [],
      practice: p ? Math.round((p.ok / p.n) * 100) : null,
    };
  });
}

export interface TopicProgress {
  topicId: string;
  name: string;
  content: number;
  mastery: number | null;
  practice: number | null;
  lessons: number;
}

export function topicProgress(d: DemoData, studentId: string): TopicProgress[] {
  const { grade, book } = studentBook(d, studentId);
  const ev = objectiveEvidence(d, studentId, grade);
  return TOPICS.map((t) => {
    const lessons = LESSONS.filter((l) => l.grade === grade && l.textbookId === book && l.topicId === t.id);
    if (!lessons.length) return null;
    let done = 0;
    let total = 0;
    for (const l of lessons) {
      const secs = lessonSections(l.id);
      const p = d.lessonProgress.find((x) => x.studentId === studentId && x.lessonId === l.id);
      total += secs.length;
      done += secs.filter((s) => p?.sectionsDone.includes(s)).length;
    }
    const objs = ev.filter((e) => lessons.some((l) => l.objectiveIds.includes(e.objectiveId)));
    const m = objs.filter((o) => o.mastery !== null);
    const pr = objs.filter((o) => o.practice !== null);
    return {
      topicId: t.id,
      name: t.name,
      content: total ? Math.round((done / total) * 100) : 0,
      mastery: m.length ? Math.round(m.reduce((s, o) => s + o.mastery!, 0) / m.length) : null,
      practice: pr.length ? Math.round(pr.reduce((s, o) => s + o.practice!, 0) / pr.length) : null,
      lessons: lessons.length,
    };
  }).filter((x): x is TopicProgress => x !== null);
}

export interface ContinueItem {
  id: string;
  title: string;
  detail: string;
  href: string;
  kind: "lesson" | "game" | "code" | "mission" | "project";
  at: string;
}

export function continueItems(d: DemoData, studentId: string): ContinueItem[] {
  const out: ContinueItem[] = [];
  for (const p of d.lessonProgress.filter((x) => x.studentId === studentId)) {
    const secs = lessonSections(p.lessonId);
    if (secs.every((s) => p.sectionsDone.includes(s))) continue;
    const l = getLesson(p.lessonId);
    if (l) out.push({ id: `l-${p.lessonId}`, kind: "lesson", title: l.title, detail: `Đã học ${secs.filter((s) => p.sectionsDone.includes(s)).length}/${secs.length} phần`, href: `/student/learning/${l.id}${p.lastSection ? `#${p.lastSection}` : ""}`, at: p.updatedAt });
  }
  for (const g of d.gameProgress.filter((x) => x.studentId === studentId)) {
    const next = FARM_LEVELS.find((lv) => !g.passed.includes(lv.id));
    if (next) out.push({ id: `g-${g.gameSlug}`, kind: "game", title: `${getGame(g.gameSlug)?.title} — cấp ${next.id}`, detail: next.title, href: `/student/games/${g.gameSlug}?level=${next.id}`, at: g.updatedAt });
  }
  for (const c of d.codeWorks.filter((x) => x.studentId === studentId)) {
    const ex = CODING_EXERCISES.find((e) => e.id === c.exerciseId);
    if (c.lastRun && c.lastRun.passed === c.lastRun.total) continue;
    out.push({ id: `c-${c.exerciseId}`, kind: "code", title: ex ? `Bài lập trình: ${ex.title}` : "Phòng lập trình", detail: c.lastRun ? `Lần chạy gần nhất đạt ${c.lastRun.passed}/${c.lastRun.total}` : "Đang viết dở", href: `/student/code?bai=${c.exerciseId}`, at: c.updatedAt });
  }
  for (const a of d.attempts.filter((x) => x.studentId === studentId && x.assignmentId && x.status !== "submitted")) {
    const asg = d.assignments.find((x) => x.id === a.assignmentId);
    if (asg) out.push({ id: `m-${a.id}`, kind: "mission", title: asg.title, detail: a.status === "paused" ? "Đang tạm dừng" : "Đang làm", href: `/student/missions/${asg.id}`, at: a.updatedAt });
  }
  for (const p of d.projects.filter((x) => x.studentId === studentId && x.status === "doing"))
    out.push({ id: `p-${p.id}`, kind: "project", title: p.title, detail: `${p.tasks.filter((t) => t.done).length}/${p.tasks.length} việc`, href: `/student/projects/${p.id}`, at: p.updatedAt });
  return out.sort((a, b) => b.at.localeCompare(a.at));
}

export interface StudySuggestion {
  text: string;
  href: string;
  action: string;
}

/** Gợi ý học tập theo luật (không dùng mô hình AI): mục tiêu yếu nhất → bài luyện phù hợp. */
export function studySuggestions(d: DemoData, studentId: string): StudySuggestion[] {
  const { grade } = studentBook(d, studentId);
  const ev = objectiveEvidence(d, studentId, grade);
  const out: StudySuggestion[] = [];
  const weak = ev.filter((e) => e.mastery !== null && e.mastery < 70).sort((a, b) => a.mastery! - b.mastery!)[0];
  if (weak) {
    const set = PRACTICE_SETS.find((s) => s.questionIds.some((q) => getQuestion(q)?.objectiveId === weak.objectiveId));
    out.push({ text: `Mức đạt mục tiêu "${weak.description}" mới khoảng ${weak.mastery}%. Em nên luyện thêm phần này.`, href: set ? `/student/practice/${set.id}` : "/student/practice", action: set ? `Luyện "${set.title}"` : "Luyện tập" });
  }
  const untested = ev.find((e) => e.mastery === null && LESSONS.some((l) => l.grade === grade && l.objectiveIds.includes(e.objectiveId) && getLessonContent(l.key)));
  if (untested) {
    const l = LESSONS.find((x) => x.grade === grade && x.objectiveIds.includes(untested.objectiveId) && x.textbookId === studentBook(d, studentId).book);
    if (l) out.push({ text: `Em chưa có kết quả nào cho mục tiêu "${untested.description}".`, href: `/student/learning/${l.id}`, action: `Học "${l.title}"` });
  }
  const farm = d.gameProgress.find((g) => g.studentId === studentId && g.gameSlug === "smart-farm");
  const nextLv = FARM_LEVELS.find((lv) => !farm?.passed.includes(lv.id));
  if (nextLv) out.push({ text: `Thử thách tiếp theo: Nông trại thông minh cấp ${nextLv.id} — ${nextLv.title}.`, href: `/student/games/smart-farm?level=${nextLv.id}`, action: "Vào trò chơi" });
  return out.slice(0, 3);
}

export function commonErrors(d: DemoData, studentId: string) {
  const counts = new Map<string, number>();
  const inc = (k: string) => counts.set(k, (counts.get(k) ?? 0) + 1);
  for (const a of d.practiceAttempts.filter((x) => x.studentId === studentId))
    for (const it of a.items.filter((i) => i.status === "wrong")) {
      const q = getQuestion(it.questionId);
      if (q) inc(`Câu ${KIND_LABEL[q.kind].toLowerCase()}: ${OBJECTIVES.find((o) => o.id === q.objectiveId)?.description.slice(0, 60)}…`);
    }
  const farm = d.gameProgress.find((g) => g.studentId === studentId);
  for (const h of farm?.history.filter((x) => !x.passed) ?? []) inc(`Nông trại cấp ${h.level}: ${FARM_LEVELS.find((l) => l.id === h.level)?.title}`);
  for (const c of d.codeWorks.filter((x) => x.studentId === studentId && x.lastRun?.errorType)) inc(`Lỗi ${c.lastRun!.errorType} khi lập trình`);
  return [...counts.entries()].map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count).slice(0, 6);
}

export function improvements(d: DemoData, studentId: string) {
  const bySet = new Map<string, { first: number; last: number; title: string }>();
  const attempts = d.practiceAttempts.filter((x) => x.studentId === studentId).sort((a, b) => a.finishedAt.localeCompare(b.finishedAt));
  for (const a of attempts) {
    const scored = a.items.filter((i) => i.status !== "self");
    if (!scored.length) continue;
    const r = Math.round((scored.filter((i) => i.status === "correct").length / scored.length) * 100);
    const cur = bySet.get(a.setId);
    bySet.set(a.setId, { first: cur?.first ?? r, last: r, title: PRACTICE_SETS.find((s) => s.id === a.setId)?.title ?? a.setId });
  }
  return [...bySet.values()].filter((x) => x.last > x.first);
}

export interface StudentNotification {
  id: string;
  text: string;
  href: string;
  at: string;
  tone: "info" | "warning" | "success";
}

export function studentNotifications(d: DemoData, studentId: string, now = Date.now()): StudentNotification[] {
  const out: StudentNotification[] = [];
  for (const a of studentAssignments(d, studentId)) {
    const st = missionStatus(d, studentId, a, now);
    if (now - new Date(a.publishedAt).getTime() < 7 * 86_400_000 && st === "not_started") out.push({ id: `new-${a.id}`, text: `Nhiệm vụ mới: ${a.title}`, href: `/student/missions/${a.id}`, at: a.publishedAt, tone: "info" });
    const left = new Date(a.dueAt).getTime() - now;
    if (left > 0 && left < 2 * 86_400_000 && ["not_started", "in_progress", "paused"].includes(st)) out.push({ id: `due-${a.id}`, text: `Sắp đến hạn: ${a.title}`, href: `/student/missions/${a.id}`, at: a.dueAt, tone: "warning" });
  }
  for (const asm of studentAssessments(d, studentId)) {
    const sub = d.submissions.find((s) => s.id === asm.submissionId);
    const asg = sub && d.assignments.find((a) => a.id === sub.assignmentId);
    if (asg) out.push({ id: `fb-${asm.id}`, text: `Giáo viên đã chấm: ${asg.title}`, href: `/student/missions/${asg.id}`, at: asm.updatedAt, tone: "success" });
  }
  return out.sort((a, b) => b.at.localeCompare(a.at));
}

export interface TimelineItem {
  id: string;
  at: string;
  kind: "lab" | "code" | "game" | "practice" | "project" | "lesson" | "submit";
  title: string;
  detail: string;
  code?: string;
  ok?: boolean;
}

const EVENT_LABEL: Record<string, string> = { run: "Chạy thử", test: "Kiểm thử", rule_change: "Sửa điều kiện", input_change: "Đổi dữ liệu vào", submit: "Nộp bài", reset: "Làm lại", pause: "Tạm dừng", resume: "Tiếp tục" };

/** Dòng thời gian học tập ("xem lại quá trình") dựng từ dữ liệu thật đã ghi lại, không thêm sự kiện giả. */
export function learningTimeline(d: DemoData, studentId: string): TimelineItem[] {
  const out: TimelineItem[] = [];
  const attempts = d.attempts.filter((a) => a.studentId === studentId);
  for (const a of attempts)
    for (const e of d.events.filter((x) => x.attemptId === a.id && x.type in EVENT_LABEL)) {
      const rule = typeof e.input.rule === "string" ? e.input.rule : undefined;
      out.push({ id: e.id, at: e.timestamp, kind: e.type === "submit" ? "submit" : "lab", title: `${EVENT_LABEL[e.type]} — Vườn tưới thông minh`, detail: Object.entries(e.input).filter(([k]) => k !== "rule").map(([k, v]) => `${k} = ${String(v)}`).join(", ") || "—", code: rule, ok: e.pass });
    }
  for (const c of d.codeWorks.filter((x) => x.studentId === studentId)) {
    const ex = CODING_EXERCISES.find((e) => e.id === c.exerciseId);
    c.versions.forEach((v, i) => out.push({ id: `${c.id}-v${i}`, at: v.savedAt, kind: "code", title: `Lưu code — ${ex?.title ?? "Viết tự do"}`, detail: v.note, code: v.code }));
  }
  for (const g of d.gameProgress.filter((x) => x.studentId === studentId))
    g.history.forEach((h, i) => out.push({ id: `${g.gameSlug}-${i}`, at: h.at, kind: "game", title: `${getGame(g.gameSlug)?.title ?? g.gameSlug} — cấp ${h.level}`, detail: `Đạt ${h.score}/${h.total} tình huống`, code: g.codeByLevel[h.level], ok: h.passed }));
  for (const a of d.practiceAttempts.filter((x) => x.studentId === studentId)) {
    const s = a.items.filter((i) => i.status !== "self");
    const ok = s.filter((i) => i.status === "correct").length;
    out.push({ id: a.id, at: a.finishedAt, kind: "practice", title: `Luyện tập — ${PRACTICE_SETS.find((x) => x.id === a.setId)?.title ?? a.setId}`, detail: `${ok}/${s.length} câu đúng`, ok: s.length > 0 && ok / s.length >= 0.8 });
  }
  for (const p of d.projects.filter((x) => x.studentId === studentId)) p.log.forEach((l, i) => out.push({ id: `${p.id}-${i}`, at: l.at, kind: "project", title: `Dự án — ${p.title}`, detail: l.note }));
  for (const p of d.lessonProgress.filter((x) => x.studentId === studentId && x.quiz)) {
    const l = getLesson(p.lessonId);
    out.push({ id: `lq-${p.lessonId}`, at: p.quiz!.at, kind: "lesson", title: `Kiểm tra nhanh — ${l?.title ?? p.lessonId}`, detail: `${p.quiz!.correct}/${p.quiz!.total} câu đúng`, ok: p.quiz!.correct === p.quiz!.total });
  }
  return out.sort((a, b) => a.at.localeCompare(b.at));
}
