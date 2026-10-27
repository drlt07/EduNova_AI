/**
 * Tình huống an toàn số (Tin 10 – Bài 9, 11 KNTT): logic thuần cho hộp thư lừa đảo, độ mạnh mật khẩu
 * và ảnh sắp đăng lên mạng xã hội làm lộ thông tin cá nhân.
 */

// ---------- Nhiệm vụ 1: hộp thư ----------

export interface Message {
  id: string;
  channel: "SMS" | "Zalo" | "Email";
  from: string;
  text: string;
  link?: { shown: string; real: string };
  scam: boolean;
  signs: string;
}

export const INBOX: Message[] = [
  { id: "bank", channel: "SMS", from: "VCB-Thongbao", text: "Tài khoản của quý khách bị tạm khóa do đăng nhập bất thường. Xác minh trong 30 phút để tránh bị khóa vĩnh viễn:", link: { shown: "vietcombank.com.vn/xac-minh", real: "vcb-xacminh-taikhoan.top" }, scam: true, signs: "Giục gấp (30 phút), đe dọa khóa tài khoản, đường link thật là tên miền lạ .top. Ngân hàng không bao giờ gửi link bắt đăng nhập qua tin nhắn." },
  { id: "mom", channel: "Zalo", from: "Mẹ", text: "Tối nay con về sớm ăn cơm nhé, mẹ nấu canh chua.", scam: false, signs: "Tin nhắn bình thường, không xin tiền, không có link, đúng giọng người thân." },
  { id: "friend", channel: "Zalo", from: "Minh (bạn cùng lớp)", text: "Ê cho mình mượn 2 triệu gấp, chuyển vào STK 0123456789 tên NGUYEN VAN K nhé. Đang bận không nghe máy được, đừng gọi.", scam: true, signs: "Tài khoản bạn có thể đã bị chiếm: hỏi tiền gấp, tên người nhận khác tên bạn, né gọi điện. Hãy gọi trực tiếp cho Minh để xác minh." },
  { id: "school", channel: "Email", from: "Phòng Đào tạo THPT Lê Lợi", text: "Lịch kiểm tra cuối học kì I đã được cập nhật, các em xem tại:", link: { shown: "thptleloi.edu.vn/lich-thi", real: "thptleloi.edu.vn/lich-thi" }, scam: false, signs: "Đúng tên miền của trường (.edu.vn), không đòi mật khẩu hay tiền." },
  { id: "prize", channel: "SMS", from: "8x77", text: "Chúc mừng thuê bao đã trúng iPhone 16 Pro Max! Nộp phí vận chuyển 500.000đ để nhận quà tại:", link: { shown: "qua-tang-tri-an.vn", real: "qua-tang-tri-an.vn" }, scam: true, signs: "Trúng thưởng mà mình không tham gia, đòi nộp phí trước — dấu hiệu lừa đảo kinh điển." },
  { id: "otp", channel: "SMS", from: "Người lạ", text: "Em ơi anh là nhân viên ngân hàng, hệ thống vừa gửi nhầm mã OTP vào máy em, em đọc lại mã giúp anh để anh hủy giao dịch nhé.", scam: true, signs: "Không ai có quyền xin mã OTP. Mã OTP dùng để xác nhận giao dịch — đưa mã là mất tiền." },
];

export function judgeMessage(m: Message, saidScam: boolean): { ok: boolean; message: string } {
  const ok = saidScam === m.scam;
  return { ok, message: `${ok ? "Đúng" : "Chưa đúng"} — ${m.scam ? "đây là tin LỪA ĐẢO" : "đây là tin AN TOÀN"}. ${m.signs}` };
}

// ---------- Nhiệm vụ 2: mật khẩu ----------

export const PROFILE = { name: "An", fullName: "Nguyễn Văn An", birthYear: "2009", school: "leloi", pet: "mimi" };
const COMMON = ["123456", "12345678", "password", "matkhau", "qwerty", "abc123", "111111", "iloveyou", "admin"];

export interface PasswordCheck {
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
  crackTime: string;
  issues: string[];
  ok: boolean;
}

function humanTime(seconds: number): string {
  if (seconds < 1) return "dưới 1 giây";
  const units: [number, string][] = [[31_536_000 * 1000, "nghìn năm"], [31_536_000, "năm"], [86_400, "ngày"], [3_600, "giờ"], [60, "phút"], [1, "giây"]];
  for (const [s, name] of units) if (seconds >= s) {
    const v = seconds / s;
    return v >= 1e6 ? `hơn 1 triệu ${name}` : `khoảng ${Math.round(v).toLocaleString("vi-VN")} ${name}`;
  }
  return "dưới 1 giây";
}

