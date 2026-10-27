/**
 * Ghép giáo án cũ + lựa chọn + kế hoạch (+ nội dung LLM khi có) thành dữ liệu cho mẫu Word.
 * Đoạn của GV chép nguyên văn (nguon: giu_nguyen); phần thêm (câu cố định của khung, mã năng lực
 * tra từ dữ liệu, nội dung LLM) là bo_sung.
 */
import { doanCuaHoatDong } from "../3-ke-hoach/tach-doan";
import type { DoanGoc, HoatDongCu, PhanTichGiaoAn, ThongTinBai } from "../kieu";
import type { LuaChon } from "../2-lua-chon/lua-chon";
import { chiTichHop, coClil, coDichTiengAnh, dungClil } from "../2-lua-chon/lua-chon";
import type { KeHoach } from "../3-ke-hoach";
import type { DichAnhXa } from "../3-ke-hoach/anh-xa";
import { anhXaMacDinh } from "../3-ke-hoach/anh-xa";
import { nangLucDacThu } from "@khbd/lib/data/nang-luc-dac-thu";
import { nangLucAi } from "@khbd/lib/data/nang-luc-ai";
import { boDauThuong, chiBaoTheoMa } from "@khbd/lib/data/nls";
import type { ChucNang, Doan, TuyChonXuat, VaiDoan } from "./xml";
import { chuDoan, dungDuLieuMau, type Bang, type BanSoan, type DuLieuMau, type Khoi, type Phan } from "./ban-soan";
import { bienTap, kiemTraBanSoan, nguCanhBienTap, type SuaDoi } from "../5-kiem-tra/bien-tap";
import type { LoiKiemTra } from "../5-kiem-tra/kiem-tra-file";
import type { HdMoi, NoiDungSoan } from "../4-sinh-noi-dung/dinh-nghia";
import * as C from "./cau-co-dinh";
import { duLienKet, lienKetNangLuc, type LienKet } from "../5-kiem-tra/lien-ket-nang-luc";

export type { DuLieuMau };

const goc = (d: DoanGoc, cap?: 0 | 1 | 2): Doan => ({
  nguon: "giu_nguyen",
  maGoc: d.ma,
  html: d.html,
  cap: cap ?? (/^\s*<li/i.test(d.html) || /^[-•–]\s/.test(d.vanBan) ? 1 : /^\+\s/.test(d.vanBan) ? 2 : 0),
  kieu: d.loai === "TD" ? "Muc2" : undefined,
});
const them = (chu: string, cap: 0 | 1 | 2 = 1, nhan?: string, vai?: VaiDoan): Doan => ({ nguon: "bo_sung", chu, cap, nhan, ...(vai ? { vai } : {}) });
/** Gắn hoạt động / chức năng cho một nhóm đoạn (thông tin cho bước biên tập). */
const gan = (ds: Doan[], thongTin: { hd?: string; chucNang?: ChucNang }): Doan[] => ds.map((d) => ({ ...d, ...(thongTin.hd && !d.hd ? { hd: thongTin.hd } : {}), ...(thongTin.chucNang ? { chucNang: thongTin.chucNang } : {}) }));
const bang = (hang: string[][], rong?: number[], vai?: Bang["vai"]): Bang => ({ loai: "bang", hang, nguon: "bo_sung", rong, vai });
/** Dòng năng lực chung (theo tên 3 năng lực chung của chương trình). */
const LA_NL_CHUNG = /tự chủ|tự học|giao tiếp|hợp tác|giải quyết vấn đề|sáng tạo/i;
/** Dòng GV nói về tích hợp tiếng Anh/CLIL, năng lực số, năng lực AI. */
const LA_CLIL = /CLIL|tiếng Anh|key words?|English/i;
/** Mã năng lực số kiểu mới (1.3.5.1) và kiểu cũ (1.3.NC1a, 1.3NC1a). */
const LA_NLS = /(^|[^\d.])[1-6]\.[1-6]\.?(?:\d\.\d|NC\d[a-z]?)(?![\d.])|năng lực số/i;
const LA_AI = /(^|[^\p{L}])AI([^\p{L}]|$)|trí tuệ nhân tạo/u;
/** Dòng chỉ là tiêu đề nhóm năng lực, vd "a) Năng lực chung:", "- Năng lực đặc thù môn Toán:". */
// "\b" của JS không nhận chữ có dấu ("số"): dùng (?!\p{L}).
const LA_TIEU_DE_NL = /^\s*(?:[a-dđ]\)|[-•–+]|\d+[.)])?\s*(?:năng lực\s+(?:chung|đặc thù|riêng|chuyên biệt|môn|số|AI)(?!\p{L})|tích hợp CLIL)[^:.]{0,60}:?\s*$/iu;

/** Đoạn GV đặt vào từng chỗ của khung mới theo bảng ánh xạ. */
function chiaTheoAnhXa(pt: PhanTichGiaoAn, anhXa: { hoatDongCu: string; dich: DichAnhXa[] }[], coGd1: boolean, coGd3: boolean) {
  const theoMa = new Map(pt.doan.map((d) => [d.ma, d]));
  // KEM: phần sau tiến trình của GV (phụ lục, phiếu học tập…) → đưa vào mục Phụ lục, không vào hoạt động nào.
  const cho: Record<string, DoanGoc[]> = { GD1: [], HD1: [], HD2: [], HD3: [], HD4: [], GD3: [], KEM: [] };
  for (const h of pt.hoatDong) {
    // Chỗ không có trong bài (vd không có Giai đoạn 1) thì chuyển sang đích kế tiếp: không làm mất nội dung GV.
    const dich = (anhXa.find((a) => a.hoatDongCu === h.ma)?.dich ?? [])
      .filter((d) => d !== "bo_qua" && (d !== "GD1" || coGd1) && (d !== "GD3" || coGd3));
    if (dich.length === 0 && h.doan.length) dich.push(h.loai === "hinh_thanh" ? "HD1" : h.loai === "cung_co" ? "HD4" : "HD2");
    if (dich.length === 0) continue;
    cho.KEM.push(...(h.kem ?? []).map((m) => theoMa.get(m)!).filter(Boolean));
    const ds = h.doan.map((m) => theoMa.get(m)!).filter(Boolean);
    if (h.loai === "cung_co" && dich.includes("HD4") && dich.includes("GD3")) {
      // Dặn dò, bài tập về nhà sang Giai đoạn 3; phần củng cố ở HĐ IV.
      for (const d of ds) (/bài tập|về nhà|chuẩn bị|dặn|SBT|SGK/i.test(d.vanBan) ? cho.GD3 : cho.HD4).push(d);
    } else cho[dich[0]].push(...ds);
  }
  return cho;
}

function thoiGianHd(kh: KeHoach, hd: string): string {
  const phan = (kh.thoiLuong ?? []).flatMap((t) => t.muc.filter((m) => m.hd === hd).map((m) => `${m.phut} phút – tiết ${t.tiet}`));
  return phan.length ? ` (${phan.join("; ")})` : "";
}

function chiaPhutHd2(tong: number): [number, number, number, number] {
  const giao = Math.max(2, Math.round(tong * 0.12));
  const bao = Math.max(3, Math.round(tong * 0.25));
  const ket = Math.max(2, Math.round(tong * 0.13));
  return [giao, tong - giao - bao - ket, bao, ket];
}

