/**
 * Định nghĩa từng lượt soạn: khuôn JSON (zod) + nội dung gửi cho LLM + luật ghép từ rules/.
 * LLM không thấy khung có ngoặc [ ]; không nhận lại văn bản GV để viết lại, chỉ đọc để tham khảo
 * và trả mã đoạn khi cần dùng. Mã năng lực và vị trí chọn từ enum lấy trong dữ liệu.
 */
import { phutHoatDong, phutTrongTen, thietBiCoSan } from "@khbd/lib/pipeline/5-kiem-tra/kha-thi";
import { GOI_Y_KHUNG, boNgoac, nhiemVuHd3TheoMon } from "@khbd/lib/pipeline/2-lua-chon/goi-y-to-chuc";
import * as z from "zod/v4";
import type { DoanGoc, HoatDongCu, PhanTichGiaoAn, ThongTinBai } from "../kieu";
import type { LuaChon } from "../2-lua-chon/lua-chon";
import type { KeHoach } from "../3-ke-hoach";
import { nangLucDacThu } from "@khbd/lib/data/nang-luc-dac-thu";
import { LUAT } from "@khbd/lib/llm/luat.generated";
import { maTranCauHoi, moTaMaTran } from "./ma-tran-cau-hoi";
import { moTaHinhDaDoc, type DocHinhSoan } from "./doc-hinh";
import { doanCuaHoatDong } from "../3-ke-hoach/tach-doan";
import { noiDungHoatDongMoi } from "../6-xuat-file/ghep";

export type NguCanhSoan = {
  thongTin: ThongTinBai;
  luaChon: LuaChon;
  keHoach: KeHoach;
  doan: Pick<DoanGoc, "ma" | "loai" | "vanBan" | "nhomMucTieu" | "hoatDongCu" | "muc">[];
  hoatDong: HoatDongCu[];
  /** Chỉ báo năng lực số bậc 5 (mã + nguyên văn), lấy từ data/. */
  nlsChiBao: { ma: string; noiDung: string }[];
};

const muc = z.enum(["NB", "TH", "VD"]);
const enumTu = (ds: string[]) => (ds.length ? z.enum(ds as [string, ...string[]]) : z.string());

/** Một bước tổ chức: tên bước, số phút, việc GV làm, việc HS làm (cụ thể với bài). */
export const SchemaBuoc = z.object({
  ten: z.string().describe("Tên bước ngắn (vd: Diễn tình huống, Tính toán theo cặp, Chốt phương án)."),
  phut: z.number().int().describe("Số phút của bước; tổng các bước bằng đúng thời lượng hoạt động."),
  gv: z.string().describe("Việc GV làm, cụ thể: câu hỏi, dữ liệu, vai, cách hỗ trợ."),
  hs: z.string().describe("Việc HS làm, cụ thể: thao tác, sản phẩm tạo ra."),
});

export const SchemaHd1 = z.object({
  maDoanTinhHuong: z.string().describe("Mã đoạn chứa tình huống mở đầu của giáo viên (vd HD-02); để trống nếu giáo viên chưa có tình huống."),
  tinhHuong: z.string().describe("Tình huống mở đầu mới, chỉ viết khi giáo viên chưa có; để trống nếu dùng tình huống của giáo viên."),
  cauHoi: z.string().describe("Câu hỏi đặt ra cho tình huống; sẽ được giải trọn vẹn ở HĐ III."),
  nhanDinh: z.array(z.object({ nhanDinh: z.string(), ketLuan: z.string() })).describe("2–3 nhận định dễ gây nhầm ứng với lỗi hay gặp, kèm kết luận đúng."),
  cachToChuc: z.string().describe("Cách tổ chức chọn cho hoạt động và lí do ngắn (vd: Đóng vai tình huống – 3 vai có quan điểm khác nhau)."),
  buoc: z.array(SchemaBuoc).describe("2–4 bước, tổng số phút bằng thời lượng HĐ I."),
  thietBi: z.array(z.string()).describe("Thiết bị, học liệu dùng; chỉ lấy trong danh sách có sẵn."),
});

export const SchemaHd2 = z.object({
  mucTieu: z.string(),
  giaoNhiemVu: z.string().describe("GV giao nhiệm vụ cụ thể: nhiệm vụ gì, chia nhóm thế nào, sản phẩm và tiêu chí."),
  thietBi: z.array(z.string()).describe("Thiết bị, học liệu dùng; chỉ lấy trong danh sách có sẵn."),
  thucHien: z.array(z.string()).describe("Diễn biến thực hiện theo hình thức giáo viên chọn, mỗi phần tử một việc; không gộp nhiều bước, không ghi \"Bước 1 –\" trong phần tử."),
  phanHoa: z.object({ namTot: z.string(), canCungCo: z.string(), canHoTro: z.string() }).describe("Nhiệm vụ cho 3 nhóm mức đạt."),
  baoCao: z.string(),
  ketLuan: z.string().describe("Kiến thức trọng tâm GV chốt."),
  sanPham: z.string(),
});

export const SchemaCauHoi = z.object({
  nhieuLuaChon: z.array(z.object({
    mucDo: muc, cauHoi: z.string(),
    phuongAn: z.array(z.string()).describe("Đúng 4 phương án theo thứ tự A, B, C, D; không ghi chữ A. B. ở đầu."),
    dapAn: z.enum(["A", "B", "C", "D"]),
    loiHieu: z.array(z.string()).describe("Lỗi hiểu ứng với từng phương án sai."),
    loiGiai: z.string(),
    cauTuongTu: z.string().describe("Câu tương tự cho lượt 2."),
  })),
  dungSai: z.array(z.object({
    mucDo: muc, boiCanh: z.string().describe("Tình huống, bảng số liệu, tư liệu hoặc mô tả cụ thể."),
    y: z.array(z.object({ noiDung: z.string(), dung: z.boolean() })).describe("Đúng 4 ý a, b, c, d."),
  })),
  traLoiNgan: z.array(z.object({ mucDo: muc, cauHoi: z.string(), dapAn: z.string() })),
  tuLuan: z.array(z.object({ cauHoi: z.string(), huongDanCham: z.string() })),
});

