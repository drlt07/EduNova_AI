/**
 * Kiểm tra nội dung LLM soạn, theo từng lượt. Lỗi nghiêm trọng → soạn lại đúng lượt đó (tối đa 2 lần).
 */
import type { CauHoi, HdMoi, NguCanhSoan, NoiDungSoan } from "../4-sinh-noi-dung/dinh-nghia";
import { doanCuaHoatDong } from "../3-ke-hoach/tach-doan";
import { maTranCauHoi, type MucDo } from "../4-sinh-noi-dung/ma-tran-cau-hoi";
import { loiLatex } from "../6-xuat-file/cong-thuc";
import type { LoiKiemTra } from "./kiem-tra-file";
import { canhBaoLienKet, dungHanhViNls, lienKetNangLuc } from "./lien-ket-nang-luc";
import { coHanhViSo, kiemTraBuoc, kiemTraLapPhuongPhap, kiemTraThietBi, laCauChung, phutHoatDong, phutTrongTen, thietBiCoSan, thietBiThieu } from "./kha-thi";

const khaThi = (noiDung: string, nghiem = true): LoiKiemTra => ({ loai: "kha_thi", noiDung, nghiem });

/** Tính khả thi của HĐ I, HĐ II, HĐ III đã soạn: thời gian, số bước, việc cụ thể, thiết bị có sẵn, sản phẩm, đánh giá. */
export function kiemTraHoatDong(ma: string, duLieu: unknown, ctx: NguCanhSoan): LoiKiemTra[] {
  const coSan = thietBiCoSan(ctx);
  const kq: LoiKiemTra[] = [];
  if (ma === "hd1") {
    const h = duLieu as NonNullable<NoiDungSoan["hd1"]>;
    if (!h.cachToChuc?.trim()) kq.push(khaThi("HĐ I: chưa nêu cách tổ chức."));
    kq.push(...kiemTraBuoc(h.buoc ?? [], phutHoatDong(ctx.keHoach, "HD1"), "HĐ I"));
    kq.push(...kiemTraThietBi(h.thietBi ?? [], [h.cachToChuc, ...(h.buoc ?? []).flatMap((b) => [b.gv, b.hs])].join(" "), coSan, "HĐ I"));
  }
  if (ma === "hd2") {
    const h = duLieu as NonNullable<NoiDungSoan["hd2"]>;
    if (!h.giaoNhiemVu?.trim() || laCauChung(h.giaoNhiemVu)) kq.push(khaThi(`HĐ II: giao nhiệm vụ còn chung chung (“${h.giaoNhiemVu ?? ""}”).`));
    for (const s of h.thucHien) if (laCauChung(s)) kq.push(khaThi(`HĐ II: bước thực hiện còn chung chung (“${s}”).`));
    if (laCauChung(h.baoCao)) kq.push(khaThi(`HĐ II: báo cáo, thảo luận còn chung chung (“${h.baoCao}”).`));
    if (!h.sanPham?.trim()) kq.push(khaThi("HĐ II: thiếu sản phẩm học tập."));
    kq.push(...kiemTraThietBi(h.thietBi ?? [], [h.giaoNhiemVu, ...h.thucHien, h.baoCao].join(" "), coSan, "HĐ II"));
  }
  if (ma === "hd3") {
    const h = duLieu as NonNullable<NoiDungSoan["hd3"]>;
    if (!h.phuongPhap?.trim()) kq.push(khaThi("HĐ III: chưa nêu cách tổ chức."));
    kq.push(...kiemTraBuoc(h.buoc ?? [], phutHoatDong(ctx.keHoach, "HD3"), "HĐ III"));
    kq.push(...kiemTraThietBi(h.thietBi ?? [], [h.phuongPhap, ...(h.buoc ?? []).flatMap((b) => [b.gv, b.hs])].join(" "), coSan, "HĐ III"));
    if (!h.sanPham?.trim()) kq.push(khaThi("HĐ III: thiếu sản phẩm học tập."));
    if (!h.tieuChi.length) kq.push(khaThi("HĐ III: thiếu tiêu chí đánh giá."));
    if (!h.danhGia?.trim() || laCauChung(h.danhGia)) kq.push(khaThi("HĐ III: cách kiểm tra, đánh giá còn thiếu hoặc chung chung."));
  }
  if (ma.startsWith("tk_")) {
    const h = duLieu as HdMoi;
    const ten = ctx.hoatDong.find((x) => x.ma === ma.slice(3))?.ten ?? ma.slice(3);
    if (!h.cachToChuc?.trim()) kq.push(khaThi(`${ten}: chưa nêu cách tổ chức.`));
    kq.push(...kiemTraBuoc(h.buoc ?? [], phutTrongTen(ten), ten));
    kq.push(...kiemTraThietBi(h.thietBi ?? [], [h.cachToChuc, ...(h.buoc ?? []).flatMap((b) => [b.gv, b.hs])].join(" "), coSan, ten));
    if (!h.sanPham?.trim()) kq.push(khaThi(`${ten}: thiếu sản phẩm học tập.`));
    if (!h.tieuChi?.length) kq.push(khaThi(`${ten}: thiếu tiêu chí đánh giá.`));
    // Câu hỏi, bài tập của GV phải được dùng ở một bước (không bỏ rơi tư liệu).
    const daDung = new Set([...(h.buoc ?? []).flatMap((b) => b.maDoan), ...(h.doanThay ?? [])]);
    const chuaDung = doanCuaHoatDong(ctx, ma.slice(3)).filter((d) => d.loai === "CH" && !daDung.has(d.ma));
    if (chuaDung.length) kq.push(khaThi(`${ten}: chưa đặt câu hỏi/bài tập của giáo viên vào bước nào (${chuaDung.map((d) => d.ma).join(", ")}).`, false));
  }
  if (ma === "clil") {
    const c = duLieu as NonNullable<NoiDungSoan["clil"]>;
    for (const t of thietBiThieu(c.nhiemVu.join(" "), coSan)) kq.push(khaThi(`Tiếng Anh (CLIL): cần ${t} nhưng giáo án không có.`));
  }
  return kq;
}
import { nangLucDacThu } from "@khbd/lib/data/nang-luc-dac-thu";
import { boDauThuong } from "@khbd/lib/data/nls";

