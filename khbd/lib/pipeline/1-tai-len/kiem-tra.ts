import { docDocx, nhuong } from "./docx";
import { phanTichGiaoAn } from "../3-ke-hoach/tach-doan";
import type { BaoTienDo, KetQuaTaiLen } from "../kieu";

export const DUNG_LUONG_TOI_DA = 20 * 1024 * 1024;

export type KetQuaDocFile = {
  tenFile: string;
  loai: "docx" | "pdf";
  html: string;
  canhBao: string[];
  mathType: { stt: number; nguCanh: string }[];
  laBanScan: boolean;
};

export class LoiDocFile extends Error {}

export function kiemTraFile(tenFile: string, kichThuoc: number): "docx" | "pdf" {
  const duoi = tenFile.toLowerCase().split(".").pop();
  if (kichThuoc > DUNG_LUONG_TOI_DA) throw new LoiDocFile("File lớn hơn 20 MB. Thầy/cô vui lòng giảm dung lượng (nén ảnh) rồi tải lại.");
  if (duoi === "doc") throw new LoiDocFile("File .doc là định dạng Word cũ. Thầy/cô mở file trong Word, chọn Lưu thành (Save As) định dạng .docx rồi tải lại.");
  if (duoi !== "docx" && duoi !== "pdf") throw new LoiDocFile("Chỉ nhận file .docx hoặc .pdf.");
  return duoi;
}

export async function docFileDocx(tenFile: string, duLieu: ArrayBuffer | Uint8Array, baoTienDo?: BaoTienDo): Promise<KetQuaDocFile> {
  const canhBao: string[] = [];
  const kq = await docDocx(duLieu, baoTienDo);
  if (kq.soDoanDoiMa > 0) canhBao.push(`Đã chuyển ${kq.soDoanDoiMa} đoạn chữ mã TCVN3/VNI sang Unicode. Thầy/cô kiểm tra lại dấu ở các đoạn này.`);
  if (kq.mathType.length > 0) canhBao.push(`Có ${kq.mathType.length} công thức MathType không đọc được. Thầy/cô nhập lại các công thức này.`);
  return { tenFile, loai: "docx", html: kq.html, canhBao, mathType: kq.mathType, laBanScan: false };
}

/** Giai đoạn đọc giáo án, theo thứ tự; dùng để hiện tiến độ. */
export const GIAI_DOAN_DOC = [
  { ma: "tai_len", ten: "Tải file lên máy chủ", chiPdf: true },
  { ma: "giai_nen", ten: "Mở file Word", chiPdf: false },
  { ma: "doi_ma", ten: "Đổi chữ mã TCVN3/VNI, chuyển công thức sang LaTeX", chiPdf: false },
  { ma: "chuyen_html", ten: "Đọc nội dung, bảng, danh sách, in đậm", chiPdf: false },
  { ma: "doc_pdf", ten: "Đọc chữ trong file PDF", chiPdf: true },
  { ma: "phan_tich", ten: "Tách đoạn, nhận diện môn, lớp, tên bài, số tiết", chiPdf: false },
] as const;

/** Đọc và phân tích file .docx (chạy được cả trên trình duyệt lẫn máy chủ). */
export async function docVaPhanTichDocx(tenFile: string, duLieu: ArrayBuffer | Uint8Array, baoTienDo?: BaoTienDo): Promise<KetQuaTaiLen> {
  const kq = await docFileDocx(tenFile, duLieu, baoTienDo);
  baoTienDo?.("phan_tich");
  await nhuong();
  const phanTich = phanTichGiaoAn(kq.html, tenFile);
  baoTienDo?.("xong");
  return { tenFile, canhBao: [...kq.canhBao, ...phanTich.canhBao], mathType: kq.mathType, laBanScan: false, phanTich, coSgk: false };
}
