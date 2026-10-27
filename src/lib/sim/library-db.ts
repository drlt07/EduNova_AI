/**
 * Thành phố dữ liệu (Tin 11 – Bài 10–13 KNTT): thư viện trường chuyển từ sổ ghi chép lộn xộn sang CSDL quan hệ.
 * Logic thuần: tách cột thành bảng, chọn khóa chính (có phản ví dụ từ dữ liệu), ràng buộc khóa chính / khóa ngoài.
 */

export type TableId = "hoc_sinh" | "sach" | "phieu_muon";
export const TABLE_LABEL: Record<TableId, string> = { hoc_sinh: "HỌC SINH", sach: "SÁCH", phieu_muon: "PHIẾU MƯỢN" };

export interface Student { ma_hs: string; ho_ten: string; lop: string }
export interface Book { ma_sach: string; ten_sach: string; tac_gia: string }
export interface Loan { ma_phieu: string; ma_hs: string; ma_sach: string; ngay_muon: string; ngay_tra: string | null }

export const STUDENTS: Student[] = [
  { ma_hs: "HS01", ho_ten: "Nguyễn Văn An", lop: "11A1" },
  { ma_hs: "HS02", ho_ten: "Trần Thu Bình", lop: "11A1" },
  { ma_hs: "HS03", ho_ten: "Nguyễn Văn An", lop: "11A3" },
  { ma_hs: "HS04", ho_ten: "Lê Minh Châu", lop: "11A2" },
];
export const BOOKS: Book[] = [
  { ma_sach: "S01", ten_sach: "Dế Mèn phiêu lưu ký", tac_gia: "Tô Hoài" },
  { ma_sach: "S02", ten_sach: "Tin học 11", tac_gia: "Nhiều tác giả" },
  { ma_sach: "S03", ten_sach: "Số đỏ", tac_gia: "Vũ Trọng Phụng" },
  { ma_sach: "S04", ten_sach: "Vợ chồng A Phủ", tac_gia: "Tô Hoài" },
  { ma_sach: "S05", ten_sach: "Tin học 11", tac_gia: "Bộ sách Cánh Diều" },
];
export const LOANS: Loan[] = [
  { ma_phieu: "P001", ma_hs: "HS01", ma_sach: "S01", ngay_muon: "02/10", ngay_tra: "09/10" },
  { ma_phieu: "P002", ma_hs: "HS01", ma_sach: "S02", ngay_muon: "05/10", ngay_tra: null },
  { ma_phieu: "P003", ma_hs: "HS02", ma_sach: "S01", ngay_muon: "10/10", ngay_tra: null },
  { ma_phieu: "P004", ma_hs: "HS03", ma_sach: "S03", ngay_muon: "12/10", ngay_tra: "20/10" },
  { ma_phieu: "P005", ma_hs: "HS01", ma_sach: "S01", ngay_muon: "21/10", ngay_tra: null },
];

/** Sổ mượn cũ: mỗi dòng chép lại toàn bộ thông tin học sinh và sách (dư thừa, dễ sai). */
export const MESSY_LOG = LOANS.map((l) => {
  const s = STUDENTS.find((x) => x.ma_hs === l.ma_hs)!;
  const b = BOOKS.find((x) => x.ma_sach === l.ma_sach)!;
  // lần chép thứ 3 của tên sách bị viết sai — lỗi thường gặp khi dữ liệu bị lặp
  const ten_sach = l.ma_phieu === "P005" ? "De Men phieu luu ki" : b.ten_sach;
  return { ma_hs: s.ma_hs, ho_ten: s.ho_ten, lop: s.lop, ma_sach: b.ma_sach, ten_sach, tac_gia: b.tac_gia, ngay_muon: l.ngay_muon, ngay_tra: l.ngay_tra ?? "" };
});

// ---------- Nhiệm vụ 1: cột nào thuộc bảng nào ----------

