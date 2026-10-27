/**
 * Bước biên tập KHBD sau khi AI soạn, trước khi xuất file (lib/pipeline/5-kiem-tra/bien-tap.ts).
 * Kiểm tra 9 loại lỗi: lặp giữa các phần, mã lặp, lời nội bộ, chức năng không chọn, tham chiếu không tồn tại,
 * câu văn/dấu câu, nhiệm vụ lặp trong hoạt động, bước lặp ở nhiều cấp, phụ lục không dùng.
 * Nguyên tắc: chữ của GV giữ nguyên; mục bắt buộc của hoạt động không bị bỏ.
 */
import { describe, expect, it } from "vitest";
import { bienTap, boVe, gopMaLap, kiemTraBanSoan, laNoiBo, suaDauCau, tachCau, type NguCanhBienTap } from "@khbd/lib/pipeline/5-kiem-tra/bien-tap";
import { cacDoan, chuDoan, laBang, type BanSoan, type Khoi } from "@khbd/lib/pipeline/6-xuat-file/ban-soan";
import type { Doan } from "@khbd/lib/pipeline/6-xuat-file/xml";
import { doanCanGiu, lapBanSoan } from "@khbd/lib/pipeline/6-xuat-file/ghep";
import { nguCanhBienTap } from "@khbd/lib/pipeline/5-kiem-tra/bien-tap";
import { docFileDaXuat, kiemTraGiuNguyen } from "@khbd/lib/pipeline/5-kiem-tra/kiem-tra-file";
import { TO_HOP_CHUC_NANG, chayChucNang } from "../scripts/xuat-mau";

describe("xử lí chữ", () => {
  it("tách câu không cắt công thức, số thập phân, phương án A. B.", () => {
    expect(tachCau("Làm bài 6.15, 6.16 SGK. Tính $x = 1.5$ rồi so sánh! Chọn A. hay B. đều được.")).toEqual([
      "Làm bài 6.15, 6.16 SGK.", "Tính $x = 1.5$ rồi so sánh!", "Chọn A. hay B. đều được.",
    ]);
  });

  it("gộp mã lặp: “NLa: NLa:”, “NL AI – NLa: NLa:”, “Tiêu chí 5.2.5.2: 5.2.5.2:”, “NLa (NLa)”", () => {
    expect(gopMaLap("NLa: NLa: HS nhận biết AI.").chu).toBe("NLa: HS nhận biết AI.");
    expect(gopMaLap("NL AI – NLa: NLa: HS nhận biết AI.").chu).toBe("NL AI – NLa: HS nhận biết AI.");
    expect(gopMaLap("Tiêu chí 5.2.5.2: 5.2.5.2: đạt khi có 2 nguồn.").chu).toBe("Tiêu chí 5.2.5.2: đạt khi có 2 nguồn.");
    expect(gopMaLap("Tiêu chí 5.2.5.2: Tiêu chí 5.2.5.2: đạt khi có 2 nguồn.").chu).toBe("Tiêu chí 5.2.5.2: đạt khi có 2 nguồn.");
    expect(gopMaLap("Mã NLa (NLa) ở HĐ III.").chu).toBe("Mã NLa ở HĐ III.");
    // Không đụng câu bình thường, công thức.
    expect(gopMaLap("Bước 1 – Diễn tình huống (5 phút): GV: phát thẻ vai; HS: diễn.").lap).toEqual([]);
    expect(gopMaLap("Tính $a: a: b$ theo tỉ lệ.").lap).toEqual([]);
  });

  it("nhận ra lời hướng dẫn nội bộ cho AI, không nhầm với nội dung dạy học", () => {
    for (const s of ["nếu giáo án cũ không đánh mã này thì bỏ qua", "Nếu GV chưa ghi mã thì để trống", "điền theo schema", "giữ nguyên văn của GV", "ghi vào trường bieuHien", "Thầy/cô kiểm tra lại câu này"]) expect(laNoiBo(s), s).toBe(true);
    for (const s of ["GV chiếu tình huống; HS ghi số liệu.", "Lưu ý: HS dễ nhầm dấu của tam thức.", "HS vẽ đồ thị bằng GeoGebra và lưu tệp.", "Nếu nhóm làm xong sớm, GV giao câu mở rộng."]) expect(laNoiBo(s), s).toBe(false);
  });

  it("bỏ vế nội bộ, giữ phần còn lại thành câu hoàn chỉnh", () => {
    expect(boVe("Đạt khi có 2 nguồn (nếu giáo án cũ không đánh mã này thì bỏ qua).", laNoiBo).chu).toBe("Đạt khi có 2 nguồn.");
    expect(boVe("HS lưu tệp kết quả; nếu giáo án gốc chưa có mã thì không ghi.", laNoiBo).chu).toBe("HS lưu tệp kết quả.");
    expect(boVe("GV phát phiếu; HS làm theo cặp.", laNoiBo)).toEqual({ chu: "GV phát phiếu; HS làm theo cặp.", bo: [] });
  });

  it("sửa dấu câu và từ lặp do ghép máy móc", () => {
    expect(suaDauCau("Đáp án: Câu 1: A.; Câu 2: B..").chu).toBe("Đáp án: Câu 1: A; Câu 2: B.");
    expect(suaDauCau("HS HS làm bài ,ghi kết quả .").chu).toBe("HS làm bài, ghi kết quả.");
    expect(suaDauCau("GV chốt ( kiến thức ) trọng tâm.").chu).toBe("GV chốt (kiến thức) trọng tâm.");
    // Từ láy, dấu ba chấm, công thức: giữ nguyên.
    expect(suaDauCau("HS làm dần dần… rồi tính $a;;b$.").chu).toBe("HS làm dần dần… rồi tính $a;;b$.");
  });
});