export const SchemaHd3 = z.object({
  mucTieu: z.string(),
  phuongPhap: z.string().describe("Cách tổ chức chọn cho hoạt động và lí do ngắn."),
  buoc: z.array(SchemaBuoc).describe("2–5 bước, tổng số phút bằng thời lượng HĐ III."),
  thietBi: z.array(z.string()).describe("Thiết bị, học liệu dùng; chỉ lấy trong danh sách có sẵn."),
  vanDung: z.array(z.object({ tieuDe: z.string(), noiDung: z.string(), loiGiai: z.string() })).describe("Vận dụng 1 là tình huống mở đầu ở HĐ I; có thể thêm Vận dụng 2."),
  sanPham: z.string(),
  tieuChi: z.array(z.string()),
  danhGia: z.string().describe("Cách kiểm tra, đánh giá: GV quan sát gì, dùng phiếu/bảng kiểm nào, khi nào."),
  anToan: z.string().describe("Biện pháp an toàn nếu có thí nghiệm, thực hành kĩ thuật, vận động; để trống nếu không có."),
});

export const SchemaHd4 = z.object({
  exitTicket: z.array(z.object({ mucDo: muc, cauHoi: z.string(), dapAn: z.string() })).describe("3 câu NB, TH, VD; không trùng câu luyện tập."),
  chotKienThuc: z.string(),
});

export const SchemaGd1 = z.object({
  noiDungTuHoc: z.string().describe("Nội dung kiến thức nền HS đọc trước, tóm tắt một câu."),
  cauHoi: z.array(z.object({ muc: z.enum(["Lý thuyết", "Cơ bản", "Nâng cao"]), cauHoi: z.string(), dapAn: z.string() })).describe("Mỗi mức 1–2 câu."),
});

/**
 * Soạn lại một hoạt động của KHBD gốc theo cách tổ chức GV chọn (giữ bố cục): AI viết mục tiêu, các bước, sản phẩm,
 * tiêu chí; tư liệu của GV (câu hỏi, ví dụ, bài tập, bảng…) chỉ trả mã đoạn để code chép nguyên văn vào đúng bước.
 */
export const schemaHdMoi = (ctx: NguCanhSoan, maHd: string) => {
  const ma = enumTu(doanCuaHoatDong(ctx, maHd).map((d) => d.ma));
  return z.object({
    mucTieu: z.string().describe("Mục tiêu của hoạt động (giữ đúng kiến thức, kĩ năng của hoạt động cũ)."),
    cachToChuc: z.string().describe("Cách tổ chức giáo viên đã chọn và lí do ngắn."),
    buoc: z.array(SchemaBuoc.extend({
      maDoan: z.array(ma).describe("Mã đoạn tư liệu của giáo viên (câu hỏi, ví dụ, bài tập, tình huống, bảng, kiến thức) dùng ở bước này; app chép nguyên văn."),
    })).describe("2–5 bước theo cách tổ chức đã chọn; tổng số phút bằng thời lượng hoạt động (nếu có)."),
    thietBi: z.array(z.string()).describe("Thiết bị, học liệu dùng; chỉ lấy trong danh sách có sẵn."),
    sanPham: z.string(),
    tieuChi: z.array(z.string()),
    doanThay: z.array(ma).describe("Mã đoạn chỉ mô tả cách tổ chức cũ (việc GV/HS theo cách cũ) nay được thay bằng các bước mới. Không ghi đoạn câu hỏi, ví dụ, bài tập, kiến thức."),
  });
};
export type HdMoi = z.infer<ReturnType<typeof schemaHdMoi>>;

const dsThanhPhan = (maMon: string | null) =>
  (nangLucDacThu.mon.find((m) => m.ma_mon === maMon)?.nang_luc ?? []).flatMap((nl) =>
    nl.thanh_phan.length ? nl.thanh_phan.map((tp) => ({ ma: tp.ma, ten: `${nl.ten} – ${tp.ten}` })) : [{ ma: nl.ma, ten: nl.ten }]);

export const schemaDacThu = (ctx: NguCanhSoan) =>
  z.object({
    thanhPhan: z.array(z.object({
      ma: enumTu(dsThanhPhan(ctx.thongTin.mon).map((t) => t.ma)),
      yeuCau: z.array(enumTu(maYeuCau(ctx))).describe("Mã yêu cầu cần đạt (mục I.1) mà thành phần này phục vụ."),
      bieuHien: z.string().describe("Câu bắt đầu bằng \"Học sinh\": hành động quan sát được + nội dung kiến thức/kĩ năng của bài + kết quả cần đạt (dùng \"được\"). Không chép tên hay định nghĩa năng lực."),
      viTri: enumTu(ctx.keHoach.oViTri.map((o) => o.ma)),
      sanPham: z.string().describe("Sản phẩm HS tạo ra ở hoạt động đó, dùng để đánh giá."),
      tieuChi: z.string().describe("Đạt khi … (kiểm tra được trên sản phẩm)."),
    })).describe("1–3 thành phần thật sự được hình thành trong bài; mỗi thành phần một lần."),
  });

/** Mã các yêu cầu cần đạt (mục I.1) của GV; không có thì dùng mã giả "KHONG" để khuôn hợp lệ. */
const maYeuCau = (ctx: NguCanhSoan) => {
  const ds = ctx.doan.filter((d) => d.loai === "MT" && d.nhomMucTieu === "I.1").map((d) => d.ma);
  return ds.length ? ds : ["KHONG"];
};

