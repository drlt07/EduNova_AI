import type { PhanTichGiaoAn, ThongTinBai } from "../kieu";
import { canPhuongAn, chiTichHop, coClil, coDichTiengAnh, dungClil, type LuaChon } from "../2-lua-chon/lua-chon";
import { anhXaMacDinh, type DongAnhXa } from "./anh-xa";
import { kiemTraThoiLuong, lapThoiLuong, type LoiThoiLuong, type TietHoc } from "./thoi-luong";
import { oViTriKhungCu, oViTriKhungMoi, type OViTri } from "./vi-tri";

/** Phần LLM được viết; mọi phần khác code chép nguyên văn từ giáo án cũ. */
export type PhamVi = {
  giuNguyenToanBo: boolean; // chỉ tích hợp
  giuMucTieu: boolean;
  vietLaiToChuc: boolean; // tạo lại hoạt động hoặc chuyển khung
  dungKhungMoi: boolean;
  tichHop: { nls: boolean; ai: boolean; tiengAnh: boolean; clil: boolean; lhdn: boolean };
  // Danh sách mục được thêm/viết, dùng để ghép luật và chia lượt gọi LLM.
  mucDuocViet: string[];
};

export function tinhPhamVi(lc: LuaChon, maMon: string | null): PhamVi {
  const giuNguyenToanBo = chiTichHop(lc);
  const muc: string[] = [];
  if (lc.chuyenKhung) muc.push("giai_doan_1", "hd1_chinh_loi", "hd2", "hd3", "hd4", "giai_doan_3", "phu_luc_danh_gia");
  if (lc.taoLaiHoatDong) muc.push("hd2_to_chuc", "hd3_to_chuc", "cau_hoi");
  if (lc.nls) muc.push("nls_muc_tieu", "nls_hoat_dong", "ma_tran");
  if (lc.ai) muc.push("ai_muc_tieu", "ai_quy_trinh", "phieu_kiem_chung", "ma_tran");
  if (dungClil(lc, maMon)) muc.push("clil");
  if (lc.tiengAnh) muc.push("phu_luc_tieng_anh");
  if (lc.lhdn) muc.push("lhdn");
  return {
    giuNguyenToanBo,
    giuMucTieu: true,
    vietLaiToChuc: !giuNguyenToanBo,
    dungKhungMoi: lc.chuyenKhung,
    tichHop: { nls: lc.nls, ai: lc.ai, tiengAnh: coDichTiengAnh(lc), clil: dungClil(lc, maMon) && coClil(lc), lhdn: lc.lhdn },
    mucDuocViet: [...new Set(muc)],
  };
}

export type KeHoach = {
  phamVi: PhamVi;
  thoiLuong: TietHoc[] | null; // null: chỉ tích hợp, giữ thời lượng cũ
  loiThoiLuong: LoiThoiLuong[];
  anhXa: DongAnhXa[] | null; // chỉ khi chuyển khung
  oViTri: OViTri[];
};

export function lapKeHoach(pt: PhanTichGiaoAn, tt: ThongTinBai, lc: LuaChon): KeHoach {
  const phamVi = tinhPhamVi(lc, tt.mon);
  const soTiet = tt.soTiet ?? 1;
  if (phamVi.giuNguyenToanBo) {
    return { phamVi, thoiLuong: null, loiThoiLuong: [], anhXa: null, oViTri: oViTriKhungCu(pt.hoatDong) };
  }
  const pa = canPhuongAn(lc, soTiet) ? lc.phuongAn : null;
  const soMuc = pa === "C" ? lc.mach.length : undefined;
  const thoiLuong = lapThoiLuong(soTiet, pa, soMuc);
  return {
    phamVi,
    thoiLuong,
    loiThoiLuong: kiemTraThoiLuong(thoiLuong, pa),
    anhXa: lc.chuyenKhung ? anhXaMacDinh(pt.hoatDong) : null,
    oViTri: oViTriKhungMoi(thoiLuong, lc.chuyenKhung || lc.tuHoc.bat),
  };
}