/** Tra nguyên văn chỉ báo năng lực số (mặc định từ data/; test truyền dữ liệu riêng). */
export type TraChiBao = (ma: string) => string | undefined;

const tieuDeNho = (chu: string): Doan => ({ nguon: "bo_sung", chu, kieu: "Muc2", vai: "tieu_de" });
const chuCai = (i: number) => "ABCD"[i] ?? "?";
/** Viết thường chữ đầu khi ghép vào giữa câu (giữ nguyên nếu là tên riêng viết hoa cả từ, vd "HS"). */
const thuongDau = (s: string) => (/^[A-ZĐ]{2,}/.test(s) ? s : s.charAt(0).toLocaleLowerCase("vi") + s.slice(1));
const boCham = (s: string) => s.trim().replace(/[.;,]+$/, "");

/** Phương án trắc nghiệm: mỗi phương án A/B/C/D một dòng riêng dưới câu hỏi. */
const dongPhuongAn = (pa: string[]): Doan[] => pa.map((p) => them(p, 0));

/** Một bước tổ chức tách thành: dòng tên bước "Bước 1 – Tên (3 phút):" (in đậm), dòng "GV: …", dòng "HS: …". */
const boChuDau = (s: string, ai: "GV" | "HS") => s.trim().replace(new RegExp(`^(${ai}|${ai === "GV" ? "giáo viên" : "học sinh"})\\s*[:,-]?\\s*`, "i"), "").replace(/\.$/, "");
const dongBuoc = (b: { ten: string; phut: number; gv: string; hs: string }, i: number): Doan[] => [
  them("", 1, `Bước ${i + 1} – ${b.ten.replace(/\.$/, "")} (${b.phut} phút):`, "buoc"),
  them(`${hoaDauCau(boChuDau(b.gv, "GV"))}.`, 2, "GV:", "buoc_viec"),
  them(`${hoaDauCau(boChuDau(b.hs, "HS"))}.`, 2, "HS:", "buoc_viec"),
];
/** Bước của HĐ II: tên bước in đậm, mỗi việc một dòng. */
const dongBuocHd2 = (ten: string, viec: string[]): Doan[] => [them("", 1, `${ten}:`, "buoc"), ...viec.filter((v) => v.trim()).map((v) => them(`${hoaDauCau(boCham(v))}.`, 2, undefined, "buoc_viec"))];
const hoaDauCau = (s: string) => s.charAt(0).toLocaleUpperCase("vi") + s.slice(1);

/** Khối câu hỏi luyện tập + bảng đáp án và mức độ (khi lượt câu hỏi có kết quả). */
function khoiCauHoi(ch: NonNullable<NoiDungSoan["cau_hoi"]>): Khoi[] {
  const ds: Doan[] = [tieuDeNho("CÂU HỎI LUYỆN TẬP")];
  const hang: string[][] = [["Phần", "Câu", "Đáp án", "Mức độ"]];
  if (ch.nhieuLuaChon.length) {
    ds.push(tieuDeNho(`Phần 1: Trắc nghiệm nhiều phương án lựa chọn (${ch.nhieuLuaChon.length} câu)`));
    ch.nhieuLuaChon.forEach((c, i) => {
      ds.push(them(`Câu ${i + 1}. ${c.cauHoi}`, 0), ...dongPhuongAn(c.phuongAn.map((p, j) => `${chuCai(j)}. ${p}`)));
      hang.push(["Phần 1", String(i + 1), c.dapAn, c.mucDo]);
    });
  }
  if (ch.dungSai.length) {
    ds.push(tieuDeNho(`Phần 2: Trắc nghiệm đúng sai (${ch.dungSai.length} câu, mỗi câu 4 ý)`));
    ch.dungSai.forEach((c, i) => {
      ds.push(them(`Câu ${i + 1}. ${c.boiCanh}`, 0), ...c.y.map((y, j) => them(`${"abcd"[j]}) ${y.noiDung}`, 0)));
      hang.push(["Phần 2", String(i + 1), c.y.map((y, j) => `${"abcd"[j]}) ${y.dung ? "Đ" : "S"}`).join(" "), c.mucDo]);
    });
  }
  if (ch.traLoiNgan.length) {
    ds.push(tieuDeNho(`Phần 3: Trắc nghiệm trả lời ngắn (${ch.traLoiNgan.length} câu)`));
    ch.traLoiNgan.forEach((c, i) => { ds.push(them(`Câu ${i + 1}. ${c.cauHoi}`, 0)); hang.push(["Phần 3", String(i + 1), c.dapAn, c.mucDo]); });
  }
  if (ch.tuLuan.length) {
    ds.push(tieuDeNho(`Phần 4: Câu hỏi tự luận ngắn/nhiệm vụ kĩ năng (${ch.tuLuan.length} câu)`));
    ch.tuLuan.forEach((c, i) => { ds.push(them(`Câu ${i + 1}. ${c.cauHoi}`, 0), them(c.huongDanCham, 0, "Hướng dẫn chấm/ý chính:")); hang.push(["Phần 4", String(i + 1), "Theo hướng dẫn chấm", "VD"]); });
  }
  // Mỗi câu: lời giải một dòng; phương án sai, câu tương tự xuống dòng riêng.
  const loiGiai = ch.nhieuLuaChon.flatMap((c, i) => [
    them(`${boCham(c.loiGiai)}.`, 1, `Câu ${i + 1}:`),
    ...(c.loiHieu.some((x) => x.trim()) ? [them(`${c.loiHieu.map(boCham).filter(Boolean).join("; ")}.`, 2, "Phương án sai:")] : []),
    ...(c.cauTuongTu?.trim() ? [them(c.cauTuongTu, 2, "Câu tương tự cho lượt 2:")] : []),
  ]);
  return [
    ...gan([...ds, tieuDeNho("Đáp án và mức độ:")], { hd: "HD2" }),
    bang(hang, [1600, 1000, 4954, 1800], "dap_an"),
    ...(loiGiai.length ? gan([tieuDeNho("Lời giải và lỗi hiểu ứng với phương án sai:"), ...loiGiai], { hd: "HD2" }) : []),
  ];
}

/**
 * Lập bản soạn có cấu trúc (chưa biên tập). Mỗi đoạn mang vai trò, hoạt động, chức năng để bước biên tập
 * xử lí lặp, mã thừa, phần không chọn mà không phải đoán từ chữ.
 */
