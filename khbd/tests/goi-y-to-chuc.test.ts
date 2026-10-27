import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { docVanBanKhung } from "@khbd/lib/data/khung";
import { docFile } from "@khbd/lib/pipeline/1-tai-len";
import { phanTichGiaoAn } from "@khbd/lib/pipeline/3-ke-hoach/tach-doan";
import { lapKeHoach } from "@khbd/lib/pipeline/3-ke-hoach";
import { LUA_CHON_TRONG, type LuaChon } from "@khbd/lib/pipeline/2-lua-chon/lua-chon";
import { dongChu, nhanMonTheoNoiDung, trichThongTin } from "@khbd/lib/pipeline/2-lua-chon/thong-tin";
import {
  GOI_Y_KHUNG, boNgoac, goiYHinhThucHd2, goiYHinhThucHd3, goiYPhuongAn, goiYViec, nhiemVuHd3TheoMon, vanBanDeGoiY,
} from "@khbd/lib/pipeline/2-lua-chon/goi-y-to-chuc";
import { nguCanhTu, schemaGoiYToChuc, taoYeuCau, taoYeuCauGoiYToChuc } from "@khbd/lib/pipeline/4-sinh-noi-dung/dinh-nghia";
import { goiYToChuc } from "@khbd/lib/pipeline/4-sinh-noi-dung/soan";
import { adapterGiaLap, kiemTraKhuon } from "@khbd/lib/llm";
import { taoMauGiaLap } from "@khbd/lib/llm/mau-gia-lap";

const khung = docVanBanKhung().split("\n");
async function doc(file: string, chon: Partial<LuaChon> = {}) {
  const kq = await docFile(file, fs.readFileSync(path.join(process.cwd(), "samples/input", file)));
  const pt = phanTichGiaoAn(kq.html, file);
  const lc: LuaChon = { ...LUA_CHON_TRONG, ...chon };
  const kh = lapKeHoach(pt, pt.thongTin, { ...lc, phuongAn: lc.phuongAn ?? "A" });
  return { kq, pt, tt: pt.thongTin, vb: vanBanDeGoiY(pt, pt.thongTin), ctx: nguCanhTu(pt, pt.thongTin, lc, kh, []) };
}

describe("bảng gợi ý tổ chức HĐ II, HĐ III chép nguyên văn từ khung", () => {
  it("đủ 8 hình thức HĐ II, 11 nhóm môn HĐ III; mỗi ô có trong khung", () => {
    expect(GOI_Y_KHUNG.hd2).toHaveLength(8);
    expect(GOI_Y_KHUNG.hd3).toHaveLength(11);
    for (const h of GOI_Y_KHUNG.hd2) for (const o of Object.values(h)) expect(khung, o).toContain(o);
    for (const h of GOI_Y_KHUNG.hd3) for (const o of Object.values(h)) expect(khung, o).toContain(o);
    expect(boNgoac("Lượt 1 cá nhân trên [nền tảng luyện tập] →")).toBe("Lượt 1 cá nhân trên nền tảng luyện tập →");
  });
});

describe("đọc giáo án rồi gợi ý", () => {
  it("HĐ II theo bảng khung, xếp theo môn và nội dung bài", async () => {
    const su = await doc("lich_su11_chien_tranh_bao_ve_to_quoc.docx");
    const g = goiYHinhThucHd2(su.tt.mon, su.vb);
    expect(g.map((x) => x.ten)).toEqual(expect.arrayContaining(["Phiên tòa giả định", "Mảnh ghép"]));
    expect(g[0].lyDo[0]).toMatch(/^Khung: phù hợp .*Lịch sử/);
    expect(g[0].dienBien).not.toMatch(/[[\]]/);
    const toan = await doc("toan10_bat_phuong_trinh_bac_hai.docx");
    expect(goiYHinhThucHd2(toan.tt.mon, toan.vb)[0].ten).toBe("Luyện tập trên hệ thống số (2 lượt)");
    expect(goiYHinhThucHd2(toan.tt.mon, toan.vb).map((x) => x.ten)).not.toContain("Phiên tòa giả định");
  });

  it("HĐ III theo dạng nhiệm vụ của môn trong khung; bài từ 3 tiết gợi ý thêm dự án", async () => {
    const hoa = await doc("hoa12_ester.docx");
    expect(nhiemVuHd3TheoMon("HOA_HOC")!.mon).toBe("KHTN, Vật lí, Hóa học, Sinh học");
    expect(goiYHinhThucHd3(hoa.tt.mon, hoa.vb, hoa.tt.soTiet)[0].ten).toBe("Thí nghiệm");
    const toan = await doc("toan10_bat_phuong_trinh_bac_hai.docx");
    expect(goiYHinhThucHd3(toan.tt.mon, toan.vb, toan.tt.soTiet)[0].ten).toBe("Giải tình huống thực tế");
    expect(goiYHinhThucHd3("TOAN", toan.vb, 3).map((x) => x.ten)).toContain("Dự án");
  });

  it("việc nên làm đọc từ cấu trúc giáo án; không gợi ý AI, tiếng Anh, LHĐN", async () => {
    const { pt } = await doc("toan10_bat_phuong_trinh_bac_hai.docx");
    const v = goiYViec(pt);
    expect(v.chuyenKhung).toMatch(/^Giáo án theo cấu trúc cũ: Khởi động/);
    expect(v.nls).toBe("Giáo án chưa có mã năng lực số.");
    expect(Object.keys(v).sort()).toEqual(expect.arrayContaining(["chuyenKhung", "nls"]));
    expect(Object.keys(v).every((k) => ["chuyenKhung", "taoLaiHoatDong", "nls"].includes(k))).toBe(true);
  });

  it("phương án cho bài từ 3 tiết", async () => {
    const { pt } = await doc("lich_su11_chien_tranh_bao_ve_to_quoc.docx");
    expect(goiYPhuongAn(pt, { ...pt.thongTin, soTiet: 2 })).toBeNull();
    expect(goiYPhuongAn(pt, { ...pt.thongTin, soTiet: 3 })).not.toBeNull();
  });

  it("nhận diện môn và lớp từ nội dung khi đầu bài không ghi", async () => {
    const { kq } = await doc("hoa12_ester.docx");
    const dong = dongChu(kq.html).filter((d) => !/hóa học|lớp\s*12|^bài/i.test(d));
    expect(nhanMonTheoNoiDung(dong)).toBe("HOA_HOC");
    expect(trichThongTin(dong, "giao_an.docx").mon).toBe("HOA_HOC");
    expect(nhanMonTheoNoiDung(["Hôm nay trời đẹp."])).toBeNull();
  });
});

