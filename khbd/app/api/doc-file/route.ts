import { NextResponse } from "next/server";
import { docFile, LoiDocFile } from "@khbd/lib/pipeline/1-tai-len";
import { phanTichGiaoAn } from "@khbd/lib/pipeline/3-ke-hoach/tach-doan";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return NextResponse.json({ loi: "Chưa chọn file giáo án." }, { status: 400 });
    const ketQua = await docFile(file.name, Buffer.from(await file.arrayBuffer()));
    const phanTich = phanTichGiaoAn(ketQua.html, file.name);

    const sgk = form.get("sgk");
    let sgkHtml: string | null = null;
    if (sgk instanceof File && sgk.size > 0) sgkHtml = (await docFile(sgk.name, Buffer.from(await sgk.arrayBuffer()))).html;

    return NextResponse.json({
      tenFile: ketQua.tenFile,
      canhBao: [...ketQua.canhBao, ...phanTich.canhBao],
      mathType: ketQua.mathType,
      laBanScan: ketQua.laBanScan,
      phanTich,
      coSgk: sgkHtml !== null,
    });
  } catch (e) {
    if (e instanceof LoiDocFile) return NextResponse.json({ loi: e.message }, { status: 400 });
    console.error(e);
    return NextResponse.json({ loi: "Không đọc được file. Thầy/cô kiểm tra file có mở được bằng Word không." }, { status: 500 });
  }
}