export function lapBanSoan(pt: PhanTichGiaoAn, tt: ThongTinBai, lc: LuaChon, kh: KeHoach, nd: NoiDungSoan = {}, traChiBao: TraChiBao = (ma) => chiBaoTheoMa(ma)?.noiDung): BanSoan {
  const mon = nangLucDacThu.mon.find((m) => m.ma_mon === tt.mon);
  const mt = (nhom: string) => pt.doan.filter((d) => d.loai === "MT" && d.nhomMucTieu === nhom).map((d) => goc(d));
  const nenTangTuHoc = lc.tuHoc.bat ? lc.tuHoc.nenTang.trim() : "";
  const nhanViTri = (ma: string) => kh.oViTri.find((o) => o.ma === ma)?.nhan ?? ma;

  // Chuỗi liên kết mục tiêu → hoạt động → hành vi HS → sản phẩm → tiêu chí: năng lực thiếu mắt xích không được ghi vào KHBD.
  const lienKet = lienKetNangLuc(nd, lc, tt.mon, kh.oViTri.map((o) => o.ma), traChiBao, pt.hoatDong.length > 0 || lc.chuyenKhung);
  const du = (loai: LienKet["loai"], ma: string) => lienKet.some((l) => l.loai === loai && l.ma === ma && duLienKet(l));
  const laTin = tt.mon === "TIN_HOC";

  // Năng lực đặc thù: tên thành phần chép từ dữ liệu; LLM viết biểu hiện, vị trí, sản phẩm, tiêu chí. Mỗi thành phần một lần.
  const thanhPhanTheoMa = new Map((mon?.nang_luc ?? []).flatMap((nl) => [[nl.ma, { nl, ten: nl.ten }] as const, ...nl.thanh_phan.map((tp) => [tp.ma, { nl, ten: tp.ten }] as const)]));
  // Giữ bố cục gốc: năng lực đặc thù không thuộc chức năng nào được chọn nên giữ nguyên dòng của GV, không thêm/thay.
  const dacThu = (chiTichHop(lc) ? [] : nd.dac_thu?.thanhPhan ?? [])
    .filter((t, i, ds) => thanhPhanTheoMa.has(t.ma) && ds.findIndex((x) => x.ma === t.ma) === i && du("dac_thu", t.ma))
    .map((t) => ({ ...t, ...thanhPhanTheoMa.get(t.ma)! }));
  const tenNangLucDacThu = [...new Set(dacThu.map((t) => t.nl.ten))].join("; ");
  const hoaDau = (s: string) => s.charAt(0).toLocaleUpperCase("vi") + s.slice(1);
  /** Tin học dùng kí hiệu NLa–NLe trùng kí hiệu năng lực AI: ghi rõ "NL tin học – NLx" và "NL AI – NLx" (theo khung). */
  const nhanDacThu = (t: { ma: string; ten: string }) => (laTin ? `${hoaDau(t.ten)} (NL tin học – ${t.ma.split(".").pop()})` : hoaDau(t.ten));
  const maAiHien = (ma: string) => (laTin ? `NL AI – ${ma}` : ma);
  /** Mô tả năng lực AI bỏ phần mã đứng đầu (nếu dữ liệu có) để không thành "NLa: NLa: …". */
  const moTaAi = (n: { ma: string; mo_ta: string }) => n.mo_ta.replace(new RegExp(`^\\s*${n.ma}\\s*[:–-]\\s*`), "");

  // Năng lực số: mã + nguyên văn do code tra; biểu hiện, vị trí, minh chứng, tiêu chí do LLM viết.
  // Một danh sách duy nhất dùng cho mục I.2, hoạt động tương ứng và ma trận mục V.
  // Chỉ đưa vào KHBD mã có hoạt động thực tế (đã soạn biểu hiện, vị trí có trong bài); mỗi mã một lần.
  const nls = (lc.nls ? [...new Set(lc.maNls)] : []).map((ma) => {
    const s = nd.nls?.nls.find((n) => n.ma === ma);
    return { ma, noiDung: traChiBao(ma) ?? "", viTri: s?.viTri ?? "", bieuHien: s?.bieuHien ?? "", congCu: s?.congCu ?? "", phut: s?.phut ?? 0, dieuChinh: s?.dieuChinh ?? "", minhChung: s?.minhChung ?? "", tieuChi: s?.tieuChi ?? "" };
  }).filter((n) => n.noiDung && du("nls", n.ma));
  /** Nhiệm vụ số trong hoạt động: chủ ngữ "Mỗi HS", công cụ nêu một lần (không "dùng X để dùng Y"). */
  const cauNhiemVuSo = (n: (typeof nls)[number]) => {
    const bh = boCham(n.bieuHien).replace(/^(mỗi\s+)?(HS|học sinh)\s+/i, "");
    const cc = boCham(n.congCu);
    const coCongCu = cc && !boDauThuong(bh).includes(boDauThuong(cc));
    const viec = coCongCu ? (/^(dùng|sử dụng)\s/i.test(bh) ? `${bh} (công cụ: ${cc})` : `dùng ${cc} để ${bh}`) : bh;
    const thoiGian = n.phut ? ` (khoảng ${n.phut} phút${n.dieuChinh ? `; ${thuongDau(boCham(n.dieuChinh))}` : ""})` : "";
    return `Mỗi HS ${viec}; lưu ${boCham(n.minhChung)} làm minh chứng cho mã ${n.ma}${thoiGian}.`;
  };
  const nlsTai = (viTri: (v: string) => boolean): { hoatDong: Doan[]; tieuChi: Doan[] } => {
    const o = nls.filter((n) => n.viTri && viTri(n.viTri) && n.bieuHien);
    return {
      hoatDong: gan(o.map((n) => them(cauNhiemVuSo(n), 2, undefined, "nhiem_vu_so")), { chucNang: "nls" }),
      tieuChi: [
        ...gan(o.filter((n) => n.tieuChi).map((n) => them(`Tiêu chí ${n.ma}: ${n.tieuChi}`, 2, undefined, "tieu_chi")), { chucNang: "nls" }),
        // Tiêu chí năng lực đặc thù đặt ở đúng hoạt động thể hiện năng lực đó.
        ...dacThu.filter((t) => viTri(t.viTri)).map((t) => them(`Tiêu chí ${nhanDacThu(t)}: ${t.tieuChi}`, 2, undefined, "tieu_chi")),
      ],
    };
  };
  const ai = lc.ai ? nangLucAi.nang_luc.filter((n) => (!lc.maAi.length || lc.maAi.includes(n.ma)) && du("ai", n.ma)) : [];
  const coAi = ai.length > 0;

  /** Dòng năng lực số ở mục tiêu: mã, nguyên văn, biểu hiện, vị trí. Minh chứng nằm ở hoạt động và ma trận, không nhắc lại ở đây. */
  const dongNlsMucTieu = (n: (typeof nls)[number]) =>
    them(`${n.ma}: ${boCham(n.noiDung)}. Biểu hiện trong bài: HS ${boCham(n.bieuHien).replace(/^(mỗi\s+)?(HS|học sinh)\s+/i, "")} (${nhanViTri(n.viTri)}).`, 2);
  const dongDacThu = (t: (typeof dacThu)[number]) => them(`${nhanDacThu(t)}: ${boCham(t.bieuHien)}. Thể hiện ở ${nhanViTri(t.viTri)}.`, 2);
  const dongAi = (n: (typeof ai)[number]) => them(`${maAiHien(n.ma)}: ${moTaAi(n)}`, 2);

  /** Dòng mục tiêu năng lực (I.2) của KHBD gốc, xếp theo nhóm. Chỉ dùng để tham khảo hoặc thay thế, không cộng dồn. */
  const gvI2 = pt.doan.filter((d) => d.loai === "MT" && d.nhomMucTieu === "I.2");
  const nhomGv = (() => {
    const thanhPhanCuaMon = (s: string) => (mon?.nang_luc ?? []).some((nl) => nl.thanh_phan.some((tp) => boDauThuong(s).includes(boDauThuong(tp.ten))));
    const tieuDe = gvI2.filter((d) => LA_TIEU_DE_NL.test(d.vanBan));
    const dong = gvI2.filter((d) => !tieuDe.includes(d));
    // CLIL (ngôn ngữ) và năng lực số, AI không bị xếp nhầm vào năng lực đặc thù.
    const clil = dong.filter((d) => LA_CLIL.test(d.vanBan));
    const so = dong.filter((d) => !clil.includes(d) && LA_NLS.test(d.vanBan));
    const ai = dong.filter((d) => !clil.includes(d) && !so.includes(d) && LA_AI.test(d.vanBan));
    const conLai = dong.filter((d) => !clil.includes(d) && !so.includes(d) && !ai.includes(d));
    const chung = conLai.filter((d) => LA_NL_CHUNG.test(d.vanBan) && !thanhPhanCuaMon(d.vanBan));
    const dacThu = conLai.filter((d) => !chung.includes(d));
    // Tiêu đề nhóm có thể là dòng mục tiêu (MT) hoặc tiêu đề (TD) trong mục I.
    const tdMuc = pt.doan.filter((d) => d.loai === "TD" && d.muc === "muc_tieu" && LA_TIEU_DE_NL.test(d.vanBan));
    const td = (re: RegExp) => [...tieuDe, ...tdMuc].filter((d) => re.test(d.vanBan));
    return {
      chung, dacThu, so, ai, clil,
      tdDacThu: td(/đặc thù|riêng|chuyên biệt|môn/i), tdSo: td(/năng lực số(?!\p{L})/iu), tdAi: td(/năng lực AI/), tdClil: td(/CLIL|tiếng Anh/i),
    };
  })();

  /**
   * Mục I.2 của cấu trúc mới (khung 3 giai đoạn) là chuẩn đối chiếu cuối cùng: năng lực chung theo khung, đặc thù/số/AI
   * do app soạn từ dữ liệu, CLIL theo khung. Dòng năng lực của KHBD gốc KHÔNG cộng dồn vào (gốc chỉ là tư liệu tham khảo
   * cho lượt soạn); chỉ dùng dòng đặc thù của gốc khi app không soạn được thành phần đặc thù nào.
   * Thứ tự: chung → đặc thù → số → AI → CLIL; tiêu đề loại cấp 1, từng dòng cấp 2.
   */
  const doanKhongDung = new Set<string>();
  const khoiNangLucMoi = (coGd1: boolean): Doan[] => {
    const tenNl = tenNangLucDacThu || mon?.nang_luc[0]?.ten || "";
    const dacThuDung = dacThu.length ? dacThu.map(dongDacThu) : nhomGv.dacThu.map((d) => goc(d, 2));
    const coClilKhung = dungClil(lc, tt.mon) && coClil(lc) && !chiTichHop(lc);
    for (const d of gvI2) if (!(dacThu.length === 0 && nhomGv.dacThu.includes(d))) doanKhongDung.add(d.ma);
    return [
      them("", 1, "Năng lực chung:", "tieu_de"),
      ...(coGd1 ? [them(C.NL_CHUNG_TU_HOC, 2)] : []), them(C.NL_CHUNG_HOP_TAC, 2), them(C.NL_CHUNG_GQVD, 2),
      ...(dacThuDung.length ? [them("", 1, `Năng lực đặc thù môn ${mon?.ten_mon ?? ""}${tenNl ? ` – ${tenNl}` : ""}:`, "tieu_de"), ...dacThuDung] : []),
      ...(nls.length ? gan([them("", 1, "Năng lực số:", "tieu_de"), ...nls.map(dongNlsMucTieu)], { chucNang: "nls" }) : []),
      ...(ai.length ? gan([them("", 1, "Năng lực AI:", "tieu_de"), ...ai.map(dongAi)], { chucNang: "ai" }) : []),
      ...(coClilKhung ? [{ ...them(C.CLIL, 1, "Tích hợp CLIL:"), chucNang: "clil" as const }] : []),
    ];
  };

  /** Quy trình dùng AI có kiểm chứng (câu chữ khung) kèm câu lệnh mẫu, nguồn đối chiếu. */
  const quyTrinhAi = (): Doan[] => [
    tieuDeNho("Quy trình sử dụng AI có kiểm chứng"),
    ...C.QUY_TRINH_AI.map((c, i) => them(`${i + 1}. ${i === 1 && nd.ai ? `${c.replace(/\.$/, "")}; câu lệnh mẫu: “${nd.ai.cauLenhMau}”` : i === 3 && nd.ai ? `${c} Nguồn đối chiếu: ${nd.ai.doiChieu}` : c}`, 0)),
  ];
  const tieuChiAi = (): Doan[] => [...ai.map((n) => them(`Tiêu chí ${maAiHien(n.ma)}: ${n.tieu_chi}`, 2, undefined, "tieu_chi")), them(C.AI_KHONG_DAT, 2, undefined, "tieu_chi")];

  // Phụ lục tiếng Anh: bắt đầu ngay bằng bản dịch hoạt động đã chọn (không ghi lại tên hoạt động, không chèn bảng thuật ngữ).
  const ta = nd.tieng_anh;
  const coTiengAnh = coDichTiengAnh(lc) && !!ta;
  // CLIL: key words và nhiệm vụ dùng tiếng Anh, chỉ chèn vào hoạt động đã chọn.
  const khoiClil = (hd: string): Doan[] => (coClil(lc) && nd.clil
    ? gan([them("", 1, "Tiếng Anh (CLIL):"), them(`Key words: ${nd.clil.tuKhoa.map((k) => `${k.en} (${k.vi})`).join("; ")}.`, 2), ...nd.clil.nhiemVu.map((c) => them(c, 2))], { hd, chucNang: "clil" })
    : []);
  const phanTiengAnh: Phan[] = coTiengAnh
    ? [{ truong: "tiengAnh", khoi: gan([
        { nguon: "bo_sung", chu: ta.tieuDe, kieu: "TenHoatDong" },
        them(ta.mucTieu, 1, "Objectives:"),
        them("", 1, "Organisation:"), ...ta.toChuc.map((c) => them(c, 2)), ...ta.nhiemVu.map((c) => them(c, 2)),
        them(ta.sanPham, 1, "Products – Assessment:"), ...ta.tieuChi.map((c) => them(c, 2)),
      ], { chucNang: "tieng_anh" }) }]
    : [];

  /** Ma trận mục V: mỗi cột một thông tin, không nhắc lại mã ở cột biểu hiện. */
  const maTran = (viTriAi: string): Phan[] => {
    const hang = [
      C.MA_TRAN_TIEU_DE,
      ...dacThu.map((t) => ["Năng lực đặc thù", nhanDacThu(t), boCham(t.bieuHien), nhanViTri(t.viTri), t.sanPham]),
      ...nls.map((n) => ["Năng lực số", n.ma, `${boCham(n.noiDung)}. Biểu hiện: HS ${boCham(n.bieuHien).replace(/^(mỗi\s+)?(HS|học sinh)\s+/i, "")}`, n.viTri ? nhanViTri(n.viTri) : "", n.minhChung]),
      ...ai.map((n) => ["Năng lực AI", maAiHien(n.ma), moTaAi(n), viTriAi, n.minh_chung]),
    ];
    const coMaTran = nls.length > 0 || ai.length > 0 || (dacThu.length > 0 && lc.chuyenKhung);
    return coMaTran ? [{ truong: "maTran", khoi: [bang(hang, [1600, 1300, 3054, 1500, 1900], "ma_tran")] }] : [];
  };

  /** Phụ lục đánh giá sản phẩm (khung). Phiếu kiểm chứng AI có tiêu đề riêng. */
  const phuLuc = (kemGv: DoanGoc[] = []): Phan[] => {
    // Phụ lục, phiếu học tập của GV (khi chuyển khung) đứng trước phần phụ lục theo khung.
    const khoi: Khoi[] = kemGv.map((d) => goc(d));
    if (lc.chuyenKhung) {
      khoi.push(bang([
        ...C.BANG_DANH_GIA.slice(0, 3),
        // Ô "[Biểu hiện thể hiện rõ qua sản phẩm]" của khung: nêu sản phẩm, dẫn về biểu hiện ở mục tiêu (không chép lại biểu hiện).
        ...dacThu.slice(0, 1).map((t) => [`Biểu hiện năng lực đặc thù môn (${t.ten})`, `${hoaDau(boCham(t.sanPham))} thể hiện rõ biểu hiện đã nêu ở mục tiêu`, "Chưa thể hiện hoặc thể hiện chưa đầy đủ"]),
        ...C.BANG_DANH_GIA.slice(3),
        ...(kh.thoiLuong && kh.thoiLuong.length > 1 ? [C.DONG_DANH_GIA_NHOM] : []), ...(coAi ? [C.DONG_DANH_GIA_AI] : []),
      ], [3354, 3000, 3000], "danh_gia"));
    }
    if (coAi) khoi.push({ ...tieuDeNho("PHIẾU KIỂM CHỨNG PHẢN HỒI AI"), chucNang: "ai" }, bang(C.PHIEU_KIEM_CHUNG_AI, undefined, "phieu_ai"));
    return khoi.length ? [{ truong: "phuLuc", khoi }] : [];
  };

  const chung = {
    monHoa: (mon?.ten_mon ?? "").toLocaleUpperCase("vi"),
    lop: tt.lop ?? "",
    tenBai: (tt.tenBai ?? "").replace(/\s*\(\s*\d+\s*tiết\s*\)\s*$/i, "").toLocaleUpperCase("vi"),
    soTiet: tt.soTiet ?? 1,
    coAi,
    tenMaTran: ["NĂNG LỰC ĐẶC THÙ", ...(nls.length || !coAi ? ["NĂNG LỰC SỐ"] : [])].join(", "),
  };

  if (chiTichHop(lc)) {
    // Giữ nguyên toàn bộ giáo án cũ theo thứ tự; chèn năng lực sau mục tiêu năng lực (I.2) cuối cùng,
    // chèn nhiệm vụ số vào cuối đúng hoạt động được chọn.
    // Nhóm năng lực app soạn mới (đặc thù, số, AI) THAY dòng cùng nhóm của KHBD gốc (đặt ở vị trí dòng gốc đầu tiên),
    // không ghép thêm bên cạnh; nhóm app không soạn thì giữ nguyên dòng gốc.
    const ds: Doan[] = [];
    const mtNangLuc = pt.doan.filter((d) => d.loai === "MT" && d.nhomMucTieu === "I.2");
    const mtCuoi = mtNangLuc[mtNangLuc.length - 1] ?? [...pt.doan].reverse().find((d) => d.loai === "MT");
    const khoiMoi: [DoanGoc[], Doan[]][] = [
      [[...nhomGv.tdSo, ...nhomGv.so], nls.length ? gan([them("", 1, "Năng lực số:", "tieu_de"), ...nls.map(dongNlsMucTieu)], { chucNang: "nls" }) : []],
      [[...nhomGv.tdAi, ...nhomGv.ai], ai.length ? gan([them("", 1, "Năng lực AI:", "tieu_de"), ...ai.map(dongAi)], { chucNang: "ai" }) : []],
    ];
    const thayTai = new Map<string, Doan[]>();
    const nangLucThem: Doan[] = [];
    for (const [cu, moi] of khoiMoi) {
      if (!moi.length) continue;
      const theoThuTu = pt.doan.filter((d) => cu.includes(d));
      theoThuTu.forEach((d) => doanKhongDung.add(d.ma));
      if (theoThuTu.length) thayTai.set(theoThuTu[0].ma, moi);
      else nangLucThem.push(...moi);
    }
    // Cuối mỗi hoạt động (gồm cả hoạt động con, không gồm phụ lục đi kèm): chỗ chèn năng lực số, AI, CLIL.
    const cuoiHoatDong = new Map<string, string[]>();
    for (const h of pt.hoatDong) {
      const cuoi = doanCuaHoatDong(pt, h.ma).filter((d) => d.loai !== "TD").pop();
      if (cuoi) cuoiHoatDong.set(cuoi.ma, [...(cuoiHoatDong.get(cuoi.ma) ?? []), h.ma]);
    }
    // Hoạt động soạn lại theo cách GV chọn (lượt tk_): bản mới thay phần mô tả cách tổ chức cũ; câu hỏi, ví dụ, bài tập,
    // bảng, công thức, hình của GV chép nguyên văn vào đúng bước (không bao giờ bị thay); đoạn chưa đặt giữ ở cuối.
    const soanLai = new Map<string, { m: HdMoi; ho: DoanGoc[] }>();
    for (const h of pt.hoatDong) {
      const m = nd[`tk_${h.ma}`];
      if (!m || (h.cha && nd[`tk_${h.cha}`])) continue;
      soanLai.set(h.ma, { m, ho: doanCuaHoatDong(pt, h.ma) });
    }
    const khongThay = (d: DoanGoc) => d.loai === "CH" || /<table|<img/i.test(d.html) || d.vanBan.includes("$");
    const thuocSoanLai = new Set<string>();
    for (const { m, ho } of soanLai.values()) {
      for (const d of ho) thuocSoanLai.add(d.ma);
      const thay = new Set(m.doanThay);
      for (const d of ho) if (thay.has(d.ma) && !khongThay(d) && !m.buoc.some((b) => b.maDoan.includes(d.ma))) doanKhongDung.add(d.ma);
    }
    const hoCua = (ma: string) => {
      const ho = new Set([ma]);
      for (let doi = true; doi;) { doi = false; for (const h of pt.hoatDong) if (h.cha && ho.has(h.cha) && !ho.has(h.ma)) { ho.add(h.ma); doi = true; } }
      return [...ho];
    };
    const khoiHdMoi = (ma: string): Doan[] => {
      const { m, ho } = soanLai.get(ma)!;
      const thuTu = new Map(ho.map((d, i) => [d.ma, i]));
      const daDat = new Set<string>();
      const datVao = (maDoan: string[]) => maDoan
        .filter((x) => thuTu.has(x) && !daDat.has(x) && !doanKhongDung.has(x))
        .sort((a, b) => thuTu.get(a)! - thuTu.get(b)!)
        .map((x) => { daDat.add(x); return goc(ho[thuTu.get(x)!], 2); });
      const buoc = m.buoc.flatMap((b, i) => [...dongBuoc(b, i), ...datVao(b.maDoan)]);
      const conLai = ho.filter((d) => !daDat.has(d.ma) && !doanKhongDung.has(d.ma));
      return gan([
        them(m.mucTieu, 1, "Mục tiêu:", "muc_tieu"),
        them("", 1, "Tổ chức:", "to_chuc"),
        them(m.cachToChuc, 2, "Cách tổ chức:", "cach_to_chuc"),
        ...buoc,
        ...(conLai.length ? [them("", 1, "Tư liệu của giáo viên:"), ...conLai.map((d) => goc(d, 2))] : []),
        them(m.sanPham, 1, "Sản phẩm – đánh giá:", "san_pham"),
        ...m.tieuChi.map((c) => them(c, 2, undefined, "tieu_chi")),
      ], { hd: ma });
    };
    // Năng lực AI: quy trình dùng AI có kiểm chứng đặt cuối hoạt động GV đã duyệt có AI, nếu không thì hoạt động vận dụng.
    const hdAi = coAi
      ? (pt.hoatDong.find((h) => /\bAI\b/.test(lc.trienKhai?.[h.ma] ?? "")) ?? pt.hoatDong.find((h) => h.loai === "van_dung") ?? pt.hoatDong.find((h) => h.loai === "luyen_tap") ?? pt.hoatDong[pt.hoatDong.length - 1])?.ma
      : undefined;
    const chenSauHoatDong = (maHd: string) => {
      const t = nlsTai((v) => v === maHd);
      ds.push(...gan([...t.hoatDong, ...t.tieuChi], { hd: maHd }));
      if (maHd === hdAi) ds.push(...gan([...quyTrinhAi(), ...tieuChiAi()], { hd: maHd, chucNang: "ai" }));
      if (maHd === lc.hoatDongTiengAnh) ds.push(...khoiClil(maHd));
    };
    for (const d of pt.doan) {
      if (doanKhongDung.has(d.ma)) { ds.push(...(thayTai.get(d.ma) ?? [])); if (d === mtCuoi) ds.push(...nangLucThem); continue; }
      if (thuocSoanLai.has(d.ma)) continue; // đã đặt trong bản soạn lại
      ds.push({ ...(d.loai === "TD" && /^(I|II|III|IV|V)\s*[.\-–]/.test(d.vanBan) ? { ...goc(d), kieu: "Muc1" } : goc(d)), ...(d.hoatDongCu ? { hd: d.hoatDongCu } : {}) });
      if (d === mtCuoi) ds.push(...nangLucThem);
      // Tiêu đề hoạt động đã soạn lại: bản mới ngay sau tiêu đề, rồi phần tích hợp của cả hoạt động (gồm hoạt động con).
      if (d.loai === "TD" && d.hoatDongCu && soanLai.has(d.hoatDongCu)) {
        ds.push(...khoiHdMoi(d.hoatDongCu));
        for (const maHd of hoCua(d.hoatDongCu)) chenSauHoatDong(maHd);
        continue;
      }
      for (const maHd of cuoiHoatDong.get(d.ma) ?? []) chenSauHoatDong(maHd);
    }
    return {
      ...chung, cheDo: "cu", coGd1: false, coGd3: false, doanKhongDung: [...doanKhongDung],
      phan: [{ truong: "noiDungCu", khoi: ds }, ...phuLuc(), ...maTran(hdAi ? nhanViTri(hdAi) : ""), ...phanTiengAnh],
    };
  }

  const anhXa = kh.anhXa ?? anhXaMacDinh(pt.hoatDong);
  const coGd1 = lc.chuyenKhung || lc.tuHoc.bat;
  const coGd3 = lc.chuyenKhung;
  const cho = chiaTheoAnhXa(pt, anhXa, coGd1, coGd3);
  const viTriAi = (kh.thoiLuong ?? []).filter((t) => t.muc.some((m) => m.hd === "HD3")).map((t) => t.tiet);
  const tietAi = viTriAi.length ? `HĐ III – tiết ${viTriAi[viTriAi.length - 1]}` : "HĐ III";
  // Câu hỏi và phương án đứng riêng; các đoạn tổ chức khác thụt lề dưới "Tổ chức:".
  const cauHoi = (ds: DoanGoc[]) => ds.map((d) => goc(d, d.loai === "CH" || /^[A-D]\.\s/.test(d.vanBan) || d.loai === "TD" ? 0 : 2));
  const soTiet = tt.soTiet ?? 1;
  const tenPa = soTiet === 1 ? "Bài 1 tiết" : soTiet === 2 ? "Bài 2 tiết" : `Bài ≥ 3 tiết – Phương án ${lc.phuongAn ?? "A"}`;

  const thietBi: Doan[] = [
    ...pt.doan.filter((d) => d.loai === "TB").map((d) => goc(d)),
    ...(lc.nenTang.length ? [them(`Câu hỏi luyện tập cho HĐ II trên ${lc.nenTang.join(", ")}.`)] : []),
    ...(coAi ? [{ ...them("Phiếu kiểm chứng phản hồi AI."), chucNang: "ai" as const }] : []),
  ];

  const g1 = nd.gd1;
  const nlsGd1 = nlsTai((v) => v === "GD1");
  const gd1: Doan[] = coGd1
    ? gan([
        them(C.GD1_MUC_TIEU, 1, "Mục tiêu:", "muc_tieu"),
        them("", 1, "Nhiệm vụ của học sinh:", "to_chuc"),
        ...C.gd1NhiemVu(nenTangTuHoc).map((c, i) => them(i === 0 && g1?.noiDungTuHoc ? c.replace(/\.$/, ` về “${g1.noiDungTuHoc.replace(/\.$/, "")}”.`) : c, 2)),
        ...nlsGd1.hoatDong,
        ...(cho.GD1.length ? [them("", 1, "Nội dung tự học:"), ...cho.GD1.map((d) => goc(d, d.loai === "TD" ? 0 : 2))] : []),
        ...(g1?.cauHoi.length ? [them("", 1, "Câu hỏi trọng tâm HS làm trước tiết (có đáp án):"), ...g1.cauHoi.flatMap((c, i) => [them(`${c.muc}: Câu ${i + 1}. ${c.cauHoi}`, 2), them(c.dapAn, 2, "Đáp án:")])] : []),
        them(C.gd1CongViecGv(nenTangTuHoc), 1, "Công việc của giáo viên:"),
        them(C.GD1_SAN_PHAM, 1, "Sản phẩm – đánh giá:", "san_pham"),
        ...nlsGd1.tieuChi,
      ], { hd: "GD1" })
    : [];

  const dong = (kh.thoiLuong ?? []).flatMap((t) => t.muc.map((m) => [`Tiết ${t.tiet}${t.nhan ? ` (${t.nhan})` : ""}`, m.ten, `${m.phut} phút`]));
  const bangThoiLuong: Khoi[] = dong.length ? [bang([["Tiết", "Hoạt động", "Thời gian"], ...dong], [2200, 5154, 2000], "thoi_luong")] : [];

  // Chia 4 bước theo thời lượng HĐ II của một tiết (bài nhiều tiết: mỗi tiết như nhau).
  const hd2MoiTiet = (kh.thoiLuong ?? []).map((t) => t.muc.filter((m) => m.hd === "HD2").reduce((s, m) => s + m.phut, 0)).filter((p) => p > 0);
  const phut = chiaPhutHd2(hd2MoiTiet[0] ?? 15);
  const moiTiet = hd2MoiTiet.length > 1 ? " mỗi tiết" : "";
  const hinhThuc2 = lc.hinhThucHD2.join(", ");
  const hinhThuc3 = lc.hinhThucHD3.join(", ");
  const h1 = nd.hd1, h2 = nd.hd2, h3 = nd.hd3, h4 = nd.hd4;
  const nlsHd = (hd: string) => nlsTai((v) => v.startsWith(`${hd}_`));
  const coPhuLucDanhGia = lc.chuyenKhung;

  const buocHd2: Doan[] = h2
    ? [
        ...dongBuocHd2(`Giao nhiệm vụ (${phut[0]} phút${moiTiet})`, [h2.giaoNhiemVu ? `GV ${boChuDau(h2.giaoNhiemVu, "GV")}` : "GV nêu nhiệm vụ, chia nhóm/phân vai theo mức đạt (Nắm tốt / Cần củng cố / Cần hỗ trợ), nêu rõ sản phẩm và tiêu chí"]),
        ...dongBuocHd2(`Thực hiện nhiệm vụ (${phut[1]} phút${moiTiet})`, [...h2.thucHien, "GV quan sát, hỗ trợ trực tiếp nhóm Cần hỗ trợ, giao nhiệm vụ mở rộng cho nhóm Nắm tốt"]),
        them(h2.phanHoa.namTot, 2, "Nhóm Nắm tốt:"), them(h2.phanHoa.canCungCo, 2, "Nhóm Cần củng cố:"), them(h2.phanHoa.canHoTro, 2, "Nhóm Cần hỗ trợ:"),
        ...dongBuocHd2(`Báo cáo, thảo luận (${phut[2]} phút${moiTiet})`, [h2.baoCao, "Tập trung vào các lỗi hiểu hay gặp"]),
        ...dongBuocHd2(`Kết luận, nhận định (${phut[3]} phút${moiTiet})`, [`GV chốt ${thuongDau(boCham(h2.ketLuan))}, chỉnh các lỗi còn lại`, "HS ghi lại lỗi đã sửa"]),
      ]
    : C.hd2Buoc(phut).map((c) => them(moiTiet ? c.replace(/\((\d+) phút\)/, "($1 phút mỗi tiết)") : c, 2, undefined, "buoc"));

  const tinhHuongGv = h1?.maDoanTinhHuong ? pt.doan.find((d) => d.ma === h1.maDoanTinhHuong) : undefined;
  const coVanDung1 = !!h3?.vanDung.some((v) => /Vận dụng 1\b/.test(v.tieuDe));
  const hoatDong: [string, Khoi[]][] = [
    ["HD1", [
      them(C.HD1_MUC_TIEU, 1, "Mục tiêu:", "muc_tieu"),
      them("", 1, "Tổ chức:", "to_chuc"),
      ...(h1?.cachToChuc ? [them(h1.cachToChuc, 2, "Cách tổ chức:", "cach_to_chuc"), ...h1.buoc.flatMap(dongBuoc)] : []),
      ...cho.HD1.map((d) => goc(d, 2)),
      ...(h1 ? [
        ...(h1.tinhHuong && !tinhHuongGv ? [them(`GV đưa ra tình huống mở đầu: ${h1.tinhHuong}`, 2, undefined, "tinh_huong")] : []),
        them(`Hỏi: ${h1.cauHoi}${coVanDung1 ? " (Tình huống được giải trọn vẹn ở HĐ III – Vận dụng 1.)" : " (Tình huống được giải trọn vẹn ở HĐ III.)"}`, 2, undefined, "cau_hoi_mo_dau"),
        them("GV đưa ra các nhận định phản biện để chỉnh lỗi nhận thức dựa trên kết quả tự học:", 2, undefined, "nhan_dinh_dau"),
        ...h1.nhanDinh.map((n) => them(`“${n.nhanDinh.trim().replace(/[.?!]+$/, "")}?” (HS thảo luận, rút ra kết luận: ${boCham(n.ketLuan)}).`, 2, undefined, "nhan_dinh")),
      ] : []),
      ...nlsHd("HD1").hoatDong,
      them(C.HD1_SAN_PHAM, 1, "Sản phẩm – đánh giá:", "san_pham"),
      ...nlsHd("HD1").tieuChi,
    ]],
    ["HD2", [
      ...(h2 ? [them(h2.mucTieu, 1, "Mục tiêu:", "muc_tieu")] : []),
      ...(hinhThuc2 ? [them(`${hinhThuc2}.`, 1, "Hình thức tổ chức:")] : []),
      them("", 1, "Tổ chức:", "to_chuc"),
      ...buocHd2,
      ...nlsHd("HD2").hoatDong,
      ...cauHoi(cho.HD2),
      ...(nd.cau_hoi ? khoiCauHoi(nd.cau_hoi) : []),
      them(`${h2?.sanPham ? `${boCham(h2.sanPham)}; ` : ""}${C.HD2_SAN_PHAM}`, 1, "Sản phẩm – đánh giá:", "san_pham"),
      ...nlsHd("HD2").tieuChi,
    ]],
    ["HD3", [
      ...(h3 ? [them(h3.mucTieu, 1, "Mục tiêu:", "muc_tieu")] : []),
      ...(hinhThuc3 ? [them(`${hinhThuc3}.`, 1, "Hình thức tổ chức:")] : []),
      them("", 1, "Tổ chức:", "to_chuc"),
      ...(h3 ? [...(h3.phuongPhap ? [them(h3.phuongPhap, 2, "Cách tổ chức:", "cach_to_chuc")] : []), ...h3.buoc.flatMap(dongBuoc)] : []),
      ...nlsHd("HD3").hoatDong,
      ...cauHoi(cho.HD3),
      ...(h3 ? h3.vanDung.flatMap((v) => [them(`${boCham(v.tieuDe)}: ${v.noiDung}`, 0), them(v.loiGiai, 0, "Lời giải/sản phẩm:")]) : []),
      ...(h3?.anToan ? [them(h3.anToan, 1, "Biện pháp an toàn:")] : []),
      ...(coAi ? gan(quyTrinhAi(), { chucNang: "ai" }) : []),
      them(`${h3?.sanPham ? boCham(h3.sanPham) : "Lời giải/bảng/sơ đồ/sản phẩm thực hành của nhóm"}${coAi ? "; Phiếu kiểm chứng phản hồi AI" : ""}.`, 1, "Sản phẩm – đánh giá:", "san_pham"),
      ...(h3 ? h3.tieuChi.map((c) => them(c, 2, undefined, "tieu_chi")) : []),
      // Phụ lục đánh giá sản phẩm được dùng ở đây (khung 3 giai đoạn).
      ...(h3?.danhGia || coPhuLucDanhGia
        ? [them(`${h3?.danhGia ? `${boCham(h3.danhGia)}; ` : ""}${coPhuLucDanhGia ? "đối chiếu với bảng tiêu chí ở Phụ lục đánh giá sản phẩm (mục IV)." : ""}`.replace(/; $/, "."), 2, "Cách đánh giá:", "danh_gia")]
        : []),
      ...nlsHd("HD3").tieuChi,
      ...(coAi ? gan(tieuChiAi(), { chucNang: "ai" }) : []),
    ]],
    ["HD4", [
      them(C.HD4_MUC_TIEU, 1, "Mục tiêu:", "muc_tieu"),
      them(C.HD4_EXIT, 1, "Exit ticket:", "to_chuc"),
      // Mỗi câu exit ticket một đoạn, đáp án xuống đoạn riêng ngay dưới câu.
      ...(h4 ? h4.exitTicket.flatMap((c, i) => [them(`Câu ${i + 1}. ${c.cauHoi}`, 0), them(c.dapAn, 0, "Đáp án:")]) : []),
      ...nlsHd("HD4").hoatDong,
      ...(h4 ? [them(`Tổng kết ${boCham(thuongDau(h4.chotKienThuc))}. Nhắc HS truy cập hệ thống xem lại các câu làm sai; giao bài tập về nhà và nhiệm vụ tự học cho bài mới.`, 1, "GV chốt kiến thức:")] : []),
      ...cho.HD4.map((d) => goc(d, 1)),
      them(C.HD4_SAN_PHAM, 1, "Sản phẩm – đánh giá:", "san_pham"),
      ...nlsHd("HD4").tieuChi,
    ]],
  ];
  const phanHoatDong: Phan[] = hoatDong.map(([ma, ds]) => ({
    truong: "tienTrinh",
    khoi: [
      { nguon: "bo_sung", chu: `${C.TEN_HD[ma]}${thoiGianHd(kh, ma)}`, kieu: "TenHoatDong", hd: ma } as Doan,
      ...ds.map((k) => ("loai" in k ? k : { ...k, hd: k.hd ?? ma })),
      // CLIL chỉ vào hoạt động đã chọn (khung 3 giai đoạn).
      ...(ma === lc.hoatDongTiengAnh ? khoiClil(ma) : []),
    ],
  }));

  const gd3: Doan[] = coGd3 ? gan([...C.GD3.map((c) => them(c)), ...(soTiet > 1 ? [them(C.GD3_NHIEU_TIET)] : []), ...cho.GD3.map((d) => goc(d, 1))], { hd: "GD3" }) : [];

  const nangLucMoi = khoiNangLucMoi(coGd1);
  return {
    ...chung, cheDo: "moi", coGd1, coGd3,
    doanKhongDung: [...doanKhongDung],
    phan: [
      { truong: "phuongAn", khoi: [them(`Phương án phân bổ thời lượng: ${tenPa}.`, 0)] },
      { truong: "kienThuc", khoi: mt("I.1") },
      { truong: "nangLuc", khoi: nangLucMoi },
      { truong: "phamChat", khoi: mt("I.3") },
      { truong: "thietBi", khoi: thietBi },
      { truong: "gd1", khoi: gd1 },
      { truong: "tienTrinh", khoi: bangThoiLuong },
      ...phanHoatDong,
      { truong: "gd3", khoi: gd3 },
      ...phuLuc(cho.KEM), ...maTran(tietAi), ...phanTiengAnh,
    ],
  };
}

