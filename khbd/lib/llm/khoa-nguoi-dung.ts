/**
 * Khóa AI riêng của giáo viên (mang khóa của mình). Khóa chỉ nằm trên trình duyệt của giáo viên và được gửi thẳng
 * tới nhà cung cấp (Anthropic hoặc Google); máy chủ của app không nhận, không lưu khóa.
 * Mặc định chỉ giữ trong phiên (đóng trang là mất); "Nhớ trên máy này" thì lưu trong trình duyệt của máy đó.
 */
import type { AdapterLlm } from "./index";
import { kiemTraKhoaAnthropic, MO_HINH_MAC_DINH, taoAdapterAnthropic } from "./anthropic";
import { kiemTraKhoaGemini, MO_HINH_GEMINI_MAC_DINH, taoAdapterGemini } from "./gemini";

export type NhaCungCap = "anthropic" | "gemini";
export type KhoaAi = { nhaCungCap: NhaCungCap; khoa: string; moHinh: string };

export const NHA_CUNG_CAP: Record<NhaCungCap, { ten: string; moTa: string; layKhoa: string; diaChi: string; mau: RegExp; moHinhMacDinh: string }> = {
  anthropic: {
    ten: "Claude (Anthropic)", moTa: "Trả phí theo lượng dùng; chất lượng soạn tốt nhất.",
    layKhoa: "console.anthropic.com → API Keys → Create Key", diaChi: "https://console.anthropic.com/settings/keys",
    mau: /^sk-ant-[\w-]{10,}$/, moHinhMacDinh: MO_HINH_MAC_DINH,
  },
  gemini: {
    ten: "Gemini (Google)", moTa: "Có gói miễn phí, giới hạn số lượt mỗi phút và mỗi ngày.",
    layKhoa: "aistudio.google.com → Get API key → Create API key", diaChi: "https://aistudio.google.com/apikey",
    mau: /^AIza[\w-]{20,}$/, moHinhMacDinh: MO_HINH_GEMINI_MAC_DINH,
  },
};

const TEN_LUU = "khbd.khoaAi";

/** Kho lưu trên trình duyệt; có thể vắng (bản chạy thử trong khung, chế độ riêng tư) nên mọi thao tác đều bọc try. */
const kho = (nho: boolean): Storage | null => {
  try { return nho ? window.localStorage : window.sessionStorage; } catch { return null; }
};

export function laKhoaAi(x: unknown): x is KhoaAi {
  const k = x as KhoaAi;
  return !!k && (k.nhaCungCap === "anthropic" || k.nhaCungCap === "gemini") && typeof k.khoa === "string" && k.khoa.length > 0 && typeof k.moHinh === "string";
}

export function docKhoaAi(): { khoa: KhoaAi; nho: boolean } | null {
  for (const nho of [false, true]) {
    try {
      const s = kho(nho)?.getItem(TEN_LUU);
      const k = s ? JSON.parse(s) : null;
      if (laKhoaAi(k)) return { khoa: k, nho };
    } catch { /* bỏ qua dữ liệu hỏng */ }
  }
  return null;
}

export function luuKhoaAi(khoa: KhoaAi, nho: boolean): void {
  xoaKhoaAi();
  try { kho(nho)?.setItem(TEN_LUU, JSON.stringify(khoa)); } catch { /* không lưu được thì vẫn dùng trong phiên */ }
}

export function xoaKhoaAi(): void {
  for (const nho of [false, true]) { try { kho(nho)?.removeItem(TEN_LUU); } catch { /* bỏ qua */ } }
}

/** Kiểm tra nhanh dạng khóa trước khi gọi nhà cung cấp (bắt lỗi dán thiếu, dán nhầm loại khóa). */
export function loiDangKhoa(k: KhoaAi): string | null {
  const ncc = NHA_CUNG_CAP[k.nhaCungCap];
  if (!k.khoa.trim()) return "Thầy/cô chưa dán khóa.";
  if (!ncc.mau.test(k.khoa.trim())) {
    const khac = (Object.keys(NHA_CUNG_CAP) as NhaCungCap[]).find((n) => n !== k.nhaCungCap && NHA_CUNG_CAP[n].mau.test(k.khoa.trim()));
    return khac ? `Khóa này là khóa ${NHA_CUNG_CAP[khac].ten}, không phải ${ncc.ten}. Thầy/cô chọn lại nhà cung cấp.` : `Khóa chưa đúng dạng của ${ncc.ten}. Thầy/cô kiểm tra đã sao chép đủ khóa chưa.`;
  }
  return null;
}

const cauHinh = (k: KhoaAi) => ({ apiKey: k.khoa.trim(), model: k.moHinh, trinhDuyet: true });

export function adapterTuKhoa(k: KhoaAi): AdapterLlm {
  return k.nhaCungCap === "anthropic" ? taoAdapterAnthropic(cauHinh(k)) : taoAdapterGemini(cauHinh(k));
}

export async function kiemTraKhoaAi(k: KhoaAi): Promise<void> {
  const loi = loiDangKhoa(k);
  if (loi) throw new Error(loi);
  await (k.nhaCungCap === "anthropic" ? kiemTraKhoaAnthropic(cauHinh(k)) : kiemTraKhoaGemini(cauHinh(k)));
}