/** Đánh giá mật khẩu: độ dài, loại kí tự, mật khẩu phổ biến, chứa thông tin cá nhân; thời gian dò ở 10 tỉ lần thử/giây. */
export function checkPassword(pw: string): PasswordCheck {
  const issues: string[] = [];
  const lower = pw.toLowerCase();
  const classes = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((r) => r.test(pw)).length;
  const pool = (/[a-z]/.test(pw) ? 26 : 0) + (/[A-Z]/.test(pw) ? 26 : 0) + (/\d/.test(pw) ? 10 : 0) + (/[^A-Za-z0-9]/.test(pw) ? 33 : 0);
  let guesses = Math.pow(Math.max(pool, 1), pw.length);
  if (pw.length < 12) issues.push(`Mới có ${pw.length} kí tự — nên từ 12 kí tự trở lên.`);
  if (classes < 3) issues.push("Nên trộn chữ thường, chữ hoa, chữ số và kí hiệu.");
  if (COMMON.some((c) => lower.includes(c))) { issues.push("Chứa mật khẩu phổ biến (như 123456, password) — bị thử đầu tiên."); guesses = Math.min(guesses, 1e4); }
  // tên chỉ tính khi đứng thành một từ riêng (chữ "an" nằm trong "Vang" thì không tính) hoặc là họ tên viết liền
  const words = lower.split(/[^a-zà-ỹđ]+/i).filter(Boolean);
  const fullName = PROFILE.fullName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/\s+/g, "");
  const personal = [
    ...(words.includes(PROFILE.name.toLowerCase()) || lower.includes(fullName) ? [PROFILE.name] : []),
    ...[PROFILE.birthYear, PROFILE.school, PROFILE.pet].filter((p) => lower.includes(p)),
  ];
  if (personal.length) { issues.push(`Chứa thông tin cá nhân dễ đoán (${personal.join(", ")}) — người quen hoặc ai xem trang cá nhân đều đoán được.`); guesses = Math.min(guesses, 1e7); }
  if (/(.)\1{2,}/.test(pw)) issues.push("Có kí tự lặp liên tiếp, làm mật khẩu dễ đoán hơn.");
  const seconds = guesses / 1e10;
  const score = (seconds < 1 ? 0 : seconds < 3600 ? 1 : seconds < 31_536_000 ? 2 : seconds < 31_536_000 * 1000 ? 3 : 4) as PasswordCheck["score"];
  const finalScore = (issues.some((i) => i.startsWith("Chứa")) ? Math.min(score, 1) : score) as PasswordCheck["score"];
  return { score: finalScore, label: ["Rất yếu", "Yếu", "Trung bình", "Mạnh", "Rất mạnh"][finalScore], crackTime: humanTime(seconds), issues, ok: finalScore >= 4 && issues.length === 0 };
}

// ---------- Nhiệm vụ 3: ảnh sắp đăng ----------

export interface Hotspot {
  id: string;
  label: string;
  sensitive: boolean;
  why: string;
  /** vùng bấm trên ảnh (đơn vị khung 600×380) */
  x: number; y: number; w: number; h: number;
}

export const HOTSPOTS: Hotspot[] = [
  { id: "card", label: "Thẻ học sinh", sensitive: true, why: "Thẻ có họ tên, trường, lớp, mã học sinh — đủ để người lạ tìm ra em.", x: 150, y: 190, w: 110, h: 70 },
  { id: "house", label: "Biển số nhà", sensitive: true, why: "Lộ địa chỉ nhà.", x: 440, y: 40, w: 120, h: 50 },
  { id: "ticket", label: "Mã QR trên vé máy bay", sensitive: true, why: "Mã vạch/QR trên vé chứa mã đặt chỗ — người khác có thể đổi, hủy chuyến bay của em.", x: 300, y: 250, w: 90, h: 80 },
  { id: "caption", label: "Chú thích “Cả nhà đi Đà Nẵng 1 tuần, nhà vắng tanh!”", sensitive: true, why: "Báo cho cả thế giới biết nhà đang không có người.", x: 20, y: 335, w: 560, h: 36 },
  { id: "cat", label: "Con mèo", sensitive: false, why: "Không lộ thông tin gì.", x: 40, y: 230, w: 90, h: 80 },
  { id: "sky", label: "Bầu trời, cây", sensitive: false, why: "Không lộ thông tin gì.", x: 20, y: 20, w: 200, h: 80 },
];

export const SENSITIVE_COUNT = HOTSPOTS.filter((h) => h.sensitive).length;
