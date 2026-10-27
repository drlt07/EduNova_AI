/**
 * Lượt "đọc hình": AI đọc từng ảnh trong giáo án gốc (bảng biến thiên, đồ thị, công thức, bảng chụp ảnh) và trả dữ
 * liệu có cấu trúc. AI chỉ đọc; app tự tính lại và đối chiếu (5-kiem-tra/doi-chieu-hinh.ts) trước khi thay ảnh.
 */
import * as z from "zod/v4";
import type { AdapterLlm, AnhLlm } from "@khbd/lib/llm";
import { LUAT } from "@khbd/lib/llm/luat.generated";
import { nangLucDacThu } from "@khbd/lib/data/nang-luc-dac-thu";
import { kichThuocHienThi, maHinh } from "../6-xuat-file/hinh";
import type { PhanTichGiaoAn, ThongTinBai } from "../kieu";

/** Kiểu ảnh mô hình đọc được (Claude và Gemini đều nhận). Ảnh EMF/WMF… giữ nguyên ảnh gốc. */
export const ANH_DOC_DUOC = ["image/png", "image/jpeg", "image/gif", "image/webp"];

/** Một ảnh của giáo án gốc: mã (maHinh), dữ liệu, đoạn văn quanh ảnh (để đọc tên hàm số, chú thích). */
export type HinhGoc = { ma: string; mime: string; base64: string; nguCanh: string; doanMa: string; kichThuoc?: { rong: number; cao: number } };

/** Lấy các ảnh trong giáo án gốc (mỗi ảnh một lần), kèm đoạn văn trước, chứa và sau ảnh. */
export function layHinh(pt: PhanTichGiaoAn): HinhGoc[] {
  const kq = new Map<string, HinhGoc>();
  pt.doan.forEach((d, i) => {
    for (const the of d.html.match(/<img\b[^>]*>/gi) ?? []) {
      const m = /\bsrc="(data:([^;"]+);base64,([^"]+))"/i.exec(the);
      if (!m) continue;
      const ma = maHinh(m[1]);
      if (kq.has(ma)) continue;
      const nguCanh = [pt.doan[i - 1]?.vanBan, d.vanBan, pt.doan[i + 1]?.vanBan].filter(Boolean).join("\n").slice(0, 600);
      const kichThuoc = kichThuocHienThi(/\balt="([^"]*)"/i.exec(the)?.[1]) ?? undefined;
      kq.set(ma, { ma, mime: m[2].toLowerCase(), base64: m[3], nguCanh, doanMa: d.ma, kichThuoc });
    }
  });
  return [...kq.values()];
}

export const docDuocAnh = (h: Pick<HinhGoc, "mime">) => ANH_DOC_DUOC.includes(h.mime);

export const SchemaDocHinh = z.object({
  loai: z.enum(["bang_bien_thien", "do_thi", "cong_thuc", "bang", "khac"]),
  moTa: z.string().describe("Một câu nói hình thể hiện gì."),
  ham: z.string().describe("Công thức hàm số ghi trên hình hoặc trong đoạn văn quanh hình; không có thì để trống."),
  bangBienThien: z.object({
    x: z.array(z.string()).describe("Nhãn các mốc x từ trái sang phải, gồm -\\infty, +\\infty."),
    daoHamMoc: z.array(z.string()).describe("Chữ ở hàng y' tại mỗi mốc: \"0\", \"||\" hoặc \"\"."),
    daoHam: z.array(z.string()).describe("Dấu y' trên từng khoảng: \"+\" hoặc \"-\"."),
    y: z.array(z.string()).describe("Giá trị hàng y tại mỗi mốc; tiệm cận đứng ghi \"trái||phải\"."),
  }),
  doThi: z.object({
    diem: z.array(z.object({ x: z.number(), y: z.number() })).describe("Điểm có tọa độ ghi rõ trên hình."),
    tiemCanDung: z.array(z.number()),
    tiemCanNgang: z.array(z.number()),
  }),
  congThuc: z.string().describe("LaTeX của công thức, không có dấu $."),
  bang: z.array(z.array(z.string())).describe("Các hàng của bảng, mỗi hàng các ô."),
  chacChan: z.enum(["cao", "vua", "thap"]),
});
export type DocHinh = z.infer<typeof SchemaDocHinh>;

