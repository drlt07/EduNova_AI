/**
 * (1) Không cộng dồn năng lực của KHBD gốc với mục tiêu theo cấu trúc mới: cấu trúc mới là chuẩn đối chiếu cuối cùng,
 *     KHBD gốc chỉ là tư liệu tham khảo. Giữ bố cục gốc thì nhóm năng lực app soạn mới thay dòng cùng nhóm.
 * (2) Trình bày Word: câu hỏi và đáp án xuống đoạn riêng, mỗi phương án A/B/C/D một dòng, các bước tách rõ.
 * Thử trên KHBD Tin học 11 thầy/cô gửi (samples/input/tin11_he_dieu_hanh.docx) và các tổ hợp mẫu.
 */
import { describe, expect, it } from "vitest";
import { tachDoanTrinhBay, viTriXuongDoan, kiemTraBanSoan, bienTap, nguCanhBienTap } from "@khbd/lib/pipeline/5-kiem-tra/bien-tap";
import { docFileDaXuat, kiemTraGiuNguyen } from "@khbd/lib/pipeline/5-kiem-tra/kiem-tra-file";
import { doanCanGiu, lapBanSoan } from "@khbd/lib/pipeline/6-xuat-file/ghep";
import type { Doan } from "@khbd/lib/pipeline/6-xuat-file/xml";
import { TO_HOP_CHUC_NANG, chayChucNang } from "../scripts/xuat-mau";

const TIN11 = "tin11_he_dieu_hanh.docx";
const DU = { lhdn: true, nls: true, maNls: ["1.3.5.1", "1.1.5.2"], ai: true, maAi: ["NLa", "NLc", "NLd"], tiengAnh: true, cachTiengAnh: "clil" as const };
const chuDoan = (d: Doan) => (d.html ?? `${d.nhan ? `${d.nhan} ` : ""}${d.chu}`).replace(/<[^>]+>/g, "");
const i2Cua = (chu: string[]) => chu.slice(chu.indexOf("2. Năng lực"), chu.indexOf("3. Phẩm chất"));

describe("xuống đoạn khi trình bày", () => {
  it("phương án A–D liền dòng → mỗi phương án một đoạn", () => {
    const t = tachDoanTrinhBay({ nguon: "bo_sung", chu: "Câu 1. Chất nào sau đây là ester? A. CH3COOH B. CH3COOCH3 C. C2H5OH D. CH3CHO", cap: 0 })!;
    expect(t.map((d) => d.chu)).toEqual(["Câu 1. Chất nào sau đây là ester?", "A. CH3COOH", "B. CH3COOCH3", "C. C2H5OH", "D. CH3CHO"]);
  });

  it("đoạn của GV chỉ xuống dòng, không đổi kí tự nào (giữ in đậm)", () => {
    const html = "<p><strong>Câu 1.</strong> Chất nào là ester? A. CH<sub>3</sub>COOH B. CH<sub>3</sub>COOCH<sub>3</sub> C. C<sub>2</sub>H<sub>5</sub>OH D. CH<sub>3</sub>CHO</p>";
    const t = tachDoanTrinhBay({ nguon: "giu_nguyen", html, cap: 0 })!;
    expect(t).toHaveLength(5);
    expect(t.map(chuDoan).join(" ")).toBe(html.replace(/<[^>]+>/g, ""));
    expect(t[0].html).toContain("<strong>Câu 1.</strong>");
    // Thẻ bị cắt ngang thì không tách (tránh hỏng định dạng).
    expect(tachDoanTrinhBay({ nguon: "giu_nguyen", html: "<p><strong>Câu 1. Hỏi? A. x B. y C. z</strong> D. t</p>", cap: 0 })).toBeNull();
  });

  it("đáp án chung đoạn với câu hỏi → đoạn riêng có nhãn “Đáp án:”", () => {
    const t = tachDoanTrinhBay({ nguon: "bo_sung", chu: "Lý thuyết: Câu 1. Nêu năm nhóm chức năng của hệ điều hành. Đáp án: quản lí thiết bị; quản lí lưu trữ dữ liệu.", cap: 2 })!;
    expect(t.map((d) => [d.nhan, d.chu])).toEqual([[undefined, "Lý thuyết: Câu 1. Nêu năm nhóm chức năng của hệ điều hành."], ["Đáp án:", "Quản lí thiết bị; quản lí lưu trữ dữ liệu."]]);
  });

  it("nhiều bước trong một đoạn → mỗi bước một đoạn; trong bước, việc của GV và HS xuống dòng", () => {
    const t = tachDoanTrinhBay({ nguon: "bo_sung", chu: "Thực hiện nhiệm vụ (14 phút): Bước 1 – Giao nhiệm vụ: GV làm mẫu. Bước 2 – Thực hiện lượt 1: HS làm cá nhân. Bước 3 – Lượt 2: HS sửa lỗi.", cap: 2 })!;
    expect(t.map((d) => d.chu)).toEqual(["Thực hiện nhiệm vụ (14 phút):", "Bước 1 – Giao nhiệm vụ: GV làm mẫu.", "Bước 2 – Thực hiện lượt 1: HS làm cá nhân.", "Bước 3 – Lượt 2: HS sửa lỗi."]);
    const b = tachDoanTrinhBay({ nguon: "bo_sung", chu: "Bước 1 – Nêu tình huống (3 phút): GV: chiếu tình huống hai thiết bị; HS: nêu dự đoán.", cap: 2, vai: "buoc" })!;
    expect(b.map((d) => `${d.nhan ?? ""}${d.chu}`)).toEqual(["Bước 1 – Nêu tình huống (3 phút):", "GV:Chiếu tình huống hai thiết bị.", "HS:Nêu dự đoán."]);
  });

  it("không tách nhầm: tên riêng có “A.”, nhắc bước giữa câu, công thức", () => {
    for (const s of ["Bài nói của A. Lincoln được trích ở SGK.", "HS làm lại như ở Bước 2.", "Rút gọn $A. B. C. D.$ trong vở.", "Câu 3. Tính giá trị biểu thức."]) expect(viTriXuongDoan(s).cat, s).toEqual([]);
  });
});

