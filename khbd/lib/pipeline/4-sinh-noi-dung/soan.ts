import type { AdapterLlm } from "@khbd/lib/llm";
import { kiemTraLuot } from "../5-kiem-tra/kiem-tra-noi-dung";
import type { LoiKiemTra } from "../5-kiem-tra/kiem-tra-file";
import { taoYeuCau, taoYeuCauGoiYNls, taoYeuCauGoiYToChuc, type GoiYNls, type GoiYToChuc, type NguCanhSoan, type NoiDungSoan } from "./dinh-nghia";

export const SO_LAN_SOAN_LAI = 2;

export type KetQuaLuot = { duLieu: unknown; loi: LoiKiemTra[]; soLanSoanLai: number } | null;

/**
 * Soạn một lượt; kết quả có lỗi nghiêm trọng thì gọi lại đúng lượt đó kèm danh sách lỗi
 * (tối đa SO_LAN_SOAN_LAI lần). Trả null khi lượt không cần LLM.
 */
export async function soanMotLuot(ma: string, ctx: NguCanhSoan, truoc: NoiDungSoan, adapter: AdapterLlm, signal?: AbortSignal): Promise<KetQuaLuot> {
  const yc = taoYeuCau(ma, ctx, truoc);
  if (!yc) return null;
  let noiDung = yc.noiDung;
  for (let lan = 0; ; lan++) {
    const duLieu = await adapter.goi({ luot: ma, ...yc, noiDung }, signal);
    const loi = kiemTraLuot(ma, duLieu, ctx, truoc);
    const nghiem = loi.filter((l) => l.nghiem);
    if (!nghiem.length || lan >= SO_LAN_SOAN_LAI) return { duLieu, loi, soLanSoanLai: lan };
    noiDung = `${yc.noiDung}\n\nLẦN SOẠN TRƯỚC CÒN LỖI, HÃY SỬA:\n${nghiem.map((l) => `- ${l.noiDung}`).join("\n")}`;
  }
}

export async function goiYMaNls(ctx: NguCanhSoan, adapter: AdapterLlm, signal?: AbortSignal): Promise<GoiYNls | null> {
  const yc = taoYeuCauGoiYNls(ctx);
  if (!yc) return null;
  return (await adapter.goi({ luot: "goi_y_nls", ...yc }, signal)) as GoiYNls;
}

export async function goiYToChuc(ctx: NguCanhSoan, adapter: AdapterLlm, signal?: AbortSignal): Promise<GoiYToChuc> {
  return (await adapter.goi({ luot: "goi_y_to_chuc", ...taoYeuCauGoiYToChuc(ctx) }, signal)) as GoiYToChuc;
}
