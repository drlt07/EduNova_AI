import type { ClassRoom, Enrollment, User } from "@/lib/domain/types";

const u = (id: string, role: User["role"], name: string, hue: number): User => ({
  id,
  role,
  name,
  hue,
  email: `${id}@demo.edunova.vn`,
});

/** Người dùng mẫu — tên hư cấu, email domain demo. */
export const SEED_USERS: User[] = [
  u("t1", "teacher", "Trần Thu Hà", 190),
  u("t2", "teacher", "Phạm Quốc Bảo", 260),
  u("a1", "admin", "Nguyễn Hoàng Lan", 300),
  u("s1", "student", "Lê Minh Khang", 200),
  u("s2", "student", "Nguyễn Thảo Vy", 330),
  u("s3", "student", "Đỗ Gia Huy", 30),
  u("s4", "student", "Trần Ngọc Ánh", 150),
  u("s5", "student", "Phan Đức Long", 220),
  u("s6", "student", "Vũ Khánh Linh", 280),
  u("s7", "student", "Bùi Anh Tuấn", 60),
  u("s8", "student", "Hoàng Mai Chi", 350),
  u("s9", "student", "Đặng Quang Minh", 100),
  u("s10", "student", "Lý Bảo Ngọc", 310),
  u("s11", "student", "Ngô Thanh Sơn", 170),
  u("s12", "student", "Mai Phương Thảo", 240),
  u("s13", "student", "Cao Hữu Phước", 20),
  u("s14", "student", "Trịnh Thu Trang", 290),
  u("s15", "student", "Đinh Nhật Nam", 130),
  u("s16", "student", "Lương Gia Bảo", 210),
  u("s17", "student", "Hà Thùy Dung", 340),
  u("s18", "student", "Tạ Minh Trí", 80),
];

export const DEMO_ACCOUNTS = { teacher: "t1", student: "s1", admin: "a1" } as const;

export const SEED_CLASSES: ClassRoom[] = [
  { id: "c-10a1", name: "10A1", grade: 10, teacherId: "t1", schoolYear: "2026–2027", inviteCode: "TIN10A1-7KQ", textbookId: "kntt", pathway: "chung", schedule: [{ weekday: 1, period: "Tiết 2", room: "P. Tin 1" }, { weekday: 4, period: "Tiết 3", room: "P. Tin 1" }] },
  { id: "c-11a2", name: "11A2", grade: 11, teacherId: "t1", schoolYear: "2026–2027", inviteCode: "TIN11A2-M3X", textbookId: "kntt", pathway: "CS", schedule: [{ weekday: 2, period: "Tiết 4", room: "P. Tin 2" }] },
  { id: "c-12a3", name: "12A3", grade: 12, teacherId: "t1", schoolYear: "2026–2027", inviteCode: "TIN12A3-P8D", textbookId: "cd", pathway: "ICT", schedule: [{ weekday: 3, period: "Tiết 1", room: "P. Tin 1" }, { weekday: 5, period: "Tiết 2", room: "P. Tin 2" }] },
  { id: "c-10a2", name: "10A2", grade: 10, teacherId: "t2", schoolYear: "2026–2027", inviteCode: "TIN10A2-Z4R", textbookId: "ctst", pathway: "chung", schedule: [{ weekday: 2, period: "Tiết 1", room: "P. Tin 3" }] },
];

const roster: Record<string, string[]> = {
  "c-10a1": ["s1", "s2", "s3", "s4", "s5", "s6", "s7", "s8"],
  "c-11a2": ["s9", "s10", "s11", "s12"],
  "c-12a3": ["s13", "s14", "s15"],
  "c-10a2": ["s16", "s17", "s18"],
};

export const SEED_ENROLLMENTS: Enrollment[] = Object.entries(roster).flatMap(([classId, ids]) =>
  ids.map((studentId) => ({ id: `en-${classId}-${studentId}`, classId, studentId })),
);
