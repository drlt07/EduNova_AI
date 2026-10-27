/**
 * Logic thuần cho Khóa học & bài giảng: dựng khung từ chương trình, sắp xếp, tính hoàn thành và khóa bài.
 * Không phụ thuộc React/store để kiểm thử được bằng Vitest.
 */
import type { Course, CourseBlock, CourseBlockKind, CourseLesson, CourseProgress, CourseTopic, Grade, PracticeAttempt, TextbookId } from "@/lib/domain/types";
import { LESSONS, TOPICS, getLesson } from "@/lib/data/curriculum";
import { SGK_KNTT, sgkLessonId } from "@/lib/data/sgk-kntt";
import { uid } from "@/lib/utils";

export const BLOCK_LABEL: Record<CourseBlockKind, string> = {
  text: "Nội dung kiến thức",
  media: "Video hoặc hình minh họa",
  simulation: "Mô phỏng",
  python: "Bài thực hành Python",
  practice: "Bài luyện tập",
  file: "Tài liệu tải lên",
};

/** Loại khối học sinh tự đánh dấu "đã học"; các loại còn lại hệ thống tự ghi nhận khi đạt. */
export const SELF_MARK_KINDS: CourseBlockKind[] = ["text", "media", "file", "simulation"];

/** Giới hạn tệp tải lên ở bản demo (localStorage của trình duyệt chỉ khoảng 5 MB). */
export const MAX_FILE_BYTES = 1_000_000;

export function newBlock(kind: CourseBlockKind, patch: Partial<CourseBlock> = {}): CourseBlock {
  return { id: uid("cb"), kind, title: BLOCK_LABEL[kind], required: kind !== "file" && kind !== "media", ...(kind === "practice" ? { minScore: 70 } : {}), ...patch };
}

export function newLesson(title: string, lessonId?: string, blocks: CourseBlock[] = []): CourseLesson {
  return { id: uid("cl"), title, lessonId, blocks };
}

export function newTopic(title: string, topicId?: string, lessons: CourseLesson[] = []): CourseTopic {
  return { id: uid("ct"), title, topicId, lessons };
}

/**
 * Khung khóa học theo khối lớp + bộ sách: chủ đề → bài học. Bộ KNTT dựng đúng mục lục SGK; bài nào có
 * bài tương tác EduNova thì gắn vào và lấy tóm tắt làm khối kiến thức.
 */
export function scaffoldTopics(grade: Grade, book: TextbookId): CourseTopic[] {
  if (book === "kntt") {
    return SGK_KNTT[grade].map((t) =>
      newTopic(
        `Chủ đề ${t.no}. ${t.title}`,
        undefined,
        t.lessons.map((l) => {
          const id = sgkLessonId(l);
          return newLesson(`Bài ${l.no}. ${l.title}`, id, [newBlock("text", { body: (id && getLesson(id)?.summary) || `Nội dung Bài ${l.no} theo SGK Tin học ${grade} (Kết nối tri thức).` })]);
        }),
      ),
    );
  }
  const lessons = LESSONS.filter((l) => l.grade === grade && l.textbookId === book).sort((a, b) => a.order - b.order);
  return TOPICS.flatMap((t) => {
    const ls = lessons.filter((l) => l.topicId === t.id);
    if (!ls.length) return [];
    return [newTopic(`Chủ đề ${t.code}: ${t.name}`, t.id, ls.map((l) => newLesson(l.title, l.id, [newBlock("text", { body: l.summary })])))];
  });
}

export function allLessons(course: Pick<Course, "topics">): CourseLesson[] {
  return course.topics.flatMap((t) => t.lessons);
}

export function findLesson(course: Pick<Course, "topics">, lessonId: string): CourseLesson | undefined {
  return allLessons(course).find((l) => l.id === lessonId);
}

/** Di chuyển phần tử trong mảng (kéo thả hoặc nút lên/xuống). Trả về mảng mới. */
export function moveItem<T>(list: T[], from: number, to: number): T[] {
  if (from === to || from < 0 || from >= list.length || to < 0 || to >= list.length) return list;
  const next = [...list];
  const [it] = next.splice(from, 1);
  next.splice(to, 0, it);
  return next;
}

