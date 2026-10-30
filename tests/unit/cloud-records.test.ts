import { describe, expect, it } from "vitest";
import { emptyData } from "@/lib/data/seed";
import { collectRows, diffRows, rowKey, rowsToPatch, snapshotOf, studentsOf } from "@/lib/cloud/records";

const T = "11111111-1111-4111-8111-111111111111";
const S1 = "22222222-2222-4222-8222-222222222222";
const S2 = "33333333-3333-4333-8333-333333333333";
const C1 = "44444444-4444-4444-8444-444444444444";

function state() {
  const s = emptyData();
  s.classes = [{ id: C1, name: "10A1", grade: 10, teacherId: T } as never];
  s.enrollments = [{ id: `${C1}:${S1}`, classId: C1, studentId: S1 }];
  s.assignments = [{ id: "a1", ownerId: T, classId: C1, status: "published" } as never];
  s.labResults = [{ id: "r1", studentId: S1, labSlug: "qr-code", score: 8 } as never, { id: "r2", studentId: S2, labSlug: "qr-code", score: 5 } as never];
  s.submissions = [{ id: "sub1", studentId: S1, assignmentId: "a1" } as never];
  s.assessments = [{ id: "as1", submissionId: "sub1", teacherId: T } as never];
  s.unlocks = [{ classId: C1, key: "kntt-10-1", by: T, at: "x" }];
  s.prefs = { [S1]: { theme: "dark" } as never };
  return s;
}

describe("đồng bộ app_records", () => {
  it("gom bản ghi kèm chủ sở hữu và phạm vi chia sẻ", () => {
    const rows = collectRows(state());
    expect(rows.get(rowKey("assignments", "a1"))).toMatchObject({ owner_id: T, shared: true, class_ids: [C1] });
    expect(rows.get(rowKey("labResults", "r1"))).toMatchObject({ owner_id: S1, shared: false });
    // bài chấm thuộc về học sinh của bài nộp, để em đó xem được điểm
    expect(rows.get(rowKey("assessments", "as1"))?.owner_id).toBe(S1);
    expect(rows.get(rowKey("unlocks", `${C1}|kntt-10-1`))?.owner_id).toBe(T);
    expect(rows.get(rowKey("prefs", S1))?.data).toEqual({ theme: "dark" });
  });

  it("bỏ bản ghi có chủ sở hữu không phải tài khoản thật (dữ liệu mẫu)", () => {
    const s = state();
    s.labResults.push({ id: "demo", studentId: "s-an", labSlug: "x", score: 1 } as never);
    expect(collectRows(s).has(rowKey("labResults", "demo"))).toBe(false);
  });

  it("chỉ đẩy bản ghi mới hoặc đã đổi; giáo viên ghi được bài của học sinh lớp mình, không ghi bài học sinh lớp khác", () => {
    const s = state();
    const snap = snapshotOf(collectRows(s).values());
    expect(diffRows(snap, collectRows(s), T, studentsOf(s, T))).toEqual({ upserts: [], deletes: [] });
    s.labResults = s.labResults.map((r) => ({ ...r, review: { score: 9, note: "", by: T, at: "x" } }));
    const { upserts } = diffRows(snap, collectRows(s), T, studentsOf(s, T));
    expect(upserts.map((r) => r.id)).toEqual(["r1"]);
  });

  it("xóa trên máy chủ chỉ bản ghi của chính mình", () => {
    const s = state();
    const snap = snapshotOf(collectRows(s).values());
    s.assignments = [];
    s.labResults = [];
    const { deletes } = diffRows(snap, collectRows(s), T, studentsOf(s, T));
    expect(deletes).toEqual([{ kind: "assignments", id: "a1" }]);
  });

  it("dựng lại kho từ dữ liệu tải về; loại không có dòng nào thành rỗng", () => {
    const rows = [...collectRows(state()).values()];
    const patch = rowsToPatch(rows);
    expect(patch.labResults).toHaveLength(2);
    expect(patch.prefs).toEqual({ [S1]: { theme: "dark" } });
    expect(patch.courses).toEqual([]);
    expect(rowsToPatch([]).assignments).toEqual([]);
  });
});