export const schemaNls = (ctx: NguCanhSoan, maDuocChon: string[]) =>
  z.object({
    nls: z.array(z.object({
      ma: enumTu(maDuocChon),
      viTri: enumTu(ctx.keHoach.oViTri.map((o) => o.ma)),
      bieuHien: z.string().describe("Không có chữ HS ở đầu; động từ thao tác số + nội dung của bài + kết quả cần đạt."),
      congCu: z.string().describe("Công cụ số HS dùng, lấy trong thiết bị có sẵn hoặc nền tảng giáo viên đã chọn; nếu lớp không có thiết bị thì làm ở nhà và ghi rõ."),
      phut: z.number().int().describe("Số phút của nhiệm vụ số (2–10)."),
      dieuChinh: z.string().describe("Lấy thời gian từ bước nào trong chính hoạt động đó để tổng thời lượng không đổi."),
      minhChung: z.string().describe("Sản phẩm số HS tạo và lưu, dùng làm minh chứng đánh giá."),
      tieuChi: z.string().describe("Đạt khi …"),
    })).describe("Chỉ những mã có nhiệm vụ số thực tế trong một hoạt động của bài; mỗi mã một lần."),
    boQua: z.array(z.object({ ma: enumTu(maDuocChon), lyDo: z.string() })).describe("Mã giáo viên chọn nhưng bài không có hoạt động thực tế tương ứng."),
  });

export const SchemaClil = z.object({
  tuKhoa: z.array(z.object({ en: z.string(), vi: z.string() })).describe("5–8 key words/cụm thuật ngữ tiếng Anh của hoạt động, đúng môn và cấp lớp."),
  nhiemVu: z.array(z.string()).describe("1–2 nhiệm vụ HS dùng các key words khi thao tác, ghi phiếu hoặc báo cáo ngắn; không yêu cầu nói câu tiếng Anh hoàn chỉnh."),
});

export const schemaGoiYNls = (ctx: NguCanhSoan) =>
  z.object({
    goiY: z.array(z.object({
      ma: enumTu(ctx.nlsChiBao.map((c) => c.ma)),
      viTri: enumTu(ctx.keHoach.oViTri.map((o) => o.ma)),
      lyDo: z.string().describe("Căn cứ nội dung kiến thức và cách tổ chức của bài, và nhiệm vụ số cụ thể làm hình thành chỉ báo này."),
    })).describe("1–3 mã phù hợp nhất."),
  });

/** Mã các hoạt động để gợi ý triển khai: khung 3 giai đoạn khi có LHĐN, nếu không là hoạt động trong giáo án gốc. */
export const hoatDongGoiY = (ctx: NguCanhSoan): { ma: string; ten: string }[] =>
  ctx.luaChon.lhdn
    ? [["GD1", "Giai đoạn 1: Tự học ở nhà trước tiết học"], ["HD1", "HĐ I. Khởi động & chỉnh lỗi"], ["HD2", "HĐ II. Luyện tập phân hóa"], ["HD3", "HĐ III. Vận dụng thực tế"], ["HD4", "HĐ IV. Đánh giá, phản tư"]].map(([ma, ten]) => ({ ma, ten }))
    : ctx.hoatDong.map((h) => ({ ma: h.ma, ten: h.ten }));

export const schemaGoiYToChuc = (ctx: NguCanhSoan) =>
  z.object({
    hoatDong: z.array(z.object({
      ma: enumTu(hoatDongGoiY(ctx).map((h) => h.ma)),
      cachLam: z.string().describe("Tên cách tổ chức, ngắn (vd: Đóng kịch tình huống, Mảnh ghép, Trạm luyện tập)."),
      moTa: z.string().describe("Diễn biến cụ thể với nội dung bài: HS làm gì, với tư liệu/tình huống nào, sản phẩm gì."),
      tichHop: z.array(z.string()).describe("Cách tích hợp chức năng giáo viên đã chọn (năng lực số, AI, tiếng Anh) vào hoạt động này; rỗng nếu không hợp."),
      lyDo: z.string().describe("Căn cứ: nội dung nào của bài, dòng nào của bảng khung."),
    })).describe("Mỗi hoạt động một gợi ý."),
  });
export type GoiYToChuc = { hoatDong: { ma: string; cachLam: string; moTa: string; tichHop: string[]; lyDo: string }[] };

export const SchemaAi = z.object({
  cauLenhMau: z.string().describe("Câu lệnh xin gợi ý, cụ thể cho nhiệm vụ của bài, không yêu cầu AI làm thay."),
  doiChieu: z.string().describe("HS đối chiếu phản hồi AI với nguồn nào (SGK, tư liệu, số liệu, kết quả thí nghiệm)."),
});

export const SchemaKiemDinh = z.object({
  dapAn: z.array(z.object({ cau: z.number(), dapAn: z.enum(["A", "B", "C", "D"]) })),
});

export const SchemaTiengAnh = z.object({
  tieuDe: z.string(),
  mucTieu: z.string(),
  toChuc: z.array(z.string()),
  nhiemVu: z.array(z.string()),
  sanPham: z.string(),
  tieuChi: z.array(z.string()),
});