const giongNhau = (a: string, b: string) => boDauThuong(a).replace(/[^a-z0-9]+/g, " ").trim() === boDauThuong(b).replace(/[^a-z0-9]+/g, " ").trim();
const nghiem = (noiDung: string): LoiKiemTra => ({ loai: "lien_ket", noiDung, nghiem: true });

/** Năng lực đặc thù: 1–3 thành phần đúng môn, không lặp; mỗi thành phần đủ yêu cầu cần đạt, biểu hiện, vị trí, sản phẩm, tiêu chí. */
export function kiemTraDacThu(d: NonNullable<NoiDungSoan["dac_thu"]>, ctx: NguCanhSoan): LoiKiemTra[] {
  const kq: LoiKiemTra[] = [];
  const mon = nangLucDacThu.mon.find((m) => m.ma_mon === ctx.thongTin.mon);
  const ten = new Map((mon?.nang_luc ?? []).flatMap((nl) => [[nl.ma, nl.ten] as const, ...nl.thanh_phan.map((tp) => [tp.ma, tp.ten] as const)]));
  const viTri = new Set(ctx.keHoach.oViTri.map((o) => o.ma));
  const coYeuCau = ctx.doan.some((x) => x.loai === "MT" && x.nhomMucTieu === "I.1");
  if (d.thanhPhan.length === 0) kq.push(nghiem("Chưa chọn thành phần năng lực đặc thù nào."));
  if (d.thanhPhan.length > 3) kq.push(nghiem(`Chọn ${d.thanhPhan.length} thành phần năng lực đặc thù; chỉ chọn 1–3 thành phần thật sự hình thành trong bài.`));
  const daCo = new Set<string>();
  for (const t of d.thanhPhan) {
    const tenTp = ten.get(t.ma);
    if (!tenTp) kq.push(nghiem(`Mã ${t.ma} không thuộc năng lực đặc thù của môn này.`));
    if (daCo.has(t.ma)) kq.push(nghiem(`Thành phần ${t.ma} bị lặp.`));
    daCo.add(t.ma);
    kq.push(...kiemTraBieuHien(t.bieuHien, "dac_thu", t.ma));
    if (tenTp && (giongNhau(t.bieuHien, tenTp) || giongNhau(t.bieuHien.replace(/^Học sinh\s+/i, ""), tenTp))) kq.push(nghiem(`${t.ma}: biểu hiện chỉ chép tên năng lực, cần nêu hành động cụ thể trong bài.`));
    if (!viTri.has(t.viTri)) kq.push(nghiem(`${t.ma}: vị trí ${t.viTri} không có trong bài.`));
    if (!t.sanPham?.trim()) kq.push(nghiem(`${t.ma}: thiếu sản phẩm.`));
    if (!t.tieuChi?.trim()) kq.push(nghiem(`${t.ma}: thiếu tiêu chí đánh giá.`));
    if (coYeuCau && !(t.yeuCau ?? []).some((y) => y !== "KHONG")) kq.push(nghiem(`${t.ma}: chưa gắn với yêu cầu cần đạt nào của bài.`));
  }
  return kq;
}