describe(`KHBD Tin học 11 thầy/cô gửi – LHĐN + năng lực số + AI + CLIL`, async () => {
  const r = await chayChucNang({ ten: "tin11", file: TIN11, lc: DU });
  const chu = docFileDaXuat(r.sach).doanChu.map((s) => s.replace(/\s+/g, " ").trim());
  const i2 = i2Cua(chu);

  it("app đọc đúng cấu trúc: mục tiêu, thiết bị, các hoạt động (tiêu đề in đậm bằng kiểu đoạn, “HĐ I.”)", () => {
    expect(r.pt.doan.filter((d) => d.loai === "MT").length).toBeGreaterThan(20);
    expect(r.pt.hoatDong.length).toBeGreaterThanOrEqual(5);
    expect(r.pt.doan.filter((d) => d.loai === "KH").length).toBeLessThan(5);
  });

  it("mục I.2 chỉ theo cấu trúc mới: không còn dòng năng lực gốc, không mã kiểu cũ, mỗi nhóm/thành phần/mã một lần", () => {
    const tat = i2.join("\n");
    for (const goc of ["1.3NC1a", "5.2NC1b", "5.3NC1a", "Nhận biết và phân loại được chức năng của hệ điều hành", "Tổ chức được các mốc phát triển tiêu biểu", "Phân tích được ảnh hưởng của AI", "Nhận biết và sử dụng linh hoạt tiếng Anh chuyên ngành"]) expect(tat, goc).not.toContain(goc);
    for (const td of ["Năng lực chung:", "Năng lực số:", "Năng lực AI:"]) expect(i2.filter((c) => c.startsWith(td)), td).toHaveLength(1);
    expect(i2.filter((c) => c.startsWith("Năng lực đặc thù môn Tin học"))).toHaveLength(1);
    const ten = i2.map((c) => /^(.+?\(NL tin học – NL[a-e]\))/.exec(c)?.[1]).filter(Boolean);
    expect(new Set(ten).size).toBe(ten.length);
    for (const ma of ["NLa", "NLc", "NLd"]) expect(i2.filter((c) => c.startsWith(`NL AI – ${ma}:`)), ma).toHaveLength(1);
    expect(i2.filter((c) => /^Tích hợp CLIL:/.test(c))).toHaveLength(1);
  });

  it("phần còn lại của KHBD gốc vẫn còn nguyên văn (chỉ dòng năng lực gốc không dùng)", () => {
    const giu = doanCanGiu(r.pt, r.tt, r.lc, r.kh, r.nd);
    expect(r.pt.doan.length - giu.length).toBe(r.pt.doan.filter((d) => d.loai === "MT" && d.nhomMucTieu === "I.2").length);
    expect(kiemTraGiuNguyen(giu, chu)).toEqual([]);
  });

  it("bước kiểm tra không còn lỗi cộng dồn, trình bày; bản thô (chưa biên tập) thì phát hiện được", () => {
    const ngu = nguCanhBienTap(r.pt, r.lc);
    const tho = lapBanSoan(r.pt, r.tt, r.lc, r.kh, r.nd);
    expect(kiemTraBanSoan(tho, ngu).some((l) => l.loai === "trinh_bay")).toBe(true);
    const sau = kiemTraBanSoan(bienTap(tho, ngu).ban, ngu);
    expect(sau.filter((l) => l.nghiem).map((l) => `${l.loai}: ${l.noiDung}`)).toEqual([]);
  });

  it("file Word: câu hỏi – từng phương án – đáp án mỗi thứ một đoạn; bước tách tên bước / GV / HS", () => {
    const loi = chu.filter((c) => viTriXuongDoan(c).cat.length);
    expect(loi).toEqual([]);
    chu.forEach((c, i) => {
      if (/^Câu \d+\. .*\?$/.test(c) && /^A\. /.test(chu[i + 1] ?? "")) expect(chu.slice(i + 1, i + 5).map((x) => x[0]).join("")).toBe("ABCD");
    });
    const b1 = chu.findIndex((c) => /^Bước 1 – .*\(\d+ phút\):$/.test(c));
    expect(chu[b1 + 1]).toMatch(/^GV: /);
    expect(chu[b1 + 2]).toMatch(/^HS: /);
    // Bảng thời lượng gốc giống hệt bảng app dựng: chỉ còn một bảng.
    expect(docFileDaXuat(r.sach).xml.match(/HĐ III\. Vận dụng thực tế<\/w:t>/g)).toHaveLength(1);
    // Câu hỏi tự học: đáp án ở đoạn ngay sau.
    const ch = chu.findIndex((c) => /^Lý thuyết: Câu 1\./.test(c));
    expect(chu[ch]).not.toContain("Đáp án:");
    expect(chu[ch + 1]).toMatch(/^Đáp án: /);
  });
});