export type Hd1 = z.infer<typeof SchemaHd1>;
export type Hd2 = z.infer<typeof SchemaHd2>;
export type CauHoi = z.infer<typeof SchemaCauHoi>;
export type Hd3 = z.infer<typeof SchemaHd3>;
export type Hd4 = z.infer<typeof SchemaHd4>;
export type Gd1 = z.infer<typeof SchemaGd1>;
export type DacThu = { thanhPhan: { ma: string; yeuCau: string[]; bieuHien: string; viTri: string; sanPham: string; tieuChi: string }[] };
export type NlsSoan = { nls: { ma: string; viTri: string; bieuHien: string; congCu: string; phut: number; dieuChinh: string; minhChung: string; tieuChi: string }[]; boQua: { ma: string; lyDo: string }[] };
export type ClilSoan = z.infer<typeof SchemaClil>;
export type GoiYNls = { goiY: { ma: string; viTri: string; lyDo: string }[] };
export type AiSoan = z.infer<typeof SchemaAi>;
export type KiemDinh = z.infer<typeof SchemaKiemDinh>;
export type TiengAnhSoan = z.infer<typeof SchemaTiengAnh>;

/** Kết quả các lượt (khóa = mã lượt). */
export type NoiDungSoan = Partial<{
  gd1: Gd1; hd1: Hd1; hd2: Hd2; cau_hoi: CauHoi; hd3: Hd3; hd4: Hd4; dac_thu: DacThu;
  nls: NlsSoan; ai: AiSoan; kiem_dinh: KiemDinh; tieng_anh: TiengAnhSoan; clil: ClilSoan;
  doc_hinh: DocHinhSoan;
}> & Partial<Record<`tk_${string}`, HdMoi>>;

// ---------- Nội dung gửi LLM ----------

const tenMon = (ctx: NguCanhSoan) => nangLucDacThu.mon.find((m) => m.ma_mon === ctx.thongTin.mon)?.ten_mon ?? "";

const TEN_VI_TRI: Record<string, string> = { GD1: "Giai đoạn 1", HD1: "HĐ I", HD2: "HĐ II", HD3: "HĐ III", HD4: "HĐ IV" };

const TUOI: Record<number, string> = { 10: "15–16", 11: "16–17", 12: "17–18" };

/** Bối cảnh để thiết kế một hoạt động: đối tượng, thời lượng, thiết bị có sẵn, nội dung GV đã có cho hoạt động đó. */
export function boiCanhHoatDong(ctx: NguCanhSoan, hd: string): string {
  const phut = phutHoatDong(ctx.keHoach, hd);
  const lop = ctx.thongTin.lop;
  return [
    "BỐI CẢNH THIẾT KẾ HOẠT ĐỘNG:",
    `- Đối tượng: học sinh lớp ${lop ?? ""}${lop ? ` (khoảng ${TUOI[lop]} tuổi)` : ""}.`,
    phut ? `- Thời lượng: ${phut} phút (tổng các bước phải bằng đúng ${phut} phút).` : "- Thời lượng: giữ đúng thời lượng của hoạt động trong giáo án.",
    `- Thiết bị, học liệu có sẵn (chỉ dùng những thứ này): ${thietBiCoSan(ctx).join("; ")}.`,
  ].join("\n");
}

export function moTaBai(ctx: NguCanhSoan): string {
  const { thongTin: tt, luaChon: lc, keHoach: kh } = ctx;
  const theoMa = new Map(ctx.doan.map((d) => [d.ma, d]));
  const dong: string[] = [
    `Môn: ${tenMon(ctx)}. Lớp: ${tt.lop ?? ""}. Bài: ${tt.tenBai ?? ""}. Số tiết: ${tt.soTiet ?? 1} (mỗi tiết 45 phút).`,
  ];
  if (kh.thoiLuong) {
    dong.push("Thời lượng trên lớp:");
    for (const t of kh.thoiLuong) dong.push(`Tiết ${t.tiet}${t.nhan ? ` (${t.nhan})` : ""}: ${t.muc.map((m) => `${m.ten} ${m.phut} phút`).join("; ")}.`);
  }
  dong.push("Yêu cầu cần đạt (mục I.1 của giáo viên):");
  for (const d of ctx.doan.filter((x) => x.loai === "MT" && x.nhomMucTieu === "I.1")) dong.push(`${d.ma}: ${d.vanBan}`);
  if (lc.mach.length) dong.push(`Các ${lc.phuongAn === "B" ? "mạch" : "mục"}: ${lc.mach.map((m, i) => `${i + 1}. ${m.ten} (${m.yeuCau.join(", ")})`).join("; ")}.`);
  if (lc.hinhThucHD2.length) dong.push(`Hình thức tổ chức HĐ II giáo viên chọn: ${lc.hinhThucHD2.join(", ")}.`);
  if (lc.hinhThucHD3.length) dong.push(`Hình thức tổ chức HĐ III giáo viên chọn: ${lc.hinhThucHD3.join(", ")}.`);
  for (const [ma, cach] of Object.entries(lc.trienKhai ?? {})) {
    if (!cach.trim()) continue;
    const ten = ctx.hoatDong.find((h) => h.ma === ma)?.ten ?? TEN_VI_TRI[ma] ?? ma;
    dong.push(`Cách triển khai giáo viên đã duyệt cho ${ten}: ${cach.trim()}`);
  }
  if (lc.dinhHuongHD2.trim()) dong.push(`Diễn biến HĐ II giáo viên đã duyệt: ${lc.dinhHuongHD2.trim()}`);
  if (lc.dinhHuongHD3.trim()) dong.push(`Nhiệm vụ HĐ III giáo viên đã duyệt: ${lc.dinhHuongHD3.trim()}`);
  dong.push(lc.nenTang.length ? `Nền tảng số giáo viên chọn: ${lc.nenTang.join(", ")}.` : "Giáo viên không chọn nền tảng số cho HĐ II: không nhắc tên nền tảng nào.");
  dong.push(lc.tuHoc.bat ? `Học sinh tự học trước giờ học${lc.tuHoc.nenTang ? ` trên ${lc.tuHoc.nenTang}` : ""}.` : "Không có tự học trước giờ học.");
  dong.push("Vị trí trong bài (mã: nhãn): " + kh.oViTri.map((o) => `${o.ma}: ${o.nhan}`).join("; ") + ".");
  dong.push("Nội dung giáo án của giáo viên, theo hoạt động cũ (chỉ để tham khảo; không chép lại; khi dùng thì ghi mã đoạn):");
  for (const h of ctx.hoatDong) {
    dong.push(`${h.ten}:`);
    for (const m of [...h.doan, ...(h.kem ?? [])]) { const d = theoMa.get(m); if (d) dong.push(`  ${d.ma}: ${d.vanBan}`); }
  }
  return dong.join("\n");
}