export const INFO_COLUMNS = ["ho_ten", "lop", "ten_sach", "tac_gia", "ngay_muon", "ngay_tra"] as const;
export type InfoColumn = (typeof INFO_COLUMNS)[number];
export const COLUMN_LABEL: Record<string, string> = {
  ma_hs: "Mã HS", ho_ten: "Họ tên", lop: "Lớp", ma_sach: "Mã sách", ten_sach: "Tên sách", tac_gia: "Tác giả", ngay_muon: "Ngày mượn", ngay_tra: "Ngày trả", ma_phieu: "Mã phiếu", ten_sach_tra_cuu: "Tên sách (tra từ bảng SÁCH)",
};
const HOME: Record<InfoColumn, TableId> = { ho_ten: "hoc_sinh", lop: "hoc_sinh", ten_sach: "sach", tac_gia: "sach", ngay_muon: "phieu_muon", ngay_tra: "phieu_muon" };

export function assignColumn(col: InfoColumn, table: TableId): { ok: boolean; message: string } {
  if (HOME[col] === table) {
    const why: Record<InfoColumn, string> = {
      ho_ten: "Họ tên là thông tin của học sinh, chỉ cần lưu một lần.",
      lop: "Lớp là thông tin của học sinh.",
      ten_sach: "Tên sách thuộc về cuốn sách; lưu một lần thì không còn chép sai như “De Men phieu luu ki”.",
      tac_gia: "Tác giả là thông tin của cuốn sách.",
      ngay_muon: "Ngày mượn thuộc về từng lần mượn, nên nằm ở phiếu mượn.",
      ngay_tra: "Ngày trả thuộc về từng lần mượn.",
    };
    return { ok: true, message: why[col] };
  }
  const hint: Record<TableId, string> = {
    hoc_sinh: "Bảng HỌC SINH chỉ chứa thông tin không đổi theo từng lần mượn của một học sinh.",
    sach: "Bảng SÁCH chỉ chứa thông tin của cuốn sách.",
    phieu_muon: "Nếu để ở PHIẾU MƯỢN, thông tin này sẽ bị chép lại ở mỗi lần mượn — đúng cái lỗi của sổ cũ.",
  };
  return { ok: false, message: `${COLUMN_LABEL[col]} không thuộc bảng ${TABLE_LABEL[table]}. ${hint[table]}` };
}

/** Số lần một tên sách bị chép lại trong sổ cũ (minh họa dư thừa). */
export function duplicateCount(): number {
  return MESSY_LOG.length - new Set(MESSY_LOG.map((r) => r.ma_sach)).size;
}

// ---------- Nhiệm vụ 2: khóa chính ----------

export interface KeyOption { id: string; label: string; cols: string[] }
export const KEY_QUESTIONS: { table: TableId; options: KeyOption[]; answer: string }[] = [
  { table: "hoc_sinh", answer: "ma_hs", options: [{ id: "ho_ten", label: "Họ tên", cols: ["ho_ten"] }, { id: "lop", label: "Lớp", cols: ["lop"] }, { id: "ma_hs", label: "Mã HS", cols: ["ma_hs"] }] },
  { table: "sach", answer: "ma_sach", options: [{ id: "tac_gia", label: "Tác giả", cols: ["tac_gia"] }, { id: "ma_sach", label: "Mã sách", cols: ["ma_sach"] }, { id: "ten_sach", label: "Tên sách", cols: ["ten_sach"] }] },
  { table: "phieu_muon", answer: "ma_phieu", options: [{ id: "ma_hs", label: "Mã HS", cols: ["ma_hs"] }, { id: "hs_sach", label: "Mã HS + Mã sách", cols: ["ma_hs", "ma_sach"] }, { id: "ma_phieu", label: "Mã phiếu (thêm cột mới)", cols: ["ma_phieu"] }] },
];

function rowsOf(table: TableId): Record<string, string | null>[] {
  return (table === "hoc_sinh" ? STUDENTS : table === "sach" ? BOOKS : LOANS) as unknown as Record<string, string | null>[];
}

