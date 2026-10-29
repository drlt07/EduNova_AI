/**
 * Lịch sử học tập mẫu 6 tuần cho các lớp (trừ học sinh demo s1) để bảng điều khiển kết quả có số liệu:
 * mỗi em làm bộ luyện tập của các bài đã mở và vài mô phỏng của bài, năng lực và tiến bộ khác nhau.
 * Sinh tất định (cùng hạt giống → cùng dữ liệu), không gọi mạng.
 */
import type { ClassRoom, Enrollment, PracticeAttempt } from "@/lib/domain/types";
import type { LabResult } from "@/lib/sim/lab-score";
import { getQuestion } from "./practice";
import { SGK_SETS } from "./practice-sgk";
import { SGK_SIMS } from "./lab-catalog";
import { SGK_KNTT, sgkRef } from "./sgk-kntt";

/** Số giả ngẫu nhiên tất định trong [0, 1). */
function rnd(...k: (string | number)[]): number {
  let h = 2166136261;
  for (const c of k.join("|")) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0;
  h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 3266489909) >>> 0;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/** Số bài đã dạy (đã mở luyện tập) của từng lớp mẫu. */
const TAUGHT: Record<string, number> = { "c-10a1": 19, "c-11a2": 2, "c-12a3": 1, "c-10a2": 8 };

/** `skip`: các cặp "học sinh|mô phỏng" đã có kết quả mẫu riêng, không sinh thêm để giữ đúng câu chuyện của dữ liệu mẫu. */
export function seedHistory(now: Date, classes: ClassRoom[], enrollments: Enrollment[], skip: Set<string> = new Set()) {
  const attempts: PracticeAttempt[] = [];
  const labs: LabResult[] = [];
  const day = 86_400_000;
  for (const cls of classes) {
    const n = TAUGHT[cls.id] ?? 0;
    const lessons = SGK_KNTT[cls.grade].flatMap((t) => t.lessons.map((l) => sgkRef(cls.grade, l))).slice(0, n);
    const students = enrollments.filter((e) => e.classId === cls.id && e.studentId !== "s1" && !e.status).map((e) => e.studentId);
    lessons.forEach((ref, li) => {
      // bài dạy trải đều trong 6 tuần, bài sau dạy gần đây hơn
      const taughtDay = -42 + Math.round(((li + 0.5) / Math.max(1, lessons.length)) * 40);
      const difficulty = rnd("diff", ref) * 0.2;
      const set = SGK_SETS.find((s) => s.sgkRef === ref);
      for (const sid of students) {
        const ability = 0.62 + rnd("ab", sid) * 0.33;
        const growth = rnd("gr", sid) * 0.12;
        if (set && rnd("do", sid, ref) < 0.88) {
          const tries = rnd("tr", sid, ref) < 0.3 ? 2 : 1;
          for (let k = 0; k < tries; k++) {
            const when = Math.min(-0.2, taughtDay + 1 + Math.floor(rnd("d", sid, ref, k) * 4) + k * 2);
            const p = Math.min(0.97, Math.max(0.1, ability - difficulty + growth * (li / Math.max(1, lessons.length)) + k * 0.12));
            const items = set.questionIds.map((qid, qi) => {
              const q = getQuestion(qid);
              return { questionId: qid, objectiveId: q?.objectiveId ?? `SGK-${ref}`, status: (rnd("q", sid, qid, k, qi) < p ? "correct" : "wrong") as "correct" | "wrong", answer: "" };
            });
            const start = new Date(now.getTime() + when * day + (8 + rnd("h", sid, ref, k) * 12) * 3_600_000);
            attempts.push({ id: `pa-h-${sid}-${ref}-${k}`, studentId: sid, setId: set.id, mode: k ? "practice" : rnd("m", sid, ref) < 0.25 ? "exam" : "practice", items, startedAt: start.toISOString(), finishedAt: new Date(start.getTime() + (6 + rnd("min", sid, ref) * 14) * 60_000).toISOString() });
          }
        }
        for (const slug of SGK_SIMS[ref] ?? []) {
          if (skip.has(`${sid}|${slug}`) || rnd("lab", sid, slug) > 0.75) continue;
          const mistakes = Math.round((1 - ability) * 10 * rnd("mk", sid, slug) + rnd("mk2", sid) * 2);
          const score = Math.max(3, Math.min(10, Math.round((10 - mistakes * 0.7) * 2) / 2));
          const when = Math.min(-0.3, taughtDay + 1 + Math.floor(rnd("ld", sid, slug) * 5));
          labs.push({ id: `lr-h-${sid}-${slug}`, studentId: sid, labSlug: slug, score, mistakes, seconds: Math.round(420 + rnd("s", sid, slug) * 900), finishedAt: new Date(now.getTime() + when * day + 14 * 3_600_000).toISOString() });
        }
      }
    });
  }
  return { attempts, labs };
}