function heThong(ctx: NguCanhSoan, them: string[]): string {
  const ds = ["luat_loi", "cong_thuc", ctx.luaChon.ai ? "ai" : "khong_ai", ...them];
  if (ctx.luaChon.lhdn && LUAT.lhdn) ds.push("lhdn");
  return [
    "Bạn hỗ trợ giáo viên THPT Việt Nam soạn kế hoạch bài dạy theo khung Giai đoạn 1 – 3, HĐ I – IV. Bạn chỉ viết phần được giao, trả về đúng một đối tượng JSON theo khuôn mẫu.",
    ...[...new Set(ds)].map((k) => LUAT[k]).filter(Boolean),
  ].join("\n\n");
}

export type DinhNghiaLuot = {
  ma: string;
  schema: (ctx: NguCanhSoan) => z.ZodType;
  yeuCau: (ctx: NguCanhSoan, truoc: NoiDungSoan) => string;
  luatThem: string[];
};

const phutHd2 = (kh: KeHoach) => (kh.thoiLuong ?? []).map((t) => t.muc.filter((m) => m.hd === "HD2").reduce((s, m) => s + m.phut, 0)).find((p) => p > 0) ?? 15;

export const DINH_NGHIA: Record<string, DinhNghiaLuot> = {
  gd1: {
    ma: "gd1", schema: () => SchemaGd1, luatThem: ["cau_hoi"],
    yeuCau: () => "Viết phần Giai đoạn 1 (tự học ở nhà trước tiết học): nội dung kiến thức nền HS đọc trước và câu hỏi trọng tâm có đáp án theo 3 mức Lý thuyết – Cơ bản – Nâng cao, mỗi mức 1–2 câu, bám SGK để hệ thống chấm được.",
  },
  hd1: {
    ma: "hd1", schema: () => SchemaHd1, luatThem: ["hoat_dong"],
    yeuCau: (ctx) => "Viết phần HĐ I. Khởi động & chỉnh lỗi. Chọn cách tổ chức khởi động hợp nội dung (vd đóng vai tình huống có các vai với quan điểm khác nhau), chia 2–4 bước có số phút, việc GV, việc HS.\n" + boiCanhHoatDong(ctx, "HD1") + "\nNếu giáo viên đã có tình huống mở đầu, ghi mã đoạn đó vào maDoanTinhHuong và để trống tinhHuong. Soạn 2–3 nhận định dễ gây nhầm ứng với lỗi hay gặp ở phần tự học, kèm kết luận đúng.",
  },
  hd2: {
    ma: "hd2", schema: () => SchemaHd2, luatThem: ["to_chuc", "hoat_dong"],
    yeuCau: (ctx) => `Viết phần tổ chức HĐ II. Luyện tập phân hóa theo hình thức: ${ctx.luaChon.hinhThucHD2.join(", ") || "luyện tập bằng câu hỏi"}. Tổ chức theo 4 bước giao nhiệm vụ → thực hiện → báo cáo, thảo luận → kết luận; có nhiệm vụ riêng cho 3 nhóm Nắm tốt / Cần củng cố / Cần hỗ trợ; có phản hồi sửa lỗi và sản phẩm ghi lại được. Dùng lại câu hỏi, tình huống, tư liệu của giáo viên (ghi mã đoạn). Các bước Giao nhiệm vụ → Thực hiện → Báo cáo → Kết luận do app chia phút; viết nội dung từng bước thật cụ thể.${huongDanHd2(ctx)}\n${boiCanhHoatDong(ctx, "HD2")}`,
  },
  cau_hoi: {
    ma: "cau_hoi", schema: () => SchemaCauHoi, luatThem: ["cau_hoi"],
    yeuCau: (ctx) => `Soạn bộ câu hỏi luyện tập HĐ II theo đúng ma trận sau (không thêm, không bớt):\n${moTaMaTran(maTranCauHoi(ctx.thongTin.mon, phutHd2(ctx.keHoach)))}\nCâu hỏi của giáo viên đã có thì không viết lại; soạn câu mới phủ hết yêu cầu cần đạt.`,
  },
  hd3: {
    ma: "hd3", schema: () => SchemaHd3, luatThem: ["to_chuc", "hoat_dong"],
    yeuCau: (ctx, truoc) => `Viết phần HĐ III. Vận dụng thực tế theo hình thức: ${ctx.luaChon.hinhThucHD3.join(", ") || "thảo luận nhóm"}. Vận dụng 1 giải trọn vẹn tình huống mở đầu${truoc.hd1?.cauHoi ? ` (câu hỏi: ${truoc.hd1.cauHoi})` : ""}. Dùng lại nhiệm vụ vận dụng của giáo viên (ghi mã đoạn). Chia các bước có số phút, nêu việc GV, việc HS, sản phẩm và cách đánh giá.${huongDanHd3(ctx)}\n${boiCanhHoatDong(ctx, "HD3")}`,
  },
  hd4: {
    ma: "hd4", schema: () => SchemaHd4, luatThem: ["cau_hoi"],
    yeuCau: (_ctx, truoc) => `Viết phần HĐ IV: 3 câu exit ticket (NB, TH, VD) có đáp án, không trùng câu luyện tập${truoc.cau_hoi ? ` (đã có ${truoc.cau_hoi.nhieuLuaChon.length} câu luyện tập)` : ""}; và nội dung GV chốt kiến thức trọng tâm.`,
  },
  dac_thu: {
    ma: "dac_thu", schema: schemaDacThu, luatThem: ["bieu_hien"],
    yeuCau: (ctx) => {
      const mon = nangLucDacThu.mon.find((m) => m.ma_mon === ctx.thongTin.mon);
      return [
        `Căn cứ môn ${mon?.ten_mon ?? ""}, lớp ${ctx.thongTin.lop ?? ""} và yêu cầu cần đạt của bài (mục I.1), chọn 1–3 thành phần năng lực đặc thù thật sự được hình thành qua một hoạt động của bài; thành phần nào bài không có hoạt động tương ứng thì không chọn.`,
        "Mỗi thành phần: mã yêu cầu cần đạt mà nó phục vụ; biểu hiện theo đúng cấu trúc biểu hiện năng lực (hành động quan sát được, đánh giá được), không chép tên hay định nghĩa năng lực; vị trí (hoạt động); sản phẩm; tiêu chí đánh giá.",
        "Chỉ dùng mã trong danh sách dưới đây (năng lực đặc thù của đúng môn này), không tự đặt mã, không dùng mã của khung năng lực khác. Không thay đổi nội dung kiến thức của bài để gắn năng lực.",
        `Danh sách thành phần (mã: tên):\n${dsThanhPhan(ctx.thongTin.mon).map((t) => `${t.ma}: ${t.ten}`).join("\n")}`,
        mon ? `Ví dụ cách ghi của môn (thành phần ${mon.goi_y_thanh_phan}): ${mon.goi_y}` : "",
      ].filter(Boolean).join("\n");
    },
  },
  nls: {
    ma: "nls", schema: (ctx) => schemaNls(ctx, maNlsCoDuLieu(ctx)), luatThem: ["nls", "bieu_hien"],
    yeuCau: (ctx, truoc) => [
      "Với mỗi mã năng lực số giáo viên đã chọn: nếu bài có hoạt động thực tế đúng hành vi của mã thì viết biểu hiện (hành vi số của HS), vị trí, công cụ, minh chứng, tiêu chí; nhiệm vụ phải đúng hành vi mô tả trong chỉ báo. Nếu không có thì đưa mã vào boQua kèm lí do.",
      "Biểu hiện năng lực số không trùng biểu hiện năng lực đặc thù đã viết.",
      `Các mã đã chọn (mã: chỉ báo):\n${maNlsCoDuLieu(ctx).map((m) => `${m}: ${ctx.nlsChiBao.find((c) => c.ma === m)?.noiDung ?? ""}`).join("\n")}`,
      truoc.dac_thu?.thanhPhan.length ? `Biểu hiện năng lực đặc thù đã có:\n${truoc.dac_thu.thanhPhan.map((t) => t.bieuHien).join("\n")}` : "",
      `Thiết bị, học liệu có sẵn (công cụ số chỉ lấy trong đây hoặc giao làm ở nhà): ${thietBiCoSan(ctx).join("; ")}.`,
      "Nhiệm vụ số chen vào hoạt động có sẵn: ghi số phút và bớt thời gian ở bước nào của chính hoạt động đó.",
    ].filter(Boolean).join("\n"),
  },
  ai: {
    ma: "ai", schema: () => SchemaAi, luatThem: ["ai"],
    yeuCau: () => "Viết câu lệnh mẫu cho bước 2 của quy trình dùng AI có kiểm chứng ở HĐ III (cụ thể cho nhiệm vụ của bài) và nguồn HS dùng để đối chiếu phản hồi AI.",
  },
  kiem_dinh: {
    ma: "kiem_dinh", schema: () => SchemaKiemDinh, luatThem: [],
    yeuCau: (_ctx, truoc) => `Giải các câu trắc nghiệm sau, chỉ trả về đáp án từng câu (đánh số từ 1):\n${(truoc.cau_hoi?.nhieuLuaChon ?? []).map((c, i) => `${i + 1}. ${c.cauHoi}\n${c.phuongAn.map((p, j) => `${"ABCD"[j]}. ${p}`).join("\n")}`).join("\n\n")}`,
  },
  clil: {
    ma: "clil", schema: () => SchemaClil, luatThem: ["tieng_anh"],
    yeuCau: (ctx, truoc) => {
      const hd = ctx.luaChon.hoatDongTiengAnh ?? "HD3";
      const cu = ctx.hoatDong.find((h) => h.ma === hd);
      // LHĐN: hoạt động đã chuyển sang khung mới (phần app vừa soạn + phần GV xếp vào); giữ bố cục: hoạt động của GV.
      const vb = cu ? doanCuaHoatDong(ctx, hd).map((d) => d.vanBan).join("\n") : noiDungHdMoi(ctx, truoc, hd).join("\n");
      return `Tích hợp tiếng Anh theo CLIL vào đúng một hoạt động: ${cu ? `"${cu.ten}" của giáo viên` : hd.replace("HD", "HĐ ")}. Chọn key words/cụm thuật ngữ tiếng Anh cần thiết của hoạt động này (đúng môn, lớp ${ctx.thongTin.lop ?? ""}) và nhiệm vụ HS dùng chúng. Không dịch, không sửa các hoạt động khác.${vb ? `\nNội dung hoạt động:\n${vb}` : ""}`;
    },
  },
  tieng_anh: {
    ma: "tieng_anh", schema: () => SchemaTiengAnh, luatThem: ["tieng_anh"],
    yeuCau: (ctx, truoc) => {
      const hd = ctx.luaChon.hoatDongTiengAnh ?? "HD3";
      const cu = ctx.hoatDong.find((h) => h.ma === hd);
      if (cu) {
        // Giữ nguyên KHBD gốc: dịch đúng hoạt động của giáo viên.
        // Chỉ nội dung của hoạt động này (kể cả hoạt động con), không lấy hoạt động khác hay phụ lục.
        // Hoạt động đã soạn lại theo cách GV chọn: dịch bản mới như trong bản soạn.
        const vb = (truoc[`tk_${hd}`] ? noiDungHdMoi(ctx, truoc, hd) : doanCuaHoatDong(ctx, hd).map((d) => d.vanBan)).join("\n");
        return `Dịch toàn bộ hoạt động "${cu.ten}" của giáo viên sang tiếng Anh theo bảng thuật ngữ của khung (Objectives / Organisation / Products – Assessment); tieuDe là tên hoạt động bằng tiếng Anh. Chỉ dịch hoạt động này; dịch sát nội dung, không thêm bớt. Nội dung tiếng Việt cần dịch:\n${cu.ten}\n${vb}`;
      }
      // LHĐN: dịch hoạt động đã chuyển sang khung mới, đúng như trong bản soạn (không dịch hoạt động của KHBD gốc).
      const vb = noiDungHdMoi(ctx, truoc, hd);
      return `Dịch toàn bộ ${TEN_VI_TRI[hd] ?? hd} của KHBD đã chuyển sang khung LHĐN sang tiếng Anh theo bảng thuật ngữ của khung (Objectives / Organisation / Products – Assessment); tieuDe là tên hoạt động bằng tiếng Anh. Chỉ dịch hoạt động này; dịch sát nội dung, không thêm bớt. Nội dung tiếng Việt cần dịch:\n${vb.join("\n")}`;
    },
  },
};

