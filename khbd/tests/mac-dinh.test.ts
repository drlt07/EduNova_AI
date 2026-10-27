/** Chế độ mặc định: GV chỉ bật chức năng; thiết lập con app chọn sẵn theo bài, đủ điều kiện để bấm Bắt đầu. */
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { docFile } from "@khbd/lib/pipeline/1-tai-len";
import { phanTichGiaoAn } from "@khbd/lib/pipeline/3-ke-hoach/tach-doan";
import { doiViec, kiemTraLuaChon, LUA_CHON_BAT_DAU } from "@khbd/lib/pipeline/2-lua-chon/lua-chon";
import { dienMacDinh, SO_MA_NLS_MAC_DINH } from "@khbd/lib/pipeline/2-lua-chon/mac-dinh";
import { chiBaoTheoMa } from "@khbd/lib/data/nls";

async function doc(file: string) {
  const kq = await docFile(file, fs.readFileSync(path.join(process.cwd(), "samples/input", file)));
  return phanTichGiaoAn(kq.html, file);
}
const yc = (pt: Awaited<ReturnType<typeof doc>>) => pt.doan.filter((d) => d.loai === "MT" && d.nhomMucTieu === "I.1").map((d) => d.ma);

describe.each(["toan10_bat_phuong_trinh_bac_hai.docx", "lich_su11_chien_tranh_bao_ve_to_quoc.docx", "hoa12_ester.docx", "tin10_bien_va_lenh_gan.docx", "tin11_he_dieu_hanh.docx"])("%s", (file) => {
  it("bật đủ 4 chức năng: app điền sẵn phần năng lực số, phương án; tiếng Anh GV vẫn phải chọn", async () => {
    const pt = await doc(file);
    let lc = LUA_CHON_BAT_DAU;
    for (const v of ["lhdn", "nls", "ai", "tiengAnh"] as const) lc = dienMacDinh(doiViec(lc, v, true), pt, pt.thongTin);
    expect(lc.maNls.length).toBeGreaterThan(0);
    expect(lc.maNls.length).toBeLessThanOrEqual(SO_MA_NLS_MAC_DINH);
    for (const ma of lc.maNls) expect(chiBaoTheoMa(ma), ma).toBeTruthy();
    // Tiếng Anh không chọn sẵn: còn đúng hai lỗi của tiếng Anh; GV chọn xong thì bấm Bắt đầu được.
    expect(lc.hoatDongTiengAnh).toBeNull();
    expect(lc.cachTiengAnh).toBeNull();
    expect(kiemTraLuaChon(lc, pt.thongTin.soTiet ?? 1, yc(pt))).toEqual(["Tiếng Anh: chọn cách tích hợp (dịch, CLIL hoặc cả hai).", "Tiếng Anh: chọn hoạt động tích hợp."]);
    expect(kiemTraLuaChon({ ...lc, cachTiengAnh: "ca_hai", hoatDongTiengAnh: "HD3" }, pt.thongTin.soTiet ?? 1, yc(pt))).toEqual([]);
  });

  it("chỉ năng lực số, giữ bố cục: có mã chọn sẵn; GV đã chọn mã thì giữ nguyên lựa chọn của GV", async () => {
    const pt = await doc(file);
    const lc = dienMacDinh(doiViec(LUA_CHON_BAT_DAU, "nls", true), pt, pt.thongTin);
    expect(lc.maNls.length).toBeGreaterThan(0);
    expect(lc.chuyenKhung).toBe(false);
    expect(dienMacDinh({ ...lc, maNls: ["1.1.5.1"] }, pt, pt.thongTin).maNls).toEqual(["1.1.5.1"]);
  });
});

it("bài từ 3 tiết, LHĐN: chọn sẵn phương án A; GV đã chọn B thì giữ B", async () => {
  const pt = await doc("toan10_bat_phuong_trinh_bac_hai.docx");
  const tt = { ...pt.thongTin, soTiet: 3 };
  const lc = dienMacDinh(doiViec(LUA_CHON_BAT_DAU, "lhdn", true), pt, tt);
  expect(lc.phuongAn).toBe("A");
  expect(kiemTraLuaChon(lc, 3, yc(pt))).toEqual([]);
  expect(dienMacDinh({ ...lc, phuongAn: "B" }, pt, tt).phuongAn).toBe("B");
});
