/**
 * Chế độ mặc định: GV chỉ bật chức năng; các thiết lập con app chọn sẵn theo bài (GV vẫn sửa được).
 * - Năng lực số: 2 mã gợi ý phù hợp nhất với nội dung và cách tổ chức của bài (không có căn cứ: mã thường gắn với môn).
 * - Bài từ 3 tiết (khung mới): phương án A (B, C cần GV đặt tên mạch và gán yêu cầu cần đạt nên không chọn sẵn).
 * - AI: để trống mã = đủ mã theo khung.
 * - Tiếng Anh: KHÔNG chọn sẵn (GV yêu cầu): GV tự chọn cách tích hợp và hoạt động.
 */
import { locChiBao, TRINH_DO_THPT } from "@khbd/lib/data/nls";
import type { PhanTichGiaoAn, ThongTinBai } from "../kieu";
import { canPhuongAn, chuanHoaTheoBai, type LuaChon } from "./lua-chon";
import { goiYChiBao, maNlsTheoMon } from "./goi-y-nls";
import { vanBanDeGoiY } from "./goi-y-to-chuc";

export const SO_MA_NLS_MAC_DINH = 2;

export function dienMacDinh(lc: LuaChon, pt: PhanTichGiaoAn, tt: ThongTinBai, chiBao = locChiBao({ trinhDo: TRINH_DO_THPT })): LuaChon {
  let l = chuanHoaTheoBai(lc, pt);
  if (l.nls && l.maNls.length === 0) {
    const bai = { mon: tt.mon, vanBan: vanBanDeGoiY(pt, tt), hinhThucHD2: l.hinhThucHD2, hinhThucHD3: l.hinhThucHD3, tuHoc: l.tuHoc.bat };
    const goiY = goiYChiBao(chiBao, bai, SO_MA_NLS_MAC_DINH).map((g) => g.chiBao.ma);
    // Bài không có căn cứ gợi ý: lấy mã thường gắn với môn. Mã không có hoạt động thật sẽ bị bỏ ở bước kiểm tra chuỗi liên kết.
    l = { ...l, maNls: goiY.length ? goiY : maNlsTheoMon(tt.mon).filter((m) => chiBao.some((c) => c.ma === m)) };
  }
  if (canPhuongAn(l, tt.soTiet ?? 0) && !l.phuongAn) l = { ...l, phuongAn: "A", mach: [] };
  return l;
}