/** Lượt soạn lại một hoạt động của KHBD gốc ("tk_" + mã hoạt động) theo cách triển khai GV đã chọn. */
function dinhNghiaHdMoi(maHd: string): DinhNghiaLuot {
  return {
    ma: `tk_${maHd}`, schema: (ctx) => schemaHdMoi(ctx, maHd), luatThem: ["hoat_dong"],
    yeuCau: (ctx) => {
      const h = ctx.hoatDong.find((x) => x.ma === maHd);
      const phut = phutTrongTen(h?.ten ?? "");
      return [
        `Soạn lại hoạt động "${h?.ten ?? maHd}" của giáo viên theo cách tổ chức giáo viên đã chọn: ${ctx.luaChon.trienKhai[maHd]?.trim()}`,
        phut ? `Thời lượng: ${phut} phút; tổng số phút các bước bằng ${phut}.` : "Giữ thời lượng tương đương hoạt động cũ.",
        "Giữ đúng kiến thức, kĩ năng mà hoạt động cũ hướng tới. Câu hỏi, ví dụ, bài tập, tình huống, bảng, kiến thức của giáo viên không viết lại: ghi mã đoạn vào maDoan của bước dùng nó. Đoạn chỉ mô tả cách tổ chức cũ ghi vào doanThay.",
        `Thiết bị, học liệu có sẵn: ${thietBiCoSan(ctx).join("; ")}.`,
        "Nội dung hoạt động hiện tại (mã: nội dung):",
        ...doanCuaHoatDong(ctx, maHd).map((d) => `${d.ma}: ${d.vanBan}`),
      ].join("\n");
    },
  };
}

