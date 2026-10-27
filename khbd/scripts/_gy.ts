import fs from "node:fs";
import { goiYHinhThucHd2, goiYHinhThucHd3, goiYViec, vanBanDeGoiY, nhiemVuHd3TheoMon } from "@khbd/lib/pipeline/2-lua-chon/goi-y-to-chuc";
import { docVaPhanTichDocx } from "@khbd/lib/pipeline/1-tai-len/kiem-tra";
(async () => {
  for (const f of fs.readdirSync("samples/input")) {
    const kq = await docVaPhanTichDocx(f, fs.readFileSync("samples/input/" + f));
    const pt = kq.phanTich, tt = pt.thongTin, vb = vanBanDeGoiY(pt, tt);
    console.log("\n" + f, tt.mon, tt.soTiet, pt.hoatDong.map((h) => h.loai + ":" + h.ten).join(" / "));
    console.log(" viec", goiYViec(pt));
    for (const g of goiYHinhThucHd2(tt.mon, vb)) console.log(" HD2", g.ten, g.diem, g.lyDo.join(" | "));
    console.log(" HD3 khung:", nhiemVuHd3TheoMon(tt.mon)?.dang_nhiem_vu);
    for (const g of goiYHinhThucHd3(tt.mon, vb, tt.soTiet)) console.log(" HD3", g.ten, g.diem, g.lyDo.join(" | "));
  }
})();