describe("gợi ý cách tổ chức bằng LLM (mock)", () => {
  it("gợi ý triển khai từng hoạt động: giữ bố cục gốc dùng hoạt động của GV; LHĐN dùng khung 3 giai đoạn", async () => {
    const { ctx } = await doc("lich_su11_chien_tranh_bao_ve_to_quoc.docx", { nls: true, maNls: ["1.1.5.2"] });
    const yc = taoYeuCauGoiYToChuc(ctx);
    expect(yc.noiDung).toContain("Phiên tòa giả định | Lịch sử, GDCD/GDKT&PL, Ngữ văn |");
    expect(yc.noiDung).toContain("CHỨC NĂNG GIÁO VIÊN CHỌN: năng lực số (mã: 1.1.5.2");
    expect(yc.noiDung).toContain(`${ctx.hoatDong[0].ma}: ${ctx.hoatDong[0].ten}`);
    expect(yc.noiDung).not.toMatch(/\[[^\]]*\]/);
    expect(yc.heThong).toContain("Chỉ 1 nhiệm vụ, thường là giải tình huống mở đầu; nhóm 3–4 HS");
    const kq = await goiYToChuc(ctx, adapterGiaLap(taoMauGiaLap(ctx), { min: 0, max: 0 }));
    expect(kiemTraKhuon(schemaGoiYToChuc(ctx), kq)).toBeTruthy();
    expect(kq.hoatDong.map((h) => h.ma)).toEqual(ctx.hoatDong.map((h) => h.ma));
    const lhdn = await doc("lich_su11_chien_tranh_bao_ve_to_quoc.docx", { lhdn: true, chuyenKhung: true });
    expect(taoYeuCauGoiYToChuc(lhdn.ctx).noiDung).toContain("HD3: HĐ III. Vận dụng thực tế");
  });

  it("hình thức và định hướng GV đã duyệt được đưa vào lượt soạn HĐ II, HĐ III", async () => {
    const { ctx } = await doc("lich_su11_chien_tranh_bao_ve_to_quoc.docx", {
      taoLaiHoatDong: true, hinhThucHD2: ["Phiên tòa giả định"], hinhThucHD3: ["Làm việc với tư liệu"],
      dinhHuongHD2: "Phân vai xét xử vai trò của nhân dân.", dinhHuongHD3: "Lập trục thời gian các cuộc kháng chiến.",
    });
    const hd2 = taoYeuCau("hd2", ctx, {})!;
    expect(hd2.noiDung).toContain("Theo khung: Phiên tòa giả định: Phân vai (thẩm phán");
    expect(hd2.noiDung).toContain("Diễn biến HĐ II giáo viên đã duyệt: Phân vai xét xử vai trò của nhân dân.");
    const hd3 = taoYeuCau("hd3", ctx, {})!;
    expect(hd3.noiDung).toContain("Theo khung, môn Lịch sử: dạng nhiệm vụ Khai thác tư liệu");
    expect(hd3.noiDung).toContain("Nhiệm vụ HĐ III giáo viên đã duyệt: Lập trục thời gian các cuộc kháng chiến.");
  });
});
