import fs from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";

/** Trả về mẫu Word để trình duyệt điền dữ liệu và tạo file. */
export async function GET() {
  const buf = await fs.readFile(path.join(process.cwd(), "templates/mau.docx"));
  return new Response(new Uint8Array(buf), {
    headers: { "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document" },
  });
}
