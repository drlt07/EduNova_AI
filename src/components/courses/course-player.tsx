"use client";
import type { Topic } from "@/lib/ai/tutor";
import { TutorScope } from "@/components/tutor/tutor-provider";
import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, Circle, Lock, Unlock } from "lucide-react";
import type { Course, CourseProgress, PracticeAttempt } from "@/lib/domain/types";
import { bestPracticeScore, courseCompletion, isBlockDone, lessonStates, type ProgressContext } from "@/lib/courses/course";
import { getLesson } from "@/lib/data/curriculum";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState, Progress } from "@/components/ui/feedback";
import { BlockView } from "./block-view";

export interface CoursePlayerProps {
  course: Course;
  studentId: string;
  progress?: CourseProgress;
  practiceAttempts: PracticeAttempt[];
  preview?: boolean;
  codeFor?: (exerciseId: string) => string | undefined;
  onMark: (blockId: string, done: boolean, score?: number) => void;
  onOpenLesson?: (lessonId: string) => void;
  onPythonTests?: (exerciseId: string, passed: number, total: number, code: string, errorType?: string) => void;
  onPythonSave?: (exerciseId: string, code: string) => void;
}

/** Chủ đề của gia sư theo bài trong chương trình (L-10-if-kntt → if). */
function topicOf(lessonId?: string): Topic {
  if (!lessonId) return "general";
  if (lessonId.includes("-if-")) return "if";
  if (lessonId.includes("-loop-")) return "loop";
  if (lessonId.includes("-binary-")) return "binary";
  if (lessonId.includes("-debug-")) return "test";
  return "general";
}

/** Khung học khóa học: cây chủ đề/bài bên trái (trạng thái khóa, hoàn thành), nội dung bài bên phải. */
export function CoursePlayer({ course, studentId, progress, practiceAttempts, preview = false, codeFor, onMark, onOpenLesson, onPythonTests, onPythonSave }: CoursePlayerProps) {
  const ctx: ProgressContext = useMemo(() => ({ progress, practiceAttempts, studentId }), [progress, practiceAttempts, studentId]);
  const states = useMemo(() => lessonStates(course, ctx), [course, ctx]);
  const completion = courseCompletion(course, ctx);
  const [currentId, setCurrentId] = useState<string | undefined>(() => {
    const last = states.find((s) => s.lesson.id === progress?.lastLessonId && !s.locked);
    return (last ?? states.find((s) => !s.done && !s.locked) ?? states[0])?.lesson.id;
  });
  const idx = states.findIndex((s) => s.lesson.id === currentId);
  const cur = states[idx];

  function open(id: string) {
    setCurrentId(id);
    onOpenLesson?.(id);
    document.getElementById("course-lesson")?.scrollIntoView({ block: "start", behavior: "smooth" });
  }

  if (!states.length) return <EmptyState title="Khóa học chưa có bài" description="Giáo viên chưa thêm bài học vào khóa học này." />;

  return (
    <div className="grid gap-5 lg:grid-cols-[300px_minmax(0,1fr)]">
      <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
        <div className="rounded-2xl border border-line bg-surface p-4">
          <p className="text-sm font-medium text-fg">Hoàn thành {completion.done}/{completion.total} bài</p>
          <Progress value={completion.percent} className="mt-2" tone="success" label="Tiến độ khóa học" />
          {course.sequential && <p className="mt-2 text-xs text-muted">Học lần lượt: hoàn thành bài trước để mở bài sau.</p>}
        </div>
        <nav aria-label="Mục lục khóa học" className="max-h-[70vh] space-y-3 overflow-y-auto rounded-2xl border border-line bg-surface p-3">
          {course.topics.map((t) => (
            <div key={t.id}>
              <p className="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-muted">{t.title}</p>
              <ul className="space-y-0.5">
                {t.lessons.map((l) => {
                  const st = states.find((s) => s.lesson.id === l.id)!;
                  const Icon = st.locked ? Lock : st.done ? CheckCircle2 : st.lesson.alwaysOpen && course.sequential ? Unlock : Circle;
                  return (
                    <li key={l.id}>
                      <button
                        type="button"
                        disabled={st.locked}
                        onClick={() => open(l.id)}
                        aria-current={l.id === currentId ? "true" : undefined}
                        title={st.locked ? "Hoàn thành bài trước để mở bài này" : undefined}
                        className={cn("flex w-full items-start gap-2 rounded-lg px-2 py-2 text-left text-sm disabled:cursor-not-allowed disabled:opacity-55", l.id === currentId ? "bg-cyan/10 text-fg" : "text-fg hover:bg-surface-2")}
                      >
                        <Icon className={cn("mt-0.5 size-4 shrink-0", st.done ? "text-success-fg" : "text-muted")} aria-label={st.locked ? "đang khóa" : st.done ? "đã hoàn thành" : undefined} />
                        <span className="min-w-0 flex-1">{l.title}</span>
                        {l.blocks.length > 0 && <span className="text-xs text-muted">{st.doneBlocks}/{l.blocks.length}</span>}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </aside>

      <div id="course-lesson" className="min-w-0 scroll-mt-24 space-y-4">
        {cur && (
          <>
            <div className="rounded-2xl border border-line bg-surface p-5">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-bold text-fg">{cur.lesson.title}</h2>
                {cur.done && <Badge tone="success">Hoàn thành bài</Badge>}
              </div>
              {cur.lesson.lessonId && <p className="mt-1 text-sm text-muted">Theo chương trình: {getLesson(cur.lesson.lessonId)?.title}</p>}
            </div>
            {cur.lesson.blocks.length === 0 && <EmptyState title="Bài chưa có nội dung" description="Giáo viên sẽ bổ sung nội dung cho bài này." />}
            {cur.lesson.blocks.map((b) => (
              <TutorScope key={b.id} title={`${cur.lesson.title} – ${b.title}`} topic={topicOf(cur.lesson.lessonId)} level={b.tutorLevel ?? "guided"}>
              <BlockView
                block={b}
                done={isBlockDone(b, ctx)}
                preview={preview}
                bestPractice={b.practiceSetId ? bestPracticeScore(practiceAttempts, studentId, b.practiceSetId) : null}
                initialCode={b.exerciseId ? codeFor?.(b.exerciseId) : undefined}
                onMark={(done, score) => onMark(b.id, done, score)}
                onPythonTests={(p, t, c, e) => b.exerciseId && onPythonTests?.(b.exerciseId, p, t, c, e)}
                onPythonSave={(c) => b.exerciseId && onPythonSave?.(b.exerciseId, c)}
              />
              </TutorScope>
            ))}
            <div className="flex flex-wrap justify-between gap-2">
              <Button variant="secondary" disabled={idx <= 0} onClick={() => open(states[idx - 1].lesson.id)}><ArrowLeft /> Bài trước</Button>
              {idx < states.length - 1 && (
                <Button disabled={states[idx + 1].locked} onClick={() => open(states[idx + 1].lesson.id)} title={states[idx + 1].locked ? "Hoàn thành bài này để mở bài tiếp theo" : undefined}>
                  Bài tiếp theo <ArrowRight />
                </Button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