// ───────────── Bản soạn dựng tay chứa đủ 9 loại lỗi ─────────────

const bs = (chu: string, x: Partial<Doan> = {}): Doan => ({ nguon: "bo_sung", chu, cap: 2, ...x });
const gv = (html: string, x: Partial<Doan> = {}): Doan => ({ nguon: "giu_nguyen", html, cap: 2, ...x });
const NGU: NguCanhBienTap = { chucNang: { nls: true, ai: false, clil: false, tieng_anh: false, lhdn: true }, nenTangChon: [], maDoan: new Set(["MT-01", "MT-02", "HD-01"]) };

function banLoi(): BanSoan {
  const hd1: Khoi[] = [
    { nguon: "bo_sung", chu: "HĐ I. KHỞI ĐỘNG & CHỈNH LỖI (15 phút – tiết 1)", kieu: "TenHoatDong", hd: "HD1" },
    bs("Khơi gợi hứng thú, kết nối kiến thức tự học với tình huống thực tế.", { cap: 1, nhan: "Mục tiêu:", vai: "muc_tieu", hd: "HD1" }),
    bs("", { cap: 1, nhan: "Tổ chức:", vai: "to_chuc", hd: "HD1" }),
    // (8) "Cách tổ chức" lồng trong "Tổ chức"; tình huống và câu dẫn nhận định nhắc lại việc của bước.
    bs("Đóng vai tình huống: 3 HS nhận 3 vai.", { nhan: "Cách tổ chức:", vai: "cach_to_chuc", hd: "HD1" }),
    bs("Bước 1 – Diễn tình huống (5 phút): GV: phát thẻ vai và dữ kiện tình huống; HS: 3 HS diễn tình huống.", { vai: "buoc", hd: "HD1" }),
    bs("Bước 2 – Chỉnh lỗi (10 phút): GV: đưa 2 nhận định dễ nhầm; HS: giơ thẻ đúng/sai, giải thích.", { vai: "buoc", hd: "HD1" }),
    // (2)(3)(5) lời nội bộ trong ngoặc, mã nội bộ.
    gv("<p>b) Tổ chức thực hiện: GV nêu bài toán lợi nhuận.</p>", { hd: "HD1" }),
    gv("<p>a) Mục tiêu: Tạo nhu cầu tìm hiểu cách giải bất phương trình.</p>", { hd: "HD1" }),
    bs("GV đưa ra tình huống mở đầu: Cửa hàng bán x sản phẩm thì lãi bao nhiêu?", { vai: "tinh_huong", hd: "HD1" }),
    bs("GV đưa ra các nhận định phản biện để chỉnh lỗi nhận thức:", { vai: "nhan_dinh_dau", hd: "HD1" }),
    bs("“Tam thức luôn dương?” (HS thảo luận, rút ra kết luận: chỉ khi a > 0 và Δ < 0).", { vai: "nhan_dinh", hd: "HD1" }),
    bs("Hỏi: Bán bao nhiêu sản phẩm thì có lãi? (Giải ở HĐ III – Vận dụng 2.)", { vai: "cau_hoi_mo_dau", hd: "HD1" }),
    bs("Câu trả lời có lí giải; mỗi HS ghi lại ít nhất 01 lỗi đã sửa.", { cap: 1, nhan: "Sản phẩm – đánh giá:", vai: "san_pham", hd: "HD1" }),
    bs("Tiêu chí 5.2.5.2: 5.2.5.2: đạt khi có ít nhất 2 nguồn (nếu giáo án cũ không đánh mã này thì bỏ qua).", { vai: "tieu_chi", hd: "HD1", chucNang: "nls" }),
  ];
  const hd2: Khoi[] = [
    { nguon: "bo_sung", chu: "HĐ II. LUYỆN TẬP PHÂN HÓA (30 phút – tiết 1)", kieu: "TenHoatDong", hd: "HD2" },
    bs("HS rèn kĩ năng xét dấu tam thức bậc hai.", { cap: 1, nhan: "Mục tiêu:", vai: "muc_tieu", hd: "HD2" }),
    // (7) nhiệm vụ lặp; câu lặp trong một đoạn; (6) dấu câu, từ lặp; (5) mã không tồn tại; (4) tiếng Anh không chọn.
    bs("Thực hiện nhiệm vụ (14 phút): HS HS làm phiếu theo nhóm mức đạt ,đổi phiếu chấm chéo.. Từng cặp đổi phiếu và đánh dấu câu sai. Từng cặp đổi phiếu và đánh dấu câu sai.", { vai: "buoc", hd: "HD2" }),
    bs("Từng cặp đổi phiếu và đánh dấu câu sai theo đáp án GV chiếu.", { hd: "HD2" }),
    bs("Từng cặp đổi phiếu và đánh dấu câu sai theo đáp án GV chiếu.", { hd: "HD2" }),
    bs("GV đối chiếu kết quả với MT-01 và VD-01; HS ghi key words tiếng Anh vào phiếu.", { hd: "HD2" }),
    bs("Đáp án: Câu 1: A.; Câu 2: B..", { cap: 0, hd: "HD2" }),
    // (1) câu đã có ở mục tiêu.
    bs("HS giải được bất phương trình bậc hai bằng cách xét dấu tam thức bậc hai.", { hd: "HD2" }),
    bs("Phiếu kết quả của nhóm.", { cap: 1, nhan: "Sản phẩm – đánh giá:", vai: "san_pham", hd: "HD2" }),
    bs("Key words: inequality (bất phương trình).", { hd: "HD2", chucNang: "clil" }),
  ];
  return {
    cheDo: "moi", monHoa: "TOÁN", lop: 10, tenBai: "BÀI 3", soTiet: 2, coGd1: true, coGd3: true, tenMaTran: "NĂNG LỰC ĐẶC THÙ, NĂNG LỰC SỐ", coAi: false,
    phan: [
      { truong: "kienThuc", khoi: [gv("<p>Giải được bất phương trình bậc hai một ẩn.</p>", { cap: 1 })] },
      { truong: "nangLuc", khoi: [
        bs("", { cap: 1, nhan: "Năng lực số:" }),
        bs("5.2.5.2: Áp dụng được các công cụ số. Biểu hiện trong bài: HS giải được bất phương trình bậc hai bằng cách xét dấu tam thức bậc hai.", { chucNang: "nls" }),
        bs("", { cap: 1, nhan: "Năng lực AI:" }),
        bs("NLa: NLa: HS nhận biết AI có thể hỗ trợ tìm kiếm thông tin.", { chucNang: "ai" }),
      ] },
      { truong: "tienTrinh", khoi: hd1 },
      { truong: "tienTrinh", khoi: hd2 },
      { truong: "phuLuc", khoi: [{ loai: "bang", nguon: "bo_sung", vai: "danh_gia", hang: [["Tiêu chí", "Đạt", "Cần hoàn thiện"], ["Mức độ đáp ứng yêu cầu cần đạt", "Hoàn thành đầy đủ nhiệm vụ", "Còn thiếu"]] }] },
      { truong: "maTran", khoi: [{ loai: "bang", nguon: "bo_sung", vai: "ma_tran", hang: [["Nhóm năng lực", "Mã/thành phần", "Biểu hiện trong bài học", "Vị trí", "Minh chứng/sản phẩm"], ["Năng lực số", "5.2.5.2", "5.2.5.2: Áp dụng được các công cụ số.", "HĐ II – tiết 1", "Tệp kết quả"], ["Năng lực AI", "NLa", "NLa: HS nhận biết AI.", "HĐ III", "Phiếu"]] }] },
    ],
  };
}

