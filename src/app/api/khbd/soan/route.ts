import { NextResponse } from "next/server";
import { LoiLlm } from "@khbd/lib/llm";
import { layAdapterMayChu } from "@khbd/lib/llm/may-chu";
import { goiYMaNls, goiYToChuc, soanMotLuot } from "@khbd/lib/pipeline/4-sinh-noi-dung/soan";
import type { NguCanhSoan, NoiDungSoan } from "@khbd/lib/pipeline/4-sinh-noi-dung/dinh-nghia";
import { docMotHinh, type HinhGoc } from "@khbd/lib/pipeline/4-sinh-noi-dung/doc-hinh";

export const runtime = "nodejs";
export const maxDuration = 300;

/** Soạn một lượt (hoặc gợi ý mã năng lực số, gợi ý cách tổ chức, đọc một hình). Nhà cung cấp chọn bằng LLM_PROVIDER trong .env. */
export async function POST(req: Request) {
  try {
    const { luot, nguCanh, truoc, hinh } = (await req.json()) as { luot: string; nguCanh: NguCanhSoan; truoc: NoiDungSoan; hinh?: HinhGoc };
    const adapter = layAdapterMayChu(nguCanh);
    const duLieu = luot === "doc_hinh" && hinh
      ? await docMotHinh(hinh, nguCanh.thongTin, adapter, req.signal)
      : luot === "goi_y_nls"
      ? await goiYMaNls(nguCanh, adapter, req.signal)
      : luot === "goi_y_to_chuc"
        ? await goiYToChuc(nguCanh, adapter, req.signal)
        : await soanMotLuot(luot, nguCanh, truoc ?? {}, adapter, req.signal);
    return NextResponse.json({ duLieu, giaLap: adapter.giaLap });
  } catch (e) {
    const thongBao = e instanceof LoiLlm || e instanceof Error ? e.message : "Không soạn được.";
    return NextResponse.json({ loi: thongBao }, { status: 500 });
  }
}

/** Cho giao diện biết máy chủ đang chạy giả lập hay có khóa chung (không trả về khóa). */
export async function GET() {
  const nhaCungCap = (process.env.LLM_PROVIDER ?? "mock").toLowerCase();
  return NextResponse.json({ giaLap: nhaCungCap === "mock", nhaCungCap: nhaCungCap === "mock" ? null : nhaCungCap });
}
