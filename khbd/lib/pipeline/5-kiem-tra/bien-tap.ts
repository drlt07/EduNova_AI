/**
 * Biên tập KHBD sau khi AI soạn, trước khi xuất file. Làm việc trên bản soạn có cấu trúc (6-xuat-file/ban-soan.ts):
 * mỗi đoạn biết mình là phần giữ nguyên của GV hay phần bổ sung, thuộc hoạt động nào, giữ vai trò gì
 * (mục tiêu, bước tổ chức, tiêu chí…) và thuộc chức năng tích hợp nào.
 *
 * Nguyên tắc: không đổi chữ của GV (chỉ được đặt lại vị trí trong khung mới); chỉ bỏ phần lặp do quá trình
 * sinh thêm; không bỏ mục bắt buộc của hoạt động (mục tiêu, tổ chức, sản phẩm); không đặt chỉ tiêu số trang.
 *
 * `bienTap` sửa và ghi lại từng chỗ đã sửa; `kiemTraBanSoan` chỉ phát hiện (dùng cho bước 5 và test).
 */
import type { LuaChon } from "../2-lua-chon/lua-chon";
import { coClil, coDichTiengAnh } from "../2-lua-chon/lua-chon";
import type { PhanTichGiaoAn } from "../kieu";
import { cacDoan, chuDoan, laBang, VUNG_CUA_TRUONG, type BanSoan, type Bang, type Khoi, type Phan, type VungBan } from "../6-xuat-file/ban-soan";
import type { ChucNang, Doan } from "../6-xuat-file/xml";
import { boDauThuong } from "@khbd/lib/data/nls";
import type { LoiKiemTra } from "./kiem-tra-file";

export type NguCanhBienTap = {
  chucNang: Record<ChucNang, boolean>;
  nenTangChon: string[];
  /** Mã đoạn của giáo án gốc (MT-01, HD-03…): mã nội bộ, không được xuất hiện trong KHBD. */
  maDoan: Set<string>;
};

/** Tên nền tảng hay gặp (chỉ để nhận ra tên không được chọn). */
const NEN_TANG = ["EduNext", "Quizizz", "Azota", "Kahoot", "Google Forms", "Padlet", "Canva", "Shub", "OLM", "K12Online", "Mentimeter"];

export function nguCanhBienTap(pt: PhanTichGiaoAn, lc: LuaChon): NguCanhBienTap {
  return {
    chucNang: { nls: lc.nls, ai: lc.ai, clil: coClil(lc), tieng_anh: coDichTiengAnh(lc), lhdn: lc.lhdn || lc.chuyenKhung },
    nenTangChon: [...lc.nenTang, lc.tuHoc.bat ? lc.tuHoc.nenTang : ""].filter(Boolean),
    maDoan: new Set(pt.doan.map((d) => d.ma)),
  };
}

export type LoaiBienTap =
  | "lap_noi_dung" // lặp giữa mục tiêu, tiến trình, phụ lục
  | "ma_lap" // "NLa: NLa:"
  | "noi_bo" // lời hướng dẫn nội bộ cho AI
  | "khong_chon" // nội dung của chức năng không chọn
  | "tham_chieu" // mã/tham chiếu không tồn tại
  | "cau_van" // câu ghép máy móc, thừa dấu câu
  | "lap_nhiem_vu" // một nhiệm vụ lặp trong cùng hoạt động
  | "lap_cau_truc" // một bước tổ chức lặp ở nhiều cấp
  | "phu_luc" // phụ lục không dùng trong tiến trình
  | "cong_don" // năng lực của KHBD gốc bị cộng dồn với mục tiêu theo cấu trúc mới
  | "trinh_bay"; // trình bày Word: phương án, đáp án, các bước gộp chung một đoạn

export type SuaDoi = { loai: LoaiBienTap; noiDung: string };

// ───────────────────────── Tiện ích chữ ─────────────────────────

const chuan = (s: string) => boDauThuong(s).replace(/[^a-z0-9]+/g, " ").trim();
const trich = (s: string, n = 60) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

/** Áp hàm lên phần chữ nằm ngoài công thức $...$ (công thức giữ nguyên). */
function ngoaiCongThuc(s: string, f: (t: string) => string): string {
  return s.split(/(\$[^$]*\$)/).map((p, i) => (i % 2 ? p : f(p))).join("");
}

/**
 * Tách câu: sau . ! ? (có thể kèm ” ) ») rồi khoảng trắng. Không tách trong công thức, số thập phân (6.15),
 * chữ viết tắt một kí tự (A. B. của phương án).
 */
export function tachCau(s: string): string[] {
  const kq: string[] = [];
  let dau = 0, trongCongThuc = false, ngoac = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === "$") trongCongThuc = !trongCongThuc;
    if (trongCongThuc) continue;
    if (c === "(") ngoac++;
    if (c === ")") ngoac = Math.max(0, ngoac - 1);
    if (ngoac === 0 && /[.!?]/.test(c)) {
      let j = i + 1;
      while (j < s.length && /[”"»)’]/.test(s[j])) j++;
      if (j < s.length && !/\s/.test(s[j])) continue;
      if (c === "." && /(^|\s)[A-Za-zĐđ]$/.test(s.slice(dau, i))) continue;
      // Số thứ tự đầu câu ("3. Không nhập…") không phải hết câu.
      if (c === "." && /^\s*\d{1,2}$/.test(s.slice(dau, i))) continue;
      kq.push(s.slice(dau, j).trim());
      dau = j;
      i = j - 1;
    }
  }
  if (s.slice(dau).trim()) kq.push(s.slice(dau).trim());
  return kq.filter(Boolean);
}

/** Tách vế theo dấu chấm phẩy ở cấp ngoài cùng (không tách trong ngoặc, công thức). */
function tachVe(cau: string): string[] {
  const kq: string[] = [];
  let dau = 0, ngoac = 0, ct = false;
  for (let i = 0; i < cau.length; i++) {
    const c = cau[i];
    if (c === "$") ct = !ct;
    if (ct) continue;
    if (c === "(" || c === "“") ngoac++;
    if (c === ")" || c === "”") ngoac = Math.max(0, ngoac - 1);
    if (c === ";" && ngoac === 0) { kq.push(cau.slice(dau, i)); dau = i + 1; }
  }
  kq.push(cau.slice(dau));
  return kq.map((v) => v.trim()).filter(Boolean);
}

