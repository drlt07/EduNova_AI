/**
 * Đổi chữ mã TCVN3 (ABC, phông .VnTime) và VNI Windows (phông VNI-Times) sang Unicode.
 * TCVN3 một byte cho mỗi chữ có dấu; phông "...H" (.VnTimeH) hiển thị chữ hoa.
 * VNI ghép chữ cái gốc với kí tự dấu đứng sau.
 */

const TCVN3: Record<string, string> = {
  "µ": "à", "¶": "ả", "·": "ã", "¸": "á", "¹": "ạ",
  "¨": "ă", "»": "ằ", "¼": "ẳ", "½": "ẵ", "¾": "ắ", "Æ": "ặ",
  "©": "â", "Ç": "ầ", "È": "ẩ", "É": "ẫ", "Ê": "ấ", "Ë": "ậ",
  "®": "đ",
  "Ì": "è", "Î": "ẻ", "Ï": "ẽ", "Ð": "é", "Ñ": "ẹ",
  "ª": "ê", "Ò": "ề", "Ó": "ể", "Ô": "ễ", "Õ": "ế", "Ö": "ệ",
  "×": "ì", "Ø": "ỉ", "Ü": "ĩ", "Ý": "í", "Þ": "ị",
  "ß": "ò", "á": "ỏ", "â": "õ", "ã": "ó", "ä": "ọ",
  "«": "ô", "å": "ồ", "æ": "ổ", "ç": "ỗ", "è": "ố", "é": "ộ",
  "¬": "ơ", "ê": "ờ", "ë": "ở", "ì": "ỡ", "í": "ớ", "î": "ợ",
  "ï": "ù", "ñ": "ủ", "ò": "ũ", "ó": "ú", "ô": "ụ",
  "­": "ư", "õ": "ừ", "ö": "ử", "÷": "ữ", "ø": "ứ", "ù": "ự",
  "ú": "ỳ", "û": "ỷ", "ü": "ỹ", "ý": "ý", "þ": "ỵ",
  "¡": "Ă", "¢": "Â", "£": "Ê", "¤": "Ô", "¥": "Ơ", "¦": "Ư", "§": "Đ",
};

export function tcvn3SangUnicode(chu: string, chuHoa = false): string {
  const kq = [...chu].map((c) => TCVN3[c] ?? c).join("");
  return chuHoa ? kq.toLocaleUpperCase("vi") : kq;
}

export function unicodeSangTcvn3(chu: string): string {
  const nguoc = Object.fromEntries(Object.entries(TCVN3).map(([k, v]) => [v, k]));
  return [...chu].map((c) => nguoc[c] ?? c).join("");
}

// Dấu VNI: [thanh/mũ đứng sau chữ gốc] → chữ Unicode. Khóa chữ thường; chữ hoa sinh tự động.
const VNI_GHEP: Record<string, string> = {
  "aù": "á", "aø": "à", "aû": "ả", "aõ": "ã", "aï": "ạ",
  "aâ": "â", "aá": "ấ", "aà": "ầ", "aå": "ẩ", "aã": "ẫ", "aä": "ậ",
  "aê": "ă", "aé": "ắ", "aè": "ằ", "aú": "ẳ", "aü": "ẵ", "aë": "ặ",
  "eù": "é", "eø": "è", "eû": "ẻ", "eõ": "ẽ", "eï": "ẹ",
  "eâ": "ê", "eá": "ế", "eà": "ề", "eå": "ể", "eã": "ễ", "eä": "ệ",
  "où": "ó", "oø": "ò", "oû": "ỏ", "oõ": "õ", "oï": "ọ",
  "oâ": "ô", "oá": "ố", "oà": "ồ", "oå": "ổ", "oã": "ỗ", "oä": "ộ",
  "ôù": "ớ", "ôø": "ờ", "ôû": "ở", "ôõ": "ỡ", "ôï": "ợ",
  "uù": "ú", "uø": "ù", "uû": "ủ", "uõ": "ũ", "uï": "ụ",
  "öù": "ứ", "öø": "ừ", "öû": "ử", "öõ": "ữ", "öï": "ự",
  "yù": "ý", "yø": "ỳ", "yû": "ỷ", "yõ": "ỹ",
};
const VNI_DON: Record<string, string> = {
  "í": "í", "ì": "ì", "æ": "ỉ", "ó": "ĩ", "ò": "ị",
  "ô": "ơ", "ö": "ư", "î": "ỵ", "ñ": "đ",
};

function bangVni(): Map<string, string> {
  const bang = new Map<string, string>();
  for (const [k, v] of Object.entries({ ...VNI_GHEP, ...VNI_DON })) {
    bang.set(k, v);
    bang.set(k.toUpperCase(), v.toUpperCase());
    if (k.length === 2) bang.set(k[0].toUpperCase() + k[1], v.toUpperCase());
  }
  return bang;
}
const VNI = bangVni();
const VNI_REGEX = new RegExp(
  [...VNI.keys()].sort((a, b) => b.length - a.length).map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|"),
  "g",
);

export function vniSangUnicode(chu: string): string {
  return chu.replace(VNI_REGEX, (m) => VNI.get(m) ?? m);
}

export type MaHoa = "unicode" | "tcvn3" | "vni";

/** Nhận biết theo tên phông chữ trong file Word. */
export function maHoaTheoPhong(phong: string | null | undefined): { maHoa: MaHoa; chuHoa: boolean } {
  if (!phong) return { maHoa: "unicode", chuHoa: false };
  if (/^vni[- ]/i.test(phong)) return { maHoa: "vni", chuHoa: false };
  // Phông TCVN3 đều bắt đầu bằng ".Vn" (.VnTime, .VnArial, .VnTimeH…).
  if (/^\.vn/i.test(phong)) return { maHoa: "tcvn3", chuHoa: /h$/i.test(phong.trim()) };
  return { maHoa: "unicode", chuHoa: false };
}

/** Đoán mã của văn bản không có thông tin phông (PDF, văn bản dán). */
export function doanMaHoa(chu: string): MaHoa {
  const tong = chu.length || 1;
  const coUnicode = (chu.match(/[ạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹđơư]/gi) ?? []).length;
  if (coUnicode / tong > 0.01) return "unicode";
  const vni = (chu.match(/[aeouyAEOUY][ùøûõïâáàåãäêéèúüë]|Vieät|ñ/g) ?? []).length;
  const tcvn = (chu.match(/[µ¶·¸¹¨©®ª«¬­ÐÕÖÞä]/g) ?? []).length;
  if (vni / tong > 0.01 && vni >= tcvn) return "vni";
  if (tcvn / tong > 0.01) return "tcvn3";
  return "unicode";
}

export function sangUnicode(chu: string, maHoa: MaHoa, chuHoa = false): string {
  if (maHoa === "tcvn3") return tcvn3SangUnicode(chu, chuHoa);
  if (maHoa === "vni") return vniSangUnicode(chu);
  return chu;
}
