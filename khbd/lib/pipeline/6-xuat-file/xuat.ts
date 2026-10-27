import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import type { PhanTichGiaoAn, ThongTinBai } from "../kieu";
import type { LuaChon } from "../2-lua-chon/lua-chon";
import type { KeHoach } from "../3-ke-hoach";
import { nangLucDacThu } from "@khbd/lib/data/nang-luc-dac-thu";
import { ghepDuLieu, type TraChiBao } from "./ghep";
import { ganAnhVaoZip, KhoAnh, type HinhThay } from "./hinh";
import type { NoiDungSoan } from "../4-sinh-noi-dung/dinh-nghia";

/**
 * Điền dữ liệu vào templates/mau.docx. `mau` là nội dung file mẫu (đọc ở máy chủ hoặc nhúng sẵn).
 * Ảnh gốc được nhúng lại; `thayHinh` là các ảnh đã tạo lại và đối chiếu khớp (xem 5-kiem-tra/doi-chieu-hinh.ts).
 */
export function xuatWord(mau: ArrayBuffer | Uint8Array, pt: PhanTichGiaoAn, tt: ThongTinBai, lc: LuaChon, kh: KeHoach, danhDau: boolean, nd: NoiDungSoan = {}, traChiBao?: TraChiBao, thayHinh?: Map<string, HinhThay>): Uint8Array {
  const zip = new PizZip(mau);
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    nullGetter: () => "",
  });
  const anh = new KhoAnh();
  doc.render(ghepDuLieu(pt, tt, lc, kh, { danhDau, anh, thayHinh }, nd, traChiBao));
  ganAnhVaoZip(doc.getZip(), anh);
  return doc.getZip().generate({ type: "uint8array" });
}

/** Tên file: KHBD_<môn>_<lớp>_<tên bài>.docx, viết không dấu để trình duyệt và các ứng dụng giữ đúng tên. */
export function tenFileXuat(tt: ThongTinBai, danhDau = false): string {
  const mon = nangLucDacThu.mon.find((m) => m.ma_mon === tt.mon)?.ten_mon ?? "Mon";
  const ten = (tt.tenBai ?? "Bai").replace(/\s*\(\s*\d+\s*tiết\s*\)\s*$/i, "");
  const sach = (s: string) => boDau(s).replace(/[^A-Za-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  // Tên bài thường viết hoa toàn bộ: đổi về chữ thường, giữ hoa chữ đầu cho dễ đọc.
  const tenBai = sach(ten === ten.toUpperCase() ? ten.toLowerCase().replace(/^./, (c) => c.toUpperCase()) : ten);
  return `KHBD_${sach(mon)}_${tt.lop ?? ""}_${tenBai}${danhDau ? "_danh_dau" : ""}.docx`;
}

function boDau(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D");
}
