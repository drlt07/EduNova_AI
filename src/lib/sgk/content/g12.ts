import type { BookLesson } from "../types";

/** Tin học 12 — các bài đã có nội dung số. */
export const G12: BookLesson[] = [
  {
    ref: "12-1",
    objectives: ["Nêu được khái niệm trí tuệ nhân tạo và cách máy học từ dữ liệu.", "Nhận biết được hạn chế của AI: phụ thuộc dữ liệu, có thể sai, có thể thiên lệch."],
    periods: 2,
    warmUp: "Điện thoại tự nhận ra khuôn mặt em để mở khóa. Ai đã “dạy” nó nhận ra em?",
    sections: [
      {
        id: "khai-niem",
        title: "Trí tuệ nhân tạo là gì",
        blocks: [
          { t: "p", text: "**Trí tuệ nhân tạo (AI)** là khả năng của máy tính thực hiện những việc thường cần trí thông minh con người: nhận dạng hình ảnh, hiểu lời nói, dịch, gợi ý, ra quyết định." },
          { t: "figure", fig: "ai-learn", caption: "Học máy: cho máy xem nhiều ví dụ có nhãn, máy tự tìm quy luật để dự đoán ví dụ mới." },
          { t: "sim", slug: "ai-discovery", task: "Huấn luyện máy phân loại xoài chín/xanh: chọn dữ liệu, huấn luyện, kiểm tra độ chính xác." },
          { t: "check", id: "c12-1-a", q: "Máy phân loại xoài chỉ được huấn luyện bằng ảnh xoài cát. Đưa ảnh xoài tượng vào thì sao?", options: ["Luôn đúng", "Dễ đoán sai vì chưa từng thấy loại này", "Máy tự học thêm"], answer: 1, why: "Mô hình chỉ giỏi với dữ liệu giống dữ liệu đã học.", objective: 1 },
          { t: "check", id: "c12-1-c", q: "Học máy khác lập trình thông thường ở điểm nào?", options: ["Con người viết sẵn mọi quy tắc", "Máy tự tìm quy luật từ nhiều ví dụ có nhãn", "Không cần dữ liệu"], answer: 1, why: "Học máy rút quy luật từ dữ liệu thay vì quy tắc viết tay.", objective: 0 },
        ],
      },
      {
        id: "han-che",
        title: "Hạn chế và dùng AI có trách nhiệm",
        blocks: [
          { t: "list", items: ["Dữ liệu ít, lệch → kết quả sai, thiên vị.", "AI tạo nội dung có thể “bịa” thông tin nghe rất thuyết phục.", "Cần kiểm chứng, ghi rõ khi dùng AI, không dùng để gian lận."] },
          { t: "check", id: "c12-1-b", q: "Chatbot trả lời một số liệu lịch sử kèm nguồn trích dẫn. Em nên?", options: ["Tin ngay vì có nguồn", "Mở nguồn kiểm tra lại trước khi dùng", "Bỏ qua mọi câu trả lời của AI"], answer: 1, why: "AI có thể bịa cả nguồn; cần kiểm chứng.", objective: 1 },
        ],
      },
    ],
    practice: [{ task: "Kể ba ứng dụng AI em đã dùng; với mỗi ứng dụng, dữ liệu học có thể là gì?" }],
    apply: "Thử hỏi một công cụ AI một câu hỏi về bài học, rồi kiểm chứng câu trả lời bằng SGK hoặc nguồn tin cậy.",
    remember: ["Học máy: học quy luật từ nhiều ví dụ có nhãn.", "AI phụ thuộc dữ liệu, có thể sai; luôn kiểm chứng."],
  },
  {
    ref: "12-3",
    objectives: ["Nêu được chức năng của một số thiết bị mạng: switch, router, modem, điểm truy cập Wi-Fi.", "Nhận biết được cách các thiết bị kết nối thành mạng LAN và ra Internet."],
    periods: 2,
    warmUp: "Phòng Tin có 30 máy, chỉ có một đường cáp Internet. Làm sao cả 30 máy cùng vào mạng được?",
    sections: [
      {
        id: "thiet-bi",
        title: "Các thiết bị mạng",
        blocks: [
          { t: "figure", fig: "lan", caption: "Các máy nối vào switch thành mạng LAN; router nối LAN ra Internet." },
          { t: "table", head: ["Thiết bị", "Chức năng"], rows: [["Switch", "Nối các máy trong cùng mạng LAN, chuyển dữ liệu đúng cổng"], ["Router", "Nối các mạng khác nhau, chọn đường đi theo địa chỉ IP"], ["Modem", "Chuyển tín hiệu giữa mạng nhà cung cấp và mạng trong nhà"], ["Access Point", "Phát Wi-Fi cho thiết bị không dây"]] },
          { t: "sim", slug: "network-journey", task: "Nhiệm vụ 1: đấu dây cho mạng phòng Tin: máy vào switch, switch vào router." },
          { t: "check", id: "c12-3-a", q: "Hai máy cùng phòng gửi tệp cho nhau, dữ liệu đi qua thiết bị nào?", options: ["Switch", "Router ra Internet rồi quay lại", "Modem"], answer: 0, why: "Cùng mạng LAN thì switch chuyển trực tiếp.", objective: 0 },
          { t: "check", id: "c12-3-b", q: "Thiết bị nào nối mạng LAN của trường ra Internet?", options: ["Switch", "Router", "Bàn phím"], answer: 1, why: "Router nối các mạng khác nhau, gồm LAN và Internet.", objective: 1 },
        ],
      },
    ],
    practice: [{ task: "Vẽ sơ đồ mạng ở nhà em: modem, router Wi-Fi và các thiết bị đang kết nối." }],
    apply: "Đề xuất vị trí đặt các điểm phát Wi-Fi để phủ sóng toàn bộ dãy phòng học.",
    remember: ["Switch nối máy trong LAN; router nối các mạng, chọn đường theo IP.", "Access Point phát Wi-Fi; modem nối với nhà cung cấp."],
  },
  {
    ref: "12-4",
    objectives: ["Nêu được khái niệm giao thức mạng và vai trò của địa chỉ IP.", "Sử dụng được lệnh ping, ipconfig để kiểm tra kết nối."],
    periods: 2,
    warmUp: "Thư gửi đi cần có địa chỉ người nhận và cùng một quy ước viết phong bì. Máy tính gửi dữ liệu cho nhau cũng vậy.",
    sections: [
      {
        id: "giao-thuc",
        title: "Giao thức và địa chỉ IP",
        blocks: [
          { t: "p", text: "**Giao thức** là bộ quy tắc chung để các thiết bị trao đổi dữ liệu. Bộ giao thức TCP/IP là nền tảng của Internet: IP lo địa chỉ và đường đi, TCP đảm bảo dữ liệu đến đủ và đúng thứ tự." },
          { t: "figure", fig: "packet-layers", caption: "Dữ liệu được chia thành gói, mỗi gói mang địa chỉ IP nguồn và đích." },
          { t: "note", tone: "key", text: "Máy gửi tới địa chỉ khác mạng thì chuyển gói cho **cổng mặc định** (router)." },
          { t: "check", id: "c12-4-a", q: "Máy 192.168.1.15 gửi gói tới 8.8.8.8. Gói đi tới đâu trước?", options: ["Thẳng tới 8.8.8.8", "Cổng mặc định (router) của mạng", "Một máy bất kì trong LAN"], answer: 1, why: "Đích khác mạng nên gửi cho router.", objective: 0 },
        ],
      },
      {
        id: "kiem-tra",
        title: "Kiểm tra kết nối",
        blocks: [
          { t: "table", head: ["Lệnh", "Dùng để"], rows: [["ipconfig", "xem địa chỉ IP, cổng mặc định của máy"], ["ping <địa chỉ>", "kiểm tra có liên lạc được với một máy không"]] },
          { t: "sim", slug: "network-journey", task: "Nhiệm vụ 2–3: theo dõi gói tin qua router và sửa sự cố bằng ping, ipconfig." },
          { t: "check", id: "c12-4-b", q: "ping được router nhưng không ping được 8.8.8.8. Lỗi có thể nằm ở đâu?", options: ["Dây mạng của máy", "Đường từ router ra Internet", "Card mạng của máy"], answer: 1, why: "Trong LAN vẫn thông, nên vấn đề ở phía ngoài router.", objective: 1 },
        ],
      },
    ],
    practice: [{ task: "Chạy ipconfig trên máy tính của trường, ghi lại địa chỉ IP và cổng mặc định." }],
    apply: "Viết quy trình 3 bước em sẽ làm khi máy không vào được Internet.",
    remember: ["Giao thức là quy tắc trao đổi dữ liệu; TCP/IP là nền tảng Internet.", "ping kiểm tra liên lạc; ipconfig xem cấu hình IP."],
  },
  {
    ref: "12-6",
    objectives: ["Giao tiếp lịch sự, an toàn và có trách nhiệm trong không gian số.", "Sử dụng AI và nội dung số trung thực, kiểm chứng thông tin trước khi chia sẻ."],
    periods: 1,
    warmUp: "Một video “sốc” về trường em đang lan trong nhóm lớp. Trước khi bấm chia sẻ, em nên tự hỏi điều gì?",
    sections: [
      {
        id: "giao-tiep",
        title: "Ứng xử trong không gian số",
        blocks: [
          { t: "list", items: ["Tôn trọng: không xúc phạm, không bắt nạt, không lan truyền ảnh của người khác.", "Trung thực: dùng AI để học, ghi rõ khi có hỗ trợ của AI.", "Tỉnh táo: kiểm tra nguồn, ngày đăng, đối chiếu nhiều nơi trước khi chia sẻ."] },
          { t: "sim", slug: "digital-citizen", task: "Đi qua ba câu chuyện: nhóm chat lớp, bài văn với AI, video giả." },
          { t: "check", id: "c12-6-a", q: "Bạn nhờ em dùng AI viết hộ bài văn để nộp. Cách xử sự tốt nhất là?", options: ["Viết hộ cho bạn", "Gợi ý bạn dùng AI để lập dàn ý rồi tự viết và ghi rõ", "Báo cáo bạn ngay"], answer: 1, why: "Dùng AI hỗ trợ học tập và trung thực về việc sử dụng.", objective: 1 },
          { t: "check", id: "c12-6-b", q: "Trước khi chia sẻ một video “sốc”, em nên?", options: ["Chia sẻ ngay kẻo chậm", "Kiểm tra nguồn, ngày đăng, đối chiếu tin chính thống", "Thêm bình luận gay gắt"], answer: 1, why: "Kiểm chứng trước khi chia sẻ để không lan truyền tin giả.", objective: 0 },
        ],
      },
    ],
    practice: [{ task: "Tìm một tin giả từng lan truyền và chỉ ra các dấu hiệu nhận biết." }],
    apply: "Cả lớp thống nhất quy tắc dùng AI trong học tập môn Tin học.",
    remember: ["Tôn trọng, trung thực, kiểm chứng trước khi chia sẻ.", "Dùng AI để học, không để gian lận; ghi rõ khi dùng."],
  },
  {
    ref: "12-7",
    objectives: ["Nêu được cấu trúc cơ bản của một trang HTML.", "Sử dụng được các thẻ tiêu đề, đoạn văn, liên kết, hình ảnh."],
    periods: 2,
    warmUp: "Mở một trang web bất kì, bấm chuột phải → Xem nguồn trang. Em thấy những gì?",
    sections: [
      {
        id: "cau-truc",
        title: "Cấu trúc trang HTML",
        blocks: [
          { t: "figure", fig: "html-tree", caption: "Trang HTML là cây các phần tử lồng nhau." },
          { t: "code", code: "<!doctype html>\n<html>\n  <head><title>Lớp 12A3</title></head>\n  <body>\n    <h1>Chào mừng</h1>\n    <p>Trang của lớp mình.</p>\n    <a href=\"https://moet.gov.vn\">Bộ GD&ĐT</a>\n  </body>\n</html>" },
          { t: "note", tone: "key", text: "Phần lớn thẻ đi theo cặp mở/đóng: <p>…</p>. Nội dung hiển thị nằm trong <body>." },
          { t: "sim", slug: "web-creator", task: "Dựng trang giới thiệu lớp: tiêu đề, đoạn giới thiệu, một liên kết và một hình." },
          { t: "check", id: "c12-7-a", q: "Thẻ nào tạo liên kết?", options: ["<link>", "<a href=\"…\">", "<p>"], answer: 1, why: "Thẻ a với thuộc tính href tạo siêu liên kết.", objective: 1 },
          { t: "check", id: "c12-7-b", q: "Nội dung hiển thị trên trình duyệt được đặt trong thẻ nào?", options: ["<head>", "<body>", "<title>"], answer: 1, why: "body chứa nội dung hiển thị; head chứa thông tin về trang.", objective: 0 },
        ],
      },
    ],
    practice: [{ task: "Viết trang HTML có 1 tiêu đề h1, 2 đoạn văn và 1 hình ảnh có thuộc tính alt." }],
    apply: "Làm trang giới thiệu câu lạc bộ em yêu thích.",
    remember: ["Trang HTML gồm head (thông tin) và body (nội dung hiển thị).", "h1–h6 tiêu đề, p đoạn văn, a liên kết, img hình ảnh."],
  },
  {
    ref: "12-13",
    objectives: ["Nêu được vai trò của CSS trong việc trình bày trang web.", "Viết được quy tắc CSS với bộ chọn thẻ, lớp và các thuộc tính màu, chữ, khung."],
    periods: 2,
    warmUp: "Hai trang web có cùng nội dung nhưng một trang trông rất đẹp, trang kia rất thô. Khác nhau ở đâu?",
    sections: [
      {
        id: "quy-tac",
        title: "Quy tắc CSS",
        blocks: [
          { t: "figure", fig: "css-rule", caption: "Một quy tắc gồm bộ chọn và các cặp thuộc tính: giá trị." },
          { t: "code", code: "h1 { color: #0e7490; }\n.noi-bat { background: #fef3c7; padding: 8px; border-radius: 8px; }" },
          { t: "note", tone: "key", text: "HTML lo nội dung, CSS lo trình bày. Đổi giao diện cả trang chỉ cần sửa CSS." },
          { t: "sim", slug: "web-creator", task: "Thêm CSS cho trang lớp: đổi màu tiêu đề, tạo khung nổi bật cho một đoạn." },
          { t: "check", id: "c12-13-a", q: "Bộ chọn .canh-bao áp dụng cho phần tử nào?", options: ["Mọi thẻ <canh-bao>", "Phần tử có class=\"canh-bao\"", "Phần tử có id=\"canh-bao\""], answer: 1, why: "Dấu chấm là bộ chọn lớp; # là bộ chọn id.", objective: 1 },
          { t: "check", id: "c12-13-b", q: "Muốn đổi màu chữ cho mọi tiêu đề của cả website, nên làm gì?", options: ["Sửa từng thẻ h1 trong HTML", "Viết một quy tắc CSS cho h1", "Chụp ảnh tiêu đề"], answer: 1, why: "CSS tách trình bày khỏi nội dung, sửa một chỗ áp dụng mọi nơi.", objective: 0 },
        ],
      },
    ],
    practice: [{ task: "Viết CSS để mọi đoạn văn có cỡ chữ 18px và màu xám đậm." }],
    apply: "Thiết kế bảng màu và kiểu chữ thống nhất cho trang web của lớp.",
    remember: ["CSS = bộ chọn { thuộc tính: giá trị; }", "Bộ chọn thẻ, lớp (.ten), id (#ten)."],
  },
];
