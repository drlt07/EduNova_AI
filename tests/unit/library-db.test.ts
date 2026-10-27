import { describe, expect, it } from "vitest";
import { DB_OPS, INFO_COLUMNS, KEY_QUESTIONS, assignColumn, checkKey, duplicateCount, initialDb } from "@/lib/sim/library-db";

describe("tách bảng", () => {
  it("mỗi cột thông tin có đúng một bảng nhà", () => {
    for (const c of INFO_COLUMNS) expect(["hoc_sinh", "sach", "phieu_muon"].filter((t) => assignColumn(c, t as never).ok)).toHaveLength(1);
    expect(assignColumn("ten_sach", "phieu_muon").message).toMatch(/chép lại/);
    expect(duplicateCount()).toBe(2);
  });
});

describe("khóa chính", () => {
  it("đáp án đúng không trùng; lựa chọn sai có phản ví dụ thật từ dữ liệu", () => {
    for (const q of KEY_QUESTIONS) {
      for (const o of q.options) expect(checkKey(q.table, o.cols).ok).toBe(o.id === q.answer);
    }
    expect(checkKey("hoc_sinh", ["ho_ten"]).message).toMatch(/Nguyễn Văn An/);
    expect(checkKey("phieu_muon", ["ma_hs", "ma_sach"]).clash).toEqual([0, 4]);
  });
});

describe("ràng buộc", () => {
  it("khóa ngoài, trùng khóa chính, xóa đang được tham chiếu bị từ chối; sửa một chỗ thì được", () => {
    let db = initialDb();
    const results = DB_OPS.map((op) => {
      const r = op.run(db);
      db = r.db;
      return r.ok;
    });
    expect(results).toEqual([false, false, false, true, true]);
    expect(db.books.find((b) => b.ma_sach === "S01")!.ten_sach).toMatch(/tái bản/);
    expect(db.students).toHaveLength(5);
  });
});
