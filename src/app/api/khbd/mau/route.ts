import fs from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";

/** Giáo án mẫu cho bước Tải lên (chỉ các file có trong danh sách). */
const GIAO_AN_MAU = new Set(["tin10_bien_va_lenh_gan.docx", "tin11_he_dieu_hanh.docx"]);
const DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

/** Không có tham số: mẫu Word để trình duyệt điền dữ liệu và tạo file. `?giaoAn=<tên>`: giáo án mẫu. */
export async function GET(req: Request) {
  const ten = new URL(req.url).searchParams.get("giaoAn");
  if (ten && !GIAO_AN_MAU.has(ten)) return new Response("Không có giáo án mẫu này", { status: 404 });
  const file = ten ? path.join(process.cwd(), "khbd/samples/input", ten) : path.join(process.cwd(), "khbd/templates/mau.docx");
  const buf = await fs.readFile(file);
  return new Response(new Uint8Array(buf), { headers: { "Content-Type": DOCX } });
}