describe("giữ bố cục gốc (chỉ năng lực số) – Tin học 11", async () => {
  const r = await chayChucNang({ ten: "tin11_nls", file: TIN11, lc: { nls: true, maNls: ["1.1.5.2"] } });
  const chu = docFileDaXuat(r.sach).doanChu.map((s) => s.replace(/\s+/g, " ").trim());
  const i2 = i2Cua(chu);

  it("nhóm năng lực số của app thay dòng năng lực số gốc (kể cả mã kiểu cũ), không ghép thêm; nhóm khác giữ nguyên", () => {
    expect(i2.filter((c) => /^Năng lực số:/.test(c))).toHaveLength(1);
    for (const goc of ["1.3NC1a", "5.2NC1b", "1.2.5.1: Thực hiện đánh giá"]) expect(i2.join("\n"), goc).not.toContain(goc);
    expect(i2.join("\n")).toContain("1.1.5.2:");
    expect(i2.join("\n")).toContain("Tự chủ và tự học: đọc nội dung bài học");
    expect(kiemTraGiuNguyen(doanCanGiu(r.pt, r.tt, r.lc, r.kh, r.nd), chu)).toEqual([]);
  });
});

describe.each([...TO_HOP_CHUC_NANG.map((t) => [t.ten, t] as const)])("trình bày Word – %s", (_ten, th) => {
  it("không còn đoạn gộp phương án, đáp án, nhiều bước", async () => {
    const r = await chayChucNang(th);
    const chu = docFileDaXuat(r.sach).doanChu.map((s) => s.replace(/\s+/g, " ").trim());
    expect(chu.filter((c) => viTriXuongDoan(c).cat.length)).toEqual([]);
  });
});