const hoaDau = (s: string) => s.replace(/^(\s*[“"(]?)(\p{Ll})/u, (_m, a: string, b: string) => a + b.toLocaleUpperCase("vi"));

/**
 * Bỏ các vế (và nhóm trong ngoặc) khớp mẫu; giữ phần còn lại thành câu hoàn chỉnh.
 * Trả về chữ mới và các vế đã bỏ.
 */
export function boVe(s: string, khop: (ve: string) => boolean): { chu: string; bo: string[] } {
  const bo: string[] = [];
  // Nhóm trong ngoặc chỉ chứa lời cần bỏ.
  let chu = s.replace(/\s*\(([^()]*)\)/g, (m, trong: string) => (khop(trong) ? (bo.push(trong.trim()), "") : m));
  const cau = tachCau(chu).map((c) => {
    const ket = /[.!?]["”»)’]*$/.exec(c)?.[0] ?? "";
    const than = ket ? c.slice(0, -ket.length) : c;
    const ve = tachVe(than);
    const giu = ve.filter((v) => (khop(v) ? (bo.push(v), false) : true));
    if (!giu.length) return "";
    return giu.join("; ") + (giu.length === ve.length ? ket : ket || "");
  }).filter(Boolean);
  if (!bo.length) return { chu: s, bo };
  chu = cau.map((c) => hoaDau(c)).join(" ");
  if (bo.length && chu && !/[.!?:"”»)]$/.test(chu)) chu += ".";
  return { chu, bo };
}

// ───────────────────────── Mẫu nhận diện ─────────────────────────

/** Lời hướng dẫn nội bộ (cho AI/cho người soạn), không phải nội dung dạy học. */
const MAU_NOI_BO: RegExp[] = [
  /nếu\s+(giáo án|KHBD|kế hoạch bài dạy|bài soạn)\s+(cũ|gốc|ban đầu|của GV)/i,
  /nếu\s+(GV|giáo viên)\s+(chưa|không)\s+(ghi|đánh|nêu|chọn|có)\b/i,
  /(chưa|không)\s+(đánh|ghi|gắn)\s+mã\b/i,
  /(^|[^\p{L}])(JSON|LLM|schema|prompt|placeholder|TODO)([^\p{L}]|$)/iu,
  /mã đoạn|chép nguyên văn|giữ nguyên văn|nguyên văn của (GV|giáo viên)|giu_nguyen|bo_sung/i,
  /(ghi chú|lưu ý)\s+(nội bộ|cho (AI|mô hình|hệ thống|người soạn|app|ứng dụng))/i,
  /(hãy|cần|phải)\s+(viết|soạn|điền)\s+(phần|mục|trường|nội dung)\s+(này|trên|dưới)/i,
  /thầy\/cô|thầy cô hãy/i,
  /(theo|đúng)\s+(yêu cầu|hướng dẫn)\s+(của\s+)?(người dùng|người soạn|prompt)/i,
  /(không|chưa)\s+(có|đủ)\s+(dữ liệu|thông tin)\s+(để|nên)\s+(xác định|viết|soạn|ghi)/i,
  /\b(giả định rằng|tôi (đã|sẽ) (viết|soạn|thêm))\b/i,
  // Tên trường kiểu lập trình: bieuHien, viTri, maDoanTinhHuong…
  /(^|[^\p{L}])[a-z]{2,}[A-Z][a-z]+[A-Za-z]*([^\p{L}]|$)/u,
];
const TU_KIEU_LAP_TRINH_HOP_LE = /\b(iPhone|iPad|iOS|macOS|eLearning|YouTube|GeoGebra|PowerPoint|JavaScript|TikTok|LibreOffice)\b/g;
export const laNoiBo = (s: string) => MAU_NOI_BO.some((m) => m.test(s.replace(TU_KIEU_LAP_TRINH_HOP_LE, "")));

/** Nội dung của từng chức năng tích hợp (nhận ra trong phần bổ sung khi chức năng đó không được chọn). */
const MAU_CHUC_NANG: Partial<Record<ChucNang, RegExp>> = {
  ai: /(^|[^\p{L}])AI([^\p{L}]|$)|trí tuệ nhân tạo|chatbot|ChatGPT|Gemini|Copilot|phiếu kiểm chứng/iu,
  clil: /tiếng Anh|CLIL|key words?|English|song ngữ/i,
  nls: /(^|[^\d.])[1-6]\.[1-6]\.5\.\d(?![\d.])|năng lực số/i,
};

/** Mã đoạn nội bộ của app (MT-01, HD-03, VD-01…). */
const MA_NOI_BO = /\b(?:MT|HD|CH|TB|TD|KH|VD|HDC|NL)-\d{1,3}\b/g;

/** Từ chức năng hay bị lặp liền nhau khi ghép máy móc ("HS HS", "để để"). Không gồm từ láy hợp lệ. */
const TU_LAP = "HS|GV|để|và|của|là|các|những|trong|với|cho|được|khi|thì|mà|bằng|Tiêu chí|Mục tiêu";

/** Lỗi dấu câu và ghép câu máy móc: [mẫu, cách sửa, mô tả]. */
const LOI_DAU_CAU: [RegExp, string, string][] = [
  [/\s+([,.;:!?])(?!\.)/g, "$1", "khoảng trắng trước dấu câu"],
  [/\(\s+/g, "(", "khoảng trắng sau ngoặc mở"],
  [/\s+\)/g, ")", "khoảng trắng trước ngoặc đóng"],
  [/(?<!\.)\.\.(?!\.)/g, ".", "hai dấu chấm"],
  [/([;,:])\1+/g, "$1", "dấu câu lặp"],
  [/[.,]\s*;/g, ";", "“.;” hoặc “,;”"],
  [/[;,:]\s*\.(?!\.)/g, ".", "dấu câu thừa trước dấu chấm"],
  [/\.\s*,/g, ",", "“.,”"],
  [/:\s*;/g, ":", "“:;”"],
  [/(?<!\.)\.\?/g, "?", "“.?”"],
  [/([?!])\./g, "$1", "dấu chấm thừa sau ? hoặc !"],
  [/\.\)\./g, ").", "dấu chấm thừa trong ngoặc"],
  [/([,;:])(?=\p{L})/gu, "$1 ", "thiếu khoảng trắng sau dấu câu"],
  [new RegExp(`(^|[\\s(])(${TU_LAP})\\s+\\2(?=[\\s,.;:]|$)`, "giu"), "$1$2", "lặp từ liền nhau"],
  // Đúng hai dấu cách (ba trở lên là canh lề có chủ đích, vd giữa các phương án A–D).
  [/(?<! ) {2}(?! )/g, " ", "thừa khoảng trắng"],
];

/** Sửa dấu câu (ngoài công thức). */
export function suaDauCau(s: string): { chu: string; loi: string[] } {
  const loi: string[] = [];
  const chu = ngoaiCongThuc(s, (t) => {
    let r = t;
    for (const [m, thay, ten] of LOI_DAU_CAU) {
      const moi = r.replace(m, thay);
      if (moi !== r) { loi.push(ten); r = moi; }
    }
    return r;
  }).trim();
  return { chu, loi };
}

/** Gộp mã/nhãn lặp liền nhau: "NLa: NLa:", "Tiêu chí 5.2.5.2: Tiêu chí 5.2.5.2:", "NLa (NLa)". */
export function gopMaLap(s: string): { chu: string; lap: string[] } {
  const lap: string[] = [];
  const chu = ngoaiCongThuc(s, (t) => {
    let r = t, cu = "";
    while (cu !== r) {
      cu = r;
      r = r.replace(/(^|[\s(“"])([^\s:;.,()][^:;()]{0,48}?)\s*[:–-]\s*\2\s*:/u, (_m, a: string, ma: string) => (lap.push(ma), `${a}${ma}:`));
      r = r.replace(/(^|[\s(“"])([\p{L}\d][\p{L}\d.]{0,20})\s*\(\s*\2\s*\)/u, (_m, a: string, ma: string) => (lap.push(ma), `${a}${ma}`));
    }
    return r;
  });
  return { chu, lap };
}

// ───────────────────────── Biên tập ─────────────────────────

/** Nhãn cùng nghĩa "tổ chức" (khung mới) — lặp cấp khi đứng liền nhau. */
const NHAN_TO_CHUC = new Set(["to chuc", "cach to chuc", "to chuc thuc hien", "phuong phap", "phuong phap to chuc", "cach thuc to chuc"]);
const nhanChuan = (n?: string) => chuan((n ?? "").replace(/^\s*[a-dđ1-4][.)]\s*/i, "").replace(/:\s*$/, ""));
const VAI_BAT_BUOC = new Set(["muc_tieu", "to_chuc", "san_pham"]);
/** Đoạn GV mang nhãn cấu trúc của khung cũ: "a) Mục tiêu: …", "c) Sản phẩm: …". */
const NHAN_KHUNG_CU: [RegExp, "muc_tieu" | "san_pham"][] = [
  [/^\s*(?:[a-dđ1-4][.)]\s*)?Mục tiêu\s*:/i, "muc_tieu"],
  [/^\s*(?:[a-dđ1-4][.)]\s*)?Sản phẩm(?: học tập)?\s*:/i, "san_pham"],
];
const laCauHoiHayPhuongAn = (s: string) => /^\s*(Câu \d+[.:]|[A-D]\.\s|[a-d]\)\s|Đáp án:)/.test(s);

/** Chữ của đoạn bổ sung (không gồm nhãn). */
const noiDung = (d: Doan) => (d.html !== undefined ? chuDoan({ ...d, nhan: undefined }) : (d.chu ?? "").trim());

function doiChu(d: Doan, chu: string): Doan {
  return { ...d, chu };
}

type BoiCanh = { ngu: NguCanhBienTap; sua: SuaDoi[]; ban: BanSoan };
const ghi = (bc: BoiCanh, loai: LoaiBienTap, noiDung: string) => bc.sua.push({ loai, noiDung });

/** Chức năng không chọn: bỏ đoạn, hàng bảng, vế câu thuộc chức năng đó (chỉ phần bổ sung). */
function boChucNangKhongChon(bc: BoiCanh) {
  const { chucNang } = bc.ngu;
  const tiengAnhNaoDo = chucNang.clil || chucNang.tieng_anh;
  const tat = (cn: ChucNang) => (cn === "clil" || cn === "tieng_anh" ? (cn === "clil" ? !chucNang.clil : !chucNang.tieng_anh) : !chucNang[cn]);
  const nenTangKhongChon = NEN_TANG.filter((t) => !bc.ngu.nenTangChon.some((c) => c.toLowerCase() === t.toLowerCase()));
  const mauVe = (v: string) =>
    (!chucNang.ai && MAU_CHUC_NANG.ai!.test(v)) || (!tiengAnhNaoDo && MAU_CHUC_NANG.clil!.test(v)) || (!chucNang.nls && MAU_CHUC_NANG.nls!.test(v))
    || nenTangKhongChon.some((t) => new RegExp(`(^|[^\\p{L}])${t}([^\\p{L}]|$)`, "iu").test(v));
  for (const p of bc.ban.phan) {
    p.khoi = p.khoi.flatMap((k): Khoi[] => {
      if (laBang(k)) {
        if (k.vai !== "ma_tran" && k.vai !== "danh_gia") return [k];
        const hang = k.hang.filter((h, i) => i === 0 || !((!chucNang.ai && /Năng lực AI|AI minh bạch/.test(h[0])) || (!chucNang.nls && h[0] === "Năng lực số")));
        if (hang.length < k.hang.length) ghi(bc, "khong_chon", `Bỏ ${k.hang.length - hang.length} hàng bảng thuộc chức năng không chọn.`);
        return hang.length > 1 ? [{ ...k, hang }] : [];
      }
      if (k.nguon !== "bo_sung") return [k];
      if (k.chucNang && tat(k.chucNang)) { ghi(bc, "khong_chon", `Bỏ “${trich(chuDoan(k))}” vì không chọn chức năng này.`); return []; }
      if (p.truong === "tiengAnh" || !k.chu) return [k];
      const { chu, bo } = boVe(k.chu, mauVe);
      if (!bo.length) return [k];
      bo.forEach((v) => ghi(bc, "khong_chon", `Bỏ “${trich(v)}” vì không chọn chức năng này.`));
      return chu || k.nhan ? [doiChu(k, chu)] : [];
    });
  }
}

/** Số thứ tự các mục "Vận dụng k" có trong tiến trình. */
const vanDungCo = (ban: BanSoan) => new Set(cacDoan(ban).map((x) => /^\s*Vận dụng (\d+)\b/.exec(noiDung(x.doan))?.[1]).filter(Boolean));

/** Làm sạch chữ từng đoạn bổ sung: lời nội bộ, mã nội bộ, tham chiếu không tồn tại, mã lặp, dấu câu. */
function lamSachChu(bc: BoiCanh) {
  const vanDung = vanDungCo(bc.ban);
  for (const p of bc.ban.phan) {
    p.khoi = p.khoi.flatMap((k): Khoi[] => {
      if (laBang(k)) return [lamSachBang(bc, k)];
      if (k.nguon !== "bo_sung" || !k.chu) return [k];
      let chu = k.chu;
      // 1. Lời hướng dẫn nội bộ.
      const nb = boVe(chu, laNoiBo);
      nb.bo.forEach((v) => ghi(bc, "noi_bo", `Bỏ lời hướng dẫn nội bộ “${trich(v)}”.`));
      chu = nb.chu;
      // 2. Mã đoạn nội bộ (MT-01…): kể cả mã có trong giáo án, vì đó là mã của app, không phải nội dung.
      chu = ngoaiCongThuc(chu, (t) => t
        .replace(new RegExp(`\\s*\\((?:mã\\s*|xem\\s*|theo\\s*)?${MA_NOI_BO.source}(?:\\s*[,;–-]\\s*${MA_NOI_BO.source})*\\)`, "g"), (m) => (ghiMa(bc, m), ""))
        .replace(new RegExp(`\\s*(?:so với|đối chiếu với|ứng với|với|theo|thuộc|xem|đoạn|mã|tại|ở)\\s+${MA_NOI_BO.source}(?:\\s*(?:,|và)\\s*${MA_NOI_BO.source})*`, "gi"), (m) => (ghiMa(bc, m), ""))
        .replace(new RegExp(`${MA_NOI_BO.source}(?:\\s*(?:,|và)\\s*${MA_NOI_BO.source})*\\s*[:–-]?\\s*`, "g"), (m) => (ghiMa(bc, m), "")));
      // Nhắc "Vận dụng k" không có trong tiến trình: bỏ phần nhắc, giữ phần còn lại của câu.
      if (!/^\s*Vận dụng \d/.test(chu)) {
        chu = chu.replace(/\s*[–-]?\s*Vận dụng (\d+)\b/g, (m, k: string) => {
          if (vanDung.has(k)) return m;
          ghi(bc, "tham_chieu", `Bỏ tham chiếu “Vận dụng ${k}” vì tiến trình không có mục này.`);
          return "";
        });
      }
      // 3. Mã/nhãn lặp; nhãn đầu đoạn trùng nhãn in đậm.
      const ml = gopMaLap(chu);
      ml.lap.forEach((m) => ghi(bc, "ma_lap", `Gộp mã lặp “${m}: ${m}:”.`));
      chu = ml.chu;
      if (k.nhan && nhanChuan(k.nhan) && chuan(chu).startsWith(`${nhanChuan(k.nhan)} `) && new RegExp(`^\\s*${k.nhan.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/:\s*$/, "")}\\s*:`, "i").test(chu)) {
        chu = chu.replace(/^[^:]*:\s*/, "");
        ghi(bc, "ma_lap", `Bỏ nhãn “${k.nhan}” lặp hai lần.`);
      }
      // 4. Dấu câu.
      const dc = suaDauCau(chu);
      if (dc.loi.length) ghi(bc, "cau_van", `Sửa ${[...new Set(dc.loi)].join(", ")}: “${trich(dc.chu)}”.`);
      chu = dc.chu;
      if (chu === k.chu) return [k];
      return chu || k.nhan ? [doiChu(k, chu)] : [];
    });
  }
}
function ghiMa(bc: BoiCanh, m: string) {
  for (const ma of m.match(MA_NOI_BO) ?? []) {
    ghi(bc, "tham_chieu", bc.ngu.maDoan.has(ma) ? `Bỏ mã nội bộ “${ma}” (mã đoạn của app, không phải nội dung).` : `Bỏ mã tham chiếu không tồn tại “${ma}”.`);
  }
}
function lamSachBang(bc: BoiCanh, b: Bang): Bang {
  if (b.nguon !== "bo_sung") return b;
  const hang = b.hang.map((h, i) => (i === 0 ? h : h.map((o, j) => {
    let r = gopMaLap(o).chu;
    // Ô sau nhắc lại mã của ô trước: "5.2.5.2" | "5.2.5.2: …".
    if (j > 0 && h[j - 1] && new RegExp(`^\\s*${h[j - 1].replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*:\\s*`).test(r) && h[j - 1].length <= 30) {
      r = r.replace(new RegExp(`^\\s*${h[j - 1].replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*:\\s*`), "");
      ghi(bc, "ma_lap", `Bỏ mã “${h[j - 1]}” lặp ở cột bên cạnh.`);
    }
    return suaDauCau(r).chu;
  })));
  return { ...b, hang };
}

/** Các đoạn tiến trình theo hoạt động: [phần, chỉ số khối]. */
function nhomHoatDong(ban: BanSoan): Map<string, { p: Phan; i: number }[]> {
  const nhom = new Map<string, { p: Phan; i: number }[]>();
  for (const p of ban.phan) {
    if (VUNG_CUA_TRUONG[p.truong] !== "tien_trinh") continue;
    p.khoi.forEach((k, i) => {
      if (laBang(k) || !k.hd) return;
      if (!nhom.has(k.hd)) nhom.set(k.hd, []);
      nhom.get(k.hd)!.push({ p, i });
    });
  }
  return nhom;
}

/**
 * Cấu trúc (lỗi 8): nhãn "Tổ chức:" rỗng ngay trên "Cách tổ chức: …"; đoạn chi tiết nhắc lại việc của một bước
 * (tình huống, câu hỏi, nhận định) được đặt ngay dưới bước đó; đoạn GV mang nhãn "Mục tiêu:"/"Sản phẩm:" của khung cũ
 * được đặt dưới mục tương ứng của khung mới (giữ nguyên chữ).
 */
function suaCauTruc(bc: BoiCanh) {
  for (const p of bc.ban.phan) {
    if (VUNG_CUA_TRUONG[p.truong] !== "tien_trinh") continue;
    // a. Gộp nhãn cùng nghĩa liền nhau.
    for (let i = 0; i + 1 < p.khoi.length; i++) {
      const a = p.khoi[i], b = p.khoi[i + 1];
      if (laBang(a) || laBang(b) || a.nguon !== "bo_sung" || b.nguon !== "bo_sung") continue;
      if (NHAN_TO_CHUC.has(nhanChuan(a.nhan)) && !noiDung(a) && NHAN_TO_CHUC.has(nhanChuan(b.nhan)) && noiDung(b)) {
        p.khoi.splice(i, 2, { ...a, chu: noiDung(b), vai: "to_chuc" });
        ghi(bc, "lap_cau_truc", `Gộp “${a.nhan}” và “${b.nhan}” thành một mục.`);
      }
    }
    // Các thao tác còn lại làm theo từng hoạt động trong phần này.
    const hds = [...new Set(p.khoi.filter((k): k is Doan => !laBang(k) && !!k.hd).map((k) => k.hd!))];
    for (const hd of hds) {
      datChiTietDuoiBuoc(bc, p, hd);
      if (bc.ban.cheDo === "moi") datNhanKhungCu(bc, p, hd);
    }
  }
}

const KHOP_BUOC: Record<string, RegExp> = {
  tinh_huong: /tình huống/i,
  cau_hoi_mo_dau: /câu hỏi|(^|\s)hỏi/i,
  nhan_dinh_dau: /nhận định|chỉnh lỗi/i,
  nhan_dinh: /nhận định|chỉnh lỗi/i,
};

/** Bước tổ chức: dòng tên bước (vai "buoc", "Bước k – …") và các dòng việc GV/HS ngay sau (vai "buoc_viec"). */
function cacBuoc(p: Phan, hd: string): { dau: Doan; cuoi: Doan; chu: string }[] {
  const kq: { dau: Doan; cuoi: Doan; chu: string }[] = [];
  p.khoi.forEach((k, i) => {
    if (laBang(k) || k.hd !== hd || k.vai !== "buoc" || !/^Bước \d/.test(chuDoan(k))) return;
    let j = i, chu = chuDoan(k);
    while (j + 1 < p.khoi.length) {
      const sau = p.khoi[j + 1];
      if (laBang(sau) || sau.vai !== "buoc_viec") break;
      chu += ` ${chuDoan(sau)}`;
      j++;
    }
    kq.push({ dau: k, cuoi: p.khoi[j] as Doan, chu });
  });
  return kq;
}

function datChiTietDuoiBuoc(bc: BoiCanh, p: Phan, hd: string) {
  const laCua = (k: Khoi): k is Doan => !laBang(k) && k.hd === hd;
  const buoc = cacBuoc(p, hd);
  if (!buoc.length) return;
  const chiTiet = p.khoi.filter((k): k is Doan => laCua(k) && !!k.vai && k.vai in KHOP_BUOC && k.nguon === "bo_sung");
  if (!chiTiet.length) return;
  const gan = new Map<Doan, Doan[]>();
  const giuNguyen: Doan[] = [];
  for (const d of chiTiet) {
    const b = buoc.find((x) => KHOP_BUOC[d.vai!].test(x.chu));
    if (!b) { giuNguyen.push(d); continue; }
    let moi: Doan | null = d;
    if (d.vai === "nhan_dinh_dau") moi = null; // bước đã nêu việc này
    if (d.vai === "tinh_huong") moi = { ...d, nhan: "Tình huống:", chu: (d.chu ?? "").replace(/^GV\s+(đưa ra|nêu|chiếu|giới thiệu|kể)\s+(một\s+)?tình huống(\s+mở đầu)?\s*:\s*/i, "") };
    if (d.vai === "cau_hoi_mo_dau") moi = { ...d, nhan: "Câu hỏi:", chu: (d.chu ?? "").replace(/^(GV\s+)?hỏi\s*:\s*/i, "") };
    const ten = trich(chuDoan(b.dau), 30);
    ghi(bc, "lap_cau_truc", moi ? `Đặt “${trich(chuDoan(moi), 50)}” ngay dưới ${ten} (không nhắc lại việc của bước).` : `Bỏ câu “${trich(chuDoan(d), 50)}” vì ${ten} đã nêu việc này.`);
    if (!gan.has(b.cuoi)) gan.set(b.cuoi, []);
    if (moi) gan.get(b.cuoi)!.push(moi);
  }
  const chuyen = new Set(chiTiet.filter((d) => !giuNguyen.includes(d)));
  const moiKhoi: Khoi[] = [];
  for (const k of p.khoi) {
    if (!laBang(k) && chuyen.has(k)) continue;
    moiKhoi.push(k);
    if (!laBang(k) && gan.has(k)) moiKhoi.push(...gan.get(k)!);
  }
  p.khoi = moiKhoi;
}

function datNhanKhungCu(bc: BoiCanh, p: Phan, hd: string) {
  for (const [mau, vai] of NHAN_KHUNG_CU) {
    const dich = p.khoi.findIndex((k) => !laBang(k) && k.hd === hd && k.vai === vai && k.nguon === "bo_sung");
    if (dich < 0) continue;
    const gv = p.khoi.filter((k, i): k is Doan => i > dich && !laBang(k) && k.hd === hd && k.nguon === "giu_nguyen" && mau.test(noiDung(k)));
    // Chỉ đặt lại khi đoạn GV đang nằm dưới một mục khác (vd "Mục tiêu:" của GV nằm trong "Tổ chức:").
    const sai = gv.filter((d) => {
      const i = p.khoi.indexOf(d);
      const truoc = p.khoi.slice(dich + 1, i).filter((k): k is Doan => !laBang(k) && k.hd === hd && k.cap === 1 && !!k.nhan);
      return truoc.length > 0;
    });
    if (!sai.length) continue;
    p.khoi = p.khoi.filter((k) => !sai.includes(k as Doan));
    const viTri = p.khoi.indexOf(p.khoi.find((k) => !laBang(k) && k.hd === hd && k.vai === vai && k.nguon === "bo_sung")!);
    p.khoi.splice(viTri + 1, 0, ...sai.map((d) => ({ ...d, cap: 2 as const })));
    sai.forEach((d) => ghi(bc, "lap_cau_truc", `Đặt đoạn “${trich(noiDung(d), 40)}” của thầy cô vào mục ${vai === "muc_tieu" ? "Mục tiêu" : "Sản phẩm"} của hoạt động (giữ nguyên chữ).`));
  }
}

/** Câu đủ dài để so lặp (bỏ câu ngắn, câu hỏi, phương án). */
const duDaiDeSo = (s: string) => chuan(s).length >= 20 && !laCauHoiHayPhuongAn(s);
/** Đoạn là câu hỏi/phương án/lời giải theo câu hoặc mục đánh số (quy trình): giữ trọn, không cắt câu bên trong. */
const NHAN_THEO_CAU = /^(Câu \d+|Đáp án|Phương án sai|Câu tương tự cho lượt 2|Hướng dẫn chấm\/ý chính|Lời giải\/sản phẩm):?$/;
const laDoanCauHoi = (d: Doan) => laCauHoiHayPhuongAn(noiDung(d)) || /^\s*\d+\.\s/.test(noiDung(d)) || NHAN_THEO_CAU.test(d.nhan ?? "");
const trungHoacNamTrong = (a: string, b: string) => a === b || b.includes(a);

/**
 * Lặp trong một hoạt động (lỗi 7), xét theo câu: câu bổ sung trùng hoặc nằm trọn trong một câu khác của cùng
 * hoạt động thì bỏ; câu bổ sung đầy đủ hơn một câu bổ sung đã có thì thay câu cũ bằng bản đầy đủ (ở vị trí đầu tiên)
 * rồi bỏ câu sau. Câu của GV không bị sửa. Mục bắt buộc (mục tiêu, tổ chức, sản phẩm) không bị bỏ trống.
 */
function boLapTrongHoatDong(bc: BoiCanh) {
  // Đoạn gốc trùng nguyên văn với một đoạn khung/bổ sung của cùng hoạt động (KHBD gốc đã theo khung mới):
  // chỉ giữ một bản — chữ vẫn còn đủ trong đoạn khung.
  for (const [hd, ds] of nhomHoatDong(bc.ban)) {
    const dd = ds.map(({ p, i }) => p.khoi[i] as Doan);
    const trungKhung = new Set(dd.filter((d) => d.nguon === "giu_nguyen" && !d.kieu && chuan(chuDoan(d)).length >= 20
      && dd.some((x) => x.nguon === "bo_sung" && !x.kieu && chuan(chuDoan(x)).includes(chuan(chuDoan(d))))));
    // Bảng gốc giống hệt bảng app dựng (vd bảng thời lượng) cũng chỉ giữ một bảng.
    const bangApp = new Set(bc.ban.phan.filter((p) => VUNG_CUA_TRUONG[p.truong] === "tien_trinh").flatMap((p) => p.khoi).filter(laBang).map((b) => chuan(b.hang.flat().join(" "))));
    for (const d of dd) if (d.nguon === "giu_nguyen" && d.html && /^\s*<table/i.test(d.html) && bangApp.has(chuan(d.html.replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&nbsp;/g, " ")))) trungKhung.add(d);
    if (!trungKhung.size) continue;
    trungKhung.forEach((d) => ghi(bc, "lap_nhiem_vu", `Bỏ đoạn gốc trùng nguyên văn với mục của khung trong ${tenHd(hd)}: “${trich(chuDoan(d))}”.`));
    for (const p of bc.ban.phan) p.khoi = p.khoi.filter((k) => laBang(k) || !trungKhung.has(k));
  }
  for (const [hd, ds] of nhomHoatDong(bc.ban)) {
    const doan = ds.map(({ p, i }) => p.khoi[i] as Doan);
    const cau = doan.map((d) => (d.kieu ? [] : tachCau(noiDung(d))));
    const gvCau = doan.flatMap((d, i) => (d.nguon === "giu_nguyen" ? cau[i].map(chuan) : []));
    const daCo: { chuan: string; idx: number; k: number }[] = [];
    const doi = new Set<number>();
    const bo = new Map<number, Set<number>>();
    const boCau = (idx: number, k: number) => { if (!bo.has(idx)) bo.set(idx, new Set()); bo.get(idx)!.add(k); doi.add(idx); };
    doan.forEach((d, idx) => {
      if (d.kieu) return;
      if (d.nguon === "giu_nguyen" || laDoanCauHoi(d)) { cau[idx].forEach((s, k) => daCo.push({ chuan: chuan(s), idx, k })); return; }
      cau[idx].forEach((s, k) => {
        const cs = chuan(s);
        if (!duDaiDeSo(s)) return;
        if (gvCau.some((g) => trungHoacNamTrong(cs, g)) || daCo.some((e) => trungHoacNamTrong(cs, e.chuan))) {
          boCau(idx, k);
          ghi(bc, "lap_nhiem_vu", `Bỏ nội dung lặp trong ${tenHd(hd)}: “${trich(s)}”.`);
          return;
        }
        const ngan = daCo.find((e) => e.chuan.length >= 20 && cs.includes(e.chuan) && doan[e.idx].nguon === "bo_sung" && !laDoanCauHoi(doan[e.idx]));
        if (ngan) {
          cau[ngan.idx][ngan.k] = s;
          ngan.chuan = cs;
          doi.add(ngan.idx);
          boCau(idx, k);
          ghi(bc, "lap_nhiem_vu", `Gộp nhiệm vụ nêu hai lần trong ${tenHd(hd)}, giữ bản đầy đủ: “${trich(s)}”.`);
          return;
        }
        daCo.push({ chuan: cs, idx, k });
      });
    });
    const xoa = new Set<Doan>();
    for (const idx of doi) {
      const d = doan[idx];
      const giu = cau[idx].filter((_s, k) => !bo.get(idx)?.has(k));
      if (!giu.length && (d.vai && VAI_BAT_BUOC.has(d.vai))) continue; // không để trống mục bắt buộc
      if (!giu.length && !d.nhan) { xoa.add(d); continue; }
      const { p, i } = ds[idx];
      p.khoi[i] = doiChu(d, giu.join(" "));
    }
    if (xoa.size) for (const p of bc.ban.phan) p.khoi = p.khoi.filter((k) => laBang(k) || !xoa.has(k));
  }
}
const tenHd = (hd: string) => (/^HD(\d)$/.test(hd) ? `HĐ ${["I", "II", "III", "IV"][Number(hd[2]) - 1]}` : hd === "GD1" ? "Giai đoạn 1" : hd === "GD3" ? "Giai đoạn 3" : "hoạt động");

/** Câu bổ sung theo vùng (mục tiêu, tiến trình, phụ lục) để so lặp giữa các phần (lỗi 1). */
function cauTheoVung(ban: BanSoan) {
  const kq: { vung: VungBan; cau: string; chuan: string; doan?: Doan; nguon: "giu_nguyen" | "bo_sung" }[] = [];
  for (const { doan, vung } of cacDoan(ban)) {
    if (!["muc_tieu", "tien_trinh", "phu_luc"].includes(vung) || doan.kieu) continue;
    for (const s of tachCau(noiDung(doan))) if (chuan(s).split(" ").length >= 8 && !laCauHoiHayPhuongAn(s)) kq.push({ vung, cau: s, chuan: chuan(s), doan, nguon: doan.nguon });
  }
  for (const p of ban.phan) {
    if (VUNG_CUA_TRUONG[p.truong] !== "phu_luc") continue;
    for (const k of p.khoi) if (laBang(k)) for (const h of k.hang.slice(1)) for (const o of h) if (chuan(o).split(" ").length >= 8) kq.push({ vung: "phu_luc", cau: o, chuan: chuan(o), nguon: k.nguon });
  }
  return kq;
}

/** Vùng trước đó (khác vùng) đã có câu trùng hoặc chứa trọn câu thứ j. */
function vungTruoc(cau: ReturnType<typeof cauTheoVung>, j: number): VungBan | undefined {
  const c = cau[j];
  // Chỉ tính lặp do sinh thêm: câu trước cũng là phần bổ sung; không đụng mục đánh số (quy trình, câu hỏi).
  if (c.doan && /^\s*\d+\.\s/.test(noiDung(c.doan))) return undefined;
  return cau.slice(0, j).find((e) => e.vung !== c.vung && e.nguon === "bo_sung" && trungHoacNamTrong(c.chuan, e.chuan))?.vung;
}

/**
 * Lặp giữa mục tiêu – tiến trình – phụ lục: câu bổ sung đã có ở phần trước (theo thứ tự KHBD) thì bỏ ở phần sau,
 * trừ khi đó là mục bắt buộc của hoạt động (khi đó chỉ cảnh báo).
 */
function boLapGiuaPhan(bc: BoiCanh) {
  const cau = cauTheoVung(bc.ban);
  const xoaCau = new Map<Doan, Set<string>>();
  for (const [j, c] of cau.entries()) {
    const v = vungTruoc(cau, j);
    if (!v || c.nguon !== "bo_sung" || !c.doan) continue;
    if (c.doan.vai && VAI_BAT_BUOC.has(c.doan.vai)) continue;
    if (!xoaCau.has(c.doan)) xoaCau.set(c.doan, new Set());
    xoaCau.get(c.doan)!.add(c.chuan);
    ghi(bc, "lap_noi_dung", `Bỏ câu đã có ở ${TEN_VUNG[v]}: “${trich(c.cau)}”.`);
  }
  if (!xoaCau.size) return;
  for (const p of bc.ban.phan) {
    p.khoi = p.khoi.flatMap((k): Khoi[] => {
      if (laBang(k) || !xoaCau.has(k)) return [k];
      const giu = tachCau(noiDung(k)).filter((s) => !xoaCau.get(k)!.has(chuan(s)));
      return giu.length || k.nhan ? [doiChu(k, giu.join(" "))] : [];
    });
  }
}
const TEN_VUNG: Record<VungBan, string> = { muc_tieu: "mục tiêu", tien_trinh: "tiến trình", phu_luc: "phụ lục", thiet_bi: "thiết bị", ma_tran: "ma trận", tieng_anh: "phụ lục tiếng Anh", khac: "phần đầu" };

/** Phụ lục có được tiến trình dùng không (lỗi 9). */
const DUNG_PHU_LUC: Partial<Record<NonNullable<Bang["vai"]>, RegExp>> = {
  danh_gia: /phụ lục đánh giá|bảng tiêu chí ở phụ lục/i,
  phieu_ai: /phiếu kiểm chứng/i,
};
function chuTienTrinh(ban: BanSoan): string {
  return cacDoan(ban).filter((x) => x.vung === "tien_trinh").map((x) => chuDoan(x.doan)).join("\n");
}
function boPhuLucKhongDung(bc: BoiCanh) {
  const tt = chuTienTrinh(bc.ban);
  for (const p of bc.ban.phan) {
    if (p.truong !== "phuLuc") continue;
    const bo = new Set<Khoi>();
    p.khoi.forEach((k, i) => {
      if (!laBang(k) || !k.vai || !DUNG_PHU_LUC[k.vai] || DUNG_PHU_LUC[k.vai]!.test(tt)) return;
      bo.add(k);
      const truoc = p.khoi[i - 1];
      if (truoc && !laBang(truoc) && truoc.vai === "tieu_de") bo.add(truoc);
      ghi(bc, "phu_luc", `Bỏ ${k.vai === "danh_gia" ? "bảng đánh giá sản phẩm" : "phiếu kiểm chứng phản hồi AI"} ở phụ lục vì tiến trình không dùng đến.`);
    });
    p.khoi = p.khoi.filter((k) => !bo.has(k));
  }
}

/** Nhãn tiêu đề không còn nội dung con (vd "Năng lực AI:" khi mọi dòng đã bị bỏ) thì bỏ. */
function boTieuDeRong(bc: BoiCanh) {
  for (const p of bc.ban.phan) {
    p.khoi = p.khoi.filter((k, i) => {
      if (laBang(k) || k.nguon !== "bo_sung" || noiDung(k) || !k.nhan || (k.vai && VAI_BAT_BUOC.has(k.vai))) return true;
      const sau = p.khoi[i + 1];
      const coCon = sau && (laBang(sau) || ((sau.cap ?? 0) > (k.cap ?? 0) && !sau.kieu));
      if (!coCon) ghi(bc, "lap_cau_truc", `Bỏ tiêu đề “${k.nhan}” không còn nội dung.`);
      return !!coCon;
    });
  }
}

// ───────────────────────── Trình bày Word ─────────────────────────

const THE_NOI_DONG = ["strong", "b", "em", "i", "u", "sub", "sup", "span"];
const canBangThe = (html: string) => THE_NOI_DONG.every((t) => (html.match(new RegExp(`<${t}(\\s[^>]*)?>`, "gi")) ?? []).length === (html.match(new RegExp(`</${t}>`, "gi")) ?? []).length);
const NHAN_DAP_AN = /^(Đáp án|Lời giải|Hướng dẫn chấm(?:\/ý chính)?|Gợi ý trả lời)\s*:\s*/;

/**
 * Vị trí cần xuống đoạn trong một đoạn (chữ thường hoặc HTML nội dòng): phương án A–D viết liền nhau; đáp án/lời giải
 * viết chung đoạn với câu hỏi; nhiều bước "Bước k –" trong một đoạn. Không cắt trong thẻ HTML, trong công thức $...$.
 */
export function viTriXuongDoan(s: string): { cat: number[]; ly: string[] } {
  const che = new Array<boolean>(s.length).fill(false);
  let trongThe = false, trongCt = false;
  for (let i = 0; i < s.length; i++) {
    if (s[i] === "<") trongThe = true;
    if (!trongThe && s[i] === "$") trongCt = !trongCt;
    che[i] = trongThe || trongCt;
    if (s[i] === ">") trongThe = false;
  }
  const tim = (re: RegExp) => [...s.matchAll(re)].filter((m) => !che[m.index!]);
  const cat = new Set<number>();
  const ly: string[] = [];
  const chuTruoc = (i: number) => s.slice(0, i).replace(/<[^>]+>/g, "");
  // Phương án A–D liền dòng (cần đủ A, B, C, D theo thứ tự; A có thể đứng đầu đoạn).
  const pa = tim(/\s+(?=(?:<[^>]+>)*([A-D])[.)]\s)/g).map((m) => ({ i: m.index!, chu: m[1] }));
  const dauLaA = /^(?:\s|<[^>]+>)*A[.)]\s/.test(s);
  const chon: number[] = [];
  let can = dauLaA ? "B" : "A";
  for (const x of pa) if (x.chu === can) { chon.push(x.i); can = String.fromCharCode(can.charCodeAt(0) + 1); if (can > "D") break; }
  if (can > "D") { chon.forEach((i) => cat.add(i)); ly.push("phương án A/B/C/D chung một dòng"); }
  // Đáp án/lời giải chung đoạn với câu hỏi.
  const da = tim(/\s+(?=(?:<[^>]+>)*(Đáp án|Lời giải|Hướng dẫn chấm(?:\/ý chính)?|Gợi ý trả lời)\s*:)/g).find((m) => /\?|Câu \d+/.test(chuTruoc(m.index!)));
  if (da) { cat.add(da.index!); ly.push("đáp án chung đoạn với câu hỏi"); }
  // Nhiều bước trong một đoạn.
  const buoc = tim(/\s+(?=(?:<[^>]+>)*Bước \d+\s*[–:-])/g).filter((m) => chuTruoc(m.index!).trim().length > 0);
  if (buoc.length) { buoc.forEach((m) => cat.add(m.index!)); ly.push("nhiều bước gộp trong một đoạn"); }
  // Một bước viết liền "Bước k – …: GV: …; HS: …": việc của GV, HS xuống dòng riêng.
  if (/^(?:\s|<[^>]+>)*Bước \d+/.test(s)) {
    const vai = tim(/(?<=[:;.])\s+(?=(?:<[^>]+>)*(GV|HS)\s*:)/g);
    if (vai.length) { vai.forEach((m) => cat.add(m.index!)); ly.push("việc của GV, HS chung dòng với tên bước"); }
  }
  return { cat: [...cat].sort((a, b) => a - b), ly };
}

const catTai = (s: string, cat: number[]) => [0, ...cat].map((dau, k) => s.slice(dau, cat[k] ?? s.length).trim()).filter(Boolean);

/** Tách một đoạn thành nhiều đoạn theo viTriXuongDoan. Chữ của GV chỉ được xuống đoạn, không đổi kí tự nào. */
export function tachDoanTrinhBay(d: Doan): Doan[] | null {
  if (d.kieu) return null;
  if (d.html !== undefined) {
    if (/^\s*<table/i.test(d.html)) return null;
    const trong = d.html.replace(/^\s*<(p|li|h\d)[^>]*>/i, "").replace(/<\/(p|li|h\d)>\s*$/i, "");
    const { cat } = viTriXuongDoan(trong);
    if (!cat.length) return null;
    const manh = catTai(trong, cat);
    if (!manh.every(canBangThe)) return null;
    return manh.map((m, k) => ({ ...d, html: `<p>${m}</p>`, ...(k ? { nhan: undefined } : {}) }));
  }
  const { cat } = viTriXuongDoan(d.chu ?? "");
  if (!cat.length) return null;
  // Phần bổ sung: mỗi đoạn mới thành câu hoàn chỉnh (bỏ ";" cuối, viết hoa đầu).
  return catTai(d.chu ?? "", cat).map((m) => hoaDau(m.replace(/\s*[;,]\s*$/, "."))).map((m, k) => {
    const nhan = NHAN_DAP_AN.exec(m);
    if (k === 0) return { ...d, chu: m };
    const viec = /^(GV|HS)\s*:\s*/.exec(m);
    if (viec) return { ...d, nhan: `${viec[1]}:`, chu: hoaDau(m.slice(viec[0].length)), cap: 2 as const, vai: "buoc_viec" as const };
    return { ...d, nhan: nhan ? nhan[0].trim() : undefined, chu: nhan ? hoaDau(m.slice(nhan[0].length)) : m, vai: d.vai === "buoc" && /^Bước \d/.test(m) ? "buoc" : undefined };
  });
}

/** Trình bày Word: mỗi phương án, đáp án, bước một đoạn riêng (cả nội dung gốc của GV, chỉ xuống dòng). */
function tachTrinhBay(bc: BoiCanh) {
  for (const p of bc.ban.phan) {
    p.khoi = p.khoi.flatMap((k): Khoi[] => {
      if (laBang(k)) return [k];
      const t = tachDoanTrinhBay(k);
      if (!t) return [k];
      ghi(bc, "trinh_bay", `Tách ${viTriXuongDoan(k.html !== undefined ? k.html : k.chu ?? "").ly.join(", ")} thành ${t.length} đoạn: “${trich(chuDoan(k), 50)}”.`);
      return t;
    });
  }
}

/** Ghi lại các dòng năng lực của KHBD gốc đã được thay bằng mục tiêu theo cấu trúc mới (không cộng dồn). */
function ghiKhongCongDon(bc: BoiCanh) {
  const n = bc.ban.doanKhongDung?.length ?? 0;
  if (n) ghi(bc, "cong_don", bc.ban.cheDo === "moi"
    ? `Mục tiêu năng lực lấy theo cấu trúc mới; ${n} dòng năng lực của KHBD gốc không ghép thêm.`
    : `Nhóm năng lực app soạn mới thay ${n} dòng cùng nhóm của KHBD gốc (không ghép thêm).`);
}

/** Biên tập bản soạn. Không đổi bản vào; trả bản mới và danh sách chỗ đã sửa. */
export function bienTap(ban: BanSoan, ngu: NguCanhBienTap): { ban: BanSoan; suaDoi: SuaDoi[] } {
  const bc: BoiCanh = { ngu, sua: [], ban: { ...ban, phan: ban.phan.map((p) => ({ ...p, khoi: [...p.khoi] })) } };
  ghiKhongCongDon(bc);
  boChucNangKhongChon(bc);
  lamSachChu(bc);
  suaCauTruc(bc);
  boLapTrongHoatDong(bc);
  boLapGiuaPhan(bc);
  // Tách trình bày sau khi bỏ lặp: bỏ lặp làm trên đoạn nguyên vẹn của GV.
  tachTrinhBay(bc);
  boPhuLucKhongDung(bc);
  boTieuDeRong(bc);
  return { ban: bc.ban, suaDoi: bc.sua };
}

// ───────────────────────── Kiểm tra (không sửa) ─────────────────────────

const loi = (loai: LoaiBienTap, noiDung: string, nghiem = true): LoiKiemTra => ({ loai, noiDung, nghiem });

/** Phát hiện các lỗi biên tập còn lại trong bản soạn. Chỉ xét phần bổ sung (chữ của GV giữ nguyên). */
export function kiemTraBanSoan(ban: BanSoan, ngu: NguCanhBienTap): LoiKiemTra[] {
  const kq: LoiKiemTra[] = [];
  const doan = cacDoan(ban);
  const tiengAnhNaoDo = ngu.chucNang.clil || ngu.chucNang.tieng_anh;
  const nenTangKhongChon = NEN_TANG.filter((t) => !ngu.nenTangChon.some((c) => c.toLowerCase() === t.toLowerCase()));

  for (const { doan: d, truong } of doan) {
    if (d.nguon !== "bo_sung") continue;
    const s = chuDoan(d);
    if (!s) continue;
    // 2. Mã lặp.
    if (gopMaLap(s).lap.length) kq.push(loi("ma_lap", `Mã lặp: “${trich(s)}”.`));
    // 3. Lời nội bộ.
    if (laNoiBo(s)) kq.push(loi("noi_bo", `Còn lời hướng dẫn nội bộ: “${trich(s)}”.`));
    // 4. Chức năng không chọn.
    if (d.chucNang && ((d.chucNang === "clil" && !ngu.chucNang.clil) || (d.chucNang === "tieng_anh" && !ngu.chucNang.tieng_anh) || (!["clil", "tieng_anh"].includes(d.chucNang) && !ngu.chucNang[d.chucNang]))) {
      kq.push(loi("khong_chon", `Có nội dung của chức năng không chọn: “${trich(s)}”.`));
    } else if (truong !== "tiengAnh" && ((!ngu.chucNang.ai && MAU_CHUC_NANG.ai!.test(s)) || (!tiengAnhNaoDo && MAU_CHUC_NANG.clil!.test(s)) || (!ngu.chucNang.nls && MAU_CHUC_NANG.nls!.test(s))
      || nenTangKhongChon.some((t) => new RegExp(`(^|[^\\p{L}])${t}([^\\p{L}]|$)`, "iu").test(s)))) {
      kq.push(loi("khong_chon", `Có nhắc chức năng/nền tảng không chọn: “${trich(s)}”.`));
    }
    // 5. Tham chiếu.
    for (const ma of s.match(MA_NOI_BO) ?? []) kq.push(loi("tham_chieu", ngu.maDoan.has(ma) ? `Còn mã nội bộ “${ma}”.` : `Mã “${ma}” không tồn tại trong KHBD.`));
    for (const m of s.matchAll(/Vận dụng (\d+)/g)) {
      if (new RegExp(`^\\s*Vận dụng ${m[1]}\\b`).test(noiDung(d))) continue;
      if (!doan.some((x) => x.doan !== d && new RegExp(`^\\s*Vận dụng ${m[1]}\\b`).test(noiDung(x.doan)))) kq.push(loi("tham_chieu", `Nhắc “Vận dụng ${m[1]}” nhưng tiến trình không có.`));
    }
    if (ban.cheDo === "cu" && /(^|[^\p{L}])HĐ (I|II|III|IV)([^\p{L}]|$)/u.test(s) && !/HĐ (I|II|III|IV)\b/.test(doan.filter((x) => x.doan.nguon === "giu_nguyen").map((x) => chuDoan(x.doan)).join(" "))) {
      kq.push(loi("tham_chieu", `Nhắc “HĐ I–IV” nhưng giáo án giữ bố cục gốc không có các hoạt động này: “${trich(s)}”.`));
    }
    if (/phụ lục đánh giá/i.test(s) && !ban.phan.some((p) => p.truong === "phuLuc" && p.khoi.some((k) => laBang(k) && k.vai === "danh_gia"))) kq.push(loi("tham_chieu", "Nhắc phụ lục đánh giá nhưng KHBD không có phụ lục này."));
    // 6. Câu văn.
    if (suaDauCau(chuDoan({ ...d, nhan: undefined })).loi.length) kq.push(loi("cau_van", `Dấu câu chưa đúng: “${trich(s)}”.`, false));
    if (/(dùng|sử dụng)\s[^.;]{1,60}\sđể\s(dùng|sử dụng)\s/i.test(s)) kq.push(loi("cau_van", `Câu ghép máy móc “dùng … để dùng …”: “${trich(s)}”.`, false));
    if (/(GV|HS):\s*(;|\.|$)/.test(s)) kq.push(loi("cau_van", `Bước thiếu việc của GV hoặc HS: “${trich(s)}”.`));
    if (!d.nhan && !d.kieu && /^\p{Ll}/u.test(noiDung(d)) && !/^[a-dđ]\)\s/.test(noiDung(d))) kq.push(loi("cau_van", `Câu thiếu chủ ngữ hoặc chưa viết hoa đầu câu: “${trich(s)}”.`, false));
  }
  // Trình bày Word (cả chữ GV): phương án, đáp án, bước phải xuống đoạn riêng; đoạn bổ sung không quá dài.
  for (const { doan: d } of doan) {
    if (d.kieu || (d.html && /^\s*<table/i.test(d.html))) continue;
    const { ly } = viTriXuongDoan(d.html !== undefined ? d.html : d.chu ?? "");
    if (ly.length) kq.push(loi("trinh_bay", `Cần xuống đoạn (${ly.join(", ")}): “${trich(chuDoan(d))}”.`));
    if (d.nguon === "bo_sung" && chuDoan(d).length > 700) kq.push(loi("trinh_bay", `Đoạn quá dài, nên tách ý: “${trich(chuDoan(d))}”.`, false));
  }
  // Không cộng dồn: cấu trúc mới thì mục I.2 không còn dòng năng lực của KHBD gốc (trừ đặc thù khi app không soạn được).
  if (ban.cheDo === "moi") {
    const i2 = ban.phan.filter((p) => p.truong === "nangLuc").flatMap((p) => p.khoi).filter((k): k is Doan => !laBang(k));
    const coDacThuMoi = i2.some((d) => d.nguon === "bo_sung" && /^Năng lực đặc thù/.test(d.nhan ?? "")) && i2.some((d, i) => d.nguon === "bo_sung" && i > 0 && !d.nhan && /\S/.test(d.chu ?? "") && i2.slice(0, i).reverse().find((x) => x.nhan)?.nhan?.startsWith("Năng lực đặc thù"));
    for (const d of i2) if (d.nguon === "giu_nguyen" && coDacThuMoi) kq.push(loi("cong_don", `Dòng năng lực của KHBD gốc bị ghép thêm vào mục tiêu mới: “${trich(chuDoan(d))}”.`));
  }

  // Bảng: mã lặp ở cột bên cạnh, hàng của chức năng không chọn.
  for (const p of ban.phan) for (const k of p.khoi) {
    if (!laBang(k) || k.nguon !== "bo_sung") continue;
    for (const h of k.hang.slice(1)) {
      h.forEach((o, j) => { if (j > 0 && h[j - 1] && h[j - 1].length <= 30 && o.trim().startsWith(`${h[j - 1].trim()}:`)) kq.push(loi("ma_lap", `Bảng ghi mã “${h[j - 1]}” hai lần.`)); });
      if ((!ngu.chucNang.ai && /Năng lực AI|AI minh bạch/.test(h[0])) || (!ngu.chucNang.nls && h[0] === "Năng lực số")) kq.push(loi("khong_chon", `Bảng có hàng “${h[0]}” dù không chọn chức năng này.`));
    }
  }

  // 7. Lặp trong cùng hoạt động (câu trùng hoặc nằm trọn trong câu khác; ít nhất một câu là phần bổ sung).
  for (const [hd, ds] of nhomHoatDong(ban)) {
    const dd = ds.map(({ p, i }) => p.khoi[i] as Doan).filter((d) => !d.kieu);
    const cau = dd.flatMap((d) => (laDoanCauHoi(d) ? [] : tachCau(noiDung(d)).filter(duDaiDeSo).map((s) => ({ c: chuan(s), s, bs: d.nguon === "bo_sung" }))));
    cau.forEach((x, i) => {
      const khac = cau.find((y, j) => j !== i && (x.bs || y.bs) && (j < i ? trungHoacNamTrong(x.c, y.c) : x.c !== y.c && y.c.includes(x.c)));
      if (khac) kq.push(loi("lap_nhiem_vu", `${tenHd(hd)} có nội dung lặp: “${trich(x.s)}”.`, false));
    });
    // 8. Lặp cấu trúc: nhãn "tổ chức" lồng nhau, câu nhắc lại việc của bước, mục GV khung cũ nằm sai mục.
    dd.forEach((d, i) => {
      const sau = dd[i + 1];
      if (sau && d.nguon === "bo_sung" && NHAN_TO_CHUC.has(nhanChuan(d.nhan)) && !noiDung(d) && NHAN_TO_CHUC.has(nhanChuan(sau.nhan))) kq.push(loi("lap_cau_truc", `${tenHd(hd)}: “${d.nhan}” và “${sau.nhan}” là cùng một mục.`, false));
    });
    const coBuoc = dd.some((d) => d.vai === "buoc" && /^Bước \d/.test(chuDoan(d)));
    if (coBuoc && dd.some((d) => d.vai === "nhan_dinh_dau")) kq.push(loi("lap_cau_truc", `${tenHd(hd)}: câu dẫn nhận định nhắc lại việc đã có ở bước tổ chức.`, false));
    if (coBuoc && dd.some((d) => d.vai === "tinh_huong" && /^GV\s+(đưa ra|nêu)/i.test(d.chu ?? ""))) kq.push(loi("lap_cau_truc", `${tenHd(hd)}: tình huống được nêu lại ngoài bước tổ chức.`, false));
    const nhan = dd.filter((d) => d.cap === 1 && d.nguon === "bo_sung" && d.nhan).map((d) => nhanChuan(d.nhan));
    for (const n of new Set(nhan)) if (nhan.filter((x) => x === n).length > 1) kq.push(loi("lap_cau_truc", `${tenHd(hd)}: mục “${n}” xuất hiện nhiều lần.`, false));
  }

  // 1. Lặp giữa mục tiêu – tiến trình – phụ lục (câu bổ sung).
  const cvs = cauTheoVung(ban);
  for (const [j, c] of cvs.entries()) {
    const v = vungTruoc(cvs, j);
    if (v && c.nguon === "bo_sung" && !(c.doan?.vai && VAI_BAT_BUOC.has(c.doan.vai))) kq.push(loi("lap_noi_dung", `Câu lặp giữa ${TEN_VUNG[v]} và ${TEN_VUNG[c.vung]}: “${trich(c.cau)}”.`, false));
  }

  // 9. Phụ lục không dùng.
  const tt = chuTienTrinh(ban);
  for (const p of ban.phan) if (p.truong === "phuLuc") for (const k of p.khoi) {
    if (laBang(k) && k.vai && DUNG_PHU_LUC[k.vai] && !DUNG_PHU_LUC[k.vai]!.test(tt)) kq.push(loi("phu_luc", `Phụ lục có ${k.vai === "danh_gia" ? "bảng đánh giá sản phẩm" : "phiếu kiểm chứng AI"} nhưng tiến trình không dùng.`));
  }
  return kq;
}

/** Tên loại lỗi biên tập để hiện ở bước 5. */
export const TEN_LOAI_BIEN_TAP: Record<LoaiBienTap, string> = {
  lap_noi_dung: "Không lặp giữa mục tiêu, tiến trình, phụ lục",
  ma_lap: "Mã năng lực không bị lặp",
  noi_bo: "Không còn lời hướng dẫn nội bộ",
  khong_chon: "Không có nội dung của chức năng không chọn",
  tham_chieu: "Không có mã hoặc tham chiếu không tồn tại",
  cau_van: "Câu văn đủ thành phần, đúng dấu câu",
  lap_nhiem_vu: "Mỗi nhiệm vụ chỉ nêu một lần trong hoạt động",
  lap_cau_truc: "Bước tổ chức không lặp ở nhiều cấp",
  phu_luc: "Phụ lục đều được dùng trong tiến trình",
  cong_don: "Không cộng dồn năng lực của KHBD gốc với mục tiêu mới",
  trinh_bay: "Phương án, đáp án, các bước xuống đoạn riêng",
};