/** Ghép → biên tập trên dữ liệu có cấu trúc → dữ liệu cho mẫu Word. */
export function ghepDuLieu(pt: PhanTichGiaoAn, tt: ThongTinBai, lc: LuaChon, kh: KeHoach, tc: TuyChonXuat, nd: NoiDungSoan = {}, traChiBao?: TraChiBao): DuLieuMau {
  const { ban } = bienTap(lapBanSoan(pt, tt, lc, kh, nd, traChiBao), nguCanhBienTap(pt, lc));
  return dungDuLieuMau(ban, tc);
}

/** Đoạn của KHBD gốc phải còn nguyên văn trong file xuất (trừ dòng đã được thay có chủ đích, vd năng lực gốc). */
export function doanCanGiu(pt: PhanTichGiaoAn, tt: ThongTinBai, lc: LuaChon, kh: KeHoach, nd: NoiDungSoan = {}, traChiBao?: TraChiBao): DoanGoc[] {
  const bo = new Set(lapBanSoan(pt, tt, lc, kh, nd, traChiBao).doanKhongDung ?? []);
  return pt.doan.filter((d) => !bo.has(d.ma));
}

/** Báo cáo cho bước 5: các chỗ bước biên tập đã tự sửa và lỗi biên tập còn lại (nếu có). */
export function baoCaoBienTap(pt: PhanTichGiaoAn, tt: ThongTinBai, lc: LuaChon, kh: KeHoach, nd: NoiDungSoan = {}, traChiBao?: TraChiBao): { suaDoi: SuaDoi[]; loi: LoiKiemTra[] } {
  const ngu = nguCanhBienTap(pt, lc);
  const { ban, suaDoi } = bienTap(lapBanSoan(pt, tt, lc, kh, nd, traChiBao), ngu);
  return { suaDoi, loi: kiemTraBanSoan(ban, ngu) };
}

