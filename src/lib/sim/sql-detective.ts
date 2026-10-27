/**
 * Thám tử SQL (Tin 11 – Bài 14): cuốn “Dế Mèn phiêu lưu ký” bản quý quá hạn chưa trả.
 * Học sinh dùng truy vấn để lần ra người đang giữ sách; mỗi manh mối kiểm tra kết quả truy vấn thật.
 */
import type { Query, QueryResult, Tables } from "./sql-engine";

export const TODAY = "2026-10-28";

export const CASE_TABLES: Tables = {
  hoc_sinh: [
    { ma_hs: "HS01", ho_ten: "Nguyễn Văn An", lop: "11A1" },
    { ma_hs: "HS02", ho_ten: "Trần Thu Bình", lop: "11A1" },
    { ma_hs: "HS03", ho_ten: "Nguyễn Văn An", lop: "11A3" },
    { ma_hs: "HS04", ho_ten: "Lê Minh Châu", lop: "11A2" },
    { ma_hs: "HS05", ho_ten: "Đỗ Khánh Linh", lop: "11A2" },
  ],
  sach: [
    { ma_sach: "S01", ten_sach: "Dế Mèn phiêu lưu ký (bản quý)", tac_gia: "Tô Hoài", so_trang: 180 },
    { ma_sach: "S02", ten_sach: "Tin học 11", tac_gia: "Nhiều tác giả", so_trang: 160 },
    { ma_sach: "S03", ten_sach: "Số đỏ", tac_gia: "Vũ Trọng Phụng", so_trang: 220 },
    { ma_sach: "S04", ten_sach: "Vợ chồng A Phủ", tac_gia: "Tô Hoài", so_trang: 120 },
  ],
  phieu_muon: [
    { ma_phieu: "P001", ma_hs: "HS01", ma_sach: "S01", ngay_muon: "2026-10-02", ngay_tra: "2026-10-09" },
    { ma_phieu: "P002", ma_hs: "HS01", ma_sach: "S02", ngay_muon: "2026-10-05", ngay_tra: null },
    { ma_phieu: "P003", ma_hs: "HS02", ma_sach: "S01", ngay_muon: "2026-10-10", ngay_tra: null },
    { ma_phieu: "P004", ma_hs: "HS03", ma_sach: "S03", ngay_muon: "2026-10-12", ngay_tra: "2026-10-20" },
    { ma_phieu: "P005", ma_hs: "HS05", ma_sach: "S01", ngay_muon: "2026-10-21", ngay_tra: null },
    { ma_phieu: "P006", ma_hs: "HS04", ma_sach: "S04", ngay_muon: "2026-10-01", ngay_tra: null },
  ],
};

export const TABLE_NOTE: Record<string, string> = {
  hoc_sinh: "Học sinh (ma_hs, ho_ten, lop)",
  sach: "Sách (ma_sach, ten_sach, tac_gia, so_trang)",
  phieu_muon: "Phiếu mượn (ma_phieu, ma_hs, ma_sach, ngay_muon, ngay_tra — NULL nghĩa là chưa trả)",
};

export interface Clue {
  id: string;
  story: string;
  task: string;
  hint: string;
  /** Kiểm tra kết quả truy vấn; trả về lời giải thích nếu chưa đạt */
  check: (r: QueryResult, q: Query) => string | null;
  found: string;
}

const ids = (r: QueryResult, col: string) => r.rows.map((x) => x[col]).filter((v) => v !== undefined).sort().join(",");

export const CLUES: Clue[] = [
  {
    id: "all-loans",
    story: "Thủ thư: “Cuốn bản quý có mã S01. Em xem giúp cô nó đã được mượn những lần nào.”",
    task: "Lấy mọi phiếu mượn của sách S01.",
    hint: "Bảng phieu_muon, điều kiện ma_sach = S01.",
    check: (r) => (!r.columns.includes("ma_phieu") ? "Hãy hiển thị cột ma_phieu để biết là phiếu nào." : ids(r, "ma_phieu") === "P001,P003,P005" ? null : `Kết quả có ${r.rows.length} phiếu. Phiếu của sách S01 phải đúng 3 phiếu.`),
    found: "Sách S01 đã được mượn 3 lần: P001, P003, P005.",
  },
  {
    id: "not-returned",
    story: "“Phiếu nào ghi ngày trả rồi thì sách đã về kho. Chỉ còn phiếu chưa trả là đáng ngờ.”",
    task: "Trong các phiếu mượn sách S01, lấy những phiếu CHƯA trả.",
    hint: "Thêm điều kiện ngay_tra IS NULL (không dùng = NULL — so sánh với NULL luôn sai).",
    check: (r) => (!r.columns.includes("ma_phieu") ? "Hãy hiển thị cột ma_phieu." : ids(r, "ma_phieu") === "P003,P005" ? null : `Còn ${r.rows.length} phiếu. Cần đúng các phiếu S01 chưa có ngày trả.`),
    found: "Còn 2 phiếu chưa trả: P003 (HS02) và P005 (HS05). Có 2 nghi phạm!",
  },
  {
    id: "overdue",
    story: "“Thư viện cho mượn 14 ngày. Hôm nay 28/10, ai mượn trước ngày 14/10 mà chưa trả là quá hạn.”",
    task: "Lấy phiếu mượn S01, chưa trả, mượn trước ngày 2026-10-14.",
    hint: "Thêm điều kiện ngay_muon < 2026-10-14 (ngày viết dạng năm-tháng-ngày nên so sánh được như chữ).",
    check: (r) => (!r.columns.includes("ma_phieu") ? "Hãy hiển thị cột ma_phieu." : ids(r, "ma_phieu") === "P003" ? null : `Kết quả có ${r.rows.length} phiếu; chỉ một phiếu thỏa cả ba điều kiện.`),
    found: "Chỉ còn phiếu P003, người mượn có mã HS02.",
  },
  {
    id: "who",
    story: "“Mã HS02 là ai, học lớp nào? Cô cần tên để gọi lên thư viện.”",
    task: "Nối phieu_muon với hoc_sinh để hiện họ tên và lớp của người giữ sách quá hạn.",
    hint: "Bật JOIN hoc_sinh ON phieu_muon.ma_hs = hoc_sinh.ma_hs, giữ 3 điều kiện, chọn cột ho_ten và lop.",
    check: (r, q) => {
      if (!q.join) return "Bảng phieu_muon chỉ có mã HS. Cần nối (JOIN) sang bảng hoc_sinh để lấy họ tên.";
      if (!r.columns.includes("ho_ten") || !r.columns.includes("lop")) return "Hãy hiển thị cột ho_ten và lop.";
      return r.rows.length === 1 && r.rows[0].ho_ten === "Trần Thu Bình" ? null : `Kết quả có ${r.rows.length} dòng; cần đúng một người.`;
    },
    found: "Người giữ sách: Trần Thu Bình, lớp 11A1 — quá hạn 4 ngày.",
  },
];

export const SUSPECTS = ["Nguyễn Văn An (11A1)", "Trần Thu Bình (11A1)", "Nguyễn Văn An (11A3)", "Đỗ Khánh Linh (11A2)"];
export const CULPRIT = 1;
