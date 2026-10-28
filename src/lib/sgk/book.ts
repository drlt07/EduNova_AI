import type { Grade } from "@/lib/domain/types";
import { SGK_KNTT, findSgk, sgkLabs, sgkRef, type SgkLesson, type SgkTopic } from "@/lib/data/sgk-kntt";
import type { BookBlock, BookLesson } from "./types";
import { G10 } from "./content/g10";
import { G11 } from "./content/g11";
import { G12 } from "./content/g12";

const CONTENT = new Map<string, BookLesson>([...G10, ...G11, ...G12].map((l) => [l.ref, l]));

export interface BookMeta {
  grade: Grade;
  title: string;
  subtitle: string;
  /** Màu bìa: nền, chữ nhấn. */
  cover: { bg: string; ink: string; accent: string };
}

export const BOOKS: BookMeta[] = [
  { grade: 10, title: "Tin học 10", subtitle: "Dữ liệu, mạng và lập trình Python", cover: { bg: "#0f3d4a", ink: "#e6fbff", accent: "#22d3ee" } },
  { grade: 11, title: "Tin học 11", subtitle: "Máy tính, hệ điều hành và cơ sở dữ liệu", cover: { bg: "#1e2a5a", ink: "#eef2ff", accent: "#818cf8" } },
  { grade: 12, title: "Tin học 12", subtitle: "Trí tuệ nhân tạo, mạng và thiết kế web", cover: { bg: "#3b1f4f", ink: "#faf5ff", accent: "#e879f9" } },
];

export const bookOf = (g: Grade) => BOOKS.find((b) => b.grade === g)!;

export interface BookEntry {
  ref: string;
  grade: Grade;
  topic: SgkTopic;
  lesson: SgkLesson;
  content?: BookLesson;
}

export function bookEntry(ref: string): BookEntry | undefined {
  const f = findSgk(ref);
  return f && { ref, ...f, content: CONTENT.get(ref) };
}

export function bookLessons(g: Grade): BookEntry[] {
  return SGK_KNTT[g].flatMap((topic) => topic.lessons.map((lesson) => ({ ref: sgkRef(g, lesson), grade: g, topic, lesson, content: CONTENT.get(sgkRef(g, lesson)) })));
}

export function neighbors(ref: string): { prev?: BookEntry; next?: BookEntry } {
  const e = bookEntry(ref);
  if (!e) return {};
  const all = bookLessons(e.grade);
  const i = all.findIndex((x) => x.ref === ref);
  return { prev: all[i - 1], next: all[i + 1] };
}

export const hasContent = (ref: string) => CONTENT.has(ref);
export const contentCount = (g: Grade) => bookLessons(g).filter((e) => e.content).length;

/** Các mô phỏng nằm trong bài: đặt trong nội dung trước, rồi mô phỏng gắn theo chương trình. */
export function lessonSimSlugs(e: BookEntry): string[] {
  const inline = (e.content?.sections ?? []).flatMap((s) => s.blocks.flatMap((b) => (b.t === "sim" ? [b.slug] : [])));
  return [...new Set([...inline, ...sgkLabs(e.lesson).map((l) => l.slug)])];
}

export type CheckBlock = Extract<BookBlock, { t: "check" }>;
export function lessonChecks(l: BookLesson): (CheckBlock & { sectionId: string })[] {
  return l.sections.flatMap((s) => s.blocks.flatMap((b) => (b.t === "check" ? [{ ...b, sectionId: s.id }] : [])));
}

/** Mã một mục trong bài để ghi chú, chọn dùng khi dạy: "10-19#if-else". */
export const itemKey = (ref: string, sectionId: string) => `${ref}#${sectionId}`;