/** Năng lực số: mã đúng danh sách, không lặp, nhiệm vụ đúng hành vi của mã, đủ vị trí, minh chứng, tiêu chí; không trùng biểu hiện đặc thù. */
export function kiemTraNls(d: NonNullable<NoiDungSoan["nls"]>, ctx: NguCanhSoan, truoc: NoiDungSoan): LoiKiemTra[] {
  const kq: LoiKiemTra[] = [];
  const viTri = new Set(ctx.keHoach.oViTri.map((o) => o.ma));
  const dem = new Map<string, number>();
  for (const n of d.nls) dem.set(n.ma, (dem.get(n.ma) ?? 0) + 1);
  for (const [m, so] of dem) if (so > 1) kq.push(nghiem(`Mã ${m} được gắn ${so} lần; mỗi mã chỉ một hoạt động.`));
  for (const n of d.nls) {
    kq.push(...kiemTraBieuHien(n.bieuHien, "nls", n.ma));
    if (!ctx.luaChon.maNls.includes(n.ma) || !ctx.nlsChiBao.some((c) => c.ma === n.ma)) kq.push(nghiem(`Mã ${n.ma} không có trong danh sách giáo viên chọn hoặc trong dữ liệu.`));
    if (!viTri.has(n.viTri)) kq.push(nghiem(`${n.ma}: vị trí ${n.viTri} không có trong bài.`));
    if (!dungHanhViNls(n.ma, n.bieuHien)) kq.push(nghiem(`${n.ma}: nhiệm vụ chưa đúng hành vi của mã (“${ctx.nlsChiBao.find((c) => c.ma === n.ma)?.noiDung ?? ""}”).`));
    if (!n.minhChung?.trim()) kq.push(nghiem(`${n.ma}: thiếu minh chứng.`));
    if (!n.tieuChi?.trim()) kq.push(nghiem(`${n.ma}: thiếu tiêu chí đánh giá.`));
    // Khả thi: hành vi số thật trên công cụ có sẵn (hoặc làm ở nhà), thời gian chen vào hoạt động hợp lí.
    if (!coHanhViSo(n.bieuHien, n.congCu ?? "")) kq.push(khaThi(`${n.ma}: chưa có hành vi số thực tế (cần công cụ số và thao tác số; đóng kịch, thảo luận đơn thuần không đủ làm minh chứng).`));
    const oNha = /ở nhà|tại nhà/i.test(`${n.congCu} ${n.bieuHien}`) || n.viTri === "GD1";
    if (!oNha) for (const t of thietBiThieu(`${n.congCu} ${n.bieuHien}`, thietBiCoSan(ctx))) kq.push(khaThi(`${n.ma}: cần ${t} nhưng giáo án không có; dùng thiết bị có sẵn, giao làm ở nhà hoặc bỏ mã.`));
    if (!(n.phut >= 1 && n.phut <= 10)) kq.push(khaThi(`${n.ma}: thời gian nhiệm vụ số ${n.phut ?? 0} phút không hợp lí (1–10 phút).`));
    const phutHd = phutHoatDong(ctx.keHoach, n.viTri.split("_")[0]);
    if (phutHd && n.phut >= phutHd) kq.push(khaThi(`${n.ma}: nhiệm vụ số ${n.phut} phút chiếm hết hoạt động ${phutHd} phút.`));
    if (!n.dieuChinh?.trim()) kq.push(khaThi(`${n.ma}: chưa nêu lấy thời gian từ bước nào để tổng thời lượng không đổi.`));
    for (const t of truoc.dac_thu?.thanhPhan ?? []) if (giongNhau(t.bieuHien.replace(/^Học sinh\s+/i, ""), n.bieuHien)) kq.push(nghiem(`${n.ma}: biểu hiện trùng biểu hiện năng lực đặc thù ${t.ma}.`));
  }
  for (const m of ctx.luaChon.maNls) {
    if (dem.has(m)) continue;
    const lyDo = d.boQua?.find((b) => b.ma === m)?.lyDo;
    kq.push({ loai: "bieu_hien", noiDung: `Mã ${m} không có hoạt động thực tế tương ứng nên không đưa vào KHBD${lyDo ? `: ${lyDo}` : "."}`, nghiem: false });
  }
  return kq;
}

