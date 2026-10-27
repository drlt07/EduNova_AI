import type { Luot } from "./luot";

export type TrangThaiLuot = "cho" | "dang" | "xong" | "loi";
export type HamSoanLuot = (luot: Luot, signal: AbortSignal) => Promise<unknown>;

/**
 * Chạy lần lượt các lượt soạn, báo trạng thái từng lượt. Lượt lỗi không chặn lượt sau;
 * truyền `chiChay` để soạn lại riêng các lượt lỗi.
 */
export async function chaySoan(
  ds: Luot[],
  soan: HamSoanLuot,
  bao: (ma: string, trangThai: TrangThaiLuot, loi?: string) => void,
  signal: AbortSignal,
  chiChay?: Set<string>,
): Promise<Record<string, unknown>> {
  const kq: Record<string, unknown> = {};
  for (const l of ds) {
    if (chiChay && !chiChay.has(l.ma)) continue;
    if (signal.aborted) break;
    bao(l.ma, "dang");
    try {
      kq[l.ma] = await soan(l, signal);
      bao(l.ma, "xong");
    } catch (e) {
      if (signal.aborted) { bao(l.ma, "cho"); break; }
      bao(l.ma, "loi", e instanceof Error ? e.message : "Lỗi không xác định");
    }
  }
  return kq;
}
