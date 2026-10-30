/**
 * Đồng bộ phần còn lại của kho dữ liệu với Supabase (giai đoạn 2, bảng app_records): bài giao, bài nộp, chấm điểm,
 * kết quả mô phỏng, luyện tập, tiến độ, ghi chú, khóa học, nội dung đã mở cho lớp…
 * Mỗi bản ghi là một dòng (kind, id) chứa nguyên dữ liệu JSON, kèm chủ sở hữu và phạm vi chia sẻ; RLS trên máy chủ
 * quyết định ai đọc/ghi được (xem supabase/migrations/20261031000000_app_records.sql).
 * Phần tính toán (gom bản ghi, so chênh lệch, dựng lại kho) là hàm thuần để kiểm thử; phần mạng nằm ở records-sync.ts.
 */
import type { DemoData } from "@/lib/data/seed";

type State = DemoData;
type Item = Record<string, unknown>;

interface ListSpec {
  kind: keyof State;
  key: (x: Item) => string;
  owner: (x: Item, s: State) => unknown;
  /** Học sinh của người tạo được đọc (bài giao, khóa học…). */
  shared?: (x: Item) => boolean;
  /** Chia sẻ cho những lớp nào (rỗng: mọi lớp của người tạo). */
  classIds?: (x: Item) => unknown[];
}

const id = (x: Item) => String(x.id);
const by = (f: string) => (x: Item) => x[f];
const join = (...fs: string[]) => (x: Item) => fs.map((f) => String(x[f])).join("|");
const always = () => true;
const one = (f: string) => (x: Item) => [x[f]];
const many = (f: string) => (x: Item) => (Array.isArray(x[f]) ? (x[f] as unknown[]) : []);

/** Các loại dữ liệu dạng danh sách được đồng bộ. Người dùng, lớp, ghi danh đi qua bảng riêng (sync.ts). */
export const LIST_SPECS: ListSpec[] = [
  // Giáo viên tạo, học sinh được xem
  { kind: "assignments", key: id, owner: by("ownerId"), shared: always, classIds: one("classId") },
  { kind: "courses", key: id, owner: by("ownerId"), shared: (x) => x.status === "published", classIds: many("classIds") },
  { kind: "unlocks", key: join("classId", "key"), owner: by("by"), shared: always, classIds: one("classId") },
  { kind: "teacherQuizzes", key: id, owner: by("ownerId"), shared: (x) => x.status === "published", classIds: many("classIds") },
  { kind: "labConfigs", key: id, owner: by("ownerId"), shared: always },
  { kind: "rubrics", key: id, owner: by("ownerId"), shared: always },
  { kind: "activities", key: id, owner: by("ownerId"), shared: always },
  { kind: "resources", key: id, owner: by("ownerId"), shared: always },
  { kind: "lessonLabs", key: join("ownerId", "sgkRef", "slug"), owner: by("ownerId"), shared: always },
  // Giáo viên dùng riêng
  { kind: "lessonPlans", key: id, owner: by("ownerId") },
  { kind: "lessonPlanVersions", key: id, owner: by("authorId") },
  { kind: "activityDrafts", key: id, owner: by("ownerId") },
  { kind: "taughtLessons", key: join("teacherId", "classId", "ref"), owner: by("teacherId") },
  // Học sinh làm, giáo viên lớp xem và chấm
  { kind: "submissions", key: id, owner: by("studentId") },
  { kind: "assessments", key: id, owner: (x, s) => s.submissions.find((u) => u.id === x.submissionId)?.studentId ?? x.teacherId },
  { kind: "labResults", key: id, owner: by("studentId") },
  { kind: "practiceAttempts", key: id, owner: by("studentId") },
  { kind: "attempts", key: id, owner: by("studentId") },
  { kind: "codeWorks", key: id, owner: by("studentId") },
  { kind: "gameProgress", key: join("studentId", "gameSlug"), owner: by("studentId") },
  { kind: "courseProgress", key: join("studentId", "courseId"), owner: by("studentId") },
  { kind: "lessonProgress", key: join("studentId", "lessonId"), owner: by("studentId") },
  { kind: "projects", key: id, owner: by("studentId") },
  { kind: "portfolio", key: id, owner: by("studentId") },
  { kind: "tutorEvents", key: id, owner: by("studentId") },
  { kind: "notes", key: id, owner: by("studentId") },
  { kind: "bookmarks", key: id, owner: by("studentId") },
  // Của từng người dùng
  { kind: "bookNotes", key: id, owner: by("userId") },
  { kind: "bookProgress", key: join("userId", "ref"), owner: by("userId") },
  { kind: "bookPicks", key: join("userId", "key"), owner: by("userId") },
  { kind: "reports", key: id, owner: by("userId") },
  { kind: "aiInteractions", key: id, owner: by("userId") },
];
/** Dữ liệu dạng bảng tra theo người dùng: mỗi người một bản ghi. */
export const MAP_KINDS = ["prefs", "notifRead"] as const satisfies readonly (keyof State)[];

