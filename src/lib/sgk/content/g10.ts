import type { BookLesson } from "../types";

/** Tin học 10 — các bài đã có nội dung số. */
export const G10: BookLesson[] = [
  {
    ref: "10-1",
    objectives: ["Phân biệt được thông tin và dữ liệu.", "Nêu được các bước của quá trình xử lí thông tin trên máy tính."],
    periods: 1,
    warmUp: "Nhiệt kế hiện số 38,5. Con số đó là dữ liệu hay thông tin? Khi mẹ nói “con bị sốt rồi” thì sao?",
    sections: [
      {
        id: "du-lieu",
        title: "Dữ liệu và thông tin",
        blocks: [
          { t: "p", text: "**Dữ liệu** là những gì được ghi lại: con số, chữ, âm thanh, hình ảnh. **Thông tin** là ý nghĩa con người rút ra từ dữ liệu và dùng được để quyết định." },
          { t: "table", head: ["Dữ liệu", "Thông tin rút ra"], rows: [["38,5 °C", "Đang sốt, cần nghỉ ngơi"], ["Bảng điểm 10 môn", "Môn Toán cần cố gắng hơn"], ["Ảnh vệ tinh mây", "Chiều nay có thể mưa"]] },
          { t: "check", id: "c10-1-a", q: "“Lớp 10A1 có 38 học sinh” là gì đối với cô giáo cần chia nhóm 4 em?", options: ["Chỉ là dữ liệu, chưa có ý nghĩa", "Thông tin: chia được 9 nhóm 4 em và 1 nhóm 2 em", "Không phải dữ liệu"], answer: 1, why: "Cùng một dữ liệu, khi gắn với mục đích (chia nhóm) thì trở thành thông tin giúp ra quyết định.", objective: 0 },
        ],
      },
      {
        id: "xu-li",
        title: "Máy tính xử lí thông tin như thế nào",
        blocks: [
          { t: "figure", fig: "ipo", caption: "Mọi chương trình đều theo mô hình Nhập → Xử lí → Xuất, có thể lưu trữ để dùng lại." },
          { t: "list", ordered: true, items: ["**Nhập**: đưa dữ liệu vào (bàn phím, cảm biến, camera).", "**Xử lí**: tính toán, so sánh, sắp xếp theo chương trình.", "**Xuất**: trả kết quả (màn hình, loa, máy in, bật thiết bị).", "**Lưu trữ**: ghi lại để dùng lần sau."] },
          { t: "note", tone: "key", text: "Máy tính chỉ xử lí dữ liệu; con người (hoặc chương trình do con người viết) mới gán ý nghĩa để có thông tin." },
          { t: "check", id: "c10-1-b", q: "Máy tưới cây đo độ ẩm đất rồi bật bơm. Bước “bật bơm” thuộc giai đoạn nào?", options: ["Nhập", "Xử lí", "Xuất"], answer: 2, why: "Bật bơm là kết quả tác động ra bên ngoài, tức là giai đoạn xuất.", objective: 1 },
        ],
      },
    ],
    practice: [{ task: "Chọn một ứng dụng em dùng hằng ngày (bản đồ, nhắn tin…). Chỉ ra dữ liệu nhập, việc xử lí và kết quả xuất.", hint: "Ứng dụng bản đồ: nhập điểm đi và điểm đến, xử lí tìm đường, xuất đường đi và thời gian." }],
    apply: "Quan sát một máy bán hàng tự động hoặc thang máy, vẽ sơ đồ Nhập → Xử lí → Xuất của nó.",
    remember: ["Dữ liệu là cái được ghi lại; thông tin là ý nghĩa rút ra từ dữ liệu.", "Xử lí thông tin gồm nhập, xử lí, xuất và lưu trữ."],
  },
  {
    ref: "10-4",
    objectives: ["Biểu diễn được số nguyên không âm trong hệ nhị phân.", "Chuyển đổi được giữa hệ thập phân và hệ nhị phân."],
    periods: 2,
    warmUp: "Một bóng đèn chỉ có hai trạng thái bật/tắt. Với 3 bóng đèn, em biểu diễn được bao nhiêu trạng thái khác nhau?",
    sections: [
      {
        id: "bit",
        title: "Bit, byte và vì sao máy tính dùng hệ nhị phân",
        blocks: [
          { t: "p", text: "Mạch điện trong máy tính dễ phân biệt chắc chắn hai mức: có điện và không có điện. Vì vậy máy tính lưu mọi dữ liệu bằng hai chữ số **0** và **1**. Mỗi chữ số như vậy là một **bit**; 8 bit là một **byte**." },
          { t: "p", text: "Với n bit ta có 2ⁿ tổ hợp khác nhau. 3 bóng đèn cho 2³ = 8 trạng thái, một byte cho 2⁸ = 256 giá trị (0 đến 255)." },
          { t: "check", id: "c10-4-a", q: "Cần ít nhất bao nhiêu bit để đánh số 40 học sinh của một lớp?", options: ["5 bit", "6 bit", "40 bit"], answer: 1, why: "5 bit chỉ cho 32 số; 6 bit cho 64 số, đủ cho 40 học sinh.", objective: 0 },
        ],
      },
      {
        id: "doi-he",
        title: "Chuyển đổi thập phân ↔ nhị phân",
        blocks: [
          { t: "figure", fig: "binary-place", caption: "Mỗi vị trí trong số nhị phân có giá trị gấp đôi vị trí bên phải nó." },
          { t: "p", text: "**Nhị phân → thập phân**: cộng giá trị các vị trí có chữ số 1. Ví dụ 10110₂ = 16 + 4 + 2 = 22." },
          { t: "p", text: "**Thập phân → nhị phân**: chia liên tiếp cho 2, ghi lại phần dư, rồi đọc các số dư từ dưới lên." },
          { t: "table", head: ["Phép chia", "Thương", "Dư"], rows: [["13 : 2", "6", "1"], ["6 : 2", "3", "0"], ["3 : 2", "1", "1"], ["1 : 2", "0", "1"]], caption: "13 = 1101₂ (đọc số dư từ dưới lên)." },
          { t: "sim", slug: "binary-logic", task: "Bật/tắt các bit để tạo ra số 22 và số 13, kiểm tra lại kết quả tính tay." },
          { t: "check", id: "c10-4-b", q: "Số 1001₂ bằng bao nhiêu trong hệ thập phân?", options: ["9", "11", "1001"], answer: 0, why: "1001₂ = 8 + 1 = 9.", objective: 1 },
        ],
      },
    ],
    practice: [
      { task: "Đổi 25 và 100 sang hệ nhị phân.", answer: "25 = 11001₂; 100 = 1100100₂." },
      { task: "Đổi 111111₂ sang thập phân. Có cách nào nhanh không?", hint: "111111₂ = 1000000₂ − 1.", answer: "63." },
    ],
    apply: "Dùng 5 ngón tay của một bàn tay làm 5 bit để đếm từ 0 đến 31.",
    remember: ["Máy tính dùng hệ nhị phân vì mạch điện phân biệt chắc chắn hai trạng thái.", "n bit biểu diễn được 2ⁿ giá trị; 1 byte = 8 bit.", "Nhị phân → thập phân: cộng các lũy thừa của 2; thập phân → nhị phân: chia 2 lấy dư, đọc ngược."],
  },
  {
    ref: "10-5",
    objectives: ["Nêu được các giá trị logic và các phép toán AND, OR, NOT.", "Tính được giá trị biểu thức logic đơn giản."],
    periods: 1,
    warmUp: "“Em được đi chơi nếu đã làm xong bài tập **và** trời không mưa.” Nếu em làm xong bài nhưng trời mưa thì sao?",
    sections: [
      {
        id: "phep-toan",
        title: "Giá trị logic và ba phép toán cơ bản",
        blocks: [
          { t: "p", text: "Dữ liệu logic chỉ có hai giá trị: **Đúng** (True, 1) và **Sai** (False, 0). Ba phép toán cơ bản:" },
          { t: "table", head: ["A", "B", "A AND B", "A OR B", "NOT A"], rows: [["0", "0", "0", "0", "1"], ["0", "1", "0", "1", "1"], ["1", "0", "0", "1", "0"], ["1", "1", "1", "1", "0"]], caption: "Bảng chân trị." },
          { t: "note", tone: "key", text: "AND chỉ đúng khi cả hai đều đúng. OR chỉ sai khi cả hai đều sai. NOT đảo giá trị." },
          { t: "figure", fig: "logic-gates", caption: "Trong mạch điện, các phép toán logic được làm bằng cổng logic." },
          { t: "sim", slug: "binary-logic", task: "Ở phần cổng logic, tìm các đầu vào làm đèn AND sáng; rồi làm đèn OR tắt." },
          { t: "check", id: "c10-5-a", q: "Với A = 1, B = 0, giá trị của NOT (A AND B) là?", options: ["0", "1"], answer: 1, why: "A AND B = 0, nên NOT 0 = 1.", objective: 1 },
          { t: "check", id: "c10-5-b", q: "Biểu thức nào chỉ cho kết quả Đúng khi cả hai vế đều Đúng?", options: ["A OR B", "A AND B", "NOT A"], answer: 1, why: "AND chỉ đúng khi cả hai vế đúng.", objective: 0 },
        ],
      },
    ],
    practice: [{ task: "Lập bảng chân trị cho biểu thức (A OR B) AND NOT A.", answer: "Chỉ đúng khi A = 0 và B = 1." }],
    apply: "Viết điều kiện để được vào thư viện: có thẻ học sinh và (đi một mình hoặc đi cùng nhóm không quá 4 người).",
    remember: ["Giá trị logic: Đúng/Sai (1/0).", "AND: cả hai đúng; OR: ít nhất một đúng; NOT: đảo ngược."],
  },
  {
    ref: "10-9",
    objectives: ["Nhận diện được một số nguy cơ trên không gian mạng: lừa đảo, mã độc, lộ thông tin cá nhân.", "Biết cách tạo mật khẩu mạnh và bảo vệ tài khoản."],
    periods: 1,
    warmUp: "Em nhận tin nhắn: “Bạn trúng iPhone, bấm link để nhận quà trong 10 phút”. Em sẽ làm gì?",
    sections: [
      {
        id: "nguy-co",
        title: "Các nguy cơ thường gặp",
        blocks: [
          { t: "list", items: ["**Lừa đảo (phishing)**: giả danh ngân hàng, nhà mạng, bạn bè để lấy mật khẩu, mã OTP.", "**Mã độc**: phần mềm, tệp đính kèm lạ có thể đánh cắp dữ liệu hoặc khóa máy đòi tiền.", "**Lộ thông tin cá nhân**: địa chỉ, số điện thoại, ảnh vé máy bay đăng công khai bị kẻ xấu lợi dụng."] },
          { t: "note", tone: "warn", text: "Dấu hiệu lừa đảo: hối thúc gấp, phần thưởng quá hấp dẫn, đường link lạ, xin mã OTP hoặc mật khẩu." },
          { t: "sim", slug: "digital-safety", task: "Xử lí hộp thư và tin nhắn: đánh dấu đâu là lừa đảo, giải thích dấu hiệu." },
          { t: "check", id: "c10-9-a", q: "Tin nhắn nào đáng ngờ nhất?", options: ["Cô chủ nhiệm nhắc lịch họp phụ huynh trong nhóm lớp", "“Tài khoản ngân hàng của bạn bị khóa, đăng nhập tại vcb-hotro.xyz ngay”", "Thông báo cập nhật trong cửa hàng ứng dụng chính thức"], answer: 1, why: "Hối thúc, tên miền lạ giả ngân hàng, đòi đăng nhập: đủ dấu hiệu lừa đảo.", objective: 0 },
        ],
      },
      {
        id: "mat-khau",
        title: "Bảo vệ tài khoản",
        blocks: [
          { t: "list", items: ["Mật khẩu dài từ 12 kí tự, trộn chữ hoa, chữ thường, số, kí hiệu; không dùng tên, ngày sinh.", "Mỗi tài khoản quan trọng một mật khẩu riêng.", "Bật xác thực hai bước; không bao giờ đọc mã OTP cho người khác.", "Đăng xuất khi dùng máy tính chung."] },
          { t: "check", id: "c10-9-b", q: "Mật khẩu nào mạnh nhất?", options: ["nguyenvan2009", "12345678", "Ca-phe!Sang7gio_sang"], answer: 2, why: "Dài, có chữ hoa, kí hiệu, số và không chứa thông tin cá nhân.", objective: 1 },
        ],
      },
    ],
    practice: [{ task: "Liệt kê ba thông tin không nên đăng công khai lên mạng xã hội và giải thích vì sao." }],
    apply: "Kiểm tra cài đặt quyền riêng tư của một tài khoản mạng xã hội của em (hoặc của gia đình) và bật xác thực hai bước.",
    remember: ["Không bấm link lạ, không cung cấp OTP, mật khẩu.", "Mật khẩu dài, khác nhau cho mỗi tài khoản, bật xác thực hai bước."],
  },
  {
    ref: "10-11",
    objectives: ["Ứng xử văn minh, tôn trọng người khác trên môi trường số.", "Nêu được nghĩa vụ tôn trọng bản quyền khi sử dụng sản phẩm số."],
    periods: 1,
    warmUp: "Bạn em chế ảnh một bạn khác rồi gửi vào nhóm lớp. Mọi người đang thả “haha”. Em làm gì?",
    sections: [
      {
        id: "ung-xu",
        title: "Ứng xử trên môi trường số",
        blocks: [
          { t: "p", text: "Những gì đăng lên mạng có thể lan rất nhanh và tồn tại rất lâu. Lời nói đùa với mình có thể là tổn thương với người khác." },
          { t: "list", items: ["Không chia sẻ ảnh, thông tin của người khác khi chưa được đồng ý.", "Không hùa theo bắt nạt; hỗ trợ người bị hại, báo người lớn.", "Kiểm tra nguồn trước khi chia sẻ tin tức."] },
          { t: "sim", slug: "digital-citizen", task: "Đi qua câu chuyện “Nhóm chat lớp”: chọn cách ứng xử và xem diễn biến." },
          { t: "check", id: "c10-11-b", q: "Bạn bị chế ảnh trong nhóm lớp. Việc nên làm đầu tiên là?", options: ["Thả “haha” cho vui", "Không chia sẻ tiếp, nhắn hỏi thăm bạn và đề nghị gỡ ảnh, báo thầy cô nếu cần", "Rời nhóm"], answer: 1, why: "Không hùa theo, hỗ trợ người bị hại và báo người lớn.", objective: 0 },
        ],
      },
      {
        id: "ban-quyen",
        title: "Tôn trọng bản quyền",
        blocks: [
          { t: "p", text: "Bài hát, hình ảnh, phần mềm, bài viết đều có tác giả. Dùng lại cần xin phép hoặc theo giấy phép cho phép (ví dụ giấy phép Creative Commons), và ghi rõ nguồn." },
          { t: "check", id: "c10-11-a", q: "Em làm video bài tập và muốn dùng một bản nhạc. Cách nào đúng?", options: ["Tải nhạc trên mạng về dùng, không cần ghi gì", "Dùng nhạc có giấy phép cho phép sử dụng và ghi nguồn", "Đổi tên bài hát là được"], answer: 1, why: "Phải dùng theo giấy phép và ghi nguồn tác giả.", objective: 1 },
        ],
      },
    ],
    practice: [{ task: "Tìm một hình ảnh có giấy phép Creative Commons và ghi nguồn đúng cách cho hình đó." }],
    apply: "Cùng nhóm soạn 5 quy tắc ứng xử cho nhóm chat của lớp.",
    remember: ["Tôn trọng người khác, không chia sẻ thông tin của họ khi chưa được phép.", "Dùng sản phẩm số của người khác phải đúng giấy phép và ghi nguồn."],
  },
  {
    ref: "10-16",
    objectives: ["Nêu được vai trò của ngôn ngữ lập trình bậc cao.", "Viết và chạy được chương trình Python đầu tiên."],
    periods: 1,
    warmUp: "Máy tính chỉ hiểu 0 và 1. Vậy làm sao ta “nói chuyện” được với máy tính bằng những câu gần với tiếng Anh?",
    sections: [
      {
        id: "ngon-ngu",
        title: "Ngôn ngữ lập trình bậc cao",
        blocks: [
          { t: "p", text: "Ngôn ngữ bậc cao (Python, C++, Java…) cho phép viết chương trình gần với ngôn ngữ tự nhiên. Chương trình dịch sẽ chuyển nó sang mã máy." },
          { t: "p", text: "Python được chọn vì cú pháp ngắn gọn, dễ đọc, có nhiều thư viện và được dùng rộng rãi trong khoa học dữ liệu, AI, web." },
          { t: "check", id: "c10-16-b", q: "Vì sao cần chương trình dịch khi viết Python?", options: ["Để chương trình chạy nhanh hơn trên mạng", "Máy tính chỉ hiểu mã máy, cần dịch câu lệnh bậc cao sang mã máy", "Để sửa lỗi chính tả"], answer: 1, why: "Ngôn ngữ bậc cao phải được dịch sang mã máy thì máy mới thực hiện được.", objective: 0 },
        ],
      },
      {
        id: "chuong-trinh-dau",
        title: "Chương trình Python đầu tiên",
        blocks: [
          { t: "code", code: "print('Xin chào, mình là Python!')\nprint(2 + 3 * 4)", output: "Xin chào, mình là Python!\n14" },
          { t: "note", tone: "tip", text: "Xâu kí tự đặt trong dấu nháy. Python tính nhân trước cộng sau, giống toán học." },
          { t: "check", id: "c10-16-a", q: "Câu lệnh print(10 // 3) in ra gì?", options: ["3.33", "3", "1"], answer: 1, why: "// là chia lấy phần nguyên.", objective: 1 },
        ],
      },
    ],
    practice: [{ task: "Viết chương trình in ra tên em và năm sinh trên hai dòng.", answer: "print('Lan')\nprint(2009)" }],
    apply: "Dùng Python làm máy tính bỏ túi: tính tiền điện tháng này của gia đình em.",
    remember: ["Ngôn ngữ bậc cao gần ngôn ngữ con người, được dịch sang mã máy.", "print() đưa kết quả ra màn hình."],
  },
  {
    ref: "10-17",
    objectives: ["Hiểu được biến và lệnh gán.", "Sử dụng được các phép toán số học và kiểu dữ liệu int, float, str."],
    periods: 2,
    warmUp: "Điểm kiểm tra của em thay đổi qua từng bài. Máy tính “nhớ” điểm mới nhất bằng cách nào?",
    sections: [
      {
        id: "bien",
        title: "Biến và lệnh gán",
        blocks: [
          { t: "figure", fig: "variable-box", caption: "Biến như một chiếc hộp có tên, lệnh gán đặt giá trị mới vào hộp." },
          { t: "code", code: "diem = 7\ndiem = diem + 1\nprint(diem)", output: "8" },
          { t: "note", tone: "key", text: "Dấu = trong Python là **gán**, không phải “bằng nhau”. diem = diem + 1 nghĩa là lấy giá trị cũ cộng 1 rồi cất lại vào diem." },
          { t: "check", id: "c10-17-a", q: "Sau ba lệnh a = 5; b = a; a = 2, giá trị của b là?", options: ["5", "2", "7"], answer: 0, why: "b nhận giá trị của a lúc gán (5); đổi a sau đó không ảnh hưởng b.", objective: 0 },
        ],
      },
      {
        id: "kieu",
        title: "Kiểu dữ liệu và phép toán",
        blocks: [
          { t: "table", head: ["Kiểu", "Ví dụ", "Ghi chú"], rows: [["int", "17, -3", "số nguyên"], ["float", "6.5, 3.0", "số thực, dùng dấu chấm"], ["str", "'Lan', '10A1'", "xâu kí tự"]] },
          { t: "table", head: ["Phép toán", "Ví dụ", "Kết quả"], rows: [["+ − *", "7 * 3", "21"], ["/", "7 / 2", "3.5"], ["//", "7 // 2", "3"], ["%", "7 % 2", "1"], ["**", "2 ** 10", "1024"]] },
          { t: "check", id: "c10-17-b", q: "Để kiểm tra n là số chẵn, ta dùng biểu thức nào?", options: ["n / 2 == 0", "n % 2 == 0", "n // 2 == 1"], answer: 1, why: "Số chẵn chia 2 dư 0.", objective: 1 },
        ],
      },
    ],
    practice: [{ task: "Viết chương trình đổi 135 phút ra giờ và phút.", answer: "t = 135\nprint(t // 60, 'giờ', t % 60, 'phút')" }],
    apply: "Tính chỉ số BMI = cân nặng / (chiều cao²) của một bạn với số liệu tự chọn.",
    remember: ["Biến lưu giá trị; = là lệnh gán.", "// chia lấy nguyên, % chia lấy dư, ** lũy thừa."],
  },
  {
    ref: "10-18",
    objectives: ["Sử dụng được lệnh input() và print().", "Chuyển đổi được dữ liệu nhập vào thành số bằng int(), float()."],
    periods: 1,
    warmUp: "Một chương trình tính tiền chỉ đúng với đúng một món hàng thì có ích không? Làm sao để người dùng tự nhập?",
    sections: [
      {
        id: "nhap-xuat",
        title: "Nhập và xuất dữ liệu",
        blocks: [
          { t: "code", code: "ten = input('Tên em là gì? ')\ntuoi = int(input('Em bao nhiêu tuổi? '))\nprint('Chào', ten, '- năm sau em', tuoi + 1, 'tuổi')", output: "Tên em là gì? Lan\nEm bao nhiêu tuổi? 15\nChào Lan - năm sau em 16 tuổi" },
          { t: "note", tone: "warn", text: "input() luôn trả về xâu. Muốn tính toán phải đổi bằng int() hoặc float(), nếu không '15' + 1 sẽ báo lỗi." },
          { t: "check", id: "c10-18-a", q: "x = input() với dữ liệu 5, rồi print(x * 2) in ra gì?", options: ["10", "55", "Lỗi"], answer: 1, why: "x là xâu '5'; nhân xâu với 2 là lặp xâu hai lần.", objective: 1 },
          { t: "check", id: "c10-18-b", q: "Lệnh nào in ra: Tổng là 7 (với a = 3, b = 4)?", options: ["print('Tổng là', a + b)", "print(Tổng là a + b)", "input('Tổng là', a + b)"], answer: 0, why: "Xâu đặt trong nháy, các giá trị cách nhau bởi dấu phẩy.", objective: 0 },
        ],
      },
    ],
    practice: [{ task: "Nhập chiều dài, chiều rộng hình chữ nhật (số thực), in chu vi và diện tích.", answer: "a = float(input())\nb = float(input())\nprint((a + b) * 2, a * b)" }],
    apply: "Viết chương trình hỏi giá một món đồ và số lượng, in tổng tiền phải trả.",
    remember: ["input() nhận xâu từ bàn phím; int(), float() đổi sang số.", "print() có thể in nhiều giá trị, cách nhau bởi dấu phẩy."],
  },
  {
    ref: "10-19",
    objectives: ["Viết được câu lệnh rẽ nhánh if, if-else với biểu thức điều kiện dùng phép so sánh.", "Kết hợp được nhiều điều kiện bằng and, or, not.", "Kiểm thử được chương trình ở các giá trị biên."],
    periods: 2,
    warmUp: "Cuối tuần không ai ở trường, vườn rau của lớp bị héo. Máy bơm tự động cần “biết” điều gì để quyết định có tưới hay không?",
    sections: [
      {
        id: "dieu-kien",
        title: "Biểu thức điều kiện",
        blocks: [
          { t: "p", text: "Biểu thức điều kiện cho kết quả **True** hoặc **False**. Các phép so sánh: `<`, `<=`, `>`, `>=`, `==` (bằng), `!=` (khác)." },
          { t: "code", code: "do_am = 35\nprint(do_am < 40)\nprint(do_am == 40)", output: "True\nFalse" },
          { t: "note", tone: "warn", text: "`=` là gán, `==` là so sánh bằng. Viết `if do_am = 40:` là lỗi cú pháp." },
        ],
      },
      {
        id: "if-else",
        title: "Câu lệnh if và if-else",
        blocks: [
          { t: "figure", fig: "if-flow", caption: "Điều kiện đúng chạy nhánh if, sai chạy nhánh else." },
          { t: "code", code: "do_am = int(input())\nif do_am < 40:\n    print('Bật bơm')\nelse:\n    print('Tắt bơm')", output: "35\nBật bơm" },
          { t: "note", tone: "key", text: "Sau điều kiện có dấu hai chấm `:`; các lệnh trong nhánh phải thụt lề như nhau (thường 4 dấu cách)." },
          { t: "sim", slug: "smart-garden", task: "Viết điều kiện cho máy bơm, bấm Kiểm thử. Thử đổi < thành <= và xem trường hợp độ ẩm đúng bằng 40%." },
          { t: "check", id: "c10-19-a", q: "Dòng nào là câu lệnh if đúng cú pháp Python?", options: ["if (x = 5)", "if x == 5:", "if x == 5 then"], answer: 1, why: "Dùng == để so sánh và kết thúc bằng dấu hai chấm.", objective: 0 },
        ],
      },
      {
        id: "ket-hop",
        title: "Kết hợp nhiều điều kiện",
        blocks: [
          { t: "p", text: "Máy bơm chỉ nên chạy khi **đất khô và bình còn nước**: dùng `and`. `or` đúng khi ít nhất một vế đúng; `not` đảo điều kiện." },
          { t: "code", code: "if do_am < 40 and con_nuoc:\n    print('Bật bơm')", caption: "Thiếu điều kiện còn nước, bơm có thể chạy khô và hỏng." },
          { t: "sim", slug: "smart-coding-city", task: "Lập trình đèn giao thông: chỉ cho xe đi khi đèn xanh và không có người đi bộ." },
          { t: "check", id: "c10-19-b", q: "Muốn cảnh báo khi nhiệt độ t dưới 10 hoặc trên 35, điều kiện nào đúng?", options: ["t < 10 and t > 35", "t < 10 or t > 35", "not t < 10"], answer: 1, why: "Không có t nào vừa dưới 10 vừa trên 35, nên phải dùng or.", objective: 1 },
        ],
      },
      {
        id: "kiem-thu",
        title: "Kiểm thử ở giá trị biên",
        blocks: [
          { t: "p", text: "Lỗi hay nằm ở ranh giới. Với ngưỡng 40%, hãy thử ba giá trị **39, 40, 41** để biết chương trình xử lí đúng chỗ “bằng” chưa." },
          { t: "table", head: ["Độ ẩm", "Mong đợi", "if do_am < 40", "if do_am <= 40"], rows: [["39", "Bật", "Bật", "Bật"], ["40", "Tắt", "Tắt", "Bật ✗"], ["41", "Tắt", "Tắt", "Tắt"]] },
          { t: "check", id: "c10-19-c", q: "Quy định “từ 40% trở xuống thì tưới”. Điều kiện đúng là?", options: ["do_am < 40", "do_am <= 40", "do_am > 40"], answer: 1, why: "“Từ 40% trở xuống” gồm cả 40.", objective: 2 },
        ],
      },
    ],
    practice: [
      { task: "Nhập điểm trung bình, in “Đạt” nếu từ 5 trở lên, ngược lại in “Chưa đạt”.", answer: "d = float(input())\nif d >= 5:\n    print('Đạt')\nelse:\n    print('Chưa đạt')" },
      { task: "Nhập một năm, in “Nhuận” nếu chia hết cho 400, hoặc chia hết cho 4 mà không chia hết cho 100.", hint: "Kết hợp or và and; thử 1900, 2000, 2024." },
    ],
    apply: "Viết chương trình tính tiền vé xe buýt theo tuổi: dưới 6 và từ 60 trở lên miễn phí, 6–17 tuổi 3.000đ, còn lại 7.000đ. Kiểm thử ở 5, 6, 17, 18, 59, 60.",
    remember: ["if điều kiện: … else: …; nhớ dấu hai chấm và thụt lề.", "and: cả hai đúng; or: ít nhất một đúng; not: đảo.", "Luôn thử giá trị ngay tại ngưỡng và hai bên ngưỡng."],
  },
  {
    ref: "10-20",
    objectives: ["Sử dụng được câu lệnh lặp for với range().", "Giải được bài toán tính tổng, đếm bằng vòng lặp."],
    periods: 2,
    warmUp: "In ra lời chào 100 lần, em có muốn gõ 100 lệnh print không?",
    sections: [
      {
        id: "for-range",
        title: "Lệnh for và range()",
        blocks: [
          { t: "figure", fig: "loop-flow", caption: "Vòng lặp lặp lại khối lệnh với từng giá trị của biến chạy." },
          { t: "table", head: ["range", "Các giá trị"], rows: [["range(5)", "0, 1, 2, 3, 4"], ["range(1, 6)", "1, 2, 3, 4, 5"], ["range(0, 10, 3)", "0, 3, 6, 9"]] },
          { t: "code", code: "for i in range(1, 4):\n    print('Lần', i)", output: "Lần 1\nLần 2\nLần 3" },
          { t: "check", id: "c10-20-a", q: "range(2, 8, 2) cho các giá trị nào?", options: ["2, 4, 6", "2, 4, 6, 8", "2, 3, …, 8"], answer: 0, why: "Bắt đầu từ 2, bước 2, dừng trước 8.", objective: 0 },
        ],
      },
      {
        id: "tong-dem",
        title: "Tính tổng và đếm",
        blocks: [
          { t: "code", code: "n = 10\ntong = 0\nfor i in range(1, n + 1):\n    tong = tong + i\nprint(tong)", output: "55" },
          { t: "note", tone: "key", text: "Mẫu “cộng dồn”: khởi tạo biến tổng bằng 0 **trước** vòng lặp, cộng thêm ở **trong** vòng lặp, in **sau** vòng lặp." },
          { t: "algo", id: "linear", task: "Xem vòng lặp duyệt từng phần tử để tìm một số, đếm số phép so sánh." },
          { t: "check", id: "c10-20-b", q: "Đặt tong = 0 bên trong vòng lặp thì kết quả sẽ thế nào?", options: ["Vẫn đúng", "Chỉ còn giá trị của lần cuối", "Báo lỗi"], answer: 1, why: "Mỗi vòng tong bị đặt lại về 0.", objective: 1 },
        ],
      },
    ],
    practice: [{ task: "Đếm các số chia hết cho 3 trong khoảng 1 đến 100.", answer: "dem = 0\nfor i in range(1, 101):\n    if i % 3 == 0:\n        dem += 1\nprint(dem)  # 33" }],
    apply: "In bảng cửu chương của một số do người dùng nhập.",
    remember: ["for i in range(a, b, k): giá trị từ a, bước k, dừng trước b.", "Cộng dồn: khởi tạo trước, cộng trong, in sau vòng lặp."],
  },
  {
    ref: "10-21",
    objectives: ["Sử dụng được câu lệnh lặp while.", "Phân biệt được khi nào dùng for, khi nào dùng while; tránh vòng lặp vô hạn."],
    periods: 2,
    warmUp: "Em gửi tiết kiệm 10 triệu, lãi 6%/năm. Bao nhiêu năm thì có 15 triệu? Ta chưa biết trước số lần lặp.",
    sections: [
      {
        id: "while",
        title: "Lệnh while",
        blocks: [
          { t: "code", code: "tien = 10\nnam = 0\nwhile tien < 15:\n    tien = tien * 1.06\n    nam = nam + 1\nprint(nam)", output: "7" },
          { t: "note", tone: "key", text: "while lặp **khi điều kiện còn đúng**. Dùng khi chưa biết trước số lần lặp; for dùng khi biết trước." },
          { t: "note", tone: "warn", text: "Trong thân vòng lặp phải có lệnh làm điều kiện tiến dần tới sai, nếu không sẽ lặp vô hạn." },
          { t: "check", id: "c10-21-a", q: "Vòng lặp nào chạy mãi không dừng?", options: ["i = 0\nwhile i < 5: i += 1", "i = 0\nwhile i < 5: print(i)", "i = 10\nwhile i > 0: i -= 2"], answer: 1, why: "i không bao giờ thay đổi nên i < 5 luôn đúng.", objective: 1 },
          { t: "check", id: "c10-21-b", q: "i = 1; while i < 20: i = i * 2. Sau vòng lặp i bằng?", options: ["16", "32", "20"], answer: 1, why: "i lần lượt 1, 2, 4, 8, 16, 32; khi i = 32 điều kiện sai nên dừng.", objective: 0 },
        ],
      },
    ],
    practice: [{ task: "Nhập số nguyên dương n, in tổng các chữ số của n.", hint: "Lấy chữ số cuối bằng n % 10, bỏ chữ số cuối bằng n // 10, lặp khi n > 0." }],
    apply: "Viết trò chơi đoán số: máy chọn số 1–100, người chơi đoán đến khi đúng, máy gợi ý “lớn hơn/nhỏ hơn”.",
    remember: ["while lặp khi điều kiện còn đúng.", "Biết trước số lần: for; chưa biết: while.", "Luôn kiểm tra điều kiện có thể trở thành sai."],
  },
  {
    ref: "10-26",
    objectives: ["Viết được hàm tự định nghĩa với def và return.", "Gọi được hàm và hiểu lợi ích của việc chia chương trình thành hàm."],
    periods: 2,
    warmUp: "Em phải tính diện tích hình tròn ở 5 chỗ khác nhau trong chương trình. Viết lại công thức 5 lần có ổn không?",
    sections: [
      {
        id: "dinh-nghia",
        title: "Định nghĩa và gọi hàm",
        blocks: [
          { t: "figure", fig: "function-box", caption: "Hàm nhận tham số, xử lí, trả lại kết quả bằng return." },
          { t: "code", code: "def dien_tich_tron(r):\n    return 3.14 * r * r\n\nprint(dien_tich_tron(2))\nprint(dien_tich_tron(10))", output: "12.56\n314.0" },
          { t: "note", tone: "key", text: "Viết một lần, dùng nhiều lần; sửa công thức chỉ cần sửa ở một chỗ." },
          { t: "check", id: "c10-26-a", q: "Hàm không có lệnh return thì khi gọi sẽ trả về gì?", options: ["0", "None", "Báo lỗi"], answer: 1, why: "Python trả về None nếu hàm không có return.", objective: 0 },
          { t: "check", id: "c10-26-b", q: "Lợi ích chính khi đưa công thức tính diện tích vào một hàm là?", options: ["Chương trình chạy nhanh gấp đôi", "Viết một lần, gọi nhiều lần; sửa ở một chỗ", "Không cần biến nữa"], answer: 1, why: "Hàm giúp tái sử dụng và dễ sửa.", objective: 1 },
        ],
      },
    ],
    practice: [{ task: "Viết hàm la_so_chan(n) trả về True nếu n chẵn, False nếu lẻ.", answer: "def la_so_chan(n):\n    return n % 2 == 0" }],
    apply: "Viết hàm tinh_tien_ve(tuoi) theo quy định giá vé ở Bài 19 rồi dùng nó cho cả một đoàn khách.",
    remember: ["def ten(tham_so): … return kết quả.", "Hàm giúp chương trình ngắn, dễ đọc, dễ sửa."],
  },
  {
    ref: "10-29",
    objectives: ["Phân biệt được lỗi cú pháp, lỗi khi chạy và lỗi logic.", "Đọc được thông báo lỗi của Python để tìm chỗ sai."],
    periods: 1,
    warmUp: "Chương trình tính tiền thối chạy không báo lỗi nhưng in ra số âm. Như vậy có phải là chương trình đúng không?",
    sections: [
      {
        id: "ba-loai-loi",
        title: "Ba loại lỗi",
        blocks: [
          { t: "figure", fig: "bug-kinds", caption: "Lỗi cú pháp chặn chương trình từ đầu; lỗi khi chạy dừng giữa chừng; lỗi logic chạy hết nhưng sai kết quả." },
          { t: "table", head: ["Loại lỗi", "Khi nào phát hiện", "Ví dụ"], rows: [["Cú pháp", "Trước khi chạy", "Thiếu dấu : sau if"], ["Khi chạy", "Lúc đang chạy", "Chia cho 0; int('abc')"], ["Logic", "So với kết quả đúng", "Viết gia - tra thay vì tra - gia"]] },
          { t: "sim", slug: "debug-detective", task: "Nhiệm vụ 1: phân loại lỗi trong các đoạn code bán vé xe buýt." },
          { t: "check", id: "c10-29-a", q: "Chương trình tính trung bình in ra 0 dù nhập điểm 8 và 9. Đây là lỗi gì?", options: ["Cú pháp", "Khi chạy", "Logic"], answer: 2, why: "Chạy được đến hết nhưng kết quả sai: lỗi logic.", objective: 0 },
          { t: "check", id: "c10-29-b", q: "Thông báo “NameError: name 'tong' is not defined” ở dòng 5 gợi ý điều gì?", options: ["Dùng biến tong trước khi gán giá trị hoặc gõ sai tên", "Chia cho 0", "Thiếu dấu hai chấm"], answer: 0, why: "NameError báo tên chưa được định nghĩa ở thời điểm dùng.", objective: 1 },
        ],
      },
    ],
    practice: [{ task: "Đọc thông báo “ZeroDivisionError: division by zero” và cho biết cần kiểm tra điều gì trước phép chia." }],
    apply: "Sưu tầm ba thông báo lỗi Python em từng gặp, ghi lại nguyên nhân và cách sửa.",
    remember: ["Cú pháp: viết sai quy tắc; khi chạy: dừng giữa chừng; logic: chạy hết nhưng sai.", "Lỗi logic chỉ phát hiện được khi so với kết quả đúng."],
  },
  {
    ref: "10-30",
    objectives: ["Thiết kế được bộ dữ liệu kiểm thử gồm trường hợp thường và trường hợp biên.", "Gỡ lỗi chương trình bằng cách in giá trị trung gian hoặc chạy từng bước."],
    periods: 2,
    warmUp: "Chương trình giá vé chạy đúng với khách 25 tuổi. Đã đủ để nói chương trình đúng chưa?",
    sections: [
      {
        id: "bo-test",
        title: "Thiết kế bộ kiểm thử",
        blocks: [
          { t: "p", text: "Một bộ test tốt gồm: **trường hợp thường** (giữa mỗi khoảng), **trường hợp biên** (ngay tại ngưỡng và hai bên ngưỡng) và **trường hợp đặc biệt** (0, số âm, dữ liệu rỗng)." },
          { t: "table", head: ["Tuổi", "Lí do chọn", "Giá vé đúng"], rows: [["5", "ngay dưới 6", "0"], ["6", "ngưỡng 6", "3.000"], ["17", "ngưỡng 17", "3.000"], ["18", "ngay trên 17", "7.000"], ["60", "ngưỡng 60", "0"]] },
          { t: "sim", slug: "debug-detective", task: "Nhiệm vụ 2–3: thêm các ca kiểm thử để bắt lỗi, rồi sửa đúng dòng sai." },
          { t: "check", id: "c10-30-a", q: "Với quy định “từ 18 tuổi trở lên mua vé người lớn”, ca kiểm thử nào quan trọng nhất?", options: ["25", "18 và 17", "100"], answer: 1, why: "Lỗi hay xảy ra ngay tại ngưỡng: 18 và tuổi ngay dưới là 17.", objective: 0 },
        ],
      },
      {
        id: "go-loi",
        title: "Cách gỡ lỗi",
        blocks: [
          { t: "list", ordered: true, items: ["Tìm ca test cho kết quả sai.", "In giá trị biến ở các bước trung gian (hoặc chạy từng bước) để xem chỗ bắt đầu sai.", "Sửa, rồi chạy lại **toàn bộ** bộ test để chắc chắn không làm hỏng chỗ khác."] },
          { t: "check", id: "c10-30-b", q: "Tổng in ra sai. Cách nhanh nhất để tìm bước bắt đầu sai là?", options: ["Viết lại toàn bộ chương trình", "In giá trị tong sau mỗi vòng lặp (hoặc chạy từng bước)", "Đổi tên biến"], answer: 1, why: "Xem giá trị trung gian giúp khoanh vùng chỗ sai.", objective: 1 },
        ],
      },
    ],
    practice: [{ task: "Thiết kế bộ test cho chương trình xếp loại: dưới 5 Chưa đạt, 5 đến dưới 8 Đạt, từ 8 Tốt." }],
    apply: "Đổi bài với bạn bên cạnh, mỗi người viết bộ test để tìm lỗi trong chương trình của bạn.",
    remember: ["Test cả trường hợp thường, biên và đặc biệt.", "Sửa xong phải chạy lại toàn bộ bộ test."],
  },
];