/** Kết quả lượt đọc hình theo mã ảnh: `loi` khi gọi AI lỗi, `boQua` khi không gửi ảnh (giữ ảnh gốc cả hai trường hợp). */
export type KetQuaDocHinh = { doc?: DocHinh; loi?: string; boQua?: string; doanMa?: string };
export type DocHinhSoan = Record<string, KetQuaDocHinh>;

export function taoYeuCauDocHinh(h: HinhGoc, tt: ThongTinBai): { heThong: string; noiDung: string; schema: z.ZodType; anh: AnhLlm[] } {
  const mon = nangLucDacThu.mon.find((m) => m.ma_mon === tt.mon)?.ten_mon ?? "";
  return {
    heThong: ["Bạn hỗ trợ giáo viên THPT Việt Nam đọc hình trong kế hoạch bài dạy. Trả về đúng một đối tượng JSON theo khuôn mẫu.", LUAT.doc_hinh, LUAT.cong_thuc].filter(Boolean).join("\n\n"),
    noiDung: `Môn ${mon}${tt.lop ? `, lớp ${tt.lop}` : ""}${tt.tenBai ? `, bài “${tt.tenBai}”` : ""}.\nMã hình: ${h.ma}\nĐoạn văn quanh hình:\n${h.nguCanh || "(không có)"}\n\nNHIỆM VỤ:\nĐọc hình gửi kèm theo luật đã nêu.`,
    schema: SchemaDocHinh,
    anh: [{ mime: h.mime, base64: h.base64 }],
  };
}

/** Đọc một ảnh; adapter không gửi được ảnh hoặc kiểu ảnh không đọc được thì báo lí do (giữ ảnh gốc). */
export async function docMotHinh(h: HinhGoc, tt: ThongTinBai, adapter: AdapterLlm, signal?: AbortSignal): Promise<KetQuaDocHinh> {
  if (!adapter.docAnh) return { boQua: "Cách soạn đang dùng không đọc được ảnh." };
  if (!docDuocAnh(h)) return { boQua: "Kiểu ảnh này không đọc được." };
  try {
    return { doc: (await adapter.goi({ luot: "doc_hinh", ...taoYeuCauDocHinh(h, tt) }, signal)) as DocHinh };
  } catch (e) {
    if (signal?.aborted) throw e;
    return { loi: e instanceof Error ? e.message : "Không đọc được ảnh." };
  }
}

/** Đọc lần lượt các ảnh; một ảnh lỗi không chặn ảnh khác. Không ảnh nào đọc được vì lỗi thì báo lỗi cả lượt (để soạn lại). */
export async function docCacHinh(ds: HinhGoc[], docMot: (h: HinhGoc, signal: AbortSignal) => Promise<KetQuaDocHinh>, signal: AbortSignal): Promise<DocHinhSoan> {
  const kq: DocHinhSoan = {};
  for (const h of ds) {
    if (signal.aborted) throw new DOMException("Đã dừng", "AbortError");
    kq[h.ma] = { ...(await docMot(h, signal)), doanMa: h.doanMa };
  }
  const ket = Object.values(kq);
  const loi = ket.find((k) => k.loi);
  if (loi && !ket.some((k) => k.doc)) throw new Error(loi.loi);
  return kq;
}

/** Mô tả các hình đã đọc, đưa vào ngữ cảnh các lượt soạn sau (để hiểu đủ giáo án, kể cả phần nằm trong ảnh). */
export function moTaHinhDaDoc(doc: DocHinhSoan | undefined): string {
  const ds = Object.values(doc ?? {}).filter((k) => k.doc?.moTa);
  if (!ds.length) return "";
  return `\n\nHÌNH TRONG GIÁO ÁN (nội dung đọc từ ảnh):\n${ds.map((k) => `- ${k.doanMa ? `[${k.doanMa}] ` : ""}${k.doc!.moTa}`).join("\n")}`;
}
