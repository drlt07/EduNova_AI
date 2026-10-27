import { describe, expect, it } from "vitest";
import { runQuery, toSql, type Query } from "@/lib/sim/sql-engine";
import { CASE_TABLES, CLUES } from "@/lib/sim/sql-detective";

const q = (p: Partial<Query>): Query => ({ from: "phieu_muon", columns: "*", where: [], ...p });

describe("bộ máy truy vấn", () => {
  it("WHERE, IS NULL, so sánh với NULL luôn sai, LIKE, ORDER BY", () => {
    expect(runQuery(CASE_TABLES, q({ where: [{ col: "ngay_tra", op: "IS NULL" }] })).rows).toHaveLength(4);
    expect(runQuery(CASE_TABLES, q({ where: [{ col: "ngay_tra", op: "=", value: "NULL" }] })).rows).toHaveLength(0);
    expect(runQuery(CASE_TABLES, q({ from: "sach", where: [{ col: "ten_sach", op: "LIKE", value: "%tô%" }] })).rows).toHaveLength(0);
    expect(runQuery(CASE_TABLES, q({ from: "sach", where: [{ col: "tac_gia", op: "LIKE", value: "tô%" }] })).rows).toHaveLength(2);
    expect(runQuery(CASE_TABLES, q({ from: "sach", where: [{ col: "so_trang", op: ">", value: "150" }], orderBy: { col: "so_trang", desc: true } })).rows.map((r) => r.ma_sach)).toEqual(["S03", "S01", "S02"]);
  });

  it("JOIN lấy được cột của bảng kia; cột sai hoặc thiếu giá trị báo lỗi tiếng Việt", () => {
    const r = runQuery(CASE_TABLES, q({ join: { table: "hoc_sinh", left: "ma_hs", right: "ma_hs" }, columns: ["ma_phieu", "ho_ten"] }));
    expect(r.rows).toHaveLength(6);
    expect(r.rows[2]).toEqual({ ma_phieu: "P003", ho_ten: "Trần Thu Bình" });
    expect(runQuery(CASE_TABLES, q({ where: [{ col: "ho_ten", op: "=", value: "x" }] })).error).toMatch(/Không có cột ho_ten/);
    expect(runQuery(CASE_TABLES, q({ where: [{ col: "ma_sach", op: "=", value: "" }] })).error).toMatch(/thiếu giá trị/);
  });

  it("sinh câu SQL đúng cú pháp hiển thị", () => {
    expect(toSql(q({ columns: ["ma_phieu"], where: [{ col: "ma_sach", op: "=", value: "S01" }, { col: "ngay_tra", op: "IS NULL" }] }))).toBe("SELECT ma_phieu\nFROM phieu_muon\nWHERE ma_sach = 'S01'\n  AND ngay_tra IS NULL;");
  });
});

describe("vụ án", () => {
  it("truy vấn mẫu giải được từng manh mối, còn truy vấn thiếu điều kiện thì không", () => {
    const s01 = { col: "ma_sach", op: "=" as const, value: "S01" };
    const notRet = { col: "ngay_tra", op: "IS NULL" as const };
    const early = { col: "ngay_muon", op: "<" as const, value: "2026-10-14" };
    const join = { table: "hoc_sinh", left: "ma_hs", right: "ma_hs" };
    const solutions: Query[] = [
      q({ where: [s01] }),
      q({ where: [s01, notRet] }),
      q({ where: [s01, notRet, early] }),
      q({ join, columns: ["ma_phieu", "ho_ten", "lop"], where: [s01, notRet, early] }),
    ];
    CLUES.forEach((c, i) => expect(c.check(runQuery(CASE_TABLES, solutions[i]), solutions[i])).toBeNull());
    expect(CLUES[1].check(runQuery(CASE_TABLES, solutions[0]), solutions[0])).not.toBeNull();
    expect(CLUES[3].check(runQuery(CASE_TABLES, solutions[2]), solutions[2])).toMatch(/JOIN/);
  });
});
