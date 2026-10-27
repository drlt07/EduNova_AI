/**
 * Cách trợ lý soạn KHBD chạy trong app Next.js: đọc PDF, soạn bằng khóa chung và lấy mẫu Word qua /api/khbd/*;
 * giáo viên có thể dùng khóa AI riêng (chỉ lưu ở trình duyệt). Bản demo một file thay module này bằng spa/shims/khbd-runtime.ts.
 */
import type { GiaoAnMau, HamDocFile } from "@khbd/components/tao-khbd/Buoc1TaiLen";
import type { HamLayMau, HamLuuFile } from "@khbd/components/tao-khbd/Buoc56";
import type { MoiTruongSoan } from "@khbd/app/tao-khbd/TaoKhbd";

export interface KhbdRuntime {
  /** Không đặt: .docx đọc trên trình duyệt, PDF gửi máy chủ */
  docFile?: HamDocFile;
  giaoAnMau: GiaoAnMau[];
  /** Không đặt: soạn qua máy chủ (khóa chung trong .env) */
  moiTruong?: MoiTruongSoan;
  layMau?: HamLayMau;
  luuFile?: HamLuuFile;
  /** Cho giáo viên nhập khóa AI riêng */
  khoaRieng: boolean;
  /** Ghi chú hiển thị về cách soạn đang dùng */
  moTa: string;
}

const mau = (ten: string, file: string): GiaoAnMau => ({
  ten,
  layFile: async () => new File([await (await fetch(`/api/khbd/mau?giaoAn=${file}`)).arrayBuffer()], file),
});

export const KHBD_RUNTIME: KhbdRuntime = {
  giaoAnMau: [mau("Tin học 10 – Biến và lệnh gán", "tin10_bien_va_lenh_gan.docx"), mau("Tin học 11 – Hệ điều hành", "tin11_he_dieu_hanh.docx")],
  khoaRieng: true,
  moTa: "Đọc được .docx và .pdf. Soạn bằng khóa chung của máy chủ hoặc khóa AI riêng của thầy/cô.",
};