/** Tỉ lệ đúng (%) cao nhất của học sinh ở một bộ luyện tập; chưa làm → null. */
export function bestPracticeScore(attempts: PracticeAttempt[], studentId: string, setId: string): number | null {
  const mine = attempts.filter((a) => a.studentId === studentId && a.setId === setId && a.items.length > 0);
  if (!mine.length) return null;
  return Math.max(...mine.map((a) => Math.round((a.items.filter((i) => i.status === "correct").length / a.items.length) * 100)));
}

export interface ProgressContext {
  progress?: CourseProgress;
  practiceAttempts: PracticeAttempt[];
  studentId: string;
}

export function isBlockDone(block: CourseBlock, ctx: ProgressContext): boolean {
  if (block.kind === "practice" && block.practiceSetId) {
    const best = bestPracticeScore(ctx.practiceAttempts, ctx.studentId, block.practiceSetId);
    if (best !== null && best >= (block.minScore ?? 0)) return true;
  }
  return Boolean(ctx.progress?.done[block.id]);
}

/** Bài hoàn thành khi xong mọi khối bắt buộc; bài không có khối bắt buộc thì cần xong ít nhất một khối. */
export function isLessonDone(lesson: CourseLesson, ctx: ProgressContext): boolean {
  if (!lesson.blocks.length) return false;
  const req = lesson.blocks.filter((b) => b.required);
  return req.length ? req.every((b) => isBlockDone(b, ctx)) : lesson.blocks.some((b) => isBlockDone(b, ctx));
}

export interface LessonState {
  lesson: CourseLesson;
  done: boolean;
  locked: boolean;
  doneBlocks: number;
}

/** Trạng thái từng bài theo thứ tự khóa học; học lần lượt thì bài sau khóa cho tới khi xong bài liền trước. */
export function lessonStates(course: Course, ctx: ProgressContext): LessonState[] {
  let prevDone = true;
  return allLessons(course).map((lesson) => {
    const done = isLessonDone(lesson, ctx);
    const locked = course.sequential && !prevDone && !lesson.alwaysOpen;
    prevDone = done;
    return { lesson, done, locked, doneBlocks: lesson.blocks.filter((b) => isBlockDone(b, ctx)).length };
  });
}

export function courseCompletion(course: Course, ctx: ProgressContext): { done: number; total: number; percent: number } {
  const states = lessonStates(course, ctx).filter((s) => s.lesson.blocks.length > 0);
  const done = states.filter((s) => s.done).length;
  return { done, total: states.length, percent: states.length ? Math.round((done / states.length) * 100) : 0 };
}

/** Kiểm tra trước khi phát hành: lỗi chặn phát hành và cảnh báo nên xem lại. */
export function validateForPublish(course: Course): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  const lessons = allLessons(course);
  if (!course.title.trim()) errors.push("Khóa học chưa có tên.");
  if (!lessons.length) errors.push("Khóa học chưa có bài học nào.");
  for (const l of lessons) {
    if (!l.blocks.length) warnings.push(`Bài "${l.title}" chưa có nội dung.`);
    for (const b of l.blocks) {
      if (b.kind === "simulation" && !b.labSlug) errors.push(`Bài "${l.title}": khối mô phỏng chưa chọn mô phỏng.`);
      if (b.kind === "python" && !b.exerciseId) errors.push(`Bài "${l.title}": khối Python chưa chọn bài thực hành.`);
      if (b.kind === "practice" && !b.practiceSetId) errors.push(`Bài "${l.title}": khối luyện tập chưa chọn bộ câu hỏi.`);
      if (b.kind === "media" && !b.mediaUrl && !b.file) errors.push(`Bài "${l.title}": khối video/hình chưa có đường dẫn hoặc tệp.`);
      if (b.kind === "file" && !b.file) errors.push(`Bài "${l.title}": khối tài liệu chưa có tệp.`);
    }
  }
  return { errors, warnings };
}

/** Chuyển link YouTube thường sang link nhúng (youtube-nocookie); link khác giữ nguyên. */
export function youtubeEmbed(url: string): string | null {
  const m = /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/.exec(url);
  return m ? `https://www.youtube-nocookie.com/embed/${m[1]}` : null;
}
