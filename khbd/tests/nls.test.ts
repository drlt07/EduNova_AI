import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { csvThanhDoiTuong, docDuLieuNls, kiemTraDuLieuNls, tachCsv } from "@khbd/lib/data/nls-csv";
import { locChiBao } from "@khbd/lib/data/nls";
import { goiYChiBao } from "@khbd/lib/pipeline/2-lua-chon/goi-y-nls";

const gia = fs.readFileSync(path.join(process.cwd(), "tests/fixtures/nls_gia.csv"), "utf8");
const duLieu = docDuLieuNls({ thanhPhan: "ma,ten\n", trinhDo: "ma,ten\n", chiBao: gia });

describe("đọc CSV năng lực số", () => {
  it("tách ô có dấu phẩy trong ngoặc kép, nhận cột có dấu", () => {
    expect(tachCsv('a,"b, c",d\n1,2,3')).toEqual([["a", "b, c", "d"], ["1", "2", "3"]]);
    expect(csvThanhDoiTuong("Mã,Nội dung\n1.1.5.1,abc")).toEqual([{ ma: "1.1.5.1", noi_dung: "abc" }]);
  });

  it("tách mã chỉ báo thành thành phần và trình độ", () => {
    expect(duLieu.chiBao[0]).toMatchObject({ ma: "1.1.5.1", maThanhPhan: "1.1", trinhDo: "5" });
  });

  it("bắt mã trùng, sai định dạng, chỉ báo rỗng", () => {
    const d = docDuLieuNls({ thanhPhan: "ma,ten\n1.1,Tìm kiếm\n1.1,Lặp\n", trinhDo: "ma,ten\n5,Bậc 5\n", chiBao: "ma,noi_dung\n1.1.5.1,x\n1.1.5.1,y\n11NC1,z\n1.1.5.2,\n" });
    const loi = kiemTraDuLieuNls(d).map((l) => `${l.ma}: ${l.noiDung}`);
    expect(loi).toContain("1.1: Mã trùng.");
    expect(loi).toContain("1.1.5.1: Mã trùng.");
    expect(loi).toContain("11NC1: Mã chỉ báo phải có dạng 1.1.5.1.");
    expect(loi).toContain("1.1.5.2: Chỉ báo rỗng.");
  });
});

describe("tra cứu và gợi ý mã NC1", () => {
  it("lọc theo trình độ, miền, mã, từ khóa không dấu", () => {
    expect(locChiBao({ trinhDo: "5" }, duLieu)).toHaveLength(5);
    expect(locChiBao({ trinhDo: "5", mien: "1" }, duLieu).map((c) => c.ma)).toEqual(["1.1.5.1", "1.2.5.1"]);
    expect(locChiBao({ tuKhoa: "4.2" }, duLieu).map((c) => c.ma)).toEqual(["4.2.5.1"]);
    expect(locChiBao({ tuKhoa: "tai khoan" }, duLieu).map((c) => c.ma)).toEqual(["4.2.5.1"]);
  });

  it("gợi ý theo nội dung kiến thức và cách tổ chức, kèm căn cứ; mỗi thành phần một chỉ báo", async () => {
    const { nls } = await import("@khbd/lib/data/nls");
    const bac5 = locChiBao({ trinhDo: "5" }, nls);
    const su = goiYChiBao(bac5, {
      mon: "LICH_SU",
      vanBan: ["Khai thác tư liệu về các cuộc kháng chiến", "Đánh giá độ tin cậy của nguồn tư liệu"],
      hinhThucHD3: ["Phiên tòa giả định"],
    });
    expect(su.slice(0, 2).map((x) => x.chiBao.ma)).toEqual(["1.2.5.1", "1.1.5.2"]);
    expect(su[0].lyDo).toContain("Tổ chức: Phiên tòa giả định (HĐ III)");
    expect(su[0].lyDo).toContain("Nội dung: độ tin cậy");
    expect(new Set(su.map((x) => x.chiBao.maThanhPhan)).size).toBe(su.length);

    const toan = goiYChiBao(bac5, { mon: "TOAN", vanBan: ["Mẫu số liệu ghép nhóm", "Vẽ biểu đồ tần số"], hinhThucHD3: ["Dự án"] });
    expect(toan.map((x) => x.chiBao.maThanhPhan)).toEqual(expect.arrayContaining(["1.3", "5.3", "3.1", "2.4"]));
  });

  it("không thêm mã chỉ vì dùng nền tảng số; không có căn cứ thì không gợi ý", async () => {
    const { nls } = await import("@khbd/lib/data/nls");
    const bac5 = locChiBao({ trinhDo: "5" }, nls);
    expect(goiYChiBao(bac5, { mon: "TOAN", vanBan: ["Làm bài trên Quizizz, nộp bài trên Azota, xem bài trên EduNext"], hinhThucHD2: ["Luyện tập trên nền tảng số"] })).toEqual([]);
    expect(goiYChiBao(bac5, { mon: "HOA_HOC", vanBan: ["Giải quyết vấn đề về môi trường, giải thích hiện tượng."] })).toEqual([]);
    expect(goiYChiBao(bac5, { vanBan: ["Nghe giảng về vai trò của các ai trong lớp"] })).toEqual([]);
  });

  it("không có dữ liệu thì không gợi ý", () => {
    expect(goiYChiBao([], { vanBan: ["tìm kiếm"] })).toEqual([]);
  });
});

describe("dữ liệu năng lực số bậc 5 (Thông tư 02/2025, bảng do giáo viên cung cấp)", async () => {
  const { nls } = await import("@khbd/lib/data/nls");
  const nguon = fs.readFileSync(path.join(process.cwd(), "docs/nguon/nls_thong_tu_02_2025_bac5.tsv"), "utf8");

  it("đủ 6 miền, 24 thành phần; mọi chỉ báo là bậc 5", () => {
    expect(nls.mien.map((m) => m.ma)).toEqual(["1", "2", "3", "4", "5", "6"]);
    expect(nls.thanhPhan).toHaveLength(24);
    expect(nls.chiBao).toHaveLength(55);
    expect(nls.trinhDo).toEqual([{ ma: "5", ten: "Bậc 5", lop: "Lớp 10 – 12" }]);
    for (const c of nls.chiBao) expect(c.ma.startsWith(`${c.maThanhPhan}.5.`) && c.trinhDo === "5", c.ma).toBe(true);
  });

  it("tên, mô tả thành phần và chỉ báo chép nguyên văn từ bảng nguồn", () => {
    for (const t of nls.thanhPhan) {
      expect(nguon, t.ma).toContain(`${t.ma}\t${t.ten}\t${t.moTa}`);
    }
    for (const c of nls.chiBao) expect(nguon, c.ma).toContain(`${c.ma} ${c.noiDung}`);
    expect(nls.chiBao.find((c) => c.ma === "1.1.5.2")!.noiDung).toBe("Áp dụng được kỹ thuật tìm kiếm để lấy được dữ liệu, thông tin và nội dung trong môi trường số.");
    expect(nls.chiBao.find((c) => c.ma === "6.3.5.2")!.noiDung).toBe("Kiểm tra và xác minh được tính chính xác của các quyết định do hệ thống AI đưa ra.");
  });
});
