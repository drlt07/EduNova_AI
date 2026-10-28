/** Thư viện trò chơi mô phỏng (Game Simulation Lab). */
import type { Difficulty, Grade } from "@/lib/domain/types";
import type { PyValue } from "@/lib/py/values";

export interface World {
  id: string;
  name: string;
  grade: Grade;
  description: string;
  accent: "success" | "blue" | "violet";
}

export const WORLDS: World[] = [
  { id: "codecraft", name: "CodeCraft World", grade: 10, description: "Lập trình thế giới thông minh bằng Python: trang trại, đèn giao thông, robot, nhà kho.", accent: "success" },
  { id: "cybercore", name: "CyberCore World", grade: 11, description: "Khám phá hệ điều hành, linh kiện máy tính, dữ liệu và cơ sở dữ liệu.", accent: "blue" },
  { id: "digital-future", name: "Digital Future World", grade: 12, description: "Xây mạng máy tính, thực nghiệm AI, dựng website và giải quyết nhiệm vụ số.", accent: "violet" },
];

/** Một trường hợp chấm: giá trị cảm biến đưa vào chương trình và trạng thái bơm mong đợi. */
export interface FarmCase {
  name: string;
  humidity?: number;
  hasWater: boolean;
  beds?: number[];
  /** single: trạng thái bơm cuối cùng; multi: bật/tắt cho từng luống theo thứ tự */
  expect: boolean | boolean[];
  expectOutputIncludes?: string;
}

export interface FarmLevel {
  id: number;
  title: string;
  story: string;
  goal: string;
  rules: string[];
  starter: string;
  hint: string;
  multi?: boolean;
  objectiveIds: string[];
  cases: FarmCase[];
}