/**
 * Nội dung một hoạt động của khung mới (HĐ I–IV, Giai đoạn 1/3) đúng như trong bản soạn sau biên tập, từng dòng chữ.
 * Dùng khi chọn LHĐN + tiếng Anh: dịch hoạt động đã chuyển khung (gồm phần app soạn và phần của GV được xếp vào đó),
 * không dịch hoạt động trong KHBD gốc.
 */
export function noiDungHoatDongMoi(pt: PhanTichGiaoAn, tt: ThongTinBai, lc: LuaChon, kh: KeHoach, nd: NoiDungSoan, hd: string, traChiBao?: TraChiBao): string[] {
  const { ban } = bienTap(lapBanSoan(pt, tt, lc, kh, { ...nd, tieng_anh: undefined }, traChiBao), nguCanhBienTap(pt, lc));
  if (ban.cheDo === "cu") {
    // Giữ bố cục, hoạt động đã soạn lại: các đoạn của hoạt động (và hoạt động con), không lấy tiêu đề và phụ lục đi kèm.
    const ho = new Set([hd, ...pt.hoatDong.filter((h) => h.cha === hd).map((h) => h.ma)]);
    const bo = new Set([...pt.hoatDong.flatMap((h) => h.kem ?? []), ...pt.doan.filter((d) => d.loai === "TD" && d.hoatDongCu === hd).map((d) => d.ma)]);
    return ban.phan.filter((p) => p.truong === "noiDungCu").flatMap((p) => p.khoi)
      .filter((k): k is Doan => !("loai" in k) && !!k.hd && ho.has(k.hd) && !(k.maGoc && bo.has(k.maGoc)))
      .map(chuDoan).filter(Boolean);
  }
  // Mỗi hoạt động là một phần riêng (dòng đầu là tên hoạt động); bảng trong phần đó (câu hỏi, phiếu) cũng lấy.
  const phan = ban.phan.find((p) => (p.truong === "tienTrinh" || p.truong === "gd1" || p.truong === "gd3") && p.khoi.some((k) => !("loai" in k) && k.hd === hd));
  return (phan?.khoi ?? [])
    .filter((k) => ("loai" in k) || (k.hd === hd && k.kieu !== "TenHoatDong"))
    .map((k) => ("loai" in k ? k.hang.map((h) => h.join(" | ")).join("\n") : chuDoan(k)))
    .filter(Boolean);
}

export type { HoatDongCu };
