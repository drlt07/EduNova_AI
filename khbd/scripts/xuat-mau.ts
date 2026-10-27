/**
 * Chạy cả luồng (đọc file → phân tích → lập kế hoạch → xuất Word) cho các tổ hợp kiểm thử,
 * ghi vào samples/output/. Chưa nối AI: phần do AI viết chưa có. Chạy: npx tsx scripts/xuat-mau.ts
 */
import fs from "node:fs";
import path from "node:path";
import { docFile } from "../lib/pipeline/1-tai-len";
import { phanTichGiaoAn } from "../lib/pipeline/3-ke-hoach/tach-doan";
import { LUA_CHON_TRONG, chonTiengAnhTheoGoiY, doiViec, type LuaChon } from "../lib/pipeline/2-lua-chon/lua-chon";
import { lapKeHoach } from "../lib/pipeline/3-ke-hoach";
import { tenFileXuat, xuatWord } from "../lib/pipeline/6-xuat-file/xuat";
import { nguCanhTu, type NoiDungSoan } from "../lib/pipeline/4-sinh-noi-dung/dinh-nghia";
import { lapDanhSachLuot } from "../lib/pipeline/4-sinh-noi-dung/luot";
import { soanMotLuot } from "../lib/pipeline/4-sinh-noi-dung/soan";
import { adapterGiaLap } from "../lib/llm";
import { taoMauGiaLap } from "../lib/llm/mau-gia-lap";
import { locChiBao, TRINH_DO_THPT } from "../lib/data/nls";

const mau = fs.readFileSync(path.join(process.cwd(), "templates/mau.docx"));

export const TO_HOP: { ten: string; file: string; lc: Partial<LuaChon>; soTiet?: number }[] = [
  { ten: "1_chi_nls", file: "toan10_bat_phuong_trinh_bac_hai.docx", lc: { nls: true, maNls: ["5.2.5.2", "5.3.5.1"] } },
  {
    ten: "2_tao_lai_phien_toa", file: "lich_su11_chien_tranh_bao_ve_to_quoc.docx",
    lc: { taoLaiHoatDong: true, hinhThucHD2: ["Phiên tòa giả định"], hinhThucHD3: ["Đóng vai"], phuongAn: "B",
      mach: [{ ten: "Vai trò của chiến tranh bảo vệ Tổ quốc", yeuCau: ["MT-01"] }, { ten: "Nguyên nhân thắng lợi", yeuCau: ["MT-02", "MT-03"] }] },
  },
  { ten: "3_chuyen_khung_nls_ai_tieng_anh", file: "hoa12_ester.docx", lc: { chuyenKhung: true, nls: true, maNls: ["1.1.5.2", "3.1.5.1"], ai: true, maAi: ["NLa", "NLc", "NLd"], tiengAnh: true, cachTiengAnh: "dich", hoatDongTiengAnh: "HD3" } },
  {
    ten: "4_bon_tiet_phuong_an_C", file: "toan10_bat_phuong_trinh_bac_hai.docx", soTiet: 4,
    lc: { chuyenKhung: true, lhdn: true, phuongAn: "C", nenTang: ["Quizizz"],
      mach: [{ ten: "Nhận biết bất phương trình", yeuCau: ["MT-02"] }, { ten: "Giải bất phương trình", yeuCau: ["MT-01"] }, { ten: "Bài toán thực tiễn", yeuCau: ["MT-03"] }] },
  },
];

/** Tổ hợp có chạy bước soạn bằng adapter giả lập (nội dung ghi "giả lập"). */
export const TO_HOP_SOAN = { ten: "5_chuyen_khung_tao_lai_ai_soan_gia_lap", file: "toan10_bat_phuong_trinh_bac_hai.docx",
  lc: { chuyenKhung: true, taoLaiHoatDong: true, nls: true, maNls: ["5.2.5.2"], ai: true, maAi: ["NLa", "NLc", "NLd"], hinhThucHD2: ["Luyện tập trên nền tảng số"], hinhThucHD3: ["Dự án"], nenTang: ["Quizizz"], tiengAnh: true, hoatDongTiengAnh: "HD3" as const } };

export async function chayToHop(th: (typeof TO_HOP)[number], soan = false) {
  const nguon = fs.readFileSync(path.join(process.cwd(), "samples/input", th.file));
  const kq = await docFile(th.file, nguon);
  const pt = phanTichGiaoAn(kq.html, th.file);
  const tt = { ...pt.thongTin, soTiet: th.soTiet ?? pt.thongTin.soTiet };
  let lc: LuaChon = { ...LUA_CHON_TRONG, ...th.lc };
  if (th.lc.lhdn) lc = doiViec(lc, "lhdn", true);
  const kh = lapKeHoach(pt, tt, lc);
  const nd: NoiDungSoan = {};
  if (soan) {
    const ctx = nguCanhTu(pt, tt, lc, kh, locChiBao({ trinhDo: TRINH_DO_THPT }).map((c) => ({ ma: c.ma, noiDung: c.noiDung })));
    const adapter = adapterGiaLap(taoMauGiaLap(ctx), { min: 0, max: 0 });
    for (const l of lapDanhSachLuot(kh, lc)) {
      const kq = await soanMotLuot(l.ma, ctx, nd, adapter);
      if (kq) (nd as Record<string, unknown>)[l.ma] = kq.duLieu;
    }
  }
  return { pt, tt, lc, kh, nd, sach: xuatWord(mau, pt, tt, lc, kh, false, nd), danhDau: xuatWord(mau, pt, tt, lc, kh, true, nd) };
}