export const FARM_LEVELS: FarmLevel[] = [
  {
    id: 1,
    title: "Tưới khi đất khô",
    story: "Luống rau đầu tiên của trang trại cần được tưới tự động. Bình nước luôn đầy.",
    goal: "Bật máy bơm khi độ ẩm dưới 40%, ngược lại tắt máy bơm.",
    rules: ["Biến humidity là độ ẩm đất đo được (0–100).", "Gọi pump_on() để bật, pump_off() để tắt máy bơm."],
    starter: "# humidity: độ ẩm đất (%)\nif humidity > 40:\n    pump_on()\nelse:\n    pump_off()\n",
    hint: "Đất khô nghĩa là độ ẩm NHỎ. So sánh humidity với 40 theo chiều nào?",
    objectiveIds: ["O10-F-02"],
    cases: [
      { name: "Đất rất khô (15%)", humidity: 15, hasWater: true, expect: true },
      { name: "Đất ẩm (70%)", humidity: 70, hasWater: true, expect: false },
      { name: "Ngay dưới ngưỡng (39%)", humidity: 39, hasWater: true, expect: true },
      { name: "Đúng ngưỡng (40%)", humidity: 40, hasWater: true, expect: false },
    ],
  },
  {
    id: 2,
    title: "Kiểm tra bình nước",
    story: "Có hôm bình nước cạn, máy bơm chạy khô và bị hỏng. Hãy bảo vệ máy bơm.",
    goal: "Chỉ bật máy bơm khi đất khô (dưới 40%) VÀ bình còn nước (has_water).",
    rules: ["has_water là True khi bình còn nước, False khi hết.", "Máy bơm không được chạy khi hết nước."],
    starter: "# humidity: độ ẩm đất, has_water: bình còn nước?\nif humidity < 40:\n    pump_on()\nelse:\n    pump_off()\n",
    hint: "Cần cả hai điều kiện cùng đúng. Toán tử nào chỉ đúng khi cả hai vế đúng?",
    objectiveIds: ["O10-F-02", "O10-F-03"],
    cases: [
      { name: "Khô, còn nước", humidity: 25, hasWater: true, expect: true },
      { name: "Khô, hết nước", humidity: 25, hasWater: false, expect: false },
      { name: "Ẩm, còn nước", humidity: 65, hasWater: true, expect: false },
      { name: "Đúng ngưỡng, còn nước", humidity: 40, hasWater: true, expect: false },
      { name: "Ẩm, hết nước", humidity: 80, hasWater: false, expect: false },
    ],
  },
  {
    id: 3,
    title: "Cảm biến bất thường",
    story: "Cảm biến đôi khi gửi giá trị lỗi: số âm hoặc lớn hơn 100. Trang trại cần phát hiện để kỹ sư sửa.",
    goal: 'Nếu humidity < 0 hoặc humidity > 100: tắt bơm và in "Lỗi cảm biến". Còn lại xử lý như cấp 2.',
    rules: ["Giá trị hợp lệ nằm trong khoảng 0 đến 100.", "Dùng if … elif … else để xử lý nhiều trường hợp."],
    starter: "if humidity < 40 and has_water:\n    pump_on()\nelse:\n    pump_off()\n",
    hint: "Hãy kiểm tra trường hợp lỗi TRƯỚC TIÊN bằng if, sau đó mới dùng elif cho điều kiện tưới.",
    objectiveIds: ["O10-F-03", "O10-F-04"],
    cases: [
      { name: "Cảm biến báo -5", humidity: -5, hasWater: true, expect: false, expectOutputIncludes: "Lỗi cảm biến" },
      { name: "Cảm biến báo 120", humidity: 120, hasWater: true, expect: false, expectOutputIncludes: "Lỗi cảm biến" },
      { name: "Khô, còn nước", humidity: 20, hasWater: true, expect: true },
      { name: "Khô, hết nước", humidity: 20, hasWater: false, expect: false },
      { name: "Độ ẩm 0%", humidity: 0, hasWater: true, expect: true },
      { name: "Độ ẩm 100%", humidity: 100, hasWater: true, expect: false },
    ],
  },
  {
    id: 4,
    title: "Nhiều luống cây",
    story: "Trang trại mở rộng thành nhiều luống. Danh sách beds chứa độ ẩm của từng luống.",
    goal: "Với mỗi luống (theo thứ tự), gọi pump_on() nếu luống đó khô (dưới 40%) và bình còn nước, ngược lại gọi pump_off().",
    rules: ["beds là danh sách, ví dụ [35, 60, 20].", "Mỗi luống cần đúng một lời gọi pump_on() hoặc pump_off().", "Dùng vòng lặp for để duyệt danh sách."],
    starter: "# beds: danh sách độ ẩm từng luống\nfor h in beds:\n    # quyết định cho luống có độ ẩm h\n    pass\n",
    hint: "Bên trong vòng for, dùng lại điều kiện của cấp 2 nhưng với biến h thay cho humidity.",
    multi: true,
    objectiveIds: ["O10-F-03", "O10-F-05"],
    cases: [
      { name: "3 luống, còn nước", beds: [35, 60, 20], hasWater: true, expect: [true, false, true] },
      { name: "3 luống, hết nước", beds: [10, 15, 80], hasWater: false, expect: [false, false, false] },
      { name: "Luống đúng ngưỡng", beds: [40, 39, 41, 0], hasWater: true, expect: [false, true, false, true] },
    ],
  },
];

export interface GameInfo {
  slug: string;
  title: string;
  worldId: string;
  grade: Grade;
  focus: string;
  minutes: number;
  difficulty: Difficulty;
  status: "available" | "planned";
  description: string;
  /** phòng thí nghiệm sẵn có dùng cho chế độ khám phá */
  labSlug?: string;
  icon: string;
}

