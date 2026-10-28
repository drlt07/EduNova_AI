"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, BookMarked, CheckCircle2, FileText, FlaskConical, Trophy } from "lucide-react";
import type { Grade } from "@/lib/domain/types";
import { ALGO_IDS } from "@/lib/data/hsg";
import { BOOKS, bookEntry, bookLessons, bookOf, contentCount, lessonSimSlugs } from "@/lib/sgk/book";
import { teacherClasses } from "@/lib/store/scoped";
import { useSessionData } from "@/lib/store/use-role";
import { cn, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { AlgoThumb } from "@/components/algo/hsg-catalog";
import { BookCover } from "./book-cover";

type Role = "teacher" | "student";
const base = (role: Role) => (role === "teacher" ? "/teacher/sgk" : "/student/sgk");

/** Bài đọc gần nhất của người dùng, để "tiếp tục". */
function useLastRead() {
  const { d, user } = useSessionData();
  const last = d.bookProgress.filter((p) => p.userId === user.id).sort((a, b) => b.at.localeCompare(a.at))[0];
  return last && { p: last, e: bookEntry(last.ref) };
}

export function SgkLibrary({ role }: { role: Role }) {
  const params = useSearchParams();
  const g = Number(params.get("lop"));
  if (g === 10 || g === 11 || g === 12) return <BookToc grade={g} role={role} />;
  return <Shelf role={role} />;
}

function Shelf({ role }: { role: Role }) {
  const { d, user } = useSessionData();
  const last = useLastRead();
  const teacher = role === "teacher";
  const myGrades = teacher ? [...new Set(teacherClasses(d, user.id).map((c) => c.grade))] : [...new Set(d.classes.filter((c) => d.enrollments.some((e) => e.classId === c.id && e.studentId === user.id)).map((c) => c.grade))];
  const lastSection = last?.e?.content?.sections.find((s) => s.id === last.p.last);
  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-fg">Sách giáo khoa số</h1>
          <p className="mt-1 text-muted">{teacher ? "Đọc, trình chiếu, chọn học liệu và giao nhiệm vụ ngay trong từng bài." : "Đọc bài, làm mô phỏng và câu hỏi củng cố ngay trong sách."}</p>
        </div>
        {teacher && <Button asChild variant="ghost"><Link href="/teacher/courses"><BookMarked /> Khóa học thầy cô đã soạn</Link></Button>}
      </div>

      {last?.e && (
        <Link href={`${base(role)}/${last.e.ref}${last.p.last ? `#muc-${last.p.last}` : ""}`} className="group mb-8 flex items-center gap-4 rounded-2xl border border-line bg-surface p-4 transition-colors hover:border-cyan/50">
          <BookCover grade={last.e.grade} className="h-24 w-auto shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-cyan-fg">{teacher ? "Tiếp tục bài dạy" : "Đọc tiếp"}</p>
            <p className="mt-0.5 text-lg font-bold text-fg">Bài {last.e.lesson.no}. {last.e.lesson.title}</p>
            <p className="text-sm text-muted">{bookOf(last.e.grade).title}{lastSection ? ` · đang ở mục “${lastSection.title}”` : ""} · {formatDate(last.p.at)}</p>
          </div>
          <ArrowRight className="size-5 shrink-0 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-cyan-fg" aria-hidden />
        </Link>
      )}

      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted">Kệ sách</h2>
      <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {BOOKS.map((b) => {
          const total = bookLessons(b.grade).length;
          const taught = teacher ? new Set(d.taughtLessons.filter((t) => t.teacherId === user.id && t.ref.startsWith(`${b.grade}-`)).map((t) => t.ref)).size : 0;
          const read = !teacher ? d.bookProgress.filter((p) => p.userId === user.id && p.ref.startsWith(`${b.grade}-`)).length : 0;
          const mine = myGrades.includes(b.grade);
          return (
            <li key={b.grade}>
              <Link href={`${base(role)}?lop=${b.grade}`} className="group block">
                <div className="relative mx-auto w-fit transition-transform duration-300 group-hover:-translate-y-1 group-hover:rotate-[-1deg]">
                  <BookCover grade={b.grade} className="h-64 w-auto" />
                  {mine && <span className="absolute -right-2 -top-2 rounded-full bg-fg px-2 py-0.5 text-[11px] font-semibold text-bg">{teacher ? "Lớp của tôi" : "Lớp em"}</span>}
                </div>
                <p className="mt-3 text-center font-semibold text-fg group-hover:text-cyan-fg">{b.title}</p>
                <p className="text-center text-xs text-muted">{b.subtitle}</p>
                <p className="mt-1 text-center text-xs text-muted">{total} bài · {contentCount(b.grade)} bài có nội dung số{teacher ? ` · đã dạy ${taught}` : read ? ` · em đã mở ${read}` : ""}</p>
              </Link>
            </li>
          );
        })}
        <li>
          <Link href="/thuat-toan" className="group block">
            <div className="mx-auto flex h-64 w-[192px] flex-col justify-between rounded-r-lg rounded-l-sm bg-[#3a2a0c] p-4 shadow-[0_18px_40px_-18px_rgba(0,0,0,0.55)] transition-transform duration-300 group-hover:-translate-y-1">
              <div><p className="text-[10px] tracking-[2px] text-amber-100/70">CHUYÊN ĐỀ</p><p className="mt-1 text-lg font-extrabold text-amber-50">BỒI DƯỠNG HSG</p></div>
              <div className="grid grid-cols-2 gap-2">{(["bubble", "bfs", "dijkstra", "knapsack"] as const).map((id) => <AlgoThumb key={id} id={id} className="h-auto w-full rounded-md bg-white/90" />)}</div>
              <p className="text-[10px] font-bold text-amber-50">EduNova</p>
            </div>
            <p className="mt-3 text-center font-semibold text-fg group-hover:text-cyan-fg">Chuyên đề HSG</p>
            <p className="text-center text-xs text-muted">{ALGO_IDS.length} thuật toán chạy từng bước</p>
          </Link>
        </li>
      </ul>
    </div>
  );
}

function BookToc({ grade, role }: { grade: Grade; role: Role }) {
  const { d, user } = useSessionData();
  const teacher = role === "teacher";
  const book = bookOf(grade);
  const lessons = bookLessons(grade);
  const classes = teacher ? teacherClasses(d, user.id).filter((c) => c.grade === grade) : [];
  const topics = [...new Map(lessons.map((l) => [l.topic.no, l.topic])).values()];
  return (
    <div>
      <Link href={base(role)} className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-muted hover:text-fg"><ArrowLeft className="size-4" aria-hidden /> Kệ sách</Link>
      <div className="mb-8 flex flex-wrap items-end gap-6">
        <BookCover grade={grade} className="h-48 w-auto" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-muted">Sách giáo khoa số</p>
          <h1 className="text-4xl font-bold tracking-tight text-fg">{book.title}</h1>
          <p className="mt-1 text-muted">{book.subtitle}</p>
          <p className="mt-3 text-sm text-fg">{topics.length} chủ đề · {lessons.length} bài · <b>{contentCount(grade)}</b> bài đã có nội dung số, mô phỏng và câu hỏi củng cố</p>
          {grade !== 10 && <p className="mt-1 text-xs text-muted">Gồm phần chung cho mọi học sinh; phần theo định hướng ICT/CS sẽ bổ sung.</p>}
        </div>
      </div>

      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">Mục lục</h2>
      <div className="space-y-8">
        {topics.map((t) => (
          <section key={t.no} aria-labelledby={`cd-${t.no}`}>
            <h3 id={`cd-${t.no}`} className="border-b-2 border-fg pb-1 text-lg font-bold text-fg">Chủ đề {t.no}. {t.title}</h3>
            <ol className="divide-y divide-line">
              {lessons.filter((l) => l.topic.no === t.no).map((l) => {
                const sims = lessonSimSlugs(l).length;
                const read = d.bookProgress.find((p) => p.userId === user.id && p.ref === l.ref);
                return (
                  <li key={l.ref}>
                    <Link href={`${base(role)}/${l.ref}`} className="group flex flex-wrap items-baseline gap-x-3 gap-y-1 py-2.5">
                      <span className="w-14 shrink-0 text-sm font-semibold tabular-nums text-muted">Bài {l.lesson.no}</span>
                      <span className={cn("min-w-0 flex-1 font-medium group-hover:text-cyan-fg", l.content ? "text-fg" : "text-fg/60")}>{l.lesson.title}</span>
                      <span className="flex flex-wrap items-center gap-2 text-xs text-muted">
                        {l.content ? <span className="inline-flex items-center gap-1 text-success-fg"><FileText className="size-3.5" aria-hidden /> Nội dung số</span> : <span>Chưa có nội dung số</span>}
                        {sims > 0 && <span className="inline-flex items-center gap-1 text-cyan-fg"><FlaskConical className="size-3.5" aria-hidden /> {sims} mô phỏng</span>}
                        {teacher && classes.map((c) => d.taughtLessons.some((x) => x.teacherId === user.id && x.classId === c.id && x.ref === l.ref) && <span key={c.id} className="inline-flex items-center gap-0.5 rounded bg-success/15 px-1.5 font-semibold text-success-fg"><CheckCircle2 className="size-3" aria-hidden /> {c.name}</span>)}
                        {!teacher && read && l.content && <span className="font-semibold text-success-fg">đã đọc {read.read.length}/{l.content.sections.length}</span>}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ol>
          </section>
        ))}
        <section>
          <h3 className="border-b-2 border-fg pb-1 text-lg font-bold text-fg">Mở rộng</h3>
          <Link href="/thuat-toan" className="group flex items-center gap-3 py-3"><Trophy className="size-4 text-warning-fg" aria-hidden /><span className="font-medium text-fg group-hover:text-cyan-fg">Chuyên đề bồi dưỡng học sinh giỏi</span></Link>
        </section>
      </div>
    </div>
  );
}