/** Tóm tắt các hoạt động đã soạn lại (đưa vào ngữ cảnh lượt sau, vd năng lực số chen vào đúng bước mới). */
function moTaHoatDongMoi(ctx: NguCanhSoan, truoc: NoiDungSoan): string {
  const ds = Object.entries(truoc).filter(([k]) => k.startsWith("tk_")) as [string, HdMoi][];
  if (!ds.length) return "";
  return `\n\nHOẠT ĐỘNG ĐÃ SOẠN LẠI THEO CÁCH GIÁO VIÊN CHỌN:\n${ds.map(([k, h]) => `- ${ctx.hoatDong.find((x) => x.ma === k.slice(3))?.ten ?? k}: ${h.cachToChuc}; các bước: ${h.buoc.map((b) => `${b.ten} (${b.phut} phút)`).join(", ")}.`).join("\n")}`;
}

/** Nội dung hoạt động của khung mới (LHĐN) như trong bản soạn, dựng từ ngữ cảnh soạn. */
function noiDungHdMoi(ctx: NguCanhSoan, truoc: NoiDungSoan, hd: string): string[] {
  const thoatHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const pt: PhanTichGiaoAn = {
    thongTin: ctx.thongTin, hoatDong: ctx.hoatDong, canhBao: [],
    doan: ctx.doan.map((d) => ({ ...d, html: `<p>${thoatHtml(d.vanBan)}</p>` })),
  };
  return noiDungHoatDongMoi(pt, ctx.thongTin, ctx.luaChon, ctx.keHoach, truoc, hd);
}

/** Yêu cầu hoàn chỉnh cho một lượt; null khi lượt không cần LLM. */
/** Mã năng lực số GV chọn mà dữ liệu có (bỏ mã lạ), mỗi mã một lần, tối đa 3. */
export const maNlsCoDuLieu = (ctx: NguCanhSoan) => [...new Set(ctx.luaChon.maNls)].filter((m) => ctx.nlsChiBao.some((c) => c.ma === m)).slice(0, 3);