const SAO_RONG = ["góp phần nâng cao", "một cách hiệu quả", "đa dạng phong phú", "trong thời đại 4.0", "thời đại công nghệ 4.0"];

/** Mọi chuỗi trong một giá trị JSON. */
export function cacChuoi(v: unknown): string[] {
  if (typeof v === "string") return [v];
  if (Array.isArray(v)) return v.flatMap(cacChuoi);
  if (v && typeof v === "object") return Object.values(v).flatMap(cacChuoi);
  return [];
}

export function kiemTraVanPhong(chuoi: string[]): LoiKiemTra[] {
  const kq: LoiKiemTra[] = [];
  for (const s of chuoi) {
    for (const c of SAO_RONG) if (s.toLowerCase().includes(c)) kq.push({ loai: "van_phong", noiDung: `Lời sáo rỗng “${c}”.`, nghiem: false });
    if (/^\s*[-+•●▪]\s/.test(s)) kq.push({ loai: "van_phong", noiDung: `Kí hiệu đầu dòng thừa: “${s.slice(0, 40)}”.`, nghiem: false });
    if (/\[[^\]]*\]|\.{4,}/.test(s.replace(/\$[^$]*\$/g, ""))) kq.push({ loai: "cho_trong", noiDung: `Còn chỗ trống chờ điền: “${s.slice(0, 50)}”.`, nghiem: true });
    for (const m of s.matchAll(/\$([^$]+)\$/g)) {
      const l = loiLatex(m[1]);
      if (l) kq.push({ loai: "latex", noiDung: `Công thức lỗi “${m[1]}”: ${l}`, nghiem: true });
    }
    if (/[²³√∑∫]/.test(s.replace(/\$[^$]*\$/g, ""))) kq.push({ loai: "latex", noiDung: `Có kí tự công thức ngoài $...$: “${s.slice(0, 40)}”.`, nghiem: true });
  }
  return kq;
}

/**
 * Biểu hiện năng lực phải theo cấu trúc: hành động quan sát được + nội dung kiến thức/kĩ năng + kết quả cần đạt.
 * Kiểm tra được bằng máy: câu đủ dài, có "được" (kết quả), không còn chỗ trống; đặc thù bắt đầu bằng "Học sinh".
 */
export function kiemTraBieuHien(bieuHien: string, loai: "dac_thu" | "nls", ten: string): LoiKiemTra[] {
  const kq: LoiKiemTra[] = [];
  const s = bieuHien.trim();
  const soTu = s.split(/\s+/).filter(Boolean).length;
  if (/[[\]]|\.{3,}|…/.test(s)) kq.push({ loai: "bieu_hien", noiDung: `${ten}: biểu hiện còn chỗ trống chờ điền.`, nghiem: true });
  if (soTu < (loai === "dac_thu" ? 15 : 8)) kq.push({ loai: "bieu_hien", noiDung: `${ten}: biểu hiện quá ngắn, cần nêu hành động, nội dung kiến thức/kĩ năng và kết quả cần đạt.`, nghiem: true });
  if (!/(^|\s)được(?=[\s,.;:]|$)/.test(s) && loai === "dac_thu") kq.push({ loai: "bieu_hien", noiDung: `${ten}: biểu hiện chưa nêu kết quả cần đạt (thiếu "được").`, nghiem: true });
  if (loai === "dac_thu" && !/^Học sinh\b/.test(s)) kq.push({ loai: "bieu_hien", noiDung: `${ten}: biểu hiện năng lực đặc thù cần bắt đầu bằng "Học sinh".`, nghiem: true });
  if (loai === "nls" && /^(HS|Học sinh)\b/i.test(s)) kq.push({ loai: "bieu_hien", noiDung: `${ten}: bỏ chữ "HS" ở đầu biểu hiện năng lực số (app tự thêm).`, nghiem: true });
  return kq;
}

