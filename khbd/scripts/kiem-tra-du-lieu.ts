/**
 * Kiểm tra dữ liệu trong data/ và sinh data/nls.json từ 3 file CSV năng lực số.
 * Chạy: npx tsx scripts/kiem-tra-du-lieu.ts
 */
import fs from "node:fs";
import path from "node:path";
import { docDuLieuNls, kiemTraDuLieuNls } from "../lib/data/nls-csv";
import duLieuDacThu from "../data/nang_luc_dac_thu.json";

const goc = path.resolve(__dirname, "..");
const doc = (t: string) => fs.readFileSync(path.join(goc, "data", t), "utf8");
const nls = docDuLieuNls({ thanhPhan: doc("nls_thanh_phan.csv"), trinhDo: doc("nls_trinh_do.csv"), chiBao: doc("nls_chi_bao.csv") });
const loi = kiemTraDuLieuNls(nls);

const ma = duLieuDacThu.mon.flatMap((m) => m.nang_luc.flatMap((nl) => [nl.ma, ...nl.thanh_phan.map((t) => t.ma)]));
const trung = ma.filter((m, i) => ma.indexOf(m) !== i);
for (const m of trung) loi.push({ tep: "nang_luc_dac_thu.json", ma: m, noiDung: "Mã trùng." });

fs.writeFileSync(path.join(goc, "data", "nls.json"), JSON.stringify(nls, null, 2) + "\n");
console.log(`Năng lực số: ${nls.mien.length} miền, ${nls.thanhPhan.length} thành phần, ${nls.trinhDo.length} trình độ, ${nls.chiBao.length} chỉ báo.`);
if (nls.chiBao.length === 0) console.log("Chưa có chỉ báo: điền data/nls_chi_bao.csv rồi chạy lại.");
if (loi.length) {
  for (const l of loi) console.log(`LỖI ${l.tep} ${l.ma}: ${l.noiDung}`);
  process.exit(1);
}
console.log("Dữ liệu hợp lệ.");
