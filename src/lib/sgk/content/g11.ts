import type { BookLesson } from "../types";

/** Tin học 11 — các bài đã có nội dung số. */
export const G11: BookLesson[] = [
  {
    ref: "11-1",
    objectives: ["Nêu được chức năng cơ bản của hệ điều hành: quản lí tệp, bộ nhớ, tiến trình, thiết bị và giao tiếp với người dùng.", "Kể tên được một số hệ điều hành thông dụng cho máy tính và điện thoại."],
    periods: 2,
    warmUp: "Em mở cùng lúc trình duyệt, nhạc và game. Ai quyết định mỗi phần mềm được dùng bao nhiêu RAM, lúc nào được dùng CPU?",
    sections: [
      {
        id: "vai-tro",
        title: "Hệ điều hành làm gì",
        blocks: [
          { t: "figure", fig: "os-layers", caption: "Hệ điều hành đứng giữa phần mềm ứng dụng và phần cứng." },
          { t: "list", items: ["**Quản lí tệp**: tổ chức thư mục, đặt tên, sao chép, xóa.", "**Quản lí bộ nhớ**: cấp RAM cho từng phần mềm, thu hồi khi đóng.", "**Quản lí tiến trình**: chia thời gian CPU cho các chương trình đang chạy.", "**Quản lí thiết bị**: bàn phím, máy in, USB… thông qua trình điều khiển.", "**Giao diện**: cửa sổ, biểu tượng, cảm ứng để người dùng ra lệnh."] },
          { t: "sim", slug: "os-explorer", task: "Làm nhiệm vụ 1 (sắp xếp tệp) và nhiệm vụ 2 (mở ứng dụng khi RAM có hạn)." },
          { t: "check", id: "c11-1-a", q: "Khi RAM đầy mà em vẫn mở thêm ứng dụng, máy chậm hẳn đi. Vì sao?", options: ["CPU bị hỏng", "Hệ điều hành phải dùng ổ đĩa làm bộ nhớ ảo, chậm hơn RAM nhiều", "Ổ cứng bị đầy"], answer: 1, why: "Thiếu RAM, hệ điều hành chuyển bớt dữ liệu ra ổ đĩa (bộ nhớ ảo) nên truy xuất chậm.", objective: 0 },
        ],
      },
      {
        id: "pho-bien",
        title: "Một số hệ điều hành",
        blocks: [
          { t: "table", head: ["Thiết bị", "Hệ điều hành"], rows: [["Máy tính", "Windows, macOS, Linux (Ubuntu…)"], ["Điện thoại", "Android, iOS"], ["Thiết bị nhúng", "Hệ điều hành thời gian thực trong ô tô, máy giặt"]] },
          { t: "check", id: "c11-1-b", q: "Hệ điều hành nào là mã nguồn mở?", options: ["Windows", "iOS", "Linux"], answer: 2, why: "Linux có mã nguồn công khai, ai cũng có thể xem và sửa theo giấy phép.", objective: 1 },
        ],
      },
    ],
    practice: [{ task: "Mở trình quản lí tác vụ (Task Manager) trên máy, tìm phần mềm dùng nhiều RAM nhất và ghi lại." }],
    apply: "Tạo cây thư mục học tập cho năm học: mỗi môn một thư mục, trong đó chia Bài học / Bài tập / Kiểm tra.",
    remember: ["Hệ điều hành quản lí tệp, bộ nhớ, tiến trình, thiết bị và giao tiếp với người dùng.", "Thiếu RAM thì dùng bộ nhớ ảo trên ổ đĩa nên máy chậm."],
  },
  {
    ref: "11-4",
    objectives: ["Nhận biết được các bộ phận chính bên trong máy tính: CPU, RAM, bộ nhớ ngoài, bo mạch chủ, nguồn.", "Giải thích được vai trò của từng bộ phận trong quá trình máy tính xử lí dữ liệu."],
    periods: 2,
    warmUp: "Máy tính của phòng Tin bật lên kêu “bíp bíp” rồi không lên hình. Em đoán bộ phận nào có vấn đề?",
    sections: [
      {
        id: "bo-phan",
        title: "Các bộ phận chính",
        blocks: [
          { t: "figure", fig: "computer-parts", caption: "Bo mạch chủ nối CPU, RAM, ổ lưu trữ, nguồn và các thiết bị." },
          { t: "table", head: ["Bộ phận", "Vai trò", "Ví von"], rows: [["CPU", "Thực hiện lệnh, tính toán", "Bộ não"], ["RAM", "Giữ dữ liệu đang dùng, mất khi tắt điện", "Mặt bàn làm việc"], ["SSD/HDD", "Lưu dữ liệu lâu dài", "Tủ hồ sơ"], ["Bo mạch chủ", "Nối mọi bộ phận", "Hệ thống đường phố"], ["Bộ nguồn", "Cấp điện ổn định", "Trạm điện"]] },
          { t: "sim", slug: "inside-computer-3d", task: "Nhiệm vụ 1: lắp đúng các linh kiện vào bo mạch chủ 3D." },
          { t: "check", id: "c11-4-a", q: "Đang soạn văn bản thì mất điện, phần chưa lưu bị mất. Vì sao?", options: ["Dữ liệu nằm trong RAM, RAM mất dữ liệu khi tắt điện", "Ổ cứng bị lỗi", "CPU xóa dữ liệu"], answer: 0, why: "Dữ liệu chưa lưu chỉ ở trong RAM; lưu mới ghi ra bộ nhớ ngoài.", objective: 1 },
          { t: "check", id: "c11-4-c", q: "Bộ phận nào thực hiện các phép tính và lệnh của chương trình?", options: ["RAM", "CPU", "Bộ nguồn"], answer: 1, why: "CPU là bộ xử lí trung tâm.", objective: 0 },
        ],
      },
      {
        id: "du-lieu-di",
        title: "Dữ liệu đi đâu khi mở một tệp",
        blocks: [
          { t: "list", ordered: true, items: ["Tệp nằm trên SSD.", "Hệ điều hành nạp tệp vào RAM.", "CPU đọc dữ liệu từ RAM, xử lí.", "Kết quả gửi ra màn hình; khi lưu thì ghi ngược về SSD."] },
          { t: "note", tone: "key", text: "CPU chỉ làm việc trực tiếp với dữ liệu trong RAM, không đọc thẳng từ ổ đĩa." },
          { t: "sim", slug: "inside-computer-3d", task: "Nhiệm vụ 2: chọn đúng đường đi của dữ liệu khi mở một tệp; nhiệm vụ 3: chẩn đoán máy hỏng." },
          { t: "check", id: "c11-4-b", q: "Thứ tự đúng khi mở ảnh để xem là?", options: ["SSD → CPU → RAM → màn hình", "SSD → RAM → CPU → màn hình", "RAM → SSD → màn hình"], answer: 1, why: "Dữ liệu được nạp từ SSD vào RAM, CPU xử lí rồi đưa ra màn hình.", objective: 1 },
        ],
      },
    ],
    practice: [{ task: "Đọc cấu hình một máy tính được rao bán (CPU, RAM, SSD) và giải thích từng thông số có ý nghĩa gì." }],
    apply: "Tư vấn cho bạn chọn máy tính học online với ngân sách có hạn: nên ưu tiên tăng RAM hay ổ cứng? Vì sao?",
    remember: ["CPU xử lí, RAM giữ dữ liệu đang dùng (mất khi tắt điện), SSD lưu lâu dài.", "CPU chỉ làm việc với dữ liệu trong RAM."],
  },
  {
    ref: "11-11",
    objectives: ["Nêu được khái niệm cơ sở dữ liệu và lợi ích so với lưu trữ rời rạc.", "Nêu được các yêu cầu cơ bản: không dư thừa, nhất quán, toàn vẹn, an toàn."],
    periods: 1,
    warmUp: "Thư viện trường ghi sổ mượn sách bằng giấy. Muốn biết “ai đang mượn quyển Dế Mèn” thì mất bao lâu?",
    sections: [
      {
        id: "khai-niem",
        title: "Cơ sở dữ liệu là gì",
        blocks: [
          { t: "p", text: "**Cơ sở dữ liệu (CSDL)** là tập hợp dữ liệu có liên quan, được tổ chức để nhiều người dùng tra cứu, cập nhật nhanh và chính xác." },
          { t: "list", items: ["**Không dư thừa**: mỗi thông tin chỉ lưu một nơi.", "**Nhất quán**: sửa một chỗ, mọi nơi thấy cùng giá trị.", "**Toàn vẹn**: dữ liệu tuân theo quy định (ví dụ không mượn quá 3 quyển).", "**An toàn**: phân quyền ai được xem, ai được sửa."] },
          { t: "sim", slug: "database-city", task: "Nhiệm vụ 1: tìm chỗ dữ liệu bị lặp và mâu thuẫn trong sổ mượn sách cũ." },
          { t: "check", id: "c11-11-a", q: "Tên một học sinh được ghi lại ở 5 phiếu mượn, sửa tên ở 1 phiếu thì 4 phiếu kia sai. Đây là vi phạm yêu cầu nào?", options: ["An toàn", "Nhất quán (do dư thừa)", "Toàn vẹn"], answer: 1, why: "Lưu lặp nhiều nơi dẫn đến không nhất quán khi sửa.", objective: 1 },
          { t: "check", id: "c11-11-b", q: "Lợi ích lớn nhất của CSDL so với sổ ghi chép rời rạc là?", options: ["Đẹp hơn", "Tra cứu, cập nhật nhanh và chính xác cho nhiều người dùng", "Không cần máy tính"], answer: 1, why: "Dữ liệu tổ chức tốt cho phép nhiều người khai thác nhanh, đúng.", objective: 0 },
        ],
      },
    ],
    practice: [{ task: "Kể ba hệ thống quanh em có dùng CSDL và cho biết mỗi hệ thống lưu những thông tin gì." }],
    apply: "Đề xuất những thông tin cần lưu để quản lí câu lạc bộ của trường.",
    remember: ["CSDL là dữ liệu có tổ chức, phục vụ tra cứu và cập nhật.", "Yêu cầu: không dư thừa, nhất quán, toàn vẹn, an toàn."],
  },
  {
    ref: "11-13",
    objectives: ["Mô tả được bảng, bản ghi, trường trong CSDL quan hệ.", "Giải thích được khóa chính và khóa ngoài, cách liên kết các bảng."],
    periods: 2,
    warmUp: "Hai bạn cùng tên “Nguyễn Văn An” ở hai lớp. Làm sao máy tính biết ai mượn sách?",
    sections: [
      {
        id: "bang",
        title: "Bảng, bản ghi, trường",
        blocks: [
          { t: "figure", fig: "db-table", caption: "Mỗi hàng là một bản ghi, mỗi cột là một trường; khóa chính xác định duy nhất mỗi hàng." },
          { t: "p", text: "**Khóa chính** là trường (hoặc nhóm trường) có giá trị khác nhau ở mọi bản ghi, ví dụ Mã học sinh. Tên không làm khóa được vì có thể trùng." },
          { t: "check", id: "c11-13-a", q: "Trường nào hợp làm khóa chính của bảng Sách?", options: ["Tên sách", "Tác giả", "Mã sách"], answer: 2, why: "Hai quyển có thể trùng tên hoặc tác giả; mã sách thì không trùng.", objective: 0 },
        ],
      },
      {
        id: "lien-ket",
        title: "Khóa ngoài và liên kết bảng",
        blocks: [
          { t: "p", text: "Bảng MuonSach lưu MaHS và MaSach thay vì chép lại tên. MaHS ở đây là **khóa ngoài** trỏ tới khóa chính của bảng HocSinh." },
          { t: "table", head: ["MaPhieu", "MaHS", "MaSach", "NgayMuon"], rows: [["P01", "HS07", "S02", "02/10"], ["P02", "HS12", "S02", "05/10"]], caption: "Muốn biết tên người mượn, tra MaHS trong bảng HocSinh." },
          { t: "sim", slug: "database-city", task: "Nhiệm vụ 2–3: chọn khóa chính cho từng bảng và nối bảng bằng khóa ngoài." },
          { t: "check", id: "c11-13-b", q: "Phiếu mượn ghi MaHS = HS99 nhưng bảng HocSinh không có HS99. Hệ quản trị nên làm gì?", options: ["Vẫn lưu", "Từ chối vì vi phạm ràng buộc khóa ngoài", "Tự tạo học sinh HS99"], answer: 1, why: "Khóa ngoài phải trỏ tới bản ghi có thật (ràng buộc toàn vẹn tham chiếu).", objective: 1 },
        ],
      },
    ],
    practice: [{ task: "Thiết kế hai bảng LopHoc và HocSinh, chỉ ra khóa chính và khóa ngoài." }],
    apply: "Vẽ sơ đồ các bảng cho hệ thống quản lí điểm của lớp em.",
    remember: ["Bảng gồm bản ghi (hàng) và trường (cột).", "Khóa chính không trùng; khóa ngoài trỏ tới khóa chính của bảng khác."],
  },
  {
    ref: "11-14",
    objectives: ["Viết được câu truy vấn SELECT với WHERE, ORDER BY.", "Kết nối được dữ liệu từ hai bảng bằng JOIN."],
    periods: 2,
    warmUp: "Thư viện mất một quyển sách. Em có danh sách phiếu mượn và danh sách học sinh. Làm sao lọc nhanh ra người đáng nghi?",
    sections: [
      {
        id: "select",
        title: "Truy vấn SELECT",
        blocks: [
          { t: "code", code: "SELECT HoTen, Lop\nFROM HocSinh\nWHERE Lop = '11A2'\nORDER BY HoTen;", caption: "Lấy họ tên các bạn lớp 11A2, sắp theo tên." },
          { t: "table", head: ["Mệnh đề", "Ý nghĩa"], rows: [["SELECT", "chọn cột"], ["FROM", "từ bảng nào"], ["WHERE", "lọc hàng theo điều kiện"], ["ORDER BY", "sắp xếp (ASC tăng, DESC giảm)"]] },
          { t: "check", id: "c11-14-a", q: "Muốn lấy các sách xuất bản sau năm 2015, thêm mệnh đề nào?", options: ["ORDER BY Nam > 2015", "WHERE Nam > 2015", "SELECT Nam > 2015"], answer: 1, why: "WHERE dùng để lọc hàng.", objective: 0 },
        ],
      },
      {
        id: "join",
        title: "Kết nối hai bảng",
        blocks: [
          { t: "code", code: "SELECT HocSinh.HoTen, MuonSach.NgayMuon\nFROM MuonSach\nJOIN HocSinh ON MuonSach.MaHS = HocSinh.MaHS\nWHERE MuonSach.MaSach = 'S02';", caption: "Ai đã mượn sách S02?" },
          { t: "sim", slug: "sql-detective", task: "Phá vụ án mất sách: chạy truy vấn thật trên CSDL thư viện để thu hẹp nghi phạm." },
          { t: "check", id: "c11-14-b", q: "Điều kiện ON trong JOIN thường so sánh gì?", options: ["Khóa ngoài với khóa chính tương ứng", "Hai cột tên bất kì", "Số hàng của hai bảng"], answer: 0, why: "JOIN ghép hàng của hai bảng có khóa khớp nhau.", objective: 1 },
        ],
      },
    ],
    practice: [{ task: "Viết truy vấn đếm số lượt mượn của mỗi học sinh.", hint: "Dùng GROUP BY MaHS và COUNT(*)." }],
    apply: "Viết 3 câu hỏi về dữ liệu thư viện mà cô thủ thư hay cần, và câu truy vấn cho từng câu.",
    remember: ["SELECT cột FROM bảng WHERE điều kiện ORDER BY cột.", "JOIN … ON khóa ngoài = khóa chính để ghép hai bảng."],
  },
];