const chuTat = (b: BanSoan) => cacDoan(b).map((x) => chuDoan(x.doan));
const chuHd = (b: BanSoan, hd: string) => cacDoan(b).filter((x) => x.doan.hd === hd).map((x) => chuDoan(x.doan));

describe("bản soạn chứa đủ 9 loại lỗi", () => {
  const goc = banLoi();
  const truoc = kiemTraBanSoan(goc, NGU);
  const { ban, suaDoi } = bienTap(goc, NGU);
  const sau = kiemTraBanSoan(ban, NGU);

  it("bước kiểm tra phát hiện đủ 9 loại lỗi trước khi biên tập", () => {
    const loai = new Set(truoc.map((l) => l.loai));
    for (const l of ["lap_noi_dung", "ma_lap", "noi_bo", "khong_chon", "tham_chieu", "cau_van", "lap_nhiem_vu", "lap_cau_truc", "phu_luc"]) expect(loai.has(l), l).toBe(true);
  });

  it("sau biên tập không còn lỗi nào; mỗi chỗ sửa đều được ghi lại", () => {
    expect(sau.map((l) => `${l.loai}: ${l.noiDung}`)).toEqual([]);
    const loai = new Set(suaDoi.map((s) => s.loai));
    for (const l of ["lap_noi_dung", "ma_lap", "noi_bo", "khong_chon", "tham_chieu", "cau_van", "lap_nhiem_vu", "lap_cau_truc", "phu_luc"]) expect(loai.has(l as never), l).toBe(true);
    expect(goc).toEqual(banLoi()); // không đổi bản vào
  });

  it("chữ của GV giữ nguyên từng kí tự (chỉ được đặt lại vị trí)", () => {
    const html = (b: BanSoan) => cacDoan(b).filter((x) => x.doan.nguon === "giu_nguyen").map((x) => x.doan.html).sort();
    expect(html(ban)).toEqual(html(goc));
  });

  it("(2)(3) mã không lặp, không còn lời nội bộ; (4) bỏ phần chức năng không chọn; (5) bỏ mã nội bộ", () => {
    const tat = chuTat(ban).join("\n");
    expect(tat).toContain("Tiêu chí 5.2.5.2: đạt khi có ít nhất 2 nguồn.");
    expect(tat).not.toMatch(/NLa|Năng lực AI|giáo án cũ|key words|tiếng Anh|MT-01|VD-01/);
    expect(tat).toContain("GV đối chiếu kết quả."); // phần còn lại của câu vẫn giữ, thành câu hoàn chỉnh
    const maTran = ban.phan.find((p) => p.truong === "maTran")!.khoi[0];
    expect(laBang(maTran) && maTran.hang).toEqual([
      ["Nhóm năng lực", "Mã/thành phần", "Biểu hiện trong bài học", "Vị trí", "Minh chứng/sản phẩm"],
      ["Năng lực số", "5.2.5.2", "Áp dụng được các công cụ số.", "HĐ II – tiết 1", "Tệp kết quả"],
    ]);
  });

  it("(5) câu hỏi nhắc “Vận dụng 2” không có trong tiến trình thì báo lỗi", () => {
    expect(truoc.some((l) => l.loai === "tham_chieu" && l.noiDung.includes("Vận dụng 2"))).toBe(true);
  });

  it("(6) sửa dấu câu, từ lặp", () => {
    const tat = chuTat(ban).join("\n");
    expect(tat).toContain("Đáp án: Câu 1: A; Câu 2: B.");
    expect(tat).toContain("Thực hiện nhiệm vụ (14 phút): HS làm phiếu theo nhóm mức đạt, đổi phiếu chấm chéo.");
  });

  it("(7) nhiệm vụ chỉ nêu một lần trong hoạt động", () => {
    const k = chuHd(ban, "HD2").join("\n");
    expect(k.match(/Từng cặp đổi phiếu và đánh dấu câu sai/g)).toHaveLength(1);
  });

  it("(8) “Tổ chức” gộp với “Cách tổ chức”; tình huống, câu hỏi, nhận định đặt ngay dưới bước tương ứng, không nhắc lại việc của bước; mục tiêu của GV về mục Mục tiêu", () => {
    const k = chuHd(ban, "HD1");
    expect(k).toContain("Tổ chức: Đóng vai tình huống: 3 HS nhận 3 vai.");
    expect(k.some((c) => c.startsWith("Cách tổ chức:"))).toBe(false);
    const vt = (s: string) => k.findIndex((c) => c.startsWith(s));
    // Bước tách thành tên bước, dòng GV, dòng HS; tình huống đặt ngay sau dòng HS của bước 1.
    expect(k.slice(vt("Bước 1"), vt("Bước 1") + 4)).toEqual([
      "Bước 1 – Diễn tình huống (5 phút):", "GV: Phát thẻ vai và dữ kiện tình huống.", "HS: 3 HS diễn tình huống.", "Tình huống: Cửa hàng bán x sản phẩm thì lãi bao nhiêu?",
    ]);
    expect(vt("“Tam thức luôn dương?”")).toBeGreaterThan(vt("Bước 2"));
    expect(k.some((c) => c.startsWith("GV đưa ra các nhận định"))).toBe(false);
    expect(vt("a) Mục tiêu:")).toBe(vt("Mục tiêu: Khơi gợi") + 1);
  });

  it("(1) câu đã có ở mục tiêu không lặp ở tiến trình; mục bắt buộc vẫn còn", () => {
    expect(chuHd(ban, "HD2").some((c) => c.startsWith("HS giải được bất phương trình bậc hai bằng cách"))).toBe(false);
    for (const hd of ["HD1", "HD2"]) for (const n of ["Mục tiêu:", "Sản phẩm – đánh giá:"]) expect(chuHd(ban, hd).some((c) => c.startsWith(n)), `${hd} ${n}`).toBe(true);
  });

  it("(9) phụ lục không được tiến trình dùng thì bỏ; có nhắc trong tiến trình thì giữ", () => {
    expect(ban.phan.find((p) => p.truong === "phuLuc")!.khoi).toEqual([]);
    const coNhac = banLoi();
    (coNhac.phan[3].khoi as Doan[]).push(bs("GV chấm theo bảng tiêu chí ở Phụ lục đánh giá sản phẩm (mục IV).", { nhan: "Cách đánh giá:", vai: "danh_gia", hd: "HD2" }));
    expect(bienTap(coNhac, NGU).ban.phan.find((p) => p.truong === "phuLuc")!.khoi).toHaveLength(1);
  });
});