export const GAMES: GameInfo[] = [
  { slug: "smart-farm", title: "Nông trại thông minh", worldId: "codecraft", grade: 10, focus: "Câu lệnh if, biểu thức logic, vòng lặp", minutes: 30, difficulty: "trung-binh", status: "available", description: "Lập trình Python điều khiển máy bơm tưới cây qua 4 cấp độ.", labSlug: "smart-garden", icon: "smart-garden" },
  { slug: "binary-code", title: "Mật mã nhị phân", worldId: "codecraft", grade: 10, focus: "Bit, byte, cổng logic", minutes: 15, difficulty: "co-ban", status: "available", description: "Bật tắt bit để giải mã số và thử các cổng logic.", labSlug: "binary-logic", icon: "binary-logic" },
  { slug: "traffic-city", title: "Smart Traffic City 3D", worldId: "codecraft", grade: 10, focus: "Câu lệnh if, biểu thức logic", minutes: 20, difficulty: "co-ban", status: "available", description: "Giao lộ 3D: điều khiển đèn tín hiệu, quan sát xe dừng trước vạch và đi qua giao lộ.", labSlug: "smart-coding-city", icon: "smart-coding-city" },
  { slug: "debug-detective", title: "Thám tử gỡ lỗi", worldId: "codecraft", grade: 10, focus: "Kiểm thử, giá trị biên, sửa lỗi", minutes: 20, difficulty: "trung-binh", status: "available", description: "Máy bán vé xe buýt thu sai tiền: tìm và sửa lỗi bằng test.", labSlug: "debug-detective", icon: "debug-detective" },
  { slug: "digital-safety", title: "An toàn số", worldId: "codecraft", grade: 10, focus: "Lừa đảo trực tuyến, mật khẩu, quyền riêng tư", minutes: 20, difficulty: "co-ban", status: "available", description: "Phân loại tin nhắn lừa đảo, đặt mật khẩu mạnh, kiểm tra ảnh trước khi đăng.", labSlug: "digital-safety", icon: "digital-safety" },
  { slug: "inside-computer", title: "Bên trong máy tính 3D", worldId: "cybercore", grade: 11, focus: "Linh kiện máy tính, đường đi dữ liệu", minutes: 20, difficulty: "co-ban", status: "available", description: "Lắp máy trong thùng 3D, bật nguồn, theo dấu dữ liệu và chẩn đoán sự cố.", labSlug: "inside-computer-3d", icon: "inside-computer-3d" },
  { slug: "os-explorer", title: "Khám phá hệ điều hành", worldId: "cybercore", grade: 11, focus: "Tệp, thư mục, RAM, tiến trình", minutes: 20, difficulty: "co-ban", status: "available", description: "Dọn máy bằng File Explorer, giải phóng RAM trong Task Manager để kịp giờ thi.", labSlug: "os-explorer", icon: "os-explorer" },
  { slug: "database-city", title: "Thành phố dữ liệu", worldId: "cybercore", grade: 11, focus: "Bảng, khóa chính, khóa ngoài", minutes: 25, difficulty: "trung-binh", status: "available", description: "Dựng CSDL cho thư viện trường từ sổ mượn lộn xộn.", labSlug: "database-city", icon: "database-city" },
  { slug: "sql-detective", title: "Thám tử SQL", worldId: "cybercore", grade: 11, focus: "Truy vấn SELECT, WHERE, JOIN", minutes: 25, difficulty: "trung-binh", status: "available", description: "Cuốn sách quý quá hạn: dùng truy vấn lần ra người đang giữ.", labSlug: "sql-detective", icon: "sql-detective" },
  { slug: "web-builder", title: "Xưởng thiết kế web", worldId: "digital-future", grade: 12, focus: "HTML, CSS", minutes: 30, difficulty: "trung-binh", status: "available", description: "Dựng trang web và xem kết quả ngay lập tức.", labSlug: "web-creator", icon: "web-creator" },
  { slug: "ai-discovery", title: "Khám phá AI", worldId: "digital-future", grade: 12, focus: "Học máy, dữ liệu, thiên lệch", minutes: 20, difficulty: "trung-binh", status: "available", description: "Dạy camera phân loại xoài chín và sửa lỗi thiên lệch dữ liệu.", labSlug: "ai-discovery", icon: "ai-discovery" },
  { slug: "digital-citizen", title: "Công dân số", worldId: "digital-future", grade: 12, focus: "Ứng xử trên mạng, dùng AI có trách nhiệm", minutes: 15, difficulty: "co-ban", status: "available", description: "Ba câu chuyện chat rẽ nhánh: mỗi lựa chọn có hệ quả.", labSlug: "digital-citizen", icon: "digital-citizen" },
  { slug: "network-journey", title: "Hành trình gói tin", worldId: "digital-future", grade: 12, focus: "Switch, router, địa chỉ IP, ping", minutes: 20, difficulty: "trung-binh", status: "available", description: "Đấu nối mạng phòng Tin, dẫn gói tin qua switch và router, sửa lỗi mạng bằng ping.", labSlug: "network-journey", icon: "network-journey" },
];

