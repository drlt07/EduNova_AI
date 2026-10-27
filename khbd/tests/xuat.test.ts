import { doanCanGiu } from "@khbd/lib/pipeline/6-xuat-file/ghep";
import { describe, expect, it } from "vitest";
import PizZip from "pizzip";
import { TO_HOP, chayToHop } from "@khbd/scripts/xuat-mau";
import {
  docFileDaXuat, kiemTraChoTrong, kiemTraFileXuat, kiemTraGiuNguyen, kiemTraLatex, kiemTraTuKhoaAi, NEN_TANG_HAY_GAP,
} from "@khbd/lib/pipeline/5-kiem-tra/kiem-tra-file";
import { latexSangOmml, loiLatex, tachCongThuc } from "@khbd/lib/pipeline/6-xuat-file/cong-thuc";
import { tenFileXuat } from "@khbd/lib/pipeline/6-xuat-file/xuat";

const kq = await Promise.all(TO_HOP.map(async (th) => ({ th, ...(await chayToHop(th)) })));

describe("đổi công thức", () => {
  it("LaTeX → công thức Word, mã hóa dấu < >", () => {
    const o = latexSangOmml("\\frac{1}{2}x^{2}-x-4<0");
    expect(o).toMatch(/^<m:oMath>/);
    expect(o).toContain("<m:f>");
    expect(o).toContain("&lt;");
    expect(o).not.toMatch(/<m:t(?: [^>]*)?>[^<]*<(?!\/m:t>)/);
  });
  it("phương trình hóa học \\ce{}", () => {
    expect(latexSangOmml("\\ce{CH3COOC2H5 + NaOH -> CH3COONa + C2H5OH}")).toContain("<m:sSub>");
  });
  it("tách chữ và công thức; bắt LaTeX lỗi", () => {
    expect(tachCongThuc("Giải $x^2=1$ nhé").map((p) => p.loai)).toEqual(["chu", "cong_thuc", "chu"]);
    expect(loiLatex("\\frac{1}{2}")).toBeNull();
    expect(loiLatex("\\frac{1}{")).not.toBeNull();
    expect(kiemTraLatex(["Tính $\\frac{1}{$ và x² + 1"]).map((l) => l.loai)).toEqual(["latex", "latex"]);
  });
});