// ───────────── Chạy trọn luồng trên các tổ hợp chức năng ─────────────

describe.each(TO_HOP_CHUC_NANG.map((t) => [t.ten, t] as const))("tổ hợp %s", (_ten, th) => {
  it("bản soạn sau biên tập không còn lỗi biên tập nghiêm trọng; nội dung GV còn nguyên văn", async () => {
    const r = await chayChucNang(th);
    const ngu = nguCanhBienTap(r.pt, r.lc);
    const { ban } = bienTap(lapBanSoan(r.pt, r.tt, r.lc, r.kh, r.nd), ngu);
    expect(kiemTraBanSoan(ban, ngu).filter((l) => l.nghiem).map((l) => `${l.loai}: ${l.noiDung}`)).toEqual([]);
    expect(kiemTraBanSoan(ban, ngu).filter((l) => ["lap_cau_truc", "lap_nhiem_vu", "lap_noi_dung"].includes(l.loai)).map((l) => l.noiDung)).toEqual([]);
    expect(kiemTraGiuNguyen(doanCanGiu(r.pt, r.tt, r.lc, r.kh, r.nd), docFileDaXuat(r.sach).doanChu)).toEqual([]);
  });
});

describe("AI soạn ra nội dung có lỗi: bước biên tập sửa trước khi xuất", () => {
  // Chèn đúng các lỗi hay gặp vào kết quả soạn giả lập (vẫn đúng schema).
  const chenLoi = (luot: string, d: unknown) => {
    const x = structuredClone(d) as Record<string, any>;
    if (luot === "hd1") { x.cachToChuc = `${x.cachToChuc} (nếu giáo án cũ không đánh mã này thì bỏ qua)`; x.cauHoi = `${x.cauHoi} Xem MT-01.`; }
    if (luot === "hd2") { x.thucHien = [...x.thucHien, x.thucHien[0]]; x.mucTieu = `${x.mucTieu.replace(/\.$/, "")}.;`; }
    if (luot === "hd3") { x.danhGia = `${x.danhGia}; HS ghi key words tiếng Anh vào phiếu`; x.tieuChi = [...x.tieuChi, x.tieuChi[0]]; }
    if (luot === "nls") x.nls = x.nls.map((n: any) => ({ ...n, tieuChi: `${n.ma}: ${n.tieuChi}` }));
    return x;
  };

  it("LHĐN + năng lực số (không chọn tiếng Anh, AI): file xuất không còn lời nội bộ, mã lặp, mã nội bộ, tiếng Anh, câu lặp", async () => {
    const th = { ten: "loi", file: "toan10_bat_phuong_trinh_bac_hai.docx", lc: { lhdn: true, nls: true, maNls: ["5.2.5.2"] } };
    const r = await chayChucNang(th, chenLoi);
    const ngu = nguCanhBienTap(r.pt, r.lc);
    const tho = lapBanSoan(r.pt, r.tt, r.lc, r.kh, r.nd);
    const loaiTruoc = new Set(kiemTraBanSoan(tho, ngu).map((l) => l.loai));
    for (const l of ["noi_bo", "ma_lap", "tham_chieu", "khong_chon", "lap_nhiem_vu", "cau_van"]) expect(loaiTruoc.has(l), l).toBe(true);

    const chu = docFileDaXuat(r.sach).doanChu.join("\n");
    expect(chu).not.toMatch(/giáo án cũ|MT-01|tiếng Anh|key words|5\.2\.5\.2: 5\.2\.5\.2|\.;|[^.]\.\.(?!\.)/);
    expect(kiemTraBanSoan(bienTap(tho, ngu).ban, ngu).filter((l) => l.nghiem)).toEqual([]);
    expect(kiemTraGiuNguyen(doanCanGiu(r.pt, r.tt, r.lc, r.kh, r.nd), docFileDaXuat(r.sach).doanChu)).toEqual([]);
  });
});