export function taoYeuCau(ma: string, ctx: NguCanhSoan, truoc: NoiDungSoan): { heThong: string; noiDung: string; schema: z.ZodType } | null {
  const dn = DINH_NGHIA[ma] ?? (ma.startsWith("tk_") && ctx.luaChon.trienKhai[ma.slice(3)]?.trim() && ctx.hoatDong.some((h) => h.ma === ma.slice(3)) ? dinhNghiaHdMoi(ma.slice(3)) : undefined);
  if (!dn) return null;
  // Không suy đoán mã: chỉ soạn năng lực số khi mã GV chọn có trong dữ liệu của app.
  if (ma === "nls" && !maNlsCoDuLieu(ctx).length) return null;
  if (ma === "kiem_dinh" && !truoc.cau_hoi?.nhieuLuaChon.length) return null;
  return {
    heThong: heThong(ctx, dn.luatThem),
    noiDung: `${moTaBai(ctx)}${moTaHinhDaDoc(truoc.doc_hinh)}${moTaHoatDongMoi(ctx, truoc)}\n\nNHIỆM VỤ:\n${dn.yeuCau(ctx, truoc)}`,
    schema: dn.schema(ctx),
  };
}

/** Yêu cầu gợi ý mã năng lực số (ở bước 2, trước khi soạn). */
export function taoYeuCauGoiYNls(ctx: NguCanhSoan): { heThong: string; noiDung: string; schema: z.ZodType } | null {
  if (!ctx.nlsChiBao.length) return null;
  return {
    heThong: heThong(ctx, ["nls"]),
    noiDung: `${moTaBai(ctx)}\n\nNHIỆM VỤ:\nChọn 1–3 chỉ báo năng lực số bậc 5 phù hợp nhất với nội dung kiến thức và cách tổ chức của bài; mỗi mã nêu vị trí và nhiệm vụ số cụ thể. Danh sách chỉ báo (mã: nội dung):\n${ctx.nlsChiBao.map((c) => `${c.ma}: ${c.noiDung}`).join("\n")}`,
    schema: schemaGoiYNls(ctx),
  };
}

/** Diễn biến, sản phẩm của hình thức GV chọn theo bảng "Gợi ý hình thức tổ chức HĐ II" của khung. */
function huongDanHd2(ctx: NguCanhSoan): string {
  const ds = GOI_Y_KHUNG.hd2.filter((h) => ctx.luaChon.hinhThucHD2.includes(h.hinh_thuc));
  return ds.length ? `\nTheo khung: ${ds.map((h) => `${h.hinh_thuc}: ${boNgoac(h.dien_bien)}; sản phẩm: ${h.san_pham}.`).join(" ")}` : "";
}

/** Dạng nhiệm vụ, sản phẩm HĐ III của môn theo bảng "Gợi ý nhiệm vụ HĐ III theo môn" của khung. */
function huongDanHd3(ctx: NguCanhSoan): string {
  const nv = nhiemVuHd3TheoMon(ctx.thongTin.mon);
  return nv ? `\nTheo khung, môn ${nv.mon}: dạng nhiệm vụ ${nv.dang_nhiem_vu}; sản phẩm: ${nv.san_pham}.` : "";
}

export function taoYeuCauGoiYToChuc(ctx: NguCanhSoan): { heThong: string; noiDung: string; schema: z.ZodType } {
  const lc = ctx.luaChon;
  const nv = nhiemVuHd3TheoMon(ctx.thongTin.mon);
  const chucNang = [
    lc.nls && `năng lực số${lc.maNls.length ? ` (mã: ${lc.maNls.map((m) => `${m}: ${ctx.nlsChiBao.find((c) => c.ma === m)?.noiDung ?? ""}`).join("; ")})` : ""}`,
    lc.ai && "năng lực AI (quy trình tự làm trước, dùng AI gợi ý, kiểm chứng)",
    lc.tiengAnh && "tiếng Anh (chọn một hoạt động để dịch ở phụ lục; CLIL bằng từ khóa)",
    lc.lhdn && "lớp học đảo ngược (khung 3 giai đoạn)",
  ].filter(Boolean);
  return {
    heThong: heThong(ctx, ["to_chuc"]),
    noiDung: [
      moTaBai(ctx),
      "",
      "BẢNG GỢI Ý HÌNH THỨC TỔ CHỨC HĐ II (LUYỆN TẬP) CỦA KHUNG (hình thức | phù hợp | diễn biến chính | sản phẩm):",
      ...GOI_Y_KHUNG.hd2.map((h) => `${h.hinh_thuc} | ${h.phu_hop} | ${boNgoac(h.dien_bien)} | ${h.san_pham}`),
      nv ? `GỢI Ý NHIỆM VỤ VẬN DỤNG CỦA KHUNG CHO MÔN ${nv.mon.toUpperCase()}: ${nv.dang_nhiem_vu}; sản phẩm: ${nv.san_pham}.` : "",
      "",
      `CHỨC NĂNG GIÁO VIÊN CHỌN: ${chucNang.join("; ") || "không có"}.`,
      "CÁC HOẠT ĐỘNG CẦN GỢI Ý (mã: tên):",
      ...hoatDongGoiY(ctx).map((h) => `${h.ma}: ${h.ten}`),
      "",
      "NHIỆM VỤ:",
      "Đọc giáo án, gợi ý cách triển khai từng hoạt động phù hợp với nội dung kiến thức của bài (vd hoạt động khởi động: đóng kịch tình huống…), và cách tích hợp các chức năng giáo viên đã chọn vào đúng hoạt động.",
    ].join("\n"),
    schema: schemaGoiYToChuc(ctx),
  };
}

export function nguCanhTu(pt: { doan: DoanGoc[]; hoatDong: HoatDongCu[] }, thongTin: ThongTinBai, luaChon: LuaChon, keHoach: KeHoach, nlsChiBao: { ma: string; noiDung: string }[]): NguCanhSoan {
  return {
    thongTin, luaChon, keHoach, nlsChiBao,
    doan: pt.doan.map(({ ma, loai, vanBan, nhomMucTieu, hoatDongCu, muc }) => ({ ma, loai, vanBan, nhomMucTieu, hoatDongCu, muc })),
    hoatDong: pt.hoatDong,
  };
}
