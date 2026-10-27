/// <reference types="vite/client" />
/**
 * Bản demo một file (không có máy chủ): đọc .docx ngay trên trình duyệt, mẫu Word và giáo án mẫu nhúng sẵn.
 * Soạn bằng quyền "sample" của trang Claude (tài khoản người xem); ngoài Claude thì dùng nội dung giả lập.
 * Tải file bằng quyền "downloads" của trang Claude; ngoài Claude thì tải bình thường.
 */
import type { KhbdRuntime } from "@/lib/khbd/runtime";
import type { HamDocFile } from "@khbd/components/tao-khbd/Buoc1TaiLen";
import type { HamLuuFile } from "@khbd/components/tao-khbd/Buoc56";
import { luuQuaTrinhDuyet } from "@khbd/components/tao-khbd/Buoc56";
import { docVaPhanTichDocx, kiemTraFile } from "@khbd/lib/pipeline/1-tai-len/kiem-tra";
import { adapterGiaLap } from "@khbd/lib/llm";
import { layAdapterSample } from "@khbd/lib/llm/sample";
import { taoMauGiaLap } from "@khbd/lib/llm/mau-gia-lap";
import { goiYMaNls, goiYToChuc, soanMotLuot } from "@khbd/lib/pipeline/4-sinh-noi-dung/soan";
import { docMotHinh } from "@khbd/lib/pipeline/4-sinh-noi-dung/doc-hinh";
import type { NguCanhSoan } from "@khbd/lib/pipeline/4-sinh-noi-dung/dinh-nghia";
import mauWord from "@khbd/templates/mau.docx?url";
import tin10 from "@khbd/samples/input/tin10_bien_va_lenh_gan.docx?url";
import tin11 from "@khbd/samples/input/tin11_he_dieu_hanh.docx?url";

const bytes = async (url: string) => new Uint8Array(await (await fetch(url)).arrayBuffer());

const docTrongTrinhDuyet: HamDocFile = async (file, _sgk, baoTienDo) => {
  if (kiemTraFile(file.name, file.size) === "pdf") throw new Error("Bản demo chỉ đọc file .docx. Khi chạy trên máy chủ, trợ lý đọc được cả PDF.");
  return docVaPhanTichDocx(file.name, new Uint8Array(await file.arrayBuffer()), baoTienDo);
};

const luuFile: HamLuuFile = async (tenFile, duLieu) => {
  const claude = (window as unknown as { claude?: { use(ten: string): Promise<{ save(r: { filename: string; data: Blob }): Promise<unknown> } | null> } }).claude;
  const tai = claude ? await claude.use("downloads").catch(() => null) : null;
  if (!tai) return luuQuaTrinhDuyet(tenFile, duLieu);
  await tai.save({ filename: tenFile, data: new Blob([duLieu.slice()]) });
};

/** Quyền "sample" có thể không có (mở ngoài Claude, người xem từ chối) → dùng nội dung giả lập. */
const coSample = () => layAdapterSample().catch(() => null);
const layAdapter = async (ctx: NguCanhSoan) => (await coSample()) ?? adapterGiaLap(taoMauGiaLap(ctx), { min: 400, max: 900 });

export const KHBD_RUNTIME: KhbdRuntime = {
  docFile: docTrongTrinhDuyet,
  giaoAnMau: [
    { ten: "Tin học 10 – Biến và lệnh gán", layFile: async () => new File([await bytes(tin10)], "tin10_bien_va_lenh_gan.docx") },
    { ten: "Tin học 11 – Hệ điều hành", layFile: async () => new File([await bytes(tin11)], "tin11_he_dieu_hanh.docx") },
  ],
  moiTruong: {
    soan: async (ma, ctx, truoc, signal) => soanMotLuot(ma, ctx, truoc, await layAdapter(ctx), signal),
    goiY: async (ctx, signal) => goiYMaNls(ctx, await layAdapter(ctx), signal),
    goiYToChuc: async (ctx, signal) => goiYToChuc(ctx, await layAdapter(ctx), signal),
    docHinh: async (hinh, ctx, signal) => docMotHinh(hinh, ctx.thongTin, await layAdapter(ctx), signal),
    giaLap: async () => (await coSample()) === null,
  },
  layMau: () => bytes(mauWord),
  luuFile,
  khoaRieng: false,
  moTa: "Bản demo: đọc file .docx ngay trên trình duyệt; khi mở trên Claude, nội dung được soạn bằng tài khoản Claude của người xem.",
};