/** Tình huống mô phỏng kiểu PhET theo từng bài Kết nối tri thức. */
const PHET_GAMES: GameInfo[] = [
  { slug: "binary-control", title: "Phòng điều khiển mã nhị phân", worldId: "codecraft", grade: 10, focus: "Bit, giá trị vị trí, tràn số", minutes: 15, difficulty: "co-ban", status: "available", description: "Bật tắt công tắc bit, xem đèn, số thập phân và thanh số thay đổi cùng lúc.", labSlug: "binary-control", icon: "binary-control" },
  { slug: "smart-home", title: "Ngôi nhà thông minh", worldId: "codecraft", grade: 10, focus: "AND, OR, NOT, bảng chân trị", minutes: 20, difficulty: "trung-binh", status: "available", description: "Lắp biểu thức lôgic điều khiển đèn hiên, còi báo trộm, vòi tưới.", labSlug: "smart-home", icon: "smart-home" },
  { slug: "digital-camera", title: "Phòng thí nghiệm máy ảnh số", worldId: "codecraft", grade: 10, focus: "Điểm ảnh, bit màu, lấy mẫu âm thanh", minutes: 25, difficulty: "trung-binh", status: "available", description: "Đổi độ phân giải, số bit màu, số mẫu âm thanh và xem dung lượng thay đổi.", labSlug: "digital-camera", icon: "digital-camera" },
  { slug: "robot-factory", title: "Nhà máy robot tự động", worldId: "codecraft", grade: 10, focus: "Vòng lặp for, range", minutes: 20, difficulty: "co-ban", status: "available", description: "Chỉnh range để cánh tay robot đặt hộp đúng vị trí trên băng chuyền.", labSlug: "robot-factory", icon: "robot-factory" },
  { slug: "maze-robot", title: "Robot tìm đường thoát", worldId: "codecraft", grade: 10, focus: "Vòng lặp while, điều kiện dừng", minutes: 25, difficulty: "trung-binh", status: "available", description: "Lắp vòng lặp while có if để robot thoát mê cung, tránh lặp vô hạn.", labSlug: "maze-robot", icon: "maze-robot" },
  { slug: "software-ecosystem", title: "Khám phá thế giới phần mềm", worldId: "cybercore", grade: 11, focus: "Nguồn mở, giấy phép, phần mềm trên Internet", minutes: 15, difficulty: "co-ban", status: "available", description: "Bản đồ phần mềm nguồn mở, nguồn đóng, chạy trên Internet; chọn phần mềm cho từng tình huống.", labSlug: "software-ecosystem", icon: "software-ecosystem" },
  { slug: "device-connection", title: "Trạm kết nối thiết bị số", worldId: "cybercore", grade: 11, focus: "Cổng USB, HDMI, LAN, âm thanh, không dây", minutes: 15, difficulty: "co-ban", status: "available", description: "Cắm thiết bị vào đúng cổng ở mặt sau máy tính hoặc ghép nối không dây.", labSlug: "device-connection", icon: "device-connection" },
  { slug: "cloud-sharing", title: "Đám mây dữ liệu", worldId: "cybercore", grade: 11, focus: "Đồng bộ, phân quyền chia sẻ", minutes: 20, difficulty: "co-ban", status: "available", description: "Đồng bộ tệp giữa các thiết bị, đặt quyền xem, bình luận, chỉnh sửa an toàn.", labSlug: "cloud-sharing", icon: "cloud-sharing" },
  { slug: "network-builder", title: "Xây dựng mạng trường học", worldId: "digital-future", grade: 12, focus: "Switch, router, access point, modem", minutes: 20, difficulty: "trung-binh", status: "available", description: "Đặt thiết bị mạng vào sơ đồ trường và kiểm tra máy nào ra được Internet.", labSlug: "network-builder", icon: "network-builder" },
  { slug: "css-box", title: "Phòng thiết kế những chiếc hộp", worldId: "digital-future", grade: 12, focus: "Mô hình hộp CSS", minutes: 20, difficulty: "trung-binh", status: "available", description: "Kéo padding, border, margin, đổi box-sizing và xem hộp thay đổi.", labSlug: "css-box", icon: "css-box" },
  { slug: "web-navigation", title: "Mê cung website", worldId: "digital-future", grade: 12, focus: "Liên kết, đường dẫn tương đối", minutes: 20, difficulty: "trung-binh", status: "available", description: "Sửa href trên thanh điều hướng để mọi trang đều tới được, không còn lỗi 404.", labSlug: "web-navigation", icon: "web-navigation" },
  { slug: "info-processor", title: "Máy xử lí thông tin", worldId: "codecraft", grade: 10, focus: "Dữ liệu, thông tin, 4 bước xử lí", minutes: 15, difficulty: "co-ban", status: "available", description: "Cảm biến đo, dữ liệu được lưu, máy xử lí theo quy tắc thành thông tin để quyết định.", labSlug: "info-processor", icon: "info-processor" },
  { slug: "text-encoding", title: "Phòng mã hóa văn bản", worldId: "codecraft", grade: 10, focus: "ASCII, Unicode, UTF-8", minutes: 15, difficulty: "co-ban", status: "available", description: "Gõ chữ, xem từng kí tự thành mã số, byte và bit; chữ Việt có dấu cần nhiều byte hơn.", labSlug: "text-encoding", icon: "text-encoding" },
  { slug: "variable-boxes", title: "Hộp biến", worldId: "codecraft", grade: 10, focus: "Biến, lệnh gán, kiểu dữ liệu", minutes: 15, difficulty: "co-ban", status: "available", description: "Chạy từng lệnh gán, xem hộp biến đổi giá trị; đổi chỗ hai biến bằng biến tạm.", labSlug: "variable-boxes", icon: "variable-boxes" },
  { slug: "list-lab", title: "Toa tàu danh sách", worldId: "codecraft", grade: 10, focus: "Danh sách, chỉ số, append, insert", minutes: 20, difficulty: "co-ban", status: "available", description: "Thêm, chèn, xóa toa tàu để hiểu các lệnh với danh sách và chỉ số âm.", labSlug: "list-lab", icon: "list-lab" },
  { slug: "string-lab", title: "Kính lúp xâu kí tự", worldId: "codecraft", grade: 10, focus: "Cắt xâu, find, replace, split", minutes: 20, difficulty: "trung-binh", status: "available", description: "Kéo start, stop, step để cắt xâu; dùng các lệnh xâu và xem kết quả ngay.", labSlug: "string-lab", icon: "string-lab" },
  { slug: "function-machine", title: "Máy hàm", worldId: "codecraft", grade: 10, focus: "Tham số, return, biến cục bộ", minutes: 20, difficulty: "trung-binh", status: "available", description: "Đưa đối số vào cỗ máy hàm, xem tham số, biến cục bộ và giá trị trả về.", labSlug: "function-machine", icon: "function-machine" },
];
GAMES.push(...PHET_GAMES);

export const getGame = (slug: string) => GAMES.find((g) => g.slug === slug);

export function farmGlobals(c: FarmCase): Record<string, PyValue> {
  const g: Record<string, PyValue> = { has_water: c.hasWater };
  if (c.humidity !== undefined) g.humidity = { k: "int", v: c.humidity };
  if (c.beds) g.beds = { k: "list", items: c.beds.map((v) => ({ k: "int", v }) as PyValue) };
  return g;
}
