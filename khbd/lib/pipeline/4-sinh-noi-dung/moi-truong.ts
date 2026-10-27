/** Cách gọi LLM từ giao diện: qua API máy chủ (app thật) hoặc trực tiếp trên trình duyệt (bản xem trước). */
import type { GoiYNls, GoiYToChuc, NguCanhSoan, NoiDungSoan } from "./dinh-nghia";
import { goiYMaNls, goiYToChuc, soanMotLuot, type KetQuaLuot } from "./soan";
import { docMotHinh, type HinhGoc, type KetQuaDocHinh } from "./doc-hinh";
import type { AdapterLlm } from "@khbd/lib/llm";
import { locChiBao, TRINH_DO_THPT } from "@khbd/lib/data/nls";

export type HamSoanLlm = (ma: string, ctx: NguCanhSoan, truoc: NoiDungSoan, signal: AbortSignal) => Promise<KetQuaLuot>;
export type HamGoiYNls = (ctx: NguCanhSoan, signal: AbortSignal) => Promise<GoiYNls | null>;
export type HamGoiYToChuc = (ctx: NguCanhSoan, signal: AbortSignal) => Promise<GoiYToChuc>;
export type HamDocHinh = (hinh: HinhGoc, ctx: NguCanhSoan, signal: AbortSignal) => Promise<KetQuaDocHinh>;

/** Chỉ báo bậc 5 đưa vào ngữ cảnh (để LLM chọn mã trong danh sách). */
export const chiBaoNc1 = () => locChiBao({ trinhDo: TRINH_DO_THPT }).map((c) => ({ ma: c.ma, noiDung: c.noiDung }));

async function goiApi<T>(body: object, signal: AbortSignal): Promise<T> {
  const res = await fetch("/api/khbd/soan", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal });
  const json = await res.json();
  if (!res.ok) throw new Error(json.loi ?? "Không soạn được.");
  return json.duLieu as T;
}

export const soanQuaMayChu: HamSoanLlm = (ma, nguCanh, truoc, signal) => goiApi<KetQuaLuot>({ luot: ma, nguCanh, truoc }, signal);
export const goiYQuaMayChu: HamGoiYNls = (nguCanh, signal) => goiApi<GoiYNls | null>({ luot: "goi_y_nls", nguCanh, truoc: {} }, signal);
export const goiYToChucQuaMayChu: HamGoiYToChuc = (nguCanh, signal) => goiApi<GoiYToChuc>({ luot: "goi_y_to_chuc", nguCanh, truoc: {} }, signal);
/** Mỗi ảnh một yêu cầu (giữ yêu cầu nhỏ); lỗi một ảnh thì giữ ảnh gốc, không chặn ảnh khác. */
export const docHinhQuaMayChu: HamDocHinh = async (hinh, nguCanh, signal) => {
  try {
    return await goiApi<KetQuaDocHinh>({ luot: "doc_hinh", nguCanh, truoc: {}, hinh }, signal);
  } catch (e) {
    if (signal.aborted) throw e;
    return { loi: e instanceof Error ? e.message : "Không đọc được ảnh." };
  }
};

export async function giaLapQuaMayChu(): Promise<boolean> {
  try { return (await (await fetch("/api/khbd/soan")).json()).giaLap !== false; } catch { return true; }
}

/** Soạn ngay trên trình duyệt bằng một adapter (khóa riêng của giáo viên, hoặc quyền của bản xem trước). */
export function moiTruongTrinhDuyet(adapter: AdapterLlm) {
  return {
    soan: ((ma, ctx, truoc, signal) => soanMotLuot(ma, ctx, truoc, adapter, signal)) as HamSoanLlm,
    goiY: ((ctx, signal) => goiYMaNls(ctx, adapter, signal)) as HamGoiYNls,
    goiYToChuc: ((ctx, signal) => goiYToChuc(ctx, adapter, signal)) as HamGoiYToChuc,
    docHinh: ((hinh, ctx, signal) => docMotHinh(hinh, ctx.thongTin, adapter, signal)) as HamDocHinh,
    giaLap: async () => adapter.giaLap,
  };
}