/** Kiểm tra một lựa chọn khóa chính: tìm hai dòng trùng giá trị làm phản ví dụ. */
export function checkKey(table: TableId, cols: string[]): { ok: boolean; message: string; clash?: [number, number] } {
  const rows = rowsOf(table);
  const seen = new Map<string, number>();
  for (let i = 0; i < rows.length; i++) {
    const k = cols.map((c) => rows[i][c]).join("|");
    if (seen.has(k)) {
      const j = seen.get(k)!;
      const val = cols.map((c) => `${COLUMN_LABEL[c]} = ${rows[i][c]}`).join(", ");
      return { ok: false, clash: [j, i], message: `Không dùng được: hai dòng cùng có ${val}. Khóa chính phải khác nhau ở mọi dòng.` };
    }
    seen.set(k, i);
  }
  const extra = table === "phieu_muon" ? " Một học sinh có thể mượn cùng một cuốn nhiều lần, nên cần mã phiếu riêng." : " Mã do thư viện cấp, không bao giờ trùng và không đổi.";
  return { ok: true, message: `Đúng. ${cols.map((c) => COLUMN_LABEL[c]).join(" + ")} xác định duy nhất mỗi dòng.${extra}` };
}

// ---------- Nhiệm vụ 3: ràng buộc toàn vẹn ----------

export interface Db { students: Student[]; books: Book[]; loans: Loan[] }
export const initialDb = (): Db => ({ students: [...STUDENTS], books: [...BOOKS], loans: [...LOANS] });

export interface DbOp {
  id: string;
  text: string;
  sql: string;
  run: (db: Db) => { ok: boolean; db: Db; message: string };
}

export const DB_OPS: DbOp[] = [
  {
    id: "loan-missing-book",
    text: "Thêm phiếu P006: học sinh HS02 mượn sách mã S99.",
    sql: "INSERT INTO phieu_muon VALUES ('P006', 'HS02', 'S99', '25/10', NULL);",
    run: (db) => db.books.some((b) => b.ma_sach === "S99")
      ? { ok: true, db, message: "" }
      : { ok: false, db, message: "Bị từ chối: không có sách S99 trong bảng SÁCH. Khóa ngoài ma_sach chỉ nhận mã sách có thật." },
  },
  {
    id: "dup-student",
    text: "Thêm học sinh mới với mã HS02, tên Phạm Gia Huy.",
    sql: "INSERT INTO hoc_sinh VALUES ('HS02', 'Phạm Gia Huy', '11A4');",
    run: (db) => db.students.some((s) => s.ma_hs === "HS02")
      ? { ok: false, db, message: "Bị từ chối: mã HS02 đã thuộc về Trần Thu Bình. Khóa chính không được trùng." }
      : { ok: true, db, message: "" },
  },
  {
    id: "delete-borrower",
    text: "Xóa học sinh HS01 (Nguyễn Văn An 11A1) khỏi bảng HỌC SINH.",
    sql: "DELETE FROM hoc_sinh WHERE ma_hs = 'HS01';",
    run: (db) => db.loans.some((l) => l.ma_hs === "HS01")
      ? { ok: false, db, message: "Bị từ chối: HS01 đang có phiếu mượn (P001, P002, P005). Xóa đi thì các phiếu này trỏ tới một học sinh không tồn tại." }
      : { ok: true, db: { ...db, students: db.students.filter((s) => s.ma_hs !== "HS01") }, message: "" },
  },
  {
    id: "rename-book",
    text: "Sửa tên sách S01 thành “Dế Mèn phiêu lưu ký (tái bản)”.",
    sql: "UPDATE sach SET ten_sach = 'Dế Mèn phiêu lưu ký (tái bản)' WHERE ma_sach = 'S01';",
    run: (db) => ({ ok: true, db: { ...db, books: db.books.map((b) => (b.ma_sach === "S01" ? { ...b, ten_sach: "Dế Mèn phiêu lưu ký (tái bản)" } : b)) }, message: "Được phép: chỉ sửa đúng 1 dòng ở bảng SÁCH, cả 3 phiếu mượn S01 đều tự hiện tên mới. Sổ cũ phải sửa 3 chỗ." }),
  },
  {
    id: "new-student",
    text: "Thêm học sinh HS05, Đỗ Khánh Linh, lớp 11A2.",
    sql: "INSERT INTO hoc_sinh VALUES ('HS05', 'Đỗ Khánh Linh', '11A2');",
    run: (db) => db.students.some((s) => s.ma_hs === "HS05")
      ? { ok: false, db, message: "Bị từ chối: trùng mã." }
      : { ok: true, db: { ...db, students: [...db.students, { ma_hs: "HS05", ho_ten: "Đỗ Khánh Linh", lop: "11A2" }] }, message: "Được phép: mã HS05 chưa có, mọi ràng buộc đều thỏa." },
  },
];
