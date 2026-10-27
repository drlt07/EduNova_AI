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
  { slug: "inside-computer", title: "Bên trong máy tính 3D", worldId: "cybercore", grade: 11, focus: "Linh kiện máy tính, đường đi dữ liệu", minutes: 20, difficulty: "co-ban", status: "available", description: "Lắp máy trong thùng 3D, bật nguồn, theo dấu dữ liệu và chẩn đoán sự cố.", labSlug: "inside-computer-3d", icon: "inside-computer-3d" },
  { slug: "os-explorer", title: "Khám phá hệ điều hành", worldId: "cybercore", grade: 11, focus: "Tệp, thư mục, RAM, tiến trình", minutes: 20, difficulty: "co-ban", status: "available", description: "Dọn máy bằng File Explorer, giải phóng RAM trong Task Manager để kịp giờ thi.", labSlug: "os-explorer", icon: "os-explorer" },
  { slug: "database-city", title: "Thành phố dữ liệu", worldId: "cybercore", grade: 11, focus: "Bảng, khóa chính, khóa ngoài", minutes: 25, difficulty: "trung-binh", status: "planned", description: "Thiết kế cơ sở dữ liệu thư viện.", icon: "database-city" },
  { slug: "web-builder", title: "Xưởng thiết kế web", worldId: "digital-future", grade: 12, focus: "HTML, CSS", minutes: 30, difficulty: "trung-binh", status: "available", description: "Dựng trang web và xem kết quả ngay lập tức.", labSlug: "web-creator", icon: "web-creator" },
  { slug: "network-journey", title: "Hành trình gói tin", worldId: "digital-future", grade: 12, focus: "Switch, router, địa chỉ IP, ping", minutes: 20, difficulty: "trung-binh", status: "available", description: "Đấu nối mạng phòng Tin, dẫn gói tin qua switch và router, sửa lỗi mạng bằng ping.", labSlug: "network-journey", icon: "network-journey" },
];

export const getGame = (slug: string) => GAMES.find((g) => g.slug === slug);

export function farmGlobals(c: FarmCase): Record<string, PyValue> {
  const g: Record<string, PyValue> = { has_water: c.hasWater };
  if (c.humidity !== undefined) g.humidity = { k: "int", v: c.humidity };
  if (c.beds) g.beds = { k: "list", items: c.beds.map((v) => ({ k: "int", v }) as PyValue) };
  return g;
}
