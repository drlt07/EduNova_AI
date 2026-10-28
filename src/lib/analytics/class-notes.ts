/**
 * Sổ tay lớp học: những điều giáo viên cần biết sau các bài nộp gần đây, viết như ghi chú của đồng nghiệp:
 * em nào, vướng chỗ nào, tiết sau làm gì. Bài nộp là bài chấm chính thức của lớp nên được nêu tên;
 * trò chuyện với AI Gia sư thì không (xem tutor-insights).
 */
import type { DemoData } from "@/lib/data/seed";
import { diagnose } from "@/lib/sim/smart-garden";
import { teacherAssignments, teacherClasses, assignedStudents } from "@/lib/store/scoped";
import { taskOutcome } from "@/lib/teacher/assign";

export type NoteKind = "fix" | "chase" | "lab" | "praise";

export interface ClassNote {
  id: string;
  kind: NoteKind;
  className: string;
  /** Bài giao mà ghi chú nói tới; giao diện gom các ghi chú cùng bài. */
  task: string;
  /** Tên các em, đã rút gọn ("Khang, Minh và 2 em khác"). */
  who: string;
  /** Phần còn lại của câu, nối sau tên. */
  text: string;
  /** Việc nên làm ở tiết sau. */
  next?: string;
  objectiveId?: string;
}

const PATTERN: Record<string, { text: string; next: string; objectiveId: string }> = {
  boundary: { text: "còn nhầm < với <= ở đúng mốc ngưỡng", next: "Đầu tiết cho cả lớp thử ba giá trị 39, 40, 41 trên bảng rồi mới viết điều kiện.", objectiveId: "O10-F-04" },
  "no-water": { text: "quên kiểm tra bình còn nước trước khi bật bơm", next: "Hỏi lớp: “Bình hết nước mà bơm vẫn chạy thì sao?” trước khi giới thiệu and.", objectiveId: "O10-F-03" },
  logic: { text: "viết ngược chiều so sánh", next: "Cho các em đọc điều kiện thành lời (“độ ẩm nhỏ hơn 40”) rồi đoán kết quả trước khi chạy.", objectiveId: "O10-F-02" },
  extreme: { text: "chưa thử trường hợp 0% và 100%", next: "Yêu cầu mỗi em tự thêm hai ca kiểm thử ở hai đầu thang đo.", objectiveId: "O10-F-04" },
};

const given = (name: string) => name.trim().split(/\s+/).at(-1) ?? name;

/** "Khang", "Khang và Minh", "Khang, Minh, Lan và 2 em khác" */
export function listNames(names: string[], max = 3): string {
  const g = names.map(given);
  if (g.length <= 1) return g.join("");
  if (g.length <= max) return `${g.slice(0, -1).join(", ")} và ${g.at(-1)}`;
  return `${g.slice(0, max).join(", ")} và ${g.length - max} em khác`;
}

const WEEKDAY = ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];

export function classNotes(d: DemoData, teacherId: string, now = Date.now()): ClassNote[] {
  const out: ClassNote[] = [];
  const classes = teacherClasses(d, teacherId);
  for (const a of teacherAssignments(d, teacherId)) {
    const klass = classes.find((c) => c.id === a.classId);
    if (!klass) continue;
    const students = assignedStudents(d, a);
    const nameOf = (id: string) => students.find((u) => u.id === id)?.name ?? "Học sinh";
    const title = a.title;

    if (a.task) {
      const outs = students.map((u) => ({ u, o: taskOutcome(d, u.id, a) }));
      const done = outs.filter((x) => x.o.done);
      if (done.length) {
        const low = done.filter((x) => (x.o.ratio ?? 1) < 0.65);
        out.push({
          id: `lab-${a.id}`, kind: low.length ? "fix" : "lab", className: klass.name, task: title,
          who: `${done.length}/${students.length} em`,
          text: `đã làm xong${low.length ? `; ${listNames(low.map((x) => x.u.name))} còn điểm thấp (${low.map((x) => x.o.text).join(", ")})` : ""}.`,
          next: low.length ? "Cho các em này làm lại cùng bạn ngồi cạnh, thầy cô xem lại bước hay sai." : undefined,
        });
      }
      const missing = outs.filter((x) => !x.o.done).map((x) => x.u.name);
      const due = new Date(a.dueAt).getTime();
      if (a.status === "open" && missing.length && missing.length < students.length && due - now < 3 * 86_400_000)
        out.push({ id: `chase-${a.id}`, kind: "chase", className: klass.name, task: title, who: listNames(missing), text: `chưa làm, hạn ${due < now ? "đã qua" : WEEKDAY[new Date(a.dueAt).getDay()]}.` });
      continue;
    }

    const subs = d.submissions.filter((s) => s.assignmentId === a.id && students.some((u) => u.id === s.studentId));
    const byPattern = new Map<string, string[]>();
    for (const s of subs) for (const p of diagnose(s.testResults)) byPattern.set(p, [...(byPattern.get(p) ?? []), nameOf(s.studentId)]);
    for (const [p, names] of [...byPattern.entries()].sort((x, y) => y[1].length - x[1].length)) {
      const info = PATTERN[p];
      if (!info) continue;
      out.push({ id: `fix-${a.id}-${p}`, kind: "fix", className: klass.name, task: title, who: listNames(names), text: `${info.text}.`, next: info.next, objectiveId: info.objectiveId });
    }
    const perfect = subs.filter((s) => s.testResults.length > 0 && s.testResults.every((r) => r.pass));
    if (perfect.length >= 2)
      out.push({ id: `praise-${a.id}`, kind: "praise", className: klass.name, task: title, who: listNames(perfect.map((s) => nameOf(s.studentId))), text: `làm đúng hết. Có thể nhờ các em kèm bạn ở tiết sau.` });
    const missing = students.filter((u) => !subs.some((s) => s.studentId === u.id)).map((u) => u.name);
    const due = new Date(a.dueAt).getTime();
    if (a.status === "open" && missing.length && subs.length && due - now < 3 * 86_400_000)
      out.push({ id: `chase-${a.id}`, kind: "chase", className: klass.name, task: title, who: listNames(missing), text: `chưa nộp, hạn ${due < now ? "đã qua" : WEEKDAY[new Date(a.dueAt).getDay()]}.` });
  }
  const order: Record<NoteKind, number> = { fix: 0, chase: 1, lab: 2, praise: 3 };
  return out.sort((x, y) => order[x.kind] - order[y.kind]);
}

