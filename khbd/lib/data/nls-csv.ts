/** Đọc và kiểm tra 3 file CSV năng lực số (Thông tư 02/2025). Mã chỉ báo dạng 1.1.5.1 = thành phần.bậc.thứ tự. */

export type MienNls = { ma: string; ten: string };
export type ThanhPhanNls = { ma: string; ten: string; maMien: string; moTa: string };
export type TrinhDoNls = { ma: string; ten: string; lop: string };
export type ChiBaoNls = { ma: string; maThanhPhan: string; trinhDo: string; noiDung: string };
export type DuLieuNls = { mien: MienNls[]; thanhPhan: ThanhPhanNls[]; trinhDo: TrinhDoNls[]; chiBao: ChiBaoNls[] };

/** Tách CSV (có dấu ngoặc kép, dấu phẩy trong ô, xuống dòng trong ô). */
export function tachCsv(chu: string): string[][] {
  const hang: string[][] = [];
  let o = "", dong: string[] = [], trongNgoac = false;
  const s = chu.replace(/^﻿/, "");
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (trongNgoac) {
      if (c === '"' && s[i + 1] === '"') { o += '"'; i++; }
      else if (c === '"') trongNgoac = false;
      else o += c;
    } else if (c === '"') trongNgoac = true;
    else if (c === ",") { dong.push(o); o = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && s[i + 1] === "\n") i++;
      dong.push(o); o = "";
      if (dong.some((x) => x.trim())) hang.push(dong);
      dong = [];
    } else o += c;
  }
  dong.push(o);
  if (dong.some((x) => x.trim())) hang.push(dong);
  return hang;
}

const khoa = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/gi, "d").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");

/** Đổi CSV thành danh sách đối tượng theo tên cột (không phân biệt hoa thường, có dấu hay không). */
export function csvThanhDoiTuong(chu: string): Record<string, string>[] {
  const [dau, ...hang] = tachCsv(chu);
  if (!dau) return [];
  const cot = dau.map(khoa);
  return hang.map((h) => Object.fromEntries(cot.map((c, i) => [c, (h[i] ?? "").trim()])));
}

const lay = (o: Record<string, string>, ...ten: string[]) => ten.map((t) => o[t]).find((v) => v !== undefined && v !== "") ?? "";

export function docDuLieuNls(csv: { thanhPhan: string; trinhDo: string; chiBao: string }): DuLieuNls {
  const tp = csvThanhDoiTuong(csv.thanhPhan);
  const mien = new Map<string, string>();
  const thanhPhan = tp.map((o) => {
    const ma = lay(o, "ma", "ma_thanh_phan");
    const maMien = lay(o, "ma_mien", "mien") || ma.split(".")[0];
    const tenMien = lay(o, "ten_mien");
    if (maMien && !mien.has(maMien)) mien.set(maMien, tenMien);
    return { ma, ten: lay(o, "ten", "ten_thanh_phan", "nang_luc_thanh_phan"), maMien, moTa: lay(o, "mo_ta") };
  });
  const trinhDo = csvThanhDoiTuong(csv.trinhDo).map((o) => ({ ma: lay(o, "ma", "ma_trinh_do"), ten: lay(o, "ten", "ten_trinh_do"), lop: lay(o, "lop", "cap_hoc", "doi_tuong") }));
  const chiBao = csvThanhDoiTuong(csv.chiBao).map((o) => {
    const ma = lay(o, "ma", "ma_chi_bao");
    const m = ma.match(/^(\d+\.\d+)\.(\d+)\.\d+$/);
    return { ma, maThanhPhan: lay(o, "ma_thanh_phan") || m?.[1] || "", trinhDo: lay(o, "trinh_do", "ma_trinh_do") || m?.[2] || "", noiDung: lay(o, "noi_dung", "chi_bao", "mo_ta") };
  });
  return { mien: [...mien].map(([ma, ten]) => ({ ma, ten })), thanhPhan, trinhDo, chiBao };
}

export type LoiDuLieu = { tep: string; ma: string; noiDung: string };

/** Kiểm tra: mã trùng, mã sai định dạng, chỉ báo rỗng, chỉ báo không thuộc thành phần nào. */
export function kiemTraDuLieuNls(d: DuLieuNls): LoiDuLieu[] {
  const loi: LoiDuLieu[] = [];
  const trung = (ds: { ma: string }[], tep: string) => {
    const thay = new Set<string>();
    for (const x of ds) {
      if (thay.has(x.ma)) loi.push({ tep, ma: x.ma, noiDung: "Mã trùng." });
      thay.add(x.ma);
    }
  };
  trung(d.thanhPhan, "nls_thanh_phan.csv");
  trung(d.chiBao, "nls_chi_bao.csv");
  for (const tp of d.thanhPhan) {
    if (!/^\d+\.\d+$/.test(tp.ma)) loi.push({ tep: "nls_thanh_phan.csv", ma: tp.ma, noiDung: "Mã thành phần phải có dạng 1.1." });
    if (!tp.ten) loi.push({ tep: "nls_thanh_phan.csv", ma: tp.ma, noiDung: "Thiếu tên thành phần." });
  }
  const maTp = new Set(d.thanhPhan.map((t) => t.ma));
  const maTd = new Set(d.trinhDo.map((t) => t.ma));
  for (const cb of d.chiBao) {
    if (!/^\d+\.\d+\.\d+\.\d+$/.test(cb.ma)) loi.push({ tep: "nls_chi_bao.csv", ma: cb.ma, noiDung: "Mã chỉ báo phải có dạng 1.1.5.1." });
    if (!cb.noiDung) loi.push({ tep: "nls_chi_bao.csv", ma: cb.ma, noiDung: "Chỉ báo rỗng." });
    if (maTp.size && !maTp.has(cb.maThanhPhan)) loi.push({ tep: "nls_chi_bao.csv", ma: cb.ma, noiDung: `Không có thành phần ${cb.maThanhPhan}.` });
    if (maTd.size && !maTd.has(cb.trinhDo)) loi.push({ tep: "nls_chi_bao.csv", ma: cb.ma, noiDung: `Không có trình độ ${cb.trinhDo}.` });
  }
  return loi;
}