/** Các tổ hợp chức năng như giáo viên chọn trên giao diện (chọn chức năng nào thì tích hợp chức năng đó). */
export const TO_HOP_CHUC_NANG: { ten: string; file: string; lc: Partial<LuaChon> }[] = [
  { ten: "1_chi_tieng_anh_dich", file: "toan10_bat_phuong_trinh_bac_hai.docx", lc: { tiengAnh: true, cachTiengAnh: "dich" } },
  { ten: "2_chi_tieng_anh_clil", file: "lich_su11_chien_tranh_bao_ve_to_quoc.docx", lc: { tiengAnh: true, cachTiengAnh: "clil" } },
  { ten: "3_chi_nang_luc_so", file: "lich_su11_chien_tranh_bao_ve_to_quoc.docx", lc: { nls: true, maNls: ["1.1.5.2", "1.2.5.1"] } },
  { ten: "4_nls_ai_tieng_anh_giu_bo_cuc", file: "hoa12_ester.docx", lc: { nls: true, maNls: ["5.3.5.1"], ai: true, maAi: ["NLa", "NLc", "NLd"], tiengAnh: true, cachTiengAnh: "ca_hai" } },
  { ten: "5_lhdn", file: "toan10_bat_phuong_trinh_bac_hai.docx", lc: { lhdn: true } },
  { ten: "6_lhdn_nls_ai_tieng_anh", file: "toan10_bat_phuong_trinh_bac_hai.docx", lc: { lhdn: true, nls: true, maNls: ["5.2.5.2"], ai: true, maAi: ["NLa", "NLc", "NLd"], tiengAnh: true, cachTiengAnh: "ca_hai", hinhThucHD2: ["Trạm luyện tập"], hinhThucHD3: ["Giải tình huống thực tế"] } },
  { ten: "7_tin_lhdn_nls_ai_clil", file: "tin10_bien_va_lenh_gan.docx", lc: { lhdn: true, nls: true, maNls: ["3.4.5.1"], ai: true, maAi: ["NLa", "NLc", "NLd"], tiengAnh: true, cachTiengAnh: "clil" } },
  // KHBD thầy/cô gửi (đã có nhiều dòng năng lực gốc, mã kiểu cũ, phương án/đáp án chung đoạn).
  { ten: "8_tin11_lhdn_nls_ai_clil", file: "tin11_he_dieu_hanh.docx", lc: { lhdn: true, nls: true, maNls: ["1.3.5.1", "1.1.5.2"], ai: true, maAi: ["NLa", "NLc", "NLd"], tiengAnh: true, cachTiengAnh: "clil" } },
];

/** Soạn (giả lập) và xuất một tổ hợp chức năng. `boc` cho phép test đổi kết quả soạn (vd chèn lỗi để kiểm tra bước biên tập). */
export async function chayChucNang(th: (typeof TO_HOP_CHUC_NANG)[number], boc?: (luot: string, duLieu: unknown) => unknown) {
  const kq = await docFile(th.file, fs.readFileSync(path.join(process.cwd(), "samples/input", th.file)));
  const pt = phanTichGiaoAn(kq.html, th.file);
  const tt = pt.thongTin;
  let lc = chonTiengAnhTheoGoiY({ ...LUA_CHON_TRONG, ...th.lc }, pt);
  if (lc.lhdn) lc = chonTiengAnhTheoGoiY(doiViec(lc, "lhdn", true), pt);
  const kh = lapKeHoach(pt, tt, lc);
  const ctx = nguCanhTu(pt, tt, lc, kh, locChiBao({ trinhDo: TRINH_DO_THPT }).map((c) => ({ ma: c.ma, noiDung: c.noiDung })));
  const taoMau = taoMauGiaLap(ctx);
  const adapter = adapterGiaLap((luot) => (boc ? boc(luot, taoMau(luot)) : taoMau(luot)), { min: 0, max: 0 });
  const nd: NoiDungSoan = {};
  for (const l of lapDanhSachLuot(kh, lc)) {
    const r = await soanMotLuot(l.ma, ctx, nd, adapter);
    if (r) (nd as Record<string, unknown>)[l.ma] = r.duLieu;
  }
  return { pt, tt, lc, kh, nd, sach: xuatWord(mau, pt, tt, lc, kh, false, nd), danhDau: xuatWord(mau, pt, tt, lc, kh, true, nd) };
}

async function main() {
  const ra = path.join(process.cwd(), "samples/output");
  for (const f of fs.readdirSync(ra)) if (f.endsWith(".docx")) fs.rmSync(path.join(ra, f));
  for (const th of TO_HOP_CHUC_NANG) {
    const { tt, sach, danhDau } = await chayChucNang(th);
    for (const [buf, dd] of [[sach, false], [danhDau, true]] as const) {
      const ten = `${th.ten}__${tenFileXuat(tt, dd)}`;
      fs.writeFileSync(path.join(ra, ten), buf);
      console.log("Đã ghi", ten);
    }
  }
}

if (require.main === module) main();
