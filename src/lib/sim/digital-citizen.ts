/**
 * Công dân số (Tin 12 – Bài 6 KNTT; dùng AI có trách nhiệm): ba câu chuyện chat rẽ nhánh.
 * Mỗi lựa chọn đổi ba thước đo và kéo theo diễn biến tiếp theo trong khung chat.
 */

export interface Meters { safety: number; trust: number; community: number }
export const METER_LABEL: Record<keyof Meters, string> = { safety: "An toàn của bạn bè", trust: "Uy tín của em", community: "Không khí tập thể" };
export const START_METERS: Meters = { safety: 60, trust: 60, community: 60 };

export interface Chat { who: string; text: string; me?: boolean }

export interface Choice {
  text: string;
  verdict: "good" | "ok" | "bad";
  effect: Partial<Meters>;
  replies: Chat[];
  why: string;
}

export interface Step { prompt: string; choices: Choice[] }

export interface Story {
  id: string;
  title: string;
  room: string;
  opening: Chat[];
  steps: Step[];
}

export const STORIES: Story[] = [
  {
    id: "group",
    title: "Nhóm chat lớp",
    room: "12A3 – Lớp mình 💬",
    opening: [
      { who: "Tuấn", text: "[ảnh] Ê nhìn bạn Lan ngủ gật trong giờ Sử nè 😂😂 chế thêm tai lợn cho vui" },
      { who: "Hùng", text: "Hahaha đỉnh 🤣" },
      { who: "Mai", text: "Lưu ảnh làm meme luôn" },
    ],
    steps: [
      {
        prompt: "Cả nhóm đang cười. Lan cũng ở trong nhóm. Em làm gì?",
        choices: [
          { text: "Thả “haha” cho vui, ai cũng làm thế mà", verdict: "bad", effect: { safety: -25, trust: -10, community: -15 }, replies: [{ who: "Lan", text: "…" }, { who: "Hệ thống", text: "Lan đã rời nhóm." }], why: "Một cái “haha” cũng là góp phần chế giễu. Với Lan đó là bắt nạt trên mạng." },
          { text: "Nhắn riêng hỏi thăm Lan, rồi nhắn Tuấn gỡ ảnh", verdict: "good", effect: { safety: 20, trust: 15, community: 10 }, replies: [{ who: "Em → Lan (nhắn riêng)", text: "Lan ổn không? Mình thấy ảnh đó không vui chút nào, mình sẽ nhắn Tuấn gỡ.", me: true }, { who: "Lan", text: "Cảm ơn cậu… mình xấu hổ lắm 😢" }], why: "Hỗ trợ người bị hại và yêu cầu gỡ nội dung là cách ứng xử văn minh, không làm to chuyện." },
          { text: "Chuyển ảnh sang nhóm khác cho mọi người cùng xem", verdict: "bad", effect: { safety: -35, trust: -20, community: -20 }, replies: [{ who: "Nhóm CLB Bóng rổ", text: "😂😂 ai đấy?" }], why: "Phát tán ảnh người khác khi chưa được đồng ý là xâm phạm hình ảnh cá nhân, và làm tổn thương lan rộng." },
          { text: "Im lặng, tắt thông báo nhóm", verdict: "ok", effect: { safety: -5, trust: 0, community: -5 }, replies: [{ who: "Hùng", text: "Thêm ảnh nữa nè 📸" }], why: "Không tham gia là tốt, nhưng im lặng để chuyện tiếp diễn thì Lan vẫn bị tổn thương." },
        ],
      },
      {
        prompt: "Tuấn trả lời: “Đùa tí thôi mà, làm căng thế 🙄”. Em làm gì tiếp?",
        choices: [
          { text: "Thôi kệ, chắc mình làm quá", verdict: "ok", effect: { safety: -10, community: -5 }, replies: [{ who: "Tuấn", text: "Đấy, có gì đâu 😎" }], why: "Bỏ cuộc khi nội dung vẫn còn đó thì người bị hại vẫn chịu tổn thương." },
          { text: "Bình tĩnh nói rõ: đùa mà người kia buồn thì không còn là đùa; nếu không gỡ, mình sẽ báo cô chủ nhiệm", verdict: "good", effect: { safety: 20, trust: 10, community: 15 }, replies: [{ who: "Tuấn", text: "Ừ… gỡ rồi. Xin lỗi Lan nhé." }, { who: "Lan", text: "Ok, cảm ơn mọi người." }], why: "Nói thẳng, lịch sự, có giới hạn rõ ràng; nhờ người lớn khi cần là đúng quy trình." },
          { text: "Đăng ảnh chế Tuấn để trả đũa", verdict: "bad", effect: { safety: -15, trust: -15, community: -25 }, replies: [{ who: "Tuấn", text: "Ơ hay, chơi thế à 😡" }], why: "Trả đũa biến em thành người bắt nạt và làm mâu thuẫn leo thang." },
        ],
      },
    ],
  },
  {
    id: "ai-essay",
    title: "Bài văn với AI",
    room: "Trợ lý AI ✨",
    opening: [
      { who: "Em", text: "Mai nộp bài nghị luận “Giới trẻ và mạng xã hội”, mình chưa viết chữ nào 😭", me: true },
      { who: "Trợ lý AI", text: "Mình có thể giúp. Bạn muốn mình làm gì?" },
    ],
    steps: [
      {
        prompt: "Còn 3 tiếng. Em nhờ AI thế nào?",
        choices: [
          { text: "“Viết hộ mình bài 600 chữ”, rồi nộp nguyên văn", verdict: "bad", effect: { trust: -30, community: -10 }, replies: [{ who: "Trợ lý AI", text: "[bài 600 chữ]" }], why: "Nộp bài AI viết như bài của mình là thiếu trung thực, và em không học được kĩ năng nghị luận." },
          { text: "Nhờ AI gợi ý dàn ý và phản biện, rồi tự viết; ghi chú đã dùng AI ở đâu", verdict: "good", effect: { trust: 20, community: 5 }, replies: [{ who: "Trợ lý AI", text: "Dàn ý gợi ý: 1) Lợi ích… 2) Rủi ro… 3) Giải pháp… Bạn thử viết luận điểm 1 nhé, mình sẽ góp ý." }], why: "AI là người hướng dẫn, em vẫn là người viết; ghi rõ cách dùng AI là minh bạch với thầy cô." },
          { text: "Nhờ AI viết rồi đổi vài từ cho khác đi", verdict: "bad", effect: { trust: -25 }, replies: [{ who: "Trợ lý AI", text: "[bài viết]" }], why: "Đổi vài từ vẫn là nộp bài của người khác (của AI) — không trung thực." },
        ],
      },
      {
        prompt: "Hôm sau cô hỏi: “Đoạn 2 em lấy số liệu 87% học sinh nghiện mạng xã hội ở đâu?”. Số liệu đó do AI đưa ra.",
        choices: [
          { text: "Nói là em tự tìm trên mạng", verdict: "bad", effect: { trust: -25 }, replies: [{ who: "Cô giáo", text: "Cô không tìm thấy nguồn nào có số liệu này cả." }], why: "AI có thể bịa số liệu. Nói dối làm mất uy tín gấp đôi." },
          { text: "Thừa nhận số liệu từ AI, chưa kiểm chứng; xin sửa và dẫn nguồn thật", verdict: "good", effect: { trust: 15 }, replies: [{ who: "Cô giáo", text: "Tốt, em trung thực. Nhớ luôn kiểm tra thông tin AI đưa ra với nguồn đáng tin nhé." }], why: "AI có thể sai; trách nhiệm kiểm chứng và dẫn nguồn là của người dùng." },
        ],
      },
    ],
  },
  {
    id: "deepfake",
    title: "Video giả",
    room: "Hội phụ huynh & học sinh THPT Lê Lợi",
    opening: [
      { who: "Ai đó", text: "[video] THẦY HIỆU TRƯỞNG: “Ngày mai toàn trường nghỉ học do bão” — share gấp!!!" },
      { who: "Phụ huynh A", text: "Thật không vậy mọi người?" },
    ],
    steps: [
      {
        prompt: "Giọng và mặt trong video rất giống thầy, nhưng khẩu hình hơi lệch, chưa thấy trang của trường đăng. Em làm gì?",
        choices: [
          { text: "Chia sẻ ngay cho cả lớp, lỡ thật thì sao", verdict: "bad", effect: { safety: -20, trust: -15, community: -20 }, replies: [{ who: "Hệ thống", text: "Video đã được chia sẻ 1.200 lần." }], why: "Chia sẻ tin chưa kiểm chứng làm tin giả lan nhanh; có thể đây là video ghép bằng AI (deepfake)." },
          { text: "Kiểm tra trang chính thức của trường, báo cáo video với nền tảng, nhắn nhóm chờ thông báo chính thức", verdict: "good", effect: { safety: 15, trust: 20, community: 15 }, replies: [{ who: "Trang THPT Lê Lợi", text: "Nhà trường KHÔNG có thông báo nghỉ học. Video đang lan truyền là giả mạo." }], why: "Đối chiếu nguồn chính thống trước khi tin và chia sẻ; báo cáo nội dung giả mạo." },
          { text: "Bình luận chế giễu thầy cho vui", verdict: "bad", effect: { trust: -20, community: -15 }, replies: [{ who: "Phụ huynh B", text: "Các em không nên như vậy." }], why: "Chế giễu người bị làm giả hình ảnh là góp phần xúc phạm họ." },
        ],
      },
      {
        prompt: "Bạn em nói: “Mình cũng làm được video kiểu đó bằng app, ghép mặt cô Toán cho vui nhé?”",
        choices: [
          { text: "Ừ làm thử, chỉ gửi nhóm nhỏ thôi", verdict: "bad", effect: { safety: -20, trust: -15 }, replies: [{ who: "Bạn", text: "Ok để mình làm 😆" }], why: "Dùng khuôn mặt người khác khi chưa đồng ý là xâm phạm quyền hình ảnh, có thể vi phạm pháp luật — nhóm nhỏ cũng có thể lan ra ngoài." },
          { text: "Từ chối, giải thích: ghép mặt người thật khi họ không đồng ý là sai và có thể vi phạm pháp luật", verdict: "good", effect: { safety: 10, trust: 10, community: 10 }, replies: [{ who: "Bạn", text: "Ừ nhỉ, thôi không làm nữa." }], why: "Dùng AI có trách nhiệm: không tạo nội dung giả mạo người thật." },
        ],
      },
    ],
  },
];

export function applyEffect(m: Meters, e: Partial<Meters>): Meters {
  const clamp = (v: number) => Math.max(0, Math.min(100, v));
  return { safety: clamp(m.safety + (e.safety ?? 0)), trust: clamp(m.trust + (e.trust ?? 0)), community: clamp(m.community + (e.community ?? 0)) };
}

export const TOTAL_STEPS = STORIES.reduce((n, s) => n + s.steps.length, 0);
