import { describe, expect, it } from "vitest";
import { classToRow, cloudErrorVi, enrollmentId, parseEnrollmentId, rowToClass, rowToEnrollment } from "@/lib/cloud/mapping";
import { emptyData } from "@/lib/data/seed";
import { useApp } from "@/lib/store/app-store";

const row = { id: "c1", name: "10A1", grade: 10, teacher_id: "t", school_year: "2026-2027", invite_code: "TIN10A1-ABC", textbook_id: null, pathway: "chung", schedule: null };

describe("đồng bộ Supabase: chuyển đổi dữ liệu", () => {
  it("dòng lớp → lớp của giao diện, thiếu sách/lịch thì dùng mặc định", () => {
    const c = rowToClass(row);
    expect(c).toMatchObject({ id: "c1", teacherId: "t", inviteCode: "TIN10A1-ABC", textbookId: "kntt", schedule: [] });
    expect(rowToClass({ ...row, textbook_id: "cd", schedule: [{ weekday: 2, period: "Tiết 1", room: "P1" }] })).toMatchObject({ textbookId: "cd", schedule: [{ room: "P1" }] });
  });

  it("chỉ ghi cột có trong bản sửa", () => {
    expect(classToRow({ name: "10A2" })).toEqual({ name: "10A2" });
    expect(classToRow(rowToClass(row))).toMatchObject({ teacher_id: "t", invite_code: "TIN10A1-ABC", schedule: [] });
  });

  it("ghi danh dùng id ghép lớp:học sinh, tách lại được", () => {
    const e = rowToEnrollment({ class_id: "c1", student_id: "s1" });
    expect(e).toEqual({ id: enrollmentId("c1", "s1"), classId: "c1", studentId: "s1" });
    expect(parseEnrollmentId(e.id)).toEqual({ class_id: "c1", student_id: "s1" });
    expect(parseEnrollmentId("en-cu")).toBeNull();
  });

  it("lỗi máy chủ thành câu tiếng Việt", () => {
    expect(cloudErrorVi({ code: "23505", message: "duplicate key" })).toMatch(/trùng/);
    expect(cloudErrorVi({ message: "new row violates row-level security policy" })).toMatch(/không có quyền/);
    expect(cloudErrorVi({ message: "Mã lớp không đúng" })).toMatch(/Mã lớp không đúng/);
  });

  it("dữ liệu trống cho bản thật: không có người dùng/lớp/bài mẫu", () => {
    const d = emptyData();
    expect([d.users.length, d.classes.length, d.assignments.length, d.labResults.length]).toEqual([0, 0, 0, 0]);
    expect(d.kho.featured.length).toBeGreaterThan(0);
  });
});

describe("vào lớp bằng mã (bản dùng thử)", () => {
  it("mã đúng (không phân biệt hoa thường, khoảng trắng) thì vào lớp, mã sai trả về null, không ghi trùng", () => {
    const s = useApp.getState();
    const cls = s.classes[0];
    expect(s.joinClassLocal("s-moi", "SAI-MA")).toBeNull();
    expect(s.joinClassLocal("s-moi", ` ${cls.inviteCode.toLowerCase()} `)).toBe(cls.id);
    s.joinClassLocal("s-moi", cls.inviteCode);
    expect(useApp.getState().enrollments.filter((e) => e.studentId === "s-moi")).toHaveLength(1);
  });
});
