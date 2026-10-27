import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { docFile } from "@khbd/lib/pipeline/1-tai-len";
import { phanTichGiaoAn, tachKhoi } from "@khbd/lib/pipeline/3-ke-hoach/tach-doan";

async function phanTich(ten: string) {
  const kq = await docFile(ten, fs.readFileSync(path.join(process.cwd(), "samples/input", ten)));
  return { html: kq.html, pt: phanTichGiaoAn(kq.html) };
}

describe("tách giáo án cũ thành đoạn có mã", () => {
  it("Toán 10: thông tin bài, mục tiêu, hoạt động, câu hỏi", async () => {
    const { pt } = await phanTich("toan10_bat_phuong_trinh_bac_hai.docx");
    expect(pt.thongTin).toEqual({ mon: "TOAN", lop: 10, tenBai: "BÀI 3. BẤT PHƯƠNG TRÌNH BẬC HAI MỘT ẨN", soTiet: 2 });
    const mt = pt.doan.filter((d) => d.loai === "MT");
    expect(mt.map((d) => d.ma)).toEqual(["MT-01", "MT-02", "MT-03", "MT-04", "MT-05", "MT-06"]);
    expect(mt.filter((d) => d.nhomMucTieu === "I.1")).toHaveLength(3);
    expect(mt.filter((d) => d.nhomMucTieu === "I.2")).toHaveLength(2);
    expect(mt.filter((d) => d.nhomMucTieu === "I.3")).toHaveLength(1);
    expect(pt.doan.filter((d) => d.loai === "TB")).toHaveLength(2);
    expect(pt.hoatDong.map((h) => h.loai)).toEqual(["khoi_dong", "hinh_thanh", "luyen_tap", "van_dung", "cung_co"]);
    expect(pt.doan.filter((d) => d.loai === "CH").map((d) => d.vanBan.slice(0, 6))).toEqual(["Câu 1.", "Câu 2."]);
  });

  it("Lịch sử 11: Kĩ năng → I.1, Thái độ → I.3, có cảnh báo thuật ngữ, bảng là một đoạn", async () => {
    const { pt } = await phanTich("lich_su11_chien_tranh_bao_ve_to_quoc.docx");
    expect(pt.thongTin).toMatchObject({ mon: "LICH_SU", lop: 11, soTiet: 3 });
    const kn = pt.doan.find((d) => d.vanBan.startsWith("Khai thác tư liệu"))!;
    expect(kn).toMatchObject({ nhomMucTieu: "I.1", tenNhomCu: "Kĩ năng" });
    const td = pt.doan.find((d) => d.vanBan.startsWith("Trân trọng"))!;
    expect(td.nhomMucTieu).toBe("I.3");
    expect(pt.canhBao.some((c) => c.includes("Thái độ"))).toBe(true);
    const bang = pt.doan.filter((d) => d.html.startsWith("<table"));
    expect(bang).toHaveLength(1);
    expect(bang[0].hoatDongCu).toBe("HDC-2");
  });

  it("Hóa học 12: tiêu đề hoạt động có đánh số", async () => {
    const { pt } = await phanTich("hoa12_ester.docx");
    expect(pt.thongTin).toEqual({ mon: "HOA_HOC", lop: 12, tenBai: "BÀI 1. ESTER – LIPID", soTiet: 1 });
    expect(pt.hoatDong.map((h) => h.loai)).toEqual(["khoi_dong", "hinh_thanh", "luyen_tap", "van_dung"]);
  });

  it("không đoạn nào của giáo viên bị mất", async () => {
    for (const ten of fs.readdirSync(path.join(process.cwd(), "samples/input"))) {
      const { html, pt } = await phanTich(ten);
      const goc = tachKhoi(html).map((k) => k.vanBan);
      expect(pt.doan.map((d) => d.vanBan), ten).toEqual(goc);
      expect(new Set(pt.doan.map((d) => d.ma)).size, ten).toBe(pt.doan.length);
    }
  });
});