export interface RecordRow { kind: string; id: string; owner_id: string; shared: boolean; class_ids: string[]; data: unknown }

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isUuid = (v: unknown): v is string => typeof v === "string" && UUID.test(v);
export const rowKey = (kind: string, key: string) => `${kind}\u0000${key}`;

/** Gom mọi bản ghi cần đồng bộ trong kho thành các dòng app_records (bỏ bản ghi thiếu chủ sở hữu hợp lệ). */
export function collectRows(s: State): Map<string, RecordRow> {
  const out = new Map<string, RecordRow>();
  for (const sp of LIST_SPECS) {
    for (const x of (s[sp.kind] as unknown as Item[] | undefined) ?? []) {
      const owner = sp.owner(x, s);
      if (!isUuid(owner)) continue;
      const k = sp.key(x);
      out.set(rowKey(sp.kind, k), { kind: sp.kind, id: k, owner_id: owner, shared: sp.shared?.(x) ?? false, class_ids: (sp.classIds?.(x) ?? []).filter(isUuid), data: x });
    }
  }
  for (const kind of MAP_KINDS) {
    for (const [uid, v] of Object.entries((s[kind] as Record<string, unknown> | undefined) ?? {})) {
      if (isUuid(uid)) out.set(rowKey(kind, uid), { kind, id: uid, owner_id: uid, shared: false, class_ids: [], data: v });
    }
  }
  return out;
}

/** Ảnh chụp để so: khóa dòng → JSON của dòng. */
export type Snapshot = Map<string, string>;
export const snapshotOf = (rows: Iterable<RecordRow>): Snapshot => new Map([...rows].map((r) => [rowKey(r.kind, r.id), JSON.stringify(r)]));

/**
 * Những gì cần đẩy lên: dòng mới hoặc đã đổi so với ảnh chụp lần đồng bộ trước, nếu người dùng được phép ghi
 * (của mình, hoặc của học sinh lớp mình khi là giáo viên); dòng của mình đã biến mất thì xóa.
 */
export function diffRows(prev: Snapshot, next: Map<string, RecordRow>, me: string, myStudents: Set<string>) {
  const upserts: RecordRow[] = [];
  const deletes: { kind: string; id: string }[] = [];
  for (const [k, row] of next) {
    if (prev.get(k) === JSON.stringify(row)) continue;
    if (row.owner_id === me || myStudents.has(row.owner_id)) upserts.push(row);
  }
  for (const [k, json] of prev) {
    if (next.has(k)) continue;
    const row = JSON.parse(json) as RecordRow;
    if (row.owner_id === me) deletes.push({ kind: row.kind, id: row.id });
  }
  return { upserts, deletes };
}

/** Dựng lại các phần của kho từ những dòng tải về (máy chủ là nguồn đúng cho các loại được đồng bộ). */
export function rowsToPatch(rows: RecordRow[]): Partial<State> {
  const patch: Record<string, unknown> = {};
  for (const sp of LIST_SPECS) patch[sp.kind] = [];
  for (const kind of MAP_KINDS) patch[kind] = {};
  for (const r of rows) {
    const cur = patch[r.kind];
    if (Array.isArray(cur)) cur.push(r.data);
    else if (cur && typeof cur === "object") (cur as Record<string, unknown>)[r.id] = r.data;
  }
  return patch as Partial<State>;
}

/** Học sinh trong các lớp do người dùng dạy (để giáo viên được ghi điểm, nhận xét vào bài của các em). */
export function studentsOf(s: Pick<State, "classes" | "enrollments">, teacherId: string): Set<string> {
  const mine = new Set(s.classes.filter((c) => c.teacherId === teacherId).map((c) => c.id));
  return new Set(s.enrollments.filter((e) => mine.has(e.classId)).map((e) => e.studentId));
}
