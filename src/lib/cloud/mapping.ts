/**
 * Chuyển đổi giữa dòng trong bảng Supabase và kiểu dữ liệu của giao diện (thuần, không gọi mạng).
 */
import type { ClassRoom, Enrollment, Grade, Pathway, TextbookId } from "@/lib/domain/types";

export interface ClassRow {
  id: string;
  name: string;
  grade: number;
  teacher_id: string;
  school_year: string;
  invite_code: string;
  textbook_id: string | null;
  pathway: string;
  schedule: ClassRoom["schedule"] | null;
}
export interface EnrollmentRow { class_id: string; student_id: string }

export const CLASS_COLUMNS = "id, name, grade, teacher_id, school_year, invite_code, textbook_id, pathway, schedule";

const BOOKS: TextbookId[] = ["kntt", "cd", "ctst"];

export function rowToClass(r: ClassRow): ClassRoom {
  return {
    id: r.id,
    name: r.name,
    grade: r.grade as Grade,
    teacherId: r.teacher_id,
    schoolYear: r.school_year,
    inviteCode: r.invite_code,
    textbookId: BOOKS.includes(r.textbook_id as TextbookId) ? (r.textbook_id as TextbookId) : "kntt",
    pathway: r.pathway as Pathway,
    schedule: Array.isArray(r.schedule) ? r.schedule : [],
  };
}

/** Chỉ các cột có trong patch (để update không ghi đè cột khác). */
export function classToRow(c: Partial<ClassRoom>): Partial<ClassRow> {
  const r: Partial<ClassRow> = {};
  if (c.id !== undefined) r.id = c.id;
  if (c.name !== undefined) r.name = c.name;
  if (c.grade !== undefined) r.grade = c.grade;
  if (c.teacherId !== undefined) r.teacher_id = c.teacherId;
  if (c.schoolYear !== undefined) r.school_year = c.schoolYear;
  if (c.inviteCode !== undefined) r.invite_code = c.inviteCode;
  if (c.textbookId !== undefined) r.textbook_id = c.textbookId;
  if (c.pathway !== undefined) r.pathway = c.pathway;
  if (c.schedule !== undefined) r.schedule = c.schedule;
  return r;
}

/** Ghi danh không có id riêng trong bảng (khóa chính là lớp + học sinh) → id ghép. */
export const enrollmentId = (classId: string, studentId: string) => `${classId}:${studentId}`;
export const rowToEnrollment = (r: EnrollmentRow): Enrollment => ({ id: enrollmentId(r.class_id, r.student_id), classId: r.class_id, studentId: r.student_id });
export function parseEnrollmentId(id: string): EnrollmentRow | null {
  const [class_id, student_id] = id.split(":");
  return class_id && student_id ? { class_id, student_id } : null;
}

/** Lỗi Supabase/PostgreSQL → câu tiếng Việt cho người dùng. */
export function cloudErrorVi(e: { message?: string; code?: string } | null | undefined): string {
  const m = e?.message ?? "";
  if (e?.code === "23505" || /duplicate key/i.test(m)) return "Mã mời đã trùng với lớp khác, hãy tạo mã mới.";
  if (e?.code === "42501" || /row-level security|permission denied/i.test(m)) return "Tài khoản này không có quyền thực hiện thao tác đó.";
  if (/Mã lớp không đúng/.test(m)) return "Mã lớp không đúng. Hỏi thầy cô mã mời của lớp.";
  if (/Chỉ học sinh/.test(m)) return "Chỉ tài khoản học sinh mới vào lớp bằng mã mời.";
  if (/fetch|network/i.test(m)) return "Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.";
  return m || "Có lỗi khi lưu lên máy chủ.";
}
