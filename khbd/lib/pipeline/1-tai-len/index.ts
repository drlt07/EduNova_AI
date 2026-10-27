import { docPdf } from "./pdf";
import { docFileDocx, kiemTraFile, type KetQuaDocFile } from "./kiem-tra";

export { DUNG_LUONG_TOI_DA, docFileDocx, kiemTraFile, LoiDocFile, type KetQuaDocFile } from "./kiem-tra";

export async function docFile(tenFile: string, buffer: Buffer): Promise<KetQuaDocFile> {
  const loai = kiemTraFile(tenFile, buffer.length);
  if (loai === "docx") return docFileDocx(tenFile, buffer);
  const canhBao: string[] = [];
  const kq = await docPdf(buffer);
  if (kq.maHoa !== "unicode") canhBao.push(`Văn bản dùng mã ${kq.maHoa.toUpperCase()}, đã chuyển sang Unicode. Thầy/cô kiểm tra lại dấu.`);
  if (kq.laBanScan) canhBao.push("File PDF là bản chụp (scan), không có lớp chữ. Nội dung sẽ được đọc từ ảnh từng trang ở bước soạn.");
  canhBao.push("File PDF không giữ được bảng và công thức như file Word. Nếu có bản .docx, thầy/cô nên tải bản đó.");
  return { tenFile, loai, html: kq.html, canhBao, mathType: [], laBanScan: kq.laBanScan };
}