const dem = (ds: MucDo[]) => ds.slice().sort().join(",");

export function kiemTraCauHoi(ch: CauHoi, maMon: string | null, phutHd2: number): LoiKiemTra[] {
  const kq: LoiKiemTra[] = [];
  const mt = maTranCauHoi(maMon, phutHd2);
  const so = (ten: string, co: number, can: number) => { if (co !== can) kq.push({ loai: "ma_tran", noiDung: `${ten}: có ${co} câu, ma trận cần ${can} câu.`, nghiem: true }); };
  so("Trắc nghiệm nhiều lựa chọn", ch.nhieuLuaChon.length, mt.nhieuLuaChon.length);
  so("Đúng sai", ch.dungSai.length, mt.dungSai.length);
  so("Trả lời ngắn", ch.traLoiNgan.length, mt.traLoiNgan.length);
  if (ch.nhieuLuaChon.length === mt.nhieuLuaChon.length && dem(ch.nhieuLuaChon.map((c) => c.mucDo)) !== dem(mt.nhieuLuaChon)) {
    kq.push({ loai: "ma_tran", noiDung: `Mức độ câu nhiều lựa chọn chưa đúng ma trận (cần ${mt.nhieuLuaChon.join(", ")}).`, nghiem: true });
  }
  ch.nhieuLuaChon.forEach((c, i) => {
    if (c.phuongAn.length !== 4) kq.push({ loai: "trac_nghiem", noiDung: `Câu ${i + 1}: cần đúng 4 phương án, đang có ${c.phuongAn.length}.`, nghiem: true });
    if (new Set(c.phuongAn.map((p) => p.trim())).size !== c.phuongAn.length) kq.push({ loai: "trac_nghiem", noiDung: `Câu ${i + 1}: có phương án trùng nhau.`, nghiem: true });
    if (c.loiHieu.length < 3) kq.push({ loai: "trac_nghiem", noiDung: `Câu ${i + 1}: mỗi phương án sai cần ứng với một lỗi hiểu.`, nghiem: false });
  });
  const n = ch.nhieuLuaChon.length;
  if (n >= 4) {
    const tan = new Map<string, number>();
    for (const c of ch.nhieuLuaChon) tan.set(c.dapAn, (tan.get(c.dapAn) ?? 0) + 1);
    const nhieuNhat = Math.max(...tan.values());
    if (nhieuNhat > Math.ceil(n * 0.4) + 1 || tan.size < Math.min(4, n) - 1) kq.push({ loai: "trac_nghiem", noiDung: "Đáp án chưa rải đều giữa A, B, C, D.", nghiem: true });
  }
  ch.dungSai.forEach((c, i) => { if (c.y.length !== 4) kq.push({ loai: "trac_nghiem", noiDung: `Câu đúng sai ${i + 1}: cần đúng 4 ý.`, nghiem: true }); });
  return kq;
}