describe("xuất Word cho 4 tổ hợp kiểm thử", () => {
  for (const { th, pt, tt, lc, kh, nd, sach, danhDau } of kq) {
    describe(th.ten, () => {
      const tuyChon = { coAi: lc.ai, nenTangChon: [...lc.nenTang, lc.tuHoc.nenTang].filter(Boolean), nenTangGoiY: NEN_TANG_HAY_GAP };
      it("qua bộ kiểm tra tự động, giữ 100% nội dung của thầy/cô", () => {
        const k = kiemTraFileXuat(sach, doanCanGiu(pt, tt, lc, kh, nd), tuyChon);
        expect(k.loi.filter((l) => l.nghiem)).toEqual([]);
        expect(k.tiLeGiuNguyen).toBe(100);
      });
      it("đúng lề A4, phông Times New Roman, có công thức Word thật khi bài có công thức", () => {
        const xml = new PizZip(sach).file("word/document.xml")!.asText();
        expect(xml).toContain('<w:pgSz w:w="11906" w:h="16838"/>');
        expect(xml).toContain('w:top="1134" w:right="850" w:bottom="1134" w:left="1701"');
        if (pt.doan.some((d) => d.vanBan.includes("$"))) expect(xml).toContain("<m:oMath>");
        expect(xml).not.toContain("{"); // không còn thẻ mẫu chưa điền
      });
      it("bản đánh dấu tô nền phần bổ sung, bản sạch không tô", () => {
        expect(new PizZip(sach).file("word/document.xml")!.asText()).not.toContain('w:fill="DEEAF6"');
        const dd = new PizZip(danhDau).file("word/document.xml")!.asText();
        if (!(lc.nls && !lc.chuyenKhung && !lc.taoLaiHoatDong && !lc.ai)) expect(dd).toContain('w:fill="DEEAF6"');
      });
    });
  }

  it("không chọn AI thì không có chữ AI; có chọn thì có quy trình và phiếu kiểm chứng", () => {
    for (const { lc, sach } of kq) {
      const chu = docFileDaXuat(sach).doanChu.join("\n");
      if (lc.ai) {
        expect(chu).toContain("Quy trình sử dụng AI có kiểm chứng");
        expect(chu).toContain("PHIẾU KIỂM CHỨNG PHẢN HỒI AI");
        expect(chu).toMatch(/MA TRẬN TÍCH HỢP NĂNG LỰC ĐẶC THÙ(, NĂNG LỰC SỐ)? VÀ NĂNG LỰC AI/);
      } else expect(chu).not.toMatch(/\bAI\b/);
    }
  });

  it("LHĐN: tự học trước giờ trên EduNext; bài 4 tiết phương án C đủ 4 tiết", () => {
    const c = kq.find((k) => k.th.ten.startsWith("4_"))!;
    const chu = docFileDaXuat(c.sach).doanChu.join("\n");
    expect(chu).toContain("Đăng nhập EduNext");
    expect(chu).toContain("Tiết 4 (Tổng hợp)");
    expect(chu).toContain("Câu hỏi luyện tập cho HĐ II trên Quizizz.");
  });

  it("chỉ tích hợp: giữ nguyên bố cục giáo án cũ", () => {
    const c = kq.find((k) => k.th.ten.startsWith("1_"))!;
    const chu = docFileDaXuat(c.sach).doanChu;
    expect(chu).toContain("Hoạt động 1: Khởi động");
    expect(chu.join("\n")).not.toContain("GIAI ĐOẠN 1");
  });

  it("tiếng Anh: không chèn bảng thuật ngữ, không ghi lại hoạt động được chọn; chưa có bản dịch thì chưa có phụ lục", () => {
    const c = kq.find((k) => k.lc.tiengAnh)!;
    const chu = docFileDaXuat(c.sach).doanChu.join("\n");
    for (const bo of ["Bảng thuật ngữ", "Hoạt động được chọn:", "Bản tiếng Anh của hoạt động được chọn", "PHỤ LỤC TIẾNG ANH"]) expect(chu).not.toContain(bo);
  });

  it("tên file KHBD_<môn>_<lớp>_<tên bài>.docx", () => {
    expect(tenFileXuat({ mon: "TOAN", lop: 10, tenBai: "Bài 3. Bất phương trình (2 tiết)", soTiet: 2 })).toBe("KHBD_Toan_10_Bai_3_Bat_phuong_trinh.docx");
    expect(tenFileXuat({ mon: "HOA_HOC", lop: 12, tenBai: "BÀI 1. ESTER – LIPID", soTiet: 1 }, true)).toBe("KHBD_Hoa_hoc_12_Bai_1_ester_lipid_danh_dau.docx");
  });
});

describe("bộ kiểm tra bắt đúng từng loại lỗi", () => {
  it("chỗ trống, từ khóa AI, mất nội dung", () => {
    expect(kiemTraChoTrong(["Tình huống: [......]", "Đáp án: [2; 3]", "[Chèn hình: tam giác ABC]"]).map((l) => l.noiDung.slice(0, 12))).toEqual(["Còn chỗ trốn", "Còn dấu chấm"]);
    expect(kiemTraTuKhoaAi(["HS dùng AI để tóm tắt"], false)).toHaveLength(1);
    expect(kiemTraTuKhoaAi(["HS dùng AI để tóm tắt"], true)).toHaveLength(0);
    expect(kiemTraTuKhoaAi(["Chiến thắng này gắn với tên tuổi của ai?"], false)).toHaveLength(0);
    const doan = [{ ma: "HD-01", loai: "HD" as const, html: "", vanBan: "GV nêu bài toán lợi nhuận", muc: "tien_trinh" as const }];
    expect(kiemTraGiuNguyen(doan, ["GV nêu bài toán"])).toHaveLength(1);
    expect(kiemTraGiuNguyen(doan, ["- GV nêu bài toán lợi nhuận"])).toHaveLength(0);
  });
});