/** Kiểm tra theo lượt; dùng để quyết định có soạn lại lượt đó không. */
export function kiemTraLuot(ma: string, duLieu: unknown, ctx: NguCanhSoan, truoc: NoiDungSoan): LoiKiemTra[] {
  const kq = kiemTraVanPhong(cacChuoi(duLieu));
  const phut = (ctx.keHoach.thoiLuong ?? []).map((t) => t.muc.filter((m) => m.hd === "HD2").reduce((s, m) => s + m.phut, 0)).find((p) => p > 0) ?? 15;
  if (ma === "cau_hoi") kq.push(...kiemTraCauHoi(duLieu as CauHoi, ctx.thongTin.mon, phut));
  kq.push(...kiemTraHoatDong(ma, duLieu, ctx));
  if (ma === "dac_thu") kq.push(...kiemTraDacThu(duLieu as NonNullable<NoiDungSoan["dac_thu"]>, ctx));
  if (ma === "nls") kq.push(...kiemTraNls(duLieu as NonNullable<NoiDungSoan["nls"]>, ctx, truoc));
  if (ma === "hd2") {
    const ph = (duLieu as NonNullable<NoiDungSoan["hd2"]>).phanHoa;
    if (!ph.namTot.trim() || !ph.canCungCo.trim() || !ph.canHoTro.trim()) kq.push({ loai: "phan_hoa", noiDung: "Thiếu nhiệm vụ cho đủ 3 nhóm Nắm tốt / Cần củng cố / Cần hỗ trợ.", nghiem: true });
  }
  if (ma === "hd4" && truoc.cau_hoi) {
    const daCo = new Set(truoc.cau_hoi.nhieuLuaChon.map((c) => c.cauHoi.trim().toLowerCase()));
    for (const c of (duLieu as NonNullable<NoiDungSoan["hd4"]>).exitTicket) if (daCo.has(c.cauHoi.trim().toLowerCase())) kq.push({ loai: "trung", noiDung: `Câu exit ticket trùng câu luyện tập: “${c.cauHoi.slice(0, 50)}”.`, nghiem: true });
  }
  if (ma === "kiem_dinh" && truoc.cau_hoi) {
    for (const d of (duLieu as NonNullable<NoiDungSoan["kiem_dinh"]>).dapAn) {
      const c = truoc.cau_hoi.nhieuLuaChon[d.cau - 1];
      if (c && c.dapAn !== d.dapAn) kq.push({ loai: "kiem_dinh", noiDung: `Câu ${d.cau}: đáp án đã soạn là ${c.dapAn}, giải lại được ${d.dapAn}. Thầy/cô kiểm tra lại câu này.`, nghiem: false });
    }
  }
  if (ma === "tieng_anh") {
    for (const s of cacChuoi(duLieu)) if (/[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(s)) {
      kq.push({ loai: "tieng_anh", noiDung: `Phụ lục tiếng Anh còn chữ tiếng Việt: “${s.slice(0, 50)}”.`, nghiem: true });
    }
  }
  return kq;
}

/** Kiểm tra toàn bộ nội dung đã soạn (bước 5). */
export function kiemTraNoiDungSoan(nd: NoiDungSoan, ctx: NguCanhSoan): LoiKiemTra[] {
  const kq: LoiKiemTra[] = [];
  for (const [ma, duLieu] of Object.entries(nd)) {
    const truoc = ma === "hd4" || ma === "kiem_dinh" || ma === "nls" ? nd : {};
    kq.push(...kiemTraLuot(ma, duLieu, ctx, truoc).map((l) => (ma === "dac_thu" || ma === "nls") && (l.loai === "lien_ket" || l.loai === "kha_thi") ? { ...l, nghiem: false } : l));
  }
  kq.push(...kiemTraLapPhuongPhap(nd));
  if (ctx.luaChon.ai && !ctx.luaChon.tuHoc.bat && thietBiThieu("máy tính điện thoại", thietBiCoSan(ctx)).length === 2) {
    kq.push({ loai: "kha_thi", noiDung: "Quy trình dùng AI cần thiết bị truy cập AI (máy tính hoặc điện thoại); giáo án chưa ghi thiết bị này.", nghiem: false });
  }
  // Chuỗi liên kết mục tiêu → hoạt động → hành vi → sản phẩm → tiêu chí: năng lực thiếu mắt xích đã bị bỏ khỏi KHBD.
  const lk = lienKetNangLuc(nd, ctx.luaChon, ctx.thongTin.mon, ctx.keHoach.oViTri.map((o) => o.ma), (m) => ctx.nlsChiBao.find((c) => c.ma === m)?.noiDung, ctx.hoatDong.length > 0 || ctx.luaChon.chuyenKhung);
  for (const c of canhBaoLienKet(lk)) kq.push({ loai: "lien_ket", noiDung: c, nghiem: false });
  return kq;
}
